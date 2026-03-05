const multer = require('multer');
const ApiError = require('../utils/ApiError');

// กำหนดค่า Multer ให้เก็บไฟล์ใน memoryชั่วคราวเพื่อรอส่งต่อไปยัง Cloudinary
const storage = multer.memoryStorage();

// รองรับเฉพาะไฟล์ JPEG, JPG, PNG เท่านั้น
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ไม่เกิน 5 MB
    fileFilter: (req, file, cb) => {
        // ตรวจสอบ MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(new ApiError(400, 'รองรับเฉพาะไฟล์ JPEG, JPG, PNG เท่านั้น'), false);
        }
        // ตรวจสอบนามสกุลไฟล์
        const ext = (file.originalname || '').toLowerCase().match(/\.[^.]+$/);
        if (ext && !ALLOWED_EXTENSIONS.includes(ext[0])) {
            return cb(new ApiError(400, 'รองรับเฉพาะไฟล์ JPEG, JPG, PNG เท่านั้น'), false);
        }
        cb(null, true);
    },
});

module.exports = upload;
