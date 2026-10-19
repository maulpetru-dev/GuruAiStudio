import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  initFirebaseAdmin,
  authenticateToken,
  verifyProjectOwnership,
  createUserQuotaLimiter,
} from './serverAuth.ts';

dotenv.config();

// Initialize Firebase Admin SDK (if credentials exist in environment)
initFirebaseAdmin();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enforce request body size limit to avoid memory exhaustion attacks
app.use(express.json({ limit: '2mb' }));

// ============================================================================
// RATE LIMITING & QUOTAS
// ============================================================================

// 1. IP-level Rate Limiter (sliding-window without extra dependencies)
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

function createRateLimiter(config: RateLimitConfig) {
  const hits = new Map<string, { count: number; resetTime: number }>();

  // Cleanup expired entries periodically to prevent memory leaks
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits.entries()) {
      if (entry.resetTime <= now) {
        hits.delete(ip);
      }
    }
  }, 2 * 60 * 1000);
  interval.unref();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const clientIp = Array.isArray(rawIp)
      ? rawIp[0]
      : typeof rawIp === 'string'
      ? rawIp.split(',')[0].trim()
      : 'unknown';

    const now = Date.now();
    const entry = hits.get(clientIp);

    if (!entry || entry.resetTime <= now) {
      hits.set(clientIp, { count: 1, resetTime: now + config.windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > config.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: config.message,
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };
}

// IP-based limiters
const packageGenerateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20, // Max 20 package generations per 10 minutes per IP
  message: 'Batas pembuatan paket modul ajar terlampaui. Mohon tunggu beberapa menit sebelum membuat paket baru.',
});

const operationalLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 60, // Max 60 operations per 5 minutes per IP
  message: 'Batas frekuensi permintaan AI terlampaui. Silakan tunggu sesaat sebelum mencoba lagi.',
});

// 2. Account-level Quota Limiters (protect against API cost exhaustion per user account)
const userPackageGenerateLimiter = createUserQuotaLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 15, // Max 15 complete learning packages per user per hour
  message: 'Batas kuota akun Anda untuk pembuatan modul ajar telah tercapai (maksimal 15 paket per jam). Silakan coba lagi nanti.',
});

const userOperationalLimiter = createUserQuotaLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // Max 50 revisions/checks/chats per user per 15 minutes
  message: 'Batas frekuensi penggunaan AI pada akun Anda tercapai. Silakan tunggu beberapa menit.',
});

// ============================================================================
// GEMINI API CLIENT & SECRETS SANITIZATION
// ============================================================================
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('CONFIG_MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Sanitize logs so API keys or secrets are NEVER printed to stdout/stderr
function redactSecrets(text: string): string {
  if (!text) return '';
  let sanitized = String(text);
  const serverKey = process.env.GEMINI_API_KEY;
  if (serverKey && serverKey.length >= 6) {
    sanitized = sanitized.split(serverKey).join('[REDACTED_KEY]');
  }
  // Also mask standard Google API key patterns (AIzaSy...)
  sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
  return sanitized;
}

// Safe error handler that prevents exposing internal stack traces or secrets to users
function handleAIError(error: any, res: express.Response, context: string) {
  const rawMsg = String(error?.message || error || '');
  console.error(`[AI Error in ${context}]`, redactSecrets(rawMsg));

  if (rawMsg.includes('CONFIG_MISSING_API_KEY')) {
    return res.status(500).json({
      error: 'Konfigurasi Gemini API key server belum tersedia. Mohon hubungi administrator sistem.',
    });
  }

  const lower = rawMsg.toLowerCase();
  if (lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('429')) {
    return res.status(429).json({
      error: 'Layanan AI sedang menerima beban tinggi atau kuota sementara tercapai. Mohon tunggu 1-2 menit lalu coba kembali.',
    });
  }

  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('policy')) {
    return res.status(400).json({
      error: 'Permintaan tidak dapat diproses oleh AI karena terdeteksi kebijakan keamanan konten.',
    });
  }

  if (lower.includes('invalid argument') || lower.includes('bad request')) {
    return res.status(400).json({
      error: 'Format data masukan tidak dapat diterima oleh model AI. Periksa kembali isian formulir.',
    });
  }

  if (lower.includes('timeout') || lower.includes('deadline') || lower.includes('503') || lower.includes('econnreset') || lower.includes('fetch failed')) {
    return res.status(503).json({
      error: 'Koneksi ke layanan AI terputus atau batas waktu tercapai. Silakan coba sesaat lagi.',
    });
  }

  return res.status(500).json({
    error: 'Terjadi kendala saat memproses permintaan AI. Silakan coba kembali dalam beberapa saat.',
  });
}

