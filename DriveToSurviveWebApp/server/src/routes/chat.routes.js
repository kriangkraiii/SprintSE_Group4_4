const express = require('express');
const validate = require('../middlewares/validate');
const { protect, requireAdmin } = require('../middlewares/auth');
const chatController = require('../controllers/chat.controller');
const {
    createSessionSchema,
    endSessionSchema,
    sendMessageSchema,
    shareLocationSchema,
    createReportSchema,
    updateReportSchema,
    paginationQuery,
    reportListQuery,
} = require('../validations/chat.validation');

const router = express.Router();

// ─── Admin: Report Management ────────────────────────────

// GET /chat/reports/admin
router.get(
    '/reports/admin',
    protect,
    requireAdmin,
    validate({ query: reportListQuery }),
    chatController.listReportsAdmin
);

// PATCH /chat/reports/:id
router.patch(
    '/reports/:id',
    protect,
    requireAdmin,
    validate({ body: updateReportSchema }),
    chatController.updateReportAdmin
);

// ─── Session Endpoints ───────────────────────────────────

// GET /chat/sessions/me — list my sessions
router.get(
    '/sessions/me',
    protect,
    chatController.getMySessions
);

// POST /chat/sessions — create session (on booking confirm)
router.post(
    '/sessions',
    protect,
    validate({ body: createSessionSchema }),
    chatController.createSession
);

// POST /chat/sessions/end — end session (on trip end)
router.post(
    '/sessions/end',
    protect,
    validate({ body: endSessionSchema }),
    chatController.endSession
);

// GET /chat/sessions/:bookingId — get session by booking
router.get(
    '/sessions/:bookingId',
    protect,
    chatController.getSession
);

// ─── Message Endpoints ───────────────────────────────────

// GET /chat/:sessionId/messages — get messages
router.get(
    '/:sessionId/messages',
    protect,
    validate({ query: paginationQuery }),
    chatController.getMessages
);

// POST /chat/:sessionId/messages — send message
router.post(
    '/:sessionId/messages',
    protect,
    validate({ body: sendMessageSchema }),
    chatController.sendMessage
);

// POST /chat/:sessionId/location — share location
router.post(
    '/:sessionId/location',
    protect,
    validate({ body: shareLocationSchema }),
    chatController.shareLocation
);

// PATCH /chat/messages/:messageId/unsend — unsend a message
router.patch(
    '/messages/:messageId/unsend',
    protect,
    chatController.unsendMessage
);

// ─── Report Endpoints ────────────────────────────────────

// POST /chat/reports — create report
router.post(
    '/reports',
    protect,
    validate({ body: createReportSchema }),
    chatController.createReport
);

module.exports = router;
