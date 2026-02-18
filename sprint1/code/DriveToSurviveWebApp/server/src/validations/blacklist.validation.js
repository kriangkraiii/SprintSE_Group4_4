const { z } = require('zod');

const addBlacklistSchema = z.object({
    nationalId: z
        .string()
        .length(13, 'National ID must be exactly 13 digits')
        .regex(/^\d{13}$/, 'National ID must contain only digits'),
    reason: z.string().max(500).optional(),
});

const checkBlacklistSchema = z.object({
    nationalId: z
        .string()
        .length(13, 'National ID must be exactly 13 digits')
        .regex(/^\d{13}$/, 'National ID must contain only digits'),
});

const searchBlacklistSchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    createdFrom: z.string().datetime({ offset: true }).optional(),
    createdTo: z.string().datetime({ offset: true }).optional(),
    sortBy: z.enum(['createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

module.exports = { addBlacklistSchema, checkBlacklistSchema, searchBlacklistSchema };
