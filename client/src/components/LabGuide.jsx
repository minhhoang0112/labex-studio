import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import GuideImage from './GuideImage';
import remarkGfm from 'remark-gfm';
import { sourceMarkdown } from '../lib/sourceMarkdown';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Lightbulb, 
  Copy, 
  Check, 
  Play, 
  Loader2,
  BookOpen,
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function LabGuide({
  lab,
  currentSectionIndex,
  setCurrentSectionIndex,
  onAskAi,
  onVerified,
  onUnverified,
  passedSteps = [],
  onNextLab,
  nextLab,
  lang = 'vi',
  verificationEpoch = 0,
  disabledVerification = false
}) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [readingChoice, setReadingChoice] = useState(null);
  const request = useRef(null);
  const latestEpoch = useRef(verificationEpoch);
  useLayoutEffect(() => {
    latestEpoch.current = verificationEpoch;
    request.current?.abort();
    request.current = null;
    setIsVerifying(false);
    setVerificationResult(null);
  }, [verificationEpoch, lab?.id, currentSectionIndex]);

  useEffect(() => () => request.current?.abort(), []);

  // Sections navigation model
  const sections = Array.isArray(lab?.sections) && lab.sections.length > 0
    ? lab.sections
    : lab?.steps || [];
  const currentSection = sections[currentSectionIndex] || sections[0];
  const totalSections = sections.length;

  // Graded tasks count
  const taskSteps = Array.isArray(lab?.steps) ? lab.steps : [];
  const totalTasks = taskSteps.length;

  const isTask = currentSection?.kind === 'task';
  const isIntro = currentSection?.kind === 'introduction';
  const isSummary = currentSection?.kind === 'summary';

  // Join task metadata by id
  const matchingStep = isTask
    ? (taskSteps.find(s => s.id === currentSection.id) || currentSection)
    : null;

  const isAcknowledgement = matchingStep?.verification_kind === 'acknowledgement' &&
    matchingStep?.grading?.ready === true;

  // Tasks pending verification
  const unpassedSteps = taskSteps.filter(s => !passedSteps.includes(s.id));
  const isLabComplete = totalTasks > 0 && unpassedSteps.length === 0;

  // Unpassed acknowledgement tasks (can be confirmed directly without terminal commands)
  const unpassedAckSteps = unpassedSteps.filter(s =>
    s.verification_kind === 'acknowledgement' && s.grading?.ready === true
  );

  // Unpassed tasks that require actual terminal execution
  const unpassedExecSteps = unpassedSteps.filter(s => !unpassedAckSteps.includes(s));

  // Check grading readiness of this step
  const grading = matchingStep?.grading || { ready: false };
  const isGradingReady = grading.ready === true && !disabledVerification;

  const isCurrentSectionPassed = isTask && matchingStep && passedSteps.includes(matchingStep.id);

  // Multilingual content and title resolution
  const isVi = lang === 'vi';
  const choice=readingChoice?.id===currentSection?.id ? readingChoice.source : undefined;
  const useSource=currentSection?.source_text_verified && (choice ?? (!isVi || !currentSection.content_vi || currentSection.translation_needs_review));
  const activeTitle = (!useSource && isVi && currentSection?.title_vi) ? currentSection.title_vi : currentSection?.title;
  const content = (!useSource && isVi && currentSection?.content_vi) ? currentSection.content_vi : (currentSection?.content || '');
  const activeTask = (isVi && matchingStep?.task_vi) ? matchingStep.task_vi : (matchingStep?.task || '');
  const activeHint = (isVi && matchingStep?.hint_vi) ? matchingStep.hint_vi : (matchingStep?.hint || '');

  const leadingHeading = content.match(/^\s*#{1,6}\s+(.+?)(?:\r?\n|$)/);
  const normalizeTitle = value => (value || '').replace(/^[\d.\s]+/, '').replace(/[*_`]/g, '').trim().toLowerCase();
  const guideContent = leadingHeading && normalizeTitle(leadingHeading[1]) === normalizeTitle(activeTitle)
    ? content.slice(leadingHeading[0].length).trimStart()
    : content;

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setVerificationResult({
        passed: false,
        message: 'Không thể sao chép. Hãy chọn và chép lệnh trong khối mã.'
      });
    }
  };

  const verifyStep = async (step, isAck = false) => {
    if (!step || request.current || isVerifying || disabledVerification || step.grading?.ready !== true) return null;
    const controller = new AbortController();
    const epoch = latestEpoch.current;
    request.current = controller;
    setIsVerifying(true);

    try {
      const data = await api('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labId: lab.id,
          stepId: step.id,
          ...(isAck ? { acknowledge: true } : {})
        }),
        signal: controller.signal
      });
      if (controller.signal.aborted || epoch !== latestEpoch.current) return null;
      if (data.passed === true) {
        onVerified?.(step.id);
      } else {
        onUnverified?.(step.id);
      }
      return data;
    } catch (e) {
      if (e.name === 'AbortError' || controller.signal.aborted || epoch !== latestEpoch.current) return null;
      return {
        passed: false,
        message: e.message || 'Lỗi kết nối kiểm tra đến máy chủ local.',
        hint: e.hint || (e.status === 503 ? 'Môi trường Linux chưa sẵn sàng. Thử lại kết nối môi trường.' : undefined)
      };
    } finally {
      if (request.current === controller) { request.current = null; setIsVerifying(false); }
    }
  };

  const handleVerify = async () => {
    if (!matchingStep || isVerifying || !isGradingReady) return;
    setVerificationResult(null);
    const data = await verifyStep(matchingStep, isAcknowledgement);
    if (data) {
      setVerificationResult(data);
      if (data.passed === true && isAcknowledgement && currentSectionIndex < totalSections - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
      }
    }
  };

  const handleCompleteSummary = async () => {
    if (isVerifying) return;
    if (unpassedAckSteps.length > 0) {
      for (const step of unpassedAckSteps) {
        const result = await verifyStep(step, true);
        if (!result?.passed) break;
      }
    }
  };

  const handleFooterNext = async () => {
    if (isVerifying) return;

    // If currently on an unpassed acknowledgement step, acknowledge it first
    if (isAcknowledgement && !isCurrentSectionPassed && matchingStep) {
      const result = await verifyStep(matchingStep, true);
      if (result) setVerificationResult(result);
      if (result?.passed && currentSectionIndex < totalSections - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
      }
      return;
    }

    // If on the last section (e.g. Summary)
    if (currentSectionIndex >= totalSections - 1) {
      if (isLabComplete) {
        onNextLab?.();
      } else if (unpassedAckSteps.length > 0 && unpassedExecSteps.length === 0) {
        await handleCompleteSummary();
      } else if (unpassedExecSteps.length > 0) {
        const pendingIdx = sections.findIndex(s => s.id === unpassedExecSteps[0].id);
        if (pendingIdx >= 0) setCurrentSectionIndex(pendingIdx);
      }
      return;
    }

    // Normal progression to next section
    setCurrentSectionIndex(currentSectionIndex + 1);
    setVerificationResult(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              lab?.type === 'challenge' 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {lab?.type === 'challenge' ? 'Challenge' : 'Guided Lab'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lab?.difficulty || 'Beginner'} • {lab?.estimated_time || '25 mins'}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-1">
            {(isVi && lab?.title_vi) ? lab.title_vi : lab?.title}
          </h2>
        </div>

        {/* Task Counter badge */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>{passedSteps.length} / {totalTasks} hoàn thành</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Mục {currentSectionIndex + 1} / {totalSections}
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 shrink-0">
        <div 
          className="bg-primary-500 h-1 transition-all duration-300"
          style={{ width: `${totalTasks ? (passedSteps.length / totalTasks) * 100 : 0}%` }}
        />
      </div>

      {/* Main Guide Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        {/* Helpdesk Ticket Badge (If lab has an associated support ticket) */}
        {lab?.ticket && (
          <div className="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 p-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-amber-600 text-white shadow-xs">
                  TICKET {lab.ticket.ticket_id}
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {lab.ticket.department}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                lab.ticket.priority === 'Urgent' 
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              }`}>
                Ưu tiên: {lab.ticket.priority}
              </span>
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Người báo cáo: </span>
              <strong>{lab.ticket.requester}</strong>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-100/95 font-medium mt-1 italic border-l-2 border-amber-400 dark:border-amber-600 pl-2">
              "{lab.ticket.title}"
            </p>
          </div>
        )}

        {/* Section Picker Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Danh sách mục bài học:
          </label>
          <select 
            aria-label="Chọn mục bài học" 
            value={currentSectionIndex} 
            disabled={isVerifying} 
            onChange={event => setCurrentSectionIndex(Number(event.target.value))} 
            className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium shadow-xs">
            {sections.map((item, index) => {
              const itemIsTask = item.kind === 'task';
              const itemPassed = itemIsTask && passedSteps.includes(item.id);
              const icon = item.kind === 'introduction' 
                ? '📖 Intro: ' 
                : item.kind === 'summary' 
                ? '🏁 Summary: ' 
                : itemPassed 
                ? '✓ ' 
                : '⚡ Task: ';
              const itemTitle = (isVi && item.title_vi) ? item.title_vi : item.title;
              return (
                <option key={item.id} value={index}>
                  {icon}{itemTitle}
                </option>
              );
            })}
          </select>
        </div>

        {currentSection && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isIntro && <BookOpen className="w-4 h-4 text-primary-500" />}
                {isSummary && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {isTask && <Play className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  {isIntro 
                    ? (isVi ? 'Giới thiệu' : 'Introduction') 
                    : isSummary 
                    ? (isVi ? 'Tổng kết' : 'Summary') 
                    : (isVi ? `Nhiệm vụ (${matchingStep?.position || currentSectionIndex})` : `Task (${matchingStep?.position || currentSectionIndex})`)}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {activeTitle}
              </h3>

              {/* Rendered Markdown */}
              {currentSection?.source_text_verified && <div className="mb-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-900 dark:text-blue-200">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" aria-pressed={Boolean(useSource)} onClick={()=>setReadingChoice({id:currentSection.id,source:true})} className={`rounded-md px-3 py-1.5 ${useSource ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800'}`}>Bản gốc EN</button>
                  {currentSection.content_vi && <button type="button" aria-pressed={!useSource} onClick={()=>setReadingChoice({id:currentSection.id,source:false})} className={`rounded-md px-3 py-1.5 ${!useSource ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800'}`}>Bản dịch VI</button>}
                  <a href={currentSection.source_url} target="_blank" rel="noreferrer" className="underline">Đối chiếu LabEx ↗</a>
                </div>
                <p className="mt-2">{useSource ? 'Đang đọc tài liệu tiếng Anh đã đối chiếu trực tiếp với nguồn.' : 'Bản dịch local; dùng Bản gốc EN để đối chiếu đầy đủ.'}{currentSection.translation_needs_review && ' Bản dịch cần cập nhật theo tài liệu gốc vừa bổ sung.'}</p>
              </div>}
              <div className="prose-lab text-slate-800 dark:text-slate-200">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img({ src, alt, title }) {
                      return <GuideImage src={src} alt={alt} title={title} isVi={isVi} />;
                    },
                    pre({ children }) {
                      const codeString = children?.props?.children || '';
                      return (
                        <div className="relative group my-3">
                          <pre className="!bg-slate-950 !text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-slate-800 shadow-md">
                            {children}
                          </pre>
                          <button
                            onClick={() => handleCopy(codeString)}
                            title={isVi ? "Sao chép lệnh" : "Copy command"}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs shadow-xs">
                            {copiedCode === codeString ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">{isVi ? 'Đã chép' : 'Copied'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    }
                  }}>
                  {sourceMarkdown(guideContent)}
                </ReactMarkdown>
              </div>
            </div>

            {/* Task Card - Only rendered when section.kind === 'task' */}
            {isTask && matchingStep && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-semibold text-sm">
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isCurrentSectionPassed 
                      ? (isVi ? '✓ Nhiệm vụ này đã được hoàn thành!' : '✓ This task has been completed!') 
                      : isAcknowledgement 
                      ? (isVi ? 'Hoạt động đọc hiểu (Onboarding):' : 'Reading & Onboarding Activity:') 
                      : (isVi ? 'Nhiệm vụ cần thực hiện trên Terminal:' : 'Terminal Task to Perform:')}
                  </span>
                </div>

                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                  {activeTask || (isVi ? 'Đọc hướng dẫn, thực hiện lệnh tương ứng trên terminal rồi bấm kiểm tra.' : 'Follow the instructions, execute commands on terminal then verify.')}
                </p>

                {activeHint && (
                  <div className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300 bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-xs">
                    <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <span><strong>{isVi ? 'Gợi ý:' : 'Hint:'}</strong> {activeHint}</span>
                  </div>
                )}

                {/* Capability limitation notice */}
                {!isGradingReady && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <strong>Chưa hỗ trợ chấm tự động:</strong> {grading.reasons?.join(' ') || 'Môi trường local hiện tại chưa hỗ trợ capability này.'}
                    </div>
                  </div>
                )}

                {/* Verify Button & Action */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={handleVerify}
                    disabled={isVerifying || !isGradingReady}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 ${
                      !isGradingReady
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : isAcknowledgement
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : isCurrentSectionPassed
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}>
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isVi ? 'Đang kiểm tra...' : 'Verifying...'}</span>
                      </>
                    ) : !isGradingReady ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>{isVi ? 'Chưa hỗ trợ chấm' : 'Grading unavailable'}</span>
                      </>
                    ) : isAcknowledgement ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isVi ? 'Xác nhận đã hiểu / Tiếp tục' : 'Confirm & Continue'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isCurrentSectionPassed ? (isVi ? 'Kiểm tra lại' : 'Verify again') : (isVi ? 'Kiểm tra kết quả' : 'Verify result')}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onAskAi?.(`Hãy gợi ý cho tôi cách giải quyết nhiệm vụ: "${activeTask || activeTitle}"`)}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                    {isVi ? 'Hỏi Labby AI về bước này →' : 'Ask Labby AI about this step →'}
                  </button>
                </div>

                {/* Verification Feedback Banner */}
                {verificationResult && (
                  <div className={`p-3 rounded-lg flex items-start gap-2.5 text-sm transition-all ${
                    verificationResult.passed 
                      ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' 
                      : 'bg-red-100 text-red-950 dark:bg-red-950/80 dark:text-red-200 border border-red-300 dark:border-red-800'
                  }`}>
                    {verificationResult.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{verificationResult.message}</p>
                      {verificationResult.hint && (
                        <p className="text-xs mt-1 opacity-90">{verificationResult.hint}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Introduction Helper Card */}
            {isIntro && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold block text-sm text-slate-800 dark:text-slate-200">
                      {isVi ? 'Nội dung mở đầu bài học' : 'Introduction Overview'}
                    </span>
                    {isVi ? 'Đọc thông tin giới thiệu rồi bấm "Bắt đầu nhiệm vụ" để mở Terminal thực hành.' : 'Read the introduction then click "Start Task" to open Terminal.'}
                  </div>
                </div>

                {currentSectionIndex < totalSections - 1 && (
                  <button
                    onClick={() => {
                      setCurrentSectionIndex(currentSectionIndex + 1);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-sm hover:shadow transition">
                    {isVi ? 'Bắt đầu nhiệm vụ' : 'Start Task'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Summary Helper Card */}
            {isSummary && (
              <div className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs ${
                isLabComplete 
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30' 
                  : unpassedAckSteps.length > 0 && unpassedExecSteps.length === 0
                  ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
              }`}>
                <div className="flex items-center gap-3">
                  {isLabComplete ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold block text-sm text-slate-800 dark:text-slate-200">
                      {isLabComplete 
                        ? (isVi ? 'Chúc mừng! Bạn đã hoàn thành bài thực hành này' : 'Congratulations! You have completed this lab') 
                        : unpassedAckSteps.length > 0 && unpassedExecSteps.length === 0
                        ? (isVi ? 'Tổng kết bài học & Hoàn tất' : 'Lesson Summary & Wrap Up')
                        : (isVi ? 'Tổng kết & Ôn tập' : 'Summary & Review')}
                    </span>
                    {isLabComplete 
                      ? (isVi ? `Tất cả ${totalTasks}/${totalTasks} nhiệm vụ đã được thẩm định đạt yêu cầu.` : `All ${totalTasks}/${totalTasks} tasks verified successfully.`)
                      : unpassedAckSteps.length > 0 && unpassedExecSteps.length === 0
                      ? (isVi ? 'Bạn đã thực hành xong các câu lệnh terminal. Bấm nút bên cạnh để xác nhận hoàn thành bài học.' : 'You have executed all terminal commands. Click to confirm lab completion.')
                      : unpassedExecSteps.length > 0
                      ? (isVi ? `Bạn còn ${unpassedExecSteps.length} nhiệm vụ thực hành terminal chưa hoàn thành.` : `You have ${unpassedExecSteps.length} terminal tasks remaining.`)
                      : (isVi ? 'Bạn đã xem xong phần tổng kết bài học!' : 'You have reviewed the lesson summary!')}
                  </div>
                </div>

                {isLabComplete ? (
                  <button
                    onClick={onNextLab}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow transition">
                    {nextLab ? (isVi ? 'Sang bài tiếp theo' : 'Next Lab') : (isVi ? 'Xem tiến độ khóa học' : 'Course Progress')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : unpassedAckSteps.length > 0 && unpassedExecSteps.length === 0 ? (
                  <button
                    onClick={handleCompleteSummary}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow transition disabled:opacity-50">
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isVi ? 'Đang xác nhận...' : 'Confirming...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isVi ? `Xác nhận hoàn thành (${passedSteps.length}/${totalTasks})` : `Confirm Completion (${passedSteps.length}/${totalTasks})`}</span>
                      </>
                    )}
                  </button>
                ) : unpassedExecSteps.length > 0 ? (
                  <button
                    onClick={() => {
                      const pendingIdx = sections.findIndex(s => s.id === unpassedExecSteps[0].id);
                      if (pendingIdx >= 0) setCurrentSectionIndex(pendingIdx);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm hover:shadow transition">
                    {isVi ? 'Làm nhiệm vụ chưa xong' : 'Continue Tasks'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
        <button
          onClick={() => {
            setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1));
            setVerificationResult(null);
          }}
          disabled={currentSectionIndex === 0 || isVerifying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed">
          <ArrowLeft className="w-4 h-4" />
          {isVi ? 'Quay lại' : 'Back'}
        </button>

        {/* Dynamic Forward / Complete Action Button */}
        {currentSectionIndex < totalSections - 1 ? (
          <button
            onClick={handleFooterNext}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50">
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isVi ? 'Đang xử lý...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <span>{isAcknowledgement && !isCurrentSectionPassed ? (isVi ? 'Xác nhận & Tiếp tục' : 'Confirm & Continue') : (isVi ? 'Tiếp tục' : 'Continue')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : isLabComplete ? (
          <button
            onClick={onNextLab}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>{nextLab ? `${isVi ? 'Bài tiếp theo' : 'Next Lab'}: ${(isVi && nextLab.title_vi) ? nextLab.title_vi : nextLab.title}` : (isVi ? 'Hoàn thành bài Lab' : 'Complete Lab')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : unpassedAckSteps.length > 0 && unpassedExecSteps.length === 0 ? (
          <button
            onClick={handleCompleteSummary}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50">
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isVi ? 'Đang hoàn tất...' : 'Completing...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVi ? `Xác nhận hoàn thành (${passedSteps.length}/${totalTasks})` : `Confirm Completion (${passedSteps.length}/${totalTasks})`}</span>
              </>
            )}
          </button>
        ) : unpassedExecSteps.length > 0 ? (
          <button
            onClick={() => {
              const pendingIdx = sections.findIndex(s => s.id === unpassedExecSteps[0].id);
              if (pendingIdx >= 0) setCurrentSectionIndex(pendingIdx);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition shadow-sm">
            <span>{isVi ? 'Làm tiếp nhiệm vụ' : 'Continue Tasks'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-500 text-sm font-semibold cursor-not-allowed">
            <span>{isVi ? 'Đã kết thúc' : 'Finished'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
