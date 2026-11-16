// Opt-in against an already running idle CLIENT01. No VM start/stop here.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:5000',labId='win-it-cpu-process-diagnosis';
const report={labId,passed:false,checks:[],reset:false};
let attempted=false,priorSession;
async function request(path,body){
  const response=await fetch(base+path,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(600000)});
  const data=await response.json();if(!response.ok)throw Error(data.message||data.error||response.status);return data;
}
async function command(command){
  const result=await request('/api/cloud-vm/powershell',{labId,command});
  assert.equal(result.exitCode,0,'Remote acceptance command failed: '+result.stderr);return result;
}
const verify=()=>request('/api/verify',{labId,stepId:labId+'-sec-2'});
try{
  const status=await request('/api/cloud-vm/status?labId='+labId);
  assert.equal(status.powerStateCode,'PowerState/running');assert.equal(status.isBusy,false);
  assert.ok(!status.faultSession||status.faultSession.state==='reset');priorSession=status.faultSession?.id;attempted=true;
  console.log('Preparing bounded CPU load and functional helper...');
  await request('/api/cloud-vm/fault/prepare',{labId,confirm:true});
  assert.equal((await verify()).passed,false);
  report.checks.push('Baseline helper works; injected worker consumes measured CPU; untouched incident fails.');
  console.log('Stopping the same worker selected by GUI; simulating expiry boundary for negative grading...');
  await command(`$r='C:\\LabEx\\PracticeFaults\\cpuincident';$parts=([IO.File]::ReadAllText((Join-Path $r 'worker.pid'))).Split('|');$p=Get-Process -Id ([int]$parts[0]);if($p.Path -ne (Join-Path $r 'LabExIndexWorker.exe') -or $p.StartTime.ToUniversalTime().Ticks -ne [long]$parts[1]){throw 'Wrong process'};Stop-Process -InputObject $p -Force;$f=Join-Path $r 'state.json';$s=Get-Content -LiteralPath $f -Raw|ConvertFrom-Json;$s.deadline=[DateTimeOffset]::UtcNow.AddMinutes(-1).ToString('o');$s|ConvertTo-Json|Set-Content -LiteralPath $f -Encoding UTF8`);
  assert.equal((await verify()).passed,false);
  report.checks.push('Stopped worker after simulated deadline does not pass.');
  await command(`$f='C:\\LabEx\\PracticeFaults\\cpuincident\\state.json';$s=Get-Content -LiteralPath $f -Raw|ConvertFrom-Json;$s.deadline=[DateTimeOffset]::UtcNow.AddMinutes(15).ToString('o');$s|ConvertTo-Json|Set-Content -LiteralPath $f -Encoding UTF8`);
  assert.equal((await verify()).passed,true);
  report.checks.push('Correct worker termination within deadline passes, same helper answers a fresh random request.');
  console.log('Testing collateral damage: stopping helper after successful repair...');
  await command(`Stop-ScheduledTask -TaskName LabExCpuIncidentHelper`);
  assert.equal((await verify()).passed,false);
  report.checks.push('Stopped unrelated helper fails even with an old successful response and worker absent.');
  report.passed=true;
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
  if(attempted)try{
    const status=await request('/api/cloud-vm/status?labId='+labId);
    if(status.faultSession?.labId===labId && status.faultSession.id!==priorSession && status.faultSession.state!=='reset'){
      console.log('Resetting only owned tasks, processes and workspace...');
      report.reset=(await request('/api/cloud-vm/fault/reset',{labId,confirm:true})).state==='reset';
    }
    assert.equal(report.reset,true);
  }catch(error){report.resetError=error.message;report.passed=false;process.exitCode=1;}
  await fs.writeFile('.artifacts/it-support-cpu-live.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
