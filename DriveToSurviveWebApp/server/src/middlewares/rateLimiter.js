/**
 * Rate Limiting Middleware
 *
 * 3 ระดับ:
 * - globalLimiter:  200 req / 15 min / IP (ทุก API route)
 * - authLimiter:    10 req / 15 min / IP (login, register, forgot-password)
 * - strictLimiter:  5 req / 15 min / IP (OTP, password reset, sensitive)
 */
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // Temporarily increased for testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // Temporarily increased for testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่',
    },
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'คำขอมากเกินไปสำหรับการดำเนินการนี้ กรุณารอ 15 นาที',
    },
});

module.exports = { globalLimiter, authLimiter, strictLimiter };
