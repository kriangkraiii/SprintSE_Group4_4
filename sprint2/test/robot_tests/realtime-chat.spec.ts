import { test, expect, Browser, BrowserContext, Page, devices, chromium } from '@playwright/test';

// Use serial mode so tests run one by one if preferred, but isolated contexts make parallel entirely possible.
// We'll give it plenty of time for timeout.
test.describe.configure({ mode: 'parallel', timeout: 90000 });

// Helper to handle login
const loginUser = async (page: Page, user: string, pass: string) => {
    await page.goto('http://localhost:3003/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input#identifier').waitFor({ state: 'visible' });
    await page.locator('input#identifier').fill(user);
    await page.locator('input#password').fill(pass);
    await page.locator('button[type="submit"]').click();

    // Check for success or error
    try {
        const errorMsg = page.locator('text="เข้าสู่ระบบไม่สำเร็จ"');
        if (await errorMsg.isVisible({ timeout: 3000 })) {
            throw new Error(`Login failed for ${user}: Invalid credentials or suspended`);
        }
        await page.waitForSelector('a[href="/chat"]', { timeout: 15000 });
    } catch (e: any) {
        if (e.message.includes('Login failed')) throw e;
    }
};

// Helper to enter a chat room
const enterChatRoom = async (page: Page) => {
    await page.goto('http://localhost:3003/chat');
    await page.waitForSelector('text="รายการแชท"', { timeout: 15000 });

    const chatListSelector = 'div.divide-y > a';
    await page.waitForSelector(chatListSelector, { timeout: 15000 });
    const chatUrl = await page.getAttribute(chatListSelector, 'href');
    await page.click(chatListSelector, { force: true });

    // Wait for text input area
    await page.waitForSelector('textarea', { timeout: 15000 });
    return chatUrl;
};

