const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const { filterContent } = require('../utils/contentFilter');

const RETENTION_DAYS = 90;
const UNSEND_WINDOW_MINUTES = 5;

/**
 * Get or create a group chat session for a route
 * Called when first booking is confirmed on a route
 */
const createSession = async (routeId, userId) => {
    // Check if session already exists (idempotent)
    const existing = await prisma.chatSession.findUnique({
        where: { routeId },
        include: { participants: { select: { userId: true } } },
    });
    if (existing) {
        // Auto-add participant if not already in
        await addParticipant(existing.id, userId);
        return existing;
    }

    const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { driverId: true },
    });
    if (!route) throw new ApiError(404, 'Route not found');

    const retentionExpiresAt = new Date();
    retentionExpiresAt.setDate(retentionExpiresAt.getDate() + RETENTION_DAYS);

    // สร้าง participant list — ป้องกัน duplicate เมื่อ driver === userId
    const participantCreates = [{ userId: route.driverId }];
    if (userId !== route.driverId) {
        participantCreates.push({ userId });
    }

    const session = await prisma.chatSession.create({
        data: {
            routeId,
            driverId: route.driverId,
            retentionExpiresAt,
            participants: {
                create: participantCreates,
            },
        },
    });

    await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            senderId: route.driverId,
            type: 'SYSTEM',
            content: '💬 แชทกลุ่มเริ่มต้นแล้ว ผู้โดยสารและคนขับสามารถคุยกันได้อย่างปลอดภัย',
        },
    });

    return session;
};

/**
 * Add a participant to an existing group chat session
 */
const addParticipant = async (sessionId, userId) => {
    // Check if already a participant — skip system message if so
    const existing = await prisma.chatSessionParticipant.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) return; // Already in — no need to notify again

    // Actually add new participant
    await prisma.chatSessionParticipant.create({
        data: { sessionId, userId },
    });

    // System message only for genuinely new participants
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });
    await prisma.chatMessage.create({
        data: {
            sessionId,
            senderId: userId,
            type: 'SYSTEM',
            content: `👤 ${user?.firstName || 'ผู้โดยสาร'} เข้าร่วมห้องแชท`,
        },
    });
};

/**
 * End a chat session when trip ends
 */
const endSession = async (routeId) => {
    const session = await prisma.chatSession.findUnique({ where: { routeId } });
    if (!session) throw new ApiError(404, 'Chat session not found');
    if (session.status === 'ENDED') return session;

    const now = new Date();
    const chatExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const readOnlyExpiresAt = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const updated = await prisma.chatSession.update({
        where: { id: session.id },
        data: { status: 'ENDED', endedAt: now, chatExpiresAt, readOnlyExpiresAt },
    });

    return updated;
};

/**
 * Check if user is a participant in the session
 */
const isParticipant = async (sessionId, userId) => {
    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { driverId: true },
    });
    if (!session) return false;
    if (session.driverId === userId) return true;

    const participant = await prisma.chatSessionParticipant.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
    });
    return !!participant;
};

/**
 * Send a message with content filtering
 */
const sendMessage = async (sessionId, senderId, data) => {
    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new ApiError(404, 'Chat session not found');

    // Lifecycle check
    if (session.status === 'READ_ONLY') throw new ApiError(403, 'แชทนี้อ่านได้อย่างเดียว');
    if (session.status === 'ARCHIVED') throw new ApiError(403, 'แชทนี้ถูกลบแล้ว');
    if (session.status === 'ENDED' && session.chatExpiresAt && new Date() > session.chatExpiresAt) {
        throw new ApiError(403, 'หมดเวลาส่งข้อความแล้ว');
    }

    // Verify sender is participant
    if (!(await isParticipant(sessionId, senderId))) {
        throw new ApiError(403, 'You are not a participant in this chat');
    }

    const { filtered, original, isFiltered } = filterContent(data.content || '');
    const unsendDeadline = new Date();
    unsendDeadline.setMinutes(unsendDeadline.getMinutes() + UNSEND_WINDOW_MINUTES);

    return prisma.chatMessage.create({
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
            id: true, sessionId: true, senderId: true, type: true, content: true,
            imageUrl: true, isFiltered: true, isUnsent: true, metadata: true, createdAt: true,
            sender: { select: { firstName: true, profilePicture: true } },
        },
    });
};

/**
 * Get messages for a session (paginated)
 */
