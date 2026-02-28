/**
 * 90-Day Retention Cron Job
 * Purges expired ChatMessages, VoiceCallLogs, and archives ChatSessions.
 * Compliance: Thai Computer Crime Act (พ.ร.บ.คอมพิวเตอร์)
 *
 * Schedule: Daily at 02:00 UTC
 * Usage: require('./jobs/retentionPurge') in app.js
 */

const cron = require('node-cron');
const prisma = require('../utils/prisma');

const RETENTION_DAYS = 90;

async function purgeExpiredData() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    console.log(`[RetentionPurge] Starting purge for records older than ${cutoff.toISOString()}`);

    let totalDeleted = 0;

    try {
        // 1. Find sessions with active disputes — exclude from purge
        const activeDisputes = await prisma.chatReport.findMany({
            where: { status: 'PENDING' },
            select: { sessionId: true },
        });
        const protectedSessionIds = new Set(activeDisputes.map(d => d.sessionId));

        // 2. Delete expired ChatMessages (via session's retentionExpiresAt)
        const expiredMessages = await prisma.chatMessage.deleteMany({
            where: {
                session: { retentionExpiresAt: { lte: cutoff } },
                sessionId: { notIn: [...protectedSessionIds] },
            },
        });
        totalDeleted += expiredMessages.count;
        console.log(`[RetentionPurge] Deleted ${expiredMessages.count} expired chat messages`);

        // 3. Delete expired VoiceCallLogs
        const expiredCalls = await prisma.voiceCallLog.deleteMany({
            where: {
                retentionExpiresAt: { lte: cutoff },
                sessionId: { notIn: [...protectedSessionIds] },
            },
        });
        totalDeleted += expiredCalls.count;
        console.log(`[RetentionPurge] Deleted ${expiredCalls.count} expired voice call logs`);

        // 4. Archive empty sessions (all messages purged)
        const emptySessions = await prisma.chatSession.findMany({
            where: {
                status: 'ENDED',
                retentionExpiresAt: { lte: cutoff },
                id: { notIn: [...protectedSessionIds] },
            },
            select: { id: true },
        });

        if (emptySessions.length > 0) {
            const sessionIds = emptySessions.map(s => s.id);
            await prisma.chatSession.updateMany({
                where: { id: { in: sessionIds } },
                data: { status: 'ARCHIVED' },
            });
            console.log(`[RetentionPurge] Archived ${sessionIds.length} expired chat sessions`);
        }

        // 5. Log purge result to SystemLog
        await prisma.systemLog.create({
            data: {
                action: 'RETENTION_PURGE',
                entity: 'ChatMessage',
                entityId: 'cron',
                performedBy: 'SYSTEM',
                detail: `Purged ${totalDeleted} records. Messages: ${expiredMessages.count}, Calls: ${expiredCalls.count}, Sessions archived: ${emptySessions.length}`,
            },
        });

        console.log(`[RetentionPurge] Complete. Total records purged: ${totalDeleted}`);
    } catch (err) {
        console.error('[RetentionPurge] Failed:', err.message);

        await prisma.systemLog.create({
            data: {
                action: 'RETENTION_PURGE_FAILED',
                entity: 'ChatMessage',
                entityId: 'cron',
                performedBy: 'SYSTEM',
                detail: err.message,
            },
        }).catch(() => { });
    }
}

// Schedule: daily at 02:00 UTC
function startRetentionCron() {
    cron.schedule('0 2 * * *', () => {
        console.log('[RetentionPurge] Cron triggered');
        purgeExpiredData();
    });
    console.log('[RetentionPurge] Cron job scheduled (daily 02:00 UTC)');
}

module.exports = { startRetentionCron, purgeExpiredData, RETENTION_DAYS };
