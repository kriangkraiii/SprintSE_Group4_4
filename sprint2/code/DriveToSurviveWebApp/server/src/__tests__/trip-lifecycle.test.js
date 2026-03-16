/**
 * Trip Lifecycle — End-to-End Integration Tests
 * ทดสอบ Flow ตั้งแต่สร้างเส้นทาง → จอง → ยืนยัน → เริ่มเดินทาง → รับผู้โดยสาร → ส่งผู้โดยสาร → สิ้นสุด
 *
 * Test Suites:
 * 1. updateBookingStatus — CONFIRMED / REJECTED / IN_PROGRESS / COMPLETED + emails
 * 2. startTrip — Route → IN_TRANSIT + passenger notifications + emails
 * 3. endTrip — Route → COMPLETED + all bookings completed + emails
 * 4. confirmBoarded — Passenger confirms boarding + driver notification
 * 5. Full Lifecycle Flow — Sequential actions
 * 6. Error Cases — Validation & authorization
 */

const ApiError = require('../utils/ApiError');

// ─── Mock Prisma ──────────────────────────────────────────
const mockBookingFindUnique = jest.fn();
const mockBookingUpdate = jest.fn();
const mockBookingUpdateMany = jest.fn();
const mockRouteFindUnique = jest.fn();
const mockRouteUpdate = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTransaction = jest.fn();

// Chat-specific mocks
const mockChatSessionFindUnique = jest.fn();
const mockChatSessionCreate = jest.fn();
const mockChatSessionUpdate = jest.fn();
const mockChatMessageCreate = jest.fn();
const mockParticipantFindUnique = jest.fn();
const mockParticipantCreate = jest.fn();

// Arrival notification mocks
const mockANFindMany = jest.fn();
const mockANCreate = jest.fn();
const mockANFindFirst = jest.fn();
const mockANDelete = jest.fn();
const mockNotifLogCreate = jest.fn();
const mockSystemLogCreate = jest.fn();

jest.mock('../utils/prisma', () => ({
    booking: {
        findUnique: (...args) => mockBookingFindUnique(...args),
        update: (...args) => mockBookingUpdate(...args),
        updateMany: (...args) => mockBookingUpdateMany(...args),
    },
    route: {
        findUnique: (...args) => mockRouteFindUnique(...args),
        update: (...args) => mockRouteUpdate(...args),
    },
    notification: {
        create: (...args) => mockNotificationCreate(...args),
    },
    chatSession: {
        findUnique: (...args) => mockChatSessionFindUnique(...args),
        create: (...args) => mockChatSessionCreate(...args),
        update: (...args) => mockChatSessionUpdate(...args),
    },
    chatMessage: {
        create: (...args) => mockChatMessageCreate(...args),
    },
    chatSessionParticipant: {
        findUnique: (...args) => mockParticipantFindUnique(...args),
        create: (...args) => mockParticipantCreate(...args),
    },
    arrivalNotification: {
        findMany: (...args) => mockANFindMany(...args),
        create: (...args) => mockANCreate(...args),
        findFirst: (...args) => mockANFindFirst(...args),
        delete: (...args) => mockANDelete(...args),
    },
    notificationLog: {
        create: (...args) => mockNotifLogCreate(...args),
    },
    systemLog: {
        create: (...args) => mockSystemLogCreate(...args),
    },
    user: {
        findUnique: jest.fn(),
    },
    $transaction: (fn) => mockTransaction(fn),
}));

// ─── Mock Email Service ──────────────────────────────────
const mockSendBookingConfirmedEmail = jest.fn();
const mockSendBookingRejectedEmail = jest.fn();
const mockSendTripStartedEmail = jest.fn();
const mockSendPassengerPickedUpEmail = jest.fn();
const mockSendReviewReminderEmail = jest.fn();
const mockSendArrivalEmail = jest.fn();

