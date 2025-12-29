#!/bin/bash

# EcoLedger Quick Start Script
# ============================

echo "🌱 EcoLedger - Quick Start Script"
echo "=================================="
echo ""

# Check if MongoDB is running
echo "📦 Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB or use Docker."
    echo "   Docker: cd infrastructures && docker-compose up -d"
    exit 1
fi

# Check MongoDB connection
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB is not running on port 27017"
    echo "   Start MongoDB or use Docker: cd infrastructures && docker-compose up -d"
    exit 1
fi

echo "✅ MongoDB is running"
echo ""

# Start Backend
echo "🚀 Starting Backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r ../infrastructures/requirements.txt --quiet

# Start backend in background
echo "🚀 Starting FastAPI server on http://localhost:8000"
python app.py &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID
    exit 1
fi

# Start Frontend
cd ../frontend-EcoLedger

echo ""
echo "🚀 Starting Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "🚀 Starting Next.js on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ EcoLedger is now running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep script running
wait
