import React, { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  Clock,
  Trash2,
  Edit3,
  Download,
  BookOpen,
  CheckCircle2,
  Sparkles,
  School,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Layers,
  GraduationCap,
  Calendar,
  X,
  Compass,
  FileCheck2
} from 'lucide-react';
import { LearningProject } from '../types/learning';

interface DashboardViewProps {
  projects: LearningProject[];
  onOpenProject: (projectId: string) => void;
  onCreateNew: () => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onExportDocx: (project: LearningProject) => void;
  onLoadSample: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenProject,
  onCreateNew,
  onDeleteProject,
  onRenameProject,
  onExportDocx,
  onLoadSample,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<LearningProject | null>(null);

  const allSubjects = Array.from(new Set(projects.map((p) => p.parameters.subject))).filter(Boolean);

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      p.parameters.subject.toLowerCase().includes(q) ||
      p.parameters.topic.toLowerCase().includes(q) ||
      (p.parameters.schoolName && p.parameters.schoolName.toLowerCase().includes(q));

    const matchesSubject =
      selectedSubjectFilter === 'all' || p.parameters.subject === selectedSubjectFilter;

    return matchesSearch && matchesSubject;
  });

  const handleStartRename = (project: LearningProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditTitleInput(project.title);
  };

  const handleSaveRename = (projectId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitleInput.trim()) {
      onRenameProject(projectId, editTitleInput.trim());
    }
    setEditingProjectId(null);
  };

  const formatRelativeTime = (timestamp: number): string => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}h lalu`;
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const estimateTotalWords = (pkg: LearningProject['package']): number => {
    const allText = Object.values(pkg).join(' ');
    return allText.trim().split(/\s+/).length;
  };

  const totalWordsAccumulated = projects.reduce(
    (acc, p) => acc + estimateTotalWords(p.package),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-28 md:pb-12">
      {/* Editorial Academic Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-950/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-950 p-5 sm:p-8 lg:p-10 text-white shadow-xl mb-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            {/* Institution Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/80 border border-emerald-700/60 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-100 mb-3 backdrop-blur-xs">
              <School className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">MAN 2 Nganjuk & Sekolah Nasional</span>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-2.5">
              Studio Perangkat Pembelajaran Terpadu & Berkarakter
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-base leading-relaxed max-w-2xl">
              Rancang Modul Ajar utuh sekali jalan: Capaian Pembelajaran, Pertanyaan Pemantik bernalar kritis, LKPD kontekstual, Bank Soal, Rubrik 4 skala, dan ekspor Word (.docx).
            </p>

            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onCreateNew}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:bg-amber-400 active:scale-98 transition-all cursor-pointer min-h-[48px]"
              >
                <Plus className="h-4 w-4" />
                <span>Susun Paket Baru Sekarang</span>
              </button>

              <button
                onClick={onLoadSample}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-900/60 border border-emerald-700 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-100 hover:bg-emerald-800/80 transition-colors cursor-pointer min-h-[48px]"
              >
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>Buka Contoh SKI MAN 2 Nganjuk</span>
              </button>
            </div>
          </div>

          {/* Teacher Summary Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 shrink-0">
            <div className="rounded-2xl border border-emerald-800/80 bg-emerald-900/50 p-3.5 sm:p-4 backdrop-blur-xs">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 block uppercase tracking-wider">
                Paket Tersimpan
              </span>
              <span className="text-xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
                {projects.length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-200/80 block">Dokumen Kurikulum</span>
            </div>

            <div className="rounded-2xl border border-emerald-800/80 bg-emerald-900/50 p-3.5 sm:p-4 backdrop-blur-xs">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 block uppercase tracking-wider">
                Total Konten
              </span>
              <span className="text-xl sm:text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
                ±{totalWordsAccumulated.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-200/80 block">Kata Berkualitas</span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-emerald-800/80 bg-emerald-900/50 p-3.5 sm:p-4 backdrop-blur-xs">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 block uppercase tracking-wider">
                Kelengkapan
              </span>
              <span className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <span>11 Bagian Resmi</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Inspirational Template Shelf */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-700" />
              <span>Inspirasi Modul Siap Telaah</span>
            </h2>
            <p className="text-xs text-slate-500">
              Geser untuk memilih contoh rancangan kurikulum teruji.
            </p>
          </div>
        </div>

        {/* Swipeable on mobile, grid on desktop */}
        <div className="flex overflow-x-auto gap-4 pb-3 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 snap-x snap-mandatory">
          {/* Template Card 1 */}
          <div
            onClick={onLoadSample}
            className="snap-start shrink-0 w-[270px] sm:w-auto rounded-2xl border border-emerald-200/80 bg-linear-to-b from-emerald-50/70 to-white p-4.5 hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 mb-2">
                <span>MAN 2 NGANJUK</span>
                <span className="text-amber-700">Fase E</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors mb-1.5 leading-snug">
                SKI: Baitul Hikmah & Peradaban Abbasiyah
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                PBL luring murni dengan integrasi nilai moderasi (tasamuh) & gerakan madrasah riset.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-semibold min-h-[36px]">
              <span>Buka Dokumen</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Template Card 2 */}
          <div
            onClick={onCreateNew}
            className="snap-start shrink-0 w-[270px] sm:w-auto rounded-2xl border border-teal-200/80 bg-linear-to-b from-teal-50/70 to-white p-4.5 hover:shadow-md hover:border-teal-600 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-900 mb-2">
                <span>SMA / MA</span>
                <span className="text-teal-700">Fase E</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors mb-1.5 leading-snug">
                Biologi: Interaksi Ekosistem Lokal
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                Inkuiri terbimbing menganalisis rantai makanan lingkungan sekitar sekolah.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-teal-100 flex items-center justify-between text-xs text-teal-800 font-semibold min-h-[36px]">
              <span>Gunakan Struktur</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Template Card 3 */}
          <div
            onClick={onCreateNew}
            className="snap-start shrink-0 w-[270px] sm:w-auto rounded-2xl border border-sky-200/80 bg-linear-to-b from-sky-50/70 to-white p-4.5 hover:shadow-md hover:border-sky-600 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-900 mb-2">
                <span>SMP / MTs</span>
                <span className="text-sky-700">Fase D</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-900 transition-colors mb-1.5 leading-snug">
                Matematika: SPLDV Kantin Sekolah
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                Pemodelan situasi nyata transaksi dengan LKPD bertahap dan rubrik jelas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between text-xs text-sky-800 font-semibold min-h-[36px]">
              <span>Gunakan Struktur</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Template Card 4 */}
          <div
            onClick={onCreateNew}
            className="snap-start shrink-0 w-[270px] sm:w-auto rounded-2xl border border-amber-200/80 bg-linear-to-b from-amber-50/70 to-white p-4.5 hover:shadow-md hover:border-amber-600 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-2">
                <span>MA / SMA</span>
                <span className="text-amber-700">Fase F</span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-900 transition-colors mb-1.5 leading-snug">
                B. Indonesia: Teks Opini Kritis
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                Membimbing perumusan tesis, fakta argumen, dan kesimpulan bernalar analitis.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-800 font-semibold min-h-[36px]">
              <span>Gunakan Struktur</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Management Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Daftar Modul Ajar Tersimpan
          </h2>
          <p className="text-xs text-slate-500">
            Ketuk modul untuk membuka editor, mengaudit, atau mengunduh Word (.docx).
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 flex-col sm:flex-row w-full sm:w-auto">
          {allSubjects.length > 1 && (
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none min-h-[44px]"
            >
              <option value="all">Semua Mapel</option>
              {allSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mapel, topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid / List */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => {
            const wordCount = estimateTotalWords(project.package);
            return (
              <div
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
              >
                <div>
                  {/* Top Bar on Card */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                    <span className="font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      {project.parameters.subject}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                  </div>

                  {/* Title or Inline Rename */}
                  {editingProjectId === project.id ? (
                    <form onSubmit={(e) => handleSaveRename(project.id, e)} className="mb-2">
                      <input
                        type="text"
                        autoFocus
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onBlur={() => setEditingProjectId(null)}
                        className="w-full rounded-lg border border-emerald-600 p-2 text-sm font-semibold text-slate-900 focus:outline-none"
                      />
                    </form>
                  ) : (
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-900 transition-colors mb-2 leading-snug">
                      {project.title}
                    </h3>
                  )}

                  {/* Topic and Context Info */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed">
                    {project.parameters.topic}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <School className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                    <span className="truncate font-medium text-slate-700">
                      {project.parameters.schoolName || 'Madrasah/Sekolah'}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="shrink-0">{project.parameters.gradePhase}</span>
                  </div>
                </div>

                {/* Footer and Actions with touch-target protection */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                    <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>±{wordCount} kata</span>
                  </div>

                  {/* Touch targets with min-h-[44px] */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleStartRename(project, e)}
                      title="Ubah judul modul"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onExportDocx(project)}
                      title="Unduh format Word (.docx)"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setProjectToDelete(project)}
                      title="Hapus proyek"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900 mb-3 shadow-inner">
            <BookOpen className="h-7 w-7 text-emerald-800" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            {searchQuery ? 'Tidak Ada Modul yang Sesuai' : 'Belum Ada Paket Pembelajaran Tersimpan'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan modul yang memuat kata kunci "${searchQuery}". Silakan atur ulang filter Anda.`
              : 'Mulai susun modul ajar pertama Anda dengan panduan AI berkaidah Kurikulum Merdeka, atau muat draf lengkap SKI MAN 2 Nganjuk.'}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              onClick={onCreateNew}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-6 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition-all cursor-pointer min-h-[48px]"
            >
              <Plus className="h-4 w-4" />
              <span>Susun Paket Baru</span>
            </button>
            {!searchQuery && (
              <button
                onClick={onLoadSample}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all cursor-pointer min-h-[48px]"
              >
                <BookOpen className="h-4 w-4 text-emerald-700" />
                <span>Muat Contoh SKI MAN 2 Nganjuk</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Modul</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus proyek <strong className="text-slate-900">"{projectToDelete.title}"</strong>? Seluruh teks modul, LKPD, soal, dan rubrik di dalamnya akan dihapus.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
