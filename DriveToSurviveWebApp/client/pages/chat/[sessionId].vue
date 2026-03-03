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
        <!-- Group avatar stack -->
        <div class="relative flex -space-x-2 flex-shrink-0">
          <img v-for="p in headerAvatars" :key="p.id"
            :src="p.profilePicture || `https://ui-avatars.com/api/?name=${p.firstName || 'U'}&background=random&size=36`"
            class="w-9 h-9 rounded-full object-cover border-2 border-white"
          />
          <div v-if="participantCount > 3"
            class="w-9 h-9 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">
            +{{ participantCount - 3 }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-primary truncate">{{ routeLabel }}</h3>
          <p class="text-xs text-slate-400">
            <template v-if="session.status === 'ACTIVE'">🟢 {{ participantCount }} คนในแชท</template>
            <template v-else-if="session.status === 'ENDED'">🟡 จบทริปแล้ว</template>
            <template v-else-if="session.status === 'READ_ONLY'">🔴 อ่านอย่างเดียว</template>
            <template v-else>🔒 ถูกลบแล้ว</template>
          </p>
        </div>

        <!-- Call button -->
        <button @click="showContactPanel = true"
          class="p-2 rounded-lg text-cta hover:bg-blue-50 transition-colors cursor-pointer"
          title="โทร / ข้อมูลผู้ร่วมเดินทาง">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
      </template>
    </div>

    <!-- Lifecycle Banner -->
    <div v-if="lifecycleBanner" class="px-4 py-2 text-center text-xs font-medium" :class="lifecycleBanner.class">
      {{ lifecycleBanner.text }}
    </div>

    <!-- Typing Indicator with animated dots -->
    <div v-if="typingUsers.length" class="px-4 py-2 flex items-center gap-2">
      <div class="flex items-center gap-1">
        <span class="text-xs text-slate-400">{{ typingUsers.join(', ') }} กำลังพิมพ์</span>
        <div class="flex gap-0.5">
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      </div>
    </div>

    <!-- Messages Area -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-1">
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
          :showSenderName="isGroupChat"
          @edit="startEdit"
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

        <!-- Edit indicator -->
        <div v-if="editingMessage" class="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>กำลังแก้ไขข้อความ...</span>
          </div>
          <button @click="cancelEdit" class="text-sm text-slate-500 hover:text-slate-700 cursor-pointer">ยกเลิก</button>
        </div>

        <!-- Text input -->
        <textarea
          ref="messageInput"
          :value="editingMessage ? editContent : newMessage"
          @input="onInputChange"
          @keydown.enter.exact.prevent="editingMessage ? handleEditSend() : handleSend()"
          @keydown.escape="editingMessage && cancelEdit()"
          rows="1"
          maxlength="2000"
          class="flex-1 px-4 py-2.5 border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          :class="editingMessage ? 'bg-blue-50 border-blue-200' : ''"
          placeholder="พิมพ์ข้อความ..."
          :disabled="isSending"
        ></textarea>

        <!-- Send/Save button -->
        <button
          @click="editingMessage ? handleEditSend() : handleSend()"
          :disabled="(editingMessage ? (!editContent.trim() || editContent.trim() === editingMessage.content) : (!newMessage.trim() && !selectedImage)) || isSending"
          class="p-2.5 bg-cta text-white rounded-full hover:bg-cta-hover transition-colors disabled:opacity-40 cursor-pointer"
        >
          <svg v-if="editingMessage" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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

    <!-- Contact Panel (Bottom Sheet) -->
    <div v-if="showContactPanel" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40" @click.self="showContactPanel = false">
      <div class="w-full max-w-lg bg-white rounded-t-2xl shadow-xl max-h-[70vh] overflow-y-auto animate-slide-up">
        <!-- Handle bar -->
        <div class="flex justify-center py-2">
          <div class="w-10 h-1 bg-slate-300 rounded-full"></div>
        </div>

        <div class="px-5 pb-6">
          <h3 class="text-lg font-semibold text-primary mb-4">📞 ผู้ร่วมเดินทาง</h3>

          <!-- Driver card (shown to passengers) -->
          <div v-if="userRole === 'passenger' && session?.driver" class="mb-4">
            <p class="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">🚗 คนขับ</p>
            <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <img :src="session.driver.profilePicture || `https://ui-avatars.com/api/?name=${session.driver.firstName || 'D'}&background=3b82f6&color=fff&size=40`"
                class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-primary">{{ session.driver.firstName }}</p>
                <p class="text-xs text-slate-500">คนขับ</p>
              </div>
              <a v-if="session.driver.phoneNumber"
                :href="`tel:${session.driver.phoneNumber}`"
                class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                @click.stop>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                โทร
              </a>
              <button v-if="session.driver.phoneNumber"
                @click="copyPhone(session.driver.phoneNumber)"
                class="p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="คัดลอกเบอร์">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </button>
            </div>
          </div>

          <!-- Passenger: navigate to my pickup -->
          <a v-if="userRole === 'passenger' && myPickupNavUrl" :href="myPickupNavUrl" target="_blank" @click.stop
            class="block w-full mt-3 px-4 py-2.5 text-sm font-medium text-center text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition">
            📍 นำทางไปจุดขึ้นรถ (Google Maps)
          </a>

          <!-- Passenger list (shown to driver) -->
          <div v-if="userRole === 'driver'">
            <p class="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">👥 ผู้โดยสาร ({{ passengerContacts.length }})</p>
            <div class="space-y-2">
              <div v-for="p in passengerContacts" :key="p.id"
                class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <img :src="p.profilePicture || `https://ui-avatars.com/api/?name=${p.firstName || 'U'}&background=random&size=40`"
                  class="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-primary">{{ p.firstName }}</p>
                  <p v-if="p.pickupLabel" class="text-xs text-slate-500 mt-0.5">
                    📍 รับ: {{ p.pickupLabel }}
                  </p>
                  <p v-if="p.dropoffLabel" class="text-xs text-slate-400">
                    🏁 ส่ง: {{ p.dropoffLabel }}
                  </p>
                  <p v-if="p.seats" class="text-xs text-slate-400">🪑 {{ p.seats }} ที่นั่ง</p>
                  <a v-if="p.pickupLat" :href="getNavToPickupUrl(p.pickupLat, p.pickupLng, p.pickupLabel, p.pickupPlaceId)" target="_blank" @click.stop
                    class="inline-flex items-center gap-1 mt-1 px-2 py-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition">
                    🗺️ นำทางไปรับ
                  </a>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <a v-if="p.phoneNumber"
                    :href="`tel:${p.phoneNumber}`"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                    @click.stop>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    โทร
                  </a>
                  <button v-if="p.phoneNumber"
                    @click="copyPhone(p.phoneNumber)"
                    class="p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="คัดลอกเบอร์">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </button>
                </div>
              </div>
              <p v-if="passengerContacts.length === 0" class="text-sm text-slate-400 text-center py-4">ยังไม่มีผู้โดยสาร</p>
            </div>
          </div>

          <!-- Passenger list (shown to passenger - see other passengers) -->
          <div v-if="userRole === 'passenger' && otherPassengers.length">
            <p class="text-xs font-medium text-slate-400 mb-2 mt-4 uppercase tracking-wide">👥 ผู้โดยสารคนอื่น</p>
            <div class="space-y-2">
              <div v-for="p in otherPassengers" :key="p.id" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <img :src="p.profilePicture || `https://ui-avatars.com/api/?name=${p.firstName || 'U'}&background=random&size=36`"
                  class="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                <p class="text-sm font-medium text-primary">{{ p.firstName }}</p>
              </div>
            </div>
          </div>

          <button @click="showContactPanel = false"
            class="w-full mt-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
            ปิด
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
  fetchMessages, sendMessage, editMessage, unsendMessage, shareLocation, reportMessage, sendImage,
  connectChatSocket, joinSession, leaveSession, onNewMessage, offNewMessage,
  emitNewMessage, emitEditMessage, emitUnsendMessage, emitRevokeLocation, onLocationRevoked, offLocationRevoked,
  onMessageEdited, offMessageEdited, onMessageUnsent, offMessageUnsent,
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
const messageInput = ref(null)
const isLoadingMessages = ref(false)
const isSending = ref(false)
const messagesContainer = ref(null)
const showQuickReply = ref(false)
const showContactPanel = ref(false)
const typingUsers = ref([])
let typingTimer = null

// Edit message state
const editingMessage = ref(null)
const editContent = ref('')

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

// ─── Group Chat helpers ──────────────────────────────────
function locationLabel(loc) {
  if (!loc) return ''
  if (typeof loc === 'string') return loc
  return loc.name || loc.label || loc.address || loc.formatted_address || ''
}

const participantCount = computed(() => {
  if (!session.value?.participants) return 1
  // participants + driver
  return session.value.participants.length + 1
})

const isGroupChat = computed(() => participantCount.value > 2)

const headerAvatars = computed(() => {
  if (!session.value) return []
  const list = []
  if (session.value.driver) list.push(session.value.driver)
  if (session.value.participants) {
    session.value.participants.forEach(p => {
      if (p.user && p.user.id !== session.value.driver?.id) list.push(p.user)
    })
  }
  return list.slice(0, 3) // max 3 avatars
})

const routeLabel = computed(() => {
  if (!session.value?.route) return 'แชทกลุ่ม'
  const start = locationLabel(session.value.route.startLocation)
  const end = locationLabel(session.value.route.endLocation)
  if (start && end) return `${start} → ${end}`
  return start || end || 'แชทกลุ่ม'
})

const passengerContacts = computed(() => {
  if (!session.value?.participants) return []
  const driverId = session.value.driver?.id
  const bookings = session.value.bookings || []
  return session.value.participants
    .filter(p => p.user?.id !== driverId)
    .map(p => {
      const booking = bookings.find(b => b.passengerId === p.user.id)
      return {
        ...p.user,
        pickupLabel: locationLabel(booking?.pickupLocation),
        dropoffLabel: locationLabel(booking?.dropoffLocation),
        seats: booking?.numberOfSeats,
        pickupLat: booking?.pickupLocation?.lat,
        pickupLng: booking?.pickupLocation?.lng,
        pickupPlaceId: booking?.pickupLocation?.placeId || null,
      }
    })
})

const otherPassengers = computed(() => {
  if (!session.value?.participants) return []
  const driverId = session.value.driver?.id
  return session.value.participants
    .filter(p => p.user?.id !== driverId && p.user?.id !== userId.value)
    .map(p => p.user)
})

function copyPhone(phone) {
  navigator.clipboard?.writeText(phone)
  toast.success('คัดลอกเบอร์แล้ว', phone)
}

function getNavToPickupUrl(lat, lng, label, placeId) {
  if (!lat) return '#'
  let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  if (placeId) url += `&destination_place_id=${placeId}`
  return url
}

// Passenger's own pickup nav URL
const myPickupNavUrl = computed(() => {
  if (!session.value?.bookings || !userId.value) return null
  const myBooking = session.value.bookings.find(b => b.passengerId === userId.value)
  if (!myBooking?.pickupLocation?.lat) return null
  return getNavToPickupUrl(myBooking.pickupLocation.lat, myBooking.pickupLocation.lng, locationLabel(myBooking.pickupLocation), myBooking.pickupLocation.placeId)
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
    // แสดง toast หลัง refresh แจ้งสถานะ content ที่โหลดมาได้
    checkRefreshContent()
  }
}

function checkRefreshContent() {
  // ตรวจสอบว่าเป็นการ reload จริงๆ
  const navEntry = performance.getEntriesByType('navigation')[0]
  if (!navEntry || navEntry.type !== 'reload') return

  const msgs = messages.value
  const hasText = msgs.some(m => m.type === 'TEXT' || (!m.type && m.content))
  const hasImage = msgs.some(m => m.type === 'IMAGE' || m.imageUrl)
  const hasLocation = msgs.some(m => m.type === 'LOCATION')

  if (hasText && hasImage && hasLocation) {
    toast.success('รีเฟรชเรียบร้อย', 'สามารถดูข้อความ รูปภาพ และตำแหน่งที่แชร์ก่อนหน้าได้ตามปกติ')
    return
  }

  // แจ้งแยกว่าขาดอะไร
  if (!hasText) toast.error('ไม่พบข้อความ', 'ไม่สามารถโหลดข้อความก่อนหน้าได้หลัง refresh')
  if (!hasImage) toast.error('ไม่พบรูปภาพ', 'ไม่สามารถโหลดรูปภาพก่อนหน้าได้หลัง refresh')
  if (!hasLocation) toast.error('ไม่พบตำแหน่งที่แชร์', 'ไม่สามารถโหลดตำแหน่งที่แชร์ก่อนหน้าได้หลัง refresh')
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
  if (!newMessage.value.trim()) {
    toast.error('ไม่สามารถส่งข้อความว่างเปล่าได้', 'กรุณาพิมพ์ข้อความก่อนส่ง')
    return
  }
  if (isSending.value) return
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
    nextTick(() => {
      messageInput.value?.focus()
    })
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
    // Broadcast unsend to other participants via socket
    emitUnsendMessage(sessionId.value, messageId)
    toast.success('ลบข้อความแล้ว')
  } catch (err) {
    toast.error('ลบข้อความไม่สำเร็จ', err?.statusMessage || '')
  }
}

