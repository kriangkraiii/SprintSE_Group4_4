const prisma = require('../utils/prisma');
const { cronConfig } = require('../config/cronConfig');

/**
 * Chat Lifecycle CRON - runs hourly
 * 
 * Transitions:
 *   ENDED → READ_ONLY   when chatExpiresAt < now  (1 day after trip ends)
 *   READ_ONLY → ARCHIVED when readOnlyExpiresAt < now (configurable, min 3 days)
 *     - Archives all messages to ChatLog before deleting
 * 
 * Admin Log Purge:
 *   Deletes ChatLog records older than adminLogRetentionDays (min 9 days)
 */

const transitionEndedToReadOnly = async () => {
    const now = new Date();
    const sessions = await prisma.chatSession.findMany({
        where: {
            status: 'ENDED',
            chatExpiresAt: { not: null, lt: now },
        },
        select: { id: true },
    });

    if (sessions.length === 0) return 0;

    await prisma.chatSession.updateMany({
        where: { id: { in: sessions.map(s => s.id) } },
        data: { status: 'READ_ONLY' },
    });

    return sessions.length;
};

const transitionReadOnlyToArchived = async () => {
    const now = new Date();
    const sessions = await prisma.chatSession.findMany({
        where: {
            status: 'READ_ONLY',
            readOnlyExpiresAt: { not: null, lt: now },
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    senderId: true,
                    type: true,
                    content: true,
                    imageUrl: true,
                    isFiltered: true,
                    originalContent: true,
                    metadata: true,
                    createdAt: true,
                },
            },
        },
    });

    if (sessions.length === 0) return 0;

    // Archive each session
    for (const session of sessions) {
        await prisma.chatLog.create({
            data: {
                sessionId: session.id,
                driverId: session.driverId,
                passengerId: session.passengerId,
                messages: session.messages,
                originalEndedAt: session.endedAt,
            },
        });

        // Delete messages
        await prisma.chatMessage.deleteMany({ where: { sessionId: session.id } });

        // Mark archived
        await prisma.chatSession.update({
            where: { id: session.id },
            data: { status: 'ARCHIVED' },
        });
    }

    return sessions.length;
};

const runLifecycleCron = async () => {
    console.log('[CRON] Chat lifecycle check starting...');
    const readOnly = await transitionEndedToReadOnly();
    const archived = await transitionReadOnlyToArchived();
    const purgedLogs = await purgeExpiredAdminLogs();
    console.log(`[CRON] Chat lifecycle: ${readOnly} → READ_ONLY, ${archived} → ARCHIVED, ${purgedLogs} logs purged`);
    return { readOnly, archived, purgedLogs };
};

/**
 * Purge ChatLog records older than adminLogRetentionDays
 * แอดมินต้องดู log ได้ย้อนหลังอย่างน้อย 9 วัน
 */
const purgeExpiredAdminLogs = async () => {
    const days = cronConfig.adminLogRetentionDays;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await prisma.chatLog.deleteMany({
        where: { archivedAt: { lt: cutoff } },
    });

    if (result.count > 0) {
        console.log(`[CRON] Purged ${result.count} expired ChatLog records (older than ${days} days)`);
        await prisma.systemLog.create({
            data: {
                action: 'CHAT_LOG_PURGE',
                entity: 'ChatLog',
                entityId: 'cron',
                performedBy: 'SYSTEM',
                detail: `Purged ${result.count} ChatLog records older than ${days} days`,
            },
        }).catch(() => {});
    }

    return result.count;
};

module.exports = { transitionEndedToReadOnly, transitionReadOnlyToArchived, runLifecycleCron, purgeExpiredAdminLogs };
