<template>
  <div class="flex flex-col h-screen bg-surface">
    <!-- Chat Header -->
    <div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
      <NuxtLink to="/chat" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>

      <template v-if="session">
        <img
          :src="otherUser.profilePicture || `https://ui-avatars.com/api/?name=${otherUser.firstName || 'U'}&background=random&size=40`"
          class="w-10 h-10 rounded-full object-cover"
        />
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-primary truncate">{{ otherUser.firstName || 'ผู้ใช้' }}</h3>
          <p class="text-xs text-slate-400">
            {{ session.status === 'ACTIVE' ? '🟢 ออนไลน์' : '🔴 จบแล้ว' }}
          </p>
        </div>
      </template>

      <!-- Location share button -->
      <button v-if="session?.status === 'ACTIVE'"
        @click="handleShareLocation"
        class="p-2 rounded-lg hover:bg-slate-100 text-primary transition-colors"
        title="แชร์ตำแหน่ง"
      >
        📍
      </button>
    </div>

    <!-- Messages Area -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      <div v-if="isLoadingMessages" class="text-center py-8 text-slate-400">
        <p>กำลังโหลดข้อความ...</p>
      </div>

      <template v-else>
        <ChatBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          :isOwn="msg.senderId === userId"
          @unsend="handleUnsend"
          @report="openReportModal"
        />
      </template>
    </div>

    <!-- Quick Reply Panel -->
    <QuickReply
      :show="showQuickReply && session?.status === 'ACTIVE'"
      :type="userRole"
      @select="handleQuickReply"
    />

    <!-- Input Area -->
    <div v-if="session?.status === 'ACTIVE'"
      class="px-4 py-3 bg-white border-t border-slate-200">
      <div class="flex items-end gap-2">
        <button
          @click="showQuickReply = !showQuickReply"
          class="p-2.5 rounded-full transition-colors"
          :class="showQuickReply ? 'bg-blue-100 text-primary' : 'text-slate-400 hover:text-primary hover:bg-slate-100'"
          title="ตอบกลับด่วน"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
        <textarea
          v-model="newMessage"
          @keydown.enter.exact.prevent="handleSend"
          rows="1"
          maxlength="2000"
          class="flex-1 px-4 py-2.5 border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          placeholder="พิมพ์ข้อความ..."
          :disabled="isSending"
        ></textarea>
        <button
          @click="handleSend"
          :disabled="!newMessage.trim() || isSending"
          class="p-2.5 bg-cta text-white rounded-full hover:bg-cta-hover transition-colors disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Ended notice -->
    <div v-else-if="session?.status === 'ENDED'"
      class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
      <p class="text-sm text-slate-500">🔒 แชทนี้ถูกปิดแล้ว — อ่านอย่างเดียว</p>
    </div>

    <!-- Report Modal -->
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showReportModal = false">
      <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h3 class="text-lg font-semibold text-primary">รายงานข้อความ</h3>
        <p class="text-sm text-slate-500 mt-1">เลือกเหตุผลในการรายงาน</p>

        <div class="mt-4 space-y-2">
          <label v-for="r in reportReasons" :key="r.value"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <input type="radio" v-model="reportReason" :value="r.value" class="text-primary" />
            <span class="text-sm">{{ r.label }}</span>
          </label>
        </div>

        <textarea v-model="reportDetail" rows="2" maxlength="500"
          class="w-full mt-3 px-3 py-2 border border-slate-200 rounded-lg text-sm"
          placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"></textarea>

        <div class="flex justify-end gap-2 mt-4">
          <button @click="showReportModal = false"
            class="px-4 py-2 text-sm text-primary bg-slate-100 rounded-md hover:bg-slate-200">ยกเลิก</button>
          <button @click="submitReport" :disabled="!reportReason"
            class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            ส่งรายงาน
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChat } from '~/composables/useChat'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth', layout: false })
useHead({ title: 'แชท — Ride' })

const route = useRoute()
const { fetchMessages, sendMessage, unsendMessage, shareLocation, reportMessage } = useChat()
const { user } = useAuth()
const { toast } = useToast()

const sessionId = computed(() => route.params.sessionId)
const userId = computed(() => user.value?.id)

