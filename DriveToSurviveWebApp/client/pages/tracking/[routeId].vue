<template>
  <div class="relative h-screen w-full">
    <!-- Map -->
    <div ref="mapEl" class="absolute inset-0 z-0"></div>

    <!-- Top bar -->
    <div class="absolute top-0 left-0 right-0 z-10 p-4">
      <div class="mx-auto max-w-lg bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink :to="userRole === 'DRIVER' ? '/myRoute' : '/myTrip'"
              class="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </NuxtLink>
            <div>
              <h2 class="text-sm font-semibold text-primary">ติดตามตำแหน่ง</h2>
              <p class="text-xs text-slate-500">{{ participantCount }} คนกำลังแชร์ตำแหน่ง</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'"></span>
            <span class="text-xs text-slate-500">{{ isConnected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Signal Loss -->
    <div v-if="signalLost" class="absolute top-24 left-0 right-0 z-10 px-4">
      <div class="mx-auto max-w-lg bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
        <p class="text-xs font-medium text-amber-700">⚠️ สัญญาณ GPS ขาดหาย — ตำแหน่งอาจไม่เป็นปัจจุบัน</p>
      </div>
    </div>

    <!-- Bottom: Participants list -->
    <div class="absolute bottom-0 left-0 right-0 z-10 p-4">
      <div class="mx-auto max-w-lg bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-700">ผู้ร่วมทริป</h3>
          <button @click="fitAllMarkers"
            class="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition cursor-pointer">
            📍 ดูทั้งหมด
          </button>
        </div>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div v-for="[id, p] in participants" :key="id"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              :class="p.role === 'DRIVER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'">
              {{ p.role === 'DRIVER' ? '🚗' : '👤' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-700 truncate">{{ p.name || (p.role === 'DRIVER' ? 'คนขับ' : 'ผู้โดยสาร') }}</p>
              <p class="text-xs text-slate-400">{{ p.role === 'DRIVER' ? 'คนขับ' : 'ผู้โดยสาร' }}
                <span v-if="myPosition.lat && p.lat"> — {{ formatDistance(haversineDistance(myPosition.lat, myPosition.lng, p.lat, p.lng)) }}</span>
              </p>
            </div>
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          </div>
          <p v-if="participants.size === 0" class="text-xs text-slate-400 text-center py-2">รอผู้ร่วมทริปออนไลน์...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLocationTracking } from '~/composables/useLocationTracking'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ middleware: 'auth', layout: false })
useHead({ title: 'ติดตามตำแหน่ง — Ride' })

const route = useRoute()
const { user, token } = useAuth()
const {
  myPosition,
  participants,
  isConnected,
  signalLost,
  startTracking,
  stopTracking,
  createMyMarker,
  haversineDistance,
} = useLocationTracking()

const routeId = computed(() => route.params.routeId)
const userRole = computed(() => user.value?.role || 'PASSENGER')
const participantCount = computed(() => participants.size)

const mapEl = ref(null)
let map = null
let myMarker = null

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} ม.`
  return `${(meters / 1000).toFixed(1)} กม.`
}

function fitAllMarkers() {
  if (!map || !myPosition.value.lat) return
  const bounds = new google.maps.LatLngBounds()
  bounds.extend({ lat: myPosition.value.lat, lng: myPosition.value.lng })
  participants.forEach(p => {
    if (p.lat) bounds.extend({ lat: p.lat, lng: p.lng })
  })
  map.fitBounds(bounds, { top: 120, bottom: 200, left: 40, right: 40 })
}

// Update my marker
watch(myPosition, (pos) => {
  if (!pos.lat || !map) return
  if (!myMarker) myMarker = createMyMarker(map)
  myMarker.setPosition({ lat: pos.lat, lng: pos.lng })
  if (participants.size === 0) map.panTo({ lat: pos.lat, lng: pos.lng })
})

function initMap() {
  if (!mapEl.value || !window.google?.maps) return
  map = new google.maps.Map(mapEl.value, {
    center: { lat: 16.4322, lng: 102.8236 },
    zoom: 14,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    styles: [
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    ],
  })

  myMarker = createMyMarker(map)
  const myName = user.value?.firstName || ''
  startTracking(routeId.value, token.value, map, myName)

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        map.setCenter(center)
        map.setZoom(15)
        if (myMarker) myMarker.setPosition(center)
      },
      () => {}
    )
  }
}

onMounted(() => {
  const tryInit = () => {
    if (window.google?.maps) initMap()
    else setTimeout(tryInit, 500)
  }
  tryInit()
})

onUnmounted(() => stopTracking())
</script>