jest.mock('../services/email.service', () => ({
    sendBookingConfirmedEmail: (...args) => mockSendBookingConfirmedEmail(...args),
    sendBookingRejectedEmail: (...args) => mockSendBookingRejectedEmail(...args),
    sendTripStartedEmail: (...args) => mockSendTripStartedEmail(...args),
    sendPassengerPickedUpEmail: (...args) => mockSendPassengerPickedUpEmail(...args),
    sendReviewReminderEmail: (...args) => mockSendReviewReminderEmail(...args),
    sendBookingEmail: jest.fn().mockResolvedValue({}),
    sendArrivalEmail: (...args) => mockSendArrivalEmail(...args),
}));

// ─── Mock Socket Emitter ─────────────────────────────────
jest.mock('../socket/emitter', () => ({
    emitNotification: jest.fn(),
    emitToRoute: jest.fn(),
}));

// ─── Mock Penalty Service ────────────────────────────────
jest.mock('../services/penalty.service', () => ({
    checkAndApplyPassengerSuspension: jest.fn().mockResolvedValue(null),
}));

// ─── Mock No-Show Service ────────────────────────────────
const mockStartNoShowCountdown = jest.fn();
jest.mock('../services/noShow.service', () => ({
    startNoShowCountdown: (...args) => mockStartNoShowCountdown(...args),
}));

// ─── Mock Content Filter (used by chat) ──────────────────
jest.mock('../utils/contentFilter', () => ({
    filterContent: (text) => ({ filtered: text, original: text, isFiltered: false }),
}));

// ─── Load Services ───────────────────────────────────────
const { updateBookingStatus, confirmBoarded } = require('../services/booking.service');
const { startTrip, endTrip } = require('../services/route.service');
const chatService = require('../services/chat.service');
const { checkAndNotify } = require('../services/arrivalNotification.service');

// ─── Fixtures ────────────────────────────────────────────
const DRIVER_ID = 'driver-001';
const PASSENGER_ID = 'passenger-001';
const ROUTE_ID = 'route-001';
const BOOKING_ID = 'booking-001';

const makeRoute = (overrides = {}) => ({
    id: ROUTE_ID,
    driverId: DRIVER_ID,
    status: 'AVAILABLE',
    availableSeats: 3,
    driver: { firstName: 'วิทยา', lastName: 'สมบูรณ์' },
    startLocation: { name: 'ขอนแก่น' },
    endLocation: { name: 'กรุงเทพฯ' },
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
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        email: 'somchai@test.com',
    },
    metadata: {},
    ...overrides,
});

const makeConfirmedBooking = (overrides = {}) => makeBooking({
    status: 'CONFIRMED',
    route: makeRoute({ status: 'AVAILABLE' }),
    ...overrides,
});

// ─── Transaction Helper ──────────────────────────────────
// Simulate Prisma $transaction by executing the callback with mock tx
beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction.mockImplementation(async (fn) => {
        const tx = {
            booking: {
                update: (...args) => mockBookingUpdate(...args),
                updateMany: (...args) => mockBookingUpdateMany(...args),
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

    // Default mock returns
    mockBookingUpdate.mockImplementation(({ data }) =>
        Promise.resolve({ id: BOOKING_ID, ...data })
    );
    mockRouteUpdate.mockImplementation(({ data }) =>
        Promise.resolve({ id: ROUTE_ID, ...data })
    );
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });
    mockBookingUpdateMany.mockResolvedValue({ count: 1 });

    // Email mocks - all resolve
    mockSendBookingConfirmedEmail.mockResolvedValue({});
    mockSendBookingRejectedEmail.mockResolvedValue({});
    mockSendTripStartedEmail.mockResolvedValue({});
    mockSendPassengerPickedUpEmail.mockResolvedValue({});
    mockSendReviewReminderEmail.mockResolvedValue({});
});

