<template>
  <div>
    <AdminHeader />
    <AdminSidebar />

    <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
      <div class="mx-auto max-w-8xl">
        <!-- Title -->
        <div class="flex items-center gap-3 mb-6">
          <h1 class="text-2xl font-semibold text-primary">Admin Dashboard</h1>
          <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
            Chat · Review · Notification
          </span>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 mb-6 bg-white border border-slate-200 rounded-lg p-1">
          <button v-for="tab in tabs" :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.key ? 'bg-cta text-white' : 'text-slate-500 hover:text-primary hover:bg-slate-50'
            ]">
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- Review Disputes -->
        <div v-if="activeTab === 'disputes'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-primary">📋 รีวิว Disputes</h2>
            <select v-model="disputeFilter" @change="fetchDisputes" class="px-3 py-2 border border-slate-200 rounded-md text-sm">
              <option value="">ทั้งหมด</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="RESOLVED">แก้ไขแล้ว</option>
              <option value="REJECTED">ปฏิเสธแล้ว</option>
            </select>
          </div>

          <div v-if="isLoading" class="py-12 text-center text-slate-400">กำลังโหลด...</div>
          <div v-else-if="disputes.length === 0" class="py-12 text-center text-slate-400">ไม่พบ Dispute</div>

          <div v-for="d in disputes" :key="d.id" class="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span :class="statusBadge(d.status)" class="px-2 py-0.5 text-xs font-medium rounded-full">
                    {{ d.status }}
                  </span>
                  <span class="text-xs text-slate-400">{{ formatDate(d.createdAt) }}</span>
                </div>
                <p class="text-sm"><span class="font-medium">Driver:</span> {{ d.driver?.firstName || d.driverId }}</p>
                <p class="text-sm"><span class="font-medium">เหตุผล:</span> {{ d.reason }}</p>
                <p v-if="d.detail" class="text-sm text-slate-500">{{ d.detail }}</p>
                <div v-if="d.review" class="mt-2 p-2 bg-slate-50 rounded-md text-sm">
                  <span class="font-medium">รีวิว:</span>
                  {{ '⭐'.repeat(d.review.rating) }} — {{ d.review.comment || 'ไม่มีความเห็น' }}
                  <span class="text-slate-400">({{ d.review.displayName }})</span>
                </div>
              </div>

              <div v-if="d.status === 'PENDING'" class="flex gap-2">
                <button @click="resolveDispute(d.id, 'RESOLVED', true)"
                  class="px-3 py-1.5 text-xs text-white bg-green-600 rounded-md hover:bg-green-700">
                  ✅ ซ่อนรีวิว
                </button>
                <button @click="resolveDispute(d.id, 'REJECTED', false)"
                  class="px-3 py-1.5 text-xs text-white bg-red-600 rounded-md hover:bg-red-700">
                  ❌ ปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Reports -->
        <div v-if="activeTab === 'reports'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-primary">🚨 Chat Reports</h2>
            <select v-model="reportFilter" @change="fetchReports" class="px-3 py-2 border border-slate-200 rounded-md text-sm">
              <option value="">ทั้งหมด</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="RESOLVED">แก้ไขแล้ว</option>
              <option value="DISMISSED">ปิดแล้ว</option>
            </select>
          </div>

          <div v-if="isLoading" class="py-12 text-center text-slate-400">กำลังโหลด...</div>
          <div v-else-if="reports.length === 0" class="py-12 text-center text-slate-400">ไม่พบรายงาน</div>

          <div v-for="r in reports" :key="r.id" class="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span :class="statusBadge(r.status)" class="px-2 py-0.5 text-xs font-medium rounded-full">
                    {{ r.status }}
                  </span>
                  <span class="text-xs text-slate-400">{{ formatDate(r.createdAt) }}</span>
                </div>
                <p class="text-sm"><span class="font-medium">Reporter:</span> {{ r.reporter?.firstName || r.reporterId }}</p>
                <p class="text-sm"><span class="font-medium">เหตุผล:</span> {{ r.reason }}</p>
                <div v-if="r.message" class="mt-2 p-2 bg-slate-50 rounded-md text-sm">
                  <span class="font-medium">ข้อความ:</span> {{ r.message.content }}
                  <span class="text-slate-400 text-xs ml-2">{{ formatDate(r.message.createdAt) }}</span>
                </div>
              </div>

              <div v-if="r.status === 'PENDING'" class="flex gap-2">
                <button @click="resolveReport(r.id, 'RESOLVED')"
                  class="px-3 py-1.5 text-xs text-white bg-green-600 rounded-md hover:bg-green-700">
                  ✅ แก้ไขแล้ว
                </button>
                <button @click="resolveReport(r.id, 'DISMISSED')"
                  class="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200">
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import { useToast } from '~/composables/useToast'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({ middleware: 'admin-auth', layout: 'admin' })
useHead({ title: 'Admin — Ride' })

const { $api } = useNuxtApp()
const { toast } = useToast()

const tabs = [
  { key: 'disputes', icon: '📋', label: 'Review Disputes' },
  { key: 'reports', icon: '🚨', label: 'Chat Reports' },
]

const activeTab = ref('disputes')
const isLoading = ref(false)

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm') : ''
const statusBadge = (s) => ({
  PENDING: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  DISMISSED: 'bg-slate-100 text-slate-500',
}[s] || 'bg-slate-100 text-slate-500')

// ─── Disputes ────────────────────────────────────────
const disputes = ref([])
const disputeFilter = ref('')

const fetchDisputes = async () => {
  isLoading.value = true
  try {
    const params = disputeFilter.value ? `?status=${disputeFilter.value}` : ''
    const res = await $api(`/reviews/disputes/admin${params}`)
    disputes.value = res.data || []
  } catch { disputes.value = [] } finally { isLoading.value = false }
}

const resolveDispute = async (id, status, hideReview) => {
  try {
    await $api(`/reviews/disputes/${id}`, {
      method: 'PATCH',
      body: { status, hideReview, adminNote: `Admin action: ${status}` },
    })
    toast.success('อัปเดตแล้ว')
    fetchDisputes()
  } catch (err) { toast.error('ผิดพลาด', err?.statusMessage || '') }
}

// ─── Chat Reports ────────────────────────────────────
const reports = ref([])
const reportFilter = ref('')

const fetchReports = async () => {
  isLoading.value = true
  try {
    const params = reportFilter.value ? `?status=${reportFilter.value}` : ''
    const res = await $api(`/chat/reports/admin${params}`)
    reports.value = res.data || []
  } catch { reports.value = [] } finally { isLoading.value = false }
}

const resolveReport = async (id, status) => {
  try {
    await $api(`/chat/reports/${id}`, {
      method: 'PATCH',
      body: { status, adminNote: `Admin action: ${status}` },
    })
    toast.success('อัปเดตแล้ว')
    fetchReports()
  } catch (err) { toast.error('ผิดพลาด', err?.statusMessage || '') }
}

// Init
onMounted(() => {
  fetchDisputes()
  fetchReports()
})
</script>
