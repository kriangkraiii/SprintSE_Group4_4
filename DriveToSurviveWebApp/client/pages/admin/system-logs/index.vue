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
                    <div class="grid grid-cols-1 gap-3 px-4 py-4 sm:px-6 lg:grid-cols-6">
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
                                <th class="px-4 py-3">ID</th>
                                <th class="px-4 py-3">Timestamp</th>
                                <th class="px-4 py-3">User ID</th>
                                <th class="px-4 py-3">IP Address</th>
                                <th class="px-4 py-3">Action</th>
                                <th class="px-4 py-3">Resource</th>
                                <th class="px-4 py-3">User Agent</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="logs.length === 0">
                                <td colspan="7" class="px-4 py-12 text-center text-slate-400">
                                    ไม่พบข้อมูล Log
                                </td>
                            </tr>
                            <tr v-for="log in logs" :key="log.id"
                                class="border-t border-slate-100 hover:bg-slate-50">
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
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({ middleware: 'admin-auth' })

const { $api } = useNuxtApp()

const isLoading = ref(false)
const logs = ref([])
const pagination = reactive({ page: 1, limit: 50, total: 0, totalPages: 0 })

const filters = reactive({
    userId: '',
    ipAddress: '',
    action: '',
    createdFrom: '',
    createdTo: '',
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
        if (filters.createdTo) params.set('createdTo', new Date(filters.createdTo).toISOString())

        const res = await $api(`/system-logs?${params.toString()}`)
        logs.value = res.data || res
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
    Object.assign(filters, { userId: '', ipAddress: '', action: '', createdFrom: '', createdTo: '' })
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

onMounted(fetchLogs)
</script>
