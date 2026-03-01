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
            <template v-if="session.status === 'ACTIVE'">🟢 ออนไลน์</template>
            <template v-else-if="session.status === 'ENDED'">🟡 จบทริปแล้ว</template>
            <template v-else-if="session.status === 'READ_ONLY'">🔴 อ่านอย่างเดียว</template>
            <template v-else>🔒 ถูกลบแล้ว</template>
          </p>
        </div>
      </template>

      <!-- Notification bell -->
      <div class="relative ml-auto">
        <button @click="showNotifPanel = !showNotifPanel"
          class="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer relative">
          <svg class="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V9a6 6 0 10-12 0v4c0 .918-.21 1.79-.595 2.595L4 17h5m6 0a3 3 0 11-6 0h6z" />
          </svg>
          <span v-if="unreadNotifs > 0"
            class="absolute w-2 h-2 rounded-full -top-0 -right-0 bg-red-500 ring-2 ring-white"></span>
        </button>
        <div v-if="showNotifPanel"
          class="absolute right-0 top-full mt-2 w-[300px] max-h-[50vh] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-primary">การแจ้งเตือน</h3>
            <button class="p-1 rounded-md cursor-pointer text-slate-400 hover:text-slate-600" @click="showNotifPanel = false">✕</button>
          </div>
          <div class="max-h-[40vh] overflow-y-auto">
            <div v-if="notifications.length === 0" class="px-4 py-6 text-sm text-center text-slate-400">ไม่มีการแจ้งเตือน</div>
            <div v-for="n in notifications" :key="n.id"
              class="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
              <p class="text-sm font-medium text-primary truncate">{{ n.title }}</p>
              <p class="text-xs text-slate-500 line-clamp-2">{{ n.body }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ timeAgo(n.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Location share button -->
      <button v-if="canSend"
        @click="handleShareLocation"
        class="p-2 rounded-lg hover:bg-slate-100 text-primary transition-colors cursor-pointer"
        title="แชร์ตำแหน่ง"
      >
        📍
      </button>
    </div>

    <!-- Lifecycle Banner -->
    <div v-if="lifecycleBanner" class="px-4 py-2 text-center text-xs font-medium" :class="lifecycleBanner.class">
      {{ lifecycleBanner.text }}
    </div>

    <!-- Typing Indicator -->
    <div v-if="typingUsers.length" class="px-4 py-1 text-xs text-slate-400 animate-pulse">
      {{ typingUsers.join(', ') }} กำลังพิมพ์...
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

    <!-- Image Preview -->
    <div v-if="imagePreview" class="px-4 py-2 border-t border-slate-100 bg-slate-50">
      <div class="relative inline-block">
        <img :src="imagePreview" class="h-20 rounded-lg object-cover" />
        <button @click="cancelImage" class="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Quick Reply Panel -->
    <QuickReply
      :show="showQuickReply && canSend"
      :type="userRole"
      @select="handleQuickReply"
    />

    <!-- Input Area (Messenger-like) -->
    <div v-if="canSend"
      class="px-4 py-3 bg-white border-t border-slate-200">
      <div class="flex items-end gap-2">
        <!-- Image upload -->
        <button
          @click="$refs.imageInput.click()"
          class="p-2.5 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
          title="ส่งรูปภาพ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input ref="imageInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onImageSelected" />

        <!-- Quick reply toggle -->
        <button
          @click="showQuickReply = !showQuickReply"
          class="p-2.5 rounded-full transition-colors cursor-pointer"
          :class="showQuickReply ? 'bg-blue-100 text-primary' : 'text-slate-400 hover:text-primary hover:bg-slate-100'"
          title="ตอบกลับด่วน"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>

        <!-- Text input -->
        <textarea
          v-model="newMessage"
          @keydown.enter.exact.prevent="handleSend"
          rows="1"
          maxlength="2000"
          class="flex-1 px-4 py-2.5 border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          placeholder="พิมพ์ข้อความ..."
          :disabled="isSending"
        ></textarea>

        <!-- Send button -->
        <button
          @click="handleSend"
          :disabled="(!newMessage.trim() && !selectedImage) || isSending"
          class="p-2.5 bg-cta text-white rounded-full hover:bg-cta-hover transition-colors disabled:opacity-40 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Read-only / Ended notices -->
    <div v-else-if="session?.status === 'READ_ONLY' || session?.status === 'ARCHIVED'"
      class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
      <p class="text-sm text-slate-500">🔒 แชทนี้อ่านอย่างเดียว</p>
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
            class="px-4 py-2 text-sm text-primary bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer">ยกเลิก</button>
          <button @click="submitReport" :disabled="!reportReason"
            class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer">
            ส่งรายงาน
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChat } from '~/composables/useChat'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth', layout: false })
useHead({ title: 'แชท — Ride' })

const route = useRoute()
const {
  fetchMessages, sendMessage, unsendMessage, shareLocation, reportMessage, sendImage,
  connectChatSocket, joinSession, leaveSession, onNewMessage, offNewMessage,
  emitNewMessage, emitTyping, emitStopTyping, onTyping, onStopTyping, offTyping, offStopTyping,
  disconnectSocket,
} = useChat()
const { user, token } = useAuth()
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
const typingUsers = ref([])
let typingTimer = null

// Notifications
const showNotifPanel = ref(false)
const notifications = ref([])
const unreadNotifs = computed(() => notifications.value.filter(n => !n.readAt).length)

function timeAgo(ts) {
  const ms = Date.now() - new Date(ts).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'เมื่อสักครู่'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชม.ที่แล้ว`
  return `${Math.floor(h / 24)} วันที่แล้ว`
}

async function fetchNotifications() {
  try {
    if (!token.value) return
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase || 'http://localhost:3001/api'
    const res = await $fetch('/notifications', {
      baseURL: apiBase,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token.value}` },
      query: { page: 1, limit: 10 }
    })
    const raw = Array.isArray(res?.data) ? res.data : []
    notifications.value = raw.map(it => ({
      id: it.id, title: it.title || '-', body: it.body || '',
      createdAt: it.createdAt || Date.now(), readAt: it.readAt || null
    }))
  } catch { /* silent */ }
}

