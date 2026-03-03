<template>
  <div
    class="flex mb-3"
    :class="isOwn ? 'justify-end' : 'justify-start'"
  >
    <div
      data-testid="chat-message"
      class="relative max-w-[75%] rounded-2xl shadow-sm group"
      :class="bubbleClass"
    >
      <!-- System message -->
      <template v-if="message.type === 'SYSTEM'">
        <div class="px-4 py-2.5">
          <p class="text-xs text-center text-slate-500 italic">{{ message.content }}</p>
        </div>
      </template>

      <!-- Image message -->
      <template v-else-if="message.type === 'IMAGE' && message.imageUrl">
        <div class="overflow-hidden rounded-2xl cursor-pointer" @click="showLightbox = true">
          <img
            :src="message.imageUrl"
            alt="Chat image"
            class="max-w-full max-h-64 object-cover rounded-2xl"
            loading="lazy"
          />
        </div>
        <div class="px-4 py-1.5">
          <div class="flex items-center gap-1.5" :class="isOwn ? 'justify-end' : 'justify-start'">
            <span class="text-[10px] opacity-50">{{ formatTime(message.createdAt) }}</span>
          </div>
        </div>
      </template>

      <!-- Location message -->
      <template v-else-if="message.type === 'LOCATION'">
        <!-- REVOKED state -->
        <div
          v-if="isRevoked"
          class="w-[260px]"
          :class="!isOwn ? 'cursor-pointer' : ''"
          @click="!isOwn && onClickRevoked()"
          data-testid="revoked-location-card"
        >
          <div class="px-4 py-5 flex flex-col items-center gap-1" :class="isOwn ? 'text-white/70' : 'text-slate-400'">
            <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
            <span class="text-xs font-medium">หยุดแชร์ตำแหน่งแล้ว</span>
            <span class="text-[10px] opacity-50 mt-0.5">{{ formatTime(message.createdAt) }}</span>
          </div>
        </div>

        <!-- ACTIVE state: has coords -->
        <template v-else-if="locationCoords">
          <a
            :href="`https://www.google.com/maps?q=${locationCoords.lat},${locationCoords.lng}`"
            target="_blank"
            rel="noopener"
            class="block overflow-hidden no-underline"
          >
            <!-- Map preview card -->
            <div class="w-[260px] h-[140px] relative overflow-hidden"
              :style="`background: linear-gradient(135deg, ${isOwn ? '#3b82f6' : '#e2e8f0'} 0%, ${isOwn ? '#1d4ed8' : '#cbd5e1'} 100%)`"
            >
              <!-- Grid pattern to mimic map -->
              <div class="absolute inset-0 opacity-10"
                :style="`background-image: linear-gradient(${isOwn ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isOwn ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.1)'} 1px, transparent 1px); background-size: 20px 20px;`"
              />
              <!-- Center pin + "เปิดใน Google Maps" label -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="flex flex-col items-center gap-1.5">
                  <svg class="w-10 h-10 drop-shadow-lg" :class="isOwn ? 'text-white' : 'text-red-500'" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <!-- "เปิดใน Google Maps" replaces lat/lng -->
                  <div class="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium shadow-sm"
                    :class="isOwn ? 'bg-white/20 text-white' : 'bg-white text-slate-600'"
                  >
                    <span>เปิดใน Google Maps</span>
                    <svg class="w-3 h-3" :class="isOwn ? 'text-white/70' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </div>
                </div>
              </div>
              <!-- Timestamp bottom-right of map card -->
              <div class="absolute bottom-2 right-2">
                <span class="text-[10px] px-1.5 py-0.5 rounded"
                  :class="isOwn ? 'text-white/50 bg-black/10' : 'text-slate-500 bg-white/50'">
                  {{ formatTime(message.createdAt) }}
                </span>
              </div>
            </div>
          </a>
          <!-- Bottom bar: stop button (sender) + timestamp -->
          <div class="px-3 py-2 flex items-center" :class="isOwn ? 'bg-blue-700 justify-between' : 'bg-slate-100 justify-end'">
            <button
              v-if="isOwn"
              @click.prevent="$emit('revoke-location', message.id)"
              class="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white transition-colors cursor-pointer"
              title="หยุดแชร์ตำแหน่ง"
              data-testid="stop-share-in-card"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
              หยุดแชร์ตำแหน่ง
            </button>
          </div>
        </template>

        <!-- Fallback if no coords -->
        <div v-else class="px-4 py-2.5 flex items-center gap-2">
          <span class="text-lg">📍</span>
          <span class="text-sm">แชร์ตำแหน่ง</span>
        </div>
        <div v-if="!locationCoords && !isRevoked" class="px-4 pb-1.5">
          <span class="text-[10px] opacity-50">{{ formatTime(message.createdAt) }}</span>
        </div>
      </template>

      <!-- Unsent message -->
      <template v-else-if="message.isUnsent">
        <div class="px-4 py-2.5">
          <p class="text-sm italic opacity-60">ข้อความถูกลบ</p>
        </div>
      </template>

      <!-- Text message -->
      <template v-else>
        <div class="px-4 py-2.5 flex flex-col">
          <!-- Edit Histories -->
          <div v-if="showEditHistory && message.metadata?.editHistory?.length" class="mb-3 flex flex-col gap-2">
               <div class="text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity" :class="isOwn ? 'text-white/90 self-end' : 'text-blue-600 self-start'" @click.stop="showEditHistory = false">
                  ซ่อนการแก้ไข
               </div>
               <div v-for="(hist, idx) in message.metadata.editHistory" :key="idx" class="border rounded-2xl px-3 py-1.5 text-sm max-w-full break-words" :class="isOwn ? 'border-white/30 text-white/70 self-end' : 'border-slate-300 text-slate-600 self-start'">
                  {{ hist.content }}
               </div>
          </div>

          <p class="text-sm whitespace-pre-wrap break-words leading-relaxed" :class="showEditHistory && isOwn ? 'self-end' : showEditHistory && !isOwn ? 'self-start' : ''">{{ message.content }}</p>

          <!-- Filtered badge -->
          <span v-if="message.isFiltered && !message.isUnsent"
            class="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded">
            กรองเนื้อหาแล้ว
          </span>

          <!-- Timestamp -->
          <div class="flex items-center gap-1.5 mt-1" :class="isOwn ? 'justify-end' : 'justify-start'">
            <span v-if="message.metadata?.isEdited && !showEditHistory" class="text-[10px] font-medium cursor-pointer hover:underline transition-colors font-bold" :class="isOwn ? 'text-white/90' : 'text-blue-600'" @click.stop="showEditHistory = true">
              มีการแก้ไข
            </span>
            <span class="text-[10px] opacity-50">{{ formatTime(message.createdAt) }}</span>
          </div>
        </div>
      </template>

      <!-- Three dots menu (own messages only, visible on hover, within 5 min window) -->
      <div
        v-if="isOwn && canShowMenu"
        class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div class="relative">
          <button
            data-testid="message-menu-btn"
            @click.stop="showMenu = !showMenu"
            class="p-1.5 bg-white rounded-full shadow-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="ตัวเลือกเพิ่มเติม"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="showMenu"
            class="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1"
            @mouseleave="showMenu = false"
          >
            <!-- Edit count info (show only when not at max) -->
            <div v-if="editCount < MAX_EDITS" class="px-3 py-2 text-xs border-b border-slate-100">
              <p v-if="editCount > 0" class="text-slate-500">แก้ไขแล้ว {{ editCount }} ครั้ง</p>
              <p v-else class="text-slate-500">สามารถแก้ไขได้ไม่เกิน 3 ครั้ง</p>
              <p class="text-amber-600">เหลืออีก {{ remainingEdits }} ครั้ง</p>
            </div>

            <button
              data-testid="edit-message-btn"
              v-if="canEdit"
              @click.stop="$emit('edit', message); showMenu = false"
              class="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไขข้อความ
              <span class="ml-auto text-xs text-slate-400">({{ editCount }})</span>
            </button>
            <button
              data-testid="edit-message-btn"
              v-else-if="editCount >= MAX_EDITS"
              disabled
              class="w-full px-3 py-2 text-left text-sm text-slate-400 flex items-center gap-2 cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไขข้อความ
              <span class="ml-auto text-xs">(ครบ 3 ครั้ง)</span>
            </button>
            <button
              data-testid="unsend-message-btn"
              v-if="canUnsend"
              @click.stop="$emit('unsend', message.id); showMenu = false"
              class="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ยกเลิกข้อความ
            </button>
          </div>
        </div>
      </div>

      <!-- Report (other's messages) -->
      <div v-if="!isOwn && !message.isUnsent && message.type !== 'SYSTEM'" class="absolute -top-2 -right-2">
        <button
          @click="$emit('report', message)"
          class="p-1 bg-white rounded-full shadow-md text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
          title="รายงานข้อความ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Image Lightbox -->
    <Teleport to="body">
      <div v-if="showLightbox" class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" @click="showLightbox = false">
        <button @click="showLightbox = false" class="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition cursor-pointer">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img :src="message.imageUrl" alt="Full size image" class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  message: { type: Object, required: true },
  isOwn: { type: Boolean, default: false },
  isRevoked: { type: Boolean, default: false },
})

