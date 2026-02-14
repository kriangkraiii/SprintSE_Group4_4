/**
 * iApp Thai e-KYC API Client (v3)
 *
 * Endpoint ที่ใช้:
 *   1. OCR บัตรประชาชน ด้านหน้า (Thai ID Card Front)
 *   2. OCR บัตรประชาชน ด้านหลัง (Thai ID Card Back)
 *   3. OCR ใบขับขี่ (Driver's License)
 *   4. OCR ทะเบียนรถ (Vehicle Registration)
 *
 * Flow: รับ file buffer → ส่งเป็น multipart/form-data ไปยัง iApp API
 */

const axios = require('axios');
const FormData = require('form-data');

const IAPP_API_KEY = process.env.IAPP_API_KEY;

/**
 * OCR บัตรประชาชนไทย (ด้านหน้า)
 * @param {Buffer} fileBuffer - ไฟล์รูปภาพ
 * @param {string} [fileName='id_card_front.jpg'] - ชื่อไฟล์
 * @param {string} [mimeType='image/jpeg'] - MIME type ของไฟล์
 * @returns {object} ข้อมูลที่อ่านได้จากบัตร
 */
const ocrIdCardFront = async (fileBuffer, fileName = 'id_card_front.jpg', mimeType = 'image/jpeg') => {
    const form = new FormData();
    form.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

    const response = await axios.post(
        'https://api.iapp.co.th/v3/store/ekyc/thai-national-id-card/front',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'apikey': IAPP_API_KEY,
            },
            timeout: 30000,
            maxContentLength: 10 * 1024 * 1024,
        }
    );
    return response.data;
};

/**
 * OCR บัตรประชาชนไทย (ด้านหลัง)
 * @param {Buffer} fileBuffer - ไฟล์รูปภาพ
 * @param {string} [fileName='id_card_back.jpg'] - ชื่อไฟล์
 * @param {string} [mimeType='image/jpeg'] - MIME type ของไฟล์
 * @returns {object} ข้อมูล back_number
 */
const ocrIdCardBack = async (fileBuffer, fileName = 'id_card_back.jpg', mimeType = 'image/jpeg') => {
    const form = new FormData();
    form.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

    const response = await axios.post(
        'https://api.iapp.co.th/v3/store/ekyc/thai-national-id-card/back',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'apikey': IAPP_API_KEY,
            },
            timeout: 30000,
            maxContentLength: 10 * 1024 * 1024,
        }
    );
    return response.data;
};

/**
 * OCR ใบขับขี่ไทย
 * @param {Buffer} fileBuffer - ไฟล์รูปภาพ
 * @param {string} [fileName='driver_license.jpg'] - ชื่อไฟล์
 * @param {string} [mimeType='image/jpeg'] - MIME type ของไฟล์
 * @returns {object} ข้อมูลที่อ่านได้จากใบขับขี่
 */
const ocrDriverLicense = async (fileBuffer, fileName = 'driver_license.jpg', mimeType = 'image/jpeg') => {
    const form = new FormData();
    form.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

    const response = await axios.post(
        'https://api.iapp.co.th/v3/store/ekyc/thai-driver-license',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'apikey': IAPP_API_KEY,
            },
            timeout: 30000,
            maxContentLength: 10 * 1024 * 1024,
        }
    );
    return response.data;
};

/**
 * OCR ทะเบียนรถ (legacy — ยังใช้ URL-based)
 * @param {string} imageUrl - URL ของรูปสมุดทะเบียนรถ (Cloudinary)
 * @returns {object} ข้อมูลที่อ่านได้จากทะเบียนรถ
 */
const ocrVehicleRegistration = async (imageUrl) => {
    const response = await axios.post(
        'https://api.iapp.co.th/thai-vehicle-registration/v1/front',
        { url: imageUrl },
        {
            headers: { 'apikey': IAPP_API_KEY },
            timeout: 30000,
        }
    );
    return response.data;
};

/**
 * ยืนยันตัวตนด้วยใบหน้าและบัตรประชาชน (Face and ID Card Verification)
 * @param {Buffer} idCardBuffer - ไฟล์รูปบัตรประชาชน
 * @param {string} idCardFileName - ชื่อไฟล์บัตรประชาชน
 * @param {string} idCardMimeType - MIME type
 * @param {Buffer} selfieBuffer - ไฟล์รูปเซลฟี่
 * @param {string} selfieFileName - ชื่อไฟล์เซลฟี่
 * @param {string} selfieMimeType - MIME type
 * @returns {object} ผลการยืนยันตัวตน
 */
const faceAndIdCardVerification = async (
    idCardBuffer, idCardFileName = 'id_card.jpg', idCardMimeType = 'image/jpeg',
    selfieBuffer, selfieFileName = 'selfie.jpg', selfieMimeType = 'image/jpeg'
) => {
    const form = new FormData();
    form.append('file0', idCardBuffer, { filename: idCardFileName, contentType: idCardMimeType });
    form.append('file1', selfieBuffer, { filename: selfieFileName, contentType: selfieMimeType });

    const response = await axios.post(
        'https://api.iapp.co.th/v3/store/ekyc/face-and-id-card-verification',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'apikey': IAPP_API_KEY,
            },
            timeout: 30000,
            maxContentLength: 10 * 1024 * 1024,
        }
    );
    return response.data;
};

module.exports = { ocrIdCardFront, ocrIdCardBack, ocrDriverLicense, ocrVehicleRegistration, faceAndIdCardVerification };
