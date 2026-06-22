@echo off
title Poke Tracker - Local Server
color 0B

echo ========================================================
echo                 POKEMON TCG POCKET TRACKER
echo ========================================================
echo.
echo Memeriksa dependensi NPM...
call npm install --no-fund --no-audit

echo.
echo Memulai Next.js Development Server...
echo ========================================================
echo Buka link berikut di browser Anda: http://localhost:3000
echo ========================================================
echo (Tekan Ctrl + C untuk mematikan server)
echo.

npm run dev

pause
