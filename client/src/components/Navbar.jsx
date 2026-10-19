import React, { useEffect, useState } from 'react';
import { Search, Moon, Sun, BookOpen, Layers, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function Navbar({ currentView, setView, onOpenSearch, isDarkMode, setIsDarkMode, onSkillTrees }) {
  const [langState, setLangState] = useState(() => {
    try { return localStorage.getItem('labex.language') || 'vi'; } catch { return 'vi'; }
  });
  const [environment, setEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const load = () => {
      api('/api/health', { signal: controller.signal })
        .then(data => {
          setEnvironment(data.environment || { available: false, label: 'Linux' });
          setLoading(false);
        })
        .catch(error => {
          if (error.name !== 'AbortError') {
            setEnvironment({ available: false, label: 'Môi trường chưa sẵn sàng', error: error.message });
            setLoading(false);
          }
        });
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [attempt]);

  const environmentName = environment?.label || environment?.shell || 'Isolated Linux';
  const isAvailable = environment?.available === true;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap gap-2 items-center justify-between">
        {/* Left: Brand & Navigation Tabs */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setView('catalog')}
            className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400 group-hover:text-pink-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 17l6-6-6-6" />
                  <path d="M12 19h8" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">LabEx</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white uppercase tracking-wider shadow-xs">
                Studio
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
            <button 
              onClick={() => setView('catalog')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentView === 'catalog' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 font-bold' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <BookOpen className="w-4 h-4" />
              Khóa học (Learn)
            </button>
            <button 
              onClick={onSkillTrees}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                currentView === 'path' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 font-bold' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <Layers className="w-4 h-4" />
              Lộ trình (Roadmaps)
            </button>
          </nav>
        </div>

        {/* Right: Controls & Linux Status */}
        <div className="flex items-center gap-2">
          {/* WSL Linux Status Badge */}
          {loading ? (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Đang kiểm tra môi trường...</span>
            </div>
          ) : isAvailable ? (
            <div 
              title={environment?.setupProvenance || 'Môi trường Isolated Linux đang sẵn sàng'}
              className="hidden xl:flex max-w-60 items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate" title={environmentName}>{environmentName} · Sẵn sàng</span>
            </div>
          ) : (
            <div 
              title={environment?.error || 'Môi trường Linux chưa thể khởi động'}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Chưa sẵn sàng</span>
              <button 
                onClick={() => setAttempt(a => a + 1)}
                title="Thử kết nối lại"
                className="ml-1 underline hover:text-amber-900 dark:hover:text-amber-100">
                Thử lại
              </button>
            </div>
          )}

          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Tìm kiếm khóa học"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Tìm kiếm...</span>
            <kbd className="hidden lg:inline text-[10px] font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border dark:border-gray-600 text-gray-400">Ctrl K</kbd>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => {
              const next = langState === 'vi' ? 'en' : 'vi';
              try { localStorage.setItem('labex.language', next); } catch { /* Storage is optional. */ }
              window.dispatchEvent(new CustomEvent('labex-lang-change', { detail: next }));
              setLangState(next);
            }}
            title={langState === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
            <span>{langState === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label={isDarkMode ? 'Dùng giao diện sáng' : 'Dùng giao diện tối'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
