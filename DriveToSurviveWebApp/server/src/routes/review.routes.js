const express = require('express');
const validate = require('../middlewares/validate');
const { protect, requireAdmin } = require('../middlewares/auth');
const reviewController = require('../controllers/review.controller');
const {
    createReviewSchema,
    createDisputeSchema,
    resolveDisputeSchema,
    paginationQuery,
    disputeListQuery,
} = require('../validations/review.validation');

const router = express.Router();

// ─── Admin: Dispute Management ───────────────────────────

// GET /reviews/disputes/admin
router.get(
    '/disputes/admin',
    protect,
    requireAdmin,
    validate({ query: disputeListQuery }),
    reviewController.listDisputesAdmin
);

// PATCH /reviews/disputes/:id
router.patch(
    '/disputes/:id',
    protect,
    requireAdmin,
    validate({ body: resolveDisputeSchema }),
    reviewController.resolveDisputeAdmin
);

// ─── User: Review Endpoints ─────────────────────────────

// GET /reviews/me — my submitted reviews
router.get(
    '/me',
    protect,
    validate({ query: paginationQuery }),
    reviewController.getMyReviews
);

// GET /reviews/pending — bookings I haven't reviewed yet
router.get(
    '/pending',
    protect,
    reviewController.getPendingReviews
);

// POST /reviews — create a review
router.post(
    '/',
    protect,
    validate({ body: createReviewSchema }),
    reviewController.createReview
);

// POST /reviews/disputes — driver creates a dispute
router.post(
    '/disputes',
    protect,
    validate({ body: createDisputeSchema }),
    reviewController.createDispute
);

// GET /reviews/driver/:driverId — public driver reviews
router.get(
    '/driver/:driverId',
    validate({ query: paginationQuery }),
    reviewController.getDriverReviews
);

// GET /reviews/driver/:driverId/stats — public driver stats
router.get(
    '/driver/:driverId/stats',
    reviewController.getDriverStats
);

// GET /reviews/booking/:bookingId — review for specific booking
router.get(
    '/booking/:bookingId',
    protect,
    reviewController.getReviewByBooking
);

// GET /reviews/check/:bookingId — check if already reviewed
router.get(
    '/check/:bookingId',
    protect,
    reviewController.hasReviewed
);

module.exports = router;
