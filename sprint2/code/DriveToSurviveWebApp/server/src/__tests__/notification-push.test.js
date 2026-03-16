/**
 * Real-time Notification Push + Email Notification — Unit Tests
 *
 * ทดสอบว่า emitNotification ถูกเรียกหลังทุกๆ notification.create
 * และ email notification ถูกส่งในทุก scenario ที่ควรส่ง
 * ครอบคลุมทุก service: penalty, noShow, arrivalNotification, booking, route
 */

const ApiError = require('../utils/ApiError');

// ══════════════════════════════════════════════════════════
// Mock: Socket emitter (MUST be before all service requires)
// ══════════════════════════════════════════════════════════
const mockEmitNotification = jest.fn();
const mockEmitToRoute = jest.fn();

jest.mock('../socket/emitter', () => ({
  emitNotification: (...args) => mockEmitNotification(...args),
  emitToRoute: (...args) => mockEmitToRoute(...args),
}));

// ══════════════════════════════════════════════════════════
// Mock: Prisma
// ══════════════════════════════════════════════════════════
const mockNotificationCreate = jest.fn();
const mockNotificationCount = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockBookingUpdate = jest.fn();
const mockBookingUpdateMany = jest.fn();
const mockRouteCount = jest.fn();
const mockRouteFindUnique = jest.fn();
const mockRouteUpdate = jest.fn();
const mockUserUpdate = jest.fn();
const mockSystemLogCreate = jest.fn();
const mockArrivalNotifCreate = jest.fn();
const mockNotifLogCreate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../utils/prisma', () => ({
  notification: {
    create: (...args) => mockNotificationCreate(...args),
    count: (...args) => mockNotificationCount(...args),
  },
  booking: {
    findUnique: (...args) => mockBookingFindUnique(...args),
    update: (...args) => mockBookingUpdate(...args),
    updateMany: (...args) => mockBookingUpdateMany(...args),
    count: jest.fn().mockResolvedValue(0),
  },
  route: {
    findUnique: (...args) => mockRouteFindUnique(...args),
    update: (...args) => mockRouteUpdate(...args),
    count: (...args) => mockRouteCount(...args),
  },
  user: {
    update: (...args) => mockUserUpdate(...args),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  systemLog: {
    create: (...args) => mockSystemLogCreate(...args),
  },
  arrivalNotification: {
    create: (...args) => mockArrivalNotifCreate(...args),
    findMany: jest.fn().mockResolvedValue([]),
  },
  notificationLog: {
    create: (...args) => mockNotifLogCreate(...args),
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
  $transaction: (fn) => mockTransaction(fn),
}));

// ══════════════════════════════════════════════════════════
// Mock: Other dependencies
// ══════════════════════════════════════════════════════════
const mockSendBookingConfirmedEmail = jest.fn().mockResolvedValue({});
const mockSendBookingRejectedEmail = jest.fn().mockResolvedValue({});
const mockSendPassengerPickedUpEmail = jest.fn().mockResolvedValue({});
const mockSendReviewReminderEmail = jest.fn().mockResolvedValue({});
const mockSendBookingEmail = jest.fn().mockResolvedValue({});
const mockSendArrivalEmail = jest.fn().mockResolvedValue({});
const mockSendTripStartedEmail = jest.fn().mockResolvedValue({});

jest.mock('../services/email.service', () => ({
  sendBookingConfirmedEmail: (...args) => mockSendBookingConfirmedEmail(...args),
  sendBookingRejectedEmail: (...args) => mockSendBookingRejectedEmail(...args),
  sendPassengerPickedUpEmail: (...args) => mockSendPassengerPickedUpEmail(...args),
  sendReviewReminderEmail: (...args) => mockSendReviewReminderEmail(...args),
  sendBookingEmail: (...args) => mockSendBookingEmail(...args),
  sendArrivalEmail: (...args) => mockSendArrivalEmail(...args),
  sendTripStartedEmail: (...args) => mockSendTripStartedEmail(...args),
}));

jest.mock('../services/penalty.service', () => ({
  checkAndApplyPassengerSuspension: jest.fn().mockResolvedValue(null),
  checkAndApplyDriverSuspension: jest.fn().mockResolvedValue(null),
}));

jest.mock('../services/noShow.service', () => ({
  startNoShowCountdown: jest.fn().mockResolvedValue(null),
  NO_SHOW_TIMEOUT_MINUTES: 20,
}));

jest.mock('../utils/contentFilter', () => ({
  filterContent: (text) => ({ filtered: text, original: text, isFiltered: false }),
}));

