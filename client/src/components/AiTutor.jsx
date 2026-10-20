import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from '../lib/api';
import VoiceCallModal from './VoiceCallModal';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Briefcase,
  GraduationCap,
  Square,
  HelpCircle,
  Radio,
} from "lucide-react";

// Clean markdown text for natural, pleasant speech synthesis
function cleanMarkdownForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' đoạn mã đã hiển thị trên màn hình. ') // replace code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/[#*_~>]/g, '') // markdown symbols
    .replace(/\n+/g, '. ')
    .trim();
}

export default function AiTutor({
  lab,
  currentStep,
  lastTerminalOutput,
  externalPrompt,
  onClearExternalPrompt,
}) {
  const [persona, setPersona] = useState('tutor'); // 'tutor' | 'interviewer'
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Xin chào! Tôi là **Labby**, trợ lý gia sư AI của bạn. Tôi có thể giúp bạn giải thích câu lệnh, bắt lỗi trên terminal hoặc gợi ý cách hoàn thành bài lab. Bạn có thể gõ phím hoặc **bấm Mic 🎙️ để nói chuyện trực tiếp** với tôi nhé! 👋`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('idle');
  const [model, setModel] = useState('');
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const inFlight = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check speech synthesis & recognition support
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(Boolean(SpeechRecognition));

    return () => {
      inFlight.current?.abort();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external prompts (e.g. from LabGuide "Ask AI about this step")
  useEffect(() => {
    if (externalPrompt && !inFlight.current) {
      handleSendMessage(typeof externalPrompt === 'string' ? externalPrompt : externalPrompt.text);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt, isLoading]);

  // Text-To-Speech helper
  const speakText = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = cleanMarkdownForSpeech(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('vietnamese'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Speech-To-Text helper
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech. Hãy mở trên Chrome hoặc Edge để sử dụng micro nói chuyện với AI!");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    stopSpeaking();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Switch persona handler
  const handleSwitchPersona = (newPersona) => {
    if (newPersona === persona) return;
    setPersona(newPersona);
    stopSpeaking();
    if (newPersona === 'interviewer') {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Chào mừng bạn đến với **Chế độ Luyện Phỏng Vấn Kỹ Thuật (Mock Interview)**! 👔\n\nTôi sẽ đóng vai Tech Lead / Senior Interviewer phỏng vấn trực tiếp bạn các câu hỏi thực chiến về **${lab?.title_vi || lab?.title || 'Hệ thống & Cloud'}**. Tôi sẽ chấm điểm (thang điểm 10) và gợi ý câu trả lời chuẩn Senior.\n\nHãy bấm **"Bắt đầu phỏng vấn bài này"** hoặc dùng Mic nói chuyện để bắt đầu!`,
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Đã chuyển về **Chế độ Trợ Giảng Lab (Lab Tutor)** 🎓. Tôi luôn sẵn sàng gợi ý từng bước, giải thích lệnh và bắt lỗi terminal giúp bạn hoàn thành bài lab!`,
        }
      ]);
    }
  };

  const handleSendMessage = async (userMessage) => {
    const candidate = typeof userMessage === 'string' ? userMessage : input;
    const textToSend = candidate.trim();
    if (!textToSend || inFlight.current) return;
    const controller = new AbortController();
    inFlight.current = controller;

    stopSpeaking();
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }

    const newMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const data = await api('/api/ai/chat', {
        method: "POST",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          persona,
          context: {
            labId: lab?.id,
            platform: lab?.id?.startsWith('win-') ? 'windows' : 'linux',
            labTitle: lab?.title_vi || lab?.title,
            stepTitle: currentStep?.title_vi || currentStep?.title,
            task: currentStep?.task_vi || currentStep?.task,
            hint: currentStep?.hint_vi || currentStep?.hint,
            content: (currentStep?.translation_needs_review ? currentStep.content : currentStep?.content_vi || currentStep?.content || '').slice(0, 5000),
            terminalOutput: lastTerminalOutput?.slice(-4000),
          },
          history: messages.filter(item => !item.error && ['user', 'assistant'].includes(item.role))
            .slice(1).slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });

      if (controller.signal.aborted) return;
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Dịch vụ AI trả về phản hồi trống. Hãy thử lại.');
      setMode(data.mode === 'offline' ? 'offline' : ['gemini', 'openai'].includes(data.mode) ? data.mode : 'unknown');
      setModel(data.model || '');
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply,
          notice: data.notice,
        },
      ]);

      // If auto voice reading is enabled, speak the answer
      if (autoVoice) {
        speakText(data.reply);
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setMode('error');
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: e.name === 'TimeoutError' ? 'Dịch vụ AI chưa phản hồi trong thời gian chờ. Hãy thử gửi lại.'
            : e.status ? `Không gửi được câu hỏi: ${e.message}` : 'Không kết nối được API trợ lý của trang. Hãy tải lại trang và thử gửi lại.',
          error: true,
        },
      ]);
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  const quickPrompts = persona === 'tutor' ? [
    {
      label: "💡 Gợi ý bước này",
      text: "Hãy cho tôi gợi ý giải quyết nhiệm vụ ở bước hiện tại.",
    },
    {
      label: "🔍 Giải thích lỗi Terminal",
      text: "Tôi vừa gặp lỗi trên terminal, hãy phân tích lỗi gần nhất và chỉ cách khắc phục.",
    },
    {
      label: "📋 Tóm tắt lệnh cần dùng",
      text: "Hãy tóm tắt ngắn gọn các câu lệnh và cú pháp chính cần sử dụng trong bước này.",
    },
  ] : [
    {
      label: "🎙️ Bắt đầu phỏng vấn",
      text: "Bắt đầu phỏng vấn tôi về kiến thức kỹ thuật liên quan đến bài lab này!",
    },
    {
      label: "⚠️ Câu hỏi tình huống sự cố",
      text: "Hãy đưa ra 1 câu hỏi tình huống xử lý sự cố (troubleshooting) thực tế về chủ đề này.",
    },
    {
      label: "⭐ Đánh giá câu trả lời của tôi",
      text: "Hãy nhận xét, chấm điểm và gợi ý câu trả lời chuẩn Senior cho câu hỏi vừa rồi.",
    },
    {
      label: "⏩ Câu hỏi tiếp theo",
      text: "Tôi đã sẵn sàng, hãy đặt câu hỏi phỏng vấn tiếp theo.",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l dark:border-gray-800">
      {/* Header with Persona Switcher and Voice Toggle */}
      <div className="px-3 py-2.5 border-b dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm transition-colors ${
              persona === 'interviewer' ? 'bg-gradient-to-tr from-amber-500 to-rose-600' : 'bg-gradient-to-tr from-primary-500 to-indigo-600'
            }`}>
              {persona === 'interviewer' ? <Briefcase className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                {persona === 'interviewer' ? 'Labby Tech Lead' : 'Labby AI Tutor'}
                <span role="status" title={model || 'Trạng thái dựa trên phản hồi thực tế của API'} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {isLoading ? 'Đang trả lời…' : ({ idle: 'Sẵn sàng', gemini: 'Gemini', openai: 'OpenAI', offline: 'Offline', error: 'Lỗi kết nối', unknown: 'Đã phản hồi' }[mode])}
                </span>
              </h3>
            </div>
          </div>

          {/* Right Header Controls: Stop speech & Auto voice toggle & Voice Mode */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsVoiceCallOpen(true)}
              title="Mở chế độ giao tiếp giọng nói 2 chiều liên tục (như ChatGPT Voice Mode)"
              className="px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
              <span className="hidden sm:inline">Voice Mode</span>
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                title="Dừng phát giọng nói"
                className="p-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 text-[10px] font-semibold flex items-center gap-1 animate-pulse"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Dừng</span>
              </button>
            )}

            <button
              onClick={() => {
                const nextState = !autoVoice;
                setAutoVoice(nextState);
                if (!nextState) stopSpeaking();
              }}
              title={autoVoice ? "Tắt tự động đọc giọng nói" : "Bật tự động đọc giọng nói tiếng Việt"}
              className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                autoVoice 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300' 
                  : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {autoVoice ? <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline font-medium">{autoVoice ? 'Bật đọc' : 'Tắt đọc'}</span>
            </button>
          </div>
        </div>

        {/* Persona Mode Switcher Pills */}
        <div className="grid grid-cols-2 gap-1 bg-gray-200/70 dark:bg-gray-900/80 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => handleSwitchPersona('tutor')}
            className={`py-1 px-2 rounded-md transition flex items-center justify-center gap-1.5 ${
              persona === 'tutor'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Gia Sư Lab</span>
          </button>

          <button
            onClick={() => handleSwitchPersona('interviewer')}
            className={`py-1 px-2 rounded-md transition flex items-center justify-center gap-1.5 ${
              persona === 'interviewer'
                ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Luyện Phỏng Vấn</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.role === "user"
                  ? "bg-primary-600 text-white"
                  : persona === 'interviewer'
                    ? "bg-amber-600 text-white"
                    : "bg-indigo-600 text-white"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : persona === 'interviewer' ? (
                <Briefcase className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-tr-none"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50"
              }`}
            >
              <div className="prose-lab text-xs sm:text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
                {msg.notice && <p role="status" className="mt-2 border-t border-amber-200 pt-2 text-xs text-amber-800 dark:text-amber-300">{msg.notice}</p>}
              </div>

              {/* Speaker button on assistant message bubble */}
              {msg.role === 'assistant' && (
                <div className="mt-1 pt-1 border-t border-gray-200/40 dark:border-gray-700/40 flex justify-end">
                  <button
                    onClick={() => speakText(msg.content)}
                    title="Nghe câu trả lời bằng giọng nói"
                    className="p-1 rounded text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            <span>{persona === 'interviewer' ? 'Tech Lead đang đánh giá...' : 'Labby đang suy nghĩ câu trả lời...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 py-2 border-t dark:border-gray-800 flex gap-1.5 overflow-x-auto bg-gray-50/50 dark:bg-gray-800/30">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(qp.text)}
            className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition shadow-xs"
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
        className="p-2.5 border-t dark:border-gray-800 flex items-center gap-2 bg-white dark:bg-gray-900"
      >
        <div className="relative flex-1 flex items-center">
          <input
            aria-label="Câu hỏi cho Labby AI"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening 
                ? "🎙️ Đang lắng nghe bạn nói... (nói xong hãy bấm Gửi)" 
                : persona === 'interviewer' 
                  ? "Trả lời phỏng vấn hoặc bấm Mic để nói..." 
                  : "Hỏi AI về bài lab hoặc dán dòng báo lỗi..."
            }
            className={`w-full text-sm pl-3.5 pr-10 py-2 rounded-lg border transition ${
              isListening 
                ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 ring-2 ring-rose-400/30' 
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500'
            }`}
          />

          {/* Microphone button inside input on the right */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Dừng ghi âm" : "Nói chuyện bằng giọng nói tiếng Việt"}
            className={`absolute right-2 p-1.5 rounded-full transition ${
              isListening 
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30' 
                : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          aria-label="Gửi câu hỏi cho Labby AI"
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Interactive Hands-free Voice Call Modal (ChatGPT Voice Mode) */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        lab={lab}
        currentStep={currentStep}
        lastTerminalOutput={lastTerminalOutput}
        initialPersona={persona}
      />
    </div>
  );
}
