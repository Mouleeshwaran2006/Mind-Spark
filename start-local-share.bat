@echo off
title Mind Spark - Local Share Server Starter
echo ===================================================
echo   🚗 MIND SPARK SMART PARKING MARKETPLACE STARTER 🚗
echo ===================================================
echo.
echo Starting full-stack local server environment...
echo.

:: Get Local IP Address
for /f "tokens=4 delims= " %%i in ('route print ^| findstr "\<0.0.0.0\>"') do set LOCAL_IP=%%i
if "%LOCAL_IP%"=="" (
    for /f "tokens=2 delims=:" %%f in ('ipconfig ^| findstr /c:"IPv4 Address"') do set LOCAL_IP=%%f
)
:: Trim whitespace
set LOCAL_IP=%LOCAL_IP: =%

echo Detected Local IP Address: %LOCAL_IP%
echo.
echo ---------------------------------------------------
echo 1. Launching Backend API Server on Port 5000...
start "Mind Spark Backend API" cmd /k "cd backend && echo Starting backend on port 5000... && npm run dev"

echo ---------------------------------------------------
echo 2. Launching Frontend Next.js Server on Port 3000...
start "Mind Spark Frontend Web" cmd /k "cd frontend && echo Starting Next.js app on port 3000... && npm run dev"

echo ---------------------------------------------------
echo Servers launched!
echo.
echo * Locally accessible at:     http://localhost:3000
echo * Wi-Fi / LAN network URL:   http://%LOCAL_IP%:3000
echo.
echo Press any key to close this launcher console...
pause > nul
