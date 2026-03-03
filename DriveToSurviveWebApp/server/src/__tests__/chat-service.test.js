/**
 * Chat Service — Comprehensive Tests
 * ทดสอบ Quick Reply, sendMessage, content filter, session, unsend, location sharing
 */

// ─── Mock Prisma ───────────────────────────────────────
const mockChatSessionFindUnique = jest.fn();
const mockChatSessionCreate = jest.fn();
const mockChatSessionUpdate = jest.fn();
const mockChatSessionFindMany = jest.fn();
const mockChatMessageCreate = jest.fn();
const mockChatMessageFindUnique = jest.fn();
const mockChatMessageFindMany = jest.fn();
const mockChatMessageUpdate = jest.fn();
const mockChatMessageCount = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../utils/prisma', () => ({
    chatSession: {
        findUnique: (...args) => mockChatSessionFindUnique(...args),
        create: (...args) => mockChatSessionCreate(...args),
        update: (...args) => mockChatSessionUpdate(...args),
        findMany: (...args) => mockChatSessionFindMany(...args),
    },
    chatMessage: {
        create: (...args) => mockChatMessageCreate(...args),
        findUnique: (...args) => mockChatMessageFindUnique(...args),
        findMany: (...args) => mockChatMessageFindMany(...args),
        update: (...args) => mockChatMessageUpdate(...args),
        count: (...args) => mockChatMessageCount(...args),
    },
    booking: {
        findUnique: (...args) => mockBookingFindUnique(...args),
    },
    $transaction: (...args) => mockTransaction(...args),
}));

const {
    createSession,
    endSession,
    sendMessage,
    getMessages,
    unsendMessage,
    getSession,
    shareLocation,
    getMySessions,
    RETENTION_DAYS,
    UNSEND_WINDOW_MINUTES,
} = require('../services/chat.service');

// ─── Fixtures ───────────────────────────────────────────
const DRIVER_ID = 'driver-001';
const PASSENGER_ID = 'passenger-001';
const SESSION_ID = 'session-abc';
const BOOKING_ID = 'booking-001';

const makeSession = (overrides = {}) => ({
    id: SESSION_ID,
    bookingId: BOOKING_ID,
    driverId: DRIVER_ID,
    passengerId: PASSENGER_ID,
    status: 'ACTIVE',
    createdAt: new Date(),
    endedAt: null,
    retentionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    ...overrides,
});

