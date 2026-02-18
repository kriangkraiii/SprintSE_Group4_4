/**
 * Tests: Blacklist Check during Login
 *
 * ทดสอบว่าเมื่อผู้ใช้ที่ถูก Blacklist พยายาม login
 * ระบบจะปฏิเสธทันที (HTTP 403) ไม่ให้เข้าใช้งาน
 */

// ─── Mocks ───
const mockGetUserByEmail = jest.fn();
const mockGetUserByUsername = jest.fn();
const mockComparePassword = jest.fn();

jest.mock('../services/user.service', () => ({
    getUserByEmail: mockGetUserByEmail,
    getUserByUsername: mockGetUserByUsername,
    comparePassword: mockComparePassword,
}));

const mockCheckBlacklist = jest.fn();
jest.mock('../services/blacklist.service', () => ({
    checkBlacklist: mockCheckBlacklist,
}));

const mockSignToken = jest.fn().mockReturnValue('fake-jwt-token');
jest.mock('../utils/jwt', () => ({
    signToken: mockSignToken,
}));

// Import controller after mocks
const { login } = require('../controllers/auth.controller');
const ApiError = require('../utils/ApiError');

// ─── Helpers ───
const createMockReq = (body = {}) => ({ body });

const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ─── Fake Users ───
const fakeUserWithNationalId = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed-pw',
    firstName: 'Test',
    lastName: 'User',
    role: 'PASSENGER',
    isActive: true,
    nationalIdNumber: '1234567890123',
    profilePicture: null,
};

const fakeUserWithoutNationalId = {
    id: 'user-2',
    username: 'newuser',
    email: 'new@example.com',
    password: 'hashed-pw',
    firstName: 'New',
    lastName: 'User',
    role: 'PASSENGER',
    isActive: true,
    nationalIdNumber: null,
    profilePicture: null,
};

const fakeDeactivatedUser = {
    id: 'user-3',
    username: 'deactivated',
    email: 'deactivated@example.com',
    password: 'hashed-pw',
    firstName: 'Deactivated',
    lastName: 'User',
    role: 'PASSENGER',
    isActive: false,
    nationalIdNumber: '9999999999999',
    profilePicture: null,
};

// ─── Tests ───
describe('Login Blacklist Check', () => {
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNext = jest.fn();
    });

    // ─── 1. ล็อกอินปกติ (ไม่ถูก Blacklist) → สำเร็จ ───
    test('should allow login when user is NOT blacklisted', async () => {
        mockGetUserByEmail.mockResolvedValue(fakeUserWithNationalId);
        mockComparePassword.mockResolvedValue(true);
        mockCheckBlacklist.mockResolvedValue(null); // ไม่อยู่ใน blacklist

        const req = createMockReq({ email: 'test@example.com', password: 'password123' });
        const res = createMockRes();

        await login(req, res, mockNext);

        expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
        expect(mockComparePassword).toHaveBeenCalledWith(fakeUserWithNationalId, 'password123');
        expect(mockCheckBlacklist).toHaveBeenCalledWith('1234567890123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: 'Login successful',
            })
        );
    });

    // ─── 2. ผู้ใช้ถูก Blacklist → 403 ───
    test('should throw 403 when user is blacklisted', async () => {
        mockGetUserByEmail.mockResolvedValue(fakeUserWithNationalId);
        mockComparePassword.mockResolvedValue(true);
        mockCheckBlacklist.mockResolvedValue({ id: 1, reason: 'banned for fraud' }); // Blacklisted!

        const req = createMockReq({ email: 'test@example.com', password: 'password123' });
        const res = createMockRes();

        await login(req, res, mockNext);

        // asyncHandler catches errors and passes to next()
        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(403);
        expect(error.message).toMatch(/Blacklisted/);

        // ต้องไม่สร้าง token
        expect(mockSignToken).not.toHaveBeenCalled();
    });

    // ─── 3. ผู้ใช้ไม่มี nationalIdNumber → ข้ามการตรวจ Blacklist, login สำเร็จ ───
    test('should skip blacklist check and allow login when user has no nationalIdNumber', async () => {
        mockGetUserByEmail.mockResolvedValue(fakeUserWithoutNationalId);
        mockComparePassword.mockResolvedValue(true);

        const req = createMockReq({ email: 'new@example.com', password: 'password123' });
        const res = createMockRes();

        await login(req, res, mockNext);

        // ต้องไม่เรียก checkBlacklist เลย เพราะไม่มี nationalIdNumber
        expect(mockCheckBlacklist).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: 'Login successful',
            })
        );
    });

    // ─── 4. บัญชีถูก deactivate → 401 (ก่อนเช็ค blacklist) ───
    test('should throw 401 for deactivated account (before blacklist check)', async () => {
        mockGetUserByEmail.mockResolvedValue(fakeDeactivatedUser);

        const req = createMockReq({ email: 'deactivated@example.com', password: 'password123' });
        const res = createMockRes();

        await login(req, res, mockNext);

        // asyncHandler catches errors and passes to next()
        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toMatch(/deactivated/i);

        // ต้องไม่เรียก checkBlacklist เพราะถูก deactivate ก่อน
        expect(mockCheckBlacklist).not.toHaveBeenCalled();
        expect(mockComparePassword).not.toHaveBeenCalled();
    });

    // ─── 5. Login ด้วย username (ไม่ใช่ email) + ถูก Blacklist → 403 ───
    test('should throw 403 when blacklisted user logs in with username', async () => {
        mockGetUserByUsername.mockResolvedValue(fakeUserWithNationalId);
        mockComparePassword.mockResolvedValue(true);
        mockCheckBlacklist.mockResolvedValue({ id: 1, reason: 'fraud' });

        const req = createMockReq({ username: 'testuser', password: 'password123' });
        const res = createMockRes();

        await login(req, res, mockNext);

        // asyncHandler catches errors and passes to next()
        expect(mockNext).toHaveBeenCalledTimes(1);
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(403);

        expect(mockGetUserByUsername).toHaveBeenCalledWith('testuser');
        expect(mockCheckBlacklist).toHaveBeenCalledWith('1234567890123');
    });
});
