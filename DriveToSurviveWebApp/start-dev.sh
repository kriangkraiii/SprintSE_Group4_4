#!/bin/bash

# ─── Drive To Survive — Dev Startup ───────────────────────
# Services: Nuxt (3000) + Express API + Socket.IO (3001)

cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    wait 2>/dev/null
    echo "✅ All services stopped."
    exit
}

trap cleanup SIGINT SIGTERM

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   🚀 Drive To Survive — Development Mode     ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Clean up old processes on required ports
echo "🧹 Cleaning up old processes..."
for PORT in 3001 3000 24678; do
    PIDS=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "   ⚠️  Port $PORT in use — killing (PID: $PIDS)"
        echo "$PIDS" | xargs kill -9 2>/dev/null
    fi
done
sleep 2

# ─── Backend: Express API + Socket.IO + CRON ─────────────
echo "📦 Starting Express API + Socket.IO on port 3001..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait for backend to initialize (DB + Socket.IO)
sleep 4

# ─── Frontend: Nuxt Client ──────────────────────────────
echo "💻 Starting Nuxt Client on port 3000..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│  ✅ All Services Running                        │"
echo "├─────────────────────────────────────────────────┤"
echo "│  💻 Client (Nuxt):     http://localhost:3000    │"
echo "│  📦 Server (Express):  http://localhost:3001    │"
echo "│  🔌 WebSocket (WS):    ws://localhost:3001      │"
echo "│  📖 Swagger Docs:      http://localhost:3001/documentation │"
echo "├─────────────────────────────────────────────────┤"
echo "│  ⏰ CRON Jobs:                                  │"
echo "│     • Retention Purge — daily 02:00 UTC         │"
echo "│     • Chat Lifecycle  — every hour              │"
echo "├─────────────────────────────────────────────────┤"
echo "│  Press Ctrl+C to stop all services              │"
echo "└─────────────────────────────────────────────────┘"
echo ""

# Wait for all background processes
wait