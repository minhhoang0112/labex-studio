$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$count=0
$scripts=@((Get-Content (Join-Path $root 'server/runtime/windows/enterprise-common.ps1') -Raw -Encoding UTF8))
foreach($file in @(Get-ChildItem (Join-Path $root 'server/data/labs/win-adg-*.json'))+@(Get-ChildItem (Join-Path $root 'server/data/labs/win-dnsdhcp-*.json'))){
  $l=Get-Content $file.FullName -Raw -Encoding UTF8|ConvertFrom-Json
  $scripts+=@($l.steps|ForEach-Object {$_.hint})
  $match=[regex]::Match($l.sections[-1].content,'(?s)```powershell\s+(.*?)\s+```')
  if(-not $match.Success){throw 'Missing self-contained reset'}
  $scripts+=$match.Groups[1].Value
}
$rules=Get-Content (Join-Path $root 'server/data/windows-enterprise-rules.json') -Raw -Encoding UTF8|ConvertFrom-Json
foreach($r in $rules.PSObject.Properties){if($r.Value.probe){$scripts+=$r.Value.probe};if($r.Value.client_probe){$scripts+=$r.Value.client_probe}}
foreach($s in $scripts){$tokens=$null;$issues=$null;[void][System.Management.Automation.Language.Parser]::ParseInput($s,[ref]$tokens,[ref]$issues);if($issues.Count){throw ($issues.Message -join ';')};$count++}
. (Join-Path $root 'server/runtime/windows/enterprise-common.ps1')
# Virtual store: no native AD role available on developer Windows. Only guard behavior is tested here.
$labId='win-adg-ou-groups';$run='0123456789abcdef0123456789abcdef'
$script:manifest=[pscustomobject]@{Schema=1;LabId=$labId;Host=$env:COMPUTERNAME;Run=$run;RootGuid='11111111-1111-1111-1111-111111111111';DomainDN='DC=lab,DC=test';RootDN='OU=Owned,DC=lab,DC=test'}
function Get-CimInstance {return @{ProductType=2}}
function Test-Path {return $true}
function Get-Item {return @{Attributes=0;Length=100}}
function Get-Content {return ($script:manifest|ConvertTo-Json)}
function Get-ADDomain {return @{DistinguishedName='DC=lab,DC=test'}}
function Get-ADOrganizationalUnit {return @{DistinguishedName='OU=Owned,DC=lab,DC=test';Description=('LabEx:'+$run)}}
if((Get-SrvContext).Run -ne $run){throw 'Valid context refused'}
$negative=0
foreach($field in @('Schema','LabId','Host','Run','DomainDN','RootDN','RootGuid')){
  $old=$script:manifest.$field
  try{
    $script:manifest.$field=if($field -eq 'Schema'){9}elseif($field -eq 'RootGuid'){''}else{'WRONG'}
    $refused=$false;try{Get-SrvContext|Out-Null}catch{$refused=$true}
    if(-not $refused){throw ('Bad context accepted: '+$field)};$negative++
  }finally{$script:manifest.$field=$old}
}
function Get-CimInstance {return @{ProductType=1}}
$refused=$false;try{Get-SrvContext|Out-Null}catch{$refused=$true};if(-not $refused){throw 'Client OS accepted as server'};$negative++
# Registration must never make a computer account eligible for reset deletion.
function Get-SrvContext {return @{Run=$run;RootDN='OU=Owned,DC=lab,DC=test';Created=@()}}
function Save-SrvContext {throw 'Unexpected manifest mutation'}
$script:candidate=@{ObjectClass='computer';Description=('LabEx:'+$run);DistinguishedName='CN=CLIENT01,OU=Owned,DC=lab,DC=test'}
function Get-ADObject {return $script:candidate}
foreach($kind in @('computer','untagged','outside')){
  $script:candidate=@{ObjectClass='user';Description=('LabEx:'+$run);DistinguishedName='CN=User,OU=Owned,DC=lab,DC=test'}
  if($kind -eq 'computer'){$script:candidate.ObjectClass='computer'}
  if($kind -eq 'untagged'){$script:candidate.Description='NotOwned'}
  if($kind -eq 'outside'){$script:candidate.DistinguishedName='CN=User,OU=Other,DC=lab,DC=test'}
  $message='';try{Register-SrvObject 'AD' '11111111-1111-1111-1111-111111111111'}catch{$message=$_.Exception.Message}
  if(-not $message -or $message -eq 'Unexpected manifest mutation'){throw ('Unsafe registration: '+$kind)};$negative++
}
Write-Output ('Enterprise: '+$count+' scripts parsed; valid context + '+$negative+' invalid context/OS guards checked using virtual store. AD/DNS/GPO/DHCP live execution NOT claimed.')
