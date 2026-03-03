/**
 * SystemLog Service — พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 มาตรา 26
 *
 * CRUD Policy:
 *   CREATE — ✅ (middleware auto-creates)
 *   READ   — ✅ (admin-only)
 *   UPDATE — ❌ (immutable by law)
 *   DELETE — ✅ ได้เฉพาะ log ที่มีอายุเกิน 90 วัน
 */

const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const MIN_RETENTION_DAYS = 90;

const getRetentionCutoffDate = (now = new Date()) => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - MIN_RETENTION_DAYS);
    return cutoff;
};

const isOlderThanRetention = (createdAt, now = new Date()) => {
    return new Date(createdAt) <= getRetentionCutoffDate(now);
};

const searchLogs = async (opts = {}) => {
    const {
        page = 1,
        limit = 50,
        userId,
        ipAddress,
        action,
        createdFrom,
        createdTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = opts;

    const where = {
        ...(userId && { userId }),
        ...(ipAddress && { ipAddress: { contains: ipAddress } }),
        ...(action && { action }),
        ...((createdFrom || createdTo) ? {
            createdAt: {
                ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
                ...(createdTo ? { lte: new Date(createdTo) } : {}),
            },
        } : {}),
    };

    const _page = Number(page) || 1;
    const _limit = Number(limit) || 20;
    const skip = (_page - 1) * _limit;
    const take = _limit;

    const [total, data] = await prisma.$transaction([
        prisma.systemLog.count({ where }),
        prisma.systemLog.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take,
        }),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const deleteLogById = async (id, now = new Date()) => {
    const log = await prisma.systemLog.findUnique({ where: { id } });

    if (!log) {
        throw new ApiError(404, 'System log not found.');
    }

    if (!isOlderThanRetention(log.createdAt, now)) {
        throw new ApiError(
            403,
            `Cannot delete this system log yet. Logs must be retained for at least ${MIN_RETENTION_DAYS} days.`
        );
    }

    await prisma.systemLog.delete({ where: { id } });
    return { id };
};

module.exports = {
    MIN_RETENTION_DAYS,
    getRetentionCutoffDate,
    isOlderThanRetention,
    searchLogs,
    deleteLogById,
};
