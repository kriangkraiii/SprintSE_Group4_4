const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function triggerNotification() {
  const userRecord = await prisma.user.findFirst({
    where: { email: 'somchai.pass@test.com' } // Testing with somchai
  });
  
  if (!userRecord) {
    console.error('User not found!');
    process.exit(1);
  }

  // Get admin token
  const authLoginResult = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kriangkrai.p@kkumail.com', password: 'Cp12345678' }) 
  }).then(r => r.json());

  const token = authLoginResult?.data?.token;
  if (!token) {
      console.log('Login failed: ', authLoginResult);
      process.exit(1);
  }

  // Create Notification via API
  const res = await fetch('http://localhost:3001/api/notifications/admin', {
      method: "POST",
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
          userId: userRecord.id,
          type: "SYSTEM",
          title: "🚀 แจ้งเตือนด่วนจากระบบ!",
          body: "สวัสดีครับ! นี่คือการทดสอบแจ้งเตือนเด้งเข้าหน้าจอ Desktop ของคุณ 🎉",
          link: "/"
      })
  });

  const body = await res.json();
  console.log('Notification Trigger Result:', body);
  console.log('---');
  console.log('✅ แจ้งเตือนถูกยิงออกไปเรียบร้อยแล้ว กรุณาดูที่หน้าจอของคุณครับ');
  process.exit(0);
}

triggerNotification();
