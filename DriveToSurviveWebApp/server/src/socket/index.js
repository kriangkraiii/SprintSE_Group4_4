/**
 * Socket.IO WebSocket Server
 * Real-time chat messaging + presence (online/offline)
 *
 * Events:
 *   Client → Server:
 *     - join-session(sessionId)     → join a chat room
 *     - leave-session(sessionId)    → leave a chat room
 *     - send-message({ sessionId, content }) → sends message via REST then broadcasts
 *     - typing(sessionId)           → typing indicator
 *     - stop-typing(sessionId)      → stop typing
 *
 *   Server → Client:
 *     - new-message(message)        → new message in room
 *     - user-typing({ userId, sessionId })
 *     - user-stop-typing({ userId, sessionId })
 *     - presence-update({ userId, status, lastSeen })
 *     - error({ message })
 */

const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');

// Online users: Map<userId, { socketId, lastSeen }>
const onlineUsers = new Map();

function initSocketIO(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3003',
                'https://amazing-crisp-9bcb1a.netlify.app',
            ],
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 10000,
    });

    // Auth middleware — verify JWT from handshake (uses bootEpoch check)
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Authentication required'));

        try {
            const decoded = verifyToken(token);
            socket.userId = decoded.sub || decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`[WS] User connected: ${userId} (socket: ${socket.id})`);

        // Mark user online
        onlineUsers.set(userId, { socketId: socket.id, lastSeen: new Date() });
        io.emit('presence-update', { userId, status: 'online', lastSeen: new Date() });

        // Join a chat session room
        socket.on('join-session', (sessionId) => {
            socket.join(`chat:${sessionId}`);
            console.log(`[WS] ${userId} joined chat:${sessionId}`);
        });

        // Leave a chat session room
        socket.on('leave-session', (sessionId) => {
            socket.leave(`chat:${sessionId}`);
        });

        // Broadcast new message to room (message already saved via REST API)
        socket.on('send-message', (data) => {
            const { sessionId, message } = data;
            if (sessionId && message) {
                socket.to(`chat:${sessionId}`).emit('new-message', message);
            }
        });

        // Typing indicators
        socket.on('typing', (sessionId) => {
            socket.to(`chat:${sessionId}`).emit('user-typing', { userId, sessionId });
        });

        socket.on('stop-typing', (sessionId) => {
            socket.to(`chat:${sessionId}`).emit('user-stop-typing', { userId, sessionId });
        });

        // ─── GPS Location Tracking (Route-level) ─────────
        // Throttle map: userId → last emit timestamp
        const locationThrottle = new Map();
        const THROTTLE_MS = 1000; // max 1 emit / 1 sec — fast real-time

        // Join a route room for location sharing (post-booking)
        socket.on('join-route', (routeId) => {
            socket.join(`route:${routeId}`);
            console.log(`[WS] ${userId} joined route:${routeId} for GPS tracking`);
        });

        socket.on('leave-route', (routeId) => {
            socket.leave(`route:${routeId}`);
        });

        // Join route preview (pre-booking — see driver only)
        socket.on('join-route-preview', (routeId) => {
            socket.join(`route-preview:${routeId}`);
        });

        socket.on('leave-route-preview', (routeId) => {
            socket.leave(`route-preview:${routeId}`);
        });

        // Receive location update from any participant (throttled)
        socket.on('location-update', (data) => {
            const { routeId, lat, lng, name } = data;
            if (!routeId || lat == null || lng == null) return;

            // Throttle: skip ถ้ายังไม่ถึงเวลา
            const now = Date.now();
            const key = `${userId}:${routeId}`;
            const lastEmit = locationThrottle.get(key) || 0;
            if (now - lastEmit < THROTTLE_MS) return;
            locationThrottle.set(key, now);

            const payload = {
                userId,
                role: socket.userRole,
                name: name || '',
                lat,
                lng,
                timestamp: now,
            };
            // Broadcast to post-booking participants
            socket.to(`route:${routeId}`).emit('participant-location', payload);
            // If driver, also broadcast to preview viewers
            if (socket.userRole === 'DRIVER') {
                socket.to(`route-preview:${routeId}`).emit('driver-location-preview', payload);
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`[WS] User disconnected: ${userId}`);
            const lastSeen = new Date();
            onlineUsers.delete(userId);

            // Delay broadcast to handle reconnections (30 sec grace)
            setTimeout(() => {
                if (!onlineUsers.has(userId)) {
                    io.emit('presence-update', { userId, status: 'offline', lastSeen });
                }
            }, 30000);
        });
    });

    console.log('[WS] Socket.IO server initialized');
    return io;
}

function isUserOnline(userId) {
    return onlineUsers.has(userId);
}

function getUserLastSeen(userId) {
    return onlineUsers.get(userId)?.lastSeen || null;
}

module.exports = { initSocketIO, isUserOnline, getUserLastSeen, onlineUsers };
