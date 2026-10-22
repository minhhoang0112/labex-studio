// Read-only curriculum/API audit. Does not open/reset learner labs or start Azure VMs.
import 'dotenv/config';
import fs from 'node:fs/promises';
import {listLabs} from '../server/data/catalog.js';
import {getLabReadiness,getStepReadiness} from '../server/services/readiness.js';
import {getVerificationDefinition} from '../server/services/verification.js';
import {listCourseLabs,readLinuxIndex} from '../server/services/linuxRoadmap.js';

const base=process.env.LABEX_UI_URL || 'http://127.0.0.1:5000';
const report={checkedAt:new Date().toISOString(),scope:'Static full curriculum + read-only API; live grading is a separate check.',api:[],courses:[],structuralErrors:[]};
async function get(route){const r=await fetch(base+route,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`${route}: HTTP ${r.status}`);return r.json();}
const [health,linux,windows]=await Promise.all([get('/api/health'),get('/api/roadmaps/linux-system-administrator'),get('/api/paths/windows')]);
report.environment=health.environment;report.roadmapTotals={linux:linux.totals,windows:windows.totals};
const labs=listLabs(),index=readLinuxIndex();
function ruleKinds(rule){return rule?.kind==='all'?(rule.checks || []).flatMap(ruleKinds):[rule?.kind || 'missing'];}
for(const [platform,roadmap] of [['linux',linux],['windows',windows]]){
  for(const course of roadmap.courses){
    const members=listCourseLabs(course.id,labs,index);
    const row={id:course.id,platform,status:course.status,labs:members.length,sourceLabs:course.source_labs_count ?? null,
      fullyGradable:0,tasks:0,unsupportedTasks:[],gradingKinds:{},verifiedSourceLabs:0,translationReviewSections:0,
      shortExplanationSections:[],missingInstructionSections:[]};
    for(const lab of members){
      if(getLabReadiness(lab).can_grade)row.fullyGradable++;
      if(lab.source_content?.status==='verified-english')row.verifiedSourceLabs++;
      const sections=lab.sections || lab.steps,ids=new Set();
      for(const step of lab.steps){
        row.tasks++;
        if(ids.has(step.id))report.structuralErrors.push({lab:lab.id,step:step.id,problem:'Duplicate task ID'});ids.add(step.id);
        if(lab.sections && !lab.sections.some(s=>s.id===step.id))report.structuralErrors.push({lab:lab.id,step:step.id,problem:'Task not in sections'});
        const readiness=getStepReadiness(step,lab);
        if(!readiness.ready)row.unsupportedTasks.push({lab:lab.id,step:step.id,reasons:readiness.reasons});
        for(const kind of ruleKinds(getVerificationDefinition(step,process.env.LABEX_RUNTIME_PROVIDER || 'namespace')))row.gradingKinds[kind]=(row.gradingKinds[kind] || 0)+1;
      }
      for(const section of sections){
        const content=String(section.translation_needs_review?section.content || '':section.content_vi || section.content || '');
        if(section.translation_needs_review)row.translationReviewSections++;
        if(!content.trim())row.missingInstructionSections.push({lab:lab.id,section:section.id});
        // Heuristic for manual review only; short task prompts can be intentional challenges.
        const prose=content.replace(/```[\s\S]*?```/g,'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').trim();
        if(lab.type!=='challenge' && prose.length<180)row.shortExplanationSections.push({lab:lab.id,section:section.id,proseChars:prose.length});
      }
    }
    report.courses.push(row);
  }
}
await fs.writeFile('.artifacts/study-readiness-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({environment:{available:health.environment?.available,label:health.environment?.label},totals:report.roadmapTotals,
  structuralErrors:report.structuralErrors.length,courses:report.courses.map(c=>({id:c.id,labs:c.labs,gradable:c.fullyGradable,tasks:c.tasks,
    unsupported:c.unsupportedTasks.length,sourceVerified:c.verifiedSourceLabs,translationReview:c.translationReviewSections,
    emptySections:c.missingInstructionSections.length,shortSections:c.shortExplanationSections.length,
    gradingKinds:c.gradingKinds})),missingGraders:report.courses.filter(c=>c.unsupportedTasks.length).map(c=>({course:c.id,
      labs:new Set(c.unsupportedTasks.map(t=>t.lab)).size,firstExample:c.unsupportedTasks[0]}))},null,2));
