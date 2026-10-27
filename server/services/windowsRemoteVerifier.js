import { executeWindowsRemote } from './windowsRemoteExecutor.js';
import { getCommandHistory } from '../pty/linuxEnvironment.js';
import { getVmTargetConfig } from './cloudConfig.js';
import { loadLab } from '../data/catalog.js';
import { labVmTarget } from './vmTargets.js';
import { windowsFaults, faultScenarios } from './windowsFaults.js';
import fs from 'node:fs';
import {enterpriseRules,enterpriseRequirement} from './enterpriseCurriculum.js';
import {verifyEnterprise} from './windowsEnterpriseVerifier.js';

const supportRules = JSON.parse(fs.readFileSync(new URL('../data/windows-support-rules.json', import.meta.url), 'utf8'));
const starterRules = JSON.parse(fs.readFileSync(new URL('../data/windows-starter-rules.json', import.meta.url), 'utf8'));
const foundationsRules = JSON.parse(fs.readFileSync(new URL('../data/windows-foundations-rules.json', import.meta.url), 'utf8'));
const foundationsHelpers = fs.readFileSync(new URL('../runtime/windows/fundamentals-common.ps1', import.meta.url), 'utf8');
const networkingRules = JSON.parse(fs.readFileSync(new URL('../data/windows-networking-rules.json', import.meta.url), 'utf8'));
const networkingHelpers = fs.readFileSync(new URL('../runtime/windows/networking-common.ps1', import.meta.url), 'utf8');
const professionalRules = JSON.parse(fs.readFileSync(new URL('../data/windows-professional-rules.json', import.meta.url), 'utf8'));
const professionalHelpers = fs.readFileSync(new URL('../runtime/windows/professional-common.ps1', import.meta.url), 'utf8');

