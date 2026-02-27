const asyncHandler = require('express-async-handler');
const reviewService = require('../services/review.service');
const disputeService = require('../services/reviewDispute.service');

// ─── Review Endpoints ────────────────────────────────────

const createReview = asyncHandler(async (req, res) => {
    const passengerId = req.user.sub;
    const { bookingId, rating, tags, comment, privateFeedback, isAnonymous } = req.body;

    const review = await reviewService.createReview(bookingId, passengerId, {
        rating, tags, comment, privateFeedback, isAnonymous,
    });

    res.status(201).json({ success: true, data: review });
});

const getDriverReviews = asyncHandler(async (req, res) => {
    const { driverId } = req.params;
    const result = await reviewService.getReviewsByDriver(driverId, req.query);
    res.status(200).json({ success: true, ...result });
});

const getDriverStats = asyncHandler(async (req, res) => {
    const { driverId } = req.params;
    const stats = await reviewService.getDriverStats(driverId);
    res.status(200).json({ success: true, data: stats });
});

const getMyReviews = asyncHandler(async (req, res) => {
    const passengerId = req.user.sub;
    const result = await reviewService.getMyReviews(passengerId, req.query);
    res.status(200).json({ success: true, ...result });
});

const getReviewByBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.sub;
    const review = await reviewService.getReviewByBooking(bookingId, userId);
    res.status(200).json({ success: true, data: review });
});

const getPendingReviews = asyncHandler(async (req, res) => {
    const passengerId = req.user.sub;
    const bookings = await reviewService.getPendingReviews(passengerId);
    res.status(200).json({ success: true, data: bookings });
});

const hasReviewed = asyncHandler(async (req, res) => {
    const passengerId = req.user.sub;
    const { bookingId } = req.params;
    const reviewed = await reviewService.hasReviewed(bookingId, passengerId);
    res.status(200).json({ success: true, data: { reviewed } });
});

// ─── Dispute Endpoints ───────────────────────────────────

const createDispute = asyncHandler(async (req, res) => {
    const driverId = req.user.sub;
    const { reviewId, reason, detail } = req.body;
    const dispute = await disputeService.createDispute(reviewId, driverId, { reason, detail });
    res.status(201).json({ success: true, data: dispute });
});

const listDisputesAdmin = asyncHandler(async (req, res) => {
    const result = await disputeService.listDisputes(req.query);
    res.status(200).json({ success: true, ...result });
});

const resolveDisputeAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await disputeService.resolveDispute(id, req.body);
    res.status(200).json({ success: true, data: updated });
});

module.exports = {
    createReview,
    getDriverReviews,
    getDriverStats,
    getMyReviews,
    getReviewByBooking,
    getPendingReviews,
    hasReviewed,
    createDispute,
    listDisputesAdmin,
    resolveDisputeAdmin,
};
