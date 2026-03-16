/**
 * FCM Token Routes — Multi-device Support
 * Sprint 3: Push Notification System
 *
 * POST   /api/fcm/save-token     — Save/register FCM device token
 * DELETE /api/fcm/remove-token   — Remove token for this device (logout)
 * DELETE /api/fcm/remove-all     — Remove all tokens (logout all devices)
 * GET    /api/fcm/devices        — List registered devices
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const { saveFcmToken, removeFcmToken, removeAllFcmTokens } = require('../utils/fcm');
const prisma = require('../utils/prisma');

const router = express.Router();

// POST /api/fcm/save-token
router.post('/save-token', protect, async (req, res, next) => {
    try {
        const { token, deviceName } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ message: 'FCM token is required' });
        }

        await saveFcmToken(req.user.id, token, deviceName || null);

        res.json({ message: 'FCM token saved successfully' });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/fcm/remove-token
router.delete('/remove-token', protect, async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'FCM token is required' });
        }

        await removeFcmToken(token);
        res.json({ message: 'FCM token removed' });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/fcm/remove-all — Logout all devices
router.delete('/remove-all', protect, async (req, res, next) => {
    try {
        await removeAllFcmTokens(req.user.id);
        res.json({ message: 'All FCM tokens removed' });
    } catch (err) {
        next(err);
    }
});

// GET /api/fcm/devices — List registered devices
router.get('/devices', protect, async (req, res, next) => {
    try {
        const devices = await prisma.fcmToken.findMany({
            where: { userId: req.user.id },
            select: {
                id: true,
                deviceName: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ devices, count: devices.length });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
