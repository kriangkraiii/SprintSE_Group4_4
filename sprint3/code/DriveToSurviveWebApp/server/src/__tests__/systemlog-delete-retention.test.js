const ApiError = require('../utils/ApiError');

const mockFindUnique = jest.fn();
const mockDelete = jest.fn();

jest.mock('../utils/prisma', () => ({
    systemLog: {
        findUnique: mockFindUnique,
        delete: mockDelete,
    },
}));

const {
    MIN_RETENTION_DAYS,
    isOlderThanRetention,
    getRetentionCutoffDate,
    deleteLogById,
} = require('../services/systemLog.service');

describe('SystemLog delete retention policy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should expose retention period as 90 days', () => {
        expect(MIN_RETENTION_DAYS).toBe(90);
    });

    test('isOlderThanRetention should return true when older than or equal cutoff', () => {
        const now = new Date('2026-02-18T00:00:00.000Z');
        const exactly90DaysAgo = new Date('2025-11-20T00:00:00.000Z');
        const olderThan90Days = new Date('2025-11-19T23:59:59.000Z');

        expect(isOlderThanRetention(exactly90DaysAgo, now)).toBe(true);
        expect(isOlderThanRetention(olderThan90Days, now)).toBe(true);
    });

    test('isOlderThanRetention should return false when newer than cutoff', () => {
        const now = new Date('2026-02-18T00:00:00.000Z');
        const newerThan90Days = new Date('2025-11-21T00:00:00.000Z');

        expect(isOlderThanRetention(newerThan90Days, now)).toBe(false);
    });

    test('deleteLogById should throw 404 when log does not exist', async () => {
        mockFindUnique.mockResolvedValue(null);

        await expect(deleteLogById(1001)).rejects.toMatchObject({
            statusCode: 404,
            message: 'System log not found.',
        });

        expect(mockDelete).not.toHaveBeenCalled();
    });

    test('deleteLogById should throw 403 when log is newer than 90 days', async () => {
        const now = new Date('2026-02-18T00:00:00.000Z');
        mockFindUnique.mockResolvedValue({
            id: 55,
            createdAt: new Date('2026-01-15T00:00:00.000Z'),
        });

        await expect(deleteLogById(55, now)).rejects.toMatchObject({
            statusCode: 403,
        });

        expect(mockDelete).not.toHaveBeenCalled();
    });

    test('deleteLogById should delete when log is older than 90 days', async () => {
        const now = new Date('2026-02-18T00:00:00.000Z');
        mockFindUnique.mockResolvedValue({
            id: 77,
            createdAt: new Date('2025-10-01T00:00:00.000Z'),
        });
        mockDelete.mockResolvedValue({ id: 77 });

        const result = await deleteLogById(77, now);

        expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 77 } });
        expect(mockDelete).toHaveBeenCalledWith({ where: { id: 77 } });
        expect(result).toEqual({ id: 77 });
    });

    test('getRetentionCutoffDate should be exactly 90 days before now', () => {
        const now = new Date('2026-02-18T12:34:56.000Z');
        const cutoff = getRetentionCutoffDate(now);

        expect(cutoff.toISOString()).toBe('2025-11-20T12:34:56.000Z');
    });
});
