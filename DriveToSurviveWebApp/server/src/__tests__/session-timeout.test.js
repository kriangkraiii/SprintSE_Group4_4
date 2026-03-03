/**
 * Tests: Session Timeout Logic
 *
 * ทดสอบว่าเมื่อผู้ใช้ไม่มีกิจกรรมเกิน timeout จะเรียก onTimeout callback
 * ทดสอบ core logic โดยไม่ต้องพึ่ง Vue framework
 */

// ─── Setup fake window ───
const listeners = {};
global.window = {
    addEventListener: jest.fn((event, handler) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
    }),
    removeEventListener: jest.fn((event, handler) => {
        if (listeners[event]) {
            listeners[event] = listeners[event].filter(h => h !== handler);
        }
    }),
};

// ─── Inline pure implementation (ไม่พึ่ง Vue) ───
function createSessionTimeout(options = {}) {
    const {
        timeoutMs = 20 * 60 * 1000,
        onTimeout = () => { },
        isLoggedIn = () => false,
    } = options;

    const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    let timer = null;
    let isActive = true;

    const clearTimer = () => {
        if (timer) { clearTimeout(timer); timer = null; }
    };

    const handleTimeout = () => {
        isActive = false;
        onTimeout();
    };

    const resetTimer = () => {
        if (!isLoggedIn()) return;
        isActive = true;
        clearTimer();
        timer = setTimeout(handleTimeout, timeoutMs);
    };

    const start = () => {
        resetTimer();
        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, resetTimer, { passive: true });
        });
    };

    const stop = () => {
        clearTimer();
        ACTIVITY_EVENTS.forEach(event => {
            window.removeEventListener(event, resetTimer);
        });
    };

    return { start, stop, resetTimer, getIsActive: () => isActive };
}

// ─── Tests ───
describe('Session Timeout Logic', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        Object.keys(listeners).forEach(key => delete listeners[key]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // ─── 1. ไม่เรียก timeout เมื่อมี activity ภายใน 20 นาที ───
    test('should NOT call onTimeout when user has activity within timeout', () => {
        const onTimeout = jest.fn();
        const { start, resetTimer } = createSessionTimeout({
            timeoutMs: 20 * 60 * 1000,
            onTimeout,
            isLoggedIn: () => true,
        });

        start();

        // จำลอง activity ที่ 10 นาที
        jest.advanceTimersByTime(10 * 60 * 1000);
        resetTimer();

        // อีก 10 นาที (20 นาทีจากเริ่ม แต่มี reset ที่ 10 นาที)
        jest.advanceTimersByTime(10 * 60 * 1000);
        expect(onTimeout).not.toHaveBeenCalled();

        // ครบ 20 นาทีหลัง reset → timeout
        jest.advanceTimersByTime(10 * 60 * 1000);
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    // ─── 2. เรียก timeout เมื่อไม่มี activity 20 นาที ───
    test('should call onTimeout after 20 minutes of inactivity', () => {
        const onTimeout = jest.fn();
        const { start } = createSessionTimeout({
            timeoutMs: 20 * 60 * 1000,
            onTimeout,
            isLoggedIn: () => true,
        });

        start();

        jest.advanceTimersByTime(19 * 60 * 1000);
        expect(onTimeout).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1 * 60 * 1000);
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    // ─── 3. ข้ามเมื่อไม่ได้ login ───
    test('should NOT start timer when user is not logged in', () => {
        const onTimeout = jest.fn();
        const { start } = createSessionTimeout({
            timeoutMs: 1000,
            onTimeout,
            isLoggedIn: () => false,
        });

        start();

        jest.advanceTimersByTime(5000);
        expect(onTimeout).not.toHaveBeenCalled();
    });

    // ─── 4. stop() หยุด timer ───
    test('should stop tracking when stop() is called', () => {
        const onTimeout = jest.fn();
        const { start, stop } = createSessionTimeout({
            timeoutMs: 1000,
            onTimeout,
            isLoggedIn: () => true,
        });

        start();
        stop();

        jest.advanceTimersByTime(5000);
        expect(onTimeout).not.toHaveBeenCalled();
    });

    // ─── 5. ลงทะเบียน event listeners ───
    test('should register activity event listeners on start', () => {
        const { start } = createSessionTimeout({
            timeoutMs: 1000,
            onTimeout: () => { },
            isLoggedIn: () => true,
        });

        start();

        const registeredEvents = window.addEventListener.mock.calls.map(c => c[0]);
        expect(registeredEvents).toContain('mousemove');
        expect(registeredEvents).toContain('keydown');
        expect(registeredEvents).toContain('click');
        expect(registeredEvents).toContain('touchstart');
        expect(registeredEvents).toContain('scroll');
    });

    // ─── 6. ลบ event listeners เมื่อ stop ───
    test('should remove event listeners on stop', () => {
        const { start, stop } = createSessionTimeout({
            timeoutMs: 1000,
            onTimeout: () => { },
            isLoggedIn: () => true,
        });

        start();
        stop();

        const removedEvents = window.removeEventListener.mock.calls.map(c => c[0]);
        expect(removedEvents).toContain('mousemove');
        expect(removedEvents).toContain('keydown');
        expect(removedEvents).toContain('click');
        expect(removedEvents).toContain('touchstart');
        expect(removedEvents).toContain('scroll');
    });

    // ─── 7. ใช้ timeout ที่กำหนดเองได้ ───
    test('should respect custom timeout value', () => {
        const onTimeout = jest.fn();
        const { start } = createSessionTimeout({
            timeoutMs: 5000,
            onTimeout,
            isLoggedIn: () => true,
        });

        start();

        jest.advanceTimersByTime(4999);
        expect(onTimeout).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });
});
