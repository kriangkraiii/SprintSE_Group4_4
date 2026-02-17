const express = require('express');
const { protect, requireAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { searchLogsSchema, deleteLogParamsSchema } = require('../validations/systemLog.validation');
const systemLogController = require('../controllers/systemLog.controller');

const router = express.Router();

// Admin-only: ดู system logs
// พ.ร.บ.คอมพิวเตอร์ ม.26 — ต้องเก็บอย่างน้อย 90 วัน
router.get('/', protect, requireAdmin, validate({ query: searchLogsSchema }), systemLogController.getLogs);
router.delete('/:id', protect, requireAdmin, validate({ params: deleteLogParamsSchema }), systemLogController.deleteLog);

module.exports = router;
