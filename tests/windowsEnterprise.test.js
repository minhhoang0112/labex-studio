import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {once} from 'node:events';
import {listLabs} from '../server/data/catalog.js';
import {enterpriseRules as rules,enterpriseCommand,enterpriseRequirement} from '../server/services/enterpriseCurriculum.js';
import {verifyWindowsRemote,windowsStepReadiness} from '../server/services/windowsRemoteVerifier.js';
import {verifyEnterprise} from '../server/services/windowsEnterpriseVerifier.js';
import {createWindowsEnterpriseRouter} from '../server/routes/windowsEnterprise.js';
import {getVmTargetConfig} from '../server/services/cloudConfig.js';
import coursesRouter from '../server/routes/courses.js';
const ids=['windows-active-directory-group-policy','windows-dns-dhcp-network-services'];
const labs=listLabs().filter(l=>ids.includes(l.course_id));const faults={assertAccess(){}};

test('Enterprise curricula publish 12 substantive lessons/36 tasks; isolated DHCP remains unsupported, not synthetic leases',()=>{
  assert.equal(labs.length,12);assert.equal(Object.keys(rules).length,36);
  for(const id of ids)assert.deepEqual(labs.filter(l=>l.course_id===id).sort((a,b)=>a.order-b.order).map(l=>l.order),[1,2,3,4,5,6]);
  for(const l of labs){assert.equal(l.sections.length,5);assert.equal(l.steps.length,3);assert.equal(l.target_vm,'server');assert.equal(l.references.length,2);assert.equal(l.validation_status,'awaiting-live-server');
    assert.deepEqual(l.steps.map(s=>s.id),l.sections.filter(s=>s.need_verify).map(s=>s.id));
    for(const s of l.steps){const r=rules[s.id];assert.equal(r.lab_id,l.id);assert.ok(s.hint.length<10700);assert.ok(s.content.includes('không chấm tự động'));
      if(r.runtime==='isolated-dhcp'){assert.equal(r.probe,null);assert.equal(s.verification.kind,'unsupported');assert.ok(enterpriseRequirement(r));}
      else{assert.ok(r.probe);assert.ok(!/\$true\s*$|^exit 0$/i.test(r.probe));}
      assert.ok(!/Add-DhcpServerv4Lease|Install-ADDSForest|Remove-ADDomain|Stop-Service|Restart-Computer/i.test(s.hint));
    }
  }
  assert.equal(Object.values(rules).filter(r=>r.runtime==='server').length,20);
  assert.equal(Object.values(rules).filter(r=>r.runtime==='domain-client').length,11);
  assert.equal(Object.values(rules).filter(r=>r.runtime==='isolated-dhcp').length,5);
});

test('Selected trusted helpers guard context and ownership; scripts remain bounded and reject unknown lab IDs',()=>{
  for(const r of Object.values(rules).filter(r=>r.probe)){
    const c=enterpriseCommand(r.lab_id,r.probe);assert.ok(c.includes('function Get-SrvContext'));assert.ok(c.includes('Wrong manifest context'));assert.ok(c.includes('Reparse'));
    assert.ok(c.length<10700);assert.ok(!c.includes('function Initialize-SrvContext'));
  }
  const reset=enterpriseCommand(labs[0].id,'Reset-SrvContext');
  assert.ok(reset.includes('Unknown object in lab OU'));assert.ok(reset.includes('GPO linked outside lesson'));assert.ok(reset.includes("$s.State -ne 'Inactive'"));
  assert.ok(!/Remove-ADObject[^\n]*-Recursive/.test(reset));
  assert.throws(()=>enterpriseCommand('../bad','Reset-SrvContext'));
});

test('Enterprise Server checks reject wrong lab, module missing, failed and timed-out execution; unavailable runtime never executes',async()=>{
  for(const l of labs)for(const s of l.steps){const r=rules[s.id];
    if(r.runtime!=='server'){
      assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:()=>assert.fail('Unsupported runtime must not execute')})).supported,false);continue;
    }
    let call;assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:async(c,o)=>{call={c,o};return{exitCode:0,target:'fixture'};}})).passed,true);
    assert.equal(call.o.target,'server');assert.ok(call.c.includes('Get-Module -ListAvailable'));assert.ok(call.c.length<10700);
    for(const result of [{exitCode:1},{exitCode:0,timedOut:true}])assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:async()=>result})).passed,false);
    assert.equal((await verifyWindowsRemote(l.id,s,{faults,execute:async()=>({exitCode:42})})).supported,false);
    assert.equal((await verifyWindowsRemote('win-fnd-system-tools',s,{faults,execute:()=>assert.fail('Wrong lab')})).supported,false);
  }
});

test('Domain readiness requires recent proof for the configured VMs; isolated DHCP never unlocks from a boolean proof',()=>{
  const r=Object.values(rules).find(r=>r.runtime==='domain-client');const now=Date.now();
  const p={schema:1,verifiedAt:new Date(now).toISOString(),registry:{server:getVmTargetConfig('server').vmName,client:getVmTargetConfig('client').vmName},capabilities:{'domain-client':true}};
  assert.equal(enterpriseRequirement(r,{readProof:()=>p,now}),null);
  for(const bad of [{...p,verifiedAt:'invalid'},{...p,verifiedAt:new Date(now-90000000).toISOString()},{...p,registry:{server:'wrong',client:'wrong'}},{...p,capabilities:{'domain-client':false}}])assert.ok(enterpriseRequirement(r,{readProof:()=>bad,now}));
  assert.ok(enterpriseRequirement(Object.values(rules).find(r=>r.runtime==='isolated-dhcp'),{readProof:()=>p,now}));
});

