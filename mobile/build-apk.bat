@echo off
setlocal
title Planning Transport - Build APK Chauffeur
cd /d "%~dp0"

REM SDK Android (chemin par defaut d'Android Studio)
if "%ANDROID_HOME%"=="" set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%

where node >nul 2>nul || (echo [ERREUR] Node.js introuvable & pause & exit /b 1)
if not exist node_modules ( echo Installation des dependances... & call npm install || goto :err )

echo [1/3] Build de l'app web...
call npm run build || goto :err

echo [2/3] Synchronisation Capacitor...
if not exist android ( call npx cap add android || goto :err )
call npx cap sync android || goto :err

echo [3/3] Compilation de l'APK (Gradle)...
cd android
call gradlew.bat assembleDebug --no-daemon || goto :err
cd ..

if not exist dist-apk mkdir dist-apk
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "dist-apk\PT-Chauffeur-debug.apk" >nul

echo.
echo ============================================================
echo   APK genere : mobile\dist-apk\PT-Chauffeur-debug.apk
echo ============================================================
echo   Installez-le sur le telephone (meme Wi-Fi que le serveur),
echo   puis dans l'app, section "Serveur", entrez l'URL de l'API.
echo.
pause
exit /b 0

:err
echo.
echo [ECHEC] La compilation a echoue. Voir les messages ci-dessus.
pause
exit /b 1
