# GuruAI Studio v0.1: Asisten AI Perangkat Pembelajaran Terpadu

GuruAI Studio v0.1 adalah aplikasi web profesional yang membantu guru (khususnya guru madrasah dan sekolah umum di Indonesia) menyusun paket perangkat pembelajaran yang saling terhubung, konsisten, dan dapat langsung diedit serta diekspor ke format dokumen DOCX standar dinas/madrasah.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan sesi klarifikasi pada Tahap 1, berikut keputusan arsitektur dan fungsional yang telah disepakati:

- **Format Kurikulum & Struktur**: Berfokus pada **Kurikulum Merdeka** (Identitas, Capaian Pembelajaran, Alur Tujuan Pembelajaran, Pemahaman Bermakna & Pertanyaan Pemantik, Ringkasan Materi, Rancangan Kegiatan Pembelajaran, LKPD Interaktif, Asesmen Diagnostik/Formatif/Sumatif, Soal & Kunci Pembahasan, Rubrik Penilaian Bertingkat, Outline Presentasi Guru, serta Refleksi & Remedial/Pengayaan).
- **Mekanisme Penyimpanan Data**: Menggunakan **Local Storage & IndexedDB** di browser guru. Guru dapat langsung bekerja seketika tanpa keharusan login/registrasi akun, aman dari kebocoran privasi, dan dilengkapi tombol backup/restore berkas JSON proyek.
- **Ekspor Dokumen**: Menggunakan pustaka generator **DOCX** native (`docx`) untuk menghasilkan file Microsoft Word asli berformat rapi lengkap dengan Kop Madrasah/Sekolah, tabel rubrik yang tertata, penomoran berjenjang, dan teks Bahasa Indonesia berkaidah baku.
- **Arsitektur Keamanan Gemini AI**: Menggunakan model `gemini-3.8-flash` melalui server proxy Express (`server.ts` & Vite integration). Kunci `GEMINI_API_KEY` tersimpan aman di server lingkungan AI Studio dan tidak pernah dibocorkan ke client browser.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**: Aplikasi produktivitas guru menyeluruh (*all-in-one educational workspace*) untuk merancang dokumen Modul Ajar dan perangkat evaluasi dari satu kali pengisian parameter inti pembelajaran.
- **Target Pengguna**: Guru madrasah (seperti MAN 2 Nganjuk) dan sekolah umum di Indonesia untuk seluruh mata pelajaran (Umum, MIPA, IPS, Bahasa, dan Keagamaan/SKI/PAI).
- **Nilai Utama (*Key Value*)**:
  1. *Eliminasi Duplikasi Input*: Satu form komprehensif menghasilkan seluruh rangkaian dokumen yang saling bersesuaian.
  2. *Jaminan Konsistensi Vertikal*: Setiap butir LKPD, soal ujian, dan rubrik penilaian memiliki korelasi langsung dengan Capaian dan Tujuan Pembelajaran.
  3. *Kendali Penuh Guru*: AI bertindak sebagai perancang draf profesional pertama; guru memiliki kuasa penuh mengedit teks manual, merevisi hanya satu seksi spesifik tanpa merusak seksi lain, atau berkonsultasi dengan Asisten AI Kontekstual.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Dashboard & Project Hub**:
   - Guru disambut dengan ringkasan proyek tersimpan, kartu aksi cepat *"Buat Paket Pembelajaran Baru"*, tombol impor/ekspor data proyek, serta panduan alur kerja 4 langkah ringkas.
   - Tersedia filter pencarian dan label mata pelajaran/jenjang kelas. Jika kosong, ditampilkan panduan *zero-state* yang ramah dan inspiratif.
2. **Formulir Terpadu (*Learning Blueprint Wizard*)**:
   - Form modular berjenjang yang memisahkan kolom wajib (Identitas, Mapel, Kelas/Fase, Topik, Alokasi Waktu, Tujuan Pembelajaran) dan kolom adaptif (Karakteristik Siswa, Sarpras/Ketersediaan Gadget, Pendekatan/Model seperti PBL/PJBL/Discovery, Bentuk Asesmen, serta Catatan Guru).
   - Dilengkapi *tooltip* panduan istilah Kurikulum Merdeka (Fase E/F, TP, Asesmen As/For/Of Learning) dan pilihan opsi cepat ramah perangkat siswa tanpa internet/gawai.
3. **Workspace Editor 8 Bagian Bersebelahan**:
   - Bilah navigasi seksi di sebelah kiri: *Ringkasan*, *Rancangan Modul Ajar*, *Materi Pokok*, *LKPD*, *Asesmen & Kisi*, *Rubrik Penilaian*, *Bahan Presentasi*, serta *Refleksi & Pengayaan*.
   - Area penyuntingan teks kaya dengan fitur *Auto-Save* ke IndexedDB, penghitung kata, dan tombol aksi per seksi: *Edit Manual*, *Regenerasi Seksi Ini*, dan *Salin Teks*.
4. **Pemeriksa Konsistensi Pembelajaran (*Coherence Inspector*)**:
   - Panel audit otomatis yang memvalidasi apakah butir soal asesmen sesuai dengan tujuan pembelajaran dan apakah aktivitas LKPD realistis dengan durasi waktu dan sarpras yang dipilih guru.
5. **Panel Asisten AI Kontekstual**:
   - Bilah samping interaktif yang dapat diperluas untuk instruksi cepat, seperti: *"Sederhanakan instruksi LKPD untuk siswa Fase E"*, *"Ubah metode diskusi menjadi simulasi tanpa gawai"*, atau *"Tingkatkan level kognitif soal menjadi HOTS"*.
6. **Ekspor Word DOCX Otomatis**:
   - Satu klik untuk mengunduh satu paket utuh dokumen `.docx` terstruktur rapi dengan tata letak dokumen resmi Indonesia (Kop, Judul Berjenjang, Tabel Indikator, dan Ruang Tanda Tangan Guru & Kepala Madrasah).

### Visual Identity & Theme

- **Karakter Visual**: Bersih, terstruktur, ramah mata guru, dan mencerminkan kehormatan institusi pendidikan Indonesia (madrasah & sekolah nasional).
- **Palet Warna (Aturan 60-30-10)**:
  - *Dominan 60% (Canvas)*: Latar netral bersih `#f8fafc` (slate-50) dan kontainer putih mutiara `#ffffff`.
  - *Struktural 30% (Surfaces & Borders)*: Garis batas halus `#e2e8f0` (slate-200), teks utama abu-abu arang `#0f172a` (slate-900), dan teks sekunder `#475569` (slate-600).
  - *Aksen 10% (Action Points)*: Hijau tua institusi madrasah/hutan pinus `#064e3b` (emerald-900) untuk bar utama, dipadukan dengan aksen fungsional `#059669` (emerald-600) untuk tombol aksi utama dan status aktif.
- **Tipografi**:
  - Judul Display: `Plus Jakarta Sans` (font modern Indonesia yang proporsional, tegas, dan mudah dibaca).
  - Teks Badan & Dokumen: `DM Sans` / `Plus Jakarta Sans` dengan spasi baris 1.6 untuk kenyamanan membaca dokumen panjang.
  - Tabular Data: `font-mono tabular-nums` untuk durasi JP dan bobot rubrik.
- **Anti-Slop Restraint**:
  - Menghilangkan *pill badges* bertumpuk pada metadata (menggunakan pemisah tipografis natural `·`).
  - Menghilangkan kode komentar mekanis seperti `// 01_MODULE`. Menggunakan penomoran editorial bersih (`Bagian 1: Identitas & Capaian`).
  - Tidak ada metrik animasi berkedip palsu atau skor AI tanpa dasar.

---

## 3. Key Product Decisions & Trade-Offs

### Keputusan 1: Penyimpanan IndexedDB + LocalStorage dengan Opsi Backup JSON
- *Pilihan*: Menggunakan browser storage IndexedDB melalui implementasi penyimpanan teruji.
- *Alasan*: Guru dapat langsung menggunakan alat ini saat rapat kurikulum atau di ruang guru tanpa hambatan pembuatan akun/password, sepenuhnya gratis, dan data dokumen aman di perangkat pribadi mereka.
- *Mitigasi Risiko*: Ditambahkan fitur *Unduh Cadangan JSON* dan *Pulihkan Proyek* agar guru dapat memindahkan draf antar-komputer sekolah dan laptop pribadi.

### Keputusan 2: Pemisahan Generasi Utuh vs. Revisi Seksi Tunggal (Efisiensi Biaya API)
- *Pilihan*: Generasi awal membuat satu paket terpadu terstruktur JSON. Jika guru meminta revisi pada satu bagian (misal hanya LKPD), AI hanya memproses seksi tersebut dengan konteks Tujuan Pembelajaran tanpa melakukan pemanggilan ulang untuk modul, rubrik, dan materi.
- *Alasan*: Memangkas biaya token hingga 75% saat revisi, mempercepat respon dari 20 detik menjadi 3 detik, dan mencegah bagian lain yang sudah disetujui guru terhapus atau berubah sendiri.

### Keputusan 3: Generator DOCX Terstruktur Native
- *Pilihan*: Menggunakan pustaka npm `docx` dan `file-saver` untuk merakit file Microsoft Word `.docx` biner yang valid.
- *Alasan*: Format dokumen pendidikan di Indonesia mensyaratkan dokumen Word yang dapat diedit langsung oleh pengawas madrasah/kepala sekolah dengan tabel, header, footer, dan gaya paragraf baku.

