import React from 'react';
import { X, BookOpen, CheckCircle, HelpCircle, FileCheck, ShieldCheck, Sparkles, School } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Grab Handle for Mobile */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-white shrink-0">
              <BookOpen className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                Panduan GuruAI Studio v0.1
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Prinsip kerja, etika penggunaan AI, dan petunjuk praktis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed pb-8 sm:pb-6">
          {/* Section 1 */}
          <div>
            <h3 className="text-sm font-bold text-emerald-950 mb-1.5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>1. AI sebagai Mitra Perancang, Guru Pemegang Kendali</span>
            </h3>
            <p>
              GuruAI Studio dirancang bukan untuk menggantikan peran dan pertimbangan profesional guru, melainkan sebagai asisten cerdas untuk menghemat waktu pengetikan dan merajut keterhubungan logis antar-dokumen. Setiap draf yang dihasilkan AI harus selalu ditinjau dan disesuaikan dengan kondisi riil peserta didik di kelas Anda.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="text-sm font-bold text-emerald-950 mb-1.5 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>2. Menjaga Konsistensi Antarkomponen (Vertical Alignment)</span>
            </h3>
            <p>
              Keunggulan utama aplikasi ini adalah memastikan seluruh komponen saling terhubung:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600 pl-2">
              <li><strong>Tujuan Pembelajaran (TP)</strong> memandu sintaks kegiatan pembelajaran.</li>
              <li><strong>LKPD</strong> memfasilitasi aktivitas nyata yang telah direncanakan di kegiatan inti.</li>
              <li><strong>Soal Evaluasi</strong> langsung menguji indikator kompetensi pada TP.</li>
              <li><strong>Rubrik</strong> menyediakan indikator penskoran yang realistis bagi guru saat menilai tugas.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-sm font-bold text-emerald-950 mb-1.5 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>3. Cara Merevisi Tanpa Menghapus Bagian Lain</span>
            </h3>
            <p>
              Jika ada bagian yang kurang pas, Anda cukup mengetuk tombol <strong>"Revisi Seksi"</strong> pada seksi terkait. AI hanya akan memperbaiki bagian tersebut dengan konteks tujuan pembelajaran, tanpa mengubah bagian modul lain yang sudah Anda setujui.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h3 className="text-sm font-bold text-emerald-950 mb-1.5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>4. Penyimpanan di Browser & Ekspor Word (DOCX)</span>
            </h3>
            <p>
              Seluruh proyek Anda tersimpan aman secara otomatis di media penyimpanan browser Anda (IndexedDB/LocalStorage) tanpa perlu registrasi akun atau kata sandi. Dokumen dapat langsung diunduh ke format <strong>Microsoft Word (.docx)</strong> resmi yang rapi dengan kop sekolah, tabel indikator, dan lembar pengesahan.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-900 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer min-h-[44px]"
          >
            Saya Mengerti & Siap Mengajar
          </button>
        </div>
      </div>
    </div>
  );
};
