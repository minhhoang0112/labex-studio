// Real CLIENT01 validation in uniquely named scratch labs. Never resets learner labs.
import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {listLabs} from '../server/data/catalog.js';
import {executeWindowsRemote} from '../server/services/windowsRemoteExecutor.js';
import {getAzureVmStatus} from '../server/services/azureVmService.js';
import {azureClient} from '../server/services/azureComputeClient.js';
import {getVmTargetConfig} from '../server/services/cloudConfig.js';
import {windowsFaults} from '../server/services/windowsFaults.js';

const config=getVmTargetConfig('client');assert.equal(config.vmName,'LabEx-CLIENT01');
const labs=listLabs().filter(l=>l.course_id==='windows-11-fundamentals').sort((a,b)=>a.order-b.order);
const rules=JSON.parse(await fs.readFile('server/data/windows-foundations-rules.json','utf8'));
const common=await fs.readFile('server/runtime/windows/fundamentals-common.ps1','utf8');
const report={passed:false,realAzure:true,checks:[],deallocated:false};
let startedByTest=false;
const fault=windowsFaults.status();
if(fault && !['reset','idle'].includes(fault.state))throw Error('CLIENT01 has an active fault session; restore through its lesson first.');
const runTag=Date.now().toString(36);
const cases=labs.flatMap(l=>l.steps.map((s,i)=>({lab:l.id,tag:l.id.replace('win-fnd-','win-fnd-check-'+runTag+'-'),step:s.id,file:`step${i+1}.json`,script:s.hint,probe:rules[s.id].probe})));
const packed=gzipSync(Buffer.from(JSON.stringify({common,cases}))).toString('base64');
const batch=`$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1 -or [int](Get-CimInstance Win32_OperatingSystem).BuildNumber -lt 22000){throw 'Wrong VM'}
$compressed=[IO.MemoryStream]::new([Convert]::FromBase64String('${packed}'))
$gzip=[IO.Compression.GzipStream]::new($compressed,[IO.Compression.CompressionMode]::Decompress)
$reader=[IO.StreamReader]::new($gzip);$payload=$reader.ReadToEnd()|ConvertFrom-Json;$reader.Dispose();$compressed.Dispose()
. ([scriptblock]::Create($payload.common))
$checks=@();$details=@()
foreach($case in $payload.cases){
  $labId=$case.tag;$labRoot='C:\\LabEx\\Labs\\'+$labId
  $scriptText=$case.script.Replace($case.lab,$case.tag)
  $ok=$false;$err=''
  try{
    & ([scriptblock]::Create($scriptText)) | Out-Null
    $value=& ([scriptblock]::Create($case.probe));if($value -isnot [bool] -or -not $value){throw 'Positive probe rejected'}
    $file=Join-Path $labRoot $case.file;$original=[IO.File]::ReadAllBytes($file)
    try{
      $r=Get-Content -LiteralPath $file -Raw|ConvertFrom-Json;$r.Computer='OTHER';$r|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $file -Encoding UTF8
      $rejected=$false;try{$rejected=-not (& ([scriptblock]::Create($case.probe)))}catch{$rejected=$true}
      if(-not $rejected){throw 'Wrong computer accepted'}
    }finally{[IO.File]::WriteAllBytes($file,$original)}
    $ok=$true
  }catch{$err=$_.Exception.Message}
  $checks+=@{id=$case.step;passed=$ok;error=$err};$details+=($case.step+': '+$err)
}
$reportPath=Join-Path $PWD 'foundations-live-details.json';$checks|ConvertTo-Json -Depth 6|Set-Content -LiteralPath $reportPath -Encoding UTF8
@{passed=(@($checks|Where-Object {-not $_.passed}).Count -eq 0);count=$checks.Count;failed=@($checks|Where-Object {-not $_.passed}|ForEach-Object {$_.id+': '+$_.error});scratchTag='${runTag}'}|ConvertTo-Json -Compress -Depth 5
`;
assert.ok(batch.length<16000,'Compressed batch must fit executor input limit');
if(process.argv.includes('--write-batch')){
  await fs.writeFile('.artifacts/windows-foundations-live-batch.ps1',batch);process.exit(0);
}
try{
  const initial=await getAzureVmStatus({target:'client'});report.initialState=initial.powerState;
  if(initial.powerStateCode!=='PowerState/running'){
    startedByTest=true;
    await azureClient().virtualMachines.start(config.resourceGroup,config.vmName).pollUntilDone();
  }
  const result=await executeWindowsRemote(batch,{target:'client',labId:'win-fnd-validation',workspaceOnly:true});
  if(result.exitCode!==0 || !result.stdout.trim())throw Error('Validation script failed: '+JSON.stringify(result));
  const check=JSON.parse(result.stdout.trim());report.checks=check;
  assert.equal(check.count,12);assert.equal(check.passed,true,JSON.stringify(check));report.passed=true;
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
  if(startedByTest){try{await azureClient().virtualMachines.deallocate(config.resourceGroup,config.vmName).pollUntilDone();report.deallocated=true;}catch{report.deallocated=false;process.exitCode=1;}}
  else report.preservedRunningVM=true;
  await fs.writeFile('.artifacts/windows-foundations-live.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
