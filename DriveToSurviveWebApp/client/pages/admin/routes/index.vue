<template>
    <div class="">
        <AdminHeader />
        <AdminSidebar />

        <!-- Main Content -->
        <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-8xl">
                <!-- Title + Controls -->
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <!-- Left: Title + Create Button -->
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-semibold text-primary">Route Management</h1>
                        <button @click="onCreateRoute"
                            class="inline-flex items-center gap-2 px-3 py-2 text-white bg-cta rounded-md cursor-pointer hover:bg-cta-hover">
                            <i class="fa-solid fa-plus"></i>
                            <span class="hidden sm:inline">สร้างเส้นทางใหม่</span>
                        </button>
                    </div>

                    <!-- Right: Quick Search -->
                    <div class="flex items-center gap-2">
                        <input v-model.trim="filters.q" @keyup.enter="applyFilters" type="text"
                            placeholder="ค้นหา : สรุปเส้นทาง / ไดรเวอร์ / ยานพาหนะ"
                            class="max-w-full px-3 py-2 border border-slate-200 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-cta" />
                        <button @click="applyFilters"
                            class="px-4 py-2 text-white bg-cta rounded-md cursor-pointer hover:bg-cta-hover">
                            ค้นหา
                        </button>
                    </div>
                </div>

                <!-- Advanced Filters -->
                <div class="mb-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div class="grid grid-cols-1 gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[repeat(24,minmax(0,1fr))]">
                        <!-- Start Location Name (5/24) -->
                        <div class="lg:col-span-5">
                            <label class="block mb-1 text-xs font-medium text-slate-500">จุดเริ่มต้น (ใช้ key:
                                name)</label>
                            <input v-model.trim="filters.startName" type="text" placeholder="เช่น มอแดง เพลส"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta" />
                        </div>

                        <!-- End Location Name (5/24) -->
                        <div class="lg:col-span-5">
                            <label class="block mb-1 text-xs font-medium text-slate-500">ปลายทาง (ใช้ key: name)</label>
                            <input v-model.trim="filters.endName" type="text" placeholder="เช่น โลตัส ขอนแก่น 2"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta" />
                        </div>

                        <!-- Status (4/24) -->
                        <div class="lg:col-span-4">
                            <label class="block mb-1 text-xs font-medium text-slate-500">สถานะ</label>
                            <select v-model="filters.status"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta">
                                <option value="">ทั้งหมด</option>
                                <option value="AVAILABLE">AVAILABLE</option>
                                <option value="FULL">FULL</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>

                        <!-- Departure From (5/24) -->
                        <div class="lg:col-span-5">
                            <label class="block mb-1 text-xs font-medium text-slate-500">เวลาออกเดินทางตั้งแต่
                                (YYYY-MM-DD)</label>
                            <input v-model="filters.departureFrom" type="date"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta" />
                        </div>

                        <!-- Departure To (5/24) -->
                        <div class="lg:col-span-5">
                            <label class="block mb-1 text-xs font-medium text-slate-500">ถึงวันที่</label>
                            <input v-model="filters.departureTo" type="date"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta" />
                        </div>

                        <!-- Sort (รวม sortBy + sortOrder) -->
                        <div class="lg:col-span-4">
                            <label class="block mb-1 text-xs font-medium text-slate-500">เรียงตาม</label>
                            <select v-model="filters.sort"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta">
                                <option value="">(ค่าเริ่มต้น)</option>
                                <option value="createdAt:desc">createdAt desc</option>
                                <option value="createdAt:asc">createdAt asc</option>
                                <option value="updatedAt:desc">updatedAt desc</option>
                                <option value="updatedAt:asc">updatedAt asc</option>
                                <option value="departureTime:desc">departureTime desc</option>
                                <option value="departureTime:asc">departureTime asc</option>
                            </select>
                        </div>

                        <!-- Actions (2/24) -->
                        <div class="flex items-end justify-end gap-2 mt-1 lg:col-span-4 lg:mt-0">
                            <button @click="clearFilters"
                                class="px-3 py-2 text-primary border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                                ล้างตัวกรอง
                            </button>
                            <button @click="applyFilters"
                                class="px-4 py-2 text-white bg-cta rounded-md cursor-pointer hover:bg-cta-hover">
                                ใช้ตัวกรอง
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Card -->
                <div class="bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div class="flex items-center justify-between px-4 py-4 border-b border-slate-100 sm:px-6">
                        <div class="text-sm text-slate-500">
                            หน้าที่ {{ pagination.page }} / {{ totalPages }} • ทั้งหมด {{ pagination.total }} เส้นทาง
                        </div>
                    </div>

                    <!-- Loading / Error -->
                    <div v-if="isLoading" class="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
                    <div v-else-if="loadError" class="p-8 text-center text-red-600">{{ loadError }}</div>

                    <!-- Table -->
                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-100">
                            <thead class="bg-slate-50">
                                <tr>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">เส้นทาง
                                    </th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">ไดรเวอร์
                                    </th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">ยานพาหนะ
                                    </th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">
                                        ออกเดินทาง</th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">
                                        ที่นั่ง/ราคา</th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">สถานะ
                                    </th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">
                                        สร้างเมื่อ</th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">การกระทำ
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-slate-100">
                                <tr v-for="r in routes" :key="r.id" class="transition-opacity hover:bg-slate-50">
                                    <td class="px-4 py-3">
                                        <div class="flex items-start gap-3">
                                            <div class="flex-1">
                                                <div class="font-medium text-primary">

                                                    {{ r.startLocation?.name || '-' }}
                                                    <span class="mx-2 text-slate-300">→</span>

                                                    {{ r.endLocation?.name || '-' }}
                                                </div>
                                                <div class="text-xs text-slate-400">
                                                    ระยะทาง : {{
                                                        formatKm(r.distanceMeters) }}
                                                    <span class="mx-2 text-slate-200">|</span>
                                                    เวลา : {{
                                                        formatDuration(r.durationSeconds) }}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-3">
                                            <img :src="r.driver?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.driver?.firstName || 'D')}&background=random&size=64`"
                                                class="object-cover rounded-full w-9 h-9" alt="avatar" />
                                            <div>
                                                <div class="font-medium text-primary">{{ r.driver?.firstName }} {{
                                                    r.driver?.lastName }}</div>
                                                <div class="text-xs text-slate-400">{{ r.driver?.isVerified ?
                                                    'ยืนยันแล้ว' : 'ยังไม่ยืนยัน' }}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-4 py-3">
                                        <div class="text-primary">{{ r.vehicle?.vehicleModel || '-' }} <span
                                                class="text-xs text-slate-400">({{ r.vehicle?.vehicleType || '-'
                                                }})</span></div>
                                    </td>

                                    <td class="px-4 py-3 text-primary">
                                        <div class="text-sm">{{ formatDate(r.departureTime) }}</div>

                                    </td>

                                    <td class="px-4 py-3 text-primary">
                                        <div class="text-sm">{{ r.availableSeats }} ที่นั่ง</div>
                                        <div class="text-xs text-slate-400">฿{{ r.pricePerSeat }} / ที่นั่ง</div>
                                    </td>

                                    <td class="px-4 py-3">
                                        <span
                                            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                                            :class="statusBadge(r.status)">
                                            <i class="mr-1 fa-solid"
                                                :class="r.status === 'AVAILABLE' ? 'fa-circle-check' : r.status === 'FULL' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'"></i>
                                            {{ r.status || '-' }}
                                        </span>
                                    </td>

                                    <td class="px-4 py-3 text-primary">
                                        <div class="text-sm">{{ formatDate(r.createdAt) }}</div>
                                        <!-- <div class="text-xs text-slate-400">ID: {{ r.id.slice(0, 8) }}</div> -->
                                        <div class="text-xs text-slate-400">อัปเดต {{ formatDate(r.updatedAt) }}</div>
                                    </td>

                                    <td class="px-4 py-3">
                                        <button @click="onViewRoute(r)"
                                            class="p-2 text-slate-400 transition-colors cursor-pointer hover:text-emerald-600"
                                            title="ดูรายละเอียด" aria-label="ดูรายละเอียด">
                                            <i class="text-lg fa-regular fa-eye"></i>
                                        </button>
                                        <button @click="onEditRoute(r)"
                                            class="p-2 text-slate-400 transition-colors cursor-pointer hover:text-cta"
                                            title="แก้ไข" aria-label="แก้ไข">
                                            <i class="text-lg fa-regular fa-pen-to-square"></i>
                                        </button>
                                        <button @click="askDelete(r)"
                                            class="p-2 text-slate-400 transition-colors cursor-pointer hover:text-red-600"
                                            title="ลบ" aria-label="ลบ">
                                            <i class="text-lg fa-regular fa-trash-can"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="!routes.length">
                                    <td colspan="8" class="px-4 py-10 text-center text-slate-400">ไม่มีข้อมูลเส้นทาง</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div
                        class="flex flex-col gap-3 px-4 py-4 border-t border-slate-100 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
                        <div class="flex flex-wrap items-center gap-3 text-sm">
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-slate-400">Limit:</span>
                                <select v-model.number="pagination.limit" @change="applyFilters"
                                    class="px-2 py-1 text-sm border border-slate-200 rounded-md focus:ring-cta">
                                    <option :value="10">10</option>
                                    <option :value="20">20</option>
                                    <option :value="50">50</option>
                                </select>
                            </div>
                        </div>

                        <nav class="flex items-center gap-1">
                            <button class="px-3 py-2 text-sm border rounded-md disabled:opacity-50"
                                :disabled="pagination.page <= 1 || isLoading" @click="changePage(pagination.page - 1)">
                                Previous
                            </button>

                            <template v-for="(p, idx) in pageButtons" :key="`p-${idx}-${p}`">
                                <span v-if="p === '…'" class="px-2 text-sm text-slate-400">…</span>
                                <button v-else class="px-3 py-2 text-sm border rounded-md"
                                    :class="p === pagination.page ? 'bg-cta-light text-cta border-blue-200' : 'hover:bg-slate-50'"
                                    :disabled="isLoading" @click="changePage(p)">
                                    {{ p }}
                                </button>
                            </template>

                            <button class="px-3 py-2 text-sm border rounded-md disabled:opacity-50"
                                :disabled="pagination.page >= totalPages || isLoading"
                                @click="changePage(pagination.page + 1)">
                                Next
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </main>

        <!-- Mobile Overlay -->
        <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
            @click="closeMobileSidebar"></div>

        <!-- Confirm Delete Modal -->
        <ConfirmModal :show="showDelete" :title="`ลบเส้นทาง${deletingRoute?.id ? ' : ' + deletingRoute.id : ''}`"
            message="การลบนี้เป็นการลบถาวร ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?"
            confirmText="ลบถาวร" cancelText="ยกเลิก" variant="danger" @confirm="confirmDelete" @cancel="cancelDelete" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'

