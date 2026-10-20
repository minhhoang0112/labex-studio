// Import successful authorized source captures. Existing graders/fixtures/IDs stay local.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const input='.artifacts/source-review-2026-10-20';
const output='server/data/reference/source-lessons';
await fs.mkdir(output,{recursive:true});
const review=JSON.parse(await fs.readFile(path.join(input,'review.json'),'utf8'));
const existing=new Map();
for(const name of await fs.readdir('server/data/labs')) {
  if(!name.endsWith('.json'))continue;
  const lab=JSON.parse(await fs.readFile('server/data/labs/'+name,'utf8'));
  if(lab.source_lab_id)existing.set(Number(lab.source_lab_id),lab.id);
}
const manifest={version:1,checked_at:review.checkedAt,source:'https://labex.io',scope:'Exact English lesson text accessed through public pages or the user-authorized browser session; translation, VM image and private graders are not certified.',lessons:{}};
let created=0;
for(const item of review.lessons) {
  const capture=JSON.parse(await fs.readFile(path.join(input,item.alias+'.json'),'utf8'));
  if(Number(capture.reference.source_lab_id)!==Number(item.id)||!capture.steps.length) throw new Error('Source identity mismatch');
  const sections=[...capture.steps].sort((a,b)=>a.position-b.position).map(s=>({position:s.position,title:s.title,content:s.text,need_verify:s.need_verify}));
  let localId=item.localId || existing.get(Number(item.id));
  if(!localId) {
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.alias))throw new Error('Invalid lesson alias');
    const owner=review.courses.find(c=>c.stages.some(stage=>stage.labs.some(l=>l.source_lab_id===item.id)));
    if(!owner)throw new Error('Missing source course');
    const reference=owner.stages.flatMap(s=>s.labs).find(l=>l.source_lab_id===item.id);
    localId=item.alias;
    const task=s=>({id:`source-${item.id}-section-${s.position}`,position:s.position,title:s.title,content:s.content,kind:s.need_verify?'task':s.position===0?'introduction':'summary',
      ...(s.need_verify?{task:`Complete the requirements in ${s.title}.`,hint:'Follow the original instructions above. Automatic grading requires an independently reviewed verifier.',verification:{kind:'unsupported',reason:'Đã có tài liệu gốc; chưa có fixture và bộ chấm local được kiểm chứng cho bước này.'}}:{})});
    const original={id:localId,course_id:owner.id,source_lab_id:item.id,source_url:reference.source_url,order:reference.order,title:reference.title,type:reference.type,
      difficulty:'Intermediate',estimated_time:`${reference.estimated_minutes||30} mins`,overview:sections[0].content,sections:sections.map(task),steps:sections.filter(s=>s.need_verify).map(task),curriculum_version:1};
    await fs.writeFile('server/data/labs/'+localId+'.json',JSON.stringify(original,null,2)+'\n',{flag:'wx'});
    created++;
  }
  const source={version:1,source_lab_id:item.id,source_url:capture.reference.source_url,checked_at:review.checkedAt,sections};
  source.sha256=crypto.createHash('sha256').update(JSON.stringify(sections)).digest('hex');
  await fs.writeFile(path.join(output,item.id+'.json'),JSON.stringify(source,null,2)+'\n');
  manifest.lessons[item.id]={file:item.id+'.json',local_id:localId,source_url:source.source_url,sections:sections.length,sha256:source.sha256};
}
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const indexFile='server/data/reference/linux-course-index.json';
const index=JSON.parse(await fs.readFile(indexFile,'utf8'));
await fs.writeFile(indexFile,JSON.stringify({...index,observed_at:review.checkedAt,courses:review.courses},null,2)+'\n');
console.log('Installed '+Object.keys(manifest.lessons).length+' verified English sources; created '+created+' missing reading lessons. Existing graders, learner IDs and runtime files preserved.');
