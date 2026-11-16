export default function PortfolioReviewEntry({ onSelectCourse }) {
  return <section aria-label="Khóa ôn lab CV" className="rounded-2xl border border-blue-300 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-sky-300">Khóa học riêng của bạn</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Ôn lab CV — Windows, Network & Linux</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-200">Giới thiệu bản thân → Kể dự án → Hiểu 9 chủ đề → Tập trả lời → Ôn và luyện với AI. Học từng bước bằng ví dụ của chính bạn.</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Mở đọc ngay, không cần bật máy ảo.</p>
      </div>
      <button onClick={() => onSelectCourse('portfolio-infrastructure-review')} className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">Mở khóa Ôn lab CV →</button>
    </div>
  </section>;
}
