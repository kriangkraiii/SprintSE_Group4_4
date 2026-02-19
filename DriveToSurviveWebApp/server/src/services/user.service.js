const prisma = require("../utils/prisma");
const ApiError = require('../utils/ApiError');
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const searchUsers = async (opts = {}) => {
    const {
        page = 1,
        limit = 20,
        q,
        role,
        isActive,
        isVerified,
        createdFrom,
        createdTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = opts;

    const where = {
        deletedAt: null,
        ...(role && { role }),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(typeof isVerified === 'boolean' ? { isVerified } : {}),
        ...((createdFrom || createdTo) ? {
            createdAt: {
                ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
                ...(createdTo ? { lte: new Date(createdTo) } : {}),
            }
        } : {}),
        ...(q ? {
            OR: [
                { email: { contains: q } },
                { username: { contains: q } },
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { phoneNumber: { contains: q } },
            ]
        } : {}),
    };

    const _page = Number(page) || 1;
    const _limit = Number(limit) || 20;
    const skip = (_page - 1) * _limit;
    const take = _limit;

    const [total, dataRaw] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip, take,
            select: {
                id: true, email: true, username: true,
                firstName: true, lastName: true, gender: true,
                phoneNumber: true, profilePicture: true,
                role: true, isVerified: true, isActive: true,
                createdAt: true, updatedAt: true,
                driverVerification: { select: { status: true, verifiedByOcr: true } },
                _count: { select: { vehicles: true } },
            }
        })
    ]);

    return {
        data: dataRaw,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    };
};

const getUserByEmail = async (email) => {
    return await prisma.user.findUnique({ where: { email } })
}

const getUserByUsername = async (username) => {
    return await prisma.user.findUnique({ where: { username } })
}

const comparePassword = async (user, plainPassword) => {
    return bcrypt.compare(plainPassword, user.password);
};

const getAllUsers = async () => {
    const users = await prisma.user.findMany({
        where: {
            isActive: true
        }
    })

    // หรือจะสร้าง object ใหม่แบบนี้ก็ได้ (ปลอดภัยกว่า)
    /*
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      // ... เอาฟิลด์อื่นๆ ที่ต้องการมาใส่ ...
    }));
    */

    return users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
    });
}

const getUserById = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const { password, ...safeUser } = user;
    return safeUser
}

const getUserPublicById = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true, firstName: true, lastName: true,
            profilePicture: true, role: true, isVerified: true,
            createdAt: true
        }
    });
    if (!user) throw new ApiError(404, 'User not found');
    return user;
};

// const getMyUser = async (id) => {
//     const user = await prisma.user.findUnique({ where: { id } })

//     if (!user) {
//         return null;
//     }

//     const { password, ...safeUser } = user;
//     return safeUser
// }

const createUser = async (data) => {
    const existingUserByEmail = await getUserByEmail(data.email);
    if (existingUserByEmail) {
        throw new ApiError(409, "This email is already in use.");
    }
    const existingUserByUsername = await getUserByUsername(data.username);
    if (existingUserByUsername) {
        throw new ApiError(409, "This username is already taken.");
    }

    // PDPA ม.22 — ตรวจ Blacklist ด้วย SHA-256 Hash ก่อนลงทะเบียน
    if (data.nationalIdNumber) {
        const blacklistService = require('./blacklist.service');
        const blacklisted = await blacklistService.checkBlacklist(data.nationalIdNumber);
        if (blacklisted) {
            throw new ApiError(403, 'This National ID has been blacklisted. Registration denied.');
        }
    }

    const isAdminCreateFlow = data.createdByAdmin === true;
    const requestedRole = (data.role || 'PASSENGER').toUpperCase();

    if (!isAdminCreateFlow && requestedRole !== 'PASSENGER') {
        throw new ApiError(403, 'Only PASSENGER registration is allowed on this endpoint.');
    }

    if (isAdminCreateFlow && requestedRole !== 'ADMIN') {
        throw new ApiError(403, 'Admin create endpoint can create ADMIN user only.');
    }

    const finalRole = isAdminCreateFlow ? 'ADMIN' : 'PASSENGER';

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const createData = {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        nationalIdNumber: data.nationalIdNumber,
        nationalIdExpiryDate: new Date(data.nationalIdExpiryDate), // แปลง string เป็น Date object
        nationalIdPhotoUrl: data.nationalIdPhotoUrl, // URL จาก Cloudinary
        selfiePhotoUrl: data.selfiePhotoUrl, // URL จาก Cloudinary
        role: finalRole,
        // ข้อมูล OCR จากบัตรประชาชน
        ...(data.nationalIdBackPhotoUrl && { nationalIdBackPhotoUrl: data.nationalIdBackPhotoUrl }),
        ...(data.nationalIdBackNumber && { nationalIdBackNumber: data.nationalIdBackNumber }),
        ...(data.nationalIdOcrData && {
            nationalIdOcrData: typeof data.nationalIdOcrData === 'string'
                ? JSON.parse(data.nationalIdOcrData)
                : data.nationalIdOcrData
        }),
        ...(data.verifiedByOcr !== undefined && {
            verifiedByOcr: data.verifiedByOcr === 'true' || data.verifiedByOcr === true
        }),
        // ระบบอัตโนมัติ — ยืนยันตัวตนทันทีเมื่อมีบัตรประชาชนและรูปถ่าย (ไม่ต้องรอแอดมิน)
        ...(data.nationalIdNumber && data.nationalIdPhotoUrl && data.selfiePhotoUrl && {
            isVerified: true
        }),
    };

    const user = await prisma.user.create({ data: createData });

    const { password, ...safeUser } = user;
    return safeUser;
}

