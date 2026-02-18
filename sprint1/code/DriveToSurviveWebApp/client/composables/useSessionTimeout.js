import { ref, onUnmounted } from 'vue'

/**
 * useSessionTimeout — ติดตามความไม่ active ของผู้ใช้
 * เมื่อไม่มีกิจกรรมนานเกิน TIMEOUT_MS จะ logout อัตโนมัติ
 *
 * @param {Object} options
 * @param {number}   options.timeoutMs   — ระยะเวลา timeout (ms) ค่าเริ่มต้น 20 นาที
 * @param {Function} options.onTimeout   — callback เมื่อ timeout
 * @param {Function} options.isLoggedIn  — function ตรวจว่า login อยู่หรือไม่
 */
export function useSessionTimeout(options = {}) {
    const {
        timeoutMs = 20 * 60 * 1000, // 20 นาที
        onTimeout = () => { },
        isLoggedIn = () => false,
    } = options

    const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    let timer = null
    const isActive = ref(true)

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
    }

    const handleTimeout = () => {
        isActive.value = false
        onTimeout()
    }

    const resetTimer = () => {
        // ข้ามถ้าไม่ได้ login
        if (!isLoggedIn()) return

        isActive.value = true
        clearTimer()
        timer = setTimeout(handleTimeout, timeoutMs)
    }

    const start = () => {
        if (typeof window === 'undefined') return

        // เริ่ม timer ครั้งแรก
        resetTimer()

        // ฟังทุก activity event
        ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true })
        })
    }

    const stop = () => {
        if (typeof window === 'undefined') return

        clearTimer()
        ACTIVITY_EVENTS.forEach((event) => {
            window.removeEventListener(event, resetTimer)
        })
    }

    // Cleanup เมื่อ component unmount
    if (typeof onUnmounted === 'function') {
        try { onUnmounted(stop) } catch { /* ไม่อยู่ใน component scope */ }
    }

    return { start, stop, resetTimer, isActive }
}
