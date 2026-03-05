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
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
              activeTab === tab.key ? 'bg-cta text-white' : 'text-slate-500 hover:text-primary hover:bg-slate-50'
            ]">
            {{ tab.icon }} {{ tab.label }} ({{ tabCount(tab.key) }})
          </button>
        </div>

        <!-- Review Disputes -->
        <div v-if="activeTab === 'disputes'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-primary">📋 รีวิว Disputes</h2>
            <select v-model="disputeFilter" @change="fetchDisputes" class="px-3 py-2 border border-slate-200 rounded-md text-sm">
              <option value="">ทั้งหมด</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="ACKNOWLEDGED">อ่านแล้ว</option>
              <option value="REJECTED">ปฏิเสธแล้ว</option>
            </select>
          </div>

          <div v-if="isLoading" class="py-12 text-center text-slate-400">กำลังโหลด...</div>
          <div v-else-if="disputes.length === 0" class="py-12 text-center text-slate-400">ไม่พบ Dispute</div>

          <div v-for="d in disputes" :key="d.id" class="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span :class="statusBadge(d.status)" class="px-2 py-0.5 text-xs font-medium rounded-full">
                    {{ statusLabel(d.status) }}
                  </span>
                  <span v-if="d.category" class="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                    📁 {{ d.category }}
                  </span>
                  <span class="text-xs text-slate-400">{{ formatDate(d.createdAt) }}</span>
                </div>
                <p class="text-sm"><span class="font-medium">Driver:</span> {{ d.driver?.firstName || d.driverId }}</p>
                <p class="text-sm"><span class="font-medium">เหตุผล:</span> {{ reasonLabel(d.reason) }}</p>
                <p v-if="d.detail" class="text-sm text-slate-500">{{ d.detail }}</p>
                <div v-if="d.review" class="mt-2 p-2 bg-slate-50 rounded-md text-sm">
                  <span class="font-medium">รีวิว:</span>
                  {{ '⭐'.repeat(d.review.rating) }} — {{ d.review.comment || 'ไม่มีความเห็น' }}
                  <span class="text-slate-400">({{ d.review.displayName }})</span>
                </div>
                <p v-if="d.adminNote" class="mt-1 text-xs text-slate-400 italic">
                  💬 หมายเหตุแอดมิน: {{ d.adminNote }}
                </p>
              </div>

              <div v-if="d.status === 'PENDING'" class="flex flex-col gap-2 flex-shrink-0">
                <button @click="confirmAcknowledge(d)"
                  class="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition cursor-pointer whitespace-nowrap">
                  ✅ อ่านแล้ว
                </button>
                <button @click="openRejectModal(d)"
                  class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition cursor-pointer whitespace-nowrap">
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
                <button @click="resolveReport(r.id, 'REVIEWED')"
                  class="px-3 py-1.5 text-xs text-white bg-green-600 rounded-md hover:bg-green-700 cursor-pointer">
                  ✅ แก้ไขแล้ว
                </button>
                <button @click="resolveReport(r.id, 'DISMISSED')"
                  class="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer">
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- Acknowledge Confirmation Modal -->
    <div v-if="showAckModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="showAckModal = false">
      <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="px-6 py-5 text-center">
          <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center text-2xl">✅</div>
          <h3 class="text-lg font-semibold text-slate-800 mb-1">ยืนยันว่าอ่านแล้ว?</h3>
          <p class="text-sm text-slate-500 mb-4">
            คุณต้องการทำเครื่องหมายว่าอ่าน Dispute นี้แล้วใช่หรือไม่?
          </p>
          <div v-if="ackTarget" class="mb-4 p-3 bg-slate-50 rounded-lg text-left text-sm">
            <p><span class="font-medium">Driver:</span> {{ ackTarget.driver?.firstName }}</p>
            <p><span class="font-medium">เหตุผล:</span> {{ reasonLabel(ackTarget.reason) }}</p>
          </div>
          <textarea v-model="ackNote" rows="2" maxlength="500"
            class="w-full px-3 py-2 text-sm mb-4 border border-slate-200 rounded-lg resize-none"
            placeholder="หมายเหตุ (ไม่บังคับ)"></textarea>
          <div class="flex gap-3">
            <button @click="showAckModal = false"
              class="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition cursor-pointer">
              ยกเลิก
            </button>
            <button @click="doAcknowledge"
              class="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition cursor-pointer">
              ✅ ยืนยัน — อ่านแล้ว
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal with Category -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="showRejectModal = false">
      <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="px-6 py-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">❌</div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">ปฏิเสธ Dispute</h3>
              <p class="text-xs text-slate-500">ข้อมูลจะยังคงอยู่ในระบบ</p>
            </div>
          </div>

          <div v-if="rejectTarget" class="mb-4 p-3 bg-slate-50 rounded-lg text-sm">
            <p><span class="font-medium">Driver:</span> {{ rejectTarget.driver?.firstName }}</p>
            <p><span class="font-medium">เหตุผล:</span> {{ reasonLabel(rejectTarget.reason) }}</p>
          </div>

          <!-- Category -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่สำหรับจัดเก็บ</label>
            <select v-model="rejectCategory" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
              <option value="">— ไม่ระบุ —</option>
              <option value="ข้อมูลไม่เพียงพอ">📄 ข้อมูลไม่เพียงพอ</option>
              <option value="ไม่ตรงเงื่อนไข">⚖️ ไม่ตรงเงื่อนไข</option>
              <option value="ซ้ำซ้อน">🔄 ซ้ำซ้อน</option>
              <option value="รีวิวถูกต้อง">✅ รีวิวถูกต้อง</option>
              <option value="อื่นๆ">📝 อื่นๆ</option>
            </select>
          </div>

          <textarea v-model="rejectNote" rows="2" maxlength="500"
            class="w-full px-3 py-2 text-sm mb-4 border border-slate-200 rounded-lg resize-none"
            placeholder="หมายเหตุเหตุผลที่ปฏิเสธ (ไม่บังคับ)"></textarea>

          <div class="flex gap-3">
            <button @click="showRejectModal = false"
              class="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition cursor-pointer">
              ยกเลิก
            </button>
            <button @click="doReject"
              class="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition cursor-pointer">
              ❌ ปฏิเสธ
            </button>
          </div>
        </div>
      </div>
    </div>
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
useHead({
    title: 'Admin — Ride',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})

