import { test, expect, Page } from '@playwright/test';

// ให้รันแค่ทีละเบราว์เซอร์ ไม่แย่งกันทำงาน
test.describe.configure({ mode: 'serial', timeout: 120000 });

// ==========================================
// Reusable Helpers
// ==========================================
async function login(page: Page, username: string) {
    await page.goto('http://localhost:3003/login', { waitUntil: 'networkidle' });
    await expect(page.locator('input#identifier')).toBeVisible({ timeout: 15000 });
    await page.fill('input#identifier', username);
    await page.fill('input#password', 'Thanchanok1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 15000 });
}

async function enterChat(page: Page) {
    await page.goto('http://localhost:3003/chat', { waitUntil: 'networkidle' });
    await expect(page.locator('text="รายการแชท"').first()).toBeVisible({ timeout: 15000 });
    const chatRoomQuery = 'div.divide-y > a';
    await expect(page.locator(chatRoomQuery).first()).toBeVisible({ timeout: 15000 });
    await page.click(chatRoomQuery, { force: true });
    await expect(page.locator('textarea')).toBeVisible({ timeout: 15000 });
}

// Removed setupUser as interleaved execution is preferred
// ==========================================
// Test Suites
// ==========================================
test.describe('Real-time Chat Tests (Refactored)', () => {

    test('Scenario 1 : Basic Chat', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // A sends to B
        const msga = `เทสส่งข้อความจาก A ไป B`;
        await pageA.fill('textarea', msga);
        await pageA.keyboard.press('Enter');
        await expect(pageB.locator(`text="${msga}"`).first()).toBeVisible({ timeout: 10000 });

        // B sends to A
        const msgb = `B มองเห็นข้อความแล้ว ส่งข้อความกลับไปให้ A`;
        await pageB.fill('textarea', msgb);
        await pageB.keyboard.press('Enter');
        await expect(pageA.locator(`text="${msgb}"`).first()).toBeVisible({ timeout: 10000 });

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 2 : Quick reply feature', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // A sends Quick Reply
        await pageA.click('button[title="ตอบกลับด่วน"]');
        const quickReplyBtnA = pageA.locator('button.bg-blue-50').filter({ hasText: 'รอข้างล่างแล้ว' }).first();
        await expect(quickReplyBtnA).toBeVisible();
        const msgFromA = await quickReplyBtnA.innerText();
        await quickReplyBtnA.click();
        await expect(pageB.locator(`text="${msgFromA.trim()}"`).first()).toBeVisible({ timeout: 15000 });

        // B sends Quick Reply
        await pageB.click('button[title="ตอบกลับด่วน"]');
        const quickReplyBtnB = pageB.locator('button.bg-blue-50').filter({ hasText: 'กำลังลงไป' }).first();
        await expect(quickReplyBtnB).toBeVisible();
        const msgFromB = await quickReplyBtnB.innerText();
        await quickReplyBtnB.click();
        await expect(pageA.locator(`text="${msgFromB.trim()}"`).first()).toBeVisible({ timeout: 15000 });

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 3 : Create new quick reply and send', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        const createQuickReply = async (page: Page, otherPage: Page, msg: string) => {
            const openManageBtn = page.locator('button[title="จัดการคีย์ลัด"]');
            if (!(await openManageBtn.isVisible())) {
                await page.click('button[title="ตอบกลับด่วน"]');
                await expect(openManageBtn).toBeVisible();
            }
            await openManageBtn.click();
            await expect(page.locator('h3:has-text("จัดการคีย์ลัดด่วน")')).toBeVisible({ timeout: 5000 });
            await page.fill('input[placeholder="พิมพ์คีย์ลัดใหม่..."]', msg);
            await page.click('button:has-text("เพิ่ม")');
            await expect(page.locator('text="เพิ่มคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });

            await page.locator('h3:has-text("จัดการคีย์ลัดด่วน")').locator('..').locator('button').click();
            await expect(page.locator('h3:has-text("จัดการคีย์ลัดด่วน")')).not.toBeVisible({ timeout: 10000 });

            if (!(await openManageBtn.isVisible())) {
                await page.click('button[title="ตอบกลับด่วน"]');
            }
            const newReplyBtn = page.locator('button.bg-blue-50').filter({ hasText: msg }).first();
            await expect(newReplyBtn).toBeVisible({ timeout: 5000 });
            await newReplyBtn.click();
            await expect(otherPage.getByText(msg).first()).toBeVisible({ timeout: 15000 });
        };

        await createQuickReply(pageA, pageB, `A สร้าง quick reply นี้`);
        await createQuickReply(pageB, pageA, `B เห็น quick reply แล้ว และตอบกลับด้วยการสร้าง quick reply นี้เช่นกัน`);

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 4 : Delete quick reply', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        const newSnippetTextA = `A สร้าง quick reply นี้`;
        const newSnippetTextB = `B เห็น quick reply แล้ว และตอบกลับด้วยการสร้าง quick reply นี้เช่นกัน`;

        const deleteQuickReply = async (page: Page, msg: string) => {
            const openManageBtn = page.locator('button[title="จัดการคีย์ลัด"]');
            if (!(await openManageBtn.isVisible())) {
                await page.click('button[title="ตอบกลับด่วน"]');
                await expect(openManageBtn).toBeVisible();
            }
            await openManageBtn.click();

            let deleteBtn = page.locator(`xpath=//div[contains(@class, 'flex') and contains(., "${msg}")]//button[@title="ลบ"]`).first();
            while (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await expect(page.locator('text="ลบคีย์ลัดแล้ว"').first()).toBeVisible({ timeout: 10000 });
                await expect(page.locator('text="ลบคีย์ลัดแล้ว"').first()).not.toBeVisible({ timeout: 15000 });
            }

            await page.locator('h3:has-text("จัดการคีย์ลัดด่วน")').locator('..').locator('button').click();
            await expect(page.locator('h3:has-text("จัดการคีย์ลัดด่วน")')).not.toBeVisible({ timeout: 10000 });

            if (!(await openManageBtn.isVisible())) {
                await page.click('button[title="ตอบกลับด่วน"]');
            }
            await expect(page.locator('button.bg-blue-50').filter({ hasText: msg })).not.toBeVisible({ timeout: 10000 });
        };

        await deleteQuickReply(pageA, newSnippetTextA);
        await deleteQuickReply(pageB, newSnippetTextB);

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 5 : Add image (rejecting .pdf)', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        const initialImagesA = await pageA.locator('.flex-1.overflow-y-auto img.max-h-64').count();
        const initialImagesB = await pageB.locator('.flex-1.overflow-y-auto img.max-h-64').count();

        // A sends PDF (reject)
        await pageA.locator('input[type="file"]').setInputFiles('sprint2/img/image.pdf');
        await pageA.locator('button.bg-cta').click();
        await expect(pageA.locator('text="ไฟล์ไม่รองรับ"').first()).toBeVisible();
        await expect(pageA.locator('text="ไฟล์ไม่รองรับ"').first()).not.toBeVisible({ timeout: 10000 });

        // A sends JPG
        await pageA.locator('input[type="file"]').setInputFiles('sprint2/img/image.jpg');
        await expect(pageA.locator('img.h-20.rounded-lg.object-cover')).toBeVisible();
        await pageA.locator('button.bg-cta').click();
        await expect(pageA.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesA + 1, { timeout: 30000 });
        await expect(pageB.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesB + 1, { timeout: 30000 });

        // B sends PDF (reject)
        await pageB.locator('input[type="file"]').setInputFiles('sprint2/img/image.pdf');
        await pageB.locator('button.bg-cta').click();
        await expect(pageB.locator('text="ไฟล์ไม่รองรับ"').first()).toBeVisible();
        await expect(pageB.locator('text="ไฟล์ไม่รองรับ"').first()).not.toBeVisible({ timeout: 10000 });

        // B sends PNG
        await pageB.locator('input[type="file"]').setInputFiles('sprint2/img/image.png');
        await expect(pageB.locator('img.h-20.rounded-lg.object-cover')).toBeVisible();
        await pageB.locator('button.bg-cta').click();
        await expect(pageB.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesB + 2, { timeout: 30000 });
        await expect(pageA.locator('.flex-1.overflow-y-auto img.max-h-64')).toHaveCount(initialImagesA + 2, { timeout: 30000 });

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 6 : Shared Direction', async ({ browser }) => {
        const contextA = await browser.newContext({
            permissions: ['geolocation'], geolocation: { latitude: 13.7563, longitude: 100.5018 },
        });
        const contextB = await browser.newContext({
            permissions: ['geolocation'], geolocation: { latitude: 13.7650, longitude: 100.5380 },
        });
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // A shares
        await pageA.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
        await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });
        await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

        const [gmapPageB] = await Promise.all([
            contextB.waitForEvent('page'),
            pageB.locator('a[href*="google.com/maps"]').last().click(),
        ]);
        await gmapPageB.waitForLoadState('domcontentloaded');
        await gmapPageB.close();

        // B shares
        await pageB.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
        await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });
        await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

        const [gmapPageA] = await Promise.all([
            contextA.waitForEvent('page'),
            pageA.locator('a[href*="google.com/maps"]').last().click(),
        ]);
        await gmapPageA.waitForLoadState('domcontentloaded');
        await gmapPageA.close();

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 7 : Stop Shared Direction', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // A stops
        const stopBtnInCardA = pageA.locator('[data-testid="stop-share-in-card"]').last();
        // Check visibility. Might be already stopped depending on previous runs,
        // but test logic depends on the card rendering. Wait for message history.
        await expect(stopBtnInCardA).toBeVisible({ timeout: 15000 });
        await stopBtnInCardA.click();

        const revokedCardOnB = pageB.locator('[data-testid="revoked-location-card"]').last();
        await expect(revokedCardOnB).toBeVisible({ timeout: 10000 });
        await revokedCardOnB.click();
        await expect(pageB.locator('text="ผู้ใช้ได้ทำการหยุดแชร์ตำแหน่งแล้ว"').first()).toBeVisible();
        await expect(pageB.locator('text="ไม่สามารถเข้าถึงตำแหน่งของผู้ใช้ได้"').first()).toBeVisible();

        // waitFor toast disappear
        await expect(pageB.locator('text="ผู้ใช้ได้ทำการหยุดแชร์ตำแหน่งแล้ว"').first()).not.toBeVisible({ timeout: 10000 });

        // B stops
        const stopBtnInCardB = pageB.locator('[data-testid="stop-share-in-card"]').last();
        await expect(stopBtnInCardB).toBeVisible({ timeout: 10000 });
        await stopBtnInCardB.click();

        const revokedCardOnA = pageA.locator('[data-testid="revoked-location-card"]').last();
        await expect(revokedCardOnA).toBeVisible({ timeout: 10000 });
        await revokedCardOnA.click();
        await expect(pageA.locator('text="ผู้ใช้ได้ทำการหยุดแชร์ตำแหน่งแล้ว"').first()).toBeVisible();

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 8 : Empty Message', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        await pageA.locator('textarea').fill('     ');
        await pageA.locator('textarea').press('Enter');
        await expect(pageA.locator('text="ไม่สามารถส่งข้อความว่างเปล่าได้"').first()).toBeVisible();
        await expect(pageA.locator('text="ไม่สามารถส่งข้อความว่างเปล่าได้"').first()).not.toBeVisible({ timeout: 10000 });

        await pageB.locator('textarea').fill('     ');
        await pageB.locator('textarea').press('Enter');
        await expect(pageB.locator('text="ไม่สามารถส่งข้อความว่างเปล่าได้"').first()).toBeVisible();

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 9 : Refresh Page', async ({ browser }) => {
        const IMG_PATH = 'C:/Ride/SprintSE_Group4_4/sprint2/img/refreshpage.jpg';

        const contextA = await browser.newContext({
            permissions: ['geolocation'], geolocation: { latitude: 13.7563, longitude: 100.5018 },
        });
        const contextB = await browser.newContext({
            permissions: ['geolocation'], geolocation: { latitude: 13.7650, longitude: 100.5380 },
        });
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // A sends msg, img, loc
        await pageA.locator('textarea').fill('ทดสอบการรีเฟรชจากผู้ใช้ A');
        await pageA.locator('textarea').press('Enter');
        await expect(pageA.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ A"').last()).toBeVisible();

        await pageA.locator('input[type="file"]').setInputFiles(IMG_PATH);
        await expect(pageA.locator('img.h-20')).toBeVisible();
        await pageA.locator('button.bg-cta').click();
        await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });

        await pageA.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
        await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

        // B Refresh
        await pageB.reload({ waitUntil: 'networkidle' });
        await expect(pageB.locator('textarea')).toBeVisible();

        await expect(pageB.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ A"').last()).toBeVisible({ timeout: 10000 });
        await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 10000 });
        await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 10000 });

        // A stop share
        await pageA.locator('[data-testid="stop-share-in-card"]').last().click();
        await expect(pageA.locator('[data-testid="revoked-location-card"]').last()).toBeVisible({ timeout: 10000 });

        // B sends msg, img, loc
        await pageB.locator('textarea').fill('ทดสอบการรีเฟรชจากผู้ใช้ B');
        await pageB.locator('textarea').press('Enter');
        await expect(pageB.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ B"').last()).toBeVisible();

        await pageB.locator('input[type="file"]').setInputFiles(IMG_PATH);
        await expect(pageB.locator('img.h-20')).toBeVisible();
        await pageB.locator('button.bg-cta').click();
        await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });

        await pageB.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
        await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

        // A Refresh
        await pageA.reload({ waitUntil: 'networkidle' });
        await expect(pageA.locator('textarea')).toBeVisible();

        await expect(pageA.locator('text="ทดสอบการรีเฟรชจากผู้ใช้ B"').last()).toBeVisible({ timeout: 10000 });
        await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 10000 });
        await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 10000 });

        // B stop share
        await pageB.locator('[data-testid="stop-share-in-card"]').last().click();

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 11 : Edit message 3 times with history view - both users real-time', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // A sends original message slowly — both see it
        const origMsg = 'รอข้างหน้าตึกหลักนะครับ';
        await pageA.locator('textarea').pressSequentially(origMsg, { delay: 60 });
        await pageA.waitForTimeout(600);
        await pageA.keyboard.press('Enter');
        await expect(pageA.locator(`text="${origMsg}"`).last()).toBeVisible({ timeout: 10000 });
        await expect(pageB.locator(`text="${origMsg}"`).last()).toBeVisible({ timeout: 10000 });
        await pageA.waitForTimeout(1200); // pause — both users see original message

        const editRounds = [
            'รอข้างหน้าตึก A นะครับ',
            'รอหน้าประตูทางเข้าตึก A นะครับ',
            'รอหน้าประตูทางเข้าตึก A ชั้น 1 นะครับ',
        ];

        for (const newContent of editRounds) {
            // ── Step 1: A hovers on the message bubble → 3-dot button appears
            const bubble = pageA.locator('div.relative').filter({ has: pageA.locator('button[title="ตัวเลือกเพิ่มเติม"]') }).last();
            await bubble.hover();
            await pageA.waitForTimeout(600); // pause — show hover state

            // ── Step 2: A clicks 3-dot → dropdown opens (hold to show options)
            await pageA.locator('button[title="ตัวเลือกเพิ่มเติม"]').last().click({ force: true });
            await expect(pageA.locator('button:not([disabled]):has-text("แก้ไขข้อความ")').last()).toBeVisible({ timeout: 5000 });
            await pageA.waitForTimeout(1200); // pause — show dropdown menu clearly

            // ── Step 3: A clicks "แก้ไขข้อความ" → edit mode indicator appears
            await pageA.locator('button:not([disabled]):has-text("แก้ไขข้อความ")').last().click();
            await expect(pageA.locator('text="กำลังแก้ไขข้อความ..."').first()).toBeVisible({ timeout: 5000 });
            await pageA.waitForTimeout(800); // pause — show edit mode UI

            // ── Step 4: A clears textarea and types new content slowly character by character
            await pageA.fill('textarea', '');
            await pageA.locator('textarea').pressSequentially(newContent, { delay: 70 });
            await pageA.waitForTimeout(600); // pause — show completed typed text before sending

            // ── Step 5: A confirms the edit
            await pageA.keyboard.press('Enter');

            // ── Step 6: Both A and B see the updated message in real-time
            await expect(pageA.locator(`text="${newContent}"`).last()).toBeVisible({ timeout: 10000 });
            await expect(pageB.locator(`text="${newContent}"`).last()).toBeVisible({ timeout: 10000 });
            await pageA.waitForTimeout(1200); // pause — show both users see the real-time update

            // ── Step 7: A clicks "มีการแก้ไข" badge → edit history panel opens
            await pageA.locator('text="มีการแก้ไข"').last().click();
            await expect(pageA.locator('text="ซ่อนการแก้ไข"').last()).toBeVisible({ timeout: 5000 });
            await pageA.waitForTimeout(800);

            // ── Step 8: B clicks "มีการแก้ไข" badge → sees history too
            await pageB.locator('text="มีการแก้ไข"').last().click();
            await expect(pageB.locator('text="ซ่อนการแก้ไข"').last()).toBeVisible({ timeout: 5000 });
            await pageA.waitForTimeout(2000); // pause — show history to viewer (both screens)

            // ── Step 9: Close history for both
            await pageA.locator('text="ซ่อนการแก้ไข"').last().click();
            await pageB.locator('text="ซ่อนการแก้ไข"').last().click();
            await pageA.waitForTimeout(800);
        }

        // ── Final: After 3 edits — hover → open menu → hold to show disabled button
        const bubbleFinal = pageA.locator('div.relative').filter({ has: pageA.locator('button[title="ตัวเลือกเพิ่มเติม"]') }).last();
        await bubbleFinal.hover();
        await pageA.waitForTimeout(600);
        await pageA.locator('button[title="ตัวเลือกเพิ่มเติม"]').last().click({ force: true });
        await expect(pageA.locator('button[disabled]:has-text("แก้ไขข้อความ")').first()).toBeVisible({ timeout: 5000 });
        await pageA.waitForTimeout(2500); // hold — show disabled state clearly "(ครบ 3 ครั้ง)"

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 12 : Unsend message - both users see real-time update', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // A sends a message — both see it
        const msg = 'ข้อความที่จะยกเลิกส่ง';
        await pageA.fill('textarea', msg);
        await pageA.keyboard.press('Enter');
        await expect(pageA.locator(`text="${msg}"`).last()).toBeVisible({ timeout: 10000 });
        await expect(pageB.locator(`text="${msg}"`).last()).toBeVisible({ timeout: 10000 });
        await pageA.waitForTimeout(800); // pause — show both users see the message

        // A: hover → 3-dot → dropdown opens (hold briefly to show options)
        const bubble = pageA.locator('div.relative').filter({ has: pageA.locator('button[title="ตัวเลือกเพิ่มเติม"]') }).last();
        await bubble.hover();
        await pageA.locator('button[title="ตัวเลือกเพิ่มเติม"]').last().click({ force: true });
        await expect(pageA.locator('button:has-text("ยกเลิกข้อความ")').last()).toBeVisible({ timeout: 5000 });
        await pageA.waitForTimeout(1000); // hold menu to show options

        // A clicks "ยกเลิกข้อความ"
        await pageA.locator('button:has-text("ยกเลิกข้อความ")').last().click();

        // Both A and B see "ข้อความถูกลบ" in real-time
        await expect(pageA.locator('text="ข้อความถูกลบ"').last()).toBeVisible({ timeout: 10000 });
        await expect(pageB.locator('text="ข้อความถูกลบ"').last()).toBeVisible({ timeout: 10000 });
        await pageA.waitForTimeout(1500); // pause — show both users see unsent state

        await contextA.close();
        await contextB.close();
    });

    test('Scenario 10 : Disconnected', async ({ browser }) => {
        const IMG_PATH = 'C:/Ride/SprintSE_Group4_4/sprint2/img/disconnect.jpg';

        const contextA = await browser.newContext({
            permissions: ['geolocation'], geolocation: { latitude: 13.7563, longitude: 100.5018 },
        });
        const contextB = await browser.newContext({
            permissions: ['geolocation'], geolocation: { latitude: 13.7650, longitude: 100.5380 },
        });
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await login(pageA, 'bow1234');
        await login(pageB, 'kiangnz25464');
        await enterChat(pageA);
        await enterChat(pageB);

        // B disconnect
        await contextB.setOffline(true);
        await expect(pageB.locator('text="ขาดการเชื่อมต่อ"').first()).toBeVisible({ timeout: 10000 });

        // A sends msg, img, loc
        await pageA.fill('textarea', 'ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ A');
        await pageA.press('textarea', 'Enter');
        await expect(pageA.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ A"').last()).toBeVisible();

        await pageA.locator('input[type="file"]').setInputFiles(IMG_PATH);
        await expect(pageA.locator('img.h-20')).toBeVisible();
        await pageA.locator('button.bg-cta').click();
        await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });

        await pageA.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
        await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

        // B reconnect
        await contextB.setOffline(false);
        await expect(pageB.locator('text="กลับมาเชื่อมต่อแล้ว"').first()).toBeVisible({ timeout: 10000 });
        await pageB.reload({ waitUntil: 'networkidle' });
        await expect(pageB.locator('textarea')).toBeVisible();

        await expect(pageB.locator('text="สามารถดูข้อความ รูปภาพ และตำแหน่งที่แชร์ก่อนหน้าได้ตามปกติ"').last()).toBeVisible({ timeout: 15000 });

        await expect(pageB.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ A"').last()).toBeVisible();
        await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible();
        await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible();

        await pageA.locator('[data-testid="stop-share-in-card"]').last().click();
        await expect(pageA.locator('[data-testid="revoked-location-card"]').last()).toBeVisible({ timeout: 10000 });

        // A disconnect
        await contextA.setOffline(true);
        await expect(pageA.locator('text="ขาดการเชื่อมต่อ"').first()).toBeVisible({ timeout: 10000 });

        // B sends msg, img, loc
        await pageB.fill('textarea', 'ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ B');
        await pageB.press('textarea', 'Enter');
        await expect(pageB.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ B"').last()).toBeVisible();

        await pageB.locator('input[type="file"]').setInputFiles(IMG_PATH);
        await expect(pageB.locator('img.h-20')).toBeVisible();
        await pageB.locator('button.bg-cta').click();
        await expect(pageB.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible({ timeout: 15000 });

        await pageB.locator('button[title="แชร์ตำแหน่งแบบ Real-time"]').click();
        await expect(pageB.locator('a[href*="google.com/maps"]').last()).toBeVisible({ timeout: 15000 });

        // A reconnect
        await contextA.setOffline(false);
        await expect(pageA.locator('text="กลับมาเชื่อมต่อแล้ว"').first()).toBeVisible({ timeout: 10000 });
        await pageA.reload({ waitUntil: 'networkidle' });
        await expect(pageA.locator('textarea')).toBeVisible();

        await expect(pageA.locator('text="สามารถดูข้อความ รูปภาพ และตำแหน่งที่แชร์ก่อนหน้าได้ตามปกติ"').last()).toBeVisible({ timeout: 15000 });

        await expect(pageA.locator('text="ทดสอบการขาดการเชื่อมต่อจากผู้ใช้ B"').last()).toBeVisible();
        await expect(pageA.locator('img[src*="cloudinary"], img[alt="image"]').last()).toBeVisible();
        await expect(pageA.locator('a[href*="google.com/maps"]').last()).toBeVisible();

        await pageB.locator('[data-testid="stop-share-in-card"]').last().click();

        await contextA.close();
        await contextB.close();
    });
});
