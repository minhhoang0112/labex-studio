import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Expand, X } from 'lucide-react';
import Dialog from './Dialog';

export default function GuideImage({ src, alt = '', title, isVi = true }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <span className="block my-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700">
    <button type="button" onClick={() => setOpen(true)} aria-label={`${isVi ? 'Phóng to hình' : 'Enlarge image'}: ${alt}`}
      className="group relative block w-full cursor-zoom-in text-left focus-visible:outline-2 focus-visible:outline-blue-500">
      <img src={src} alt={alt} title={title} loading="lazy" className="block w-full h-auto !m-0" />
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] text-blue-700 shadow border border-blue-100"><Expand size={12} />{isVi ? 'Phóng to' : 'Enlarge'}</span>
    </button>
    <span className="block border-t border-slate-100 px-3 py-2 text-xs text-slate-600">{alt}</span>
    {open && createPortal(<Dialog titleId={id} onClose={() => setOpen(false)} className="w-full max-w-5xl rounded-xl bg-white shadow-xl">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white p-3">
        <strong id={id} className="flex-1 text-sm text-slate-900">{alt}</strong>
        <button onClick={() => setOpen(false)} aria-label={isVi ? 'Đóng hình' : 'Close image'} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"><X size={20} /></button>
      </div>
      <div className="overflow-auto p-2"><img src={src} alt={alt} className="block h-auto w-auto max-w-full min-w-[640px] mx-auto !my-0" /></div>
    </Dialog>, document.body)}
  </span>;
}
