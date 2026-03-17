const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const BOOKING_ID = 'cmmu817q20001vr3e36ydv06d';
// Pickup location ของ Somchai (lat:13.0, lng:100.0)
// ระยะห่างในแต่ละแบบ (1° lat ≈ 111km):
// FIVE_KM  → อยู่ที่ lat 13.027  (≈ 3km ห่าง)
// ONE_KM   → อยู่ที่ lat 13.008  (≈ 0.88km ห่าง)
// ZERO_KM  → อยู่ที่ lat 13.0001 (≈ 11m — "ถึงแล้ว")
const GPS_POSITIONS = [
    { type: 'FIVE_KM',  lat: 13.027,  lng: 100.0, label: '🚗 คนขับใกล้ถึงแล้ว (5 กม.)' },
    { type: 'ONE_KM',   lat: 13.008,  lng: 100.0, label: '🚗 คนขับใกล้ถึงมาก (1 กม.)' },
    { type: 'ZERO_KM',  lat: 13.0001, lng: 100.0, label: '✅ คนขับถึงจุดรับแล้ว! (GPS)' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function triggerAllNotifications() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🔔  ยิงแจ้งเตือนครบทุกประเภทตามระบบของโปรเจค          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ---- STEP 1: ล้างข้อมูล Arrival Notification เดิมทั้งหมด ----
  console.log('🧹 ขั้นที่ 1/6: ล้าง Cooldown ทั้งหมดก่อน...');
  await prisma.arrivalNotification.deleteMany({ where: { bookingId: BOOKING_ID } });
  console.log('   ✅ ล้างเรียบร้อย\n');

  // ---- STEP 2: Login คนขับ ----
  console.log('🔑 ขั้นที่ 2/6: Login คนขับ...');
  const dvr = await prisma.user.findFirst({ where: { role: 'DRIVER' } });
  const hash = await bcrypt.hash('Cp12345678', 10);
  await prisma.user.update({ where: { id: dvr.id }, data: { password: hash } });

  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: dvr.email, password: 'Cp12345678' })
  }).then(r => r.json());

  const token = loginRes?.data?.token;
  if (!token) { console.log('❌ Login failed:', loginRes); process.exit(1); }
  console.log(`   ✅ คนขับ: ${dvr.email}\n`);

  // ---- STEP 3-5: ยิง GPS-based notifications (FIVE_KM / ONE_KM / ZERO_KM) ----
  for (let i = 0; i < GPS_POSITIONS.length; i++) {
    const pos = GPS_POSITIONS[i];
    console.log(`📍 ขั้นที่ ${i + 3}/6: ส่งพิกัด GPS → ${pos.label}`);
    
    const res = await fetch('http://localhost:3001/api/arrival-notifications/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ bookingId: BOOKING_ID, lat: pos.lat, lon: pos.lng })
    });

    const body = await res.json();
    if (body.success) {
      const newN = body.data?.newNotifications?.length ?? 0;
      console.log(`   ✅ ระยะห่าง: ${body.data?.distanceKm} กม. | แจ้งเตือนใหม่: ${newN} รายการ`);
    } else {
      console.log(`   ⚠️  ${body.message}`);
    }
    await sleep(1500); // หน่วงเล็กน้อยเพื่อให้เห็นชัดบนหน้าจอ
    console.log('');
  }

  // ---- STEP 6: ยิง MANUAL ----
  console.log('🖐  ขั้นที่ 6/6: คนขับกดปุ่ม "ฉันมาถึงแล้ว" ด้วยตัวเอง (MANUAL)...');
  // ล้าง MANUAL cooldown ก่อน เผื่อ ZERO_KM สร้างไว้แล้ว
  await prisma.arrivalNotification.deleteMany({ where: { bookingId: BOOKING_ID, radiusType: 'MANUAL' } });

  const manualRes = await fetch('http://localhost:3001/api/arrival-notifications/manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ bookingId: BOOKING_ID })
  });
  const manualBody = await manualRes.json();
  if (manualBody.success) {
    console.log('   ✅ MANUAL Arrival Notification ส่งสำเร็จ!\n');
  } else {
    console.log(`   ⚠️  ${manualBody.message}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ ยิงครบทั้ง 4 แบบแล้ว! ดูผลที่หน้าเว็บ http://localhost:3000');
  console.log('   🔔 กระดิ่งควรมีตัวเลขแจ้งเตือนเพิ่มขึ้น');
  console.log('   🖥  Desktop Notification เด้งขึ้น (ถ้ากด Allow แล้ว)');
  console.log('   🔊 มีเสียงแจ้งเตือน');
  console.log('═══════════════════════════════════════════════════════════');

  process.exit(0);
}

triggerAllNotifications().catch(console.error);
