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

# ─── Sprint 3: Firebase / FCM Status Check ───────────────
echo ""
echo "🔥 Firebase Cloud Messaging (FCM) Status:"

# Check Firebase env vars (replaces JSON file)
if [ -f ".env" ]; then
    FB_PID=$(grep "^FIREBASE_PROJECT_ID=" .env | cut -d'=' -f2)
    FB_EMAIL=$(grep "^FIREBASE_CLIENT_EMAIL=" .env | cut -d'=' -f2)
    FB_KEY=$(grep "^FIREBASE_PRIVATE_KEY=" .env | head -1)
    if [ -n "$FB_PID" ] && [ -n "$FB_EMAIL" ] && [ -n "$FB_KEY" ]; then
        echo "   ✅ Service Account: configured via ENV vars (project: $FB_PID)"
    else
        echo "   ❌ Service Account ENV vars incomplete"
        echo "      → Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env"
    fi
fi

# Check VAPID Key in .env
if [ -f ".env" ]; then
    VAPID=$(grep "^FIREBASE_VAPID_KEY=" .env | cut -d'=' -f2)
    if [ -n "$VAPID" ]; then
        echo "   ✅ VAPID Key: configured (${#VAPID} chars)"
    else
        echo "   ❌ VAPID Key: NOT SET in .env"
        echo "      → Firebase Console → Cloud Messaging → Web Push certificates"
    fi
else
    echo "   ⚠️  .env file not found"
fi

# Check firebase-admin dependency
if [ -d "server/node_modules/firebase-admin" ]; then
    echo "   ✅ firebase-admin: installed"
else
    echo "   ❌ firebase-admin: NOT INSTALLED (run: cd server && npm install)"
fi

# Check firebase client dependency
if [ -d "client/node_modules/firebase" ]; then
    echo "   ✅ firebase (client): installed"
else
    echo "   ❌ firebase (client): NOT INSTALLED (run: cd client && npm install)"
fi

echo ""

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
echo "┌───────────────────────────────────────────────────────────┐"
echo "│  ✅ All Services Running                                  │"
echo "├───────────────────────────────────────────────────────────┤"
echo "│  💻 Client (Nuxt):     http://localhost:3000              │"
echo "│  📦 Server (Express):  http://localhost:3001              │"
echo "│  🔌 WebSocket (WS):    ws://localhost:3001                │"
echo "│  📖 Swagger Docs:      http://localhost:3001/documentation│"
echo "├───────────────────────────────────────────────────────────┤"
echo "│  ⏰ CRON Jobs:                                            │"
echo "│     • Retention Purge — daily 02:00 UTC                   │"
echo "│     • Chat Lifecycle  — every hour                        │"
echo "├───────────────────────────────────────────────────────────┤"
echo "│  🔔 FCM Push: check server logs for status                │"
echo "├───────────────────────────────────────────────────────────┤"
echo "│  Press Ctrl+C to stop all services                        │"
echo "└───────────────────────────────────────────────────────────┘"
echo ""

# Wait for all background processes
wait

# ./start-dev.sh