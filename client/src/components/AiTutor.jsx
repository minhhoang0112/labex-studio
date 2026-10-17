import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function AiTutor({ lab, currentStep, lastTerminalOutput, externalPrompt, onClearExternalPrompt }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là **Labby**, trợ lý học Linux. Bạn có thể hỏi về nhiệm vụ hiện tại, ý nghĩa câu lệnh hoặc lỗi trong terminal. Khi chưa cấu hình dịch vụ AI, tôi cung cấp hướng dẫn offline theo bài học.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const [notice, setNotice] = useState('');
  const messagesEndRef = useRef(null);
  const inFlight = useRef(false);
  const request = useRef(null);
  const [pendingPrompts, setPendingPrompts] = useState([]);
  const lastExternal = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (userMessage) => {
    const textToSend = userMessage || input.trim();
    if (!textToSend || inFlight.current) return;
    inFlight.current = true;
    const controller = new AbortController(); request.current = controller;

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const data = await api('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-8),
          context: {
            labTitle: lab?.title,
            stepTitle: currentStep?.title,
            task: currentStep?.task,
            hint: currentStep?.hint,
            terminalOutput: lastTerminalOutput?.slice(-1000) // Last 1000 chars of terminal
          }
        }),
        signal: controller.signal
      });
      setMode(data.mode || null);
      setNotice(data.notice || '');
      setMessages([...newMessages, { role: 'assistant', content: data.reply || 'Không nhận được phản hồi.' }]);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: `⚠️ ${e.message || 'Không thể kết nối đến máy chủ AI. Hãy thử lại.'}`
      }]);
    } finally {
      setIsLoading(false);
      inFlight.current = false;
    }
  }, [input, messages, lab, currentStep, lastTerminalOutput]);

  useEffect(() => {
    if (externalPrompt && externalPrompt !== lastExternal.current) {
      lastExternal.current = externalPrompt;
      setPendingPrompts(previous => [...previous, typeof externalPrompt === 'string' ? externalPrompt : externalPrompt.text]);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt, onClearExternalPrompt]);
  useEffect(() => {
    if (!pendingPrompts.length || isLoading || inFlight.current) return;
    handleSendMessage(pendingPrompts[0]);
    setPendingPrompts(previous => previous.slice(1));
  }, [pendingPrompts, isLoading, handleSendMessage]);

  const quickPrompts = [
    { label: 'Gợi ý bước này', text: 'Hãy cho tôi gợi ý giải quyết nhiệm vụ ở bước hiện tại.' },
    { label: 'Giải thích lỗi Terminal', text: 'Tôi vừa gặp lỗi trên terminal, hãy giải thích nguyên nhân và cách khắc phục.' },
    { label: 'Giải thích lệnh này', text: 'Hãy giải thích ý nghĩa các câu lệnh trong bài lab này.' },
  ];
  const modeLabel = { offline: 'Hướng dẫn offline', gemini: 'Gemini', openai: 'OpenAI' }[mode] || 'Chưa gửi yêu cầu';

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
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                {modeLabel}
              </span>
            </h3>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-amber-500" />
      </div>

      {notice && <p role="status" className="shrink-0 px-4 py-2 border-b border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200">{notice}</p>}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-indigo-600 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-tr-none' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50'
            }`}>
              <div className="prose-lab text-xs sm:text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
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
      {pendingPrompts.length > 0 && <p role="status" className="px-3 text-xs text-gray-500">{pendingPrompts.length} câu hỏi đang chờ gửi.</p>}
      <div className="px-3 py-2 border-t dark:border-gray-800 flex gap-1.5 overflow-x-auto bg-gray-50/50 dark:bg-gray-800/30">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.text)}
            disabled={isLoading}
            className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 transition shadow-xs">
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="p-3 border-t dark:border-gray-800 flex gap-2 bg-white dark:bg-gray-900">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi AI về bài lab hoặc dán dòng báo lỗi..."
          className="flex-1 text-sm px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

