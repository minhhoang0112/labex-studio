import React from 'react';

export default function PracticeBrief({ practice, children }) {
  if (!practice) return children;
  return <div className="space-y-5" data-practice-brief>
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950">
      <p className="text-xs font-bold uppercase text-sky-700 dark:text-sky-300">Đề bài · {practice.machine}</p>
      <p className="mt-2 font-semibold">{practice.ticket}</p>
      <p className="mt-2 text-sm">{practice.identity}</p>
    </div>
    {practice.concepts && practice.phase === 'document' && <section className="space-y-3" data-practice-foundations>
      <h3 className="font-bold">Hiểu trước khi sửa</h3>
      <p className="text-sm">Cần biết trước: {practice.prerequisites}</p>
      {practice.concepts.map(item => <div key={item.title}>
        <h4 className="font-semibold">{item.title}</h4>
        <p className="mt-1 leading-relaxed">{item.text}</p>
      </div>)}
      <h4 className="font-semibold">Ghi nhận trước khi thay đổi</h4>
      <ul className="list-disc space-y-2 pl-5">{practice.investigation_questions.map(item => <li key={item}>{item}</li>)}</ul>
      <p className="text-sm">Tài liệu đối chiếu: {practice.sources.map(source => <a className="mr-3 underline" key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</p>
    </section>}
    <div><h3 className="font-bold">Việc bạn cần làm</h3>
      <ol className="mt-2 list-decimal space-y-2 pl-5">{practice.tasks.map(item => <li key={item}>{item}</li>)}</ol>
    </div>
    <div><h3 className="font-bold">Kết quả cần bàn giao</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5">{practice.acceptance.map(item => <li key={item}>{item}</li>)}</ul>
    </div>
    <p className="text-sm text-slate-600 dark:text-slate-400">{practice.scope}</p>
    {practice.reflection && practice.phase === 'task' && <details className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <summary className="cursor-pointer font-semibold">Sau khi sửa: tự giải thích lại</summary>
      <p className="mt-2 text-sm">Tự ôn, không tính điểm kỹ thuật. Hãy trả lời bằng bằng chứng từ lần thực hành của bạn; có thể nhờ Labby hỏi lại từng câu.</p>
      <ul className="mt-2 list-disc space-y-2 pl-5">{practice.reflection.map(item => <li key={item}>{item}</li>)}</ul>
    </details>}
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
