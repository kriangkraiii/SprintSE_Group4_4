<template>
  <div
    class="flex mb-3"
    :class="isOwn ? 'justify-end' : 'justify-start'"
  >
    <div
      class="relative max-w-[75%] rounded-2xl shadow-sm"
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
        <a
          v-if="locationCoords"
          :href="`https://www.google.com/maps?q=${locationCoords.lat},${locationCoords.lng}`"
          target="_blank"
          rel="noopener"
          class="block overflow-hidden rounded-2xl no-underline"
        >
          <!-- Map preview card -->
          <div class="w-[260px] h-[140px] relative overflow-hidden"
            :style="`background: linear-gradient(135deg, ${isOwn ? '#3b82f6' : '#e2e8f0'} 0%, ${isOwn ? '#1d4ed8' : '#cbd5e1'} 100%)`"
          >
            <!-- Grid pattern to mimic map -->
            <div class="absolute inset-0 opacity-10"
              :style="`background-image: linear-gradient(${isOwn ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isOwn ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.1)'} 1px, transparent 1px); background-size: 20px 20px;`"
            />
            <!-- Center pin -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="flex flex-col items-center">
                <svg class="w-10 h-10 drop-shadow-lg" :class="isOwn ? 'text-white' : 'text-red-500'" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div class="mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm"
                  :class="isOwn ? 'bg-white/20 text-white' : 'bg-white text-slate-600'"
                >
                  {{ locationCoords.lat.toFixed(4) }}, {{ locationCoords.lng.toFixed(4) }}
                </div>
              </div>
            </div>
          </div>
          <!-- Bottom bar -->
          <div class="px-3 py-2 flex items-center gap-2" :class="isOwn ? 'bg-blue-700' : 'bg-slate-100'">
            <span class="text-sm">📍</span>
            <span class="text-xs flex-1 font-medium" :class="isOwn ? 'text-white' : 'text-slate-600'">
              เปิดใน Google Maps
            </span>
            <svg class="w-3.5 h-3.5" :class="isOwn ? 'text-white/60' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            <span class="text-[10px]" :class="isOwn ? 'text-white/50' : 'text-slate-400'">{{ formatTime(message.createdAt) }}</span>
          </div>
        </a>
        <!-- Fallback if no coords -->
        <div v-else class="px-4 py-2.5 flex items-center gap-2">
          <span class="text-lg">📍</span>
          <span class="text-sm">แชร์ตำแหน่ง</span>
        </div>
        <div v-if="!locationCoords" class="px-4 pb-1.5">
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
        <div class="px-4 py-2.5">
          <p class="text-sm whitespace-pre-wrap break-words leading-relaxed">{{ message.content }}</p>

          <!-- Filtered badge -->
          <span v-if="message.isFiltered && !message.isUnsent"
            class="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded">
            กรองเนื้อหาแล้ว
          </span>

          <!-- Timestamp -->
          <div class="flex items-center gap-1.5 mt-1" :class="isOwn ? 'justify-end' : 'justify-start'">
            <span class="text-[10px] opacity-50">{{ formatTime(message.createdAt) }}</span>
          </div>
        </div>
      </template>

      <!-- Actions (own messages only) -->
      <div v-if="isOwn && canUnsend && !message.isUnsent" class="absolute -top-2 -left-2">
        <button
          @click="$emit('unsend', message.id)"
          class="p-1 bg-white rounded-full shadow-md text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          title="ยกเลิกข้อความ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  message: { type: Object, required: true },
  isOwn: { type: Boolean, default: false },
})

defineEmits(['unsend', 'report'])

const showLightbox = ref(false)

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

const canUnsend = computed(() => {
  if (!props.message.unsendDeadline) return false
  return new Date() < new Date(props.message.unsendDeadline)
})

const formatTime = (date) => dayjs(date).format('HH:mm')
</script>
