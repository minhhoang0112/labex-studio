// Aggregate complete per-lesson evidence from this audit's explicit test runs.
// Some runs stopped at a later failed lesson; partial lessons never count.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {listCourseLabs} from '../server/services/linuxRoadmap.js';
import {getVerificationDefinition} from '../server/services/verification.js';

const runs=['mvmlvtis','mvmmca37','mvmm3owe','mvmmca74','mvmm8xm5','mvmmmx9f'];
const reports=runs.map(id=>({file:`.artifacts/source-course-smoke-${id}.json`,id}))
  .filter(r=>fs.existsSync(r.file)).map(r=>({...r,data:JSON.parse(fs.readFileSync(r.file,'utf8'))}));
const report={passed:false,scope:'linux-for-noobs',aggregation:'Complete per-lesson evidence across explicit independent isolated runs, not one uninterrupted run.',
  lessons:[],missing:[],passedTasks:0,blockedTasks:0,preWorkNegativeChecks:0};
for(const lab of listCourseLabs('linux-for-noobs').sort((a,b)=>a.order-b.order)){
  const expected=lab.steps.map(step=>({id:step.id,blocked:getVerificationDefinition(step,'docker').kind==='unsupported'}));
  const candidates=reports.map(r=>({...r,rows:r.data.tasks.filter(t=>t.labId===lab.id)}));
  const match=candidates.reverse().find(r=>expected.every(s=>r.rows.some(t=>t.stepId===s.id && (s.blocked ? t.blockedAsExpected && !t.passed : t.passed && t.beforeFailed))));
  if(!match){report.missing.push({labId:lab.id,title:lab.title});continue;}
  const passed=expected.filter(s=>!s.blocked).length,blocked=expected.length-passed;
  report.lessons.push({labId:lab.id,order:lab.order,passed,blocked,report:match.file,wholeRunCompleted:match.data.complete===true});
  report.passedTasks+=passed;report.blockedTasks+=blocked;report.preWorkNegativeChecks+=passed;
}
report.passed=report.lessons.length===37 && report.passedTasks===122 && report.blockedTasks===12;
fs.writeFileSync('.artifacts/noobs-repair-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,lessons:`${report.lessons.length}/37`},null,2));
if(process.argv.includes('--require-complete'))assert.equal(report.passed,true,'Some lessons do not yet have complete passing evidence.');
