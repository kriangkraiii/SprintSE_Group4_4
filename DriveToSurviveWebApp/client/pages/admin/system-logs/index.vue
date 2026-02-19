<template>
    <div>
        <AdminHeader />
        <AdminSidebar />

        <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-8xl">
                <!-- Title -->
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-semibold text-primary">System Logs</h1>
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-600">
                            <i class="mr-1 fas fa-lock"></i>Immutable — พ.ร.บ.คอมพิวเตอร์ ม.26
                        </span>
                    </div>
                    <div class="text-sm text-slate-500">
                        ข้อมูลจราจรคอมพิวเตอร์ เก็บรักษาไม่น้อยกว่า 90 วัน
                    </div>
                </div>

                <!-- Filters -->
                <div class="mb-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div class="grid grid-cols-1 gap-3 px-4 py-4 sm:px-6 lg:grid-cols-7">
                        <div>
                            <label class="block mb-1 text-xs font-medium text-slate-500">User ID</label>
                            <input v-model="filters.userId" type="text" placeholder="cuid..."
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta" />
                        </div>
                        <div>
                            <label class="block mb-1 text-xs font-medium text-slate-500">IP Address</label>
                            <input v-model="filters.ipAddress" type="text" placeholder="192.168.x.x"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta" />
                        </div>
                        <div>
                            <label class="block mb-1 text-xs font-medium text-slate-500">Action</label>
                            <select v-model="filters.action"
                                class="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cta">
                                <option value="">ทั้งหมด</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                        </div>
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
                        <div class="flex items-end">
                            <label class="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer border-slate-200 text-slate-700">
                                <input v-model="filters.onlyOlderThanRetention" type="checkbox" class="rounded text-cta focus:ring-cta">
                                เฉพาะ Log ที่เกิน 90 วัน (ลบได้)
                            </label>
                        </div>
                        <div class="flex items-end gap-2">
                            <button @click="applyFilters"
                                class="px-4 py-2 text-white bg-cta rounded-md cursor-pointer hover:bg-cta-hover">
                                <i class="mr-1 fas fa-search"></i> ค้นหา
                            </button>
                            <button @click="clearFilters"
                                class="px-3 py-2 text-primary border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                                ล้าง
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Bulk Actions -->
                <div class="flex flex-col gap-3 px-4 py-3 mb-4 bg-white border rounded-lg border-slate-200 sm:flex-row sm:items-center sm:justify-between">
                    <div class="inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            :checked="allDeletableSelected"
                            :disabled="deletableLogs.length === 0 || isLoading || isDeleting"
                            class="rounded text-cta focus:ring-cta"
                            @change="toggleSelectAll(($event.target).checked)">
                        <span>เลือกทั้งหมด (เฉพาะ log ที่เกิน 90 วันในหน้านี้)</span>
                    </div>
                    <button
                        @click="openBulkDeleteConfirm"
                        :disabled="selectedLogIds.length === 0 || isDeleting"
                        class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700">
                        <i class="fas fa-trash-can"></i>
                        <span>{{ isDeleting ? 'กำลังลบ...' : `ลบที่เลือก (${selectedLogIds.length})` }}</span>
                    </button>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                    <!-- Loading -->
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
                                <th class="px-4 py-3 text-center">เลือก</th>
                                <th class="px-4 py-3">ID</th>
                                <th class="px-4 py-3">Timestamp</th>
                                <th class="px-4 py-3">User ID</th>
                                <th class="px-4 py-3">IP Address</th>
                                <th class="px-4 py-3">Action</th>
                                <th class="px-4 py-3">Resource</th>
                                <th class="px-4 py-3">User Agent</th>
                                <th class="px-4 py-3 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="logs.length === 0">
                                <td colspan="9" class="px-4 py-12 text-center text-slate-400">
                                    ไม่พบข้อมูล Log
                                </td>
                            </tr>
                            <tr v-for="log in logs" :key="log.id"
                                class="border-t border-slate-100 hover:bg-slate-50">
                                <td class="px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        :checked="isSelected(log.id)"
                                        :disabled="!isLogOlderThanRetention(log.createdAt) || isDeleting"
                                        class="rounded text-cta focus:ring-cta"
                                        @change="toggleLogSelection(log.id, ($event.target).checked)">
                                </td>
                                <td class="px-4 py-3 font-mono text-xs text-slate-400">{{ log.id }}</td>
                                <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
                                <td class="px-4 py-3">
                                    <span v-if="log.userId" class="font-mono text-xs">{{ log.userId }}</span>
                                    <span v-else class="text-slate-300">—</span>
                                </td>
                                <td class="px-4 py-3 font-mono text-xs">{{ log.ipAddress }}</td>
                                <td class="px-4 py-3">
                                    <span :class="actionBadge(log.action)"
                                        class="px-2 py-0.5 text-xs font-semibold rounded-full">
                                        {{ log.action }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 max-w-xs truncate" :title="log.resource">{{ log.resource }}</td>
                                <td class="px-4 py-3 max-w-[200px] truncate text-xs text-slate-400"
                                    :title="log.userAgent">
                                    {{ log.userAgent || '—' }}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <button
                                        @click="openSingleDeleteConfirm(log)"
                                        :disabled="!isLogOlderThanRetention(log.createdAt) || isDeleting"
                                        :title="retentionHint(log.createdAt)"
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors"
                                        :class="isLogOlderThanRetention(log.createdAt)
                                            ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 cursor-pointer'
                                            : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'">
                                        <i class="fas fa-trash-can"></i>
                                        <span>{{ deletingLogIds.includes(log.id) ? 'กำลังลบ...' : 'ลบ' }}</span>
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

        <ConfirmModal
            :show="showDeleteConfirm"
            title="ลบ System Log"
            :message="deleteConfirmMessage"
            confirmText="ลบ"
            confirmClass="bg-red-600 hover:bg-red-700 text-white"
            @confirm="handleDeleteLogs"
            @cancel="cancelDelete" />
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

definePageMeta({ middleware: 'admin-auth', layout: 'admin' })

const { $api } = useNuxtApp()
const { toast } = useToast()
const retentionDays = 90

const isLoading = ref(false)
const logs = ref([])
const pagination = reactive({ page: 1, limit: 50, total: 0, totalPages: 0 })
const showDeleteConfirm = ref(false)
const pendingDeleteIds = ref([])
const selectedLogIds = ref([])
const deletingLogIds = ref([])
const isDeleting = ref(false)

const filters = reactive({
    userId: '',
    ipAddress: '',
    action: '',
    createdFrom: '',
    createdTo: '',
    onlyOlderThanRetention: false,
})

const fetchLogs = async () => {
    isLoading.value = true
    try {
        const params = new URLSearchParams()
        params.set('page', pagination.page)
        params.set('limit', pagination.limit)
        if (filters.userId) params.set('userId', filters.userId)
        if (filters.ipAddress) params.set('ipAddress', filters.ipAddress)
        if (filters.action) params.set('action', filters.action)
        if (filters.createdFrom) params.set('createdFrom', new Date(filters.createdFrom).toISOString())

        const ninetyDaysCutoffIso = dayjs().subtract(retentionDays, 'day').toISOString()
        let effectiveCreatedTo = filters.createdTo ? new Date(filters.createdTo).toISOString() : ''

        if (filters.onlyOlderThanRetention) {
            effectiveCreatedTo = effectiveCreatedTo
                ? (new Date(effectiveCreatedTo) < new Date(ninetyDaysCutoffIso) ? effectiveCreatedTo : ninetyDaysCutoffIso)
                : ninetyDaysCutoffIso
        }

        if (effectiveCreatedTo) params.set('createdTo', effectiveCreatedTo)

        const res = await $api(`/system-logs?${params.toString()}`)
        logs.value = res.data || res
        selectedLogIds.value = []
        if (res.pagination) Object.assign(pagination, res.pagination)
    } catch (err) {
        console.error('Failed to fetch logs:', err)
    } finally {
        isLoading.value = false
    }
}

const applyFilters = () => {
    pagination.page = 1
    fetchLogs()
}

const clearFilters = () => {
    Object.assign(filters, {
        userId: '',
        ipAddress: '',
        action: '',
        createdFrom: '',
        createdTo: '',
        onlyOlderThanRetention: false,
    })
    selectedLogIds.value = []
    applyFilters()
}

const goToPage = (p) => {
    if (p < 1 || p > pagination.totalPages) return
    pagination.page = p
    fetchLogs()
}

const visiblePages = computed(() => {
    const total = pagination.totalPages
    const current = pagination.page
    const pages = []
    const start = Math.max(1, current - 2)
    const end = Math.min(total, current + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
})

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm:ss') : ''

const actionBadge = (action) => {
    const map = {
        GET: 'bg-blue-50 text-blue-600',
        POST: 'bg-green-50 text-green-600',
        PUT: 'bg-amber-50 text-amber-600',
        PATCH: 'bg-purple-50 text-purple-600',
        DELETE: 'bg-red-50 text-red-600',
    }
    return map[action] || 'bg-slate-100 text-slate-500'
}

const deletableLogs = computed(() => logs.value.filter(log => isLogOlderThanRetention(log.createdAt)))

const allDeletableSelected = computed(() => {
    if (deletableLogs.value.length === 0) return false
    return deletableLogs.value.every(log => selectedLogIds.value.includes(log.id))
})

const isSelected = (id) => selectedLogIds.value.includes(id)

const toggleLogSelection = (id, checked) => {
    if (checked) {
        if (!selectedLogIds.value.includes(id)) selectedLogIds.value.push(id)
        return
    }
    selectedLogIds.value = selectedLogIds.value.filter(v => v !== id)
}

const toggleSelectAll = (checked) => {
    if (!checked) {
        selectedLogIds.value = []
        return
    }
    selectedLogIds.value = deletableLogs.value.map(log => log.id)
}

const isLogOlderThanRetention = (createdAt) => {
    if (!createdAt) return false
    return dayjs().diff(dayjs(createdAt), 'day') >= retentionDays
}

const retentionHint = (createdAt) => {
    if (isLogOlderThanRetention(createdAt)) return `เกิน ${retentionDays} วันแล้ว ลบได้`
    return `ยังไม่ครบ ${retentionDays} วัน`
}

const openSingleDeleteConfirm = (log) => {
    if (!isLogOlderThanRetention(log.createdAt)) {
        toast.warning('ยังลบไม่ได้', `System log นี้ยังอายุไม่ครบ ${retentionDays} วัน`)
        return
    }
    pendingDeleteIds.value = [log.id]
    showDeleteConfirm.value = true
}

const openBulkDeleteConfirm = () => {
    if (selectedLogIds.value.length === 0) {
        toast.warning('ยังไม่ได้เลือกรายการ', 'กรุณาเลือก System Log ที่ต้องการลบก่อน')
        return
    }
    pendingDeleteIds.value = [...selectedLogIds.value]
    showDeleteConfirm.value = true
}

const deleteConfirmMessage = computed(() => {
    if (pendingDeleteIds.value.length <= 1) {
        return `ยืนยันการลบ System Log #${pendingDeleteIds.value[0] || ''} ?`
    }
    return `ยืนยันการลบ System Log ที่เลือกทั้งหมด ${pendingDeleteIds.value.length} รายการ ?`
})

const handleDeleteLogs = async () => {
    if (pendingDeleteIds.value.length === 0) return

    isDeleting.value = true
    deletingLogIds.value = [...pendingDeleteIds.value]
    let successCount = 0
    let failCount = 0
    let failMessage = ''

    try {
        for (const logId of pendingDeleteIds.value) {
            try {
                await $api(`/system-logs/${logId}`, { method: 'DELETE' })
                successCount += 1
                selectedLogIds.value = selectedLogIds.value.filter(v => v !== logId)
            } catch (err) {
                failCount += 1
                if (!failMessage) {
                    failMessage = err?.data?.message || err?.message || 'ไม่สามารถลบบางรายการได้'
                }
            }
        }

        if (successCount > 0) {
            toast.success('ลบสำเร็จ', `ลบ System Log แล้ว ${successCount} รายการ`)
        }
        if (failCount > 0) {
            toast.error('ลบบางรายการไม่สำเร็จ', `${failCount} รายการ: ${failMessage}`)
        }

        showDeleteConfirm.value = false
        pendingDeleteIds.value = []
        await fetchLogs()
    } finally {
        deletingLogIds.value = []
        isDeleting.value = false
    }
}

const cancelDelete = () => {
    showDeleteConfirm.value = false
    pendingDeleteIds.value = []
}

onMounted(fetchLogs)
</script>