dayjs.locale('th')
dayjs.extend(buddhistEra)

definePageMeta({ middleware: ['admin-auth'] })

const { toast } = useToast()

const isLoading = ref(false)
const loadError = ref('')
const routes = ref([])

const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
})

const filters = reactive({
    q: '',
    startName: '', // สำคัญ: ใช้ key name ของ startLocation
    endName: '',   // สำคัญ: ใช้ key name ของ endLocation
    status: '',
    departureFrom: '',
    departureTo: '',
    sort: '',
})

const totalPages = computed(() => Math.max(1, pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 20))))

const pageButtons = computed(() => {
    const total = totalPages.value
    const current = pagination.page
    if (!total || total < 1) return []
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    const set = new Set([1, total, current])
    if (current - 1 > 1) set.add(current - 1)
    if (current + 1 < total) set.add(current + 1)
    const pages = Array.from(set).sort((a, b) => a - b)
    const out = []
    for (let i = 0; i < pages.length; i++) {
        if (i > 0 && pages[i] - pages[i - 1] > 1) out.push('…')
        out.push(pages[i])
    }
    return out
})

function statusBadge(s) {
    if (s === 'AVAILABLE') return 'bg-green-100 text-green-700'
    if (s === 'FULL') return 'bg-slate-200 text-primary'
    if (s === 'CANCELLED') return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-primary'
}

