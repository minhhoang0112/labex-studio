import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadLab} from '../server/data/catalog.js';
import {getCourses} from '../server/routes/courses.js';
import {sshConfig,sshProcess,isUpskillLab} from '../server/pty/upskillSsh.js';
import {getStepReadiness,getLabReadiness} from '../server/services/readiness.js';
test('22 lessons preserve pinned licensed source and keep practical grading distinct from continuation',()=>{
  const manifest=JSON.parse(fs.readFileSync('server/data/reference/linux-upskill-challenge/manifest.json'));
  const course=getCourses().find(c=>c.id==='linux-upskill-challenge');assert.equal(course.labs_count,22);assert.equal(course.source_url,'https://linuxupskillchallenge.org/');
  for(let day=0;day<22;day++) {
    const id=`luc-day-${String(day).padStart(2,'0')}`,lab=loadLab(id);
    assert.equal(lab.order,day+1);assert.equal(lab.steps[0].id,lab.sections.find(s=>s.kind==='task').id);
    const source=lab.sections.find(s=>s.source_text_verified);
    const hash=createHash('sha256').update(source.content).digest('hex');
    assert.equal(hash,manifest.files.find(f=>f.file===`docs/${String(day).padStart(2,'0')}.md`).sha256);
    assert.equal(source.translation_kind,'adaptation');assert.ok(source.content_vi.includes('CC BY 4.0'));
    assert.equal(lab.steps[0].verification.kind,day===21?'acknowledgement':'state');
    if(day<21)assert.ok(lab.steps[0].verification.command.trim().length>25);
  }
});
test('missing VM never falls back to a container or grades a practical task',()=>{
  const old={};for(const key of ['LUC_SSH_HOST','LUC_SSH_USER','LUC_SSH_KEY','LUC_SSH_KNOWN_HOSTS']){old[key]=process.env[key];delete process.env[key];}
  try {
    const lab=loadLab('luc-day-07');assert.equal(getStepReadiness(lab.steps[0],lab).ready,false);
    assert.equal(getLabReadiness(lab).can_open,true);assert.equal(getLabReadiness(lab).can_start_terminal,false);
    assert.throws(()=>sshProcess(lab.id,'true'),{code:'ENVIRONMENT_UNAVAILABLE'});
  } finally {for(const [key,value] of Object.entries(old))if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
test('SSH pins host keys, requires non-root user and adds a dedicated VM guard before shell or grading',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'luc-ssh-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'key'),'test');fs.writeFileSync(path.join(dir,'known'),'test');
  const env={LUC_SSH_HOST:'192.168.11.136',LUC_SSH_USER:'luc',LUC_SSH_KEY:path.join(dir,'key'),LUC_SSH_KNOWN_HOSTS:path.join(dir,'known')};
  const spec=sshProcess('luc-day-01',"printf '%s' hello",{env,platform:'linux'});
  assert.ok(spec.args.includes('StrictHostKeyChecking=yes'));assert.ok(spec.args.includes('BatchMode=yes'));
  assert.ok(spec.args.at(-1).includes('/etc/labex-upskill-vm'));assert.ok(!spec.args.includes('StrictHostKeyChecking=no'));
  assert.ok(sshProcess('luc-day-01',undefined,{env,platform:'linux'}).args.includes('-tt'));
  assert.throws(()=>sshConfig({...env,LUC_SSH_USER:'root'}));assert.throws(()=>sshConfig({...env,LUC_SSH_HOST:'-oProxyCommand=bad'}));
  assert.equal(isUpskillLab('luc-day-22'),false);
});
