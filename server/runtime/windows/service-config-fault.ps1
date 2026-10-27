param([ValidateSet('Baseline','Inject','Faulted','Healthy','Reset')][string]$Operation,
      [ValidateSet('serviceconfig')][string]$Scenario)
$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1){throw 'Dedicated CLIENT01 required'}
$root='C:\LabEx\PracticeFaults\serviceconfig'
$name='LabExDocumentAgentV2'
$record=Join-Path $root 'state.json'
$binary=Join-Path $root 'DocumentAgent.exe'
$source=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__LABEX_SERVICE_SOURCE_B64__'))
$catalog='Finance catalog revision 7; retain original data.'
function Assert-Paths {
    foreach($p in @('C:\LabEx','C:\LabEx\PracticeFaults',$root)){
        if((Test-Path -LiteralPath $p) -and ((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse parent refused'}
    }
    if((Test-Path -LiteralPath $root) -and @(Get-ChildItem -LiteralPath $root -Force -Recurse | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw 'Reparse fixture refused'}
}
function Set-OwnedAcl([string]$p,[string]$rights){
    $acl=[Security.AccessControl.DirectorySecurity]::new()
    $acl.SetAccessRuleProtection($true,$false)
    foreach($sid in @('S-1-5-18','S-1-5-32-544')){
        $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sid),'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
    }
    $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new('S-1-5-19'),$rights,'ContainerInherit,ObjectInherit','None','Allow'))
    Set-Acl -LiteralPath $p -AclObject $acl
}
function Service { return Get-CimInstance Win32_Service -Filter "Name='$name'" }
function Assert-Owned([bool]$allowMissing=$false){
    Assert-Paths
    $state=Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
    if($state.scenario -ne 'serviceconfig' -or $state.version -ne 1 -or $state.run -notmatch '^[a-f0-9]{32}$'){throw 'Invalid ownership'}
    $svc=Service
    if(!$svc){if($allowMissing){return $state};throw 'Owned service missing'}
    if($svc.PathName.Trim('"') -ne $binary -or $svc.Description -ne ('LabEx serviceconfig '+$state.run)){throw 'Service ownership/path changed'}
    $sid=[Security.Principal.NTAccount]::new($svc.StartName).Translate([Security.Principal.SecurityIdentifier]).Value
    if($sid -ne 'S-1-5-19'){throw 'Service identity changed'}
    if(!$allowMissing -and (!$state.binaryHash -or (Get-FileHash -LiteralPath $binary).Hash -ne $state.binaryHash)){throw 'Service binary changed'}
    return $state
}
function Stop-Owned {
    $svc=Get-Service -Name $name -ErrorAction SilentlyContinue
    if($svc -and $svc.Status -ne 'Stopped'){
        Stop-Service -Name $name -ErrorAction Stop
        $svc.WaitForStatus('Stopped',[TimeSpan]::FromSeconds(15))
    }
}
function Write-Config([string]$directory){
    '<settings><dataDirectory>'+[Security.SecurityElement]::Escape($directory)+'</dataDirectory></settings>' | Set-Content -LiteralPath (Join-Path $root 'agent.config') -Encoding UTF8
}
function Test-Function {
    $null=Assert-Owned
    $svc=Service
    if($svc.State -ne 'Running' -or $svc.StartMode -ne 'Manual'){return $false}
    if([IO.File]::ReadAllText((Join-Path $root 'Data\catalog.txt')) -ne $catalog){return $false}
    $settings=[Xml.XmlReaderSettings]::new();$settings.DtdProcessing='Prohibit';$settings.XmlResolver=$null
    $reader=[Xml.XmlReader]::Create((Join-Path $root 'agent.config'),$settings)
    try {$config=[Xml.XmlDocument]::new();$config.XmlResolver=$null;$config.Load($reader)}finally{$reader.Dispose()}
    if([IO.Path]::GetFullPath($config.settings.dataDirectory.Trim()).TrimEnd('\') -ne (Join-Path $root 'Data')){return $false}
    # No privileged identity / broad write grant may substitute for the repair.
    foreach($p in @($root,(Join-Path $root 'Data'),(Join-Path $root 'Inbox'),(Join-Path $root 'Outbox'))){
        foreach($ace in (Get-Acl -LiteralPath $p).Access){
            $sid=$ace.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
            if($ace.AccessControlType -eq 'Allow' -and $sid -notin @('S-1-5-18','S-1-5-32-544','S-1-5-19') -and ($ace.FileSystemRights -band [Security.AccessControl.FileSystemRights]::Write)){return $false}
        }
    }
    $token=[guid]::NewGuid().ToString('N');$request=[guid]::NewGuid().ToString('N')
    $inputPath=Join-Path $root ('Inbox\probe-'+$token+'.txt')
    $outputPath=Join-Path $root ('Outbox\probe-'+$token+'.receipt')
    try {
        [IO.File]::WriteAllText($inputPath,$request,[Text.UTF8Encoding]::new($false))
        $sha=[Security.Cryptography.SHA256]::Create()
        try{$expected='PROCESSED|'+[BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($request+'|'+$catalog))).Replace('-','')}finally{$sha.Dispose()}
        for($n=0;$n -lt 40;$n++){
            Start-Sleep -Milliseconds 250
            Assert-Paths
            if((Test-Path -LiteralPath $outputPath) -and [IO.File]::ReadAllText($outputPath) -eq $expected){return (Service).State -eq 'Running'}
        }
        return $false
    } finally {
        Assert-Paths
        Remove-Item -LiteralPath $inputPath,$outputPath -Force -ErrorAction SilentlyContinue
    }
}
try {
    Assert-Paths
    if($Operation -eq 'Baseline'){
        if((Test-Path -LiteralPath $root) -or (Service) -or [Diagnostics.EventLog]::SourceExists($name)){throw 'Existing fixture/service/event source; no overwrite'}
        New-Item -ItemType Directory -Path $root | Out-Null
        $state=@{scenario='serviceconfig';version=1;run=[guid]::NewGuid().ToString('N');binaryHash='';eventSource=$false}
        $state | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
        Set-OwnedAcl $root 'ReadAndExecute'
        foreach($folder in @('Data','Inbox','Outbox','Logs')){
            $p=Join-Path $root $folder;New-Item -ItemType Directory -Path $p | Out-Null
            Set-OwnedAcl $p $(if($folder -in @('Outbox','Logs')){'Modify'}else{'ReadAndExecute'})
        }
        [IO.File]::WriteAllText((Join-Path $root 'Data\catalog.txt'),$catalog,[Text.UTF8Encoding]::new($false))
        Write-Config (Join-Path $root 'Data')
        Add-Type -TypeDefinition $source -ReferencedAssemblies System.ServiceProcess,System.Xml,System.Core -OutputAssembly $binary -OutputType WindowsApplication
        $state.binaryHash=(Get-FileHash -LiteralPath $binary).Hash
        $state | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
        New-EventLog -LogName Application -Source $name
        $state.eventSource=$true
        $state | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
        & sc.exe create $name binPath= ('"'+$binary+'"') start= demand obj= 'NT AUTHORITY\LocalService' DisplayName= 'LabEx Document Agent (Practice)'
        if($LASTEXITCODE -ne 0){throw 'Cannot create owned service'}
        & sc.exe description $name ('LabEx serviceconfig '+$state.run)
        if($LASTEXITCODE -ne 0){throw 'Cannot mark service ownership'}
        $null=Assert-Owned
        Start-Service -Name $name
        (Get-Service $name).WaitForStatus('Running',[TimeSpan]::FromSeconds(15))
        exit 0
    }
    if($Operation -eq 'Reset' -and !(Test-Path -LiteralPath $root) -and !(Service) -and ![Diagnostics.EventLog]::SourceExists($name)){exit 0}
    $state=Assert-Owned ($Operation -eq 'Reset')
    switch($Operation){
        Inject {
            Stop-Owned
            Write-Config (Join-Path $root 'Data_old')
            $since=Get-Date
            try { Start-Service -Name $name -ErrorAction Stop; throw 'Service unexpectedly started' }
            catch { if((Service).State -ne 'Stopped'){throw} }
            $state | Add-Member -NotePropertyName injectedAt -NotePropertyValue $since.ToUniversalTime().ToString('o') -Force
            $state | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
            exit 0
        }
        Faulted {
            $events=@(Get-WinEvent -FilterHashtable @{LogName='Application';ProviderName=$name;Id=1001;StartTime=[datetime]$state.injectedAt} -ErrorAction SilentlyContinue)
            $log=Get-Content -LiteralPath (Join-Path $root 'Logs\agent.log') -Raw
            if((Service).State -eq 'Stopped' -and $log -match 'DirectoryNotFoundException' -and $events.Count -gt 0){exit 0};exit 1
        }
        Healthy { if(Test-Function){exit 0};exit 1 }
        Reset {
            Stop-Owned
            if(Service){ & sc.exe delete $name; if($LASTEXITCODE -ne 0){throw 'Cannot delete owned service'} }
            for($n=0;$n -lt 40 -and (Service);$n++){Start-Sleep -Milliseconds 250}
            if(Service){throw 'Service still pending deletion; close Services properties and retry'}
            if($state.eventSource -and [Diagnostics.EventLog]::SourceExists($name)){Remove-EventLog -Source $name}
            Assert-Paths
            Remove-Item -LiteralPath $root -Recurse -Force
            if((Test-Path -LiteralPath $root) -or (Service)){exit 1};exit 0
        }
    }
} catch { Write-Error $_ -ErrorAction Continue; exit 2 }
