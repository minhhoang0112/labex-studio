import {Router} from 'express';
import fs from 'node:fs/promises';
import {loadLab,isValidId} from '../data/catalog.js';
import {enterpriseCommand,enterpriseRules} from '../services/enterpriseCurriculum.js';
import {executeWindowsRemote} from '../services/windowsRemoteExecutor.js';
import {windowsFaults} from '../services/windowsFaults.js';
import {cloudError,publicCloudError,getVmTargetConfig} from '../services/cloudConfig.js';
import {clientDomainSidGuard} from '../services/windowsEnterpriseVerifier.js';
const proofPath=new URL('../runtime/state/enterprise-environment.json',import.meta.url);
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
export function createWindowsEnterpriseRouter({execute=executeWindowsRemote,faults=windowsFaults,findLab=loadLab,saveProof=async p=>{await fs.mkdir(new URL('../runtime/state/',import.meta.url),{recursive:true});await fs.writeFile(proofPath,JSON.stringify(p,null,2));}}={}){
  const router=Router();
  const validate=req=>{
    const id=req.body?.labId;
    if(!isValidId(id)||!findLab(id)||!Object.values(enterpriseRules).some(r=>r.lab_id===id))throw cloudError('Chọn bài AD/GPO hoặc DNS/DHCP hợp lệ.',400,'CLOUD_INVALID_LAB');
    if(req.body.target!==undefined&&req.body.target!=='server')throw cloudError('Thao tác này chỉ chạy trên Server đã cấu hình.',400,'CLOUD_INVALID_TARGET');
    faults.assertAccess(id,'server');return id;
  };
  const endpoint=fn=>async(req,res)=>{res.set('Cache-Control','no-store');try{await fn(req,res);}catch(e){const error=publicCloudError(e);res.status(error.status||503).json({error:error.message,code:error.code});}};
  for(const operation of ['prepare','reset'])router.post('/windows-enterprise/'+operation,endpoint(async(req,res)=>{
    const id=validate(req);
    if(req.body.confirm!==true)throw cloudError('Xác nhận thay đổi riêng namespace bài trước khi thực hiện.',400,'CLOUD_CONFIRM_REQUIRED');
    const code=operation==='prepare'?"$m=Initialize-SrvContext;@{state='prepared';run=$m.Run;rootDN=$m.RootDN;zone=$m.Zone}|ConvertTo-Json -Compress":'Reset-SrvContext';
    const r=await execute(enterpriseCommand(id,code),{labId:id,target:'server'});
    if(r.exitCode!==0||r.timedOut)throw cloudError('Không '+(operation==='prepare'?'chuẩn bị':'hoàn nguyên')+' được namespace bài. Kiểm tra role/quyền/manifest; reset không xóa đối tượng chưa đăng ký.',409,'CLOUD_ENTERPRISE_ACTION_FAILED');
    if(operation==='reset'&&r.stdout.trim()!=='RESET_OK')throw cloudError('Thiếu xác nhận hoàn nguyên; không coi là reset thành công.',502,'CLOUD_REMOTE_PROTOCOL');
    if(operation==='prepare'){
      let prepared;try{prepared=JSON.parse(r.stdout);}catch{}
      if(prepared?.state!=='prepared'||!/^[a-f0-9]{32}$/.test(prepared?.run||''))throw cloudError('Thiếu xác nhận namespace đã chuẩn bị.',502,'CLOUD_REMOTE_PROTOCOL');
    }
    res.json({operation,state:operation==='prepare'?'prepared':'reset',scope:'server-namespace',clientRecoveryVerified:false,target:'server',labId:id,result:r.stdout});
  }));
  router.post('/windows-enterprise/inspect',endpoint(async(req,res)=>{
    const id=validate(req);faults.assertAccess(id,'client');
    // Read-only. Never starts VMs, changes peering/DNS, joins domains or handles passwords.
    const server=await execute("$ErrorActionPreference='Stop';$o=Get-CimInstance Win32_OperatingSystem;if($o.ProductType -lt 2){exit 43};$d=Get-ADDomain;$dc=Get-ADDomainController -Discover;@{domain=$d.DNSRoot;domainSid=$d.DomainSID.Value;dc=$dc.HostName;host=$env:COMPUTERNAME}|ConvertTo-Json -Compress",{labId:id,target:'server'});
    if(server.exitCode!==0||server.timedOut||server.outputTruncated)throw cloudError('Server chưa trả domain/DC hợp lệ. Không xác nhận môi trường.',409,'CLOUD_ENTERPRISE_PREFLIGHT');
    let facts;try{facts=JSON.parse(server.stdout);}catch{throw cloudError('Domain/DC response không hợp lệ.',502,'CLOUD_REMOTE_PROTOCOL');}
    if(!facts.domain||!facts.dc||!/^S-1-5-21-\d+-\d+-\d+$/.test(facts.domainSid||''))throw cloudError('Server chưa có domain/DC/SID hợp lệ để kiểm.',409,'CLOUD_ENTERPRISE_PREFLIGHT');
    const command=`$ErrorActionPreference='Stop';$d=${quote(facts.domain)};$expectedDomainSid=${quote(facts.domainSid||'')};${clientDomainSidGuard}\n$c=Get-CimInstance Win32_ComputerSystem;$o=Get-CimInstance Win32_OperatingSystem;$srv=@(Resolve-DnsName ('_ldap._tcp.dc._msdcs.'+$d) -Type SRV -DnsOnly -NoHostsFile);if($env:COMPUTERNAME -ne 'CLIENT01' -or $o.ProductType -ne 1 -or -not $c.PartOfDomain -or $c.Domain -ne $d -or $srv.Count -eq 0 -or -not(Test-ComputerSecureChannel)){exit 1};Write-Output 'DOMAIN_CLIENT_VERIFIED'`;
    const client=await execute(command,{labId:'win-enterprise-client-inspect',target:'client',workspaceOnly:true});
    const ready=client.exitCode===0&&!client.timedOut&&client.stdout.includes('DOMAIN_CLIENT_VERIFIED');
    const p={schema:1,verifiedAt:new Date().toISOString(),registry:{server:getVmTargetConfig('server').vmName,client:getVmTargetConfig('client').vmName},capabilities:{'domain-client':ready},domain:facts.domain,dc:facts.dc};
    await saveProof(p);res.status(ready?200:409).json({state:ready?'verified':'blocked',capabilities:p.capabilities,message:ready?'Đã xác minh domain, SRV và secure channel CLIENT01.':'CLIENT01 chưa đủ DNS/domain/secure channel; không thay đổi cấu hình tự động.'});
  }));
  return router;
}
