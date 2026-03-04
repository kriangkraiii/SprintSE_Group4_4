const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const getAllSessions = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.participantId) {
        where.participants = { some: { userId: filters.participantId } };
    }

    const sessions = await prisma.chatSession.findMany({
        where,
        include: {
            driver: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
            participants: {
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
                },
            },
            route: {
                select: { startLocation: true, endLocation: true },
            },
            _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit ? parseInt(filters.limit) : 50,
    });

    // Map participants for frontend compatibility
    return sessions.map(s => ({
        ...s,
        passengers: s.participants
            .filter(p => p.userId !== s.driverId)
            .map(p => p.user),
    }));
};

const getSessionMessages = async (sessionId) => {
    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
            driver: { select: { id: true, firstName: true, lastName: true } },
            participants: {
                include: {
                    user: { select: { id: true, firstName: true, lastName: true } },
                },
            },
        },
    });
    if (!session) throw new ApiError(404, 'Session not found');

    const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: { firstName: true, profilePicture: true } },
        },
    });

    return { session, messages };
};

const getArchivedLogs = async (filters = {}) => {
    const where = {};
    if (filters.sessionId) where.sessionId = filters.sessionId;
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.passengerId) where.passengerId = filters.passengerId;

    return prisma.chatLog.findMany({
        where,
        orderBy: { archivedAt: 'desc' },
        take: filters.limit ? parseInt(filters.limit) : 50,
    });
};

module.exports = { getAllSessions, getSessionMessages, getArchivedLogs };
