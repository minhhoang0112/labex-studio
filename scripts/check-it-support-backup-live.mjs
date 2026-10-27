// Opt-in real CLIENT01 acceptance test. Never powers VMs or touches other tasks.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5000',labId='win-it-scheduled-backup-permissions';
const report={passed:false,labId,checks:[],reset:false};
let ownsSession=false;
async function get(path){const r=await fetch(base+path);const d=await r.json();if(!r.ok)throw Error(d.error||d.message);return d;}
async function post(path,body){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(600000)});const d=await r.json();if(!r.ok)throw Error(d.error||d.message);return d;}
try{
 const status=await get('/api/cloud-vm/status?labId='+labId);
 assert.equal(status.powerStateCode,'PowerState/running','The learner must have CLIENT01 running already.');
 assert.ok(!status.faultSession||status.faultSession.state==='reset','Do not interrupt an existing fault session.');
 console.log('Preparing only the new backup-permission fixture...');
 ownsSession=true;
 await post('/api/cloud-vm/fault/prepare',{labId,confirm:true});
 report.checks.push('Baseline functional -> actual access-denied injection -> broken state verified.');
 const verify=()=>post('/api/verify',{labId,stepId:labId+'-sec-2'});
 assert.equal((await verify()).passed,false);report.checks.push('Unrepaired permissions fail grading.');
 console.log('Checking that manually copying an old invoice cannot pass...');
 await post('/api/cloud-vm/powershell',{labId,command:"Copy-Item -LiteralPath 'C:\\LabEx\\PracticeFaults\\taskacl\\Source\\invoice.txt' -Destination 'C:\\LabEx\\PracticeFaults\\taskacl\\Backup\\invoice.txt' -Force"});
 assert.equal((await verify()).passed,false);report.checks.push('Manually copied old invoice fails fresh-run challenge.');
 console.log('Applying the minimal ACL repair, leaving LOCAL SERVICE principal intact...');
 const fixed=await post('/api/cloud-vm/powershell',{labId,command:"icacls 'C:\\LabEx\\PracticeFaults\\taskacl\\Backup' /grant '*S-1-5-19:(OI)(CI)M'; if($LASTEXITCODE -ne 0){exit 1}"});
 assert.equal(fixed.exitCode,0);
 assert.equal((await verify()).passed,true);report.checks.push('Modify permission repair passes actual LOCAL SERVICE task and fresh file/hash check.');
 report.passed=true;
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
 if(ownsSession){
   try{const current=await get('/api/cloud-vm/status?labId='+labId);
     if(current.faultSession?.labId===labId&&current.faultSession.state!=='reset'){
       console.log('Resetting only the new fixture...');
       const reset=await post('/api/cloud-vm/fault/reset',{labId,confirm:true});
       report.reset=reset.state==='reset';assert.equal(report.reset,true);
     }
   }catch(error){report.resetError=error.message;report.passed=false;process.exitCode=1;}
 }
 await fs.writeFile('.artifacts/it-support-backup-live.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}
