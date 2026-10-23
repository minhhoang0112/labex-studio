import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {listLabs} from '../server/data/catalog.js';
import {executeWindowsRemote} from '../server/services/windowsRemoteExecutor.js';
import {getAzureVmStatus} from '../server/services/azureVmService.js';
import {azureClient} from '../server/services/azureComputeClient.js';
import {getVmTargetConfig} from '../server/services/cloudConfig.js';
import {windowsFaults} from '../server/services/windowsFaults.js';

const config=getVmTargetConfig('client');assert.equal(config.vmName,'LabEx-CLIENT01');
const fault=windowsFaults.status();
if(fault && !['reset','idle'].includes(fault.state))throw Error('Restore active fault session before testing.');
const rules=JSON.parse(await fs.readFile('server/data/windows-networking-rules.json','utf8'));
const common=await fs.readFile('server/runtime/windows/fundamentals-common.ps1','utf8')+'\n'+await fs.readFile('server/runtime/windows/networking-common.ps1','utf8');
const labs=listLabs().filter(l=>l.course_id==='windows-networking-fundamentals').sort((a,b)=>a.order-b.order);
assert.equal(labs.length,6);
const tag=Date.now().toString(36);
const cases=labs.flatMap(l=>l.steps.map(s=>({lab:l.id,tag:l.id.replace('win-nwf-','win-nwf-check-'+tag+'-'),id:s.id,script:s.hint,probe:rules[s.id].probe,file:rules[s.id].report_file})));
// Keep scripts ordinary readable PowerShell; avoid nested compressed/encoded eval.
const reportHelpers=common.slice(0,common.indexOf('function Get-FndStartup'));
function commandFor(items,index){
  return `$ErrorActionPreference='Stop'
$os=Get-CimInstance Win32_OperatingSystem
if($env:COMPUTERNAME -ne 'CLIENT01' -or $os.ProductType -ne 1 -or [int]$os.BuildNumber -lt 22000){throw 'Wrong VM'}
${reportHelpers}
$resultItems=@()
`+items.map(c=>`try {
  . { ${c.script.replaceAll(c.lab,c.tag)} } | Out-Null
  $v=& { ${c.probe} };if($v -isnot [bool] -or -not $v){throw 'Valid evidence refused'}
  $reportFile=Join-Path $labRoot '${c.file}';$original=[IO.File]::ReadAllBytes($reportFile)
  try {
    $r=Get-Content -LiteralPath $reportFile -Raw|ConvertFrom-Json;$r.Computer='OTHER'
    $r|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $reportFile -Encoding UTF8
    $rejected=$false;try{$v=& { ${c.probe} };$rejected=$v -is [bool] -and -not $v}catch{$rejected=$true}
    if(-not $rejected){throw 'Wrong computer accepted'}
  }finally{[IO.File]::WriteAllBytes($reportFile,$original)}
  $resultItems+=@{id='${c.id}';passed=$true;error=''}
}catch{$resultItems+=@{id='${c.id}';passed=$false;error=$_.Exception.Message}}
`).join('\n')+`
$resultItems|ConvertTo-Json -Depth 5|Set-Content -LiteralPath 'C:\\LabEx\\Labs\\win-nwf-validation\\group-${index}.json' -Encoding UTF8
$failed=@($resultItems|Where-Object {-not $_.passed})
@{passed=($failed.Count -eq 0);count=$resultItems.Count;failedCount=$failed.Count;firstError=([string]($failed|Select-Object -First 1 -ExpandProperty error))}|ConvertTo-Json -Compress
`;
}
const groups=[];
for(let i=0;i<cases.length;){
  let items=cases.slice(i,i+2);let command=commandFor(items,groups.length);
  if(command.length>10700){items=cases.slice(i,i+1);command=commandFor(items,groups.length);}
  assert.ok(command.length<10700,'Keep proof wrapper within Windows process argument limit');
  groups.push({items,command});i+=items.length;
}
await fs.mkdir('.artifacts',{recursive:true});
if(process.argv.includes('--write-batch')){await fs.writeFile('.artifacts/windows-networking-live-batch.ps1',groups.map(g=>g.command).join('\n'));process.exit(0);}
const report={passed:false,realAzure:true,deallocated:false};let started=false;
try {
  const initial=await getAzureVmStatus({target:'client'});report.initialState=initial.powerState;
  if(initial.powerStateCode!=='PowerState/running'){
    started=true;await azureClient().virtualMachines.start(config.resourceGroup,config.vmName).pollUntilDone();
  }
  const options={target:'client',labId:'win-nwf-validation',workspaceOnly:true};
  const canary=await executeWindowsRemote("Write-Output 'NETWORK_TRANSPORT_OK'; exit 7",options);
  assert.equal(canary.exitCode,7,'Remote transport must preserve explicit nonzero exit');assert.ok(canary.stdout.includes('NETWORK_TRANSPORT_OK'));
  report.checks=[];
  for(const [index,g] of groups.entries()){
    const result=await executeWindowsRemote(g.command,options);
    if(result.exitCode!==0 || result.timedOut || !result.stdout.trim())throw Error('Remote validation failed: '+JSON.stringify(result));
    const check=JSON.parse(result.stdout.trim());report.checks.push(check);
    console.log(JSON.stringify({group:index+1,of:groups.length,...check}));
    assert.equal(check.count,g.items.length);assert.equal(check.passed,true,JSON.stringify(check));
  }
  assert.equal(report.checks.reduce((n,c)=>n+c.count,0),12);report.passed=true;
}catch(error){report.error=error.message;process.exitCode=1;}
finally{
  if(started){try{await azureClient().virtualMachines.deallocate(config.resourceGroup,config.vmName).pollUntilDone();report.deallocated=true;}catch{process.exitCode=1;}}
  else report.preservedRunningVM=true;
  await fs.writeFile('.artifacts/windows-networking-live.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
