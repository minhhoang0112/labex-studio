import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {listLabs,loadLab} from '../server/data/catalog.js';
import {verifyWindowsRemote,windowsStepReadiness} from '../server/services/windowsRemoteVerifier.js';
import {getVmTargetConfig} from '../server/services/cloudConfig.js';
const rules=JSON.parse(fs.readFileSync(new URL('../server/data/windows-starter-rules.json',import.meta.url)));
const courses=['windows-powershell-for-sysadmins','windows-server-administration-essentials','windows-troubleshooting-and-incident-response'];
const faults={assertAccess(){}};

test('Starter lessons explain observations, expected results and ungraded self practice; revised task IDs match sections',()=>{
  const labs=listLabs().filter(l=>courses.includes(l.course_id));assert.equal(labs.length,15);
  for(const lab of labs){
    assert.equal(lab.curriculum_version,4);assert.equal(lab.references.length,2);
    assert.deepEqual(lab.steps.map(s=>s.id),lab.sections.filter(s=>s.kind==='task').map(s=>s.id));
    for(const step of lab.steps){
      assert.ok(step.content_vi.includes('Bản chất và tình huống thực tế'));
      assert.ok(step.content_vi.includes('Kết quả và cách tự kiểm tra'));
      assert.ok(step.content_vi.includes('Câu hỏi tự giải thích'));
      assert.ok(step.content_vi.includes('không chấm tự động'));
      assert.ok(windowsStepReadiness(step,lab).reasons.every(r=>!r.includes('chưa có bộ kiểm tra')));
    }
  }
  assert.ok(loadLab('win-manage-services-processes').steps[0].hint.includes('Sort-Object DisplayName'));
  assert.ok(!loadLab('win-file-system-ntfs').steps.some(s=>s.id==='win-fs-03-sec-1'));
  assert.match(loadLab('win-server-iis-web').steps[0].task_vi,/phục vụ nội dung/);
  assert.ok(!loadLab('win-server-iis-web').steps[0].content_vi.includes('C:\\inetpub\\wwwroot'));
});

test('Revised graders reject missing, failed or wrong-VM command evidence and remote state failures',async()=>{
  for(const [id,rule] of Object.entries(rules)){
    const step=loadLab(rule.lab_id).steps.find(s=>s.id===id);assert.ok(step);
    const calls=[];
    const execute=async(command,options)=>{calls.push({command,options});return {exitCode:0,target:getVmTargetConfig('server').vmName};};
    let history=rule.commands?.map(g=>({command:g[0],status:0,target:getVmTargetConfig('server').vmName,computerName:'SERVER'})) || [];
    const readHistory=async()=>history;
    if(rule.commands){
      const valid=history;
      for(const bad of [[],valid.map(h=>({...h,status:1})),valid.map(h=>({...h,target:'OTHER'}))]){
        history=bad;assert.equal((await verifyWindowsRemote(rule.lab_id,step,{faults,execute,readHistory})).passed,false,id);
      }
      assert.equal(calls.length,0);history=valid;
    }
    assert.equal((await verifyWindowsRemote(rule.lab_id,step,{faults,execute,readHistory})).passed,true,id);
    assert.equal(calls.at(-1).options.target,'server');assert.ok(!calls.at(-1).command.includes("$env:COMPUTERNAME -ne 'CLIENT01'"));
    for(const result of [{exitCode:1},{exitCode:0,timedOut:true}]){
      assert.equal((await verifyWindowsRemote(rule.lab_id,step,{faults,readHistory,execute:async()=>result})).passed,false,id);
    }
    assert.equal((await verifyWindowsRemote('win-powershell-basics',step,{faults,readHistory,execute:()=>assert.fail('Wrong lesson')})).supported,rule.lab_id==='win-powershell-basics');
  }
});
