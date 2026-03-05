/**
 * Blacklist — bannedRole Tests
 * ทดสอบว่าระบบ blacklist รองรับการเลือก role ที่แบน (PASSENGER / DRIVER / BOTH)
 */

const { z } = require('zod');

// นำ validation schema มาทดสอบตรง
const addBlacklistSchema = z.object({
  nationalId: z
    .string()
    .length(13, 'National ID must be exactly 13 digits')
    .regex(/^\d{13}$/, 'National ID must contain only digits'),
  reason: z.string().max(500).optional(),
  bannedRole: z.enum(['PASSENGER', 'DRIVER', 'BOTH']).optional().default('BOTH'),
});

describe('Blacklist bannedRole Validation', () => {

  describe('Valid inputs', () => {
    it('should accept bannedRole = PASSENGER', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        bannedRole: 'PASSENGER',
      });
      expect(result.success).toBe(true);
      expect(result.data.bannedRole).toBe('PASSENGER');
    });

    it('should accept bannedRole = DRIVER', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        bannedRole: 'DRIVER',
      });
      expect(result.success).toBe(true);
      expect(result.data.bannedRole).toBe('DRIVER');
    });

    it('should accept bannedRole = BOTH', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        bannedRole: 'BOTH',
        reason: 'Fraudulent activity',
      });
      expect(result.success).toBe(true);
      expect(result.data.bannedRole).toBe('BOTH');
    });

    it('should default bannedRole to BOTH when not provided', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
      });
      expect(result.success).toBe(true);
      expect(result.data.bannedRole).toBe('BOTH');
    });

    it('should accept with reason and bannedRole together', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        reason: 'ใช้เอกสารปลอม',
        bannedRole: 'DRIVER',
      });
      expect(result.success).toBe(true);
      expect(result.data.reason).toBe('ใช้เอกสารปลอม');
      expect(result.data.bannedRole).toBe('DRIVER');
    });
  });

  describe('Invalid inputs', () => {
    it('should reject invalid bannedRole value', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        bannedRole: 'ADMIN',
      });
      expect(result.success).toBe(false);
    });

    it('should reject bannedRole as number', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        bannedRole: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject lowercase bannedRole', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        bannedRole: 'passenger',
      });
      expect(result.success).toBe(false);
    });

    it('should still validate nationalId (too short)', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '123456',
        bannedRole: 'BOTH',
      });
      expect(result.success).toBe(false);
    });

    it('should still validate nationalId (non-numeric)', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: 'abcdefghijklm',
        bannedRole: 'BOTH',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty string as bannedRole', () => {
      const result = addBlacklistSchema.safeParse({
        nationalId: '1234567890123',
        bannedRole: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
