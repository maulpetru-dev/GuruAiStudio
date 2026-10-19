import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { BlueprintWizard } from './components/BlueprintWizard';
import { WorkspaceEditor } from './components/WorkspaceEditor';
import { QuickGuideModal } from './components/QuickGuideModal';
import { AuthModal } from './components/AuthModal';
import { LearningProject, LearningParameters, LearningPackage } from './types/learning';
import { storageService } from './services/storageService';
import { ApiService } from './services/apiService';
import { authService, UserProfile } from './services/authService';
import { exportProjectToDocx } from './services/docxExportService';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'wizard' | 'editor'>('dashboard');
  const [projects, setProjects] = useState<LearningProject[]>([]);
  const [activeProject, setActiveProject] = useState<LearningProject | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStepMessage, setGenerationStepMessage] = useState<string>('');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Load projects from storage on initial mount
  useEffect(() => {
    refreshProjects();
  }, []);

  const refreshProjects = () => {
    const all = storageService.getAllProjects();
    setProjects(all);
    const activeId = storageService.getActiveProjectId();
    if (activeId) {
      const current = storageService.getProjectById(activeId);
      if (current) setActiveProject(current);
    }
  };

  const handleOpenProject = (id: string) => {
    const proj = storageService.getProjectById(id);
    if (proj) {
      storageService.setActiveProjectId(id);
      setActiveProject(proj);
      setCurrentView('editor');
    }
  };

  const handleCreateNew = () => {
    setCurrentView('wizard');
  };

  const handleGeneratePackage = async (params: LearningParameters) => {
    setIsGenerating(true);
    setGenerationStepMessage('Menghubungkan tujuan pembelajaran dengan sintaks kegiatan dan rubrik autentik...');

    try {
      const generatedPackage = await ApiService.generatePackage(params);
      const newProject = storageService.createNewProject(params, generatedPackage, currentUser?.uid);
      refreshProjects();
      setActiveProject(newProject);
      setCurrentView('editor');
    } catch (err: any) {
      console.error('Generation failed:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSection = (sectionKey: keyof LearningPackage, content: string) => {
    if (!activeProject) return;
    const updated = storageService.updateProjectSection(activeProject.id, sectionKey, content);
    if (updated) {
      setActiveProject({ ...updated });
      refreshProjects();
    }
  };

  const handleRenameProject = (projectId: string, newTitle: string) => {
    storageService.updateProjectTitle(projectId, newTitle);
    refreshProjects();
    if (activeProject && activeProject.id === projectId) {
      setActiveProject({ ...activeProject, title: newTitle });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    storageService.deleteProject(projectId);
    refreshProjects();
    if (activeProject && activeProject.id === projectId) {
      setActiveProject(null);
      setCurrentView('dashboard');
    }
  };

  const handleExportDocx = async (project: LearningProject) => {
    try {
      await exportProjectToDocx(project);
      showToast('Dokumen Word berhasil diekspor dan diunduh.', 'success');
    } catch (err: any) {
      showToast('Gagal mengekspor dokumen Word: ' + (err?.message || 'Terjadi kesalahan sistem'), 'error');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cadangan_GuruAI_Studio_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Cadangan proyek berhasil diunduh (JSON).', 'success');
  };

  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = storageService.importBackupJson(content);
        showToast(result.message, result.success ? 'success' : 'error');
        refreshProjects();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSample = () => {
    const all = storageService.getAllProjects();
    if (all.length > 0) {
      handleOpenProject(all[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Hidden file input for backup restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Strict 3-Zone Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'editor' && !activeProject) {
            setCurrentView('dashboard');
          } else {
            setCurrentView(view);
          }
        }}
        onNewProject={handleCreateNew}
        onOpenGuide={() => setIsGuideOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        hasActiveProject={activeProject !== null}
        projectCount={projects.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={async () => {
          await authService.signOut();
          showToast('Anda telah keluar dari akun.', 'info');
        }}
      />

      {/* Main Body Router */}
      <div className="flex-1">
        {currentView === 'dashboard' && (
          <DashboardView
            projects={projects}
            onOpenProject={handleOpenProject}
            onCreateNew={handleCreateNew}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            onExportDocx={handleExportDocx}
            onLoadSample={handleLoadSample}
          />
        )}

        {currentView === 'wizard' && (
          <BlueprintWizard
            onGenerate={handleGeneratePackage}
            onCancel={() => setCurrentView('dashboard')}
            isGenerating={isGenerating}
            generationStepMessage={generationStepMessage}
          />
        )}

        {currentView === 'editor' && activeProject && (
          <WorkspaceEditor
            project={activeProject}
            onUpdateSection={handleUpdateSection}
            onUpdateProjectTitle={(title) => handleRenameProject(activeProject.id, title)}
            onExportDocx={handleExportDocx}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </div>

      {/* Floating In-App Toast Notification */}
      {toastNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm rounded-2xl bg-white p-4 shadow-xl border border-slate-200 flex items-start gap-3 transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div
            className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
              toastNotification.type === 'success'
                ? 'bg-emerald-500 ring-4 ring-emerald-100'
                : toastNotification.type === 'error'
                ? 'bg-rose-500 ring-4 ring-rose-100'
                : 'bg-teal-500 ring-4 ring-teal-100'
            }`}
          />
          <div className="flex-1 text-xs text-slate-800 font-medium leading-relaxed">
            {toastNotification.message}
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Pedagogical Guide Modal */}
      <QuickGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          showToast(`Selamat datang, ${user.displayName || 'Guru'}! Sesi akun aktif.`, 'success');
        }}
      />
    </div>
  );
}
