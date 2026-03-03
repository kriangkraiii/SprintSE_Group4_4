<template>
  <div>
    <AdminHeader />
    <AdminSidebar />

    <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
      <div class="mx-auto max-w-8xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold text-primary">💬 Chat Logs</h1>
            <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
              {{ sessions.length }} เซสชัน
            </span>
          </div>
        </div>

        <!-- Session List -->
        <div v-if="isLoading" class="py-12 text-center text-slate-400">กำลังโหลด...</div>
        <div v-else-if="sessions.length === 0" class="py-12 text-center text-slate-400">ไม่พบเซสชันแชท</div>

        <div v-else class="space-y-3">
          <div v-for="s in sessions" :key="s.id"
            class="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            @click="toggleSession(s.id)">
            <div class="p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <i class="fas fa-comments text-blue-500"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-primary">
                      {{ s.driver?.firstName || 'คนขับ' }} ↔ {{ s.passengers?.map(p => p.firstName).join(', ') || 'ผู้โดยสาร' }}
                    </p>
                    <p class="text-xs text-slate-400">
                      Route: {{ s.route?.startLocation?.name || '?' }} → {{ s.route?.endLocation?.name || '?' }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span :class="statusClass(s.status)"
                    class="px-2 py-0.5 text-xs font-medium rounded-full">
                    {{ s.status }}
                  </span>
                  <span class="text-xs text-slate-400">{{ s._count?.messages || 0 }} ข้อความ</span>
                  <span class="text-xs text-slate-400">{{ formatDate(s.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Expanded Messages -->
            <div v-if="expandedId === s.id" class="border-t border-slate-100 p-4 bg-slate-50 max-h-80 overflow-y-auto space-y-2">
              <div v-if="loadingMessages" class="text-center text-slate-400 text-sm">กำลังโหลดข้อความ...</div>
              <div v-else-if="sessionMessages.length === 0" class="text-center text-slate-400 text-sm">ไม่พบข้อความ</div>
              <div v-for="msg in sessionMessages" :key="msg.id"
                class="flex gap-2 text-sm">
                <span class="font-medium text-slate-600 min-w-[80px]">{{ msg.sender?.firstName || 'User' }}:</span>
                <span class="text-slate-700 flex-1">{{ msg.content || (msg.type === 'IMAGE' ? '📷 รูปภาพ' : msg.type === 'LOCATION' ? '📍 แชร์ตำแหน่ง' : msg.content) }}</span>
                <span class="text-xs text-slate-400 shrink-0">{{ formatTime(msg.createdAt) }}</span>
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
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({ middleware: 'admin-auth', layout: 'admin' })
useHead({ title: 'Chat Logs — Admin' })

const { $api } = useNuxtApp()

const sessions = ref([])
const isLoading = ref(false)
const expandedId = ref(null)
const sessionMessages = ref([])
const loadingMessages = ref(false)

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm') : ''
const formatTime = (d) => d ? dayjs(d).format('HH:mm') : ''

const statusClass = (s) => ({
  ACTIVE: 'bg-green-100 text-green-700',
  ENDED: 'bg-amber-100 text-amber-700',
  READ_ONLY: 'bg-slate-100 text-slate-500',
  DELETED: 'bg-red-100 text-red-700',
}[s] || 'bg-slate-100 text-slate-500')

async function fetchSessions() {
  isLoading.value = true
  try {
    const res = await $api('/chat/admin/sessions')
    sessions.value = res.data || res || []
  } catch (e) {
    console.error('Failed to load chat sessions:', e)
    sessions.value = []
  } finally {
    isLoading.value = false
  }
}

async function toggleSession(id) {
  if (expandedId.value === id) {
    expandedId.value = null
    sessionMessages.value = []
    return
  }
  expandedId.value = id
  loadingMessages.value = true
  try {
    const res = await $api(`/chat/admin/sessions/${id}/messages`)
    sessionMessages.value = res.data || res || []
  } catch (e) {
    console.error('Failed to load messages:', e)
    sessionMessages.value = []
  } finally {
    loadingMessages.value = false
  }
}

onMounted(fetchSessions)
</script>
