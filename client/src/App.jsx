import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchModal from './components/SearchModal';
import CourseCatalog from './views/CourseCatalog';
import CourseDetail from './views/CourseDetail';
import LabWorkspace from './views/LabWorkspace';
import LearningPath from './views/LearningPath';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';

function routeFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  try {
    if (parts[0] === 'paths' && parts[1]) return { view: 'path', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'courses' && parts[1]) return { view: 'course', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'labs' && parts[1]) return { view: 'lab', id: decodeURIComponent(parts[1]), courseId: new URLSearchParams(window.location.search).get('courseId') };
  } catch { /* Fallback to catalog */ }
  return { view: 'catalog' };
}

export default function App() {
  const [route, setRoute] = useState(routeFromPath);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem('labex.theme') === 'dark'; } catch { return false; }
  });

  const navigate = path => {
    window.history.pushState({}, '', path);
    setRoute(routeFromPath());
    window.scrollTo(0, 0);
  };

  const selectCourse = id => navigate(`/courses/${encodeURIComponent(id)}`);
  const selectPath = alias => navigate(`/paths/${encodeURIComponent(alias)}`);
  const startLab = (id, courseId) => navigate(`/labs/${encodeURIComponent(id)}${courseId ? '?courseId=' + encodeURIComponent(courseId) : ''}`);

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath());
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (routeFromPath().view === 'lab' || document.querySelector('[aria-modal="true"]')) return;
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try { localStorage.setItem('labex.theme', isDarkMode ? 'dark' : 'light'); } catch { /* Optional */ }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {route.view !== 'lab' && (
        <Navbar
          currentView={route.view}
          setView={() => navigate('/learn')}
          onOpenSearch={() => setIsSearchOpen(true)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onSkillTrees={() => {
            navigate('/paths/linux');
          }}
        />
      )}

      <main className="flex-1">
        {route.view === 'catalog' && (
          <CourseCatalog
            onSelectCourse={selectCourse}
            onSelectPath={selectPath}
          />
        )}
        {route.view === 'path' && (
          <LearningPath
            key={route.id}
            pathAlias={route.id}
            onBack={() => navigate('/learn')}
            onSelectCourse={selectCourse}
          />
        )}
        {route.view === 'course' && (
          <CourseDetail
            key={route.id}
            courseId={route.id}
            onBack={() => navigate('/learn')}
            onStartLab={id => startLab(id, route.id)}
          />
        )}
        {route.view === 'lab' && (
          <LabWorkspace
            key={route.id + (route.courseId || '')}
            labId={route.id}
            courseId={route.courseId}
            onBackToCourse={id => id ? selectCourse(id) : navigate('/learn')}
            onStartLab={startLab}
          />
        )}
      </main>

      {route.view !== 'lab' && (
        <Footer
          onSelectPath={selectPath}
          onSelectTopic={(topic) => {
            selectPath(topic);
          }}
        />
      )}

      {route.view !== 'lab' && <BackToTop />}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCourse={selectCourse}
      />
    </div>
  );
}
