param(
  [ValidateSet('Baseline','Inject','Faulted','Healthy','Reset')][string]$Operation,
  [ValidateSet('spooler','hosts','disk')][string]$Scenario
)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
if ($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1) {
  throw 'Fault injection is restricted to the dedicated CLIENT01 Windows client.'
}
$root="C:\LabEx\Faults\$Scenario"
$record=Join-Path $root 'state.json'
$hostsFile=Join-Path $env:windir 'System32\drivers\etc\hosts'
$queue=Join-Path $env:windir 'System32\spool\PRINTERS'
$dummy=Join-Path $env:windir 'Temp\DummyLogs'
$keep='C:\LabEx\Keep\employee-note.txt'
function Save-State($data) { $data | ConvertTo-Json -Compress | Set-Content -LiteralPath $record -Encoding UTF8 }
function Remove-LabDirectory([string]$value) {
  $absolute=[IO.Path]::GetFullPath($value)
  $allowed=[IO.Path]::GetFullPath($dummy)
  if ($absolute -ne $allowed) { throw 'Refusing deletion outside the exact lab fixture.' }
  if (Test-Path -LiteralPath $absolute) {
    $item=Get-Item -LiteralPath $absolute -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Fixture is a reparse point.' }
    if (@(Get-ChildItem -LiteralPath $absolute -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Fixture contains a reparse point.' }
    Remove-Item -LiteralPath $absolute -Recurse -Force
  }
}
function Portal-Healthy {
  try {
    $addresses=@([Net.Dns]::GetHostAddresses('portal.company.local') | ForEach-Object IPAddressToString)
    if ($addresses.Count -ne 1 -or $addresses[0] -ne '127.0.0.1') { return $false }
    $client=New-Object Net.Sockets.TcpClient
    try {
      $pending=$client.ConnectAsync('127.0.0.1',18080)
      if (-not $pending.Wait(3000)) { return $false }
      $stream=$client.GetStream(); $stream.ReadTimeout=3000
      $request=[Text.Encoding]::ASCII.GetBytes("GET / HTTP/1.0`r`nHost: portal.company.local`r`n`r`n")
      $stream.Write($request,0,$request.Length)
      $reader=New-Object IO.StreamReader($stream)
      return $reader.ReadToEnd().Contains('LabEx training portal OK')
    } finally { $client.Dispose() }
  } catch { return $false }
}
function Healthy {
  switch ($Scenario) {
    spooler { return ((Get-Service Spooler).Status -eq 'Running' -and @(Get-ChildItem -LiteralPath $queue -Force -File).Count -eq 0) }
    hosts { return (Portal-Healthy) }
    disk {
      $size=0
      if (Test-Path -LiteralPath $dummy) { $size=(Get-ChildItem -LiteralPath $dummy -File -Recurse | Measure-Object Length -Sum).Sum }
      return ($size -le 1MB -and (Test-Path -LiteralPath $keep) -and [IO.File]::ReadAllText($keep) -eq 'Employee document - preserve during cleanup')
    }
  }
}
try {
  if ($Operation -eq 'Baseline') {
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    if (Test-Path -LiteralPath $record) { throw 'Previous fixture has not been reset.' }
    switch ($Scenario) {
      spooler {
        if (-not (Healthy)) { throw 'Spooler baseline must be Running with an empty queue.' }
        Save-State @{ scenario=$Scenario; originalStatus='Running' }
      }
      hosts {
        if (Get-ScheduledTask -TaskName 'LabExTrainingPortal' -ErrorAction SilentlyContinue) { throw 'Portal fixture already exists; reset first.' }
        Copy-Item -LiteralPath $hostsFile -Destination (Join-Path $root 'hosts.original')
        Save-State @{ scenario=$Scenario; originalHash=(Get-FileHash -LiteralPath $hostsFile).Hash }
        $server=@'
$listener=New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,18080)
$listener.Start()
try { while ($true) {
  $connection=$listener.AcceptTcpClient()
  try {
    $stream=$connection.GetStream(); $stream.ReadTimeout=3000
    $buffer=New-Object byte[] 4096; [void]$stream.Read($buffer,0,$buffer.Length)
    $body='LabEx training portal OK'
    $response=[Text.Encoding]::ASCII.GetBytes("HTTP/1.0 200 OK`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n$body")
    $stream.Write($response,0,$response.Length)
  } finally { $connection.Dispose() }
} } finally { $listener.Stop() }
'@
        $server | Set-Content -LiteralPath (Join-Path $root 'portal.ps1') -Encoding UTF8
        $action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\LabEx\Faults\hosts\portal.ps1"
        $trigger=New-ScheduledTaskTrigger -AtStartup
        Register-ScheduledTask -TaskName 'LabExTrainingPortal' -Action $action -Trigger $trigger -User 'SYSTEM' -RunLevel Highest | Out-Null
        Start-ScheduledTask -TaskName 'LabExTrainingPortal'
        $lines=@(Get-Content -LiteralPath $hostsFile | Where-Object { $_ -notmatch '(^|\s)portal\.company\.local(\s|$)' })
        [IO.File]::WriteAllLines($hostsFile, @($lines)+@('127.0.0.1 portal.company.local'))
        Clear-DnsClientCache
        Start-Sleep -Seconds 2
        if (-not (Healthy)) { throw 'Training portal baseline did not become healthy.' }
      }
      disk {
        if (Test-Path -LiteralPath $dummy) { throw 'DummyLogs already exists; refusing to overwrite.' }
        if (Test-Path -LiteralPath $keep) { throw 'Preserved document already exists; refusing to overwrite.' }
        if ((Get-PSDrive C).Free -lt 5GB) { throw 'At least 5 GiB free space is required; never fill the OS disk.' }
        New-Item -ItemType Directory -Path 'C:\LabEx\Keep' -Force | Out-Null
        [IO.File]::WriteAllText($keep,'Employee document - preserve during cleanup')
        Save-State @{ scenario=$Scenario; fixtureBytes=268435456 }
      }
    }
    if (-not (Healthy)) { throw 'Baseline probe failed.' }
    exit 0
  }
  if (-not (Test-Path -LiteralPath $record)) { throw 'No prepared scenario state.' }
  $state=Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
  switch ($Operation) {
    Inject {
      switch ($Scenario) {
        spooler {
          Stop-Service Spooler -Force
          foreach ($name in @('LabEx-orphan.SHD','LabEx-orphan.SPL')) { [IO.File]::WriteAllText((Join-Path $queue $name),'LabEx orphan fixture; not a valid Windows print job') }
        }
        hosts {
          $lines=@(Get-Content -LiteralPath $hostsFile | Where-Object { $_ -notmatch '(^|\s)portal\.company\.local(\s|$)' })
          [IO.File]::WriteAllLines($hostsFile,@($lines)+@('203.0.113.10 portal.company.local'))
          Clear-DnsClientCache
        }
        disk {
          if ((Get-PSDrive C).Free -lt 5GB) { throw 'Insufficient safety margin.' }
          New-Item -ItemType Directory -Path $dummy | Out-Null
          $block=New-Object byte[] 1048576
          for ($i=1; $i -le 4; $i++) {
            $stream=[IO.File]::Open((Join-Path $dummy "application-$i.log"),[IO.FileMode]::CreateNew)
            try { for ($j=0; $j -lt 64; $j++) { $stream.Write($block,0,$block.Length) } } finally { $stream.Dispose() }
          }
        }
      }
      exit 0
    }
    Faulted {
      $failed=$false
      switch ($Scenario) {
        spooler { $failed=(Get-Service Spooler).Status -eq 'Stopped' -and (Test-Path -LiteralPath (Join-Path $queue 'LabEx-orphan.SPL')) }
        hosts { $failed= -not (Portal-Healthy) }
        disk { $failed=(Get-ChildItem -LiteralPath $dummy -File | Measure-Object Length -Sum).Sum -ge 256MB }
      }
      if ($failed) { exit 0 }; exit 1
    }
    Healthy { if (Healthy) { exit 0 }; exit 1 }
    Reset {
      switch ($Scenario) {
        spooler {
          Stop-Service Spooler -Force
          foreach ($name in @('LabEx-orphan.SHD','LabEx-orphan.SPL')) {
            $file=Join-Path $queue $name
            if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force }
          }
          Start-Service Spooler
          if (-not (Healthy)) { throw 'Spooler reset probe failed.' }
        }
        hosts {
          Copy-Item -LiteralPath (Join-Path $root 'hosts.original') -Destination $hostsFile -Force
          Clear-DnsClientCache
          Stop-ScheduledTask -TaskName 'LabExTrainingPortal' -ErrorAction SilentlyContinue
          Unregister-ScheduledTask -TaskName 'LabExTrainingPortal' -Confirm:$false -ErrorAction SilentlyContinue
          if ((Get-FileHash -LiteralPath $hostsFile).Hash -ne $state.originalHash) { throw 'Hosts restore checksum mismatch.' }
        }
        disk {
          Remove-LabDirectory $dummy
          if (-not (Healthy)) { throw 'Preserved document missing or modified.' }
          Remove-Item -LiteralPath $keep
        }
      }
      Remove-Item -LiteralPath $record
      exit 0
    }
  }
} catch { Write-Error $_ -ErrorAction Continue; exit 1 }
