        <!-- Navbar -->
        <header class="sticky top-0 z-50 border-b border-slate-700/50 bg-primary/95 backdrop-blur-md">
            <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- Brand -->
                    <NuxtLink to="/" class="flex items-center gap-2">
                        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-cta">
                            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span class="text-xl font-bold text-white font-heading">Drive To Survive</span>
                    </NuxtLink>

                    <!-- Desktop Nav -->
                    <nav class="items-center hidden gap-1 md:flex">
                        <NuxtLink to="/findTrip"
                            class="px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg cursor-pointer hover:bg-white/10"
                            :class="$route.path === '/findTrip' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'">
                            ค้นหาเส้นทาง
                        </NuxtLink>

                        <NuxtLink v-if="token" to="/createTrip"
                            class="px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg cursor-pointer hover:bg-white/10"
                            :class="$route.path === '/createTrip' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'">
                            สร้างเส้นทาง
                        </NuxtLink>

                        <!-- ทุกคนเห็น dropdown — ผู้ใช้สามารถเป็นทั้ง passenger และ driver ได้ -->
                        <div v-if="token" class="relative dropdown-trigger">
                            <button
                                class="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg cursor-pointer hover:bg-white/10"
                                :class="$route.path.startsWith('/myTrip') || $route.path.startsWith('/myRoute') ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'">
                                การเดินทางทั้งหมด
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div
                                class="absolute right-0 w-48 py-1 mt-1 bg-white border rounded-lg shadow-lg dropdown-menu top-full border-slate-200">
                                <NuxtLink to="/myTrip"
                                    class="block px-4 py-2 text-sm cursor-pointer text-secondary hover:bg-slate-50 hover:text-primary">
                                    การเดินทางของฉัน
                                </NuxtLink>
                                <NuxtLink to="/myRoute"
                                    class="block px-4 py-2 text-sm cursor-pointer text-secondary hover:bg-slate-50 hover:text-primary">
                                    คำขอจองเส้นทางของฉัน
                                </NuxtLink>
                            </div>
                        </div>

                        <!-- Auth buttons -->
                        <div v-if="!token" class="flex items-center gap-2 ml-2">
                            <NuxtLink to="/login"
                                class="text-sm text-slate-300 hover:text-white btn-ghost hover:bg-white/10">เข้าสู่ระบบ
                            </NuxtLink>
                            <NuxtLink to="/register"
                                class="bg-white text-primary hover:bg-slate-100 btn-primary text-sm font-semibold">
                                สมัครสมาชิก</NuxtLink>
                        </div>

                        <!-- Bell -->
                        <div v-if="token" class="relative ml-2">
                            <button ref="bellBtn"
                                class="relative p-2 transition-colors duration-200 rounded-lg cursor-pointer hover:bg-white/10"
                                :class="openNotif ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'"
                                @click="onBellClick" aria-haspopup="true"
                                :aria-expanded="openNotif ? 'true' : 'false'">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V9a6 6 0 10-12 0v4c0 .918-.21 1.79-.595 2.595L4 17h5m6 0a3 3 0 11-6 0h6z" />
                                </svg>
                                <span v-if="unreadCount > 0"
                                    class="absolute w-2 h-2 rounded-full -top-0.5 -right-0.5 bg-red-500 ring-2 ring-primary"></span>
                            </button>

                            <transition enter-active-class="transition duration-150 ease-out"
                                enter-from-class="translate-y-1 opacity-0"
                                enter-to-class="translate-y-0 opacity-100"
                                leave-active-class="transition duration-100 ease-in"
                                leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-1 opacity-0">
                                <div v-if="openNotif" ref="notifPanel"
                                    class="absolute top-full right-0 mt-2 w-[360px] max-w-[90vw] max-h-[70vh] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[60]"
                                    @click.stop>
                                    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                        <h3 class="font-semibold font-heading text-primary">การแจ้งเตือน</h3>
                                        <button
                                            class="p-1 rounded-md cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                            @click="openNotif = false">
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div class="max-h-[56vh] overflow-y-auto">
                                        <div v-if="notifications.length === 0 && !loading"
                                            class="px-4 py-8 text-sm text-center text-slate-400">
                                            ไม่มีการแจ้งเตือน
                                        </div>
                                        <div v-if="loading" class="px-4 py-4 text-sm text-slate-400">กำลังโหลด…</div>
                                        <div v-for="(n, idx) in notifications" :key="n.id || idx" class="relative">
                                            <div class="px-4 py-3 cursor-pointer hover:bg-slate-50">
                                                <div class="flex items-start gap-3">
                                                    <span class="inline-block w-2 h-2 mt-1.5 rounded-full shrink-0"
                                                        :class="n.readAt ? 'bg-slate-300' : 'bg-cta'"></span>
                                                    <div class="flex-1 min-w-0">
                                                        <p class="text-sm font-medium truncate text-primary">{{ n.title
                                                            }}</p>
                                                        <p class="text-sm line-clamp-2 text-slate-500">{{ n.body }}</p>
                                                        <p class="mt-1 text-xs text-slate-400">{{ timeAgo(n.createdAt)
                                                            }}</p>
                                                    </div>
                                                    <div class="relative shrink-0">
                                                        <button
                                                            class="p-1 rounded-md cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                            @click.stop="toggleItemMenu(n.id)">
                                                            <svg class="w-4 h-4" viewBox="0 0 24 24"
                                                                fill="currentColor">
                                                                <circle cx="12" cy="5" r="2" />
                                                                <circle cx="12" cy="12" r="2" />
                                                                <circle cx="12" cy="19" r="2" />
                                                            </svg>
                                                        </button>
                                                        <div v-if="openMenuId === n.id"
                                                            class="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-[70]"
                                                            @click.stop>
                                                            <button
                                                                class="flex items-center w-full gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                                                                @click="markAsRead(n)">
                                                                <svg class="w-4 h-4 text-cta" viewBox="0 0 24 24"
                                                                    fill="none" stroke="currentColor" stroke-width="2">
                                                                    <circle cx="12" cy="12" r="9" />
                                                                    <path d="M9 12l2 2 4-4" stroke-linecap="round"
                                                                        stroke-linejoin="round" />
                                                                </svg>
                                                                ทำเครื่องหมายอ่านแล้ว
                                                            </button>
                                                            <button
                                                                class="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50"
                                                                @click="removeNotification(n)">
                                                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                                                    stroke="currentColor" stroke-width="2">
                                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                                        d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3-3h8m-9 3h10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                                                </svg>
                                                                ลบการแจ้งเตือนนี้
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mx-4 border-t border-slate-100"
                                                v-if="idx !== notifications.length - 1"></div>
                                        </div>
                                    </div>
                                    <div class="px-4 py-3 bg-white border-t border-slate-100">
                                        <NuxtLink to="/notifications"
                                            class="block w-full px-4 py-2 text-sm font-medium text-center rounded-lg cursor-pointer text-cta bg-cta-light hover:bg-sky-100"
                                            @click="openNotif = false">
                                            ดูการแจ้งเตือนทั้งหมด
                                        </NuxtLink>
                                    </div>
                                </div>
                            </transition>
                        </div>

                        <!-- Profile (ทุก role ที่ไม่ใช่ Admin) -->
                        <div v-if="token && (!user || user.role !== 'ADMIN')" class="relative ml-1 dropdown-trigger">
                            <button
                                class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors duration-200">
                                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-cta-light">
                                    <svg class="w-4 h-4 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span class="text-sm font-medium text-white">{{ user?.firstName || 'บัญชี' }}</span>
                                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div
                                class="absolute right-0 w-44 py-1 mt-1 bg-white border rounded-lg shadow-lg dropdown-menu top-full border-slate-200">
                                <NuxtLink to="/profile"
                                    class="block px-4 py-2 text-sm cursor-pointer text-secondary hover:bg-slate-50 hover:text-primary">
                                    บัญชีของฉัน
                                </NuxtLink>
                                <NuxtLink v-if="!isDriverVerified" to="/profile/driver-verification"
                                    class="block px-4 py-2 text-sm cursor-pointer text-secondary hover:bg-slate-50 hover:text-primary">
                                    ยืนยันใบขับขี่
                                </NuxtLink>
                                <NuxtLink to="/profile/my-vehicle"
                                    class="block px-4 py-2 text-sm cursor-pointer text-secondary hover:bg-slate-50 hover:text-primary">
                                    ข้อมูลรถยนต์
                                </NuxtLink>
                                <hr class="my-1 border-slate-100" />
                                <button @click="logout"
                                    class="block w-full px-4 py-2 text-sm text-left text-red-600 cursor-pointer hover:bg-red-50">
                                    ออกจากระบบ
                                </button>
                            </div>
                        </div>
                        <div v-else-if="token && user && user.role === 'ADMIN'" class="relative ml-1 dropdown-trigger">
                            <button
                                class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors duration-200">
                                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
                                    <svg class="w-4 h-4 text-amber-700" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <span class="text-sm font-medium text-white">{{ user.firstName }}</span>
                                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div
                                class="absolute right-0 w-44 py-1 mt-1 bg-white border rounded-lg shadow-lg dropdown-menu top-full border-slate-200">
                                <NuxtLink to="/profile"
                                    class="block px-4 py-2 text-sm cursor-pointer text-secondary hover:bg-slate-50 hover:text-primary">
                                    บัญชีของฉัน
                                </NuxtLink>
                                <NuxtLink to="/admin/users"
                                    class="block px-4 py-2 text-sm cursor-pointer text-secondary hover:bg-slate-50 hover:text-primary">
                                    Dashboard
                                </NuxtLink>
                                <hr class="my-1 border-slate-100" />
                                <button @click="logout"
                                    class="block w-full px-4 py-2 text-sm text-left text-red-600 cursor-pointer hover:bg-red-50">
                                    ออกจากระบบ
                                </button>
                            </div>
                        </div>
                    </nav>

                    <!-- Mobile hamburger -->
                    <div class="md:hidden">
                        <button @click="toggleMobileMenu" type="button"
                            class="p-2 transition-colors duration-200 rounded-lg cursor-pointer text-slate-300 hover:text-white hover:bg-white/10">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round"
                                    d="M4 6h16M4 12h16M4 18h16" />
                                <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu -->
                <div v-show="isMobileMenuOpen" class="pb-4 border-t md:hidden border-slate-700/50">
                    <div class="pt-3 space-y-1">
                        <NuxtLink to="/findTrip" class="block px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                            :class="$route.path === '/findTrip' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'"
                            @click="closeMobileMenu">
                            ค้นหาเส้นทาง
                        </NuxtLink>

                        <NuxtLink v-if="token" to="/createTrip"
                            class="block px-3 py-2 text-sm font-medium rounded-lg cursor-pointer"
                            :class="$route.path === '/createTrip' ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'"
                            @click="closeMobileMenu">
                            สร้างเส้นทาง
                        </NuxtLink>

                        <!-- ทุกคนเห็น dropdown —  ผู้ใช้สามารถเป็นทั้ง passenger และ driver ได้ -->
                        <div v-if="token">
                            <button @click="toggleMobileTripMenu"
                                class="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left rounded-lg cursor-pointer text-slate-300 hover:text-white hover:bg-white/5">
                                การเดินทางทั้งหมด
                                <svg class="w-4 h-4 transition-transform duration-200"
                                    :class="{ 'rotate-180': isMobileTripMenuOpen }" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div v-show="isMobileTripMenuOpen" class="mt-1 ml-4 space-y-1">
                                <NuxtLink to="/myTrip"
                                    class="block px-3 py-2 text-sm rounded-lg cursor-pointer text-slate-400 hover:text-white hover:bg-white/5"
                                    @click="closeMobileMenu">
                                    การเดินทางของฉัน
                                </NuxtLink>
                                <NuxtLink to="/myRoute"
                                    class="block px-3 py-2 text-sm rounded-lg cursor-pointer text-slate-400 hover:text-white hover:bg-white/5"
                                    @click="closeMobileMenu">
                                    คำขอจองเส้นทางของฉัน
                                </NuxtLink>
                            </div>
                        </div>

                        <div v-if="!token" class="pt-3 mt-3 space-y-2 border-t border-slate-700/50">
                            <NuxtLink to="/login"
                                class="block px-3 py-2 text-sm font-medium rounded-lg cursor-pointer text-slate-300 hover:bg-white/10 hover:text-white"
                                @click="closeMobileMenu">เข้าสู่ระบบ</NuxtLink>
                            <NuxtLink to="/register"
                                class="block px-3 py-2 text-sm font-medium text-center text-primary bg-white rounded-lg cursor-pointer hover:bg-slate-100"
                                @click="closeMobileMenu">สมัครสมาชิก</NuxtLink>
                        </div>

                        <div v-else class="pt-3 mt-3 border-t border-slate-700/50">
                            <div class="flex items-center gap-3 px-3 py-2">
                                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-cta-light">
                                    <svg class="w-4 h-4 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span class="text-sm font-medium text-white">{{ user?.firstName }}</span>
                            </div>
                            <NuxtLink to="/profile"
                                class="block px-3 py-2 ml-4 text-sm rounded-lg cursor-pointer text-slate-300 hover:text-white hover:bg-white/5"
                                @click="closeMobileMenu">บัญชีของฉัน</NuxtLink>
                            <NuxtLink v-if="!isDriverVerified" to="/profile/driver-verification"
                                class="block px-3 py-2 ml-4 text-sm rounded-lg cursor-pointer text-slate-300 hover:text-white hover:bg-white/5"
                                @click="closeMobileMenu">ยืนยันใบขับขี่</NuxtLink>
                            <NuxtLink to="/profile/my-vehicle"
                                class="block px-3 py-2 ml-4 text-sm rounded-lg cursor-pointer text-slate-300 hover:text-white hover:bg-white/5"
                                @click="closeMobileMenu">ข้อมูลรถยนต์</NuxtLink>
                            <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/users"
                                class="block px-3 py-2 ml-4 text-sm rounded-lg cursor-pointer text-slate-300 hover:text-white hover:bg-white/5"
                                @click="closeMobileMenu">Dashboard</NuxtLink>
                            <button @click="logout"
                                class="block w-full px-3 py-2 ml-4 text-sm text-left text-red-400 rounded-lg cursor-pointer hover:bg-red-400/10">ออกจากระบบ</button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main>
            <NuxtPage />
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'
import { useAuth } from '~/composables/useAuth'
import { useDriverStatus } from '~/composables/useDriverStatus'

