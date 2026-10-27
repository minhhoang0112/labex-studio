param([ValidateSet('Baseline','Inject','Faulted','Healthy','Reset')][string]$Operation,
      [ValidateSet('filelock')][string]$Scenario)
$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'CLIENT01' -or (Get-CimInstance Win32_OperatingSystem).ProductType -ne 1){throw 'Dedicated CLIENT01 required'}
$root='C:\LabEx\PracticeFaults\filelock'
$taskName='LabExSupportFileLock'
$record=Join-Path $root 'state.json'
$psExe="$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$arguments='-NoProfile -NonInteractive -ExecutionPolicy Bypass -File C:\LabEx\PracticeFaults\filelock\locker.ps1'
function Locker-Script {
    return @'
$ErrorActionPreference='Stop'
$stream=$null
try{
    $stream=[IO.File]::Open((Join-Path $PSScriptRoot 'shared.csv'),[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
    @{PID=$PID;StartedUtc=[DateTimeOffset]::UtcNow.ToString('o');Purpose='LabEx filelock'} | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'holder.json') -Encoding UTF8
    # Hard timeout protects abandoned sessions. Expiry is NOT a passing repair.
    Start-Sleep -Seconds 1800
    exit 70
}finally{if($stream){$stream.Dispose()}}
'@
}
function Assert-Paths {
    foreach($path in @('C:\LabEx','C:\LabEx\PracticeFaults',$root)){
        if((Test-Path -LiteralPath $path) -and ((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse path refused'}
    }
    if(Test-Path -LiteralPath $root){
        foreach($item in Get-ChildItem -LiteralPath $root -Force){
            if($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unexpected fixture child refused'}
        }
    }
}
function Assert-Owned {
    Assert-Paths
    $state=Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
    if($state.scenario -ne 'filelock' -or $state.version -ne 1 -or $state.run -notmatch '^[a-f0-9]{32}$'){throw 'Invalid ownership record'}
    $task=Get-ScheduledTask -TaskName $taskName
    if($task.Description -ne ('LabEx filelock '+$state.run) -or $task.Principal.UserId -notin @('SYSTEM','S-1-5-18','NT AUTHORITY\SYSTEM')){throw 'Task ownership/identity changed'}
    if(@($task.Actions).Count -ne 1 -or $task.Actions.Execute -ne $psExe -or $task.Actions.Arguments -ne $arguments){throw 'Task action changed; refusing to run or stop'}
    if((Get-Content -LiteralPath (Join-Path $root 'locker.ps1') -Raw) -cne (Locker-Script)){throw 'Locker script changed'}
    return $state
}
function Test-Exclusive {
    $stream=$null;$reader=$null
    try{
        $stream=[IO.File]::Open((Join-Path $root 'shared.csv'),[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
        $reader=[IO.StreamReader]::new($stream)
        if($reader.ReadToEnd().Trim() -cne "Order,Amount`r`n1042,2500000"){throw 'Original CSV data changed'}
        return $true
    }finally{if($reader){$reader.Dispose()};if($stream){$stream.Dispose()}}
}
try{
    Assert-Paths
    if($Operation -eq 'Baseline'){
        if((Test-Path -LiteralPath $root) -or (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)){throw 'Existing owned fixture must be reset first'}
        New-Item -ItemType Directory -Path $root | Out-Null
        @{scenario='filelock';version=1;run=[guid]::NewGuid().ToString('N');phase='baseline'} | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
        [IO.File]::WriteAllText((Join-Path $root 'shared.csv'),"Order,Amount`r`n1042,2500000`r`n",[Text.UTF8Encoding]::new($false))
        [IO.File]::WriteAllText((Join-Path $root 'locker.ps1'),(Locker-Script),[Text.UTF8Encoding]::new($false))
        $state=Get-Content -LiteralPath $record -Raw | ConvertFrom-Json
        $action=New-ScheduledTaskAction -Execute $psExe -Argument $arguments
        $principal=New-ScheduledTaskPrincipal -UserId SYSTEM -LogonType ServiceAccount
        # No recurring trigger: the fixture cannot lock files again after repair.
        Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Description ('LabEx filelock '+$state.run) | Out-Null
        exit 0
    }
    $state=Assert-Owned
    switch($Operation){
        Inject {
            if(-not(Test-Exclusive)){throw 'Baseline access failed'}
            $state.phase='injected';$state | ConvertTo-Json | Set-Content -LiteralPath $record -Encoding UTF8
            Start-ScheduledTask -TaskName $taskName
            for($n=0;$n -lt 60;$n++){
                Start-Sleep -Milliseconds 250
                if((Get-ScheduledTask -TaskName $taskName).State -eq 'Running' -and (Test-Path -LiteralPath (Join-Path $root 'holder.json'))){exit 0}
            }
            throw 'Locker did not start'
        }
        Faulted {
            if((Get-ScheduledTask -TaskName $taskName).State -ne 'Running'){throw 'Locker not running'}
            $blocked=$false
            try{$null=Test-Exclusive}catch{if(($_.Exception.GetBaseException().HResult -band 0xffff) -eq 32){$blocked=$true}else{throw}}
            if(-not $blocked){throw 'Real sharing violation was not reproduced'}
            exit 0
        }
        Healthy {
            if($state.phase -eq 'injected'){
                if((Get-ScheduledTask -TaskName $taskName).State -eq 'Running'){throw 'Locker is still running'}
                if((Get-ScheduledTaskInfo -TaskName $taskName).LastTaskResult -eq 70){throw 'Fixture expired; prepare again to practice diagnosis'}
            }
            if(-not(Test-Exclusive)){throw 'File not usable'}
            exit 0
        }
        Reset {
            if((Get-ScheduledTask -TaskName $taskName).State -eq 'Running'){
                Stop-ScheduledTask -TaskName $taskName
                for($n=0;$n -lt 40;$n++){
                    if((Get-ScheduledTask -TaskName $taskName).State -ne 'Running'){break}
                    Start-Sleep -Milliseconds 250
                }
            }
            # Don't delete a locked file or kill any process by a guessed PID.
            if(-not(Test-Exclusive)){throw 'File still locked'}
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
            Remove-Item -LiteralPath $root -Recurse -Force
            if((Test-Path -LiteralPath $root) -or (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)){throw 'Reset incomplete'}
            exit 0
        }
    }
}catch{Write-Error $_ -ErrorAction Continue;exit 1}
