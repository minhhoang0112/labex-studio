import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createWindowsRemoteExecutor} from '../server/services/windowsRemoteExecutor.js';

test('Real Windows child process confirms execution even with explicit exit; empty protocol cannot certify a grade', {skip:process.platform!=='win32'},async()=>{
  const fixture=await fs.mkdtemp(path.resolve('.artifacts/remote-process-'));
  let count=0;
  const client={virtualMachines:{runCommand:(_rg,_vm,input)=>({pollUntilDone:async()=>{
    const script=input.script[0].replace(/\$workspace='[^']*'/,"$workspace='"+fixture.replaceAll("'","''")+"'");
    const file=path.join(fixture,`wrapper-${count++}.ps1`);await fs.writeFile(file,script,'utf8');
    const p=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',file],{encoding:'utf8',timeout:15000,windowsHide:true});
    assert.equal(p.status,0,p.stderr||p.error?.message);
    return {value:[{code:'ComponentStatus/StdOut/succeeded',message:p.stdout}]};
  }})}};
  const execute=createWindowsRemoteExecutor({client:()=>client,config:()=>({resourceGroup:'fixture',vmName:'fixture'})});
  for(const [command,code,output] of [["Write-Output 'CANARY'; exit 7",7,'CANARY'],['exit 0',0,''],["throw 'Expected test failure'",1,'']]){
    const r=await execute(command,{target:'client'});
    assert.equal(r.exitCode,code);assert.equal(r.executionConfirmed,true);assert.equal(r.stdout,output);
    assert.ok(!r.stdout.includes('LABEX_EXECUTED_'));
  }
});