// ═══════════════════════════════════════════════════════════
// SUITE 1: updateBookingStatus — Booking Status Transitions
// ═══════════════════════════════════════════════════════════
describe('updateBookingStatus — Booking Lifecycle', () => {
    test('CONFIRMED: ยืนยันคำขอจอง → notification + email ถึงผู้โดยสาร', async () => {
        // Arrange
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        // Act
        await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

        // Assert: booking updated
        expect(mockBookingUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: BOOKING_ID },
                data: { status: 'CONFIRMED' },
            })
        );

        // Assert: in-app notification created
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    type: 'BOOKING',
                    title: 'คำขอจองได้รับการยืนยัน',
                }),
            })
        );

        // Assert: email sent to passenger
        expect(mockSendBookingConfirmedEmail).toHaveBeenCalledWith(
            'somchai@test.com',
            expect.objectContaining({
                passengerName: 'สมชาย ใจดี',
                driverName: 'วิทยา สมบูรณ์',
                routeName: expect.stringContaining('ขอนแก่น'),
            })
        );
    });

    test('REJECTED: ปฏิเสธคำขอจอง → คืนที่นั่ง + notification + email', async () => {
        // Arrange
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            numberOfSeats: 2,
            route: makeRoute({ availableSeats: 1, status: 'FULL' }),
        }));

        // Act
        await updateBookingStatus(BOOKING_ID, 'REJECTED', DRIVER_ID);

        // Assert: seats refunded (1 + 2 = 3)
        expect(mockRouteUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    availableSeats: 3,
                    status: 'AVAILABLE',
                }),
            })
        );

        // Assert: rejection notification
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    title: 'คำขอจองถูกปฏิเสธ',
                }),
            })
        );

        // Assert: rejection email
        expect(mockSendBookingRejectedEmail).toHaveBeenCalledWith(
            'somchai@test.com',
            expect.objectContaining({ passengerName: 'สมชาย ใจดี' })
        );
    });

    test('IN_PROGRESS: คนขับรับผู้โดยสารขึ้นรถ → notification + email', async () => {
        // Arrange
        mockBookingFindUnique.mockResolvedValue(makeConfirmedBooking());

        // Act
        await updateBookingStatus(BOOKING_ID, 'IN_PROGRESS', DRIVER_ID);

        // Assert: notification
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    title: '👤 คนขับรับผู้โดยสารแล้ว',
                }),
            })
        );

        // Assert: pickup email
        expect(mockSendPassengerPickedUpEmail).toHaveBeenCalledWith(
            'somchai@test.com',
            expect.objectContaining({ passengerName: 'สมชาย ใจดี' })
        );
    });

    test('COMPLETED: ส่งผู้โดยสารถึง → notification + review reminder email', async () => {
        // Arrange
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            status: 'IN_PROGRESS',
            route: makeRoute(),
        }));

        // Act
        await updateBookingStatus(BOOKING_ID, 'COMPLETED', DRIVER_ID);

        // Assert: completedAt set
        expect(mockBookingUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { completedAt: expect.any(Date) },
            })
        );

        // Assert: notification
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: PASSENGER_ID,
                    title: '📍 ส่งถึงจุดหมายแล้ว',
                }),
            })
        );

        // Assert: review reminder email
        expect(mockSendReviewReminderEmail).toHaveBeenCalledWith(
            'somchai@test.com',
            expect.objectContaining({ passengerName: 'สมชาย ใจดี' })
        );
    });

    test('Forbidden: ผู้ใช้อื่นไม่สามารถเปลี่ยนสถานะได้', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());

        await expect(updateBookingStatus(BOOKING_ID, 'CONFIRMED', 'other-driver'))
            .rejects.toThrow('Forbidden');
    });

    test('Not Found: booking ไม่มีอยู่ → throw 404', async () => {
        mockBookingFindUnique.mockResolvedValue(null);

        await expect(updateBookingStatus('no-exist', 'CONFIRMED', DRIVER_ID))
            .rejects.toThrow('Booking not found');
    });

    test('Email failure ไม่กระทบ transaction', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking());
        mockSendBookingConfirmedEmail.mockRejectedValue(new Error('SMTP down'));

        // Should NOT throw — email is fire-and-forget
        const result = await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);
        expect(result).toBeDefined();
        expect(mockBookingUpdate).toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════
