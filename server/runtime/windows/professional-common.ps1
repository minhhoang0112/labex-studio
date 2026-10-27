# Trusted probes only. Never execute learner scripts or extract learner archives.
function Assert-ProWorkspace {
    if($labRoot -notmatch '^C:\\LabEx\\Labs\\win-(bkr|web)-[a-z0-9-]+$'){throw 'Invalid professional workspace'}
    foreach($path in @('C:\LabEx','C:\LabEx\Labs',$labRoot)){
        if((Test-Path -LiteralPath $path) -and ((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse path refused'}
    }
    if(-not(Test-Path -LiteralPath $labRoot -PathType Container)){throw 'Workspace missing'}
    $count=0
    $pending=[Collections.Generic.Stack[string]]::new();$pending.Push($labRoot)
    while($pending.Count){
        foreach($item in Get-ChildItem -LiteralPath $pending.Pop() -Force){
            if(++$count -gt 1000){throw 'Fixture too large'}
            if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse item refused'}
            if($item.PSIsContainer){$pending.Push($item.FullName)}
        }
    }
}
function Test-ProText([string]$relative,[string]$expected){
    $path=Join-Path $labRoot $relative
    return (Test-Path -LiteralPath $path -PathType Leaf) -and (Get-Item -LiteralPath $path).Length -le 1048576 -and (Get-Content -LiteralPath $path -Raw).Trim() -ceq $expected
}
function Test-ProSame([string]$first,[string]$second){
    $a=Join-Path $labRoot $first;$b=Join-Path $labRoot $second
    return (Test-Path -LiteralPath $a -PathType Leaf) -and (Test-Path -LiteralPath $b -PathType Leaf) -and (Get-Item -LiteralPath $a).Length -le 1048576 -and (Get-Item -LiteralPath $b).Length -le 1048576 -and (Get-FileHash -LiteralPath $a).Hash -eq (Get-FileHash -LiteralPath $b).Hash
}
function Test-ProJsonPort([string]$relative,[int]$port){
    $path=Join-Path $labRoot $relative
    if(-not(Test-Path -LiteralPath $path -PathType Leaf) -or (Get-Item -LiteralPath $path).Length -gt 4096){return $false}
    $data=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    return $data.Port -is [int] -and $data.Port -eq $port -and $data.Department -ceq 'Finance'
}
function Test-ProArchive {
    $path=Join-Path $labRoot 'good.zip'
    if(-not(Test-Path -LiteralPath $path -PathType Leaf) -or (Get-Item -LiteralPath $path).Length -gt 1048576){return $false}
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip=$null;$reader=$null
    try{
        $zip=[IO.Compression.ZipFile]::OpenRead($path)
        if($zip.Entries.Count -ne 1 -or $zip.Entries[0].FullName -cne 'handover.txt' -or $zip.Entries[0].Length -gt 4096){return $false}
        $reader=[IO.StreamReader]::new($zip.Entries[0].Open())
        return $reader.ReadToEnd().Trim() -ceq 'Recovery document: revision 7'
    }finally{if($reader){$reader.Dispose()};if($zip){$zip.Dispose()}}
}
function Test-ProDamagedArchive {
    $path=Join-Path $labRoot 'damaged.zip'
    if(-not(Test-Path -LiteralPath $path -PathType Leaf) -or (Get-Item -LiteralPath $path).Length -ne 4){return $false}
    return [Convert]::ToBase64String([IO.File]::ReadAllBytes($path)) -ceq 'UEsDBA=='
}
function Test-ProHttp([string]$uri,[string]$expected){
    # Fixed localhost URLs supplied by trusted rules; no browser-controlled URL.
    $response=Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec 8 -MaximumRedirection 0
    return $response.StatusCode -eq 200 -and $response.Content.Trim() -ceq $expected
}
function Test-ProWebsite {
    $site=Get-Website -Name 'LabExCoursePortal'
    $pool=Get-Item 'IIS:\AppPools\LabExCoursePortal'
    if($site.State -ne 'Started' -or $site.PhysicalPath -ne (Join-Path $labRoot 'site') -or $site.ApplicationPool -ne 'LabExCoursePortal' -or [int]$pool.processModel.identityType -ne 4){return $false}
    if(@($site.Bindings.Collection).Count -ne 1 -or $site.Bindings.Collection[0].protocol -ne 'http' -or $site.Bindings.Collection[0].bindingInformation -ne '127.0.0.1:18081:'){return $false}
    $anonymous=Get-WebConfigurationProperty -PSPath 'IIS:\' -Location 'LabExCoursePortal' -Filter 'system.webServer/security/authentication/anonymousAuthentication' -Name userName
    if([string]$anonymous.Value -ne ''){return $false}
    $poolSid=[Security.Principal.NTAccount]::new('IIS APPPOOL\LabExCoursePortal').Translate([Security.Principal.SecurityIdentifier]).Value
    $hasRead=$false
    $writeMask=[Security.AccessControl.FileSystemRights]::Write -bor [Security.AccessControl.FileSystemRights]::Delete -bor [Security.AccessControl.FileSystemRights]::ChangePermissions -bor [Security.AccessControl.FileSystemRights]::TakeOwnership
    foreach($ace in (Get-Acl -LiteralPath (Join-Path $labRoot 'site')).Access){
        if($ace.AccessControlType -ne 'Allow'){continue}
        $sid=$ace.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
        if($sid -in @($poolSid,'S-1-1-0','S-1-5-11','S-1-5-32-545') -and ($ace.FileSystemRights -band $writeMask)){return $false}
        if($sid -eq $poolSid -and ($ace.FileSystemRights -band [Security.AccessControl.FileSystemRights]::ReadAndExecute) -eq [Security.AccessControl.FileSystemRights]::ReadAndExecute){$hasRead=$true}
    }
    if(-not $hasRead){return $false}
    return Test-ProHttp 'http://127.0.0.1:18081/index.html' '<h1>Finance portal revision 1</h1>'
}
