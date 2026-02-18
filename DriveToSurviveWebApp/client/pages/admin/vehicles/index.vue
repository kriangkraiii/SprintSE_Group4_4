<template>
    <div>
        <AdminHeader />
        <AdminSidebar />

        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-8xl">
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-semibold text-primary">Vehicle Management</h1>
                    </div>

                    <div class="flex items-center gap-2">
                        <input v-model.trim="filters.q" @keyup.enter="applyFilters" type="text"
                            placeholder="ค้นหา : รุ่น, ป้ายทะเบียน, เจ้าของ..."
                            class="max-w-full px-3 py-2 border border-slate-200 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-cta" />
                        <button @click="applyFilters"
                            class="px-4 py-2 text-white bg-cta rounded-md cursor-pointer hover:bg-cta-hover">
                            ค้นหา
                        </button>
                    </div>
                </div>

                <div class="mb-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div class="grid grid-cols-1 gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[repeat(24,minmax(0,1fr))]">

                        <!-- vehicleType: เปลี่ยนเป็น dropdown -->
                        <div class="lg:col-span-4">
                            <label class="block mb-1 text-xs font-medium text-slate-500">ประเภทยานพาหนะ</label>
                            <select v-model="filters.vehicleType"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta">
                                <option value="">ทั้งหมด</option>
                                <option value="SEDAN">Sedan</option>
                                <option value="SUV">SUV</option>
                                <option value="Hatchback">Hatchback</option>
                                <option value="VAN">Van</option>
                                <option value="Pickup">Pickup</option>
                            </select>
                        </div>

                        <div class="lg:col-span-4">
                            <label class="block mb-1 text-xs font-medium text-slate-500">สี</label>
                            <input v-model.trim="filters.color" type="text" placeholder="เช่น ขาว, ดำ"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta" />
                        </div>

                        <div class="lg:col-span-4">
                            <label class="block mb-1 text-xs font-medium text-slate-500">ค่าเริ่มต้น</label>
                            <select v-model="filters.isDefault"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta">
                                <option value="">ทั้งหมด</option>
                                <option value="true">ใช่</option>
                                <option value="false">ไม่ใช่</option>
                            </select>
                        </div>

                        <div class="lg:col-span-4">
                            <label class="block mb-1 text-xs font-medium text-slate-500">เรียงตาม</label>
                            <select v-model="filters.sort"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-cta">
                                <option value="">(ค่าเริ่มต้น)</option>
                                <option value="createdAt:desc">สร้างล่าสุด</option>
                                <option value="createdAt:asc">สร้างเก่าสุด</option>
                            </select>
                        </div>

                        <div class="flex items-end justify-end gap-2 mt-1 lg:col-span-8 lg:mt-0">
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

                <div class="bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div class="flex items-center justify-between px-4 py-4 border-b border-slate-100 sm:px-6">
                        <div class="text-sm text-slate-500">
                            หน้าที่ {{ pagination.page }} / {{ totalPages }} • ทั้งหมด {{ pagination.total }} คัน
                        </div>
                    </div>

                    <div v-if="isLoading" class="p-8 text-center text-slate-400">
                        <i class="text-3xl fa-solid fa-spinner fa-spin"></i>
                        <p class="mt-2">กำลังโหลดข้อมูล...</p>
                    </div>
                    <div v-else-if="loadError" class="p-8 text-center text-red-600">
                        {{ loadError }}
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-100">
                            <thead class="bg-slate-50">
                                <tr>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">เจ้าของ</th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">จำนวนรถ</th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">ค่าเริ่มต้น</th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">ล่าสุด</th>
                                    <th class="px-4 py-3 text-xs font-medium text-left text-slate-400 uppercase">การกระทำ</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-slate-100">
                                <template v-for="group in groupedOwners" :key="group.ownerKey">
                                    <tr class="transition-colors hover:bg-slate-50">
                                        <td class="px-4 py-3 text-primary">
                                            <div class="font-medium">{{ group.ownerName }}</div>
                                            <div class="text-xs text-slate-400">{{ group.ownerEmail || '-' }}</div>
                                        </td>
                                        <td class="px-4 py-3 text-primary">
                                            {{ group.vehicles.length }} คัน
                                        </td>
                                        <td class="px-4 py-3 text-primary">
                                            {{ group.defaultCount }} คัน
                                        </td>
                                        <td class="px-4 py-3 text-primary">
                                            <div class="text-sm">{{ formatDate(group.latestUpdatedAt, true) }}</div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <button @click="toggleOwner(group.ownerKey)"
                                                class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-md border-slate-200 text-primary hover:bg-slate-50">
                                                <i class="fa-solid" :class="isOwnerExpanded(group.ownerKey) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                                                {{ isOwnerExpanded(group.ownerKey) ? 'ซ่อนรถ' : 'แสดงรถทั้งหมด' }}
                                            </button>
                                        </td>
                                    </tr>

                                    <tr v-if="isOwnerExpanded(group.ownerKey)">
                                        <td colspan="5" class="px-4 py-3 bg-slate-50/60">
                                            <div class="grid grid-cols-1 gap-3">
                                                <div v-for="v in group.vehicles" :key="v.id"
                                                    class="flex flex-col justify-between gap-3 p-3 bg-white border rounded-lg sm:flex-row border-slate-200">
                                                    <div class="flex items-center gap-3 min-w-0">
                                                        <img :src="v.photos?.[0] || 'https://via.placeholder.com/150x100?text=No+Image'"
                                                            class="object-cover w-20 h-12 rounded-md" alt="Vehicle Photo" />
                                                        <div class="min-w-0">
                                                            <div class="font-medium text-primary truncate">{{ v.vehicleModel }}</div>
                                                            <div class="text-xs text-slate-400 truncate">
                                                                {{ v.vehicleType }} • {{ v.color }} • {{ v.licensePlate }}
                                                            </div>
                                                            <div class="mt-1 text-xs text-slate-400">อัปเดต {{ formatDate(v.updatedAt, true) }}</div>
                                                        </div>
                                                    </div>
                                                    <div class="flex items-center gap-1 shrink-0">
                                                        <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                                                            :class="v.isDefault ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
                                                            <i class="mr-1 fa-solid fa-circle-check" v-if="v.isDefault"></i>
                                                            {{ v.isDefault ? 'ค่าเริ่มต้น' : 'ปกติ' }}
                                                        </span>
                                                        <button @click="onViewVehicle(v)"
                                                            class="p-2 text-slate-400 transition-colors cursor-pointer hover:text-emerald-600"
                                                            title="ดูรายละเอียด">
                                                            <i class="text-lg fa-regular fa-eye"></i>
                                                        </button>
                                                        <button @click="onEditVehicle(v)"
                                                            class="p-2 text-slate-400 transition-colors cursor-pointer hover:text-cta"
                                                            title="แก้ไข">
                                                            <i class="text-lg fa-regular fa-pen-to-square"></i>
                                                        </button>
                                                        <button @click="askDelete(v)"
                                                            class="p-2 text-slate-400 transition-colors cursor-pointer hover:text-red-600" title="ลบ">
                                                            <i class="text-lg fa-regular fa-trash-can"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </template>

                                <tr v-if="!isLoading && groupedOwners.length === 0">
                                    <td colspan="5" class="px-4 py-10 text-center text-slate-400">ไม่พบข้อมูลยานพาหนะที่ตรงกับเงื่อนไข</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

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

        <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
            @click="closeMobileSidebar"></div>

        <ConfirmModal :show="showDelete" :title="`ลบยานพาหนะ : ${deletingVehicle?.licensePlate || ''}`"
            message="การลบนี้เป็นการลบถาวร ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?"
            confirmText="ลบถาวร" cancelText="ยกเลิก" variant="danger" @confirm="confirmDelete" @cancel="cancelDelete" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'

