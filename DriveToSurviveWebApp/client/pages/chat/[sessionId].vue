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
          :isRevoked="revokedLocationIds.has(msg.id)"
          @unsend="handleUnsend"
          @report="openReportModal"
          @revoke-location="handleRevokeLocation"
        />
      </template>
    </div>

    <!-- Image Preview -->
    <div v-if="imagePreview || selectedFileName" class="px-4 py-2 border-t border-slate-100 bg-slate-50">
      <div class="relative inline-block">
        <!-- รูปภาพปกติ -->
        <img v-if="imagePreview" :src="imagePreview" class="h-20 rounded-lg object-cover" />
        <!-- ไฟล์ที่ไม่ใช่รูป (เช่น PDF) -->
        <div v-else class="h-20 w-32 flex flex-col items-center justify-center rounded-lg bg-slate-200 text-slate-600 text-xs gap-1">
          <span class="text-2xl">📄</span>
          <span class="truncate max-w-[7rem] px-1">{{ selectedFileName }}</span>
        </div>
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
        <!-- Location share button -->
        <button
          @click="handleShareLocation"
          class="p-2.5 rounded-full transition-colors cursor-pointer"
          :class="isTrackingLocation
            ? 'text-red-500 bg-red-50 hover:bg-red-100 animate-pulse'
            : 'text-slate-400 hover:text-primary hover:bg-slate-100'"
          :title="isTrackingLocation ? 'หยุดแชร์ตำแหน่ง' : 'แชร์ตำแหน่งแบบ Real-time'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20">
            <path fill="currentColor" d="M16.219 1.943c.653.512 1.103 1.339 1.287 2.205a.474.474 0 0 1 .065.026l2.045.946a.659.659 0 0 1 .384.597v12.367a.665.665 0 0 1-.85.634l-5.669-1.6l-6.74 1.858a.674.674 0 0 1-.371-.004L.474 17.217a.66.66 0 0 1-.474-.63V3.998c0-.44.428-.756.855-.632l5.702 1.661l2.898-.887a.734.734 0 0 1 .122-.025c.112-.656.425-1.286.95-1.9c.623-.73 1.716-1.158 2.781-1.209c1.105-.053 1.949.183 2.91.936ZM1.333 4.881v11.215l4.87 1.449V6.298l-4.87-1.417Zm8.209.614l-2.006.613v11.279l5.065-1.394v-3.295c0-.364.299-.659.667-.659c.368 0 .666.295.666.66v3.177l4.733 1.335V6.136l-1.12-.52c-.019.11-.043.218-.073.323A6.134 6.134 0 0 1 16.4 8.05l-2.477 3.093a.67.67 0 0 1-1.073-.037l-2.315-3.353c-.382-.534-.65-1.01-.801-1.436a3.744 3.744 0 0 1-.192-.822Zm3.83-3.171c-.726.035-1.472.327-1.827.742c-.427.5-.637.968-.679 1.442c-.05.571-.016.974.126 1.373c.105.295.314.669.637 1.12l1.811 2.622l1.91-2.385a4.812 4.812 0 0 0 .841-1.657c.24-.84-.122-2.074-.8-2.604c-.695-.545-1.22-.692-2.018-.653Zm.138.697c1.104 0 2 .885 2 1.977a1.988 1.988 0 0 1-2 1.977c-1.104 0-2-.885-2-1.977s.896-1.977 2-1.977Zm0 1.318a.663.663 0 0 0-.667.659c0 .364.299.659.667.659a.663.663 0 0 0 .666-.66a.663.663 0 0 0-.666-.658Z"/>
          </svg>
        </button>
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
        <input ref="imageInput" type="file" accept="*/*" class="hidden" @change="onImageSelected" />

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
  emitNewMessage, emitRevokeLocation, onLocationRevoked, offLocationRevoked,
  emitTyping, emitStopTyping, onTyping, onStopTyping, offTyping, offStopTyping,
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

// Image upload
const selectedImage = ref(null)
const imagePreview = ref(null)
const selectedFileName = ref(null)

// Revoked location messages — persisted in localStorage so state survives refresh
function getRevokedKey() {
  return `revoked_locations:${sessionId.value}`
}
function loadRevokedFromStorage() {
  try {
    const raw = localStorage.getItem(getRevokedKey())
    if (raw) return new Set(JSON.parse(raw))
  } catch {}
  return new Set()
}
function saveRevokedToStorage(set) {
  try {
    localStorage.setItem(getRevokedKey(), JSON.stringify([...set]))
  } catch {}
}
const revokedLocationIds = ref(new Set())

// Location sharing
const isTrackingLocation = ref(false)
let locationWatchId = null
let lastLocationSentAt = 0
const currentSessionLocationIds = [] // track IDs for revocation on stop

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
    e.target.value = ''
    return
  }

  selectedImage.value = file
  selectedFileName.value = file.name

  const fileExtension = file.name.split('.').pop().toLowerCase()
  const imageExtensions = ['jpg', 'jpeg', 'png']
  if (imageExtensions.includes(fileExtension)) {
    imagePreview.value = URL.createObjectURL(file)
  } else {
    // ไม่ใช่รูปภาพ — แสดง filename preview แทน (validation จะเกิดตอนกดส่ง)
    imagePreview.value = null
  }
}

