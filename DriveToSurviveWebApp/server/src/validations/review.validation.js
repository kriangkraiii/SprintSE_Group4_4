const Joi = require('joi');

const createReviewSchema = Joi.object({
    bookingId: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    tags: Joi.array().items(Joi.string()).optional(),
    comment: Joi.string().max(1000).allow('', null).optional(),
    privateFeedback: Joi.string().max(500).allow('', null).optional(),
    isAnonymous: Joi.boolean().default(false),
});

const createDisputeSchema = Joi.object({
    reviewId: Joi.string().required(),
    reason: Joi.string().valid('FAKE_REVIEW', 'WRONG_PERSON', 'INACCURATE', 'OFFENSIVE', 'OTHER').required(),
    detail: Joi.string().min(20).max(1000).required(),
});

const resolveDisputeSchema = Joi.object({
    status: Joi.string().valid('RESOLVED', 'REJECTED').required(),
    adminNote: Joi.string().max(500).allow('', null).optional(),
    hideReview: Joi.boolean().default(false),
});

const paginationQuery = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

const disputeListQuery = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('PENDING', 'RESOLVED', 'REJECTED').optional(),
});

module.exports = {
    createReviewSchema,
    createDisputeSchema,
    resolveDisputeSchema,
    paginationQuery,
    disputeListQuery,
};