dayjs.locale('th')

definePageMeta({ middleware: ['admin-auth'] })
useHead({
    title: 'Vehicle Management • Admin',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }]
})

const { toast } = useToast()

const isLoading = ref(true)
const loadError = ref('')
const vehicles = ref([])
const expandedOwnerKeys = ref([])

const pagination = reactive({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
})

const filters = reactive({
    q: '',
    vehicleType: '',  // SEDAN | SUV | PICKUP | VAN | MOTORCYCLE | ''
    color: '',
    isDefault: '',    // '', 'true', 'false'
    sort: 'createdAt:desc',
})

const totalPages = computed(() =>
    Math.max(1, pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 10)))
)

const groupedOwners = computed(() => {
    const groupsMap = new Map()

    for (const vehicle of vehicles.value) {
        const ownerKey = vehicle.user?.id || `unknown-${vehicle.id}`
        if (!groupsMap.has(ownerKey)) {
            groupsMap.set(ownerKey, {
                ownerKey,
                ownerName: `${vehicle.user?.firstName || 'ไม่ทราบชื่อ'} ${vehicle.user?.lastName || ''}`.trim(),
                ownerEmail: vehicle.user?.email || '',
                vehicles: [],
                defaultCount: 0,
                latestUpdatedAt: vehicle.updatedAt || vehicle.createdAt,
            })
        }

        const group = groupsMap.get(ownerKey)
        group.vehicles.push(vehicle)
        if (vehicle.isDefault) group.defaultCount += 1

        const groupLatest = new Date(group.latestUpdatedAt || 0).getTime()
        const vehicleLatest = new Date(vehicle.updatedAt || vehicle.createdAt || 0).getTime()
        if (vehicleLatest > groupLatest) group.latestUpdatedAt = vehicle.updatedAt || vehicle.createdAt
    }

    return Array.from(groupsMap.values())
        .sort((a, b) => a.ownerName.localeCompare(b.ownerName, 'th'))
        .map(group => ({
            ...group,
            vehicles: [...group.vehicles].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        }))
})