jest.mock('../utils/gpsUtils', () => ({
  haversineDistance: jest.fn().mockReturnValue(0.5),
  getCrossedRadii: jest.fn().mockReturnValue(['ZERO_KM']),
}));

// ══════════════════════════════════════════════════════════
// Load services AFTER mocks
// ══════════════════════════════════════════════════════════
const { cancelBooking, updateBookingStatus } = require('../services/booking.service');
const { cancelRoute, startTrip, endTrip } = require('../services/route.service');

// ══════════════════════════════════════════════════════════
// Fixtures
// ══════════════════════════════════════════════════════════
const DRIVER_ID = 'driver-001';
const PASSENGER_ID = 'passenger-001';
const ROUTE_ID = 'route-001';
const BOOKING_ID = 'booking-001';

const makeRoute = (overrides = {}) => ({
  id: ROUTE_ID,
  driverId: DRIVER_ID,
  status: 'AVAILABLE',
  availableSeats: 3,
  driver: { id: DRIVER_ID, firstName: 'วิทยา', lastName: 'สมบูรณ์' },
  startLocation: { name: 'A', lat: 16.4, lng: 102.8 },
  endLocation: { name: 'B', lat: 16.5, lng: 102.9 },
  bookings: [],
  ...overrides,
});

const makeBooking = (overrides = {}) => ({
  id: BOOKING_ID,
  passengerId: PASSENGER_ID,
  routeId: ROUTE_ID,
  status: 'CONFIRMED',
  numberOfSeats: 1,
  route: makeRoute(),
  passenger: { id: PASSENGER_ID, firstName: 'สมชาย', lastName: 'ใจดี', email: 'test@test.com' },
  pickupLocation: { lat: 16.4, lng: 102.8 },
  ...overrides,
});

const fakeNotification = (id = 'notif-1') => ({
  id,
  userId: PASSENGER_ID,
  type: 'SYSTEM',
  title: 'Test',
  body: 'Test body',
  createdAt: new Date(),
});

// ══════════════════════════════════════════════════════════
// Reset mocks
// ══════════════════════════════════════════════════════════
beforeEach(() => {
  jest.clearAllMocks();
  // Reset implementations that might be overridden by individual tests
  mockNotificationCreate.mockResolvedValue(fakeNotification());
  mockNotificationCount.mockResolvedValue(0);
  mockRouteCount.mockResolvedValue(0);
  mockSystemLogCreate.mockResolvedValue({});
  mockArrivalNotifCreate.mockResolvedValue({ id: 'arrival-1' });
  mockNotifLogCreate.mockResolvedValue({});
});

