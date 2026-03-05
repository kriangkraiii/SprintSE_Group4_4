/**
 * Admin Create User — Unit Tests
 *
 * ทดสอบว่าการสร้างบัญชี ADMIN ไม่ต้องใช้ข้อมูลบัตรประชาชน
 * โดยครอบคลุม 3 ชั้น: Validation, Service, Controller
 */

const { createAdminUserSchema, createUserSchema } = require('../validations/user.validation');

// ---------------------------------------------------------------------------
// Mock prisma
// ---------------------------------------------------------------------------
const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
    },
    blacklist: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
    },
};
jest.mock('../utils/prisma', () => mockPrisma);

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: jest.fn(),
}));

// Mock cloudinary
jest.mock('../utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({ url: 'https://cdn.test/photo.jpg' }),
}));

const bcrypt = require('bcrypt');
const userService = require('../services/user.service');


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const validAdminData = {
    email: 'admin@example.com',
    password: 'Admin123pass',
    username: 'adminuser',
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '0999999999',
    gender: 'MALE',
    role: 'ADMIN',
};

const validAdminDataForService = {
    ...validAdminData,
    createdByAdmin: true,
};

const mockCreatedUser = {
    id: 'user-uuid-1',
    email: 'admin@example.com',
    username: 'adminuser',
    password: '$2b$10$hashedpassword',
    firstName: 'Admin',
    lastName: 'User',
    phoneNumber: '0999999999',
    gender: 'MALE',
    role: 'ADMIN',
    isActive: true,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
};


// ============================================================================
// 1) Validation Layer — createAdminUserSchema
// ============================================================================
describe('Validation: createAdminUserSchema', () => {
    it('should pass without nationalIdNumber', () => {
        const { error } = createAdminUserSchema.validate(validAdminData);
        expect(error).toBeUndefined();
    });

    it('should pass with empty string nationalIdNumber', () => {
        const { error } = createAdminUserSchema.validate({ ...validAdminData, nationalIdNumber: '' });
        expect(error).toBeUndefined();
    });

    it('should pass with null nationalIdNumber', () => {
        const { error } = createAdminUserSchema.validate({ ...validAdminData, nationalIdNumber: null });
        expect(error).toBeUndefined();
    });

    it('should pass when nationalIdNumber is provided', () => {
        const { error } = createAdminUserSchema.validate({ ...validAdminData, nationalIdNumber: '1234567890123' });
        expect(error).toBeUndefined();
    });

    it('should require email', () => {
        const { email, ...noEmail } = validAdminData;
        const { error } = createAdminUserSchema.validate(noEmail);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('email');
    });

    it('should require password', () => {
        const { password, ...noPass } = validAdminData;
        const { error } = createAdminUserSchema.validate(noPass);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('password');
    });

    it('should require firstName', () => {
        const { firstName, ...noName } = validAdminData;
        const { error } = createAdminUserSchema.validate(noName);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('firstName');
    });

    it('should require lastName', () => {
        const { lastName, ...noName } = validAdminData;
        const { error } = createAdminUserSchema.validate(noName);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('lastName');
    });

    it('should require phoneNumber', () => {
        const { phoneNumber, ...noPhone } = validAdminData;
        const { error } = createAdminUserSchema.validate(noPhone);
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('phoneNumber');
    });

    it('should enforce password complexity — at least 8 chars with A-Z, a-z, 0-9', () => {
        const { error: e1 } = createAdminUserSchema.validate({ ...validAdminData, password: 'short1A' });
        expect(e1).toBeDefined(); // too short

        const { error: e2 } = createAdminUserSchema.validate({ ...validAdminData, password: 'alllowercase1' });
        expect(e2).toBeDefined(); // no uppercase

        const { error: e3 } = createAdminUserSchema.validate({ ...validAdminData, password: 'ALLUPPERCASE1' });
        expect(e3).toBeDefined(); // no lowercase

        const { error: e4 } = createAdminUserSchema.validate({ ...validAdminData, password: 'NoNumbersHere' });
        expect(e4).toBeDefined(); // no digit
    });

    it('should only allow ADMIN role', () => {
        const { error } = createAdminUserSchema.validate({ ...validAdminData, role: 'PASSENGER' });
        expect(error).toBeDefined();
    });

    it('should default role to ADMIN', () => {
        const { role, ...noRole } = validAdminData;
        const { value } = createAdminUserSchema.validate(noRole);
        expect(value.role).toBe('ADMIN');
    });
});


// ============================================================================
// 2) Contrast — createUserSchema still requires nationalIdNumber
// ============================================================================
describe('Validation: createUserSchema (regular user)', () => {
    it('should fail without nationalIdNumber', () => {
        const { nationalIdNumber, ...noId } = validAdminData;
        const { error } = createUserSchema.validate({ ...noId, role: 'PASSENGER' });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('nationalIdNumber');
    });

    it('should pass with nationalIdNumber provided', () => {
        const { error } = createUserSchema.validate({
            ...validAdminData,
            role: 'PASSENGER',
            nationalIdNumber: '1234567890123',
        });
        expect(error).toBeUndefined();
    });
});


