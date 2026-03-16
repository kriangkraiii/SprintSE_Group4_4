/**
 * Socket.IO Emitter Helper
 * Provides a global way for services to emit events through Socket.IO
 * without needing access to Express `app` or `req`.
 *
 * Sprint 3: Also fires FCM push notification alongside WebSocket.
 */

let _io = null;
const { onlineUsers } = require('./index');

function setIO(io) {
    _io = io;
}

function getIO() {
    return _io;
}

/**
 * Emit an event to a specific user by userId.
 * Finds their connected socket via the onlineUsers map.
 */
function emitToUser(userId, event, data) {
    if (!_io) return;
    const entry = onlineUsers.get(userId);
    if (entry?.socketId) {
        _io.to(entry.socketId).emit(event, data);
    }
}

/**
 * Emit a notification to a specific user.
 * Used after creating a notification in the database.
 *
 * Sprint 3: Also sends FCM push notification (fire-and-forget).
 * This means ALL services that call emitNotification() automatically
 * get mobile push notifications — no code changes needed.
 */
function emitNotification(userId, notification) {
    // 1. WebSocket push (existing behavior)
    emitToUser(userId, 'new-notification', notification);

    // 2. FCM push (Sprint 3 — fire-and-forget, non-blocking)
    try {
        const { sendPushNotification } = require('../utils/fcm');
        const title = notification.title || 'Ride';
        const body = notification.body || '';
        const data = {
            type: notification.type || 'SYSTEM',
            notificationId: notification.id || '',
            link: notification.link || '/',
        };

        // Fire-and-forget: don't await, don't block WebSocket
        sendPushNotification(userId, title, body, data).catch((err) => {
            console.error(`⚠️  FCM push failed for user ${userId}:`, err.message);
        });
    } catch (err) {
        // FCM module not available — silently skip
        console.warn('⚠️  FCM module not loaded:', err.message);
    }
}

/**
 * Emit an event to all participants in a route room.
 * Used for real-time arrival notifications on the tracking page.
 */
function emitToRoute(routeId, event, data) {
    if (!_io) return;
    _io.to(`route:${routeId}`).emit(event, data);
}

module.exports = { setIO, getIO, emitToUser, emitNotification, emitToRoute };

