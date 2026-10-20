import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, PhoneOff, Volume2, VolumeX, Sparkles, 
  RotateCcw, Bot, Briefcase, GraduationCap, X, MessageSquare, AlertCircle
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

  // Play fluent Vietnamese speech (Google TTS proxy stream with fallback)
  const playNaturalSpeech = async (text, onFinished) => {
    setCallState('speaking');
    const cleaned = cleanForSpeech(text).slice(0, 320); // short conversational chunk
    if (!cleaned) {
      if (onFinished) onFinished();
      return;
    }

    try {
      // Use proxy endpoint for 100% natural native Vietnamese audio
      const audioUrl = `/api/ai/tts?text=${encodeURIComponent(cleaned)}`;
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setCallState('idle');
        audioPlayerRef.current = null;
        if (onFinished && !isClosingRef.current) onFinished();
      };

      audio.onerror = () => {
        // Fallback to browser Web Speech Synthesis if TTS network failed
        fallbackSpeechSynthesis(cleaned, onFinished);
      };

      await audio.play();
    } catch {
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onend = () => {
      setCallState('idle');
      if (onFinished && !isClosingRef.current) onFinished();
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

        // Turn-taking: pause of 1.3s after speaking automatically triggers AI reply
        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscript.trim()) {
            recognition.stop();
            handleSendSpokenInput(currentTranscript.trim());
          }
        }, 1300);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-200">
      {/* Background ambient lighting glow */}
      <div className={`absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
        callState === 'listening' ? 'bg-emerald-500/20 scale-125' :
        callState === 'thinking' ? 'bg-amber-500/25 scale-110 animate-pulse' :
        callState === 'speaking' ? 'bg-primary-500/30 scale-150 animate-pulse' : 'bg-indigo-600/15'
      }`} />

      {/* Main Container */}
      <div className="relative w-full max-w-xl mx-4 flex flex-col items-center justify-between h-[85vh] max-h-[750px] py-6 px-4">
        {/* Top Header */}
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
            {/* Switch persona button */}
            <button
              onClick={() => {
                const next = persona === 'tutor' ? 'interviewer' : 'tutor';
                setPersona(next);
                cleanup();
              }}
              title="Chuyển chế độ Gia sư / Phỏng vấn"
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold border border-white/10 transition flex items-center gap-1.5"
            >
              {persona === 'tutor' ? <Briefcase className="w-3.5 h-3.5 text-amber-400" /> : <GraduationCap className="w-3.5 h-3.5 text-primary-400" />}
              <span className="hidden sm:inline">{persona === 'tutor' ? 'Sang Phỏng Vấn' : 'Sang Gia Sư'}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              title="Thoát Voice Mode"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: The ChatGPT-style Interactive Voice Orb */}
        <div className="flex-1 flex flex-col items-center justify-center my-6 relative">
          <div 
            onClick={callState === 'speaking' ? handleInterrupt : (callState === 'idle' ? startListening : undefined)}
            className="relative cursor-pointer group flex items-center justify-center"
            title={callState === 'speaking' ? 'Chạm để ngắt lời' : 'Chạm để bắt đầu nói'}
          >
            {/* Outer pulsating audio wave ripples */}
            <div className={`absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full transition-all duration-700 pointer-events-none ${
              callState === 'listening' ? 'border-2 border-emerald-400/40 animate-ping opacity-75' :
              callState === 'speaking' ? 'border-2 border-primary-400/50 animate-ping opacity-75' :
              callState === 'thinking' ? 'border-2 border-amber-400/30 animate-pulse' : 'border border-white/10'
            }`} />

            <div className={`absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full transition-all duration-500 pointer-events-none ${
              callState === 'listening' ? 'bg-emerald-500/15 scale-110 animate-pulse' :
              callState === 'speaking' ? 'bg-primary-500/20 scale-125 animate-pulse' :
              callState === 'thinking' ? 'bg-amber-500/20 scale-105' : 'bg-white/5'
            }`} />

            {/* The Central Glowing Sphere */}
            <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative overflow-hidden ${
              callState === 'listening' 
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 scale-105 shadow-emerald-500/50 ring-4 ring-emerald-400/30' :
              callState === 'thinking' 
                ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 scale-100 animate-spin shadow-amber-500/40 ring-4 ring-amber-400/30' :
              callState === 'speaking' 
                ? 'bg-gradient-to-tr from-primary-600 via-indigo-500 to-purple-500 scale-110 shadow-primary-500/50 ring-4 ring-primary-400/40 animate-pulse' :
                'bg-gradient-to-tr from-slate-800 via-indigo-900 to-slate-700 shadow-indigo-500/20 ring-2 ring-white/10'
            }`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
              
              {/* Dynamic Icon inside Orb */}
              <div className="relative text-white flex flex-col items-center gap-1">
                {callState === 'listening' && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                  </div>
                )}
                {callState === 'thinking' && <Sparkles className="w-8 h-8 animate-spin text-white" />}
                {callState === 'speaking' && <Volume2 className="w-8 h-8 animate-pulse text-white" />}
                {callState === 'idle' && <Mic className="w-8 h-8 text-white/80 group-hover:scale-110 transition-transform" />}
              </div>
            </div>
          </div>

          {/* Status Text Under Sphere */}
          <div className="mt-7 text-center">
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              callState === 'listening' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg shadow-emerald-500/20' :
              callState === 'thinking' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse' :
              callState === 'speaking' ? 'bg-primary-500/20 text-primary-300 border border-primary-400/30' :
              'bg-white/10 text-slate-300 border border-white/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                callState === 'listening' ? 'bg-emerald-400 animate-ping' :
                callState === 'thinking' ? 'bg-amber-400 animate-bounce' :
                callState === 'speaking' ? 'bg-primary-400 animate-pulse' : 'bg-slate-400'
              }`} />
              {callState === 'listening' ? 'Đang lắng nghe bạn nói...' :
               callState === 'thinking' ? 'Labby đang suy nghĩ...' :
               callState === 'speaking' ? 'Labby đang trả lời...' : 'Sẵn sàng đàm thoại'}
            </span>

            {callState === 'speaking' && (
              <p className="text-[11px] text-slate-400 mt-2">
                (Chạm vào quả cầu hoặc bấm "Ngắt lời" để nói tiếp)
              </p>
            )}
          </div>

          {/* Subtitles / Live Transcript Box */}
          {showSubtitles && (
            <div className="w-full max-w-lg mt-5 bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md min-h-[75px] max-h-[140px] overflow-y-auto text-xs leading-relaxed text-slate-200 shadow-xl">
              {transcript && (
                <div className="text-emerald-300 font-medium flex items-start gap-1.5 animate-in fade-in">
                  <span className="text-slate-400 font-bold shrink-0">Bạn:</span>
                  <span>{transcript}</span>
                </div>
              )}
              {!transcript && callState === 'speaking' && (
                <div className="text-slate-100 flex items-start gap-1.5 animate-in fade-in">
                  <span className="text-primary-400 font-bold shrink-0">Labby:</span>
                  <span>{cleanForSpeech(aiSpeechText)}</span>
                </div>
              )}
              {!transcript && callState !== 'speaking' && lastUserSpeech && (
                <div className="text-slate-400 text-[11px] truncate">
                  <span className="font-semibold text-slate-500">Gần nhất: </span>
                  {lastUserSpeech}
                </div>
              )}
              {!transcript && callState === 'idle' && !lastUserSpeech && (
                <div className="text-slate-500 text-center italic py-2">
                  Hãy nói qua mic, lời nói của bạn và câu trả lời của AI sẽ hiện tại đây...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full flex items-center justify-center gap-5 border-t border-white/10 pt-4">
          {/* Mute Mic toggle */}
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
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
              isMuted ? 'bg-rose-600/80 hover:bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Interrupt Speaking button (when AI is speaking) */}
          {callState === 'speaking' && (
            <button
              onClick={handleInterrupt}
              title="Ngắt lời AI để nói ngay"
              className="px-4 py-2.5 rounded-full bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5 animate-pulse"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ngắt lời</span>
            </button>
          )}

          {/* Toggle Subtitles */}
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            title="Bật/Tắt phụ đề chữ"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
              showSubtitles ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={onClose}
            title="Kết thúc đàm thoại"
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition shadow-xl shadow-rose-600/30 hover:scale-105 active:scale-95"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
