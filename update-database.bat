@echo off
title Update Pokemon Database & Images
color 0B

echo ===================================================
echo     POKEMON TCG POCKET - DATABASE UPDATER
echo ===================================================
echo.
echo Sedang memperbarui database kartu dan mengunduh gambar baru...
echo Jangan tutup jendela ini!
echo.

call npm run update-db

if %errorlevel% neq 0 (
    echo.
    echo ===================================================
    echo GAGAL: Update database bermasalah.
    echo Proses upload ke GitHub dibatalkan untuk keamanan.
    echo ===================================================
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo Mengunggah (Push) gambar baru ke GitHub dan Vercel...
echo ===================================================
echo.

git add .
git commit -m "chore: auto-update database and push new local images"
git push origin main

echo.
echo ===================================================
echo UPDATE SELESAI DAN SUKSES!
echo Vercel akan otomatis memperbarui website Anda dalam 1-2 menit.
echo ===================================================
echo.
pause
