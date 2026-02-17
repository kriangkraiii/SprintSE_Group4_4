const asyncHandler = require('express-async-handler');
const systemLogService = require('../services/systemLog.service');

/**
 * GET /api/system-logs
 * Admin-only: ดู activity logs ของระบบ
 * พ.ร.บ.คอมพิวเตอร์ ม.26 — ต้องเก็บ ≥ 90 วัน
 */
const getLogs = asyncHandler(async (req, res) => {
    const {
        page, limit,
        userId, ipAddress, action,
        createdFrom, createdTo,
        sortBy, sortOrder,
    } = req.query;

    const result = await systemLogService.searchLogs({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        userId,
        ipAddress,
        action,
        createdFrom,
        createdTo,
        sortBy,
        sortOrder,
    });

    res.status(200).json({
        success: true,
        message: 'System logs retrieved',
        ...result,
    });
});

/**
 * DELETE /api/system-logs/:id
 * Admin-only: ลบ log ได้เฉพาะรายการที่อายุเกิน 90 วันเท่านั้น
 */
const deleteLog = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await systemLogService.deleteLogById(id);

    res.status(200).json({
        success: true,
        message: 'System log deleted.',
        data: result,
    });
});

module.exports = { getLogs, deleteLog };
