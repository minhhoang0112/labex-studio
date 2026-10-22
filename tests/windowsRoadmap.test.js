import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {once} from 'node:events';
import coursesRouter,{getCourses} from '../server/routes/courses.js';
import {getWindowsRoadmap} from '../server/services/windowsRoadmap.js';

test('Windows roadmap has a coherent advisory prerequisite graph and distinct real/planned counts',()=>{
  const roadmap=getWindowsRoadmap(getCourses());
  assert.equal(roadmap.courses.length,15);assert.equal(roadmap.stages.length,6);
  assert.equal(roadmap.totals.imported_labs,46);assert.equal(roadmap.totals.unique_imported_labs,46);
  assert.equal(roadmap.totals.implemented_courses,5);assert.equal(roadmap.totals.planned_courses,10);assert.equal(roadmap.totals.planned_lessons,60);
  const seen=new Set();
  for(const c of roadmap.courses){
    for(const id of c.prerequisites)assert.ok(seen.has(id),`${c.id} has missing/forward/cyclic prerequisite ${id}`);
    seen.add(c.id);assert.ok(c.learning_outcomes.length);assert.ok(c.references.length);
    if(c.status==='planned'){
      assert.equal(c.available,false);assert.equal(c.labs_count,0);assert.equal(c.runnable_labs_count,0);assert.equal(c.practice_labs_count,0);
      assert.deepEqual(c.lab_ids,[]);assert.equal(c.source_labs_count,null);assert.equal(c.has_cert,false);
    }
  }
  assert.equal(new Set(roadmap.stages.flatMap(s=>s.course_ids)).size,15);
  assert.deepEqual(roadmap.stages.flatMap(s=>s.course_ids),roadmap.courses.map(c=>c.id));
  assert.equal(roadmap.courses.find(c=>c.id==='windows-azure-hybrid-administration').optional,true);
  assert.ok(!roadmap.courses.at(-1).prerequisites.includes('windows-azure-hybrid-administration'));
});

test('Windows catalog, path aliases and course detail expose outline-only courses without fake labs',async t=>{
  const app=express();app.use('/api',coursesRouter);const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const get=async route=>{const res=await fetch(base+route);assert.equal(res.status,200,route);return res.json();};
  const roadmap=await get('/roadmaps/windows-system-administrator');
  const path=await get('/paths/windows');assert.deepEqual(path.totals,roadmap.totals);assert.equal(path.labs_count,46);
  const paths=await get('/paths');assert.equal(paths.paths.find(p=>p.alias==='windows').totals.planned_courses,10);
  const catalog=await get('/courses?topic=windows');assert.equal(catalog.total,15);
  for(const item of roadmap.courses.filter(c=>c.status==='planned')){
    const detail=await get('/courses/'+item.id);
    assert.equal(detail.course.curriculum_status,'planned');assert.equal(detail.course.readiness,'planned');assert.deepEqual(detail.labs,[]);
    assert.equal(detail.course.syllabus_modules.length,3);
  }
  const support=await get('/courses/windows-11-it-support-troubleshooting');assert.equal(support.labs.length,25);
  assert.equal(support.course.curriculum_status,'implemented');
  const linux=await get('/roadmaps/linux-system-administrator');assert.equal(linux.courses.length,8);
});