test('Two-machine verification requires actual client result and trusted server facts; server success alone cannot pass',async()=>{
  const r=Object.values(rules).find(r=>r.client_probe);const calls=[];
  const execute=async(c,o)=>{calls.push({c,o});if(c.includes('ConvertTo-Json -Compress'))return {exitCode:0,stdout:JSON.stringify({domain:"lab.test'; Write-Output BAD; '",domainSid:'S-1-5-21-1-2-3',zone:'lx.test',run:'run',gpo:'guid',since:new Date().toISOString()})};return{exitCode:o.target==='client'?1:0};};
  const result=await verifyEnterprise(r.lab_id,r,{execute,faults,checkRequirement:()=>null});assert.equal(result.passed,false);
  assert.deepEqual(calls.map(c=>c.o.target),['server','server','client']);assert.equal(calls[2].o.workspaceOnly,true);
  assert.ok(calls[2].c.includes("lab.test''; Write-Output BAD; ''"));assert.ok(calls[2].c.includes("$env:COMPUTERNAME -ne 'CLIENT01'"));
  assert.ok(calls[2].c.includes('Test-EnterpriseLogonEvidence'));
});

test('Enterprise prepare/reset API validates scope and confirmation, rejects ambiguous success and ignores browser script',async t=>{
  const calls=[];let response={exitCode:0,stdout:''};
  const app=express();app.use(express.json());app.use(createWindowsEnterpriseRouter({faults,execute:async(c,o)=>{calls.push({c,o});return response;},saveProof:async()=>{}}));
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}/windows-enterprise/`;
  const post=(action,body)=>fetch(base+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post('prepare',{labId:'win-fnd-system-tools',confirm:true})).status,400);
  assert.equal((await post('prepare',{labId:labs[0].id,confirm:false})).status,400);
  assert.equal((await post('prepare',{labId:labs[0].id,target:'client',confirm:true})).status,400);assert.equal(calls.length,0);
  assert.equal((await post('prepare',{labId:labs[0].id,confirm:true})).status,502);
  response={exitCode:0,stdout:JSON.stringify({state:'prepared',run:'0'.repeat(32)})};
  assert.equal((await post('prepare',{labId:labs[0].id,confirm:true,script:'BROWSER_INJECTION'})).status,200);assert.ok(!calls.at(-1).c.includes('BROWSER_INJECTION'));
  response={exitCode:0,stdout:'not RESET_OK'};assert.equal((await post('reset',{labId:labs[0].id,confirm:true})).status,502);
  response={exitCode:0,stdout:'RESET_OK'};assert.equal((await post('reset',{labId:labs[0].id,confirm:true})).status,200);
});

test('Enterprise catalog exposes both course contents with truthful partial runtime and no private probes',async t=>{
  const app=express();app.use('/api',coursesRouter);const server=app.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}/api/`;
  for(const id of ids){const c=await fetch(base+'courses/'+id).then(r=>r.json());assert.equal(c.labs.length,6);assert.equal(c.course.steps_count,18);assert.notEqual(c.course.readiness,'ready');
    for(const l of c.labs){const d=await fetch(base+'labs/'+l.id).then(r=>r.json());assert.equal(d.sections.length,5);assert.equal(d.steps.length,3);assert.ok(d.steps.every(s=>!s.probe&&!s.client_probe&&!s.verification));}
  }
});

test('Domain inspection unlocks only after server facts plus client marker; a silent exit0 remains blocked',async t=>{
  let clientOutput='';const saved=[];const calls=[];
  const app=express();app.use(express.json());app.use(createWindowsEnterpriseRouter({faults,saveProof:async p=>saved.push(p),execute:async(c,o)=>{calls.push({c,o});return o.target==='server'?{exitCode:0,stdout:JSON.stringify({domain:'lab.test',dc:'dc.lab.test',domainSid:'S-1-5-21-1-2-3'})}:{exitCode:0,stdout:clientOutput};}}));
  const s=app.listen(0,'127.0.0.1');await once(s,'listening');t.after(()=>new Promise(r=>s.close(r)));
  const post=()=>fetch(`http://127.0.0.1:${s.address().port}/windows-enterprise/inspect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({labId:labs[0].id})});
  assert.equal((await post()).status,409);assert.equal(saved.at(-1).capabilities['domain-client'],false);
  clientOutput='DOMAIN_CLIENT_VERIFIED';assert.equal((await post()).status,200);assert.equal(saved.at(-1).capabilities['domain-client'],true);
  assert.equal(calls.at(-1).o.target,'client');assert.equal(calls.at(-1).o.workspaceOnly,true);
  assert.ok(calls.at(-1).c.includes('Test-ComputerSecureChannel'));assert.ok(calls.at(-1).c.includes('PartOfDomain'));
});
