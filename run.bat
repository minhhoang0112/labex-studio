@echo off
setlocal
cd /d "%~dp0"
title LabEx Local - Linux Learning
echo ========================================================
echo       LABEX LOCAL - LINUX HANDS-ON LABS
echo ========================================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 24 LTS, then try again.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
if not exist client\node_modules (
  call npm.cmd ci --prefix client
  if errorlevel 1 goto failed
)
echo Building the current frontend...
call npm.cmd run build:client
if errorlevel 1 goto failed
echo Starting the local runtime and server...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\start-local.ps1 -Restart
if errorlevel 1 goto failed
start "" "http://127.0.0.1:5000/learn"
echo.
echo ========================================================
echo  LabEx Local is READY and running!
echo  URL: http://127.0.0.1:5000/learn
echo ========================================================
echo.
echo You can keep this window open or press any key to close it.
pause
exit /b 0

:failed
echo.
echo ========================================================
echo  Startup failed. Review the error above.
echo ========================================================
pause
exit /b 1

