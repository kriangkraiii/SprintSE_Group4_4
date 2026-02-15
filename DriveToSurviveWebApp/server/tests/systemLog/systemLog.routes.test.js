/**
 * Unit Test — SystemLog Routes
 * ทดสอบว่า route ต้องเป็น GET-only (Immutable Log)
 */

describe('SystemLog Routes — เฉพาะ GET เท่านั้น (Immutable)', () => {
    let routerMethods;

    beforeAll(() => {
        routerMethods = { get: [], post: [], put: [], patch: [], delete: [] };
        jest.resetModules();

        jest.doMock('express', () => {
            const router = {};
            ['get', 'post', 'put', 'patch', 'delete'].forEach((m) => {
                router[m] = jest.fn((...args) => routerMethods[m].push(args[0]));
            });
            return { Router: () => router };
        });

        jest.doMock('../../src/middlewares/auth', () => ({
            protect: jest.fn((req, res, next) => next()),
            requireAdmin: jest.fn((req, res, next) => next()),
        }));
        jest.doMock('../../src/middlewares/validate', () =>
            jest.fn(() => (req, res, next) => next())
        );
        jest.doMock('../../src/controllers/systemLog.controller', () => ({ getLogs: jest.fn() }));
        jest.doMock('../../src/validations/systemLog.validation', () => ({ searchLogsSchema: {} }));

        require('../../src/routes/systemLog.routes');
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('ต้องมี GET endpoint', () => {
        expect(routerMethods.get.length).toBeGreaterThan(0);
    });

    test('ต้องไม่มี PUT/PATCH endpoint (ห้ามแก้ไข log)', () => {
        expect(routerMethods.put).toHaveLength(0);
        expect(routerMethods.patch).toHaveLength(0);
    });

    test('ต้องไม่มี DELETE endpoint (ห้ามลบ log)', () => {
        expect(routerMethods.delete).toHaveLength(0);
    });

    test('ต้องไม่มี POST endpoint (สร้างผ่าน middleware อัตโนมัติเท่านั้น)', () => {
        expect(routerMethods.post).toHaveLength(0);
    });
});
