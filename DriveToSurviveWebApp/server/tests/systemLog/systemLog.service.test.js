/**
 * Unit Test — SystemLog Service
 * ทดสอบการค้นหา Log, Pagination, และ Immutability
 */

const { mockPrisma } = require('../helpers/setup');
const { searchLogs } = require('../../src/services/systemLog.service');

describe('SystemLog Service — ค้นหา Log (Read-Only)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('ต้องค้นหา log พร้อม pagination ได้', async () => {
        const mockLogs = [
            { id: 1, userId: 'u1', action: 'GET', resource: '/api/users' },
            { id: 2, userId: 'u2', action: 'POST', resource: '/api/bookings' },
        ];
        mockPrisma.$transaction.mockResolvedValue([2, mockLogs]);

        const result = await searchLogs({ page: 1, limit: 10 });

        expect(result.data).toEqual(mockLogs);
        expect(result.pagination.total).toBe(2);
    });

    test('ต้อง filter ตาม userId, IP, action, ช่วงเวลาได้', async () => {
        mockPrisma.$transaction.mockResolvedValue([0, []]);

        await searchLogs({
            userId: 'u1',
            ipAddress: '192.168.1',
            action: 'DELETE',
            createdFrom: '2025-01-01T00:00:00Z',
            createdTo: '2025-03-01T00:00:00Z',
        });

        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    test('[BUG] pagination.page ต้องเป็น number ไม่ใช่ string', async () => {
        mockPrisma.$transaction.mockResolvedValue([100, []]);

        const result = await searchLogs({ page: '2', limit: 10 });

        expect(typeof result.pagination.page).toBe('number');
    });

    test('[BUG] pagination.limit ต้องเป็น number ไม่ใช่ string', async () => {
        mockPrisma.$transaction.mockResolvedValue([100, []]);

        const result = await searchLogs({ page: 1, limit: '20' });

        expect(typeof result.pagination.limit).toBe('number');
    });

    test('[BUG] totalPages ต้องคำนวณถูกต้อง ไม่เป็น NaN', async () => {
        mockPrisma.$transaction.mockResolvedValue([100, []]);

        const result = await searchLogs({ page: 1, limit: 10 });

        expect(result.pagination.totalPages).toBe(10);
        expect(Number.isFinite(result.pagination.totalPages)).toBe(true);
    });
});

describe('SystemLog Immutability — ห้ามแก้ไข/ลบ (พ.ร.บ.คอมพิวเตอร์ ม.26)', () => {
    test('Service ต้อง export เฉพาะ searchLogs เท่านั้น (read-only)', () => {
        const service = require('../../src/services/systemLog.service');
        expect(Object.keys(service)).toEqual(['searchLogs']);
    });

    test('Controller ต้อง export เฉพาะ getLogs เท่านั้น (read-only)', () => {
        const controller = require('../../src/controllers/systemLog.controller');
        expect(Object.keys(controller)).toEqual(['getLogs']);
    });
});
