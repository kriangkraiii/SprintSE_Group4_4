<template>
    <div>
        <AdminHeader />
        <AdminSidebar />

        <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-8xl">
                <!-- Title -->
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-semibold text-primary">Blacklist Management</h1>
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-600">
                            <i class="mr-1 fas fa-shield-halved"></i>PDPA ม.22 — SHA-256 Hash Only
                        </span>
                    </div>
                    <button @click="showAddModal = true"
                        class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm cursor-pointer hover:bg-red-700 transition-colors">
                        <i class="fa-solid fa-plus"></i>
                        <span>เพิ่ม Blacklist</span>
                    </button>
                </div>

                <!-- Info Banner -->
                <div class="flex items-start gap-3 px-4 py-3 mb-4 border rounded-lg bg-amber-50 border-amber-200">
                    <i class="mt-0.5 text-amber-500 fas fa-circle-info"></i>
                    <div class="text-sm text-amber-700">
                        <strong>หลักการ Data Minimization (PDPA ม.22):</strong>
                        ข้อมูลเลขบัตรประชาชนจะถูก Hash ด้วย SHA-256 ก่อนจัดเก็บ ระบบไม่ได้เก็บเลข 13 หลักดิบ
                        ไม่สามารถย้อนกลับ (reverse) เป็นเลขบัตรประชาชนได้
                    </div>
                </div>

                <!-- Filters -->
                <div class="mb-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div class="grid grid-cols-1 gap-3 px-4 py-4 sm:px-6 lg:grid-cols-4">
                        <div>
                            <label class="block mb-1 text-xs font-medium text-slate-500">ตั้งแต่วันที่</label>
                            <input v-model="filters.createdFrom" type="datetime-local"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta" />
                        </div>
                        <div>
                            <label class="block mb-1 text-xs font-medium text-slate-500">ถึงวันที่</label>
                            <input v-model="filters.createdTo" type="datetime-local"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta" />
                        </div>
                        <div>
                            <label class="block mb-1 text-xs font-medium text-slate-500">เรียงตาม</label>
                            <select v-model="filters.sortOrder"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta">
                                <option value="desc">ใหม่สุดก่อน</option>
                                <option value="asc">เก่าสุดก่อน</option>
                            </select>
                        </div>
                        <div class="flex items-end gap-2">
                            <button @click="applyFilters"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 shadow-sm transition-colors">
                                <i class="mr-1 fas fa-search"></i> ค้นหา
                            </button>
                            <button @click="clearFilters"
                                class="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 shadow-sm transition-colors">
                                ล้าง
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div v-if="isLoading" class="flex items-center justify-center py-16">
                        <svg class="w-8 h-8 animate-spin text-cta" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>

                    <table v-else class="w-full text-sm text-left">
                        <thead class="text-xs uppercase bg-slate-50 text-slate-500">
                            <tr>
                                <th class="px-4 py-3">ID</th>
                                <th class="px-4 py-3">National ID Hash (SHA-256)</th>
                                <th class="px-4 py-3">เหตุผล</th>
                                <th class="px-4 py-3">เพิ่มโดย (Admin ID)</th>
                                <th class="px-4 py-3">วันที่เพิ่ม</th>
                                <th class="px-4 py-3 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="entries.length === 0">
                                <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                                    ไม่พบรายการ Blacklist
                                </td>
                            </tr>
                            <tr v-for="entry in entries" :key="entry.id"
                                class="border-t border-slate-100 hover:bg-slate-50">
                                <td class="px-4 py-3 text-slate-400">{{ entry.id }}</td>
                                <td class="px-4 py-3">
                                    <code
                                        class="px-2 py-1 text-xs break-all bg-slate-100 rounded">{{ entry.nationalIdHash }}</code>
                                </td>
                                <td class="px-4 py-3 max-w-xs">{{ entry.reason || '—' }}</td>
                                <td class="px-4 py-3 font-mono text-xs">{{ entry.createdByAdminId }}</td>
                                <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(entry.createdAt) }}</td>
                                <td class="px-4 py-3 text-center">
                                    <button @click="confirmRemove(entry)"
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md cursor-pointer hover:bg-red-100 hover:border-red-300 transition-colors" title="ลบออกจาก Blacklist">
                                        <i class="fas fa-trash-can"></i>
                                        <span>ลบ</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="pagination.totalPages > 1"
                    class="flex items-center justify-between px-4 py-3 mt-4 bg-white border border-slate-200 rounded-lg">
                    <div class="text-sm text-slate-500">
                        แสดง {{ (pagination.page - 1) * pagination.limit + 1 }}–{{
                            Math.min(pagination.page * pagination.limit, pagination.total) }}
                        จาก {{ pagination.total }} รายการ
                    </div>
                    <div class="flex gap-1">
                        <button @click="goToPage(pagination.page - 1)" :disabled="pagination.page <= 1"
                            class="px-3 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button v-for="p in visiblePages" :key="p" @click="goToPage(p)"
                            :class="p === pagination.page ? 'bg-cta text-white' : 'border border-slate-200 hover:bg-slate-50'"
                            class="px-3 py-1 rounded-md text-sm">
                            {{ p }}
                        </button>
                        <button @click="goToPage(pagination.page + 1)"
                            :disabled="pagination.page >= pagination.totalPages"
                            class="px-3 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Add Blacklist Modal -->
        <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            @click.self="showAddModal = false">
            <div class="w-full max-w-md p-6 mx-4 bg-white rounded-xl shadow-xl">
                <h2 class="mb-1 text-lg font-semibold text-primary">เพิ่ม Blacklist</h2>
                <p class="mb-4 text-sm text-slate-500">เลขบัตรประชาชนจะถูก Hash ด้วย SHA-256 ก่อนจัดเก็บ</p>

                <div class="space-y-4">
                    <div>
                        <label class="block mb-1.5 text-sm font-medium text-primary">เลขบัตรประชาชน 13 หลัก *</label>
                        <input v-model="addForm.nationalId" type="text" maxlength="13" placeholder="กรอกเลข 13 หลัก"
                            class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta" />
                    </div>
                    <div>
                        <label class="block mb-1.5 text-sm font-medium text-primary">เหตุผล</label>
                        <textarea v-model="addForm.reason" rows="3" placeholder="ระบุเหตุผล (ไม่บังคับ)"
                            class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta"></textarea>
                    </div>
                </div>

                <div v-if="addError" class="mt-3 text-sm text-red-600">{{ addError }}</div>

                <div class="flex justify-end gap-3 mt-6">
                    <button @click="showAddModal = false"
                        class="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50">
                        ยกเลิก
                    </button>
                    <button @click="handleAdd" :disabled="addLoading"
                        class="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 shadow-sm transition-colors">
                        {{ addLoading ? 'กำลังเพิ่ม...' : 'เพิ่ม Blacklist' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Confirm Remove Modal -->
        <ConfirmModal :show="showRemoveConfirm" title="ลบออกจาก Blacklist"
            :message="`ต้องการลบรายการ ID #${removingEntry?.id} ออกจาก Blacklist ใช่หรือไม่?`" confirmText="ลบ"
            confirmClass="bg-red-600 hover:bg-red-700 text-white" @confirm="handleRemove"
            @cancel="showRemoveConfirm = false" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({ middleware: 'admin-auth' })
useHead({
    title: 'Blacklist Management • Admin',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }]
})