// Image upload
const selectedImage = ref(null)
const imagePreview = ref(null)

const userRole = computed(() => {
  if (!session.value || !userId.value) return 'passenger'
  return session.value.driver?.id === userId.value ? 'driver' : 'passenger'
})

// Can user send messages?
const canSend = computed(() => {
  if (!session.value) return false
  if (session.value.status === 'ACTIVE') return true
  if (session.value.status === 'ENDED') {
    if (!session.value.chatExpiresAt) return true
    return new Date() < new Date(session.value.chatExpiresAt)
  }
  return false
})

// Lifecycle banner
const lifecycleBanner = computed(() => {
  if (!session.value) return null
  if (session.value.status === 'ENDED' && session.value.chatExpiresAt) {
    const remaining = new Date(session.value.chatExpiresAt) - new Date()
    if (remaining > 0) {
      const hours = Math.ceil(remaining / (1000 * 60 * 60))
      return { text: `🕐 ยังคุยต่อได้อีก ${hours} ชั่วโมง — หลังจากนั้นจะเป็นอ่านอย่างเดียว`, class: 'bg-amber-50 text-amber-700' }
    }
    return { text: '🔒 หมดเวลาส่งข้อความแล้ว — อ่านอย่างเดียว', class: 'bg-red-50 text-red-600' }
  }
  if (session.value.status === 'READ_ONLY' && session.value.readOnlyExpiresAt) {
    const remaining = new Date(session.value.readOnlyExpiresAt) - new Date()
    if (remaining > 0) {
      const days = Math.ceil(remaining / (1000 * 60 * 60 * 24))
      return { text: `📖 อ่านอย่างเดียว — อีก ${days} วันจะถูกลบอัตโนมัติ`, class: 'bg-slate-100 text-slate-600' }
    }
  }
  return null
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
    session.value = result?.session || { status: 'ACTIVE', driver: {}, passenger: {} }
  } catch (err) {
    console.error('Failed to load messages:', err)
  } finally {
    isLoadingMessages.value = false
    scrollToBottom()
  }
}

function onImageSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toast.error('ไฟล์ใหญ่เกินไป', 'สูงสุด 5 MB')
    return
  }
  selectedImage.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function cancelImage() {
  selectedImage.value = null
  imagePreview.value = null
}

async function handleSend() {
  // Send image if selected
  if (selectedImage.value) {
    isSending.value = true
    try {
      const msg = await sendImage(sessionId.value, selectedImage.value)
      const msgData = msg?.data || msg
      messages.value.push(msgData)
      cancelImage()
      scrollToBottom()
    } catch (err) {
      toast.error('ส่งรูปไม่สำเร็จ', err?.statusMessage || '')
    } finally {
      isSending.value = false
    }
    return
  }

  // Send text
  if (!newMessage.value.trim() || isSending.value) return
  isSending.value = true
  const content = newMessage.value
  newMessage.value = ''
  emitStopTyping(sessionId.value)
  try {
    const msg = await sendMessage(sessionId.value, { content })
    const msgData = msg?.data || msg
    messages.value.push(msgData)
    // Broadcast to other participants via Socket.IO
    emitNewMessage(sessionId.value, msgData)
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
        const msgData = msg?.data || msg
        messages.value.push(msgData)
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

// ─── Socket.IO Real-time Chat ─────────────────────────
function handleIncomingMessage(msg) {
  // Avoid duplicates
  if (messages.value.some(m => m.id === msg.id)) return
  messages.value.push(msg)
  scrollToBottom()
}

function handleTyping({ userId: typingUserId }) {
  if (typingUserId === userId.value) return
  const name = otherUser.value?.firstName || 'ผู้ใช้'
  if (!typingUsers.value.includes(name)) typingUsers.value.push(name)
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => { typingUsers.value = [] }, 3000)
}

function handleStopTyping() {
  typingUsers.value = []
}

// Emit typing when user types
watch(newMessage, (val) => {
  if (val.trim()) {
    emitTyping(sessionId.value)
  } else {
    emitStopTyping(sessionId.value)
  }
})

onMounted(() => {
  loadMessages()
  fetchNotifications()
  // Connect Socket.IO for real-time chat
  if (token.value) {
    connectChatSocket(token.value)
    joinSession(sessionId.value)
    onNewMessage(handleIncomingMessage)
    onTyping(handleTyping)
    onStopTyping(handleStopTyping)
  }
})

onUnmounted(() => {
  leaveSession(sessionId.value)
  offNewMessage(handleIncomingMessage)
  offTyping(handleTyping)
  offStopTyping(handleStopTyping)
  // Don't disconnect socket entirely — shared across pages
})
</script>
