/**
 * Centralized notification dispatcher
 *
 * Sends both:
 * 1. Real-time Socket.IO notification (in-app)
 * 2. FCM push notification (mobile/browser)
 *
 * Use this instead of calling emitNotification + sendPushNotification separately.
 */

const { emitNotification } = require('../socket/emitter');
const { sendPushNotification } = require('./fcm');

/**
 * Dispatch notification to a user via Socket.IO + FCM push.
 *
 * @param {string} userId - Target user ID
 * @param {object} notification - Notification object (must have title, body)
 * @param {object} [options] - Optional extra FCM data payload
 */
function dispatchNotification(userId, notification, options = {}) {
    // 1. Real-time Socket.IO push
    emitNotification(userId, notification);

    // 2. FCM push (fire-and-forget, non-blocking)
    const title = notification.title || 'Ride';
    const body = notification.body || '';
    const data = {
        link: notification.link || options.link || '/',
        type: notification.type || 'SYSTEM',
        notificationId: notification.id || '',
        ...options,
    };

    sendPushNotification(userId, title, body, data)
        .catch((err) => console.warn('⚠️ FCM push failed:', err.message));
}

module.exports = { dispatchNotification };
