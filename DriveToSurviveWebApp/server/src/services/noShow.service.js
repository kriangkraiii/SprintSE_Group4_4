const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const NO_SHOW_TIMEOUT_MINUTES = 20;

/**
 * Start No-Show countdown when driver arrives (0KM or MANUAL)
 */
const startNoShowCountdown = async (bookingId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (!['confirmed', 'in_progress'].includes(booking.status)) {
        throw new ApiError(400, 'Trip is not active');
    }

    const noShowDeadline = new Date(Date.now() + NO_SHOW_TIMEOUT_MINUTES * 60 * 1000);

    await prisma.booking.update({
        where: { id: bookingId },
        data: { noShowDeadline },
    });

    return { bookingId, noShowDeadline, timeoutMinutes: NO_SHOW_TIMEOUT_MINUTES };
};

/**
 * Cancel No-Show countdown (passenger was picked up)
 */
const cancelNoShowCountdown = async (bookingId) => {
    await prisma.booking.update({
        where: { id: bookingId },
        data: { noShowDeadline: null },
    });
};

/**
 * Execute No-Show: mark booking as NO_SHOW
 */
const executeNoShow = async (bookingId, driverId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { route: true },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.route.driverId !== driverId) throw new ApiError(403, 'Not your booking');
    if (!booking.noShowDeadline) throw new ApiError(400, 'No-Show countdown not started');

    if (new Date() < new Date(booking.noShowDeadline)) {
        throw new ApiError(400, 'ยังไม่หมดเวลา No-Show countdown');
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'no_show',
            noShowDeadline: null,
        },
    });

    // Create notification for passenger
    await prisma.notification.create({
        data: {
            userId: booking.passengerId,
            type: 'SYSTEM',
            title: 'ถูกยกเลิก: ไม่มาตามนัด',
            body: `การจอง ${bookingId} ถูกยกเลิกเนื่องจากไม่มาตามนัด (No-Show)`,
        },
    });

    // Log to SystemLog
    await prisma.systemLog.create({
        data: {
            action: 'BOOKING_NO_SHOW',
            entity: 'Booking',
            entityId: bookingId,
            performedBy: driverId,
            detail: `No-Show executed after ${NO_SHOW_TIMEOUT_MINUTES} minute timeout`,
        },
    });

    return updated;
};

/**
 * Get No-Show countdown status for a booking
 */
const getNoShowStatus = async (bookingId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, noShowDeadline: true, status: true },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');

    if (!booking.noShowDeadline) {
        return { active: false, bookingId };
    }

    const now = new Date();
    const deadline = new Date(booking.noShowDeadline);
    const remainingMs = Math.max(0, deadline.getTime() - now.getTime());

    return {
        active: remainingMs > 0,
        bookingId,
        deadline: booking.noShowDeadline,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        expired: remainingMs <= 0,
    };
};

module.exports = {
    NO_SHOW_TIMEOUT_MINUTES,
    startNoShowCountdown,
    cancelNoShowCountdown,
    executeNoShow,
    getNoShowStatus,
};
