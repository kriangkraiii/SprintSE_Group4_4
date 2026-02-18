const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const { Prisma } = require('@prisma/client');

const SALT_ROUNDS = 10;

module.exports = async function ensureAdmin() {
    const {
        ADMIN_EMAIL,
        ADMIN_USERNAME,
        ADMIN_PASSWORD,
        ADMIN_FIRST_NAME,
        ADMIN_LAST_NAME,
    } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
        console.warn('⚠️  Skipping auto-admin bootstrap: ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD not fully set.');
        return { status: 'skipped', reason: 'missing-env' };
    }
    try {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount > 0) {
            console.log('✔ Admin already exists. Skipping admin bootstrap.');
            return { status: 'skipped', reason: 'already-exists' };
        }

        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }],
            },
        });

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

        if (existing) {
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    role: 'ADMIN',
                    isVerified: true,
                    isActive: true,
                    password: passwordHash,
                    ...(ADMIN_FIRST_NAME ? { firstName: ADMIN_FIRST_NAME } : {}),
                    ...(ADMIN_LAST_NAME ? { lastName: ADMIN_LAST_NAME } : {}),
                },
            });
            console.log(`🔐 Elevated existing user (${existing.email || existing.username}) to ADMIN.`);
            return { status: 'done', reason: 'elevated-existing-user' };
        } else {
            await prisma.user.create({
                data: {
                    email: ADMIN_EMAIL,
                    username: ADMIN_USERNAME,
                    password: passwordHash,
                    firstName: ADMIN_FIRST_NAME || 'Admin',
                    lastName: ADMIN_LAST_NAME || '',
                    role: 'ADMIN',
                    isVerified: true,
                    isActive: true,
                },
            });
            console.log(`🔐 Created initial ADMIN account (${ADMIN_EMAIL}).`);
            return { status: 'done', reason: 'created-initial-admin' };
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientInitializationError) {
            console.warn(`⚠️  Skipping auto-admin bootstrap: database unreachable (${error.message.split('\n')[0]}).`);
            return { status: 'skipped', reason: 'database-unreachable' };
        }
        throw error;
    }
};
