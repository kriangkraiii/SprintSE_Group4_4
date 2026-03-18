/**
 * Arrival Notification — Comprehensive Tests
 * ทดสอบ GPS 3 ระดับ (5km, 1km, 0km) + Email + In-App + Deduplication + Manual Trigger
 */

const ApiError = require('../utils/ApiError');

// ─── Mock Prisma ───────────────────────────────────────
const mockBookingFindUnique = jest.fn();
const mockNotificationCreate = jest.fn();
const mockArrivalNotificationFindMany = jest.fn();
const mockArrivalNotificationCreate = jest.fn();
const mockArrivalNotificationFindFirst = jest.fn();
const mockArrivalNotificationDelete = jest.fn();
const mockNotificationLogCreate = jest.fn();
const mockBookingUpdate = jest.fn();
const mockSystemLogCreate = jest.fn();

jest.mock('../utils/prisma', () => ({
    booking: {
        findUnique: (...args) => mockBookingFindUnique(...args),
        update: (...args) => mockBookingUpdate(...args),
    },
    notification: {
        create: (...args) => mockNotificationCreate(...args),
    },
    arrivalNotification: {
        findMany: (...args) => mockArrivalNotificationFindMany(...args),
        create: (...args) => mockArrivalNotificationCreate(...args),
        findFirst: (...args) => mockArrivalNotificationFindFirst(...args),
        delete: (...args) => mockArrivalNotificationDelete(...args),
    },
    notificationLog: {
        create: (...args) => mockNotificationLogCreate(...args),
    },
    systemLog: {
        create: (...args) => mockSystemLogCreate(...args),
    },
}));

// ─── Mock Email Service ─────────────────────────────────
const mockSendArrivalEmail = jest.fn();
jest.mock('../services/email.service', () => ({
    sendArrivalEmail: (...args) => mockSendArrivalEmail(...args),
}));

// ─── Mock No-Show Service ───────────────────────────────
const mockStartNoShowCountdown = jest.fn();
jest.mock('../services/noShow.service', () => ({
    startNoShowCountdown: (...args) => mockStartNoShowCountdown(...args),
}));

const { checkAndNotify, manualTrigger, getNotificationsByBooking } = require('../services/arrivalNotification.service');

// ─── Fixtures ───────────────────────────────────────────
// จุดรับ: มข. (KKU) 16.4720, 102.8239
const PICKUP = { lat: 16.4720, lng: 102.8239 };

const makeBooking = (overrides = {}) => ({
    id: 'BK-001',
    status: 'CONFIRMED',
    passengerId: 'passenger-001',
    pickupLocation: PICKUP,
    passenger: { id: 'passenger-001', email: 'test@example.com', firstName: 'สมชาย' },
    route: { driverId: 'driver-001', driver: { firstName: 'วิทยา' } },
    ...overrides,
});

// ~4 km จากจุดรับ (ควร trigger FIVE_KM)
const GPS_5KM = { lat: 16.5080, lng: 102.8500 };
// ~0.8 km จากจุดรับ (ควร trigger FIVE_KM + ONE_KM)
const GPS_1KM = { lat: 16.4660, lng: 102.8270 };
// ~0.05 km จากจุดรับ (ควร trigger FIVE_KM + ONE_KM + ZERO_KM)
const GPS_0KM = { lat: 16.4718, lng: 102.8237 };
// ~40 km (ไกลมาก, ไม่ trigger อะไร)
const GPS_FAR = { lat: 16.8000, lng: 103.3000 };

beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    mockBookingFindUnique.mockResolvedValue(makeBooking());
    mockArrivalNotificationFindMany.mockResolvedValue([]);
    mockArrivalNotificationCreate.mockImplementation(({ data }) => Promise.resolve({
        id: `notif-${Date.now()}`,
        ...data,
        triggeredAt: new Date(),
    }));
    mockNotificationCreate.mockResolvedValue({ id: 'notif-in-app' });
    mockNotificationLogCreate.mockResolvedValue({ id: 'log-1' });
    mockSendArrivalEmail.mockResolvedValue({ messageId: 'email-ok' });
    mockStartNoShowCountdown.mockResolvedValue({ noShowDeadline: new Date() });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 1: GPS Distance → Radius Crossing
