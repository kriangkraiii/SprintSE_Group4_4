const asyncHandler = require('express-async-handler');
const blacklistService = require('../services/blacklist.service');

/**
 * POST /api/blacklist — Admin เพิ่ม National ID เข้า Blacklist
 * PDPA ม.22: เก็บเฉพาะ Hash ไม่เก็บเลข 13 หลักดิบ
 */
const addToBlacklist = asyncHandler(async (req, res) => {
    const { nationalId, reason } = req.body;
    const adminId = req.user.sub;

    const entry = await blacklistService.addToBlacklist(nationalId, reason, adminId);

    res.status(201).json({
        success: true,
        message: 'National ID added to blacklist (stored as SHA-256 hash)',
        data: entry,
    });
});

/**
 * DELETE /api/blacklist/:id — Admin ลบออกจาก Blacklist
 */
const removeFromBlacklist = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await blacklistService.removeFromBlacklist(id);

    res.status(200).json({
        success: true,
        message: 'Blacklist entry removed',
        data: result,
    });
});

/**
 * GET /api/blacklist — Admin ดูรายการ Blacklist
 */
const getBlacklist = asyncHandler(async (req, res) => {
    const {
        page, limit,
        createdFrom, createdTo,
        sortBy, sortOrder,
    } = req.query;

    const result = await blacklistService.searchBlacklist({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        createdFrom,
        createdTo,
        sortBy,
        sortOrder,
    });

    res.status(200).json({
        success: true,
        message: 'Blacklist entries retrieved',
        ...result,
    });
});

/**
 * POST /api/blacklist/check — ตรวจสอบ National ID (Internal)
 */
const checkBlacklist = asyncHandler(async (req, res) => {
    const { nationalId } = req.body;
    const entry = await blacklistService.checkBlacklist(nationalId);

    res.status(200).json({
        success: true,
        isBlacklisted: !!entry,
        data: entry ? { id: entry.id, reason: entry.reason, createdAt: entry.createdAt } : null,
    });
});

module.exports = { addToBlacklist, removeFromBlacklist, getBlacklist, checkBlacklist };
