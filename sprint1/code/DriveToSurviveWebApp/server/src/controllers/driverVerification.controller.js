const asyncHandler = require("express-async-handler");
const verifService = require("../services/driverVerification.service");
const ApiError = require("../utils/ApiError");
const { uploadToCloudinary } = require("../utils/cloudinary");
const notifService = require('../services/notification.service');
const iappService = require('../services/iapp.service');
const prisma = require('../utils/prisma');

const adminListVerifications = asyncHandler(async (req, res) => {
  const result = await verifService.searchVerifications(req.query);
  res.status(200).json({
    success: true,
    message: "Driver verifications (admin) retrieved successfully",
    ...result,
  });
});

const getMyVerification = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const record = await verifService.getVerificationByUser(userId);
  res.status(200).json({
    success: true,
    message: "Driver verification record retrieved successfully",
    data: record,
  });
});

const createVerification = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  // ไฟล์ต้องมีอยู่
  if (!req.files || !req.files.licensePhotoUrl || !req.files.selfiePhotoUrl) {
    throw new ApiError(400, "License photo and selfie photo are required");
  }

  // อัปโหลดรูปไป Cloudinary
  // const result = await uploadToCloudinary(
  //   req.file.buffer,
  //   "drivetosurvive/licenses"
  // );

  const [licenseResult, selfieResult] = await Promise.all([
    uploadToCloudinary(
      req.files.licensePhotoUrl[0].buffer,
      "drivetosurvive/licenses"
    ),
    uploadToCloudinary(req.files.selfiePhotoUrl[0].buffer, "drivetosurvive/selfies"),
  ]);

  const payload = {
    userId,
    licenseNumber: req.body.licenseNumber,
    firstNameOnLicense: req.body.firstNameOnLicense,
    lastNameOnLicense: req.body.lastNameOnLicense,
    typeOnLicense: req.body.typeOnLicense,
    licenseIssueDate: new Date(req.body.licenseIssueDate),
    licenseExpiryDate: new Date(req.body.licenseExpiryDate),
    licensePhotoUrl: licenseResult.url,
    selfiePhotoUrl: selfieResult.url,
  };

  const newRec = await verifService.createVerification(payload);

  const notifPayload = {
    userId,
    type: 'VERIFICATION',
    title: 'ยืนยันตัวตนคนขับสำเร็จ',
    body: 'ระบบอนุมัติใบขับขี่ของคุณอัตโนมัติแล้ว คุณสามารถสร้างเส้นทางได้ทันที',
    link: '/driver-verification',
    metadata: {
      kind: 'driver_verification',
      verificationId: newRec.id,
      userId: newRec.userId,
      status: newRec.status,
      initiatedBy: 'system'
    }
  }

  await notifService.createNotificationByAdmin(notifPayload)

  res.status(201).json({
    success: true,
    message: "Driver verification approved automatically",
    data: newRec,
  });
});

const updateVerification = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;

  const existing = await verifService.getVerificationById(id);
  if (!existing) throw new ApiError(404, "Verification not found");
  if (existing.userId !== userId) throw new ApiError(403, "Forbidden");

  // ถ้ามีไฟล์ใหม่ ให้อัปโหลดทับ
  let photoUrl = existing.licensePhotoUrl;
  if (req.file) {
    const result = await uploadToCloudinary(
      req.file.buffer,
      "drivetosurvive/licenses"
    );
    photoUrl = result.url;
  }

  const payload = {
    ...req.body,
    licenseIssueDate: req.body.licenseIssueDate
      ? new Date(req.body.licenseIssueDate)
      : undefined,
    licenseExpiryDate: req.body.licenseExpiryDate
      ? new Date(req.body.licenseExpiryDate)
      : undefined,
    licensePhotoUrl: photoUrl,
  };

  const updated = await verifService.updateVerification(id, payload);

  const notifPayload = {
    userId: updated.userId,
    type: 'VERIFICATION',
    title: 'ยืนยันตัวตนคนขับสำเร็จ',
    body: 'ระบบอนุมัติใบขับขี่ของคุณอัตโนมัติแล้ว คุณสามารถสร้างเส้นทางได้ทันที',
    link: '/driver-verification',
    metadata: {
      kind: 'driver_verification',
      verificationId: updated.id,
      userId: updated.userId,
      status: updated.status,
      initiatedBy: 'system'
    }
  }

  await notifService.createNotificationByAdmin(notifPayload)

  res.status(200).json({
    success: true,
    message: "Driver verification approved automatically",
    data: updated,
  });
});

