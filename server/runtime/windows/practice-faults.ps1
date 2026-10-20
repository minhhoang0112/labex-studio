param(
  [ValidateSet('Baseline','Inject','Faulted','Healthy','Reset')][string]$Operation,
  [ValidateSet('appconfig','restorefile','taskbackup','extension')][string]$Scenario
)
$ErrorActionPreference='Stop'
if ($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1) { throw 'Dedicated CLIENT01 only.' }
$root="C:\LabEx\PracticeFaults\$Scenario"
$record=Join-Path $root 'state.json'
$taskName='LabExSupportBackup'
function Assert-Tree {
  if ([IO.Path]::GetFullPath($root) -ne "C:\LabEx\PracticeFaults\$Scenario") { throw 'Invalid fixture path.' }
  foreach ($parent in @('C:\LabEx','C:\LabEx\PracticeFaults',$root)) {
    if ((Test-Path -LiteralPath $parent) -and ((Get-Item -LiteralPath $parent -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Reparse point refused.' }
  }
  if ((Test-Path -LiteralPath $root) -and @(Get-ChildItem -LiteralPath $root -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Fixture contains reparse point.' }
}
function Same-File($a,$b) {
  return ((Test-Path -LiteralPath $a -PathType Leaf) -and (Test-Path -LiteralPath $b -PathType Leaf) -and (Get-FileHash -LiteralPath $a).Hash -eq (Get-FileHash -LiteralPath $b).Hash)
}
function Healthy {
  switch ($Scenario) {
    appconfig {
      $result=Join-Path $root 'result.txt'
      if (Test-Path -LiteralPath $result) { Remove-Item -LiteralPath $result -Force }
      & (Join-Path $root 'run.ps1')
      return ((Test-Path -LiteralPath $result) -and [IO.File]::ReadAllText($result).Trim() -eq 'LABEX APP OK: CLIENT01')
    }
    restorefile { return (Same-File (Join-Path $root 'invoice.txt') (Join-Path $root 'Backup\invoice.txt')) }
    taskbackup {
      $task=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
      if (-not $task -or $task.State -eq 'Disabled') { return $false }
      Start-ScheduledTask -TaskName $taskName
      for ($i=0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        if ((Same-File (Join-Path $root 'Source\invoice.txt') (Join-Path $root 'Backup\invoice.txt')) -and (Get-ScheduledTaskInfo -TaskName $taskName).LastTaskResult -eq 0) { return $true }
      }
      return $false
    }
    extension {
      $file=Join-Path $root 'invoice.csv'
      return ((Test-Path -LiteralPath $file) -and -not (Test-Path -LiteralPath (Join-Path $root 'invoice.csv.txt')) -and
        [IO.File]::ReadAllText($file).Trim() -eq "Item,Quantity`r`nKeyboard,2`r`nMouse,3")
    }
  }
}
try {
  Assert-Tree
  if ($Operation -eq 'Baseline') {
    if (Test-Path -LiteralPath $root) { throw 'Fixture exists; reset the owning session first.' }
    if ($Scenario -eq 'taskbackup' -and (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)) { throw 'Task already exists.' }
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    @{ scenario=$Scenario; version=1 } | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
    switch ($Scenario) {
      appconfig {
        'CLIENT01' | Set-Content -LiteralPath (Join-Path $root 'data.txt') -Encoding UTF8
        @{ DataFile="$root\data.txt" } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $root 'settings.json') -Encoding UTF8
        @'
$ErrorActionPreference='Stop'
$config=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'settings.json') -Raw | ConvertFrom-Json
$allowed=Join-Path $PSScriptRoot 'data.txt'
if ($config.DataFile -ne $allowed) { throw 'Invalid DataFile; expected the local fixture data.txt.' }
$data=(Get-Content -LiteralPath $allowed -Raw).Trim()
('LABEX APP OK: '+$data) | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'result.txt') -Encoding UTF8
'@ | Set-Content -LiteralPath (Join-Path $root 'run.ps1') -Encoding UTF8
      }
      restorefile {
        New-Item -ItemType Directory -Path (Join-Path $root 'Backup') | Out-Null
        'Invoice HD-208; total=1500000 VND; owner=Finance' | Set-Content -LiteralPath (Join-Path $root 'invoice.txt') -Encoding UTF8
        Copy-Item -LiteralPath (Join-Path $root 'invoice.txt') -Destination (Join-Path $root 'Backup\invoice.txt')
      }
      taskbackup {
        New-Item -ItemType Directory -Path (Join-Path $root 'Source'),(Join-Path $root 'Backup') | Out-Null
        'Scheduled backup fixture HD-209' | Set-Content -LiteralPath (Join-Path $root 'Source\invoice.txt') -Encoding UTF8
        "Copy-Item -LiteralPath '$root\Source\invoice.txt' -Destination '$root\Backup\invoice.txt' -Force -ErrorAction Stop" | Set-Content -LiteralPath (Join-Path $root 'backup.ps1') -Encoding UTF8
        $action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File $root\backup.ps1"
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger (New-ScheduledTaskTrigger -Daily -At '09:00') -User SYSTEM -RunLevel Highest | Out-Null
      }
      extension { "Item,Quantity`r`nKeyboard,2`r`nMouse,3" | Set-Content -LiteralPath (Join-Path $root 'invoice.csv') -Encoding UTF8 }
    }
    exit 0
  }
  if (-not (Test-Path -LiteralPath $record)) { throw 'Missing fixture ownership record.' }
  if ((Get-Content -LiteralPath $record -Raw | ConvertFrom-Json).scenario -ne $Scenario) { throw 'Wrong fixture ownership.' }
  switch ($Operation) {
    Inject {
      switch ($Scenario) {
        appconfig {
          @{ DataFile="$root\missing.txt" } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $root 'settings.json') -Encoding UTF8
          Remove-Item -LiteralPath (Join-Path $root 'result.txt') -Force -ErrorAction SilentlyContinue
        }
        restorefile { Remove-Item -LiteralPath (Join-Path $root 'invoice.txt') }
        taskbackup {
          Disable-ScheduledTask -TaskName $taskName | Out-Null
          Remove-Item -LiteralPath (Join-Path $root 'Backup\invoice.txt') -Force
        }
        extension { Rename-Item -LiteralPath (Join-Path $root 'invoice.csv') -NewName 'invoice.csv.txt' }
      }
      exit 0
    }
    Faulted {
      $broken=$false
      switch ($Scenario) {
        appconfig { $broken=(Get-Content -LiteralPath (Join-Path $root 'settings.json') -Raw | ConvertFrom-Json).DataFile -eq "$root\missing.txt" }
        restorefile { $broken=-not (Test-Path -LiteralPath (Join-Path $root 'invoice.txt')) -and (Test-Path -LiteralPath (Join-Path $root 'Backup\invoice.txt')) }
        taskbackup { $broken=(Get-ScheduledTask -TaskName $taskName).State -eq 'Disabled' -and -not (Test-Path -LiteralPath (Join-Path $root 'Backup\invoice.txt')) }
        extension { $broken=(Test-Path -LiteralPath (Join-Path $root 'invoice.csv.txt')) -and -not (Test-Path -LiteralPath (Join-Path $root 'invoice.csv')) }
      }
      if ($broken) { exit 0 }; exit 1
    }
    Healthy { if (Healthy) { exit 0 }; exit 1 }
    Reset {
      if ($Scenario -eq 'taskbackup') {
        $task=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($task) {
          if ($task.Actions.Arguments -notlike "*$root\backup.ps1*") { throw 'Task ownership changed; refusing removal.' }
          Stop-ScheduledTask -TaskName $taskName
          Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }
      }
      Assert-Tree
      Remove-Item -LiteralPath $root -Recurse -Force
      if (Test-Path -LiteralPath $root) { exit 1 }; exit 0
    }
  }
} catch { Write-Error $_ -ErrorAction Continue; exit 1 }