const updatePassword = async (userId, currentPassword, newPassword) => {
    const userWithPassword = await prisma.user.findUnique({ where: { id: userId } });

    if (!userWithPassword) {
        return { success: false, error: 'USER_NOT_FOUND' };
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, userWithPassword.password);

    if (!isPasswordCorrect) {
        return { success: false, error: 'INCORRECT_PASSWORD' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });

    return { success: true };
};

const updateUserProfile = async (id, data) => {
    const updatedUser = await prisma.user.update({ where: { id }, data });

    const { password, ...safeUser } = updatedUser;
    return safeUser;
};

/**
 * Soft Delete — PDPA ม.33 (สิทธิในการลบ) vs พ.ร.บ.คอมพิวเตอร์ ม.26 (เก็บ Log 90 วัน)
 *
 * Conflict Resolution:
 *   - ลบข้อมูลส่วนบุคคล (PII) ออกจาก User table → ตาม PDPA ม.33
 *   - เก็บ SystemLog ไว้ครบ 90 วัน → ตาม พ.ร.บ.คอมพิวเตอร์ ม.26
 *   - userId ใน SystemLog ยังอ้างอิงได้ แต่ชื่อ/เบอร์/อีเมลใน User จะถูก anonymize
 */
const softDeleteUser = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, 'User not found');
    if (user.deletedAt) throw new ApiError(400, 'User already deleted');

    const anonymized = await prisma.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            isActive: false,
            firstName: 'Deleted',
            lastName: 'User',
            phoneNumber: null,
            email: `deleted_${id}@removed.local`,
            username: `deleted_${id}`,
            profilePicture: null,
            nationalIdPhotoUrl: null,
            selfiePhotoUrl: null,
            nationalIdNumber: null,
        },
    });
    // SystemLog ไม่ถูกลบ — เก็บไว้ตาม พ.ร.บ.คอมพิวเตอร์ ม.26
    const { password, ...safeUser } = anonymized;
    return safeUser;
};

/**
 * User self-service: ลบบัญชีตัวเอง (PDPA ม.33 — Right to Erasure)
 */
const softDeleteMyAccount = async (userId) => {
    return softDeleteUser(userId);
};

// const setUserStatusActive = async (id, isActive) => {
//     const updatedUser = await prisma.user.update({
//         where: { id },
//         data: { isActive: isActive },
//     });

//     const { password, ...safeUser } = updatedUser;
//     return safeUser;
// };

// const setUserStatusVerified = async (id, isVerified) => {
//     const updatedUser = await prisma.user.update({
//         where: { id },
//         data: { isVerified: isVerified },
//     });

//     const { password, ...safeUser } = updatedUser;
//     return safeUser;
// };

const generateOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

const saveOtp = async (userId, otpCode) => {
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await prisma.user.update({
        where: { id: userId },
        data: { otpCode, otpExpiry },
    });
};

const verifyOtp = async (email, otpCode) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: 'USER_NOT_FOUND' };
    if (!user.otpCode || !user.otpExpiry) return { success: false, error: 'NO_OTP' };
    if (new Date() > user.otpExpiry) return { success: false, error: 'OTP_EXPIRED' };
    if (user.otpCode !== otpCode) return { success: false, error: 'INVALID_OTP' };
    return { success: true, userId: user.id };
};

const resetPasswordWithOtp = async (email, otpCode, newPassword) => {
    const verification = await verifyOtp(email, otpCode);
    if (!verification.success) return verification;

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
        where: { id: verification.userId },
        data: { password: hashedPassword, otpCode: null, otpExpiry: null },
    });
    return { success: true };
};

/**
 * ตรวจสอบว่า username นี้ว่างหรือถูกใช้ไปแล้ว
 * ใช้ตอนลงทะเบียน (real-time check ขณะพิมพ์)
 */
const checkUsernameAvailability = async (username) => {
    const existing = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
    });
    return { available: !existing };
};

module.exports = {
    searchUsers,
    getAllUsers,
    getUserById,
    getUserPublicById,
    createUser,
    getUserByEmail,
    getUserByUsername,
    comparePassword,
    updatePassword,
    softDeleteUser,
    softDeleteMyAccount,
    updateUserProfile,
    generateOtp,
    saveOtp,
    verifyOtp,
    resetPasswordWithOtp,
    checkUsernameAvailability,
};