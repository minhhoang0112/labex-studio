param([ValidateSet('Baseline','Inject','Faulted','Healthy','Reset')][string]$Operation,
      [ValidateSet('useracl')][string]$Scenario)
$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1){throw 'Dedicated CLIENT01 required'}
$root='C:\LabEx\PracticeFaults\useracl'
$documents=Join-Path $root 'Documents'
$private=Join-Path $root 'Private'
$record=Join-Path $private 'state.json'
$names=@('LabExWriterV2','LabExVisitorV2')
Add-Type -AssemblyName System.Security
function Assert-Paths {
    foreach($p in @('C:\LabEx','C:\LabEx\PracticeFaults',$root)){
        if((Test-Path -LiteralPath $p) -and ((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse parent refused'}
    }
    if(Test-Path -LiteralPath $root){
        # Walk one level at a time; never traverse a discovered junction.
        $pending=[Collections.Generic.Queue[string]]::new();$pending.Enqueue($root)
        while($pending.Count){
            foreach($item in Get-ChildItem -LiteralPath $pending.Dequeue() -Force){
                if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse fixture refused'}
                if($item.PSIsContainer){$pending.Enqueue($item.FullName)}
                elseif($item.PSProvider.Name -ne 'FileSystem'){throw 'Unexpected provider'}
            }
        }
    }
}
function Set-LabAcl([string]$path,[hashtable]$grants){
    $acl=[Security.AccessControl.DirectorySecurity]::new();$acl.SetAccessRuleProtection($true,$false)
    $acl.SetOwner([Security.Principal.SecurityIdentifier]::new('S-1-5-32-544'))
    foreach($sid in @('S-1-5-18','S-1-5-32-544')){
        $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sid),'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
    }
    foreach($sid in $grants.Keys){
        $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sid),$grants[$sid],'ContainerInherit,ObjectInherit','None','Allow'))
    }
    Set-Acl -LiteralPath $path -AclObject $acl
}
function Save-State { $state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $record -Encoding UTF8 }
function Protect-Password([string]$password){
    return [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($password),$null,[Security.Cryptography.DataProtectionScope]::LocalMachine))
}
function Read-Password($entry){
    return [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($entry.secret),$null,[Security.Cryptography.DataProtectionScope]::LocalMachine))
}
function Read-Owned {
    if(-not(Test-Path -LiteralPath $record -PathType Leaf)){throw 'Missing ownership journal; do not delete unowned resources'}
    $s=Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
    if($s.scenario -ne 'useracl' -or $s.version -ne 1 -or $s.run -notmatch '^[a-f0-9]{32}$' -or @($s.users).Count -ne 2){throw 'Invalid ownership journal'}
    for($i=0;$i -lt 2;$i++){
        if($s.users[$i].name -ne $names[$i]){throw 'Unexpected user in journal'}
        $u=Get-LocalUser -Name $names[$i] -ErrorAction SilentlyContinue
        if($u -and ($u.Description -ne ('LabEx useracl '+$s.run) -or ($s.users[$i].sid -and $u.SID.Value -ne $s.users[$i].sid))){throw 'User ownership changed'}
    }
    return $s
}
function Assert-Users {
    foreach($entry in $state.users){
        $u=Get-LocalUser -Name $entry.name
        if(-not $u.Enabled -or $u.SID.Value -ne $entry.sid){throw 'Lab user missing/disabled/replaced'}
        # Deny shortcut group elevation, including non-Administrators operator groups.
        foreach($g in Get-LocalGroup){
            if($g.SID.Value -ne 'S-1-5-32-545' -and @(Get-LocalGroupMember -SID $g.SID | Where-Object {$_.SID.Value -eq $entry.sid}).Count){throw 'Lab user added to an unexpected group'}
        }
    }
}
function Test-User([int]$index,[string]$mode){
    if(-not('LabExNtfsProbe' -as [type])){Add-Type -TypeDefinition ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__LABEX_NTFS_PROBE_B64__')))}
    $entry=$state.users[$index]
    return [LabExNtfsProbe]::Test($entry.name,(Read-Password $entry),$entry.sid,$documents,$mode)
}
function Assert-Reference {
    if([IO.File]::ReadAllText((Join-Path $documents 'reference.txt')).Trim() -ne 'Department reference - preserve this original.'){throw 'Original reference data changed'}
}
function Test-LeastPrivilege {
    # Check every existing child too: broad grants on individual files cannot bypass directory checks.
    foreach($p in @($documents)+@(Get-ChildItem -LiteralPath $documents -Recurse -Force | ForEach-Object {$_.FullName})){
        $acl=Get-Acl -LiteralPath $p
        foreach($ace in $acl.Access){
            if($ace.AccessControlType -ne 'Allow'){continue}
            $sid=$ace.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
            if($sid -notin @('S-1-5-18','S-1-5-32-544',$state.users[0].sid)){return $false}
            if($sid -eq $state.users[0].sid -and ($ace.FileSystemRights -band ([Security.AccessControl.FileSystemRights]::ChangePermissions -bor [Security.AccessControl.FileSystemRights]::TakeOwnership))){return $false}
        }
    }
    return $true
}
try {
    Assert-Paths
    if($Operation -eq 'Reset' -and -not(Test-Path -LiteralPath $root)){
        if(@($names | ForEach-Object {Get-LocalUser -Name $_ -ErrorAction SilentlyContinue}).Count){throw 'Users exist without journal'}
        exit 0
    }
    if($Operation -eq 'Baseline'){
        if((Test-Path -LiteralPath $root) -or @($names | ForEach-Object {Get-LocalUser -Name $_ -ErrorAction SilentlyContinue}).Count){throw 'Existing fixture/users; reset owned session first'}
        New-Item -ItemType Directory -Path $root | Out-Null
        Set-LabAcl $root @{}
        New-Item -ItemType Directory -Path $private | Out-Null
        Set-LabAcl $private @{}
        $state=@{scenario='useracl';version=1;run=[guid]::NewGuid().ToString('N');users=@()}
        foreach($name in $names){$state.users+=@{name=$name;sid=$null;secret=(Protect-Password ('Lx!9a'+[guid]::NewGuid().ToString('N')))}}
        Save-State # Persist intent before creating users; permits safe partial-setup recovery.
        foreach($entry in $state.users){
            $u=New-LocalUser -Name $entry.name -Password (ConvertTo-SecureString (Read-Password $entry) -AsPlainText -Force) -Description ('LabEx useracl '+$state.run) -AccountExpires (Get-Date).AddDays(2) -UserMayNotChangePassword
            $entry.sid=$u.SID.Value;Save-State
            Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $u
        }
        $readers=@{};foreach($entry in $state.users){$readers[$entry.sid]='ReadAndExecute'}
        Set-LabAcl $root $readers
        New-Item -ItemType Directory -Path $documents | Out-Null
        $writer=@{};$writer[$state.users[0].sid]='Modify';Set-LabAcl $documents $writer
        [IO.File]::WriteAllText((Join-Path $documents 'reference.txt'),'Department reference - preserve this original.')
        # This file is readable only by the administrator teaching the lab, never returned through the API/log.
        @('Temporary lab users; expire in 2 days. Reset and prepare again if expired.','Do not use these credentials outside this disposable lab.')+@($state.users | ForEach-Object {$_.name+' : '+(Read-Password $_)}) | Set-Content -LiteralPath (Join-Path $private 'credentials.txt') -Encoding UTF8
        [IO.File]::WriteAllText((Join-Path $root 'editor.ps1'),[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__LABEX_NTFS_EDITOR_B64__')),[Text.UTF8Encoding]::new($true))
        foreach($entry in $state.users){
            ('@echo off'+"`r`n"+'runas /user:CLIENT01\'+$entry.name+' "powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File C:\LabEx\PracticeFaults\useracl\editor.ps1"') | Set-Content -LiteralPath (Join-Path $root ($entry.name+'.cmd')) -Encoding ASCII
        }
        exit 0
    }
    $state=Read-Owned
    if($Operation -eq 'Reset'){
        foreach($process in Get-CimInstance Win32_Process){
            $owner=Invoke-CimMethod -InputObject $process -MethodName GetOwnerSid -ErrorAction SilentlyContinue
            if($owner.Sid -in @($state.users | ForEach-Object {$_.sid} | Where-Object {$_})){
                throw 'Close applications running under the two lab users before resetting; no user processes are terminated automatically'
            }
        }
        # No profile deletion: only accounts marked with this exact run ID and owned workspace.
        foreach($entry in $state.users){
            $u=Get-LocalUser -Name $entry.name -ErrorAction SilentlyContinue
            if($u){Remove-LocalUser -SID $u.SID}
        }
        Assert-Paths
        if([IO.Path]::GetFullPath($root) -cne 'C:\LabEx\PracticeFaults\useracl'){throw 'Unexpected delete target'}
        Remove-Item -LiteralPath $root -Recurse -Force
        exit 0
    }
    Assert-Users;Assert-Reference
    switch($Operation){
        Inject { $writer=@{};$writer[$state.users[0].sid]='ReadAndExecute';Set-LabAcl $documents $writer;exit 0 }
        Faulted { if((Test-User 0 'readonly') -and (Test-User 1 'outsider')){exit 0};exit 1 }
        Healthy { if((Test-LeastPrivilege) -and (Test-User 0 'writer') -and (Test-User 1 'outsider')){exit 0};exit 1 }
    }
} catch { Write-Error $_ -ErrorAction Continue;exit 2 }
