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

    <!-- Toast: Arrival Alerts (Real-time, no refresh needed) -->
    <transition-group name="toast" tag="div"
      class="absolute top-24 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4 pointer-events-none">
      <div v-for="(alert, idx) in visibleAlerts" :key="alert.timestamp + '-' + idx"
        class="max-w-lg w-full bg-green-600 text-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 pointer-events-auto animate-slideDown">
        <span class="text-2xl shrink-0">{{ alertIcon(alert.radiusType) }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold">{{ alert.title }}</p>
          <p class="text-xs opacity-90 truncate">{{ alert.body }}</p>
        </div>
        <button @click="dismissAlert(idx)" class="p-1 rounded-full hover:bg-white/20 transition cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>

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

        <!-- Pickup location info -->
        <div v-if="pickupInfo" class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
          <span class="text-lg">📍</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-green-700">จุดรับผู้โดยสาร</p>
            <p class="text-xs text-slate-500 truncate">{{ pickupInfo.name || pickupInfo.address || 'ตำแหน่งปักหมุด' }}</p>
          </div>
          <div v-if="etaText" class="px-2 py-1 bg-green-50 rounded-lg">
            <p class="text-xs font-bold text-green-700">{{ etaText }}</p>
          </div>
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

const config = useRuntimeConfig()
const route = useRoute()
const { user, token } = useAuth()
const {
  myPosition,
  participants,
  isConnected,
  signalLost,
  arrivalAlerts,
  startTracking,
  stopTracking,
  createMyMarker,
  addPickupMarker,
  drawRouteToPickup,
  haversineDistance,
} = useLocationTracking()

const routeId = computed(() => route.params.routeId)
const userRole = computed(() => user.value?.role || 'PASSENGER')
const participantCount = computed(() => participants.size)

const mapEl = ref(null)
let map = null
let myMarker = null

const pickupInfo = ref(null)
const pickupLatLng = ref(null)
const etaText = ref('')
let routeUpdateThrottle = 0

// Toast system for arrival alerts
const visibleAlerts = ref([])
let alertTimers = []

watch(arrivalAlerts, (alerts) => {
  if (alerts.length === 0) return
  const latest = alerts[alerts.length - 1]
  visibleAlerts.value.push(latest)

  const timer = setTimeout(() => {
    visibleAlerts.value = visibleAlerts.value.filter(a => a !== latest)
  }, 8000)
  alertTimers.push(timer)
})

function dismissAlert(idx) {
  visibleAlerts.value.splice(idx, 1)
}

function alertIcon(type) {
  const icons = { FIVE_KM: '🚗', ONE_KM: '🏃', ZERO_KM: '✅', MANUAL: '🔔' }
  return icons[type] || '🔔'
}

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
  if (pickupLatLng.value) bounds.extend(pickupLatLng.value)
  map.fitBounds(bounds, { top: 120, bottom: 200, left: 40, right: 40 })
}

// Fetch booking data to get pickup location
async function fetchPickupLocation() {
  try {
    const apiBase = config.public.apiBase || '/api'
    const url = apiBase.startsWith('http')
      ? `${apiBase}/bookings/route/${routeId.value}`
      : `/api/bookings/route/${routeId.value}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.value}` },
    })

    if (!res.ok) return

    const json = await res.json()
    const bookings = json.data || json

    // Find the first booking with a pickupLocation
    const bookingList = Array.isArray(bookings) ? bookings : [bookings]
    for (const b of bookingList) {
      if (b.pickupLocation?.lat && b.pickupLocation?.lng) {
        pickupInfo.value = b.pickupLocation
        pickupLatLng.value = { lat: b.pickupLocation.lat, lng: b.pickupLocation.lng }
        break
      }
    }
  } catch (err) {
    console.warn('[Tracking] Failed to fetch pickup location:', err.message)
  }
}

// Update the route line when driver moves (responsive real-time)
let lastRouteDriverPos = null
function updateRouteLine(driverPos) {
  if (!pickupLatLng.value || !map) return
  const now = Date.now()

  // Check if driver moved significantly (>50m) → update immediately
  let movedFar = false
  if (lastRouteDriverPos) {
    const dist = haversineDistance(lastRouteDriverPos.lat, lastRouteDriverPos.lng, driverPos.lat, driverPos.lng)
    movedFar = dist > 50
  }

  // Throttle: update every 3 seconds OR immediately if moved >50m
  if (!movedFar && now - routeUpdateThrottle < 3000) return
  routeUpdateThrottle = now
  lastRouteDriverPos = { ...driverPos }
  drawRouteToPickup(map, driverPos, pickupLatLng.value)
}

// Watch driver's position (find the DRIVER in participants and update route line)
watch(
  () => [...participants.entries()],
  (entries) => {
    for (const [, p] of entries) {
      if (p.role === 'DRIVER' && p.lat) {
        updateRouteLine({ lat: p.lat, lng: p.lng })
        return
      }
    }
  },
  { deep: true }
)

// If I am the driver, also draw route based on my own position
watch(myPosition, (pos) => {
  if (!pos.lat || !map) return
  if (!myMarker) myMarker = createMyMarker(map)
  myMarker.setPosition({ lat: pos.lat, lng: pos.lng })
  if (participants.size === 0) map.panTo({ lat: pos.lat, lng: pos.lng })

  if (userRole.value === 'DRIVER') {
    updateRouteLine(pos)
  }
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

  // Fetch booking pickup and place green marker
  fetchPickupLocation().then(() => {
    if (pickupLatLng.value && map) {
      addPickupMarker(map, pickupLatLng.value.lat, pickupLatLng.value.lng, pickupInfo.value?.name || 'จุดรับผู้โดยสาร')

      // Initial route draw if we have our position
      if (myPosition.value.lat && userRole.value === 'DRIVER') {
        drawRouteToPickup(map, myPosition.value, pickupLatLng.value)
      }

      // Fit map to include pickup
      setTimeout(() => fitAllMarkers(), 2000)
    }
  })
}

onMounted(() => {
  const tryInit = () => {
    if (window.google?.maps) initMap()
    else setTimeout(tryInit, 500)
  }
  tryInit()
})

onUnmounted(() => {
  alertTimers.forEach(t => clearTimeout(t))
  stopTracking()
})
</script>

<style scoped>
.toast-enter-active {
  animation: slideDown 0.4s ease-out;
}
.toast-leave-active {
  animation: slideUp 0.3s ease-in forwards;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes slideUp {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px) scale(0.95); }
}

.animate-slideDown {
  animation: slideDown 0.4s ease-out;
}
</style>
