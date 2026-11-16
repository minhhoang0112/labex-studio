import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readPortfolioReview,portfolioReviewCourse} from '../server/services/portfolioReview.js';
import {projectWalkthroughMarkdown} from '../client/src/lib/projectWalkthroughMarkdown.js';
import {interviewPack,studyMarkdown} from '../client/src/lib/portfolioReviewLearning.js';

test('project walkthrough traces 18 grounded milestones with actions, purpose, results and evidence',()=>{
 const s=readPortfolioReview(),tour=s.project_walkthrough;
 assert.equal(tour.chapters.length,18);assert.equal(s.project_chapter_count,18);
 assert.equal(tour.environments.length,2);assert.match(tour.sequence_note,/không phải nhật ký/);
 assert.match(tour.evidence_note,/không tự xác nhận/);
 const ids=new Set(tour.chapters.map(c=>c.id));assert.equal(ids.size,18);
 for(const c of tour.chapters){
  assert.ok(c.goal&&c.why&&c.before&&c.after&&c.without,c.id);
  assert.ok(c.actions.length>=2&&c.actions.every(a=>a.where&&a.action&&a.reason),c.id);
  assert.ok(c.flow.length>=2&&c.evidence.length>=1,c.id);
  assert.ok(c.recall.question&&c.recall.answer&&c.revisit,c.id);
  for(const e of c.evidence){
   assert.ok(e.read&&e.limit&&e.file,c.id);
   if(e.kind==='image'){
    assert.ok(e.url.startsWith('/portfolio-review/'));
    assert.ok(fs.existsSync(new URL('../client/public'+e.url,import.meta.url)),e.url);
   }else assert.ok(e.excerpt.length>20,e.file);
  }
  if(c.unit_id)assert.ok(s.guided_units.some(u=>u.id===c.unit_id));
 }
 assert.ok(tour.inventory.every(row=>ids.has(row.chapter_id)));
 assert.ok(tour.not_implemented.some(x=>/Join Ubuntu/.test(x)));
 assert.ok(tour.not_implemented.some(x=>/Backup/.test(x)));
 assert.match(tour.chapters[15].after,/oneshot/);
 assert.match(tour.chapters[17].flow.join(' '),/AI/);
 assert.equal(Object.hasOwn(portfolioReviewCourse(),'project_walkthrough'),false);
});

test('full project understanding is included in standalone, full-course and AI exports',()=>{
 const s=readPortfolioReview();
 for(const text of [projectWalkthroughMarkdown(s.project_walkthrough),studyMarkdown(s),interviewPack(s)]){
  assert.match(text,/P01/);assert.match(text,/P18/);assert.match(text,/Thao tác|thao tác/);
  assert.match(text,/AI hướng dẫn/);assert.match(text,/chưa nối trực tiếp|chưa nối/);
 }
 const p10=s.project_walkthrough.chapters.find(c=>c.id==='P10');
 assert.match(p10.after,/2026-10-30/);
 assert.ok(p10.evidence.some(e=>/trước khi thêm exclusion/.test(e.read)));
});
