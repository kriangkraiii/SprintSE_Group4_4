/**
 * iApp OCR Service (v3)
 *
 * Flow:
 *   1. รับ Image Buffer จาก User
 *   2. ส่ง buffer ตรงไปยัง iApp OCR API (multipart/form-data)
 *   3. รับ JSON response กลับมา
 *   4. Validate ข้อมูล + Return
 */

const { uploadToCloudinary } = require('../utils/cloudinary');
const { ocrIdCardFront, ocrIdCardBack, ocrDriverLicense, ocrVehicleRegistration, faceAndIdCardVerification, faceAndIdCardVerificationKycFront } = require('../utils/iapp');
const { preprocessForOcr, preprocessForFaceVerification } = require('../utils/imagePreprocess');
const ApiError = require('../utils/ApiError');

// ── iApp Error Code Mapping ──
const mapIappFrontError = (errMsg) => {
    const map = {
        'NO_ID_CARD_FOUND': 'ไม่พบบัตรประชาชนในภาพ กรุณาถ่ายรูปด้านหน้าให้ชัดเจน',
        'IMAGE_ERROR_UNSUPPORTED_FORMAT': 'รูปแบบไฟล์ไม่รองรับ กรุณาใช้ไฟล์ JPEG หรือ PNG',
        'INVALID_IMAGE_SIZE': 'ขนาดภาพไม่เหมาะสม กรุณาถ่ายรูปใหม่',
        'PLEASE_VERIFY_ID_CARD_NUMBER': 'หมายเลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบ',
        'CANNOT_READ_ID_CARD_NUMBER_CLEARLY': 'ไม่สามารถอ่านหมายเลขบัตรได้ชัดเจน กรุณาถ่ายรูปใหม่',
        'IMAGE_ERROR_UNSUPPORTED_BLACK_WHITE_IMAGE': 'ไม่รองรับภาพขาวดำ กรุณาถ่ายรูปสี',
        'FILE_IS_TOO_LARGE': 'ไฟล์มีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 10MB',
        'SERVER_IS_BUSY': 'ระบบ OCR กำลังมีผู้ใช้งานจำนวนมาก กรุณาลองใหม่ในอีกสักครู่',
        'LONG_TIME_TO_PROCESS': 'การประมวลผลใช้เวลานานเกินไป กรุณาลองใหม่',
        'NO_FILE_ATTACHED': 'ไม่พบไฟล์รูปภาพ กรุณาอัปโหลดรูปใหม่',
    };
    return map[errMsg] || `ไม่สามารถตรวจสอบบัตรประชาชนด้านหน้าได้: ${errMsg}`;
};

const mapIappBackError = (errMsg) => {
    const map = {
        'NO_ID_CARD_FOUND': 'ไม่พบบัตรประชาชนในภาพ กรุณาถ่ายรูปด้านหลังให้ชัดเจน',
        'IMAGE_ERROR_UNSUPPORTED_FORMAT': 'รูปแบบไฟล์ไม่รองรับ กรุณาใช้ไฟล์ JPEG หรือ PNG',
        'INVALID_IMAGE_SIZE': 'ขนาดภาพไม่เหมาะสม กรุณาถ่ายรูปใหม่',
        'LASER_NUMBER_NOT_FOUND': 'ไม่พบเลขเลเซอร์ด้านหลังบัตร กรุณาถ่ายรูปให้ชัดเจนขึ้น',
        'CANNOT_READ_LASER_NUMBER_CLEARLY': 'ไม่สามารถอ่านเลขเลเซอร์ได้ชัดเจน กรุณาถ่ายรูปใหม่',
        'IMAGE_ERROR_UNSUPPORTED_BLACK_WHITE_IMAGE': 'ไม่รองรับภาพขาวดำ กรุณาถ่ายรูปสี',
        'FILE_IS_TOO_LARGE': 'ไฟล์มีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 10MB',
        'SERVER_IS_BUSY': 'ระบบ OCR กำลังมีผู้ใช้งานจำนวนมาก กรุณาลองใหม่ในอีกสักครู่',
        'LONG_TIME_TO_PROCESS': 'การประมวลผลใช้เวลานานเกินไป กรุณาลองใหม่',
        'NO_FILE_ATTACHED': 'ไม่พบไฟล์รูปภาพ กรุณาอัปโหลดรูปใหม่',
    };
    return map[errMsg] || `ไม่สามารถตรวจสอบบัตรประชาชนด้านหลังได้: ${errMsg}`;
};

