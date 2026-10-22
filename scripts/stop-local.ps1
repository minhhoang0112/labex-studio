$ErrorActionPreference = 'SilentlyContinue'
$listeners = @(Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue)
if ($listeners.Count -eq 0) {
    Write-Host "[OK] LabEx server is not running (Port 5000 is free)." -ForegroundColor Green
    exit 0
}

$ownerIds = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
foreach ($ownerId in $ownerIds) {
    $owner = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $ownerId) -ErrorAction SilentlyContinue
    if ($owner) {
        Stop-Process -Id $ownerId -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Stopped LabEx server (PID $ownerId). RAM has been freed!" -ForegroundColor Green
    }
}

