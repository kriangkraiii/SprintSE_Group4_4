const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock('../utils/prisma', () => ({
    user: {
        findUnique: mockFindUnique,
        create: mockCreate,
    },
}));

const mockHash = jest.fn();
jest.mock('bcrypt', () => ({
    hash: mockHash,
}));

const mockCheckBlacklist = jest.fn();
jest.mock('../services/blacklist.service', () => ({
    checkBlacklist: mockCheckBlacklist,
}));

const userService = require('../services/user.service');

const makeBasePayload = (overrides = {}) => ({
    email: 'test@example.com',
    username: 'testuser',
    password: 'StrongP4ssword',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '0812345678',
    gender: 'MALE',
    nationalIdNumber: '1234567890123',
    nationalIdExpiryDate: '2028-01-01T00:00:00.000Z',
    nationalIdPhotoUrl: 'https://img/id.jpg',
    selfiePhotoUrl: 'https://img/selfie.jpg',
    ...overrides,
});

describe('User role creation policy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFindUnique.mockResolvedValue(null);
        mockHash.mockResolvedValue('hashed-password');
        mockCheckBlacklist.mockResolvedValue(null);
        mockCreate.mockImplementation(async ({ data }) => ({
            id: 'u_1',
            ...data,
        }));
    });

    test('public create should reject non-passenger role', async () => {
        const payload = makeBasePayload({ role: 'DRIVER' });

        await expect(userService.createUser(payload)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Only PASSENGER registration is allowed on this endpoint.',
        });

        expect(mockCreate).not.toHaveBeenCalled();
    });

    test('public create should force PASSENGER role', async () => {
        const payload = makeBasePayload({ role: 'PASSENGER' });

        await userService.createUser(payload);

        expect(mockCreate).toHaveBeenCalledTimes(1);
        const createArg = mockCreate.mock.calls[0][0];
        expect(createArg.data.role).toBe('PASSENGER');
    });

    test('admin create flow should allow ADMIN role only', async () => {
        const payload = makeBasePayload({ role: 'ADMIN', createdByAdmin: true });

        await userService.createUser(payload);

        expect(mockCreate).toHaveBeenCalledTimes(1);
        const createArg = mockCreate.mock.calls[0][0];
        expect(createArg.data.role).toBe('ADMIN');
    });

    test('admin create flow should reject non-admin role', async () => {
        const payload = makeBasePayload({ role: 'DRIVER', createdByAdmin: true });

        await expect(userService.createUser(payload)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Admin create endpoint can create ADMIN user only.',
        });

        expect(mockCreate).not.toHaveBeenCalled();
    });

    test('blacklisted national id should still be denied', async () => {
        const payload = makeBasePayload({ role: 'PASSENGER' });
        mockCheckBlacklist.mockResolvedValue({ id: 99 });

        await expect(userService.createUser(payload)).rejects.toMatchObject({
            statusCode: 403,
            message: 'This National ID has been blacklisted. Registration denied.',
        });
    });
});
