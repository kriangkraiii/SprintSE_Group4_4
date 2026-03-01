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

module.exports = prisma;