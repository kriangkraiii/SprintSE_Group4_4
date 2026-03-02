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
    const msga = `เทสส่งข้อความจาก A ไป B`;
    await pageA.fill('textarea', msga);
    await pageA.keyboard.press('Enter');

    // B ควรจะเห็นข้อความที่ A พิมพ์
    await expect(pageB.locator(`text="${msga}"`).first()).toBeVisible({ timeout: 10000 });

    // B ส่งกลับอไปหา A
    const msgb = `B มองเห็นข้อความแล้ว ส่งข้อความกลับไปให้ A`;
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

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // =========================
    // Login A
    // =========================
    await pageA.goto('http://localhost:3003/login');
    await pageA.locator('#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500);
    await pageA.fill('#identifier', 'bow1234');
    await pageA.fill('#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/);

    // =========================
    // Login B
    // =========================
    await pageB.goto('http://localhost:3003/login');
    await pageB.locator('#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('#identifier', 'kiangnz25464');
    await pageB.fill('#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/);

    // =========================
    // เข้า Chat ทั้งสองฝ่าย
    // =========================
    const chatRoomQuery = 'div.divide-y > a';

    await pageA.goto('http://localhost:3003/chat');
    await pageA.waitForSelector(chatRoomQuery);
    await pageA.click(chatRoomQuery);
    await pageA.waitForSelector('textarea');

    await pageB.goto('http://localhost:3003/chat');
    await pageB.waitForSelector(chatRoomQuery);
    await pageB.click(chatRoomQuery);
    await pageB.waitForSelector('textarea');

    // ==========================================
    // STEP 1: A ส่ง Quick Reply ไปหา B
    // ==========================================
    await pageA.click('button[title="ตอบกลับด่วน"]');
    await pageA.waitForTimeout(1000);

    // เลือกว่าจะกดปุ่มที่มีข้อความ 'รอข้างล่างแล้ว'
    const quickReplyBtnA = pageA.locator('button.bg-blue-50').filter({ hasText: 'รอข้างล่างแล้ว' }).first();
    await quickReplyBtnA.waitFor({ state: 'visible' });

    const msgFromA = (await quickReplyBtnA.innerText()).trim();
    await quickReplyBtnA.click();

    // 🔥 บังคับรอให้ B เห็นข้อความ
    await expect(pageB.locator(`text="${msgFromA}"`).first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // STEP 2: B ส่ง Quick Reply กลับหา A
    // ==========================================
    await pageB.click('button[title="ตอบกลับด่วน"]');
    await pageB.waitForTimeout(1000);

    // ฝั่ง B (คนขับ/ผู้โดยสารอีกคน) เลือกว่าจะกดปุ่ม 'กำลังลงไป'
    const quickReplyBtnB = pageB.locator('button.bg-blue-50').filter({ hasText: 'กำลังลงไป' }).first();
    await quickReplyBtnB.waitFor({ state: 'visible' });

    const msgFromB = (await quickReplyBtnB.innerText()).trim();
    await quickReplyBtnB.click();

    // 🔥 บังคับรอให้ A เห็นข้อความกลับ
    await expect(pageA.locator(`text="${msgFromB}"`).first()).toBeVisible({ timeout: 15000 });

    // รอสักหน่อยก่อนจบให้เห็นชัดเจนบน UI
    await pageA.waitForTimeout(2000);

    await contextA.close();
    await contextB.close();
});




test('Scenario 3 : create new quick reply and send', async ({ browser }) => {
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

    const newSnippetTextA = `A สร้าง quick reply นี้`;
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
    await expect(pageB.getByText(newSnippetTextA).first()).toBeVisible({ timeout: 15000 });
    await pageA.waitForTimeout(3000);

    // ==========================================
    // 5. Create & Send New Quick Reply (User B ส่งหา User A)
    // ==========================================
    const openManageBtnB = pageB.locator('button[title="จัดการคีย์ลัด"]');
    if (!(await openManageBtnB.isVisible())) {
        await pageB.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnB.waitFor({ state: 'visible', timeout: 5000 });
    }
    await openManageBtnB.click();
    await pageB.waitForSelector('h3:has-text("จัดการคีย์ลัดด่วน")', { timeout: 5000 });

    const newSnippetTextB = `B เห็น quick reply แล้ว และตอบกลับด้วยการสร้าง quick reply นี้เช่นกัน`;
    await pageB.fill('input[placeholder="พิมพ์คีย์ลัดใหม่..."]', newSnippetTextB);
    await pageB.click('button:has-text("เพิ่ม")');

    await expect(pageB.locator('text="เพิ่มคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });

    // ปิด Modal
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

    await expect(pageA.getByText(newSnippetTextB).first()).toBeVisible({ timeout: 15000 });
    await pageA.waitForTimeout(3000);

    // ==========================================
    // จบ Scenario 3 (ทิ้งข้อความไว้ให้ Scenario 4 ลบ)
    // ==========================================
    await contextA.close();
    await contextB.close();
});

test('Scenario 4 : delete quick reply', async ({ browser }) => {
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

    // 3. เข้าสู่เมนูแชท
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

    const newSnippetTextA = `A สร้าง quick reply นี้`;
    const newSnippetTextB = `B เห็น quick reply แล้ว และตอบกลับด้วยการสร้าง quick reply นี้เช่นกัน`;

    // ==========================================
    // 4. Delete A's Quick Reply
    // ==========================================
    const openManageBtnA = pageA.locator('button[title="จัดการคีย์ลัด"]');
    if (!(await openManageBtnA.isVisible())) {
        await pageA.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnA.waitFor({ state: 'visible', timeout: 5000 });
    }
    await openManageBtnA.click();

    // ลบทุกอันที่มีชื่อซ้ำกันเพื่อเคลียร์ขยะจากการรันซ้ำ
    let deleteBtnA = pageA.locator(`xpath=//div[contains(@class, 'flex') and contains(., "${newSnippetTextA}")]//button[@title="ลบ"]`).first();
    while (await deleteBtnA.isVisible()) {
        await deleteBtnA.click();
        await expect(pageA.locator('text="ลบคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });
        await pageA.waitForTimeout(500);
        // เช็คซ้ำว่ายังมีอีกไหม
        deleteBtnA = pageA.locator(`xpath=//div[contains(@class, 'flex') and contains(., "${newSnippetTextA}")]//button[@title="ลบ"]`).first();
    }

    const closeBtnA = pageA.locator('h3:has-text("จัดการคีย์ลัดด่วน")').locator('..').locator('button');
    await closeBtnA.click();
    await pageA.waitForTimeout(500);

    // ✅ VERIFY: A Cannot use it anymore
    if (!(await openManageBtnA.isVisible())) {
        await pageA.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnA.waitFor({ state: 'visible', timeout: 5000 });
    }
    // ใช้ expect(...).not.toBeVisible() เพื่อยืนยันว่าปุ่มหายไปแล้วจริงๆ
    await expect(pageA.locator('button.bg-blue-50').filter({ hasText: newSnippetTextA })).not.toBeVisible();

    // ==========================================
    // 5. Delete B's Quick Reply
    // ==========================================
    const openManageBtnB = pageB.locator('button[title="จัดการคีย์ลัด"]');
    if (!(await openManageBtnB.isVisible())) {
        await pageB.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnB.waitFor({ state: 'visible', timeout: 5000 });
    }
    await openManageBtnB.click();

    let deleteBtnB = pageB.locator(`xpath=//div[contains(@class, 'flex') and contains(., "${newSnippetTextB}")]//button[@title="ลบ"]`).first();
    while (await deleteBtnB.isVisible()) {
        await deleteBtnB.click();
        await expect(pageB.locator('text="ลบคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });
        await pageB.waitForTimeout(500);
        deleteBtnB = pageB.locator(`xpath=//div[contains(@class, 'flex') and contains(., "${newSnippetTextB}")]//button[@title="ลบ"]`).first();
    }

    const closeBtnB = pageB.locator('h3:has-text("จัดการคีย์ลัดด่วน")').locator('..').locator('button');
    await closeBtnB.click();
    await pageB.waitForTimeout(500);

    if (!(await openManageBtnB.isVisible())) {
        await pageB.click('button[title="ตอบกลับด่วน"]');
        await openManageBtnB.waitFor({ state: 'visible', timeout: 5000 });
    }
    await expect(pageB.locator('button.bg-blue-50').filter({ hasText: newSnippetTextB })).not.toBeVisible();

    // ปิดหน้าต่างทีละเบราว์เซอร์
    await contextA.close();
    await contextB.close();
});

test('Scenario 5 : add image (.jpg, .png rejecting .pdf)', async ({ browser }) => {
    test.setTimeout(120000);
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

    // 3. เข้าสู่เมนูแชท
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

    // นับจำนวนรูปที่มีอยู่ตั้งแต่แรกเพื่อดูว่ามันอัปโหลดเพิ่มไหม
    const initialImagesA = await pageA.locator('.flex-1.overflow-y-auto img.max-h-64').count();
    const initialImagesB = await pageB.locator('.flex-1.overflow-y-auto img.max-h-64').count();

    // ==========================================
    // STEP 1: User A ส่ง PDF → ต้องส่งไม่ได้ (Fail)
    // ==========================================
    const fileInputA = pageA.locator('input[type="file"]');
    await fileInputA.setInputFiles('sprint2/img/image.pdf');
    // รอ preview ไฟล์โหลดนิดนึง
    await pageA.waitForTimeout(500);
    // กดส่ง — toast จะขึ้นตอนนี้
    await pageA.locator('button.bg-cta').click();
    await expect(pageA.locator('text="ไฟล์ไม่รองรับ"').first()).toBeVisible({ timeout: 5000 });
    await expect(pageA.locator('text="กรุณาอัปโหลดเฉพาะไฟล์ .jpg และ .png เท่านั้น"').first()).toBeVisible({ timeout: 5000 });

    // รอ Toast หายก่อนทำขั้นตอนต่อไป
    await pageA.waitForTimeout(3000);

    // ==========================================
    // STEP 2: User A ส่ง JPG → ต้องส่งได้ (Pass)
    // ==========================================
    await fileInputA.setInputFiles('sprint2/img/image.jpg');
    // ต้องมีพรีวิวรูปขึ้นในช่องแชท
    const previewImageA = pageA.locator('img.h-20.rounded-lg.object-cover');
    await expect(previewImageA).toBeVisible({ timeout: 5000 });

    // กดปุ่มส่ง
    await pageA.locator('button.bg-cta').click();
    await pageA.waitForTimeout(4000);

    // รูปในแชทฝั่ง A ต้องเพิ่มขึ้น 1
    await expect(pageA.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesA + 1, { timeout: 30000 });
    // B ต้องมองเห็นรูปที่ A ส่งมาด้วย
    await expect(pageB.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesB + 1, { timeout: 30000 });

    // ==========================================
    // STEP 3: User B ส่ง PDF → ต้องส่งไม่ได้ (Fail)
    // ==========================================
    const fileInputB = pageB.locator('input[type="file"]');
    await fileInputB.setInputFiles('sprint2/img/image.pdf');
    // รอ preview ไฟล์โหลดนิดนึง
    await pageB.waitForTimeout(500);
    // กดส่ง — toast จะขึ้นตอนนี้
    await pageB.locator('button.bg-cta').click();
    await expect(pageB.locator('text="ไฟล์ไม่รองรับ"').first()).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('text="กรุณาอัปโหลดเฉพาะไฟล์ .jpg และ .png เท่านั้น"').first()).toBeVisible({ timeout: 5000 });
    await pageB.waitForTimeout(3000);

    // ==========================================
    // STEP 4: User B ส่ง PNG → ต้องส่งได้ และ A ต้องเห็น (Pass)
    // ==========================================
    await fileInputB.setInputFiles('sprint2/img/image.png');

    const previewImageB = pageB.locator('img.h-20.rounded-lg.object-cover');
    await expect(previewImageB).toBeVisible({ timeout: 5000 });

    await pageB.locator('button.bg-cta').click();
    await pageB.waitForTimeout(4000);

    // รูปในแชทของทั้งคู่น่าจะเพิ่มเป็น +2
    await expect(pageB.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesB + 2, { timeout: 30000 });
    // A ต้องเห็นรูป PNG ที่ B ส่งมาด้วย
    await expect(pageA.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesA + 2, { timeout: 30000 });

    await pageA.waitForTimeout(2000);

    await contextA.close();
    await contextB.close();
});

// ==========================================
// Scenario 6: Shared Direction
// ==========================================
test('Scenario 6 : Shared Direction', async ({ browser }) => {
    const contextA = await browser.newContext({
        permissions: ['geolocation'],
        geolocation: { latitude: 13.7563, longitude: 100.5018 },
    });
    const contextB = await browser.newContext({
        permissions: ['geolocation'],
        geolocation: { latitude: 13.7650, longitude: 100.5380 },
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // ─── Login A ──────────────────────────────────
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500);
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── Login B ──────────────────────────────────
    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── เข้าห้องแชทสำหรับทั้งคู่ ────────────────
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
    // STEP 1: User A กดแชร์ตำแหน่ง
    // ==========================================
    await pageA.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();

    // รอ location card ขึ้นในแชทของ A
    await expect(
        pageA.locator('a[href*="google.com/maps"]').last()
    ).toBeVisible({ timeout: 15000 });

    // ==========================================
    // STEP 2: User B มองเห็น location card ของ A และกด เปิดใน Google Maps
    // ==========================================
    await expect(
        pageB.locator('a[href*="google.com/maps"]').last()
    ).toBeVisible({ timeout: 15000 });

    // กดลิงก์ Google Maps — เปิด tab ใหม่ รับแล้วปิด
    const [gmapPageB] = await Promise.all([
        contextB.waitForEvent('page'),
        pageB.locator('a[href*="google.com/maps"]').last().click(),
    ]);
    await gmapPageB.waitForLoadState('domcontentloaded');
    await gmapPageB.close();

    // ==========================================
    // STEP 3: User B กดแชร์ตำแหน่ง
    // ==========================================
    await pageB.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();

    // รอ location card ของ B ขึ้นในแชทของ B
    await expect(
        pageB.locator('a[href*="google.com/maps"]').last()
    ).toBeVisible({ timeout: 15000 });

    // ==========================================
    // STEP 4: User A มองเห็น location card ของ B และกด เปิดใน Google Maps
    // ==========================================
    await expect(
        pageA.locator('a[href*="google.com/maps"]').last()
    ).toBeVisible({ timeout: 15000 });

    // กดลิงก์ Google Maps บนฝั่ง A
    const [gmapPageA] = await Promise.all([
        contextA.waitForEvent('page'),
        pageA.locator('a[href*="google.com/maps"]').last().click(),
    ]);
    await gmapPageA.waitForLoadState('domcontentloaded');
    await gmapPageA.close();

    await pageA.waitForTimeout(1000);

    await contextA.close();
    await contextB.close();
});

// ==========================================
// Scenario 7: Stop Shared Direction
// ==========================================
test('Scenario 7 : Stop Shared Direction', async ({ browser }) => {
    // ไม่ต้อง grant geolocation — Scenario 7 ไม่แชร์ตำแหน่งใหม่
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // ─── Login A (bow1234) ────────────────────────
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500);
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── Login B (kiangnz25464) ───────────────────
    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── เข้าห้องแชท ─────────────────────────────
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

    // รอโหลด messages จาก DB (location cards จาก Scenario 6 ต้องปรากฏ)
    await pageA.waitForTimeout(1500);
    await pageB.waitForTimeout(1500);

    // ==========================================
    // STEP 1: A กดปุ่ม หยุดแชร์ตำแหน่ง ใน location card ของตัวเอง
    // ==========================================
    const stopBtnInCardA = pageA.locator('[data-testid="stop-share-in-card"]').last();
    await expect(stopBtnInCardA).toBeVisible({ timeout: 10000 });
    await stopBtnInCardA.click();

    // ==========================================
    // STEP 2: B เห็น revoked card แล้วคลิก → ต้องขึ้น toast แจ้งเตือน
    // ==========================================
    const revokedCardOnB = pageB.locator('[data-testid="revoked-location-card"]').last();
    await expect(revokedCardOnB).toBeVisible({ timeout: 10000 });

    // B คลิก revoked card ของ A
    await revokedCardOnB.click();

    // ตรวจสอบ toast แจ้งว่า A หยุดแชร์แล้ว
    await expect(
        pageB.locator('text="ผู้ใช้ได้ทำการหยุดแชร์ตำแหน่งแล้ว"').first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
        pageB.locator('text="ไม่สามารถเข้าถึงตำแหน่งของผู้ใช้ได้"').first()
    ).toBeVisible({ timeout: 5000 });

    // รอ toast หายก่อน
    await pageB.waitForTimeout(3500);

    // ==========================================
    // STEP 3: B กดปุ่ม หยุดแชร์ตำแหน่ง ใน location card ของตัวเอง
    // ==========================================
    const stopBtnInCardB = pageB.locator('[data-testid="stop-share-in-card"]').last();
    await expect(stopBtnInCardB).toBeVisible({ timeout: 10000 });
    await stopBtnInCardB.click();

    // ==========================================
    // STEP 4: A เห็น revoked card แล้วคลิก → ต้องขึ้น toast แจ้งเตือน
    // ==========================================
    const revokedCardOnA = pageA.locator('[data-testid="revoked-location-card"]').last();
    await expect(revokedCardOnA).toBeVisible({ timeout: 10000 });

    // A คลิก revoked card ของ B
    await revokedCardOnA.click();

    // ตรวจสอบ toast แจ้งว่า B หยุดแชร์แล้ว
    await expect(
        pageA.locator('text="ผู้ใช้ได้ทำการหยุดแชร์ตำแหน่งแล้ว"').first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
        pageA.locator('text="ไม่สามารถเข้าถึงตำแหน่งของผู้ใช้ได้"').first()
    ).toBeVisible({ timeout: 5000 });

    await pageA.waitForTimeout(500);

    await contextA.close();
    await contextB.close();
});

// ==========================================
// Scenario 8: Empty Message
// ==========================================
test('Scenario 8 : Empty Message', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // ─── Login A ──────────────────────────────────
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500);
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── Login B ──────────────────────────────────
    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── เข้าห้องแชท ─────────────────────────────
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
    // STEP 1: User A พิมพ์ช่องว่าง (spaces) แล้วพยายามส่ง
    // ==========================================
    // กด space bar หลายครั้ง
    await pageA.locator('textarea').fill('     ');
    // กดปุ่มส่ง (ส่งผ่าน Enter key เพื่อ trigger handleSend)
    await pageA.locator('textarea').press('Enter');

    // ตรวจสอบ toast ขึ้นว่า ไม่สามารถส่งข้อความว่างเปล่าได้
    await expect(
        pageA.locator('text="ไม่สามารถส่งข้อความว่างเปล่าได้"').first()
    ).toBeVisible({ timeout: 5000 });

    // รอ toast หายก่อนไปทดสอบ B
    await pageA.waitForTimeout(3000);

    // ==========================================
    // STEP 2: User B พิมพ์ช่องว่าง (spaces) แล้วพยายามส่ง
    // ==========================================
    await pageB.locator('textarea').fill('     ');
    await pageB.locator('textarea').press('Enter');

    // ตรวจสอบ toast ขึ้นว่า ไม่สามารถส่งข้อความว่างเปล่าได้
    await expect(
        pageB.locator('text="ไม่สามารถส่งข้อความว่างเปล่าได้"').first()
    ).toBeVisible({ timeout: 5000 });

    await pageB.waitForTimeout(1000);

    await contextA.close();
    await contextB.close();
});

// ==========================================
// Scenario 9: Refresh Page
// ==========================================
test('Scenario 9 : Refresh Page', async ({ browser }) => {
    const IMG_PATH = 'C:/Ride/SprintSE_Group4_4/sprint2/img/refreshpage.jpg';

    const contextA = await browser.newContext({
        permissions: ['geolocation'],
        geolocation: { latitude: 13.7563, longitude: 100.5018 },
    });
    const contextB = await browser.newContext({
        permissions: ['geolocation'],
        geolocation: { latitude: 13.7650, longitude: 100.5380 },
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // ─── Login A ──────────────────────────────────
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500);
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── Login B ──────────────────────────────────
    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── เข้าห้องแชท ─────────────────────────────
    const chatRoomQuery = 'div.divide-y > a';

    await pageA.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text="รายการแชท"', { timeout: 15000 });
    await pageA.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageA.click(chatRoomQuery, { force: true });
    await pageA.waitForSelector('textarea', { timeout: 15000 });
    const chatUrl = pageA.url();

    await pageB.goto(chatUrl, { waitUntil: 'networkidle' });
    await pageB.waitForSelector('textarea', { timeout: 15000 });

    // ==========================================
    // STEP 1: A ส่งข้อความ รูปภาพ และแชร์ตำแหน่ง (ตามลำดับ)
    // ==========================================
    // 1.1 ส่งข้อความ
    await pageA.locator('textarea').fill('ทดสอบการรีเฟรชจากผู้ใช้ A');
    await pageA.locator('textarea').press('Enter');
    await expect(pageA.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ A"').last()).toBeVisible({ timeout: 10000 });

    // 1.2 ส่งรูปภาพ
    await pageA.locator('input[type="file"]').setInputFiles(IMG_PATH);
    await pageA.waitForTimeout(800);
    await pageA.locator('button.bg-cta').click();
    await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });

    // 1.3 แชร์ตำแหน่ง
    await pageA.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
    await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // STEP 2: B Refresh และตรวจสอบข้อมูลของ A
    // ==========================================
    await pageB.reload({ waitUntil: 'networkidle' });
    await pageB.waitForSelector('textarea', { timeout: 15000 });
    await pageB.waitForTimeout(1500); // รอโหลดข้อความและ toast ตรวจสอบ

    // B ตรวจสอบว่าเห็นทั้ง 3 อย่างของ A หลังจาก refresh
    await expect(pageB.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ A"').last()).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 10000 });

    // ==========================================
    // STEP 3: A ทำการยกเลิกการแชร์ตำแหน่งที่พึ่งทำ
    // ==========================================
    await pageA.waitForTimeout(500); // รอให้ UI render เสร็จ
    await pageA.locator('[data-testid="stop-share-in-card"]').last().click();
    await pageA.waitForTimeout(1000); // รอให้ Socket และ Vue state อัปเดต

    // ==========================================
    // STEP 4: B ส่งข้อความ รูปภาพ และแชร์ตำแหน่ง (ตามลำดับ)
    // ==========================================
    // 4.1 ส่งข้อความ
    await pageB.locator('textarea').fill('ทดสอบการรีเฟรชจากผู้ใช้ B');
    await pageB.locator('textarea').press('Enter');
    await expect(pageB.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ B"').last()).toBeVisible({ timeout: 10000 });

    // 4.2 ส่งรูปภาพ
    await pageB.locator('input[type="file"]').setInputFiles(IMG_PATH);
    await pageB.waitForTimeout(800);
    await pageB.locator('button.bg-cta').click();
    await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });

    // 4.3 แชร์ตำแหน่ง
    await pageB.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
    await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // STEP 5: A Refresh และตรวจสอบข้อมูลของ B
    // ==========================================
    await pageA.reload({ waitUntil: 'networkidle' });
    await pageA.waitForSelector('textarea', { timeout: 15000 });
    await pageA.waitForTimeout(1500); // รอโหลดข้อความและ toast ตรวจสอบ

    // A ตรวจสอบว่าเห็นทั้ง 3 อย่างของ B หลังจาก refresh
    await expect(pageA.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ B"').last()).toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 10000 });

    // ==========================================
    // STEP 6: B ทำการยกเลิกการแชร์ตำแหน่งที่พึ่งทำ
    // ==========================================
    await pageB.waitForTimeout(500); // รอให้ UI render เสร็จ
    await pageB.locator('[data-testid="stop-share-in-card"]').last().click();
    await pageB.waitForTimeout(1000); // รอให้ Socket และ Vue state อัปเดต

    await pageA.waitForTimeout(500);

    await contextA.close();
    await contextB.close();
});

// ==========================================
// Scenario 10: Disconnected
// ==========================================
test('Scenario 10 : Disconnected', async ({ browser }) => {
    const IMG_PATH = 'C:/Ride/SprintSE_Group4_4/sprint2/img/disconnect.jpg';

    const contextA = await browser.newContext({
        permissions: ['geolocation'],
        geolocation: { latitude: 13.7563, longitude: 100.5018 },
    });
    const contextB = await browser.newContext({
        permissions: ['geolocation'],
        geolocation: { latitude: 13.7650, longitude: 100.5380 },
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // ─── Login A ──────────────────────────────────
    await pageA.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageA.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageA.waitForTimeout(500);
    await pageA.fill('input#identifier', 'bow1234');
    await pageA.fill('input#password', 'Thanchanok1234');
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── Login B ──────────────────────────────────
    await pageB.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await pageB.locator('input#identifier').waitFor({ state: 'visible', timeout: 15000 });
    await pageB.waitForTimeout(500);
    await pageB.fill('input#identifier', 'kiangnz25464');
    await pageB.fill('input#password', 'Thanchanok1234');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });

    // ─── เข้าห้องแชท ─────────────────────────────
    const chatRoomQuery = 'div.divide-y > a';

    await pageA.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await pageA.waitForSelector('text="รายการแชท"', { timeout: 15000 });
    await pageA.waitForSelector(chatRoomQuery, { timeout: 15000 });
    await pageA.click(chatRoomQuery, { force: true });
    await pageA.waitForSelector('textarea', { timeout: 15000 });
    const chatUrl = pageA.url();

    await pageB.goto(chatUrl, { waitUntil: 'networkidle' });
    await pageB.waitForSelector('textarea', { timeout: 15000 });

    // ==========================================
    // STEP 1: จำลอง B ขาดการเชื่อมต่อ
    // ==========================================
    await contextB.setOffline(true);
    // ตรวจสอบ toast ขาดการเชื่อมต่อบนหน้า B
    await expect(pageB.locator('text="ขาดการเชื่อมต่อ"').first()).toBeVisible({ timeout: 10000 });
    await pageB.waitForTimeout(1000); // รอให้ UI อัปเดตหลัง offline

    // ==========================================
    // STEP 2: A ส่งข้อความ รูปภาพ และแชร์ตำแหน่ง (ตามลำดับ) 
    // (ในขณะที่ B ขาดการเชื่อมต่ออยู่)
    // ==========================================
    // 2.1 ส่งข้อความ
    await pageA.locator('textarea').fill('ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ A');
    await pageA.locator('textarea').press('Enter');
    await expect(pageA.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ A"').last()).toBeVisible({ timeout: 10000 });

    // 2.2 ส่งรูปภาพ
    await pageA.locator('input[type="file"]').setInputFiles(IMG_PATH);
    await pageA.waitForTimeout(800);
    await pageA.locator('button.bg-cta').click();
    await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });
    await pageA.waitForTimeout(300); // ทิ้งระยะเวลาหลังผู้ใช้ A ส่งรูปภาพประมาณ 0.3 วินาที

    // 2.3 แชร์ตำแหน่ง
    await pageA.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
    await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // STEP 3: B กลับมาเชื่อมต่อ (reconnect) หลังจากที่ A ส่งครบแล้ว
    // ==========================================
    await contextB.setOffline(false);
    // ตรวจสอบ toast กลับมาเชื่อมต่อแล้วบนหน้า B
    await expect(pageB.locator('text="กลับมาเชื่อมต่อแล้ว"').first()).toBeVisible({ timeout: 10000 });

    // B รีเฟรชเพื่อดึงข้อมูลล่าสุด (แทนการรอพึ่ง Socket.io auto-reconnect ดึง state)
    await pageB.reload({ waitUntil: 'networkidle' });
    await pageB.waitForSelector('textarea', { timeout: 15000 });

    // ตรวจสอบว่ามี toast แสดงผลสิ่งที่ B มองเห็นตามเงื่อนไขว่าผ่านครบ
    await expect(pageB.locator('text="สามารถดูข้อความ รูปภาพ และตำแหน่งที่แชร์ก่อนหน้าได้ตามปกติ"').last()).toBeVisible({ timeout: 15000 });
    await pageB.waitForTimeout(1000);

    // B ตรวจสอบว่าเห็นทั้ง 3 อย่างของ A ที่ส่งมาระหว่างที่ B offline
    await expect(pageB.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ A"').last()).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 10000 });

    // ==========================================
    // STEP 4: A ทำการยกเลิกการแชร์ตำแหน่งที่พึ่งทำ
    // ==========================================
    await pageA.waitForTimeout(500);
    await pageA.locator('[data-testid="stop-share-in-card"]').last().click();
    await pageA.waitForTimeout(1000);

    // ==========================================
    // STEP 5: จำลอง A ขาดการเชื่อมต่อ
    // ==========================================
    await contextA.setOffline(true);
    // ตรวจสอบ toast ขาดการเชื่อมต่อบนหน้า A
    await expect(pageA.locator('text="ขาดการเชื่อมต่อ"').first()).toBeVisible({ timeout: 10000 });
    await pageA.waitForTimeout(1000); // รอให้ UI อัปเดตหลัง offline

    // ==========================================
    // STEP 6: B ส่งข้อความ รูปภาพ และแชร์ตำแหน่ง (ตามลำดับ)
    // (ในขณะที่ A ขาดการเชื่อมต่ออยู่)
    // ==========================================
    // 6.1 ส่งข้อความ
    await pageB.locator('textarea').fill('ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ B');
    await pageB.locator('textarea').press('Enter');
    await expect(pageB.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ B"').last()).toBeVisible({ timeout: 10000 });

    // 6.2 ส่งรูปภาพ
    await pageB.locator('input[type="file"]').setInputFiles(IMG_PATH);
    await pageB.waitForTimeout(800);
    await pageB.locator('button.bg-cta').click();
    await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });
    await pageB.waitForTimeout(300); // ทิ้งระยะเวลาหลังผู้ใช้ B ส่งรูปภาพประมาณ 0.3 วินาที

    // 6.3 แชร์ตำแหน่ง
    await pageB.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
    await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // STEP 7: A กลับมาเชื่อมต่อ (reconnect) หลังจากที่ B ส่งครบแล้ว
    // ==========================================
    await contextA.setOffline(false);
    // ตรวจสอบ toast กลับมาเชื่อมต่อแล้วบนหน้า A
    await expect(pageA.locator('text="กลับมาเชื่อมต่อแล้ว"').first()).toBeVisible({ timeout: 10000 });

    // A รีเฟรชเพื่อดึงข้อมูลล่าสุด
    await pageA.reload({ waitUntil: 'networkidle' });
    await pageA.waitForSelector('textarea', { timeout: 15000 });

    // ตรวจสอบว่ามี toast แสดงผลสิ่งที่ A มองเห็นตามเงื่อนไขว่าผ่านครบ
    await expect(pageA.locator('text="สามารถดูข้อความ รูปภาพ และตำแหน่งที่แชร์ก่อนหน้าได้ตามปกติ"').last()).toBeVisible({ timeout: 15000 });
    await pageA.waitForTimeout(1000);

    // A ตรวจสอบว่าเห็นทั้ง 3 อย่างของ B ที่ส่งมาระหว่างที่ A offline
    await expect(pageA.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ B"').last()).toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 10000 });

    // ==========================================
    // STEP 8: B ทำการยกเลิกการแชร์ตำแหน่งที่พึ่งทำ
    // ==========================================
    await pageB.waitForTimeout(500);
    await pageB.locator('[data-testid="stop-share-in-card"]').last().click();
    await pageB.waitForTimeout(1000);

    await contextA.close();
    await contextB.close();
});



