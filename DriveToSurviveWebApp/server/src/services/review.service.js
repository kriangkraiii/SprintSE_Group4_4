const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { containsProfanity } = require('../utils/profanityFilter');

const REVIEW_WINDOW_DAYS = 7;
const POSITIVE_TAGS = ['polite', 'safe_driving', 'clean_car', 'on_time', 'good_conversation'];
const NEGATIVE_TAGS = ['reckless_driving', 'impolite', 'dirty_car', 'late_arrival', 'wrong_route'];

/**
 * Create a review for a completed booking
 */
const createReview = async (bookingId, passengerId, data) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { route: { select: { driverId: true } } },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.passengerId !== passengerId) throw new ApiError(403, 'Not your booking');
    if (booking.status !== 'COMPLETED') throw new ApiError(400, 'Booking is not completed');

    // 7-day review window check
    if (booking.completedAt) {
        const deadline = new Date(booking.completedAt);
        deadline.setDate(deadline.getDate() + REVIEW_WINDOW_DAYS);
        if (new Date() > deadline) {
            throw new ApiError(410, 'Review period expired (7 days)');
        }
    }

    // Duplicate check
    const existing = await prisma.rideReview.findUnique({
        where: { bookingId_passengerId: { bookingId, passengerId } },
    });
    if (existing) throw new ApiError(409, 'Already reviewed');

    // Profanity check — block submission entirely
    if (data.comment) {
        const check = containsProfanity(data.comment);
        if (check.hasProfanity) {
            throw new ApiError(400, 'Review contains inappropriate language. Please remove: ' + check.words.join(', '));
        }
    }
    if (data.privateFeedback) {
        const check = containsProfanity(data.privateFeedback);
        if (check.hasProfanity) {
            throw new ApiError(400, 'Private feedback contains inappropriate language.');
        }
    }

    // Mandatory text for 1-2 stars
    if (data.rating <= 2 && (!data.comment || data.comment.trim().length < 10)) {
        throw new ApiError(400, 'Text feedback is required for 1-2 star ratings (minimum 10 characters)');
    }

    // Validate tags against rating
    if (data.tags && data.tags.length > 0) {
        const validTags = data.rating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS;
        const invalidTags = data.tags.filter(t => !validTags.includes(t));
        if (invalidTags.length > 0) {
            throw new ApiError(400, `Invalid tags for this rating: ${invalidTags.join(', ')}`);
        }
    }

    // Mandatory tag for 1-3 stars
    if (data.rating <= 3 && (!data.tags || data.tags.length === 0)) {
        throw new ApiError(400, 'At least one tag is required for 1-3 star ratings');
    }

    const driverId = booking.route.driverId;

    // Get passenger's display name
    const passenger = await prisma.user.findUnique({
        where: { id: passengerId },
        select: { firstName: true },
    });

    const displayName = data.isAnonymous
        ? 'Anonymous Passenger'
        : (passenger?.firstName || 'Passenger');

    // Create review + update driver stats atomically
    const review = await prisma.$transaction(async (tx) => {
        const created = await tx.rideReview.create({
            data: {
                bookingId,
                passengerId,
                driverId,
                rating: data.rating,
                tags: data.tags || [],
                comment: data.comment || null,
                privateFeedback: data.privateFeedback || null,
                isAnonymous: data.isAnonymous || false,
                displayName,
            },
        });

        // Upsert DriverStats atomically
        const stats = await tx.driverStats.findUnique({
            where: { driverId },
        });

        if (stats) {
            const newTotal = stats.totalReviews + 1;
            const newAvg = ((stats.avgRating * stats.totalReviews) + data.rating) / newTotal;

            // Update tag counts
            const tagCounts = stats.tagCounts || {};
            if (data.tags) {
                for (const tag of data.tags) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            }

            await tx.driverStats.update({
                where: { driverId },
                data: {
                    totalReviews: newTotal,
                    avgRating: Math.round(newAvg * 100) / 100,
                    tagCounts,
                },
            });
        } else {
            const tagCounts = {};
            if (data.tags) {
                for (const tag of data.tags) {
                    tagCounts[tag] = 1;
                }
            }

            await tx.driverStats.create({
                data: {
                    driverId,
                    totalReviews: 1,
                    avgRating: data.rating,
                    tagCounts,
                },
            });
        }

        return created;
    });

    return review;
};