function cancelImage() {
  selectedImage.value = null
  imagePreview.value = null
  selectedFileName.value = null
}

async function handleSend() {
  // Send image if selected
  if (selectedImage.value) {
    // Validate file type ก่อนส่ง — แสดง toast ถ้าไม่ใช่ jpg/png
    const fileExtension = selectedImage.value.name.split('.').pop().toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png']
    if (!validExtensions.includes(fileExtension)) {
      toast.error('ไฟล์ไม่รองรับ', 'กรุณาอัปโหลดเฉพาะไฟล์ .jpg และ .png เท่านั้น')
      return
    }

    isSending.value = true
    try {
      const msg = await sendImage(sessionId.value, selectedImage.value)
      const msgData = msg?.data || msg
      messages.value.push(msgData)
      // Broadcast image to other participants via Socket.IO
      emitNewMessage(sessionId.value, msgData)
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

function handleShareLocation() {
  if (!navigator.geolocation) {
    toast.error('ไม่รองรับ GPS', 'เบราว์เซอร์ไม่รองรับ Geolocation')
    return
  }

  // Toggle: stop if already tracking
  if (isTrackingLocation.value) {
    navigator.geolocation.clearWatch(locationWatchId)
    locationWatchId = null
    isTrackingLocation.value = false
    // Revoke all location messages sent this session (updates cards for everyone)
    currentSessionLocationIds.forEach(id => handleRevokeLocation(id))
    currentSessionLocationIds.length = 0
    toast.success('หยุดแชร์ตำแหน่งแล้ว')
    return
  }

  // Reset session tracker
  currentSessionLocationIds.length = 0

  // Helper: save + push + broadcast one location update
  async function sendLocationOnce(pos) {
    try {
      const msg = await shareLocation(sessionId.value, pos.coords.latitude, pos.coords.longitude)
      const msgData = msg?.data || msg
      // avoid duplicate if socket already pushed it
      if (!messages.value.some(m => m.id === msgData.id)) {
        messages.value.push(msgData)
        scrollToBottom()
      }
      // Track for revocation on stop
      if (msgData.id && !currentSessionLocationIds.includes(msgData.id)) {
        currentSessionLocationIds.push(msgData.id)
      }
      // broadcast to B immediately via socket
      emitNewMessage(sessionId.value, msgData)
    } catch (err) {
      toast.error('แชร์ตำแหน่งล้มเหลว', err?.statusMessage || '')
    }
  }

  const onError = () => {
    toast.error('ไม่สามารถเข้าถึง GPS', 'กรุณาอนุญาตให้แอปเข้าถึงตำแหน่ง')
    isTrackingLocation.value = false
  }

  // ① ส่งตำแหน่งแรกทันทีด้วย getCurrentPosition (เร็วกว่า watchPosition)
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lastLocationSentAt = Date.now()
      sendLocationOnce(pos)
    },
    onError,
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
  )

  // ② watchPosition สำหรับ update ถัดไป (throttle 30 วิ)
  locationWatchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const now = Date.now()
      if (now - lastLocationSentAt < 30000) return
      lastLocationSentAt = now
      await sendLocationOnce(pos)
    },
    onError,
    { enableHighAccuracy: true, maximumAge: 10000 }
  )
  isTrackingLocation.value = true
  toast.success('เริ่มแชร์ตำแหน่งแบบ Real-time แล้ว')
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

// Location revocation: broadcast to all participants + stop live tracking
function handleRevokeLocation(messageId) {
  const next = new Set([...revokedLocationIds.value, messageId])
  revokedLocationIds.value = next
  saveRevokedToStorage(next)
  emitRevokeLocation(sessionId.value, messageId)

  // Also stop the real-time watchPosition if still active
  if (isTrackingLocation.value && locationWatchId !== null) {
    navigator.geolocation?.clearWatch(locationWatchId)
    locationWatchId = null
    isTrackingLocation.value = false
  }
}

// Receive revocation from another client
function handleLocationRevoked({ messageId }) {
  if (!messageId) return
  const next = new Set([...revokedLocationIds.value, messageId])
  revokedLocationIds.value = next
  saveRevokedToStorage(next)
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
  // Load persisted revoked location IDs from localStorage
  revokedLocationIds.value = loadRevokedFromStorage()
  loadMessages()
  // Connect Socket.IO for real-time chat
  if (token.value) {
    connectChatSocket(token.value)
    joinSession(sessionId.value)
    onNewMessage(handleIncomingMessage)
    onTyping(handleTyping)
    onStopTyping(handleStopTyping)
    onLocationRevoked(handleLocationRevoked)
  }
})

onUnmounted(() => {
  // Stop location watch if still active
  if (locationWatchId !== null) {
    navigator.geolocation?.clearWatch(locationWatchId)
    locationWatchId = null
  }
  leaveSession(sessionId.value)
  offNewMessage(handleIncomingMessage)
  offTyping(handleTyping)
  offStopTyping(handleStopTyping)
  offLocationRevoked(handleLocationRevoked)
  // Don't disconnect socket entirely — shared across pages
})
</script>