const getAllVerifications = asyncHandler(async (req, res) => {
  const list = await verifService.getAllVerifications();
  res.status(200).json({
    success: true,
    message: "All driver verifications retrieved successfully",
    data: list,
  });
});

const getVerificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rec = await verifService.getVerificationById(id);
  if (!rec) throw new ApiError(404, "Verification not found");
  res.status(200).json({
    success: true,
    message: "Driver verification record retrieved successfully",
    data: rec,
  });
});

const updateVerificationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await verifService.updateVerificationStatus(id, status);

  try {
    if (status === 'APPROVED') {
      await notifService.createNotificationByAdmin({
        userId: updated.userId,
        type: 'VERIFICATION',
        title: 'ยืนยันตัวตนคนขับสำเร็จ',
        body: 'แอดมินได้อนุมัติคำขอของคุณแล้ว ตอนนี้คุณสามารถสร้างเส้นทางได้',
        link: '/driver-verification',
        metadata: {
          kind: 'driver_verification',
          verificationId: updated.id,
          userId: updated.userId,
          status: updated.status,
          initiatedBy: 'system'
        }
      });
    } else if (status === 'REJECTED') {
      await notifService.createNotificationByAdmin({
        userId: updated.userId,
        type: 'VERIFICATION',
        title: 'คำขอคนขับถูกปฏิเสธ',
        body: 'ข้อมูลใบขับขี่/รูปถ่ายของคุณไม่ผ่านการตรวจสอบ กรุณาตรวจสอบและส่งใหม่อีกครั้ง',
        link: '/driver-verification',
        metadata: {
          kind: 'driver_verification',
          verificationId: updated.id,
          userId: updated.userId,
          status: updated.status,
          initiatedBy: 'system'
        }
      });
    } else if (status === 'PENDING') {
      await notifService.createNotificationByAdmin({
        userId: updated.userId,
        type: 'VERIFICATION',
        title: 'คำขอคนขับอยู่ระหว่างตรวจสอบ',
        body: 'เราได้รับคำขอของคุณแล้ว กำลังอยู่ระหว่างการตรวจสอบโดยแอดมิน',
        link: '/driver-verification',
        metadata: {
          kind: 'driver_verification',
          verificationId: updated.id,
          userId: updated.userId,
          status: updated.status,
          initiatedBy: 'user'
        }
      });
    }
  } catch (e) {
    console.error('Failed to create verification notification:', e);
  }

  res.status(200).json({
    success: true,
    message: `Driver verification status updated to ${status}`,
    data: updated,
  });
});

const adminCreateVerification = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  if (req.files?.licensePhotoUrl) {
    const r = await uploadToCloudinary(req.files.licensePhotoUrl[0].buffer, "drivetosurvive/licenses");
    payload.licensePhotoUrl = r.url;
  }
  if (req.files?.selfiePhotoUrl) {
    const r = await uploadToCloudinary(req.files.selfiePhotoUrl[0].buffer, "drivetosurvive/selfies");
    payload.selfiePhotoUrl = r.url;
  }

  if (payload.licenseIssueDate) payload.licenseIssueDate = new Date(payload.licenseIssueDate);
  if (payload.licenseExpiryDate) payload.licenseExpiryDate = new Date(payload.licenseExpiryDate);

  const created = await verifService.createVerificationByAdmin(payload);

  res.status(201).json({
    success: true,
    message: "Driver verification (by admin) created successfully",
    data: created,
  });
});

const adminDeleteVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await verifService.getVerificationById(id);
  if (!existing) throw new ApiError(404, "Verification not found");

  await verifService.deleteVerificationByAdmin(id);

  res.status(200).json({
    success: true,
    message: "Driver verification (by admin) deleted successfully",
  });
});

const adminUpdateVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await verifService.getVerificationById(id);
  if (!existing) throw new ApiError(404, "Verification not found");

  const payload = { ...req.body };

  if (req.files?.licensePhotoUrl) {
    const r = await uploadToCloudinary(req.files.licensePhotoUrl[0].buffer, "drivetosurvive/licenses");
    payload.licensePhotoUrl = r.url;
  }
  if (req.files?.selfiePhotoUrl) {
    const r = await uploadToCloudinary(req.files.selfiePhotoUrl[0].buffer, "drivetosurvive/selfies");
    payload.selfiePhotoUrl = r.url;
  }

  // แปลงวันที่ (ถ้ามาเป็น string)
  if (payload.licenseIssueDate) payload.licenseIssueDate = new Date(payload.licenseIssueDate);
  if (payload.licenseExpiryDate) payload.licenseExpiryDate = new Date(payload.licenseExpiryDate);

  const updated = await verifService.updateVerificationByAdmin(id, payload);

  res.status(200).json({
    success: true,
    message: "Driver verification (by admin) updated successfully",
    data: updated,
  });
});

/**
 * POST /driver-verifications/ocr
 * อัปโหลดใบขับขี่ → OCR → ดึงข้อมูล → auto verify → สร้าง/อัปเดต record
 * ไม่ต้องให้แอดมินกดยืนยัน
 */
