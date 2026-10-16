import React from 'react';
import { BookOpen, Plus, FolderDown, Upload, HelpCircle, Layers, FileText, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'wizard' | 'editor';
  onNavigate: (view: 'dashboard' | 'wizard' | 'editor') => void;
  onNewProject: () => void;
  onOpenGuide: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  hasActiveProject: boolean;
  projectCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onNewProject,
  onOpenGuide,
  onExportBackup,
  onImportBackup,
  hasActiveProject,
  projectCount,
}) => {
  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 sm:px-6 py-2.5 sm:py-3.5 backdrop-blur-md shadow-xs">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-emerald-100 shadow-xs group-hover:bg-emerald-900 transition-colors">
              <BookOpen className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 block leading-tight">
                GuruAI<span className="text-emerald-800">Studio</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 whitespace-nowrap block">
                Perangkat Kurikulum Merdeka
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'dashboard' ? 'text-emerald-800 font-bold border-b-2 border-emerald-800 pb-0.5' : ''
            }`}
          >
            Dashboard ({projectCount})
          </button>

          {hasActiveProject && (
            <button
              onClick={() => onNavigate('editor')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'editor' ? 'text-emerald-800 font-bold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              Ruang Kerja Editor
            </button>
          )}

          <button
            onClick={onOpenGuide}
            className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <span>Panduan Guru</span>
          </button>
        </nav>

        {/* Zone 3: Actions / Tools */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onExportBackup}
            title="Unduh cadangan JSON"
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer min-h-[44px]"
          >
            <FolderDown className="h-4 w-4 text-slate-500" />
            <span>Cadangkan</span>
          </button>

          <button
            onClick={onImportBackup}
            title="Pulihkan cadangan JSON"
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer min-h-[44px]"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Pulihkan</span>
          </button>

          {/* Quick Guide Trigger for Mobile */}
          <button
            onClick={onOpenGuide}
            title="Panduan Guru"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-900 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 active:scale-98 transition-all whitespace-nowrap cursor-pointer min-h-[40px] sm:min-h-[44px]"
          >
            <Plus className="h-4 w-4 text-amber-400" />
            <span className="hidden xs:inline">Buat Paket</span>
            <span className="xs:hidden">Baru</span>
          </button>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (Pattern 1 from Mobile Touch Guidelines) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors min-h-[48px] cursor-pointer ${
            currentView === 'dashboard' ? 'text-emerald-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        <button
          onClick={onNewProject}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors min-h-[48px] cursor-pointer ${
            currentView === 'wizard' ? 'text-emerald-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="h-5 w-5 text-emerald-800" />
          <span className="text-[10px] mt-0.5">Buat Paket</span>
        </button>

        {hasActiveProject && (
          <button
            onClick={() => onNavigate('editor')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors min-h-[48px] cursor-pointer ${
              currentView === 'editor' ? 'text-emerald-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Editor</span>
          </button>
        )}

        <button
          onClick={onOpenGuide}
          className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 transition-colors min-h-[48px] cursor-pointer"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Panduan</span>
        </button>
      </nav>
    </>
  );
};
