@echo off
title LabEx Launcher
echo ==============================================
echo   Dang khoi dong LabEx Studio...
echo ==============================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"
echo.
echo Dang mo trinh duyet...
start http://127.0.0.1:5000/learn
timeout /t 2 >nul
exit /b 0

