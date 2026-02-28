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
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    },
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่',
    },
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
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
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
});

module.exports = { globalLimiter, authLimiter, strictLimiter };
