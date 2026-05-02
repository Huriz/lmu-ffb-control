@echo off
cd /d "%~dp0backend"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)

echo.
echo  Installing dependencies...
call npm install --silent
echo.

for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*'} | Select-Object -First 1).IPAddress"') do set LOCAL_IP=%%i

echo  LMU Setup HUB
echo  ================================
echo  Local:   http://localhost:3001
echo  Network: http://%LOCAL_IP%:3001
echo  Host:    http://%COMPUTERNAME%:3001
echo  ================================
echo.
start "" http://localhost:3001
node index.js
pause
