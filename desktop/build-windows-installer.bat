@echo off
setlocal
title Planning Transport - Rebuild installateur Windows
cd /d "%~dp0"

echo Reconstruction de l'installateur (.exe)...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js introuvable. Installez Node.js 20+.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installation des dependances Electron...
  call npm install
  if errorlevel 1 goto :err
)

call npm run dist
if errorlevel 1 goto :err

echo.
echo Termine. Voir : desktop\release\
for %%f in ("release\*.exe") do echo    %%~nxf
echo.
pause
exit /b 0

:err
echo.
echo [ECHEC] Consultez les messages ci-dessus.
pause
exit /b 1
