$wsh = New-Object -ComObject WScript.Shell
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    'C:\Users\HP VICTUS\Desktop'
) | Select-Object -Unique

$workspace = 'D:\Project\LabEx'
$batTarget = Join-Path $workspace 'LabEx-Studio.bat'

foreach ($desk in $desktopPaths) {
    if (Test-Path $desk) {
        # 1. Remove old split shortcuts if they exist
        $oldStart = Join-Path $desk 'LabEx - Hoc Tap.lnk'
        $oldStop = Join-Path $desk 'LabEx - Tat Server (Giai phong RAM).lnk'
        if (Test-Path $oldStart) { Remove-Item -LiteralPath $oldStart -Force -ErrorAction SilentlyContinue }
        if (Test-Path $oldStop) { Remove-Item -LiteralPath $oldStop -Force -ErrorAction SilentlyContinue }

        # 2. Create single unified LabEx Studio shortcut
        $unifiedLnk = Join-Path $desk 'LabEx Studio.lnk'
        $shortcut = $wsh.CreateShortcut($unifiedLnk)
        $shortcut.TargetPath = $batTarget
        $shortcut.WorkingDirectory = $workspace
        $shortcut.Description = 'Khoi dong LabEx Studio va quan ly vong doi server'
        $shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,14" # Network / Globe workstation icon
        $shortcut.Save()
    }
}

Write-Host "[OK] Unified Desktop shortcut 'LabEx Studio' created successfully!" -ForegroundColor Green
