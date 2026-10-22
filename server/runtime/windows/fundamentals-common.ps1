# Trusted helper injected into foundation probes. Never dot-source learner files.
function Assert-FndWorkspace {
  $expected='C:\LabEx\Labs\'+$labId
  if([IO.Path]::GetFullPath($labRoot) -ne $expected){throw 'Unexpected lab root'}
  foreach($path in @('C:\LabEx','C:\LabEx\Labs',$labRoot)){
    if((Test-Path -LiteralPath $path) -and ((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse path refused'}
  }
  if((Test-Path -LiteralPath $labRoot) -and @(Get-ChildItem -LiteralPath $labRoot -Force -Recurse | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw 'Reparse item refused'}
}
function Read-FndReport($name){
  Assert-FndWorkspace
  $file=Join-Path $labRoot $name
  if(-not(Test-Path -LiteralPath $file -PathType Leaf)){throw 'Report missing'}
  if((Get-Item -LiteralPath $file).Length -gt 1048576){throw 'Report too large'}
  $r=Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json
  [DateTimeOffset]$when=[DateTimeOffset]::MinValue
  if($r.Schema -ne 1 -or $r.LabId -ne $labId -or $r.Computer -ne $env:COMPUTERNAME -or
    -not [DateTimeOffset]::TryParse([string]$r.CollectedAtUtc,[ref]$when) -or
    $when -gt [DateTimeOffset]::UtcNow.AddMinutes(5) -or $when -lt [DateTimeOffset]::UtcNow.AddHours(-24)){throw 'Stale or wrong report context'}
  return $r.Data
}
function Same-FndItems($a,$b){
  $left=@($a | ForEach-Object {[string]$_} | Sort-Object)
  $right=@($b | ForEach-Object {[string]$_} | Sort-Object)
  if($left.Count -eq 0 -and $right.Count -eq 0){return $true}
  return $left.Count -eq $right.Count -and @((Compare-Object -ReferenceObject $left -DifferenceObject $right)).Count -eq 0
}
function Get-FndStartup {
  $items=@()
  foreach($key in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run')){
    if(Test-Path -LiteralPath $key){$items+=@((Get-Item -LiteralPath $key).GetValueNames() | ForEach-Object {"$key|$_"})}
  }
  $folder=[Environment]::GetFolderPath('CommonStartup')
  if(Test-Path -LiteralPath $folder){$items+=@(Get-ChildItem -LiteralPath $folder -File | ForEach-Object {"CommonStartup|$($_.Name)"})}
  return @($items | Sort-Object)
}
function Get-FndSoftware {
  $rows=@()
  foreach($key in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')){
    if(Test-Path -LiteralPath $key){$rows+=@(Get-ChildItem -LiteralPath $key | Get-ItemProperty | Where-Object DisplayName | ForEach-Object {
      [pscustomobject]@{Key=[string]$_.PSPath;Name=[string]$_.DisplayName;Version=[string]$_.DisplayVersion;Publisher=[string]$_.Publisher}
    })}
  }
  return @($rows | Sort-Object Key | Select-Object -First 5)
}
function Get-FndDrivers {
  return @(Get-CimInstance Win32_PnPSignedDriver | Where-Object DeviceID | Sort-Object DeviceID | Select-Object -First 5 | ForEach-Object {
    [pscustomobject]@{DeviceID=[string]$_.DeviceID;DeviceName=[string]$_.DeviceName;Version=[string]$_.DriverVersion;Signed=[bool]$_.IsSigned}
  })
}
