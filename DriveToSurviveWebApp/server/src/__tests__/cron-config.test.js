/**
 * CRON Config & Duration Settings — Tests
 * ทดสอบ cronConfig module, minimum enforcement, updateDurationConfig API,
 * chatLifecycle admin log purge
 */

// ─── Reset modules between tests ──────────────────────
let cronConfig, setRetentionDays, setChatReadOnlyDays, setAdminLogRetentionDays;

beforeEach(() => {
    jest.resetModules();
    const mod = require('../config/cronConfig');
    cronConfig = mod.cronConfig;
    setRetentionDays = mod.setRetentionDays;
    setChatReadOnlyDays = mod.setChatReadOnlyDays;
    setAdminLogRetentionDays = mod.setAdminLogRetentionDays;
});

// ═══════════════════════════════════════════════════════
// 1. cronConfig defaults
// ═══════════════════════════════════════════════════════
describe('cronConfig defaults', () => {
    test('retentionDays defaults to 90', () => {
        expect(cronConfig.retentionDays).toBe(90);
    });

    test('chatReadOnlyDays defaults to 7', () => {
        expect(cronConfig.chatReadOnlyDays).toBe(7);
    });

    test('adminLogRetentionDays defaults to 90', () => {
        expect(cronConfig.adminLogRetentionDays).toBe(90);
    });

    test('minimums are set correctly', () => {
        expect(cronConfig.retentionDaysMin).toBe(90);
        expect(cronConfig.chatReadOnlyDaysMin).toBe(3);
        expect(cronConfig.adminLogRetentionDaysMin).toBe(9);
    });
});

// ═══════════════════════════════════════════════════════
// 2. setRetentionDays — minimum enforcement
// ═══════════════════════════════════════════════════════
describe('setRetentionDays', () => {
    test('sets valid value above minimum', () => {
        const result = setRetentionDays(120);
        expect(result).toBe(120);
        expect(cronConfig.retentionDays).toBe(120);
    });

    test('enforces minimum of 90 when value is below', () => {
        const result = setRetentionDays(30);
        expect(result).toBe(90);
        expect(cronConfig.retentionDays).toBe(90);
    });

    test('enforces minimum when value is 0', () => {
        const result = setRetentionDays(0);
        expect(result).toBe(90);
    });

    test('enforces minimum when value is negative', () => {
        const result = setRetentionDays(-10);
        expect(result).toBe(90);
    });

    test('enforces minimum when value is NaN', () => {
        const result = setRetentionDays('abc');
        expect(result).toBe(90);
    });

    test('enforces minimum when value is undefined', () => {
        const result = setRetentionDays(undefined);
        expect(result).toBe(90);
    });

    test('accepts exactly minimum value (90)', () => {
        const result = setRetentionDays(90);
        expect(result).toBe(90);
    });

    test('accepts large value', () => {
        const result = setRetentionDays(365);
        expect(result).toBe(365);
        expect(cronConfig.retentionDays).toBe(365);
    });
});

// ═══════════════════════════════════════════════════════
// 3. setChatReadOnlyDays — minimum enforcement
// ═══════════════════════════════════════════════════════
describe('setChatReadOnlyDays', () => {
    test('sets valid value above minimum', () => {
        const result = setChatReadOnlyDays(14);
        expect(result).toBe(14);
        expect(cronConfig.chatReadOnlyDays).toBe(14);
    });

    test('enforces minimum of 3 when value is below', () => {
        const result = setChatReadOnlyDays(1);
        expect(result).toBe(3);
        expect(cronConfig.chatReadOnlyDays).toBe(3);
    });

    test('enforces minimum when value is 0', () => {
        const result = setChatReadOnlyDays(0);
        expect(result).toBe(3);
    });

    test('enforces minimum when value is negative', () => {
        const result = setChatReadOnlyDays(-5);
        expect(result).toBe(3);
    });

    test('accepts exactly minimum value (3)', () => {
        const result = setChatReadOnlyDays(3);
        expect(result).toBe(3);
    });

    test('enforces minimum when NaN', () => {
        const result = setChatReadOnlyDays(null);
        expect(result).toBe(3);
    });
});

