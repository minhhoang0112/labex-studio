// Explicit acceptance run on an already running, idle CLIENT01. Never starts a VM.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = 'http://127.0.0.1:5000', labId = 'win-it-user-folder-permissions';
const report = { labId, passed: false, checks: [], reset: false };
let attempted = false, priorSession;
async function request(path, body) {
  const response = await fetch(base + path, { ...(body ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(600000) });
  const data = await response.json();
  if (!response.ok) throw Error(data.message || data.error || response.status);
  return data;
}
async function command(command) {
  const result = await request('/api/cloud-vm/powershell', {labId, command});
  assert.equal(result.exitCode, 0, 'Remote test command failed: ' + (result.stderr || result.output || '').slice(0, 1000));
}
const verify = () => request('/api/verify', {labId,stepId:labId+'-sec-2'});
const folder = 'C:\\LabEx\\PracticeFaults\\useracl\\Documents';
const acl = rights => `$p='${folder}'; $a=Get-Acl -LiteralPath $p; $u=(Get-LocalUser LabExWriterV2).SID; $a.SetAccessRule([Security.AccessControl.FileSystemAccessRule]::new($u,'${rights}','ContainerInherit,ObjectInherit','None','Allow')); Set-Acl -LiteralPath $p -AclObject $a`;
try {
  const status = await request('/api/cloud-vm/status?labId='+labId);
  assert.equal(status.powerStateCode,'PowerState/running');
  assert.equal(status.isBusy,false);
  assert.ok(!status.faultSession || status.faultSession.state === 'reset');
  priorSession = status.faultSession?.id; attempted = true;
  console.log('Prepare: real users, positive baseline, read-only fault and outsider denial...');
  await request('/api/cloud-vm/fault/prepare',{labId,confirm:true});
  assert.equal((await verify()).passed,false);
  report.checks.push('Injected read-only access fails grading; baseline and fault probes used real user tokens.');
  await command(acl('Modify'));
  assert.equal((await verify()).passed,true);
  report.checks.push('Modify on Documents passes fresh existing-file/open/create/append/rename/delete operations; outsider remains denied.');
  console.log('Negative tests: stale files, FullControl and broad read grants...');
  await command(acl('ReadAndExecute'));
  assert.equal((await verify()).passed,false);
  report.checks.push('Removing write again fails despite prior successful result.');
  await command(acl('FullControl'));
  assert.equal((await verify()).passed,false);
  report.checks.push('Employee FullControl is rejected.');
  await command(acl('Modify') + `; $a=Get-Acl -LiteralPath $p; $a.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-1-0'),'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow')); Set-Acl -LiteralPath $p -AclObject $a`);
  assert.equal((await verify()).passed,false);
  report.checks.push('Everyone read permission is rejected even if writer can work.');
  await command(`$p='${folder}';$a=Get-Acl -LiteralPath $p; $a.PurgeAccessRules([Security.Principal.SecurityIdentifier]::new('S-1-1-0'));Set-Acl -LiteralPath $p -AclObject $a`);
  assert.equal((await verify()).passed,true);
  report.passed = true;
} catch(error) {report.error=error.message;process.exitCode=1;}
finally {
  if(attempted) try {
    const status=await request('/api/cloud-vm/status?labId='+labId);
    if(status.faultSession?.labId===labId && status.faultSession.id!==priorSession && status.faultSession.state!=='reset'){
      console.log('Reset owned accounts and workspace...');
      report.reset=(await request('/api/cloud-vm/fault/reset',{labId,confirm:true})).state==='reset';
    }
    assert.equal(report.reset,true);
  } catch(error) {report.resetError=error.message;report.passed=false;process.exitCode=1;}
  await fs.writeFile('.artifacts/it-support-useracl-live.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
