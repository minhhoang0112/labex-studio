import React, { useState, useEffect } from 'react';
import CourseContentBadge from '../components/CourseContentBadge';
import { 
  ArrowLeft, Terminal, Shield, CheckCircle, BookOpen,
  Sparkles, ChevronRight, Play
} from 'lucide-react';
import { api } from '../lib/api';

export default function LearningPath({ pathAlias = 'linux', onBack, onSelectCourse, onSelectPath }) {
  const [roadmap, setRoadmap] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('recommended'); // 'recommended' | 'source'
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    setRoadmap(null);
    api(pathAlias === 'linux' ? '/api/roadmaps/linux-system-administrator' : `/api/paths/${encodeURIComponent(pathAlias)}`, { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return;
      if (!data.totals || !Array.isArray(data.courses)) throw new Error('Lộ trình này chưa có dữ liệu local đầy đủ.');
      setRoadmap(data);
    }).catch(e => {
      if (e.name !== 'AbortError') setError(e.message || 'Lỗi tải lộ trình.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [pathAlias, attempt]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {error || 'Không tìm thấy thông tin lộ trình'}
        </h2>
        <button onClick={() => setAttempt(value => value + 1)} className="mr-3 px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800">Thử lại</button>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục khóa học
        </button>
      </div>
    );
  }

  // Use factual totals from roadmap
  const totals = roadmap.totals;
  const isWindows=roadmap.alias === 'windows';
  const firstCourse=coursesForStart(roadmap);

  const coursesList = roadmap?.courses || [];
  const sourceOrder = roadmap?.source_order || [];

  // Order courses based on selected view mode
  const displayedCourses = viewMode === 'recommended'
    ? [...coursesList].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [...coursesList].sort((a, b) => {
        const idxA = sourceOrder.indexOf(a.alias);
        const idxB = sourceOrder.indexOf(b.alias);
        return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
      });

  const stages = roadmap?.stages || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-20 transition-colors">
      {/* Top Navigation */}
      <div className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-14 py-2 flex flex-wrap gap-2 items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Danh sách khóa học
          </button>
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs font-semibold">
            {onSelectPath && <>
              <button onClick={()=>onSelectPath('linux')} className={`px-3 py-1 rounded-md ${!isWindows?'text-primary-600 bg-white dark:bg-gray-700':'text-gray-500'}`}>Linux</button>
              <button onClick={()=>onSelectPath('windows')} className={`px-3 py-1 rounded-md ${isWindows?'text-primary-600 bg-white dark:bg-gray-700':'text-gray-500'}`}>Windows</button>
            </>}
            <button
              onClick={() => setViewMode('recommended')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'recommended' 
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              Lộ trình học đề xuất (Local)
            </button>
            {!isWindows && <button
              onClick={() => setViewMode('source')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'source' 
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}>
              Thứ tự khóa nguồn
            </button>}
          </div>
        </div>
      </div>

      {/* Path Header Banner */}
      <div className="bg-gradient-to-b from-blue-900 via-indigo-950 to-gray-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                {isWindows?'Lộ trình tự biên soạn · Tham khảo Microsoft Learn':'Đối chiếu trực tiếp từ LabEx.io Learning Path'}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight flex items-center gap-3">
                {roadmap?.title || 'Lộ trình Linux cho System Administrator'}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {isWindows?roadmap.description:'Đường dẫn học tập có cấu trúc từ dòng lệnh cơ bản đến quản trị hệ thống và tự động hóa shell. Thực hành trực tiếp trong môi trường Isolated Linux an toàn.'}
              </p>

              {/* Factual Stats Bar */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span><strong>{isWindows?totals.courses:totals.source_courses}</strong> {isWindows?'khóa trong lộ trình':'khóa tại nguồn LabEx'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span><strong>{isWindows?totals.imported_labs:totals.source_labs}</strong> {isWindows?'bài đã có nội dung':'bài học tại nguồn'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle className="w-4 h-4" />
              <span><strong>{totals.runnable_labs}</strong> bài chấm đủ nhiệm vụ local</span>
                </div>
              </div>
              {isWindows && <p className="text-sm text-sky-200">{totals.implemented_courses} khóa có bài · {totals.planned_courses} khóa mới có đề cương · {totals.planned_lessons} bài dự kiến, chưa triển khai.</p>}
            </div>

            {/* Quick Action Box */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full lg:w-80 shrink-0 space-y-4">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Bắt đầu lộ trình</div>
              <div className="text-sm text-slate-200">
                {isWindows?'Bắt đầu bằng đề cương Nền tảng Windows 11. Bạn cũng có thể vào khóa IT Support đã có 25 bài để thực hành ngay.':<>Khởi đầu với <strong>Quick Start with Linux</strong> (10 bài thực hành chuẩn) để nắm vững các lệnh nền tảng.</>}
              </div>
              <button
                onClick={() => onSelectCourse(firstCourse)}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 font-semibold text-white shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all">
                <Play className="w-4 h-4 fill-current" /> {isWindows?'Xem khóa đầu tiên':'Bắt đầu Quick Start'}
              </button>
              {isWindows && <button onClick={()=>onSelectCourse(roadmap.available_start_course_id)} className="text-sm text-sky-200 underline">Mở 25 bài IT Support đã có →</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Roadmap Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {isWindows && <p className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950 p-4 text-sm text-sky-900 dark:text-sky-100">{roadmap.guidance}</p>}
        {/* Stages view in Recommended Mode */}
        {viewMode === 'recommended' && stages.length > 0 ? (
          stages.map((stage, sIdx) => {
            const stageCourses = coursesList.filter(c => stage.course_ids.includes(c.alias || c.id));
            if (!stageCourses.length) return null;

            return (
              <section key={stage.id || sIdx} className="space-y-5">
                <div className="pb-3 border-b dark:border-gray-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
                    Chặng {sIdx + 1}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {stage.name}
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {stageCourses.length} khóa học
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {stage.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {stageCourses.map(course => (
                    <CourseRoadmapCard key={course.id} course={course} onSelectCourse={onSelectCourse} />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          /* Plain list in Source Order Mode */
          <div className="space-y-6">
            <div className="pb-3 border-b dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Danh sách {totals.source_courses} khóa học theo thứ tự nguồn
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {totals.source_labs} mục bài tại nguồn · {totals.unique_imported_labs} bài local duy nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedCourses.map(course => (
                <CourseRoadmapCard key={course.id} course={course} onSelectCourse={onSelectCourse} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseRoadmapCard({ course, onSelectCourse }) {
  const isReady = course.status === 'ready';
  const isPartial = course.status === 'partial';

  const handleClick = () => {
    onSelectCourse(course.alias || course.id);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleClick(); } }}
      className="group cursor-pointer bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-500 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      
      {/* Cover / Visual */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
        <img
          src={course.cover || course.cover_image || `https://course-cover.labex.io/${course.alias || course.id}.png`}
          alt={course.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = course.topic === 'windows' ? '/images/windows-course.svg' : 'https://course-cover.labex.io/quick-start-with-linux.png';
          }}
        />
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <CourseContentBadge course={course} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1">
            Thứ tự: #{course.order || 1}
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {course.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
            {course.topic==='windows' ? course.reason : course.imported_labs_count > 0
              ? `${course.imported_labs_count}/${course.source_labs_count} bài đã nhập · ${course.source_verified_labs_count || 0} bài đã đối chiếu bản gốc tiếng Anh.`
              : 'Đã có giáo trình nguồn; đang bổ sung tài liệu bài học.'}
          </p>
          {course.optional && <p className="mt-2 text-xs font-semibold text-sky-600 dark:text-sky-300">Nhánh mở rộng tùy chọn</p>}
          {!!course.prerequisite_skills?.length && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300"><strong>Trước khi học:</strong> {course.prerequisite_skills.join('; ')}.</p>}
          {!!course.learning_outcomes?.length && <ul className="mt-3 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4 space-y-1">{course.learning_outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul>}
          {course.practice_strategy && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300"><strong>Cách học:</strong> {course.practice_strategy}</p>}
        </div>

        {/* Footer Info */}
        <div className="pt-3 border-t dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-primary-500" />
            {course.status==='planned' ? `${course.planned_lessons_count} bài dự kiến · Chưa triển khai` : isReady || isPartial
              ? `${course.imported_labs_count ?? course.practice_labs_count ?? 0} bài local · ${course.runnable_labs_count ?? 0} bài chấm đủ`
              : `${course.source_labs_count} bài tại nguồn`}
          </span>
          <span className="font-medium text-primary-600 dark:text-primary-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Chi tiết <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function coursesForStart(roadmap){return roadmap.start_course_id || 'quick-start-with-linux';}