const makeMessage = (overrides = {}) => ({
    id: 'msg-001',
    sessionId: SESSION_ID,
    senderId: DRIVER_ID,
    type: 'TEXT',
    content: 'สวัสดีครับ',
    isFiltered: false,
    isUnsent: false,
    unsendDeadline: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
    sender: { firstName: 'วิทยา', profilePicture: null },
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks for a valid active session
    mockChatSessionFindUnique.mockResolvedValue(makeSession());
    mockChatMessageCreate.mockImplementation(({ data }) =>
        Promise.resolve({ id: `msg-${Date.now()}`, ...data, createdAt: new Date(), sender: { firstName: 'วิทยา', profilePicture: null } })
    );
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 1: Quick Reply (คนขับกดเอง)
// ═══════════════════════════════════════════════════════
describe('Quick Reply — คนขับกดข้อความด่วน', () => {
    test('TC: Quick Reply "กำลังไปรับครับ/ค่ะ" → ส่งเป็น TEXT message สำเร็จ', async () => {
        const msg = await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'กำลังไปรับครับ/ค่ะ',
            type: 'TEXT',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    sessionId: SESSION_ID,
                    senderId: DRIVER_ID,
                    type: 'TEXT',
                    content: 'กำลังไปรับครับ/ค่ะ',
                }),
            })
        );
        expect(msg).toBeDefined();
    });

    test('TC: Quick Reply "ถึงแล้วครับ/ค่ะ" → เก็บเป็น type TEXT', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'ถึงแล้วครับ/ค่ะ',
            type: 'TEXT',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    content: 'ถึงแล้วครับ/ค่ะ',
                    type: 'TEXT',
                }),
            })
        );
    });

    test('TC: Quick Reply "รอสักครู่ครับ/ค่ะ" → ส่งสำเร็จ', async () => {
        const msg = await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'รอสักครู่ครับ/ค่ะ',
        });

        expect(mockChatMessageCreate).toHaveBeenCalled();
        expect(msg).toBeDefined();
    });

    test('TC: Quick Reply "จอดรอที่จุดนัดพบแล้ว" → ส่งสำเร็จ', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'จอดรอที่จุดนัดพบแล้ว',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    content: 'จอดรอที่จุดนัดพบแล้ว',
                }),
            })
        );
    });

    test('TC: Quick Reply ฝั่งผู้โดยสาร "รอข้างล่างแล้ว" → ส่งสำเร็จ', async () => {
        await sendMessage(SESSION_ID, PASSENGER_ID, {
            content: 'รอข้างล่างแล้ว',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    senderId: PASSENGER_ID,
                    content: 'รอข้างล่างแล้ว',
                }),
            })
        );
    });

    test('TC: Quick Reply ฝั่งผู้โดยสาร "กำลังลงไป" → ส่งสำเร็จ', async () => {
        await sendMessage(SESSION_ID, PASSENGER_ID, {
            content: 'กำลังลงไป',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    senderId: PASSENGER_ID,
                    content: 'กำลังลงไป',
                }),
            })
        );
    });

    test('TC: Quick Reply type = QUICK_REPLY → ส่งเป็น QUICK_REPLY ได้', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'ถึงแล้วครับ/ค่ะ',
            type: 'QUICK_REPLY',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'QUICK_REPLY',
                    content: 'ถึงแล้วครับ/ค่ะ',
                }),
            })
        );
    });

    test('TC: Quick Reply ใน session ที่ ENDED → throw 403', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession({ status: 'ENDED' }));

        await expect(sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'กำลังไปรับครับ/ค่ะ',
        })).rejects.toThrow('Chat session has ended');
    });

    test('TC: คนนอกส่ง Quick Reply → throw 403', async () => {
        await expect(sendMessage(SESSION_ID, 'stranger-999', {
            content: 'กำลังไปรับครับ/ค่ะ',
        })).rejects.toThrow('You are not a participant in this chat');
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 2: sendMessage (General)
// ═══════════════════════════════════════════════════════
describe('sendMessage — ข้อความทั่วไป', () => {
    test('TC: ข้อความปกติ → ส่งสำเร็จ + มี unsendDeadline', async () => {
        const msg = await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'เจอกันหน้า 7-11 ครับ',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    content: 'เจอกันหน้า 7-11 ครับ',
                    type: 'TEXT',
                    isFiltered: false,
                    originalContent: null,
                }),
            })
        );
    });

    test('TC: Session ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);

        await expect(sendMessage('notfound', DRIVER_ID, { content: 'hello' }))
            .rejects.toThrow('Chat session not found');
    });

    test('TC: ข้อความมีเบอร์โทร → ถูก filter + isFiltered = true', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'โทรหาผมที่ 0812345678 นะครับ',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    content: expect.stringContaining('***-***-****'),
                    isFiltered: true,
                    originalContent: 'โทรหาผมที่ 0812345678 นะครับ',
                }),
            })
        );
    });

    test('TC: ข้อความมี URL → ถูก filter', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'ดูที่ https://example.com/location ครับ',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    content: expect.stringContaining('[ลิงก์ถูกซ่อน / Link hidden]'),
                    isFiltered: true,
                }),
            })
        );
    });

    test('TC: ข้อความมี Line ID → ถูก filter', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'แอดไลน์ line: mylineid ครับ',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    content: expect.stringContaining('[ID ถูกซ่อน / ID hidden]'),
                    isFiltered: true,
                }),
            })
        );
    });

    test('TC: ข้อความ Quick Reply ปกติ → ไม่ถูก filter (ไม่มีเบอร์/URL)', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'กำลังไปรับครับ/ค่ะ',
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    isFiltered: false,
                    originalContent: null,
                }),
            })
        );
    });

    test('TC: ข้อความมี metadata → เก็บ metadata', async () => {
        await sendMessage(SESSION_ID, DRIVER_ID, {
            content: 'เจอกัน',
            metadata: { eta: '5 นาที' },
        });

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    metadata: { eta: '5 นาที' },
                }),
            })
        );
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 3: Session Management
// ═══════════════════════════════════════════════════════
describe('createSession — สร้างห้องแชท', () => {
    test('TC: สร้าง session จาก booking → สำเร็จ + system welcome message', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null); // ไม่มี session เดิม
        mockBookingFindUnique.mockResolvedValue({
            id: BOOKING_ID,
            passengerId: PASSENGER_ID,
            route: { driverId: DRIVER_ID },
        });
        mockChatSessionCreate.mockResolvedValue(makeSession());

        const session = await createSession(BOOKING_ID);

        expect(mockChatSessionCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    bookingId: BOOKING_ID,
                    driverId: DRIVER_ID,
                    passengerId: PASSENGER_ID,
                }),
            })
        );

        // ส่ง system welcome message
        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'SYSTEM',
                    content: expect.stringContaining('แชทเริ่มต้นแล้ว'),
                }),
            })
        );
    });

    test('TC: สร้าง session ซ้ำ (idempotent) → คืน session เดิม', async () => {
        const existing = makeSession();
        mockChatSessionFindUnique.mockResolvedValue(existing);

        const session = await createSession(BOOKING_ID);

        expect(session).toEqual(existing);
        expect(mockChatSessionCreate).not.toHaveBeenCalled();
    });

    test('TC: Booking ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);
        mockBookingFindUnique.mockResolvedValue(null);

        await expect(createSession('BK-999'))
            .rejects.toThrow('Booking not found');
    });

    test('TC: Retention days = 90', () => {
        expect(RETENTION_DAYS).toBe(90);
    });
});

