/**
 * Image Preprocessing Utility
 *
 * แปลงรูปภาพให้เหมาะสมก่อนส่ง iApp OCR API:
 *   1. แปลงเป็น JPEG (รองรับ HEIC, WebP, PNG, TIFF ฯลฯ)
 *   2. Resize ให้ไม่เกิน 1920px (ด้านยาวสุด)
 *   3. Auto-rotate ตาม EXIF orientation
 *   4. ปรับ quality ให้เหมาะสม
 */

const sharp = require('sharp');

/**
 * Preprocess image buffer for OCR
 * @param {Buffer} inputBuffer - raw image buffer จาก multer
 * @param {object} [options] - ตัวเลือก
 * @param {number} [options.maxDimension=1920] - ขนาดสูงสุดด้านยาว (px)
 * @param {number} [options.quality=90] - คุณภาพ JPEG (1-100)
 * @returns {Promise<{buffer: Buffer, mimeType: string, fileName: string}>}
 */
const preprocessForOcr = async (inputBuffer, options = {}) => {
    const { maxDimension = 1920, quality = 90 } = options;

    try {
        const processed = await sharp(inputBuffer)
            .rotate()                          // Auto-rotate ตาม EXIF
            .resize(maxDimension, maxDimension, {
                fit: 'inside',                 // ไม่ crop, ย่อให้พอดี
                withoutEnlargement: true,       // ไม่ขยายถ้าเล็กกว่า
            })
            .jpeg({ quality, mozjpeg: true })  // แปลงเป็น JPEG
            .toBuffer();

        return {
            buffer: processed,
            mimeType: 'image/jpeg',
            fileName: 'processed_image.jpg',
        };
    } catch (err) {
        console.error('Image preprocessing failed, using original:', err.message);
        // ถ้า sharp ล้มเหลว ส่ง original buffer กลับไป
        return {
            buffer: inputBuffer,
            mimeType: 'image/jpeg',
            fileName: 'original_image.jpg',
        };
    }
};

module.exports = { preprocessForOcr };
