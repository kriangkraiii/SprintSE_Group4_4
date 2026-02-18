const asyncHandler = require('express-async-handler');
const iappService = require('../services/iapp.service');
const blacklistService = require('../services/blacklist.service');
const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/ocr/id-card/front
 * Upload รูปบัตรประชาชนด้านหน้า → OCR → ตรวจ Blacklist → ตรวจซ้ำ → ส่งข้อมูลกลับ
 * ใช้ตอนลงทะเบียน (ไม่ต้อง login)
 *
 * Flow:
 *   1. OCR อ่านข้อมูลจากบัตร
 *   2. ถ้าได้เลขบัตร ปชช. → ตรวจสอบกับ Blacklist (SHA-256 hash)
 *   3. ถ้าอยู่ใน Blacklist → ปฏิเสธทันที (HTTP 403)
 *   4. ตรวจว่าเลขบัตรนี้มีคนสมัครไปแล้วหรือไม่ (HTTP 409)
 *   5. ถ้าไม่อยู่ → ส่งข้อมูล OCR กลับตามปกติ
 */
const ocrIdCardFront = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Image file is required. Use field name "image".');
    }

    const result = await iappService.processIdCardFrontOcr(req.file.buffer, req.file.originalname, req.file.mimetype);

    // ── Blacklist & Duplicate Check ──
    const idNumber = result.data?.idNumber;
    if (idNumber && /^\d{13}$/.test(idNumber.replace(/\s/g, ''))) {
        const cleanId = idNumber.replace(/\s/g, '');

        // 1) ตรวจ Blacklist (SHA-256 hash)
        const blacklisted = await blacklistService.checkBlacklist(cleanId);
        if (blacklisted) {
            throw new ApiError(403, 'หมายเลขบัตรประชาชนนี้ถูกขึ้นบัญชีดำ ไม่สามารถสมัครสมาชิกได้');
        }

        // 2) ตรวจว่าเลขบัตรนี้มีคนสมัครไปแล้วหรือยัง
        const existingUser = await prisma.user.findUnique({
            where: { nationalIdNumber: cleanId },
            select: { id: true },
        });
        if (existingUser) {
            throw new ApiError(409, 'หมายเลขบัตรประชาชนนี้ถูกใช้สมัครสมาชิกไปแล้ว');
        }
    }

    res.status(200).json({
        success: true,
        message: 'ID Card Front OCR completed',
        data: result.data,
    });
});

/**
 * POST /api/ocr/id-card/back
 * Upload รูปบัตรประชาชนด้านหลัง → OCR → ส่งข้อมูลกลับ
 * ใช้ตอนลงทะเบียน (ไม่ต้อง login)
 */
const ocrIdCardBack = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Image file is required. Use field name "image".');
    }

    const result = await iappService.processIdCardBackOcr(req.file.buffer, req.file.originalname, req.file.mimetype);

    res.status(200).json({
        success: true,
        message: 'ID Card Back OCR completed',
        data: result.data,
    });
});

/**
 * POST /api/ocr/driver-license
 * Upload รูปใบขับขี่ → OCR → ส่งข้อมูลกลับ
 */
const ocrDriverLicense = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Image file is required. Use field name "image".');
    }

    const result = await iappService.processDriverLicenseOcr(req.file.buffer, req.file.originalname, req.file.mimetype);

    res.status(200).json({
        success: true,
        message: 'Driver License OCR completed',
        data: result.data,
    });
});

/**
 * POST /api/ocr/vehicle-registration
 * Upload รูปทะเบียนรถ → OCR → ส่งข้อมูลกลับ
 */
const ocrVehicleRegistration = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Image file is required. Use field name "image".');
    }

    const result = await iappService.processVehicleRegistrationOcr(req.file.buffer);

    res.status(200).json({
        success: true,
        message: 'Vehicle Registration OCR completed',
        data: result,
    });
});

/**
 * POST /api/ocr/face-id-verification
 * Upload รูปบัตรประชาชน + รูปเซลฟี่ → ยืนยันตัวตนว่าเป็นบุคคลเดียวกัน
 */
const faceIdVerification = asyncHandler(async (req, res) => {
    if (!req.files || !req.files.idCardImage || !req.files.selfieImage) {
        throw new ApiError(400, 'ID card image (idCardImage) and selfie image (selfieImage) are required.');
    }

    const idCardFile = req.files.idCardImage[0];
    const selfieFile = req.files.selfieImage[0];

    const result = await iappService.processFaceIdVerification(
        idCardFile.buffer, idCardFile.originalname, idCardFile.mimetype,
        selfieFile.buffer, selfieFile.originalname, selfieFile.mimetype
    );

    res.status(200).json({
        success: true,
        message: 'Face and ID Card Verification completed',
        data: result.data,
    });
});

module.exports = { ocrIdCardFront, ocrIdCardBack, ocrDriverLicense, ocrVehicleRegistration, faceIdVerification };
