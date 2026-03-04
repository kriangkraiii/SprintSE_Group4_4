/**
 * Chat Admin Service — Tests
 * ทดสอบ getAllSessions, getSessionMessages, getArchivedLogs
 * ตรวจสอบการใช้ participants แทน passenger, mapping passengers, filters, error handling
 */

// ─── Mock Prisma ───────────────────────────────────────
const mockChatSessionFindMany = jest.fn();
const mockChatSessionFindUnique = jest.fn();
const mockChatMessageFindMany = jest.fn();
const mockChatLogFindMany = jest.fn();

jest.mock('../utils/prisma', () => ({
    chatSession: {
        findMany: (...args) => mockChatSessionFindMany(...args),
        findUnique: (...args) => mockChatSessionFindUnique(...args),
    },
    chatMessage: {
        findMany: (...args) => mockChatMessageFindMany(...args),
    },
    chatLog: {
        findMany: (...args) => mockChatLogFindMany(...args),
    },
}));

const { getAllSessions, getSessionMessages, getArchivedLogs } = require('../services/chatAdmin.service');

// ─── Fixtures ──────────────────────────────────────────
const DRIVER_ID = 'driver-001';
const PASSENGER_ID = 'passenger-001';
const PASSENGER2_ID = 'passenger-002';
const SESSION_ID = 'session-abc';

const makeParticipant = (userId, firstName, lastName = '') => ({
    id: `part-${userId}`,
    sessionId: SESSION_ID,
    userId,
    user: { id: userId, firstName, lastName, profilePicture: null },
});

const makeSession = (overrides = {}) => ({
    id: SESSION_ID,
    routeId: 'route-001',
    driverId: DRIVER_ID,
    status: 'ACTIVE',
    createdAt: new Date('2026-03-01'),
    endedAt: null,
    driver: { id: DRIVER_ID, firstName: 'สมชาย', lastName: 'ดี', profilePicture: null },
    participants: [
        makeParticipant(DRIVER_ID, 'สมชาย', 'ดี'),
        makeParticipant(PASSENGER_ID, 'สมหญิง', 'ดี'),
    ],
    route: {
        startLocation: { name: 'มหาวิทยาลัย', lat: 13.7, lng: 100.5 },
        endLocation: { name: 'ห้างสรรพสินค้า', lat: 13.8, lng: 100.6 },
    },
    _count: { messages: 5 },
    ...overrides,
});

const makeMessage = (overrides = {}) => ({
    id: 'msg-001',
    sessionId: SESSION_ID,
    senderId: DRIVER_ID,
    type: 'TEXT',
    content: 'สวัสดีครับ',
    createdAt: new Date('2026-03-01T10:00:00'),
    sender: { firstName: 'สมชาย', profilePicture: null },
    ...overrides,
});

