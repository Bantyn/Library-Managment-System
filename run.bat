@echo off
setlocal enabledelayedexpansion
title PustakSetu : Library Management System - Service Launcher
color 0B

:: Ensure working directory is the script root
cd /d "%~dp0"

:MENU
cls
echo ===============================================================================
echo                PUSTAKSETU : LIBRARY MANAGEMENT SYSTEM
echo ===============================================================================
echo.
echo   [1] Start ALL Services (Backend + Admin Portal + Student Frontend) [DEFAULT]
echo   [2] Start Backend API Only        (Port 5000)
echo   [3] Start Admin Portal Only       (Port 5173)
echo   [4] Start Student Frontend Only   (Port 5174)
echo   [5] Install / Update Dependencies (Backend + Admin + Frontend)
echo   [6] Seed Database with Initial Data (MongoDB Atlas)
echo   [7] Exit
echo.
echo ===============================================================================
set /p choice="Enter option [1-7] (Press Enter for Option 1): "

if "%choice%"=="" goto START_ALL
if "%choice%"=="1" goto START_ALL
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_ADMIN
if "%choice%"=="4" goto START_FRONTEND
if "%choice%"=="5" goto INSTALL_DEPS
if "%choice%"=="6" goto SEED_DB
if "%choice%"=="7" goto EXIT_SCRIPT

echo.
echo Invalid choice! Please select an option between 1 and 7.
timeout /t 2 >nul
goto MENU

:: -----------------------------------------------------------------------------
:START_ALL
cls
echo ===============================================================================
echo                LAUNCHING ALL PUSTAKSETU SERVICES
echo ===============================================================================
echo.

:: 1. Backend Service
echo [1/3] Starting Backend API Server (Node/Express)...
start "PustakSetu - Backend API [Port 5000]" cmd /k "title PustakSetu Backend (Port 5000) && cd /d \"%~dp0Backend\" && npm run dev"
timeout /t 2 >nul

:: 2. Admin Portal
echo [2/3] Starting Admin Portal (Vite React)...
start "PustakSetu - Admin Portal [Port 5173]" cmd /k "title PustakSetu Admin (Port 5173) && cd /d \"%~dp0Admin\" && npm run dev"
timeout /t 2 >nul

:: 3. Student Frontend
echo [3/3] Starting Student Frontend (Vite React)...
start "PustakSetu - Student Frontend [Port 5174]" cmd /k "title PustakSetu Student Frontend (Port 5174) && cd /d \"%~dp0Frontend\" && npm run dev"

echo.
echo ===============================================================================
echo                    ALL SERVICES STARTED SUCCESSFULLY!
echo ===============================================================================
echo.
echo   - Backend API:       http://localhost:5000/api
echo   - Admin Portal:      http://localhost:5173
echo   - Student Frontend:  http://localhost:5174
echo.
echo ===============================================================================
echo.
set /p open_browser="Do you want to open the web portals in your browser now? (Y/N) [Y]: "
if /i "%open_browser%"=="" set open_browser=Y
if /i "%open_browser%"=="Y" (
    start http://localhost:5173
    start http://localhost:5174
)
echo.
echo All services are running in their respective windows.
echo To stop a service, simply close its terminal window or press Ctrl+C inside it.
echo.
pause
goto MENU

:: -----------------------------------------------------------------------------
:START_BACKEND
cls
echo Starting Backend API Server on Port 5000...
start "PustakSetu - Backend API [Port 5000]" cmd /k "title PustakSetu Backend (Port 5000) && cd /d \"%~dp0Backend\" && npm run dev"
echo Backend window opened.
pause
goto MENU

:: -----------------------------------------------------------------------------
:START_ADMIN
cls
echo Starting Admin Portal on Port 5173...
start "PustakSetu - Admin Portal [Port 5173]" cmd /k "title PustakSetu Admin (Port 5173) && cd /d \"%~dp0Admin\" && npm run dev"
echo Admin Portal window opened.
pause
goto MENU

:: -----------------------------------------------------------------------------
:START_FRONTEND
cls
echo Starting Student Frontend on Port 5174...
start "PustakSetu - Student Frontend [Port 5174]" cmd /k "title PustakSetu Student Frontend (Port 5174) && cd /d \"%~dp0Frontend\" && npm run dev"
echo Student Frontend window opened.
pause
goto MENU

:: -----------------------------------------------------------------------------
:INSTALL_DEPS
cls
echo ===============================================================================
echo               INSTALLING DEPENDENCIES FOR ALL MODULES
echo ===============================================================================
echo.
echo [1/3] Installing Backend dependencies...
cd /d "%~dp0Backend"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend npm install failed!
    pause
    goto MENU
)

echo.
echo [2/3] Installing Admin dependencies...
cd /d "%~dp0Admin"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Admin npm install failed!
    pause
    goto MENU
)

echo.
echo [3/3] Installing Frontend dependencies...
cd /d "%~dp0Frontend"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend npm install failed!
    pause
    goto MENU
)

echo.
echo ===============================================================================
echo                 ALL DEPENDENCIES INSTALLED SUCCESSFULLY!
echo ===============================================================================
echo.
pause
goto MENU

:: -----------------------------------------------------------------------------
:SEED_DB
cls
echo ===============================================================================
echo                   SEEDING DATABASE (MONGODB ATLAS)
echo ===============================================================================
echo.
cd /d "%~dp0Backend"
call npm run seed:database
echo.
pause
goto MENU

:: -----------------------------------------------------------------------------
:EXIT_SCRIPT
cls
echo Exiting PustakSetu Launcher. Have a great day!
exit /b 0
