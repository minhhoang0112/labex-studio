import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listLabs } from '../server/data/catalog.js';
import { windowsStepReadiness, verifyWindowsRemote } from '../server/services/windowsRemoteVerifier.js';
import { faultScenarios, faultCommand, createWindowsFaultService } from '../server/services/windowsFaults.js';

const labs = listLabs().filter(lab=>lab.course_id === 'windows-11-it-support-troubleshooting');
test('Windows support has 25 ordered lessons, 50 tasks, references and complete reviewed graders', () => {
  assert.equal(labs.length, 25);
  assert.equal(labs.reduce((count,lab)=>count+lab.steps.length,0), 50);
  assert.deepEqual(labs.map(lab=>lab.order).sort((a,b)=>a-b), Array.from({length:25},(_,i)=>i+1));
  assert.equal(labs.filter(lab=>faultScenarios[lab.id]).length, 7);
  for (const lab of labs) {
    assert.equal(lab.target_vm, 'client');
    for (const step of lab.steps) {
      const readiness = windowsStepReadiness(step, lab);
      assert.ok(readiness.reasons.every(reason=>!reason.includes('chưa có bộ kiểm tra')), step.id);
    }
    if (lab.curriculum_version !== 3) continue;
    assert.equal(lab.references.length, 2);
    assert.ok(lab.references.every(ref=>new URL(ref.url).hostname.endsWith('microsoft.com')));
    assert.deepEqual(lab.sections.filter(section=>section.kind === 'task').map(section=>section.id), lab.steps.map(step=>step.id));
    for (const step of lab.steps) {
      assert.ok(step.content.includes('Câu hỏi tự giải thích'));
      assert.ok(step.content.includes('Kết quả và cách tự kiểm tra'));
      assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(step.hint), 'Invalid control escape in learner command');
    }
  }
});

test('additional graders read the actual CLIENT01 state and reject failures, timeouts and wrong lesson rules', async () => {
  const lab = labs.find(item=>item.id === 'win-it-backup-robocopy');
  const calls=[];
  const faults={assertAccess:()=>{}};
  const execute=async(command, options)=>{ calls.push({command,options}); return {exitCode:0,target:'LabEx-CLIENT01'}; };
  assert.equal((await verifyWindowsRemote(lab.id,lab.steps[1],{faults,execute})).passed,true);
  assert.equal(calls[0].options.target,'client');
  assert.ok(calls[0].command.includes('Get-FileHash'));
  assert.ok(calls[0].command.includes(lab.id));
  assert.ok(calls[0].command.includes("$env:COMPUTERNAME -ne 'CLIENT01'"));
  for (const result of [{exitCode:1},{exitCode:0,timedOut:true}]) {
    assert.equal((await verifyWindowsRemote(lab.id,lab.steps[1],{faults,execute:async()=>result})).passed,false);
  }
  assert.equal((await verifyWindowsRemote('win-it-asset-inventory',lab.steps[1],{faults,execute:()=>assert.fail('Wrong lesson must not execute')})).supported,false);
});

test('new fault scenarios retain baseline, ownership, broken-state and functional repair gates', async t => {
  for (const id of ['win-it-file-extension-fix','win-it-app-config-repair','win-it-deleted-file-restore','win-it-scheduled-backup-fix']) {
    const folder=fs.mkdtempSync(path.join(os.tmpdir(),'labex-expanded-fault-'));
    t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
    const operations=[];
    let repaired=false;
    const faults=createWindowsFaultService({ journal:path.join(folder,'session.json'), baseline:async()=>{},
      execute:async command=>{
        const operation=command.match(/-Operation '([A-Za-z]+)' -Scenario/)[1]; operations.push(operation);
        assert.ok(command.includes('PracticeFaults'));
        return {exitCode:operation === 'Healthy' && operations.includes('Inject') && !repaired ? 1 : 0};
      } });
    await faults.prepare(id);
    assert.deepEqual(operations,['Baseline','Healthy','Inject','Faulted']);
    assert.equal((await faults.verify(id)).passed,false);
    repaired=true;
    assert.equal((await faults.verify(id)).passed,true);
    assert.equal((await faults.reset(id)).state,'reset');
    assert.throws(()=>faultCommand(faultScenarios[id],"Reset'; bad"));
  }
});
