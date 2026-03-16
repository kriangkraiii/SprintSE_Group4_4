const asyncHandler = require('express-async-handler');
const { signToken } = require("../utils/jwt");
const userService = require("../services/user.service");
const emailService = require("../services/email.service");
const ApiError = require('../utils/ApiError');

// ─── Brute-force Protection: Account Lockout ───
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 นาที
const failedAttempts = new Map(); // key → { count, lockedUntil }

function getAttemptKey(identifier) {
    return (identifier || '').toLowerCase().trim();
}

function checkLockout(key) {
    const record = failedAttempts.get(key);
    if (!record) return null;
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
        const remainMs = record.lockedUntil - Date.now();
        const remainMin = Math.ceil(remainMs / 60000);
        return remainMin;
    }
    // ถ้าหมดเวลา lock แล้ว → reset
    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
        failedAttempts.delete(key);
    }
    return null;
}

function recordFailure(key) {
    const record = failedAttempts.get(key) || { count: 0, lockedUntil: null };
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
        record.lockedUntil = Date.now() + LOCKOUT_MS;
    }
    failedAttempts.set(key, record);
    return { count: record.count, remaining: MAX_ATTEMPTS - record.count, locked: !!record.lockedUntil };
}

function clearFailures(key) {
    failedAttempts.delete(key);
}

// ทุก 10 นาที ลบ record ที่หมดอายุ — ป้องกัน memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of failedAttempts) {
        if (record.lockedUntil && now >= record.lockedUntil) {
            failedAttempts.delete(key);
        }
    }
}, 10 * 60 * 1000);

const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    const attemptKey = getAttemptKey(email || username);

    // ตรวจสอบ lockout ก่อน
    const lockedMin = checkLockout(attemptKey);
    if (lockedMin) {
        throw new ApiError(429, `บัญชีถูกล็อกเนื่องจากใส่รหัสผิดเกิน ${MAX_ATTEMPTS} ครั้ง กรุณารอ ${lockedMin} นาที`);
    }

    let user;
    if (email) {
        user = await userService.getUserByEmail(email);
    } else if (username) {
        user = await userService.getUserByUsername(username);
    }

    if (user && !user.isActive) {
        throw new ApiError(401, "Your account has been deactivated.");
    }

    const passwordIsValid = user ? await userService.comparePassword(user, password) : false;
    if (!user || !passwordIsValid) {
        const result = recordFailure(attemptKey);

        // บันทึก log การใส่รหัสผิด
        const prisma = require('../utils/prisma');
        prisma.systemLog.create({
            data: {
                userId: user?.id || null,
                ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
                action: 'LOGIN_FAILED',
                resource: '/api/auth/login',
                userAgent: req.headers['user-agent'] || null,
                entity: 'User',
                entityId: email || username,
                detail: result.locked
                    ? `Account locked after ${MAX_ATTEMPTS} failed attempts`
                    : `Failed login attempt #${result.count}/${MAX_ATTEMPTS}`,
            },
        }).catch(() => {}); // fire-and-forget

        if (result.locked) {
            throw new ApiError(429, `ใส่รหัสผิดเกิน ${MAX_ATTEMPTS} ครั้ง บัญชีถูกล็อก 30 นาที`);
        }
        throw new ApiError(401, `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือ ${result.remaining} ครั้ง)`);
    }

    // Login สำเร็จ → เคลียร์ failed attempts
    clearFailures(attemptKey);

    // ─── Blacklist Check: ตรวจสอบว่าบัญชีถูก Blacklist หรือไม่ ───
    if (user.nationalIdNumber) {
        const blacklistService = require('../services/blacklist.service');
        const blacklisted = await blacklistService.checkBlacklist(user.nationalIdNumber);
        if (blacklisted) {
            throw new ApiError(403, 'บัญชีของคุณถูกระงับการใช้งาน (Blacklisted)');
        }
    }

    const token = signToken({ sub: user.id, role: user.role });
    const {
        password: _,
        gender,
        phoneNumber,
        otpCode,
        nationalIdNumber,
        nationalIdPhotoUrl,
        nationalIdExpiryDate,
        selfiePhotoUrl,
        isVerified,
        isActive,
        lastLogin,
        createdAt,
        updatedAt,
        username: __,
        email: ___,
        ...safeUser
    } = user;

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: { token, user: safeUser }
    });
});

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { currentPassword, newPassword } = req.body;

    const result = await userService.updatePassword(userId, currentPassword, newPassword);

    if (!result.success) {
        if (result.error === 'INCORRECT_PASSWORD') {
            throw new ApiError(401, 'Incorrect current password.');
        }
        throw new ApiError(500, 'Could not update password.');
    }

    res.status(200).json({
        success: true,
        message: "Password changed successfully",
        data: null
    });
});

// POST /api/auth/forgot-password — send OTP to email
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await userService.getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
        return res.status(200).json({
            success: true,
            message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว",
        });
    }

    const otp = userService.generateOtp();
    await userService.saveOtp(user.id, otp);

    try {
        await emailService.sendOtpEmail(email, otp);
    } catch (err) {
        console.error('Failed to send OTP email:', err);
        throw new ApiError(500, 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง');
    }

    res.status(200).json({
        success: true,
        message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว",
    });
});

// POST /api/auth/verify-otp — verify OTP is correct
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otpCode } = req.body;
    const result = await userService.verifyOtp(email, otpCode);

    if (!result.success) {
        const messages = {
            USER_NOT_FOUND: 'ไม่พบผู้ใช้งานนี้ในระบบ',
            NO_OTP: 'กรุณาขอรหัส OTP ใหม่',
            OTP_EXPIRED: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่',
            INVALID_OTP: 'รหัส OTP ไม่ถูกต้อง',
        };
        throw new ApiError(400, messages[result.error] || 'เกิดข้อผิดพลาด');
    }

    res.status(200).json({
        success: true,
        message: "ยืนยัน OTP สำเร็จ",
    });
});

// POST /api/auth/reset-password — reset password with verified OTP
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    const result = await userService.resetPasswordWithOtp(email, otpCode, newPassword);

    if (!result.success) {
        const messages = {
            USER_NOT_FOUND: 'ไม่พบผู้ใช้งานนี้ในระบบ',
            NO_OTP: 'กรุณาขอรหัส OTP ใหม่',
            OTP_EXPIRED: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่',
            INVALID_OTP: 'รหัส OTP ไม่ถูกต้อง',
        };
        throw new ApiError(400, messages[result.error] || 'เกิดข้อผิดพลาด');
    }

    res.status(200).json({
        success: true,
        message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
});

module.exports = { login, changePassword, forgotPassword, verifyOtp, resetPassword };