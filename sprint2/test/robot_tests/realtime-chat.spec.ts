import { test, expect } from '@playwright/test';

// ให้รันแค่ทีละเบราว์เซอร์ ไม่แย่งกันทำงาน
test.describe.configure({ mode: 'serial', timeout: 120000 });

test('Basic Scenario : User A and User B Login and Chat', async ({ browser }) => {
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

test('Scenario 2 : Quick reply feature (existing)', async ({ browser }) => {
    test.setTimeout(60000);

    // 1. Setup Contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 2. Login User A & B
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // 3. Enter Chat
    const chatRoomQuery = 'div.divide-y > a';

    await pageA.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text="รายการแชท"', { timeout: 15000 });
    await pageA.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageA.click(chatRoomQuery, { force: true });
    await pageA.waitForSelector('textarea', { timeout: 15000 });

    await pageB.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageB.waitForSelector('text="รายการแชท"', { timeout: 15000 });
    await pageB.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageB.click(chatRoomQuery, { force: true });
    await pageB.waitForSelector('textarea', { timeout: 15000 });

    // ==========================================
    // 4. A ส่ง Quick Reply ไปหา B
    // ==========================================
    await pageA.click('button[title="ตอบกลับด่วน"]');
    await pageA.waitForSelector('button.bg-blue-50', { timeout: 5000 });

    const quickReplyBtnA = pageA.locator('button.bg-blue-50').first();
    const msgFromA = await quickReplyBtnA.innerText();

    await quickReplyBtnA.click();

    // B ต้องเห็นข้อความจาก A
    await expect(pageB.locator(`text="${msgFromA}"`).first())
        .toBeVisible({ timeout: 10000 });

    // ==========================================
    // 5. B ต้องส่ง Quick Reply กลับหา A (เงื่อนไขผ่าน)
    // ==========================================
    await pageB.click('button[title="ตอบกลับด่วน"]');
    await pageB.waitForSelector('button.bg-blue-50', { timeout: 5000 });

    const quickReplyBtnB = pageB.locator('button.bg-blue-50').first();
    const msgFromB = await quickReplyBtnB.innerText();

    await quickReplyBtnB.click();

    // A ต้องเห็นข้อความจาก B
    await expect(pageA.locator(`text="${msgFromB}"`).first())
        .toBeVisible({ timeout: 10000 });

    // ถ้าไม่เห็น จะ fail ตรงนี้ทันที

    await pageA.waitForTimeout(3000);

    await contextA.close();
    await contextB.close();
});


test('Scenario 3: Create, Send, and Delete New Quick Reply', async ({ browser }) => {
    test.setTimeout(90000);
    // 1. Setup Contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 2. Login User A & B
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500);
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // 3. User A & B Enter Chat
    const chatRoomQuery = 'div.divide-y > a';

    await pageA.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text="รายการแชท"', { timeout: 15000 });
    await pageA.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageA.click(chatRoomQuery, { force: true });
    await pageA.waitForSelector('textarea', { timeout: 15000 });

    await pageB.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageB.waitForSelector('text="รายการแชท"', { timeout: 15000 });
    await pageB.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageB.click(chatRoomQuery, { force: true });
    await pageB.waitForSelector('textarea', { timeout: 15000 });

    // ==========================================
    // 4. Create & Send New Quick Reply (User A ส่งหา User B)
    // ==========================================
    // เปิดการจัดการคีย์ลัด
    const openManageBtnA = pageA.locator('button[title="จัดการคีย์ลัด"]');
    if (!(await openManageBtnA.isVisible())) {
        await pageA.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnA.waitFor({ state: 'visible', timeout: 5000 });
    }
    await openManageBtnA.click();
    await pageA.waitForSelector('h3:has-text("จัดการคีย์ลัดด่วน")', { timeout: 5000 });

    const newSnippetTextA = `(A) เพิ่งสร้างด่วนๆ: ${Date.now()}`;
    await pageA.fill('input[placeholder="พิมพ์คีย์ลัดใหม่..."]', newSnippetTextA);
    await pageA.click('button:has-text("เพิ่ม")');

    // รอให้ Toast ยืนยันว่า API เซฟผ่าน
    await expect(pageA.locator('text="เพิ่มคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });

    // ปิด Modal
    const closeBtnA = pageA.locator('h3:has-text("จัดการคีย์ลัดด่วน")').locator('..').locator('button');
    await closeBtnA.click();
    await pageA.waitForTimeout(500);

    // เปิดเมนูตอบกลับด่วนเพื่อส่ง
    if (!(await openManageBtnA.isVisible())) {
        await pageA.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnA.waitFor({ state: 'visible', timeout: 5000 });
    }

    // หารายการข้อความใหม่ที่เพิ่งสร้าง แล้วกดส่ง
    const newQuickReplyBtnA = pageA.locator('button.bg-blue-50').filter({ hasText: newSnippetTextA }).first();
    await newQuickReplyBtnA.waitFor({ state: 'visible', timeout: 5000 });
    await newQuickReplyBtnA.click();

    // ฝั่ง B ต้องได้รับข้อความนี้
    await expect(pageB.locator(`text="${newSnippetTextA}"`).first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // 5. Delete Quick Reply (User A)
    // ==========================================
    if (!(await openManageBtnA.isVisible())) {
        await pageA.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnA.waitFor({ state: 'visible', timeout: 5000 });
    }
    await openManageBtnA.click();

    const listItemTextA = pageA.locator(`text="${newSnippetTextA}"`);
    await listItemTextA.waitFor({ state: 'visible', timeout: 5000 });

    const listItemA = pageA.locator('.flex.items-center').filter({ hasText: newSnippetTextA });
    await listItemA.locator('button[title="ลบ"]').click();

    await expect(pageA.locator('text="ลบคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });
    await closeBtnA.click();
    await pageA.waitForTimeout(500);

    // ==========================================
    // 6. Create & Send New Quick Reply (User B ส่งหา User A)
    // ==========================================
    const openManageBtnB = pageB.locator('button[title="จัดการคีย์ลัด"]');
    if (!(await openManageBtnB.isVisible())) {
        await pageB.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnB.waitFor({ state: 'visible', timeout: 5000 });
    }
    await openManageBtnB.click();
    await pageB.waitForSelector('h3:has-text("จัดการคีย์ลัดด่วน")', { timeout: 5000 });

    const newSnippetTextB = `(B) รีบลงมาด่วนๆ: ${Date.now()}`;
    await pageB.fill('input[placeholder="พิมพ์คีย์ลัดใหม่..."]', newSnippetTextB);
    await pageB.click('button:has-text("เพิ่ม")');

    await expect(pageB.locator('text="เพิ่มคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });

    const closeBtnB = pageB.locator('h3:has-text("จัดการคีย์ลัดด่วน")').locator('..').locator('button');
    await closeBtnB.click();
    await pageB.waitForTimeout(500);

    if (!(await openManageBtnB.isVisible())) {
        await pageB.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnB.waitFor({ state: 'visible', timeout: 5000 });
    }

    const newQuickReplyBtnB = pageB.locator('button.bg-blue-50').filter({ hasText: newSnippetTextB }).first();
    await newQuickReplyBtnB.waitFor({ state: 'visible', timeout: 5000 });
    await newQuickReplyBtnB.click();

    await expect(pageA.locator(`text="${newSnippetTextB}"`).first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // 7. Delete Quick Reply (User B)
    // ==========================================
    if (!(await openManageBtnB.isVisible())) {
        await pageB.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnB.waitFor({ state: 'visible', timeout: 5000 });
    }
    await openManageBtnB.click();

    const listItemTextB = pageB.locator(`text="${newSnippetTextB}"`);
    await listItemTextB.waitFor({ state: 'visible', timeout: 5000 });

    const listItemB = pageB.locator('.flex.items-center').filter({ hasText: newSnippetTextB });
    await listItemB.locator('button[title="ลบ"]').click();

    await expect(pageB.locator('text="ลบคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });
    await closeBtnB.click();

    // รอดูผลลัพธ์การลบฝั่ง B แปปนึง
    await pageB.waitForTimeout(3000);

    // ปิดหน้าต่างทีละเบราว์เซอร์
    await contextA.close();
    await contextB.close();
});