const pageButtons = computed(() => {
    const total = totalPages.value
    const current = pagination.page
    if (!total || total < 1) return []
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    const set = new Set([1, total, current])
    if (current > 2) set.add(current - 1)
    if (current < total - 1) set.add(current + 1)
    const pages = Array.from(set).sort((a, b) => a - b)
    const out = []
    for (let i = 0; i < pages.length; i++) {
        if (i > 0 && pages[i] - pages[i - 1] > 1) out.push('…')
        out.push(pages[i])
    }
    return out
})

function formatDate(iso, withTime = false) {
  if (!iso) return '-'
  return withTime ? dayjs(iso).format('D MMMM YYYY HH:mm') : dayjs(iso).format('D MMMM YYYY')
}

function parseSort(s) {
    const [by, order] = (s || '').split(':')
    if (!by || !['asc', 'desc'].includes(order)) return { sortBy: 'createdAt', sortOrder: 'desc' }
    return { sortBy: by, sortOrder: order }
}

async function fetchVehicles(page = 1) {
    isLoading.value = true
    loadError.value = ''
    try {
        const config = useRuntimeConfig()
        const token = useCookie('token').value || (process.client ? localStorage.getItem('token') : '')

        const { sortBy, sortOrder } = parseSort(filters.sort)

        // สร้าง query: ส่ง isDefault เฉพาะเมื่อเลือก และคงค่าเป็น 'true'|'false' (string)
        const query = {
            page,
            limit: pagination.limit,
            q: filters.q || undefined,
            vehicleType: filters.vehicleType || undefined,
            color: filters.color || undefined,
            sortBy,
            sortOrder,
        }
        if (filters.isDefault !== '') {
            query.isDefault = filters.isDefault; // keep string to avoid backend truthy check issue
        }

        const res = await $fetch('/vehicles/admin', {
            baseURL: config.public.apiBase,
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            query,
        })

        vehicles.value = res?.data || []
    expandedOwnerKeys.value = []
        const p = res?.pagination || {}
        pagination.page = Number(p.page ?? page)
        pagination.limit = Number(p.limit ?? pagination.limit)
        pagination.total = Number(p.total ?? vehicles.value.length)
        pagination.totalPages = Number(p.totalPages ?? Math.ceil(pagination.total / pagination.limit))
    } catch (err) {
        console.error("Fetch Vehicles Error:", err)
        loadError.value = err?.data?.message || 'ไม่สามารถโหลดข้อมูลยานพาหนะได้'
        toast.error('เกิดข้อผิดพลาด', loadError.value)
        vehicles.value = []
    } finally {
        isLoading.value = false
    }
}