const createVerificationWithOcr = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  if (!req.files || !req.files.licensePhotoUrl || !req.files.selfiePhotoUrl) {
    throw new ApiError(400, "License photo and selfie photo are required");
  }

  // Step 1: OCR ใบขับขี่ก่อน
  const licenseBuffer = req.files.licensePhotoUrl[0].buffer;
  const licenseFileName = req.files.licensePhotoUrl[0].originalname;
  const ocrResult = await iappService.processDriverLicenseOcr(licenseBuffer, licenseFileName);

  if (!ocrResult.success) {
    throw new ApiError(422, 'ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้ กรุณาถ่ายรูปให้ชัดเจนขึ้น');
  }

  const ocrData = ocrResult.data;

  // Step 1.5: ตรวจสอบเลขบัตร ปชช. — ต้องตรงกับเลขที่ยืนยันตอนสมัครสมาชิก
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { nationalIdNumber: true },
  });

  if (!currentUser || !currentUser.nationalIdNumber) {
    throw new ApiError(400, 'ไม่พบเลขบัตรประชาชนในระบบ กรุณายืนยันตัวตนด้วยบัตรประชาชนก่อน');
  }

  const ocrIdNumber = (ocrData.idNumber || '').replace(/\s|-/g, '').trim();
  const userIdNumber = (currentUser.nationalIdNumber || '').replace(/\s|-/g, '').trim();

  if (!ocrIdNumber) {
    throw new ApiError(422, 'ไม่สามารถอ่านเลขบัตรประชาชนจากใบขับขี่ได้ กรุณาถ่ายรูปให้ชัดเจนขึ้น');
  }

  if (ocrIdNumber !== userIdNumber) {
    throw new ApiError(403, `เลขบัตรประชาชนบนใบขับขี่ (${ocrIdNumber}) ไม่ตรงกับเลขบัตรประชาชนที่ยืนยันตอนสมัครสมาชิก กรุณาใช้ใบขับขี่ที่เป็นของคุณ`);
  }

  // Step 2: อัปโหลดรูปไป Cloudinary
  const [licenseResult, selfieResult] = await Promise.all([
    uploadToCloudinary(req.files.licensePhotoUrl[0].buffer, "drivetosurvive/licenses"),
    uploadToCloudinary(req.files.selfiePhotoUrl[0].buffer, "drivetosurvive/selfies"),
  ]);

  // Step 3: แปลงประเภทใบขับขี่จาก OCR เป็น enum
  const licenseTypeMap = {
    'ใบอนุญาติขับรถยนต์ส่วนบุคคล': 'PRIVATE_CAR',
    'ใบอนุญาตขับรถยนต์ส่วนบุคคล': 'PRIVATE_CAR',
    'ใบอนุญาตขับรถยนต์ส่วนบุคคลชั่วคราว': 'PRIVATE_CAR_TEMPORARY',
    'ใบอนุญาติขับรถยนต์ส่วนบุคคลชั่วคราว': 'PRIVATE_CAR_TEMPORARY',
    'ใบอนุญาตขับรถยนต์สาธารณะ': 'PUBLIC_CAR',
    'ใบอนุญาติขับรถยนต์สาธารณะ': 'PUBLIC_CAR',
    'ใบอนุญาตขับรถตลอดชีพ': 'LIFETIME',
    'ใบอนุญาติขับรถตลอดชีพ': 'LIFETIME',
    'Private Car Driving License': 'PRIVATE_CAR',
    'Temporary Private Car Driving License': 'PRIVATE_CAR_TEMPORARY',
    'Public Car Driving License': 'PUBLIC_CAR',
  };

  // ดึงชื่อจาก OCR
  let firstNameOnLicense = '';
  let lastNameOnLicense = '';
  if (ocrData.thName) {
    const nameParts = ocrData.thName.replace(/^(นาย|นาง|นางสาว|Mr\.|Mrs\.|Miss)\s*/i, '').trim().split(/\s+/);
    firstNameOnLicense = nameParts[0] || '';
    lastNameOnLicense = nameParts.slice(1).join(' ') || '';
  }

  // แปลงวันที่จาก OCR format
  const parseOcrDate = (dateStr) => {
    if (!dateStr) return new Date();
    // ลองแปลงจาก en format เช่น "26 Mar 2024"
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  };

  const typeOnLicense = licenseTypeMap[ocrData.thType] || licenseTypeMap[ocrData.enType] || 'PRIVATE_CAR';

  const payload = {
    userId,
    licenseNumber: ocrData.licenseNumber || ocrData.enLicenseNo || ocrData.thLicenseNo || 'OCR_PENDING',
    firstNameOnLicense: firstNameOnLicense || req.body.firstNameOnLicense || '',
    lastNameOnLicense: lastNameOnLicense || req.body.lastNameOnLicense || '',
    typeOnLicense,
    licenseIssueDate: parseOcrDate(ocrData.enIssueDate || ocrData.thIssueDate),
    licenseExpiryDate: parseOcrDate(ocrData.enExpiryDate || ocrData.thExpiryDate),
    licensePhotoUrl: licenseResult.url,
    selfiePhotoUrl: selfieResult.url,
    ocrData: ocrData,
    verifiedByOcr: true,
    status: 'APPROVED', // auto approve เพราะ OCR ผ่าน
  };

  // Step 4: สร้างหรืออัปเดต verification record + auto-verify identity
  const record = await verifService.createVerificationAutoApproved(payload);

  // Step 5: แจ้งเตือน
  try {
    await notifService.createNotificationByAdmin({
      userId,
      type: 'VERIFICATION',
      title: 'ยืนยันตัวตนคนขับสำเร็จ (อัตโนมัติ)',
      body: 'ระบบ OCR ตรวจสอบใบขับขี่ของคุณเรียบร้อยแล้ว คุณสามารถสร้างเส้นทางได้ทันที',
      link: '/driverVerify',
      metadata: {
        kind: 'driver_verification',
        verificationId: record.id,
        userId: record.userId,
        status: 'APPROVED',
        verifiedByOcr: true,
        initiatedBy: 'system'
      }
    });
  } catch (e) {
    console.error('Failed to create OCR verification notification:', e);
  }

  res.status(201).json({
    success: true,
    message: "ยืนยันตัวตนคนขับสำเร็จ (ตรวจสอบอัตโนมัติโดยระบบ OCR)",
    data: record,
    ocrExtracted: ocrData,
  });
});

module.exports = {
  adminListVerifications,
  getMyVerification,
  createVerification,
  createVerificationWithOcr,
  updateVerification,
  getAllVerifications,
  getVerificationById,
  updateVerificationStatus,
  adminCreateVerification,
  adminUpdateVerification,
  adminDeleteVerification,
};
