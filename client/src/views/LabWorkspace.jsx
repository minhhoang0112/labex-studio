import React, { useState, useEffect, useRef, useCallback } from 'react';
import LabGuide from '../components/LabGuide';
import Terminal from '../components/Terminal';
import AiTutor from '../components/AiTutor';
import Dialog from '../components/Dialog';
import WindowsConsole from '../components/WindowsConsole';
import { 
  Server,
  ArrowLeft, 
  Bot, 
  TerminalSquare, 
  RefreshCw, 
  CheckCircle2, 
  RotateCcw, 
  Monitor, 
  Code2, 
  Globe, 
  X,
  AlertTriangle,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Trophy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { labProgress, saveProgress, resetLocalLabProgress, unmarkProgressStep } from '../lib/progress';

export default function LabWorkspace({ labId, courseId, onBackToCourse, onStartLab }) {
  const [lab, setLab] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [labEnvInfo, setLabEnvInfo] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [environmentAttempt, setEnvironmentAttempt] = useState(0);
  const [environmentError, setEnvironmentError] = useState('');
  const [environmentLoading, setEnvironmentLoading] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [terminalStarted, setTerminalStarted] = useState(false);
  const [mobilePane, setMobilePane] = useState('guide');
  const [desktopLayout, setDesktopLayout] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const [inlineAi, setInlineAi] = useState(() => window.matchMedia('(min-width: 1280px)').matches);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const wide = window.matchMedia('(min-width: 1280px)');
    const update = () => { setDesktopLayout(desktop.matches); setInlineAi(wide.matches); };
    desktop.addEventListener('change', update); wide.addEventListener('change', update);
    return () => { desktop.removeEventListener('change', update); wide.removeEventListener('change', update); };
  }, []);

  // Sections navigation
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [passed, setPassed] = useState([]);

  // Terminal & AI state
  const [lastTerminalOutput, setLastTerminalOutput] = useState('');
  const [aiExternalPrompt, setAiExternalPrompt] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeEnvTab, setActiveEnvTab] = useState('terminal'); // 'terminal' | 'desktop' | 'webide' | 'web8080'
  const [webPreviewKey, setWebPreviewKey] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const prevCompleteRef = useRef(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Language state
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('labex.language') || 'vi'; } catch { return 'vi'; }
  });

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || localStorage.getItem('labex.language') || 'vi');
    window.addEventListener('labex-lang-change', onLang);
    return () => window.removeEventListener('labex-lang-change', onLang);
  }, []);

  const taskSteps = Array.isArray(lab?.steps) ? lab.steps : [];
  const complete = taskSteps.length > 0 && taskSteps.every(step => passed.includes(step.id));

  useEffect(() => {
    if (complete && !prevCompleteRef.current) {
      setShowCompletionModal(true);
    }
    prevCompleteRef.current = complete;
  }, [complete]);

  // Verification request guard generation
  const [verificationEpoch, setVerificationEpoch] = useState(0);

  // Resizable split state (percentage of width for left guide panel)
  const [leftWidthPercent, setLeftWidthPercent] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('labex.split.leftWidth'));
      return saved >= 20 && saved <= 70 ? saved : 40;
    } catch {
      return 40;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const dragCleanup = useRef(null);
  const containerRef = useRef(null);

  const startResizing = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragCleanup.current?.();
    setIsResizing(true);
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== e.pointerId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = moveEvent.clientX - rect.left;
      const usable = rect.width - (isAiOpen && inlineAi ? 400 : 0) - 10;
      const minPercent = Math.max(20, 280 / usable * 100);
      const maxPercent = Math.min(70, (usable - 320) / usable * 100);
      setLeftWidthPercent(Math.max(minPercent, Math.min(maxPercent, currentX / usable * 100)));
    };

    const cleanup = () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('blur', onEnd);
      dragCleanup.current = null;
    };
    const onEnd = () => {
      cleanup();
      setIsResizing(false);
      window.dispatchEvent(new Event('resize'));
    };
    dragCleanup.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('blur', onEnd);
  }, [isAiOpen, inlineAi]);

  useEffect(() => () => dragCleanup.current?.(), []);
  useEffect(() => { dragCleanup.current?.(); setIsResizing(false); }, [desktopLayout, inlineAi, isAiOpen, currentSectionIndex]);

  useEffect(() => {
    try {
      localStorage.setItem('labex.split.leftWidth', String(leftWidthPercent));
    } catch {
      /* Optional */
    }
  }, [leftWidthPercent]);

  useEffect(() => {
    const controller = new AbortController();
    setEnvironmentError(''); setEnvironmentLoading(true);
    setLabEnvInfo(null); setSetupError('');
    api('/api/environment', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setEnvironment(data); })
      .catch(e => { if (e.name !== 'AbortError') setEnvironmentError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setEnvironmentLoading(false); });

    // Fetch lab environment status (reset_required, etc.)
    api(`/api/labs/${encodeURIComponent(labId)}/environment`, { signal: controller.signal })
      .then(setLabEnvInfo)
      .catch(e => { if (e.name !== 'AbortError') setSetupError(e.message); });
    return () => controller.abort();
  }, [labId, attempt, environmentAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    setError(''); setLab(null); setSiblings([]);
    setLastTerminalOutput(''); setAiExternalPrompt(null);
    setVerificationEpoch(value => value + 1);
    // Fetch lab content
    const contextQuery = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    api(`/api/labs/${encodeURIComponent(labId)}${contextQuery}`, { signal: controller.signal })
      .then(async data => {
        if (controller.signal.aborted) return;
        const sections = Array.isArray(data.sections) && data.sections.length > 0
          ? data.sections
          : data.steps || [];
        if (!data.id || !sections.length) {
          throw new Error('Bài lab chưa có nội dung thực hành.');
        }

        const saved = labProgress(data.id);
        const validTaskIds = Array.isArray(data.step_ids) && data.step_ids.length
          ? data.step_ids
          : (data.steps || []).map(s => s.id);

        const currentPassed = Array.isArray(saved.passed)
          ? saved.passed.filter(id => validTaskIds.includes(id))
          : [];
        setPassed(currentPassed);

        // Resume section position if recorded
        let targetIndex = 0;
        if (saved.currentSectionId) {
          const idx = sections.findIndex(s => s.id === saved.currentSectionId);
          if (idx >= 0) targetIndex = idx;
        }
        setCurrentSectionIndex(targetIndex);
        setLab(data);
        if (data.id?.startsWith('win-') || data.course_id?.includes('win')) {
          setActiveEnvTab('windows');
        }

        // Fetch sibling course labs
        try {
          const course = await api(`/api/courses/${encodeURIComponent(data.course_id)}`, { signal: controller.signal });
          if (!controller.signal.aborted) setSiblings((course.labs || []).filter(item => item.availability?.can_open === true));
        } catch {
          /* Optional */
        }
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message);
      });

    return () => controller.abort();
  }, [labId, courseId, attempt]);

  const sections = Array.isArray(lab?.sections) && lab.sections.length > 0
    ? lab.sections
    : lab?.steps || [];
  const currentSection = sections[currentSectionIndex] || sections[0];
  const isDocFullscreen = currentSection?.layout === 'doc-fullscreen';
  const isWindowsLab = Boolean(lab?.id?.startsWith('win-') || lab?.course_id?.includes('win'));
  const terminalAllowed = lab?.availability?.can_start_terminal === true &&
    environment?.available === true && environment?.capabilities?.terminal === true;
  useEffect(() => {
    if (terminalAllowed && !isDocFullscreen) setTerminalStarted(true);
  }, [terminalAllowed, isDocFullscreen]);

  const changeSection = index => {
    if (!Number.isInteger(index) || index < 0 || index >= sections.length) return;
    setCurrentSectionIndex(index);
    const targetSection = sections[index];
    saveProgress(lab, targetSection?.id);
  };

  const verified = stepId => {
    const targetSection = sections[currentSectionIndex];
    const saved = saveProgress(lab, targetSection?.id, stepId);
    setPassed(saved.passed);
  };

  const unverified = stepId => {
    const saved = unmarkProgressStep(lab, stepId);
    setPassed(saved.passed || []);
  };

  const handleResetLab = async () => {
    if (!lab?.id || isResetting) return;
    setIsResetting(true);
    setResetNotice(null);
    setVerificationEpoch(value => value + 1);

    try {
      await api(`/api/labs/${encodeURIComponent(lab.id)}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmReset: true })
      });
      // Clear local progress strictly for this lab
      resetLocalLabProgress(lab.id);
      setTerminalStarted(false); setShowCompletionModal(false);
      setPassed([]);
      setCurrentSectionIndex(0);
      setResetNotice({
        success: true,
        message: 'Đã khởi tạo lại môi trường Linux và xóa tiến độ bài này.'
      });
      setResetConfirmOpen(false);
      // Trigger reload of terminal session and environment probe by bumping attempt
      setAttempt(v => v + 1);
    } catch (e) {
      setResetNotice({
        success: false,
        message: e.message || 'Không thể khởi tạo lại môi trường.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (!lab) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-6 text-center">
        {error ? (
          <>
            <p role="alert" className="text-red-400 font-medium">{error}</p>
            <div className="flex gap-3">
              <button onClick={() => setAttempt(value => value + 1)} className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700">Thử lại</button>
              <button onClick={() => onBackToCourse()} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700">Về danh mục khóa học</button>
            </div>
          </>
        ) : (
          <>
            <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
            <p className="text-slate-300">Đang nạp bài thực hành Linux...</p>
          </>
        )}
      </div>
    );
  }

  const position = siblings.findIndex(item => item.id === lab.id);
  const prev = position > 0 ? siblings[position - 1] : null;
  const next = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null;

  const caps = environment?.capabilities || {
    terminal: false,
    desktop: false,
    webide: false,
    network: false
  };
  const webPreviewUrl = environment?.services?.web8080?.url;
  const canPreviewWeb = caps.web8080 === true && typeof webPreviewUrl === 'string' && webPreviewUrl.startsWith('/');
  const openLab = id => onStartLab(id, lab.course_id);
  const guideVisible = isDocFullscreen || desktopLayout || mobilePane === 'guide';

  return (
    <div className="h-dvh w-full flex flex-col bg-slate-950 overflow-hidden text-slate-100 select-none">
      {/* Top Navbar matching authentic LabEx Workbench */}
      <header className="min-h-12 bg-slate-950 border-b border-slate-800 px-2 sm:px-4 py-2 flex flex-wrap gap-2 items-center justify-between shrink-0 z-20">
        {/* Left: Breadcrumb, Prev/Next & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => onBackToCourse(lab.course_id)} 
            aria-label="Về khóa học"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Khóa học</span>
          </button>
          <span className="text-slate-600">|</span>

          {/* Quick Prev / Next Navigation */}
          {siblings.length > 0 && (
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => prev && openLab(prev.id)}
                disabled={!prev}
                title={prev ? `Bài trước: ${(lang === 'vi' && prev.title_vi) ? prev.title_vi : prev.title}` : 'Đây là bài đầu tiên'}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 whitespace-nowrap">
                {position >= 0 ? `${position + 1}/${siblings.length}` : ''}
              </span>
              <button
                onClick={() => next && openLab(next.id)}
                disabled={!next}
                title={next ? `Bài tiếp: ${(lang === 'vi' && next.title_vi) ? next.title_vi : next.title}` : 'Đây là bài cuối cùng'}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            lab.type === 'challenge' 
              ? 'bg-amber-950 text-amber-300 border border-amber-800' 
              : 'bg-primary-950 text-primary-300 border border-primary-800'
          }`}>
            {lab.type === 'challenge' ? 'Thử thách' : 'Bài Lab'}
          </span>
          <h1 className="font-semibold text-sm text-slate-200 truncate max-w-[45vw] sm:max-w-xs">
            {(lang === 'vi' && lab.title_vi) ? lab.title_vi : lab.title}
          </h1>
        </div>

        {/* Center: Environment Tabs (Desktop / WebIDE / Terminal / Web 8080) */}
        <div className="hidden xl:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                    {/* Windows Console Tab */}
          {isWindowsLab && (
            <button
              onClick={() => setActiveEnvTab('windows')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
                activeEnvTab === 'windows'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}>
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Windows Console</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            </button>
          )}

          {/* Desktop Tab */}
          <button
            onClick={() => caps.desktop && setActiveEnvTab('desktop')}
            disabled={!caps.desktop}
            title={caps.desktop ? 'Desktop GUI' : 'Desktop GUI (Môi trường Linux CLI này chưa có giao diện đồ họa)'}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
              activeEnvTab === 'desktop' && caps.desktop
                ? 'bg-primary-600 text-white font-medium shadow-sm'
                : 'text-slate-500 cursor-not-allowed opacity-60'
            }`}>
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
            {!caps.desktop && <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-400">N/A</span>}
          </button>

          {/* WebIDE Tab */}
          <button
            onClick={() => caps.webide && setActiveEnvTab('webide')}
            disabled={!caps.webide}
            title={caps.webide ? 'WebIDE (VSCode)' : 'WebIDE (Môi trường hiện tại sử dụng Shell Terminal thuần)'}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
              activeEnvTab === 'webide' && caps.webide
                ? 'bg-primary-600 text-white font-medium shadow-sm'
                : 'text-slate-500 cursor-not-allowed opacity-60'
            }`}>
            <Code2 className="w-3.5 h-3.5" />
            <span>WebIDE</span>
            {!caps.webide && <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-400">N/A</span>}
          </button>

          {/* Terminal Tab */}
          <button
            onClick={() => setActiveEnvTab('terminal')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
              activeEnvTab === 'terminal'
                ? 'bg-primary-600 text-white font-medium shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}>
            <TerminalSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {/* Web 8080 Tab */}
          <button
            onClick={() => canPreviewWeb && setActiveEnvTab('web8080')}
            disabled={!canPreviewWeb}
            title={canPreviewWeb ? 'Mở dịch vụ Web của bài này' : 'Chưa có dịch vụ Web 8080 được kết nối cho bài này'}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition ${
              activeEnvTab === 'web8080'
                ? 'bg-primary-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}>
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Web 8080</span>
            {!canPreviewWeb && <span className="text-[9px]">N/A</span>}
          </button>
        </div>

        {/* Right: Split Presets, Reset Environment & AI Tutor Trigger */}
        <div className="flex items-center gap-2">
          {/* Quick Split Controls */}
          {!isDocFullscreen && (
            <div className="hidden lg:flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono text-slate-400">
              <button 
                onClick={() => setLeftWidthPercent(35)}
                title="Rộng Terminal (35% Hướng dẫn / 65% Terminal)"
                className={`px-2 py-0.5 rounded transition ${Math.round(leftWidthPercent) === 35 ? 'bg-slate-800 text-primary-400 font-bold' : 'hover:text-slate-200'}`}>
                35%
              </button>
              <button 
                onClick={() => setLeftWidthPercent(45)}
                title="Cân bằng (45% Hướng dẫn / 55% Terminal)"
                className={`px-2 py-0.5 rounded transition ${Math.round(leftWidthPercent) === 45 ? 'bg-slate-800 text-primary-400 font-bold' : 'hover:text-slate-200'}`}>
                45%
              </button>
              <button 
                onClick={() => setLeftWidthPercent(55)}
                title="Rộng Hướng dẫn (55% Hướng dẫn / 45% Terminal)"
                className={`px-2 py-0.5 rounded transition ${Math.round(leftWidthPercent) === 55 ? 'bg-slate-800 text-primary-400 font-bold' : 'hover:text-slate-200'}`}>
                55%
              </button>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => {
              const next = lang === 'vi' ? 'en' : 'vi';
              setLang(next);
              try { localStorage.setItem('labex.language', next); } catch { /* Optional */ }
              window.dispatchEvent(new CustomEvent('labex-lang-change', { detail: next }));
            }}
            title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition">
            <span>{lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
          </button>

          {/* Reset Environment Button */}
          <button
            onClick={() => setResetConfirmOpen(true)}
            aria-label="Khởi động lại Lab"
            title="Khởi tạo lại môi trường bài thực hành này"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Khởi động lại Lab</span>
          </button>

          {/* Labby AI Tutor Trigger Button */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            aria-expanded={isAiOpen}
            aria-controls="workspace-ai"
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition border ${
              isAiOpen
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}>
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Labby AI</span>
          </button>
        </div>
      </header>

      {!isDocFullscreen && <nav className="flex md:hidden shrink-0 gap-2 px-3 py-2 border-b border-slate-800" aria-label="Chọn vùng thực hành">
        <button aria-pressed={mobilePane === 'guide'} onClick={() => setMobilePane('guide')} className={mobilePane === 'guide' ? 'px-3 py-1 rounded text-sm bg-primary-600' : 'px-3 py-1 rounded text-sm bg-slate-800'}>Hướng dẫn</button>
        <button aria-pressed={mobilePane === 'terminal'} onClick={() => setMobilePane('terminal')} className={mobilePane === 'terminal' ? 'px-3 py-1 rounded text-sm bg-primary-600' : 'px-3 py-1 rounded text-sm bg-slate-800'}>Terminal</button>
      </nav>}
      {(environmentError || (!environmentLoading && environment?.available === false) || setupError) && <div role="alert" className="shrink-0 flex flex-wrap gap-2 items-center justify-between px-4 py-2 text-xs bg-red-950 text-red-200">
        <span>{environmentError || environment?.reason || setupError || 'Môi trường Linux chưa sẵn sàng.'}</span>
        <button onClick={() => setEnvironmentAttempt(value => value + 1)} className="underline">Thử lại môi trường</button>
      </div>}

      {/* Fixture Update Required Warning */}
      {labEnvInfo?.reset_required && (
        <div className="shrink-0 px-4 py-2 bg-amber-950/80 border-b border-amber-800 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Bộ dữ liệu thực hành của bài này đã có phiên bản cập nhật. Bạn nên khởi động lại bài học để áp dụng các fixture mới nhất.</span>
          </div>
          <button 
            onClick={() => setResetConfirmOpen(true)}
            className="ml-3 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shrink-0">
            Khởi động lại ngay
          </button>
        </div>
      )}

      {/* Completion Banner */}
      {complete && (
        <div role="status" className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-6 py-2 bg-emerald-950 text-emerald-200 border-b border-emerald-800 text-sm">
          <span 
            onClick={() => setShowCompletionModal(true)}
            className="flex items-center gap-2 font-semibold cursor-pointer hover:underline">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Chúc mừng! Bạn đã hoàn thành tất cả nhiệm vụ của bài thực hành này! (Bấm để xem tổng kết)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompletionModal(true)}
              className="px-3 py-1 rounded-md bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-semibold text-xs border border-emerald-700 transition flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Tổng kết</span>
            </button>
            <button 
              onClick={() => next ? openLab(next.id) : onBackToCourse(lab.course_id)}
              className="px-3.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm">
              {next ? `Bài tiếp theo: ${(lang === 'vi' && next.title_vi) ? next.title_vi : next.title}` : 'Xem tiến độ khóa học'} →
            </button>
          </div>
        </div>
      )}

      {/* Reset Feedback Notification */}
      {resetNotice && (
        <div className={`shrink-0 px-4 py-1.5 text-xs flex items-center justify-between ${
          resetNotice.success ? 'bg-blue-950 text-blue-200' : 'bg-red-950 text-red-200'
        }`}>
          <span>{resetNotice.message}</span>
          <button onClick={() => setResetNotice(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Transparent full-screen shield to prevent mouse event loss over terminal during drag */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
      )}

      {/* Main Workspace Body with Draggable Resizer & Side-by-Side Flex Layout */}
      <div ref={containerRef} className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Pane: Guide */}
        <div 
          data-testid="guide-pane"
          style={{ 
            display: guideVisible ? 'flex' : 'none',
            width: isDocFullscreen || !desktopLayout ? '100%' : `clamp(280px, calc(${leftWidthPercent}% - ${(isAiOpen && inlineAi ? 410 : 10) * leftWidthPercent / 100}px), calc(100% - ${isAiOpen && inlineAi ? 730 : 330}px))`,
            transition: 'none'
          }}
          className={`${
            isDocFullscreen ? 'w-full max-w-4xl mx-auto' : 'w-full md:w-auto'
          } h-full min-h-0 min-w-0 shrink-0 z-10 flex flex-col`}>
          <LabGuide 
            lab={lab} 
            currentSectionIndex={currentSectionIndex} 
            setCurrentSectionIndex={changeSection} 
            onVerified={verified} 
            verificationEpoch={verificationEpoch}
            disabledVerification={isResetting}
            onUnverified={unverified}
            passedSteps={passed} 
            lang={lang}
            onAskAi={prompt => { 
              setAiExternalPrompt({ text: prompt, id: Date.now() }); 
              setIsAiOpen(true); 
            }} 
            onNextLab={() => next ? openLab(next.id) : onBackToCourse(lab.course_id)}
            nextLab={next}
          />
        </div>

        {/* Draggable Divider Bar (Hidden if doc-fullscreen) */}
        {!isDocFullscreen && (
          <div
            onPointerDown={startResizing}
            role="separator"
            aria-label="Độ rộng hướng dẫn"
            aria-orientation="vertical"
            aria-valuemin={20}
            aria-valuemax={70}
            aria-valuenow={Math.round(leftWidthPercent)}
            tabIndex={0}
            onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const delta = event.shiftKey ? 10 : 2;
              setLeftWidthPercent(value => event.key === 'Home' ? 20 : event.key === 'End' ? 70 : Math.max(20, Math.min(70, value + (event.key === 'ArrowRight' ? delta : -delta))));
            }}
            title="Kéo sang trái/phải để điều chỉnh độ rộng 2 bên"
            className="hidden md:flex touch-none flex-col items-center justify-center w-2.5 bg-slate-900 hover:bg-primary-500 focus:bg-primary-500 cursor-col-resize shrink-0 z-20 group relative border-x border-slate-800">
            <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-white pointer-events-none" />
            <div className={`opacity-0 group-hover:opacity-100 ${isResizing ? '!opacity-100' : ''} absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl pointer-events-none transition-opacity z-30`}>
              {Math.round(leftWidthPercent)}% / {100 - Math.round(leftWidthPercent)}%
            </div>
          </div>
        )}

        {/* Center/Right Pane: Terminal Environment & Web 8080 Preview */}
        <div data-testid="terminal-pane" className={`flex-1 min-h-0 h-full flex-col p-2 bg-slate-950 overflow-hidden min-w-0 ${
          isDocFullscreen || (!desktopLayout && mobilePane !== 'terminal') ? 'hidden' : 'flex'
        }`}>
                    {/* Windows Server Console Simulator */}
          {activeEnvTab === 'windows' && isWindowsLab && (
            <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">
              <WindowsConsole 
                labId={lab.id} 
                onActionComplete={() => setVerificationEpoch(v => v + 1)} 
              />
            </div>
          )}

          {/* Terminal Session - ALWAYS kept mounted so PTY shell does not disconnect */}
          <div className={`flex-1 min-h-0 min-w-0 relative ${activeEnvTab === 'terminal' ? 'flex flex-col' : 'hidden'}`}>
            {terminalStarted && lab.availability?.can_start_terminal === true ? <Terminal
              labId={lab.id} 
              onOutput={chunk => setLastTerminalOutput(prev => (prev + chunk).slice(-4000))} 
            /> : <div role="status" className="m-auto p-6 text-center text-sm text-slate-300">
              {environmentLoading ? 'Đang kiểm tra môi trường Linux…' : lab.availability?.can_start_terminal !== true
                ? (lab.availability?.reasons || ['Bài này chưa hỗ trợ mở terminal.']).join(' ')
                : environmentError || 'Môi trường Linux chưa sẵn sàng.'}
              {!environmentLoading && lab.availability?.can_start_terminal === true && <button className="block mx-auto mt-3 underline" onClick={() => setEnvironmentAttempt(value => value + 1)}>Thử lại môi trường</button>}
            </div>}
          </div>

          {/* Web 8080 Preview Pane */}
          {activeEnvTab === 'web8080' && canPreviewWeb && (
            <div className="flex-1 min-h-0 flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
              {/* Web Browser Address Bar */}
              <div className="h-10 bg-slate-950 border-b border-slate-800 px-3 flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setWebPreviewKey(k => k + 1)}
                  title="Tải lại trang Web 8080"
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-mono">
                  <span className="text-slate-500 mr-1">http://</span>
                  <span>localhost:8080</span>
                  <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    Cổng 8080
                  </span>
                </div>
                <a 
                  href={webPreviewUrl}
                  target="_blank" 
                  rel="noreferrer"
                  title="Mở trong tab trình duyệt mới"
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              {/* Iframe View */}
              <div className="flex-1 min-h-0 bg-white relative">
                <iframe
                  key={webPreviewKey}
                  src={webPreviewUrl}
                  title="Web 8080 Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Labby AI Tutor (Kept mounted via CSS hidden to preserve chat history) */}
        <div id="workspace-ai" role="complementary" aria-label="Trợ lý Labby AI"
          className={`w-full sm:w-[400px] h-full min-h-0 min-w-0 shrink-0 border-l border-slate-800 bg-white dark:bg-slate-900 flex-col shadow-lg ${inlineAi ? 'relative z-10' : 'absolute inset-y-0 right-0 z-30'} ${isAiOpen ? 'flex' : 'hidden'}`}>
          <div className="h-10 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span>Trợ lý Labby AI</span>
            </div>
            <button 
              onClick={() => setIsAiOpen(false)}
              title="Đóng trợ lý AI"
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <AiTutor key={lab.id}
              lab={lab} 
              currentStep={taskSteps.find(s => s.id === currentSection?.id) || currentSection} 
              lastTerminalOutput={lastTerminalOutput} 
              externalPrompt={aiExternalPrompt} 
              onClearExternalPrompt={() => setAiExternalPrompt(null)} 
            />
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <Dialog titleId="reset-dialog-title" onClose={() => setResetConfirmOpen(false)} busy={isResetting} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 id="reset-dialog-title" className="text-lg font-bold text-white">Khởi động lại bài thực hành?</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Thao tác này sẽ đóng phiên shell hiện tại, khôi phục lại môi trường Linux ban đầu cho bài <strong>{lab.title}</strong>, và xóa các dấu tích hoàn thành của bài này trên máy của bạn.
            </p>
            <p className="text-xs text-slate-400">
              (Các bài học khác và toàn bộ tiến độ khóa học vẫn được giữ nguyên).
            </p>
            {resetNotice?.success === false && <p role="alert" className="text-sm text-red-300">{resetNotice.message}</p>}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isResetting}
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition">
                Hủy bỏ
              </button>
              <button
                disabled={isResetting}
                onClick={handleResetLab}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition flex items-center gap-2">
                {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>{isResetting ? 'Đang khởi tạo lại...' : 'Xác nhận khởi tạo lại'}</span>
              </button>
            </div>
        </Dialog>
      )}

      {/* Celebration Modal (Matching authentic LabEx finish popup) */}
      {showCompletionModal && (
        <Dialog titleId="completion-dialog-title" onClose={() => setShowCompletionModal(false)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center relative">
            {/* Background glowing aura */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-900/30">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>100% Hoàn thành xuất sắc</span>
              </div>
              <h2 id="completion-dialog-title" className="text-xl sm:text-2xl font-bold text-white mb-2">
                Chúc mừng bạn đã hoàn thành bài Lab!
              </h2>
              <p className="text-sm text-slate-300 max-w-sm">
                Bạn đã vượt qua toàn bộ <strong className="text-emerald-400">{taskSteps.length}/{taskSteps.length} nhiệm vụ</strong> thực hành của bài <strong>{(lang === 'vi' && lab.title_vi) ? lab.title_vi : lab.title}</strong>.
              </p>
            </div>

            {/* Next Lab Recommendation Box */}
            {next ? (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left">
                <span className="text-[11px] font-semibold text-primary-400 uppercase tracking-wider block mb-1">
                  Bài học tiếp theo trong lộ trình
                </span>
                <p className="text-sm font-bold text-white truncate">
                  {(lang === 'vi' && next.title_vi) ? next.title_vi : next.title}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Tiếp tục duy trì mạch tư duy và thực hành bài tiếp theo ngay bây giờ.
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-emerald-400">
                  Bạn đã hoàn thành bài thực hành này. Xem tiến độ các bài còn lại ở trang khóa học.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition">
                Xem lại bài này
              </button>
              {next ? (
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    openLab(next.id);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold shadow-lg shadow-primary-900/40 transition flex items-center justify-center gap-2">
                  <span>Vào bài tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    onBackToCourse(lab.course_id);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition">
                  Quay lại khóa học
                </button>
              )}
            </div>
        </Dialog>
      )}
    </div>
  );
}