function changePage(next) {
    if (next < 1 || next > totalPages.value) return
    fetchVehicles(next)
}

function applyFilters() {
    pagination.page = 1
    fetchVehicles(1)
}

function clearFilters() {
    filters.q = ''
    filters.vehicleType = ''
    filters.color = ''
    filters.isDefault = ''
    filters.sort = 'createdAt:desc'
    pagination.page = 1
    fetchVehicles(1)
}

function isOwnerExpanded(ownerKey) {
    return expandedOwnerKeys.value.includes(ownerKey)
}

function toggleOwner(ownerKey) {
    if (isOwnerExpanded(ownerKey)) {
        expandedOwnerKeys.value = expandedOwnerKeys.value.filter(key => key !== ownerKey)
        return
    }
    expandedOwnerKeys.value.push(ownerKey)
}

/* ---------- Delete with Confirm Modal ---------- */
const showDelete = ref(false)
const deletingVehicle = ref(null)

function askDelete(v) {
    deletingVehicle.value = v
    showDelete.value = true
}

function cancelDelete() {
    showDelete.value = false
    deletingVehicle.value = null
}

async function confirmDelete() {
    if (!deletingVehicle.value) return
    const vehicle = deletingVehicle.value
    try {
        const config = useRuntimeConfig()
        const token = useCookie('token').value || (process.client ? localStorage.getItem('token') : '')
        await $fetch(`/vehicles/admin/${vehicle.id}`, {
            baseURL: config.public.apiBase,
            method: 'DELETE',
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })

        toast.success('ลบยานพาหนะเรียบร้อย', `ยานพาหนะ "${vehicle.licensePlate}" ถูกลบถาวรแล้ว`)
        cancelDelete()
        fetchVehicles(Math.min(pagination.page, totalPages.value))
    } catch (err) {
        console.error("Delete Vehicle Error:", err)
        const msg = err?.data?.message || 'ลบยานพาหนะไม่สำเร็จ'
        toast.error('ลบไม่สำเร็จ', msg)
    }
}
/* --------------------------------------------- */


/* ---------- Navigation ---------- */
function onViewVehicle(v) {
    navigateTo(`/admin/vehicles/${v.id}`).catch(() => { })
}
function onEditVehicle(v) {
    navigateTo(`/admin/vehicles/${v.id}/edit`).catch(() => { })
}
/* --------------------------------- */


/* ---------- Global Sidebar Scripts (Required for layout) ---------- */
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
        if (menu.classList.contains('hidden')) {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        } else {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        }
    }
    window.__adminResizeHandler__ = function () {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const overlay = document.getElementById('overlay');
        if (!sidebar || !mainContent || !overlay) return;
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.add('hidden');
            if (sidebar.classList.contains('collapsed')) {
                mainContent.style.marginLeft = '80px';
            } else {
                mainContent.style.marginLeft = '280px';
            }
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
    delete window.toggleSubmenu
    delete window.__adminResizeHandler__
}

onMounted(() => {
    defineGlobalScripts()
    if (typeof window.__adminResizeHandler__ === 'function') window.__adminResizeHandler__();
    fetchVehicles(1)
})

onUnmounted(() => {
    cleanupGlobalScripts()
})
/* ----------------------------------------------------------------- */

</script>

<style>
/* Global styles for admin layout, same as users/index.vue */
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
@media (max-width: 1024px) {
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
