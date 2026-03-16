/**
 * Firebase Cloud Messaging (FCM) Utility — Multi-device Support
 * Initialize firebase-admin and provide push notification functions.
 *
 * Sprint 3: Push Notification System
 * Supports multiple devices per user (phone, iPad, desktop, etc.)
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const prisma = require('./prisma');

// ── Initialize Firebase Admin SDK ──────────────────────────
let fcmEnabled = false;

try {
    const serviceAccountPath = path.resolve(__dirname, '../../secp-a5a40-firebase-adminsdk-fbsvc-c145fe5da1.json');

    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        fcmEnabled = true;
        console.log('✅ Firebase Admin SDK initialized (FCM enabled)');
    } else {
        console.warn('⚠️  Service Account key not found — FCM push disabled');
        console.warn(`   Expected at: ${serviceAccountPath}`);
    }
} catch (err) {
    console.error('❌ Firebase Admin init failed:', err.message);
}

/**
 * Send push notification to ALL devices of a specific user.
 * Looks up all FCM tokens from the FcmToken table.
 *
 * @param {string} userId - User ID to send notification to
 * @param {string} title  - Notification title
 * @param {string} body   - Notification body text
 * @param {object} [data] - Optional data payload (key-value strings)
 * @returns {Promise<{success: boolean, sent: number, failed: number, errors?: string[]}>}
 */
async function sendPushNotification(userId, title, body, data = {}) {
    if (!fcmEnabled) {
        return { success: false, sent: 0, failed: 0, error: 'FCM not initialized' };
    }

    try {
        // Get ALL tokens for this user (multi-device)
        const fcmTokens = await prisma.fcmToken.findMany({
            where: { userId },
            select: { id: true, token: true },
        });

        if (fcmTokens.length === 0) {
            return { success: false, sent: 0, failed: 0, error: 'No FCM tokens for user' };
        }

        // Ensure all data values are strings (FCM requirement)
        const stringData = {};
        for (const [k, v] of Object.entries(data)) {
            stringData[k] = String(v);
        }

        // Send to each device
        let sent = 0;
        let failed = 0;
        const expiredTokenIds = [];
        const errors = [];

        const sendPromises = fcmTokens.map(async ({ id: tokenId, token }) => {
            try {
                const message = {
                    token,
                    notification: { title, body },
                    data: stringData,
                    webpush: {
                        fcmOptions: {
                            link: stringData.link || '/',
                        },
                        notification: {
                            icon: '/favicon.png',
                            badge: '/favicon.png',
                            requireInteraction: true,
                        },
                    },
                };

                await admin.messaging().send(message);
                sent++;
            } catch (err) {
                failed++;

                // Expired or invalid tokens → mark for cleanup
                if (
                    err.code === 'messaging/registration-token-not-registered' ||
                    err.code === 'messaging/invalid-registration-token'
                ) {
                    expiredTokenIds.push(tokenId);
                } else {
                    errors.push(err.message);
                }
            }
        });

        await Promise.all(sendPromises);

        // Clean up expired tokens
        if (expiredTokenIds.length > 0) {
            console.warn(`🗑️  Clearing ${expiredTokenIds.length} expired FCM token(s) for user ${userId}`);
            await prisma.fcmToken.deleteMany({
                where: { id: { in: expiredTokenIds } },
            }).catch(() => { });
        }

        return {
            success: sent > 0,
            sent,
            failed,
            ...(errors.length > 0 ? { errors } : {}),
        };
    } catch (err) {
        console.error(`❌ FCM send failed for user ${userId}:`, err.message);
        return { success: false, sent: 0, failed: 0, error: err.message };
    }
}

/**
 * Save FCM token for a user's device.
 * If token already exists for another device, it will be moved to this user.
 * If token already exists for this user, it updates the device name.
 *
 * @param {string} userId     - User ID
 * @param {string} token      - FCM device token
 * @param {string} deviceName - Device name (e.g. "iPhone 15", "iPad Pro")
 */
async function saveFcmToken(userId, token, deviceName = null) {
    await prisma.fcmToken.upsert({
        where: { token },
        create: {
            userId,
            token,
            deviceName,
        },
        update: {
            userId, // Transfer to current user if token was on different account
            deviceName,
            updatedAt: new Date(),
        },
    });
}

/**
 * Remove a specific FCM token (e.g., on logout from this device).
 * @param {string} token - FCM device token to remove
 */
async function removeFcmToken(token) {
    await prisma.fcmToken.deleteMany({
        where: { token },
    });
}

/**
 * Remove ALL FCM tokens for a user (e.g., force logout all devices).
 * @param {string} userId - User ID
 */
async function removeAllFcmTokens(userId) {
    await prisma.fcmToken.deleteMany({
        where: { userId },
    });
}

/**
 * Get device count for a user.
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
async function getDeviceCount(userId) {
    return prisma.fcmToken.count({ where: { userId } });
}

module.exports = {
    sendPushNotification,
    saveFcmToken,
    removeFcmToken,
    removeAllFcmTokens,
    getDeviceCount,
    fcmEnabled,
};
