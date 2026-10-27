import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadLab} from '../server/data/catalog.js';
import {verifyWindowsRemote} from '../server/services/windowsRemoteVerifier.js';
import {faultCommand, faultScenarios} from '../server/services/windowsFaults.js';

const rules=JSON.parse(fs.readFileSync(new URL('../server/data/windows-professional-rules.json',import.meta.url),'utf8'));
const faults={assertAccess(){}};
test('professional criteria are bound to the correct lab/VM and reject wrong state, timeout, missing role',async()=>{
  for(const [id,rule] of Object.entries(rules)){
    assert.match(rule.root,/^C:\\LabEx\\Labs\\win-(?:bkr|web)-[a-z0-9-]+$/);
    const lab=loadLab(rule.lab_id), step=lab.steps.find(s=>s.id===id);
    assert.ok(step,id);
    assert.ok(lab.sections.some(s=>s.id===id && s.content===step.content));
    const calls=[];
    const run=async result=>verifyWindowsRemote(lab.id,step,{faults,execute:async(command,options)=>{calls.push({command,options});return result;}});
    assert.equal((await run({exitCode:0})).passed,true);
    assert.equal(calls[0].options.target,rule.target_vm);
    assert.ok(calls[0].command.includes('Assert-ProWorkspace'));
    assert.ok(!calls[0].command.includes(step.hint));
    for(const result of [{exitCode:1},{exitCode:0,timedOut:true},{exitCode:42},{exitCode:43}])assert.equal((await run(result)).passed,false,id);
    assert.equal((await verifyWindowsRemote('win-it-asset-inventory',step,{faults,execute:()=>assert.fail('Cross-lab command executed')})).supported,false);
  }
});

test('file-in-use ticket grades only the repair, uses real sharing violation and ownership-scoped reset',()=>{
  const lab=loadLab('win-it-file-in-use');
  assert.equal(lab.target_vm,'client');
  assert.equal(lab.steps.length,1);
  assert.equal(lab.steps[0].id,'win-it-file-in-use-sec-2');
  assert.equal(lab.sections[1].kind,'document');
  assert.equal(faultScenarios[lab.id],'filelock');
  const command=faultCommand('filelock','Faulted');
  for(const expected of ['[IO.FileShare]::None','-eq 32','Assert-Owned','Task action changed','Stop-ScheduledTask','Fixture expired'])assert.ok(command.includes(expected),expected);
  assert.ok(!command.includes('Stop-Process'));
  assert.ok(Buffer.from(command,'utf16le').toString('base64').length<31000);
});

test('professional teaching leaves introductions alone and preserves the honest pending acceptance manifest',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../docs/windows-professional-review.json',import.meta.url),'utf8'));
  assert.equal(manifest.live_acceptance,'pending');
  assert.equal(manifest.teaching_reviewed.length,52);
  assert.ok(manifest.teaching_reviewed.every(id=>!id.startsWith('win-fnd-') && !id.startsWith('win-nwf-')));
  for(const id of manifest.teaching_reviewed){
    const lab=loadLab(id);
    for(const step of lab.steps){
      assert.ok(step.content.includes('Bài tập độc lập'),step.id);
      assert.ok(step.content.includes('Điều kiện dừng'),step.id);
      assert.ok(step.content.includes('có báo cáo đúng chưa chứng minh đã sửa'),step.id);
    }
  }
});
