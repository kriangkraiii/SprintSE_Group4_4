/**
 * Shared Setup — ใช้ร่วมกันทุกไฟล์เทส
 */

const mockPrisma = {
    systemLog: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
};

jest.mock('../../src/utils/prisma', () => mockPrisma);

const createMockReq = (overrides = {}) => ({
    method: 'GET',
    originalUrl: '/api/users/me',
    headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        authorization: 'Bearer test-token',
    },
    user: { sub: 'user-123', role: 'USER' },
    ip: '203.0.113.50',
    connection: { remoteAddress: '203.0.113.50' },
    query: {},
    ...overrides,
});

const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const createMockNext = () => jest.fn();

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

module.exports = { mockPrisma, createMockReq, createMockRes, createMockNext, wait };
