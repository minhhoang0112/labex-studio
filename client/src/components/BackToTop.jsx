import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(() => window.scrollY > 400);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Về đầu trang"
      title="Về đầu trang"
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      })}
      className="fixed bottom-6 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-primary-600 text-white shadow-lg shadow-primary-900/20 transition hover:bg-primary-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 sm:bottom-8 sm:right-8 motion-safe:hover:-translate-y-1"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
