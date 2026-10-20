import React from 'react';
import CourseContentBadge from './CourseContentBadge';
import { Terminal } from 'lucide-react';

export default function CourseCard({ course, onSelectCourse }) {
  const coverUrl = course.cover || course.cover_image || `https://course-cover.labex.io/${course.alias || course.id}.png`;
  
  // Use official readiness and runnable counts from backend
  const readiness = course.readiness || 'unknown';
  const isReady = readiness === 'ready';
  const isPartial = readiness === 'partial';

  return (
    <div 
      id={`course-card-${course.id}`}
      onClick={() => onSelectCourse(course.id)}
      role="button" 
      tabIndex={0} 
      onKeyDown={event => { 
        if (event.key === 'Enter' || event.key === ' ') { 
          event.preventDefault(); 
          onSelectCourse(course.id); 
        } 
      }}
      className="course-card group cursor-pointer rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary-500/50 flex flex-col transition-all duration-300">
      
      {/* Cover Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-gray-800">
        <img
          src={coverUrl}
          alt={course.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://course-cover.labex.io/quick-start-with-linux.png';
          }}
        />
        
        {/* Top Badges */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <CourseContentBadge course={course} />
        </div>

        {/* Level Tag */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur shadow-sm">
            {course.level_label || (typeof course.level === 'string' ? course.level : 'Chưa có độ khó')}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Title */}
          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {course.name}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5">
            {course.description || `${course.name} - Khóa học trên nền tảng thực hành Linux.`}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {(course.tags || course.skills || ['Linux']).slice(0, 3).map((tag, idx) => (
              <span 
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer Info */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary-500" />
            <span>
            {course.curriculum_status==='planned' ? `${course.planned_lessons_count} bài dự kiến · Chưa triển khai` : isReady || isPartial
                ? `${course.practice_labs_count ?? 0} bài mở terminal · ${course.runnable_labs_count ?? 0} bài chấm đủ`
                : `${course.source_labs_count || course.labs_count || 0} bài tại nguồn`}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>{course.topic==='windows'?'Windows':`${course.source_verified_labs_count || 0} bài đối chiếu`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