// ══════════════════════════════════════════════════════════
// Tests: cancelBooking → emitNotification
// ══════════════════════════════════════════════════════════
describe('cancelBooking → emitNotification', () => {
  const setupCancelBooking = (bookingOverrides = {}) => {
    const booking = makeBooking({ status: 'CONFIRMED', ...bookingOverrides });
    mockBookingFindUnique.mockResolvedValue(booking);

    // Transaction mock – executes the callback with a tx proxy
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
      mockBookingUpdate.mockResolvedValue({ ...booking, status: 'CANCELLED' });
      mockRouteUpdate.mockResolvedValue({});
      return fn(tx);
    });

    return booking;
  };

  it('should emit notification when cancelling a CONFIRMED booking', async () => {
    setupCancelBooking();
    await cancelBooking(BOOKING_ID, PASSENGER_ID, { reason: 'Changed plans' });

    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
    expect(mockEmitNotification).toHaveBeenCalledTimes(1);
    expect(mockEmitNotification).toHaveBeenCalledWith(PASSENGER_ID, expect.objectContaining({
      id: expect.any(String),
    }));
  });

  it('should NOT emit notification when cancelling a PENDING booking (no notification created)', async () => {
    setupCancelBooking({ status: 'PENDING' });
    await cancelBooking(BOOKING_ID, PASSENGER_ID, {});

    // wasConfirmed = false → no notification is created
    expect(mockNotificationCreate).not.toHaveBeenCalled();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('notification should contain PASSENGER_CONFIRMED_CANCEL kind', async () => {
    setupCancelBooking();
    await cancelBooking(BOOKING_ID, PASSENGER_ID, {});

    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: PASSENGER_ID,
          type: 'SYSTEM',
          metadata: expect.objectContaining({ kind: 'PASSENGER_CONFIRMED_CANCEL' }),
        }),
      })
    );
  });

  it('should throw 404 when booking not found', async () => {
    mockBookingFindUnique.mockResolvedValue(null);
    await expect(cancelBooking('bad-id', PASSENGER_ID, {})).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should throw 403 when passenger is not the owner', async () => {
    setupCancelBooking();
    await expect(cancelBooking(BOOKING_ID, 'wrong-user', {})).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should throw 400 when booking is already completed', async () => {
    setupCancelBooking({ status: 'COMPLETED' });
    await expect(cancelBooking(BOOKING_ID, PASSENGER_ID, {})).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// Tests: cancelRoute → emitNotification for each passenger
// ══════════════════════════════════════════════════════════
describe('cancelRoute → emitNotification per passenger', () => {
  const PASSENGER2_ID = 'passenger-002';

  const setupCancelRoute = (bookings = []) => {
    const route = makeRoute({
      bookings,
      status: 'AVAILABLE',
    });
    mockRouteFindUnique.mockResolvedValue(route);

    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        route: { update: (...args) => mockRouteUpdate(...args) },
        booking: { updateMany: (...args) => mockBookingUpdateMany(...args) },
        notification: { create: (...args) => mockNotificationCreate(...args) },
      };
      mockRouteUpdate.mockResolvedValue({});
      mockBookingUpdateMany.mockResolvedValue({ count: bookings.length });
      return fn(tx);
    });

    return route;
  };

  it('should emit notification for each affected passenger', async () => {
    setupCancelRoute([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'CONFIRMED', passenger: { id: PASSENGER_ID } },
      { id: 'b2', passengerId: PASSENGER2_ID, status: 'PENDING', passenger: { id: PASSENGER2_ID } },
    ]);

    await cancelRoute(ROUTE_ID, DRIVER_ID, 'No longer available');

    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
    expect(mockEmitNotification).toHaveBeenCalledTimes(2);
    expect(mockEmitNotification).toHaveBeenCalledWith(PASSENGER_ID, expect.anything());
    expect(mockEmitNotification).toHaveBeenCalledWith(PASSENGER2_ID, expect.anything());
  });

  it('should NOT emit notification when route has no bookings', async () => {
    setupCancelRoute([]);

    await cancelRoute(ROUTE_ID, DRIVER_ID, 'Test');

    expect(mockNotificationCreate).not.toHaveBeenCalled();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should emit notification with correct BOOKING type', async () => {
    setupCancelRoute([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'CONFIRMED', passenger: { id: PASSENGER_ID } },
    ]);

    await cancelRoute(ROUTE_ID, DRIVER_ID, 'Changed plans');

    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'BOOKING',
          userId: PASSENGER_ID,
        }),
      })
    );
  });

  it('should throw 404 when route not found', async () => {
    mockRouteFindUnique.mockResolvedValue(null);
    await expect(cancelRoute('bad', DRIVER_ID, '')).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should throw 403 when user is not the driver', async () => {
    setupCancelRoute([]);
    await expect(cancelRoute(ROUTE_ID, 'wrong-driver', '')).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// Tests: Penalty service → emitNotification
// ══════════════════════════════════════════════════════════
describe('penalty.service → emitNotification', () => {
  // We need to test the REAL penalty service so we re-require it
  // But we already mocked prisma and emitter globally, so the real service uses them
  let checkAndApplyPassengerSuspension, checkAndApplyDriverSuspension;

  beforeAll(() => {
    // The real penalty.service.js was already loaded; we need to re-require
    // because it was overridden by jest.mock above.
    // Let's get the actual module from the real file path
    const realPenalty = jest.requireActual('../services/penalty.service');
    checkAndApplyPassengerSuspension = realPenalty.checkAndApplyPassengerSuspension;
    checkAndApplyDriverSuspension = realPenalty.checkAndApplyDriverSuspension;
  });

  describe('checkAndApplyPassengerSuspension', () => {
    it('should emit notification when passenger hits cancel limit (confirmedOnly)', async () => {
      // ≥ 3 cancels → suspension
      mockNotificationCount.mockResolvedValue(3);
      mockUserUpdate.mockResolvedValue({});

      await checkAndApplyPassengerSuspension(PASSENGER_ID, { confirmedOnly: true });

      expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: PASSENGER_ID,
            type: 'SYSTEM',
            metadata: expect.objectContaining({ kind: 'PASSENGER_SUSPENSION' }),
          }),
        })
      );
      expect(mockEmitNotification).toHaveBeenCalledTimes(1);
      expect(mockEmitNotification).toHaveBeenCalledWith(PASSENGER_ID, expect.anything());
    });

    it('should NOT emit notification when cancel count below limit', async () => {
      mockNotificationCount.mockResolvedValue(1);

      await checkAndApplyPassengerSuspension(PASSENGER_ID, { confirmedOnly: true });

      expect(mockNotificationCreate).not.toHaveBeenCalled();
      expect(mockEmitNotification).not.toHaveBeenCalled();
    });

    it('should suspend user and create notification with correct data', async () => {
      mockNotificationCount.mockResolvedValue(5);
      mockUserUpdate.mockResolvedValue({});

      await checkAndApplyPassengerSuspension(PASSENGER_ID, { confirmedOnly: true });

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PASSENGER_ID },
          data: expect.objectContaining({
            passengerSuspendedUntil: expect.any(Date),
          }),
        })
      );
      expect(mockEmitNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkAndApplyDriverSuspension', () => {
    it('should emit notification when driver hits cancel limit', async () => {
      // ≥ 2 cancels → suspension
      mockRouteCount.mockResolvedValue(2);
      mockUserUpdate.mockResolvedValue({});

      await checkAndApplyDriverSuspension(DRIVER_ID);

      expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: DRIVER_ID,
            type: 'SYSTEM',
            metadata: expect.objectContaining({ kind: 'DRIVER_SUSPENSION' }),
          }),
        })
      );
      expect(mockEmitNotification).toHaveBeenCalledTimes(1);
      expect(mockEmitNotification).toHaveBeenCalledWith(DRIVER_ID, expect.anything());
    });

    it('should NOT emit notification when driver cancel count below limit', async () => {
      mockRouteCount.mockResolvedValue(1);

      await checkAndApplyDriverSuspension(DRIVER_ID);

      expect(mockNotificationCreate).not.toHaveBeenCalled();
      expect(mockEmitNotification).not.toHaveBeenCalled();
    });
  });
});

