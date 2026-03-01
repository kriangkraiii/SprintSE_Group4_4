/**
 * Session Timeout Plugin (Client-side only)
 *
 * เมื่อผู้ใช้ไม่มีกิจกรรมนานเกิน 20 นาที:
 *   1. ลบ cookie token + user
 *   2. redirect ไปหน้าหลัก (/)
 *   3. แสดง alert แจ้งเตือน
 */
import { useSessionTimeout } from '~/composables/useSessionTimeout'

export default defineNuxtPlugin((nuxtApp) => {
    // เฉพาะ client-side เท่านั้น
    if (process.server) return

    nuxtApp.hook('app:mounted', () => {
        const token = useCookie('token')
        const user = useCookie('user')
        const router = useRouter()

        const TIMEOUT_MS = 20 * 60 * 1000 // 20 นาที
        const STORAGE_KEY = '__lastActivity__'

        // บันทึกเวลากิจกรรมล่าสุดลง localStorage
        const updateActivity = () => {
            try { localStorage.setItem(STORAGE_KEY, Date.now().toString()) } catch {}
        }

        const { start, resetTimer } = useSessionTimeout({
            timeoutMs: TIMEOUT_MS,
            isLoggedIn: () => !!token.value,
            onTimeout: () => {
                // ตรวจสอบซ้ำ: ถ้าไม่ได้ login อยู่ ก็ไม่ต้องทำอะไร
                if (!token.value) return

                // ตรวจเวลากิจกรรมล่าสุด — ถ้ายังไม่ถึง timeout จริงๆ (เช่น เพิ่ง login) ก็ข้าม
                try {
                    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
                    if (Date.now() - last < TIMEOUT_MS) {
                        // ยังมีกิจกรรมอยู่ — reset timer แล้วข้าม
                        resetTimer()
                        return
                    }
                } catch {}

                // ล้าง session
                token.value = null
                user.value = null

                // แจ้งเตือนผู้ใช้
                alert('เซสชันหมดอายุเนื่องจากไม่ได้ใช้งานเกิน 20 นาที กรุณาเข้าสู่ระบบใหม่')

                // redirect ไปหน้าหลัก
                router.push('/')
            },
        })

        // บันทึกเวลากิจกรรมทุกครั้งที่มี activity
        const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
        ACTIVITY_EVENTS.forEach(e => {
            window.addEventListener(e, updateActivity, { passive: true })
        })

        // ตั้งค่า lastActivity เป็นปัจจุบัน
        updateActivity()

        // เริ่มติดตาม
        start()
    })
})

