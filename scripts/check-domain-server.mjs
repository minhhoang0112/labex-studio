import 'dotenv/config';
import fs from 'node:fs/promises';
import {azureClient} from '../server/services/azureComputeClient.js';
import {getVmTargetConfig} from '../server/services/cloudConfig.js';
import {getAzureVmStatus} from '../server/services/azureVmService.js';
import {executeWindowsRemote} from '../server/services/windowsRemoteExecutor.js';
const c=getVmTargetConfig('server');let started=false;const report={date:new Date().toISOString()};
try{
  const s=await getAzureVmStatus({target:'server'});report.initial=s.powerState;
  if(s.powerStateCode!=='PowerState/running'){started=true;await azureClient().virtualMachines.start(c.resourceGroup,c.vmName).pollUntilDone();}
  const r=await executeWindowsRemote(`$o=Get-CimInstance Win32_OperatingSystem;$domain='';$errorText='';try{$domain=(Get-ADDomain).DNSRoot}catch{$errorText=$_.Exception.Message.Substring(0,[Math]::Min(100,$_.Exception.Message.Length))};@{host=$env:COMPUTERNAME;type=$o.ProductType;domain=$domain;ad=[bool](Get-Module -ListAvailable ActiveDirectory);gpo=[bool](Get-Module -ListAvailable GroupPolicy);dns=[bool](Get-Module -ListAvailable DnsServer);dhcp=[bool](Get-Module -ListAvailable DhcpServer);error=$errorText}|ConvertTo-Json -Compress`,{target:'server',labId:'win-domain-audit',workspaceOnly:true});
  if(r.exitCode!==0)throw Error(r.stderr);report.guest=JSON.parse(r.stdout);
}catch(e){report.error=e.message;process.exitCode=1;}
finally{if(started){await azureClient().virtualMachines.deallocate(c.resourceGroup,c.vmName).pollUntilDone();report.deallocated=true;}await fs.mkdir('.artifacts',{recursive:true});await fs.writeFile('.artifacts/domain-server-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
