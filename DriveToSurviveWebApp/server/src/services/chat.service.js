const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { filterContent } = require('../utils/contentFilter');

const RETENTION_DAYS = 90;
const UNSEND_WINDOW_MINUTES = 5;

/**
 * Create a chat session when booking is confirmed
 */
const createSession = async (bookingId) => {
    // Check if session already exists (idempotent)
    const existing = await prisma.chatSession.findUnique({
        where: { bookingId },
    });
    if (existing) return existing;

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { route: { select: { driverId: true } } },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');

    const retentionExpiresAt = new Date();
    retentionExpiresAt.setDate(retentionExpiresAt.getDate() + RETENTION_DAYS);

    const session = await prisma.chatSession.create({
        data: {
            bookingId,
            driverId: booking.route.driverId,
            passengerId: booking.passengerId,
            retentionExpiresAt,
        },
    });

    // Auto-send system welcome message
    await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            senderId: booking.route.driverId, // system uses driver as sender context
            type: 'SYSTEM',
            content: '💬 แชทเริ่มต้นแล้ว คุณสามารถคุยกันได้อย่างปลอดภัย / Chat started. You can communicate safely.',
        },
    });

    return session;
};

/**
 * End a chat session when trip ends
 * Sets lifecycle timers: chatExpiresAt (+1 day), readOnlyExpiresAt (+8 days)
 */
const endSession = async (bookingId) => {
    const session = await prisma.chatSession.findUnique({
        where: { bookingId },
    });

    if (!session) throw new ApiError(404, 'Chat session not found');
    if (session.status === 'ENDED') return session;

    const now = new Date();
    const chatExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
    const readOnlyExpiresAt = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000); // +6 days

    const updated = await prisma.chatSession.update({
        where: { id: session.id },
        data: {
            status: 'ENDED',
            endedAt: now,
            chatExpiresAt,
            readOnlyExpiresAt,
        },
    });

    // Add system message
    await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            senderId: session.driverId,
            type: 'SYSTEM',
            content: '🔒 การเดินทางจบแล้ว — ยังคุยต่อได้อีก 1 วัน หลังจากนั้นจะเป็นอ่านอย่างเดียว',
        },
    });

    return updated;
};

/**
 * Send a message with content filtering
 * Lifecycle: ACTIVE = allowed, ENDED (within 1 day) = allowed, READ_ONLY/ARCHIVED = blocked
 */
const sendMessage = async (sessionId, senderId, data) => {
    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) throw new ApiError(404, 'Chat session not found');

    // Lifecycle check
    if (session.status === 'READ_ONLY') {
        throw new ApiError(403, 'แชทนี้อ่านได้อย่างเดียว — Chat is read-only');
    }
    if (session.status === 'ARCHIVED') {
        throw new ApiError(403, 'แชทนี้ถูกลบแล้ว — Chat has been archived');
    }
    if (session.status === 'ENDED') {
        // Allow if within chatExpiresAt window
        if (session.chatExpiresAt && new Date() > session.chatExpiresAt) {
            throw new ApiError(403, 'หมดเวลาส่งข้อความแล้ว — Chat window expired');
        }
    }

    // Verify sender is participant
    if (session.driverId !== senderId && session.passengerId !== senderId) {
        throw new ApiError(403, 'You are not a participant in this chat');
    }

    // Apply content filter
    const { filtered, original, isFiltered, matches } = filterContent(data.content || '');

    const unsendDeadline = new Date();
    unsendDeadline.setMinutes(unsendDeadline.getMinutes() + UNSEND_WINDOW_MINUTES);

    const message = await prisma.chatMessage.create({
        data: {
            sessionId,
            senderId,
            type: data.type || 'TEXT',
            content: filtered,
            imageUrl: data.imageUrl || null,
            originalContent: isFiltered ? original : null,
            isFiltered,
            unsendDeadline,
            metadata: data.metadata || null,
        },
        select: {
            id: true,
            sessionId: true,
            senderId: true,
            type: true,
            content: true,
            imageUrl: true,
            isFiltered: true,
            isUnsent: true,
            metadata: true,
            createdAt: true,
            sender: { select: { firstName: true, profilePicture: true } },
        },
    });

    return message;
};