// Trusted server-side criteria. Never use browser-supplied PowerShell as a grader.
const rules = {
  ...supportRules,
  'win-it-onb-sec-1': { probe: "(Get-TimeZone).Id -eq 'SE Asia Standard Time'" },
  'win-it-onb-sec-2': { commands: [['hostname', '$env:COMPUTERNAME', 'Get-ComputerInfo | Select-Object CsName, OsName, WindowsVersion']], probe: "$env:COMPUTERNAME -eq 'CLIENT01' -and (Get-CimInstance Win32_OperatingSystem).ProductType -eq 1" },
  'win-it-pr-sec-1': { commands: [['Get-Service Spooler']], probe: "$null -ne (Get-Service Spooler)" },
  'win-it-net-sec-1': { commands: [['ipconfig /all', 'Get-NetIPAddress']], probe: '@(Get-NetIPAddress -AddressFamily IPv4).Count -gt 0' },
  'win-it-dsk-sec-1': { commands: [['Get-PSDrive -PSProvider FileSystem', 'Get-Volume']], probe: '(Get-PSDrive C).Free -ge 0' },
  'win-ps-01-sec-1': { commands: [['Get-Command *-Service'], ['$PSVersionTable.PSVersion', '$PSVersionTable']], probe: '$PSVersionTable.PSVersion.Major -ge 5' },
  'win-ps-01-sec-2': { commands: [['Get-Process | Get-Member']], probe: '@(Get-Process | Get-Member).Count -gt 0' },
  'win-ps-02-sec-1': { commands: [["Get-Service | Where-Object Status -eq 'Running' | Select-Object -First 10 Name, DisplayName, Status"]], probe: '@(Get-Service | Where-Object Status -eq Running).Count -gt 0' },
  'win-ps-02-sec-2': { commands: [['Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 ProcessName, Id, CPU, WorkingSet64']], probe: '@(Get-Process).Count -gt 0' },
  'win-fs-03-sec-1': { probe: '(Test-Path ./FinanceDocs -PathType Container) -and $null -ne (Get-Acl ./FinanceDocs).Owner' },
  'win-sc-05-sec-1': { probe: "(Test-Path ./health_report.txt -PathType Leaf) -and (Get-Item ./health_report.txt).Length -gt 0 -and ([IO.File]::ReadAllText((Join-Path $PWD health_report.txt)) -match 'DeviceID' -and [IO.File]::ReadAllText((Join-Path $PWD health_report.txt)) -match 'FreeSpace' -and [IO.File]::ReadAllText((Join-Path $PWD health_report.txt)) -match 'Size')" },
  'win-el-04-sec-1': { commands: [["Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 5 | Format-Table TimeCreated, Id, ProviderName, Message"]], probe: '$null -ne (Get-WinEvent -ListLog System)' },
  'win-ad-01-sec-1': { probe: "@(Get-ADOrganizationalUnit -Filter 'Name -eq \"IT_Department\"').Count -gt 0" },
  'win-ad-01-sec-2': { probe: "$u=Get-ADUser -Identity david.miller -Properties GivenName,Surname,pwdLastSet; $u.GivenName -eq 'David' -and $u.Surname -eq 'Miller' -and $u.DistinguishedName -match ',OU=IT_Department,' -and [int64]$u.pwdLastSet -eq 0" },
  'win-ad-01-sec-3': { probe: "$g=Get-ADGroup -Identity Sec_IT_Admins; $g.GroupCategory -eq 'Security' -and $g.GroupScope -eq 'Global' -and $g.DistinguishedName -match ',OU=IT_Department,' -and @(Get-ADGroupMember $g | Where-Object SamAccountName -eq david.miller).Count -eq 1" },
  'win-net-03-sec-1': { commands: [['Resolve-DnsName localhost']], probe: '@(Resolve-DnsName localhost -ErrorAction Stop).Count -gt 0' },
  'win-fs-04-sec-1': { commands: [['Get-SmbShare']], probe: '@(Get-SmbShare).Count -gt 0' },
  'win-gpo-02-sec-1': { commands: [['gpresult /r','gpresult /scope computer /r']], probe: '(Get-CimInstance Win32_OperatingSystem).ProductType -ge 2' },
  'win-iis-05-sec-1': { probe: "Import-Module WebAdministration; $s=Get-Website -Name PortalCorp; if($s.State -ne 'Started' -or $s.PhysicalPath -ne 'C:\\LabEx\\Labs\\win-server-iis-web\\site' -or @($s.Bindings.Collection | Where-Object { $_.protocol -eq 'http' -and $_.bindingInformation -eq '*:8080:' }).Count -lt 1){return $false}; $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8080' -TimeoutSec 10; $r.StatusCode -eq 200 -and $r.Content.Contains('LabEx PortalCorp')" },
  'win-tr-01-sec-1': { commands: [["Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'} -MaxEvents 5 -ErrorAction SilentlyContinue | Format-List TimeCreated, Id, Message"]], probe: '$null -ne (Get-WinEvent -ListLog System)' },
  'win-tr-02-sec-1': { commands: [['Get-Service Spooler | Select-Object Name, Status, StartType, RequiredServices']], probe: '$null -ne (Get-Service Spooler)' },
  'win-tr-03-sec-1': { commands: [['Test-NetConnection -ComputerName localhost -Port 80 -WarningAction SilentlyContinue']], probe: '$null -ne (Get-Command Test-NetConnection)' },
  'win-tr-04-sec-1': { commands: [["Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' | Select-Object ProductName, CurrentBuild, ReleaseId"]], probe: "$null -ne (Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').ProductName" },
  'win-tr-05-sec-1': { commands: [["Get-Counter '\\Processor(_Total)\\% Processor Time'"]], probe: '@(Get-Counter "\\Processor(_Total)\\% Processor Time").CounterSamples.Count -gt 0' },
  ...starterRules,
  ...foundationsRules,
  ...networkingRules,
  ...enterpriseRules,
  ...professionalRules,
};

export function windowsStepReadiness(step, lab = {}) {
  const target = labVmTarget(lab);
  const config = getVmTargetConfig(target);
  const configured = Boolean(config.subscriptionId && (target === 'server' || config.publicIp && config.password));
  const rule=rules[step.id];
  const known = Boolean(rule && (!rule.lab_id || rule.lab_id===lab.id) && (!rule.target_vm || rule.target_vm===target) || faultScenarios[lab.id] && step.id.endsWith('-sec-2'));
  const requirement=enterpriseRules[step.id]&&known?enterpriseRequirement(rule):null;
  return { ready: configured && known && !requirement, missing_capabilities: [...(configured ? [] : ['windows-remote']),...(requirement?[rule.runtime]:[])],
    reasons: [...(!configured ? ['Chưa cấu hình đăng nhập Azure để kiểm tra Windows VM.'] : []),
      ...(!known ? ['Bước này chưa có bộ kiểm tra Windows từ xa được review.'] : []),...(requirement?[requirement]:[])] };
}
const normalize = command => command.trim().replace(/\s+/g, ' ').toLowerCase();

