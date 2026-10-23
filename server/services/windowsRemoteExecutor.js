import crypto from 'node:crypto';
import { azureClient } from './azureComputeClient.js';
import { getVmTargetConfig, cloudError, publicCloudError } from './cloudConfig.js';
import { resolveVmTarget } from './vmTargets.js';
import { withVmLock } from './vmOperationLock.js';

export function createWindowsRemoteExecutor({ client = azureClient, config = getVmTargetConfig } = {}) {
  return async function execute(command, { labId, target, lockHeld = false, workspaceOnly = false } = {}) {
    if (typeof command !== 'string' || !command.trim() || command.length > 16000) {
      throw cloudError('Lệnh PowerShell trống hoặc quá dài.', 400, 'CLOUD_INVALID_COMMAND');
    }
    // Internal smoke tools can use a separate scratch directory. HTTP routes
    // never forward workspaceOnly/lockHeld from request bodies.
    target = resolveVmTarget({ labId: workspaceOnly ? undefined : labId, target });
    if (!lockHeld) return withVmLock(target, 'powershell', () => execute(command, { labId, target, workspaceOnly, lockHeld: true }));
    try {
      if (labId && !/^(win-|win11-)[a-z0-9-]+$/.test(labId)) throw cloudError('Mã bài Windows không hợp lệ.', 400, 'CLOUD_INVALID_COMMAND');
      const { resourceGroup, vmName } = config(target);
      const marker = 'LABEX_RESULT_' + crypto.randomBytes(16).toString('hex') + ':';
      const executionMarker = 'LABEX_EXECUTED_' + crypto.randomBytes(16).toString('hex');
      // The user's script is decoded by PowerShell ONLY ON THE AZURE VM.
      // A random result marker prevents a command's normal output forging success.
      const payload = "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue';\ntry { & {\n" + command + "\n} } finally { [Console]::Out.WriteLine('" + executionMarker + "') }";
      const encoded = Buffer.from(payload, 'utf16le').toString('base64');
      if(encoded.length>31000)throw cloudError('Lệnh vượt giới hạn dòng lệnh PowerShell của Windows. Hãy chia thành các khối nhỏ hơn.',400,'CLOUD_INVALID_COMMAND');
      const script = `$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$payload='${encoded}'
$workspace='C:\\LabEx\\Labs\\${labId || 'console'}'
New-Item -ItemType Directory -Path $workspace -Force | Out-Null
$proc=New-Object System.Diagnostics.Process
$proc.StartInfo.FileName="$env:SystemRoot\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
$proc.StartInfo.Arguments="-NoProfile -NonInteractive -EncodedCommand $payload"
$proc.StartInfo.WorkingDirectory=$workspace
$proc.StartInfo.UseShellExecute=$false
$proc.StartInfo.CreateNoWindow=$true
$proc.StartInfo.RedirectStandardOutput=$true
$proc.StartInfo.RedirectStandardError=$true
try {
  [void]$proc.Start()
  $outTask=$proc.StandardOutput.ReadToEndAsync()
  $errTask=$proc.StandardError.ReadToEndAsync()
  $done=$proc.WaitForExit(90000)
  if(-not $done){ & taskkill.exe /PID $proc.Id /T /F | Out-Null; $exitCode=124 } else { $proc.WaitForExit(); $exitCode=$proc.ExitCode }
  $out=[string]$outTask.GetAwaiter().GetResult()
  $err=[string]$errTask.GetAwaiter().GetResult()
  $executionConfirmed=$out.Contains('${executionMarker}')
  $out=$out.Replace('${executionMarker}', '').TrimEnd([char[]]"\r\n")
  $data=@{exitCode=$exitCode; executionConfirmed=$executionConfirmed; stdout=$out.Substring(0,[Math]::Min(600,$out.Length)); stderr=$err.Substring(0,[Math]::Min(250,$err.Length)); timedOut=(-not $done); computerName=$env:COMPUTERNAME; identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name; outputTruncated=($out.Length -gt 600 -or $err.Length -gt 250)}
  Write-Output ('${marker}'+($data | ConvertTo-Json -Compress))
} finally { $proc.Dispose() }`;
      const result = await client().virtualMachines.runCommand(resourceGroup, vmName,
        { commandId: 'RunPowerShellScript', script: [script] }, { abortSignal: AbortSignal.timeout(240000) }).pollUntilDone();
      const stdout = result.value?.find(item => item.code?.includes('StdOut'))?.message || '';
      const offset = stdout.lastIndexOf(marker);
      if (offset < 0) throw cloudError('VM không trả về kết quả PowerShell hợp lệ. Không chấm đạt nhiệm vụ.', 502, 'CLOUD_REMOTE_PROTOCOL');
      let parsed;
      try { parsed = JSON.parse(stdout.slice(offset + marker.length).trim()); }
      catch { throw cloudError('Output từ VM bị cắt hoặc không hợp lệ. Thử lệnh trả ít output hơn.', 502, 'CLOUD_REMOTE_PROTOCOL'); }
      if (!Number.isInteger(parsed.exitCode) || typeof parsed.stdout !== 'string' || typeof parsed.stderr !== 'string' || !parsed.computerName) {
        throw cloudError('VM trả về dữ liệu không hợp lệ.', 502, 'CLOUD_REMOTE_PROTOCOL');
      }
      if(parsed.exitCode===0 && !parsed.timedOut && parsed.executionConfirmed!==true){
        throw cloudError('PowerShell trả mã 0 nhưng không xác nhận đã thực thi lệnh. Không chấm đạt; kiểm tra VM Agent và thử lại.',502,'CLOUD_REMOTE_PROTOCOL');
      }
      return { ...parsed, transport: 'azure-run-command', target: vmName };
    } catch (error) { throw publicCloudError(error); }
  };
}
export const executeWindowsRemote = createWindowsRemoteExecutor();
