import crypto from 'node:crypto';
import { azureClient } from './azureComputeClient.js';
import { cloudConfig, cloudError, publicCloudError } from './cloudConfig.js';

export function createWindowsRemoteExecutor({ client = azureClient, config = cloudConfig } = {}) {
  let busy = false;
  return async function execute(command, { labId } = {}) {
    if (typeof command !== 'string' || !command.trim() || command.length > 16000) {
      throw cloudError('Lệnh PowerShell trống hoặc quá dài.', 400, 'CLOUD_INVALID_COMMAND');
    }
    if (busy) throw cloudError('VM đang chạy một lệnh khác. Chờ lệnh hoàn tất rồi thử lại.', 409, 'CLOUD_BUSY');
    busy = true;
    try {
      if (labId && !/^win-[a-z0-9-]+$/.test(labId)) throw cloudError('Mã bài Windows không hợp lệ.', 400, 'CLOUD_INVALID_COMMAND');
      const { resourceGroup, vmName } = config();
      const marker = 'LABEX_RESULT_' + crypto.randomBytes(16).toString('hex') + ':';
      // The user's script is decoded by PowerShell ONLY ON THE AZURE VM.
      // A random result marker prevents a command's normal output forging success.
      const encoded = Buffer.from("$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue';\n" + command, 'utf16le').toString('base64');
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
  $data=@{exitCode=$exitCode; stdout=$out.Substring(0,[Math]::Min(600,$out.Length)); stderr=$err.Substring(0,[Math]::Min(250,$err.Length)); timedOut=(-not $done); computerName=$env:COMPUTERNAME; identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name; outputTruncated=($out.Length -gt 600 -or $err.Length -gt 250)}
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
      return { ...parsed, transport: 'azure-run-command', target: vmName };
    } catch (error) { throw publicCloudError(error); }
    finally { busy = false; }
  };
}
export const executeWindowsRemote = createWindowsRemoteExecutor();