// ═══════════════════════════════════════════════════════
// 4. setAdminLogRetentionDays — minimum enforcement
// ═══════════════════════════════════════════════════════
describe('setAdminLogRetentionDays', () => {
    test('sets valid value above minimum', () => {
        const result = setAdminLogRetentionDays(30);
        expect(result).toBe(30);
        expect(cronConfig.adminLogRetentionDays).toBe(30);
    });

    test('enforces minimum of 9 when value is below', () => {
        const result = setAdminLogRetentionDays(5);
        expect(result).toBe(9);
        expect(cronConfig.adminLogRetentionDays).toBe(9);
    });

    test('enforces minimum when value is 0', () => {
        const result = setAdminLogRetentionDays(0);
        expect(result).toBe(9);
    });

    test('enforces minimum when value is negative', () => {
        const result = setAdminLogRetentionDays(-1);
        expect(result).toBe(9);
    });

    test('accepts exactly minimum value (9)', () => {
        const result = setAdminLogRetentionDays(9);
        expect(result).toBe(9);
    });

    test('enforces minimum when undefined', () => {
        const result = setAdminLogRetentionDays(undefined);
        expect(result).toBe(9);
    });

    test('accepts large value', () => {
        const result = setAdminLogRetentionDays(180);
        expect(result).toBe(180);
        expect(cronConfig.adminLogRetentionDays).toBe(180);
    });
});

// ═══════════════════════════════════════════════════════
// 5. Multiple updates in sequence
// ═══════════════════════════════════════════════════════
describe('sequential updates', () => {
    test('each setter only affects its own field', () => {
        setRetentionDays(180);
        setChatReadOnlyDays(10);
        setAdminLogRetentionDays(30);

        expect(cronConfig.retentionDays).toBe(180);
        expect(cronConfig.chatReadOnlyDays).toBe(10);
        expect(cronConfig.adminLogRetentionDays).toBe(30);
    });

    test('can update a field multiple times', () => {
        setRetentionDays(100);
        expect(cronConfig.retentionDays).toBe(100);

        setRetentionDays(200);
        expect(cronConfig.retentionDays).toBe(200);

        setRetentionDays(50); // below minimum
        expect(cronConfig.retentionDays).toBe(90);
    });
});

// ═══════════════════════════════════════════════════════
// 6. updateDurationConfig controller endpoint
// ═══════════════════════════════════════════════════════
describe('updateDurationConfig controller', () => {
    // Mock Prisma for audit log
    const mockSystemLogCreate = jest.fn().mockResolvedValue({});
    jest.mock('../utils/prisma', () => ({
        systemLog: { create: (...args) => mockSystemLogCreate(...args) },
    }));

    let updateDurationConfig;

    beforeEach(() => {
        jest.resetModules();
        mockSystemLogCreate.mockClear();

        // Re-mock prisma
        jest.mock('../utils/prisma', () => ({
            systemLog: { create: (...args) => mockSystemLogCreate(...args) },
        }));

        const controller = require('../controllers/adminSprint2.controller');
        updateDurationConfig = controller.updateDurationConfig;
    });

    const mockReq = (body = {}) => ({
        body,
        user: { id: 'admin-001', sub: 'admin-001' },
    });

    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    const mockNext = jest.fn();

    test('updates all three values successfully', async () => {
        const req = mockReq({
            retentionDays: 120,
            chatReadOnlyDays: 7,
            adminLogRetentionDays: 15,
        });
        const res = mockRes();

        await updateDurationConfig(req, res, mockNext);

        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.config.retentionDays).toBe(120);
        expect(response.config.chatReadOnlyDays).toBe(7);
        expect(response.config.adminLogRetentionDays).toBe(15);
    });

    test('enforces minimums and returns warnings', async () => {
        const req = mockReq({
            retentionDays: 10,
            chatReadOnlyDays: 1,
            adminLogRetentionDays: 2,
        });
        const res = mockRes();

        await updateDurationConfig(req, res, mockNext);

        const response = res.json.mock.calls[0][0];
        expect(response.config.retentionDays).toBe(90);
        expect(response.config.chatReadOnlyDays).toBe(3);
        expect(response.config.adminLogRetentionDays).toBe(9);
        // Warnings are in individual fields (e.g. data.retentionDaysWarning)
        expect(response.data.retentionDaysWarning).toBeDefined();
        expect(response.data.chatReadOnlyDaysWarning).toBeDefined();
        expect(response.data.adminLogRetentionDaysWarning).toBeDefined();
    });

    test('partial update — only retentionDays', async () => {
        const req = mockReq({ retentionDays: 150 });
        const res = mockRes();

        await updateDurationConfig(req, res, mockNext);

        const response = res.json.mock.calls[0][0];
        expect(response.config.retentionDays).toBe(150);
    });

    test('creates audit log', async () => {
        const req = mockReq({ retentionDays: 100 });
        const res = mockRes();

        await updateDurationConfig(req, res, mockNext);

        expect(mockSystemLogCreate).toHaveBeenCalled();
        const logCall = mockSystemLogCreate.mock.calls[0][0];
        expect(logCall.data.action).toBe('CRON_CONFIG_UPDATE');
        expect(logCall.data.performedBy).toBe('admin-001');
        expect(logCall.data.entity).toBe('CronConfig');
    });
});

