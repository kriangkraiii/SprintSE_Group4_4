const ApiError = require('../utils/ApiError');

// Mock prisma
const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockUpdateMany = jest.fn();
const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockUpdate = jest.fn();
const mockTransaction = jest.fn();
const mockStatsFindUnique = jest.fn();
const mockStatsCreate = jest.fn();
const mockStatsUpdate = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock('../utils/prisma', () => ({
    booking: {
        findUnique: jest.fn(),
    },
    rideReview: {
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        create: mockCreate,
        findMany: mockFindMany,
        count: mockCount,
        updateMany: mockUpdateMany,
    },
    driverStats: {
        findUnique: mockStatsFindUnique,
        create: mockStatsCreate,
        update: mockStatsUpdate,
    },
    user: {
        findUnique: mockUserFindUnique,
    },
    $transaction: mockTransaction,
}));

// Mock profanityFilter
jest.mock('../utils/profanityFilter', () => ({
    containsProfanity: jest.fn((text) => {
        if (text && text.includes('fuck')) {
            return { hasProfanity: true, words: ['fuck'] };
        }
        return { hasProfanity: false, words: [] };
    }),
}));

const { anonymizeReviews, REVIEW_WINDOW_DAYS } = require('../services/review.service');

describe('Review Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Review Immutability', () => {
        test('review window should be 7 days', () => {
            expect(REVIEW_WINDOW_DAYS).toBe(7);
        });
    });

    describe('anonymizeReviews', () => {
        test('should anonymize all reviews for a passenger', async () => {
            mockUpdateMany.mockResolvedValue({ count: 3 });

            const result = await anonymizeReviews('passenger-001');

            expect(mockUpdateMany).toHaveBeenCalledWith({
                where: { passengerId: 'passenger-001' },
                data: {
                    displayName: 'Anonymous Passenger',
                    status: 'ANONYMIZED',
                },
            });
            expect(result).toEqual({ anonymized: 3 });
        });

        test('should return 0 if no reviews exist', async () => {
            mockUpdateMany.mockResolvedValue({ count: 0 });

            const result = await anonymizeReviews('no-reviews-user');
            expect(result).toEqual({ anonymized: 0 });
        });
    });
});
