const Joi = require('joi');

const createSessionSchema = Joi.object({
    bookingId: Joi.string().required(),
});

const endSessionSchema = Joi.object({
    bookingId: Joi.string().required(),
});

const sendMessageSchema = Joi.object({
    content: Joi.string().max(2000).required(),
    type: Joi.string().valid('TEXT', 'LOCATION', 'QUICK_REPLY').default('TEXT'),
    metadata: Joi.object().optional(),
});

const shareLocationSchema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required(),
});

const createReportSchema = Joi.object({
    sessionId: Joi.string().required(),
    messageId: Joi.string().required(),
    reason: Joi.string().valid('HARASSMENT', 'SPAM', 'INAPPROPRIATE', 'PRIVACY_VIOLATION', 'OTHER').required(),
    detail: Joi.string().max(500).allow('', null).optional(),
});

const updateReportSchema = Joi.object({
    status: Joi.string().valid('REVIEWED', 'DISMISSED').required(),
    adminNote: Joi.string().max(500).allow('', null).optional(),
});

const paginationQuery = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
});

const reportListQuery = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('PENDING', 'REVIEWED', 'DISMISSED').optional(),
});

module.exports = {
    createSessionSchema,
    endSessionSchema,
    sendMessageSchema,
    shareLocationSchema,
    createReportSchema,
    updateReportSchema,
    paginationQuery,
    reportListQuery,
};
