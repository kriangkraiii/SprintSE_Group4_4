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

// ─── CRON Management ─────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../utils/prisma');

// Runtime state for CRON jobs (resets on server restart)
const cronState = {
    retentionPurge: {
        name: 'retentionPurge',
        label: 'Retention Purge (90 วัน)',
        schedule: 'ทุกวัน 02:00 UTC (09:00 เวลาไทย)',
        currentSchedule: '0 2 * * *',
        description: 'ลบข้อมูลแชท, บันทึกเสียง และ archive session ที่เกิน 90 วัน (พ.ร.บ.คอมพิวเตอร์)',
        task: null, // node-cron task reference
    },
    chatLifecycle: {
        name: 'chatLifecycle',
        label: 'Chat Lifecycle',
        schedule: 'ทุกชั่วโมง',
        currentSchedule: '3600000',
        description: 'เปลี่ยนสถานะ Chat Session: ENDED → READ_ONLY (24 ชม.) → ARCHIVED (7 วัน)',
        intervalId: null, // setInterval reference
    },
};

const SCHEDULE_LABELS = {
    '0 2 * * *': 'ทุกวัน 02:00 UTC (09:00 ไทย)',
    '0 0 * * *': 'ทุกวัน 00:00 UTC (07:00 ไทย)',
    '0 14 * * *': 'ทุกวัน 14:00 UTC (21:00 ไทย)',
    '0 2 * * 0': 'ทุกสัปดาห์ วันอาทิตย์ 02:00 UTC',
    '*/30 * * * *': 'ทุก 30 นาที (ทดสอบ)',
    '3600000': 'ทุก 1 ชั่วโมง',
    '1800000': 'ทุก 30 นาที',
    '900000': 'ทุก 15 นาที',
    '300000': 'ทุก 5 นาที (ทดสอบ)',
    '7200000': 'ทุก 2 ชั่วโมง',
};

const getCronStatus = asyncHandler(async (req, res) => {
    const lastRetention = await prisma.systemLog.findFirst({
        where: { action: { in: ['RETENTION_PURGE', 'RETENTION_PURGE_FAILED'] } },
        orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    const lastLifecycle = await prisma.systemLog.findFirst({
        where: { action: 'CHAT_LIFECYCLE' },
        orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    const jobs = [
        {
            name: cronState.retentionPurge.name,
            label: cronState.retentionPurge.label,
            schedule: SCHEDULE_LABELS[cronState.retentionPurge.currentSchedule] || cronState.retentionPurge.currentSchedule,
            currentSchedule: cronState.retentionPurge.currentSchedule,
            description: cronState.retentionPurge.description,
            lastRun: lastRetention?.createdAt || null,
            lastStatus: lastRetention?.action === 'RETENTION_PURGE' ? 'SUCCESS' : lastRetention?.action === 'RETENTION_PURGE_FAILED' ? 'FAILED' : 'UNKNOWN',
            lastDetail: lastRetention?.detail || null,
        },
        {
            name: cronState.chatLifecycle.name,
            label: cronState.chatLifecycle.label,
            schedule: SCHEDULE_LABELS[cronState.chatLifecycle.currentSchedule] || cronState.chatLifecycle.currentSchedule,
            currentSchedule: cronState.chatLifecycle.currentSchedule,
            description: cronState.chatLifecycle.description,
            lastRun: lastLifecycle?.createdAt || null,
            lastStatus: lastLifecycle ? 'SUCCESS' : 'UNKNOWN',
            lastDetail: lastLifecycle?.detail || null,
        },
    ];

    res.json({ success: true, data: jobs });
});

const triggerCronJob = asyncHandler(async (req, res) => {
    const { jobName } = req.params;

    if (jobName === 'retentionPurge') {
        const { purgeExpiredData } = require('../jobs/retentionPurge');
        await purgeExpiredData();
        return res.json({ success: true, message: 'Retention purge triggered successfully' });
    }

    if (jobName === 'chatLifecycle') {
        const { runLifecycleCron } = require('../services/chatLifecycle.service');
        await runLifecycleCron();
        return res.json({ success: true, message: 'Chat lifecycle triggered successfully' });
    }

    res.status(400).json({ success: false, message: `Unknown CRON job: ${jobName}` });
});

const updateCronSchedule = asyncHandler(async (req, res) => {
    const { jobName } = req.params;
    const { schedule } = req.body;
    if (!schedule) return res.status(400).json({ success: false, message: 'schedule is required' });

    if (jobName === 'retentionPurge') {
        if (!cron.validate(schedule)) {
            return res.status(400).json({ success: false, message: `Invalid cron expression: ${schedule}` });
        }
        // Stop old task
        if (cronState.retentionPurge.task) {
            cronState.retentionPurge.task.stop();
        }
        // Start new one
        const { purgeExpiredData } = require('../jobs/retentionPurge');
        cronState.retentionPurge.task = cron.schedule(schedule, () => {
            console.log('[RetentionPurge] Cron triggered (admin-scheduled)');
            purgeExpiredData();
        });
        cronState.retentionPurge.currentSchedule = schedule;
        cronState.retentionPurge.schedule = SCHEDULE_LABELS[schedule] || schedule;
        console.log(`[RetentionPurge] Schedule updated to: ${schedule}`);
        return res.json({ success: true, message: `Retention purge schedule updated to: ${SCHEDULE_LABELS[schedule] || schedule}` });
    }

    if (jobName === 'chatLifecycle') {
        const intervalMs = Number(schedule);
        if (!intervalMs || intervalMs < 60000) {
            return res.status(400).json({ success: false, message: 'Interval must be at least 60000ms (1 minute)' });
        }
        // Clear old interval
        if (cronState.chatLifecycle.intervalId) {
            clearInterval(cronState.chatLifecycle.intervalId);
        }
        // Start new one
        const { runLifecycleCron } = require('../services/chatLifecycle.service');
        cronState.chatLifecycle.intervalId = setInterval(
            () => runLifecycleCron().catch(e => console.error('[CRON] Lifecycle error:', e)),
            intervalMs
        );
        cronState.chatLifecycle.currentSchedule = String(intervalMs);
        cronState.chatLifecycle.schedule = SCHEDULE_LABELS[String(intervalMs)] || `ทุก ${Math.round(intervalMs / 60000)} นาที`;
        console.log(`[ChatLifecycle] Interval updated to: ${intervalMs}ms`);
        return res.json({ success: true, message: `Chat lifecycle interval updated to: ${SCHEDULE_LABELS[String(intervalMs)] || intervalMs + 'ms'}` });
    }

    res.status(400).json({ success: false, message: `Unknown CRON job: ${jobName}` });
});

module.exports = {
    suspendUser,
    unsuspendUser,
    getSuspensionStatus,
    listSuspendedUsers,
    exportSystemLogs,
    exportChatSession,
    getCronStatus,
    triggerCronJob,
    updateCronSchedule,
};
