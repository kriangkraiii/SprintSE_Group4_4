const express = require('express');
const { protect, requireAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { searchLogsSchema } = require('../validations/systemLog.validation');
const systemLogController = require('../controllers/systemLog.controller');

const router = express.Router();

// Admin-only: ดู system logs
// พ.ร.บ.คอมพิวเตอร์ ม.26 — Immutable logs (ไม่มี PUT/DELETE endpoint)
router.get('/', protect, requireAdmin, validate({ query: searchLogsSchema }), systemLogController.getLogs);

module.exports = router;
