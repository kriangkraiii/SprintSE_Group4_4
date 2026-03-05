/**
 * Dashboard Service — Unit Tests
 * ทดสอบ getDashboardStats aggregation
 */

const mockUserCount = jest.fn();
const mockRouteCount = jest.fn();
const mockBookingCount = jest.fn();
const mockReviewCount = jest.fn();
const mockReviewAggregate = jest.fn();
const mockVehicleCount = jest.fn();
const mockDriverVerificationCount = jest.fn();
const mockChatSessionCount = jest.fn();
const mockNotificationCount = jest.fn();
const mockQueryRaw = jest.fn();

jest.mock('../utils/prisma', () => ({
    user: { count: (...args) => mockUserCount(...args) },
    route: { count: (...args) => mockRouteCount(...args) },
    booking: { count: (...args) => mockBookingCount(...args) },
    review: { count: (...args) => mockReviewCount(...args), aggregate: (...args) => mockReviewAggregate(...args) },
    vehicle: { count: (...args) => mockVehicleCount(...args) },
    driverVerification: { count: (...args) => mockDriverVerificationCount(...args) },
    chatSession: { count: (...args) => mockChatSessionCount(...args) },
    notification: { count: (...args) => mockNotificationCount(...args) },
    $queryRaw: (...args) => mockQueryRaw(...args),
}));

const { getDashboardStats } = require('../services/dashboard.service');

beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockUserCount.mockResolvedValue(100);
    mockRouteCount.mockResolvedValue(50);
    mockBookingCount.mockResolvedValue(200);
    mockReviewCount.mockResolvedValue(80);
    mockVehicleCount.mockResolvedValue(30);
    mockDriverVerificationCount.mockResolvedValue(5);
    mockChatSessionCount.mockResolvedValue(40);
    mockNotificationCount.mockResolvedValue(500);
    mockQueryRaw.mockResolvedValue([]);
    mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4.5 } });
});

describe('getDashboardStats — สถิติ Dashboard', () => {
    test('TC: ดึงสถิติทั้งหมดสำเร็จ → return overview, bookings, drivers, charts, revenue, ratings', async () => {
        mockQueryRaw
            .mockResolvedValueOnce([{ date: new Date(), count: 5n }])  // recentBookings
            .mockResolvedValueOnce([{ date: new Date(), count: 3n }])  // recentUsers
            .mockResolvedValueOnce([{ totalRevenue: 15000 }]);          // revenue

        const stats = await getDashboardStats();

        expect(stats).toHaveProperty('overview');
        expect(stats).toHaveProperty('bookings');
        expect(stats).toHaveProperty('drivers');
        expect(stats).toHaveProperty('charts');
        expect(stats).toHaveProperty('revenue');
        expect(stats).toHaveProperty('ratings');
    });

    test('TC: overview มี totalUsers, totalRoutes, totalBookings', async () => {
        mockQueryRaw.mockResolvedValue([]);

        const stats = await getDashboardStats();

        expect(stats.overview.totalUsers).toBe(100);
        expect(stats.overview.totalRoutes).toBe(50);
        expect(stats.overview.totalBookings).toBe(200);
    });

    test('TC: bookings breakdown มีครบ 4 สถานะ', async () => {
        mockQueryRaw.mockResolvedValue([]);

        const stats = await getDashboardStats();

        expect(stats.bookings).toHaveProperty('pending');
        expect(stats.bookings).toHaveProperty('confirmed');
        expect(stats.bookings).toHaveProperty('cancelled');
        expect(stats.bookings).toHaveProperty('completed');
    });

    test('TC: drivers มี pendingVerifications + approved', async () => {
        mockQueryRaw.mockResolvedValue([]);

        const stats = await getDashboardStats();

        expect(stats.drivers).toHaveProperty('pendingVerifications');
        expect(stats.drivers).toHaveProperty('approved');
    });

    test('TC: ratings average คำนวณถูกต้อง', async () => {
        mockQueryRaw.mockResolvedValue([]);
        mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4.2 } });

        const stats = await getDashboardStats();

        expect(stats.ratings.average).toBe(4.2);
    });

    test('TC: ratings average เป็น 0 ถ้ายังไม่มีรีวิว', async () => {
        mockQueryRaw.mockResolvedValue([]);
        mockReviewAggregate.mockResolvedValue({ _avg: { rating: null } });

        const stats = await getDashboardStats();

        expect(stats.ratings.average).toBe(0);
    });

    test('TC: charts.recentBookings แปลง BigInt เป็น Number', async () => {
        mockQueryRaw
            .mockResolvedValueOnce([
                { date: new Date('2026-03-01'), count: 10n },
                { date: new Date('2026-03-02'), count: 5n },
            ])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ totalRevenue: 0 }]);

        const stats = await getDashboardStats();

        expect(stats.charts.recentBookings).toHaveLength(2);
        expect(typeof stats.charts.recentBookings[0].count).toBe('number');
        expect(stats.charts.recentBookings[0].count).toBe(10);
    });

    test('TC: revenue total เป็น 0 ถ้าไม่มี booking', async () => {
        mockQueryRaw
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ totalRevenue: null }]);

        const stats = await getDashboardStats();

        expect(stats.revenue.total).toBe(0);
    });
});
