/**
 * seed-robot-tests.js
 * เตรียมข้อมูลจำลองสำหรับ Robot Framework Tests
 *
 * วิธีรัน:
 *   cd server
 *   node prisma/seed-robot-tests.js
 *
 * ข้อมูลที่สร้าง:
 *   Users:
 *     - testpassenger@test.com  / Test1234  (PASSENGER — สำหรับ US3 RBAC, US16)
 *     - testdelete@test.com     / Test1234  (PASSENGER — สำหรับ US16 ลบบัญชี)
 *   Blacklist:
 *     - เลขบัตร 1234567890123 → เพิ่มเข้า blacklist (สำหรับ TC-BL-003, TC-BL-005)
 *     - ล้างเลขบัตร 1234567890001 ออกจาก blacklist (สำหรับ TC-BL-002 เพิ่มใหม่)
 *     - ล้างเลขบัตร 9876543210987 ออกจาก blacklist (สำหรับ TC-BL-010)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const hashNationalId = (rawId) =>
  crypto.createHash('sha256').update(rawId.trim()).digest('hex');

// ─── Test Users ───────────────────────────────────────────
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

// ─── Blacklist Entries ────────────────────────────────────
// เลขบัตรที่ต้องอยู่ใน blacklist (TC-BL-003 ซ้ำ, TC-BL-005 ถูก block)
const BLACKLISTED_IDS = ['1234567890123'];

// เลขบัตรที่ต้องไม่อยู่ใน blacklist (TC-BL-002 เพิ่มใหม่, TC-BL-010 hash test)
const CLEAN_IDS = ['1234567890001', '9876543210987', '9999999999999'];

async function seedUsers() {
  console.log('\n👤 เตรียมบัญชีผู้ใช้ทดสอบ...');
  for (const userData of TEST_USERS) {
    const { password: plain, ...rest } = userData;
    const hashedPassword = await bcrypt.hash(plain, SALT_ROUNDS);

    const existing = await prisma.user.findUnique({ where: { email: rest.email } });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...rest,
          password: hashedPassword,
          deletedAt: null,
          isActive: true,
        },
      });
      console.log(`  ✔ รีเซ็ตบัญชี ${rest.email}`);
    } else {
      await prisma.user.create({
        data: { ...rest, password: hashedPassword },
      });
      console.log(`  ✔ สร้างบัญชี ${rest.email}`);
    }
  }
}

async function seedBlacklist() {
  console.log('\n🚫 เตรียมข้อมูล Blacklist...');

  // หา admin user สำหรับ createdByAdminId
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('  ⚠️  ไม่พบ Admin user — ข้ามการสร้าง blacklist');
    return;
  }

  // ล้างเลขบัตรที่ต้องไม่อยู่ใน blacklist
  for (const rawId of CLEAN_IDS) {
    const hash = hashNationalId(rawId);
    const existing = await prisma.blacklist.findUnique({ where: { nationalIdHash: hash } });
    if (existing) {
      await prisma.blacklist.delete({ where: { nationalIdHash: hash } });
      console.log(`  ✔ ลบออกจาก blacklist: ${rawId} (เพื่อให้ TC-BL-002/TC-BL-010 เพิ่มใหม่ได้)`);
    } else {
      console.log(`  ✔ ยืนยัน: ${rawId} ไม่อยู่ใน blacklist แล้ว`);
    }
  }

  // ล้างข้อมูลขยะ (TEST_HASH_123) ที่อาจตกค้างจากการทดสอบเก่า
  await prisma.blacklist.deleteMany({ where: { nationalIdHash: 'TEST_HASH_123' } });
  console.log('  ✔ ล้างข้อมูลขยะ: TEST_HASH_123');

  // เพิ่มเลขบัตรที่ต้องอยู่ใน blacklist
  for (const rawId of BLACKLISTED_IDS) {
    const hash = hashNationalId(rawId);
    const existing = await prisma.blacklist.findUnique({ where: { nationalIdHash: hash } });
    if (!existing) {
      await prisma.blacklist.create({
        data: {
          nationalIdHash: hash,
          reason: 'ฉ้อโกง (seed สำหรับทดสอบ TC-BL-003, TC-BL-005)',
          createdByAdminId: admin.id,
        },
      });
      console.log(`  ✔ เพิ่มเข้า blacklist: ${rawId}`);
    }
  }

  // เพิ่มข้อมูล Blacklist จำลอง (เพื่อให้ตารางดูมีข้อมูล)
  for (let i = 1; i <= 5; i++) {
    const rawId = `900000000000${i}`;
    const hash = hashNationalId(rawId);
    const existing = await prisma.blacklist.findUnique({ where: { nationalIdHash: hash } });
    if (!existing) {
      await prisma.blacklist.create({
        data: {
          nationalIdHash: hash,
          reason: `Mock entry #${i} for demo`,
          createdByAdminId: admin.id,
        },
      });
    }
  }
  console.log('  ✔ เพิ่มข้อมูล Blacklist จำลอง 5 รายการ');
}

async function seedSystemLogs() {
  console.log('\n📜 เตรียมข้อมูล System Logs...');
  const existingCount = await prisma.systemLog.count();
  // Create mock logs if needed
  if (existingCount < 30) {
    const logs = [];
    for (let i = 1; i <= 30; i++) {
      logs.push({
        userId: 'admin-seed-id',
        ipAddress: '127.0.0.1',
        action: 'GET',
        resource: `/api/demo/log/${i}`,
        userAgent: 'RobotFramework/Seed',
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60),
      });
    }
    await prisma.systemLog.createMany({ data: logs });
    console.log(`  ✔ เพิ่ม System Logs จำลอง ${logs.length} รายการ (รวมของเดิม ${existingCount})`);
  } else {
    console.log(`  ✔ มี System Logs อยู่แล้ว ${existingCount} รายการ (เพียงพอสำหรับการทดสอบ)`);
  }
}

async function printSummary() {
  const userCount = await prisma.user.count({ where: { email: { in: TEST_USERS.map(u => u.email) } } });
  const blCount = await prisma.blacklist.count();

  console.log('\n📋 สรุปข้อมูลทดสอบ:');
  console.log('─────────────────────────────────────────');
  console.log('  Users:');
  console.log('    Passenger : testpassenger@test.com / Test1234');
  console.log('    Delete    : testdelete@test.com    / Test1234');
  console.log(`  Blacklist entries ทั้งหมด: ${blCount} รายการ`);
  console.log('  Blacklisted IDs (สำหรับ TC-BL-003, TC-BL-005):');
  for (const id of BLACKLISTED_IDS) {
    console.log(`    - ${id}`);
  }
  console.log('  Clean IDs (สำหรับ TC-BL-002, TC-BL-007, TC-BL-010):');
  for (const id of CLEAN_IDS) {
    console.log(`    - ${id}`);
  }
  console.log('─────────────────────────────────────────');
  console.log('\n✅ พร้อม run Robot Framework Tests แล้ว!');
  console.log('   cd robot_tests && source venv/bin/activate');
  console.log('   robot US1_SystemLog/ US3_Blacklist/ US16_AccountDeletion/');
}

async function main() {
  await seedUsers();
  await seedBlacklist();
  await seedSystemLogs();
  await printSummary();
}

main()
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
