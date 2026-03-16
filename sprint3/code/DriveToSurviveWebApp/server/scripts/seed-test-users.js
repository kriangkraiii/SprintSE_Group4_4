/**
 * Seed Test Users
 * เพิ่มข้อมูลผู้ใช้สำหรับทดสอบ — คนขับ, ผู้โดยสาร, แอดมิน
 *
 * รัน: node server/scripts/seed-test-users.js
 * รหัสผ่านทุกคน: password123
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const TEST_USERS = [
  // ── คนขับ (DRIVER) ──
  {
    username: 'somsak_d',
    email: 'somsak.driver@test.com',
    firstName: 'สมศักดิ์',
    lastName: 'วงศ์ดี',
    role: 'DRIVER',
    phoneNumber: '0891234501',
    gender: 'MALE',
    isVerified: true,
    isActive: true,
  },
  {
    username: 'ploy_d',
    email: 'ploy.driver@test.com',
    firstName: 'พลอย',
    lastName: 'สุขใจ',
    role: 'DRIVER',
    phoneNumber: '0891234502',
    gender: 'FEMALE',
    isVerified: true,
    isActive: true,
  },
  {
    username: 'jack_d',
    email: 'jack.driver@test.com',
    firstName: 'แจ็ค',
    lastName: 'ศรีสวัสดิ์',
    role: 'DRIVER',
    phoneNumber: '0891234503',
    gender: 'MALE',
    isVerified: true,
    isActive: true,
  },

  // ── ผู้โดยสาร (PASSENGER) ──
  {
    username: 'somchai_p',
    email: 'somchai.pass@test.com',
    firstName: 'สมชาย',
    lastName: 'รักเรียน',
    role: 'PASSENGER',
    phoneNumber: '0891234601',
    gender: 'MALE',
    isActive: true,
  },
  {
    username: 'nampetch_p',
    email: 'nampetch.pass@test.com',
    firstName: 'น้ำเพชร',
    lastName: 'ใจดี',
    role: 'PASSENGER',
    phoneNumber: '0891234602',
    gender: 'FEMALE',
    isActive: true,
  },
  {
    username: 'tong_p',
    email: 'tong.pass@test.com',
    firstName: 'ต้อง',
    lastName: 'พิทักษ์',
    role: 'PASSENGER',
    phoneNumber: '0891234603',
    gender: 'MALE',
    isActive: true,
  },
  {
    username: 'fern_p',
    email: 'fern.pass@test.com',
    firstName: 'เฟิร์น',
    lastName: 'ชัยชนะ',
    role: 'PASSENGER',
    phoneNumber: '0891234604',
    gender: 'FEMALE',
    isActive: true,
  },
  {
    username: 'beam_p',
    email: 'beam.pass@test.com',
    firstName: 'บีม',
    lastName: 'อัศวิน',
    role: 'PASSENGER',
    phoneNumber: '0891234605',
    gender: 'MALE',
    isActive: true,
  },

  // ── แอดมิน (ADMIN) ──
  {
    username: 'admin_test',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'Tester',
    role: 'ADMIN',
    phoneNumber: '0891234700',
    isVerified: true,
    isActive: true,
  },
];

async function main() {
  console.log('🚀 เริ่มเพิ่มข้อมูลผู้ใช้สำหรับทดสอบ...\n');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const emails = TEST_USERS.map((u) => u.email);

  // ตรวจสอบ email ที่มีอยู่แล้ว
  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingEmails = new Set(existing.map((u) => u.email));

  let created = 0;
  let skipped = 0;

  for (const userData of TEST_USERS) {
    if (existingEmails.has(userData.email)) {
      console.log(`⏭️  ${userData.username} (${userData.email}) — มีอยู่แล้ว, ข้าม`);
      skipped++;
      continue;
    }

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    // สร้าง DriverVerification สำหรับคนขับที่ verified
    if (userData.role === 'DRIVER' && userData.isVerified) {
      await prisma.driverVerification.create({
        data: {
          userId: user.id,
          licenseNumber: `DL-${userData.username.toUpperCase()}`,
          firstNameOnLicense: userData.firstName,
          lastNameOnLicense: userData.lastName,
          licenseIssueDate: new Date('2024-01-01'),
          licenseExpiryDate: new Date('2029-01-01'),
          licensePhotoUrl: 'https://placehold.co/400x250/e2e8f0/94a3b8?text=License',
          selfiePhotoUrl: 'https://placehold.co/300x300/e2e8f0/94a3b8?text=Selfie',
          typeOnLicense: 'PRIVATE_CAR',
          status: 'APPROVED',
        },
      });
    }

    const roleEmoji = { DRIVER: '🚗', PASSENGER: '🧑', ADMIN: '👑' };
    console.log(`✅ ${roleEmoji[userData.role]} ${userData.firstName} ${userData.lastName} (${userData.email})`);
    created++;
  }

  console.log(`\n📊 สรุป: สร้างใหม่ ${created} คน, ข้าม ${skipped} คน`);
  console.log('🔑 รหัสผ่านทุกคน: password123');
  console.log('\n👤 รายชื่อสำหรับล็อกอินทดสอบ:');
  console.log('─'.repeat(50));
  console.log('DRIVER:    somsak.driver@test.com');
  console.log('DRIVER:    ploy.driver@test.com');
  console.log('DRIVER:    jack.driver@test.com');
  console.log('PASSENGER: somchai.pass@test.com');
  console.log('PASSENGER: nampetch.pass@test.com');
  console.log('PASSENGER: tong.pass@test.com');
  console.log('PASSENGER: fern.pass@test.com');
  console.log('PASSENGER: beam.pass@test.com');
  console.log('ADMIN:     admin@test.com');
  console.log('─'.repeat(50));
}

main()
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
