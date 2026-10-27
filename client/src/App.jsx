import React, { useState, useEffect, useMemo } from 'react';
import { createNavigation, courseBackPath } from './lib/navigation';
import Navbar from './components/Navbar';
import SearchModal from './components/SearchModal';
import CourseCatalog from './views/CourseCatalog';
import CourseDetail from './views/CourseDetail';
import LabWorkspace from './views/LabWorkspace';
import CourseAssessment from './views/CourseAssessment';
import LearningPath from './views/LearningPath';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import GlobalAiAssistant from './components/GlobalAiAssistant';

function routeFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  try {
    if (parts[0] === 'paths' && parts[1]) return { view: 'path', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'courses' && parts[1]) return { view: 'course', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'labs' && parts[1]) return { view: 'lab', id: decodeURIComponent(parts[1]), courseId: new URLSearchParams(window.location.search).get('courseId') };
    if (parts[0] === 'assessments' && parts[1]) return {view: 'assessment', id: decodeURIComponent(parts[1])};
  } catch { /* Fallback to catalog */ }
  return { view: 'catalog' };
}

export default function App() {
  const navigation = useMemo(() => createNavigation(window), []);
  const [route, setRoute] = useState(routeFromPath);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem('labex.theme') === 'dark'; } catch { return false; }
  });

  const navigate = (path, options) => {
    navigation.open(path, options);
    setRoute(routeFromPath());
  };
  const goBack = fallback => {
    if (!navigation.back(fallback)) setRoute(routeFromPath());
  };

  const selectCourse = id => navigate(`/courses/${encodeURIComponent(id)}`);
  const selectPath = alias => navigate(`/paths/${encodeURIComponent(alias)}`);
  const startLab = (id, courseId) => navigate(`/labs/${encodeURIComponent(id)}${courseId ? '?courseId=' + encodeURIComponent(courseId) : ''}`, { sibling: route.view === 'lab' });

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    const target = navigation.current()?.scroll || 0;
    let restoring = true;
    let frame;
    const restore = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!restoring) return;
        const ready = document.querySelector('[data-route-ready]') || route.view === 'lab' || route.view === 'assessment';
        if (!ready) return;
        window.scrollTo({ top: target, behavior: 'instant' });
        restoring = false;
      });
    };
    const observer = new MutationObserver(restore);
    observer.observe(document.querySelector('main'), { childList: true, subtree: true });
    const cancel = () => { restoring = false; };
    const save = () => { if (!restoring) navigation.save(); };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('scroll', save, { passive: true });
    restore();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('scroll', save);
    };
  }, [route, navigation]);

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
            const parentPath = navigation.current()?.parent?.path;
            navigate(route.view === 'path' ? `/paths/${route.id}` : parentPath?.startsWith('/paths/') ? parentPath : route.id?.startsWith('windows-') ? '/paths/windows' : '/paths/linux');
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
            onSelectPath={selectPath}
            onBack={() => goBack('/learn')}
            onSelectCourse={selectCourse}
          />
        )}
        {route.view === 'course' && (
          <CourseDetail
            key={route.id}
            courseId={route.id}
            onBack={course => goBack(courseBackPath(course))}
            backLabel={navigation.current()?.parent?.path?.startsWith('/paths/') ? 'Trở về lộ trình' : navigation.current()?.parent?.path === '/learn' ? 'Tất cả khóa học' : undefined}
            onStartLab={id => startLab(id, route.id)}
            onStartAssessment={id => navigate(`/assessments/${encodeURIComponent(id)}`)}
          />
        )}
        {route.view === 'lab' && (
          <LabWorkspace
            key={route.id + (route.courseId || '')}
            labId={route.id}
            courseId={route.courseId}
            onBackToCourse={id => goBack(id ? `/courses/${encodeURIComponent(id)}` : '/learn')}
            onStartLab={startLab}
            onStartAssessment={id => navigate(`/assessments/${encodeURIComponent(id)}`)}
          />
        )}
        {route.view === 'assessment' && <CourseAssessment key={route.id} assessmentId={route.id}
          onBack={() => selectCourse('quick-start-with-linux')}
          onOpenLab={id => startLab(id, 'quick-start-with-linux')}/>}
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
      {route.view !== 'lab' && (
        <GlobalAiAssistant currentView={route.view} currentId={route.id} />
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCourse={selectCourse}
      />
    </div>
  );
}