/**
 * Get reviews for a driver (public view)
 */
const getReviewsByDriver = async (driverId, opts = {}) => {
    const { page = 1, limit = 20 } = opts;
    const skip = (page - 1) * limit;

    const where = {
        driverId,
        status: { in: ['ACTIVE', 'ANONYMIZED'] },
    };

    const [total, data] = await prisma.$transaction([
        prisma.rideReview.count({ where }),
        prisma.rideReview.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
            select: {
                id: true,
                rating: true,
                tags: true,
                comment: true,
                isAnonymous: true,
                displayName: true,
                status: true,
                createdAt: true,
                // No passengerId or privateFeedback in public view
            },
        }),
    ]);

    return {
        data,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get my submitted reviews
 */
const getMyReviews = async (passengerId, opts = {}) => {
    const { page = 1, limit = 20 } = opts;
    const skip = (page - 1) * limit;

    const where = { passengerId };

    const [total, data] = await prisma.$transaction([
        prisma.rideReview.count({ where }),
        prisma.rideReview.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
            select: {
                id: true,
                bookingId: true,
                driverId: true,
                rating: true,
                tags: true,
                comment: true,
                privateFeedback: true,
                isAnonymous: true,
                displayName: true,
                status: true,
                createdAt: true,
                driver: { select: { firstName: true, profilePicture: true } },
            },
        }),
    ]);

    return {
        data,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get driver stats (public)
 */
const getDriverStats = async (driverId) => {
    const stats = await prisma.driverStats.findUnique({
        where: { driverId },
    });

    return stats || { driverId, totalRides: 0, totalReviews: 0, avgRating: 0, tagCounts: {} };
};

/**
 * Get a review for a specific booking (for driver — includes privateFeedback)
 */
const getReviewByBooking = async (bookingId, userId) => {
    const review = await prisma.rideReview.findFirst({
        where: { bookingId },
        select: {
            id: true,
            bookingId: true,
            rating: true,
            tags: true,
            comment: true,
            privateFeedback: true,
            isAnonymous: true,
            displayName: true,
            status: true,
            createdAt: true,
        },
    });

    if (!review) throw new ApiError(404, 'Review not found');

    // Only driver or the reviewer can see privateFeedback
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { route: { select: { driverId: true } } },
    });

    const isDriver = booking?.route?.driverId === userId;
    const isPassenger = booking?.passengerId === userId;

    if (!isDriver && !isPassenger) {
        // Public view — strip private feedback
        review.privateFeedback = null;
    }

    return review;
};

/**
 * Anonymize all reviews when a user deletes their account (PDPA compliance)
 */
const anonymizeReviews = async (passengerId) => {
    const result = await prisma.rideReview.updateMany({
        where: { passengerId },
        data: {
            displayName: 'Anonymous Passenger',
            status: 'ANONYMIZED',
        },
    });

    return { anonymized: result.count };
};

/**
 * Check if a booking has been reviewed
 */
const hasReviewed = async (bookingId, passengerId) => {
    const review = await prisma.rideReview.findUnique({
        where: { bookingId_passengerId: { bookingId, passengerId } },
        select: { id: true },
    });
    return !!review;
};

/**
 * Get pending reviews for a passenger (completed bookings without a review, within 7 days)
 */
const getPendingReviews = async (passengerId) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - REVIEW_WINDOW_DAYS);

    const bookings = await prisma.booking.findMany({
        where: {
            passengerId,
            status: 'COMPLETED',
            completedAt: { gte: cutoff },
            reviews: { none: { passengerId } },
        },
        select: {
            id: true,
            completedAt: true,
            route: {
                select: {
                    driver: { select: { firstName: true, profilePicture: true } },
                    startLocation: true,
                    endLocation: true,
                },
            },
        },
        orderBy: { completedAt: 'desc' },
    });

    return bookings;
};

module.exports = {
    createReview,
    getReviewsByDriver,
    getMyReviews,
    getDriverStats,
    getReviewByBooking,
    anonymizeReviews,
    hasReviewed,
    getPendingReviews,
    POSITIVE_TAGS,
    NEGATIVE_TAGS,
    REVIEW_WINDOW_DAYS,
};
