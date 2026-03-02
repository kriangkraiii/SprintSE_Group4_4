const prisma = require('../utils/prisma');

/**
 * Chat Lifecycle CRON - runs hourly
 * 
 * Transitions:
 *   ENDED → READ_ONLY   when chatExpiresAt < now  (1 day after trip ends)
 *   READ_ONLY → ARCHIVED when readOnlyExpiresAt < now (8 days after trip ends)
 *     - Archives all messages to ChatLog before deleting
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
    console.log(`[CRON] Chat lifecycle: ${readOnly} → READ_ONLY, ${archived} → ARCHIVED`);
    return { readOnly, archived };
};

module.exports = { transitionEndedToReadOnly, transitionReadOnlyToArchived, runLifecycleCron };
