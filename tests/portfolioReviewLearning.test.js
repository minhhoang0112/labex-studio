import test from 'node:test';
import assert from 'node:assert/strict';
import {readPortfolioReview,portfolioReviewCourse} from '../server/services/portfolioReview.js';
import {readStudyProgress,interviewPack,studyMarkdown,STORAGE_KEY} from '../client/src/lib/portfolioReviewLearning.js';

test('personal introduction uses supplied facts and leads into the actual project',()=>{
 const s=readPortfolioReview();
 assert.equal(s.profile.name,'Hoàng Công Minh');assert.equal(s.profile.birth_date,'01/12/2005');
 assert.equal(s.profile.year,'Sinh viên năm 4');assert.equal(s.profile.university,'Trường Đại học Giao thông vận tải');
 assert.match(s.introduction.full,/Hoàng Công Minh/);assert.match(s.introduction.full,/sinh năm 2005/);
 assert.equal(s.introduction.chunks.length,4);assert.equal(s.project_story.chunks.length,4);
 assert.equal(s.journey.length,5);assert.equal(s.journey[0].id,'intro');assert.equal(s.journey[1].id,'project');
 assert.match(s.project_story.limits,/chưa nối trực tiếp/);
 assert.ok(!/GPA|CCNA|TOEIC|IELTS|đã làm việc tại|kinh nghiệm công ty/.test(s.introduction.full));
 assert.ok(!Object.hasOwn(portfolioReviewCourse(),'profile'));assert.ok(!Object.hasOwn(portfolioReviewCourse(),'guided_units'));
});
test('guided units supply a concrete purpose, solved example, recall and relevant follow-up',()=>{
 const s=readPortfolioReview();assert.equal(s.guided_units.length,9);
 assert.equal(s.guided_units[0].lesson_id,'L05');assert.equal(s.guided_units[1].lesson_id,'L09');
 for(const u of s.guided_units){
  assert.ok(u.goal&&u.need&&u.scene,u.id);assert.ok(u.terms.length>=3);assert.ok(u.flow.length>=3);
  assert.ok(u.example.question&&u.example.steps.length>=3&&u.example.conclusion,u.id);
  assert.ok(u.recall.question&&u.recall.answer&&u.spoken_answer,u.id);
  assert.ok(u.commands.every(c=>c.machine&&c.command&&c.purpose&&c.read));
  assert.ok(u.question_ids.every(id=>s.questions.some(q=>q.id===id)),u.id);
  assert.ok(u.ticket_ids.every(id=>s.incidents.some(t=>t.id===id)),u.id);
 }
});
test('redesign preserves previous notes without declaring the introduction mastered',()=>{
 const old={notes:{L05:'Nhớ OU khác group'},read:['L05'],lastQuiz:{score:15,total:24}};
 const storage={getItem:key=>key==='labex.portfolio-review.v1'?JSON.stringify(old):null};
 const migrated=readStudyProgress(storage);assert.deepEqual(migrated.notes,old.notes);assert.deepEqual(migrated.read,old.read);
 assert.equal(migrated.stage,'intro');assert.equal(migrated.completed,undefined);
 const current={stage:'project',introDraft:'Bản nói riêng'};
 assert.deepEqual(readStudyProgress({getItem:key=>key===STORAGE_KEY?JSON.stringify(current):null}),current);
 assert.equal(readStudyProgress({getItem:()=>'{broken'}).stage,'intro');
});
test('downloaded material and AI pack include personal introduction and preserve project boundaries',()=>{
 const s=readPortfolioReview(),pack=interviewPack(s),book=studyMarkdown(s);
 assert.match(pack,/Hoàng Công Minh/);assert.match(pack,/Ubuntu chưa join AD/);
 assert.match(book,/Tài khoản công ty và phòng ban/);assert.match(book,/Q60/);assert.match(book,/T16/);assert.match(book,/C24/);
 assert.match(pack,/Không gán GPA/);assert.match(book,/Dùng để làm gì/);
});
