// ส่ง notification ผ่าน admin API
// node triggerNotificationTest.js
// node triggerNotificationTest.js --url https://...

const args = process.argv.slice(2);
const urlIdx = args.indexOf('--url');
const BASE_URL = urlIdx !== -1 ? args[urlIdx + 1] : 'http://localhost:3001';
const isLocal = BASE_URL.includes('localhost');


const adminEmail = 'kriangkrai.p@kkumail.com';
const adminPass = isLocal ? 'Cp12345678' : '12345678';
const targetEmail = isLocal ? 'somchai.pass@test.com' : 'kiangnz25464@gmail.com';
const targetPass = 'Cp12345678';

async function main() {
  console.log(`[notif-test] server: ${BASE_URL}`);


  let targetUserId;

  if (isLocal) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findFirst({ where: { email: targetEmail } });
    if (!user) { console.error('[error] user not found'); process.exit(1); }
    targetUserId = user.id;
  } else {
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, password: targetPass }),
    }).then((r) => r.json());
    if (!login?.data?.token) { console.error('[error] target login failed', login); process.exit(1); }
    targetUserId = login.data.user?.id;
  }

  console.log(`[target] ${targetEmail} (${targetUserId})`);

  // login admin
  const auth = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPass }),
  }).then((r) => r.json());

  if (!auth?.data?.token) { console.error('[error] admin login failed', auth); process.exit(1); }
  console.log('[admin] logged in');

  // ส่ง notification
  const res = await fetch(`${BASE_URL}/api/notifications/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.data.token}`,
    },
    body: JSON.stringify({
      userId: targetUserId,
      type: 'SYSTEM',
      title: 'แจ้งเตือนจากระบบ',
      body: 'ทดสอบการส่ง notification ผ่าน admin API',
      link: '/',
    }),
  }).then((r) => r.json());

  if (res.success) {
    console.log('[sent] notification sent to', targetEmail);
  } else {
    console.log('[fail]', res.message || res);
  }

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
