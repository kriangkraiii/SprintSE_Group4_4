/**
 * Booking Status Update — Unit Tests
 *
 * ทดสอบ updateBookingStatus (ยืนยัน/ปฏิเสธ/รับ/ส่งผู้โดยสาร)
 * โดยเฉพาะการแก้ bug: startLocation/endLocation เป็น Json field ไม่ใช่ relation
 * ต้องไม่ใช้ include สำหรับ Json fields
 */

const ApiError = require('../utils/ApiError');

// ─── Mock Prisma ──────────────────────────────────────────
const mockBookingFindUnique = jest.fn();
const mockBookingUpdate = jest.fn();
const mockRouteUpdate = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../utils/prisma', () => ({
    booking: {
        findUnique: (...args) => mockBookingFindUnique(...args),
        update: (...args) => mockBookingUpdate(...args),
    },
    route: {
        findUnique: jest.fn(),
        update: (...args) => mockRouteUpdate(...args),
    },
    notification: {
        create: (...args) => mockNotificationCreate(...args),
    },
    chatSession: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'chat-1' }),
    },
    chatMessage: { create: jest.fn() },
    chatSessionParticipant: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    $transaction: (fn) => mockTransaction(fn),
}));

// ─── Mock Email Service ──────────────────────────────────
const mockSendBookingConfirmedEmail = jest.fn().mockResolvedValue({});
const mockSendBookingRejectedEmail = jest.fn().mockResolvedValue({});
const mockSendPassengerPickedUpEmail = jest.fn().mockResolvedValue({});
const mockSendReviewReminderEmail = jest.fn().mockResolvedValue({});

jest.mock('../services/email.service', () => ({
    sendBookingConfirmedEmail: (...args) => mockSendBookingConfirmedEmail(...args),
    sendBookingRejectedEmail: (...args) => mockSendBookingRejectedEmail(...args),
    sendPassengerPickedUpEmail: (...args) => mockSendPassengerPickedUpEmail(...args),
    sendReviewReminderEmail: (...args) => mockSendReviewReminderEmail(...args),
    sendBookingEmail: jest.fn().mockResolvedValue({}),
}));

// ─── Mock Socket Emitter ─────────────────────────────────
jest.mock('../socket/emitter', () => ({
    emitNotification: jest.fn(),
    emitToRoute: jest.fn(),
}));

// ─── Mock Penalty + Chat ─────────────────────────────────
jest.mock('../services/penalty.service', () => ({
    checkAndApplyPassengerSuspension: jest.fn().mockResolvedValue(null),
}));

jest.mock('../utils/contentFilter', () => ({
    filterContent: (text) => ({ filtered: text, original: text, isFiltered: false }),
}));

// ─── Load Service ────────────────────────────────────────
const { updateBookingStatus } = require('../services/booking.service');

// ─── Fixtures ────────────────────────────────────────────
const DRIVER_ID = 'driver-001';
const PASSENGER_ID = 'passenger-001';
const ROUTE_ID = 'route-001';
const BOOKING_ID = 'booking-001';

/**
 * startLocation / endLocation are JSON fields (not relations).
 * They are included as scalar data in the route query result.
 */
const makeRoute = (overrides = {}) => ({
    id: ROUTE_ID,
    driverId: DRIVER_ID,
    status: 'AVAILABLE',
    availableSeats: 3,
    driver: { firstName: 'วิทยา', lastName: 'สมบูรณ์' },
    startLocation: { name: 'Hashtags ขอนแก่น', lat: 16.4321, lng: 102.8236 },
    endLocation: { name: 'เซ็นทรัล ขอนแก่น', lat: 16.4195, lng: 102.8283 },
    bookings: [],
    ...overrides,
});

const makeBooking = (overrides = {}) => ({
    id: BOOKING_ID,
    passengerId: PASSENGER_ID,
    routeId: ROUTE_ID,
    status: 'PENDING',
    numberOfSeats: 1,
    route: makeRoute(),
    passenger: {
        id: PASSENGER_ID,
        firstName: 'น้ำเพชร',
        lastName: 'ใจดี',
        email: 'namphet@test.com',
    },
    metadata: {},
    ...overrides,
});

// ─── Transaction Helper ──────────────────────────────────
beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction.mockImplementation(async (fn) => {
        const tx = {
            booking: {
                update: (...args) => mockBookingUpdate(...args),
            },
            route: {
                update: (...args) => mockRouteUpdate(...args),
            },
            notification: {
                create: (...args) => mockNotificationCreate(...args),
            },
        };
        return fn(tx);
    });

    mockBookingUpdate.mockImplementation(({ data }) =>
        Promise.resolve({ id: BOOKING_ID, ...data })
    );
    mockRouteUpdate.mockImplementation(({ data }) =>
        Promise.resolve({ id: ROUTE_ID, ...data })
    );
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });
});


// ═══════════════════════════════════════════════════════════
// SUITE 1: Prisma query correctness (the actual bug fix)
// ═══════════════════════════════════════════════════════════
describe('updateBookingStatus — Prisma query does NOT include Json fields as relations', () => {

    test('findUnique should NOT include startLocation/endLocation as relations', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        // Verify the actual Prisma call — must NOT have startLocation/endLocation in include
        const findCall = mockBookingFindUnique.mock.calls[0][0];
        expect(findCall).toEqual({
            where: { id: BOOKING_ID },
            include: {
                route: { include: { driver: true } },
                passenger: true,
            },
        });

        // Explicitly verify no Json field in route include
        const routeInclude = findCall.include.route.include;
        expect(routeInclude).not.toHaveProperty('startLocation');
        expect(routeInclude).not.toHaveProperty('endLocation');
    });

    test('email routeName should use startLocation.name from Json field', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        expect(mockSendBookingConfirmedEmail).toHaveBeenCalledWith(
            'namphet@test.com',
            expect.objectContaining({
                routeName: 'Hashtags ขอนแก่น → เซ็นทรัล ขอนแก่น',
            })
        );
    });

    test('routeName fallback when startLocation/endLocation have no name', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            route: makeRoute({ startLocation: {}, endLocation: {} }),
        }));

        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        expect(mockSendBookingConfirmedEmail).toHaveBeenCalledWith(
            'namphet@test.com',
            expect.objectContaining({
                routeName: 'ต้นทาง → ปลายทาง',
            })
        );
    });
});


