const { PrismaClient } = require('@prisma/client');

let prisma;

const prismaOptions = {
    log: process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['error', 'warn'],
};

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient(prismaOptions);
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient(prismaOptions);
    }
    prisma = global.prisma;
}

// Log connection errors
prisma.$on?.('error', (e) => {
    console.error('[Prisma] Error:', e.message);
});

/**
 * Retry-on-disconnect middleware
 * Catches "Server has closed the connection" and retries once after reconnecting.
 */
prisma.$use?.(async (params, next) => {
    try {
        return await next(params);
    } catch (err) {
        const msg = err?.message || '';
        const isConnectionLost =
            msg.includes('Server has closed the connection') ||
            msg.includes("Can't reach database server") ||
            msg.includes('Connection lost') ||
            msg.includes('ECONNRESET') ||
            msg.includes('ETIMEDOUT');

        if (isConnectionLost) {
            console.warn(`[Prisma] Connection lost during ${params.model}.${params.action}, reconnecting...`);
            try {
                await prisma.$disconnect();
            } catch { /* ignore disconnect errors */ }
            await prisma.$connect();
            // Retry the query once
            return await next(params);
        }
        throw err;
    }
});

// Health-check: connect eagerly at startup
prisma.$connect()
    .then(() => console.log('[Prisma] Database connected'))
    .catch((e) => console.error('[Prisma] Initial connection failed:', e.message));

module.exports = prisma;