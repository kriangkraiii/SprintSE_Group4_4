/**
 * SystemLog Middleware — พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 มาตรา 26
 *
 * Batched writes: สะสม log ใน memory แล้ว flush ทุก 5 วินาที
 * ลด DB writes 90%+ เทียบกับ create() ทุก request
 */

const prisma = require('../utils/prisma');

const LOG_BUFFER = [];
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 500; // flush ทันทีถ้าเกิน

async function flushLogs() {
    if (LOG_BUFFER.length === 0) return;
    const batch = LOG_BUFFER.splice(0, LOG_BUFFER.length);
    try {
        await prisma.systemLog.createMany({ data: batch, skipDuplicates: true });
    } catch (err) {
        console.error(`[SystemLog] Batch flush failed (${batch.length} records):`, err.message);
    }
}

// Flush ทุก 5 วินาที
const _flushTimer = setInterval(flushLogs, FLUSH_INTERVAL_MS);
// ป้องกัน timer ค้าง process
if (_flushTimer.unref) _flushTimer.unref();

const systemLogMiddleware = (req, res, next) => {
    next();

    // เก็บ log ลง buffer (ไม่ block response)
    const userId = req.user?.sub || null;
    const ipAddress = req.ip || 'unknown';

    LOG_BUFFER.push({
        userId,
        ipAddress,
        action: req.method,
        resource: req.originalUrl,
        userAgent: req.headers['user-agent'] || null,
    });

    // Force flush ถ้า buffer ใหญ่เกินไป
    if (LOG_BUFFER.length >= MAX_BUFFER_SIZE) {
        flushLogs();
    }
};

// Export flush function สำหรับ graceful shutdown
systemLogMiddleware.flush = flushLogs;

module.exports = systemLogMiddleware;