export async function verifyWindowsRemote(labId, step, { execute = executeWindowsRemote, readHistory = getCommandHistory, faults = windowsFaults } = {}) {
  const vmTarget = labVmTarget(loadLab(labId));
  faults.assertAccess(labId, vmTarget);
  if (faultScenarios[labId] && step.id.endsWith('-sec-2')) return faults.verify(labId);
  const rule = rules[step.id];
  if (!rule) return { supported: false, passed: false, reason: 'Chưa có bộ kiểm tra Windows từ xa cho bước này.' };
  if (rule.lab_id && rule.lab_id !== labId) return { supported: false, passed: false, reason: 'Bộ kiểm tra không thuộc bài hiện tại.' };
  if (rule.target_vm && rule.target_vm!==vmTarget) return {supported:false,passed:false,reason:'Bộ kiểm tra không thuộc VM của bài học.'};
  if(enterpriseRules[step.id])return verifyEnterprise(labId,rule,{execute,faults});
  if(professionalRules[step.id]){
    const guard=(rule.modules || []).map(name=>`if(-not(Get-Module -ListAvailable ${name})){exit 42}; Import-Module ${name};`).join('\n');
    const osGuard=vmTarget==='client'
      ? "if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1){exit 43}"
      : 'if((Get-CimInstance Win32_OperatingSystem).ProductType -lt 2){exit 43}';
    const command=`$ErrorActionPreference='Stop'; $labRoot='${rule.root}';\n${guard}\n${osGuard}\n${professionalHelpers}\ntry{Assert-ProWorkspace;$value=& { ${rule.probe} };if($value -is [bool] -and $value){exit 0}else{exit 1}}catch{Write-Error $_ -ErrorAction Continue;exit 1}`;
    const result=await execute(command,{labId,target:vmTarget});
    if(result.timedOut)return {supported:true,passed:false,timedOut:true,method:'windows-professional',reason:'Phép kiểm tra chưa hoàn tất; không coi timeout là đạt.'};
    if(result.exitCode===42)return {supported:false,passed:false,reason:'VM thiếu role/module: '+rule.modules.join(', ')+'. Cần chuẩn bị môi trường trước, không tự cài bằng nút chấm.'};
    if(result.exitCode===43)return {supported:false,passed:false,reason:'Sai loại máy: bài cần đúng target Windows Client hoặc Server đã chỉ định.'};
    return {supported:true,passed:result.exitCode===0,method:'windows-professional',target:result.target,
      ...(result.exitCode===0?{}:{reason:'Dữ liệu hoặc chức năng thực chưa khớp tiêu chí. Đối chiếu từng file/phiên bản, đường dẫn và kết quả HTTP; không chỉ tạo report.'})};
  }
  let historyOK = !rule.commands;
  if (rule.commands) {
    const target = getVmTargetConfig(vmTarget).vmName;
    const history = await readHistory(labId);
    historyOK = rule.commands.every(group => group.some(command => history.some(entry => entry.status === 0 &&
      entry.target === target && entry.computerName && normalize(entry.command) === normalize(command))));
    if (!historyOK && !rule.guiProbe) return { supported: true, passed: false, method: 'windows-remote', reason: 'Chưa có lệnh phù hợp chạy thành công trên VM của bài này. Hãy chạy lệnh hướng dẫn ở PowerShell web.' };
  }
  const expression = rule.guiProbe && !historyOK ? rule.guiProbe : rule.probe;
  const moduleName = step.id.startsWith('win-ad-') ? 'ActiveDirectory'
    : step.id.startsWith('win-iis-05-sec-1') ? 'WebAdministration' : null;
  const prerequisite = moduleName ? `if (-not (Get-Module -ListAvailable ${moduleName})) { exit 42 }; ` : '';
  const context = rule.lab_id ? `$labId='${rule.lab_id}'; $labRoot='C:\\LabEx\\Labs\\${rule.lab_id}'; ` + (vmTarget==='client' ? "if ($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1) { exit 43 }; " : '') : '';
  const helpers=foundationsRules[step.id] || networkingRules[step.id]
    ? "if([int](Get-CimInstance Win32_OperatingSystem).BuildNumber -lt 22000){exit 43};\n"+foundationsHelpers+(networkingRules[step.id]?'\n'+networkingHelpers:'') : '';
  const command = `$ErrorActionPreference='Stop'; ${prerequisite}${context}${helpers}\ntry { $value = & { ${expression} }; if ($value -is [bool] -and $value -eq $true) { exit 0 } else { exit 1 } } catch { Write-Error $_ -ErrorAction Continue; exit 1 }`;
  const result = await execute(command, { labId, target: vmTarget });
  if (moduleName && result.exitCode === 42) return { supported: false, passed: false,
    reason: `VM chưa có module ${moduleName}. Cần chuẩn bị role/môi trường Windows trước khi thực hiện bài này.` };
  if(result.exitCode===43)return {supported:false,passed:false,reason:'Bài này cần đúng CLIENT01 chạy Windows Client (Windows 11 cho khóa nền tảng). Không chấm trên Windows Server hoặc máy khác.'};
  return { supported: true, passed: result.exitCode === 0 && !result.timedOut,
    timedOut: Boolean(result.timedOut), method: 'windows-remote', target: result.target };
}
