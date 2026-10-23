$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
. (Join-Path $root 'server/runtime/windows/fundamentals-common.ps1')
. (Join-Path $root 'server/runtime/windows/networking-common.ps1')
$rules=Get-Content (Join-Path $root 'server/data/windows-networking-rules.json') -Raw -Encoding UTF8|ConvertFrom-Json
function Assert-Case($condition,$message){if(-not $condition){throw $message}}
$fixture=Join-Path $root ('.artifacts/networking-tests-'+[guid]::NewGuid().ToString('N'))
# Only the fixture guard is overridden: original collectors, probes and real OS/socket APIs run.
function Assert-FndWorkspace {
  if(-not([IO.Path]::GetFullPath($labRoot)).StartsWith($fixture+'\')){throw 'Outside test fixture'}
}
$subnets=@(@('10.20.30.45',26,'10.20.30.0','10.20.30.63'),@('192.0.2.1',0,'0.0.0.0','255.255.255.255'),@('192.0.2.1',31,'192.0.2.0','192.0.2.1'),@('192.0.2.1',32,'192.0.2.1','192.0.2.1'))
foreach($s in $subnets){$v=Get-NwfSubnet $s[0] $s[1];Assert-Case ($v.Network -eq $s[2] -and $v.LastAddress -eq $s[3]) 'Subnet calculation'}
foreach($bad in @(-1,33)){$rejected=$false;try{Get-NwfSubnet '192.0.2.1' $bad|Out-Null}catch{$rejected=$true};Assert-Case $rejected 'Bad prefix rejected'}
$checks=0;$negatives=0;$parsed=0
foreach($file in (Get-ChildItem (Join-Path $root 'server/data/labs/win-nwf-*.json')|Sort-Object Name)){
  $lab=Get-Content $file.FullName -Raw -Encoding UTF8|ConvertFrom-Json
  $labId=$lab.id;$labRoot=Join-Path $fixture $labId
  New-Item -ItemType Directory -Path $labRoot -Force|Out-Null
  foreach($step in $lab.steps){
    $probe=$rules.($step.id).probe
    foreach($scriptText in @($step.hint,$probe)){
      $tokens=$null;$issues=$null
      [void][System.Management.Automation.Language.Parser]::ParseInput($scriptText,[ref]$tokens,[ref]$issues)
      Assert-Case ($issues.Count -eq 0) ('Syntax: '+$step.id+': '+($issues.Message -join ';'))
      $parsed++
    }
    $marker='New-Item -ItemType Directory -Path $labRoot -Force | Out-Null'
    $offset=$step.hint.IndexOf($marker);Assert-Case ($offset -ge 0) 'Collector boundary exists'
    & ([scriptblock]::Create($step.hint.Substring($offset)))|Out-Null
    $value=& ([scriptblock]::Create($probe))
    Assert-Case ($value -is [bool] -and $value) ('Positive probe: '+$step.id)
    $reportFile=Join-Path $labRoot $rules.($step.id).report_file
    $original=[IO.File]::ReadAllBytes($reportFile)
    foreach($mutation in @('machine','stale','lab','empty-data')){
      try{
        $r=Get-Content -LiteralPath $reportFile -Raw|ConvertFrom-Json
        switch($mutation){
          'machine' {$r.Computer='OTHER'}
          'stale' {$r.CollectedAtUtc=[DateTimeOffset]::UtcNow.AddHours(-25).ToString('o')}
          'lab' {$r.LabId='win-other'}
          'empty-data' {$r.Data=[pscustomobject]@{}}
        }
        $r|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $reportFile -Encoding UTF8
        $rejected=$false;try{$v=& ([scriptblock]::Create($probe));$rejected=$v -is [bool] -and -not $v}catch{$rejected=$true}
        Assert-Case $rejected ('Reject '+$mutation+': '+$step.id);$negatives++
      }finally{[IO.File]::WriteAllBytes($reportFile,$original)}
    }
    if($labId -eq 'win-nwf-helpdesk-endpoint'){
      $config=Join-Path $labRoot 'client.json';$saved=[IO.File]::ReadAllBytes($config)
      try{
        $wrong=if($step.position -eq 1){'/health'}else{'/missing'}
        @{Path=$wrong}|ConvertTo-Json|Set-Content -LiteralPath $config -Encoding UTF8
        $v=& ([scriptblock]::Create($probe))
        Assert-Case ($v -is [bool] -and -not $v) ('Actual wrong application config refused: '+$step.id);$negatives++
      }finally{[IO.File]::WriteAllBytes($config,$saved)}
    }
    $checks++
  }
}
Write-Output ('Networking native Windows checks: '+$checks+' real collector/probe pairs; '+$negatives+' negative cases; '+$parsed+' scripts parsed; subnet edge cases passed. Local fixture, not Azure.')
