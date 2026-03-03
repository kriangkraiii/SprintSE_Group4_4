<template>
    <div>
        <AdminHeader />
        <AdminSidebar />

        <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-5xl">
                <!-- Title -->
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-semibold text-primary">CRON Jobs Management</h1>
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                            <i class="mr-1 fas fa-clock"></i>ตั้งเวลาอัตโนมัติ
                        </span>
                    </div>
                    <button @click="fetchCronStatus" :disabled="loading"
                        class="px-4 py-2 text-sm text-white bg-cta rounded-md hover:bg-cta-hover disabled:opacity-50">
                        <i class="mr-1 fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
                        รีเฟรชสถานะ
                    </button>
                </div>

                <!-- Loading -->
                <div v-if="loading && jobs.length === 0" class="py-16 text-center text-slate-400">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>กำลังโหลดข้อมูล CRON...</p>
                </div>

                <!-- Job Cards -->
                <div v-else class="space-y-4">
                    <div v-for="job in jobs" :key="job.name"
                        class="bg-white border rounded-lg shadow-sm overflow-hidden"
                        :class="jobCardBorder(job.lastStatus)">

                        <!-- Header -->
                        <div class="px-6 py-4 flex items-start justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center"
                                    :class="jobIconBg(job.lastStatus)">
                                    <i class="fas" :class="jobIcon(job.name)"></i>
                                </div>
                                <div>
                                    <h2 class="font-semibold text-primary">{{ job.label }}</h2>
                                    <p class="text-sm text-slate-500 mt-0.5">{{ job.description }}</p>
                                </div>
                            </div>
                            <span class="px-2.5 py-1 text-xs font-bold rounded-full"
                                :class="statusBadge(job.lastStatus)">
                                {{ statusText(job.lastStatus) }}
                            </span>
                        </div>

                        <!-- Details -->
                        <div class="px-6 py-3 bg-slate-50 border-t border-slate-100">
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <p class="text-xs font-medium text-slate-400 mb-1">กำหนดการปัจจุบัน</p>
                                    <p class="text-sm text-primary font-mono">{{ job.schedule }}</p>
                                </div>
                                <div>
                                    <p class="text-xs font-medium text-slate-400 mb-1">รันล่าสุด</p>
                                    <p class="text-sm text-primary">
                                        {{ job.lastRun ? formatDate(job.lastRun) : 'ยังไม่เคยรัน' }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs font-medium text-slate-400 mb-1">รายละเอียดล่าสุด</p>
                                    <p class="text-sm text-primary truncate" :title="job.lastDetail">
                                        {{ job.lastDetail || '—' }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <!-- Edit schedule -->
                            <div class="flex items-center gap-2 flex-1">
                                <label class="text-xs font-medium text-slate-500 whitespace-nowrap">แก้ไขเวลา:</label>
                                <select v-model="editSchedules[job.name]"
                                    class="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-cta focus:outline-none">
                                    <option v-for="opt in getScheduleOptions(job.name)" :key="opt.value" :value="opt.value">
                                        {{ opt.label }}
                                    </option>
                                </select>
                                <button @click="updateSchedule(job.name)" :disabled="updatingSchedule === job.name"
                                    class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                                    <i class="fas" :class="updatingSchedule === job.name ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                                    บันทึก
                                </button>
                            </div>

                            <!-- Trigger -->
                            <button @click="triggerJob(job.name)" :disabled="triggering === job.name"
                                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-cta rounded-md hover:bg-cta-hover disabled:opacity-50">
                                <i class="fas" :class="triggering === job.name ? 'fa-spinner fa-spin' : 'fa-play'"></i>
                                {{ triggering === job.name ? 'กำลังรัน...' : 'รันตอนนี้' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Info box -->
                <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-info-circle text-amber-500 mt-0.5"></i>
                        <div class="text-sm text-amber-700">
                            <p class="font-semibold mb-1">หมายเหตุ</p>
                            <ul class="list-disc list-inside space-y-0.5 text-xs">
                                <li>การเปลี่ยนกำหนดการจะมีผลทันทีจนกว่า server จะ restart</li>
                                <li>Retention Purge ลบข้อมูลที่เกิน 90 วัน ตาม พ.ร.บ.คอมพิวเตอร์ พ.ศ.2560</li>
                                <li>Chat Lifecycle จัดการสถานะ session: ENDED → READ_ONLY (24 ชม.) → ARCHIVED (7 วัน)</li>
                                <li>ปุ่ม "รันตอนนี้" จะรัน CRON job ทันทีโดยไม่ต้องรอกำหนดการ</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import { useToast } from '~/composables/useToast'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({ middleware: 'admin-auth', layout: 'admin' })
useHead({
    title: 'CRON Jobs • Admin',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})

const { $api } = useNuxtApp()
const { toast } = useToast()

const loading = ref(false)
const jobs = ref([])
const triggering = ref(null)
const updatingSchedule = ref(null)

const editSchedules = reactive({
    retentionPurge: '',
    chatLifecycle: '',
})

const SCHEDULE_OPTIONS = {
    retentionPurge: [
        { value: '0 2 * * *', label: 'ทุกวัน 02:00 UTC (09:00 ไทย)' },
        { value: '0 0 * * *', label: 'ทุกวัน 00:00 UTC (07:00 ไทย)' },
        { value: '0 14 * * *', label: 'ทุกวัน 14:00 UTC (21:00 ไทย)' },
        { value: '0 2 * * 0', label: 'ทุกสัปดาห์ วันอาทิตย์ 02:00 UTC' },
        { value: '*/30 * * * *', label: 'ทุก 30 นาที (สำหรับทดสอบ)' },
    ],
    chatLifecycle: [
        { value: '3600000', label: 'ทุก 1 ชั่วโมง' },
        { value: '1800000', label: 'ทุก 30 นาที' },
        { value: '900000', label: 'ทุก 15 นาที' },
        { value: '300000', label: 'ทุก 5 นาที (สำหรับทดสอบ)' },
        { value: '7200000', label: 'ทุก 2 ชั่วโมง' },
    ],
}

const getScheduleOptions = (name) => SCHEDULE_OPTIONS[name] || []

const fetchCronStatus = async () => {
    loading.value = true
    try {
        const res = await $api('/admin/cron/status')
        const data = Array.isArray(res) ? res : (res?.data || [])
        jobs.value = data
        // Set current schedule in dropdowns
        data.forEach(job => {
            if (job.currentSchedule) {
                editSchedules[job.name] = job.currentSchedule
            } else {
                // Default values
                if (job.name === 'retentionPurge') editSchedules.retentionPurge = '0 2 * * *'
                if (job.name === 'chatLifecycle') editSchedules.chatLifecycle = '3600000'
            }
        })
    } catch (err) {
        console.error('Failed to fetch CRON status:', err)
        toast.error('โหลดข้อมูล CRON ล้มเหลว', err?.data?.message || '')
    } finally {
        loading.value = false
    }
}

const triggerJob = async (jobName) => {
    triggering.value = jobName
    try {
        const res = await $api(`/admin/cron/${jobName}/trigger`, { method: 'POST' })
        toast.success('รัน CRON Job สำเร็จ', res.message || '')
        await fetchCronStatus()
    } catch (err) {
        toast.error('รัน CRON Job ล้มเหลว', err?.data?.message || err?.message || '')
    } finally {
        triggering.value = null
    }
}

const updateSchedule = async (jobName) => {
    const newSchedule = editSchedules[jobName]
    if (!newSchedule) return toast.warning('กรุณาเลือกกำหนดการ')

    updatingSchedule.value = jobName
    try {
        const res = await $api(`/admin/cron/${jobName}/schedule`, {
            method: 'PUT',
            body: { schedule: newSchedule },
        })
        toast.success('อัปเดตกำหนดการสำเร็จ', res.message || '')
        await fetchCronStatus()
    } catch (err) {
        toast.error('อัปเดตกำหนดการล้มเหลว', err?.data?.message || err?.message || '')
    } finally {
        updatingSchedule.value = null
    }
}

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm:ss') : ''

const jobCardBorder = (status) => ({
    'border-green-200': status === 'SUCCESS',
    'border-red-200': status === 'FAILED',
    'border-slate-200': status === 'UNKNOWN',
})

const jobIconBg = (status) => ({
    'bg-green-100 text-green-600': status === 'SUCCESS',
    'bg-red-100 text-red-600': status === 'FAILED',
    'bg-slate-100 text-slate-500': status === 'UNKNOWN',
})

const jobIcon = (name) => ({
    retentionPurge: 'fa-trash-can',
    chatLifecycle: 'fa-comments',
}[name] || 'fa-clock')

const statusBadge = (status) => ({
    'bg-green-100 text-green-700': status === 'SUCCESS',
    'bg-red-100 text-red-700': status === 'FAILED',
    'bg-slate-100 text-slate-500': status === 'UNKNOWN',
})

const statusText = (status) => ({
    SUCCESS: '✅ สำเร็จ',
    FAILED: '❌ ล้มเหลว',
    UNKNOWN: '⏳ ไม่ทราบ',
}[status] || status)

onMounted(fetchCronStatus)
</script>