// ══════════════════════════════════════════════════════════
// Tests: noShow.service → emitNotification
// ══════════════════════════════════════════════════════════
describe('noShow.service → emitNotification', () => {
  let executeNoShow;

  beforeAll(() => {
    const realNoShow = jest.requireActual('../services/noShow.service');
    executeNoShow = realNoShow.executeNoShow;
  });

  it('should emit notification to passenger on No-Show execution', async () => {
    const pastDeadline = new Date(Date.now() - 60_000); // 1 min ago
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        noShowDeadline: pastDeadline,
        route: { ...makeRoute(), driverId: DRIVER_ID },
      })
    );
    mockBookingUpdate.mockResolvedValue({ ...makeBooking(), status: 'no_show' });

    await executeNoShow(BOOKING_ID, DRIVER_ID);

    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: PASSENGER_ID,
          type: 'SYSTEM',
          title: expect.stringContaining('ไม่มาตามนัด'),
        }),
      })
    );
    expect(mockEmitNotification).toHaveBeenCalledTimes(1);
    expect(mockEmitNotification).toHaveBeenCalledWith(PASSENGER_ID, expect.anything());
  });

  it('should throw 404 when booking not found', async () => {
    mockBookingFindUnique.mockResolvedValue(null);
    await expect(executeNoShow('bad-id', DRIVER_ID)).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should throw 403 when driver is not the route driver', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        noShowDeadline: new Date(Date.now() - 60_000),
        route: { ...makeRoute(), driverId: 'other-driver' },
      })
    );
    await expect(executeNoShow(BOOKING_ID, DRIVER_ID)).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should throw 400 when countdown has not expired', async () => {
    const futureDeadline = new Date(Date.now() + 600_000); // 10 min from now
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        noShowDeadline: futureDeadline,
        route: { ...makeRoute(), driverId: DRIVER_ID },
      })
    );

    await expect(executeNoShow(BOOKING_ID, DRIVER_ID)).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should throw 400 when no-show countdown not started', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        noShowDeadline: null,
        route: { ...makeRoute(), driverId: DRIVER_ID },
      })
    );

    await expect(executeNoShow(BOOKING_ID, DRIVER_ID)).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// Tests: arrivalNotification.service → emitNotification
