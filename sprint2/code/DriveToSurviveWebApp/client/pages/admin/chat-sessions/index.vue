<template>
  <div>
    <AdminHeader />
    <AdminSidebar />

    <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
      <div class="mx-auto max-w-7xl">
        <!-- Header -->
        <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold text-primary">รายการเซสชันแชท</h1>
            <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
              <i class="mr-1 fas fa-list"></i>{{ filteredSessions.length }} เซสชัน
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="fetchSessions" :disabled="isLoading"
              class="px-4 py-2 text-sm text-white bg-cta rounded-md hover:bg-cta-hover disabled:opacity-50">
              <i class="mr-1 fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
              รีเฟรช
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="mb-4 flex flex-col sm:flex-row gap-3">
          <input v-model="searchQuery" type="text" placeholder="ค้นหา Session ID, ชื่อคนขับ, ชื่อผู้โดยสาร..."
            class="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-cta focus:outline-none" />
          <select v-model="statusFilter"
            class="px-4 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-cta focus:outline-none">
            <option value="">ทุกสถานะ</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ENDED">ENDED</option>
            <option value="READ_ONLY">READ_ONLY</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="DELETED">DELETED</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="isLoading && sessions.length === 0" class="py-16 text-center text-slate-400">
          <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
          <p>กำลังโหลดข้อมูลเซสชัน...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredSessions.length === 0" class="py-16 text-center text-slate-400">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p>ไม่พบเซสชันแชท</p>
        </div>

        <!-- Sessions Table -->
        <div v-else class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-slate-600">Session ID</th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-600">คนขับ</th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-600">ผู้โดยสาร</th>
                  <th class="px-4 py-3 text-center font-semibold text-slate-600">สถานะ</th>
                  <th class="px-4 py-3 text-center font-semibold text-slate-600">ข้อความ</th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-600">สร้างเมื่อ</th>
                  <th class="px-4 py-3 text-left font-semibold text-slate-600">สิ้นสุดเมื่อ</th>
                  <th class="px-4 py-3 text-center font-semibold text-slate-600">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="s in filteredSessions" :key="s.id"
                  class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3">
                    <code class="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">{{ s.id }}</code>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {{ (s.driver?.firstName || '?')[0] }}
                      </div>
                      <span class="text-primary">{{ s.driver?.firstName || '-' }} {{ s.driver?.lastName || '' }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-primary">{{ getPassengerNames(s) || '-' }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="statusClass(s.status)"
                      class="px-2 py-0.5 text-xs font-medium rounded-full">
                      {{ s.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-slate-600 font-medium">{{ s._count?.messages || 0 }}</span>
                  </td>
                  <td class="px-4 py-3 text-slate-500 text-xs">{{ formatDate(s.createdAt) }}</td>
                  <td class="px-4 py-3 text-slate-500 text-xs">{{ s.endedAt ? formatDate(s.endedAt) : '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button @click="exportSession(s.id)" :disabled="exporting === s.id"
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        :title="'Export Log: ' + s.id">
                        <i class="fas" :class="exporting === s.id ? 'fa-spinner fa-spin' : 'fa-file-export'"></i>
                        Export
                      </button>
                      <button @click="viewMessages(s.id)"
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                        :title="'ดูข้อความ: ' + s.id">
                        <i class="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Message Preview Modal -->
        <div v-if="showMessageModal"
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showMessageModal = false">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-primary">ข้อความในเซสชัน</h3>
                <p class="text-xs text-slate-400 font-mono mt-0.5">{{ previewSessionId }}</p>
              </div>
              <button @click="showMessageModal = false"
                class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
                <i class="fas fa-times text-slate-500"></i>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-2">
              <div v-if="loadingMessages" class="py-8 text-center text-slate-400">
                <i class="fas fa-spinner fa-spin text-xl"></i>
              </div>
              <div v-else-if="previewMessages.length === 0" class="py-8 text-center text-slate-400">
                ไม่พบข้อความ
              </div>
              <div v-for="msg in previewMessages" :key="msg.id"
                class="flex gap-2 text-sm p-2 rounded-lg hover:bg-slate-50">
                <span class="font-medium text-slate-600 min-w-[80px] shrink-0">{{ msg.sender?.firstName || 'User' }}:</span>
                <span class="text-slate-700 flex-1">
                  {{ msg.type === 'IMAGE' ? '📷 รูปภาพ' : msg.type === 'LOCATION' ? '📍 แชร์ตำแหน่ง' : msg.content }}
                </span>
                <span class="text-xs text-slate-400 shrink-0">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
            <div class="text-sm text-blue-700">
              <p class="font-semibold mb-1">คำแนะนำ</p>
              <ul class="list-disc list-inside space-y-0.5 text-xs">
                <li>ใช้ปุ่ม Export เพื่อดาวน์โหลด Log ของเซสชันเป็นไฟล์ JSON</li>
                <li>Session ID สามารถใช้อ้างอิงในกรณีร้องเรียนหรือสอบสวน</li>
                <li>เซสชันที่สถานะ ARCHIVED จะถูกเก็บ Log ไว้ตามระยะเวลาที่กำหนดใน CRON Settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import { useToast } from '~/composables/useToast'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({ middleware: 'admin-auth', layout: 'admin' })
useHead({
  title: 'Chat Sessions — Admin',
  link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})

const { $api } = useNuxtApp()
const { toast } = useToast()

const sessions = ref([])
const isLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const exporting = ref(null)

// Message preview
const showMessageModal = ref(false)
const previewSessionId = ref('')
const previewMessages = ref([])
const loadingMessages = ref(false)

const filteredSessions = computed(() => {
  let result = sessions.value
  if (statusFilter.value) {
    result = result.filter(s => s.status === statusFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(s =>
      s.id.toLowerCase().includes(q) ||
      (s.driver?.firstName || '').toLowerCase().includes(q) ||
      (s.driver?.lastName || '').toLowerCase().includes(q) ||
      getPassengerNames(s).toLowerCase().includes(q)
    )
  }
  return result
})

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm') : ''
const formatTime = (d) => d ? dayjs(d).format('HH:mm') : ''

const statusClass = (s) => ({
  ACTIVE: 'bg-green-100 text-green-700',
  ENDED: 'bg-amber-100 text-amber-700',
  READ_ONLY: 'bg-slate-100 text-slate-600',
  ARCHIVED: 'bg-purple-100 text-purple-700',
  DELETED: 'bg-red-100 text-red-700',
}[s] || 'bg-slate-100 text-slate-500')

function getPassengerNames(session) {
  // Support both participants format and legacy passengers format
  if (session.participants?.length) {
    return session.participants.map(p => p.user?.firstName || p.firstName || '?').join(', ')
  }
  if (session.passengers?.length) {
    return session.passengers.map(p => p.firstName || '?').join(', ')
  }
  return ''
}

async function fetchSessions() {
  isLoading.value = true
  try {
    const res = await $api('/chat/admin/sessions')
    sessions.value = res.data || res || []
  } catch (e) {
    console.error('Failed to load chat sessions:', e)
    toast.error('โหลดข้อมูลเซสชันล้มเหลว', e?.data?.message || '')
    sessions.value = []
  } finally {
    isLoading.value = false
  }
}

async function exportSession(sessionId) {
  exporting.value = sessionId
  try {
    const res = await $api(`/admin/export/chat/${sessionId}`)
    // Download as JSON file
    const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-session-${sessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Export สำเร็จ', `ดาวน์โหลด Log สำหรับเซสชัน ${sessionId.slice(0, 8)}...`)
  } catch (e) {
    console.error('Failed to export session:', e)
    toast.error('Export ล้มเหลว', e?.data?.message || e?.message || '')
  } finally {
    exporting.value = null
  }
}

async function viewMessages(sessionId) {
  previewSessionId.value = sessionId
  showMessageModal.value = true
  loadingMessages.value = true
  previewMessages.value = []
  try {
    const res = await $api(`/chat/admin/sessions/${sessionId}/messages`)
    previewMessages.value = res.data || res?.messages || res || []
  } catch (e) {
    console.error('Failed to load messages:', e)
    toast.error('โหลดข้อความล้มเหลว')
    previewMessages.value = []
  } finally {
    loadingMessages.value = false
  }
}

onMounted(fetchSessions)
</script>
