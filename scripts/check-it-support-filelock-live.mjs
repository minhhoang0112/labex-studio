// Opt-in CLIENT01 acceptance; no VM power operations, only the owned new fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5000',labId='win-it-file-in-use';
const report={passed:false,labId,checks:[],reset:false};
let ownsSession=false;
async function request(path,body){
 const response=await fetch(base+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(600000)}:{});
 const value=await response.json();if(!response.ok)throw Error(value.error||value.message||response.status);return value;
}
try{
 const status=await request('/api/cloud-vm/status?labId='+labId);
 assert.equal(status.powerStateCode,'PowerState/running','Do not start a VM for this test.');
 assert.ok(!status.faultSession||status.faultSession.state==='reset','Do not touch a learner fault session.');
 ownsSession=true;
 console.log('Baseline -> real file handle -> native sharing violation...');
 await request('/api/cloud-vm/fault/prepare',{labId,confirm:true});
 report.checks.push('Baseline file usable; real scheduled process locks it; native sharing violation verified.');
 const verify=()=>request('/api/verify',{labId,stepId:labId+'-sec-2'});
 assert.equal((await verify()).passed,false);
 report.checks.push('Unrepaired held handle fails grading.');
 console.log('Ending only the verified LabExSupportFileLock task...');
 const repair=await request('/api/cloud-vm/powershell',{labId,command:'Stop-ScheduledTask -TaskName LabExSupportFileLock'});
 assert.equal(repair.exitCode,0);
 assert.equal((await verify()).passed,true);
 report.checks.push('Stopping the exact locker passes fresh exclusive ReadWrite open and unchanged-data check.');
 report.passed=true;
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
 if(ownsSession){
  try{
   const status=await request('/api/cloud-vm/status?labId='+labId);
   if(status.faultSession?.labId===labId&&status.faultSession.state!=='reset'){
    console.log('Resetting only the new file-lock fixture...');
    report.reset=(await request('/api/cloud-vm/fault/reset',{labId,confirm:true})).state==='reset';
    assert.equal(report.reset,true);
   }
  }catch(error){report.resetError=error.message;report.passed=false;process.exitCode=1;}
 }
 await fs.writeFile('.artifacts/it-support-filelock-live.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}