// ══════════════════════════════════════════════════════════
describe('arrivalNotification.service → emitNotification', () => {
  let checkAndNotify;

  beforeAll(() => {
    const realArrival = jest.requireActual('../services/arrivalNotification.service');
    checkAndNotify = realArrival.checkAndNotify;
  });

  it('should emit notification for in-app arrival and personal feed', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        status: 'CONFIRMED',
        passenger: { id: PASSENGER_ID, email: 'test@test.com', firstName: 'สมชาย' },
        route: {
          driverId: DRIVER_ID,
          driver: { firstName: 'วิทยา' },
        },
      })
    );
    mockArrivalNotifCreate.mockResolvedValue({ id: 'arrival-1', radiusType: 'ZERO_KM' });

    await checkAndNotify(BOOKING_ID, 16.4, 102.8);

    // Should call emitNotification at least twice:
    // 1) In-app notification (prisma.notification.create)
    // 2) Personal feed push (emitNotification with constructed object)
    expect(mockEmitNotification).toHaveBeenCalled();
    expect(mockEmitNotification).toHaveBeenCalledWith(PASSENGER_ID, expect.anything());
  });

  it('should create notification with ARRIVAL type', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        status: 'CONFIRMED',
        passenger: { id: PASSENGER_ID, email: 'test@test.com', firstName: 'สมชาย' },
        route: {
          driverId: DRIVER_ID,
          driver: { firstName: 'วิทยา' },
        },
      })
    );
    mockArrivalNotifCreate.mockResolvedValue({ id: 'arrival-1', radiusType: 'ZERO_KM' });

    await checkAndNotify(BOOKING_ID, 16.4, 102.8);

    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: PASSENGER_ID,
          type: 'ARRIVAL',
        }),
      })
    );
  });

  it('should throw 404 when booking not found', async () => {
    mockBookingFindUnique.mockResolvedValue(null);
    await expect(checkAndNotify('bad-id', 16.4, 102.8)).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });

  it('should throw 400 when booking is not active', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        status: 'CANCELLED',
        passenger: { id: PASSENGER_ID, email: 'test@test.com', firstName: 'สมชาย' },
        route: { driverId: DRIVER_ID, driver: { firstName: 'วิทยา' } },
      })
    );

    await expect(checkAndNotify(BOOKING_ID, 16.4, 102.8)).rejects.toThrow();
    expect(mockEmitNotification).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// Tests: notification count vs emitNotification count
// ══════════════════════════════════════════════════════════
describe('emitNotification parity with notification.create', () => {
  it('every notification.create should trigger exactly one emitNotification (cancelBooking confirmed)', async () => {
    const booking = makeBooking({ status: 'CONFIRMED' });
    mockBookingFindUnique.mockResolvedValue(booking);

    let createCount = 0;
    mockNotificationCreate.mockImplementation((...args) => {
      createCount++;
      return Promise.resolve(fakeNotification(`notif-${createCount}`));
    });

    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        booking: { update: (...args) => mockBookingUpdate(...args) },
        route: { update: (...args) => mockRouteUpdate(...args) },
        notification: { create: (...args) => mockNotificationCreate(...args) },
      };
      mockBookingUpdate.mockResolvedValue({ ...booking, status: 'CANCELLED' });
      mockRouteUpdate.mockResolvedValue({});
      return fn(tx);
    });

    await cancelBooking(BOOKING_ID, PASSENGER_ID, {});

    // For a confirmed booking cancel: 1 create → 1 emit
    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
    expect(mockEmitNotification).toHaveBeenCalledTimes(1);
  });

  it('cancelRoute with 3 passengers creates 3 notifications and emits 3 times', async () => {
    const bookings = [
      { id: 'b1', passengerId: 'p1', status: 'CONFIRMED', passenger: { id: 'p1' } },
      { id: 'b2', passengerId: 'p2', status: 'CONFIRMED', passenger: { id: 'p2' } },
      { id: 'b3', passengerId: 'p3', status: 'PENDING', passenger: { id: 'p3' } },
    ];
    const route = makeRoute({ bookings, status: 'AVAILABLE' });
    mockRouteFindUnique.mockResolvedValue(route);

    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        route: { update: (...args) => mockRouteUpdate(...args) },
        booking: { updateMany: (...args) => mockBookingUpdateMany(...args) },
        notification: { create: (...args) => mockNotificationCreate(...args) },
      };
      mockRouteUpdate.mockResolvedValue({});
      mockBookingUpdateMany.mockResolvedValue({ count: 3 });
      return fn(tx);
    });

    await cancelRoute(ROUTE_ID, DRIVER_ID, 'Test');

    expect(mockNotificationCreate).toHaveBeenCalledTimes(3);
    expect(mockEmitNotification).toHaveBeenCalledTimes(3);

    // Each passenger should receive their own notification
    expect(mockEmitNotification).toHaveBeenCalledWith('p1', expect.anything());
    expect(mockEmitNotification).toHaveBeenCalledWith('p2', expect.anything());
    expect(mockEmitNotification).toHaveBeenCalledWith('p3', expect.anything());
  });
});


