import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function SearchModal({ isOpen, onClose, onSelectCourse }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(0);
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen) { setQuery(''); setResults([]); return; }
    const previousFocus = document.activeElement;
    const onKey = event => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key === 'Tab') {
        const items = [...dialog.current.querySelectorAll('input,button')].filter(item => !item.disabled);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, [isOpen]);
  useEffect(() => {
    setSelected(0); setError(''); setResults([]);
    if (!isOpen || !query.trim()) { setLoading(false); return; }
    const controller = new AbortController(); setLoading(true);
    const timer = setTimeout(() => {
      api(`/api/courses?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal }).then(data => setResults(data.courses || [])).catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, isOpen]);
  if (!isOpen) return null;
  const choose = course => { onSelectCourse(course.id); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="Tìm khóa học" className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center px-4 py-3.5 border-b dark:border-gray-700 gap-3"><Search className="w-5 h-5 text-gray-400" /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setSelected(value => Math.min(results.length - 1, value + 1)); } if (event.key === 'ArrowUp') { event.preventDefault(); setSelected(value => Math.max(0, value - 1)); } if (event.key === 'Enter' && results[selected]) choose(results[selected]); }} placeholder="Tìm khóa học, Linux, chmod, Docker..." aria-label="Từ khóa tìm kiếm" className="flex-1 min-w-0 bg-transparent text-base dark:text-white focus:outline-none" /><button aria-label="Đóng tìm kiếm" onClick={onClose} className="p-1 text-gray-400"><X className="w-5 h-5" /></button></div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {loading ? <p role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />Đang tìm kiếm...</p> : error ? <p role="alert" className="p-4 text-sm text-red-500">{error}</p> : results.length ? results.map((course, index) => <button key={course.id} onClick={() => choose(course)} className={`w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl transition ${selected === index ? 'bg-primary-50 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}><BookOpen className="w-5 h-5 shrink-0 text-primary-500" /><span className="flex-1 min-w-0"><strong className="block text-sm text-gray-900 dark:text-white">{course.name}</strong><span className="block text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{course.description}</span></span><ArrowRight className="w-4 h-4 text-gray-400" /></button>) : query ? <p className="py-8 text-center text-sm text-gray-500">Không tìm thấy khóa học cho “{query}”.</p> : <div className="p-4 text-xs text-gray-500"><p className="mb-3">Từ khóa gợi ý · ↑ ↓ để chọn, Enter để mở</p><div className="flex flex-wrap gap-2">{['Linux', 'Quick Start', 'chmod', 'Docker', 'Git', 'AWS'].map(keyword => <button key={keyword} onClick={() => setQuery(keyword)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md dark:text-gray-200">{keyword}</button>)}</div></div>}
        </div>
      </div>
    </div>
  );
}