// SUITE 2: startTrip — Route Lifecycle
// ═══════════════════════════════════════════════════════════
describe('startTrip — เริ่มเดินทาง', () => {
    test('สำเร็จ: Route → IN_TRANSIT + แจ้งเตือนผู้โดยสารทุกคน + email', async () => {
        // Arrange
        const passengers = [
            { id: 'b1', passengerId: 'p1', passenger: { id: 'p1', firstName: 'สม', lastName: 'ชาย', email: 'p1@test.com' } },
            { id: 'b2', passengerId: 'p2', passenger: { id: 'p2', firstName: 'ส', lastName: 'หญิง', email: 'p2@test.com' } },
        ];
        mockRouteFindUnique.mockResolvedValue(makeRoute({
            status: 'AVAILABLE',
            bookings: passengers,
        }));

        // Act
        await startTrip(ROUTE_ID, DRIVER_ID);

        // Assert: route updated to IN_TRANSIT
        expect(mockRouteUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { status: 'IN_TRANSIT' },
            })
        );

        // Assert: 2 in-app notifications (one per passenger)
        expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'p1',
                    title: '🚗 คนขับเริ่มเดินทางแล้ว',
                }),
            })
        );

        // Assert: 2 emails sent
        expect(mockSendTripStartedEmail).toHaveBeenCalledTimes(2);
        expect(mockSendTripStartedEmail).toHaveBeenCalledWith(
            'p1@test.com',
            expect.objectContaining({
                driverName: 'วิทยา สมบูรณ์',
                routeName: expect.stringContaining('ขอนแก่น'),
            })
        );
    });

    test('Error: ไม่ใช่คนขับของเส้นทาง → throw 403', async () => {
        mockRouteFindUnique.mockResolvedValue(makeRoute());

        await expect(startTrip(ROUTE_ID, 'other-driver'))
            .rejects.toThrow('Forbidden');
    });

    test('Error: Route ไม่พบ → throw 404', async () => {
        mockRouteFindUnique.mockResolvedValue(null);

        await expect(startTrip('no-exist', DRIVER_ID))
            .rejects.toThrow('Route not found');
    });

    test('Error: Route IN_TRANSIT แล้ว → throw 400', async () => {
        mockRouteFindUnique.mockResolvedValue(makeRoute({ status: 'IN_TRANSIT' }));

        await expect(startTrip(ROUTE_ID, DRIVER_ID))
            .rejects.toThrow('เส้นทางนี้ไม่สามารถเริ่มเดินทางได้');
    });

    test('Error: Route COMPLETED แล้ว → throw 400', async () => {
        mockRouteFindUnique.mockResolvedValue(makeRoute({ status: 'COMPLETED' }));

        await expect(startTrip(ROUTE_ID, DRIVER_ID))
            .rejects.toThrow('เส้นทางนี้ไม่สามารถเริ่มเดินทางได้');
    });

    test('ไม่มีผู้โดยสาร → ไม่ส่ง notification/email แต่ route ยัง update ได้', async () => {
        mockRouteFindUnique.mockResolvedValue(makeRoute({
            status: 'AVAILABLE',
            bookings: [],
        }));

        await startTrip(ROUTE_ID, DRIVER_ID);

        expect(mockRouteUpdate).toHaveBeenCalled();
        expect(mockNotificationCreate).not.toHaveBeenCalled();
        expect(mockSendTripStartedEmail).not.toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════
// SUITE 3: endTrip — สิ้นสุดเดินทาง
// ═══════════════════════════════════════════════════════════
describe('endTrip — สิ้นสุดเดินทาง', () => {
    test('สำเร็จ: Route → COMPLETED + all bookings → COMPLETED + emails', async () => {
        // Arrange
        const passengers = [
            { id: 'b1', passengerId: 'p1', passenger: { id: 'p1', firstName: 'สม', lastName: 'ชาย', email: 'p1@test.com' } },
        ];
        mockRouteFindUnique.mockResolvedValue(makeRoute({
            status: 'IN_TRANSIT',
            bookings: passengers,
        }));

        // Act
        await endTrip(ROUTE_ID, DRIVER_ID);

        // Assert: route → COMPLETED
        expect(mockRouteUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { status: 'COMPLETED' },
            })
        );

        // Assert: bookings completed
        expect(mockBookingUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    routeId: ROUTE_ID,
                }),
                data: expect.objectContaining({
                    status: 'COMPLETED',
                    completedAt: expect.any(Date),
                }),
            })
        );

        // Assert: notification
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'p1',
                    title: '✅ ถึงจุดหมายแล้ว',
                }),
            })
        );

        // Assert: review reminder email
        expect(mockSendReviewReminderEmail).toHaveBeenCalledWith(
            'p1@test.com',
            expect.objectContaining({ passengerName: 'สม ชาย' })
        );
    });

    test('Error: Route ยังไม่เริ่ม → throw 400', async () => {
        mockRouteFindUnique.mockResolvedValue(makeRoute({ status: 'AVAILABLE' }));

        await expect(endTrip(ROUTE_ID, DRIVER_ID))
            .rejects.toThrow('เส้นทางนี้ยังไม่ได้เริ่มเดินทาง');
    });

    test('Error: ไม่ใช่คนขับ → throw 403', async () => {
        mockRouteFindUnique.mockResolvedValue(makeRoute({ status: 'IN_TRANSIT' }));

        await expect(endTrip(ROUTE_ID, 'other-driver'))
            .rejects.toThrow('Forbidden');
    });
});

