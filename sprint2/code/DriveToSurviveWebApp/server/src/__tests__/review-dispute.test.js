const ApiError = require('../utils/ApiError');

// ─── Mock Prisma ─────────────────────────────────────
const mockReviewFindUnique = jest.fn();
const mockDisputeFindUnique = jest.fn();
const mockDisputeCreate = jest.fn();
const mockDisputeUpdate = jest.fn();
const mockDisputeCount = jest.fn();
const mockDisputeFindMany = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../utils/prisma', () => ({
    rideReview: {
        findUnique: (...args) => mockReviewFindUnique(...args),
    },
    reviewDispute: {
        findUnique: (...args) => mockDisputeFindUnique(...args),
        create: (...args) => mockDisputeCreate(...args),
        update: (...args) => mockDisputeUpdate(...args),
        count: (...args) => mockDisputeCount(...args),
        findMany: (...args) => mockDisputeFindMany(...args),
    },
    $transaction: (...args) => mockTransaction(...args),
}));

const { createDispute, resolveDispute, listDisputes } = require('../services/reviewDispute.service');

describe('ReviewDispute Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── createDispute ───────────────────────────────────

    describe('createDispute', () => {
        const reviewId = 'review-001';
        const driverId = 'driver-001';
        const data = { reason: 'INACCURATE', detail: 'ข้อมูลในรีวิวไม่ตรงกับความเป็นจริงเลย' };

        test('should create a dispute successfully', async () => {
            mockReviewFindUnique.mockResolvedValue({ id: reviewId, driverId });
            mockDisputeFindUnique.mockResolvedValue(null);
            const expected = { id: 'dispute-001', reviewId, driverId, ...data, status: 'PENDING' };
            mockDisputeCreate.mockResolvedValue(expected);

            const result = await createDispute(reviewId, driverId, data);

            expect(mockReviewFindUnique).toHaveBeenCalledWith({ where: { id: reviewId } });
            expect(mockDisputeFindUnique).toHaveBeenCalledWith({
                where: { reviewId_driverId: { reviewId, driverId } },
            });
            expect(mockDisputeCreate).toHaveBeenCalledWith({
                data: { reviewId, driverId, reason: data.reason, detail: data.detail },
            });
            expect(result).toEqual(expected);
        });

        test('should throw 404 if review not found', async () => {
            mockReviewFindUnique.mockResolvedValue(null);

            await expect(createDispute(reviewId, driverId, data))
                .rejects.toThrow(expect.objectContaining({ statusCode: 404, message: 'Review not found' }));
        });

        test('should throw 403 if driver is not the review owner', async () => {
            mockReviewFindUnique.mockResolvedValue({ id: reviewId, driverId: 'other-driver' });

            await expect(createDispute(reviewId, driverId, data))
                .rejects.toThrow(expect.objectContaining({ statusCode: 403 }));
        });

        test('should throw 409 if already disputed', async () => {
            mockReviewFindUnique.mockResolvedValue({ id: reviewId, driverId });
            mockDisputeFindUnique.mockResolvedValue({ id: 'existing-dispute' });

            await expect(createDispute(reviewId, driverId, data))
                .rejects.toThrow(expect.objectContaining({ statusCode: 409, message: 'Already disputed' }));
        });
    });

    // ─── resolveDispute ──────────────────────────────────

    describe('resolveDispute', () => {
        const disputeId = 'dispute-001';
        const baseMockDispute = {
            id: disputeId,
            status: 'PENDING',
            reviewId: 'review-001',
            review: { id: 'review-001', driverId: 'driver-001' },
        };

        test('should acknowledge a dispute successfully', async () => {
            mockDisputeFindUnique.mockResolvedValue(baseMockDispute);
            const updatedDispute = { ...baseMockDispute, status: 'ACKNOWLEDGED', resolvedAt: expect.any(Date) };
            mockDisputeUpdate.mockResolvedValue(updatedDispute);

            const result = await resolveDispute(disputeId, {
                status: 'ACKNOWLEDGED',
                adminNote: 'รับทราบแล้ว',
            });

            expect(mockDisputeUpdate).toHaveBeenCalledWith({
                where: { id: disputeId },
                data: {
                    status: 'ACKNOWLEDGED',
                    adminNote: 'รับทราบแล้ว',
                    resolvedAt: expect.any(Date),
                },
            });
            expect(result.status).toBe('ACKNOWLEDGED');
        });

        test('should reject a dispute with category', async () => {
            mockDisputeFindUnique.mockResolvedValue(baseMockDispute);
            const updatedDispute = { ...baseMockDispute, status: 'REJECTED', category: 'รีวิวถูกต้อง' };
            mockDisputeUpdate.mockResolvedValue(updatedDispute);

            const result = await resolveDispute(disputeId, {
                status: 'REJECTED',
                adminNote: 'รีวิวนี้ถูกต้องตามข้อเท็จจริง',
                category: 'รีวิวถูกต้อง',
            });

            expect(mockDisputeUpdate).toHaveBeenCalledWith({
                where: { id: disputeId },
                data: {
                    status: 'REJECTED',
                    adminNote: 'รีวิวนี้ถูกต้องตามข้อเท็จจริง',
                    resolvedAt: expect.any(Date),
                    category: 'รีวิวถูกต้อง',
                },
            });
            expect(result.status).toBe('REJECTED');
            expect(result.category).toBe('รีวิวถูกต้อง');
        });

        test('should reject without category when not provided', async () => {
            mockDisputeFindUnique.mockResolvedValue(baseMockDispute);
            mockDisputeUpdate.mockResolvedValue({ ...baseMockDispute, status: 'REJECTED' });

            await resolveDispute(disputeId, { status: 'REJECTED' });

            const updateCall = mockDisputeUpdate.mock.calls[0][0];
            expect(updateCall.data).not.toHaveProperty('category');
        });

        test('should throw 404 if dispute not found', async () => {
            mockDisputeFindUnique.mockResolvedValue(null);

            await expect(resolveDispute('nonexistent', { status: 'ACKNOWLEDGED' }))
                .rejects.toThrow(expect.objectContaining({ statusCode: 404, message: 'Dispute not found' }));
        });

        test('should throw 400 if dispute already resolved', async () => {
            mockDisputeFindUnique.mockResolvedValue({ ...baseMockDispute, status: 'ACKNOWLEDGED' });

            await expect(resolveDispute(disputeId, { status: 'REJECTED' }))
                .rejects.toThrow(expect.objectContaining({ statusCode: 400, message: 'Dispute already resolved' }));
        });
    });

    // ─── listDisputes ────────────────────────────────────

    describe('listDisputes', () => {
        test('should list disputes with pagination', async () => {
            const mockData = [
                { id: 'd1', status: 'PENDING', reason: 'FAKE_REVIEW', review: {}, driver: {} },
                { id: 'd2', status: 'ACKNOWLEDGED', reason: 'INACCURATE', review: {}, driver: {} },
            ];
            mockTransaction.mockResolvedValue([2, mockData]);

            const result = await listDisputes({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(2);
            expect(result.pagination).toEqual({
                page: 1, limit: 20, total: 2, totalPages: 1,
            });
        });

        test('should filter by status', async () => {
            mockTransaction.mockResolvedValue([1, [{ id: 'd1', status: 'PENDING' }]]);

            await listDisputes({ status: 'PENDING', page: 1, limit: 10 });

            // Verify the transaction was called with count and findMany
            const transactionArgs = mockTransaction.mock.calls[0][0];
            expect(transactionArgs).toHaveLength(2);
        });

        test('should return empty array when no disputes', async () => {
            mockTransaction.mockResolvedValue([0, []]);

            const result = await listDisputes({});

            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });
    });
});