const { token, user, logout } = useAuth()
const { isDriverVerified, fetchDriverStatus } = useDriverStatus()

const isMobileMenuOpen = ref(false)
const isMobileTripMenuOpen = ref(false)

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    if (!isMobileMenuOpen.value) isMobileTripMenuOpen.value = false
}
const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
    isMobileTripMenuOpen.value = false
}
const toggleMobileTripMenu = () => {
    isMobileTripMenuOpen.value = !isMobileTripMenuOpen.value
}
const handleResize = () => {
    if (window.innerWidth >= 768) {
        isMobileMenuOpen.value = false
        isMobileTripMenuOpen.value = false
    }
}

/* Bell Notification */
const openNotif = ref(false)
const openMenuId = ref(null)
const loading = ref(false)
const bellBtn = ref(null)
const notifPanel = ref(null)
const notifications = ref([])

const unreadCount = computed(() => notifications.value.filter(n => !n.readAt).length)

function toggleNotif() {
    openNotif.value = !openNotif.value
    if (!openNotif.value) openMenuId.value = null
}

async function onBellClick() {
    toggleNotif()
    if (openNotif.value && notifications.value.length === 0) {
        await fetchUserNotifications()
    }
}

async function fetchUserNotifications() {
    try {
        if (!token.value) return
        loading.value = true
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        const res = await $fetch('/notifications', {
            baseURL: apiBase,
            headers: { Accept: 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
            query: { page: 1, limit: 20 }
        })
        const raw = Array.isArray(res?.data) ? res.data : []
        notifications.value = raw.map(it => ({
            id: it.id,
            title: it.title || '-',
            body: it.body || '',
            createdAt: it.createdAt || Date.now(),
            readAt: it.readAt || null
        }))
    } catch (e) {
        console.error(e)
        notifications.value = []
    } finally {
        loading.value = false
    }
}

function toggleItemMenu(id) {
    openMenuId.value = openMenuId.value === id ? null : id
}

async function markAsRead(n) {
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        await fetch(`${apiBase}/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Accept: 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
            credentials: 'include'
        })
        const i = notifications.value.findIndex(x => x.id === n.id)
        if (i > -1) notifications.value[i].readAt = new Date().toISOString()
    } finally {
        openMenuId.value = null
    }
}

async function removeNotification(n) {
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        await fetch(`${apiBase}/notifications/${n.id}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
            credentials: 'include'
        })
        notifications.value = notifications.value.filter(x => x.id !== n.id)
    } finally {
        openMenuId.value = null
    }
}

function onClickOutside(e) {
    if (!openNotif.value) return
    if (notifPanel.value?.contains(e.target) || bellBtn.value?.contains(e.target)) return
    openNotif.value = false
    openMenuId.value = null
}
function onKey(e) {
    if (e.key === 'Escape') {
        openNotif.value = false
        openMenuId.value = null
    }
}

function timeAgo(ts) {
    const ms = Date.now() - new Date(ts).getTime()
    const m = Math.floor(ms / 60000)
    if (m < 1) return 'เมื่อสักครู่'
    if (m < 60) return `${m} นาทีที่แล้ว`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} ชม.ที่แล้ว`
    const d = Math.floor(h / 24)
    return `${d} วันที่แล้ว`
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onKey)
    if (token.value) {
        fetchUserNotifications()
        fetchDriverStatus()
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('click', onClickOutside)
    document.removeEventListener('keydown', onKey)
})
>>>>>>> origin/main
</script>