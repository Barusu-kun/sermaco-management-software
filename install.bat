@echo off
setlocal enabledelayedexpansion
title Planning Transport - Installation (Client Dispatch Windows)
cd /d "%~dp0"

echo ============================================================
echo    Planning Transport  -  Client Dispatch (Windows)
echo    Construction de l'installateur .exe
echo ============================================================
echo.

REM --- Verification de Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js introuvable.
  echo          Installez Node.js 20+ depuis https://nodejs.org puis relancez.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo  Node.js detecte : %%v
echo.

echo [1/3] Installation des dependances de l'interface web...
call npm --prefix web install
if errorlevel 1 goto :err
echo.

echo [2/3] Installation des dependances Electron...
call npm --prefix desktop install
if errorlevel 1 goto :err
echo.

echo [3/3] Construction de l'installateur Windows (.exe)...
echo       (premiere execution : telechargement d'Electron, patientez)
call npm --prefix desktop run dist
if errorlevel 1 goto :err
echo.

echo ============================================================
echo    TERMINE
echo    Installateur genere dans :  desktop\release\
echo ============================================================
for %%f in ("desktop\release\*.exe") do echo    %%~nxf
echo.
echo    Lancez ce fichier .exe pour installer l'application,
echo    puis renseignez l'URL de votre serveur au premier demarrage.
echo.
pause
exit /b 0

:err
echo.
echo [ECHEC] Une etape a echoue. Consultez les messages ci-dessus.
echo.
pause
exit /b 1
