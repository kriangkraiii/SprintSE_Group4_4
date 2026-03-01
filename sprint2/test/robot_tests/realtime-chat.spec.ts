import { test, expect } from '@playwright/test';

// ให้รันแค่ทีละเบราว์เซอร์ ไม่แย่งกันทำงาน
test.describe.configure({ mode: 'serial', timeout: 120000 });

test('Basic Scenario: User A and User B Login and Chat', async ({ browser }) => {
    // สร้าง 2 หน้าต่าง ที่ไม่แชร์ Cookie กัน
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // ==========================================
    // 1. User A (bow1234) Login
    // ==========================================
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500); // รอฟอร์มหน่วงนิดหน่อย
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');

    // รอจนเปลี่ยนหน้าสำเร็จ (หลังจากกด Login เสร็จ ระบบควรรีไดเรกต์ไปหน้าอื่น)
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ==========================================
    // 2. User B (kiangnz25464) Login
    // ==========================================
    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');

    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ==========================================
    // 3. User A เข้าห้องแชท
    // ==========================================
    await pageA.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text="รายการแชท"', { timeout: 15000 });

    // สำคัญ: ห้ามใช้ a:has(img) เพราะมันจะไปกดโดนรูปโปรไฟล์มุมขวาบน 
    // ต้องให้มันเจาะจงกดที่ div กรอบรายการแชทแทน
    const chatRoomQuery = 'div.divide-y > a';
    await pageA.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageA.click(chatRoomQuery, { force: true });

    await pageA.waitForSelector('textarea', { timeout: 15000 }); // รอกล่องพิมพ์ข้อความโผล่

    // ==========================================
    // 4. User B เข้าห้องแชท
    // ==========================================
    await pageB.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageB.waitForSelector('text="รายการแชท"', { timeout: 15000 });
    await pageB.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageB.click(chatRoomQuery, { force: true });

    await pageB.waitForSelector('textarea', { timeout: 15000 }); // รอกล่องพิมพ์ข้อความโผล่

    // ==========================================
    // 5. ทดสอบส่งข้อความหากัน
    // ==========================================
    // A ส่งหา B
    const msga = `เทสส่งข้อความจาก A ไป B: ${Date.now()}`;
    await pageA.fill('textarea', msga);
    await pageA.keyboard.press('Enter');

    // B ควรจะเห็นข้อความที่ A พิมพ์
    await expect(pageB.locator(`text="${msga}"`).first()).toBeVisible({ timeout: 10000 });

    // B ส่งกลับอไปหา A
    const msgb = `B ได้รับแล้ว ส่งกลับไปนะ: ${Date.now()}`;
    await pageB.fill('textarea', msgb);
    await pageB.keyboard.press('Enter');

    // A ควรจะเห็นข้อความที่ B พิมพ์
    await expect(pageA.locator(`text="${msgb}"`).first()).toBeVisible({ timeout: 10000 });

    // รอดูนิดนึงก่อนจบคลิป
    await pageA.waitForTimeout(2000);

    // ปิดหน้าต่าง
    await contextA.close();
    await contextB.close();
});
