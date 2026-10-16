import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di environment server. Pastikan API key telah diatur di panel Secrets.');
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

// 1. Endpoint: Generate Full Learning Package
app.post('/api/package/generate', async (req, res) => {
  try {
    const { parameters } = req.body;
    if (!parameters || !parameters.subject || !parameters.topic) {
      return res.status(400).json({ error: 'Parameter pembelajaran tidak lengkap (Mata pelajaran dan topik wajib diisi).' });
    }

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
- Judul Proyek: ${parameters.projectName || parameters.topic}
- Nama Sekolah/Madrasah: ${parameters.schoolName || 'Madrasah Aliyah / SMA'}
- Nama Guru Pengampu: ${parameters.teacherName || 'Guru Mata Pelajaran'}
- Jenjang & Kelas: ${parameters.level} - ${parameters.gradePhase}
- Mata Pelajaran: ${parameters.subject}
- Semester: ${parameters.semester}
- Topik / Materi Utama: ${parameters.topic}
- Alokasi Waktu: ${parameters.timeAllocation}
- Kurikulum / Pendekatan: ${parameters.curriculum}
- Capaian & Tujuan Pembelajaran Guru: ${parameters.learningObjectives}
- Karakteristik & Kebutuhan Siswa: ${parameters.studentCharacteristics || 'Reguler heterogen, variasi minat dan kemampuan'}
- Model Pembelajaran: ${parameters.learningModel || 'Problem Based Learning (PBL)'}
- Fasilitas & Sarana Sekolah: ${parameters.facilities || 'Ruang kelas standar, papan tulis, buku pegangan siswa'}
- Rencana Asesmen: ${parameters.assessmentTypes || 'Formatif (proses) dan Sumatif (akhir)'}
- Catatan / Referensi Guru: ${parameters.referenceNotes || 'Sesuai buku ajar resmi'}
- Instruksi Khusus Guru: ${parameters.specialInstructions || 'Sajikan bahasa yang komunikatif dan terstruktur rapi'}

Berikan respons dalam format JSON dengan kunci-kunci berikut (seluruh nilai berupa teks string terstruktur dengan baris baru dan penomoran rapi):
{
  "overview": "Identitas lengkap, profil pelajar (P5/PPRA jika relevan), sarana prasarana, target peserta didik, dan model pembelajaran yang dipakai.",
  "learningObjectivesDetail": "Rumusan Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), Tujuan Pembelajaran (TP) spesifik terukur, dan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP).",
  "meaningfulUnderstanding": "1. Pemahaman Bermakna (relevansi materi dengan kehidupan nyata siswa). 2. Pertanyaan Pemantik (3-5 pertanyaan provokatif yang menumbuhkan nalar kritis siswa).",
  "coreMaterial": "Ringkasan materi pelajaran yang komprehensif, runtut secara pedagogis, menyajikan konsep inti, ilustrasi logis, fakta/hukum/dalil/teori yang benar, dan glosarium istilah penting.",
  "learningActivities": "Langkah-langkah kegiatan pembelajaran detail dengan pembagian durasi menit: A. Pendahuluan (orientasi, apersepsi, motivasi, pemberian acuan). B. Kegiatan Inti (runtut sesuai sintaks model ${parameters.learningModel || 'PBL'}, kegiatan siswa aktif, diferensiasi). C. Penutup (simpulan bersama, refleksi, asesmen tindak lanjut).",
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
    let parsedPackage;
    try {
      parsedPackage = JSON.parse(rawText);
    } catch {
      // If wrapped in markdown json block
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedPackage = JSON.parse(cleanJson);
    }

    res.json({
      success: true,
      package: parsedPackage,
    });
  } catch (error: any) {
    console.error('Error generating learning package:', error);
    res.status(500).json({
      error: error?.message || 'Terjadi kesalahan saat memproses permintaan AI.',
    });
  }
});

// 2. Endpoint: Refine a Single Section
app.post('/api/section/refine', async (req, res) => {
  try {
    const { sectionKey, sectionTitle, currentContent, instruction, parameters, learningObjectives } = req.body;
    if (!sectionKey || !instruction) {
      return res.status(400).json({ error: 'Data revisi seksi tidak lengkap.' });
    }

    const ai = getAIClient();

    const systemPrompt = `Anda adalah Konsultan Pembelajaran Berpengalaman yang sedang membantu guru merevisi SATU BAGIAN SPESIFIK dari Modul Ajar Kurikulum Merdeka.
Peraturan:
1. Ubah hanya bagian ini sesuai instruksi guru, dengan tetap menjaga keselarasan terhadap Tujuan Pembelajaran (${learningObjectives || 'terkait'}).
2. Kembalikan teks hasil revisi secara langsung, lengkap, dan rapi dalam Bahasa Indonesia yang baik tanpa meta-komentar pembuka seperti "Tentu, ini hasil revisinya".
3. Perhatikan sarana prasarana sekolah (${parameters?.facilities || 'kelas standar'}).`;

    const userPrompt = `KONTEKS PEMBELAJARAN:
- Mata Pelajaran: ${parameters?.subject}
- Kelas/Jenjang: ${parameters?.gradePhase}
- Topik: ${parameters?.topic}
- Tujuan Pembelajaran Inti: ${learningObjectives}
- Bagian yang direvisi: ${sectionTitle || sectionKey}

KONTEN SAAT INI:
${currentContent}

INSTRUKSI PERBAIKAN DARI GURU:
"${instruction}"

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
    console.error('Error refining section:', error);
    res.status(500).json({
      error: error?.message || 'Gagal merevisi bagian ini.',
    });
  }
});

// 3. Endpoint: Check Consistency Between Components
app.post('/api/package/consistency', async (req, res) => {
  try {
    const { parameters, package: learningPackage } = req.body;
    if (!parameters || !learningPackage) {
      return res.status(400).json({ error: 'Data paket tidak lengkap untuk dianalisis.' });
    }

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
Mata Pelajaran: ${parameters.subject}
Topik: ${parameters.topic}
Alokasi Waktu: ${parameters.timeAllocation}
Sarpras: ${parameters.facilities}

[TUJUAN PEMBELAJARAN]:
${learningPackage.learningObjectivesDetail || parameters.learningObjectives}

[RANCANGAN KEGIATAN]:
${learningPackage.learningActivities}

[LKPD]:
${learningPackage.studentWorksheet}

[SOAL EVALUASI]:
${learningPackage.questionsAndAnswers}

[RUBRIK PENILAIAN]:
${learningPackage.scoringRubric}`;

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
    let parsedReport;
    try {
      parsedReport = JSON.parse(rawText);
    } catch {
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedReport = JSON.parse(cleanJson);
    }

    res.json({
      success: true,
      report: {
        ...parsedReport,
        checkedAt: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Error checking consistency:', error);
    res.status(500).json({
      error: error?.message || 'Gagal memeriksa konsistensi modul.',
    });
  }
});

// 4. Endpoint: Contextual Assistant Chat
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message, activeSection, parameters, currentSectionContent, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Pesan guru tidak boleh kosong.' });
    }

    const ai = getAIClient();

    const systemPrompt = `Anda adalah Asisten AI Pedagogis di dalam GuruAI Studio yang mendampingi guru menyusun Modul Ajar.
Guru sedang membuka bagian: "${activeSection || 'Semua Bagian'}".
Mata Pelajaran: ${parameters?.subject || 'Umum'} - Topik: ${parameters?.topic || 'Umum'} (${parameters?.gradePhase || ''}).
Fasilitas Sekolah: ${parameters?.facilities || 'Kelas standar'}.

Karakter Anda:
- Ramah, hormat, solutif, dan mengedepankan kepraktisan bagi guru di kelas.
- Berikan saran yang konkret, bukan sekadar teori umum.
- Jika guru meminta perubahan atau penulisan teks baru untuk bagian yang sedang dibuka, sediakan draf siap pakai yang dapat langsung disalin atau diterapkan oleh guru.
- Gunakan Bahasa Indonesia yang santun, lugas, dan berbobot edukatif.`;

    const userPrompt = `BAGIAN YANG SEDANG DIBUKA GURU (${activeSection}):
"""
${currentSectionContent ? currentSectionContent.slice(0, 3000) : '(Belum ada teks)'}
"""

PERTANYAAN / INSTRUKSI GURU:
"${message}"`;

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
    console.error('Error in assistant chat:', error);
    res.status(500).json({
      error: error?.message || 'Asisten AI mengalami kendala saat merespons.',
    });
  }
});

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
  console.error('Failed to start server:', err);
  process.exit(1);
});