describe('endSession — ปิดห้องแชท', () => {
    test('TC: ปิด session สำเร็จ → status ENDED + system message', async () => {
        mockChatSessionUpdate.mockResolvedValue(makeSession({ status: 'ENDED', endedAt: new Date() }));

        const session = await endSession(BOOKING_ID);

        expect(mockChatSessionUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: 'ENDED',
                }),
            })
        );

        // ส่ง system close message
        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'SYSTEM',
                    content: expect.stringContaining('แชทนี้ถูกปิดแล้ว'),
                }),
            })
        );
    });

    test('TC: session ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);

        await expect(endSession('BK-999'))
            .rejects.toThrow('Chat session not found');
    });

    test('TC: session ปิดแล้ว → คืน session เดิม (idempotent)', async () => {
        const ended = makeSession({ status: 'ENDED' });
        mockChatSessionFindUnique.mockResolvedValue(ended);

        const session = await endSession(BOOKING_ID);

        expect(session).toEqual(ended);
        expect(mockChatSessionUpdate).not.toHaveBeenCalled();
    });
});

describe('getSession — ดึงข้อมูล session', () => {
    test('TC: ดึง session ในฐานะ driver → สำเร็จ', async () => {
        mockChatSessionFindUnique.mockResolvedValue({
            ...makeSession(),
            driver: { id: DRIVER_ID, firstName: 'วิทยา', profilePicture: null },
            passenger: { id: PASSENGER_ID, firstName: 'สมชาย', profilePicture: null },
        });

        const session = await getSession(BOOKING_ID, DRIVER_ID);
        expect(session.driverId).toBe(DRIVER_ID);
    });

    test('TC: ดึง session ในฐานะ passenger → สำเร็จ', async () => {
        mockChatSessionFindUnique.mockResolvedValue({
            ...makeSession(),
            driver: { id: DRIVER_ID, firstName: 'วิทยา', profilePicture: null },
            passenger: { id: PASSENGER_ID, firstName: 'สมชาย', profilePicture: null },
        });

        const session = await getSession(BOOKING_ID, PASSENGER_ID);
        expect(session.passengerId).toBe(PASSENGER_ID);
    });

    test('TC: คนนอกดึง session → throw 403', async () => {
        mockChatSessionFindUnique.mockResolvedValue({
            ...makeSession(),
            driver: { id: DRIVER_ID, firstName: 'วิทยา', profilePicture: null },
            passenger: { id: PASSENGER_ID, firstName: 'สมชาย', profilePicture: null },
        });

        await expect(getSession(BOOKING_ID, 'stranger-999'))
            .rejects.toThrow('You are not a participant in this chat');
    });

    test('TC: session ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);

        await expect(getSession('BK-999', DRIVER_ID))
            .rejects.toThrow('Chat session not found');
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 4: Unsend Message
// ═══════════════════════════════════════════════════════
describe('unsendMessage — ลบข้อความ', () => {
    test('TC: ลบข้อความภายใน 5 นาที → สำเร็จ', async () => {
        mockChatMessageFindUnique.mockResolvedValue(makeMessage());
        mockChatMessageUpdate.mockResolvedValue({
            id: 'msg-001',
            content: 'ข้อความถูกลบ / Message unsent',
            isUnsent: true,
        });

        const result = await unsendMessage('msg-001', DRIVER_ID);

        expect(mockChatMessageUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'msg-001' },
                data: expect.objectContaining({
                    content: 'ข้อความถูกลบ / Message unsent',
                    isUnsent: true,
                }),
            })
        );
    });

    test('TC: ลบข้อความเกิน 5 นาที → throw 400', async () => {
        mockChatMessageFindUnique.mockResolvedValue(makeMessage({
            unsendDeadline: new Date(Date.now() - 1000), // หมดเวลาแล้ว
        }));

        await expect(unsendMessage('msg-001', DRIVER_ID))
            .rejects.toThrow('Unsend time expired (5 minutes)');
    });

    test('TC: ลบข้อความคนอื่น → throw 403', async () => {
        mockChatMessageFindUnique.mockResolvedValue(makeMessage());

        await expect(unsendMessage('msg-001', PASSENGER_ID))
            .rejects.toThrow('Not your message');
    });

    test('TC: ลบข้อความที่ลบแล้ว → throw 400', async () => {
        mockChatMessageFindUnique.mockResolvedValue(makeMessage({ isUnsent: true }));

        await expect(unsendMessage('msg-001', DRIVER_ID))
            .rejects.toThrow('Message already unsent');
    });

    test('TC: ลบ SYSTEM message → throw 400', async () => {
        mockChatMessageFindUnique.mockResolvedValue(makeMessage({ type: 'SYSTEM' }));

        await expect(unsendMessage('msg-001', DRIVER_ID))
            .rejects.toThrow('Cannot unsend system messages');
    });

    test('TC: ลบข้อความที่ไม่พบ → throw 404', async () => {
        mockChatMessageFindUnique.mockResolvedValue(null);

        await expect(unsendMessage('msg-999', DRIVER_ID))
            .rejects.toThrow('Message not found');
    });

    test('TC: Unsend window = 5 นาที', () => {
        expect(UNSEND_WINDOW_MINUTES).toBe(5);
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 5: getMessages (Pagination)
// ═══════════════════════════════════════════════════════
describe('getMessages — ดึงข้อความ (Pagination)', () => {
    test('TC: ดึงข้อความ page 1 → สำเร็จ + เรียงตามเวลา', async () => {
        const msgs = [makeMessage(), makeMessage({ id: 'msg-002' })];
        mockTransaction.mockResolvedValue([2, msgs]);

        const result = await getMessages(SESSION_ID, DRIVER_ID, { page: 1, limit: 50 });

        expect(result.data).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.page).toBe(1);
    });

    test('TC: คนนอกดึงข้อความ → throw 403', async () => {
        await expect(getMessages(SESSION_ID, 'stranger-999'))
            .rejects.toThrow('You are not a participant in this chat');
    });

    test('TC: session ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);

        await expect(getMessages('session-999', DRIVER_ID))
            .rejects.toThrow('Chat session not found');
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 6: Location Sharing
// ═══════════════════════════════════════════════════════
describe('shareLocation — แชร์ตำแหน่ง', () => {
    test('TC: แชร์ตำแหน่ง GPS → ส่งเป็น LOCATION message พร้อม metadata', async () => {
        await shareLocation(SESSION_ID, DRIVER_ID, 16.472, 102.824);

        expect(mockChatMessageCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: 'LOCATION',
                    content: expect.stringContaining('16.472'),
                    metadata: expect.objectContaining({
                        lat: 16.472,
                        lon: 102.824,
                        isLive: true,
                    }),
                }),
            })
        );
    });

    test('TC: แชร์ตำแหน่งใน ENDED session → throw 403', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession({ status: 'ENDED' }));

        await expect(shareLocation(SESSION_ID, DRIVER_ID, 16.472, 102.824))
            .rejects.toThrow('Chat session has ended');
    });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 7: getMySessions
// ═══════════════════════════════════════════════════════
describe('getMySessions — ดึง sessions ของตัวเอง', () => {
    test('TC: ดึง sessions ของ driver → มี sessions ที่เป็น driver + last message', async () => {
        mockChatSessionFindMany.mockResolvedValue([
            {
                ...makeSession(),
                driver: { id: DRIVER_ID, firstName: 'วิทยา' },
                passenger: { id: PASSENGER_ID, firstName: 'สมชาย' },
                messages: [{ content: 'ถึงแล้วครับ', createdAt: new Date() }],
            },
        ]);

        const sessions = await getMySessions(DRIVER_ID);

        expect(sessions).toHaveLength(1);
        expect(mockChatSessionFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    OR: [
                        { driverId: DRIVER_ID },
                        { passengerId: DRIVER_ID },
                    ],
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            })
        );
    });
});
