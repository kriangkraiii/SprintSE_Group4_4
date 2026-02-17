/**
 * SystemLog Service — พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 มาตรา 26
 *
 * CRUD Policy:
 *   CREATE — ✅ (middleware auto-creates)
 *   READ   — ✅ (admin-only)
 *   UPDATE — ❌ (immutable by law)
 *   DELETE — ❌ (immutable by law, ต้องเก็บ ≥ 90 วัน)
 */

const prisma = require('../utils/prisma');

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

module.exports = { searchLogs };