function onInputChange(e) {
  if (editingMessage.value) {
    editContent.value = e.target.value
  } else {
    newMessage.value = e.target.value
  }
}

function startEdit(msg) {
  editingMessage.value = msg
  editContent.value = msg.content
  nextTick(() => {
    if (messageInput.value) messageInput.value.focus()
  })
}

function cancelEdit() {
  editingMessage.value = null
  editContent.value = ''
}

async function handleEditSend() {
  if (!editingMessage.value || !editContent.value.trim() || isSending.value) return
  if (editContent.value.trim() === editingMessage.value.content) {
    toast.info('ไม่มีการเปลี่ยนแปลง', 'ข้อความเหมือนเดิม')
    return
  }
  isSending.value = true
  try {
    const res = await editMessage(editingMessage.value.id, { content: editContent.value.trim() })
    const updated = res?.data || res
    const idx = messages.value.findIndex(m => m.id === editingMessage.value.id)
    if (idx >= 0) {
      messages.value[idx].content = updated.content
      messages.value[idx].metadata = updated.metadata
    }
    // Broadcast edit to other participants via socket
    emitEditMessage(sessionId.value, updated)
    toast.success('แก้ไขข้อความแล้ว')
    cancelEdit()
  } catch (err) {
    toast.error('แก้ไขไม่สำเร็จ', err?.statusMessage || '')
  } finally {
    isSending.value = false
  }
}

