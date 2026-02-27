const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Driver creates a dispute for a review
 */
const createDispute = async (reviewId, driverId, data) => {
    const review = await prisma.rideReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new ApiError(404, 'Review not found');
    if (review.driverId !== driverId) throw new ApiError(403, 'Not your review to dispute');

    // Check duplicate
    const existing = await prisma.reviewDispute.findUnique({
        where: { reviewId_driverId: { reviewId, driverId } },
    });
    if (existing) throw new ApiError(409, 'Already disputed');

    return prisma.reviewDispute.create({
        data: {
            reviewId,
            driverId,
            reason: data.reason,
            detail: data.detail,
        },
    });
};

/**
 * Admin resolves a dispute
 */
const resolveDispute = async (id, adminData) => {
    const dispute = await prisma.reviewDispute.findUnique({
        where: { id },
        include: { review: true },
    });
    if (!dispute) throw new ApiError(404, 'Dispute not found');
    if (dispute.status !== 'PENDING') throw new ApiError(400, 'Dispute already resolved');

    return prisma.$transaction(async (tx) => {
        const updated = await tx.reviewDispute.update({
            where: { id },
            data: {
                status: adminData.status, // RESOLVED or REJECTED
                adminNote: adminData.adminNote || null,
                resolvedAt: new Date(),
            },
        });

        // If RESOLVED and action is to hide the review
        if (adminData.status === 'RESOLVED' && adminData.hideReview) {
            await tx.rideReview.update({
                where: { id: dispute.reviewId },
                data: { status: 'HIDDEN' },
            });

            // Recalculate driver stats excluding hidden review
            const reviews = await tx.rideReview.findMany({
                where: { driverId: dispute.review.driverId, status: 'ACTIVE' },
                select: { rating: true, tags: true },
            });

            const totalReviews = reviews.length;
            const avgRating = totalReviews > 0
                ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 100) / 100
                : 0;

            const tagCounts = {};
            for (const r of reviews) {
                const tags = r.tags || [];
                for (const tag of tags) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            }

            await tx.driverStats.update({
                where: { driverId: dispute.review.driverId },
                data: { totalReviews, avgRating, tagCounts },
            });
        }

        return updated;
    });
};

/**
 * List disputes (admin)
 */
const listDisputes = async (opts = {}) => {
    const { page = 1, limit = 20, status } = opts;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [total, data] = await prisma.$transaction([
        prisma.reviewDispute.count({ where }),
        prisma.reviewDispute.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
            include: {
                review: {
                    select: { id: true, rating: true, comment: true, displayName: true },
                },
                driver: {
                    select: { id: true, firstName: true },
                },
            },
        }),
    ]);

    return {
        data,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    };
};

module.exports = {
    createDispute,
    resolveDispute,
    listDisputes,
};