/**
 * Get messages for a session (paginated)
 */
const getMessages = async (sessionId, userId, opts = {}) => {
    const { page = 1, limit = 50 } = opts;

    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) throw new ApiError(404, 'Chat session not found');

    // Verify participant
    if (session.driverId !== userId && session.passengerId !== userId) {
        throw new ApiError(403, 'You are not a participant in this chat');
    }

    const skip = (page - 1) * limit;

    const [total, messages] = await prisma.$transaction([
        prisma.chatMessage.count({ where: { sessionId } }),
        prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
            select: {
                id: true,
                senderId: true,
                type: true,
                content: true,
                isFiltered: true,
                isUnsent: true,
                metadata: true,
                createdAt: true,
                sender: { select: { firstName: true, profilePicture: true } },
            },
        }),
    ]);

    return {
        data: messages.reverse(), // chronological order
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Unsend a message within the time window
 */
const unsendMessage = async (messageId, senderId) => {
    const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
    });

    if (!message) throw new ApiError(404, 'Message not found');
    if (message.senderId !== senderId) throw new ApiError(403, 'Not your message');
    if (message.isUnsent) throw new ApiError(400, 'Message already unsent');
    if (message.type === 'SYSTEM') throw new ApiError(400, 'Cannot unsend system messages');

    // Check time window
    if (message.unsendDeadline && new Date() > message.unsendDeadline) {
        throw new ApiError(400, 'Unsend time expired (5 minutes)');
    }

    // Mark as unsent — content replaced but original preserved in DB for audit (90-day retention)
    return prisma.chatMessage.update({
        where: { id: messageId },
        data: {
            content: 'ข้อความถูกลบ / Message unsent',
            isUnsent: true,
        },
        select: {
            id: true,
            content: true,
            isUnsent: true,
        },
    });
};

/**
 * Get session by booking ID
 */
const getSession = async (bookingId, userId) => {
    const session = await prisma.chatSession.findUnique({
        where: { bookingId },
        select: {
            id: true,
            bookingId: true,
            status: true,
            createdAt: true,
            endedAt: true,
            driver: { select: { id: true, firstName: true, profilePicture: true } },
            passenger: { select: { id: true, firstName: true, profilePicture: true } },
        },
    });

    if (!session) throw new ApiError(404, 'Chat session not found');

    if (session.driver.id !== userId && session.passenger.id !== userId) {
        throw new ApiError(403, 'You are not a participant in this chat');
    }

    return session;
};

/**
 * Share live location in chat
 */
const shareLocation = async (sessionId, senderId, lat, lon) => {
    return sendMessage(sessionId, senderId, {
        type: 'LOCATION',
        content: `📍 Shared location: ${lat}, ${lon}`,
        metadata: { lat, lon, isLive: true },
    });
};

/**
 * Get sessions for a user (active + recent)
 */
const getMySessions = async (userId) => {
    const sessions = await prisma.chatSession.findMany({
        where: {
            OR: [
                { driverId: userId },
                { passengerId: userId },
            ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
            id: true,
            bookingId: true,
            status: true,
            createdAt: true,
            endedAt: true,
            driver: { select: { id: true, firstName: true, profilePicture: true } },
            passenger: { select: { id: true, firstName: true, profilePicture: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { content: true, createdAt: true },
            },
        },
    });

    return sessions;
};

module.exports = {
    createSession,
    endSession,
    sendMessage,
    getMessages,
    unsendMessage,
    getSession,
    shareLocation,
    getMySessions,
    RETENTION_DAYS,
    UNSEND_WINDOW_MINUTES,
};
