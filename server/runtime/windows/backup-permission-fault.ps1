param([ValidateSet('Baseline','Inject','Faulted','Healthy','Reset')][string]$Operation,
      [ValidateSet('taskacl')][string]$Scenario)
$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1){throw 'Dedicated CLIENT01 required'}
$root='C:\LabEx\PracticeFaults\taskacl'
$taskName='LabExSupportBackupAcl'
$record=Join-Path $root 'state.json'
$serviceSid='S-1-5-19' # LOCAL SERVICE; no password and no administrator token.
$psExe="$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments='-NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\LabEx\PracticeFaults\taskacl\backup.ps1'
function Assert-Paths {
    foreach($p in @('C:\LabEx','C:\LabEx\PracticeFaults',$root)){
        if((Test-Path -LiteralPath $p) -and ((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse parent refused'}
    }
    if((Test-Path -LiteralPath $root) -and @(Get-ChildItem -LiteralPath $root -Force -Recurse | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw 'Reparse fixture refused'}
}
function Backup-Script {
    return @'
$ErrorActionPreference='Stop'
try {
    Copy-Item -Path (Join-Path $PSScriptRoot 'Source\*.txt') -Destination (Join-Path $PSScriptRoot 'Backup') -Force -ErrorAction Stop
    'Backup completed' | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'Logs\last-run.txt') -Encoding UTF8
    exit 0
} catch {
    ('Identity='+[Security.Principal.WindowsIdentity]::GetCurrent().Name+'; '+$_.Exception.Message) | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'Logs\last-run.txt') -Encoding UTF8
    exit 5
}
'@
}
function Set-OwnedAcl([string]$path,[string]$serviceRights){
    $acl=[Security.AccessControl.DirectorySecurity]::new()
    $acl.SetAccessRuleProtection($true,$false)
    foreach($sid in @('S-1-5-18','S-1-5-32-544')){
        $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sid),'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
    }
    $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($serviceSid),$serviceRights,'ContainerInherit,ObjectInherit','None','Allow'))
    Set-Acl -LiteralPath $path -AclObject $acl
}
function Assert-Owned {
    Assert-Paths
    if(-not(Test-Path -LiteralPath $record -PathType Leaf)){throw 'Missing ownership record'}
    $state=Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
    if($state.scenario -ne 'taskacl' -or $state.version -ne 1 -or $state.run -notmatch '^[a-f0-9]{32}$'){throw 'Invalid ownership record'}
    $task=Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
    $sid=$task.Principal.UserId
    if($sid -ne $serviceSid){$sid=[Security.Principal.NTAccount]::new($sid).Translate([Security.Principal.SecurityIdentifier]).Value}
    if($sid -ne $serviceSid -or $task.Principal.RunLevel -ne 'Limited' -or $task.Description -ne ('LabEx taskacl '+$state.run)){throw 'Task identity/ownership changed; do not run as SYSTEM'}
    if(@($task.Actions).Count -ne 1 -or $task.Actions.Execute -ne $psExe -or $task.Actions.Arguments -ne $arguments){throw 'Task action changed'}
    if((Get-Content -LiteralPath (Join-Path $root 'backup.ps1') -Raw) -ne (Backup-Script)){throw 'Backup script changed'}
    if((Get-Content -LiteralPath (Join-Path $root 'Source\invoice.txt') -Raw).Trim() -ne 'Finance document: keep this source unchanged during repair.'){throw 'Source data changed'}
    return $state
}
function Run-Backup {
    $null=Assert-Owned
    $before=(Get-ScheduledTaskInfo -TaskName $taskName).LastRunTime
    if(((Get-Date)-$before).TotalSeconds -lt 1.1){Start-Sleep -Milliseconds 1100}
    Start-ScheduledTask -TaskName $taskName
    for($n=0;$n -lt 100;$n++){
        Start-Sleep -Milliseconds 250
        $info=Get-ScheduledTaskInfo -TaskName $taskName
        if($info.LastRunTime -gt $before -and (Get-ScheduledTask -TaskName $taskName).State -ne 'Running'){
            return [int64]$info.LastTaskResult
        }
    }
    throw 'Task did not complete a fresh run within 25 seconds'
}
function Same-File([string]$name){
    $a=Join-Path $root ('Source\'+$name);$b=Join-Path $root ('Backup\'+$name)
    return (Test-Path -LiteralPath $b -PathType Leaf) -and (Get-FileHash -LiteralPath $a).Hash -eq (Get-FileHash -LiteralPath $b).Hash
}
try {
    Assert-Paths
    if($Operation -eq 'Baseline'){
        if((Test-Path -LiteralPath $root) -or (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)){throw 'Existing fixture/task; reset the owning session first'}
        New-Item -ItemType Directory -Path $root | Out-Null
        foreach($name in @('Source','Backup','Logs')){New-Item -ItemType Directory -Path (Join-Path $root $name) | Out-Null}
        $state=@{scenario='taskacl';version=1;run=[guid]::NewGuid().ToString('N')}
        $state | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
        Set-OwnedAcl $root 'ReadAndExecute'
        Set-OwnedAcl (Join-Path $root 'Source') 'ReadAndExecute'
        Set-OwnedAcl (Join-Path $root 'Backup') 'Modify'
        Set-OwnedAcl (Join-Path $root 'Logs') 'Modify'
        [IO.File]::WriteAllText((Join-Path $root 'backup.ps1'),(Backup-Script),[Text.UTF8Encoding]::new($false))
        'Finance document: keep this source unchanged during repair.' | Set-Content -LiteralPath (Join-Path $root 'Source\invoice.txt') -Encoding UTF8
        $action=New-ScheduledTaskAction -Execute $psExe -Argument $arguments
        $principal=New-ScheduledTaskPrincipal -UserId 'NT AUTHORITY\LOCAL SERVICE' -LogonType ServiceAccount -RunLevel Limited
        Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Trigger (New-ScheduledTaskTrigger -Daily -At '09:00') -Description ('LabEx taskacl '+$state.run) | Out-Null
        exit 0
    }
    $state=Assert-Owned
    switch($Operation){
        Inject {
            # The task stays enabled. Remove only its write grant on this lab's destination.
            Set-OwnedAcl (Join-Path $root 'Backup') 'ReadAndExecute'
            Remove-Item -LiteralPath (Join-Path $root 'Backup\invoice.txt') -Force -ErrorAction SilentlyContinue
            if((Run-Backup) -ne 5){throw 'Access-denied symptom was not reproduced'}
            exit 0
        }
        Faulted {
            $info=Get-ScheduledTaskInfo -TaskName $taskName
            $log=Get-Content -LiteralPath (Join-Path $root 'Logs\last-run.txt') -Raw
            if((Get-ScheduledTask -TaskName $taskName).State -ne 'Disabled' -and $info.LastTaskResult -eq 5 -and $log -match 'Identity=' -and -not(Test-Path -LiteralPath (Join-Path $root 'Backup\invoice.txt'))){exit 0}
            exit 1
        }
        Healthy {
            # Reject broad privilege grants and shortcut changes to the principal/action.
            $acl=Get-Acl -LiteralPath (Join-Path $root 'Backup')
            foreach($ace in $acl.Access){
                $sid=$ace.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
                if($ace.AccessControlType -eq 'Allow' -and $sid -notin @('S-1-5-18','S-1-5-32-544',$serviceSid) -and ($ace.FileSystemRights -band [Security.AccessControl.FileSystemRights]::Write)){exit 1}
                if($sid -eq $serviceSid -and $ace.AccessControlType -eq 'Allow' -and ($ace.FileSystemRights -band [Security.AccessControl.FileSystemRights]::ChangePermissions)){exit 1}
            }
            # Fresh content prevents a manually copied old invoice from certifying the repair.
            $name='probe-'+[guid]::NewGuid().ToString('N')+'.txt'
            $source=Join-Path $root ('Source\'+$name);$dest=Join-Path $root ('Backup\'+$name)
            try{
                [guid]::NewGuid().ToString('N') | Set-Content -LiteralPath $source -Encoding UTF8
                if((Run-Backup) -eq 0 -and (Same-File 'invoice.txt') -and (Same-File $name)){exit 0}
                exit 1
            } finally {
                Remove-Item -LiteralPath $source -Force -ErrorAction SilentlyContinue
                Remove-Item -LiteralPath $dest -Force -ErrorAction SilentlyContinue
            }
        }
        Reset {
            Stop-ScheduledTask -TaskName $taskName
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
            Assert-Paths
            Remove-Item -LiteralPath $root -Recurse -Force
            if((Test-Path -LiteralPath $root) -or (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)){exit 1}
            exit 0
        }
    }
} catch {Write-Error $_ -ErrorAction Continue;exit 1}
