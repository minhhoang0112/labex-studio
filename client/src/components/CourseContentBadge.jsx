import { BookOpen, CheckCircle } from 'lucide-react';

export default function CourseContentBadge({ course }) {
  const imported=course.imported_labs_count ?? course.labs_count ?? 0;
  const total=course.source_labs_count || imported;
  const verified=course.source_verified_labs_count || 0;
  const complete=imported>0 && imported===total;
  const sourceChecked=complete && verified===total;
  const Icon=sourceChecked ? CheckCircle : BookOpen;
  return <span
    title={`Đã đối chiếu bản gốc tiếng Anh: ${verified}/${total} bài. Khả năng thực hành và chấm điểm được thống kê riêng.`}
    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shadow-sm inline-flex items-center gap-1 ${sourceChecked ? 'bg-emerald-600 text-white' : imported ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}
  ><Icon className="w-3 h-3" />{sourceChecked ? `Đã đối chiếu ${verified}/${total} bài` : imported ? `Đã nhập ${imported}/${total} bài` : 'Giáo trình nguồn'}</span>;
}