/**
 * OCR บัตรประชาชน ด้านหน้า — ส่ง buffer ตรงไปยัง iApp v3
 */
const processIdCardFrontOcr = async (fileBuffer, fileName, mimeType = 'image/jpeg') => {
    // Preprocess: แปลงเป็น JPEG + resize + auto-rotate
    const processed = await preprocessForOcr(fileBuffer);
    console.log(`[OCR Front] Original: ${(fileBuffer.length / 1024).toFixed(0)}KB, mimeType=${mimeType} → Processed: ${(processed.buffer.length / 1024).toFixed(0)}KB JPEG`);

    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const ocrResult = await ocrIdCardFront(processed.buffer, processed.fileName, processed.mimeType);

            // ตรวจสอบว่า detection_score เพียงพอ (>= 0.7)
            if (!ocrResult || !ocrResult.id_number) {
                if (ocrResult?.error_message) {
                    // ถ้ายัง retry ได้ ให้ลองใหม่
                    if (attempt < MAX_RETRIES && ocrResult.error_message === 'NO_ID_CARD_FOUND') {
                        console.log(`iApp Front OCR attempt ${attempt} failed with NO_ID_CARD_FOUND, retrying...`);
                        lastError = ocrResult.error_message;
                        continue;
                    }
                    const msg = mapIappFrontError(ocrResult.error_message);
                    throw new ApiError(422, msg);
                }
                throw new ApiError(422, 'ไม่สามารถอ่านข้อมูลจากบัตรประชาชนได้ กรุณาถ่ายรูปให้ชัดเจนขึ้น');
            }

            const detectionScore = ocrResult.detection_score || 0;
            if (detectionScore < 0.5) {
                throw new ApiError(422, `คะแนนการตรวจจับต่ำเกินไป (${(detectionScore * 100).toFixed(1)}%) กรุณาถ่ายรูปให้ชัดเจนขึ้น`);
            }

            return {
                success: true,
                data: {
                    idNumber: ocrResult.id_number,
                    idNumberStatus: ocrResult.id_number_status,
                    thName: ocrResult.th_name,
                    thInit: ocrResult.th_init,
                    thFirstName: ocrResult.th_fname,
                    thLastName: ocrResult.th_lname,
                    enName: ocrResult.en_name,
                    enInit: ocrResult.en_init,
                    enFirstName: ocrResult.en_fname,
                    enLastName: ocrResult.en_lname,
                    thDob: ocrResult.th_dob,
                    enDob: ocrResult.en_dob,
                    thIssueDate: ocrResult.th_issue,
                    enIssueDate: ocrResult.en_issue,
                    thExpiryDate: ocrResult.th_expire,
                    enExpiryDate: ocrResult.en_expire,
                    gender: ocrResult.gender,
                    religion: ocrResult.religion,
                    address: ocrResult.address,
                    province: ocrResult.province,
                    district: ocrResult.district,
                    subDistrict: ocrResult.sub_district,
                    postalCode: ocrResult.postal_code,
                    detectionScore,
                    processTime: ocrResult.process_time,
                    faceBase64: ocrResult.face || null,
                }
            };
        } catch (err) {
            if (err instanceof ApiError) throw err;
            const respData = err.response?.data;
            console.error(`iApp ID Card Front OCR error (attempt ${attempt}):`, respData || err.message);

            // ถ้าเป็น NO_ID_CARD_FOUND และยัง retry ได้ ให้ลองใหม่
            if (attempt < MAX_RETRIES && respData?.error_message === 'NO_ID_CARD_FOUND') {
                lastError = respData.error_message;
                continue;
            }

            if (respData?.error_message) {
                const msg = mapIappFrontError(respData.error_message);
                throw new ApiError(422, msg);
            }
            throw new ApiError(422, 'ไม่สามารถตรวจสอบบัตรประชาชนด้านหน้าได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // ถ้า retry หมดแล้วยังไม่สำเร็จ
    const msg = lastError ? mapIappFrontError(lastError) : 'ไม่สามารถตรวจสอบบัตรประชาชนด้านหน้าได้ กรุณาลองใหม่อีกครั้ง';
    throw new ApiError(422, msg);
};

/**
 * OCR บัตรประชาชน ด้านหลัง — ส่ง buffer ตรงไปยัง iApp v3
 */
const processIdCardBackOcr = async (fileBuffer, fileName, mimeType = 'image/jpeg') => {
    // Preprocess: แปลงเป็น JPEG + resize + auto-rotate
    const processed = await preprocessForOcr(fileBuffer);
    console.log(`[OCR Back] Original: ${(fileBuffer.length / 1024).toFixed(0)}KB, mimeType=${mimeType} → Processed: ${(processed.buffer.length / 1024).toFixed(0)}KB JPEG`);

    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const ocrResult = await ocrIdCardBack(processed.buffer, processed.fileName, processed.mimeType);

            // Debug: log full response จาก iApp
            console.log(`[OCR Back] Attempt ${attempt} response:`, JSON.stringify(ocrResult, null, 2));

            if (!ocrResult || !ocrResult.back_number) {
                // ตรวจสอบ error_message จาก iApp
                if (ocrResult?.error_message) {
                    // ถ้าเป็น NO_ID_CARD_FOUND และยัง retry ได้ ให้ลองใหม่
                    if (attempt < MAX_RETRIES && ocrResult.error_message === 'NO_ID_CARD_FOUND') {
                        console.log(`iApp Back OCR attempt ${attempt} failed with NO_ID_CARD_FOUND, retrying...`);
                        lastError = ocrResult.error_message;
                        continue;
                    }
                    const msg = mapIappBackError(ocrResult.error_message);
                    throw new ApiError(422, msg);
                }
                throw new ApiError(422, 'ไม่สามารถอ่านข้อมูลจากด้านหลังบัตรประชาชนได้ กรุณาถ่ายรูปให้ชัดเจนขึ้น');
            }

            return {
                success: true,
                data: {
                    backNumber: ocrResult.back_number,
                    detectionScore: ocrResult.detection_score || 0,
                    processTime: ocrResult.process_time,
                }
            };
        } catch (err) {
            if (err instanceof ApiError) throw err;
            // axios error — iApp ส่งกลับ non-2xx status
            const respData = err.response?.data;
            console.error(`iApp ID Card Back OCR error (attempt ${attempt}):`, respData || err.message);

            // ถ้าเป็น NO_ID_CARD_FOUND และยัง retry ได้ ให้ลองใหม่
            if (attempt < MAX_RETRIES && respData?.error_message === 'NO_ID_CARD_FOUND') {
                lastError = respData.error_message;
                continue;
            }

            if (respData?.error_message) {
                const msg = mapIappBackError(respData.error_message);
                throw new ApiError(422, msg);
            }
            throw new ApiError(422, 'ไม่สามารถตรวจสอบบัตรประชาชนด้านหลังได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    // ถ้า retry หมดแล้วยังไม่สำเร็จ
    const msg = lastError ? mapIappBackError(lastError) : 'ไม่สามารถตรวจสอบบัตรประชาชนด้านหลังได้ กรุณาลองใหม่อีกครั้ง';
    throw new ApiError(422, msg);
};

/**
 * OCR ใบขับขี่ — ส่ง buffer ตรงไปยัง iApp v3
 */
const processDriverLicenseOcr = async (fileBuffer, fileName, mimeType = 'image/jpeg') => {
    // Preprocess: แปลงเป็น JPEG + resize + auto-rotate
    const processed = await preprocessForOcr(fileBuffer);
    console.log(`[OCR License] Original: ${(fileBuffer.length / 1024).toFixed(0)}KB, mimeType=${mimeType} → Processed: ${(processed.buffer.length / 1024).toFixed(0)}KB JPEG`);

    try {
        const ocrResult = await ocrDriverLicense(processed.buffer, processed.fileName, processed.mimeType);

        if (!ocrResult || ocrResult.status_code !== 200) {
            throw new ApiError(422, 'ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้ กรุณาถ่ายรูปให้ชัดเจนขึ้น');
        }

        return {
            success: true,
            data: {
                licenseNumber: ocrResult.en_license_no || ocrResult.th_license_no,
                thLicenseNo: ocrResult.th_license_no,
                enLicenseNo: ocrResult.en_license_no,
                thName: ocrResult.th_name,
                enName: ocrResult.en_name,
                idNumber: ocrResult.id_no,
                thType: ocrResult.th_type,
                enType: ocrResult.en_type,
                thDob: ocrResult.th_dob,
                enDob: ocrResult.en_dob,
                thIssueDate: ocrResult.th_issue,
                enIssueDate: ocrResult.en_issue,
                thExpiryDate: ocrResult.th_expiry,
                enExpiryDate: ocrResult.en_expiry,
                registrar: ocrResult.registrar,
                faceDetected: ocrResult.face === 'Detected',
                processTime: ocrResult.inference,
            }
        };
    } catch (err) {
        if (err instanceof ApiError) throw err;
        const respData = err.response?.data;
        console.error('iApp Driver License OCR error:', respData || err.message);

        if (respData?.error_message) {
            throw new ApiError(422, `ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้: ${respData.error_message}`);
        }
        throw new ApiError(422, 'ไม่สามารถตรวจสอบใบขับขี่ได้ กรุณาลองใหม่อีกครั้ง');
    }
};

/**
 * OCR ทะเบียนรถ (legacy)
 */
const processVehicleRegistrationOcr = async (fileBuffer) => {
    const { url } = await uploadToCloudinary(fileBuffer, 'ocr/vehicle-registrations');

    try {
        const ocrResult = await ocrVehicleRegistration(url);

        if (!ocrResult || ocrResult.status !== 'success') {
            throw new ApiError(422, 'OCR failed to process vehicle registration image.');
        }

        return {
            cloudinaryUrl: url,
            ocrData: ocrResult.data || ocrResult,
        };
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(502, `iApp OCR API error: ${err.message}`);
    }
};

// Confidence threshold — ลดลงเพื่อรองรับกรณีหน้าเปลี่ยนจากตอนทำบัตร
const FACE_CONFIDENCE_THRESHOLD = 40;

/**
 * ตรวจสอบว่า error ควร retry ด้วยวิธีอื่น (face/id detection error หรือ server error)
 */
const isRetryableError = (err) => {
    const statusCode = err.response?.data?.status_code || err.response?.status;
    // 421/422 = face/id not found, 500 = server error (อาจเป็นเพราะรูปใหญ่เกิน)
    return [421, 422, 500].includes(statusCode);
};

/**
 * แปลง iApp result เป็น response format พร้อม custom threshold
 */
const parseFaceVerificationResult = (result) => {
    if (!result) return null;
    const confidence = result.total?.confidence || 0;
    const apiSays = result.total?.isSamePerson === 'true' || result.total?.isSamePerson === true;
    const isSamePerson = apiSays || confidence >= FACE_CONFIDENCE_THRESHOLD;
    return {
        isSamePerson,
        confidence,
        idcard: result.idcard || null,
        selfie: result.selfie || null,
        total: result.total || null,
        processTime: result.time_process || 0,
    };
};

/**
 * Helper: ลองเรียก API แล้ว parse ผลลัพธ์
 * @returns {object|null} parsed result หรือ null ถ้าควร retry
 */
const tryFaceVerification = async (apiFn, file0, file1, label) => {
    try {
        const result = await apiFn(
            file0.buffer, file0.fileName, file0.mimeType,
            file1.buffer, file1.fileName, file1.mimeType
        );
        const parsed = parseFaceVerificationResult(result);
        if (parsed) {
            console.log(`[Face+ID] ${label} ✅ confidence: ${parsed.confidence}%, isSamePerson: ${parsed.isSamePerson}`);
            return { success: true, data: parsed };
        }
    } catch (err) {
        if (err instanceof ApiError) throw err;
        const respData = err.response?.data;
        const httpStatus = err.response?.status;
        const iappStatus = respData?.status_code;
        console.warn(`[Face+ID] ${label} ❌ http=${httpStatus} iapp=${iappStatus}:`, JSON.stringify(respData || err.message));

        if (httpStatus === 420 || iappStatus === 420) {
            throw new ApiError(400, 'กรุณาอัปโหลดทั้งรูปบัตรประชาชนและรูปเซลฟี่');
        }
        // retryable → return null เพื่อลอง attempt ถัดไป
        if (isRetryableError(err)) return null;
        // non-retryable → throw ทันที
        throw new ApiError(422, `ไม่สามารถยืนยันตัวตนได้: ${respData?.status_message || err.message}`);
    }
    return null;
};

/**
 * ยืนยันตัวตนด้วยใบหน้าและบัตรประชาชน — ส่งรูป 2 รูปไปยัง iApp v3
 *
 * Strategy:
 *   1. Standard endpoint — file0=บัตร, file1=เซลฟี่ (resize 1600)
 *   2. Standard endpoint — SWAP: file0=เซลฟี่, file1=บัตร
 *   3. KYC-front endpoint — file0=บัตร, file1=เซลฟี่
 *   4. KYC-front endpoint — SWAP: file0=เซลฟี่, file1=บัตร
 *   ใช้ custom confidence threshold (>= 40%)
 */
const processFaceIdVerification = async (idCardBuffer, idCardFileName, idCardMimeType, selfieBuffer, selfieFileName, selfieMimeType) => {
    // Preprocess ทั้ง 2 รูป (resize + JPEG, ไม่ sharpen)
    const idCard = await preprocessForFaceVerification(idCardBuffer);
    const selfie = await preprocessForFaceVerification(selfieBuffer);
    console.log(`[Face+ID] Preprocessed — ID Card: ${(idCardBuffer.length / 1024).toFixed(0)}KB → ${(idCard.buffer.length / 1024).toFixed(0)}KB, Selfie: ${(selfieBuffer.length / 1024).toFixed(0)}KB → ${(selfie.buffer.length / 1024).toFixed(0)}KB`);

    let result;

    // ── 1. Standard endpoint: file0=เซลฟี่, file1=บัตร (ลำดับที่ iApp คาดหวัง) ──
    result = await tryFaceVerification(faceAndIdCardVerification, selfie, idCard, '1) Standard (selfie→card)');
    if (result) return result;

    // ── 2. Standard endpoint: file0=บัตร, file1=เซลฟี่ (fallback สลับลำดับ) ──
    result = await tryFaceVerification(faceAndIdCardVerification, idCard, selfie, '2) Standard (card→selfie)');
    if (result) return result;

    // ── 3. KYC-front endpoint: file0=เซลฟี่, file1=บัตร ──
    result = await tryFaceVerification(faceAndIdCardVerificationKycFront, selfie, idCard, '3) KYC-front (selfie→card)');
    if (result) return result;

    // ── 4. KYC-front endpoint: file0=บัตร, file1=เซลฟี่ ──
    result = await tryFaceVerification(faceAndIdCardVerificationKycFront, idCard, selfie, '4) KYC-front (card→selfie)');
    if (result) return result;

    // ทุก attempt ล้มเหลว
    throw new ApiError(422, 'ไม่พบใบหน้าหรือบัตรประชาชนในรูปภาพ กรุณาถ่ายรูปใหม่ โดยถือบัตรให้ชิดใบหน้า ในที่มีแสงสว่างเพียงพอ และอย่าให้มือบังรูปบนบัตร');
};

module.exports = {
    processIdCardFrontOcr,
    processIdCardBackOcr,
    processDriverLicenseOcr,
    processVehicleRegistrationOcr,
    processFaceIdVerification,
};
