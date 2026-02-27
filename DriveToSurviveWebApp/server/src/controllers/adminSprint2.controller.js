const asyncHandler = require('express-async-handler');
const adminService = require('../services/adminSprint2.service');

// ─── Role-Based Suspension ───────────────────────────────

const suspendUser = asyncHandler(async (req, res) => {
    const adminId = req.user.sub;
    const { userId } = req.params;
    const { role, durationDays, reason } = req.body;

    if (!['passenger', 'driver', 'both'].includes(role)) {
        return res.status(400).json({ success: false, message: 'role must be passenger, driver, or both' });
    }

    const result = await adminService.suspendUserRole(userId, role, durationDays || 0, reason || 'No reason', adminId);
    res.json({ success: true, data: result });
});

const unsuspendUser = asyncHandler(async (req, res) => {
    const adminId = req.user.sub;
    const { userId } = req.params;
    const { role } = req.body;

    if (!['passenger', 'driver', 'both'].includes(role)) {
        return res.status(400).json({ success: false, message: 'role must be passenger, driver, or both' });
    }

    const result = await adminService.unsuspendUserRole(userId, role, adminId);
    res.json({ success: true, data: result });
});

const getSuspensionStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await adminService.getSuspensionStatus(userId);
    res.json({ success: true, data: result });
});

const listSuspendedUsers = asyncHandler(async (req, res) => {
    const result = await adminService.listSuspendedUsers(req.query);
    res.json({ success: true, ...result });
});

// ─── Log Export ──────────────────────────────────────────

const exportSystemLogs = asyncHandler(async (req, res) => {
    const { format } = req.query;
    const result = await adminService.exportSystemLogs(req.query);

    if (format === 'csv') {
        const csv = adminService.toCSV(result.data);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="system_logs_${Date.now()}.csv"`);
        return res.send('\uFEFF' + csv); // BOM for Thai chars in Excel
    }

    res.json(result);
});

const exportChatSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const result = await adminService.exportChatSession(sessionId);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="chat_export_${sessionId}_${Date.now()}.json"`);
    res.json(result);
});

module.exports = {
    suspendUser,
    unsuspendUser,
    getSuspensionStatus,
    listSuspendedUsers,
    exportSystemLogs,
    exportChatSession,
};
