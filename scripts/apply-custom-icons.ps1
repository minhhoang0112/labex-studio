$wsh = New-Object -ComObject WScript.Shell
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    'C:\Users\HP VICTUS\Desktop'
) | Select-Object -Unique

$labexIco = 'D:\Project\LabEx\client\public\labex.ico'
$openquizIco = 'D:\Project\openquiz\public\openquiz.ico'

foreach ($desk in $desktopPaths) {
    if (Test-Path $desk) {
        # Update LabEx Studio shortcut
        $labexLnk = Join-Path $desk 'LabEx Studio.lnk'
        if (Test-Path $labexLnk) {
            $sc1 = $wsh.CreateShortcut($labexLnk)
            $sc1.IconLocation = "$labexIco,0"
            $sc1.Save()
            Write-Host "Updated LabEx Studio icon at $desk" -ForegroundColor Green
        }

        # Update OpenQuiz shortcut
        $openquizLnk = Join-Path $desk 'OpenQuiz.lnk'
        if (Test-Path $openquizLnk) {
            $sc2 = $wsh.CreateShortcut($openquizLnk)
            $sc2.IconLocation = "$openquizIco,0"
            $sc2.Save()
            Write-Host "Updated OpenQuiz icon at $desk" -ForegroundColor Green
        }
    }
}

# Tell Windows Explorer to refresh desktop icon cache
try {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class ShellNotify {
    [DllImport("shell32.dll")]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
"@
    [ShellNotify]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
    Write-Host "Notified Windows Explorer to refresh desktop cache!" -ForegroundColor Green
} catch {
    # Fallback if shell32 type already defined
}