// ═══════════════════════════════════════════════════════════
// SUITE 4: confirmBoarded — ผู้โดยสารยืนยันขึ้นรถ
// ═══════════════════════════════════════════════════════════
describe('confirmBoarded — ผู้โดยสารยืนยันขึ้นรถ', () => {
    test('สำเร็จ: metadata passengerBoarded = true + แจ้งเตือนคนขับ', async () => {
        // Arrange
        mockBookingFindUnique.mockResolvedValue(makeConfirmedBooking());

        // Act
        await confirmBoarded(BOOKING_ID, PASSENGER_ID);

        // Assert: booking metadata updated
        expect(mockBookingUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    metadata: expect.objectContaining({
                        passengerBoarded: true,
                        boardedAt: expect.any(String),
                    }),
                }),
            })
        );

        // Assert: driver notified
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: DRIVER_ID,
                    title: expect.stringContaining('ขึ้นรถแล้ว'),
                }),
            })
        );
    });

    test('Error: ไม่ใช่เจ้าของ booking → throw 403', async () => {
        mockBookingFindUnique.mockResolvedValue(makeConfirmedBooking());

        await expect(confirmBoarded(BOOKING_ID, 'other-passenger'))
            .rejects.toThrow('Forbidden');
    });

    test('Error: Booking ไม่พบ → throw 404', async () => {
        mockBookingFindUnique.mockResolvedValue(null);

        await expect(confirmBoarded('no-exist', PASSENGER_ID))
            .rejects.toThrow('Booking not found');
    });
});