defineEmits(['edit', 'unsend', 'report', 'revoke-location'])

const { toast } = useToast()
const showLightbox = ref(false)
const showEditHistory = ref(false)
const showMenu = ref(false)
const now = ref(new Date())
let clockTimer = null

onMounted(() => { clockTimer = setInterval(() => { now.value = new Date() }, 10000) })
onUnmounted(() => { clearInterval(clockTimer) })

function onClickRevoked() {
  toast.error('ผู้ใช้ได้ทำการหยุดแชร์ตำแหน่งแล้ว', 'ไม่สามารถเข้าถึงตำแหน่งของผู้ใช้ได้')
}

const locationCoords = computed(() => {
  const meta = props.message.metadata
  if (!meta) return null
  const lat = Number(meta.lat ?? meta.latitude)
  const lng = Number(meta.lng ?? meta.lon ?? meta.longitude)
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null
  return { lat, lng }
})

const bubbleClass = computed(() => {
  if (props.message.type === 'SYSTEM') {
    return 'bg-slate-50 text-slate-500 max-w-full rounded-lg'
  }
  if (props.message.type === 'IMAGE') {
    return props.isOwn
      ? 'bg-primary/10 rounded-br-md'
      : 'bg-white border border-slate-200 rounded-bl-md'
  }
  return props.isOwn
    ? 'bg-primary text-white rounded-br-md'
    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
})

const MAX_EDITS = 3

const editCount = computed(() => {
  return props.message.metadata?.editHistory?.length || 0
})

const remainingEdits = computed(() => {
  return MAX_EDITS - editCount.value
})

const canEdit = computed(() => {
  if (!props.message.unsendDeadline) return false
  if (props.message.isUnsent) return false
  if (props.message.type !== 'TEXT') return false
  if (editCount.value >= MAX_EDITS) return false
  return now.value < new Date(props.message.unsendDeadline)
})

const canShowMenu = computed(() => {
  if (!props.message.unsendDeadline) return false
  if (props.message.isUnsent) return false
  if (props.message.type !== 'TEXT') return false
  return now.value < new Date(props.message.unsendDeadline)
})

const canUnsend = computed(() => {
  if (!props.message.unsendDeadline) return false
  if (props.message.isUnsent) return false
  return now.value < new Date(props.message.unsendDeadline)
})

const formatTime = (date) => dayjs(date).format('HH:mm')
</script>
