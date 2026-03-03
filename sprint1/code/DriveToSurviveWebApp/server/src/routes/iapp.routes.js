const express = require('express');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload.middleware');
const iappController = require('../controllers/iapp.controller');

const router = express.Router();

// OCR บัตร ปชช — ไม่ต้อง Login (ใช้ตอนลงทะเบียน)
router.post('/id-card/front', upload.single('image'), iappController.ocrIdCardFront);
router.post('/id-card/back', upload.single('image'), iappController.ocrIdCardBack);

// ยืนยันตัวตนด้วยใบหน้าและบัตรประชาชน (Face + ID Card) — ไม่ต้อง Login (ใช้ตอนลงทะเบียน)
router.post('/face-id-verification', upload.fields([{ name: 'idCardImage', maxCount: 1 }, { name: 'selfieImage', maxCount: 1 }]), iappController.faceIdVerification);

// OCR ใบขับขี่ & ทะเบียนรถ — ต้อง Login
router.post('/driver-license', protect, upload.single('image'), iappController.ocrDriverLicense);
router.post('/vehicle-registration', protect, upload.single('image'), iappController.ocrVehicleRegistration);

module.exports = router;
