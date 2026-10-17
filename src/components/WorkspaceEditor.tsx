import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Save,
  Copy,
  Sparkles,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Sliders,
  Maximize2,
  Minimize2,
  FileText,
  HelpCircle,
  Clock,
  ArrowLeft,
  School,
  ExternalLink,
  Eye,
  Edit,
  Bold,
  List,
  Table as TableIcon,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import {
  LearningProject,
  LearningPackage,
  SECTION_METADATA,
  ConsistencyReport,
  AssistantChatMessage,
  AlignmentValidationResult
} from '../types/learning';
import { ApiService } from '../services/apiService';
import { DocumentPreview } from './DocumentPreview';

interface WorkspaceEditorProps {
  project: LearningProject;
  onUpdateSection: (sectionKey: keyof LearningPackage, content: string) => void;
  onUpdateProjectTitle: (newTitle: string) => void;
  onExportDocx: (project: LearningProject) => void;
  onBackToDashboard: () => void;
}

export const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({
  project,
  onUpdateSection,
  onUpdateProjectTitle,
  onExportDocx,
  onBackToDashboard,
}) => {
  const sectionKeys = Object.keys(SECTION_METADATA) as (keyof LearningPackage)[];
  const [activeKey, setActiveKey] = useState<keyof LearningPackage>('overview');
  const [activeContent, setActiveContent] = useState<string>(project.package.overview || '');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  // Mobile section picker sheet
  const [showMobileSectionSheet, setShowMobileSectionSheet] = useState<boolean>(false);

  // Section refinement state
  const [refinePrompt, setRefinePrompt] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [showRefineModal, setShowRefineModal] = useState<boolean>(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Side Drawer state: 'assistant' | 'consistency' | 'closed'
  const [drawerMode, setDrawerMode] = useState<'assistant' | 'consistency' | 'closed'>('closed');

  // Consistency Auditor state
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [consistencyReport, setConsistencyReport] = useState<ConsistencyReport | null>(
    project.consistencyReport || null
  );

  // Assistant Chat state
  const [chatMessages, setChatMessages] = useState<AssistantChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Halo Bapak/Ibu Guru! Saya siap mendampingi penyusunan Modul Ajar "${project.parameters.subject} - ${project.parameters.topic}". Anda dapat meminta saya menyederhanakan instruksi, mengubah langkah kegiatan luring tanpa ponsel, atau menambah pertanyaan analitis pada bagian "${SECTION_METADATA[activeKey].title}".`,
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeIndex = sectionKeys.indexOf(activeKey);

  // Background validation helper state
  const [isValidatingAlignment, setIsValidatingAlignment] = useState<boolean>(false);
  const [alignmentDriftAlert, setAlignmentDriftAlert] = useState<AlignmentValidationResult | null>(null);
  const [dismissedAlert, setDismissedAlert] = useState<boolean>(false);
  const [sectionValidationMap, setSectionValidationMap] = useState<Record<string, AlignmentValidationResult>>({});
  const validationAbortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Background validation helper: reviews the updated lesson plan section
   * against the learning objectives to detect alignment drift without blocking the user.
   */
  const runBackgroundValidation = async (key: keyof LearningPackage, content: string) => {
    if (!content || content.trim().length < 30) return;

    if (validationAbortControllerRef.current) {
      validationAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    validationAbortControllerRef.current = controller;

    setIsValidatingAlignment(true);

    try {
      const objectives =
        project.package.learningObjectivesDetail || project.parameters.learningObjectives || '';

      const result = await ApiService.validateSectionAlignment(
        key,
        SECTION_METADATA[key].title,
        content,
        objectives,
        project.parameters,
        controller.signal
      );

      if (controller.signal.aborted) return;

      setSectionValidationMap((prev) => ({
        ...prev,
        [key]: result,
      }));

      // Alert user if alignment drifts or requires warning
      if (!result.isAligned || result.status === 'drifted' || result.status === 'warning') {
        setAlignmentDriftAlert(result);
        setDismissedAlert(false);
      } else {
        // Clear alert if current section was previously drifting but is now aligned
        setAlignmentDriftAlert((prev) => (prev?.sectionKey === key ? null : prev));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Background alignment validation notice:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsValidatingAlignment(false);
      }
    }
  };

  // Sync content when active section changes
  useEffect(() => {
    const sectionContent = project.package[activeKey] || '';
    setActiveContent(sectionContent);
    setIsDirty(false);
    setSaveStatus('saved');

    // Sync active alert if already validated for this section
    if (sectionValidationMap[activeKey]) {
      const val = sectionValidationMap[activeKey];
      if (!val.isAligned || val.status === 'drifted' || val.status === 'warning') {
        setAlignmentDriftAlert(val);
        setDismissedAlert(false);
      } else {
        setAlignmentDriftAlert(null);
      }
    } else if (sectionContent.trim().length >= 40) {
      // Run background validation on initial view
      runBackgroundValidation(activeKey, sectionContent);
    }
  }, [activeKey, project.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, drawerMode]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (validationAbortControllerRef.current) validationAbortControllerRef.current.abort();
    };
  }, []);

  const handleContentChange = (newVal: string) => {
    setActiveContent(newVal);
    setIsDirty(true);
    setSaveStatus('dirty');

    // Debounce background alignment validation after teacher finishes typing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runBackgroundValidation(activeKey, newVal);
    }, 2500);
  };

  const handleSaveContent = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaveStatus('saving');
    onUpdateSection(activeKey, activeContent);
    setIsDirty(false);
    setSaveStatus('saved');

    // Immediately trigger background alignment validation on section update
    runBackgroundValidation(activeKey, activeContent);
  };

  const handleCopySection = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  const handleRefineSubmit = async (instruction: string) => {
    if (!instruction.trim()) return;
    setIsRefining(true);
    setRefineError(null);

    try {
      const updated = await ApiService.refineSection(
        activeKey,
        SECTION_METADATA[activeKey].title,
        activeContent,
        instruction,
        project.parameters,
        project.parameters.learningObjectives
      );

      setActiveContent(updated);
      onUpdateSection(activeKey, updated);
      setIsDirty(false);
      setSaveStatus('saved');
      setShowRefineModal(false);
      setRefinePrompt('');

      // Immediately review updated section against learning objectives
      runBackgroundValidation(activeKey, updated);
    } catch (err: any) {
      setRefineError(err?.message || 'Gagal merevisi bagian ini.');
    } finally {
      setIsRefining(false);
    }
  };

  const [consistencyError, setConsistencyError] = useState<string | null>(null);

  const handleRunConsistencyCheck = async () => {
    setIsAuditing(true);
    setConsistencyError(null);
    setDrawerMode('consistency');
    try {
      const report = await ApiService.checkConsistency(project.parameters, project.package);
      setConsistencyReport(report);
    } catch (err: any) {
      setConsistencyError(err?.message || 'Kendala jaringan saat memeriksa modul.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || isChatSending) return;

    const userMsg: AssistantChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setIsChatSending(true);

    try {
      const reply = await ApiService.chatWithAssistant(
        textToSend.trim(),
        SECTION_METADATA[activeKey].title,
        project.parameters,
        activeContent
      );

      const assistantMsg: AssistantChatMessage = {
        id: 'msg-reply-' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          role: 'assistant',
          content: 'Maaf, terjadi kendala saat memproses respons AI: ' + (err?.message || 'Koneksi terputus'),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleSelectSection = (key: keyof LearningPackage) => {
    if (isDirty) {
      onUpdateSection(activeKey, activeContent);
    }
    setActiveKey(key);
    setShowMobileSectionSheet(false);
  };

  const goToPrevSection = () => {
    if (activeIndex > 0) {
      handleSelectSection(sectionKeys[activeIndex - 1]);
    }
  };

  const goToNextSection = () => {
    if (activeIndex < sectionKeys.length - 1) {
      handleSelectSection(sectionKeys[activeIndex + 1]);
    }
  };

  const getWordCount = (str: string) => {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] md:h-[calc(100vh-65px)] bg-slate-100 overflow-hidden font-sans pb-16 md:pb-0">
      {/* Workspace Top Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-5 py-2 sm:py-2.5 shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0 min-h-[40px] px-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <span className="text-slate-200 hidden sm:inline">|</span>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold text-slate-900 truncate">
              {project.title}
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
              <span className="text-emerald-900 font-bold">{project.parameters.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{project.parameters.gradePhase}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* View Mode Switcher (Doc Preview vs Edit) */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[34px] sm:min-h-[36px] ${
                viewMode === 'preview'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Pratinjau</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[34px] sm:min-h-[36px] ${
                viewMode === 'edit'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Edit</span>
            </button>
          </div>

          <button
            onClick={handleRunConsistencyCheck}
            disabled={isAuditing}
            title="Cek Keselarasan"
            className={`flex items-center gap-1 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer min-h-[38px] ${
              drawerMode === 'consistency'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span className="hidden lg:inline">
              {isAuditing ? 'Menganalisis...' : 'Audit'}
            </span>
          </button>

          <button
            onClick={() => setDrawerMode(drawerMode === 'assistant' ? 'closed' : 'assistant')}
            title="Asisten AI"
            className={`flex items-center gap-1 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer min-h-[38px] ${
              drawerMode === 'assistant'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-emerald-700" />
            <span className="hidden lg:inline">Asisten</span>
          </button>

          <button
            onClick={() => onExportDocx(project)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-900 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 active:scale-98 transition-all cursor-pointer min-h-[38px]"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ekspor Word</span>
            <span className="sm:hidden">DOCX</span>
          </button>
        </div>
      </div>

      {/* Mobile-Only Section Step Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
        <button
          onClick={goToPrevSection}
          disabled={activeIndex === 0}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dropdown trigger to open all 11 sections */}
        <button
          onClick={() => setShowMobileSectionSheet(true)}
          className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-left cursor-pointer"
        >
          <div className="truncate pr-2">
            <span className="text-[10px] font-bold text-emerald-800 block">
              Bagian {activeIndex + 1} / 11
            </span>
            <span className="text-xs font-extrabold text-slate-900 truncate block">
              {SECTION_METADATA[activeKey].title}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </button>

        <button
          onClick={goToNextSection}
          disabled={activeIndex === sectionKeys.length - 1}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Left Section Drawer (hidden on mobile) */}
        <aside className="hidden md:flex w-64 sm:w-72 bg-white border-r border-slate-200 flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Struktur Kurikulum
              </span>
              <span className="text-xs font-extrabold text-slate-800">
                11 Bagian Terpadu
              </span>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              100% Siap Cetak
            </span>
          </div>

          <div className="p-2 space-y-1 flex-1">
            {sectionKeys.map((key, idx) => {
              const meta = SECTION_METADATA[key];
              const isActive = activeKey === key;
              const words = getWordCount(project.package[key] || '');

              return (
                <button
                  key={key}
                  onClick={() => handleSelectSection(key)}
                  className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-900 text-white font-bold shadow-md'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate block leading-tight">{meta.title}</span>
                      {sectionValidationMap[key] &&
                        (!sectionValidationMap[key].isAligned ||
                          sectionValidationMap[key].status === 'drifted' ||
                          sectionValidationMap[key].status === 'warning') && (
                          <span
                            title="Terdeteksi pergeseran keselarasan dari TP"
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-2xs"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                          </span>
                        )}
                    </div>
                    <span
                      className={`text-[10px] font-mono block mt-1 ${
                        isActive ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {words} kata
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Canvas Stage */}
        <main className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
          {/* Section Action Bar */}
          <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 shrink-0 shadow-2xs">
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Bagian {activeIndex + 1} / 11
              </span>
              <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] lg:max-w-none">
                {SECTION_METADATA[activeKey].title}
              </span>

              {/* Background Alignment Status Pill */}
              {isValidatingAlignment ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                  <span className="hidden md:inline">Validasi TP...</span>
                </span>
              ) : alignmentDriftAlert &&
                (!alignmentDriftAlert.isAligned ||
                  alignmentDriftAlert.status === 'drifted' ||
                  alignmentDriftAlert.status === 'warning') ? (
                <button
                  type="button"
                  onClick={() => setDismissedAlert(false)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer shadow-2xs"
                  title="Klik untuk membuka catatan penyimpangan keselarasan"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                  <span>Keselarasan Bergeser ({alignmentDriftAlert.driftScore}/100)</span>
                </button>
              ) : sectionValidationMap[activeKey]?.isAligned ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span className="hidden md:inline">Selaras TP</span>
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopySection}
                  title="Salin teks bagian ini ke clipboard"
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[38px]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                  <span className="hidden xs:inline">{copied ? 'Tersalin' : 'Salin'}</span>
                </button>

                <button
                  onClick={() => setShowRefineModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer min-h-[38px]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Revisi Seksi</span>
                </button>
              </div>

              {viewMode === 'edit' && (
                <button
                  onClick={handleSaveContent}
                  disabled={!isDirty}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-900 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-40 transition-all cursor-pointer min-h-[38px]"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan</span>
                </button>
              )}
            </div>
          </div>

          {/* Paper View Container */}
          <div className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto">
            {/* Alignment Drift Alert Banner */}
            {alignmentDriftAlert &&
              (!alignmentDriftAlert.isAligned ||
                alignmentDriftAlert.status === 'drifted' ||
                alignmentDriftAlert.status === 'warning') &&
              !dismissedAlert && (
                <div className="max-w-4xl mx-auto mb-5 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 p-4 sm:p-5 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm ring-4 ring-amber-100">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md">
                            Peringatan Keselarasan (Alignment Drift)
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-950 bg-white border border-amber-300 px-2 py-0.5 rounded-md">
                            Seksi: {alignmentDriftAlert.sectionTitle}
                          </span>
                          <span
                            className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-md ${
                              alignmentDriftAlert.driftScore < 70
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-amber-100 text-amber-950 border border-amber-300'
                            }`}
                          >
                            Skor: {alignmentDriftAlert.driftScore}/100
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-bold text-slate-900 mb-2 leading-relaxed">
                          {alignmentDriftAlert.driftMessage}
                        </p>

                        {alignmentDriftAlert.driftedPoints && alignmentDriftAlert.driftedPoints.length > 0 && (
                          <div className="my-2.5 bg-white/90 rounded-xl p-3 border border-amber-200/80 text-xs">
                            <span className="font-bold text-amber-950 block mb-1">
                              Catatan Pergeseran dari Tujuan Pembelajaran:
                            </span>
                            <ul className="space-y-1 pl-1">
                              {alignmentDriftAlert.driftedPoints.map((pt, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2 text-slate-700">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {alignmentDriftAlert.suggestedRemedy && (
                          <div className="my-2 text-xs bg-emerald-50/90 rounded-xl p-3 border border-emerald-200 text-emerald-950">
                            <strong className="text-emerald-900">Saran Perbaikan: </strong>
                            <span>{alignmentDriftAlert.suggestedRemedy}</span>
                          </div>
                        )}

                        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60">
                          {alignmentDriftAlert.suggestedRemedy && (
                            <button
                              type="button"
                              onClick={() => {
                                setRefinePrompt(alignmentDriftAlert.suggestedRemedy || '');
                                setShowRefineModal(true);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-900 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Perbaiki dengan AI</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDrawerMode('consistency')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                            <span>Buka Audit Lengkap</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDismissedAlert(true)}
                            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-black/5 transition-colors cursor-pointer ml-auto"
                          >
                            Tutup Sementara
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            {viewMode === 'preview' ? (
              <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 lg:p-12 shadow-md min-h-full">
                <DocumentPreview
                  sectionKey={activeKey}
                  content={activeContent}
                  parameters={project.parameters}
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto h-full flex flex-col bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-md">
                <div className="mb-2 pb-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Penyunting Teks Langsung</span>
                  <span className="font-mono">{getWordCount(activeContent)} kata</span>
                </div>
                <textarea
                  value={activeContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Ketik atau edit draf modul ajar di sini..."
                  className="flex-1 w-full resize-none font-sans text-base sm:text-sm leading-relaxed text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            )}
          </div>
        </main>

        {/* Right Drawer (Desktop Sidebar OR Mobile Bottom Sheet Modal) */}
        {drawerMode !== 'closed' && (
          <aside className="fixed md:static inset-x-0 bottom-0 top-16 md:top-auto z-40 md:z-20 md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0 shadow-2xl rounded-t-3xl md:rounded-none overflow-hidden">
            {/* Grab Handle for Mobile Touch */}
            <div className="md:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2" />

            {/* Drawer Header & Tabs */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex gap-2">
                <button
                  onClick={() => setDrawerMode('assistant')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[36px] ${
                    drawerMode === 'assistant'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Asisten AI
                </button>
                <button
                  onClick={() => setDrawerMode('consistency')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[36px] ${
                    drawerMode === 'consistency'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Audit Keselarasan
                </button>
              </div>

              <button
                onClick={() => setDrawerMode('closed')}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 md:hidden" />
                <ChevronRight className="h-4 w-4 hidden md:block" />
              </button>
            </div>

            {/* ASSISTANT CHAT TAB */}
            {drawerMode === 'assistant' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 text-xs text-emerald-950">
                  <span className="font-bold block">Konteks Bagian Aktif:</span>
                  <span className="text-emerald-800">{SECTION_METADATA[activeKey].title}</span>
                </div>

                {/* Quick Teacher Prompt Chips */}
                <div className="p-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
                  <button
                    onClick={() => handleSendChat('Sederhanakan bahasa bagian ini agar lebih mudah dipahami siswa.')}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer font-medium shrink-0 min-h-[32px]"
                  >
                    Bahasa Ringkas
                  </button>
                  <button
                    onClick={() => handleSendChat('Ubah agar aktivitas dapat berjalan optimal tanpa gawai/ponsel siswa.')}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer font-medium shrink-0 min-h-[32px]"
                  >
                    Luring Tanpa Ponsel
                  </button>
                  <button
                    onClick={() => handleSendChat('Tingkatkan taraf kognitif pertanyaan menjadi bernalar kritis (HOTS).')}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer font-medium shrink-0 min-h-[32px]"
                  >
                    Taraf HOTS
                  </button>
                </div>

                {/* Chat Messages Log */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col text-xs leading-relaxed ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl p-3.5 max-w-[92%] ${
                          msg.role === 'user'
                            ? 'bg-emerald-900 text-white'
                            : 'bg-slate-50 text-slate-800 border border-slate-200 whitespace-pre-wrap'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {isChatSending && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-600" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-600 delay-100" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-600 delay-200" />
                      <span>Asisten menganalisis...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="p-3 border-t border-slate-200 bg-white"
                >
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Tanya saran atau instruksi revisi..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 pr-10 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isChatSending || !chatInput.trim()}
                      className="absolute right-2.5 bottom-3.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-emerald-900 text-white disabled:opacity-40 hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CONSISTENCY AUDITOR TAB */}
            {drawerMode === 'consistency' && (
              <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Audit Keselarasan Vertikal</h3>
                    <p className="text-[11px] text-slate-500">Korelasi TP, LKPD, Soal & Rubrik</p>
                  </div>
                  <button
                    onClick={handleRunConsistencyCheck}
                    disabled={isAuditing}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Jalankan audit ulang"
                  >
                    <RefreshCw className={`h-4 w-4 text-slate-600 ${isAuditing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {consistencyError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Pemeriksaan Terkendala</span>
                      <span>{consistencyError}</span>
                    </div>
                  </div>
                )}

                {consistencyReport ? (
                  <>
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-900">Indeks Keselarasan</span>
                        <span className="text-2xl font-black text-emerald-950 font-mono">
                          {consistencyReport.overallScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        {consistencyReport.summary}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {consistencyReport.items.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-900">{item.component}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                item.status === 'sesuai'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'perhatian'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.status === 'sesuai'
                                ? '✓ Selaras'
                                : item.status === 'perhatian'
                                ? 'Perlu Dicek'
                                : 'Perbaiki'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-2 leading-relaxed">{item.finding}</p>
                          {item.recommendation && (
                            <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl text-slate-700 border border-slate-100">
                              <strong className="text-slate-900">Saran:</strong> {item.recommendation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 mb-4">
                      Belum ada audit keselarasan untuk draf modul ini.
                    </p>
                    <button
                      onClick={handleRunConsistencyCheck}
                      disabled={isAuditing}
                      className="px-5 py-3 rounded-xl bg-emerald-900 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer min-h-[44px]"
                    >
                      {isAuditing ? 'Sedang Memeriksa...' : 'Mulai Analisis Keselarasan'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Section Sheet Modal (Pattern 3 Bottom Sheet) */}
      {showMobileSectionSheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-xs md:hidden">
          <div className="w-full max-h-[85vh] bg-white rounded-t-3xl p-5 flex flex-col shadow-2xl overflow-hidden">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Pilih Bagian Modul Ajar</h3>
              <button
                onClick={() => setShowMobileSectionSheet(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 py-3 flex-1">
              {sectionKeys.map((key, idx) => {
                const meta = SECTION_METADATA[key];
                const isActive = activeKey === key;
                const words = getWordCount(project.package[key] || '');

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectSection(key)}
                    className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex items-center justify-between min-h-[48px] ${
                      isActive
                        ? 'bg-emerald-900 text-white font-bold'
                        : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{meta.title}</span>
                      {sectionValidationMap[key] &&
                        (!sectionValidationMap[key].isAligned ||
                          sectionValidationMap[key].status === 'drifted' ||
                          sectionValidationMap[key].status === 'warning') && (
                          <span
                            title="Terdeteksi pergeseran keselarasan dari TP"
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-2xs"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                          </span>
                        )}
                    </div>
                    <span
                      className={`text-[11px] font-mono shrink-0 ${
                        isActive ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {words} kata
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Single Section AI Refinement Modal */}
      {showRefineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-emerald-900 mb-2">
              <Sparkles className="h-5 w-5 text-emerald-700" />
              <h3 className="text-base font-extrabold text-slate-900">
                Revisi Khusus: {SECTION_METADATA[activeKey].title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              AI hanya memperbarui bagian ini tanpa mengubah bagian modul lainnya.
            </p>

            {refineError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {refineError}
              </div>
            )}

            {/* Quick Suggestions for This Section */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                Pilih Instruksi Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setRefinePrompt('Sederhanakan instruksi dan bahasa agar lebih komunikatif.')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[34px]"
                >
                  Bahasa Lebih Ringkas
                </button>
                <button
                  type="button"
                  onClick={() => setRefinePrompt('Sesuaikan kegiatan agar bisa dilakukan penuh luring tanpa internet atau gadget siswa.')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[34px]"
                >
                  Luring Tanpa Ponsel
                </button>
                <button
                  type="button"
                  onClick={() => setRefinePrompt('Tingkatkan kedalaman analisis dan tambahkan contoh kontekstual nyata.')}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[34px]"
                >
                  Kontekstual Nyata
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instruksi Spesifik Anda:
              </label>
              <textarea
                rows={3}
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="Tuliskan perbaikan apa yang Anda inginkan..."
                className="w-full rounded-2xl border border-slate-200 p-3 text-base sm:text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRefineModal(false)}
                disabled={isRefining}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleRefineSubmit(refinePrompt)}
                disabled={isRefining || !refinePrompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-900 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-40 transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                {isRefining ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Memperbarui...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Terapkan Revisi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
