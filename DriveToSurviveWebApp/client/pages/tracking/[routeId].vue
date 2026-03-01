<template>
  <div class="relative h-screen w-full">
    <!-- Map -->
    <div ref="mapEl" class="absolute inset-0 z-0"></div>

    <!-- Top bar -->
    <div class="absolute top-0 left-0 right-0 z-10 p-4">
      <div class="mx-auto max-w-lg bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink to="/myTrips" class="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </NuxtLink>
            <div>
              <h2 class="text-sm font-semibold text-primary">{{ isDriver ? '🚗 นำทาง — คนขับ' : '👤 ติดตามคนขับ' }}</h2>
              <p class="text-xs text-slate-500">{{ participantCount }} คนกำลังแชร์ตำแหน่ง</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Notification Bell -->
            <div class="relative">
              <button @click="showNotifPanel = !showNotifPanel"
                class="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer relative">
                <svg class="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V9a6 6 0 10-12 0v4c0 .918-.21 1.79-.595 2.595L4 17h5m6 0a3 3 0 11-6 0h6z" />
                </svg>
                <span v-if="unreadNotifs > 0" class="absolute w-2 h-2 rounded-full -top-0 -right-0 bg-red-500 ring-2 ring-white"></span>
              </button>
              <div v-if="showNotifPanel" class="absolute right-0 top-full mt-2 w-[300px] max-h-[50vh] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 class="text-sm font-semibold text-primary">การแจ้งเตือน</h3>
                  <button class="p-1 rounded-md cursor-pointer text-slate-400 hover:text-slate-600" @click="showNotifPanel = false">✕</button>
                </div>
                <div class="max-h-[40vh] overflow-y-auto">
                  <div v-if="notifications.length === 0" class="px-4 py-6 text-sm text-center text-slate-400">ไม่มีการแจ้งเตือน</div>
                  <div v-for="n in notifications" :key="n.id" class="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                    <p class="text-sm font-medium text-primary truncate">{{ n.title }}</p>
                    <p class="text-xs text-slate-500 line-clamp-2">{{ n.body }}</p>
                    <p class="text-xs text-slate-400 mt-1">{{ timeAgo(n.createdAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
            <span class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'"></span>
            <span class="text-xs text-slate-500">{{ isConnected ? 'เชื่อมต่อ' : 'กำลังเชื่อมต่อ...' }}</span>
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

    <!-- ═══════════════════════════════════════════════ -->
    <!-- DRIVER LEGEND: ลำดับจุดรับทั้งหมด + ปลายทาง    -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="isDriver && orderedPickups.length > 0" class="absolute top-24 right-4 z-10">
      <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[220px]">
        <h4 class="text-xs font-semibold text-slate-700 mb-2">🗺️ ลำดับไปรับ</h4>
        <div v-for="(pp, idx) in orderedPickups" :key="idx" class="flex items-center gap-2 mb-2">
          <span class="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 text-white"
            :style="{ backgroundColor: PICKUP_COLORS[idx % PICKUP_COLORS.length] }">
            {{ idx + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-slate-700 truncate">📍 {{ pp.passengerName }}</p>
            <p class="text-[10px] text-slate-400 truncate">{{ pp.name }}</p>
          </div>
          <a :href="googleMapsPointUrl(pp.lat, pp.lng)" target="_blank"
            class="p-1 rounded-md hover:bg-slate-100 transition" title="นำทางไปจุดนี้">
            <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5L18.5 12 14 16.5v-2z"/></svg>
          </a>
        </div>
        <div class="mt-1 pt-2 border-t border-slate-100 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 bg-red-500 text-white">🏁</span>
          <p class="text-xs text-slate-600 truncate flex-1">{{ routeDestName || 'ปลายทาง' }}</p>
        </div>
        <!-- Open Google Maps with full route -->
        <a :href="driverGoogleMapsUrl" target="_blank"
          class="mt-3 flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-xl transition">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          เปิด Google Maps นำทาง
        </a>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- PASSENGER LEGEND: คนขับ ETA + จุดรับ/ส่งของฉัน  -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="!isDriver" class="absolute top-24 right-4 z-10">
      <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[230px]">
        <h4 class="text-xs font-semibold text-slate-700 mb-2">🚗 สถานะคนขับ</h4>
        <!-- Driver ETA -->
        <div class="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg">
          <span class="text-lg">🚗</span>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-blue-800">{{ driverEtaText }}</p>
            <p class="text-[10px] text-blue-600" v-if="driverDistText">ห่าง {{ driverDistText }}</p>
          </div>
        </div>
        <!-- My Pickup -->
        <div v-if="myPickup" class="flex items-center gap-2 mb-2">
          <span class="w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 bg-emerald-500 text-white">📍</span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-slate-700 truncate">จุดรับ</p>
            <p class="text-[10px] text-slate-400 truncate">{{ myPickup.name }}</p>
          </div>
        </div>
        <!-- Destination -->
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 bg-red-500 text-white">🏁</span>
          <p class="text-xs text-slate-600 truncate flex-1">{{ routeDestName || 'ปลายทาง' }}</p>
        </div>
        <!-- Open Google Maps: pickup -->
        <a v-if="myPickup" :href="passengerGoogleMapsUrl" target="_blank"
          class="mt-3 flex items-center justify-center gap-2 w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-xl transition">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          นำทางไปจุดรับ
        </a>
      </div>
    </div>

    <!-- Bottom Panel -->
    <div class="absolute bottom-0 left-0 right-0 z-10 p-4">
      <div class="mx-auto max-w-lg bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        <div class="flex border-b border-slate-100">
          <button @click="bottomTab = 'participants'"
            class="flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer"
            :class="bottomTab === 'participants' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'">
            👥 ผู้ร่วมทริป ({{ participantCount }})
          </button>
          <button @click="openChatTab"
            class="flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer relative"
            :class="bottomTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'">
            💬 แชท
            <span v-if="unreadChat > 0" class="absolute top-2 right-6 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{{ unreadChat > 9 ? '9+' : unreadChat }}</span>
          </button>
        </div>

        <!-- Participants Tab -->
        <div v-if="bottomTab === 'participants'" class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-slate-700">ผู้ร่วมทริป</h3>
            <button @click="fitAllMarkers" class="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition cursor-pointer">📍 ดูทั้งหมด</button>
          </div>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div v-for="[id, p] in participants" :key="id" class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm" :class="p.role === 'DRIVER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'">
                {{ p.role === 'DRIVER' ? '🚗' : '👤' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-700 truncate">{{ p.name || (p.role === 'DRIVER' ? 'คนขับ' : 'ผู้โดยสาร') }}</p>
                <p class="text-xs text-slate-400">{{ p.role === 'DRIVER' ? 'คนขับ' : 'ผู้โดยสาร' }}
                  <span v-if="myPosition.lat && p.lat"> — {{ formatDist(haversineDistance(myPosition.lat, myPosition.lng, p.lat, p.lng)) }}</span>
                </p>
              </div>
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            </div>
            <p v-if="participants.size === 0" class="text-xs text-slate-400 text-center py-2">รอผู้ร่วมทริปออนไลน์...</p>
          </div>
        </div>

        <!-- Chat Tab -->
        <div v-if="bottomTab === 'chat'" class="flex flex-col" style="height: 320px;">
          <div ref="chatMessagesEl" class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <div v-if="isChatLoading" class="text-center py-4 text-xs text-slate-400">กำลังโหลดข้อความ...</div>
            <template v-else>
              <div v-for="msg in chatMessages" :key="msg.id" class="flex" :class="msg.senderId === visibleUserId ? 'justify-end' : 'justify-start'">
                <div v-if="msg.type === 'SYSTEM'" class="w-full text-center py-1">
                  <span class="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{{ msg.content }}</span>
                </div>
                <template v-else>
                  <div class="max-w-[75%]">
                    <p v-if="msg.senderId !== visibleUserId" class="text-[10px] text-slate-400 mb-0.5 ml-1">{{ msg.senderName || 'ผู้ใช้' }}</p>
                    <div class="px-3 py-2 rounded-2xl text-sm" :class="msg.senderId === visibleUserId ? 'bg-primary text-white rounded-br-md' : 'bg-slate-100 text-slate-700 rounded-bl-md'">
                      <template v-if="msg.type === 'LOCATION' && msg.metadata">
                        <a :href="`https://www.google.com/maps?q=${msg.metadata.lat},${msg.metadata.lng}`" target="_blank" class="underline">📍 ดูตำแหน่ง</a>
                      </template>
                      <template v-else-if="msg.type === 'IMAGE' && msg.imageUrl"><img :src="msg.imageUrl" class="max-w-full rounded-lg" /></template>
                      <template v-else>{{ msg.content }}</template>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>
          <div class="px-4 py-2 border-t border-slate-100">
            <div class="flex items-center gap-2">
              <button @click="chatShareLocation" class="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition cursor-pointer">📍</button>
              <input v-model="chatInput" @keydown.enter.prevent="sendChatMessage"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="พิมพ์ข้อความ..." :disabled="isChatSending" />
              <button @click="sendChatMessage" :disabled="!chatInput.trim() || isChatSending"
                class="p-2 bg-cta text-white rounded-xl hover:bg-cta-hover transition disabled:opacity-40 cursor-pointer">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useLocationTracking } from '~/composables/useLocationTracking'
import { useChat } from '~/composables/useChat'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth', layout: false })
useHead({ title: 'ติดตามตำแหน่ง — Ride' })

const route = useRoute()
const { user, token } = useAuth()
const { toast } = useToast()
const {
  myPosition, participants, isConnected, signalLost,
  startTracking, stopTracking, createMyMarker, haversineDistance,
} = useLocationTracking()
const {
  createSession: createChatSession, fetchMessages, sendMessage, shareLocation,
  connectChatSocket, joinSession, leaveSession, onNewMessage, offNewMessage,
  emitNewMessage,
} = useChat()

const routeId = computed(() => route.params.routeId)
const visibleUserId = computed(() => user.value?.id)
const participantCount = computed(() => participants.size)

const mapEl = ref(null)
let map = null
let myMarker = null
let directionsRenderer = null

const PICKUP_COLORS = ['#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#E8491D']
const bottomTab = ref('participants')

// ─── Role Detection ──────────────────────────
const routeData = ref(null)
const isDriver = computed(() => {
  if (!routeData.value || !visibleUserId.value) return false
  return routeData.value.driverId === visibleUserId.value
})

const routeStartName = ref('')
const routeDestName = ref('')
const orderedPickups = ref([])
let pickupMarkers = []
let routeRedrawTimer = null

// Passenger-specific: my booking data
const myPickup = computed(() => {
  if (isDriver.value || !routeData.value?.bookings) return null
  const myBooking = routeData.value.bookings.find(
    b => b.passengerId === visibleUserId.value || b.passenger?.id === visibleUserId.value
  )
  if (!myBooking?.pickupLocation?.lat) return null
  return {
    lat: myBooking.pickupLocation.lat,
    lng: myBooking.pickupLocation.lng,
    name: myBooking.pickupLocation.name || 'จุดนัดรับ',
    dropLat: myBooking.dropoffLocation?.lat,
    dropLng: myBooking.dropoffLocation?.lng,
    dropName: myBooking.dropoffLocation?.name || 'จุดส่ง',
  }
})

// ─── Driver ETA (for passenger view) ─────────
const driverEtaText = ref('กำลังหาตำแหน่งคนขับ...')
const driverDistText = ref('')

function findDriverParticipant() {
  for (const [, p] of participants) {
    if (p.role === 'DRIVER' && p.lat) return p
  }
  return null
}

function updateDriverEta() {
  if (isDriver.value) return
  const driver = findDriverParticipant()
  if (!driver || !myPickup.value) {
    driverEtaText.value = driver ? 'คนขับออนไลน์' : 'รอคนขับเปิดตำแหน่ง...'
    driverDistText.value = ''
    return
  }
  const dist = haversineDistance(driver.lat, driver.lng, myPickup.value.lat, myPickup.value.lng)
  driverDistText.value = formatDist(dist)
  // Rough ETA: avg 40km/h in city
  const etaMin = Math.max(1, Math.round((dist / 1000) * 1.5))
  if (etaMin < 2) driverEtaText.value = '🟢 กำลังจะถึงแล้ว!'
  else if (etaMin < 5) driverEtaText.value = `⏱️ อีกประมาณ ${etaMin} นาที`
  else driverEtaText.value = `⏱️ อีกประมาณ ${etaMin} นาที`
}

// ─── Fetch Route ─────────────────────────────
async function fetchRouteData() {
  try {
    const { $api } = useNuxtApp()
    const raw = await $api(`/routes/${routeId.value}`)
    // Ensure lat/lng are Numbers (MySQL JSON may return strings)
    if (raw.startLocation) {
      raw.startLocation.lat = Number(raw.startLocation.lat)
      raw.startLocation.lng = Number(raw.startLocation.lng)
    }
    if (raw.endLocation) {
      raw.endLocation.lat = Number(raw.endLocation.lat)
      raw.endLocation.lng = Number(raw.endLocation.lng)
    }
    if (raw.bookings) {
      raw.bookings.forEach(b => {
        if (b.pickupLocation) {
          b.pickupLocation.lat = Number(b.pickupLocation.lat)
          b.pickupLocation.lng = Number(b.pickupLocation.lng)
        }
        if (b.dropoffLocation) {
          b.dropoffLocation.lat = Number(b.dropoffLocation.lat)
          b.dropoffLocation.lng = Number(b.dropoffLocation.lng)
        }
      })
    }
    routeData.value = raw
    routeStartName.value = raw.startLocation?.name || raw.startLocation?.province || 'ต้นทาง'
    routeDestName.value = raw.endLocation?.name || raw.endLocation?.province || 'ปลายทาง'
  } catch (e) { console.error('Fetch route:', e) }
}

// ─── Analyze Pickup Order ────────────────────
function getConfirmedPickups() {
  if (!routeData.value?.bookings) return []
  return routeData.value.bookings
    .filter(b => b.pickupLocation?.lat && b.pickupLocation?.lng && ['CONFIRMED', 'IN_PROGRESS'].includes((b.status || '').toUpperCase()))
    .map(b => ({
      lat: Number(b.pickupLocation.lat), lng: Number(b.pickupLocation.lng),
      name: b.pickupLocation.name || 'จุดนัดรับ',
      passengerName: `${b.passenger?.firstName || ''} ${b.passenger?.lastName || ''}`.trim() || 'ผู้โดยสาร',
      passengerId: b.passengerId || b.passenger?.id,
    }))
}

// ─── Draw Route (ROLE-BASED) ─────────────────
function drawRoute() {
  if (!map || !window.google?.maps || !routeData.value) return

  const endLoc = routeData.value.endLocation
  if (!endLoc?.lat) return

  if (isDriver.value) drawDriverRoute(endLoc)
  else drawPassengerRoute(endLoc)
}

function drawDriverRoute(endLoc) {
  // Driver: current GPS → [all pickup waypoints optimized] → destination
  const pickups = getConfirmedPickups()
  const waypoints = pickups.map(pp => ({ location: new google.maps.LatLng(pp.lat, pp.lng), stopover: true }))

  const driverPos = myPosition.value
  const startLoc = routeData.value.startLocation
  const origin = (driverPos.lat && driverPos.lng)
    ? new google.maps.LatLng(driverPos.lat, driverPos.lng)
    : new google.maps.LatLng(startLoc.lat, startLoc.lng)

  if (directionsRenderer) directionsRenderer.setMap(null)
  directionsRenderer = new google.maps.DirectionsRenderer({
    map, suppressMarkers: true,
    polylineOptions: { strokeColor: '#4285F4', strokeOpacity: 0.85, strokeWeight: 5 },
  })

  new google.maps.DirectionsService().route(
    { origin, destination: new google.maps.LatLng(endLoc.lat, endLoc.lng), waypoints, optimizeWaypoints: waypoints.length > 1, travelMode: google.maps.TravelMode.DRIVING },
    (result, status) => {
      if (status !== 'OK') { addPickupMarkersForDriver(pickups); return }
      directionsRenderer.setDirections(result)
      const optimizedOrder = result.routes[0]?.waypoint_order || []
      orderedPickups.value = (optimizedOrder.length === pickups.length)
        ? optimizedOrder.map(i => pickups[i])
        : pickups
      addDriverMarkers(routeData.value.startLocation, endLoc)
    }
  )
}

function drawPassengerRoute(endLoc) {
  // Passenger: driver current position → my pickup → destination
  const driver = findDriverParticipant()
  if (!myPickup.value) return

  const origin = (driver?.lat)
    ? new google.maps.LatLng(driver.lat, driver.lng)
    : null

  if (!origin) {
    // No driver GPS — just show pickup + destination markers
    addPassengerMarkers()
    return
  }

  if (directionsRenderer) directionsRenderer.setMap(null)
  directionsRenderer = new google.maps.DirectionsRenderer({
    map, suppressMarkers: true,
    polylineOptions: { strokeColor: '#10B981', strokeOpacity: 0.85, strokeWeight: 5 },
  })

  const waypoints = [{ location: new google.maps.LatLng(myPickup.value.lat, myPickup.value.lng), stopover: true }]

  new google.maps.DirectionsService().route(
    { origin, destination: new google.maps.LatLng(endLoc.lat, endLoc.lng), waypoints, travelMode: google.maps.TravelMode.DRIVING },
    (result, status) => {
      if (status !== 'OK') { addPassengerMarkers(); return }
      directionsRenderer.setDirections(result)
      addPassengerMarkers()
    }
  )
}

// ─── Markers: DRIVER ─────────────────────────
function addDriverMarkers(startLoc, endLoc) {
  clearCustomMarkers()
  if (!map || !window.google?.maps) return

  // Start (🏠)
  addCustomMarker(startLoc.lat, startLoc.lng, '🏠', '#2563EB', `ต้นทาง: ${startLoc.name || ''}`,
    `<b>🏠 ต้นทาง</b><br/>${startLoc.name || 'จุดเริ่มต้น'}`)

  // Pickup points (numbered)
  orderedPickups.value.forEach((pp, idx) => {
    const color = PICKUP_COLORS[idx % PICKUP_COLORS.length]
    addCustomMarker(pp.lat, pp.lng, `${idx+1}`, color, `จุดรับ #${idx+1}: ${pp.passengerName}`,
      `<b>📍 จุดรับ #${idx+1}</b><br/>${pp.passengerName}<br/><span style="color:#6b7280">${pp.name}</span>`)
  })

  // Destination (🏁)
  addCustomMarker(endLoc.lat, endLoc.lng, '🏁', '#DC2626', `ปลายทาง: ${endLoc.name || ''}`,
    `<b>🏁 ปลายทาง</b><br/>${endLoc.name || 'จุดหมาย'}`)
}

function addPickupMarkersForDriver(pickups) {
  clearCustomMarkers()
  orderedPickups.value = pickups
  pickups.forEach((pp, idx) => {
    const color = PICKUP_COLORS[idx % PICKUP_COLORS.length]
    addCustomMarker(pp.lat, pp.lng, `${idx+1}`, color, pp.passengerName, `<b>📍 ${pp.passengerName}</b><br/>${pp.name}`)
  })
}

// ─── Markers: PASSENGER ──────────────────────
function addPassengerMarkers() {
  clearCustomMarkers()
  if (!map || !window.google?.maps) return

  // My Pickup (📍 green)
  if (myPickup.value) {
    addCustomMarker(myPickup.value.lat, myPickup.value.lng, '📍', '#059669', `จุดรับของฉัน`,
      `<b>📍 จุดรับ</b><br/>${myPickup.value.name}`)
  }

  // My Dropoff / Route Destination (🏁)
  const endLoc = routeData.value?.endLocation
  if (endLoc?.lat) {
    addCustomMarker(endLoc.lat, endLoc.lng, '🏁', '#DC2626', `ปลายทาง`,
      `<b>🏁 ปลายทาง</b><br/>${endLoc.name || 'จุดหมาย'}`)
  }
}

// ─── Marker Helpers ──────────────────────────
function clearCustomMarkers() {
  pickupMarkers.forEach(m => m.setMap(null))
  pickupMarkers = []
}

function addCustomMarker(lat, lng, labelText, color, title, infoHtml) {
  const isEmoji = labelText.length > 1 && /\p{Emoji}/u.test(labelText)
  const svgContent = isEmoji
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44"><path d="M18 0C8 0 0 8 0 18c0 13 18 26 18 26s18-13 18-26C36 8 28 0 18 0z" fill="${color}"/><text x="18" y="22" text-anchor="middle" font-size="16">${labelText}</text></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38"><path d="M15 0C7 0 0 7 0 15c0 11 15 23 15 23s15-12 15-23C30 7 23 0 15 0z" fill="${color}"/><text x="15" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="white">${labelText}</text></svg>`
  const size = isEmoji ? 36 : 30
  const h = isEmoji ? 44 : 38

  const m = new google.maps.Marker({
    map, position: { lat, lng }, zIndex: 850, title,
    icon: {
      url: 'data:image/svg+xml,' + encodeURIComponent(svgContent),
      scaledSize: new google.maps.Size(size, h),
      anchor: new google.maps.Point(size / 2, h),
    },
  })
  if (infoHtml) {
    const iw = new google.maps.InfoWindow({ content: `<div style="padding:6px 10px;font-size:13px;">${infoHtml}</div>` })
    m.addListener('click', () => iw.open(map, m))
  }
  pickupMarkers.push(m)
  return m
}

// ─── Notifications ───────────────────────────
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
    notifications.value = raw.map(it => ({ id: it.id, title: it.title || '-', body: it.body || '', createdAt: it.createdAt || Date.now(), readAt: it.readAt || null }))
  } catch { /* silent */ }
}

// ─── Chat ────────────────────────────────────
const chatMessages = ref([])
const chatInput = ref('')
const isChatLoading = ref(false)
const isChatSending = ref(false)
const chatMessagesEl = ref(null)
const chatSessionId = ref(null)
const unreadChat = ref(0)
let chatInitialized = false

function scrollChatBottom() {
  nextTick(() => { if (chatMessagesEl.value) chatMessagesEl.value.scrollTop = chatMessagesEl.value.scrollHeight })
}

async function initChat() {
  if (chatInitialized) return
  chatInitialized = true
  isChatLoading.value = true
  try {
    const session = await createChatSession(routeId.value, true)
    chatSessionId.value = session?.id
    if (!chatSessionId.value) { isChatLoading.value = false; return }
    const result = await fetchMessages(chatSessionId.value)
    chatMessages.value = result?.data || result || []
    connectChatSocket(token.value)
    joinSession(chatSessionId.value)
    onNewMessage(handleChatMessage)
  } catch (err) { console.error('Init chat:', err) }
  finally { isChatLoading.value = false; scrollChatBottom() }
}

function handleChatMessage(msg) {
  if (chatMessages.value.some(m => m.id === msg.id)) return
  chatMessages.value.push(msg)
  if (bottomTab.value !== 'chat') unreadChat.value++
  scrollChatBottom()
}

function openChatTab() {
  bottomTab.value = 'chat'
  unreadChat.value = 0
  if (!chatInitialized) initChat()
  scrollChatBottom()
}

async function sendChatMessage() {
  if (!chatInput.value.trim() || isChatSending.value || !chatSessionId.value) return
  isChatSending.value = true
  const content = chatInput.value
  chatInput.value = ''
  try {
    const msg = await sendMessage(chatSessionId.value, { content })
    const msgData = msg?.data || msg
    chatMessages.value.push(msgData)
    emitNewMessage(chatSessionId.value, msgData)
    scrollChatBottom()
  } catch { toast.error('ส่งข้อความล้มเหลว'); chatInput.value = content }
  finally { isChatSending.value = false }
}

async function chatShareLocation() {
  if (!navigator.geolocation) { toast.error('ไม่รองรับ GPS'); return }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        if (!chatSessionId.value) await initChat()
        const msg = await shareLocation(chatSessionId.value, pos.coords.latitude, pos.coords.longitude)
        chatMessages.value.push(msg?.data || msg)
        scrollChatBottom()
        toast.success('แชร์ตำแหน่งแล้ว')
      } catch { toast.error('แชร์ตำแหน่งล้มเหลว') }
    },
    () => toast.error('ไม่สามารถเข้าถึง GPS')
  )
}

// ─── Map & GPS ───────────────────────────────
// ─── Google Maps Deep Links ──────────────────
// Single point: navigate to a specific lat/lng
function googleMapsPointUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
}

// Driver: full route — current position → all pickups → destination
const driverGoogleMapsUrl = computed(() => {
  const endLoc = routeData.value?.endLocation
  if (!endLoc?.lat) return '#'
  const dest = `${endLoc.lat},${endLoc.lng}`
  const wps = orderedPickups.value.map(pp => `${pp.lat},${pp.lng}`).join('|')
  let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
  if (wps) url += `&waypoints=${encodeURIComponent(wps)}`
  return url
})

// Passenger: navigate to my pickup point
const passengerGoogleMapsUrl = computed(() => {
  if (!myPickup.value) return '#'
  return `https://www.google.com/maps/dir/?api=1&destination=${myPickup.value.lat},${myPickup.value.lng}&travelmode=driving`
})

function formatDist(meters) {
  if (meters < 1000) return `${Math.round(meters)} ม.`
  return `${(meters / 1000).toFixed(1)} กม.`
}

function fitAllMarkers() {
  if (!map) return
  const bounds = new google.maps.LatLngBounds()
  if (myPosition.value.lat) bounds.extend({ lat: myPosition.value.lat, lng: myPosition.value.lng })
  participants.forEach(p => { if (p.lat) bounds.extend({ lat: p.lat, lng: p.lng }) })
  orderedPickups.value.forEach(pp => bounds.extend({ lat: pp.lat, lng: pp.lng }))
  if (myPickup.value) bounds.extend({ lat: myPickup.value.lat, lng: myPickup.value.lng })
  if (routeData.value?.endLocation?.lat) bounds.extend({ lat: Number(routeData.value.endLocation.lat), lng: Number(routeData.value.endLocation.lng) })
  map.fitBounds(bounds, { top: 120, bottom: 370, left: 40, right: 40 })
}

watch(myPosition, (pos) => {
  if (!pos.lat || !map) return
  if (!myMarker) myMarker = createMyMarker(map)
  myMarker.setPosition({ lat: pos.lat, lng: pos.lng })
  if (participants.size === 0) map.panTo({ lat: pos.lat, lng: pos.lng })
})

// Update ETA whenever participants change (passenger view)
watch(() => [...participants.entries()], () => {
  if (!isDriver.value) updateDriverEta()
}, { deep: true })

// Redraw route every 30s
function startRouteRedraw() {
  if (routeRedrawTimer) clearInterval(routeRedrawTimer)
  routeRedrawTimer = setInterval(() => {
    if (routeData.value) {
      drawRoute()
      if (!isDriver.value) updateDriverEta()
    }
  }, 30000)
}

function initMap() {
  if (!mapEl.value || !window.google?.maps) return
  map = new google.maps.Map(mapEl.value, {
    center: { lat: 16.4322, lng: 102.8236 }, zoom: 14,
    disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy',
    styles: [
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    ],
  })
  myMarker = createMyMarker(map)
  startTracking(routeId.value, token.value, map, user.value?.firstName || '')

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        map.setZoom(15)
        if (myMarker) myMarker.setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }, () => {}
    )
  }
}

onMounted(async () => {
  fetchNotifications()
  await fetchRouteData()

  const tryInit = () => {
    if (window.google?.maps) {
      initMap()
      drawRoute()
      updateDriverEta()
      startRouteRedraw()
    } else setTimeout(tryInit, 500)
  }
  tryInit()
})

onUnmounted(() => {
  stopTracking()
  if (routeRedrawTimer) clearInterval(routeRedrawTimer)
  if (directionsRenderer) directionsRenderer.setMap(null)
  clearCustomMarkers()
  if (chatSessionId.value) {
    leaveSession(chatSessionId.value)
    offNewMessage(handleChatMessage)
  }
})
</script>
