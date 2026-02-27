const express = require('express');
const { protect, requireAdmin } = require('../middlewares/auth');
const controller = require('../controllers/adminSprint2.controller');

const router = express.Router();

// All routes require admin authentication
router.use(protect, requireAdmin);

// ─── Role-Based Suspension ───────────────────────────────

// PATCH /admin/users/:userId/suspend
router.patch('/users/:userId/suspend', controller.suspendUser);

// PATCH /admin/users/:userId/unsuspend
router.patch('/users/:userId/unsuspend', controller.unsuspendUser);

// GET /admin/users/:userId/suspension-status
router.get('/users/:userId/suspension-status', controller.getSuspensionStatus);

// GET /admin/users/suspended — list all suspended users
router.get('/users/suspended', controller.listSuspendedUsers);

// ─── Log Export (พ.ร.บ.คอมพิวเตอร์) ───────────────────────

// GET /admin/export/logs?from=&to=&userId=&format=csv
router.get('/export/logs', controller.exportSystemLogs);

// GET /admin/export/chat/:sessionId — full chat export for police
router.get('/export/chat/:sessionId', controller.exportChatSession);

module.exports = router;
