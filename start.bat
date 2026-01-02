@echo off
REM EcoLedger Quick Start Script for Windows
REM ==========================================

echo ====================================
echo 🌱 EcoLedger - Quick Start Script
echo ====================================
echo.

REM Check MongoDB
echo 📦 Checking MongoDB...
docker ps | findstr mongo >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB not running. Starting with Docker...
    cd infrastructures
    docker-compose up -d
    cd ..
    timeout /t 5 >nul
)
echo ✅ MongoDB is running
echo.

REM Start Backend
echo 🚀 Starting Backend...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    REM Prefer stable Python versions over experimental ones (like 3.14)
    set "PYTHON_CMD=python"
    
    py -0 >nul 2>&1
    if %errorlevel% equ 0 (
        echo 🔍 Checking for stable Python versions via launcher...
        for %%v in (3.13 3.12 3.11 3.10) do (
            py -%%v --version >nul 2>&1
            if %errorlevel% equ 0 (
                set "PYTHON_CMD=py -%%v"
                goto :found_python
            )
        )
    )
    
    :found_python
    echo 🔨 Using %PYTHON_CMD% to create venv...
    %PYTHON_CMD% -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies.
    pause
    exit /b %errorlevel%
)

REM Start backend
echo 🚀 Starting FastAPI server on http://localhost:8000
start /B python app.py

REM Wait for backend
echo ⏳ Waiting for backend to initialize...
timeout /t 5 >nul

REM Start Frontend
cd ..\frontend-EcoLedger
echo.
echo 🚀 Starting Frontend...

REM Check if node_modules exists and is valid
if not exist "node_modules" (
    set "NEEDS_INSTALL=1"
) else if not exist "node_modules\.bin\next" (
    set "NEEDS_INSTALL=1"
) else (
    set "NEEDS_INSTALL=0"
)

if "%NEEDS_INSTALL%"=="1" (
    echo 📦 Installing npm dependencies...
    where pnpm >nul 2>nul
    if %errorlevel% equ 0 (
        call pnpm install
    ) else (
        echo ⚠️ pnpm not found, falling back to npm...
        call npm install
    )
)

echo 🚀 Starting Next.js on http://localhost:3000
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    start /B pnpm dev
) else (
    start /B npm run dev
)

echo.
echo ✅ EcoLedger is now running!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo.

REM Keep running
pause
