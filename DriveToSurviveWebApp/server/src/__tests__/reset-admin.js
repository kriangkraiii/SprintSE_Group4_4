const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function resetPassword() {
    const username = process.argv[2] || process.env.ADMIN_USERNAME || 'admin123';
    const newPassword = process.argv[3] || process.env.ADMIN_PASSWORD || '12345678';

    console.log(`🔍 Searching for user: ${username}`);

    const user = await prisma.user.findFirst({
        where: {
            OR: [{ username: username }, { email: username }]
        }
    });

    if (!user) {
        console.error(`❌ User not found: ${username}`);
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash }
    });

    console.log(`✅ Password for user '${user.username}' (${user.email}) has been reset to: ${newPassword}`);
}

resetPassword()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
