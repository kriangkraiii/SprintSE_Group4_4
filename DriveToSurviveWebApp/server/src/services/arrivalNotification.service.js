const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { haversineDistance, getCrossedRadii } = require('../utils/gpsUtils');
const { sendArrivalEmail } = require('./email.service');
const { startNoShowCountdown } = require('./noShow.service');

const MANUAL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check driver position and trigger notifications for crossed radius thresholds
 */
const checkAndNotify = async (bookingId, driverLat, driverLon) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            passenger: { select: { id: true, email: true, firstName: true } },
            route: { select: { driverId: true, driver: { select: { firstName: true } } } },
        },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    if (!['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
        throw new ApiError(400, 'Booking is not active');
    }

    // Get passenger pickup location
    const pickup = booking.pickupLocation;
    if (!pickup || !pickup.lat || !pickup.lng) {
        throw new ApiError(400, 'Pickup location not set');
    }

    // Calculate distance
    const distanceKm = haversineDistance(driverLat, driverLon, pickup.lat, pickup.lng);
    const crossedRadii = getCrossedRadii(distanceKm);

    // Get already-sent notifications for this booking
    const existingSent = await prisma.arrivalNotification.findMany({
        where: { bookingId },
        select: { radiusType: true },
    });
    const alreadySent = new Set(existingSent.map(n => n.radiusType));

    // Filter to only new notifications
    const newRadii = crossedRadii.filter(r => !alreadySent.has(r));

    const results = [];

    for (const radiusType of newRadii) {
        const result = await triggerNotification(booking, radiusType, driverLat, driverLon);
        await startCountdownIfArrived(bookingId, radiusType);
        results.push(result);
    }

    return {
        distanceKm: Math.round(distanceKm * 100) / 100,
        crossedRadii,
        newNotifications: results,
    };
};

/**
 * Trigger a single notification for a specific radius threshold
 */
const triggerNotification = async (booking, radiusType, driverLat, driverLon) => {
    const passenger = booking.passenger;
    const driverName = booking.route.driver.firstName;

    // Message templates
    const messages = {
        FIVE_KM: {
            title: '🚗 คนขับใกล้ถึงแล้ว',
            body: `คนขับ ${driverName} อยู่ห่างประมาณ 5 กม. / Driver ${driverName} is ~5 km away`,
        },
        ONE_KM: {
            title: '🚗 คนขับใกล้ถึงมาก',
            body: `คนขับ ${driverName} อยู่ห่างประมาณ 1 กม. / Driver ${driverName} is ~1 km away`,
        },
        ZERO_KM: {
            title: '✅ คนขับถึงจุดรับแล้ว!',
            body: `คนขับ ${driverName} ถึงจุดรับแล้ว! / Driver ${driverName} has arrived!`,
        },
        MANUAL: {
            title: '✅ คนขับแจ้งว่าถึงแล้ว',
            body: `คนขับ ${driverName} แจ้งว่าถึงแล้ว (แจ้งด้วยตนเอง) / Driver ${driverName} reports arrival (manual)`,
        },
    };

    const msg = messages[radiusType] || messages.FIVE_KM;

    let emailStatus = 'SENT';
    let appStatus = 'SENT';

    // Send In-App notification
    try {
        await prisma.notification.create({
            data: {
                userId: passenger.id,
                type: 'ARRIVAL',
                title: msg.title,
                body: msg.body,
                metadata: { bookingId: booking.id, radiusType, driverLat, driverLon },
            },
        });
    } catch {
        appStatus = 'FAILED';
    }

    // Send Email notification
    try {
        if (passenger.email && !passenger.email.includes('@removed.local')) {
            await sendArrivalEmail(passenger.email, radiusType, {
                passengerName: passenger.firstName,
                driverName,
                bookingId: booking.id,
            });
        } else {
            emailStatus = 'INVALID_RECIPIENT';
        }
    } catch {
        emailStatus = 'FAILED';
    }

    // Create ArrivalNotification record (deduplication via unique constraint)
    const notification = await prisma.arrivalNotification.create({
        data: {
            bookingId: booking.id,
            driverId: booking.route.driverId,
            passengerId: passenger.id,
            radiusType,
            driverLat,
            driverLon,
            appStatus,
            emailStatus,
        },
    });

    // Create NotificationLog for audit trail
    await prisma.notificationLog.create({
        data: {
            type: 'ARRIVAL',
            channel: 'APP+EMAIL',
            recipientId: passenger.id,
            bookingId: booking.id,
            payload: { radiusType, driverLat, driverLon, appStatus, emailStatus },
            status: appStatus === 'SENT' ? 'SENT' : 'PARTIAL',
        },
    });

    return notification;
};

// Auto-start No-Show countdown on arrival (0km or manual)
const startCountdownIfArrived = async (bookingId, radiusType) => {
    if (radiusType === 'ZERO_KM' || radiusType === 'MANUAL') {
        try {
            await startNoShowCountdown(bookingId);
        } catch (err) {
            console.error('Failed to start No-Show countdown:', err.message);
        }
    }
};

/**
 * Manual arrival trigger (fallback when GPS fails)
 */
const manualTrigger = async (bookingId, driverId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            passenger: { select: { id: true, email: true, firstName: true } },
            route: { select: { driverId: true, driver: { select: { firstName: true } } } },
        },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.route.driverId !== driverId) throw new ApiError(403, 'Not your booking');
    if (!['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
        throw new ApiError(400, 'Trip has ended');
    }

    // Spam prevention — check for recent manual trigger
    const recentManual = await prisma.arrivalNotification.findFirst({
        where: { bookingId, radiusType: 'MANUAL' },
        orderBy: { triggeredAt: 'desc' },
    });

    if (recentManual) {
        const elapsed = Date.now() - new Date(recentManual.triggeredAt).getTime();
        if (elapsed < MANUAL_COOLDOWN_MS) {
            throw new ApiError(429, 'Already notified recently. Please wait.');
        }
    }

    // For manual trigger, we use a workaround since UNIQUE(bookingId, radiusType) would prevent re-sending.
    // Delete old MANUAL entry if cooldown has passed, then create new one.
    if (recentManual) {
        await prisma.arrivalNotification.delete({ where: { id: recentManual.id } });
    }

    const result = await triggerNotification(booking, 'MANUAL', null, null);
    await startCountdownIfArrived(bookingId, 'MANUAL');
    return result;
};

/**
 * Get notification history for a booking (audit view)
 */
const getNotificationsByBooking = async (bookingId) => {
    return prisma.arrivalNotification.findMany({
        where: { bookingId },
        orderBy: { triggeredAt: 'asc' },
    });
};

module.exports = {
    checkAndNotify,
    manualTrigger,
    getNotificationsByBooking,
};
