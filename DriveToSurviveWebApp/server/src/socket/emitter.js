/**
 * Socket.IO Emitter Helper
 * Provides a global way for services to emit events through Socket.IO
 * without needing access to Express `app` or `req`.
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
 */
function emitNotification(userId, notification) {
    emitToUser(userId, 'new-notification', notification);
}

module.exports = { setIO, getIO, emitToUser, emitNotification };
