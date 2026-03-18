const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Driver creates a dispute for a review
 */
const createDispute = async (reviewId, driverId, data) => {
    const review = await prisma.rideReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new ApiError(404, 'Review not found');
    if (review.driverId !== driverId) throw new ApiError(403, 'Not your review to dispute');

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
 * Statuses:
 *   ACKNOWLEDGED — admin has reviewed and acknowledged the dispute
 *   REJECTED     — admin rejects the dispute (data is kept, category is set)
 */
const resolveDispute = async (id, adminData) => {
    const dispute = await prisma.reviewDispute.findUnique({
        where: { id },
        include: { review: true },
    });
    if (!dispute) throw new ApiError(404, 'Dispute not found');
    if (dispute.status !== 'PENDING') throw new ApiError(400, 'Dispute already resolved');

    const updateData = {
        status: adminData.status,
        adminNote: adminData.adminNote || null,
        resolvedAt: new Date(),
    };

    // Attach category if provided (useful for REJECTED to organize)
    if (adminData.category) {
        updateData.category = adminData.category;
    }

    return prisma.reviewDispute.update({
        where: { id },
        data: updateData,
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