// ============================================================================
// 3) Service Layer — userService.createUser
// ============================================================================
describe('Service: createUser (admin flow)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // No existing user
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({ ...mockCreatedUser });
        // No blacklist hit
        mockPrisma.blacklist.findFirst.mockResolvedValue(null);
        mockPrisma.blacklist.findUnique.mockResolvedValue(null);
    });

    it('should create admin user without nationalId fields', async () => {
        const user = await userService.createUser(validAdminDataForService);

        expect(user).toBeDefined();
        expect(user.email).toBe('admin@example.com');
        expect(user.password).toBeUndefined(); // should strip password

        // Verify prisma.user.create was called without nationalId fields
        const createCall = mockPrisma.user.create.mock.calls[0][0].data;
        expect(createCall.nationalIdNumber).toBeUndefined();
        expect(createCall.nationalIdExpiryDate).toBeUndefined();
        expect(createCall.nationalIdPhotoUrl).toBeUndefined();
        expect(createCall.selfiePhotoUrl).toBeUndefined();
    });

    it('should set role to ADMIN when createdByAdmin=true', async () => {
        await userService.createUser(validAdminDataForService);

        const createCall = mockPrisma.user.create.mock.calls[0][0].data;
        expect(createCall.role).toBe('ADMIN');
    });

    it('should hash the password', async () => {
        await userService.createUser(validAdminDataForService);
        expect(bcrypt.hash).toHaveBeenCalledWith('Admin123pass', expect.any(Number));
    });

    it('should NOT set isVerified=true when no identity docs provided', async () => {
        await userService.createUser(validAdminDataForService);

        const createCall = mockPrisma.user.create.mock.calls[0][0].data;
        expect(createCall.isVerified).toBeUndefined();
    });

    it('should skip blacklist check when nationalIdNumber is empty', async () => {
        await userService.createUser(validAdminDataForService);

        // blacklistService should not be called if nationalIdNumber is falsy
        expect(mockPrisma.blacklist.findFirst).not.toHaveBeenCalled();
    });

    it('should reject if email already exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing', email: 'admin@example.com' });

        await expect(userService.createUser(validAdminDataForService))
            .rejects.toThrow('This email is already in use.');
    });

    it('should reject non-ADMIN role on admin create flow', async () => {
        await expect(userService.createUser({
            ...validAdminDataForService,
            role: 'PASSENGER',
        })).rejects.toThrow('Admin create endpoint can create ADMIN user only.');
    });

    it('should include nationalId fields when provided', async () => {
        const withId = {
            ...validAdminDataForService,
            nationalIdNumber: '1234567890123',
            nationalIdExpiryDate: '2030-12-31',
            nationalIdPhotoUrl: 'https://cdn.test/id.jpg',
            selfiePhotoUrl: 'https://cdn.test/selfie.jpg',
        };

        mockPrisma.user.create.mockResolvedValue({
            ...mockCreatedUser,
            nationalIdNumber: '1234567890123',
            isVerified: true,
        });

        await userService.createUser(withId);

        const createCall = mockPrisma.user.create.mock.calls[0][0].data;
        expect(createCall.nationalIdNumber).toBe('1234567890123');
        expect(createCall.nationalIdExpiryDate).toEqual(new Date('2030-12-31'));
        expect(createCall.nationalIdPhotoUrl).toBe('https://cdn.test/id.jpg');
        expect(createCall.selfiePhotoUrl).toBe('https://cdn.test/selfie.jpg');
        expect(createCall.isVerified).toBe(true);
    });

    it('should not crash with undefined nationalIdExpiryDate', async () => {
        // This was the original bug — new Date(undefined) => Invalid Date
        const data = { ...validAdminDataForService, nationalIdExpiryDate: undefined };
        await expect(userService.createUser(data)).resolves.toBeDefined();

        const createCall = mockPrisma.user.create.mock.calls[0][0].data;
        expect(createCall.nationalIdExpiryDate).toBeUndefined();
    });

    it('should not crash with null nationalIdExpiryDate', async () => {
        const data = { ...validAdminDataForService, nationalIdExpiryDate: null };
        await expect(userService.createUser(data)).resolves.toBeDefined();

        const createCall = mockPrisma.user.create.mock.calls[0][0].data;
        expect(createCall.nationalIdExpiryDate).toBeUndefined();
    });
});


// ============================================================================
// 4) Controller Layer — createAdminUser
// ============================================================================
describe('Controller: createAdminUser', () => {
    let createAdminUser;

    beforeAll(() => {
        // Re-require after mocks are set up
        const controller = require('../controllers/user.controller');
        createAdminUser = controller.createAdminUser;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({ ...mockCreatedUser });
        mockPrisma.blacklist.findFirst.mockResolvedValue(null);
    });

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it('should create admin user without files (no national ID photos)', async () => {
        const req = {
            body: { ...validAdminData },
            files: null,
        };
        const res = mockRes();
        const next = jest.fn();

        // createAdminUser is wrapped with asyncHandler, call the inner function
        await createAdminUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: 'Admin user created successfully.',
            })
        );
    });

    it('should set role=ADMIN and createdByAdmin=true on the body', async () => {
        const req = {
            body: { ...validAdminData },
            files: null,
        };
        const res = mockRes();
        const next = jest.fn();

        await createAdminUser(req, res, next);

        // After the controller runs, body should have been mutated
        expect(req.body.role).toBe('ADMIN');
        expect(req.body.createdByAdmin).toBe(true);
    });

    it('should still work when files are provided', async () => {
        const req = {
            body: { ...validAdminData },
            files: {
                nationalIdPhotoUrl: [{ buffer: Buffer.from('test') }],
                selfiePhotoUrl: [{ buffer: Buffer.from('test') }],
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await createAdminUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });
});
