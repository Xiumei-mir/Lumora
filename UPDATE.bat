@echo off
title Lumora - Update Website
cd /d "%~dp0"

echo ============================================
echo    LUMORA - Update Website ke Live
echo ============================================
echo.

REM Cek git terinstall
where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Git tidak terinstall!
    echo Install dari https://git-scm.com
    pause
    exit /b 1
)

REM Cek sudah git repo?
if not exist ".git" (
    echo [ERROR] Folder ini bukan git repo.
    echo Jalankan dulu panduan DEPLOY-GITHUB-Railway.txt bagian 1.
    pause
    exit /b 1
)

REM Cek perubahan ada
git add .
git status --porcelain >nul 2>nul
if errorlevel 1 (
    echo [INFO] Tidak ada perubahan baru.
    echo.
    pause
    exit /b 0
)

REM Ada perubahan, minta pesan commit
set /p COMMITMSG=Pesan commit (Enter = otomatis):
if "%COMMITMSG%"=="" set COMMITMSG=update %date% %time%

echo.
echo [1/3] Commiting...
git commit -m "%COMMITMSG%"
if errorlevel 1 (
    echo [INFO] Commit gagal.
    pause
    exit /b 1
)

echo.
echo [2/3] Push ke GitHub...
git push
if errorlevel 1 (
    echo [ERROR] Gagal push. Cek koneksi / akses GitHub.
    pause
    exit /b 1
)

echo.
echo [3/3] Selesai!
echo.
echo Railway auto-redeploy dalam 1-2 menit.
echo Cek di panel Railway: https://railway.app/project
pause