// ══════════════════════════════════════════════════════════
// EMAIL NOTIFICATION TESTS
// ══════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────
// updateBookingStatus → email per status
// ──────────────────────────────────────────────────────────
describe('updateBookingStatus → email notifications', () => {
  const PASSENGER_EMAIL = 'test@test.com';

  const setupBookingStatus = (statusOverrides = {}) => {
    const booking = makeBooking({
      passenger: {
        id: PASSENGER_ID,
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        email: PASSENGER_EMAIL,
      },
      route: makeRoute({
        driver: { id: DRIVER_ID, firstName: 'วิทยา', lastName: 'สมบูรณ์', email: 'driver@test.com' },
      }),
      ...statusOverrides,
    });
    mockBookingFindUnique.mockResolvedValue(booking);

    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        booking: { update: (...args) => mockBookingUpdate(...args) },
        route: { update: (...args) => mockRouteUpdate(...args) },
        notification: { create: (...args) => mockNotificationCreate(...args) },
      };
      mockBookingUpdate.mockResolvedValue({ ...booking, status: statusOverrides.status || 'CONFIRMED' });
      mockRouteUpdate.mockResolvedValue({});
      return fn(tx);
    });

    return booking;
  };

  it('should send sendBookingConfirmedEmail when status → CONFIRMED', async () => {
    setupBookingStatus({ status: 'PENDING' });

    await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

    expect(mockSendBookingConfirmedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendBookingConfirmedEmail).toHaveBeenCalledWith(
      PASSENGER_EMAIL,
      expect.objectContaining({
        passengerName: 'สมชาย ใจดี',
        driverName: 'วิทยา สมบูรณ์',
      })
    );
  });

  it('should send sendBookingRejectedEmail when status → REJECTED', async () => {
    setupBookingStatus({ status: 'PENDING' });

    await updateBookingStatus(BOOKING_ID, 'REJECTED', DRIVER_ID);

    expect(mockSendBookingRejectedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendBookingRejectedEmail).toHaveBeenCalledWith(
      PASSENGER_EMAIL,
      expect.objectContaining({ passengerName: 'สมชาย ใจดี' })
    );
  });

  it('should send sendPassengerPickedUpEmail when status → IN_PROGRESS', async () => {
    setupBookingStatus({ status: 'CONFIRMED' });

    await updateBookingStatus(BOOKING_ID, 'IN_PROGRESS', DRIVER_ID);

    expect(mockSendPassengerPickedUpEmail).toHaveBeenCalledTimes(1);
    expect(mockSendPassengerPickedUpEmail).toHaveBeenCalledWith(
      PASSENGER_EMAIL,
      expect.objectContaining({ passengerName: 'สมชาย ใจดี' })
    );
  });

  it('should send sendReviewReminderEmail when status → COMPLETED', async () => {
    setupBookingStatus({ status: 'IN_PROGRESS' });

    await updateBookingStatus(BOOKING_ID, 'COMPLETED', DRIVER_ID);

    expect(mockSendReviewReminderEmail).toHaveBeenCalledTimes(1);
    expect(mockSendReviewReminderEmail).toHaveBeenCalledWith(
      PASSENGER_EMAIL,
      expect.objectContaining({ passengerName: 'สมชาย ใจดี' })
    );
  });

  it('should NOT send any email when passenger has no email', async () => {
    setupBookingStatus({
      status: 'PENDING',
      passenger: { id: PASSENGER_ID, firstName: 'Test', lastName: 'User', email: null },
    });

    await updateBookingStatus(BOOKING_ID, 'CONFIRMED', DRIVER_ID);

    expect(mockSendBookingConfirmedEmail).not.toHaveBeenCalled();
    expect(mockSendBookingRejectedEmail).not.toHaveBeenCalled();
    expect(mockSendPassengerPickedUpEmail).not.toHaveBeenCalled();
    expect(mockSendReviewReminderEmail).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────
// startTrip → sendTripStartedEmail per passenger
// ──────────────────────────────────────────────────────────
describe('startTrip → email notifications', () => {
  const PASSENGER2_ID = 'passenger-002';

  const setupStartTrip = (bookings = []) => {
    const route = makeRoute({
      status: 'AVAILABLE',
      driver: { firstName: 'วิทยา', lastName: 'สมบูรณ์' },
      bookings,
    });
    mockRouteFindUnique.mockResolvedValue(route);

    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        route: { update: (...args) => mockRouteUpdate(...args) },
        notification: { create: (...args) => mockNotificationCreate(...args) },
      };
      mockRouteUpdate.mockResolvedValue({ ...route, status: 'IN_TRANSIT' });
      return fn(tx);
    });

    return route;
  };

  it('should send sendTripStartedEmail to each passenger with email', async () => {
    setupStartTrip([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'CONFIRMED', passenger: { id: PASSENGER_ID, firstName: 'สมชาย', lastName: 'ใจดี', email: 'p1@test.com' } },
      { id: 'b2', passengerId: PASSENGER2_ID, status: 'CONFIRMED', passenger: { id: PASSENGER2_ID, firstName: 'สมหญิง', lastName: 'ใจดี', email: 'p2@test.com' } },
    ]);

    await startTrip(ROUTE_ID, DRIVER_ID);

    expect(mockSendTripStartedEmail).toHaveBeenCalledTimes(2);
    expect(mockSendTripStartedEmail).toHaveBeenCalledWith(
      'p1@test.com',
      expect.objectContaining({
        passengerName: 'สมชาย ใจดี',
        driverName: 'วิทยา สมบูรณ์',
      })
    );
    expect(mockSendTripStartedEmail).toHaveBeenCalledWith(
      'p2@test.com',
      expect.objectContaining({
        passengerName: 'สมหญิง ใจดี',
      })
    );
  });

  it('should NOT send email to passenger without email', async () => {
    setupStartTrip([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'CONFIRMED', passenger: { id: PASSENGER_ID, firstName: 'สมชาย', lastName: 'ใจดี', email: null } },
    ]);

    await startTrip(ROUTE_ID, DRIVER_ID);

    expect(mockSendTripStartedEmail).not.toHaveBeenCalled();
  });

  it('should send both emitNotification and email per passenger', async () => {
    setupStartTrip([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'CONFIRMED', passenger: { id: PASSENGER_ID, firstName: 'สมชาย', lastName: 'ใจดี', email: 'p1@test.com' } },
    ]);

    await startTrip(ROUTE_ID, DRIVER_ID);

    expect(mockEmitNotification).toHaveBeenCalledTimes(1);
    expect(mockSendTripStartedEmail).toHaveBeenCalledTimes(1);
  });

  it('should throw 404 when route not found', async () => {
    mockRouteFindUnique.mockResolvedValue(null);
    await expect(startTrip('bad', DRIVER_ID)).rejects.toThrow();
    expect(mockSendTripStartedEmail).not.toHaveBeenCalled();
  });

  it('should throw 403 when user is not the driver', async () => {
    setupStartTrip([]);
    await expect(startTrip(ROUTE_ID, 'wrong-driver')).rejects.toThrow();
    expect(mockSendTripStartedEmail).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────
// endTrip → sendReviewReminderEmail per passenger
// ──────────────────────────────────────────────────────────
describe('endTrip → email notifications', () => {
  const PASSENGER2_ID = 'passenger-002';

  const setupEndTrip = (bookings = []) => {
    const route = makeRoute({
      status: 'IN_TRANSIT',
      driver: { firstName: 'วิทยา', lastName: 'สมบูรณ์' },
      bookings,
    });
    mockRouteFindUnique.mockResolvedValue(route);

    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        route: { update: (...args) => mockRouteUpdate(...args) },
        booking: { updateMany: (...args) => mockBookingUpdateMany(...args) },
        notification: { create: (...args) => mockNotificationCreate(...args) },
      };
      mockRouteUpdate.mockResolvedValue({ ...route, status: 'COMPLETED' });
      mockBookingUpdateMany.mockResolvedValue({ count: bookings.length });
      return fn(tx);
    });

    return route;
  };

  it('should send sendReviewReminderEmail to each passenger', async () => {
    setupEndTrip([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'IN_PROGRESS', passenger: { id: PASSENGER_ID, firstName: 'สมชาย', lastName: 'ใจดี', email: 'p1@test.com' } },
      { id: 'b2', passengerId: PASSENGER2_ID, status: 'CONFIRMED', passenger: { id: PASSENGER2_ID, firstName: 'สมหญิง', lastName: 'ใจดี', email: 'p2@test.com' } },
    ]);

    await endTrip(ROUTE_ID, DRIVER_ID);

    expect(mockSendReviewReminderEmail).toHaveBeenCalledTimes(2);
    expect(mockSendReviewReminderEmail).toHaveBeenCalledWith(
      'p1@test.com',
      expect.objectContaining({
        passengerName: 'สมชาย ใจดี',
        driverName: 'วิทยา สมบูรณ์',
      })
    );
    expect(mockSendReviewReminderEmail).toHaveBeenCalledWith(
      'p2@test.com',
      expect.objectContaining({
        passengerName: 'สมหญิง ใจดี',
      })
    );
  });

  it('should NOT send email to passenger without email', async () => {
    setupEndTrip([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'IN_PROGRESS', passenger: { id: PASSENGER_ID, firstName: 'สมชาย', lastName: '', email: null } },
    ]);

    await endTrip(ROUTE_ID, DRIVER_ID);

    expect(mockSendReviewReminderEmail).not.toHaveBeenCalled();
  });

  it('should send both emitNotification and email per passenger', async () => {
    setupEndTrip([
      { id: 'b1', passengerId: PASSENGER_ID, status: 'CONFIRMED', passenger: { id: PASSENGER_ID, firstName: 'สมชาย', lastName: 'ใจดี', email: 'p1@test.com' } },
    ]);

    await endTrip(ROUTE_ID, DRIVER_ID);

    expect(mockEmitNotification).toHaveBeenCalledTimes(1);
    expect(mockSendReviewReminderEmail).toHaveBeenCalledTimes(1);
  });

  it('should throw 400 when route not IN_TRANSIT', async () => {
    const route = makeRoute({ status: 'AVAILABLE', bookings: [] });
    mockRouteFindUnique.mockResolvedValue(route);
    await expect(endTrip(ROUTE_ID, DRIVER_ID)).rejects.toThrow();
    expect(mockSendReviewReminderEmail).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────
// arrivalNotification → sendArrivalEmail
// ──────────────────────────────────────────────────────────
describe('arrivalNotification → email notifications', () => {
  let checkAndNotify;

  beforeAll(() => {
    const realArrival = jest.requireActual('../services/arrivalNotification.service');
    checkAndNotify = realArrival.checkAndNotify;
  });

  it('should send sendArrivalEmail to passenger with valid email', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        status: 'CONFIRMED',
        passenger: { id: PASSENGER_ID, email: 'test@test.com', firstName: 'สมชาย' },
        route: {
          driverId: DRIVER_ID,
          driver: { firstName: 'วิทยา' },
        },
      })
    );
    mockArrivalNotifCreate.mockResolvedValue({ id: 'arrival-1', radiusType: 'ZERO_KM' });

    await checkAndNotify(BOOKING_ID, 16.4, 102.8);

    expect(mockSendArrivalEmail).toHaveBeenCalledTimes(1);
    expect(mockSendArrivalEmail).toHaveBeenCalledWith(
      'test@test.com',
      'ZERO_KM',
      expect.objectContaining({
        passengerName: 'สมชาย',
        driverName: 'วิทยา',
        bookingId: BOOKING_ID,
      })
    );
  });

  it('should NOT send email when passenger email is @removed.local', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        status: 'CONFIRMED',
        passenger: { id: PASSENGER_ID, email: 'deleted@removed.local', firstName: 'สมชาย' },
        route: {
          driverId: DRIVER_ID,
          driver: { firstName: 'วิทยา' },
        },
      })
    );
    mockArrivalNotifCreate.mockResolvedValue({ id: 'arrival-1', radiusType: 'ZERO_KM' });

    await checkAndNotify(BOOKING_ID, 16.4, 102.8);

    expect(mockSendArrivalEmail).not.toHaveBeenCalled();
  });

  it('should NOT send email when passenger has no email', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        status: 'CONFIRMED',
        passenger: { id: PASSENGER_ID, email: null, firstName: 'สมชาย' },
        route: {
          driverId: DRIVER_ID,
          driver: { firstName: 'วิทยา' },
        },
      })
    );
    mockArrivalNotifCreate.mockResolvedValue({ id: 'arrival-1', radiusType: 'ZERO_KM' });

    await checkAndNotify(BOOKING_ID, 16.4, 102.8);

    expect(mockSendArrivalEmail).not.toHaveBeenCalled();
  });

  it('should send both emitNotification and email together', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        status: 'CONFIRMED',
        passenger: { id: PASSENGER_ID, email: 'test@test.com', firstName: 'สมชาย' },
        route: {
          driverId: DRIVER_ID,
          driver: { firstName: 'วิทยา' },
        },
      })
    );
    mockArrivalNotifCreate.mockResolvedValue({ id: 'arrival-1', radiusType: 'ZERO_KM' });

    await checkAndNotify(BOOKING_ID, 16.4, 102.8);

    expect(mockEmitNotification).toHaveBeenCalled();
    expect(mockSendArrivalEmail).toHaveBeenCalled();
  });
});