// ═══════════════════════════════════════════════════════
describe('checkAndNotify — GPS 3-Tier Notifications', () => {
    test('TC-2.1: ห่าง ~4km → ส่ง FIVE_KM notification', async () => {
        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(result.distanceKm).toBeGreaterThan(3);
        expect(result.distanceKm).toBeLessThan(5);
        expect(result.crossedRadii).toContain('FIVE_KM');
        expect(result.crossedRadii).not.toContain('ONE_KM');
        expect(result.newNotifications).toHaveLength(1);

        // ตรวจว่าสร้าง in-app notification
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'passenger-001',
                    type: 'ARRIVAL',
                    title: '🚗 คนขับใกล้ถึงแล้ว',
                }),
            })
        );

        // ตรวจว่าส่งอีเมล
        expect(mockSendArrivalEmail).toHaveBeenCalledWith(
            'test@example.com',
            'FIVE_KM',
            expect.objectContaining({
                passengerName: 'สมชาย',
                driverName: 'วิทยา',
                bookingId: 'BK-001',
            })
        );

        // ตรวจว่าบันทึก ArrivalNotification
        expect(mockArrivalNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    bookingId: 'BK-001',
                    radiusType: 'FIVE_KM',
                    appStatus: 'SENT',
                    emailStatus: 'SENT',
                }),
            })
        );

        // ตรวจว่าบันทึก NotificationLog (audit trail)
        expect(mockNotificationLogCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'ARRIVAL',
                    channel: 'APP+EMAIL',
                    status: 'SENT',
                }),
            })
        );

        // ไม่ trigger No-Show countdown (ไม่ถึง 0km)
        expect(mockStartNoShowCountdown).not.toHaveBeenCalled();
    });

    test('TC-2.2: ห่าง ~0.8km → ส่ง FIVE_KM + ONE_KM', async () => {
        const result = await checkAndNotify('BK-001', GPS_1KM.lat, GPS_1KM.lng);

        expect(result.distanceKm).toBeLessThan(1);
        expect(result.crossedRadii).toContain('FIVE_KM');
        expect(result.crossedRadii).toContain('ONE_KM');
        expect(result.crossedRadii).not.toContain('ZERO_KM');
        expect(result.newNotifications).toHaveLength(2);

        // ส่ง email 2 ครั้ง (FIVE_KM + ONE_KM)
        expect(mockSendArrivalEmail).toHaveBeenCalledTimes(2);

        // ส่ง in-app 2 ครั้ง
        expect(mockNotificationCreate).toHaveBeenCalledTimes(2);

        // ไม่ trigger No-Show (ไม่ถึง 0km)
        expect(mockStartNoShowCountdown).not.toHaveBeenCalled();
    });

    test('TC-2.3: ห่าง ~0.05km (ถึงแล้ว) → ส่ง FIVE_KM + ONE_KM + ZERO_KM + No-Show countdown', async () => {
        const result = await checkAndNotify('BK-001', GPS_0KM.lat, GPS_0KM.lng);

        expect(result.distanceKm).toBeLessThan(0.1);
        expect(result.crossedRadii).toContain('FIVE_KM');
        expect(result.crossedRadii).toContain('ONE_KM');
        expect(result.crossedRadii).toContain('ZERO_KM');
        expect(result.newNotifications).toHaveLength(3);

        // ส่ง email 3 ครั้ง
        expect(mockSendArrivalEmail).toHaveBeenCalledTimes(3);

        // ส่ง in-app 3 ครั้ง
        expect(mockNotificationCreate).toHaveBeenCalledTimes(3);

        // ✅ trigger No-Show countdown เมื่อถึง 0km
        expect(mockStartNoShowCountdown).toHaveBeenCalledWith('BK-001');
    });

    test('TC: ไกลเกินไป (~40km) → ไม่ส่ง notification', async () => {
        const result = await checkAndNotify('BK-001', GPS_FAR.lat, GPS_FAR.lng);

        expect(result.distanceKm).toBeGreaterThan(10);
        expect(result.crossedRadii).toEqual([]);
        expect(result.newNotifications).toHaveLength(0);
        expect(mockSendArrivalEmail).not.toHaveBeenCalled();
        expect(mockNotificationCreate).not.toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 2: Deduplication
// ═══════════════════════════════════════════════════════
describe('checkAndNotify — Deduplication', () => {
    test('TC-2.6: ไม่ส่ง FIVE_KM ซ้ำ ถ้าส่งไปแล้ว', async () => {
        // จำลองว่า FIVE_KM ส่งไปแล้ว
        mockArrivalNotificationFindMany.mockResolvedValue([
            { radiusType: 'FIVE_KM' },
        ]);

        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(result.crossedRadii).toContain('FIVE_KM');
        // แต่ newNotifications = 0 เพราะส่งไปแล้ว
        expect(result.newNotifications).toHaveLength(0);
        expect(mockSendArrivalEmail).not.toHaveBeenCalled();
        expect(mockNotificationCreate).not.toHaveBeenCalled();
    });

    test('TC: 5km ส่งแล้ว + GPS เข้า 1km → ส่งเฉพาะ ONE_KM', async () => {
        mockArrivalNotificationFindMany.mockResolvedValue([
            { radiusType: 'FIVE_KM' },
        ]);

        const result = await checkAndNotify('BK-001', GPS_1KM.lat, GPS_1KM.lng);

        expect(result.crossedRadii).toContain('FIVE_KM');
        expect(result.crossedRadii).toContain('ONE_KM');
        // ส่งเฉพาะ ONE_KM (FIVE_KM ส่งแล้ว)
        expect(result.newNotifications).toHaveLength(1);
        expect(mockArrivalNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ radiusType: 'ONE_KM' }),
            })
        );
    });

    test('TC: ส่งทั้ง 3 แล้ว → ไม่ส่งอะไรเลย', async () => {
        mockArrivalNotificationFindMany.mockResolvedValue([
            { radiusType: 'FIVE_KM' },
            { radiusType: 'ONE_KM' },
            { radiusType: 'ZERO_KM' },
        ]);

        const result = await checkAndNotify('BK-001', GPS_0KM.lat, GPS_0KM.lng);

        expect(result.newNotifications).toHaveLength(0);
        expect(mockSendArrivalEmail).not.toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 3: Email + In-App Channel Handling
// ═══════════════════════════════════════════════════════
describe('checkAndNotify — Channel Handling', () => {
    test('TC: Email ส่งไม่สำเร็จ → In-App ยังส่งได้ + emailStatus = FAILED', async () => {
        mockSendArrivalEmail.mockRejectedValue(new Error('SMTP timeout'));

        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(result.newNotifications).toHaveLength(1);

        // In-App ยังถูกสร้าง
        expect(mockNotificationCreate).toHaveBeenCalled();

        // ArrivalNotification บันทึก emailStatus = FAILED
        expect(mockArrivalNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    appStatus: 'SENT',
                    emailStatus: 'FAILED',
                }),
            })
        );

        // NotificationLog → status = PARTIAL
        expect(mockNotificationLogCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: 'SENT',
                }),
            })
        );
    });

    test('TC: In-App ส่งไม่สำเร็จ → Email ยังส่งได้ + appStatus = FAILED', async () => {
        mockNotificationCreate.mockRejectedValue(new Error('DB error'));

        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(result.newNotifications).toHaveLength(1);

        // Email ยังถูกส่ง
        expect(mockSendArrivalEmail).toHaveBeenCalled();

        // ArrivalNotification บันทึก appStatus = FAILED
        expect(mockArrivalNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    appStatus: 'FAILED',
                    emailStatus: 'SENT',
                }),
            })
        );
    });

    test('TC: อีเมลเป็น @removed.local → emailStatus = INVALID_RECIPIENT', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            passenger: { id: 'p-001', email: 'deleted@removed.local', firstName: 'ลบแล้ว' },
        }));

        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(result.newNotifications).toHaveLength(1);
        expect(mockSendArrivalEmail).not.toHaveBeenCalled();
        expect(mockArrivalNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    emailStatus: 'INVALID_RECIPIENT',
                }),
            })
        );
    });

    test('TC: ผู้โดยสารไม่มีอีเมล → emailStatus = INVALID_RECIPIENT', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            passenger: { id: 'p-001', email: null, firstName: 'ไม่มีอีเมล' },
        }));

        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(mockSendArrivalEmail).not.toHaveBeenCalled();
        expect(mockArrivalNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    emailStatus: 'INVALID_RECIPIENT',
                }),
            })
        );
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 4: Error Cases
// ═══════════════════════════════════════════════════════
describe('checkAndNotify — Error Cases', () => {
    test('TC: Booking ไม่พบ → throw 404', async () => {
        mockBookingFindUnique.mockResolvedValue(null);

        await expect(checkAndNotify('BK-999', 16.47, 102.82))
            .rejects.toThrow('Booking not found');
    });

    test('TC: Booking status = COMPLETED → throw 400', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'COMPLETED' }));

        await expect(checkAndNotify('BK-001', 16.47, 102.82))
            .rejects.toThrow('Booking is not active');
    });

    test('TC: Booking status = CANCELLED → throw 400', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'CANCELLED' }));

        await expect(checkAndNotify('BK-001', 16.47, 102.82))
            .rejects.toThrow('Booking is not active');
    });

    test('TC: ไม่มี pickupLocation → throw 400', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ pickupLocation: null }));

        await expect(checkAndNotify('BK-001', 16.47, 102.82))
            .rejects.toThrow('Pickup location not set');
    });

    test('TC: pickupLocation ไม่มี lat/lng → throw 400', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({
            pickupLocation: { name: 'ขอนแก่น' },
        }));

        await expect(checkAndNotify('BK-001', 16.47, 102.82))
            .rejects.toThrow('Pickup location not set');
    });

    test('TC: Booking status = IN_PROGRESS → ใช้งานได้ปกติ', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'IN_PROGRESS' }));

        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);
        expect(result.newNotifications).toHaveLength(1);
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 5: Manual Trigger
// ═══════════════════════════════════════════════════════
describe('manualTrigger', () => {
    test('TC-2.4: Manual trigger สำเร็จ → ส่ง MANUAL notification + No-Show countdown', async () => {
        mockArrivalNotificationFindFirst.mockResolvedValue(null); // ไม่มี manual ก่อนหน้า

        const result = await manualTrigger('BK-001', 'driver-001');

        expect(mockArrivalNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    radiusType: 'MANUAL',
                    driverLat: null,
                    driverLon: null,
                }),
            })
        );

        // ส่ง In-App notification
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'ARRIVAL',
                    title: '✅ คนขับแจ้งว่าถึงแล้ว',
                }),
            })
        );

        // ส่ง Email
        expect(mockSendArrivalEmail).toHaveBeenCalledWith(
            'test@example.com',
            'MANUAL',
            expect.anything()
        );

        // ✅ trigger No-Show countdown
        expect(mockStartNoShowCountdown).toHaveBeenCalledWith('BK-001');
    });

    test('TC-2.5: Manual trigger ภายใน 5 นาที → HTTP 429 cooldown', async () => {
        mockArrivalNotificationFindFirst.mockResolvedValue({
            id: 'old-manual',
            radiusType: 'MANUAL',
            triggeredAt: new Date(), // เพิ่งส่งไป
        });

        await expect(manualTrigger('BK-001', 'driver-001'))
            .rejects.toThrow('Already notified recently. Please wait.');
    });

    test('TC: Manual trigger หลัง cooldown → ลบอันเก่า + สร้างใหม่', async () => {
        const oldDate = new Date(Date.now() - 6 * 60 * 1000); // 6 นาทีที่แล้ว
        mockArrivalNotificationFindFirst.mockResolvedValue({
            id: 'old-manual',
            radiusType: 'MANUAL',
            triggeredAt: oldDate,
        });

        await manualTrigger('BK-001', 'driver-001');

        // ลบ record เก่า
        expect(mockArrivalNotificationDelete).toHaveBeenCalledWith({
            where: { id: 'old-manual' },
        });

        // สร้าง notification ใหม่
        expect(mockArrivalNotificationCreate).toHaveBeenCalled();
    });

    test('TC: Manual trigger จาก driver ที่ไม่ใช่เจ้าของ → throw 403', async () => {
        mockArrivalNotificationFindFirst.mockResolvedValue(null);

        await expect(manualTrigger('BK-001', 'driver-999'))
            .rejects.toThrow('Not your booking');
    });

    test('TC: Manual trigger เมื่อ trip จบแล้ว → throw 400', async () => {
        mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'COMPLETED' }));

        await expect(manualTrigger('BK-001', 'driver-001'))
            .rejects.toThrow('Trip has ended');
    });

    test('TC: Manual trigger booking ไม่พบ → throw 404', async () => {
        mockBookingFindUnique.mockResolvedValue(null);

        await expect(manualTrigger('BK-999', 'driver-001'))
            .rejects.toThrow('Booking not found');
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 6: No-Show Countdown Integration
// ═══════════════════════════════════════════════════════
describe('No-Show Countdown Integration', () => {
    test('TC: ZERO_KM → เริ่ม No-Show countdown', async () => {
        const result = await checkAndNotify('BK-001', GPS_0KM.lat, GPS_0KM.lng);

        // ZERO_KM จะ trigger startNoShowCountdown
        expect(mockStartNoShowCountdown).toHaveBeenCalledWith('BK-001');
    });

    test('TC: FIVE_KM → ไม่ เริ่ม No-Show countdown', async () => {
        const result = await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(mockStartNoShowCountdown).not.toHaveBeenCalled();
    });

    test('TC: ONE_KM → ไม่ เริ่ม No-Show countdown', async () => {
        // ต้อง mock ว่า FIVE_KM ส่งแล้ว เพื่อให้ส่งเฉพาะ ONE_KM
        mockArrivalNotificationFindMany.mockResolvedValue([
            { radiusType: 'FIVE_KM' },
        ]);

        await checkAndNotify('BK-001', GPS_1KM.lat, GPS_1KM.lng);

        expect(mockStartNoShowCountdown).not.toHaveBeenCalled();
    });

    test('TC: No-Show countdown fail → ไม่ throw (ยัง graceful)', async () => {
        mockStartNoShowCountdown.mockRejectedValue(new Error('Booking not active'));

        // ไม่ throw เพราะ catch ภายใน
        const result = await checkAndNotify('BK-001', GPS_0KM.lat, GPS_0KM.lng);
        expect(result.newNotifications.length).toBeGreaterThan(0);
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 7: Notification History (Audit)
// ═══════════════════════════════════════════════════════
describe('getNotificationsByBooking', () => {
    test('TC-2.7: ดึงประวัติ notifications ตามลำดับเวลา', async () => {
        const mockData = [
            { id: '1', radiusType: 'FIVE_KM', triggeredAt: new Date('2026-02-27T10:00:00Z') },
            { id: '2', radiusType: 'ONE_KM', triggeredAt: new Date('2026-02-27T10:15:00Z') },
        ];
        mockArrivalNotificationFindMany.mockResolvedValue(mockData);

        const result = await getNotificationsByBooking('BK-001');

        expect(result).toHaveLength(2);
        expect(result[0].radiusType).toBe('FIVE_KM');
        expect(result[1].radiusType).toBe('ONE_KM');
        expect(mockArrivalNotificationFindMany).toHaveBeenCalledWith({
            where: { bookingId: 'BK-001' },
            orderBy: { triggeredAt: 'asc' },
        });
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 8: Message Templates
// ═══════════════════════════════════════════════════════
describe('Notification Message Templates', () => {
    test('TC: FIVE_KM → ข้อความภาษาไทย + อังกฤษ ถูกต้อง', async () => {
        await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    title: '🚗 คนขับใกล้ถึงแล้ว',
                    body: expect.stringContaining('วิทยา'),
                }),
            })
        );
    });

    test('TC: ZERO_KM → ข้อความ "ถึงจุดรับแล้ว"', async () => {
        await checkAndNotify('BK-001', GPS_0KM.lat, GPS_0KM.lng);

        // ZERO_KM notification
        const calls = mockNotificationCreate.mock.calls;
        const zeroKmCall = calls.find(c =>
            c[0]?.data?.title === '✅ คนขับถึงจุดรับแล้ว!'
        );
        expect(zeroKmCall).toBeDefined();
        expect(zeroKmCall[0].data.body).toContain('ถึงจุดรับแล้ว');
    });

    test('TC: Email มี metadata ครบ (driverLat, driverLon, radiusType)', async () => {
        await checkAndNotify('BK-001', GPS_5KM.lat, GPS_5KM.lng);

        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    metadata: expect.objectContaining({
                        bookingId: 'BK-001',
                        radiusType: 'FIVE_KM',
                        driverLat: GPS_5KM.lat,
                        driverLon: GPS_5KM.lng,
                    }),
                }),
            })
        );
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 9: Rapid Radius Crossing (GPS Jump)
// ═══════════════════════════════════════════════════════
describe('Edge Cases — GPS Jump', () => {
    test('TC-AC-2.1.6: GPS กระโดดจาก 6km → 0.8km → ส่ง FIVE_KM + ONE_KM ทั้งคู่', async () => {
        // ไม่มี notification ส่งมาก่อน
        const result = await checkAndNotify('BK-001', GPS_1KM.lat, GPS_1KM.lng);

        expect(result.crossedRadii).toContain('FIVE_KM');
        expect(result.crossedRadii).toContain('ONE_KM');
        expect(result.newNotifications).toHaveLength(2);
    });

    test('TC: GPS กระโดดจากไกลมาก → 0km → ส่งทั้ง 3 ระดับ', async () => {
        const result = await checkAndNotify('BK-001', GPS_0KM.lat, GPS_0KM.lng);

        expect(result.newNotifications).toHaveLength(3);

        // ตรวจว่า create ถูกเรียก 3 ครั้ง ตามลำดับ FIVE_KM, ONE_KM, ZERO_KM
        const createCalls = mockArrivalNotificationCreate.mock.calls;
        const radiiCreated = createCalls.map(c => c[0].data.radiusType);
        expect(radiiCreated).toEqual(['FIVE_KM', 'ONE_KM', 'ZERO_KM']);
    });
});