// ═══════════════════════════════════════════════════════════
// SUITE 2: CONFIRMED flow
// ═══════════════════════════════════════════════════════════
describe('updateBookingStatus — CONFIRMED', () => {

    test('should update booking status to CONFIRMED', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        expect(mockBookingUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: BOOKING_ID },
                data: { status: 'CONFIRMED' },
            })
        );
    });

    test('should create notification for passenger', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    type: 'BOOKING',
                    title: 'คำขอจองได้รับการยืนยัน',
                }),
            })
        );
    });

    test('should send confirmation email', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        expect(mockSendBookingConfirmedEmail).toHaveBeenCalledWith(
            'namphet@test.com',
            expect.objectContaining({
                passengerName: 'น้ำเพชร ใจดี',
                driverName: 'วิทยา สมบูรณ์',
            })
        );
    });
});


// ═══════════════════════════════════════════════════════════
// SUITE 3: REJECTED flow
// ═══════════════════════════════════════════════════════════
describe('updateBookingStatus — REJECTED', () => {

    test('should refund seats to route', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            numberOfSeats: 2,
            route: makeRoute({ availableSeats: 1, status: 'FULL' }),
        }));

        await updateBookingStatus(BOOKING_ID, 'REJECTED', DRIVER_ID);

        expect(mockRouteUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    availableSeats: 3,
                    status: 'AVAILABLE',
                }),
            })
        );
    });

    test('should create rejection notification', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await updateBookingStatus(BOOKING_ID, 'REJECTED', DRIVER_ID);

        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    title: 'คำขอจองถูกปฏิเสธ',
                }),
            })
        );
    });

    test('should send rejection email', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await updateBookingStatus(BOOKING_ID, 'REJECTED', DRIVER_ID);

        expect(mockSendBookingRejectedEmail).toHaveBeenCalledWith(
            'namphet@test.com',
            expect.objectContaining({ passengerName: 'น้ำเพชร ใจดี' })
        );
    });
});


// ═══════════════════════════════════════════════════════════
// SUITE 4: IN_PROGRESS flow (pickup)
// ═══════════════════════════════════════════════════════════
describe('updateBookingStatus — IN_PROGRESS', () => {

    test('should create pickup notification', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'CONFIRMED' }));

        await updateBookingStatus(BOOKING_ID, 'IN_PROGRESS', DRIVER_ID);

        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    title: '👤 คนขับรับผู้โดยสารแล้ว',
                }),
            })
        );
    });

    test('should send picked-up email', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'CONFIRMED' }));

        await updateBookingStatus(BOOKING_ID, 'IN_PROGRESS', DRIVER_ID);

        expect(mockSendPassengerPickedUpEmail).toHaveBeenCalledWith(
            'namphet@test.com',
            expect.objectContaining({ passengerName: 'น้ำเพชร ใจดี' })
        );
    });
});


// ═══════════════════════════════════════════════════════════
// SUITE 5: COMPLETED flow (dropoff)
// ═══════════════════════════════════════════════════════════
describe('updateBookingStatus — COMPLETED', () => {

    test('should set completedAt on booking', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'IN_PROGRESS' }));

        await updateBookingStatus(BOOKING_ID, 'COMPLETED', DRIVER_ID);

        // booking.update is called twice: once for status, once for completedAt
        const completedCall = mockBookingUpdate.mock.calls.find(
            ([arg]) => arg.data && arg.data.completedAt
        );
        expect(completedCall).toBeDefined();
    });

    test('should create dropoff notification', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'IN_PROGRESS' }));

        await updateBookingStatus(BOOKING_ID, 'COMPLETED', DRIVER_ID);

        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    title: '📍 ส่งถึงจุดหมายแล้ว',
                }),
            })
        );
    });

    test('should send review reminder email', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'IN_PROGRESS' }));

        await updateBookingStatus(BOOKING_ID, 'COMPLETED', DRIVER_ID);

        expect(mockSendReviewReminderEmail).toHaveBeenCalledWith(
            'namphet@test.com',
            expect.objectContaining({ passengerName: 'น้ำเพชร ใจดี' })
        );
    });
});


// ═══════════════════════════════════════════════════════════
// SUITE 6: Error cases
// ═══════════════════════════════════════════════════════════
describe('updateBookingStatus — Error cases', () => {

    test('should throw 404 when booking not found', async () => {
        mockBookingFindUnique.mockResolvedValue(null);

        await expect(
            updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID)
        ).rejects.toThrow('Booking not found');
    });

    test('should throw 403 when userId is not the route driver', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await expect(
            updateBookingStatus(BOOKING_ID, 'CONFIRMED', 'wrong-driver-id')
        ).rejects.toThrow('Forbidden');
    });

    test('should not send email when passenger has no email', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            passenger: { id: PASSENGER_ID, firstName: 'Test', lastName: 'User', email: null },
        }));

        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        expect(mockSendBookingConfirmedEmail).not.toHaveBeenCalled();
    });
});
