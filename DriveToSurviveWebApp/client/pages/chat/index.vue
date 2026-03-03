<template>
  <div class="min-h-screen bg-surface pb-12">
    <!-- Header -->
    <div class="relative h-[220px] w-full bg-gradient-to-br from-primary to-blue-700">
      <div class="absolute inset-0 flex flex-col justify-center pt-20 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-white drop-shadow-md">💬 ข้อความ</h2>
        <p class="mt-2 text-white/90 drop-shadow-sm">สนทนากับคนขับอย่างปลอดภัย</p>
      </div>
    </div>

    <div class="relative px-4 mx-auto -mt-8 max-w-3xl sm:px-6">
      <div class="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 class="text-lg font-semibold text-[#383838]">รายการแชท</h3>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="divide-y divide-slate-100">
          <div v-for="i in 3" :key="i" class="flex items-center gap-4 p-4 animate-pulse">
            <div class="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-slate-200 rounded w-3/4"></div>
              <div class="h-3 bg-slate-100 rounded w-1/2"></div>
              <div class="h-3 bg-slate-100 rounded w-5/6"></div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="sessions.length === 0" class="p-12 text-center">
          <p class="text-5xl mb-3">💬</p>
          <p class="text-slate-500">ยังไม่มีข้อความ</p>
          <p class="text-sm text-slate-400 mt-1">แชทจะเปิดอัตโนมัติเมื่อการจองได้รับการยืนยัน</p>
        </div>

        <!-- Session List -->
        <div v-else class="divide-y divide-slate-100">
          <NuxtLink
            v-for="session in sessions"
            :key="session.id"
            :to="`/chat/${session.id}`"
            class="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <!-- Route Icon -->
            <div class="relative flex-shrink-0">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                🚗
              </div>
              <span v-if="session.status === 'ACTIVE'"
                class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-primary truncate">
                  {{ getRouteTitle(session) }}
                </h4>
                <span class="text-xs text-slate-400 flex-shrink-0 ml-2">
                  {{ formatTime(session.messages?.[0]?.createdAt || session.createdAt) }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ getParticipantSummary(session) }}
              </p>
              <p class="text-sm text-slate-500 truncate mt-0.5">
                {{ session.messages?.[0]?.content || 'เริ่มการสนทนา...' }}
              </p>
            </div>

            <!-- Status -->
            <span v-if="session.status === 'ENDED'"
              class="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full flex-shrink-0">
              จบแล้ว
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useChat } from '~/composables/useChat'
import { useAuth } from '~/composables/useAuth'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'

dayjs.locale('th')
dayjs.extend(relativeTime)

definePageMeta({ middleware: 'auth' })
useHead({ title: 'ข้อความ — Ride' })

const { fetchSessions } = useChat()
const { user } = useAuth()

const isLoading = ref(false)
const sessions = ref([])

const getRouteTitle = (session) => {
  if (!session?.route) return 'แชทกลุ่ม'
  const start = session.route.startLocation?.name || session.route.startLocation?.label || 'ต้นทาง'
  const end = session.route.endLocation?.name || session.route.endLocation?.label || 'ปลายทาง'
  return `🚗 ${start} → ${end}`
}

const getParticipantSummary = (session) => {
  const members = (session.participants?.length || 0) + 1 // +1 for driver
  const driverName = session.driver?.firstName || 'คนขับ'
  return `👤 ${driverName} + ${members - 1} ผู้โดยสาร`
}

const formatTime = (date) => {
  if (!date) return ''
  const d = dayjs(date)
  if (d.isToday?.() || dayjs().diff(d, 'hour') < 24) return d.format('HH:mm')
  return d.fromNow()
}

onMounted(async () => {
  isLoading.value = true
  try {
    sessions.value = await fetchSessions() || []
  } catch (err) {
    console.error('Failed to load sessions:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
