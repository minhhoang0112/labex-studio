import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from '../lib/api';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";

export default function AiTutor({
  lab,
  currentStep,
  lastTerminalOutput,
  externalPrompt,
  onClearExternalPrompt,
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Xin chào! Tôi là **Labby**, trợ lý AI của bạn. Tôi có thể giúp bạn giải thích câu lệnh, bắt lỗi trên terminal hoặc gợi ý cách vượt qua các bài Lab. Hãy hỏi tôi bất cứ điều gì nhé! 👋`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('idle');
  const [model, setModel] = useState('');
  const inFlight = useRef(null);
  const messagesEndRef = useRef(null);
  useEffect(() => () => inFlight.current?.abort(), []);

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

  const handleSendMessage = async (userMessage) => {
    const candidate = typeof userMessage === 'string' ? userMessage : input;
    const textToSend = candidate.trim();
    if (!textToSend || inFlight.current) return;
    const controller = new AbortController();
    inFlight.current = controller;

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

  const quickPrompts = [
    {
      label: "Gợi ý bước này",
      text: "Hãy cho tôi gợi ý giải quyết nhiệm vụ ở bước hiện tại.",
    },
    {
      label: "Giải thích lỗi Terminal",
      text: "Tôi vừa gặp lỗi trên terminal, hãy giải thích nguyên nhân và cách khắc phục.",
    },
    {
      label: "Giải thích lệnh này",
      text: "Hãy giải thích ý nghĩa các câu lệnh trong bài lab này.",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              Labby AI Tutor
              <span role="status" title={model || 'Trạng thái dựa trên phản hồi thực tế của API'} className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                {isLoading ? 'Đang trả lời…' : ({ idle: 'Chưa gửi yêu cầu', gemini: 'Gemini', openai: 'OpenAI', offline: 'Offline', error: 'Lỗi kết nối', unknown: 'Đã phản hồi' }[mode])}
              </span>
            </h3>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-amber-500" />
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
                  : "bg-indigo-600 text-white"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
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
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            <span>Labby đang suy nghĩ câu trả lời...</span>
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
            className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 transition shadow-xs"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t dark:border-gray-800 flex gap-2 bg-white dark:bg-gray-900"
      >
        <input
          aria-label="Câu hỏi cho Labby AI"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi AI về bài lab hoặc dán dòng báo lỗi..."
          className="flex-1 text-sm px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          aria-label="Gửi câu hỏi cho Labby AI"
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
