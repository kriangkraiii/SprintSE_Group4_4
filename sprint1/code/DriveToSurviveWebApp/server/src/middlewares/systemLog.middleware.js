/**
 * SystemLog Middleware — พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 มาตรา 26
 *
 * เหตุผล: ผู้ให้บริการต้องเก็บข้อมูลจราจรคอมพิวเตอร์ (Traffic Data)
 * ไม่น้อยกว่า 90 วัน ประกอบด้วย User ID, IP Address, Timestamp, Activity Type
 *
 * Middleware นี้จะ log ทุก request ที่ผ่าน /api/* โดยอัตโนมัติ
 * Log เป็น Immutable — ไม่มี API สำหรับ Update หรือ Delete
 */

const prisma = require('../utils/prisma');

const systemLogMiddleware = async (req, res, next) => {
    // ดำเนินการ request ต่อไปก่อน ไม่ให้ logging block การทำงาน
    next();

    // Log แบบ fire-and-forget (ไม่ block response)
    try {
        const userId = req.user?.sub || null;

        // ดึง IP Address จริงจาก proxy headers
        const ipAddress =
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.connection?.remoteAddress ||
            req.ip ||
            'unknown';

        await prisma.systemLog.create({
            data: {
                userId,
                ipAddress,
                action: req.method,          // GET, POST, PUT, DELETE
                resource: req.originalUrl,   // /api/users/me
                userAgent: req.headers['user-agent'] || null,
            },
        });
    } catch (err) {
        // ห้าม crash server เพราะ logging error
        console.error('[SystemLog] Failed to write log:', err.message);
    }
};

module.exports = systemLogMiddleware;