// Utility helper to safely parse JSON from Gemini responses even with markdown blocks or leading text
function safeParseJSON<T = any>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/g, '')
      .trim();
    try {
      return JSON.parse(stripped);
    } catch {
      const start = stripped.indexOf('{');
      const end = stripped.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          return JSON.parse(stripped.slice(start, end + 1));
        } catch {}
      }
      return fallback;
    }
  }
}

// Helper input sanitizers
function isNonEmptyString(val: any, maxLen = 5000): val is string {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;
}

function sanitizeString(val: any, maxLen = 5000, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen);
}

// ============================================================================
// ENDPOINTS
// ============================================================================

// 0. Endpoint: Check authentication & system status
app.get('/api/auth/status', (req, res) => {
  res.json({
    firebaseConfigured: true,
    projectId: process.env.FIREBASE_PROJECT_ID || 'guruai-studio',
    requireAuth: process.env.REQUIRE_AUTH === 'true',
    authProvider: 'firebase-auth',
  });
});

// 1. Endpoint: Generate Full Learning Package
app.post(
  '/api/package/generate',
  packageGenerateLimiter,
  authenticateToken,
  userPackageGenerateLimiter,
  verifyProjectOwnership,
  async (req, res) => {
    try {
      const { parameters } = req.body;

      // Validate parameters object
      if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
        return res.status(400).json({ error: 'Data parameter pembelajaran tidak valid (harus berupa objek).' });
      }

      // Required fields validation
      if (!isNonEmptyString(parameters.subject, 200)) {
        return res.status(400).json({ error: 'Mata pelajaran wajib diisi (maksimal 200 karakter).' });
      }
      if (!isNonEmptyString(parameters.topic, 300)) {
        return res.status(400).json({ error: 'Topik pembelajaran wajib diisi (maksimal 300 karakter).' });
      }
      if (!isNonEmptyString(parameters.learningObjectives, 5000)) {
        return res.status(400).json({ error: 'Capaian dan Tujuan Pembelajaran wajib diisi (maksimal 5000 karakter).' });
      }

      // Sanitize optional fields with reasonable limits
      const sanitizedParams = {
        projectName: sanitizeString(parameters.projectName, 200, parameters.topic),
        schoolName: sanitizeString(parameters.schoolName, 200, 'Madrasah Aliyah / SMA'),
        teacherName: sanitizeString(parameters.teacherName, 200, 'Guru Mata Pelajaran'),
        nip: sanitizeString(parameters.nip, 100, ''),
        headmasterName: sanitizeString(parameters.headmasterName, 200, ''),
        headmasterNip: sanitizeString(parameters.headmasterNip, 100, ''),
        subject: sanitizeString(parameters.subject, 200),
        level: sanitizeString(parameters.level, 100, 'MA / SMA'),
        gradePhase: sanitizeString(parameters.gradePhase, 100, 'Fase E (Kelas 10)'),
        semester: sanitizeString(parameters.semester, 50, 'Ganjil'),
        topic: sanitizeString(parameters.topic, 300),
        timeAllocation: sanitizeString(parameters.timeAllocation, 100, '2 x 45 Menit'),
        curriculum: sanitizeString(parameters.curriculum, 150, 'Kurikulum Merdeka'),
        learningObjectives: sanitizeString(parameters.learningObjectives, 5000),
        studentCharacteristics: sanitizeString(parameters.studentCharacteristics, 3000, 'Reguler heterogen, variasi minat dan kemampuan'),
        learningModel: sanitizeString(parameters.learningModel, 200, 'Problem Based Learning (PBL)'),
        facilities: sanitizeString(parameters.facilities, 3000, 'Ruang kelas standar, papan tulis, buku pegangan siswa'),
        assessmentTypes: sanitizeString(parameters.assessmentTypes, 3000, 'Formatif (proses) dan Sumatif (akhir)'),
        referenceNotes: sanitizeString(parameters.referenceNotes, 3000, 'Sesuai buku ajar resmi'),
        specialInstructions: sanitizeString(parameters.specialInstructions, 3000, 'Sajikan bahasa yang komunikatif dan terstruktur rapi'),
      };

      const ai = getAIClient();

      const systemPrompt = `Anda adalah Konsultan Ahli Kurikulum & Pengembang Perangkat Pembelajaran Indonesia (Pakar Kurikulum Merdeka dan Standar Kemenag/Kemendikbudristek).
Tugas Anda adalah menghasilkan Paket Perangkat Pembelajaran (Modul Ajar) yang terpadu, saling terkait erat (kohesif vertikal), realistis, dan berstandar dinas pendidikan/madrasah.

PRINSIP WAJIB:
1. KONSISTENSI VERTIKAL: Capaian dan Tujuan Pembelajaran (TP) WAJIB menjadi dasar langsung dari seluruh kegiatan pembelajaran, lembar kerja siswa (LKPD), butir soal evaluasi, dan rubrik penilaian.
2. KONTEKSTUAL & REALISTIS: Perhatikan kondisi sarana/prasarana yang ditentukan guru (misalnya jika siswa tanpa gawai, jangan minta menggunakan aplikasi ponsel/quizizz online; gunakan media fisik/kartu/papan tulis).
3. BAHASA INDONESIA BAKU & PROFESIONAL: Gunakan peristilahan Kurikulum Merdeka yang tepat (Fase, TP, KKTP, Pemantik, Asesmen Formatif/Sumatif, Profil Pelajar Pancasila / Rahmatan Lil Alamin jika madrasah).
4. ANTI-HALUSINASI: Jangan mengarang kutipan palsu atau referensi regulasi fiktif.
5. FORMAT TABEL MARKDOWN WAJIB: Untuk bagian "scoringRubric" (Rubrik Penilaian), "assessmentPlan" (Matriks Asesmen), dan jika ada tabel pada LKPD, WAJIB menggunakan format tabel Markdown standar (| Kolom 1 | Kolom 2 | ... | dengan pemisah |---|---|). Jangan menggunakan ASCII art border atau teks melayang tanpa tabel pipe.
6. HINDARI SIMBOL BINTANG BERLEBIHAN: Jangan menggunakan simbol asteris/bintang liar ('*') untuk daftar poin jika bisa menggunakan penomoran runtut (1., 2., 3., a., b.) atau strip tanda hubung (-). Pastikan teks bersih dan siap diekspor menjadi dokumen resmi.
7. FORMAT KELUARAN: Wajib menghasilkan JSON murni yang dapat di-parse (valid JSON) sesuai dengan skema yang diminta. Jangan tambahkan markdown pembungkus di luar JSON jika memungkinkan, atau bungkus dalam block JSON valid.`;

      const userPrompt = `Buatlah Paket Perangkat Pembelajaran lengkap untuk data berikut:

IDENTITAS PEMBELAJARAN:
- Judul Proyek: ${sanitizedParams.projectName}
- Nama Sekolah/Madrasah: ${sanitizedParams.schoolName}
- Nama Guru Pengampu: ${sanitizedParams.teacherName}
- Jenjang & Kelas: ${sanitizedParams.level} - ${sanitizedParams.gradePhase}
- Mata Pelajaran: ${sanitizedParams.subject}
- Semester: ${sanitizedParams.semester}
- Topik / Materi Utama: ${sanitizedParams.topic}
- Alokasi Waktu: ${sanitizedParams.timeAllocation}
- Kurikulum / Pendekatan: ${sanitizedParams.curriculum}
- Capaian & Tujuan Pembelajaran Guru: ${sanitizedParams.learningObjectives}
- Karakteristik & Kebutuhan Siswa: ${sanitizedParams.studentCharacteristics}
- Model Pembelajaran: ${sanitizedParams.learningModel}
- Fasilitas & Sarana Sekolah: ${sanitizedParams.facilities}
- Rencana Asesmen: ${sanitizedParams.assessmentTypes}
- Catatan / Referensi Guru: ${sanitizedParams.referenceNotes}
- Instruksi Khusus Guru: ${sanitizedParams.specialInstructions}

Berikan respons dalam format JSON dengan kunci-kunci berikut (seluruh nilai berupa teks string terstruktur dengan baris baru dan penomoran rapi):
{
  "overview": "Identitas lengkap, profil pelajar (P5/PPRA jika relevan), sarana prasarana, target peserta didik, dan model pembelajaran yang dipakai.",
  "learningObjectivesDetail": "Rumusan Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), Tujuan Pembelajaran (TP) spesifik terukur, dan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP).",
  "meaningfulUnderstanding": "1. Pemahaman Bermakna (relevansi materi dengan kehidupan nyata siswa). 2. Pertanyaan Pemantik (3-5 pertanyaan provokatif yang menumbuhkan nalar kritis siswa).",
  "coreMaterial": "Ringkasan materi pelajaran yang komprehensif, runtut secara pedagogis, menyajikan konsep inti, ilustrasi logis, fakta/hukum/dalil/teori yang benar, dan glosarium istilah penting.",
  "learningActivities": "Langkah-langkah kegiatan pembelajaran detail dengan pembagian durasi menit: A. Pendahuluan (orientasi, apersepsi, motivasi, pemberian acuan). B. Kegiatan Inti (runtut sesuai sintaks model ${sanitizedParams.learningModel}, kegiatan siswa aktif, diferensiasi). C. Penutup (simpulan bersama, refleksi, asesmen tindak lanjut).",
  "studentWorksheet": "Lembar Kerja Peserta Didik (LKPD) siap pakai lengkap dengan: Judul Aktivitas, Petunjuk Pengerjaan, Stimulus Masalah/Teks/Tabel, Langkah Kerja Diskusi/Eksplorasi, Pertanyaan Analisis/Tugas, dan Kolom Kesimpulan Siswa.",
  "assessmentPlan": "Rencana Asesmen terperinci dilengkapi TABEL MATRIKS ASESMEN (| Jenis Asesmen | Teknik Penilaian | Bentuk Instrumen | Waktu Pelaksanaan |) serta penjelasan operasional diagnostik, formatif, dan sumatif.",
  "questionsAndAnswers": "Paket Soal Evaluasi Pembelajaran: 5 butir soal pilihan ganda atau esai kontekstual berjenjang (C2-C4/HOTS), dilengkapi Kunci Jawaban Resmi dan Pembahasan Rasional mendalam untuk tiap nomor.",
  "scoringRubric": "Rubrik Penilaian Terperinci dalam bentuk TABEL MARKDOWN (| Aspek Penilaian | Skor 1 (Perlu Bimbingan) | Skor 2 (Cukup) | Skor 3 (Baik) | Skor 4 (Sangat Baik) |) serta Pedoman Penghitungan Nilai Akhir.",
  "presentationOutline": "Garis besar materi tayang presentasi guru (Slide 1 s.d. Slide 8) berisi judul slide, poin kunci ringkas, dan instruksi visual/tanya jawab untuk guru.",
  "reflectionAndFollowUp": "1. Instrumen Refleksi Guru (apa yang berhasil, kendala). 2. Instrumen Refleksi Siswa (3 pertanyaan reflektif). 3. Rencana Remedial bagi siswa belum tuntas. 4. Program Pengayaan materi aplikatif."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const rawText = response.text || '';
      const parsedPackage = safeParseJSON(rawText, null);

      if (!parsedPackage || typeof parsedPackage !== 'object') {
        return res.status(500).json({ error: 'Format keluaran AI tidak valid. Silakan ulangi pembuatan.' });
      }

      res.json({
        success: true,
        package: parsedPackage,
      });
    } catch (error: any) {
      handleAIError(error, res, 'package/generate');
    }
  }
);

// 2. Endpoint: Refine a Single Section
app.post(
  '/api/section/refine',
  operationalLimiter,
  authenticateToken,
  userOperationalLimiter,
  verifyProjectOwnership,
  async (req, res) => {
    try {
      const { sectionKey, sectionTitle, currentContent, instruction, parameters, learningObjectives } = req.body;

      if (!isNonEmptyString(sectionKey, 100)) {
        return res.status(400).json({ error: 'Kunci seksi (sectionKey) wajib disertakan.' });
      }
      if (!isNonEmptyString(instruction, 3000)) {
        return res.status(400).json({ error: 'Instruksi revisi wajib diisi (maksimal 3000 karakter).' });
      }

      const safeTitle = sanitizeString(sectionTitle, 200, sectionKey);
      const safeContent = sanitizeString(currentContent, 40000, '');
      const safeInstruction = sanitizeString(instruction, 3000);
      const safeObjectives = sanitizeString(learningObjectives, 5000, '');
      const safeSubject = sanitizeString(parameters?.subject, 200, '-');
      const safeGradePhase = sanitizeString(parameters?.gradePhase, 100, '-');
      const safeTopic = sanitizeString(parameters?.topic, 300, '-');
      const safeFacilities = sanitizeString(parameters?.facilities, 3000, 'kelas standar');

      const ai = getAIClient();

      const systemPrompt = `Anda adalah Konsultan Pembelajaran Berpengalaman yang sedang membantu guru merevisi SATU BAGIAN SPESIFIK dari Modul Ajar Kurikulum Merdeka.
Peraturan:
1. Ubah hanya bagian ini sesuai instruksi guru, dengan tetap menjaga keselarasan terhadap Tujuan Pembelajaran (${safeObjectives || 'terkait'}).
2. Kembalikan teks hasil revisi secara langsung, lengkap, dan rapi dalam Bahasa Indonesia yang baik tanpa meta-komentar pembuka seperti "Tentu, ini hasil revisinya".
3. Perhatikan sarana prasarana sekolah (${safeFacilities}).`;

      const userPrompt = `KONTEKS PEMBELAJARAN:
- Mata Pelajaran: ${safeSubject}
- Kelas/Jenjang: ${safeGradePhase}
- Topik: ${safeTopic}
- Tujuan Pembelajaran Inti: ${safeObjectives}
- Bagian yang direvisi: ${safeTitle}

KONTEN SAAT INI:
${safeContent}

INSTRUKSI PERBAIKAN DARI GURU:
"${safeInstruction}"

Silakan tulis ulang seluruh konten bagian ini dengan menerapkan instruksi di atas secara sempurna, terstruktur, dan bernalar pedagogis:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      res.json({
        success: true,
        updatedContent: response.text || '',
      });
    } catch (error: any) {
      handleAIError(error, res, 'section/refine');
    }
  }
);

