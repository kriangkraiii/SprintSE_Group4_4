/**
 * Tests: Duplicate National ID Check during OCR ID Card Front Scan
 *
 * ทดสอบว่าเมื่อ OCR อ่านเลขบัตร ปชช. จากหน้าบัตร แล้วเลขนั้นมีคนสมัครไปแล้ว
 * ระบบจะปฏิเสธทันที (HTTP 409) ก่อนที่ผู้ใช้จะสมัครได้
 */

// ─── Mocks ───
const mockProcessIdCardFrontOcr = jest.fn();
jest.mock('../services/iapp.service', () => ({
    processIdCardFrontOcr: mockProcessIdCardFrontOcr,
}));

const mockCheckBlacklist = jest.fn();
jest.mock('../services/blacklist.service', () => ({
    checkBlacklist: mockCheckBlacklist,
}));

// Mock Prisma
const mockFindUnique = jest.fn();
jest.mock('../utils/prisma', () => ({
    user: {
        findUnique: mockFindUnique,
    },
}));

// Import controller after mocks
const { ocrIdCardFront } = require('../controllers/iapp.controller');
const ApiError = require('../utils/ApiError');

// ─── Helpers ───
const createMockReq = (file = { buffer: Buffer.from('fake'), originalname: 'id.jpg', mimetype: 'image/jpeg' }) => ({
    file,
});

const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

async function callController(handler, req, res) {
    const next = jest.fn();
    try {
        await handler(req, res, next);
    } catch (err) {
        next(err);
    }
    return next;
}

// ─── Tests ───
describe('OCR ID Card Front - Duplicate National ID Check', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── 1. บัตรไม่ซ้ำ ไม่ Blacklist → ผ่านปกติ ───
    test('should return OCR data when national ID is NOT duplicated and NOT blacklisted', async () => {
        const ocrData = {
            idNumber: '1234567890123',
            thName: 'นาย ทดสอบ ตัวอย่าง',
            detectionScore: 0.95,
        };

        mockProcessIdCardFrontOcr.mockResolvedValue({ data: ocrData });
        mockCheckBlacklist.mockResolvedValue(null);
        mockFindUnique.mockResolvedValue(null); // ไม่มีคนสมัครซ้ำ

        const req = createMockReq();
        const res = createMockRes();
        const next = await callController(ocrIdCardFront, req, res);

        expect(mockProcessIdCardFrontOcr).toHaveBeenCalled();
        expect(mockCheckBlacklist).toHaveBeenCalledWith('1234567890123');
        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { nationalIdNumber: '1234567890123' },
            select: { id: true },
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'ID Card Front OCR completed',
            data: ocrData,
        });
        expect(next).not.toHaveBeenCalled();
    });

    // ─── 2. บัตรซ้ำ — มีคนสมัครไปแล้ว → HTTP 409 ───
    test('should throw 409 ApiError when national ID is already registered', async () => {
        const ocrData = {
            idNumber: '1111111111111',
            thName: 'นาย ซ้ำ ตัวอย่าง',
            detectionScore: 0.90,
        };

        mockProcessIdCardFrontOcr.mockResolvedValue({ data: ocrData });
        mockCheckBlacklist.mockResolvedValue(null); // ไม่ Blacklist
        mockFindUnique.mockResolvedValue({ id: 42 }); // มีคนสมัครแล้ว!

        const req = createMockReq();
        const res = createMockRes();
        const next = await callController(ocrIdCardFront, req, res);

        expect(mockCheckBlacklist).toHaveBeenCalledWith('1111111111111');
        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { nationalIdNumber: '1111111111111' },
            select: { id: true },
        });

        // ต้อง throw ApiError 409
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain('สมัครสมาชิกไปแล้ว');

        // ต้องไม่ส่ง response
        expect(res.status).not.toHaveBeenCalled();
    });

    // ─── 3. Blacklist ตรวจก่อน Duplicate → ถ้า Blacklisted ไม่ต้องเช็ค Duplicate ───
    test('should check blacklist BEFORE duplicate check (blacklisted → 403, no duplicate check)', async () => {
        const ocrData = {
            idNumber: '2222222222222',
            detectionScore: 0.90,
        };

        mockProcessIdCardFrontOcr.mockResolvedValue({ data: ocrData });
        mockCheckBlacklist.mockResolvedValue({ id: 1, reason: 'banned' }); // Blacklisted!

        const req = createMockReq();
        const res = createMockRes();
        const next = await callController(ocrIdCardFront, req, res);

        // ต้อง throw 403 (Blacklist)
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(403);

        // ต้องไม่เรียก findUnique เลย เพราะ Blacklist มาก่อน
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    // ─── 4. เลข ปชช. มี space → ต้อง trim แล้วเช็ค Duplicate ───
    test('should strip spaces from ID number before duplicate check', async () => {
        const ocrData = {
            idNumber: '1 2345 67890 12 3',
            thName: 'นาย ช่องว่าง',
            detectionScore: 0.88,
        };

        mockProcessIdCardFrontOcr.mockResolvedValue({ data: ocrData });
        mockCheckBlacklist.mockResolvedValue(null);
        mockFindUnique.mockResolvedValue(null);

        const req = createMockReq();
        const res = createMockRes();
        await callController(ocrIdCardFront, req, res);

        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { nationalIdNumber: '1234567890123' },
            select: { id: true },
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ─── 5. เลข ปชช. ไม่ครบ 13 หลัก → ข้าม Duplicate check ───
    test('should skip duplicate check when ID number is not 13 digits', async () => {
        const ocrData = {
            idNumber: '12345',
            detectionScore: 0.60,
        };

        mockProcessIdCardFrontOcr.mockResolvedValue({ data: ocrData });

        const req = createMockReq();
        const res = createMockRes();
        await callController(ocrIdCardFront, req, res);

        expect(mockCheckBlacklist).not.toHaveBeenCalled();
        expect(mockFindUnique).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ─── 6. Database error ระหว่าง duplicate check → propagate error ───
    test('should propagate error when duplicate check database query fails', async () => {
        const ocrData = {
            idNumber: '9999999999999',
            detectionScore: 0.90,
        };

        mockProcessIdCardFrontOcr.mockResolvedValue({ data: ocrData });
        mockCheckBlacklist.mockResolvedValue(null);
        mockFindUnique.mockRejectedValue(new Error('Database connection failed'));

        const req = createMockReq();
        const res = createMockRes();
        const next = await callController(ocrIdCardFront, req, res);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error.message).toBe('Database connection failed');
    });

    // ─── 7. ไม่มี idNumber → ข้ามทั้ง Blacklist และ Duplicate check ───
    test('should skip both blacklist and duplicate check when no ID number', async () => {
        const ocrData = {
            thName: 'นาย ไม่มีเลข',
            detectionScore: 0.50,
        };

        mockProcessIdCardFrontOcr.mockResolvedValue({ data: ocrData });

        const req = createMockReq();
        const res = createMockRes();
        await callController(ocrIdCardFront, req, res);

        expect(mockCheckBlacklist).not.toHaveBeenCalled();
        expect(mockFindUnique).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
