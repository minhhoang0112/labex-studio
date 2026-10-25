import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, Sparkles, RotateCcw, Bot, Briefcase, X, MessageSquare, Minus, Maximize2, Minimize2, ChevronUp, BookOpen } from 'lucide-react';
import useVoiceCall from '../hooks/useVoiceCall';
import { cleanForSpeech } from '../lib/speechPlayer';

export default function VoiceCallModal({ isOpen, onClose, lab, currentStep, lastTerminalOutput, initialPersona='tutor', initialViewMode='dock' }) {
  const [persona,setPersona]=useState(initialPersona);
  const [viewMode,setViewMode]=useState(initialViewMode);
  const [showSubtitles,setShowSubtitles]=useState(true);
  const [showComposer,setShowComposer]=useState(false);
  const [draft,setDraft]=useState('');
  const composerRef=useRef(null);
  const voice=useVoiceCall({isOpen,persona,lab,currentStep,lastTerminalOutput});
  useEffect(()=>{if(isOpen && showComposer && viewMode!=='minimized')composerRef.current?.focus();},[isOpen,showComposer,viewMode]);
  async function submitText(event){
    event.preventDefault();
    if(!draft.trim() || voice.textSending)return;
    const sent=await voice.sendText(draft);
    if(sent){setDraft('');setShowSubtitles(true);}
    composerRef.current?.focus();
  }
  if (!isOpen) return null;
  const status=voice.error ? 'Cuộc gọi đã ngắt' : voice.muted ? 'Mic đang tắt' : voice.phase==='connecting' ? 'Đang kết nối thoại…'
    : voice.phase==='listening' ? 'Đang lắng nghe…' : voice.phase==='thinking' ? 'Labby đang trả lời…'
      : voice.phase==='speaking' ? 'Labby đang nói · vẫn nghe bạn' : 'Sẵn sàng';
  const color=voice.phase==='listening' && !voice.muted ? 'from-emerald-600 to-teal-400'
    : voice.phase==='thinking' ? 'from-amber-600 to-yellow-400' : voice.phase==='speaking' ? 'from-blue-600 to-indigo-400' : 'from-slate-700 to-slate-600';
  const talking=['thinking','speaking'].includes(voice.phase);
  const micButton=<button aria-label={voice.muted?'Bật lại Micro':'Tắt Micro'} title={voice.muted?'Bật lại Micro':'Tắt Micro'}
    disabled={voice.phase==='connecting' || !voice.micName} onClick={()=>voice.setMuted(!voice.muted)}
    className={`rounded-xl p-2 border text-xs flex items-center gap-1 disabled:opacity-40 ${voice.muted?'bg-rose-600 border-rose-500':'bg-white/10 border-white/10 hover:bg-white/20'}`}>
    {voice.muted?<MicOff size={16}/>:<Mic size={16}/>}<span>{voice.muted?'Bật mic':'Tắt mic'}</span>
  </button>;
  const endButton=<button aria-label="Kết thúc đàm thoại" title="Kết thúc đàm thoại" onClick={onClose} className="rounded-xl px-3 py-2 bg-rose-600 hover:bg-rose-500 flex items-center gap-1 text-xs font-semibold"><PhoneOff size={15}/>Tắt</button>;
  if(viewMode==='minimized') return <div role="region" aria-label="Labby Voice thu nhỏ" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 p-2 rounded-full bg-slate-950 border border-slate-700 text-white shadow-2xl">
    <button aria-label="Ngắt lời và nói" disabled={voice.phase==='connecting' || !voice.micName || voice.muted} onClick={voice.interrupt} className={`p-2 rounded-full bg-gradient-to-tr ${color}`}><Mic size={16}/></button>
    <span role="status" className="text-xs max-w-32 truncate">{voice.error?'Kiểm tra mic / âm thanh':status}</span>
    <button aria-label="Mở rộng khung trợ lý" onClick={()=>setViewMode('dock')} className="p-1"><ChevronUp size={17}/></button>
    {micButton}{endButton}
  </div>;
  return <section role="region" aria-label="Labby Voice" className={viewMode==='fullscreen'
    ? 'fixed inset-0 z-50 bg-slate-950/95 text-white flex items-center justify-center backdrop-blur-xl p-4'
    : 'fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[400px] max-h-[85vh] bg-slate-950/95 text-white rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col'}>
    <div className={viewMode==='fullscreen'?'w-full max-w-2xl max-h-[92vh] rounded-2xl border border-slate-700 bg-slate-950 flex flex-col overflow-hidden':'flex min-h-0 flex-col'}>
      <header className="px-3 py-2.5 bg-slate-900 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2"><Bot size={18} className="text-indigo-300"/><strong className="text-sm">Labby Voice</strong>
          <button aria-label="Đổi vai trò thoại" title="Đổi vai trò thoại" onClick={()=>setPersona(persona==='tutor'?'interviewer':'tutor')} className="text-[10px] px-2 py-1 rounded-full bg-white/10 flex items-center gap-1">
            {persona==='interviewer'?<Briefcase size={12}/>:<BookOpen size={12}/>} {persona==='interviewer'?'Tech Lead':'Gia sư'}
          </button>
        </div>
        <div className="flex gap-1">
          <button aria-label="Thu nhỏ cuộc gọi" title="Thu nhỏ cuộc gọi" className="p-1.5 hover:bg-white/10 rounded" onClick={()=>setViewMode('minimized')}><Minus size={15}/></button>
          <button aria-label={viewMode==='fullscreen'?'Thu về góc màn hình':'Mở toàn màn hình thoại'} title="Đổi kích thước" className="p-1.5 hover:bg-white/10 rounded" onClick={()=>setViewMode(viewMode==='fullscreen'?'dock':'fullscreen')}>{viewMode==='fullscreen'?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button>
          <button aria-label="Đóng cuộc gọi" className="p-1.5 hover:bg-rose-900 rounded text-rose-300" onClick={onClose}><X size={17}/></button>
        </div>
      </header>
      <div className="px-3 py-1.5 text-[11px] text-slate-400 border-b border-white/5 truncate">{lab?.title_vi || lab?.title || 'Trợ lý học tập'}{currentStep && ` · ${currentStep.title_vi || currentStep.title}`}</div>
      <div className="p-4 flex flex-col items-center gap-3 overflow-y-auto min-h-0">
        <button aria-label={talking?'Ngắt lời và nói':'Bắt đầu nghe'} onClick={voice.interrupt} disabled={voice.phase==='connecting' || !voice.micName || voice.muted}
          className={`rounded-full bg-gradient-to-tr ${color} ${viewMode==='fullscreen'?'w-28 h-28':'w-16 h-16'} flex items-center justify-center shadow-xl shrink-0 disabled:opacity-50`}>
          {voice.phase==='thinking'?<Sparkles size={26} className="animate-pulse"/>:voice.phase==='speaking'?<Volume2 size={26}/>:<Mic size={26}/>}
        </button>
        <p role="status" className="text-xs font-semibold text-slate-200">{status}</p>
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400"><span className="truncate" title={voice.micName}>{voice.micName || 'Chờ quyền microphone'}</span><span className="shrink-0">Mức âm mic</span></div>
          <div role="meter" aria-label="Mức âm microphone" aria-valuemin={0} aria-valuemax={100} aria-valuenow={voice.muted?0:Math.round(voice.micLevel*100)} className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-[width] duration-100" style={{width:`${voice.muted?0:Math.round(voice.micLevel*100)}%`}}/>
          </div>
        </div>
        {voice.error && <div role="alert" className="w-full rounded-lg p-2 bg-rose-950/60 text-rose-200 text-xs">{voice.error}</div>}
        {voice.notice && <p className="w-full text-xs text-amber-300" data-testid="voice-provider-notice">{voice.notice}</p>}
        {showSubtitles && <div className={`w-full rounded-xl p-3 bg-slate-900 border border-white/10 overflow-y-auto text-xs leading-relaxed space-y-2 ${viewMode==='fullscreen'?'max-h-72 min-h-32':'max-h-44 min-h-24'}`} aria-label="Phụ đề cuộc gọi">
          {voice.lastUserSpeech && <p className="text-slate-400"><strong>Bạn: </strong>{voice.lastUserSpeech}</p>}
          {voice.aiSpeechText && <p className="text-slate-100"><strong className="text-indigo-300">Labby: </strong>{cleanForSpeech(voice.aiSpeechText)}</p>}
          {voice.transcript && <p data-testid="voice-transcript" className="text-emerald-300"><strong>Đang nghe: </strong>{voice.transcript}</p>}
          {!voice.lastUserSpeech && !voice.transcript && <p className="text-slate-500">Bạn có thể nói khi kết nối xong, kể cả khi Labby đang nói.</p>}
        </div>}
        <div className="w-full flex items-center justify-between gap-2 text-xs">
          <label className="flex items-center gap-2">Tốc độ đọc
            <select aria-label="Tốc độ đọc" value={voice.rate} onChange={event=>voice.setRate(event.target.value)} className="bg-slate-800 rounded border border-slate-600 px-2 py-1">
              {[0.75,1,1.25,1.5,1.75,2].map(rate=><option key={rate} value={rate}>{rate}×</option>)}
            </select>
          </label>
          <button onClick={voice.retry} className="text-indigo-300 underline">Kết nối lại</button>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">Cứ nói để ngắt lời Labby, không cần bấm nút. Dùng tai nghe để giảm tiếng loa lọt vào mic. Nếu mức âm không lên, kiểm tra mic mặc định và quyền của trang.</p>
      </div>
      {showComposer && <form onSubmit={submitText} className="px-3 py-3 border-t border-white/10 bg-slate-900 shrink-0 space-y-2" aria-label="Nhắn tin trong cuộc gọi">
        <label htmlFor="live-voice-message" className="text-xs text-slate-300">Nhắn tin cho Labby trong cuộc gọi</label>
        <div className="flex gap-2 items-end">
          <textarea id="live-voice-message" ref={composerRef} value={draft} maxLength={4000} rows={2}
            aria-label="Tin nhắn cho Labby" placeholder="Gõ câu hỏi hoặc dán lệnh cần giải thích…"
            disabled={voice.textSending} onChange={event=>setDraft(event.target.value)}
            onKeyDown={event=>{event.stopPropagation();if(event.key==='Enter' && !event.shiftKey && !event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form.requestSubmit();}}}
            className="min-w-0 flex-1 resize-none rounded-lg bg-slate-950 border border-slate-600 focus:border-indigo-400 focus:outline-none px-3 py-2 text-sm text-white disabled:opacity-60"/>
          <button type="submit" disabled={!draft.trim() || !voice.connected || voice.textSending} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-semibold">{voice.textSending?'Đang gửi…':'Gửi'}</button>
        </div>
        <p className="text-[10px] text-slate-400">Enter để gửi · Shift+Enter xuống dòng · Có thể gửi khi mic đang tắt.</p>
        {voice.textError && <p role="alert" className="text-xs text-rose-300">{voice.textError}</p>}
      </form>}
      <footer className="px-3 py-2.5 border-t border-white/10 flex items-center flex-wrap gap-2 bg-slate-900 shrink-0">
        {micButton}
        {talking && <button aria-label="Ngắt lời và nói" onClick={voice.interrupt} className="p-2 rounded-xl bg-amber-500 text-slate-950 flex items-center gap-1 text-xs"><RotateCcw size={14}/>Ngắt lời</button>}
        <button aria-label="Nhắn tin trong cuộc gọi" title="Nhắn tin trong cuộc gọi" onClick={()=>setShowComposer(!showComposer)} aria-expanded={showComposer} className={`p-2 rounded-xl ${showComposer?'bg-indigo-600':'bg-white/10'}`}><MessageSquare size={15}/></button>
        <button aria-label="Bật tắt phụ đề" onClick={()=>setShowSubtitles(!showSubtitles)} aria-pressed={showSubtitles} className="p-2 rounded-xl bg-white/10 text-xs">Phụ đề</button>
        <div className="ml-auto">{endButton}</div>
      </footer>
    </div>
  </section>;
}
