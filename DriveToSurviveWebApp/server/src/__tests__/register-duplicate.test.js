/**
 * Tests: Duplicate Username / Email / National ID at Registration
 *
 * ทดสอบว่า createUser service ตรวจจับข้อมูลซ้ำก่อนสร้างบัญชีได้ถูกต้อง
 */

// ─── Mocks ───
const mockFindUniqueUser = jest.fn();
const mockCreateUser = jest.fn();
jest.mock('../utils/prisma', () => ({
    user: {
        findUnique: mockFindUniqueUser,
        create: mockCreateUser,
    },
}));

const mockCheckBlacklist = jest.fn();
jest.mock('../services/blacklist.service', () => ({
    checkBlacklist: mockCheckBlacklist,
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: jest.fn(),
}));

// Import service after mocks
const userService = require('../services/user.service');
const ApiError = require('../utils/ApiError');

// ─── Test Data ───
const validUserData = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '0891234567',
    nationalIdNumber: '1234567890123',
    nationalIdExpiryDate: '2030-01-01',
    nationalIdPhotoUrl: 'https://example.com/photo.jpg',
    selfiePhotoUrl: 'https://example.com/selfie.jpg',
};

// ─── Tests ───
describe('createUser - Duplicate Check', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCheckBlacklist.mockResolvedValue(null); // ไม่ blacklist
    });

    // ─── 1. Username ซ้ำ → 409 ───
    test('should throw 409 when username is already taken', async () => {
        // email ไม่ซ้ำ แต่ username ซ้ำ
        mockFindUniqueUser
            .mockResolvedValueOnce(null) // getUserByEmail → ไม่ซ้ำ
            .mockResolvedValueOnce({ id: 'existing_user' }); // getUserByUsername → ซ้ำ!

        await expect(userService.createUser(validUserData)).rejects.toMatchObject({
            statusCode: 409,
            message: expect.stringContaining('username'),
        });

        // ต้องไม่สร้าง user
        expect(mockCreateUser).not.toHaveBeenCalled();
    });

    // ─── 2. Email ซ้ำ → 409 ───
    test('should throw 409 when email is already in use', async () => {
        mockFindUniqueUser
            .mockResolvedValueOnce({ id: 'existing_user' }); // getUserByEmail → ซ้ำ!

        await expect(userService.createUser(validUserData)).rejects.toMatchObject({
            statusCode: 409,
            message: expect.stringContaining('email'),
        });

        // ต้องไม่สร้าง user
        expect(mockCreateUser).not.toHaveBeenCalled();
    });

    // ─── 3. ข้อมูลไม่ซ้ำ → สร้างสำเร็จ ───
    test('should create user when no duplicates found', async () => {
        mockFindUniqueUser
            .mockResolvedValueOnce(null) // getUserByEmail → ไม่ซ้ำ
            .mockResolvedValueOnce(null); // getUserByUsername → ไม่ซ้ำ

        const createdUser = {
            id: 'new_user',
            email: validUserData.email,
            username: validUserData.username,
            password: '$2b$10$hashedpassword',
            firstName: validUserData.firstName,
            lastName: validUserData.lastName,
        };
        mockCreateUser.mockResolvedValue(createdUser);

        const result = await userService.createUser(validUserData);

        // ต้องสร้าง user สำเร็จ
        expect(mockCreateUser).toHaveBeenCalledTimes(1);
        // ต้องไม่คืน password
        expect(result).not.toHaveProperty('password');
        expect(result.id).toBe('new_user');
    });

    // ─── 4. National ID อยู่ใน Blacklist → 403 ───
    test('should throw 403 when national ID is blacklisted', async () => {
        mockFindUniqueUser
            .mockResolvedValueOnce(null) // email ไม่ซ้ำ
            .mockResolvedValueOnce(null); // username ไม่ซ้ำ
        mockCheckBlacklist.mockResolvedValue({ id: 1, reason: 'banned' }); // Blacklisted!

        await expect(userService.createUser(validUserData)).rejects.toMatchObject({
            statusCode: 403,
        });

        expect(mockCreateUser).not.toHaveBeenCalled();
    });

    // ─── 5. เช็ค Username ก่อน Email — ถ้า email ซ้ำ ไม่ต้องเช็ค username ───
    test('should not check username if email already fails', async () => {
        mockFindUniqueUser
            .mockResolvedValueOnce({ id: 'existing_email_user' }); // getUserByEmail → ซ้ำ!

        await expect(userService.createUser(validUserData)).rejects.toMatchObject({
            statusCode: 409,
        });

        // findUnique ถูกเรียกแค่ครั้งเดียว (email check) ไม่ถึง username check
        expect(mockFindUniqueUser).toHaveBeenCalledTimes(1);
    });
});
