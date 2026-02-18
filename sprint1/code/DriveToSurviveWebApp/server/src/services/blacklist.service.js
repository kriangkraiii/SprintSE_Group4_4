/**
 * Blacklist Service — PDPA พ.ศ. 2562 มาตรา 22
 *
 * เหตุผล: เก็บเฉพาะ SHA-256 Hash ของเลขบัตรประชาชน
 * ไม่เก็บข้อมูลดิบ เพื่อลด Privacy Risk ตามหลัก Data Minimization
 *
 * Flow การตรวจสอบ:
 *   1. รับ Raw National ID จาก user input
 *   2. Hash ด้วย SHA-256
 *   3. เทียบกับ Blacklist table
 *   4. ถ้าตรง → ปฏิเสธการลงทะเบียน/ยืนยันตัวตน
 */

const crypto = require('crypto');
const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Hash National ID ด้วย SHA-256
 * เหตุผล: PDPA ม.22 — ห้ามเก็บข้อมูลดิบถ้าไม่จำเป็น
 * SHA-256 เป็น one-way hash → ไม่สามารถ reverse กลับเป็นเลข 13 หลักได้
 */
const hashNationalId = (rawId) => {
    return crypto.createHash('sha256').update(rawId.trim()).digest('hex');
};

/**
 * ตรวจสอบว่า National ID อยู่ใน Blacklist หรือไม่
 * ใช้ในขั้นตอนลงทะเบียน/ยืนยันตัวตน
 */
const checkBlacklist = async (rawNationalId) => {
    const hash = hashNationalId(rawNationalId);
    const entry = await prisma.blacklist.findUnique({
        where: { nationalIdHash: hash },
    });
    return entry; // null = ไม่อยู่ใน blacklist
};

/**
 * เพิ่มรายชื่อเข้า Blacklist (Admin only)
 */
const addToBlacklist = async (rawNationalId, reason, adminId) => {
    const hash = hashNationalId(rawNationalId);

    // เช็คซ้ำ
    const existing = await prisma.blacklist.findUnique({
        where: { nationalIdHash: hash },
    });
    if (existing) {
        throw new ApiError(409, 'This National ID is already in the blacklist.');
    }

    return prisma.blacklist.create({
        data: {
            nationalIdHash: hash,
            reason: reason || null,
            createdByAdminId: adminId,
        },
    });
};

/**
 * ลบรายชื่อออกจาก Blacklist (Admin only)
 */
const removeFromBlacklist = async (id) => {
    const entry = await prisma.blacklist.findUnique({ where: { id } });
    if (!entry) throw new ApiError(404, 'Blacklist entry not found.');

    await prisma.blacklist.delete({ where: { id } });
    return { id };
};

/**
 * ดูรายการ Blacklist (Admin only, paginated)
 */
const searchBlacklist = async (opts = {}) => {
    const {
        page = 1,
        limit = 20,
        createdFrom,
        createdTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = opts;

    const where = {
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
        prisma.blacklist.count({ where }),
        prisma.blacklist.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take,
        }),
    ]);

    return {
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

module.exports = {
    hashNationalId,
    checkBlacklist,
    addToBlacklist,
    removeFromBlacklist,
    searchBlacklist,
};
