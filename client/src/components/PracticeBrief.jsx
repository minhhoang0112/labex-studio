import React from 'react';

export default function PracticeBrief({ practice, children }) {
  if (!practice) return children;
  return <div className="space-y-5" data-practice-brief>
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950">
      <p className="text-xs font-bold uppercase text-sky-700 dark:text-sky-300">Đề bài · {practice.machine}</p>
      <p className="mt-2 font-semibold">{practice.ticket}</p>
      <p className="mt-2 text-sm">{practice.identity}</p>
    </div>
    <div><h3 className="font-bold">Việc bạn cần làm</h3>
      <ol className="mt-2 list-decimal space-y-2 pl-5">{practice.tasks.map(item => <li key={item}>{item}</li>)}</ol>
    </div>
    <div><h3 className="font-bold">Kết quả cần bàn giao</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5">{practice.acceptance.map(item => <li key={item}>{item}</li>)}</ul>
    </div>
    <p className="text-sm text-slate-600 dark:text-slate-400">{practice.scope}</p>
    {practice.hints.map((hint, index) => <details key={index} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <summary className="cursor-pointer font-semibold">Gợi ý {index + 1}: {hint.title}</summary>
      <p className="mt-3 leading-relaxed">{hint.text}</p>
    </details>)}
    <details className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <summary className="cursor-pointer font-semibold">Hướng dẫn GUI và giải thích chi tiết</summary>
      <div className="mt-4">{children}</div>
    </details>
  </div>;
}
