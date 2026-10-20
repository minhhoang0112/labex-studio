import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, PhoneOff, Volume2, VolumeX, Sparkles, 
  RotateCcw, Bot, Briefcase, GraduationCap, X, MessageSquare, AlertCircle,
  Minus, Maximize2, Minimize2, ChevronUp, Terminal, BookOpen
} from 'lucide-react';
import { api } from '../lib/api';

// Helper to clean markdown for natural spoken sentences
function cleanForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' đoạn mã đã được ghi lại. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>•-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function VoiceCallModal({
  isOpen,
  onClose,
  lab,
  currentStep,
  lastTerminalOutput,
  initialPersona = 'tutor',
}) {
  const [persona, setPersona] = useState(initialPersona);
  const [callState, setCallState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [viewMode, setViewMode] = useState('dock'); // 'dock' (compact PiP) | 'minimized' | 'fullscreen'
  const [transcript, setTranscript] = useState('');
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [aiSpeechText, setAiSpeechText] = useState('');
  const [history, setHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);

  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const inFlightRef = useRef(null);
  const isClosingRef = useRef(false);

  // Initialize and clean up when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    isClosingRef.current = false;
    // Welcome speech
    const welcome = persona === 'interviewer'
      ? `Chào bạn! Tôi là Tech Lead phỏng vấn hôm nay. Tôi đã sẵn sàng, bạn hãy nói qua Mic bất cứ khi nào bạn muốn bắt đầu phỏng vấn nhé!`
      : `Xin chào! Tôi là Labby. Chế độ đàm thoại trực tiếp đã bật. Bạn có thể nói chuyện tự nhiên với tôi bất cứ lúc nào!`;
    
    setAiSpeechText(welcome);
    playNaturalSpeech(welcome, () => {
      if (!isClosingRef.current) startListening();
    });

    return () => cleanup();
  }, [isOpen, persona]);

  const cleanup = () => {
    isClosingRef.current = true;
    clearTimeout(silenceTimerRef.current);
    if (inFlightRef.current) {
      try { inFlightRef.current.abort(); } catch {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('idle');
  };

  // Play fluent Vietnamese speech (TTS proxy stream with strict native voice validation)
  const playNaturalSpeech = async (text, onFinished) => {
    // 1. Immediately abort mic recognition while AI is speaking to prevent feedback loop
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    setCallState('speaking');
    const cleaned = cleanForSpeech(text).slice(0, 320); // short conversational chunk
    if (!cleaned) {
      setCallState('idle');
      if (onFinished && !isClosingRef.current) onFinished();
      return;
    }

    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }

      // Use proxy endpoint for 100% natural native Vietnamese audio
      const audioUrl = `/api/ai/tts?text=${encodeURIComponent(cleaned)}`;
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setCallState('idle');
        audioPlayerRef.current = null;
        // Wait 350ms so speaker echo doesn't trigger the microphone
        if (onFinished && !isClosingRef.current) {
          setTimeout(onFinished, 350);
        }
      };

      audio.onerror = () => {
        audioPlayerRef.current = null;
        fallbackSpeechSynthesis(cleaned, onFinished);
      };

      await audio.play();
    } catch {
      // Browser autoplay restriction or play error
      fallbackSpeechSynthesis(cleaned, onFinished);
    }
  };

  const fallbackSpeechSynthesis = (text, onFinished) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setCallState('idle');
      if (onFinished && !isClosingRef.current) onFinished();
      return;
    }
    window.speechSynthesis.cancel();

    // STRICT CHECK: Only use browser speech synthesis if a real Vietnamese voice is installed!
    // Never allow Microsoft David or other English male voices to read Vietnamese.
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => 
      v.lang.startsWith('vi') || 
      v.name.toLowerCase().includes('vietnam') || 
      v.name.toLowerCase().includes('vietnamese')
    );

    if (!viVoice) {
      // No Vietnamese voice installed in browser - gracefully skip speech, do NOT let English voice speak!
      setCallState('idle');
      if (onFinished && !isClosingRef.current) onFinished();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = viVoice;
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05;

    utterance.onend = () => {
      setCallState('idle');
      if (onFinished && !isClosingRef.current) setTimeout(onFinished, 300);
    };
    utterance.onerror = () => {
      setCallState('idle');
      if (onFinished && !isClosingRef.current) onFinished();
    };
    window.speechSynthesis.speak(utterance);
  };

  // Start continuous speech recognition
  const startListening = () => {
    if (isClosingRef.current || isMuted) return;
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setErrorMsg("Trình duyệt chưa hỗ trợ Web Speech API. Hãy mở Chrome hoặc Edge để dùng mic thoại.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setCallState('listening');
        setTranscript('');
      };

      recognition.onresult = (event) => {
        clearTimeout(silenceTimerRef.current);
        const currentTranscript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setTranscript(currentTranscript);

        // Turn-taking: pause of 1.1s after speaking automatically triggers AI reply
        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscript.trim().length >= 2) {
            try { recognition.stop(); } catch {}
            handleSendSpokenInput(currentTranscript.trim());
          }
        }, 1100);
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Speech error:', e.error);
        }
        if (callState === 'listening' && !isClosingRef.current && !isMuted) {
          // Restart listening on timeout
          setTimeout(() => {
            if (!isClosingRef.current && callState !== 'speaking' && callState !== 'thinking') {
              startListening();
            }
          }, 400);
        }
      };

      recognition.onend = () => {
        if (callState === 'listening' && !isClosingRef.current && !isMuted && !transcript) {
          setTimeout(() => {
            if (!isClosingRef.current && callState !== 'speaking' && callState !== 'thinking') {
              startListening();
            }
          }, 300);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  };

  // Send spoken input to backend AI
  const handleSendSpokenInput = async (spokenText) => {
    if (!spokenText || isClosingRef.current) return;
    clearTimeout(silenceTimerRef.current);
    setLastUserSpeech(spokenText);
    setTranscript('');
    setCallState('thinking');

    const updatedHistory = [...history, { role: 'user', content: spokenText }];
    setHistory(updatedHistory);

    const controller = new AbortController();
    inFlightRef.current = controller;

    try {
      const data = await api('/api/ai/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: spokenText,
          persona,
          context: {
            isVoiceMode: true,
            labId: lab?.id,
            platform: lab?.id?.startsWith('win-') ? 'windows' : 'linux',
            labTitle: lab?.title_vi || lab?.title,
            stepTitle: currentStep?.title_vi || currentStep?.title,
            task: currentStep?.task_vi || currentStep?.task,
            hint: currentStep?.hint_vi || currentStep?.hint,
            content: (currentStep?.content_vi || currentStep?.content || '').slice(0, 3000),
            terminalOutput: lastTerminalOutput?.slice(-3000),
          },
          history: updatedHistory.slice(-6),
        }),
      });

      if (isClosingRef.current) return;
      const reply = data.reply || 'Tôi đã nghe bạn nói, hãy tiếp tục nhé.';
      setAiSpeechText(reply);
      setHistory(prev => [...prev, { role: 'assistant', content: reply }]);

      // Speak back and then loop back to listening
      playNaturalSpeech(reply, () => {
        if (!isClosingRef.current && !isMuted) {
          startListening();
        }
      });
    } catch (err) {
      if (isClosingRef.current) return;
      const fallback = 'Xin lỗi, tôi chưa nghe rõ câu vừa rồi. Bạn có thể nói lại được không?';
      setAiSpeechText(fallback);
      playNaturalSpeech(fallback, () => {
        if (!isClosingRef.current && !isMuted) startListening();
      });
    } finally {
      inFlightRef.current = null;
    }
  };

  // Interrupt AI speaking
  const handleInterrupt = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('idle');
    setTimeout(() => {
      startListening();
    }, 200);
  };

  if (!isOpen) return null;

  // 1. Minimized View: An ultra-compact floating live pill in the corner
  if (viewMode === 'minimized') {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-white animate-in fade-in select-none">
        {/* Mini Glowing Orb */}
        <button
          onClick={callState === 'speaking' ? handleInterrupt : (callState === 'idle' ? startListening : undefined)}
          title={callState === 'speaking' ? 'Chạm để ngắt lời' : 'Chạm để nói'}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-md ${
            callState === 'listening' ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-2 ring-emerald-400 animate-pulse' :
            callState === 'thinking' ? 'bg-gradient-to-tr from-amber-500 to-orange-400 animate-spin' :
            callState === 'speaking' ? 'bg-gradient-to-tr from-primary-500 to-indigo-400 ring-2 ring-primary-400 animate-pulse' :
            'bg-slate-700'
          }`}
        >
          {callState === 'listening' && <Mic className="w-3.5 h-3.5 text-white animate-bounce" />}
          {callState === 'thinking' && <Sparkles className="w-3.5 h-3.5 text-white" />}
          {callState === 'speaking' && <Volume2 className="w-3.5 h-3.5 text-white" />}
          {callState === 'idle' && <Mic className="w-3.5 h-3.5 text-slate-300" />}
        </button>

        <div className="flex flex-col">
          <span className="text-xs font-bold leading-tight">
            {callState === 'listening' ? 'Đang nghe...' :
             callState === 'thinking' ? 'Đang nghĩ...' :
             callState === 'speaking' ? 'Đang nói...' : 'Labby Voice'}
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
            {lab ? (lab.title_vi || lab.title) : 'Trợ lý học tập'}
          </span>
        </div>

        {/* Expand back to Dock Mode */}
        <button
          onClick={() => setViewMode('dock')}
          title="Mở rộng khung trợ lý"
          className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Mute toggle */}
        <button
          onClick={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            if (nextMuted && recognitionRef.current) {
              try { recognitionRef.current.abort(); } catch {}
              setCallState('idle');
            } else if (!nextMuted && callState === 'idle') {
              startListening();
            }
          }}
          title={isMuted ? "Bật lại Micro" : "Tắt Micro"}
          className={`p-1 rounded-full transition ${isMuted ? 'text-rose-400 hover:bg-rose-950/60' : 'text-slate-300 hover:bg-white/10'}`}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        {/* End Call */}
        <button
          onClick={onClose}
          title="Kết thúc đàm thoại"
          className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition shadow-sm"
        >
          <PhoneOff className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // 2. Fullscreen Focused View (if explicitly requested by user)
  if (viewMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-200">
        <div className={`absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
          callState === 'listening' ? 'bg-emerald-500/20 scale-125' :
          callState === 'thinking' ? 'bg-amber-500/25 scale-110 animate-pulse' :
          callState === 'speaking' ? 'bg-primary-500/30 scale-150 animate-pulse' : 'bg-indigo-600/15'
        }`} />

        <div className="relative w-full max-w-xl mx-4 flex flex-col items-center justify-between h-[85vh] max-h-[750px] py-6 px-4">
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg ${
                persona === 'interviewer' ? 'bg-gradient-to-tr from-amber-500 to-rose-600' : 'bg-gradient-to-tr from-primary-500 to-indigo-600'
              }`}>
                {persona === 'interviewer' ? <Briefcase className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight">Labby Voice Live</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-slate-300">
                    {persona === 'interviewer' ? 'Tech Lead' : 'Gia Sư Lab'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {lab ? (lab.title_vi || lab.title) : 'Đàm thoại trực tiếp thời gian thực'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('dock')}
                title="Thu nhỏ xuống góc màn hình"
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold border border-white/10 transition flex items-center gap-1.5"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ dạng Dock</span>
              </button>

              <button
                onClick={onClose}
                title="Thoát Voice Mode"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Orb */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 relative">
            <div 
              onClick={callState === 'speaking' ? handleInterrupt : (callState === 'idle' ? startListening : undefined)}
              className="relative cursor-pointer group flex items-center justify-center"
              title={callState === 'speaking' ? 'Chạm để ngắt lời' : 'Chạm để bắt đầu nói'}
            >
              <div className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative overflow-hidden ${
                callState === 'listening' ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 scale-105 shadow-emerald-500/50 ring-4 ring-emerald-400/30' :
                callState === 'thinking' ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 scale-100 animate-spin shadow-amber-500/40 ring-4 ring-amber-400/30' :
                callState === 'speaking' ? 'bg-gradient-to-tr from-primary-600 via-indigo-500 to-purple-500 scale-110 shadow-primary-500/50 ring-4 ring-primary-400/40 animate-pulse' :
                'bg-gradient-to-tr from-slate-800 via-indigo-900 to-slate-700 shadow-indigo-500/20 ring-2 ring-white/10'
              }`}>
                <div className="relative text-white">
                  {callState === 'listening' && <Mic className="w-10 h-10 animate-bounce" />}
                  {callState === 'thinking' && <Sparkles className="w-10 h-10 animate-spin" />}
                  {callState === 'speaking' && <Volume2 className="w-10 h-10 animate-pulse" />}
                  {callState === 'idle' && <Mic className="w-10 h-10 text-white/80" />}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                {callState === 'listening' ? 'Đang lắng nghe bạn nói...' :
                 callState === 'thinking' ? 'Labby đang suy nghĩ...' :
                 callState === 'speaking' ? 'Labby đang trả lời...' : 'Sẵn sàng đàm thoại'}
              </span>
            </div>

            {/* Subtitles */}
            {showSubtitles && (
              <div className="w-full max-w-lg mt-5 bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md min-h-[75px] max-h-[140px] overflow-y-auto text-xs leading-relaxed text-slate-200 shadow-xl">
                {transcript && <div className="text-emerald-300 font-medium">Bạn: {transcript}</div>}
                {!transcript && callState === 'speaking' && <div className="text-slate-100 font-medium">Labby: {cleanForSpeech(aiSpeechText)}</div>}
                {!transcript && callState !== 'speaking' && lastUserSpeech && <div className="text-slate-400 text-[11px]">Gần nhất: {lastUserSpeech}</div>}
              </div>
            )}
          </div>

          {/* Fullscreen Controls */}
          <div className="w-full flex items-center justify-center gap-5 border-t border-white/10 pt-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-white/15 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition shadow-xl"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Compact Floating Dock Mode (Default: PiP style, NO full-screen blocker!)
  // User can freely interact with the lab, terminal, and courses behind it!
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[380px] max-h-[490px] rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 select-none">
      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-xs ${
            persona === 'interviewer' ? 'bg-gradient-to-tr from-amber-500 to-rose-600' : 'bg-gradient-to-tr from-primary-500 to-indigo-600'
          }`}>
            {persona === 'interviewer' ? <Briefcase className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-tight">Labby Voice</span>
              <button
                onClick={() => {
                  const next = persona === 'tutor' ? 'interviewer' : 'tutor';
                  setPersona(next);
                  cleanup();
                }}
                title="Bấm để đổi chế độ"
                className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 transition"
              >
                {persona === 'interviewer' ? '👔 Tech Lead' : '🎓 Gia Sư'}
              </button>
            </div>
          </div>
        </div>

        {/* Header Action Buttons: Minimize, Maximize, Close */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('minimized')}
            title="Thu nhỏ thanh mảnh (không che màn hình)"
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode('fullscreen')}
            title="Mở toàn màn hình"
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            title="Kết thúc đàm thoại"
            className="p-1 rounded-md hover:bg-rose-600/80 text-rose-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Context Awareness Indicator */}
      <div className="px-3 py-1.5 bg-slate-900/40 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5 truncate">
          <BookOpen className="w-3 h-3 text-primary-400 shrink-0" />
          <span className="truncate font-medium">{lab ? (lab.title_vi || lab.title) : 'LabEx Studio'}</span>
        </div>
        {currentStep && (
          <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded bg-primary-950/60 text-primary-300 border border-primary-800/40">
            Bước {currentStep.step || 1}
          </span>
        )}
      </div>

      {/* Main Interactive Center */}
      <div className="p-3.5 flex flex-col items-center justify-center gap-3">
        {/* Compact Voice Orb */}
        <div 
          onClick={callState === 'speaking' ? handleInterrupt : (callState === 'idle' ? startListening : undefined)}
          className="relative cursor-pointer group flex items-center justify-center my-1"
          title={callState === 'speaking' ? 'Chạm để ngắt lời' : 'Chạm để nói'}
        >
          {/* Subtle pulsating outer ripple */}
          <div className={`absolute w-24 h-24 rounded-full transition-all duration-700 pointer-events-none ${
            callState === 'listening' ? 'border-2 border-emerald-400/40 animate-ping opacity-60' :
            callState === 'speaking' ? 'border-2 border-primary-400/50 animate-ping opacity-60' :
            callState === 'thinking' ? 'border border-amber-400/30 animate-pulse' : 'border border-white/5'
          }`} />

          {/* Central Sphere */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 relative overflow-hidden ${
            callState === 'listening' ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 ring-2 ring-emerald-400/50 scale-105' :
            callState === 'thinking' ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 ring-2 ring-amber-400/50 animate-spin' :
            callState === 'speaking' ? 'bg-gradient-to-tr from-primary-600 to-indigo-400 ring-2 ring-primary-400/50 scale-105 animate-pulse' :
            'bg-gradient-to-tr from-slate-800 to-slate-700 ring-1 ring-white/10 group-hover:scale-105'
          }`}>
            <div className="relative text-white">
              {callState === 'listening' && <Mic className="w-5 h-5 animate-bounce" />}
              {callState === 'thinking' && <Sparkles className="w-5 h-5 animate-spin" />}
              {callState === 'speaking' && <Volume2 className="w-5 h-5 animate-pulse" />}
              {callState === 'idle' && <Mic className="w-5 h-5 text-slate-300" />}
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          callState === 'listening' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
          callState === 'thinking' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse' :
          callState === 'speaking' ? 'bg-primary-500/20 text-primary-300 border border-primary-400/30' :
          'bg-white/10 text-slate-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            callState === 'listening' ? 'bg-emerald-400 animate-ping' :
            callState === 'thinking' ? 'bg-amber-400 animate-bounce' :
            callState === 'speaking' ? 'bg-primary-400 animate-pulse' : 'bg-slate-400'
          }`} />
          {callState === 'listening' ? 'Đang lắng nghe...' :
           callState === 'thinking' ? 'Labby đang suy nghĩ...' :
           callState === 'speaking' ? 'Labby đang nói...' : 'Sẵn sàng'}
        </span>

        {/* Live Subtitle Transcript Box (Compact Scrollable) */}
        {showSubtitles && (
          <div className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-xs leading-relaxed text-slate-200 h-[80px] overflow-y-auto">
            {transcript && (
              <div className="text-emerald-300 font-medium">
                <span className="text-slate-400 font-bold mr-1">Bạn:</span>
                {transcript}
              </div>
            )}
            {!transcript && callState === 'speaking' && (
              <div className="text-slate-100 font-medium">
                <span className="text-primary-400 font-bold mr-1">Labby:</span>
                {cleanForSpeech(aiSpeechText)}
              </div>
            )}
            {!transcript && callState !== 'speaking' && lastUserSpeech && (
              <div className="text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-500 mr-1">Vừa hỏi:</span>
                {lastUserSpeech}
              </div>
            )}
            {!transcript && callState === 'idle' && !lastUserSpeech && (
              <div className="text-slate-500 text-center italic py-1 text-[11px]">
                Nói bất cứ lúc nào, trợ lý sẽ phản hồi qua giọng nói...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Mute Mic button */}
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (nextMuted && recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch {}
                setCallState('idle');
              } else if (!nextMuted && callState === 'idle') {
                startListening();
              }
            }}
            title={isMuted ? "Bật lại Micro" : "Tắt Micro"}
            className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1 ${
              isMuted ? 'bg-rose-600 text-white border-rose-500' : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/10'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{isMuted ? 'Bật Mic' : 'Tắt Mic'}</span>
          </button>

          {/* Interrupt Speaking button */}
          {callState === 'speaking' && (
            <button
              onClick={handleInterrupt}
              title="Ngắt lời AI để nói ngay"
              className="px-2.5 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1 animate-pulse"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[10px]">Ngắt lời</span>
            </button>
          )}

          {/* Toggle Subtitles */}
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            title="Bật/Tắt phụ đề chữ"
            className={`p-2 rounded-xl border transition ${
              showSubtitles ? 'bg-white/15 text-white border-white/20' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* End Call Button */}
        <button
          onClick={onClose}
          title="Kết thúc đàm thoại"
          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition hover:scale-105 active:scale-95"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Tắt</span>
        </button>
      </div>
    </div>
  );
}