function formatDate(iso) {
    if (!iso) return '-'
    return dayjs(iso).format('D MMMM BBBB HH:mm')
}

function formatKm(meters) {
    if (!meters && meters !== 0) return '-'
    const km = meters / 1000
    return `${km.toFixed(km < 10 ? 1 : 0)} กม.`
}

function formatDuration(sec) {
    if (!sec && sec !== 0) return '-'
    const h = Math.floor(sec / 3600)
    const m = Math.round((sec % 3600) / 60)
    return h ? `${h} ชม. ${m} นาที` : `${m} นาที`
}

function parseSort(s) {
    const [by, order] = (s || '').split(':')
    if (!by || !['asc', 'desc'].includes(order)) return { sortBy: undefined, sortOrder: undefined }
    return { sortBy: by, sortOrder: order }
}

async function fetchRoutes(page = 1) {
    isLoading.value = true
    loadError.value = ''
    try {
        const config = useRuntimeConfig()
        const token = useCookie('token').value || (process.client ? localStorage.getItem('token') : '')

        const { sortBy, sortOrder } = parseSort(filters.sort)

        const res = await $fetch('/routes/admin', {
            baseURL: config.public.apiBase,
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            query: {
                page,
                limit: pagination.limit,
                q: filters.q || undefined,
                startName: filters.startName || undefined, // << ใช้ key name
                endName: filters.endName || undefined,     // << ใช้ key name
                status: filters.status || undefined,
                dateFrom: filters.departureFrom || undefined,
                dateTo: filters.departureTo || undefined,
                sortBy,
                sortOrder,
            },
            credentials: 'include',
        })

        const list = res?.data || res?.items || []
        const p = res?.pagination || {}
        routes.value = list
        pagination.page = Number(p.page ?? page)
        pagination.limit = Number(p.limit ?? pagination.limit)
        pagination.total = Number(p.total ?? list.length)
        pagination.totalPages = Number(p.totalPages ?? Math.ceil(pagination.total / pagination.limit))
    } catch (err) {
        console.error(err)
        loadError.value = err?.data?.message || 'ไม่สามารถโหลดข้อมูลได้'
        toast.error('เกิดข้อผิดพลาด', loadError.value)
        routes.value = []
    } finally {
        isLoading.value = false
    }
}

