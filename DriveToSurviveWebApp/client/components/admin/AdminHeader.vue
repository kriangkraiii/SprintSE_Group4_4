```html
<template>
<div></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'
import { useAuth } from '~/composables/useAuth'

const { token, user, logout } = useAuth()
const route = useRoute()
const openProfileMenu = ref(false)
const profileBtn = ref(null)
const profilePanel = ref(null)

const currentPageLabel = computed(() => {
    const path = route.path || ''
    if (path.includes('/admin/system-logs')) return 'System Logs'
    if (path.includes('/admin/blacklist')) return 'Blacklist'
    if (path.includes('/admin/routes')) return 'Routes'
    if (path.includes('/admin/bookings')) return 'Bookings'
    if (path.includes('/admin/vehicles')) return 'Vehicles'
    if (path.includes('/admin/driver-verifications')) return 'Driver Verifications'
    if (path.includes('/admin/users')) return 'User Management'
    return 'Admin'
})

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('overlay')
    if (!sidebar || !overlay) return
    sidebar.classList.toggle('mobile-open')
    overlay.classList.toggle('hidden')
}

const openNotif = ref(false)
const openMenuId = ref(null)       // <- เมนูย่อยของแต่ละรายการ
const loading = ref(false)
const bellBtn = ref(null)
const notifPanel = ref(null)
const notifications = ref([])

const unreadCount = computed(() => notifications.value.filter(n => !n.adminReviewedAt).length)

function toggleNotif() {
    openNotif.value = !openNotif.value
    if (!openNotif.value) openMenuId.value = null
}

/** กดกระดิ่ง */
async function onBellClick() {
    toggleNotif()
    if (openNotif.value && notifications.value.length === 0) {
        await fetchAdminNotifications()
    }
}

/** โหลด notification ของ ADMIN (กรองเฉพาะที่ initiatedBy=user) */
async function fetchAdminNotifications() {
    try {
        if (!user?.value || String(user.value.role).toUpperCase() !== 'ADMIN') return
        loading.value = true

        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk =
            useCookie('token')?.value ||
            token?.value ||
            (process.client ? localStorage.getItem('token') : '')

        const res = await $fetch('/notifications/admin', {
            baseURL: apiBase,
            headers: {
                Accept: 'application/json',
                ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
            },
            query: { page: 1, limit: 20 },
        })

        const raw = Array.isArray(res?.data) ? res.data : []
        const list = raw.filter(it => (it?.metadata?.initiatedBy || '').toLowerCase() === 'user')

        notifications.value = list.map(it => ({
            id: it.id,
            title: it.title || '-',
            body: it.body || '',
            createdAt: it.createdAt || Date.now(),
            adminReviewedAt: it.adminReviewedAt || null,
        }))
    } catch (err) {
        console.error(err)
        notifications.value = []
    } finally {
        loading.value = false
    }
}

/* ----- เมนูย่อยต่อรายการ ----- */
function toggleItemMenu(id) {
    openMenuId.value = openMenuId.value === id ? null : id
}

async function markAsRead(n) {
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk =
            useCookie('token')?.value ||
            token?.value ||
            (process.client ? localStorage.getItem('token') : '')

        // เดา endpoint ตาม convention (ปรับให้ตรงกับ backend ถ้าไม่ตรง)
        await fetch(`${apiBase}/notifications/admin/${n.id}/read`, {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                // 'Content-Type': 'application/json',
                ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
            },
            // body: JSON.stringify({ read: true }),
            credentials: 'include',
        }).catch(() => { }) // เงียบถ้า backend ยังไม่มี

        // อัปเดต UI ทันที
        const i = notifications.value.findIndex(x => x.id === n.id)
        if (i > -1) notifications.value[i].adminReviewedAt = new Date().toISOString()
    } finally {
        openMenuId.value = null
    }
}

async function removeNotification(n) {
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk =
            useCookie('token')?.value ||
            token?.value ||
            (process.client ? localStorage.getItem('token') : '')

        // เดา endpoint ลบ (ปรับให้ตรงกับ backend ถ้าจริงต่างกัน)
        await fetch(`${apiBase}/notifications/admin/${n.id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
            },
            credentials: 'include',
        }).catch(() => { })

        // ลบจากรายการใน UI
        notifications.value = notifications.value.filter(x => x.id !== n.id)
    } finally {
        openMenuId.value = null
    }
}

/* ปิด dropdown เมื่อคลิกนอก */
function onClickOutside(e) {
    if (!openNotif.value && !openProfileMenu.value) return
    const t = e.target
    if (!(t instanceof Element)) return

    if (!notifPanel.value?.contains(t) && !bellBtn.value?.contains(t)) {
        openNotif.value = false
        openMenuId.value = null
    }

    if (!profilePanel.value?.contains(t) && !profileBtn.value?.contains(t)) {
        openProfileMenu.value = false
    }
}
function onKey(e) {
    if (e.key === 'Escape') {
        openNotif.value = false
        openMenuId.value = null
        openProfileMenu.value = false
    }
}

const handleLogout = async () => {
    openProfileMenu.value = false
    await logout()
}

onMounted(() => {
    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onKey)
    if (String(user?.value?.role || '').toUpperCase() === 'ADMIN') fetchAdminNotifications()
})
onUnmounted(() => {
    document.removeEventListener('click', onClickOutside)
    document.removeEventListener('keydown', onKey)
})

/* เวลาแบบย่อ */
function timeAgo(ts) {
    const ms = Date.now() - new Date(ts).getTime()
    const m = Math.floor(ms / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m} min ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} hr ago`
    const d = Math.floor(h / 24)
    return `${d} d ago`
}
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
```