// ═══════════════════════════════════════════════════════════
// SUITE 6: Chat Service — Access Control & Lifecycle
// ═══════════════════════════════════════════════════════════
describe('Chat Service — แชทกลุ่ม', () => {
    beforeEach(() => {
        mockChatSessionCreate.mockImplementation(({ data }) =>
            Promise.resolve({ id: 'session-1', routeId: data.routeId, status: 'ACTIVE', ...data })
        );
        mockChatMessageCreate.mockResolvedValue({ id: 'msg-1' });
        mockChatSessionUpdate.mockImplementation(({ data }) =>
            Promise.resolve({ id: 'session-1', ...data })
        );
        mockParticipantCreate.mockResolvedValue({});
    });

    test('createSession: สร้างแชทกลุ่มเมื่อยังไม่มี', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);
        mockRouteFindUnique.mockResolvedValue({ driverId: DRIVER_ID });

        const session = await chatService.createSession(ROUTE_ID, PASSENGER_ID);

        expect(mockChatSessionCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    routeId: ROUTE_ID,
                    driverId: DRIVER_ID,
                }),
            })
        );
        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'SYSTEM',
                    content: expect.stringContaining('แชทกลุ่มเริ่มต้นแล้ว'),
                }),
            })
        );
    });

    test('createSession: idempotent — คืน session เดิมถ้ามีอยู่แล้ว', async () => {
        const existing = {
            id: 'session-existing',
            routeId: ROUTE_ID,
            participants: [{ userId: DRIVER_ID }],
        };
        mockChatSessionFindUnique.mockResolvedValue(existing);

        const session = await chatService.createSession(ROUTE_ID, PASSENGER_ID);

        expect(session.id).toBe('session-existing');
        expect(mockChatSessionCreate).not.toHaveBeenCalled();
    });

    test('createSession: Route ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);
        mockRouteFindUnique.mockResolvedValue(null);

        await expect(chatService.createSession('no-route', PASSENGER_ID))
            .rejects.toThrow('Route not found');
    });

    test('isParticipant: คนขับเป็น participant เสมอ', async () => {
        mockChatSessionFindUnique.mockResolvedValue({ driverId: DRIVER_ID });

        const result = await chatService.isParticipant('session-1', DRIVER_ID);
        expect(result).toBe(true);
    });

    test('isParticipant: ผู้ที่ไม่ใช่ participant → false', async () => {
        mockChatSessionFindUnique.mockResolvedValue({ driverId: DRIVER_ID });
        mockParticipantFindUnique.mockResolvedValue(null);

        const result = await chatService.isParticipant('session-1', 'stranger');
        expect(result).toBe(false);
    });

    test('isParticipant: session ไม่มี → false', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);

        const result = await chatService.isParticipant('no-session', PASSENGER_ID);
        expect(result).toBe(false);
    });

    test('sendMessage: session READ_ONLY → throw 403', async () => {
        mockChatSessionFindUnique.mockResolvedValue({ id: 'session-1', status: 'READ_ONLY' });

        await expect(chatService.sendMessage('session-1', PASSENGER_ID, { content: 'hello' }))
            .rejects.toThrow('แชทนี้อ่านได้อย่างเดียว');
    });

    test('sendMessage: session ARCHIVED → throw 403', async () => {
        mockChatSessionFindUnique.mockResolvedValue({ id: 'session-1', status: 'ARCHIVED' });

        await expect(chatService.sendMessage('session-1', PASSENGER_ID, { content: 'hello' }))
            .rejects.toThrow('แชทนี้ถูกลบแล้ว');
    });

    test('sendMessage: ไม่ใช่ participant → throw 403', async () => {
        mockChatSessionFindUnique
            .mockResolvedValueOnce({ id: 'session-1', status: 'ACTIVE' })
            .mockResolvedValueOnce({ driverId: DRIVER_ID });
        mockParticipantFindUnique.mockResolvedValue(null);

        await expect(chatService.sendMessage('session-1', 'stranger', { content: 'hello' }))
            .rejects.toThrow('You are not a participant');
    });

    test('endSession: session → ENDED + set chatExpiresAt', async () => {
        mockChatSessionFindUnique.mockResolvedValue({ id: 'session-1', status: 'ACTIVE', routeId: ROUTE_ID });

        await chatService.endSession(ROUTE_ID);

        expect(mockChatSessionUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: 'ENDED',
                    endedAt: expect.any(Date),
                    chatExpiresAt: expect.any(Date),
                    readOnlyExpiresAt: expect.any(Date),
                }),
            })
        );
    });

    test('endSession: session ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);

        await expect(chatService.endSession('no-route'))
            .rejects.toThrow('Chat session not found');
    });

    test('endSession: session ENDED → คืนค่าเดิม ไม่ update', async () => {
        const endedSession = { id: 'session-1', status: 'ENDED', routeId: ROUTE_ID };
        mockChatSessionFindUnique.mockResolvedValue(endedSession);

        const result = await chatService.endSession(ROUTE_ID);

        expect(result).toEqual(endedSession);
        expect(mockChatSessionUpdate).not.toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════
// SUITE 7: GPS / Map Utilities (Pure Functions)
// ═══════════════════════════════════════════════════════════
describe('GPS / Map Utilities', () => {
    const { haversineDistance, getCrossedRadii, EARTH_RADIUS_KM, RADIUS_THRESHOLDS } = require('../utils/gpsUtils');

    describe('haversineDistance', () => {
        test('จุดเดียวกัน → 0', () => {
            expect(haversineDistance(16.4720, 102.8239, 16.4720, 102.8239)).toBe(0);
        });

        test('ขอนแก่น → กรุงเทพฯ ≈ 350-500 km', () => {
            const d = haversineDistance(16.4419, 102.8360, 13.7563, 100.5018);
            expect(d).toBeGreaterThan(350);
            expect(d).toBeLessThan(500);
        });

        test('ระยะสั้น ~4 km (มข. → ขอนแก่น city)', () => {
            const d = haversineDistance(16.4720, 102.8239, 16.4419, 102.8360);
            expect(d).toBeGreaterThan(3);
            expect(d).toBeLessThan(5);
        });

        test('สมมาตร: d(A→B) = d(B→A)', () => {
            const d1 = haversineDistance(16.47, 102.82, 16.44, 102.84);
            const d2 = haversineDistance(16.44, 102.84, 16.47, 102.82);
            expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
        });

        test('EARTH_RADIUS_KM = 6371', () => {
            expect(EARTH_RADIUS_KM).toBe(6371);
        });
    });

    describe('getCrossedRadii — threshold detection', () => {
        test('> 5km → ไม่ cross อะไร', () => {
            expect(getCrossedRadii(10)).toEqual([]);
            expect(getCrossedRadii(5.1)).toEqual([]);
        });

        test('≤ 5km → FIVE_KM', () => {
            const radii = getCrossedRadii(4.5);
            expect(radii).toContain('FIVE_KM');
            expect(radii).not.toContain('ONE_KM');
            expect(radii).not.toContain('ZERO_KM');
        });

        test('≤ 1km → FIVE_KM + ONE_KM', () => {
            const radii = getCrossedRadii(0.8);
            expect(radii).toContain('FIVE_KM');
            expect(radii).toContain('ONE_KM');
            expect(radii).not.toContain('ZERO_KM');
        });

        test('≤ 0.1km (ถึงแล้ว) → ทั้ง 3 tiers', () => {
            const radii = getCrossedRadii(0.05);
            expect(radii).toEqual(expect.arrayContaining(['FIVE_KM', 'ONE_KM', 'ZERO_KM']));
            expect(radii).toHaveLength(3);
        });

        test('0 km → ทั้ง 3 tiers', () => {
            expect(getCrossedRadii(0)).toHaveLength(3);
        });

        test('ขอบเขตพอดี 5km → FIVE_KM', () => {
            expect(getCrossedRadii(5)).toContain('FIVE_KM');
        });

        test('ขอบเขตพอดี 1km → FIVE_KM + ONE_KM', () => {
            const radii = getCrossedRadii(1);
            expect(radii).toContain('FIVE_KM');
            expect(radii).toContain('ONE_KM');
        });

        test('ขอบเขตพอดี 0.1km → ทั้ง 3', () => {
            expect(getCrossedRadii(0.1)).toHaveLength(3);
        });
    });

    describe('RADIUS_THRESHOLDS — configuration', () => {
        test('มี 3 thresholds', () => {
            expect(RADIUS_THRESHOLDS).toHaveLength(3);
        });

        test('FIVE_KM = 5, ONE_KM = 1, ZERO_KM = 0.1', () => {
            const map = {};
            RADIUS_THRESHOLDS.forEach(t => { map[t.type] = t.distance; });
            expect(map.FIVE_KM).toBe(5);
            expect(map.ONE_KM).toBe(1);
            expect(map.ZERO_KM).toBe(0.1);
        });
    });
});

// ═══════════════════════════════════════════════════════════
// SUITE 8: Arrival Notifications — checkAndNotify Integration
// ═══════════════════════════════════════════════════════════
describe('Arrival Notifications — checkAndNotify (Proximity Alerts)', () => {
    const PICKUP = { lat: 16.4720, lng: 102.8239 };
    const GPS_5KM = { lat: 16.5080, lng: 102.8500 };
    const GPS_1KM = { lat: 16.4660, lng: 102.8270 };
    const GPS_0KM = { lat: 16.4718, lng: 102.8237 };
    const GPS_FAR = { lat: 16.8000, lng: 103.3000 };

    const makeArrivalBooking = (overrides = {}) => ({
        id: 'BK-001',
        status: 'CONFIRMED',
        passengerId: 'passenger-001',
        pickupLocation: PICKUP,
        passenger: { id: 'passenger-001', email: 'test@example.com', firstName: 'สมชาย' },
        route: { driverId: 'driver-001', driver: { firstName: 'วิทยา' } },
        ...overrides,
    });

    beforeEach(() => {
        mockBookingFindUnique.mockResolvedValue(makeArrivalBooking());
        mockANFindMany.mockResolvedValue([]);
        mockANCreate.mockImplementation(({ data }) => Promise.resolve({
            id: `notif-${Date.now()}`, ...data, triggeredAt: new Date(),
        }));
        mockNotificationCreate.mockResolvedValue({ id: 'notif-in-app' });
        mockNotifLogCreate.mockResolvedValue({ id: 'log-1' });
        mockSendArrivalEmail.mockResolvedValue({ messageId: 'email-ok' });
        mockStartNoShowCountdown.mockResolvedValue({});
        mockSystemLogCreate.mockResolvedValue({});
    });

    test('~4km → ส่ง FIVE_KM notification + email', async () => {
        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(result.distanceKm).toBeGreaterThan(3);
        expect(result.distanceKm).toBeLessThan(5);
        expect(result.crossedRadii).toContain('FIVE_KM');
        expect(result.newNotifications).toHaveLength(1);
        expect(mockNotificationCreate).toHaveBeenCalled();
        expect(mockSendArrivalEmail).toHaveBeenCalledWith(
            'test@example.com', 'FIVE_KM', expect.anything()
        );
    });

    test('~0.8km → ส่ง FIVE_KM + ONE_KM', async () => {
        const result = await checkAndNotify('BK-001', GPS_1KM.lat, GPS_1KM.lng);

        expect(result.crossedRadii).toContain('FIVE_KM');
        expect(result.crossedRadii).toContain('ONE_KM');
        expect(result.newNotifications).toHaveLength(2);
        expect(mockSendArrivalEmail).toHaveBeenCalledTimes(2);
    });

    test('~0km (ถึงแล้ว) → ส่ง 3 tiers + No-Show countdown', async () => {
        const result = await checkAndNotify('BK-001', GPS_0KM.lat, GPS_0KM.lng);

        expect(result.crossedRadii).toContain('ZERO_KM');
        expect(result.newNotifications).toHaveLength(3);
        expect(mockStartNoShowCountdown).toHaveBeenCalledWith('BK-001');
    });

    test('ไกลมาก ~40km → ไม่ส่ง notification', async () => {
        const result = await checkAndNotify('BK-001', GPS_FAR.lat, GPS_FAR.lng);

        expect(result.crossedRadii).toEqual([]);
        expect(result.newNotifications).toHaveLength(0);
        expect(mockSendArrivalEmail).not.toHaveBeenCalled();
    });

    test('Dedup: FIVE_KM ส่งแล้ว → ไม่ส่งซ้ำ', async () => {
        mockANFindMany.mockResolvedValue([{ radiusType: 'FIVE_KM' }]);

        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(result.newNotifications).toHaveLength(0);
        expect(mockSendArrivalEmail).not.toHaveBeenCalled();
    });

    test('Booking ไม่พบ → throw 404', async () => {
        mockBookingFindUnique.mockResolvedValue(null);

        await expect(checkAndNotify('BK-999', 16.47, 102.82))
            .rejects.toThrow('Booking not found');
    });

    test('Booking COMPLETED → throw 400', async () => {
        mockBookingFindUnique.mockResolvedValue(makeArrivalBooking({ status: 'COMPLETED' }));

        await expect(checkAndNotify('BK-001', 16.47, 102.82))
            .rejects.toThrow('Booking is not active');
    });

    test('ไม่มี pickupLocation → throw 400', async () => {
        mockBookingFindUnique.mockResolvedValue(makeArrivalBooking({ pickupLocation: null }));

        await expect(checkAndNotify('BK-001', 16.47, 102.82))
            .rejects.toThrow('Pickup location not set');
    });
});