function changePage(next) { if (next < 1 || next > totalPages.value) return; fetchRoutes(next) }
function applyFilters() { pagination.page = 1; fetchRoutes(1) }
function clearFilters() {
    filters.q = ''
    filters.startName = ''
    filters.endName = ''
    filters.status = ''
    filters.departureFrom = ''
    filters.departureTo = ''
    filters.sort = ''
    pagination.page = 1
    fetchRoutes(1)
}

function onCreateRoute() { navigateTo('/admin/routes/create').catch(() => { }) }
function onEditRoute(r) { navigateTo(`/admin/routes/${r.id}/edit`).catch(() => { }) }
function onViewRoute(r) { navigateTo(`/admin/routes/${r.id}`).catch(() => { }) }

/* ---------- Delete with Confirm Modal ---------- */
const showDelete = ref(false)
const deletingRoute = ref(null)
function askDelete(r) { deletingRoute.value = r; showDelete.value = true }
function cancelDelete() { showDelete.value = false; deletingRoute.value = null }
async function confirmDelete() {
    if (!deletingRoute.value) return
    const r = deletingRoute.value
    try {
        await deleteRoute(r.id)
        toast.success('ลบเส้นทางเรียบร้อย', `${r.startLocation?.name || '-'} → ${r.endLocation?.name || '-'} ถูกลบถาวรแล้ว`)
        cancelDelete()
        fetchRoutes(Math.min(pagination.page, totalPages.value))
    } catch (err) {
        console.error(err)
        const msg = err?.message || err?.data?.message || 'ลบไม่สำเร็จ'
        toast.error('ลบไม่สำเร็จ', msg)
    }
}
async function deleteRoute(id) {
    const config = useRuntimeConfig()
    const token = useCookie('token').value || (process.client ? localStorage.getItem('token') : '')
    const res = await fetch(`${config.public.apiBase}/routes/admin/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
    })
    let body
    try { body = await res.json() } catch {
        const text = await res.text(); const err = new Error(text || 'Unexpected response from server'); err.status = res.status; throw err
    }
    if (!res.ok) { const err = new Error(body?.message || `Request failed with status ${res.status}`); err.status = res.status; err.payload = body; throw err }
    return body
}
/* --------------------------------------------- */

useHead({
    title: 'TailAdmin Dashboard',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('overlay')
    if (!sidebar || !overlay) return
    sidebar.classList.remove('mobile-open')
    overlay.classList.add('hidden')
}

function defineGlobalScripts() {
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const toggleIcon = document.getElementById('toggle-icon');
        if (!sidebar || !mainContent || !toggleIcon) return;
        sidebar.classList.toggle('collapsed');
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginLeft = '80px';
            toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
        } else {
            mainContent.style.marginLeft = '280px';
            toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
        }
    }
    window.toggleMobileSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if (!sidebar || !overlay) return;
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('hidden');
    }
    window.toggleSubmenu = function (menuId) {
        const menu = document.getElementById(menuId);
        const icon = document.getElementById(menuId + '-icon');
        if (!menu || !icon) return;
        menu.classList.toggle('hidden');
        if (menu.classList.contains('hidden')) { icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); }
        else { icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
    }
    window.__adminResizeHandler__ = function () {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const overlay = document.getElementById('overlay');
        if (!sidebar || !mainContent || !overlay) return;
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.add('hidden');
            if (sidebar.classList.contains('collapsed')) { mainContent.style.marginLeft = '80px'; }
            else { mainContent.style.marginLeft = '280px'; }
        } else {
            mainContent.style.marginLeft = '0';
        }
    }
    window.addEventListener('resize', window.__adminResizeHandler__)
}
function cleanupGlobalScripts() {
    window.removeEventListener('resize', window.__adminResizeHandler__ || (() => { }))
    delete window.toggleSidebar
    delete window.toggleMobileSidebar
    delete window.closeMobileSidebar
    delete window.toggleSubmenu
    delete window.__adminResizeHandler__
}

onMounted(() => {
    defineGlobalScripts()
    if (typeof window.__adminResizeHandler__ === 'function') window.__adminResizeHandler__()
    fetchRoutes(1)
})

onUnmounted(() => { cleanupGlobalScripts() })
</script>

<style>
.sidebar {
    transition: width 0.3s ease;
}

.sidebar.collapsed {
    width: 80px;
}

.sidebar:not(.collapsed) {
    width: 280px;
}

.sidebar-item {
    transition: all 0.3s ease;
}

.sidebar-item:hover {
    background-color: rgba(59, 130, 246, 0.05);
}

.sidebar.collapsed .sidebar-text {
    display: none;
}

.sidebar.collapsed .sidebar-item {
    justify-content: center;
}

.main-content {
    transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        z-index: 1000;
        transform: translateX(-100%);
    }

    .sidebar.mobile-open {
        transform: translateX(0);
    }

    .main-content {
        margin-left: 0 !important;
    }
}
</style>