// 3. Endpoint: Background Validation Helper (Reviews Lesson Plan against Learning Objectives)
app.post(
  '/api/section/validate-alignment',
  operationalLimiter,
  authenticateToken,
  userOperationalLimiter,
  verifyProjectOwnership,
  async (req, res) => {
    try {
      const { sectionKey, sectionTitle, sectionContent, learningObjectives, parameters } = req.body;

      if (!isNonEmptyString(sectionContent, 40000) || sectionContent.trim().length < 5) {
        return res.status(400).json({ error: 'Konten seksi wajib diisi untuk divalidasi.' });
      }
      if (!isNonEmptyString(learningObjectives, 5000) || learningObjectives.trim().length < 5) {
        return res.status(400).json({ error: 'Tujuan pembelajaran acuan wajib disertakan.' });
      }

      const safeKey = sanitizeString(sectionKey, 100, 'section');
      const safeTitle = sanitizeString(sectionTitle, 200, safeKey);
      const safeContent = sanitizeString(sectionContent, 20000);
      const safeObjectives = sanitizeString(learningObjectives, 5000);
      const safeSubject = sanitizeString(parameters?.subject, 200, '-');
      const safeTopic = sanitizeString(parameters?.topic, 300, '-');
      const safeGradePhase = sanitizeString(parameters?.gradePhase, 100, '-');

      const ai = getAIClient();

      const systemPrompt = `Anda adalah Auditor Keselarasan Kurikulum Merdeka Indonesia (Pedagogical Alignment Validator).
Tugas Anda: tinjau secara kritis apakah draf/pembaruan seksi "${safeTitle}" ini tetap SELARAS dan MENDUKUNG Capaian serta Tujuan Pembelajaran (TP) yang ditetapkan guru, ataukah terjadi "Alignment Drift" (pergeseran fokus, penyempitan kognitif, atau penyimpangan materi yang tidak mendukung TP).

KRITERIA EVALUASI:
1. Relevansi Inti: Apakah konten langsung memfasilitasi pencapaian TP?
2. Kedalaman Kognitif: Apakah taraf berpikir (LOTS/HOTS/C2-C4) sesuai dengan target indikator TP?
3. Indikasi Drift: Deteksi jika materi melebar ke topik lain, instruksi tugas tidak mengukur TP, atau ada komponen TP penting yang terabaikan.

Format Keluaran WAJIB JSON murni:
{
  "isAligned": boolean (true jika selaras dengan skor >= 70, false jika terdeteksi penyimpangan/drift),
  "driftScore": number (skala 0 - 100: 85-100 = Sangat Selaras, 70-84 = Selaras dengan sedikit catatan, < 70 = Terjadi Drift/Penyimpangan),
  "status": "aligned" | "warning" | "drifted",
  "driftMessage": "Ringkasan evaluasi keselarasan 1-2 kalimat lugas dalam Bahasa Indonesia.",
  "driftedPoints": ["Poin spesifik 1 yang bergeser atau belum sesuai TP", ...],
  "suggestedRemedy": "Saran instruksi konkret untuk guru/AI guna mengembalikan keselarasan seksi ini dengan TP."
}`;

      const userPrompt = `Lakukan audit keselarasan cepat untuk seksi berikut terhadap Tujuan Pembelajaran:

IDENTITAS:
- Mata Pelajaran: ${safeSubject}
- Topik/Materi: ${safeTopic}
- Fase/Kelas: ${safeGradePhase}

[TUJUAN PEMBELAJARAN (TP) ACUAN]:
${safeObjectives}

[KONTEN SEKSI "${safeTitle}" YANG DIPERIKSA]:
${safeContent}

Periksa apakah konten seksi ini selaras dengan TP atau terjadi drift. Output JSON murni:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed: any = safeParseJSON(response.text || '{}', {});
      const score = typeof parsed.driftScore === 'number' ? parsed.driftScore : 85;
      const isAligned = parsed.isAligned !== undefined ? Boolean(parsed.isAligned) : score >= 70;
      const status = parsed.status || (score < 70 ? 'drifted' : score < 85 ? 'warning' : 'aligned');

      res.json({
        success: true,
        result: {
          isAligned,
          driftScore: score,
          status,
          driftMessage: parsed.driftMessage || (isAligned ? 'Seksi ini selaras dengan Tujuan Pembelajaran.' : 'Terdeteksi pergeseran dari Tujuan Pembelajaran.'),
          driftedPoints: Array.isArray(parsed.driftedPoints) ? parsed.driftedPoints : [],
          suggestedRemedy: parsed.suggestedRemedy || '',
          sectionKey: safeKey,
          sectionTitle: safeTitle,
          checkedAt: Date.now(),
        },
      });
    } catch (error: any) {
      handleAIError(error, res, 'section/validate-alignment');
    }
  }
);

// 4. Endpoint: Check Consistency Between Components
app.post(
  '/api/package/consistency',
  operationalLimiter,
  authenticateToken,
  userOperationalLimiter,
  verifyProjectOwnership,
  async (req, res) => {
    try {
      const { parameters, package: learningPackage } = req.body;

      if (!parameters || typeof parameters !== 'object') {
        return res.status(400).json({ error: 'Parameter pembelajaran wajib disertakan.' });
      }
      if (!learningPackage || typeof learningPackage !== 'object') {
        return res.status(400).json({ error: 'Paket pembelajaran (package) wajib disertakan.' });
      }

      const safeSubject = sanitizeString(parameters.subject, 200, 'Mata Pelajaran');
      const safeTopic = sanitizeString(parameters.topic, 300, 'Topik');
      const safeTime = sanitizeString(parameters.timeAllocation, 100, '-');
      const safeFacilities = sanitizeString(parameters.facilities, 2000, '-');

      const tp = sanitizeString(learningPackage.learningObjectivesDetail || parameters.learningObjectives, 10000, '-');
      const activities = sanitizeString(learningPackage.learningActivities, 15000, '-');
      const lkpd = sanitizeString(learningPackage.studentWorksheet, 15000, '-');
      const qa = sanitizeString(learningPackage.questionsAndAnswers, 15000, '-');
      const rubric = sanitizeString(learningPackage.scoringRubric, 15000, '-');

      const ai = getAIClient();

      const systemPrompt = `Anda adalah Auditor Mutu Pembelajaran dan Kurikulum Indonesia.
Tugas Anda adalah memeriksa keselarasan vertikal (alignment) antara:
1. Tujuan Pembelajaran (TP)
2. Kegiatan Belajar Siswa
3. Lembar Kerja Siswa (LKPD)
4. Soal Evaluasi & Asesmen
5. Rubrik Penilaian
6. Ketersediaan Sarana Prasarana

Format Keluaran wajib JSON murni:
{
  "overallScore": number (skala 0 - 100),
  "summary": "Ringkasan evaluasi keselarasan modul ini dalam 2-3 kalimat objektif.",
  "items": [
    {
      "component": "Tujuan Pembelajaran vs Kegiatan",
      "status": "sesuai" | "perhatian" | "perlu_perbaikan",
      "finding": "Analisis temuan keselarasan.",
      "recommendation": "Rekomendasi perbaikan konkret."
    },
    {
      "component": "Kegiatan Belajar vs LKPD",
      "status": "sesuai" | "perhatian" | "perlu_perbaikan",
      "finding": "Analisis temuan.",
      "recommendation": "Saran perbaikan."
    },
    {
      "component": "Tujuan vs Soal Evaluasi",
      "status": "sesuai" | "perhatian" | "perlu_perbaikan",
      "finding": "Apakah butir soal benar-benar mengukur indikator tujuan pembelajaran.",
      "recommendation": "Saran penyesuaian kisi-kisi atau butir soal."
    },
    {
      "component": "Rubrik Penilaian vs Tugas Siswa",
      "status": "sesuai" | "perhatian" | "perlu_perbaikan",
      "finding": "Apakah kriteria rubrik mencerminkan tugas pada LKPD dan performa nyata.",
      "recommendation": "Saran bobot atau deskriptor rubrik."
    },
    {
      "component": "Kesesuaian Sarpras & Alokasi Waktu",
      "status": "sesuai" | "perhatian" | "perlu_perbaikan",
      "finding": "Kelayakan pelaksanaan dengan fasilitas dan durasi waktu yang disediakan.",
      "recommendation": "Saran adaptasi jika ada kegiatan yang kurang realistis."
    }
  ]
}`;

      const userPrompt = `Periksa keselarasan dokumen berikut:
Mata Pelajaran: ${safeSubject}
Topik: ${safeTopic}
Alokasi Waktu: ${safeTime}
Sarpras: ${safeFacilities}

[TUJUAN PEMBELAJARAN]:
${tp}

[RANCANGAN KEGIATAN]:
${activities}

[LKPD]:
${lkpd}

[SOAL EVALUASI]:
${qa}

[RUBRIK PENILAIAN]:
${rubric}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const rawText = response.text || '';
      const parsedReport: any = safeParseJSON(rawText, null);

      if (!parsedReport || typeof parsedReport !== 'object') {
        return res.status(500).json({ error: 'Gagal menganalisis konsistensi modul (respons AI tidak valid).' });
      }

      res.json({
        success: true,
        report: {
          ...parsedReport,
          checkedAt: Date.now(),
        },
      });
    } catch (error: any) {
      handleAIError(error, res, 'package/consistency');
    }
  }
);

