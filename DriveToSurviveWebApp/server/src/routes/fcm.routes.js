/**
 * FCM Token Routes — Multi-device Support
 * Endpoints for registering, unregistering, and managing FCM push notification tokens.
 *
 * Sprint 3: Push Notification System
 */

const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middlewares/auth');
const { saveFcmToken, removeFcmToken, removeAllFcmTokens, getDeviceCount } = require('../utils/fcm');
const prisma = require('../utils/prisma');

const router = express.Router();

/**
 * POST /api/fcm/token
 * Register (or update) an FCM token for the authenticated user.
 * Multi-device: each device has its own token, server upserts by token value.
 *
 * Body: { token: string, deviceName?: string }
 */
router.post(
    '/token',
    protect,
    asyncHandler(async (req, res) => {
        const { token, deviceName } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required',
            });
        }

        await saveFcmToken(req.user.sub, token.trim(), deviceName || null);
        const deviceCount = await getDeviceCount(req.user.sub);

        res.status(200).json({
            success: true,
            message: 'FCM token registered successfully',
            deviceCount,
        });
    })
);

/**
 * DELETE /api/fcm/token
 * Unregister a single FCM token (e.g., on logout from this device).
 *
 * Body: { token: string }
 */
router.delete(
    '/token',
    protect,
    asyncHandler(async (req, res) => {
        const { token } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required',
            });
        }

        await removeFcmToken(token.trim());

        res.status(200).json({
            success: true,
            message: 'FCM token removed successfully',
        });
    })
);

/**
 * DELETE /api/fcm/tokens/all
 * Remove ALL FCM tokens for the authenticated user (force logout all devices).
 */
router.delete(
    '/tokens/all',
    protect,
    asyncHandler(async (req, res) => {
        await removeAllFcmTokens(req.user.sub);

        res.status(200).json({
            success: true,
            message: 'All FCM tokens removed',
        });
    })
);

/**
 * GET /api/fcm/devices
 * List all registered devices for the authenticated user.
 */
router.get(
    '/devices',
    protect,
    asyncHandler(async (req, res) => {
        const devices = await prisma.fcmToken.findMany({
            where: { userId: req.user.sub },
            select: {
                id: true,
                deviceName: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            data: devices,
            deviceCount: devices.length,
        });
    })
);

/**
 * DELETE /api/fcm/devices/:id
 * Remove a specific device by its DB id.
 */
router.delete(
    '/devices/:id',
    protect,
    asyncHandler(async (req, res) => {
        const device = await prisma.fcmToken.findFirst({
            where: { id: req.params.id, userId: req.user.sub },
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }

        await prisma.fcmToken.delete({ where: { id: device.id } });

        res.status(200).json({
            success: true,
            message: 'Device removed',
        });
    })
);

module.exports = router;
