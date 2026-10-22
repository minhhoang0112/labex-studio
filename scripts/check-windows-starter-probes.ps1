$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$rules=Get-Content -LiteralPath (Join-Path $root 'server/data/windows-starter-rules.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$script:checks=0
function Assert-Value($ok,$label){if(-not $ok){throw "FAILED: $label"};$script:checks++}
function Probe($id){try{[bool](& ([scriptblock]::Create($rules.$id.probe)))}catch{$false}}
foreach($property in $rules.PSObject.Properties){
  $tokens=$null;$errors=$null
  [void][Management.Automation.Language.Parser]::ParseInput($property.Value.probe,[ref]$tokens,[ref]$errors)
  Assert-Value (@($errors).Count -eq 0) "probe syntax $($property.Name)"
}
foreach($file in Get-ChildItem -LiteralPath (Join-Path $root 'server/data/labs') -Filter 'win-*.json'){
  $lab=Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  if($lab.curriculum_version -ne 4){continue}
  foreach($section in $lab.sections){
    foreach($block in [regex]::Matches($section.content_vi,'(?s)```powershell\s*\r?\n(.*?)```')){
      $tokens=$null;$errors=$null
      [void][Management.Automation.Language.Parser]::ParseInput($block.Groups[1].Value,[ref]$tokens,[ref]$errors)
      Assert-Value (@($errors).Count -eq 0) "learner command syntax $($section.id)"
    }
  }
}
$fixture=Join-Path $root '.artifacts/windows-starter-fixture'
New-Item -ItemType Directory -Path $fixture -Force | Out-Null
Push-Location -LiteralPath $fixture
try{
  # Only dedicated files in the workspace are changed. No VM or host config changes.
  New-Item -ItemType Directory -Path ./FinanceDocs -Force | Out-Null
  Assert-Value (Probe 'win-fs-03-sec-1-v4') 'real NTFS read probe in scratch folder'
  function Get-CimInstance { @([pscustomobject]@{DeviceID='C:';Size=1000;FreeSpace=400}) }
  Set-Content ./health_report.csv 'DeviceID FreeSpace Size'
  Assert-Value (-not (Probe 'win-sc-05-sec-1-v4')) 'token-only report rejected'
  function Report($machine,$size,$free){[pscustomobject]@{ComputerName=$machine;DeviceID='C:';Size=$size;FreeSpace=$free}|Export-Csv ./health_report.csv -NoTypeInformation}
  Report $env:COMPUTERNAME 1000 400
  Assert-Value (Probe 'win-sc-05-sec-1-v4') 'valid structured report'
  foreach($case in @(@('OTHER',1000,400),@($env:COMPUTERNAME,999,400),@($env:COMPUTERNAME,1000,-1),@($env:COMPUTERNAME,1000,2000))){
    Report $case[0] $case[1] $case[2]
    Assert-Value (-not (Probe 'win-sc-05-sec-1-v4')) 'wrong machine/size/free space rejected'
  }
  Report $env:COMPUTERNAME 1000 400
  $duplicate=Import-Csv ./health_report.csv;@($duplicate,$duplicate)|Export-Csv ./health_report.csv -NoTypeInformation
  Assert-Value (-not (Probe 'win-sc-05-sec-1-v4')) 'duplicate disk rows rejected'
  function Import-Module {}
  function Get-Website {$script:site}
  function Invoke-WebRequest {$script:http}
  $script:site=[pscustomobject]@{State='Started';PhysicalPath='C:\LabEx\Labs\win-server-iis-web\site';Bindings=[pscustomobject]@{Collection=@([pscustomobject]@{protocol='http';bindingInformation='*:8080:'})}}
  $script:http=[pscustomobject]@{StatusCode=200;Content='LabEx PortalCorp'}
  Assert-Value (Probe 'win-iis-05-sec-1-v4') 'matching website state and HTTP body'
  $script:http.Content='Other website'
  Assert-Value (-not (Probe 'win-iis-05-sec-1-v4')) 'wrong HTTP body rejected'
  $script:http.Content='LabEx PortalCorp';$script:site.State='Stopped'
  Assert-Value (-not (Probe 'win-iis-05-sec-1-v4')) 'stopped website rejected'
  $script:site.State='Started';$script:site.PhysicalPath='C:\inetpub\wwwroot'
  Assert-Value (-not (Probe 'win-iis-05-sec-1-v4')) 'unrelated website directory rejected'
  function Get-ADDomain {[pscustomobject]@{DistinguishedName='DC=lab,DC=test'}}
  function Get-ADOrganizationalUnit {param($Identity) if($script:ouPresent -and $Identity -eq 'OU=IT_Department,DC=lab,DC=test'){[pscustomobject]@{DistinguishedName=$Identity}}else{throw 'OU missing'}}
  $script:ouPresent=$false;Assert-Value (-not (Probe 'win-ad-01-sec-1-v4')) 'module/tool alone does not prove OU exists'
  $script:ouPresent=$true;Assert-Value (Probe 'win-ad-01-sec-1-v4') 'OU in actual domain root'
}finally{Pop-Location}
@{passed=$true;checks=$script:checks;realAzure=$false;note='Real PowerShell parsing and local scratch NTFS; mocked disk/AD/IIS state branches.'}|ConvertTo-Json -Compress