// Real-time update handlers for edit/unsend
function handleMessageEdited(msg) {
  const targetId = msg.id || msg.messageId
  const idx = messages.value.findIndex(m => m.id === targetId)
  if (idx !== -1) {
    if (msg.content) messages.value[idx].content = msg.content
    if (msg.metadata) messages.value[idx].metadata = msg.metadata
  }
}

function handleMessageUnsent({ messageId, isUnsent, content }) {
  const idx = messages.value.findIndex(m => m.id === messageId)
  if (idx !== -1) {
    messages.value[idx].isUnsent = isUnsent
    if (content) messages.value[idx].content = content
  }
}

function handleShareLocation() {
  if (!navigator.geolocation) {
    toast.error('ไม่รองรับ GPS', 'เบราว์เซอร์ไม่รองรับ Geolocation')
    return
  }

  // Toggle: stop if already tracking
  if (isTrackingLocation.value) {
    isTrackingLocation.value = false
    // Revoke the shared location card so all participants see "หยุดแชร์ตำแหน่งแล้ว"
    currentSessionLocationIds.forEach(id => handleRevokeLocation(id))
    currentSessionLocationIds.length = 0
    toast.success('หยุดแชร์ตำแหน่งแล้ว')
    return
  }

  // Reset session tracker
  currentSessionLocationIds.length = 0

  const onError = () => {
    toast.error('ไม่สามารถเข้าถึง GPS', 'กรุณาอนุญาตให้แอปเข้าถึงตำแหน่ง')
    isTrackingLocation.value = false
  }

  // ส่งตำแหน่งครั้งเดียว — ไม่ repeat ทุกๆนาที
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const msg = await shareLocation(sessionId.value, pos.coords.latitude, pos.coords.longitude)
        const msgData = msg?.data || msg
        if (!messages.value.some(m => m.id === msgData.id)) {
          messages.value.push(msgData)
          scrollToBottom()
        }
        if (msgData.id) currentSessionLocationIds.push(msgData.id)
        // broadcast to all participants via socket
        emitNewMessage(sessionId.value, msgData)
      } catch (err) {
        toast.error('แชร์ตำแหน่งล้มเหลว', err?.statusMessage || '')
        isTrackingLocation.value = false
      }
    },
    onError,
    { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
  )
  isTrackingLocation.value = true
  toast.success('แชร์ตำแหน่งแล้ว')
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
const handleOffline = () => {
  toast.error('ขาดการเชื่อมต่อ', 'กำลังรอเครือข่าย...')
}

