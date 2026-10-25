import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {listCourseLabs} from '../server/services/linuxRoadmap.js';
import {getVerificationDefinition, verifyDefinition} from '../server/services/verification.js';
import {recordTerminalInput,terminalKeys,clearTerminalEvidence} from '../server/services/terminalEvidence.js';

const labs=listCourseLabs('linux-for-noobs');
const step=(order,number)=>labs.find(l=>l.order===order).steps.find(s=>s.position===number);
const rule=(order,number)=>getVerificationDefinition(step(order,number),'docker');
const children=r=>r?.kind==='all' ? r.checks.flatMap(children) : [r];

test('Noobs scenarios match all 134 task IDs and currently supported/blocked definitions',()=>{
  const plan=JSON.parse(fs.readFileSync(new URL('./scenarios/linux-for-noobs-docker.json',import.meta.url),'utf8'));
  assert.equal(labs.length,37);let tasks=0,blocked=0;
  for(const l of labs){
    const scenario=plan.lessons.find(item=>item.lab_id===l.id);
    assert.deepEqual(scenario.steps.map(s=>s.id),l.steps.map(s=>s.id));
    for(const s of l.steps){
      const r=getVerificationDefinition(s,'docker'),c=scenario.steps.find(c=>c.id===s.id);
      assert.equal(Boolean(c.unsupported),r.kind==='unsupported',`${l.id}/${s.id}`);
      if(r.kind==='unsupported')blocked++;
      for(const leaf of children(r))if(leaf.kind==='commands'){
        for(const group of leaf.groups)for(const pattern of group){assert.ok(pattern.startsWith('^') && pattern.endsWith('$'),`${s.id}: unbounded command match`);new RegExp(pattern);}
      }
      tasks++;
    }
  }
  assert.equal(tasks,134);assert.equal(blocked,12);
});

test('day/calendar check requires both documented files inside first-commands, not parent-directory markers',()=>{
  const r=rule(1,2);assert.equal(r.kind,'state');
  assert.ok(r.command.includes('/home/labex/project/first-commands/'));
  assert.ok(r.command.includes("root/'today.txt'") && r.command.includes("root/'calendar.txt'"));
  assert.ok(r.command.includes('fromisoformat') && r.command.includes("['cal'"));
  assert.ok(!r.command.includes('|| test -f'));
});

test('terminal shortcut evidence is scoped, records no text/password, and clears on reset',()=>{
  const id='test-shortcut-evidence';clearTerminalEvidence(id);
  recordTerminalInput(id,'password-private-text');recordTerminalInput(id,'cat guide.txt\r');
  assert.deepEqual(terminalKeys(id),[]);
  for(const key of ['\x1b[A','\t','\x03','\x0c'])recordTerminalInput(id,key);
  assert.deepEqual(terminalKeys(id),['up','tab','ctrl-c','ctrl-l']);
  assert.deepEqual(terminalKeys('another-lesson'),[]);
  clearTerminalEvidence(id);assert.deepEqual(terminalKeys(id),[]);
});

test('shortcuts cannot pass using a marker alone, command history alone, or failed non-interrupted tail',async()=>{
  const r=rule(3,7);
  const evaluate=(keys,status,exitCode=0)=>verifyDefinition('test-shortcuts',r,{
    readTerminalKeys:async()=>keys,readHistory:async()=>[{user:'labex',command:'tail -f /dev/null',status}],
    runCommand:async()=>({exitCode}),
  });
  const keys=['up','tab','ctrl-c','ctrl-l'];
  assert.equal((await evaluate([],130)).passed,false);
  assert.equal((await evaluate(keys,0)).passed,false);
  assert.equal((await evaluate(keys,130,1)).passed,false);
  assert.equal((await evaluate(keys,130)).passed,true);
});

test('unsupported systemd, mount and kernel tasks cannot pass by typing failed or unrelated commands',async()=>{
  for(const [order,n] of [[14,4],[14,6],[24,7],[28,1],[29,1],[31,1]]){
    const result=await verifyDefinition('unavailable',rule(order,n),{
      runCommand:async()=>assert.fail('Unsupported task must not execute a fake probe'),
      readHistory:async()=>[{user:'labex',command:'echo systemctl curl ssh',status:0}],acknowledged:true});
    assert.equal(result.supported,false);assert.equal(result.passed,false);
  }
});

test('real SSH preparation is loopback-only and graders require authentication and transferred content',async()=>{
  const ssh=labs.find(l=>l.order===32);
  const fixture=JSON.parse(fs.readFileSync(new URL(`../server/data/environment-setups/docker/${ssh.id}.json`,import.meta.url),'utf8'));
  assert.equal(fixture.docker.image,'labex-local/noobs-ubuntu22:1');
  const startup=fixture.files.find(f=>f.path.endsWith('prepare-ssh.sh')).content;
  assert.ok(startup.includes('ListenAddress 127.0.0.1') && startup.includes('PermitRootLogin no'));
  assert.ok(!startup.includes('0.0.0.0'));
  assert.ok(JSON.stringify(rule(32,7)).includes('Accepted publickey for remoteuser'));
  const result=await verifyDefinition(ssh.id,rule(32,2),{
    runCommand:async()=>({exitCode:0}),readHistory:async()=>[{user:'labex',command:'ssh missing-host',status:255}]});
  assert.equal(result.passed,false);
});

test('cron ignores arbitrary comment text and checks the actual installed schedule; Zsh is evaluated freshly',()=>{
  const cron=rule(36,6).checks[0].command;
  assert.ok(cron.includes("not line.lstrip().startswith('#')"));
  assert.ok(!cron.includes('## LabEx managed backup schedule'));
  for(const pair of [[10,5],[11,1]]){
    const r=rule(...pair);assert.ok(r.command.includes('env -u PROJECT_DIR zsh -ic'));
    assert.ok(!r.command.includes('|| grep') && !r.command.includes('|| test -f'));
  }
});
