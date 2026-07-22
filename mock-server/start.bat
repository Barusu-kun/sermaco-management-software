@echo off
title Planning Transport - Serveur API factice (mock)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js introuvable. Installez Node.js 20+ depuis https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installation des dependances du mock...
  call npm install
  if errorlevel 1 (
    echo [ECHEC] Installation impossible.
    pause
    exit /b 1
  )
)

echo.
echo Demarrage du serveur factice sur http://localhost:3000
echo (Fermez cette fenetre pour arreter le serveur)
echo.
call npm start