// ─── Reset ─────────────────────────────────────────────
beforeEach(() => {
    jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════
// 1. getAllSessions
// ═══════════════════════════════════════════════════════
describe('getAllSessions — ดึงรายการเซสชัน', () => {
    test('TC: ดึงเซสชันทั้งหมดสำเร็จ', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        const result = await getAllSessions();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(SESSION_ID);
        expect(mockChatSessionFindMany).toHaveBeenCalledTimes(1);
    });

    test('TC: include participants แทน passenger', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        await getAllSessions();

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.include).toHaveProperty('participants');
        expect(callArgs.include).not.toHaveProperty('passenger');
        expect(callArgs.include.participants.include).toHaveProperty('user');
    });

    test('TC: include route ข้อมูลเส้นทาง', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        await getAllSessions();

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.include).toHaveProperty('route');
    });

    test('TC: include driver ข้อมูลคนขับ', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        await getAllSessions();

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.include).toHaveProperty('driver');
    });

    test('TC: include _count messages', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        await getAllSessions();

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.include._count).toEqual({ select: { messages: true } });
    });

    test('TC: map passengers จาก participants (กรอง driver ออก)', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        const result = await getAllSessions();

        // passengers should only contain non-driver participants
        expect(result[0].passengers).toHaveLength(1);
        expect(result[0].passengers[0].id).toBe(PASSENGER_ID);
        expect(result[0].passengers[0].firstName).toBe('สมหญิง');
    });

    test('TC: map passengers หลายคน', async () => {
        const session = makeSession({
            participants: [
                makeParticipant(DRIVER_ID, 'สมชาย'),
                makeParticipant(PASSENGER_ID, 'สมหญิง'),
                makeParticipant(PASSENGER2_ID, 'สมศรี'),
            ],
        });
        mockChatSessionFindMany.mockResolvedValue([session]);

        const result = await getAllSessions();

        expect(result[0].passengers).toHaveLength(2);
        expect(result[0].passengers.map(p => p.id)).toContain(PASSENGER_ID);
        expect(result[0].passengers.map(p => p.id)).toContain(PASSENGER2_ID);
    });

    test('TC: passengers ว่างเปล่าถ้ามีแค่ driver', async () => {
        const session = makeSession({
            participants: [makeParticipant(DRIVER_ID, 'สมชาย')],
        });
        mockChatSessionFindMany.mockResolvedValue([session]);

        const result = await getAllSessions();

        expect(result[0].passengers).toHaveLength(0);
    });

    test('TC: filter ด้วย status', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        await getAllSessions({ status: 'ARCHIVED' });

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.where.status).toBe('ARCHIVED');
    });

    test('TC: filter ด้วย driverId', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        await getAllSessions({ driverId: DRIVER_ID });

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.where.driverId).toBe(DRIVER_ID);
    });

    test('TC: filter ด้วย participantId (ใช้ participants.some)', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        await getAllSessions({ participantId: PASSENGER_ID });

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.where.participants).toEqual({ some: { userId: PASSENGER_ID } });
    });

    test('TC: ไม่ส่ง filter → where ว่าง', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        await getAllSessions();

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.where).toEqual({});
    });

    test('TC: default limit = 50', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        await getAllSessions();

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.take).toBe(50);
    });

    test('TC: custom limit', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        await getAllSessions({ limit: '10' });

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.take).toBe(10);
    });

    test('TC: เรียง createdAt desc', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        await getAllSessions();

        const callArgs = mockChatSessionFindMany.mock.calls[0][0];
        expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });

    test('TC: คืนค่า empty array เมื่อไม่มี session', async () => {
        mockChatSessionFindMany.mockResolvedValue([]);

        const result = await getAllSessions();

        expect(result).toEqual([]);
    });

    test('TC: เก็บข้อมูล route startLocation / endLocation', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        const result = await getAllSessions();

        expect(result[0].route.startLocation.name).toBe('มหาวิทยาลัย');
        expect(result[0].route.endLocation.name).toBe('ห้างสรรพสินค้า');
    });

    test('TC: เก็บจำนวนข้อความ _count.messages', async () => {
        mockChatSessionFindMany.mockResolvedValue([makeSession()]);

        const result = await getAllSessions();

        expect(result[0]._count.messages).toBe(5);
    });
});

// ═══════════════════════════════════════════════════════
// 2. getSessionMessages
// ═══════════════════════════════════════════════════════
describe('getSessionMessages — ดึงข้อความในเซสชัน', () => {
    test('TC: ดึงข้อความสำเร็จ', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession());
        mockChatMessageFindMany.mockResolvedValue([makeMessage()]);

        const result = await getSessionMessages(SESSION_ID);

        expect(result.session.id).toBe(SESSION_ID);
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].content).toBe('สวัสดีครับ');
    });

    test('TC: include participants แทน passenger ใน session query', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession());
        mockChatMessageFindMany.mockResolvedValue([]);

        await getSessionMessages(SESSION_ID);

        const callArgs = mockChatSessionFindUnique.mock.calls[0][0];
        expect(callArgs.include).toHaveProperty('participants');
        expect(callArgs.include).not.toHaveProperty('passenger');
    });

    test('TC: session ไม่พบ → throw 404', async () => {
        mockChatSessionFindUnique.mockResolvedValue(null);

        await expect(getSessionMessages('not-found')).rejects.toMatchObject({
            statusCode: 404,
            message: 'Session not found',
        });
    });

    test('TC: ดึงข้อความเรียงตาม createdAt asc', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession());
        mockChatMessageFindMany.mockResolvedValue([]);

        await getSessionMessages(SESSION_ID);

        const callArgs = mockChatMessageFindMany.mock.calls[0][0];
        expect(callArgs.orderBy).toEqual({ createdAt: 'asc' });
    });

    test('TC: include sender ในข้อความ', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession());
        mockChatMessageFindMany.mockResolvedValue([]);

        await getSessionMessages(SESSION_ID);

        const callArgs = mockChatMessageFindMany.mock.calls[0][0];
        expect(callArgs.include.sender).toBeDefined();
        expect(callArgs.include.sender.select.firstName).toBe(true);
    });

    test('TC: ดึงข้อความหลายรายการ', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession());
        mockChatMessageFindMany.mockResolvedValue([
            makeMessage({ id: 'msg-001', content: 'สวัสดี' }),
            makeMessage({ id: 'msg-002', content: 'สบายดีไหม', senderId: PASSENGER_ID }),
            makeMessage({ id: 'msg-003', content: 'สบายดีครับ' }),
        ]);

        const result = await getSessionMessages(SESSION_ID);

        expect(result.messages).toHaveLength(3);
    });

    test('TC: query ด้วย sessionId ที่ถูกต้อง', async () => {
        mockChatSessionFindUnique.mockResolvedValue(makeSession());
        mockChatMessageFindMany.mockResolvedValue([]);

        await getSessionMessages('test-session-xyz');

        expect(mockChatSessionFindUnique.mock.calls[0][0].where.id).toBe('test-session-xyz');
        expect(mockChatMessageFindMany.mock.calls[0][0].where.sessionId).toBe('test-session-xyz');
    });
});