const session = ref(null)
const messages = ref([])
const newMessage = ref('')
const isLoadingMessages = ref(false)
const isSending = ref(false)
const messagesContainer = ref(null)
const showQuickReply = ref(false)

const userRole = computed(() => {
  if (!session.value || !userId.value) return 'passenger'
  return session.value.driver?.id === userId.value ? 'driver' : 'passenger'
})

// Report
const showReportModal = ref(false)
const reportTargetMsg = ref(null)
const reportReason = ref('')
const reportDetail = ref('')

const reportReasons = [
  { value: 'HARASSMENT', label: '🚫 คุกคาม/ข่มขู่' },
  { value: 'SPAM', label: '📧 สแปม' },
  { value: 'INAPPROPRIATE', label: '⚠️ เนื้อหาไม่เหมาะสม' },
  { value: 'PRIVACY_VIOLATION', label: '🔒 ละเมิดความเป็นส่วนตัว' },
  { value: 'OTHER', label: '📝 อื่นๆ' },
]

const otherUser = computed(() => {
  if (!session.value) return {}
  return session.value.driver?.id === userId.value
    ? session.value.passenger || {}
    : session.value.driver || {}
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function loadMessages() {
  isLoadingMessages.value = true
  try {
    const result = await fetchMessages(sessionId.value)
    messages.value = result?.data || result || []
    // Extract session from response or fetch separately
    session.value = result?.session || { status: 'ACTIVE', driver: {}, passenger: {} }
  } catch (err) {
    console.error('Failed to load messages:', err)
  } finally {
    isLoadingMessages.value = false
    scrollToBottom()
  }
}

async function handleSend() {
  if (!newMessage.value.trim() || isSending.value) return

  isSending.value = true
  const content = newMessage.value
  newMessage.value = ''

  try {
    const msg = await sendMessage(sessionId.value, { content })
    messages.value.push(msg)
    scrollToBottom()
  } catch (err) {
    toast.error('ส่งข้อความล้มเหลว', err?.statusMessage || '')
    newMessage.value = content
  } finally {
    isSending.value = false
  }
}

async function handleQuickReply(text) {
  newMessage.value = text
  showQuickReply.value = false
  await handleSend()
}

async function handleUnsend(messageId) {
  try {
    await unsendMessage(messageId)
    const idx = messages.value.findIndex(m => m.id === messageId)
    if (idx >= 0) {
      messages.value[idx].content = 'ข้อความถูกลบ / Message unsent'
      messages.value[idx].isUnsent = true
    }
    toast.success('ลบข้อความแล้ว')
  } catch (err) {
    toast.error('ลบข้อความไม่สำเร็จ', err?.statusMessage || '')
  }
}

async function handleShareLocation() {
  if (!navigator.geolocation) {
    toast.error('ไม่รองรับ GPS', 'เบราว์เซอร์ไม่รองรับ Geolocation')
    return
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const msg = await shareLocation(sessionId.value, pos.coords.latitude, pos.coords.longitude)
        messages.value.push(msg)
        scrollToBottom()
        toast.success('แชร์ตำแหน่งแล้ว')
      } catch (err) {
        toast.error('แชร์ตำแหน่งล้มเหลว', err?.statusMessage || '')
      }
    },
    () => toast.error('ไม่สามารถเข้าถึง GPS', 'กรุณาอนุญาตให้แอปเข้าถึงตำแหน่ง')
  )
}

function openReportModal(msg) {
  reportTargetMsg.value = msg
  reportReason.value = ''
  reportDetail.value = ''
  showReportModal.value = true
}

async function submitReport() {
  if (!reportReason.value || !reportTargetMsg.value) return
  try {
    await reportMessage({
      sessionId: sessionId.value,
      messageId: reportTargetMsg.value.id,
      reason: reportReason.value,
      detail: reportDetail.value || undefined,
    })
    toast.success('รายงานแล้ว', 'ทีมงานจะตรวจสอบข้อความนี้')
    showReportModal.value = false
  } catch (err) {
    toast.error('รายงานล้มเหลว', err?.statusMessage || '')
  }
}

// Polling for new messages (every 5 seconds when active)
let pollInterval = null
onMounted(() => {
  loadMessages()
  pollInterval = setInterval(() => {
    if (session.value?.status === 'ACTIVE') {
      loadMessages()
    }
  }, 5000)
})

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>
