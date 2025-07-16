@echo off
chcp 65001 >nul
echo ================================
echo    Script Manager Build Tool
echo ================================
echo.

:: Proje klasörüne git
cd /d "%~dp0"

:: Dil seçimi
echo Please select language / Lütfen dil seçin:
echo [1] English
echo [2] Türkçe
echo.

set /p lang_choice=Select / Seçin (1-2): 

if "%lang_choice%"=="1" (
    set LANG=EN
    goto :start_en
)

if "%lang_choice%"=="2" (
    set LANG=TR
    goto :start_tr
)

echo Invalid choice! / Geçersiz seçim!
pause
goto :end

:start_en
cls
echo ================================
echo    Script Manager Build Tool
echo ================================
echo.

echo Checking Node.js version...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js.
    echo https://nodejs.org/en/download/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

echo Cleaning all caches...
if exist "%LOCALAPPDATA%\electron-builder" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder" 2>nul
)
if exist "%APPDATA%\electron-builder" (
    rmdir /s /q "%APPDATA%\electron-builder" 2>nul
)
if exist "%LOCALAPPDATA%\electron" (
    rmdir /s /q "%LOCALAPPDATA%\electron" 2>nul
)
if exist "%USERPROFILE%\.electron" (
    rmdir /s /q "%USERPROFILE%\.electron" 2>nul
)

echo Cleaning dist folder...
if exist "dist" (
    rmdir /s /q "dist" 2>nul
)

echo Cleaning NPM cache...
call npm cache clean --force

echo Setting up build configuration...
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_CACHE=%TEMP%\electron-cache
set ELECTRON_BUILDER_CACHE=%TEMP%\electron-builder-cache

echo.
echo Build options:
echo [1] Installer (.exe) + Portable (.exe)
echo [2] Installer only (.exe)
echo [3] Portable only (.exe)
echo [4] Test Build (No installation)
echo [5] Run in Development Mode
echo.

set /p choice=Make your choice (1-5): 

if "%choice%"=="1" (
    echo Building both...
    call npm run build:all
    goto :success_en
)

if "%choice%"=="2" (
    echo Building installer...
    call npm run build:win
    goto :success_en
)

if "%choice%"=="3" (
    echo Building portable...
    call npm run build:portable
    goto :success_en
)

if "%choice%"=="4" (
    echo Creating test build...
    call npm run pack
    goto :success_en
)

if "%choice%"=="5" (
    echo Starting in development mode...
    call npm run dev
    goto :end
)

echo Invalid choice!
pause
goto :end

:success_en
echo.
echo ================================
echo         BUILD COMPLETED!
echo ================================
echo.
echo Files created in 'dist' folder:
dir /b dist\*.exe 2>nul
echo.
echo Opening dist folder to view files.
start "" "%~dp0dist"
goto :end

:start_tr
cls
echo ================================
echo    Script Manager Build Aracı
echo ================================
echo.

echo Node.js versiyonu kontrol ediliyor...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Node.js bulunamadı! Lütfen Node.js yükleyiniz.
    echo https://nodejs.org/en/download/
    pause
    exit /b 1
)

echo Bağımlılıklar yükleniyor...
call npm install

echo Önbellek tamamen temizleniyor...
if exist "%LOCALAPPDATA%\electron-builder" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder" 2>nul
)
if exist "%APPDATA%\electron-builder" (
    rmdir /s /q "%APPDATA%\electron-builder" 2>nul
)
if exist "%LOCALAPPDATA%\electron" (
    rmdir /s /q "%LOCALAPPDATA%\electron" 2>nul
)
if exist "%USERPROFILE%\.electron" (
    rmdir /s /q "%USERPROFILE%\.electron" 2>nul
)

echo Dist klasörü temizleniyor...
if exist "dist" (
    rmdir /s /q "dist" 2>nul
)

echo NPM cache temizleniyor...
call npm cache clean --force

echo Build ayarları yapılıyor...
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_CACHE=%TEMP%\electron-cache
set ELECTRON_BUILDER_CACHE=%TEMP%\electron-builder-cache

echo.
echo Build seçenekleri:
echo [1] Kurulum (.exe) + Taşınabilir (.exe)
echo [2] Sadece Kurulum (.exe)
echo [3] Sadece Taşınabilir (.exe)
echo [4] Test Build (Kurulum olmadan)
echo [5] Geliştirme Modunda Çalıştır
echo.

set /p choice=Seçiminizi yapın (1-5): 

if "%choice%"=="1" (
    echo Her ikisi de build ediliyor...
    call npm run build:all
    goto :success_tr
)

if "%choice%"=="2" (
    echo Kurulum dosyası build ediliyor...
    call npm run build:win
    goto :success_tr
)

if "%choice%"=="3" (
    echo Taşınabilir versiyon build ediliyor...
    call npm run build:portable
    goto :success_tr
)

if "%choice%"=="4" (
    echo Test build yapılıyor...
    call npm run pack
    goto :success_tr
)

if "%choice%"=="5" (
    echo Geliştirme modunda başlatılıyor...
    call npm run dev
    goto :end
)

echo Geçersiz seçim!
pause
goto :end

:success_tr
echo.
echo ================================
echo         BUILD TAMAMLANDI!
echo ================================
echo.
echo 'dist' klasöründe oluşturulan dosyalar:
dir /b dist\*.exe 2>nul
echo.
echo Dosyaları görmek için dist klasörü açılıyor.
start "" "%~dp0dist"

:end
echo.
pause 