// 5. Endpoint: Contextual Assistant Chat
app.post(
  '/api/assistant/chat',
  operationalLimiter,
  authenticateToken,
  userOperationalLimiter,
  verifyProjectOwnership,
  async (req, res) => {
    try {
      const { message, activeSection, parameters, currentSectionContent } = req.body;

      if (!isNonEmptyString(message, 3000)) {
        return res.status(400).json({ error: 'Pesan guru tidak boleh kosong (maksimal 3000 karakter).' });
      }

      const safeMessage = sanitizeString(message, 3000);
      const safeSection = sanitizeString(activeSection, 100, 'Semua Bagian');
      const safeSubject = sanitizeString(parameters?.subject, 200, 'Umum');
      const safeTopic = sanitizeString(parameters?.topic, 300, 'Umum');
      const safeGradePhase = sanitizeString(parameters?.gradePhase, 100, '');
      const safeFacilities = sanitizeString(parameters?.facilities, 3000, 'Kelas standar');
      const safeContent = sanitizeString(currentSectionContent, 10000, '(Belum ada teks)');

      const ai = getAIClient();

      const systemPrompt = `Anda adalah Asisten AI Pedagogis di dalam GuruAI Studio yang mendampingi guru menyusun Modul Ajar.
Guru sedang membuka bagian: "${safeSection}".
Mata Pelajaran: ${safeSubject} - Topik: ${safeTopic} (${safeGradePhase}).
Fasilitas Sekolah: ${safeFacilities}.

Karakter Anda:
- Ramah, hormat, solutif, dan mengedepankan kepraktisan bagi guru di kelas.
- Berikan saran yang konkret, bukan sekadar teori umum.
- Jika guru meminta perubahan atau penulisan teks baru untuk bagian yang sedang dibuka, sediakan draf siap pakai yang dapat langsung disalin atau diterapkan oleh guru.
- Gunakan Bahasa Indonesia yang santun, lugas, dan berbobot edukatif.`;

      const userPrompt = `BAGIAN YANG SEDANG DIBUKA GURU (${safeSection}):
"""
${safeContent}
"""

PERTANYAAN / INSTRUKSI GURU:
"${safeMessage}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      res.json({
        success: true,
        reply: response.text || '',
      });
    } catch (error: any) {
      handleAIError(error, res, 'assistant/chat');
    }
  }
);

// Vite middleware integration (development vs production)
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true'
          ? false
          : {
              server: httpServer,
              clientPort: 443,
            },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[GuruAI Studio] Server siap di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', redactSecrets(String(err?.message || err)));
  process.exit(1);
});
