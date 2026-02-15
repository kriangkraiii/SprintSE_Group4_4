/**
 * Unit Test — SystemLog Validation + Prisma Schema
 * ทดสอบ Zod schema และโครงสร้าง DB ตาม พ.ร.บ.คอมพิวเตอร์ ม.26
 */

const { searchLogsSchema } = require('../../src/validations/systemLog.validation');
const fs = require('fs');
const path = require('path');

describe('SystemLog Validation — Zod Schema', () => {
    test('query ที่ถูกต้องต้อง parse ผ่าน', () => {
        const result = searchLogsSchema.safeParse({
            page: '1', limit: '20', action: 'GET',
            sortBy: 'createdAt', sortOrder: 'desc',
        });
        expect(result.success).toBe(true);
    });

    test('ไม่ส่ง query เลยก็ต้องผ่าน (optional ทุก field)', () => {
        expect(searchLogsSchema.safeParse({}).success).toBe(true);
    });

    test('ต้อง reject ค่าที่ไม่ถูกต้อง (action, limit, page, sortBy, sortOrder)', () => {
        const cases = [
            { action: 'HACK' },
            { limit: '999' },
            { page: '0' },
            { sortBy: 'password' },
            { sortOrder: 'random' },
        ];
        cases.forEach((q) => {
            expect(searchLogsSchema.safeParse(q).success).toBe(false);
        });
    });
});

describe('SystemLog Schema — ข้อมูลครบตาม พ.ร.บ.คอมพิวเตอร์ ม.26', () => {
    const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    let model;

    beforeAll(() => {
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        const match = schema.match(/model SystemLog \{[\s\S]*?\n\}/);
        model = match ? match[0] : '';
    });

    test('ต้องมี field ครบตามกฎหมาย (userId, ipAddress, action, resource, userAgent, createdAt)', () => {
        expect(model).toMatch(/userId\s+String/);
        expect(model).toMatch(/ipAddress\s+String/);
        expect(model).toMatch(/action\s+String/);
        expect(model).toMatch(/resource\s+String/);
        expect(model).toMatch(/userAgent\s+String/);
        expect(model).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
    });

    test('ipAddress ต้องรองรับ IPv6 (VarChar 45)', () => {
        expect(model).toMatch(/ipAddress.*@db\.VarChar\(45\)/);
    });

    test('ต้องมี index บน createdAt และ userId', () => {
        expect(model).toContain('@@index([createdAt])');
        expect(model).toContain('@@index([userId])');
    });

    test('ต้องไม่มี soft-delete field (immutable log)', () => {
        expect(model).not.toContain('deletedAt');
        expect(model).not.toContain('isDeleted');
    });
});