const { $api } = useNuxtApp()
const { toast } = useToast()

const tabs = [
  { key: 'disputes', icon: '📋', label: 'Review Disputes' },
  { key: 'reports', icon: '🚨', label: 'Chat Reports' },
]

const tabCount = (key) => {
  if (key === 'disputes') return disputes.value.length
  if (key === 'reports') return reports.value.length
  return 0
}

const activeTab = ref('disputes')
const isLoading = ref(false)

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm') : ''

const statusBadge = (s) => ({
  PENDING: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ACKNOWLEDGED: 'bg-blue-100 text-blue-700',
  DISMISSED: 'bg-slate-100 text-slate-500',
  REVIEWED: 'bg-green-100 text-green-700',
}[s] || 'bg-slate-100 text-slate-500')

const statusLabel = (s) => ({
  PENDING: 'รอดำเนินการ',
  RESOLVED: 'แก้ไขแล้ว',
  REJECTED: 'ปฏิเสธแล้ว',
  ACKNOWLEDGED: 'อ่านแล้ว',
}[s] || s)

const REASON_LABELS = {
  FAKE_REVIEW: '🚫 รีวิวปลอม',
  WRONG_PERSON: '👤 คนผิด',
  INACCURATE: '❌ ข้อมูลไม่ถูกต้อง',
  OFFENSIVE: '⚠️ เนื้อหาไม่เหมาะสม',
  OTHER: '📝 อื่นๆ',
}
const reasonLabel = (r) => REASON_LABELS[r] || r

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

// ─── Acknowledge Modal ───────────────────────────────
const showAckModal = ref(false)
const ackTarget = ref(null)
const ackNote = ref('')

function confirmAcknowledge(dispute) {
  ackTarget.value = dispute
  ackNote.value = ''
  showAckModal.value = true
}

async function doAcknowledge() {
  if (!ackTarget.value) return
  try {
    await $api(`/reviews/disputes/${ackTarget.value.id}`, {
      method: 'PATCH',
      body: { status: 'ACKNOWLEDGED', adminNote: ackNote.value || null },
    })
    toast.success('ทำเครื่องหมายว่าอ่านแล้ว')
    showAckModal.value = false
    fetchDisputes()
  } catch (err) { toast.error('ผิดพลาด', err?.statusMessage || '') }
}

// ─── Reject Modal with Category ──────────────────────
const showRejectModal = ref(false)
const rejectTarget = ref(null)
const rejectNote = ref('')
const rejectCategory = ref('')

function openRejectModal(dispute) {
  rejectTarget.value = dispute
  rejectNote.value = ''
  rejectCategory.value = ''
  showRejectModal.value = true
}

async function doReject() {
  if (!rejectTarget.value) return
  try {
    await $api(`/reviews/disputes/${rejectTarget.value.id}`, {
      method: 'PATCH',
      body: {
        status: 'REJECTED',
        adminNote: rejectNote.value || null,
        category: rejectCategory.value || null,
      },
    })
    toast.success('ปฏิเสธ Dispute แล้ว', 'ข้อมูลยังคงอยู่ในระบบ')
    showRejectModal.value = false
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
