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
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -q -r ..\infrastructures\requirements.txt

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

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    call pnpm install
)

echo 🚀 Starting Next.js on http://localhost:3000
start /B pnpm dev

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
