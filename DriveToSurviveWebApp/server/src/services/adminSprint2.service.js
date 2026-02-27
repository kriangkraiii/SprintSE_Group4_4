const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

// ─── Role-Based Suspension ───────────────────────────────

/**
 * Suspend a user by role (passenger, driver, or both)
 * @param {string} userId
 * @param {string} role - 'passenger' | 'driver' | 'both'
 * @param {number} durationDays - number of days (0 = permanent)
 * @param {string} reason
 * @param {string} adminId
 */
const suspendUserRole = async (userId, role, durationDays, reason, adminId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const suspendUntil = durationDays > 0
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
        : new Date('2099-12-31'); // Permanent

    const updateData = {};
    if (role === 'passenger' || role === 'both') {
        updateData.passengerSuspendedUntil = suspendUntil;
    }
    if (role === 'driver' || role === 'both') {
        updateData.driverSuspendedUntil = suspendUntil;
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true, username: true, firstName: true, role: true,
            passengerSuspendedUntil: true, driverSuspendedUntil: true,
        },
    });

    // Audit log
    await prisma.systemLog.create({
        data: {
            action: 'SUSPEND',
            entity: 'User',
            entityId: userId,
            performedBy: adminId,
            detail: `Suspended as ${role} for ${durationDays > 0 ? durationDays + ' days' : 'permanently'}. Reason: ${reason}`,
        },
    });

    return updated;
};

/**
 * Unsuspend a user by role
 */
const unsuspendUserRole = async (userId, role, adminId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const updateData = {};
    if (role === 'passenger' || role === 'both') {
        updateData.passengerSuspendedUntil = null;
    }
    if (role === 'driver' || role === 'both') {
        updateData.driverSuspendedUntil = null;
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true, username: true, firstName: true, role: true,
            passengerSuspendedUntil: true, driverSuspendedUntil: true,
        },
    });

    await prisma.systemLog.create({
        data: {
            action: 'UNSUSPEND',
            entity: 'User',
            entityId: userId,
            performedBy: adminId,
            detail: `Unsuspended as ${role}`,
        },
    });

    return updated;
};

/**
 * Get suspension status for a user
 */
const getSuspensionStatus = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true, username: true, firstName: true, lastName: true,
            role: true, email: true,
            passengerSuspendedUntil: true,
            driverSuspendedUntil: true,
            isActive: true,
        },
    });
    if (!user) throw new ApiError(404, 'User not found');

    const now = new Date();
    return {
        ...user,
        passengerSuspended: user.passengerSuspendedUntil && new Date(user.passengerSuspendedUntil) > now,
        driverSuspended: user.driverSuspendedUntil && new Date(user.driverSuspendedUntil) > now,
    };
};

/**
 * List suspended users
 */
const listSuspendedUsers = async (opts = {}) => {
    const { page = 1, limit = 20 } = opts;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {
        OR: [
            { passengerSuspendedUntil: { gt: now } },
            { driverSuspendedUntil: { gt: now } },
        ],
    };

    const [total, data] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip,
            take: Number(limit),
            select: {
                id: true, username: true, firstName: true, lastName: true,
                role: true, email: true,
                passengerSuspendedUntil: true, driverSuspendedUntil: true,
            },
        }),
    ]);

    return {
        data,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    };
};

// ─── Log Export (พ.ร.บ.คอมพิวเตอร์) ───────────────────────

/**
 * Export system logs as JSON (for law enforcement)
 */
const exportSystemLogs = async (filters = {}) => {
    const { from, to, userId, action } = filters;

    const where = {};
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
    }
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const logs = await prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000, // Safety cap
    });

    return {
        exportedAt: new Date().toISOString(),
        totalRecords: logs.length,
        filters,
        data: logs,
    };
};

/**
 * Export full chat session for dispute/law enforcement
 * Includes: session info, participants, all messages, reports
 */
const exportChatSession = async (sessionId) => {
    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
            driver: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
            passenger: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
            booking: { select: { id: true, status: true, pickupLocation: true, dropoffLocation: true, createdAt: true } },
            messages: {
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: { select: { id: true, firstName: true, role: true } },
                },
            },
            reports: {
                include: {
                    reporter: { select: { id: true, firstName: true } },
                    message: { select: { content: true, originalContent: true, createdAt: true } },
                },
            },
        },
    });

    if (!session) throw new ApiError(404, 'Chat session not found');

    // Also get arrival notifications for this booking
    const arrivalNotifications = await prisma.arrivalNotification.findMany({
        where: { bookingId: session.bookingId },
        orderBy: { triggeredAt: 'asc' },
    });

    return {
        exportedAt: new Date().toISOString(),
        legalNotice: 'This data is exported pursuant to the Thai Computer Crime Act (พ.ร.บ.ว่าด้วยการกระทำความผิดฯ พ.ศ.2560). 90-day retention applies.',
        session: {
            id: session.id,
            status: session.status,
            createdAt: session.createdAt,
            endedAt: session.endedAt,
            retentionExpiresAt: session.retentionExpiresAt,
        },
        booking: session.booking,
        participants: {
            driver: session.driver,
            passenger: session.passenger,
        },
        messages: session.messages.map(m => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.sender.firstName,
            senderRole: m.sender.role,
            type: m.type,
            content: m.content,
            originalContent: m.originalContent,
            isFiltered: m.isFiltered,
            isUnsent: m.isUnsent,
            createdAt: m.createdAt,
        })),
        reports: session.reports,
        arrivalNotifications,
        totalMessages: session.messages.length,
        totalReports: session.reports.length,
    };
};

/**
 * Convert data to CSV string
 */
const toCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h];
            const str = val === null || val === undefined ? '' : String(val);
            return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
};

module.exports = {
    suspendUserRole,
    unsuspendUserRole,
    getSuspensionStatus,
    listSuspendedUsers,
    exportSystemLogs,
    exportChatSession,
    toCSV,
};
