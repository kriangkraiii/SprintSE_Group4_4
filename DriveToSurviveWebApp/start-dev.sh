#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

echo "🚀 Starting Drive To Survive (Server & Client)..."

# Start Backend (Express)
echo "📦 Starting Express API on port 3001..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 2

# Start Frontend (Nuxt)
echo "💻 Starting Nuxt Client on port 3000..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ Services started:"
echo "   Client (Nuxt):   http://localhost:3000"
echo "   Server (Express): http://localhost:3001"
echo "   Swagger Docs:     http://localhost:3001/documentation"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait