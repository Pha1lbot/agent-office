@echo off
rem Agent Office launcher. Double-click to open the office.
rem Installs what's needed, starts the office and opens it in your browser.
rem Close this window (or press Ctrl+C) to close the office.
title Agent Office
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org and try again.
  pause
  exit /b 1
)

rem Already open? Then just show it.
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://127.0.0.1:4747/api/state | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo The office is already open.
  start "" http://127.0.0.1:4747
  exit /b 0
)

echo Getting the latest from GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\tools\sync.ps1"

echo Checking everything is installed...
call npm.cmd install --no-audit --no-fund --loglevel=error
if errorlevel 1 (
  echo.
  echo Install failed. Check your internet connection, then try again.
  pause
  exit /b 1
)

rem Open the browser as soon as the office is ready (waits up to 30 seconds).
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 30; $i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://127.0.0.1:4747/api/state | Out-Null; Start-Process 'http://127.0.0.1:4747'; break } catch { Start-Sleep 1 } }"

call npm.cmd start
echo.
echo The office has closed.
pause
