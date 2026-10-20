import fs from 'node:fs';
export function readWindowsRoadmap(){
  return JSON.parse(fs.readFileSync(new URL('../data/windows-roadmap.json',import.meta.url),'utf8'));
}
export function getWindowsRoadmap(catalog){
  const plan=readWindowsRoadmap();
  const courses=plan.courses.map((outline,index)=>{
    const current=catalog.find(c=>c.id===outline.id);
    if(!current)throw Error(`Missing Windows roadmap course: ${outline.id}`);
    const implemented=current.imported_labs_count>0;
    const {initially_implemented,...details}=outline;
    const plannedCount=initially_implemented?0:outline.syllabus_modules.reduce((n,m)=>n+m.planned_lessons.length,0);
    const complete=implemented && (!plannedCount || current.imported_labs_count>=plannedCount);
    const status=!implemented?'planned':complete && current.runnable_labs_count===current.imported_labs_count?'ready':'partial';
    return {...current,...details,name:current.name,alias:current.alias || current.id,order:index+1,status,
      planned_lessons_count:plannedCount,
      reason:!implemented?'Đã có đề cương; chưa có nội dung hướng dẫn, môi trường thực hành hoặc bộ chấm cho khóa này.'
        :`${current.imported_labs_count} bài đã có nội dung local. Xem khả năng thực hành và chấm điểm trong từng bài.`};
  });
  return {...plan,courses,order_kind:'recommended-local',
    totals:{courses:courses.length,implemented_courses:courses.filter(c=>c.imported_labs_count>0).length,
      planned_courses:courses.filter(c=>!c.imported_labs_count).length,
      imported_labs:courses.reduce((n,c)=>n+c.imported_labs_count,0),
      unique_imported_labs:new Set(courses.flatMap(c=>c.lab_ids)).size,
      runnable_labs:courses.reduce((n,c)=>n+c.runnable_labs_count,0),
      practice_labs:courses.reduce((n,c)=>n+c.practice_labs_count,0),
      planned_lessons:courses.filter(c=>!c.imported_labs_count).reduce((n,c)=>n+c.planned_lessons_count,0)}};
}
