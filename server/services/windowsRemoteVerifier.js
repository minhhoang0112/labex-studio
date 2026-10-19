import { executeWindowsRemote } from './windowsRemoteExecutor.js';
import { getCommandHistory } from '../pty/linuxEnvironment.js';
import { cloudConfig } from './cloudConfig.js';

// Trusted server-side criteria. Never use browser-supplied PowerShell as a grader.
const rules = {
  'win-ps-01-sec-1': { commands: [['Get-Command *-Service'], ['$PSVersionTable.PSVersion', '$PSVersionTable']], probe: '$PSVersionTable.PSVersion.Major -ge 5' },
  'win-ps-01-sec-2': { commands: [['Get-Process | Get-Member']], probe: '@(Get-Process | Get-Member).Count -gt 0' },
  'win-ps-02-sec-1': { commands: [["Get-Service | Where-Object Status -eq 'Running' | Select-Object -First 10 Name, DisplayName, Status"]], probe: '@(Get-Service | Where-Object Status -eq Running).Count -gt 0' },
  'win-ps-02-sec-2': { commands: [['Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 ProcessName, Id, CPU, WorkingSet64']], probe: '@(Get-Process).Count -gt 0' },
  'win-fs-03-sec-1': { probe: '(Test-Path ./FinanceDocs -PathType Container) -and $null -ne (Get-Acl ./FinanceDocs).Owner' },
  'win-sc-05-sec-1': { probe: "(Test-Path ./health_report.txt -PathType Leaf) -and (Get-Item ./health_report.txt).Length -gt 0 -and ([IO.File]::ReadAllText((Join-Path $PWD health_report.txt)) -match 'DeviceID' -and [IO.File]::ReadAllText((Join-Path $PWD health_report.txt)) -match 'FreeSpace' -and [IO.File]::ReadAllText((Join-Path $PWD health_report.txt)) -match 'Size')" },
  'win-el-04-sec-1': { commands: [["Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 5 | Format-Table TimeCreated, Id, ProviderName, Message"]], probe: '$null -ne (Get-WinEvent -ListLog System)' },
  'win-ad-01-sec-1': { guiProbe: "@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'mmc.exe' -and $_.CommandLine -match 'dsa\\.msc' }).Count -gt 0", commands: [['Get-Command *ADUser*'], ['Get-Command *ADOrganizationalUnit*']], probe: '$null -ne (Get-Module -ListAvailable ActiveDirectory)' },
  'win-ad-01-sec-2': { probe: "$u=Get-ADUser -Identity david.miller -Properties GivenName,Surname,pwdLastSet; $u.GivenName -eq 'David' -and $u.Surname -eq 'Miller' -and $u.DistinguishedName -match ',OU=IT_Department,' -and [int64]$u.pwdLastSet -eq 0" },
  'win-ad-01-sec-3': { probe: "$g=Get-ADGroup -Identity Sec_IT_Admins; $g.GroupCategory -eq 'Security' -and $g.GroupScope -eq 'Global' -and $g.DistinguishedName -match ',OU=IT_Department,' -and @(Get-ADGroupMember $g | Where-Object SamAccountName -eq david.miller).Count -eq 1" },
  'win-net-03-sec-1': { commands: [['Resolve-DnsName localhost']], probe: '@(Resolve-DnsName localhost -ErrorAction Stop).Count -gt 0' },
  'win-fs-04-sec-1': { commands: [['Get-SmbShare']], probe: '@(Get-SmbShare).Count -gt 0' },
  'win-gpo-02-sec-1': { commands: [['gpresult /r']], probe: '(Get-CimInstance Win32_OperatingSystem).ProductType -ge 2' },
  'win-iis-05-sec-1': { probe: "Import-Module WebAdministration; $s=Get-Website -Name PortalCorp; $s.State -eq 'Started' -and $s.PhysicalPath -eq 'C:\\inetpub\\wwwroot' -and @($s.Bindings.Collection | Where-Object { $_.protocol -eq 'http' -and $_.bindingInformation -match ':8080:' }).Count -gt 0" },
  'win-tr-01-sec-1': { commands: [["Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'} -MaxEvents 5 -ErrorAction SilentlyContinue | Format-List TimeCreated, Id, Message"]], probe: '$null -ne (Get-WinEvent -ListLog System)' },
  'win-tr-02-sec-1': { commands: [['Get-Service Spooler | Select-Object Name, Status, StartType, RequiredServices']], probe: '$null -ne (Get-Service Spooler)' },
  'win-tr-03-sec-1': { commands: [['Test-NetConnection -ComputerName localhost -Port 80 -WarningAction SilentlyContinue']], probe: '$null -ne (Get-Command Test-NetConnection)' },
  'win-tr-04-sec-1': { commands: [["Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' | Select-Object ProductName, CurrentBuild, ReleaseId"]], probe: "$null -ne (Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').ProductName" },
  'win-tr-05-sec-1': { commands: [["Get-Counter '\\Processor(_Total)\\% Processor Time'"]], probe: '@(Get-Counter "\\Processor(_Total)\\% Processor Time").CounterSamples.Count -gt 0' },
};

export function windowsStepReadiness(step) {
  const configured = Boolean(cloudConfig().subscriptionId);
  const known = Boolean(rules[step.id]);
  return { ready: configured && known, missing_capabilities: configured ? [] : ['windows-remote'],
    reasons: [...(!configured ? ['Chưa cấu hình đăng nhập Azure để kiểm tra Windows VM.'] : []),
      ...(!known ? ['Bước này chưa có bộ kiểm tra Windows từ xa được review.'] : [])] };
}
const normalize = command => command.trim().replace(/\s+/g, ' ').toLowerCase();

export async function verifyWindowsRemote(labId, step, { execute = executeWindowsRemote, readHistory = getCommandHistory } = {}) {
  const rule = rules[step.id];
  if (!rule) return { supported: false, passed: false, reason: 'Chưa có bộ kiểm tra Windows từ xa cho bước này.' };
  let historyOK = !rule.commands;
  if (rule.commands) {
    const target = cloudConfig().vmName;
    const history = await readHistory(labId);
    historyOK = rule.commands.every(group => group.some(command => history.some(entry => entry.status === 0 &&
      entry.target === target && entry.computerName && normalize(entry.command) === normalize(command))));
    if (!historyOK && !rule.guiProbe) return { supported: true, passed: false, method: 'windows-remote', reason: 'Chưa có lệnh phù hợp chạy thành công trên VM của bài này. Hãy chạy lệnh hướng dẫn ở PowerShell web.' };
  }
  const expression = rule.guiProbe && !historyOK ? rule.guiProbe : rule.probe;
  const moduleName = step.id.startsWith('win-ad-') ? 'ActiveDirectory'
    : step.id === 'win-iis-05-sec-1' ? 'WebAdministration' : null;
  const prerequisite = moduleName ? `if (-not (Get-Module -ListAvailable ${moduleName})) { exit 42 }; ` : '';
  const command = `$ErrorActionPreference='Stop'; ${prerequisite}try { $value = & { ${expression} }; if ($value -is [bool] -and $value -eq $true) { exit 0 } else { exit 1 } } catch { Write-Error $_ -ErrorAction Continue; exit 1 }`;
  const result = await execute(command, { labId });
  if (moduleName && result.exitCode === 42) return { supported: false, passed: false,
    reason: `VM chưa có module ${moduleName}. Cần chuẩn bị role/môi trường Windows trước khi thực hiện bài này.` };
  return { supported: true, passed: result.exitCode === 0 && !result.timedOut,
    timedOut: Boolean(result.timedOut), method: 'windows-remote', target: result.target };
}
