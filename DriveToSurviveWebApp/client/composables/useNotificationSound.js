/**
 * Notification Sound Composable
 *
 * เล่นเสียงแจ้งเตือนเมื่อมี notification ใหม่เข้ามาแบบ real-time
 * ใช้ Web Audio API สร้างเสียง beep สั้นๆ ไม่ต้องพึ่ง audio file
 */

let _audioCtx = null

function getAudioContext() {
    if (!_audioCtx && typeof window !== 'undefined' && window.AudioContext) {
        _audioCtx = new AudioContext()
    }
    return _audioCtx
}

/**
 * เล่นเสียง notification — สร้าง 2-tone beep สั้นๆ (ding-dong)
 */
export function playNotificationSound() {
    try {
        const ctx = getAudioContext()
        if (!ctx) return

        // Resume if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume()
        }

        const now = ctx.currentTime

        // First tone (higher pitch) — ding
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(880, now)  // A5
        gain1.gain.setValueAtTime(0.3, now)
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.15)

        // Second tone (lower pitch) — dong
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(659.25, now + 0.15)  // E5
        gain2.gain.setValueAtTime(0.3, now + 0.15)
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.15)
        osc2.stop(now + 0.4)
    } catch (e) {
        // Silently fail if audio not available
        console.warn('[NotifSound]', e.message)
    }
}

export function useNotificationSound() {
    return { playNotificationSound }
}
