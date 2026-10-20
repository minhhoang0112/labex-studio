import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';
import VoiceCallModal from './VoiceCallModal';
import { createSpeechPlayer } from '../lib/speechPlayer';
import { recognitionErrorMessage } from '../lib/voiceSession';
import {
  Bot, Send, Sparkles, User, Loader2, Mic, MicOff,
  Volume2, VolumeX, Briefcase, GraduationCap, X, 
  MessageSquare, Radio, ChevronDown, Sparkle
} from 'lucide-react';

export default function GlobalAiAssistant({ currentView, currentId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [persona, setPersona] = useState('tutor'); // 'tutor' | 'interviewer'
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Xin chào! Tôi là **Labby**, trợ lý học tập & phỏng vấn thông minh của **LabEx Studio**. \n\nTôi có thể tư vấn lộ trình học Linux / Windows Server / Cloud, giải thích kiến thức kỹ thuật hoặc **luyện phỏng vấn trực tiếp** với bạn qua giọng nói. Bạn cần tôi hỗ trợ gì hôm nay? 👋`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);

  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const inFlightRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const playNaturalSpeech = text => {
    audioPlayerRef.current?.pause();
    const player=createSpeechPlayer(); audioPlayerRef.current=player;
    player.speak(text).catch(()=>player.stop());
  };

  const toggleListening = () => {
    if (isVoiceCallOpen) return;
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Hãy dùng Google Chrome hoặc Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    audioPlayerRef.current?.pause();
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
        setInput(transcript);
      };
      recognition.onerror = event => { setIsListening(false); if (!['aborted','no-speech'].includes(event.error)) setMessages(items=>[...items,{role:'assistant',content:recognitionErrorMessage(event.error),error:true}]); };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSendCandidate) => {
    const textToSend = (typeof textToSendCandidate === 'string' ? textToSendCandidate : input).trim();
    if (!textToSend || inFlightRef.current) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }

    const updated = [...messages, { role: 'user', content: textToSend }];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    inFlightRef.current = controller;

    try {
      const data = await api('/api/ai/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          persona,
          context: {
            page: currentView,
            targetId: currentId,
            platform: 'all',
            labTitle: currentView === 'course' ? `Khóa học ${currentId}` : 'Trang chủ LabEx Studio',
          },
          history: updated.slice(-6).map(({ role, content }) => ({ role, content })),
        }),
      });

      if (controller.signal.aborted) return;
      const reply = data.reply || 'Tôi đã nhận được thông tin, hãy tiếp tục nhé.';
      setMessages([...updated, { role: 'assistant', content: reply }]);

      if (autoVoice) {
        playNaturalSpeech(reply);
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setMessages([...updated, { role: 'assistant', content: 'Tạm thời chưa kết nối được dịch vụ AI. Hãy thử lại.', error: true }]);
    } finally {
      if (inFlightRef.current === controller) inFlightRef.current = null;
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  const quickPrompts = persona === 'tutor' ? [
    { label: '🧭 Lộ trình học Linux cho người mới?', text: 'Tư vấn cho tôi lộ trình học Linux bài bản từ con số 0 đến tự tin đi làm.' },
    { label: '⚖️ Nên học Linux hay Windows Server?', text: 'Nên học Linux hay Windows Server trước cho mục tiêu SysAdmin / Cloud?' },
    { label: '🏆 Chứng chỉ CompTIA Linux+ có tác dụng gì?', text: 'Chứng chỉ CompTIA Linux+ cần ôn tập những kiến thức trọng tâm nào?' },
    { label: '⚡ Cách sử dụng phòng lab hiệu quả?', text: 'Hướng dẫn tôi cách tận dụng tối đa terminal và phòng lab trên LabEx Studio.' },
  ] : [
    { label: '🎙️ Bắt đầu phỏng vấn thử việc', text: 'Bắt đầu phỏng vấn tôi về kiến thức Linux & DevOps ngay bây giờ!' },
    { label: '⚠️ Tình huống sự cố máy chủ', text: 'Hãy đưa ra một tình huống thực tế máy chủ bị treo hoặc quá tải CPU và hỏi cách xử lý.' },
    { label: '⭐ Đánh giá trình độ kỹ thuật', text: 'Tôi muốn được test kiến thức chuyên sâu về quản trị hệ thống và mạng.' },
  ];

  return (
    <>
      {/* Floating Action Trigger Button (Bottom-Right, Compact Circular FAB) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40">
          <button
            onClick={() => setIsOpen(true)}
            title="Mở trợ lý Labby AI & Voice Mode"
            aria-label="Mở trợ lý Labby AI"
            className="group relative flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-gradient-to-tr from-primary-600 via-indigo-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white shadow-xl shadow-primary-500/30 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary-300"
          >
            {/* Online status indicator */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900"></span>
            </span>

            <Bot className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />

            {/* Mini mic badge */}
            <span className="absolute -bottom-0.5 -left-0.5 p-1 bg-amber-500 text-white rounded-full shadow-xs">
              <Mic className="w-2.5 h-2.5" />
            </span>
          </button>
        </div>
      )}

      {/* Floating Slide-over / Modal Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-black text-sm">
                  <span>Labby AI Hub</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Online</span>
                </div>
                <p className="text-[10px] text-slate-400">Trợ lý học tập & Luyện phỏng vấn</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAutoVoice(!autoVoice)}
                disabled={isVoiceCallOpen}
                title={autoVoice ? "Tắt đọc giọng nói" : "Bật đọc giọng nói tiếng Việt"}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  autoVoice ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-white/10 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {autoVoice ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persona Switcher & Voice Call Mode Trigger Banner */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {/* Big prominent button for ChatGPT Voice Mode */}
            <button
              onClick={() => { audioPlayerRef.current?.pause(); inFlightRef.current?.abort(); setIsLoading(false); setAutoVoice(false); try { recognitionRef.current?.abort(); } catch {} setIsListening(false); setIsVoiceCallOpen(true); }}
              disabled={isVoiceCallOpen}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <Radio className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>Bật Chế Độ Thoại Trực Tiếp (Voice Mode)</span>
              <Mic className="w-3.5 h-3.5 text-amber-300" />
            </button>

            {/* Persona Switcher Pills */}
            <div className="grid grid-cols-2 gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setPersona('tutor')}
                className={`py-1 px-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                  persona === 'tutor'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Gia Sư & Lộ Trình</span>
              </button>

              <button
                onClick={() => setPersona('interviewer')}
                className={`py-1 px-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                  persona === 'interviewer'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Luyện Phỏng Vấn</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white dark:bg-slate-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : persona === 'interviewer'
                        ? 'bg-amber-600 text-white'
                        : 'bg-indigo-600 text-white'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : persona === 'interviewer' ? <Briefcase className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <div className="prose-lab text-xs sm:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="mt-1 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 flex justify-end">
                      <button
                        onClick={() => playNaturalSpeech(msg.content)}
                        title="Nghe giọng đọc câu trả lời"
                        className="p-1 rounded text-slate-400 hover:text-primary-600 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span>{persona === 'interviewer' ? 'Tech Lead đang đánh giá...' : 'Labby đang suy nghĩ...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto bg-slate-50/70 dark:bg-slate-950/40">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(qp.text)}
                className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary-400 hover:text-primary-600 transition shadow-2xs"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Form with Mic Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            <div className="relative flex-1 flex items-center">
              <input
                aria-label="Câu hỏi cho Labby AI"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening
                    ? "🎙️ Đang nghe bạn nói... (nói xong hãy bấm Gửi)"
                    : persona === 'interviewer'
                      ? "Trả lời phỏng vấn hoặc bấm Mic để nói..."
                      : "Hỏi về lộ trình, bài học hoặc bấm Mic nói..."
                }
                className={`w-full text-xs sm:text-sm pl-3 pr-9 py-2 rounded-xl border transition ${
                  isListening
                    ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 ring-2 ring-rose-400/30'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500'
                }`}
              />

              <button
                type="button"
                onClick={toggleListening}
                disabled={isVoiceCallOpen}
                title={isVoiceCallOpen ? 'Mic đang dùng trong cuộc gọi' : isListening ? "Dừng ghi âm" : "Nói chuyện bằng giọng nói tiếng Việt"}
                className={`absolute right-1.5 p-1.5 rounded-full transition ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-slate-400 hover:text-primary-600'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              aria-label="Gửi câu hỏi"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition disabled:opacity-40 shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Compact Interactive ChatGPT Voice Call Dock / Floating Modal */}
      <VoiceCallModal
        key={isVoiceCallOpen ? `voice-${persona}` : 'voice-closed'}
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        initialPersona={persona}
        lab={{
          id: currentId,
          title_vi: currentView === 'catalog' 
            ? 'Khám phá Khóa học & Lộ trình' 
            : currentView === 'path' 
              ? `Lộ trình kỹ năng (${currentId})` 
              : `Khóa học (${currentId})`
        }}
      />
    </>
  );
}