// ═══════════════════════════════════════════════════════
// 3. getArchivedLogs
// ═══════════════════════════════════════════════════════
describe('getArchivedLogs — ดึง Log ที่ Archived', () => {
    const makeLog = (overrides = {}) => ({
        id: 'log-001',
        sessionId: SESSION_ID,
        driverId: DRIVER_ID,
        passengerId: PASSENGER_ID,
        messages: [{ content: 'test' }],
        archivedAt: new Date('2026-03-01'),
        originalEndedAt: new Date('2026-02-28'),
        ...overrides,
    });

    test('TC: ดึง logs สำเร็จ', async () => {
        mockChatLogFindMany.mockResolvedValue([makeLog()]);

        const result = await getArchivedLogs();

        expect(result).toHaveLength(1);
        expect(result[0].sessionId).toBe(SESSION_ID);
    });

    test('TC: filter ด้วย sessionId', async () => {
        mockChatLogFindMany.mockResolvedValue([]);

        await getArchivedLogs({ sessionId: SESSION_ID });

        const callArgs = mockChatLogFindMany.mock.calls[0][0];
        expect(callArgs.where.sessionId).toBe(SESSION_ID);
    });

    test('TC: filter ด้วย driverId', async () => {
        mockChatLogFindMany.mockResolvedValue([]);

        await getArchivedLogs({ driverId: DRIVER_ID });

        const callArgs = mockChatLogFindMany.mock.calls[0][0];
        expect(callArgs.where.driverId).toBe(DRIVER_ID);
    });

    test('TC: filter ด้วย passengerId', async () => {
        mockChatLogFindMany.mockResolvedValue([]);

        await getArchivedLogs({ passengerId: PASSENGER_ID });

        const callArgs = mockChatLogFindMany.mock.calls[0][0];
        expect(callArgs.where.passengerId).toBe(PASSENGER_ID);
    });

    test('TC: default limit = 50', async () => {
        mockChatLogFindMany.mockResolvedValue([]);

        await getArchivedLogs();

        const callArgs = mockChatLogFindMany.mock.calls[0][0];
        expect(callArgs.take).toBe(50);
    });

    test('TC: custom limit', async () => {
        mockChatLogFindMany.mockResolvedValue([]);

        await getArchivedLogs({ limit: '20' });

        const callArgs = mockChatLogFindMany.mock.calls[0][0];
        expect(callArgs.take).toBe(20);
    });

    test('TC: เรียง archivedAt desc', async () => {
        mockChatLogFindMany.mockResolvedValue([]);

        await getArchivedLogs();

        const callArgs = mockChatLogFindMany.mock.calls[0][0];
        expect(callArgs.orderBy).toEqual({ archivedAt: 'desc' });
    });

    test('TC: ไม่มี filter → where ว่าง', async () => {
        mockChatLogFindMany.mockResolvedValue([]);

        await getArchivedLogs();

        const callArgs = mockChatLogFindMany.mock.calls[0][0];
        expect(callArgs.where).toEqual({});
    });
});
