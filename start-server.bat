@echo off
title Tasker AI Web App Server
echo ===================================================
echo           TASKER AI - PRODUCTIVITY ENGINE
echo ===================================================
echo.
echo Starting local web server on port 3000...
echo.

:: Check if python is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Launching Python HTTP Server...
    start http://localhost:3000/preview.html
    python -m http.server 3000
    goto end
)

:: If node is available
node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo Launching with npm...
    npm run dev
    goto end
)

:: Fallback: Open preview.html directly in default browser
echo Opening Tasker AI standalone directly in your browser...
start preview.html

:end
pause
