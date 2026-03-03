const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Create a chat report
 */
const createReport = async (sessionId, messageId, reporterId, reason, detail) => {
    // Verify message exists and belongs to session
    const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message || message.sessionId !== sessionId) {
        throw new ApiError(404, 'Message not found in this session');
    }

    // Check duplicate report
    const existing = await prisma.chatReport.findUnique({
        where: { messageId_reporterId: { messageId, reporterId } },
    });
    if (existing) throw new ApiError(409, 'Already reported');

    return prisma.chatReport.create({
        data: {
            sessionId,
            messageId,
            reporterId,
            reason,
            detail: detail || null,
        },
    });
};

/**
 * List reports (admin)
 */
const listReports = async (opts = {}) => {
    const { page = 1, limit = 20, status } = opts;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [total, data] = await prisma.$transaction([
        prisma.chatReport.count({ where }),
        prisma.chatReport.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit),
            include: {
                message: { select: { content: true, createdAt: true } },
                reporter: { select: { id: true, firstName: true } },
            },
        }),
    ]);

    return {
        data,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Update report status (admin)
 */
const updateReportStatus = async (id, status, adminNote) => {
    const report = await prisma.chatReport.findUnique({ where: { id } });
    if (!report) throw new ApiError(404, 'Report not found');

    return prisma.chatReport.update({
        where: { id },
        data: { status, adminNote: adminNote || null },
    });
};

module.exports = {
    createReport,
    listReports,
    updateReportStatus,
};
