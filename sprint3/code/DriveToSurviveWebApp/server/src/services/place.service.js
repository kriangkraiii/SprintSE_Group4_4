const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const MAX_RECENT = 20;

// ─── Saved Places ─────────────────────────────────────────

const getSavedPlaces = async (userId) => {
    return prisma.savedPlace.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
    });
};

const upsertSavedPlace = async (userId, data) => {
    const { label, name, address, lat, lng, placeId, icon } = data;
    if (!label || !name || lat == null || lng == null) {
        throw new ApiError(400, 'label, name, lat, lng are required');
    }

    return prisma.savedPlace.upsert({
        where: { userId_label: { userId, label } },
        update: { name, address, lat, lng, placeId, icon: icon || 'pin' },
        create: { userId, label, name, address, lat, lng, placeId, icon: icon || 'pin' },
    });
};

const deleteSavedPlace = async (userId, placeId) => {
    const place = await prisma.savedPlace.findUnique({ where: { id: placeId } });
    if (!place) throw new ApiError(404, 'Saved place not found');
    if (place.userId !== userId) throw new ApiError(403, 'Not your saved place');

    return prisma.savedPlace.delete({ where: { id: placeId } });
};

// ─── Recent Searches ──────────────────────────────────────

const getRecentSearches = async (userId, limit = 10) => {
    return prisma.recentSearch.findMany({
        where: { userId },
        orderBy: { usedAt: 'desc' },
        take: Number(limit),
    });
};

const addRecentSearch = async (userId, data) => {
    const { name, address, lat, lng, placeId } = data;
    if (!name || lat == null || lng == null) {
        throw new ApiError(400, 'name, lat, lng are required');
    }

    // Dedup: ถ้ามี placeId เดียวกันอยู่แล้ว → update usedAt
    if (placeId) {
        const existing = await prisma.recentSearch.findFirst({
            where: { userId, placeId },
        });
        if (existing) {
            return prisma.recentSearch.update({
                where: { id: existing.id },
                data: { usedAt: new Date(), name, address },
            });
        }
    }

    // Create new
    const created = await prisma.recentSearch.create({
        data: { userId, name, address, lat, lng, placeId },
    });

    // Auto-prune: keep only MAX_RECENT
    const allRecent = await prisma.recentSearch.findMany({
        where: { userId },
        orderBy: { usedAt: 'desc' },
        select: { id: true },
    });

    if (allRecent.length > MAX_RECENT) {
        const toDelete = allRecent.slice(MAX_RECENT).map(r => r.id);
        await prisma.recentSearch.deleteMany({
            where: { id: { in: toDelete } },
        });
    }

    return created;
};

const clearRecentSearches = async (userId) => {
    const result = await prisma.recentSearch.deleteMany({
        where: { userId },
    });
    return { deleted: result.count };
};

module.exports = {
    getSavedPlaces,
    upsertSavedPlace,
    deleteSavedPlace,
    getRecentSearches,
    addRecentSearch,
    clearRecentSearches,
    MAX_RECENT,
};
