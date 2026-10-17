import React, { useEffect, useRef } from 'react';

export default function Dialog({ titleId, children, onClose, busy = false, className = '' }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => { closeRef.current = onClose; busyRef.current = busy; }, [onClose, busy]);
  useEffect(() => {
    const previous = document.activeElement;
    const focusable = () => [...panel.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length);
    (focusable()[0] || panel.current)?.focus();
    const onKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        if (!busyRef.current) closeRef.current();
      }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0], last = items.at(-1);
        if (!first) { event.preventDefault(); panel.current.focus(); return; }
        if (event.shiftKey && (document.activeElement === first || !panel.current.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.current.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1}
      className={`max-h-[calc(100dvh-2rem)] overflow-y-auto outline-none ${className}`}>{children}</div>
  </div>;
}
