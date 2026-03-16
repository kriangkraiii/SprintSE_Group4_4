<template>
  <div class="relative h-screen w-full">
    <!-- Map -->
    <div ref="mapEl" class="absolute inset-0 z-0"></div>

    <!-- Locate Me FAB -->
    <button
      @click="handleLocateMe"
      :disabled="!geo.hasGps.value"
      :title="!geo.hasGps.value ? 'อุปกรณ์ไม่รองรับ GPS' : 'ตำแหน่งของฉัน'"
      class="absolute bottom-52 right-4 z-20 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      :class="geo.isActive.value
        ? 'bg-blue-500 text-white hover:bg-blue-600'
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'">
      <svg v-if="geo.isLocating.value" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
      </svg>
    </button>

    <!-- Top bar -->
    <div class="absolute top-0 left-0 right-0 z-10 p-4">
      <div class="mx-auto max-w-lg bg-white backdrop-blur-sm rounded-2xl shadow-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button @click="$router.back()"
              class="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
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
      <div class="mx-auto max-w-lg bg-white backdrop-blur-sm rounded-2xl shadow-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-700">ผู้ร่วมทริป</h3>
          <button @click="fitAllMarkers"
            class="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition cursor-pointer">
            📍 ดูทั้งหมด
          </button>
        </div>
        <div class="space-y-2 max-h-48 overflow-y-auto">
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
              <p v-if="p.lat" class="text-xs text-slate-400 font-mono">📍 {{ p.lat.toFixed(6) }}, {{ p.lng.toFixed(6) }}</p>
            </div>
            <div class="flex items-center gap-1">
              <a v-if="p.lat" :href="`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`" target="_blank" rel="noopener"
                class="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition" @click.stop>
                🗺️ นำทาง
              </a>
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            </div>
          </div>
          <p v-if="participants.size === 0" class="text-xs text-slate-400 text-center py-2">รอผู้ร่วมทริปออนไลน์...</p>
        </div>

        <!-- Route start/end & Google Maps direction -->
        <div v-if="routeInfo" class="mt-3 pt-3 border-t border-slate-100">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">🚗</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-blue-700">เส้นทาง</p>
              <p class="text-xs text-slate-500 truncate">
                {{ routeInfo.startName }} → {{ routeInfo.endName }}
              </p>
            </div>
          </div>

          <!-- Pickup info (only if different from route start) -->
          <div v-if="pickupInfo && pickupDiffersFromRouteStart" class="flex items-center gap-2 mb-2 px-2 py-1.5 bg-green-50 rounded-lg">
            <span class="text-base">📍</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-green-700">จุดขึ้นรถของคุณ</p>
              <p class="text-xs text-slate-500 truncate">{{ pickupInfo.name || pickupInfo.address || 'ตำแหน่งปักหมุด' }}</p>
            </div>
            <a v-if="pickupInfo.lat" :href="getNavUrl(pickupInfo)" target="_blank" rel="noopener"
              class="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition shrink-0" @click.stop>
              🗺️ นำทาง
            </a>
          </div>

          <a :href="getRouteNavUrl()" target="_blank" rel="noopener"
            class="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition">
            🗺️ เปิดเส้นทางใน Google Maps
          </a>
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
import { useGeolocation } from '~/composables/useGeolocation'

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
  pickupPosition,
  startTracking,
  stopTracking,
  setPickupLocation,
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
const geo = useGeolocation()
let locationMarkerObj = null

const pickupInfo = ref(null)
const pickupLatLng = ref(null)
const etaText = ref('')
const routeInfo = ref(null)
let routeUpdateThrottle = 0

// GPS Proximity polling (driver only)
const activeBookingIds = ref([])
let proximityPollInterval = null

// Toast system for arrival alerts
const visibleAlerts = ref([])
let alertTimers = []
let _lastAlertLen = 0

