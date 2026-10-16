import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { BlueprintWizard } from './components/BlueprintWizard';
import { WorkspaceEditor } from './components/WorkspaceEditor';
import { QuickGuideModal } from './components/QuickGuideModal';
import { LearningProject, LearningParameters, LearningPackage } from './types/learning';
import { storageService } from './services/storageService';
import { ApiService } from './services/apiService';
import { exportProjectToDocx } from './services/docxExportService';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'wizard' | 'editor'>('dashboard');
  const [projects, setProjects] = useState<LearningProject[]>([]);
  const [activeProject, setActiveProject] = useState<LearningProject | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStepMessage, setGenerationStepMessage] = useState<string>('');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const newProject = storageService.createNewProject(params, generatedPackage);
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
    } catch (err: any) {
      alert('Gagal mengekspor dokumen Word: ' + (err?.message || 'Terjadi kesalahan sistem'));
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
        alert(result.message);
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

      {/* Quick Pedagogical Guide Modal */}
      <QuickGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