const { $api } = useNuxtApp()
const { toast } = useToast()

const isLoading = ref(false)
const entries = ref([])
const pagination = reactive({ page: 1, limit: 20, total: 0, totalPages: 0 })

const filters = reactive({ createdFrom: '', createdTo: '', sortOrder: 'desc' })

// Add modal
const showAddModal = ref(false)
const addForm = reactive({ nationalId: '', reason: '' })
const addError = ref('')
const addLoading = ref(false)

// Remove modal
const showRemoveConfirm = ref(false)
const removingEntry = ref(null)

const fetchEntries = async () => {
    isLoading.value = true
    try {
        const params = new URLSearchParams()
        params.set('page', pagination.page)
        params.set('limit', pagination.limit)
        params.set('sortOrder', filters.sortOrder)
        if (filters.createdFrom) params.set('createdFrom', new Date(filters.createdFrom).toISOString())
        if (filters.createdTo) params.set('createdTo', new Date(filters.createdTo).toISOString())

        const res = await $api(`/blacklist?${params.toString()}`)
        entries.value = res.data || res
        if (res.pagination) Object.assign(pagination, res.pagination)
    } catch (err) {
        console.error('Failed to fetch blacklist:', err)
    } finally {
        isLoading.value = false
    }
}

const applyFilters = () => { pagination.page = 1; fetchEntries() }
const clearFilters = () => {
    Object.assign(filters, { createdFrom: '', createdTo: '', sortOrder: 'desc' })
    applyFilters()
}

const goToPage = (p) => {
    if (p < 1 || p > pagination.totalPages) return
    pagination.page = p
    fetchEntries()
}

const visiblePages = computed(() => {
    const total = pagination.totalPages
    const current = pagination.page
    const pages = []
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i)
    return pages
})

const handleAdd = async () => {
    addError.value = ''
    if (!/^\d{13}$/.test(addForm.nationalId)) {
        addError.value = 'กรุณากรอกเลขบัตรประชาชน 13 หลัก (ตัวเลขเท่านั้น)'
        return
    }
    addLoading.value = true
    try {
        await $api('/blacklist', {
            method: 'POST',
            body: { nationalId: addForm.nationalId, reason: addForm.reason || undefined },
        })
        toast.success('สำเร็จ', 'เพิ่ม National ID เข้า Blacklist แล้ว (เก็บเป็น SHA-256 Hash)')
        showAddModal.value = false
        addForm.nationalId = ''
        addForm.reason = ''
        fetchEntries()
    } catch (err) {
        addError.value = err?.data?.message || err?.message || 'เกิดข้อผิดพลาด'
    } finally {
        addLoading.value = false
    }
}

const confirmRemove = (entry) => {
    removingEntry.value = entry
    showRemoveConfirm.value = true
}

const handleRemove = async () => {
    try {
        await $api(`/blacklist/${removingEntry.value.id}`, { method: 'DELETE' })
        toast.success('สำเร็จ', 'ลบรายการออกจาก Blacklist แล้ว')
        showRemoveConfirm.value = false
        removingEntry.value = null
        fetchEntries()
    } catch (err) {
        toast.error('เกิดข้อผิดพลาด', err?.data?.message || 'ไม่สามารถลบรายการได้')
    }
}

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm') : ''

onMounted(fetchEntries)
</script>
