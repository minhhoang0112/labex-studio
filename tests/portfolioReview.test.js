import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import coursesRouter from '../server/routes/courses.js';
import {readPortfolioReview,portfolioReviewCourse} from '../server/services/portfolioReview.js';

test('portfolio course is readable without claiming VM practice or certification',async t=>{
  const app=express();app.use('/api',coursesRouter);const server=app.listen(0,'127.0.0.1');
  await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const course=portfolioReviewCourse();
  const catalog=await fetch(base+'/courses?q=portfolio').then(r=>r.json());
  assert.ok(catalog.courses.some(c=>c.id===course.id));
  const response=await fetch(base+'/courses/'+course.id);assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.course.learning_mode,'portfolio-review');
  assert.deepEqual(data.labs,[]);assert.equal(data.course.practice_labs_count,0);assert.equal(data.course.has_cert,false);
  assert.equal(data.study.lessons.length,12);assert.equal(data.study.questions.length,60);
  assert.equal(data.study.incidents.length,16);assert.equal(data.study.quiz.length,24);
});

test('course covers project facts, links every exercise and preserves environment boundaries',()=>{
  const s=readPortfolioReview(),ids=new Set(s.lessons.map(l=>l.id)),sources=new Set(s.sources.map(r=>r.id));
  assert.equal(ids.size,12);
  for(const l of s.lessons){assert.ok(l.body.length>1000,l.id);assert.ok(l.commands);assert.ok(l.exercise);assert.ok(l.expected);l.source_ids.forEach(id=>assert.ok(sources.has(id),id));}
  for(const q of [...s.questions,...s.incidents,...s.quiz])assert.ok(ids.has(q.lesson_id),q.id);
  assert.equal(new Set(s.questions.map(q=>q.id)).size,60);
  for(const q of s.quiz){assert.equal(q.options.length,4);assert.ok(q.correct>=0&&q.correct<4);assert.ok(q.explanation);}
  assert.match(s.project_facts,/chưa nối trực tiếp/);assert.match(s.project_facts,/Ubuntu chưa join AD/);
  assert.match(s.project_facts,/chưa backup\/restore/);assert.match(s.prompt,/MỘT câu/);
  assert.match(s.lessons.find(l=>l.id==='L09').commands,/Get-ChildItem \\\\SERVER01\\CORP-DATA\\IT/);
  assert.ok(s.sources.filter(r=>r.url.startsWith('https:')).every(r=>/learn\.microsoft\.com|cisco\.com|ubuntu\.com|freedesktop\.org|github\.com\/canonical/.test(r.url)));
});
