/**
 * Unit Test — SystemLog Middleware
 * ทดสอบการบันทึกข้อมูลจราจรคอมพิวเตอร์อัตโนมัติ
 * ตาม พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 มาตรา 26
 */

const { mockPrisma, createMockReq, createMockRes, createMockNext, wait } = require('../helpers/setup');
const systemLogMiddleware = require('../../src/middlewares/systemLog.middleware');

describe('SystemLog Middleware — บันทึกข้อมูลจราจรคอมพิวเตอร์', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.systemLog.create.mockResolvedValue({ id: 1 });
    });

    test('ต้องเรียก next() ทันทีไม่ block request', async () => {
        const next = createMockNext();
        await systemLogMiddleware(createMockReq(), createMockRes(), next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    test('ต้องบันทึกข้อมูลครบทุก field ตาม พ.ร.บ.คอมพิวเตอร์ ม.26', async () => {
        const req = createMockReq({
            user: { sub: 'user-456', role: 'USER' },
            method: 'POST',
            originalUrl: '/api/bookings/123',
            headers: { 'user-agent': 'Chrome/120.0' },
        });

        await systemLogMiddleware(req, createMockRes(), createMockNext());
        await wait();

        const logged = mockPrisma.systemLog.create.mock.calls[0][0].data;
        expect(logged).toEqual({
            userId: 'user-456',
            ipAddress: expect.any(String),
            action: 'POST',
            resource: '/api/bookings/123',
            userAgent: 'Chrome/120.0',
        });
    });

    test('ถ้าไม่มี user (guest) ต้องบันทึก userId เป็น null', async () => {
        await systemLogMiddleware(createMockReq({ user: undefined }), createMockRes(), createMockNext());
        await wait();

        const logged = mockPrisma.systemLog.create.mock.calls[0][0].data;
        expect(logged.userId).toBeNull();
    });

    test('ต้องใช้ IP จาก x-forwarded-for ก่อน (รองรับ proxy)', async () => {
        const req = createMockReq({
            headers: { 'x-forwarded-for': '10.0.0.1, 172.16.0.1', 'user-agent': 'Test' },
            ip: '127.0.0.1',
        });

        await systemLogMiddleware(req, createMockRes(), createMockNext());
        await wait();

        const logged = mockPrisma.systemLog.create.mock.calls[0][0].data;
        expect(logged.ipAddress).toBe('10.0.0.1');
    });

    test('ถ้า Prisma error ต้องไม่ crash server', async () => {
        mockPrisma.systemLog.create.mockRejectedValue(new Error('DB down'));

        await expect(
            systemLogMiddleware(createMockReq(), createMockRes(), createMockNext())
        ).resolves.not.toThrow();
    });

    test('ต้องบันทึกทุก HTTP Method ได้ (GET, POST, PUT, DELETE)', async () => {
        for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
            jest.clearAllMocks();
            mockPrisma.systemLog.create.mockResolvedValue({ id: 1 });

            await systemLogMiddleware(createMockReq({ method }), createMockRes(), createMockNext());
            await wait();

            expect(mockPrisma.systemLog.create.mock.calls[0][0].data.action).toBe(method);
        }
    });
});
