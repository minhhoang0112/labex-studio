$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$items=@(Get-ChildItem (Join-Path $root 'server/data/labs/win-fnd-*.json') | ForEach-Object {
  $lab=Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  $lab.steps | ForEach-Object {$_.hint}
})
$rules=Get-Content (Join-Path $root 'server/data/windows-foundations-rules.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$items+=@($rules.PSObject.Properties | ForEach-Object {$_.Value.probe})
foreach($item in $items){
  $tokens=$null;$parseErrors=$null
  [void][System.Management.Automation.Language.Parser]::ParseInput($item,[ref]$tokens,[ref]$parseErrors)
  if($parseErrors.Count){throw ($parseErrors.Message -join '; ')}
}
. (Join-Path $root 'server/runtime/windows/fundamentals-common.ps1')
function Assert-Case($condition,$message){if(-not $condition){throw $message}}
Assert-Case (Same-FndItems @() @()) 'Empty inventories must compare'
Assert-Case (Same-FndItems @('a','b') @('b','a')) 'Inventory order is immaterial'
Assert-Case (-not(Same-FndItems @('a') @())) 'Missing inventory rejected'
Assert-Case (-not(Same-FndItems @('a','a') @('a'))) 'Duplicate counts checked'
$labId='win-fnd-unit';$labRoot=Join-Path $root '.artifacts/windows-foundations-report-test'
$refused=$false;try{Assert-FndWorkspace}catch{$refused=$true}
Assert-Case $refused 'Production workspace guard rejects noncanonical root'
New-Item -ItemType Directory -Path $labRoot -Force | Out-Null
# Isolated fixture scope: report parsing is exercised with real files inside workspace.
function Assert-FndWorkspace {
  $allowed=Join-Path $root '.artifacts/windows-foundations-report-test'
  if($labRoot -ne $allowed -and -not $labRoot.StartsWith($allowed+'\')){throw 'Unexpected test root'}
}
$file=Join-Path $labRoot 'step1.json'
$checks=0
foreach($mutation in @('valid','machine','lab','schema','stale','future','bad-time','missing-data')){
  $r=[pscustomobject]@{Schema=1;LabId=$labId;Computer=$env:COMPUTERNAME;CollectedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');Data=[pscustomobject]@{Value='expected'}}
  switch($mutation){
    'machine' {$r.Computer='OTHER'}
    'lab' {$r.LabId='win-other'}
    'schema' {$r.Schema=2}
    'stale' {$r.CollectedAtUtc=[DateTimeOffset]::UtcNow.AddHours(-25).ToString('o')}
    'future' {$r.CollectedAtUtc=[DateTimeOffset]::UtcNow.AddMinutes(10).ToString('o')}
    'bad-time' {$r.CollectedAtUtc='invalid'}
    'missing-data' {$r.Data=$null}
  }
  $r|ConvertTo-Json -Depth 4|Set-Content -LiteralPath $file -Encoding UTF8
  $passed=$false;try{$passed=(Read-FndReport 'step1.json').Value -eq 'expected'}catch{}
  Assert-Case ($passed -eq ($mutation -eq 'valid')) ('Report condition: '+$mutation)
  $checks++
}
Write-Output ('Parsed '+$items.Count+' scripts; report context/freshness checks='+$checks+'; inventory and workspace checks passed.')
$fileChecks=0
foreach($id in @('win-fnd-files-profile-ntfs','win-fnd-baseline-change-rollback')){
  $lab=Get-Content (Join-Path $root ('server/data/labs/'+$id+'.json')) -Raw -Encoding UTF8 | ConvertFrom-Json
  $labId=$id;$labRoot=Join-Path $root ('.artifacts/windows-foundations-report-test/'+$id)
  New-Item -ItemType Directory -Path $labRoot -Force | Out-Null
  foreach($step in $lab.steps){
    # Run the original collector body using a bounded local fixture root; do not run its C: prefix.
    $marker='New-Item -ItemType Directory -Path $labRoot -Force | Out-Null'
    $offset=$step.hint.IndexOf($marker)
    if($offset -lt 0){throw 'Missing collector body marker'}
    & ([scriptblock]::Create($step.hint.Substring($offset))) | Out-Null
    $probe=$rules.($step.id).probe
    $actual=& ([scriptblock]::Create($probe))
    Assert-Case ($actual -is [bool] -and $actual) ('Valid filesystem evidence: '+$step.id)
    $target=if($id -eq 'win-fnd-files-profile-ntfs'){Join-Path $labRoot 'Documents/LearningNote.txt'}
      elseif($step.position -eq 1){Join-Path $labRoot 'config.json'}else{Join-Path $labRoot 'changed.json'}
    $original=[IO.File]::ReadAllBytes($target)
    try{
      Set-Content -LiteralPath $target -Value '{"Version":999,"Mode":"Tampered"}' -Encoding UTF8
      $actual=& ([scriptblock]::Create($probe))
      Assert-Case ($actual -is [bool] -and -not $actual) ('Tampered real file refused: '+$step.id)
    }finally{[IO.File]::WriteAllBytes($target,$original)}
    $fileChecks++
  }
}
Write-Output ('Real Windows filesystem: '+$fileChecks+' collector/probe pairs passed and tampering refused (isolated local fixture, not Azure).')
