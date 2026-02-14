#!/bin/bash

echo "🛑 Stopping Drive To Survive..."

# Function to kill process on a port
kill_port() {
    PORT=$1
    NAME=$2
    PID=$(lsof -ti:$PORT)
    if [ -n "$PID" ]; then
        echo "Killing $NAME on port $PORT (PID: $PID)..."
        kill -9 $PID
    else
        echo "$NAME not running on port $PORT."
    fi
}

kill_port 3000 "Client (Nuxt)"
kill_port 3001 "Server (Express)"

echo "✅ All services stopped."