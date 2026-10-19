export interface LearningParameters {
  projectName: string;
  schoolName: string;
  teacherName: string;
  nip?: string;
  headmasterName?: string;
  headmasterNip?: string;
  subject: string;
  level: string; // e.g. "MA / SMA", "MTs / SMP", "MI / SD", "MAK / SMK"
  gradePhase: string; // e.g. "Fase E (Kelas 10)", "Fase F (Kelas 11-12)", "Fase D (Kelas 7-9)"
  semester: 'Ganjil' | 'Genap';
  topic: string;
  timeAllocation: string; // e.g. "2 x 45 Menit (1 Pertemuan)"
  curriculum: 'Kurikulum Merdeka' | 'Kurikulum 2013' | 'Kurikulum Merdeka Kemenag (Integrasi Moderasi)';
  learningObjectives: string; // Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP)
  studentCharacteristics?: string; // Karakteristik siswa: motivasi, gaya belajar, keunikan kelas
  learningModel?: string; // Problem Based Learning, Project Based Learning, Discovery, Inkuiri, Direct Instruction
  facilities?: string; // Fasilitas sekolah/kelas: tanpa gawai, smartphone bawa sendiri, proyektor, papan tulis, modul cetak
  assessmentTypes?: string; // Diagnostik Kognitif/Non-Kognitif, Formatif (LKPD & Diskusi), Sumatif (Tes Tertulis)
  referenceNotes?: string; // Buku teks pegangan, modul dinas/kemenag, artikel ilmiah
  specialInstructions?: string; // Instruksi khusus guru (misal: bahasa santun, kontekstual kedaerahan, nilai anti-korupsi/P5)
}

export interface LearningPackage {
  overview: string; // 1. Identitas & Gambaran Umum Modul Ajar
  learningObjectivesDetail: string; // 2. Rincian Capaian, Alur TP, & Kriteria Ketercapaian (KKTP)
  meaningfulUnderstanding: string; // 3. Pemahaman Bermakna & Pertanyaan Pemantik
  coreMaterial: string; // 4. Ringkasan Materi Pelajaran Terstruktur
  learningActivities: string; // 5. Rancangan Langkah Pembelajaran (Pendahuluan, Inti Sesuai Sintaks Sintaks Model, Penutup)
  studentWorksheet: string; // 6. Lembar Kerja Peserta Didik (LKPD) Lengkap & Instruksi Praktis
  assessmentPlan: string; // 7. Asesmen Diagnostik, Formatif, dan Sumatif
  questionsAndAnswers: string; // 8. Butir Soal Evaluasi, Kunci Jawaban, dan Pembahasan Rasional
  scoringRubric: string; // 9. Rubrik Penilaian Bertingkat (Aspek, Indikator, Skor 1-4, Kriteria)
  presentationOutline: string; // 10. Rancangan Bahan Presentasi / Garis Besar Slide Guru
  reflectionAndFollowUp: string; // 11. Refleksi Guru & Siswa, Program Remedial, dan Program Pengayaan
}

export interface ConsistencyItem {
  component: string;
  status: 'sesuai' | 'perhatian' | 'perlu_perbaikan';
  finding: string;
  recommendation: string;
}

export interface ConsistencyReport {
  overallScore: number; // 0 - 100
  summary: string;
  items: ConsistencyItem[];
  checkedAt: number;
}

export interface AlignmentValidationResult {
  isAligned: boolean;
  driftScore: number; // 0 - 100 (100 = perfectly aligned, < 70 = drifted)
  status: 'aligned' | 'warning' | 'drifted';
  driftMessage: string;
  driftedPoints?: string[];
  suggestedRemedy?: string;
  sectionKey: keyof LearningPackage;
  sectionTitle: string;
  checkedAt: number;
}

export interface LearningProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  ownerId?: string; // Authenticated user ID owning this project
  parameters: LearningParameters;
  package: LearningPackage;
  consistencyReport?: ConsistencyReport;
  version: number;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedAction?: {
    type: 'replace_section' | 'append_section';
    sectionKey: keyof LearningPackage;
    content: string;
    description: string;
  };
  timestamp: number;
}

export const SECTION_METADATA: Record<keyof LearningPackage, { title: string; subtitle: string; icon: string }> = {
  overview: {
    title: 'Identitas & Gambaran Umum',
    subtitle: 'Informasi umum modul, profil sekolah, target peserta didik, dan alokasi waktu',
    icon: 'School'
  },
  learningObjectivesDetail: {
    title: 'Tujuan Pembelajaran & KKTP',
    subtitle: 'Capaian Pembelajaran (CP), Tujuan (TP), dan Kriteria Ketercapaian Tujuan Pembelajaran',
    icon: 'Target'
  },
  meaningfulUnderstanding: {
    title: 'Pemahaman Bermakna & Pemantik',
    subtitle: 'Konsep esensial kehidupan nyata dan pertanyaan pemantik rasa ingin tahu',
    icon: 'Lightbulb'
  },
  coreMaterial: {
    title: 'Ringkasan Materi Esensial',
    subtitle: 'Uraian materi ajar pokok yang ringkas, akurat, dan sesuai daya serap siswa',
    icon: 'BookOpen'
  },
  learningActivities: {
    title: 'Rancangan Kegiatan Belajar',
    subtitle: 'Sintaks pembelajaran runtut (Pendahuluan, Inti sesuai model ajar, dan Penutup)',
    icon: 'ListChecks'
  },
  studentWorksheet: {
    title: 'Lembar Kerja Peserta Didik (LKPD)',
    subtitle: 'Panduan aktivitas kelompok/mandiri dengan instruksi jelas dan lembar kerja aktif',
    icon: 'FileText'
  },
  assessmentPlan: {
    title: 'Rencana Asesmen',
    subtitle: 'Pemetaan asesmen awal (diagnostik), asesmen proses (formatif), dan asesmen akhir (sumatif)',
    icon: 'ClipboardCheck'
  },
  questionsAndAnswers: {
    title: 'Bank Soal & Kunci Pembahasan',
    subtitle: 'Butir soal evaluasi berjenjang (LOTS/HOTS), kunci jawaban, dan penjelasan rasional',
    icon: 'HelpCircle'
  },
  scoringRubric: {
    title: 'Rubrik Penilaian Terperinci',
    subtitle: 'Matriks kriteria performa 4 skala (Perlu Bimbingan, Cukup, Baik, Sangat Baik)',
    icon: 'Table'
  },
  presentationOutline: {
    title: 'Rancangan Slide Presentasi',
    subtitle: 'Garis besar 6-10 slide tayang untuk presentasi interaktif guru di kelas',
    icon: 'Presentation'
  },
  reflectionAndFollowUp: {
    title: 'Refleksi, Remedial & Pengayaan',
    subtitle: 'Instrumen refleksi diri, program bimbingan remedial, dan tantangan pengayaan',
    icon: 'Compass'
  }
};
