# Compile and test the real service's file-processing code. Never installs a service.
$ErrorActionPreference='Stop'
$source=Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\server\runtime\windows\document-agent.cs') -Raw
$taskRoot=Join-Path ([IO.Path]::GetTempPath()) ('labex-agent-test-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $taskRoot | Out-Null
$assertions=0
function Assert([bool]$ok,[string]$message){if(!$ok){throw $message};$script:assertions++}
function Config([string]$value){[IO.File]::WriteAllText((Join-Path $taskRoot 'agent.config'),'<settings><dataDirectory>'+[Security.SecurityElement]::Escape($value)+'</dataDirectory></settings>')}
try {
    $assembly=Join-Path $taskRoot 'DocumentAgent.exe'
    Add-Type -TypeDefinition $source -ReferencedAssemblies System.ServiceProcess,System.Xml,System.Core -OutputAssembly $assembly -OutputType WindowsApplication
    [void][Reflection.Assembly]::Load([IO.File]::ReadAllBytes($assembly))
    foreach($name in @('Data','Inbox','Outbox')){New-Item -ItemType Directory -Path (Join-Path $taskRoot $name) | Out-Null}
    [IO.File]::WriteAllText((Join-Path $taskRoot 'Data\catalog.txt'),'test catalog')
    Config (Join-Path $taskRoot 'Data')
    Assert ([LabExDocumentAgent]::LoadCatalog($taskRoot) -eq 'test catalog') 'Valid config must load'
    [IO.File]::WriteAllText((Join-Path $taskRoot 'Inbox\my-own-name.txt'),'New order 1042')
    [LabExDocumentAgent]::ProcessRequests($taskRoot,'test catalog')
    $receipt=[IO.File]::ReadAllText((Join-Path $taskRoot 'Outbox\my-own-name.receipt'))
    Assert ($receipt -eq [LabExDocumentAgent]::Receipt('New order 1042','test catalog')) 'Functional response mismatch'
    Assert ($receipt -ne [LabExDocumentAgent]::Receipt('Another order','test catalog')) 'Old response must not pass a new request'
    Assert ($receipt -ne [LabExDocumentAgent]::Receipt('New order 1042','changed catalog')) 'Wrong catalog must change response'
    [IO.File]::WriteAllText((Join-Path $taskRoot 'Inbox\my-own-name.txt'),'Changed input')
    [LabExDocumentAgent]::ProcessRequests($taskRoot,'test catalog')
    Assert ([IO.File]::ReadAllText((Join-Path $taskRoot 'Outbox\my-own-name.receipt')) -eq $receipt) 'Existing receipt should not be overwritten'
    [IO.File]::WriteAllText((Join-Path $taskRoot 'Inbox\too-large.txt'),('x'*16385))
    [LabExDocumentAgent]::ProcessRequests($taskRoot,'test catalog')
    Assert (!(Test-Path -LiteralPath (Join-Path $taskRoot 'Outbox\too-large.receipt'))) 'Oversize request accepted'
    Config (Join-Path $taskRoot 'Data_old')
    $rejected=$false;try{[LabExDocumentAgent]::LoadCatalog($taskRoot)}catch{$rejected=$_.Exception.ToString() -match 'DirectoryNotFoundException'}
    Assert $rejected 'Broken config must throw a real missing-directory error'
    Config ([IO.Path]::GetTempPath())
    $rejected=$false;try{[LabExDocumentAgent]::LoadCatalog($taskRoot)}catch{$rejected=$_.Exception.ToString() -match 'inside the lab workspace'}
    Assert $rejected 'External data paths must be refused'
    [IO.File]::WriteAllText((Join-Path $taskRoot 'agent.config'),'<!DOCTYPE settings [<!ENTITY x SYSTEM "file:///C:/Windows/win.ini">]><settings><dataDirectory>&x;</dataDirectory></settings>')
    $rejected=$false;try{[LabExDocumentAgent]::LoadCatalog($taskRoot)}catch{$rejected=$true}
    Assert $rejected 'XML external entities must be refused'
    [IO.File]::WriteAllText((Join-Path $taskRoot 'agent.config'),'<broken')
    $rejected=$false;try{[LabExDocumentAgent]::LoadCatalog($taskRoot)}catch{$rejected=$true}
    Assert $rejected 'Malformed XML must be refused'
    Write-Output "PASS: service source compiled; $assertions functional/negative assertions. No service/registry/VM changes."
} finally {
    $resolved=[IO.Path]::GetFullPath($taskRoot)
    $allowed=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\')+'\labex-agent-test-'
    if(!$resolved.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Cleanup outside generated test workspace refused'}
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