const handleOnline = () => {
  toast.success('กลับมาเชื่อมต่อแล้ว', 'ระบบออนไลน์ปกติ')
}

onMounted(() => {
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)

  // Load persisted revoked location IDs from localStorage
  revokedLocationIds.value = loadRevokedFromStorage()
  loadMessages()
  // Connect Socket.IO for real-time chat
  if (token.value) {
    connectChatSocket(token.value)
    joinSession(sessionId.value)
    onNewMessage(handleIncomingMessage)
    onMessageEdited(handleMessageEdited)
    onMessageUnsent(handleMessageUnsent)
    onTyping(handleTyping)
    onStopTyping(handleStopTyping)
    onLocationRevoked(handleLocationRevoked)
  }
})
onUnmounted(() => {
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)

  // Stop location watch if still active
  if (locationWatchId !== null) {
    navigator.geolocation?.clearWatch(locationWatchId)
    locationWatchId = null
  }
  leaveSession(sessionId.value)
  offNewMessage(handleIncomingMessage)
  offMessageEdited(handleMessageEdited)
  offMessageUnsent(handleMessageUnsent)
  offTyping(handleTyping)
  offStopTyping(handleStopTyping)
  offLocationRevoked(handleLocationRevoked)
  // Don't disconnect socket entirely — shared across pages
})
</script>