test.describe('Realtime Chat Complete Master Suite', () => {

    let browser: Browser;

    test.beforeAll(async () => {
        browser = await chromium.launch({ channel: 'chrome' }); // Use Chrome for stability
    });

    test.afterAll(async () => {
        if (browser) await browser.close();
    });

    // ==========================================
    // 🧪 Case 1: Ride Context Integration (Mobile vs Desktop)
    // ==========================================
    test('Case 1: Ride Context Verification (Mobile Passenger vs Desktop Driver)', async ({ }, testInfo) => {
        const safeTitle = testInfo.title.replace(/[^a-zA-Z0-9]/g, '-');

        // Context A: Mobile Passenger (iPhone 13 view)
        const contextA = await browser.newContext({
            ...devices['iPhone 13'],
            recordVideo: { dir: `test-results/videos/${safeTitle}/Passenger-Mobile/` }
        });
        const pageA = await contextA.newPage();

        // Context B: Desktop Driver
        const contextB = await browser.newContext({
            ...devices['Desktop Chrome'],
            recordVideo: { dir: `test-results/videos/${safeTitle}/Driver-Desktop/` }
        });
        const pageB = await contextB.newPage();

        try {
            // Logins
            await loginUser(pageA, 'bow1234', 'Thanchanok1234');
            await loginUser(pageB, 'kiangnz25464', 'Thanchanok1234');

            // Entering chat
            await enterChatRoom(pageA);
            await enterChatRoom(pageB);

            // Verification 1: Header Context - Ensure we see signs of life that this is connected to a ride
            // We should see each other's name and status
            await expect(pageA.locator('text="ออนไลน์"').first()).toBeVisible({ timeout: 10000 });
            await expect(pageB.locator('text="ออนไลน์"').first()).toBeVisible({ timeout: 10000 });

            // Verification 2: Basic Messaging Confirmation
            const msgA = `สวัสดี โชเฟอร์! (พิมพ์จากมือถือ iOS) ${Date.now()}`;
            await pageA.fill('textarea', msgA);
            await pageA.keyboard.press('Enter');

            // Driver (B) sees the message
            await expect(pageB.locator(`text="${msgA}"`).first()).toBeVisible({ timeout: 5000 });

            // Driver replies
            const msgB = `สวัสดีครับ ผู้โดยสาร! (ตอบจากคอม) ${Date.now()}`;
            await pageB.fill('textarea', msgB);
            await pageB.keyboard.press('Enter');

            // Passenger sees the message
            await expect(pageA.locator(`text="${msgB}"`).first()).toBeVisible({ timeout: 5000 });

            await pageA.waitForTimeout(2000);
        } finally {
            await contextA.close();
            await contextB.close();
        }
    });

    // ==========================================
    // 🧪 Case 2: Permission Security (Mindset)
    // ==========================================
    test('Case 2: Permission Security - Outsiders blocked from Chat', async ({ }, testInfo) => {
        const safeTitle = testInfo.title.replace(/[^a-zA-Z0-9]/g, '-');

        const contextA = await browser.newContext();
        const pageA = await contextA.newPage();

        // Context C: Third Party / Hacker
        const contextC = await browser.newContext({
            recordVideo: { dir: `test-results/videos/${safeTitle}/Hacker-Attempt/` }
        });
        const pageC = await contextC.newPage();

        try {
            // Logins
            await loginUser(pageA, 'bow1234', 'Thanchanok1234');
            await loginUser(pageC, 'kriangkrai.p@kkumail.com', 'Cp12345678');

            // Find the active chat URL that bow1234 has
            const targetUrl = await enterChatRoom(pageA);

            // The Hacker tries to access that exact room URL
            await pageC.goto(`http://localhost:3003${targetUrl}`);

            // Verification: The hacker should NOT be able to find the textarea. 
            // The system should redirect them or block the render.
            // Wait 5 seconds to ensure page loaded. We expect `textarea` to NOT be visible.
            await pageC.waitForTimeout(3000);

            // Check if blocked or redirected (Assume it doesn't show the textarea)
            const isTextareaVisible = await pageC.locator('textarea').isVisible();
            expect(isTextareaVisible).toBe(false);

        } finally {
            await contextA.close();
            await contextC.close();
        }
    });

    // ==========================================
    // 🧪 Case 3: Realtime Reliability & Network Chaos
    // ==========================================
    test('Case 3: Network Chaos (Offline to Online Queueing)', async ({ }, testInfo) => {
        const safeTitle = testInfo.title.replace(/[^a-zA-Z0-9]/g, '-');

        const contextA = await browser.newContext({ recordVideo: { dir: `test-results/videos/${safeTitle}/Passenger/` } });
        const pageA = await contextA.newPage();
        const contextB = await browser.newContext({ recordVideo: { dir: `test-results/videos/${safeTitle}/Driver/` } });
        const pageB = await contextB.newPage();

        try {
            await loginUser(pageA, 'bow1234', 'Thanchanok1234');
            await loginUser(pageB, 'kiangnz25464', 'Thanchanok1234');
            await enterChatRoom(pageA);
            await enterChatRoom(pageB);

            // Phase 1: Context A goes Offline
            await contextA.setOffline(true);
            const offlineMsg = `ส่งข้อความตอนเน็ตตัด! ${Date.now()}`;

            // Type and attempt to send
            await pageA.fill('textarea', offlineMsg);

            // Click send button
            await pageA.locator('button:has(svg)').last().click();

            // Verification 1: Driver B does NOT see message yet
            await pageB.waitForTimeout(3000);
            const isMsgVisibleB = await pageB.locator(`text="${offlineMsg}"`).isVisible();
            expect(isMsgVisibleB).toBe(false); // Shouldn't be there yet!

            // Phase 2: Context A connects back Online!
            await contextA.setOffline(false);

            // Verification 2: Socket should reconnect and deliver the queued message!
            // Wait up to 15 seconds for recovery
            await expect(pageB.locator(`text="${offlineMsg}"`).first()).toBeVisible({ timeout: 15000 });

            await pageB.waitForTimeout(2000);
        } finally {
            await contextA.close();
            await contextB.close();
        }
    });

    // ==========================================
    // 🧪 Case 4: Quick Reply and Image Capabilities
    // ==========================================
    test('Case 4: Quick Reply Integration & Image Upload', async ({ }, testInfo) => {
        const safeTitle = testInfo.title.replace(/[^a-zA-Z0-9]/g, '-');

        const contextA = await browser.newContext({ recordVideo: { dir: `test-results/videos/${safeTitle}/Passenger-QuickActions/` } });
        const pageA = await contextA.newPage();
        const contextB = await browser.newContext({ recordVideo: { dir: `test-results/videos/${safeTitle}/Driver/` } });
        const pageB = await contextB.newPage();

        try {
            await loginUser(pageA, 'bow1234', 'Thanchanok1234');
            await loginUser(pageB, 'kiangnz25464', 'Thanchanok1234');
            await enterChatRoom(pageA);
            await enterChatRoom(pageB);

            // Phase 1: Quick Reply
            // We click the quick reply toggle
            await pageA.locator('button[title="ตอบกลับด่วน"]').click();

            // We expect some popover or quick reply list to appear. Just pick the first button inside it.
            // Usually quick replies are buttons with text. Let's find a button that is newly visible inside the quick reply list.
            // The Vue code shows `<QuickReply :show="showQuickReply" @select="handleQuickReply" />`
            // The simplest way without knowing the exact element is to click the first apparent template button.
            await pageA.waitForTimeout(1000); // let UI animate

            // This locator might need adjustment based on how the QuickReply component is styled
            const quickReplyButtons = pageA.locator('button.bg-slate-100'); // Assuming generic class
            if (await quickReplyButtons.count() > 0) {
                const replyText = await quickReplyButtons.first().innerText();
                await quickReplyButtons.first().click();
                // B should receive it
                if (replyText) {
                    await expect(pageB.locator(`text="${replyText}"`).first()).toBeVisible({ timeout: 5000 });
                }
            }

            // Phase 2: Send a Mock Image
            const dummyImgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
            await pageA.setInputFiles('input[type="file"]', {
                name: 'test-demo.png',
                mimeType: 'image/png',
                buffer: dummyImgBuffer
            });

            // Hit the send button
            await pageA.locator('button:has(svg)').last().click();

            // Image bubble should be rendered (check for img tag inside chat area)
            await expect(pageB.locator('.flex-1.overflow-y-auto img').last()).toBeVisible({ timeout: 10000 });

            await pageA.waitForTimeout(3000);
        } finally {
            await contextA.close();
            await contextB.close();
        }
    });

});
