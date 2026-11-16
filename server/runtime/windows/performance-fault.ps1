param([ValidateSet('Baseline','Inject','Faulted','Healthy','Reset')][string]$Operation,
      [ValidateSet('cpuincident')][string]$Scenario)
$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1){throw 'Dedicated CLIENT01 required'}
$root='C:\LabEx\PracticeFaults\cpuincident'
$record=Join-Path $root 'state.json'
$roles=@('worker','helper')
$tasks=@{worker='LabExCpuIncidentWorker';helper='LabExCpuIncidentHelper'}
$executables=@{worker='LabExIndexWorker.exe';helper='LabExNotesHelper.exe'}
function Assert-Paths {
    foreach($p in @('C:\LabEx','C:\LabEx\PracticeFaults',$root)){
        if((Test-Path -LiteralPath $p) -and ((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse parent refused'}
    }
    if(Test-Path -LiteralPath $root){foreach($item in Get-ChildItem -LiteralPath $root -Force){
        if($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unexpected fixture child'}
    }}
}
function Save-State {$state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $record -Encoding UTF8}
function Read-Owned {
    $s=Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
    if($s.scenario -ne 'cpuincident' -or $s.version -ne 1 -or $s.run -notmatch '^[a-f0-9]{32}$'){throw 'Invalid ownership journal'}
    foreach($role in $roles){
        $task=Get-ScheduledTask -TaskName $tasks[$role] -ErrorAction SilentlyContinue
        if($task){
            if($task.Description -ne ('LabEx cpuincident '+$s.run) -or $task.Principal.UserId -notin @('SYSTEM','S-1-5-18','NT AUTHORITY\SYSTEM')){throw 'Task ownership changed'}
            if(@($task.Actions).Count -ne 1 -or $task.Actions.Execute -ne (Join-Path $root $executables[$role]) -or $task.Actions.Arguments -ne $role){throw 'Task action changed'}
        } elseif($Operation -ne 'Reset'){throw 'Missing owned task'}
    }
    return $s
}
function Owned-Process([string]$role){
    $file=Join-Path $root ($role+'.pid')
    if(-not(Test-Path -LiteralPath $file)){return $null}
    $parts=([IO.File]::ReadAllText($file)).Split('|')
    if($parts.Count -ne 2 -or $parts[0] -notmatch '^\d+$' -or $parts[1] -notmatch '^\d+$'){throw 'Invalid process identity record'}
    $p=Get-Process -Id ([int]$parts[0]) -ErrorAction SilentlyContinue
    if(-not $p){return $null}
    # A reused PID is not our process; never stop it by PID alone.
    if($p.StartTime.ToUniversalTime().Ticks -ne [long]$parts[1]){return $null}
    if($p.Path -ne (Join-Path $root $executables[$role])){throw 'Unexpected process path'}
    return $p
}
function Wait-Started([string]$role){
    for($n=0;$n -lt 40;$n++){
        Start-Sleep -Milliseconds 250
        $p=Owned-Process $role
        if($p){return $p}
    }
    throw 'Task process did not start'
}
function Helper-Works {
    $p=Owned-Process 'helper'
    if(-not $p -or $p.StartTime.ToUniversalTime().Ticks -ne [long]$state.helperStarted){return $false}
    $nonce=[guid]::NewGuid().ToString('N')
    [IO.File]::WriteAllText((Join-Path $root 'request.txt'),$nonce)
    for($n=0;$n -lt 24;$n++){
        Start-Sleep -Milliseconds 250
        try{if([IO.File]::ReadAllText((Join-Path $root 'response.txt')) -ceq ('OK|'+$nonce)){return $true}}catch [IO.IOException]{}
    }
    return $false
}
function Cpu-Sample($p){
    $before=$p.TotalProcessorTime.TotalSeconds;$watch=[Diagnostics.Stopwatch]::StartNew()
    Start-Sleep -Seconds 3;$p.Refresh()
    if($p.HasExited){throw 'Process exited during measurement'}
    return ($p.TotalProcessorTime.TotalSeconds-$before)/$watch.Elapsed.TotalSeconds
}
try {
    Assert-Paths
    if($Operation -eq 'Reset' -and -not(Test-Path -LiteralPath $root)){
        if(@($roles | ForEach-Object {Get-ScheduledTask -TaskName $tasks[$_] -ErrorAction SilentlyContinue}).Count){throw 'Tasks exist without journal'}
        exit 0
    }
    if($Operation -eq 'Baseline'){
        if((Test-Path -LiteralPath $root) -or @($roles | ForEach-Object {Get-ScheduledTask -TaskName $tasks[$_] -ErrorAction SilentlyContinue}).Count){throw 'Existing fixture/tasks; reset owning session first'}
        New-Item -ItemType Directory -Path $root | Out-Null
        $acl=[Security.AccessControl.DirectorySecurity]::new();$acl.SetAccessRuleProtection($true,$false)
        foreach($sid in @('S-1-5-18','S-1-5-32-544')){$acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sid),'FullControl','ContainerInherit,ObjectInherit','None','Allow'))}
        Set-Acl -LiteralPath $root -AclObject $acl
        $state=@{scenario='cpuincident';version=1;run=[guid]::NewGuid().ToString('N');phase='baseline';boot=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToUniversalTime().Ticks;helperStarted=0;deadline=$null;hash=$null;cpuBefore=$null}
        Save-State
        Add-Type -TypeDefinition ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__LABEX_PERF_SOURCE_B64__'))) -OutputAssembly (Join-Path $root $executables.worker) -OutputType WindowsApplication
        Copy-Item -LiteralPath (Join-Path $root $executables.worker) -Destination (Join-Path $root $executables.helper)
        $state.hash=(Get-FileHash -LiteralPath (Join-Path $root $executables.worker)).Hash;Save-State
        [IO.File]::WriteAllText((Join-Path $root 'notes.txt'),'Unrelated work: preserve these notes and the helper process.')
        foreach($role in $roles){
            $action=New-ScheduledTaskAction -Execute (Join-Path $root $executables[$role]) -Argument $role
            $principal=New-ScheduledTaskPrincipal -UserId SYSTEM -LogonType ServiceAccount
            $settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 46) -MultipleInstances IgnoreNew
            Register-ScheduledTask -TaskName $tasks[$role] -Action $action -Principal $principal -Settings $settings -Description ('LabEx cpuincident '+$state.run) | Out-Null
        }
        Start-ScheduledTask -TaskName $tasks.helper
        $p=Wait-Started 'helper';$state.helperStarted=$p.StartTime.ToUniversalTime().Ticks;Save-State
        exit 0
    }
    $state=Read-Owned
    if($Operation -eq 'Reset'){
        foreach($role in $roles){
            # Validate identity before asking Task Scheduler to stop the owned task.
            $null=Owned-Process $role
            $task=Get-ScheduledTask -TaskName $tasks[$role] -ErrorAction SilentlyContinue
            if($task){Stop-ScheduledTask -TaskName $tasks[$role]}
            for($n=0;$n -lt 40;$n++){if(-not(Owned-Process $role)){break};Start-Sleep -Milliseconds 250}
            if(Owned-Process $role){throw 'Owned process still running; reset incomplete'}
            if($task){Unregister-ScheduledTask -TaskName $tasks[$role] -Confirm:$false}
        }
        Assert-Paths
        if([IO.Path]::GetFullPath($root) -cne 'C:\LabEx\PracticeFaults\cpuincident'){throw 'Unexpected cleanup target'}
        Remove-Item -LiteralPath $root -Recurse -Force
        exit 0
    }
    foreach($role in $roles){if((Get-FileHash -LiteralPath (Join-Path $root $executables[$role])).Hash -ne $state.hash){throw 'Lab executable changed'}}
    if([IO.File]::ReadAllText((Join-Path $root 'notes.txt')) -cne 'Unrelated work: preserve these notes and the helper process.'){throw 'Unrelated work changed'}
    switch($Operation){
        Inject {
            $state.phase='injected';$state.deadline=[DateTimeOffset]::UtcNow.AddMinutes(30).ToString('o');Save-State
            Start-ScheduledTask -TaskName $tasks.worker
            $p=Wait-Started 'worker';$state.cpuBefore=Cpu-Sample $p;Save-State
            exit 0
        }
        Faulted {
            $p=Owned-Process 'worker'
            if(-not $p -or -not(Helper-Works)){exit 1}
            $rate=Cpu-Sample $p
            # Core-seconds/sec, NOT Task Manager's machine-wide percentage.
            if($rate -lt 0.08){throw 'CPU symptom too weak to teach reliably on this VM; reset and try later'}
            exit 0
        }
        Healthy {
            if(-not(Helper-Works)){exit 1}
            if($state.phase -eq 'injected'){
                if((Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToUniversalTime().Ticks -ne [long]$state.boot){exit 1}
                if([DateTimeOffset]::UtcNow -ge [DateTimeOffset]::Parse($state.deadline)){exit 1}
                if((Get-ScheduledTaskInfo -TaskName $tasks.worker).LastTaskResult -eq 70){exit 1}
                if(Owned-Process 'worker'){exit 1}
                # Confirm absence across an observation window and a fresh helper response.
                Start-Sleep -Seconds 3
                if((Owned-Process 'worker') -or -not(Helper-Works)){exit 1}
            }
            exit 0
        }
    }
} catch {Write-Error $_ -ErrorAction Continue;exit 2}
