import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, BookOpen, ListChecks, CheckCircle2, Play, FileText
} from 'lucide-react';
import { api } from '../lib/api';
import { labProgress, validPassedSteps, isLabCompleted } from '../lib/progress';
import CourseSyllabus from '../components/CourseSyllabus';
import CourseContentBadge from '../components/CourseContentBadge';

export default function CourseDetail({ courseId, onBack, onStartLab, onStartAssessment }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('labex.language') || 'vi'; } catch { return 'vi'; }
  });

  useEffect(() => {
    const onLang = (e) => setLang(e.detail || localStorage.getItem('labex.language') || 'vi');
    window.addEventListener('labex-lang-change', onLang);
    return () => window.removeEventListener('labex-lang-change', onLang);
  }, []);

  const isVi = lang === 'vi';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    api(`/api/courses/${encodeURIComponent(courseId)}`, { signal: controller.signal })
      .then(setData)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [courseId, attempt]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="text-center py-20">
        <p role="alert" className="text-gray-500">{error || 'Khóa học không tồn tại.'}</p>
        <button onClick={() => setAttempt(value => value + 1)} className="mt-4 mr-4 text-primary-600 font-semibold">Thử lại</button>
        <button onClick={onBack} className="mt-4 text-primary-600 font-semibold">← Quay lại</button>
      </div>
    );
  }

  const { course, labs: syllabusLabs = [] } = data;
  const isWindows = course.topic === 'windows';
  const isPlanned=course.curriculum_status === 'planned';
  const labs = syllabusLabs.filter(lab => lab.availability?.state !== 'reference-only' &&
    (lab.steps_count > 0 || lab.step_ids?.length > 0));
  const isComplete = lab => isLabCompleted(lab, labProgress(lab.id));

  const completed = labs.filter(isComplete).length;
  const totalTasks = labs.reduce((sum, lab) => sum + (lab.steps_count || 0), 0);
  const totalSections = labs.reduce((sum, lab) => sum + (lab.sections_count || 0), 0);

  // Factual provenance information
  const readiness = course.readiness || 'unknown';
  const isRefOnly = readiness === 'reference-only';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-20">
      {/* Top Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Tất cả khóa học
        </button>
      </div>

      {/* Course Header Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-2/5 aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-sm shrink-0 border border-gray-200 dark:border-gray-700">
            <img
              src={course.cover || `https://course-cover.labex.io/${course.alias || course.id}.png`}
              alt={course.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/favicon.svg';
              }}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                {course.level_label || course.level || 'Beginner'}
              </span>
              <CourseContentBadge course={course} />
              {isRefOnly && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Nội dung tham khảo nguồn
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">Thực hành local: {course.practice_labs_count ?? 0} bài mở môi trường · {course.runnable_labs_count ?? 0} bài có đủ bộ chấm. {isWindows ? 'Thực hành trên Windows VM; tài liệu tham khảo nằm trong từng bài.' : `Đã đối chiếu tài liệu gốc EN: ${course.source_verified_labs_count || 0} bài.`}</p>

            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {course.name}
            </h1>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {course.description}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 dark:text-gray-400 pt-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span><strong>{labs.length}</strong> bài học local</span>
                {course.source_labs_count && (
                  <span className="text-xs text-slate-400">({course.source_labs_count} bài nguồn)</span>
                )}
              </div>
              {totalSections > 0 && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span><strong>{totalSections}</strong> mục đọc</span>
                </div>
              )}
              {totalTasks > 0 && (
                <div className="flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-gray-400" />
                  <span><strong>{totalTasks}</strong> nhiệm vụ kiểm tra</span>
                </div>
              )}
              {labs.length > 0 && (
                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completed} / {labs.length} bài đã đạt</span>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {course.skills?.map((sk, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-mono">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus / Labs List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Bridge banner for linux-basic-commands-practice-online */}
        {((course.id === 'linux-basic-commands-practice-online' && labs.length === 0) || course.id === 'linux-commands-practice-online') && (
          <div className="p-4 mb-6 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="text-sm">
                <strong>{isVi ? 'Phiên bản bài tập thực hành Local tiếng Việt:' : 'Local Hands-on Vietnamese Practice Labs:'}</strong>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  {isVi
                    ? 'Nhóm bài tập tự biên soạn bổ sung về log, kiểm kê tệp, checksum và tự động hóa. Đây là nhóm riêng, không thay thế 41 bài của khóa nguồn.'
                    : 'Additional locally authored exercises on logs, file inventory, checksums and automation. These do not replace the 41 source lessons.'}
                </p>
              </div>
            </div>
            {course.id !== 'linux-commands-practice-online' && (
              <button
                onClick={() => window.location.href = '/courses/linux-commands-practice-online'}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 shadow-sm transition">
                {isVi ? 'Chuyển sang 4 bài thực hành ngay →' : 'Go to 4 Practice Labs →'}
              </button>
            )}
          </div>
        )}

        {labs.length > 0 ? (
          <>
            <div className="mb-6 rounded-xl border border-primary-200 dark:border-primary-900 bg-primary-50 dark:bg-primary-950 p-4 text-sm text-primary-800 dark:text-primary-200">
              <strong>{completed} / {labs.length} {isVi ? 'bài đã hoàn thành' : 'labs completed'}</strong>
              {completed === labs.length
                ? (isVi ? ' · Bạn đã hoàn thành các bài local hiện có.' : ' · You have completed the available local labs.')
                : (isVi ? ' · Tiến độ lưu an toàn trong trình duyệt.' : ' · Progress saved securely in browser.')}
              <div className="mt-2 h-1.5 bg-primary-100 dark:bg-primary-900 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-500" style={{ width: `${labs.length ? (completed / labs.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isVi ? 'Danh sách bài thực hành (Hands-On Labs)' : 'Hands-On Labs'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isWindows ? (isVi ? 'Học theo thứ tự từ cấu hình, chẩn đoán đến sửa lỗi và khôi phục trên Windows VM' : 'Practice configuration, diagnosis, repair and recovery on a Windows VM') : isVi
                    ? 'Mỗi bài học đều chạy trên terminal Linux biệt lập kèm hướng dẫn chi tiết' 
                    : 'Each lab runs in an isolated Linux terminal with step-by-step guidance'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {labs.map((lab, index) => {
                const labIsComplete = isComplete(lab);
                const progress = labProgress(lab.id);
                const passedCount = validPassedSteps(lab, progress).length;
                const isChallenge = lab.type === 'challenge';
                
                // Genuine availability from backend
                const availability = lab.availability || { state: 'unknown', can_open: false };
                // Allow opening if can_open is true
                const isLabBlocked = availability.can_open !== true;
                const isLabPartial = availability.state === 'partial';
                const labTitle = (isVi && (lab.title_vi || lab.name_vi)) ? (lab.title_vi || lab.name_vi) : lab.title;

                return (
                  <div
                    key={lab.id}
                    className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    <div className="space-y-1.5 flex-1">
                      {lab.curriculum_group && <p className="text-xs font-semibold text-primary-600 dark:text-primary-300">{lab.curriculum_group} · {lab.practice_mode === 'fault-injection' ? 'Có nạp lỗi thực hành' : 'Cấu hình / chẩn đoán'}</p>}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isChallenge
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                        }`}>
                          {isChallenge ? 'Challenge' : 'Guided Lab'}
                        </span>
                        
                        {isLabPartial && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            {isVi ? 'Thực hành một phần' : 'Partial grading'}
                          </span>
                        )}
                        {isLabBlocked && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            {isVi ? 'Chưa mở' : 'Locked'}
                          </span>
                        )}

                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                          {labTitle}
                        </h3>
                        {labIsComplete && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isVi ? 'Đã hoàn thành' : 'Completed'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 max-w-2xl pl-8">
                        {lab.overview}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pl-8 pt-1">
                        <span>{isVi ? 'Độ khó:' : 'Difficulty:'} <strong className="text-gray-700 dark:text-gray-300">{lab.difficulty}</strong></span>
                        <span>{isVi ? 'Thời gian:' : 'Duration:'} <strong className="text-gray-700 dark:text-gray-300">{lab.estimated_time}</strong></span>
                        <span>{isVi ? 'Mục đọc:' : 'Sections:'} <strong className="text-gray-700 dark:text-gray-300">{lab.sections_count} sections</strong></span>
                        <span>{isVi ? 'Nhiệm vụ:' : 'Tasks:'} <strong className="text-primary-600 dark:text-primary-400">{passedCount}/{lab.steps_count} tasks</strong></span>
                      </div>
                    </div>

                    <button
                      id={index === 0 ? "start-first-lab" : undefined}
                      disabled={isLabBlocked}
                      onClick={() => onStartLab(lab.id)}
                      className={`btn-start-lab w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition shadow-sm hover:shadow shrink-0 ${
                        isLabBlocked
                          ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                          : labIsComplete 
                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100'
                          : isChallenge
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}>
                      <Play className="w-4 h-4 fill-current" />
                      {isLabBlocked 
                        ? (isVi ? 'Chưa mở' : 'Locked') 
                        : labIsComplete 
                        ? (isVi ? 'Ôn tập bài' : 'Review') 
                        : passedCount > 0 
                        ? (isVi ? 'Tiếp tục bài' : 'Resume') 
                        : (isVi ? 'Bắt đầu bài' : 'Start Lab')}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed dark:border-gray-700 space-y-3">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{isPlanned?'Khóa học đã có đề cương — nội dung sẽ bổ sung sau':'Khóa học tham khảo giáo trình nguồn'}</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {isPlanned?`${course.planned_lessons_count} bài dự kiến dưới đây là kế hoạch học tập. Chưa có hướng dẫn thực hành, dữ liệu lab hoặc bộ chấm; chưa thể bắt đầu học khóa này.`:`Khóa học này hiện đã được đối chiếu metadata và giáo trình nguồn (${course.source_labs_count || 0} bài tại LabEx.io). Nội dung thực hành local đang được triển khai theo kế hoạch.`}
            </p>
          </div>
        )}
        {data.assessments?.map(exam => <section key={exam.id} className="mt-6 p-6 rounded-2xl bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center" aria-label="Bài kiểm tra cuối khóa">
          <div className="space-y-2"><h3 className="text-xl font-bold">{exam.title}</h3>
            <p className="text-sm">{exam.question_count} câu · Phủ {exam.covered_labs.length} bài lab · Đạt từ {exam.pass_percent}% · Có chấm điểm và giải thích đáp án.</p>
            <p className="text-xs text-slate-500">Bài bổ sung local, không cần bật terminal. Sau khi nộp có thể ôn từng câu bằng thoại Labby.</p></div>
          <button onClick={() => onStartAssessment(exam.id)} className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 shrink-0">Vào bài {exam.order}</button>
        </section>)}
        {isWindows && course.syllabus_modules?.length>0 && <section className="mt-8 space-y-5" aria-label="Đề cương khóa học Windows">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isPlanned?'Đề cương dự kiến':'Khung kiến thức của khóa'}</h2>
            <a href="/paths/windows" className="text-sm text-primary-600 dark:text-primary-300 underline">← Lộ trình Windows đầy đủ</a>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div><h3 className="font-bold">Mục tiêu sau khóa học</h3><ul className="list-disc pl-5 mt-2 space-y-1">{course.learning_outcomes.map(item=><li key={item}>{item}</li>)}</ul></div>
            {!!course.prerequisite_courses?.length && <div><h3 className="font-bold">Nên học trước (khuyến nghị)</h3><ul className="list-disc pl-5 mt-2 space-y-1">{course.prerequisite_courses.map(item=><li key={item.id}><a className="text-primary-600 dark:text-primary-300 underline" href={`/courses/${item.id}`}>{item.name}</a></li>)}</ul></div>}
            <p><strong>Môi trường dự kiến: </strong>{course.environment_plan}</p>
          </div>
          {course.syllabus_modules.map((module,index)=><div key={module.id} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">{index+1}. {module.title}</h3>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-300">{module.planned_lessons.map(item=><li key={item}>{item}{isPlanned && <span className="ml-2 text-xs text-slate-500">· Chưa triển khai</span>}</li>)}</ul>
          </div>)}
          <div className="p-5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sm space-y-2"><h3 className="font-bold">Tài liệu Microsoft tham khảo cho đề cương</h3>{course.references?.map(ref=><p key={ref.url}><a className="text-primary-600 dark:text-primary-300 underline" href={ref.url} target="_blank" rel="noreferrer">{ref.title} ↗</a></p>)}<p className="text-xs text-gray-500">Lộ trình tự biên soạn; không phải khóa học hay chứng chỉ do Microsoft cấp.</p></div>
        </section>}
        <CourseSyllabus stages={data.stages || []} onStartLab={onStartLab} lang={lang} />
      </div>
    </div>
  );
}
