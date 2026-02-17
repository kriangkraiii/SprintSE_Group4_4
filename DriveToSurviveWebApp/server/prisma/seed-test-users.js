/**
 * สร้างบัญชีทดสอบสำหรับ Robot Framework / Postman
 *
 * วิธีรัน:
 *   cd server
 *   node prisma/seed-test-users.js
 *
 * บัญชีที่สร้าง:
 *   1. testpassenger@test.com  / Test1234  (PASSENGER)
 *   2. testdelete@test.com     / Test1234  (PASSENGER — สำหรับทดสอบลบบัญชี)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const TEST_USERS = [
  {
    email: 'testpassenger@test.com',
    username: 'testpassenger',
    password: 'Test1234',
    firstName: 'ผู้โดยสาร',
    lastName: 'ทดสอบ',
    phoneNumber: '0800000001',
    nationalIdNumber: '1111111111111',
    role: 'PASSENGER',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'testdelete@test.com',
    username: 'testdelete',
    password: 'Test1234',
    firstName: 'ลบบัญชี',
    lastName: 'ทดสอบ',
    phoneNumber: '0800000002',
    nationalIdNumber: '2222222222222',
    role: 'PASSENGER',
    isVerified: true,
    isActive: true,
  },
];

async function main() {
  for (const userData of TEST_USERS) {
    const { password: plain, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(plain, SALT_ROUNDS);

    const existing = await prisma.user.findUnique({ where: { email: rest.email } });

    if (existing) {
      // รีเซ็ตบัญชีให้พร้อมทดสอบ
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...rest,
          password: hashedPassword,
          deletedAt: null,
        },
      });
      console.log(`✔ รีเซ็ตบัญชี ${rest.email} แล้ว`);
    } else {
      await prisma.user.create({
        data: { ...rest, password: hashedPassword },
      });
      console.log(`✔ สร้างบัญชี ${rest.email} แล้ว`);
    }
  }

  console.log('\n📋 สรุปบัญชีทดสอบ:');
  console.log('   Passenger : testpassenger@test.com / Test1234');
  console.log('   Delete    : testdelete@test.com    / Test1234');
}

main()
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