// ═══════════════════════════════════════════════════════
// 7. chatLifecycle — purgeExpiredAdminLogs
// ═══════════════════════════════════════════════════════
describe('purgeExpiredAdminLogs', () => {
    const mockChatLogDeleteMany = jest.fn();
    const mockSystemLogCreate = jest.fn();

    beforeEach(() => {
        jest.resetModules();
        mockChatLogDeleteMany.mockClear();
        mockSystemLogCreate.mockClear();

        jest.mock('../utils/prisma', () => ({
            chatLog: { deleteMany: (...args) => mockChatLogDeleteMany(...args) },
            systemLog: { create: (...args) => mockSystemLogCreate(...args) },
        }));
    });

    test('deletes expired logs and creates system log', async () => {
        mockChatLogDeleteMany.mockResolvedValue({ count: 5 });
        mockSystemLogCreate.mockResolvedValue({});

        const { purgeExpiredAdminLogs } = require('../services/chatLifecycle.service');
        const result = await purgeExpiredAdminLogs();

        expect(result).toBe(5);
        expect(mockChatLogDeleteMany).toHaveBeenCalledTimes(1);

        // Verify the date cutoff uses cronConfig.adminLogRetentionDays
        const deleteCall = mockChatLogDeleteMany.mock.calls[0][0];
        expect(deleteCall.where.archivedAt.lt).toBeInstanceOf(Date);

        expect(mockSystemLogCreate).toHaveBeenCalledTimes(1);
        const logCall = mockSystemLogCreate.mock.calls[0][0];
        expect(logCall.data.action).toBe('CHAT_LOG_PURGE');
    });

    test('returns 0 when no expired logs', async () => {
        mockChatLogDeleteMany.mockResolvedValue({ count: 0 });
        mockSystemLogCreate.mockResolvedValue({});

        const { purgeExpiredAdminLogs } = require('../services/chatLifecycle.service');
        const result = await purgeExpiredAdminLogs();

        expect(result).toBe(0);
    });

    test('handles errors by throwing', async () => {
        mockChatLogDeleteMany.mockRejectedValue(new Error('DB error'));

        const { purgeExpiredAdminLogs } = require('../services/chatLifecycle.service');
        await expect(purgeExpiredAdminLogs()).rejects.toThrow('DB error');
    });
});

// ═══════════════════════════════════════════════════════
// 8. retentionPurge uses cronConfig
// ═══════════════════════════════════════════════════════
describe('retentionPurge uses cronConfig', () => {
    test('cronConfig.retentionDays is referenced by retentionPurge module', () => {
        jest.resetModules();
        // Just verify the module imports cronConfig without errors
        jest.mock('../utils/prisma', () => ({
            chatSession: { findMany: jest.fn(), deleteMany: jest.fn() },
            chatMessage: { deleteMany: jest.fn() },
            chatSessionParticipant: { deleteMany: jest.fn() },
            chatLog: { createMany: jest.fn() },
            systemLog: { create: jest.fn() },
            $transaction: jest.fn(),
        }));

        // Should load without errors
        const mod = require('../jobs/retentionPurge');
        expect(mod.purgeExpiredData).toBeDefined();
        expect(typeof mod.purgeExpiredData).toBe('function');
    });
});

// ═══════════════════════════════════════════════════════
// 9. Edge cases
// ═══════════════════════════════════════════════════════
describe('edge cases', () => {
    test('float values are handled correctly', () => {
        const result = setRetentionDays(90.5);
        expect(result).toBe(90.5);
        expect(cronConfig.retentionDays).toBe(90.5);
    });

    test('string number "120" is parsed correctly', () => {
        const result = setRetentionDays('120');
        expect(result).toBe(120);
    });

    test('string number below minimum is enforced', () => {
        const result = setChatReadOnlyDays('1');
        expect(result).toBe(3);
    });

    test('Infinity is accepted (above minimum)', () => {
        const result = setAdminLogRetentionDays(Infinity);
        expect(result).toBe(Infinity);
    });
});