### Keputusan 4: Server-Side Gemini Proxy
- *Pilihan*: Menggunakan endpoint Express `/api/gemini/*` di server internal untuk menangani panggilan `@google/genai` dengan model `gemini-3.8-flash`.
- *Alasan*: Memenuhi standar keamanan; API Key tidak pernah terekspos ke browser guru.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GuruAI Studio (Browser)                          │
│                                                                             │
│  ┌──────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │ Dashboard & Hub  │  │ Blueprint Form Wizard │  │ Workspace 8-Sections │  │
│  │ (Daftar Proyek)  │  │ (Parameter Kurikulum) │  │ (Editor Teks + Tabs) │  │
│  └────────┬─────────┘  └───────────┬───────────┘  └──────────┬───────────┘  │
│           │                        │                         │              │
│           ▼                        ▼                         ▼              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │             State Manager & Persistence Controller (IndexedDB)         │  │
│  │          - Auto-save draft, JSON import/export, dirty tracker         │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
│                                    │                                        │
│           ┌────────────────────────┴────────────────────────┐               │
│           ▼                                                 ▼               │
│  ┌───────────────────────────────┐        ┌──────────────────────────────┐  │
│  │ Client DOCX Exporter Engine   │        │ AI Client Service Gateway    │  │
│  │ (Tables, Headers, Typography) │        │ (Fetch API to /api/*)        │  │
│  └───────────────────────────────┘        └──────────────┬───────────────┘  │
└──────────────────────────────────────────────────────────┼──────────────────┘
                                                           │ HTTP POST
                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Express API Server (Node.js Proxy)                    │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ /api/package/generate │  │ /api/section/refine  │  │ /api/assistant   │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│              │                         │                       │            │
│              ▼                         ▼                       ▼            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    @google/genai SDK (gemini-3.8-flash)               │  │
│  │          - User-Agent: aistudio-build                                 │  │
│  │          - System Prompt: Konsultan Kurikulum Merdeka & Madrasah      │  │
│  │          - Structured JSON Output Validation                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models

```typescript
export interface LearningProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  parameters: LearningParameters;
  package: LearningPackage;
  consistencyNotes?: ConsistencyReport;
}

export interface LearningParameters {
  schoolName: string;
  subject: string;
  level: string; // e.g. "MA / SMA", "MTs / SMP"
  gradePhase: string; // e.g. "Fase E (Kelas 10)"
  semester: 'Ganjil' | 'Genap';
  topic: string;
  timeAllocation: string; // e.g. "2 x 45 Menit"
  curriculum: 'Kurikulum Merdeka' | 'Kurikulum 2013' | 'Kombinasi Kemenag';
  learningObjectives: string; // Capaian & Tujuan Pembelajaran
  studentCharacteristics?: string;
  learningModel?: string; // e.g. "Problem-Based Learning (PBL)"
  facilities?: string; // e.g. "Tanpa gawai siswa / proyektor saja"
  assessmentTypes?: string; // Formatif, Sumatif, Diagnostik
  referenceNotes?: string;
}

export interface LearningPackage {
  overview: string; // Identitas & Gambaran Umum
  learningObjectivesDetail: string; // TP, ATP, Indikator Ketercapaian
  meaningfulUnderstanding: string; // Pemahaman Bermakna & Pemantik
  coreMaterial: string; // Ringkasan Materi Ajar
  learningActivities: string; // Langkah Pendahuluan, Inti, Penutup
  studentWorksheet: string; // LKPD Lengkap dengan Panduan
  assessmentPlan: string; // Diagnostik, Formatif, Sumatif
  questionsAndAnswers: string; // Soal, Kunci, Pembahasan Mendalam
  scoringRubric: string; // Tabel Kriteria Penilaian
  presentationOutline: string; // Slide-by-slide rancangan guru
  reflectionAndFollowUp: string; // Refleksi, Remedial, Pengayaan
}
```

---

## 5. Implementation Stages & Verification Plan

### Phase A: Setup & Backend Express Proxy
1. Pasang dependensi yang diperlukan: pustaka `docx`, `file-saver`, dan tipe pendukungnya.
2. Buat server Express (`server.ts`) yang terhubung dengan `@google/genai` (menggunakan `gemini-3.8-flash`) untuk menangani:
   - `POST /api/package/generate`: Menghasilkan 1 paket utuh terstruktur dalam format JSON.
   - `POST /api/section/refine`: Merevisi 1 seksi terpilih sesuai masukan instruksional guru.
   - `POST /api/assistant/chat`: Asisten AI kontekstual untuk memberikan saran perbaikan atau audit konsistensi.
3. Hubungkan Vite dev server ke Express API menggunakan proxy middleware atau Vite plugin.

### Phase B: Frontend UI & Wizard Builder
1. Terapkan tata letak bertema hijau tua profesional madrasah dengan Top Bar Contract 3-zona yang bersih.
2. Bangun Dashboard proyek dengan pencarian, pengurutan, filter jenjang, dan manajemen cadangan JSON lokal.
3. Bangun Formulir Parameter Pembelajaran yang komprehensif dengan nilai bawaan cerdas (*smart defaults*) untuk madrasah dan sekolah nasional.

### Phase C: Workspace 8-Seksi & Asisten Kontekstual
1. Bangun tab editor 8 seksi dengan indikator status simpan otomatis (*Auto-saved*).
2. Sediakan fitur edit manual (textarea terformat) dan regenerasi seksi mandiri tanpa mengganggu seksi lainnya.
3. Sediakan bilah samping Asisten AI yang memahami isi dokumen yang sedang dibuka.

### Phase D: Generator Ekspor DOCX & Pengujian Komprehensif
1. Bangun fungsi ekspor `.docx` menggunakan tabel bertata letak rapi, judul hierarki Word resmi, dan kop institusi.
2. Uji compile aplikasi (`compile_applet`) dan verifikasi kelancaran alur pembuatan dari awal hingga akhir.