// track by length — reliably fires even when the array ref is replaced wholesale
watch(() => arrivalAlerts.value.length, (newLen) => {
  if (newLen <= _lastAlertLen) return
  for (let i = _lastAlertLen; i < newLen; i++) {
    const alert = arrivalAlerts.value[i]
    visibleAlerts.value.push(alert)
    const timer = setTimeout(() => {
      visibleAlerts.value = visibleAlerts.value.filter(a => a !== alert)
    }, 8000)
    alertTimers.push(timer)
  }
  _lastAlertLen = newLen
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

// --- Locate Me (GPS) ---
async function handleLocateMe() {
  if (geo.isLocating.value || !geo.hasGps.value) return
  const result = await geo.locate()
  if (result.isDefault) return
  if (map) {
    map.panTo({ lat: result.lat, lng: result.lng })
    map.setZoom(16)
    if (locationMarkerObj?.marker) locationMarkerObj.marker.setMap(null)
    if (locationMarkerObj?.circle) locationMarkerObj.circle.setMap(null)
    locationMarkerObj = geo.renderLocationMarker(map, result.lat, result.lng, result.accuracy)
  }
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

    // Find the first booking with a pickupLocation + collect active bookingIds
    const bookingList = Array.isArray(bookings) ? bookings : [bookings]
    const ids = []
    for (const b of bookingList) {
      if (b.pickupLocation?.lat && b.pickupLocation?.lng && !pickupInfo.value) {
        pickupInfo.value = b.pickupLocation
        pickupLatLng.value = { lat: b.pickupLocation.lat, lng: b.pickupLocation.lng }
      }
      if (b.id && ['CONFIRMED', 'IN_PROGRESS', 'confirmed', 'in_progress'].includes(b.status)) {
        ids.push(b.id)
      }
    }
    activeBookingIds.value = ids
  } catch (err) {
    console.warn('[Tracking] Failed to fetch pickup location:', err.message)
  }
}

// GPS Proximity polling — sends driver GPS to check arrival thresholds
function startProximityPolling() {
  if (proximityPollInterval) return
  console.log('[Proximity] Starting GPS polling for', activeBookingIds.value.length, 'bookings')

  proximityPollInterval = setInterval(async () => {
    const pos = myPosition.value
    if (!pos.lat || !pos.lng) return
    if (activeBookingIds.value.length === 0) return

    const apiBase = config.public.apiBase || '/api'
    const baseUrl = apiBase.startsWith('http') ? apiBase : '/api'

    for (const bookingId of activeBookingIds.value) {
      try {
        const res = await fetch(`${baseUrl}/arrival-notifications/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.value}`,
          },
          body: JSON.stringify({ bookingId, lat: pos.lat, lon: pos.lng }),
        })
        if (!res.ok) continue
        const json = await res.json()
        const data = json.data
        // If the API returned a new notification, show it as a toast
        if (data && data.notified && data.radiusType) {
          const titles = {
            FIVE_KM: '🚗 อยู่ห่างจุดรับ ~5 กม.',
            ONE_KM: '🏃 ใกล้ถึงจุดรับแล้ว ~1 กม.',
            ZERO_KM: '✅ ถึงจุดรับแล้ว!',
          }
          visibleAlerts.value.push({
            radiusType: data.radiusType,
            title: titles[data.radiusType] || 'แจ้งเตือนระยะทาง',
            body: `Booking ${bookingId.slice(0, 8)}...`,
            timestamp: Date.now(),
          })
          setTimeout(() => {
            visibleAlerts.value = visibleAlerts.value.filter(a => a.timestamp !== Date.now())
          }, 8000)
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    }
  }, 15000)
}

// Fetch route details to get start/end coordinates
async function fetchRouteInfo() {
  try {
    const apiBase = config.public.apiBase || '/api'
    const url = apiBase.startsWith('http')
      ? `${apiBase}/routes/${routeId.value}`
      : `/api/routes/${routeId.value}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (!res.ok) return

    const json = await res.json()
    const data = json.data || json

    if (data.startLocation && data.endLocation) {
      routeInfo.value = {
        startName: data.startLocation.name || data.startLocation.label || 'ต้นทาง',
        endName: data.endLocation.name || data.endLocation.label || 'ปลายทาง',
        startLat: data.startLocation.lat,
        startLng: data.startLocation.lng,
        startPlaceId: data.startLocation.placeId || null,
        endLat: data.endLocation.lat,
        endLng: data.endLocation.lng,
        endPlaceId: data.endLocation.placeId || null,
      }
    }
  } catch (err) {
    console.warn('[Tracking] Failed to fetch route info:', err.message)
  }
}

// Navigation URL helpers — use placeId for accuracy, fallback to coordinates
function getNavUrl(loc) {
  let url = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
  if (loc.placeId) url += `&destination_place_id=${loc.placeId}`
  return url
}

function getRouteNavUrl() {
  if (!routeInfo.value) return '#'
  const r = routeInfo.value
  let url = `https://www.google.com/maps/dir/?api=1&origin=${r.startLat},${r.startLng}&destination=${r.endLat},${r.endLng}`
  if (r.startPlaceId) url += `&origin_place_id=${r.startPlaceId}`
  if (r.endPlaceId) url += `&destination_place_id=${r.endPlaceId}`
  return url
}

// Only show pickup section if it's different from route start (>100m apart)
const pickupDiffersFromRouteStart = computed(() => {
  if (!pickupInfo.value?.lat || !routeInfo.value?.startLat) return false
  const dist = haversineDistance(pickupInfo.value.lat, pickupInfo.value.lng, routeInfo.value.startLat, routeInfo.value.startLng)
  return dist > 100
})

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
      addPickupMarker(map, pickupLatLng.value.lat, pickupLatLng.value.lng, pickupInfo.value?.name || 'จุดขึ้นรถ')

      // Set pickup location for proximity alerts
      setPickupLocation(pickupLatLng.value.lat, pickupLatLng.value.lng)

      // Initial route draw if we have our position
      if (myPosition.value.lat && userRole.value === 'DRIVER') {
        drawRouteToPickup(map, myPosition.value, pickupLatLng.value)
      }

      // Fit map to include pickup
      setTimeout(() => fitAllMarkers(), 2000)
    }

    // Start GPS proximity polling for driver
    if (userRole.value === 'DRIVER' && activeBookingIds.value.length > 0) {
      startProximityPolling()
    }
  })

  // Fetch route info for coordinates display
  fetchRouteInfo()
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
  if (proximityPollInterval) {
    clearInterval(proximityPollInterval)
    proximityPollInterval = null
  }
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
