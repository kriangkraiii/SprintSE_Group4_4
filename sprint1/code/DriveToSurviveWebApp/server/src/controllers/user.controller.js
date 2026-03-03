const asyncHandler = require('express-async-handler');
const userService = require("../services/user.service");
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../utils/cloudinary');
const notifService = require('../services/notification.service');

const adminListUsers = asyncHandler(async (req, res) => {
    const result = await userService.searchUsers(req.query);
    res.status(200).json({
        success: true,
        message: "Users (admin) retrieved",
        ...result,
    });
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.status(200).json({
        success: true,
        message: "Users retrieved",
        data: users
    });
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json({
        success: true,
        message: "User retrieved",
        data: user
    });
});

const getUserPublicById = asyncHandler(async (req, res) => {
    const user = await userService.getUserPublicById(req.params.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json({
        success: true,
        message: "User retrieved",
        data: user
    });
});

const getMyUser = asyncHandler(async (req, res) => {
    const user = req.user.sub
    const data = await userService.getUserById(user)
    res.status(200).json({
        success: true,
        message: "User retrieved",
        data: data
    })

})

const uploadIdentityImages = async (req, userData) => {
    if (!req.files || !req.files.nationalIdPhotoUrl || !req.files.selfiePhotoUrl) {
        throw new ApiError(400, "National ID photo and selfie photo are required.");
    }

    const uploadPromises = [
        uploadToCloudinary(req.files.nationalIdPhotoUrl[0].buffer, 'drivetosurvive/national_ids'),
        uploadToCloudinary(req.files.selfiePhotoUrl[0].buffer, 'drivetosurvive/selfies')
    ];

    if (req.files.nationalIdBackPhotoUrl) {
        uploadPromises.push(
            uploadToCloudinary(req.files.nationalIdBackPhotoUrl[0].buffer, 'drivetosurvive/national_ids_back')
        );
    }

    const results = await Promise.all(uploadPromises);
    const [nationalIdResult, selfieResult] = results;

    userData.nationalIdPhotoUrl = nationalIdResult.url;
    userData.selfiePhotoUrl = selfieResult.url;
    if (results[2]) userData.nationalIdBackPhotoUrl = results[2].url;
};

const createUser = asyncHandler(async (req, res) => {
    const userData = req.body;
    await uploadIdentityImages(req, userData);

    const newUser = await userService.createUser(userData);

    const notifPayload = {
        userId: newUser.id,
        type: 'VERIFICATION',
        title: 'ยืนยันตัวตนสำเร็จ',
        body: 'ระบบได้ตรวจสอบข้อมูลบัตรประชาชนและรูปถ่ายของคุณอัตโนมัติแล้ว คุณสามารถจองและโดยสารได้ทันที',
        link: '/profile/verification',
        metadata: {
            kind: 'identity_verification_submission',
            userId: newUser.id,
            initiatedBy: 'user'
        }
    }

    await notifService.createNotificationByAdmin(notifPayload)

    res.status(201).json({
        success: true,
        message: "User created and verified successfully.",
        data: newUser
    });
});

const createAdminUser = asyncHandler(async (req, res) => {
    const userData = req.body;
    await uploadIdentityImages(req, userData);

    userData.role = 'ADMIN';
    userData.createdByAdmin = true;

    const newUser = await userService.createUser(userData);

    res.status(201).json({
        success: true,
        message: 'Admin user created successfully.',
        data: newUser
    });
});

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
    // เอาข้อมูล text fields ที่มากับ req.body
    const updateData = { ...req.body };


    if (req.files?.nationalIdPhotoUrl) {
        const buf = req.files.nationalIdPhotoUrl[0].buffer;
        const result = await uploadToCloudinary(buf, 'drivetosurvive/national_ids');
        updateData.nationalIdPhotoUrl = result.url;
    }

    if (req.files?.selfiePhotoUrl) {
        const buf = req.files.selfiePhotoUrl[0].buffer;
        const result = await uploadToCloudinary(buf, 'drivetosurvive/selfies');
        updateData.selfiePhotoUrl = result.url;
    }

    if (req.files?.profilePicture) {
        const buf = req.files.profilePicture[0].buffer;
        const result = await uploadToCloudinary(buf, 'drivetosurvive/profiles');
        updateData.profilePicture = result.url;
    }

    const updatedUser = await userService.updateUserProfile(req.user.sub, updateData);
    res.status(200).json({
        success: true,
        message: "Profile updated",
        data: updatedUser
    });
});

const adminUpdateUser = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateUserProfile(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: "User updated by admin",
        data: updatedUser
    });
});

/**
 * Admin: Soft delete user (PDPA ม.33 + พ.ร.บ.คอมพิวเตอร์ ม.26)
 * anonymize PII แต่เก็บ SystemLog ไว้
 */
const adminDeleteUser = asyncHandler(async (req, res) => {
    const result = await userService.softDeleteUser(req.params.id);
    res.status(200).json({
        success: true,
        message: 'User soft-deleted (PII anonymized, SystemLog preserved)',
        data: { deletedUserId: result.id },
    });
});

/**
 * User self-service: ลบบัญชีตัวเอง (PDPA ม.33 — Right to Erasure)
 */
const softDeleteMyAccount = asyncHandler(async (req, res) => {
    const result = await userService.softDeleteMyAccount(req.user.sub);
    res.status(200).json({
        success: true,
        message: 'Your account has been deleted. Logs are retained per Computer Crime Act.',
        data: { deletedUserId: result.id },
    });
});

const setUserStatus = asyncHandler(async (req, res) => {
    const { isActive, isVerified } = req.body

    if (typeof isActive !== 'boolean' && typeof isVerified !== 'boolean') {
        throw new ApiError(400, 'Provide at least one of isActive or isVerified as boolean');
    }

    let updatedUser = await userService.updateUserProfile(req.params.id, {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(typeof isVerified === 'boolean' ? { isVerified } : {}),
    });

    if (typeof isVerified === 'boolean') {
        try {
            if (isVerified === true) {
                await notifService.createNotificationByAdmin({
                    userId: updatedUser.id,
                    type: 'VERIFICATION',
                    title: 'ยืนยันตัวตนสำเร็จ',
                    body: 'แอดมินได้ตรวจสอบบัญชีของคุณแล้ว ตอนนี้คุณสามารถใช้งานได้เต็มรูปแบบ',
                    link: '/profile/verification',
                    metadata: {
                        kind: 'user_verification',
                        userId: updatedUser.id,
                        initiatedBy: 'system'
                    }
                });
            }
            else if (isVerified === false) {
                await notifService.createNotificationByAdmin({
                    userId: updatedUser.id,
                    type: 'VERIFICATION',
                    title: 'ยืนยันตัวตนไม่สำเร็จ',
                    body: 'ข้อมูลบัตรประชาชน/รูปถ่ายของคุณไม่ผ่านการตรวจสอบ กรุณาตรวจสอบและส่งใหม่อีกครั้ง',
                    link: '/profile/verification',
                    metadata: {
                        kind: 'user_verification',
                        userId: updatedUser.id,
                        initiatedBy: 'system'
                    }
                });
            }
        } catch (e) {
            console.error('Failed to create verification notification:', e);
        }
    }

    res.status(200).json({ success: true, message: "User status updated", data: updatedUser });
});

module.exports = {
    adminListUsers,
    getAllUsers,
    getUserById,
    getMyUser,
    getUserPublicById,
    createUser,
    createAdminUser,
    updateCurrentUserProfile,
    adminUpdateUser,
    adminDeleteUser,
    softDeleteMyAccount,
    setUserStatus,
};