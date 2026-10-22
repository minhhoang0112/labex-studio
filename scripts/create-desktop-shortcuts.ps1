$wsh = New-Object -ComObject WScript.Shell
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    'C:\Users\HP VICTUS\Desktop'
) | Select-Object -Unique

$workspace = 'D:\Project\LabEx'

foreach ($desk in $desktopPaths) {
    if (Test-Path $desk) {
        # 1. Start LabEx Shortcut
        $startLnk = Join-Path $desk 'LabEx - Hoc Tap.lnk'
        $shortcut = $wsh.CreateShortcut($startLnk)
        $shortcut.TargetPath = 'powershell.exe'
        $shortcut.Arguments = '-WindowStyle Hidden -ExecutionPolicy Bypass -Command "& ''D:\Project\LabEx\scripts\start-local.ps1''; Start-Sleep -Seconds 1; Start-Process ''http://127.0.0.1:5000/learn''"'
        $shortcut.WorkingDirectory = $workspace
        $shortcut.Description = 'Khoi dong LabEx va mo trinh duyet hoc tap'
        $shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,14" # Globe / Network icon
        $shortcut.Save()

        # 2. Stop LabEx Shortcut
        $stopLnk = Join-Path $desk 'LabEx - Tat Server (Giai phong RAM).lnk'
        $stopShortcut = $wsh.CreateShortcut($stopLnk)
        $stopShortcut.TargetPath = 'powershell.exe'
        $stopShortcut.Arguments = '-WindowStyle Hidden -ExecutionPolicy Bypass -File ''D:\Project\LabEx\scripts\stop-local.ps1'''
        $stopShortcut.WorkingDirectory = $workspace
        $stopShortcut.Description = 'Tat may chu LabEx de giai phong RAM'
        $stopShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,27" # Stop / Power icon
        $stopShortcut.Save()
    }
}

Write-Host "Created Desktop shortcuts successfully!" -ForegroundColor Green

