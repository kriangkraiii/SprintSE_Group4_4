const asyncHandler = require('express-async-handler');
const { signToken } = require("../utils/jwt");
const userService = require("../services/user.service");
const emailService = require("../services/email.service");
const ApiError = require('../utils/ApiError');

const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

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
        throw new ApiError(401, "Invalid credentials");
    }

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