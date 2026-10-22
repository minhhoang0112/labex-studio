import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import {once} from 'node:events';
import {listLabs} from '../server/data/catalog.js';
import coursesRouter from '../server/routes/courses.js';
import {verifyWindowsRemote,windowsStepReadiness} from '../server/services/windowsRemoteVerifier.js';
import {createVerifyRouter} from '../server/routes/verify.js';
const labs=listLabs().filter(l=>l.course_id==='windows-11-fundamentals').sort((a,b)=>a.order-b.order);
const rules=JSON.parse(fs.readFileSync(new URL('../server/data/windows-foundations-rules.json',import.meta.url)));
const faults={assertAccess(){}};

test('Windows foundations contains six actual ordered lessons with two substantive tasks each, no machine-setting changes',()=>{
  assert.equal(labs.length,6);assert.equal(Object.keys(rules).length,12);
  assert.deepEqual(labs.map(l=>l.order),[1,2,3,4,5,6]);
  for(const l of labs){
    assert.equal(l.target_vm,'client');assert.equal(l.steps.length,2);assert.equal(l.sections.length,4);
    assert.deepEqual(l.steps.map(s=>s.id),l.sections.filter(s=>s.kind==='task').map(s=>s.id));
    assert.equal(l.preparation.mode,'self-contained');assert.equal(l.preparation.fault_injection,false);
    assert.equal(l.references.length,2);
    for(const s of l.steps){
      assert.equal(rules[s.id].lab_id,l.id);assert.equal(rules[s.id].target_vm,'client');assert.equal(s.verification.kind,'windows-remote');
      assert.ok(s.content.includes('Câu hỏi tự giải thích'));assert.ok(s.content.includes('không chấm tự động'));
      assert.ok(s.content.includes('Kết quả và cách tự kiểm tra'));assert.ok(!s.hint.includes('Win32_Product'));
      assert.ok(!/\b(?:Set-ItemProperty|Set-Acl|Stop-Service|New-LocalUser|Restart-Computer|Remove-Item)\b/i.test(s.hint));
      assert.ok(windowsStepReadiness(s,l).reasons.every(r=>!r.includes('chưa có bộ kiểm tra')));
    }
  }
});

test('Foundation verification always targets CLIENT01 with protected reports, rejects errors/timeouts/wrong lab',async()=>{
  for(const l of labs)for(const s of l.steps){
    const calls=[];const execute=async(command,options)=>{calls.push({command,options});return {exitCode:0,target:'LabEx-CLIENT01'};};
    assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute})).passed,true);
    assert.equal(calls[0].options.target,'client');assert.ok(calls[0].command.includes('Read-FndReport'));
    assert.ok(calls[0].command.includes('Reparse path refused'));assert.ok(calls[0].command.includes('AddHours(-24)'));
    assert.ok(calls[0].command.includes("$env:COMPUTERNAME -ne 'CLIENT01'"));assert.ok(calls[0].command.length<16000);
    for(const response of [{exitCode:1},{exitCode:0,timedOut:true}])assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:async()=>response})).passed,false);
    assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:async()=>({exitCode:43})})).supported,false);
    assert.equal((await verifyWindowsRemote('win-it-asset-inventory',s,{faults,execute:()=>assert.fail('Wrong lesson must not execute')})).supported,false);
  }
});

test('Foundation API exposes six real labs and hides probes; browser claims do not grade a task',async t=>{
  const old={subscription:process.env.AZURE_SUBSCRIPTION_ID,ip:process.env.AZURE_CLIENT_VM_IP,password:process.env.WINDOWS_CLIENT_ADMIN_PASSWORD};
  Object.assign(process.env,{AZURE_SUBSCRIPTION_ID:'fixture',AZURE_CLIENT_VM_IP:'fixture',WINDOWS_CLIENT_ADMIN_PASSWORD:'fixture'});
  t.after(()=>{for(const [key,value] of Object.entries({AZURE_SUBSCRIPTION_ID:old.subscription,AZURE_CLIENT_VM_IP:old.ip,WINDOWS_CLIENT_ADMIN_PASSWORD:old.password})){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
  const app=express();app.use(express.json());app.use('/api',coursesRouter);let calls=0;
  app.use('/check',createVerifyRouter({verifyWindows:async()=>{calls++;return {supported:true,passed:false,method:'windows-remote'};}}));
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const data=await fetch(base+'/api/courses/windows-11-fundamentals').then(r=>r.json());
  assert.equal(data.course.curriculum_status,'implemented');assert.equal(data.labs.length,6);assert.equal(data.course.steps_count,12);
  assert.equal(data.course.prerequisites.length,0);
  for(const l of data.labs){
    assert.equal(l.target_vm,'client');assert.equal(l.preparation.mode,'self-contained');
    const detail=await fetch(base+'/api/labs/'+l.id).then(r=>r.json());
    assert.equal(detail.availability.target_vm,'client');
    assert.ok(detail.steps.every(s=>!s.probe && !s.verification && !s.verify_command && s.verification_kind==='windows-remote'));
  }
  const response=await fetch(base+'/check/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({labId:labs[0].id,stepId:labs[0].steps[0].id,passed:true,command:'exit 0',acknowledge:true})});
  assert.equal(response.status,200);assert.equal((await response.json()).passed,false);assert.equal(calls,1);
});
