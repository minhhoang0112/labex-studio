@echo off
title LabEx Stopper
echo ==============================================
echo   Dang tat LabEx va giai phong RAM...
echo ==============================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-local.ps1"
echo.
echo Hoan tat! Cua so se dong sau 2 giay.
timeout /t 2 >nul
exit /b 0

