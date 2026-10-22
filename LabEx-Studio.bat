@echo off
title LabEx Studio - Management Console
color 0B
cd /d "%~dp0"

echo ================================================================
echo                   LABEX STUDIO - IT SUPPORT
echo ================================================================
echo [*] Dang khoi dong may chu LabEx local...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"

echo.
echo [*] Dang mo trinh duyet hoc tap...
start http://127.0.0.1:5000/learn

echo.
echo ================================================================
echo   [OK] HE THONG DANG HOAT DONG SAN SANG!
echo.
echo   * Dia chi hoc tap: http://127.0.0.1:5000/learn
echo   * Cua so nay giu ket noi may chu va kiem soat tien trinh.
echo.
echo   [!] HUONG DAN KHI HOC XONG:
echo       Hay nhan bat ky phim nao (hoac bam Enter) vao cua so nay
echo       de TAT MAY CHU va GIAI PHONG RAM!
echo ================================================================
echo.
pause

echo.
echo [*] Dang tat may chu LabEx va giai phong RAM...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-local.ps1"
echo [OK] May chu da tat thanh cong, RAM da duoc giai phong!
ping 127.0.0.1 -n 3 >nul
exit /b 0
