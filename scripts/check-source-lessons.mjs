// Read-only source review: public endpoints or the existing authorized browser.
// No credentials exported, VM launches, hidden answers or API keys.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {createRequire} from 'node:module';
const root = process.cwd();
const out = path.join(root,'.artifacts/source-review-2026-10-20');
await fs.mkdir(out,{recursive:true});
const index = JSON.parse(await fs.readFile('server/data/reference/linux-course-index.json','utf8'));
const useBrowser=process.argv.includes('--browser');
let page;
if(useBrowser) {
  const require=createRequire(import.meta.url);
  let playwright;
  try {playwright=require('playwright-core');} catch {
    const cache=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData/Local'),'npm-cache/_npx');
    for(const name of await fs.readdir(cache)) {try{playwright=require(path.join(cache,name,'node_modules/playwright-core'));break;}catch{}}
  }
  if(!playwright)throw new Error('Playwright is unavailable');
  const browser=await playwright.chromium.connectOverCDP('http://127.0.0.1:9222');
  page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://labex.io/'));
  if(!page)throw new Error('Open the signed-in LabEx page first');
  const inspect=process.argv.find(a=>a.startsWith('--inspect='))?.slice(10);
  if(inspect) {
    if(!/^\d+$/.test(inspect))throw new Error('Numeric source ID required');
    const data=await page.evaluate(async id=>{
      const r=await fetch('/api/v2/lab/'+id+'/steps?lang=en',{credentials:'include'});
      const d=await r.json();
      return {status:r.status,keys:Object.keys(d),steps:d.steps?.map(s=>({position:s.position,title:s.title,need_verify:s.need_verify,keys:Object.keys(s),textLength:s.text?.length,textType:typeof s.text}))};
    },inspect);
    console.log(JSON.stringify(data,null,2));process.exit(0);
  }
}
const locals = new Map();
for(const name of await fs.readdir('server/data/labs')) {
  if(!name.endsWith('.json')) continue;
  const lab=JSON.parse(await fs.readFile(path.join('server/data/labs',name),'utf8'));
  if(lab.source_lab_id) locals.set(Number(lab.source_lab_id),lab);
}
const digest = text => crypto.createHash('sha256').update(String(text||'').replace(/\r\n/g,'\n').trim()).digest('hex');
async function get(url) {
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
      if(!response.ok) throw new Error('HTTP '+response.status);
      return await response.json();
    } catch(e) { if(attempt===2) throw e; }
  }
}
const report={checkedAt:new Date().toISOString(),source:'Public labex.io API; no authentication or VM sessions',courses:[],lessons:[],errors:[]};
if(useBrowser) report.source='Source lesson steps through the existing signed-in LabEx browser; no credentials exported, no hidden solutions requested, no VM started.';
const selected = process.argv.filter(a=>a.startsWith('--course=')).map(a=>a.slice(9));
for(const previous of index.courses.filter(c=>!selected.length||selected.includes(c.id))) {
  const url='https://labex.io/api/v2/courses/'+previous.id+'/labs';
  try {
    const source=await get(url);
    if(!Array.isArray(source.stages)) throw new Error('Unexpected syllabus shape');
    const course={id:previous.id,source_url:'https://labex.io/courses/'+previous.id,api_url:url,stages:[],source_labs_count:0};
    for(const stage of source.stages) {
      const labs=(stage.labs||[]).filter(l=>!l.hidden).map(l=>({source_lab_id:l.id,alias:l.alias,title:l.name,order:++course.source_labs_count,type:l.type===1?'challenge':'lab',difficulty:l.difficulty,estimated_minutes:l.time,source_url:'https://labex.io/'+(l.type===1?'labs/':'tutorials/')+l.alias}));
      course.stages.push({name:stage.name,labs});
    }
    report.courses.push(course);
  } catch(e) { report.errors.push({course:previous.id,error:e.message}); }
}
const unique=new Map(report.courses.flatMap(c=>c.stages.flatMap(s=>s.labs)).map(l=>[l.source_lab_id,l]));
const queue=[...unique.values()];
let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<queue.length) {
    const item=queue[cursor++];
    try {
      let payload;
      const file=path.join(out,item.alias+'.json');
      if(process.argv.includes('--resume')) {
        try {const old=JSON.parse(await fs.readFile(file,'utf8')); if(Number(old.reference.source_lab_id)===Number(item.source_lab_id)) payload=old;}catch{}
      }
      if(!payload && useBrowser) {
        const url='https://labex.io/api/v2/lab/'+item.source_lab_id+'/steps?lang=en';
        const result=await page.evaluate(async url=>{
          const r=await fetch(url,{credentials:'include',signal:AbortSignal.timeout(30000)});
          return {status:r.status,data:r.ok?await r.json():null};
        },url);
        if(result.status!==200)throw new Error('Authenticated source HTTP '+result.status);
        payload=Array.isArray(result.data)?{steps:result.data}:result.data;
      }
      if(!payload)payload=await get('https://labex.io/api/v2/tutorials/'+item.alias);
      if(!Array.isArray(payload.steps)||!payload.steps.length||payload.steps.some(s=>typeof s.text!=='string'||!s.text.trim())) throw new Error('Missing public lesson text; not treated as imported');
      await fs.writeFile(file,JSON.stringify({reference:item,tutorial:payload.tutorial,steps:payload.steps},null,2));
      const local=locals.get(item.source_lab_id);
      const sourceSteps=[...payload.steps].sort((a,b)=>a.position-b.position);
      const localSteps=local?.sections||local?.steps||[];
      const same=sourceSteps.length===localSteps.length && sourceSteps.every((s,i)=>s.title===localSteps[i]?.title&&digest(s.text)===digest(localSteps[i]?.content));
      report.lessons.push({id:item.source_lab_id,alias:item.alias,localId:local?.id||null,sourceSections:sourceSteps.length,localSections:localSteps.length,exactEnglishMatch:same,sourceDigest:digest(JSON.stringify(sourceSteps.map(s=>({position:s.position,title:s.title,text:s.text,need_verify:s.need_verify}))))});
    } catch(e) { report.errors.push({lab:item.alias,error:e.message}); }
    if(report.lessons.length%25===0) console.log('Reviewed '+report.lessons.length+'/'+queue.length+' lessons');
  }
}));
report.summary={sourceCourses:report.courses.length,sourceLessons:queue.length,downloaded:report.lessons.length,exactEnglishMatches:report.lessons.filter(l=>l.exactEnglishMatch).length,missingLocal:report.lessons.filter(l=>!l.localId).length,errors:report.errors.length};
await fs.writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report.summary,null,2));
if(report.errors.length) console.log(JSON.stringify(report.errors,null,2));
// Terminate this script's CDP transport without closing the external browser.
if(useBrowser)process.exit(0);
