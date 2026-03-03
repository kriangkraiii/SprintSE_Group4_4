/**
 * Tests: Username Availability Check API
 *
 * ทดสอบ endpoint GET /api/users/check-username/:username
 * ตรวจสอบว่า username ว่างหรือถูกใช้งานแล้ว
 */

// ─── Mocks ───
const mockFindUnique = jest.fn();
jest.mock('../utils/prisma', () => ({
    user: {
        findUnique: mockFindUnique,
    },
}));

// Import controller after mocks
const { checkUsername } = require('../controllers/user.controller');
const ApiError = require('../utils/ApiError');

// ─── Helpers ───
const createMockReq = (username) => ({
    params: { username },
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
describe('GET /api/users/check-username/:username', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── 1. Username ว่าง → available: true ───
    test('should return available: true when username is NOT taken', async () => {
        mockFindUnique.mockResolvedValue(null); // ไม่มีคนใช้

        const req = createMockReq('newuser123');
        const res = createMockRes();
        const next = await callController(checkUsername, req, res);

        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { username: 'newuser123' },
            select: { id: true },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { available: true },
        });
        expect(next).not.toHaveBeenCalled();
    });

    // ─── 2. Username ถูกใช้แล้ว → available: false ───
    test('should return available: false when username IS taken', async () => {
        mockFindUnique.mockResolvedValue({ id: 'user_123' }); // มีคนใช้แล้ว

        const req = createMockReq('existuser');
        const res = createMockRes();
        const next = await callController(checkUsername, req, res);

        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { username: 'existuser' },
            select: { id: true },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { available: false },
        });
        expect(next).not.toHaveBeenCalled();
    });

    // ─── 3. Username สั้นเกินไป (< 4 ตัว) → 400 ───
    test('should throw 400 when username is too short', async () => {
        const req = createMockReq('abc');
        const res = createMockRes();
        const next = await callController(checkUsername, req, res);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    // ─── 4. Username มีอักขระพิเศษ → 400 ───
    test('should throw 400 when username contains special characters', async () => {
        const req = createMockReq('user@name!');
        const res = createMockRes();
        const next = await callController(checkUsername, req, res);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    // ─── 5. Username ยาวเกินไป (> 20 ตัว) → 400 ───
    test('should throw 400 when username exceeds 20 characters', async () => {
        const req = createMockReq('a'.repeat(21));
        const res = createMockRes();
        const next = await callController(checkUsername, req, res);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    // ─── 6. Username ที่มี underscore ใช้ได้ ───
    test('should accept username with underscores', async () => {
        mockFindUnique.mockResolvedValue(null);

        const req = createMockReq('user_name');
        const res = createMockRes();
        const next = await callController(checkUsername, req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { available: true },
        });
    });

    // ─── 7. Database error → propagate ───
    test('should propagate error when database query fails', async () => {
        mockFindUnique.mockRejectedValue(new Error('Database connection failed'));

        const req = createMockReq('validuser');
        const res = createMockRes();
        const next = await callController(checkUsername, req, res);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error.message).toBe('Database connection failed');
    });
});
