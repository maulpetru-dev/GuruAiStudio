import React, { useState } from 'react';
import {
  Sparkles,
  School,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  HelpCircle,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  Info,
  CheckCircle2,
  Wand2,
  AlertCircle,
  Cpu,
  Tv,
  FileText,
  Users,
  Compass,
  GraduationCap,
  Eye,
  X
} from 'lucide-react';
import { LearningParameters } from '../types/learning';

interface BlueprintWizardProps {
  onGenerate: (params: LearningParameters) => Promise<void>;
  onCancel: () => void;
  isGenerating: boolean;
  generationStepMessage: string;
}

export const BlueprintWizard: React.FC<BlueprintWizardProps> = ({
  onGenerate,
  onCancel,
  isGenerating,
  generationStepMessage,
}) => {
  const [params, setParams] = useState<LearningParameters>({
    projectName: '',
    schoolName: 'MAN 2 Nganjuk',
    teacherName: 'Drs. H. Ahmad Fauzi, M.Pd.I.',
    nip: '197508122003121002',
    headmasterName: 'Dr. H. Muh. Kasirin, M.Ag.',
    headmasterNip: '196904151996031001',
    level: 'Madrasah Aliyah (MA)',
    gradePhase: 'Fase E (Kelas 10)',
    subject: '',
    semester: 'Genap',
    topic: '',
    timeAllocation: '2 x 45 Menit (1 Pertemuan)',
    curriculum: 'Kurikulum Merdeka Kemenag (Integrasi Moderasi)',
    learningObjectives: '',
    studentCharacteristics: 'Peserta didik aktif berdiskusi kelompok, daya serap konsep bertahap, menyukai contoh nyata di kehidupan sehari-hari.',
    learningModel: 'Problem Based Learning (PBL)',
    facilities: 'Papan tulis kelas, modul cetak pegangan siswa, ruang kelas luring (tanpa kewajiban ponsel siswa).',
    assessmentTypes: 'Asesmen Formatif (LKPD & Observasi Diskusi) dan Asesmen Sumatif (Tes Tertulis 5 Soal Analisis).',
    referenceNotes: 'Buku Guru & Siswa Kurikulum Merdeka Kemendikbudristek / Kemenag RI.',
    specialInstructions: 'Tampilkan langkah pembelajaran yang praktis, bahasa yang komunikatif, serta integrasikan nilai akhlak/karakter positif.',
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(false);

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'ski-man2') {
      setParams({
        ...params,
        projectName: 'Peradaban Islam Masa Dinasti Abbasiyah',
        schoolName: 'MAN 2 Nganjuk',
        subject: 'Sejarah Kebudayaan Islam (SKI)',
        level: 'Madrasah Aliyah (MA)',
        gradePhase: 'Fase E (Kelas 10)',
        semester: 'Genap',
        topic: 'Perkembangan Peradaban dan Ilmu Pengetahuan pada Masa Daulah Abbasiyah',
        timeAllocation: '2 x 45 Menit',
        curriculum: 'Kurikulum Merdeka Kemenag (Integrasi Moderasi)',
        learningObjectives: 'Peserta didik mampu menganalisis faktor internal dan eksternal kemajuan peradaban Dinasti Abbasiyah, mengidentifikasi keteladanan ilmuwan muslim di Baitul Hikmah, serta merefleksikan nilai tasamuh (toleransi) dalam pencarian ilmu.',
        learningModel: 'Problem Based Learning (PBL)',
        facilities: 'Papan tulis kelas, lembar LKPD cetak, buku paket SKI Kemenag (tanpa internet siswa).',
        specialInstructions: 'Kaitkan dengan literasi madrasah riset dan sikap terbuka terhadap sains.',
      });
    } else if (presetName === 'biologi-sma') {
      setParams({
        ...params,
        projectName: 'Interaksi Antarkomponen Ekosistem',
        schoolName: 'SMA Negeri 1',
        subject: 'Biologi / IPA',
        level: 'SMA',
        gradePhase: 'Fase E (Kelas 10)',
        semester: 'Genap',
        topic: 'Dampak Perubahan Lingkungan terhadap Jaring-Jaring Makanan Lokal',
        timeAllocation: '2 x 45 Menit',
        curriculum: 'Kurikulum Merdeka',
        learningObjectives: 'Peserta didik mampu menganalisis interaksi trofik dalam ekosistem perairan/kebun sekolah, memprediksi dampak kepunahan suatu spesies perantara, dan merancang solusi konservasi sederhana.',
        learningModel: 'Discovery / Inkuiri Terbimbing',
        facilities: 'Papan tulis, lembar kerja pengamatan lingkungan sekolah, kartu studi kasus ekosistem.',
        specialInstructions: 'Gunakan studi kasus sawah atau sungai lokal Jawa Timur.',
      });
    } else if (presetName === 'matematika-smp') {
      setParams({
        ...params,
        projectName: 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
        schoolName: 'SMP / MTs Negeri',
        subject: 'Matematika',
        level: 'MTs / SMP',
        gradePhase: 'Fase D (Kelas 8)',
        semester: 'Ganjil',
        topic: 'Menyelesaikan Masalah Kontekstual Jual-Beli dengan Metode Eliminasi & Substitusi',
        timeAllocation: '2 x 40 Menit',
        curriculum: 'Kurikulum Merdeka',
        learningObjectives: 'Peserta didik mampu memodelkan situasi nyata transaksi kantin/pasar ke dalam SPLDV dan menentukan harga satuan barang menggunakan strategi substitusi atau eliminasi secara mandiri.',
        learningModel: 'Problem Based Learning (PBL)',
        facilities: 'Papan tulis berpetak, LKPD cetak masalah kontekstual kantin sekolah.',
        specialInstructions: 'Berikan langkah-langkah aljabar yang sistematis dan rubrik skor tiap langkah perhitungan.',
      });
    }
  };

  const validateCurrentStep = (step: number): boolean => {
    setFormError(null);
    if (step === 1) {
      if (!params.schoolName.trim()) {
        setFormError('Nama satuan pendidikan / madrasah wajib diisi.');
        return false;
      }
    }
    if (step === 2) {
      if (!params.subject.trim()) {
        setFormError('Mata pelajaran wajib diisi.');
        return false;
      }
      if (!params.topic.trim()) {
        setFormError('Topik / materi utama wajib diisi.');
        return false;
      }
      if (!params.learningObjectives.trim()) {
        setFormError('Capaian / Tujuan Pembelajaran wajib diisi agar komponen saling kohesif.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep(2)) {
      setActiveStep(2);
      return;
    }

    try {
      await onGenerate(params);
    } catch (err: any) {
      setFormError(err.message || 'Gagal memulai generasi AI.');
    }
  };

  // Reusable Live Preview Card
  const renderLivePreviewCard = () => (
    <div className="rounded-3xl border border-emerald-900/20 bg-linear-to-b from-emerald-950 to-teal-950 p-5 sm:p-6 text-white shadow-xl">
      <div className="flex items-center justify-between text-xs text-emerald-300 font-bold uppercase tracking-wider mb-4 border-b border-emerald-800 pb-3">
        <span>Pratinjau Lembar Modul</span>
        <span className="text-amber-400 font-mono">Live Sync</span>
      </div>

      <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-inner">
        <div className="text-center pb-3 border-b border-slate-200 mb-3">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
            {params.schoolName || 'Satuan Pendidikan'}
          </span>
          <h4 className="text-xs font-extrabold text-slate-900 mt-0.5">
            MODUL AJAR KURIKULUM MERDEKA
          </h4>
        </div>

        <div className="space-y-2 text-[11px] text-slate-700">
          <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="text-slate-400">Mata Pelajaran:</span>
            <strong className="text-slate-900 truncate max-w-[130px]">
              {params.subject || '(Belum diisi)'}
            </strong>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="text-slate-400">Fase / Kelas:</span>
            <span className="font-semibold text-slate-800">{params.gradePhase}</span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="text-slate-400">Alokasi Waktu:</span>
            <span className="text-slate-800">{params.timeAllocation}</span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="text-slate-400">Model Ajar:</span>
            <span className="font-medium text-emerald-800 truncate max-w-[130px]">
              {params.learningModel || 'PBL'}
            </span>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block mb-1">Topik Utama:</span>
            <p className="text-xs font-bold text-slate-900 leading-snug">
              {params.topic || 'Masukkan topik pembelajaran Anda'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>Penyusun: {params.teacherName ? params.teacherName.split(',')[0] : 'Guru'}</span>
          <span className="text-emerald-700 font-bold">11 Seksi Lengkap</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-32 md:pb-12">
      {/* Top Header Navigation */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isGenerating}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        {/* Presets - Scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0 hidden sm:inline">
            Preset:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('ski-man2')}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer shrink-0 min-h-[36px]"
          >
            MAN 2 Nganjuk
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('biologi-sma')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0 min-h-[36px]"
          >
            Biologi SMA
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('matematika-smp')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0 min-h-[36px]"
          >
            Matematika SMP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Interactive Stepper Form (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xs">
          {/* Stepper Progress Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Langkah {activeStep} / 4
              </span>
              <span className="text-xs font-medium text-slate-500">
                {activeStep === 1 && '1. Satuan & Pendidik'}
                {activeStep === 2 && '2. Materi & TP'}
                {activeStep === 3 && '3. Model Pembelajaran'}
                {activeStep === 4 && '4. Sarpras & Karakteristik'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (step < activeStep || validateCurrentStep(activeStep)) {
                      setActiveStep(step);
                    }
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    step <= activeStep ? 'bg-emerald-800' : 'bg-slate-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {formError && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: SATUAN PENDIDIKAN & GURU */}
            {activeStep === 1 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                    Informasi Satuan Pendidikan & Guru Pengampu
                  </h2>
                  <p className="text-xs text-slate-500">
                    Data ini digunakan untuk Kop resmi dan Lembar Pengesahan tanda tangan.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Madrasah / Sekolah <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={params.schoolName}
                      onChange={(e) => setParams({ ...params, schoolName: e.target.value })}
                      placeholder="Contoh: MAN 2 Nganjuk"
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Guru Pengampu
                    </label>
                    <input
                      type="text"
                      value={params.teacherName}
                      onChange={(e) => setParams({ ...params, teacherName: e.target.value })}
                      placeholder="Nama lengkap beserta gelar"
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NIP Guru (Opsional)
                    </label>
                    <input
                      type="text"
                      value={params.nip || ''}
                      onChange={(e) => setParams({ ...params, nip: e.target.value })}
                      placeholder="Contoh: 197508122003121002"
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Kepala Madrasah / Sekolah
                    </label>
                    <input
                      type="text"
                      value={params.headmasterName || ''}
                      onChange={(e) => setParams({ ...params, headmasterName: e.target.value })}
                      placeholder="Nama Kepala Sekolah beserta gelar"
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenjang
                    </label>
                    <select
                      value={params.level}
                      onChange={(e) => setParams({ ...params, level: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    >
                      <option value="Madrasah Aliyah (MA)">Madrasah Aliyah (MA)</option>
                      <option value="SMA">SMA</option>
                      <option value="SMK / MAK">SMK / MAK</option>
                      <option value="Madrasah Tsanawiyah (MTs)">Madrasah Tsanawiyah (MTs)</option>
                      <option value="SMP">SMP</option>
                      <option value="Madrasah Ibtidaiyah (MI)">Madrasah Ibtidaiyah (MI)</option>
                      <option value="SD">SD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fase & Kelas
                    </label>
                    <select
                      value={params.gradePhase}
                      onChange={(e) => setParams({ ...params, gradePhase: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    >
                      <option value="Fase E (Kelas 10)">Fase E (Kelas 10)</option>
                      <option value="Fase F (Kelas 11)">Fase F (Kelas 11)</option>
                      <option value="Fase F (Kelas 12)">Fase F (Kelas 12)</option>
                      <option value="Fase D (Kelas 7)">Fase D (Kelas 7)</option>
                      <option value="Fase D (Kelas 8)">Fase D (Kelas 8)</option>
                      <option value="Fase D (Kelas 9)">Fase D (Kelas 9)</option>
                      <option value="Fase C (Kelas 5-6)">Fase C (Kelas 5-6)</option>
                      <option value="Fase B (Kelas 3-4)">Fase B (Kelas 3-4)</option>
                      <option value="Fase A (Kelas 1-2)">Fase A (Kelas 1-2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={params.semester}
                      onChange={(e) => setParams({ ...params, semester: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    >
                      <option value="Genap">Semester Genap</option>
                      <option value="Ganjil">Semester Ganjil</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: MATERI & TUJUAN */}
            {activeStep === 2 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                    Mata Pelajaran, Topik & Tujuan Pembelajaran
                  </h2>
                  <p className="text-xs text-slate-500">
                    AI akan mengunci TP ini ke seluruh kegiatan, LKPD, soal, dan rubrik.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mata Pelajaran <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={params.subject}
                      onChange={(e) => setParams({ ...params, subject: e.target.value })}
                      placeholder="Contoh: Sejarah Kebudayaan Islam"
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alokasi Waktu
                    </label>
                    <input
                      type="text"
                      value={params.timeAllocation}
                      onChange={(e) => setParams({ ...params, timeAllocation: e.target.value })}
                      placeholder="Contoh: 2 x 45 Menit (1 Pertemuan)"
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Topik / Materi Pokok <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={params.topic}
                    onChange={(e) => setParams({ ...params, topic: e.target.value })}
                    placeholder="Contoh: Kemajuan Peradaban & Baitul Hikmah Masa Dinasti Abbasiyah"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capaian (CP) & Tujuan Pembelajaran (TP) <span className="text-emerald-700">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={params.learningObjectives}
                    onChange={(e) => setParams({ ...params, learningObjectives: e.target.value })}
                    placeholder="Tuliskan rumusan kompetensi yang harus dicapai peserta didik setelah pembelajaran selesai..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: MODEL PEMBELAJARAN */}
            {activeStep === 3 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                    Pilih Sintaks Model Pembelajaran
                  </h2>
                  <p className="text-xs text-slate-500">
                    AI akan menyusun langkah kegiatan pendahuluan, inti, dan penutup sesuai model ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'Problem Based Learning (PBL)',
                      name: 'Problem Based Learning (PBL)',
                      desc: 'Orientasi masalah nyata, penyelidikan kelompok, dan presentasi hasil analisis.',
                    },
                    {
                      id: 'Project Based Learning (PjBL)',
                      name: 'Project Based Learning (PjBL)',
                      desc: 'Perencanaan proyek, penyusunan jadwal, pembuatan karya nyata, dan evaluasi hasil.',
                    },
                    {
                      id: 'Discovery / Inkuiri Terbimbing',
                      name: 'Discovery / Inkuiri Terbimbing',
                      desc: 'Stimulasi, identifikasi masalah, pengumpulan data empiris, dan pembuktian konsep.',
                    },
                    {
                      id: 'Cooperative Learning (Jigsaw/TGT)',
                      name: 'Cooperative Learning (Jigsaw)',
                      desc: 'Diskusi kelompok asal dan kelompok ahli, kolaborasi aktif antarteman sekelas.',
                    },
                  ].map((model) => (
                    <button
                      type="button"
                      key={model.id}
                      onClick={() => setParams({ ...params, learningModel: model.id })}
                      className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer min-h-[56px] ${
                        params.learningModel === model.id
                          ? 'border-emerald-700 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-700'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{model.name}</span>
                        {params.learningModel === model.id && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{model.desc}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pendekatan Kurikulum
                  </label>
                  <select
                    value={params.curriculum}
                    onChange={(e) => setParams({ ...params, curriculum: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                  >
                    <option value="Kurikulum Merdeka Kemenag (Integrasi Moderasi)">
                      Kurikulum Merdeka Kemenag (Integrasi PPRA / Moderasi Beragama)
                    </option>
                    <option value="Kurikulum Merdeka">
                      Kurikulum Merdeka Standar Kemendikbudristek
                    </option>
                    <option value="Kurikulum 2013">Kurikulum 2013 (Saintifik)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: SARPRAS & CATATAN KHUSUS */}
            {activeStep === 4 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                    Sarana Kelas & Catatan Khusus Guru
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pastikan aktivitas realistis dengan kondisi sekolah tanpa mengasumsikan internet siswa selalu ada.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ketersediaan Sarana & Prasarana Kelas
                  </label>
                  <textarea
                    rows={3}
                    value={params.facilities || ''}
                    onChange={(e) => setParams({ ...params, facilities: e.target.value })}
                    placeholder="Contoh: Papan tulis dan modul cetak (luring penuh tanpa gawai siswa) atau ruang multimedia dengan proyektor."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Karakteristik Peserta Didik (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={params.studentCharacteristics || ''}
                    onChange={(e) => setParams({ ...params, studentCharacteristics: e.target.value })}
                    placeholder="Contoh: Siswa aktif berdiskusi kelompok, daya serap konsep bertahap, menyukai analogi konkret."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instruksi Khusus untuk AI (Opsional)
                  </label>
                  <input
                    type="text"
                    value={params.specialInstructions || ''}
                    onChange={(e) => setParams({ ...params, specialInstructions: e.target.value })}
                    placeholder="Contoh: Gunakan bahasa yang santun dan masukkan nilai tasamuh (toleransi)."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>
            )}

            {/* Mobile Quick Preview Trigger */}
            <div className="lg:hidden mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-900 cursor-pointer min-h-[44px]"
              >
                <Eye className="h-4 w-4 text-emerald-700" />
                <span>{showMobilePreview ? 'Sembunyikan Pratinjau Lembar Modul' : 'Lihat Pratinjau Lembar Modul (Live)'}</span>
              </button>

              {showMobilePreview && (
                <div className="mt-3">
                  {renderLivePreviewCard()}
                </div>
              )}
            </div>

            {/* Step Navigation Controls */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => prev - 1)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer min-h-[48px]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Sebelumnya</span>
                </button>
              ) : (
                <div />
              )}

              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-emerald-900 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 transition-colors cursor-pointer min-h-[48px]"
                >
                  <span>Lanjut Langkah {activeStep + 1}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:bg-amber-400 active:scale-98 disabled:opacity-40 transition-all cursor-pointer min-h-[48px]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Mulai Susun Paket Modul Ajar</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Live Blueprint Folio Card Preview (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-24">
          {renderLivePreviewCard()}
        </div>
      </div>

      {/* Loading Modal while AI generates */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 mb-4 animate-pulse shadow-inner">
              <Wand2 className="h-8 w-8 text-emerald-800" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2">
              GuruAI Sedang Merajut Perangkat Pembelajaran
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              {generationStepMessage || 'Menghubungkan tujuan pembelajaran, kegiatan, lembar kerja siswa, soal evaluasi, dan rubrik...'}
            </p>

            <div className="space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="truncate">Mapel: {params.subject || 'Mapel Terpilih'} ({params.gradePhase})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">Topik: {params.topic || 'Topik Pembelajaran'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Mohon tunggu sekitar 15-25 detik.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
