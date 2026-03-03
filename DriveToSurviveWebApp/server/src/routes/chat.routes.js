const express = require('express');
const validate = require('../middlewares/validate');
const { protect, requireAdmin } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const upload = require('../middlewares/upload.middleware');
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

// GET /chat/sessions/:routeId — get session by route
router.get(
    '/sessions/:routeId',
    protect,
    chatController.getSession
);

// GET /chat/sessions/booking/:bookingId — backward compat
router.get(
    '/sessions/booking/:bookingId',
    protect,
    chatController.getSessionByBooking
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

// PATCH /chat/messages/:messageId/edit — edit a message
router.patch(
    '/messages/:messageId/edit',
    protect,
    validate({ body: require('../validations/chat.validation').editMessageSchema }),
    chatController.editMessage
);

// ─── Report Endpoints ────────────────────────────────────

// POST /chat/reports — create report
router.post(
    '/reports',
    protect,
    authLimiter,
    validate({ body: createReportSchema }),
    chatController.createReport
);

// ─── Image Upload ────────────────────────────────────────

// POST /chat/:sessionId/image — send image message
router.post(
    '/:sessionId/image',
    protect,
    upload.single('image'),
    chatController.sendImageMessage
);

// ─── Quick Reply Shortcuts ───────────────────────────────

router.get('/shortcuts/me', protect, chatController.getMyShortcuts);
router.post('/shortcuts', protect, chatController.createShortcut);
router.patch('/shortcuts/:id', protect, chatController.updateShortcut);
router.delete('/shortcuts/:id', protect, chatController.deleteShortcut);

// ─── Admin: Chat Viewer ──────────────────────────────────

router.get('/admin/sessions', protect, requireAdmin, chatController.adminGetSessions);
router.get('/admin/sessions/:id/messages', protect, requireAdmin, chatController.adminGetMessages);
router.get('/admin/logs', protect, requireAdmin, chatController.adminGetLogs);

module.exports = router;
