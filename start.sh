#!/bin/bash

# ChatFreeGPT Start Script
# Starts both backend and frontend servers

echo "=========================================="
echo "  ChatFreeGPT - Starting Services"
echo "=========================================="

# Check if Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Warning: Ollama doesn't seem to be running."
    echo "Start it with: ollama serve"
    echo ""
fi

# Start backend
echo "Starting Python backend..."
cd "$(dirname "$0")"
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
echo "Starting React frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Services Started!"
echo "=========================================="
echo "  Backend API: http://127.0.0.1:5000"
echo "  Frontend:    http://localhost:5173"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
