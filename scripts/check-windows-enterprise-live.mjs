// Scoped live validation only. Never substitutes mocks for domain/DHCP prerequisites.
import 'dotenv/config';
import fs from 'node:fs/promises';
import {azureClient} from '../server/services/azureComputeClient.js';
import {getVmTargetConfig} from '../server/services/cloudConfig.js';
import {getAzureVmStatus} from '../server/services/azureVmService.js';
import {executeWindowsRemote} from '../server/services/windowsRemoteExecutor.js';
import {enterpriseCommand,enterpriseRules} from '../server/services/enterpriseCurriculum.js';
import {listLabs} from '../server/data/catalog.js';
const config=getVmTargetConfig('server');const tag=Date.now().toString(36);
const labs=listLabs().filter(l=>Object.values(enterpriseRules).some(r=>r.lab_id===l.id));
const report={date:new Date().toISOString(),passed:false,checks:[],deferred:[],cleanup:[],deallocated:false};let started=false;
const invoke=async(id,code)=>{
  const command=enterpriseCommand(id,code);if(command.length>10700)throw Error('Live command too large; split phases');
  return executeWindowsRemote(command,{target:'server',labId:id,workspaceOnly:true});
};
try{
  const state=await getAzureVmStatus({target:'server'});report.initial=state.powerState;
  if(state.powerStateCode!=='PowerState/running'){started=true;await azureClient().virtualMachines.start(config.resourceGroup,config.vmName).pollUntilDone();}
  for(const lab of labs){
    const automatic=lab.steps.filter(s=>enterpriseRules[s.id].runtime==='server'&&s.id!=='win-adg-account-delegation-task-3-v1');
    for(const s of lab.steps)if(!automatic.includes(s))report.deferred.push(s.id);
    if(!automatic.length)continue;
    const scratch=lab.id+'-check-'+tag;
    try{
      // First-task server preparation may be needed by a later standalone inventory task.
      if(automatic[0]!==lab.steps[0]){
        const prep=await invoke(scratch,enterpriseRules[lab.steps[0].id].exercise);
        if(prep.exitCode!==0)throw Error('Preparation failed: '+prep.stderr);
      }
      for(const step of automatic){
        const rule=enterpriseRules[step.id];
        const action=await invoke(scratch,rule.exercise);
        if(action.exitCode!==0||action.timedOut)throw Error(step.id+': action failed: '+action.stderr);
        const probe=`$v=& { ${rule.probe} };if($v -isnot [bool] -or -not $v){throw 'Valid state refused'}
$path='C:\\ProgramData\\LabEx\\EnterpriseLabs\\'+$labId+'.json';$original=[IO.File]::ReadAllBytes($path)
try{$m=Get-Content -LiteralPath $path -Raw|ConvertFrom-Json;$m.Host='OTHER';$m|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $path -Encoding UTF8
  $rejected=$false;try{$v=& { ${rule.probe} };$rejected=$v -is [bool] -and -not $v}catch{$rejected=$true};if(-not $rejected){throw 'Wrong context accepted'}
}finally{[IO.File]::WriteAllBytes($path,$original)}
Write-Output 'CHECK_OK'`;
        const result=await invoke(scratch,probe);
        const passed=result.exitCode===0&&!result.timedOut&&result.stdout.includes('CHECK_OK');report.checks.push({id:step.id,passed,error:passed?'':result.stderr});
        console.log(JSON.stringify(report.checks.at(-1)));if(!passed)throw Error('Probe failed');
      }
    }catch(error){report.checks.push({labId:lab.id,passed:false,error:error.message});}
    finally{
      const cleanup=await invoke(scratch,"$path='C:\\ProgramData\\LabEx\\EnterpriseLabs\\'+$labId+'.json';if(Test-Path -LiteralPath $path){Reset-SrvContext}else{Write-Output 'RESET_OK'}");
      report.cleanup.push({labId:lab.id,passed:cleanup.exitCode===0&&cleanup.stdout.trim()==='RESET_OK'});
    }
  }
  report.passed=report.checks.length===19&&report.checks.every(c=>c.passed)&&report.cleanup.every(c=>c.passed);
  if(!report.passed)process.exitCode=1;
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
  if(started){try{await azureClient().virtualMachines.deallocate(config.resourceGroup,config.vmName).pollUntilDone();report.deallocated=true;}catch{process.exitCode=1;}}
  else report.preservedRunningVM=true;
  await fs.mkdir('.artifacts',{recursive:true});await fs.writeFile('.artifacts/windows-enterprise-live.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
