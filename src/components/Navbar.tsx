import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Plus, FolderDown, Upload, HelpCircle, Layers, FileText, LayoutDashboard, User as UserIcon, LogIn, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { UserProfile } from '../services/authService';

interface NavbarProps {
  currentView: 'dashboard' | 'wizard' | 'editor';
  onNavigate: (view: 'dashboard' | 'wizard' | 'editor') => void;
  onNewProject: () => void;
  onOpenGuide: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  hasActiveProject: boolean;
  projectCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
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
  currentUser,
  onOpenAuth,
  onSignOut,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer min-h-[40px]"
          >
            <FolderDown className="h-4 w-4 text-slate-500" />
            <span>Cadangkan</span>
          </button>

          <button
            onClick={onImportBackup}
            title="Pulihkan cadangan JSON"
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer min-h-[40px]"
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

          {/* User Account / Auth Button */}
          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-emerald-950 transition-colors cursor-pointer min-h-[40px]"
                title="Akun Guru Terverifikasi"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Avatar'}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-emerald-800 text-amber-300 font-bold flex items-center justify-center text-[11px]">
                    {(currentUser.displayName || currentUser.email || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline font-semibold max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'Guru'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-emerald-700" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer min-h-[40px]"
                title="Masuk dengan Akun Guru"
              >
                <LogIn className="h-4 w-4 text-emerald-700" />
                <span className="hidden sm:inline">Masuk Akun</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {userDropdownOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-3 px-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {currentUser.displayName || 'Guru Madrasah'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser.email || 'Mode Tamu Terverifikasi'}
                    </div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1 text-[11px] text-slate-600 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold text-emerald-700">Firebase Terverifikasi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">UID:</span>
                    <span className="font-mono text-[10px] text-slate-700">{currentUser.uid.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proyek:</span>
                    <span className="font-semibold text-slate-800">{projectCount} Modul Ajar</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Keluar (Sign Out)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

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
      <nav aria-label="Navigasi Bawah" className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md shadow-lg">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-semibold transition-colors cursor-pointer min-h-[44px] justify-center ${
            currentView === 'dashboard' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </button>

        {hasActiveProject && (
          <button
            onClick={() => onNavigate('editor')}
            className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-semibold transition-colors cursor-pointer min-h-[44px] justify-center ${
              currentView === 'editor' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Editor</span>
          </button>
        )}

        <button
          onClick={currentUser ? () => setUserDropdownOpen(true) : onOpenAuth}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer min-h-[44px] justify-center"
        >
          <UserIcon className="h-5 w-5 text-emerald-800" />
          <span>{currentUser ? 'Akun' : 'Masuk'}</span>
        </button>
      </nav>
    </>
  );
};
