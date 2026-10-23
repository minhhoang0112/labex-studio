import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import {once} from 'node:events';
import {listLabs} from '../server/data/catalog.js';
import coursesRouter from '../server/routes/courses.js';
import {verifyWindowsRemote} from '../server/services/windowsRemoteVerifier.js';
import {createVerifyRouter} from '../server/routes/verify.js';
const labs=listLabs().filter(l=>l.course_id==='windows-networking-fundamentals').sort((a,b)=>a.order-b.order);
const rules=JSON.parse(fs.readFileSync(new URL('../server/data/windows-networking-rules.json',import.meta.url)));
const faults={assertAccess(){}};

test('Networking curriculum has six real lessons, twelve mapped tasks and constrained self-contained exercises',()=>{
  assert.equal(labs.length,6);assert.equal(Object.keys(rules).length,12);
  assert.deepEqual(labs.map(l=>l.order),[1,2,3,4,5,6]);
  for(const l of labs){
    assert.equal(l.target_vm,'client');assert.equal(l.sections.length,4);assert.equal(l.steps.length,2);
    assert.equal(l.preparation.fault_injection,false);assert.equal(l.references.length,2);
    assert.deepEqual(l.steps.map(s=>s.id),l.sections.filter(s=>s.need_verify).map(s=>s.id));
    for(const s of l.steps){
      assert.equal(rules[s.id].lab_id,l.id);assert.equal(rules[s.id].target_vm,'client');
      assert.ok(s.content.includes('không chấm tự động'));assert.ok(s.hint.length<16000);
      assert.ok(!/\b(?:Set-Net|New-NetIPAddress|Remove-Net|Disable-Net|Set-DnsClient|netsh|Stop-Service|Set-ItemProperty)\b/i.test(s.hint));
      assert.ok(!/ipconfig\s+\/(?:release|renew|flushdns)/i.test(s.hint));
      assert.ok(!/Invoke-Expression|DownloadString|Start-Process/i.test(s.hint));
    }
  }
});

test('Networking graders inject trusted helpers, target CLIENT01, and reject wrong lesson, failed or timed-out execution',async()=>{
  for(const l of labs)for(const s of l.steps){
    let call;
    const execute=async(command,options)=>{call={command,options};return {exitCode:0,target:'LabEx-CLIENT01'};};
    assert.equal((await verifyWindowsRemote(l.id,s,{execute,faults})).passed,true);
    assert.equal(call.options.target,'client');assert.ok(call.command.length<16000);
    assert.ok(call.command.includes("$env:COMPUTERNAME -ne 'CLIENT01'"));
    assert.ok(call.command.includes('BuildNumber -lt 22000'));assert.ok(call.command.includes('Reparse path refused'));
    assert.ok(call.command.includes('AddHours(-24)'));assert.ok(call.command.includes('[Net.IPAddress]::Loopback'));
    for(const response of [{exitCode:1},{exitCode:0,timedOut:true}])assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:async()=>response})).passed,false);
    assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:async()=>({exitCode:43})})).supported,false);
    assert.equal((await verifyWindowsRemote('win-fnd-system-tools',s,{faults,execute:()=>assert.fail('Wrong lab must never execute')})).supported,false);
  }
});

test('Networking course and labs are exposed through existing APIs without private rules or client-side pass bypass',async t=>{
  const keys=['AZURE_SUBSCRIPTION_ID','AZURE_CLIENT_VM_IP','WINDOWS_CLIENT_ADMIN_PASSWORD'];
  const previous=keys.map(k=>process.env[k]);for(const k of keys)process.env[k]='fixture';
  t.after(()=>keys.forEach((k,i)=>{if(previous[i]===undefined)delete process.env[k];else process.env[k]=previous[i];}));
  const app=express();app.use(express.json());app.use('/api',coursesRouter);
  let calls=0;app.use('/api',createVerifyRouter({verifyWindows:async()=>{calls++;return {supported:true,passed:false,method:'windows-remote'};}}));
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const data=await fetch(base+'/courses/windows-networking-fundamentals').then(r=>r.json());
  assert.equal(data.course.curriculum_status,'implemented');assert.equal(data.labs.length,6);assert.equal(data.course.steps_count,12);
  assert.deepEqual(data.course.prerequisites,['windows-11-fundamentals']);
  for(const l of data.labs){
    assert.equal(l.target_vm,'client');assert.equal(l.preparation.fault_injection,false);
    const detail=await fetch(base+'/labs/'+l.id).then(r=>r.json());assert.equal(detail.availability.target_vm,'client');
    for(const s of detail.steps){assert.equal(s.verification_kind,'windows-remote');assert.equal(s.verification,undefined);assert.equal(s.probe,undefined);}
  }
  const response=await fetch(base+'/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({labId:labs[0].id,stepId:labs[0].steps[0].id,passed:true,command:'exit 0',acknowledge:true})});
  assert.equal(response.status,200);assert.equal((await response.json()).passed,false);assert.equal(calls,1);
});
