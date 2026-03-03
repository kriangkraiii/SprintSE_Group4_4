/**
 * Rate Limiting Middleware
 *
 * 3 ระดับ:
 * - globalLimiter:  1000 req / 15 min / IP (ทุก API route)
 * - authLimiter:    30 req / 15 min / IP (login, register, forgot-password)
 * - strictLimiter:  10 req / 15 min / IP (OTP, password reset, sensitive)
 *
 * All limiters check securityConfig — if rateLimitEnabled is false, skip.
 */
const rateLimit = require('express-rate-limit');
const { isEnabled } = require('../utils/securityConfig');

const skip = (req) => {
    if (!isEnabled('rateLimitEnabled')) return true;
    return false;
};

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่',
    },
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'คำขอมากเกินไปสำหรับการดำเนินการนี้ กรุณารอ 15 นาที',
    },
});

module.exports = { globalLimiter, authLimiter, strictLimiter };
