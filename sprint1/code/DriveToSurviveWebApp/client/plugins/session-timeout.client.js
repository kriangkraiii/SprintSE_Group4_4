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

        const { start } = useSessionTimeout({
            timeoutMs: 20 * 60 * 1000, // 20 นาที
            isLoggedIn: () => !!token.value,
            onTimeout: () => {
                // ล้าง session
                token.value = null
                user.value = null

                // แจ้งเตือนผู้ใช้
                alert('เซสชันหมดอายุเนื่องจากไม่ได้ใช้งานเกิน 20 นาที กรุณาเข้าสู่ระบบใหม่')

                // redirect ไปหน้าหลัก
                router.push('/')
            },
        })

        // เริ่มติดตาม
        start()
    })
})
