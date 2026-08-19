@echo off
REM =====================================================
REM  Launch Chrome Automation Profile (Job Hunt)
REM =====================================================

echo Menyiapkan Profil Khusus Job Hunting...
echo (Ini diperlukan karena Chrome versi 136+ memblokir otomatisasi di Profil Utama demi keamanan)

REM Tutup instance automation jika ada yang nyangkut
taskkill /F /FI "WINDOWTITLE eq Chrome Automation*" /IM chrome.exe >nul 2>&1

REM Path untuk profil khusus automation
set "AUTO_PROFILE=%LOCALAPPDATA%\Google\Chrome\JobHuntProfile"

echo.
echo Membuka Chrome...
start "Chrome Automation" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --user-data-dir="%AUTO_PROFILE%" ^
  --remote-debugging-port=9222 ^
  --no-first-run ^
  --no-default-browser-check

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  SUKSES! Chrome Automation sudah terbuka!
echo  Port Remote Debugging: 9222
echo ========================================
echo.
echo PENTING UNTUK PERTAMA KALI:
echo Karena ini profil baru yang aman, silakan login DULU ke:
echo 1. Google Docs (untuk baca motivational letter)
echo 2. LinkedIn / Jobstreet / hiring.cafe
echo (Login cukup sekali ini saja, ke depannya akan tersimpan otomatis).
echo.
echo Jika sudah login, biarkan Chrome ini terbuka dan jalankan prompt kamu di Antigravity.
echo.
pause
