/**
 * Centralized notification dispatcher
 *
 * Sends both:
 * 1. Real-time Socket.IO notification (in-app)
 * 2. FCM push notification (mobile/browser)
 *
 * IMPORTANT: This function is fully fire-and-forget.
 * Errors are caught internally and never propagate to the caller.
 * This is safe to call inside Prisma $transaction blocks.
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
    try {
        // 1. Real-time Socket.IO push
        emitNotification(userId, notification);
    } catch (err) {
        console.warn('⚠️ Socket.IO emit failed:', err.message);
    }

    // 2. FCM push (fire-and-forget, non-blocking)
    try {
        const title = notification.title || 'Ride';
        const body = notification.body || '';
        const data = {
            link: notification.link || options.link || '/',
            type: notification.type || 'SYSTEM',
            notificationId: notification.id || '',
            ...options,
        };

        // Convert all data values to strings (FCM requirement)
        const stringData = {};
        for (const [k, v] of Object.entries(data)) {
            stringData[k] = String(v ?? '');
        }

        sendPushNotification(userId, title, body, stringData)
            .catch((err) => console.warn('⚠️ FCM push failed:', err.message));
    } catch (err) {
        console.warn('⚠️ FCM dispatch prep failed:', err.message);
    }
}

module.exports = { dispatchNotification };