const getMessages = async (sessionId, userId, opts = {}) => {
    const { page = 1, limit = 50 } = opts;

    if (!(await isParticipant(sessionId, userId))) {
        throw new ApiError(403, 'You are not a participant in this chat');
    }

    // Fetch session with route info for chat header
    const sessionInfo = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: {
            id: true, routeId: true, status: true, createdAt: true, endedAt: true,
            chatExpiresAt: true, readOnlyExpiresAt: true,
            driver: { select: { id: true, firstName: true, profilePicture: true } },
            route: { select: { startLocation: true, endLocation: true } },
            participants: {
                select: {
                    user: { select: { id: true, firstName: true, profilePicture: true } },
                },
            },
        },
    });

    const skip = (page - 1) * limit;
    const [total, messages, session] = await prisma.$transaction([
        prisma.chatMessage.count({ where: { sessionId } }),
        prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
            select: {
                id: true, senderId: true, type: true, content: true,
                imageUrl: true, isFiltered: true, isUnsent: true, metadata: true, createdAt: true,
                sender: { select: { firstName: true, profilePicture: true } },
            },
        }),
        prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                driver: { select: { id: true, firstName: true, profilePicture: true } }
            }
        })
    ]);

    // Format passenger info for UI compatibility
    const participants = await prisma.chatSessionParticipant.findMany({
        where: { sessionId },
        include: { user: { select: { id: true, firstName: true, profilePicture: true } } }
    });

    if (session) {
        const passengerParticipant = participants.find(p => p.userId !== session.driverId);
        if (passengerParticipant) {
            session.passenger = passengerParticipant.user;
        }
    }

    return {
        session,
        data: messages.reverse(),
        session: sessionInfo,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Unsend a message within the time window
 */
const unsendMessage = async (messageId, senderId) => {
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new ApiError(404, 'Message not found');
    if (message.senderId !== senderId) throw new ApiError(403, 'Not your message');
    if (message.isUnsent) throw new ApiError(400, 'Message already unsent');
    if (message.type === 'SYSTEM') throw new ApiError(400, 'Cannot unsend system messages');
    if (message.unsendDeadline && new Date() > message.unsendDeadline) {
        throw new ApiError(400, 'Unsend time expired (5 minutes)');
    }

    return prisma.chatMessage.update({
        where: { id: messageId },
        data: { content: 'ข้อความถูกลบ / Message unsent', isUnsent: true },
        select: { id: true, content: true, isUnsent: true },
    });
};

/**
 * Get session by route ID
 */
const getSession = async (routeId, userId) => {
    const session = await prisma.chatSession.findUnique({
        where: { routeId },
        select: {
            id: true, routeId: true, status: true, createdAt: true, endedAt: true,
            chatExpiresAt: true, readOnlyExpiresAt: true,
            driver: { select: { id: true, firstName: true, profilePicture: true } },
            route: { select: { startLocation: true, endLocation: true } },
            participants: {
                select: {
                    user: { select: { id: true, firstName: true, profilePicture: true } },
                    joinedAt: true,
                },
            },
        },
    });

    if (!session) throw new ApiError(404, 'Chat session not found');

    // Verify participant
    const isDriver = session.driver.id === userId;
    const isPassenger = session.participants.some(p => p.user.id === userId);
    if (!isDriver && !isPassenger) throw new ApiError(403, 'You are not a participant in this chat');

    return session;
};

/**
 * Get session by booking ID (compat helper — looks up route from booking)
 */
const getSessionByBooking = async (bookingId, userId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { routeId: true },
    });
    if (!booking) throw new ApiError(404, 'Booking not found');
    return getSession(booking.routeId, userId);
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
    // Sessions where user is driver OR a participant
    const [driverSessions, participantRecords] = await Promise.all([
        prisma.chatSession.findMany({
            where: { driverId: userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true, routeId: true, status: true, createdAt: true, endedAt: true,
                driver: { select: { id: true, firstName: true, profilePicture: true } },
                route: { select: { startLocation: true, endLocation: true } },
                participants: { select: { user: { select: { id: true, firstName: true, profilePicture: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, createdAt: true } },
            },
        }),
        prisma.chatSessionParticipant.findMany({
            where: { userId },
            orderBy: { joinedAt: 'desc' },
            take: 20,
            select: {
                session: {
                    select: {
                        id: true, routeId: true, status: true, createdAt: true, endedAt: true,
                        driver: { select: { id: true, firstName: true, profilePicture: true } },
                        route: { select: { startLocation: true, endLocation: true } },
                        participants: { select: { user: { select: { id: true, firstName: true, profilePicture: true } } } },
                        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, createdAt: true } },
                    },
                },
            },
        }),
    ]);

    const passengerSessions = participantRecords.map(p => p.session);
    // Deduplicate by session id
    const map = new Map();
    [...driverSessions, ...passengerSessions].forEach(s => { if (!map.has(s.id)) map.set(s.id, s); });
    const sessions = Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Attach passenger for easy frontend access
    sessions.forEach(s => {
        const passengerP = s.participants?.find(p => p.user.id !== s.driver?.id);
        s.passenger = passengerP?.user || null;
    });

    return sessions;
};

module.exports = {
    createSession,
    addParticipant,
    endSession,
    sendMessage,
    getMessages,
    unsendMessage,
    getSession,
    getSessionByBooking,
    shareLocation,
    getMySessions,
    isParticipant,
    RETENTION_DAYS,
    UNSEND_WINDOW_MINUTES,
};
