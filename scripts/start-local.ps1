param([switch]$Restart)
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$entry = Join-Path $workspace 'server\server.js'
$artifacts = Join-Path $workspace '.artifacts'
New-Item -ItemType Directory -Force -Path $artifacts | Out-Null
& (Join-Path $PSScriptRoot 'ensure-runtime.ps1')
$listeners = @(Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) {
    $ownerIds = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
    foreach ($ownerId in $ownerIds) {
        $owner = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $ownerId)
        if (-not $Restart) { Write-Output ('Already listening on port 5000, PID ' + $ownerId); exit 0 }
        $cmdLine = if ($owner.CommandLine) { $owner.CommandLine } else { '' }
        if ($owner.Name -ne 'node.exe' -or (-not $cmdLine.Contains('server.js') -and -not $cmdLine.Contains('server-daemon.mjs') -and -not $cmdLine.Contains($entry))) {
            throw ('Port 5000 belongs to another process; inspect PID ' + $ownerId + ' before restarting.')
        }
        Stop-Process -Id $ownerId -Force
    }
}
$node = (Get-Command node.exe).Source
$bootstrap = Join-Path $workspace 'scripts\server-daemon.mjs'
$created = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = ('"' + $node + '" "' + $bootstrap + '"'); CurrentDirectory = $workspace }
if ($created.ReturnValue -ne 0) { throw ('Windows could not start the server: ' + $created.ReturnValue) }
$deadline = (Get-Date).AddSeconds(10)
do {
    Start-Sleep -Milliseconds 200
    $listeners = @(Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue)
} while ($listeners.Count -eq 0 -and (Get-Date) -lt $deadline)
if ($listeners.Count -eq 0) { throw 'Server did not start; inspect .artifacts/server.stderr.log' }
Write-Output ('Local server PID ' + ($listeners[0].OwningProcess) + ' at http://127.0.0.1:5000/learn')
