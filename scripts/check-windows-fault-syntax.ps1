$ErrorActionPreference='Stop'
$tokens=$null
$parseErrors=$null
foreach ($filename in @('support-faults.ps1','practice-faults.ps1','backup-permission-fault.ps1','file-lock-fault.ps1','service-config-fault.ps1','professional-common.ps1')) {
  $scriptPath=Join-Path $PSScriptRoot "..\server\runtime\windows\$filename"
  [void][System.Management.Automation.Language.Parser]::ParseFile($scriptPath,[ref]$tokens,[ref]$parseErrors)
  if ($parseErrors.Count) { $parseErrors | Select-Object Message,Extent | Format-List; exit 1 }
}
$rules=Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\server\data\windows-support-rules.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($entry in $rules.PSObject.Properties) {
  [void][System.Management.Automation.Language.Parser]::ParseInput($entry.Value.probe,[ref]$tokens,[ref]$parseErrors)
  if ($parseErrors.Count) { Write-Output $entry.Name; $parseErrors | Select-Object Message,Extent | Format-List; exit 1 }
}
$commands=0
Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '..\server\data\labs') -Filter 'win-it-*.json' | ForEach-Object {
  $lab=Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  if ($lab.curriculum_version -eq 3) {
    foreach ($step in $lab.steps) {
      [void][System.Management.Automation.Language.Parser]::ParseInput($step.hint,[ref]$tokens,[ref]$parseErrors)
      if ($parseErrors.Count) { Write-Output $step.id; $parseErrors | Select-Object Message,Extent | Format-List; exit 1 }
      $commands++
    }
  }
}
Write-Output "PowerShell syntax OK: 6 runtime scripts, $(@($rules.PSObject.Properties).Count) rules, $commands learner commands. Nothing executed."
