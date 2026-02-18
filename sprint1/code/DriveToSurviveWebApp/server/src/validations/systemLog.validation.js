const { z } = require('zod');

const searchLogsSchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    userId: z.string().optional(),
    ipAddress: z.string().optional(),
    action: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']).optional(),
    createdFrom: z.string().datetime({ offset: true }).optional(),
    createdTo: z.string().datetime({ offset: true }).optional(),
    sortBy: z.enum(['createdAt', 'action', 'ipAddress']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

const deleteLogParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

module.exports = { searchLogsSchema, deleteLogParamsSchema };
