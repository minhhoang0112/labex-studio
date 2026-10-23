import {enterpriseCommand,enterpriseRequirement} from './enterpriseCurriculum.js';

const quote=value=>"'"+String(value||'').replaceAll("'","''")+"'";
export const clientDomainSidGuard=`$joined=$null;$entry=$null
try{if(-not $expectedDomainSid){throw 'Missing trusted domain SID'};$joined=[DirectoryServices.ActiveDirectory.Domain]::GetComputerDomain();$entry=$joined.GetDirectoryEntry();$actualSid=[Security.Principal.SecurityIdentifier]::new([byte[]]$entry.Properties['objectSid'][0],0).Value;if($actualSid -ne $expectedDomainSid){throw 'Wrong AD forest/domain SID'}}finally{if($entry){$entry.Dispose()};if($joined){$joined.Dispose()}}`;
const clientEvidence=`function Test-EnterpriseLogonEvidence {
  $failure=$null;$success=$null
  $events=Get-WinEvent -FilterHashtable @{LogName='Security';Id=@(4624,4625);StartTime=([DateTimeOffset]::Parse($expectedSince).LocalDateTime)} -MaxEvents 500 -ErrorAction SilentlyContinue
  foreach($e in $events){$x=[xml]$e.ToXml();$d=@{};foreach($i in $x.Event.EventData.Data){$d[$i.Name]=$i.'#text'}
    if($e.Id -eq 4624 -and $d.TargetUserSid -eq $expectedSid -and $d.LogonType -in @('2','10')){if(-not $success -or $e.TimeCreated -gt $success){$success=$e.TimeCreated}}
    if($e.Id -eq 4625 -and $d.TargetUserName -eq $expectedSam -and $d.TargetDomainName -in @($expectedDomain,$expectedNetbios) -and ($d.Status -eq '0xc0000072' -or $d.SubStatus -eq '0xc0000072')){if(-not $failure -or $e.TimeCreated -gt $failure){$failure=$e.TimeCreated}}
  }
  return $null -ne $failure -and $null -ne $success -and $success -ge $failure
}`;

export async function verifyEnterprise(labId,rule,{execute,faults,checkRequirement=enterpriseRequirement}){
  const missing=checkRequirement(rule);
  if(missing)return {supported:false,passed:false,reason:missing};
  const guard=(rule.modules||[]).map(name=>`if(-not(Get-Module -ListAvailable ${name})){exit 42};`).join('');
  const check=`${guard}\ntry{$v=& { ${rule.probe} };if($v -is [bool] -and $v){exit 0}else{exit 1}}catch{Write-Error $_ -ErrorAction Continue;exit 1}`;
  const r=await execute(enterpriseCommand(labId,check),{labId,target:'server'});
  if(r.exitCode===42)return {supported:false,passed:false,reason:'Windows Server thiếu module/role cần cho bài: '+rule.modules.join(', ')};
  if(r.exitCode!==0 || r.timedOut)return {supported:true,passed:false,timedOut:!!r.timedOut,method:'windows-enterprise',reason:'Trạng thái chưa đúng trên Server. Kiểm tra chuẩn bị/manifest, quyền SYSTEM, GUID và yêu cầu từng task; không sửa report để ép đạt.'};
  if(rule.client_probe){
    faults.assertAccess(labId,'client');
    const factsScript=`$m=Get-SrvContext;$d=Get-ADDomain;$sid='';$sam='lx'+$m.Run.Substring(0,8)+'learner';$u=Get-ADUser -Filter "SamAccountName -eq '$sam'";if($u){$sid=$u.SID.Value};@{domain=$d.DNSRoot;domainSid=$d.DomainSID.Value;zone=$m.Zone;gpo=$m.GpoA;run=$m.Run;sid=$sid;sam=$sam;since=$m.UpdatedUtc;netbios=$d.NetBIOSName}|ConvertTo-Json -Compress`;
    const f=await execute(enterpriseCommand(labId,factsScript),{labId,target:'server'});
    if(f.exitCode!==0||f.timedOut||f.outputTruncated)return {supported:false,passed:false,reason:'Không lấy được ngữ cảnh Server tin cậy để kiểm CLIENT01.'};
    let data;try{data=JSON.parse(f.stdout);}catch{return {supported:false,passed:false,reason:'Server không trả ngữ cảnh hợp lệ; không chấm thay bằng dữ liệu trình duyệt.'};}
    if(!/^S-1-5-21-\d+-\d+-\d+$/.test(data.domainSid||''))return {supported:false,passed:false,reason:'Server thiếu domain SID tin cậy; không chấm theo tên domain đơn thuần.'};
    const declarations=Object.entries({expectedDomain:data.domain,expectedDomainSid:data.domainSid,expectedZone:data.zone,expectedGpo:data.gpo,expectedRun:data.run,expectedSid:data.sid,expectedSam:data.sam,expectedSince:data.since,expectedNetbios:data.netbios}).map(([k,v])=>'$'+k+'='+quote(v)).join(';');
    const command=`$ErrorActionPreference='Stop';if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1){exit 43};${declarations}\n${clientEvidence}\ntry{${clientDomainSidGuard}\n$v=& { ${rule.client_probe} };if($v -is [bool] -and $v){exit 0}else{exit 1}}catch{exit 1}`;
    const c=await execute(command,{labId:'win-enterprise-client-probe',target:'client',workspaceOnly:true});
    if(c.exitCode!==0||c.timedOut)return {supported:true,passed:false,timedOut:!!c.timedOut,method:'windows-enterprise',reason:'Server đúng nhưng CLIENT01 chưa có bằng chứng domain/GPO/DNS/logon yêu cầu. Không dùng trạng thái Server thay cho client.'};
  }
  return {supported:true,passed:true,method:'windows-enterprise',target:r.target};
}
