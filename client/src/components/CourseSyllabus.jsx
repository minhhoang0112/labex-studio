import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

function LessonOutline({ labId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    api(`/api/labs/${encodeURIComponent(labId)}/reference`, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [labId, attempt]);
  if (error) return <div role="alert" className="mt-3 text-sm text-red-600">{error} <button className="underline" onClick={() => setAttempt(value => value + 1)}>Thử lại</button></div>;
  if (!data) return <p role="status" className="mt-3 text-sm">Đang tải cấu trúc bài…</p>;
  const sections = data.outline?.sections || [];
  return <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
    <p className="mb-2">Cấu trúc tham chiếu; chưa phải toàn văn hướng dẫn thực hành local.</p>
    <ol className="list-decimal pl-6 space-y-1">{sections.map((section, index) =>
      <li key={section.id || index}>{section.title || section.name || 'Mục bài học'}</li>)}</ol>
    {!sections.length && <p>Chưa có danh sách mục cho bài này.</p>}
  </div>;
}

export default function CourseSyllabus({ stages, onStartLab, lang }) {
  const [expanded, setExpanded] = useState(null);
  if (!stages.length) return null;
  return <section className="mt-10 space-y-5" aria-label="Giáo trình nguồn">
    <h2 className="text-2xl font-bold">{lang === 'en' ? 'Source syllabus' : 'Giáo trình nguồn'}</h2>
    <p className="text-sm text-slate-500">Danh sách theo thứ tự nguồn. Bài chưa triển khai local có cấu trúc tham khảo và liên kết tới nguồn.</p>
    {stages.map((stage, index) => <div key={stage.name || index} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h3 className="font-bold mb-3">{stage.name}</h3>
      <ol className="space-y-3">{(stage.labs || []).map(lesson => <li key={lesson.id} className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex flex-wrap justify-between gap-2 items-center">
          <span className="min-w-0 break-words font-medium">{lesson.order}. {lesson.title}</span>
          <div className="flex flex-wrap gap-3 text-sm shrink-0">
            {lesson.availability?.can_open === true && <button className="text-primary-600 dark:text-primary-400 font-semibold" onClick={() => onStartLab(lesson.id)}>Mở bài local</button>}
            <button aria-expanded={expanded === lesson.id} className="underline" onClick={() => setExpanded(value => value === lesson.id ? null : lesson.id)}>Xem cấu trúc</button>
            {lesson.source_url && <a href={lesson.source_url} target="_blank" rel="noreferrer" className="text-primary-600 dark:text-primary-400">Bài tại LabEx ↗</a>}
          </div>
        </div>
        {lesson.availability?.can_open !== true && <p className="text-xs text-slate-500 mt-1">Chưa có thực hành local</p>}
        {expanded === lesson.id && <LessonOutline labId={lesson.id} />}
      </li>)}</ol>
    </div>)}
  </section>;
}
