const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

const MAX_SHORTCUTS = 20;

const getMyShortcuts = async (userId) => {
    return prisma.quickReplyShortcut.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
    });
};

const createShortcut = async (userId, text) => {
    const count = await prisma.quickReplyShortcut.count({ where: { userId } });
    if (count >= MAX_SHORTCUTS) {
        throw new ApiError(400, `คีย์ลัดเต็มแล้ว (สูงสุด ${MAX_SHORTCUTS} รายการ)`);
    }
    return prisma.quickReplyShortcut.create({
        data: { userId, text, sortOrder: count },
    });
};

const updateShortcut = async (id, userId, text) => {
    const shortcut = await prisma.quickReplyShortcut.findUnique({ where: { id } });
    if (!shortcut) throw new ApiError(404, 'ไม่พบคีย์ลัด');
    if (shortcut.userId !== userId) throw new ApiError(403, 'ไม่ใช่คีย์ลัดของคุณ');
    return prisma.quickReplyShortcut.update({
        where: { id },
        data: { text },
    });
};

const deleteShortcut = async (id, userId) => {
    const shortcut = await prisma.quickReplyShortcut.findUnique({ where: { id } });
    if (!shortcut) throw new ApiError(404, 'ไม่พบคีย์ลัด');
    if (shortcut.userId !== userId) throw new ApiError(403, 'ไม่ใช่คีย์ลัดของคุณ');
    return prisma.quickReplyShortcut.delete({ where: { id } });
};

const reorderShortcuts = async (userId, ids) => {
    const shortcuts = await prisma.quickReplyShortcut.findMany({ where: { userId } });
    const owned = new Set(shortcuts.map(s => s.id));
    for (const id of ids) {
        if (!owned.has(id)) throw new ApiError(403, 'คีย์ลัดไม่ใช่ของคุณ');
    }
    const updates = ids.map((id, i) =>
        prisma.quickReplyShortcut.update({ where: { id }, data: { sortOrder: i } })
    );
    await prisma.$transaction(updates);
    return getMyShortcuts(userId);
};

module.exports = { getMyShortcuts, createShortcut, updateShortcut, deleteShortcut, reorderShortcuts };
