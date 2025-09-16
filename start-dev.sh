#!/bin/bash

echo "Starting Screenshare App Development Environment..."
echo

echo "Starting MongoDB and Redis..."
docker-compose up -d
sleep 3

echo
echo "Starting Backend Server (Port 8080)..."
cd packages/backend && bun run dev &
BACKEND_PID=$!
sleep 3

echo
echo "Starting Frontend Server (Port 3000)..."
cd ../frontend && bun run dev &
FRONTEND_PID=$!

echo
echo "Development servers started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8080"
echo "API Docs: http://localhost:8080/swagger"
echo
echo "Press Ctrl+C to stop all servers..."

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    docker-compose down
    exit
}

# Set trap to call cleanup function on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait