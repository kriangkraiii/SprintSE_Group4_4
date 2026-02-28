<template>
    <div class="min-h-screen bg-surface pb-12">
        <!-- New Graphical Header -->
        <div class="relative h-[280px] w-full">
            <img src="/images/bgmytrip.png" alt="My Trip Background" class="object-cover w-full h-full" />
            <div class="absolute inset-0 flex flex-col justify-center px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <h2 class="text-4xl font-bold text-white drop-shadow-md -ml-4">การเดินทางของฉัน</h2>
                <p class="mt-2 text-white/90 drop-shadow-sm">จัดการและติดตามการเดินทางทั้งหมดของคุณ</p>
            </div>
        </div>

        <!-- Floating Tabs -->
        <div class="relative px-4 mx-auto -mt-8 max-w-7xl sm:px-6 lg:px-8">
            <div class="p-3 mb-8 bg-white border border-slate-200 rounded-xl shadow-lg">
                <div class="flex flex-wrap gap-2">
                    <button v-for="tab in tabs" :key="tab.status" @click="activeTab = tab.status"
                        :class="['flex-1 text-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                        activeTab === tab.status
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">
                        {{ tab.label }} ({{ getTripCount(tab.status) }})
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div class="lg:col-span-2">
                    <div class="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 class="text-lg font-semibold text-[#383838]">รายการการเดินทาง</h3>
                        </div>

                        <div v-if="isLoading" class="p-12 text-center text-slate-400">
                            <p>กำลังโหลดข้อมูลการเดินทาง...</p>
                        </div>

                        <div v-else class="divide-y divide-slate-100">
                            <div v-if="filteredTrips.length === 0" class="p-12 text-center text-slate-400">
                                <p>ไม่พบรายการเดินทางในหมวดหมู่นี้</p>
                            </div>

                            <div v-for="trip in filteredTrips" :key="trip.id"
                                class="p-6 transition-colors duration-200 cursor-pointer trip-card hover:bg-slate-50"
                                @click="toggleTripDetails(trip.id)">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <h4 class="text-lg font-semibold text-primary">
                                                {{ trip.origin }} → {{ trip.destination }}
                                            </h4>
                                            <span class="status-badge" :class="getStatusBadge(trip.status).class">
                                                {{ getStatusBadge(trip.status).label }}
                                            </span>
                                        </div>
                                        <p class="mt-1 text-sm text-slate-500">จุดนัดพบ: {{ trip.pickupPoint }}</p>
                                        <p class="text-sm text-slate-500">
                                            วันที่: {{ trip.date }}
                                            <span class="mx-2 text-slate-200">|</span>
                                            เวลา: {{ trip.time }}
                                            <span class="mx-2 text-slate-200">|</span>
                                            ระยะเวลา: {{ trip.durationText }}
                                            <span class="mx-2 text-slate-200">|</span>
                                            ระยะทาง: {{ trip.distanceText }}
                                        </p>
                                    </div>
                                </div>

                                <div class="flex items-center mb-4 space-x-4">
                                    <img :src="trip.driver.image" :alt="trip.driver.name"
                                        class="object-cover w-12 h-12 rounded-full"
                                        @error="(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.driver.name || 'U')}&background=random&size=64`" />
                                    <div class="flex-1">
                                        <h5 class="font-medium text-primary">{{ trip.driver.name }}</h5>
                                        <div class="flex items-center">
                                            <div class="flex text-sm text-yellow-400">
                                                <span>
                                                    {{ '★'.repeat(Math.round(trip.driver.rating)) }}{{ '☆'.repeat(5 -
                                                        Math.round(trip.driver.rating)) }}
                                                </span>
                                            </div>
                                            <span class="ml-2 text-sm text-slate-500">{{ trip.driver.rating }} ({{
                                                trip.driver.reviews }} รีวิว)</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-lg font-bold text-cta">{{ trip.price }} บาท</div>
                                        <div class="text-sm text-slate-500">จำนวน {{ trip.seats }} ที่นั่ง</div>
                                    </div>
                                </div>

                                <div v-if="selectedTripId === trip.id"
                                    class="pt-4 mt-4 mb-5 duration-300 border-t border-slate-200 animate-in slide-in-from-top">
                                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <h5 class="mb-2 font-medium text-primary">รายละเอียดเส้นทาง</h5>
                                            <ul class="space-y-1 text-sm text-slate-500">
                                                <li>
                                                    • จุดเริ่มต้น:
                                                    <span class="font-medium text-primary">{{ trip.origin }}</span>
                                                    <span v-if="trip.originAddress"> — {{ trip.originAddress }}</span>
                                                </li>

                                                <template v-if="trip.stops && trip.stops.length">
                                                    <li class="mt-2 text-primary">• จุดแวะระหว่างทาง ({{
                                                        trip.stops.length }} จุด):</li>
                                                    <li v-for="(stop, idx) in trip.stops" :key="idx">  - จุดแวะ {{ idx +
                                                        1 }}: {{ stop }}</li>
                                                </template>

                                                <li class="mt-1">
                                                    • จุดปลายทาง:
                                                    <span class="font-medium text-primary">{{ trip.destination
                                                    }}</span>
                                                    <span v-if="trip.destinationAddress"> — {{ trip.destinationAddress
                                                    }}</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 class="mb-2 font-medium text-primary">รายละเอียดรถ</h5>
                                            <ul class="space-y-1 text-sm text-slate-500">
                                                <li v-for="detail in trip.carDetails" :key="detail">• {{ detail }}</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div class="mt-4 space-y-4">
                                        <div v-if="trip.conditions">
                                            <h5 class="mb-2 font-medium text-primary">เงื่อนไขการเดินทาง</h5>
                                            <p
                                                class="p-3 text-sm text-primary border border-slate-200 rounded-md bg-slate-50">
                                                {{ trip.conditions }}
                                            </p>
                                        </div>

                                        <div v-if="trip.photos && trip.photos.length > 0">
                                            <h5 class="mb-2 font-medium text-primary">รูปภาพรถยนต์</h5>
                                            <div class="grid grid-cols-3 gap-2 mt-2">
                                                <div v-for="(photo, index) in trip.photos.slice(0, 3)" :key="index">
                                                    <img :src="photo" alt="Vehicle photo"
                                                        class="object-cover w-full transition-opacity rounded-lg shadow-sm cursor-pointer aspect-video hover:opacity-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex justify-end space-x-3" :class="{ 'mt-4': selectedTripId !== trip.id }">
                                    <!-- PENDING: ยกเลิกได้ -->
                                    <button v-if="trip.status === 'pending'" @click.stop="openCancelModal(trip)"
                                        class="px-4 py-2 text-sm text-red-600 transition duration-200 border border-red-300 rounded-md hover:bg-red-50">
                                        ยกเลิกการจอง
                                    </button>

                                    <!-- CONFIRMED / IN_PROGRESS: ยกเลิก + ติดตาม + แชทกลุ่ม -->
                                    <template v-else-if="['confirmed', 'in_progress'].includes(trip.status)">
                                        <button @click.stop="openCancelModal(trip)"
                                            class="px-4 py-2 text-sm text-red-600 transition duration-200 border border-red-300 rounded-md hover:bg-red-50">
                                            ยกเลิกการจอง
                                        </button>
                                        <NuxtLink :to="`/tracking/${trip.routeId}`" @click.stop
                                            class="px-4 py-2 text-sm text-white transition duration-200 bg-primary rounded-md hover:bg-primary/90">
                                            📍 ติดตามตำแหน่ง
                                        </NuxtLink>
                                        <button @click.stop="openChat(trip)" :disabled="isChatLoading"
                                            class="px-4 py-2 text-sm text-white transition duration-200 bg-cta rounded-md hover:bg-cta-hover disabled:opacity-50">
                                            {{ isChatLoading ? '⏳ กำลังเปิด...' : '💬 แชทกลุ่ม' }}
                                        </button>
                                    </template>

                                    <!-- COMPLETED: รีวิว -->
                                    <template v-else-if="trip.status === 'completed'">
                                        <NuxtLink :to="`/reviews/create?bookingId=${trip.id}`"
                                            class="px-4 py-2 text-sm text-white transition duration-200 bg-amber-500 rounded-md hover:bg-amber-600"
                                            @click.stop>
                                            ⭐ เขียนรีวิว
                                        </NuxtLink>
                                    </template>

                                    <!-- REJECTED / CANCELLED / NO_SHOW: ลบได้ -->
                                    <button v-else-if="['rejected', 'cancelled', 'no_show'].includes(trip.status)"
                                        @click.stop="openConfirmModal(trip, 'delete')"
                                        class="px-4 py-2 text-sm text-slate-500 transition duration-200 border border-slate-200 rounded-md hover:bg-slate-50">
                                        ลบรายการ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-1">
                    <div class="sticky overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm top-8">
                        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 class="text-lg font-semibold text-[#383838]">แผนที่เส้นทาง</h3>
                              <p class="mt-1 text-sm text-slate-500">
                                {{ selectedTrip ? `${selectedTrip.origin} → ${selectedTrip.destination}` : 'คลิกที่รายการเพื่อดูเส้นทาง' }}
                            </p>
                        </div>
                        <div ref="mapContainer" id="map" class="h-96"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: เลือกเหตุผลการยกเลิก -->
        <div v-if="isCancelModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @click.self="closeCancelModal">
            <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h3 class="text-lg font-semibold text-primary">เลือกเหตุผลการยกเลิก</h3>
                <p class="mt-1 text-sm text-slate-500">โปรดเลือกเหตุผลตามตัวเลือกที่กำหนด</p>

                <div class="mt-4">
                    <label class="block mb-1 text-sm text-primary">เหตุผล</label>
                    <select v-model="selectedCancelReason" class="w-full px-3 py-2 border border-slate-200 rounded-md">
                        <option value="" disabled>-- เลือกเหตุผล --</option>
                        <option v-for="r in cancelReasonOptions" :key="r.value" :value="r.value">
                            {{ r.label }}
                        </option>
                    </select>
                    <p v-if="cancelReasonError" class="mt-2 text-sm text-red-600">
                        {{ cancelReasonError }}
                    </p>
                </div>

                <div class="flex justify-end gap-2 mt-6">
                    <button @click="closeCancelModal"
                        class="px-4 py-2 text-sm text-primary bg-slate-100 rounded-md hover:bg-slate-200">
                        ปิด
                    </button>
                    <button @click="submitCancel" :disabled="!selectedCancelReason || isSubmittingCancel"
                        class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                        {{ isSubmittingCancel ? 'กำลังส่ง...' : 'ยืนยันการยกเลิก' }}
                    </button>
                </div>
            </div>
        </div>

        <ConfirmModal :show="isModalVisible" :title="modalContent.title" :message="modalContent.message"
            :confirmText="modalContent.confirmText" :variant="modalContent.variant" @confirm="handleConfirmAction"
            @cancel="closeConfirmModal" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'
import { useChat } from '~/composables/useChat'
import {
    useRouteMap, cleanAddr, formatDistance, formatDuration,
    getStatusBadge, CANCEL_REASONS
} from '~/composables/useRouteMap'

// Setup dayjs for Thai locale
dayjs.locale('th')
dayjs.extend(buddhistEra)

const { $api } = useNuxtApp()
const { toast } = useToast()
const { createSession: createChatSession } = useChat()
const router = useRouter()
const { initializeMap, waitMapReady, reverseGeocode, extractNameParts, updateMap, mapReady } = useRouteMap()

// --- State Management ---
const activeTab = ref('pending')
const selectedTripId = ref(null)
const isLoading = ref(false)
const mapContainer = ref(null)
const allTrips = ref([])

const GMAPS_CB = '__gmapsReady__'

const tabs = [
    { status: 'pending', label: 'รอดำเนินการ' },
    { status: 'confirmed', label: 'ยืนยันแล้ว' },
    { status: 'in_progress', label: 'กำลังเดินทาง' },
    { status: 'completed', label: 'เสร็จสิ้น' },
    { status: 'rejected', label: 'ปฏิเสธ' },
    { status: 'cancelled', label: 'ยกเลิก' },
    { status: 'all', label: 'ทั้งหมด' }
]

definePageMeta({ middleware: 'auth' })

const cancelReasonOptions = CANCEL_REASONS

const isCancelModalVisible = ref(false)
const isSubmittingCancel = ref(false)
const selectedCancelReason = ref('')
const cancelReasonError = ref('')
const tripToCancel = ref(null)

// --- Computed Properties ---
const filteredTrips = computed(() => {
    if (activeTab.value === 'all') return allTrips.value
    return allTrips.value.filter((trip) => trip.status === activeTab.value)
})

const selectedTrip = computed(() => {
    return allTrips.value.find((trip) => trip.id === selectedTripId.value) || null
})


// --- Methods ---
async function fetchMyTrips() {
    isLoading.value = true
    try {
        const bookings = await $api('/bookings/me')

        // map ข้อมูลพื้นฐานก่อน (ตั้งชื่อชั่วคราวเป็นพิกัด แล้วไป reverse geocode ภายหลัง)
        const formatted = bookings.map((b) => {
            const driverData = {
                name: `${b.route.driver.firstName} ${b.route.driver.lastName}`.trim(),
                image:
                    b.route.driver.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(b.route.driver.firstName || 'U')}&background=random&size=64`,
                rating: b.route.driver.driverStats?.avgRating || 0,
                reviews: b.route.driver.driverStats?.totalReviews || 0
            }

            const carDetails = []
            if (b.route.vehicle) {
                carDetails.push(`${b.route.vehicle.vehicleModel} (${b.route.vehicle.vehicleType})`)
                if (Array.isArray(b.route.vehicle.amenities) && b.route.vehicle.amenities.length) {
                    carDetails.push(...b.route.vehicle.amenities.map(a => typeof a === 'string' ? a : a.name))
                }
            } else {
                carDetails.push('ไม่มีข้อมูลรถ')
            }

            const start = b.route.startLocation
            const end = b.route.endLocation

            const wp = b.route.waypoints || {}
            const baseList =
                (Array.isArray(wp.used) && wp.used.length ? wp.used : Array.isArray(wp.requested) ? wp.requested : []) || []
            const orderedList =
                Array.isArray(wp.optimizedOrder) && wp.optimizedOrder.length === baseList.length
                    ? wp.optimizedOrder.map((i) => baseList[i])
                    : baseList

            const stops = orderedList
                .map((p) => {
                    const name = p?.name || ''
                    const address = cleanAddr(p?.address || '')
                    const fallback =
                        p?.lat != null && p?.lng != null ? `(${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)})` : ''
                    const title = name || fallback
                    return address ? `${title} — ${address}` : title
                })
                .filter(Boolean)

            const stopsCoords = orderedList
                .map((p) =>
                    p && typeof p.lat === 'number' && typeof p.lng === 'number'
                        ? { lat: Number(p.lat), lng: Number(p.lng), name: p.name || '', address: p.address || '' }
                        : null
                )
                .filter(Boolean)

            return {
                id: b.id,
                routeId: b.routeId || b.route?.id,
                status: String(b.status || '').toLowerCase(),
                origin: start?.name || `(${Number(start.lat).toFixed(2)}, ${Number(start.lng).toFixed(2)})`,
                destination: end?.name || `(${Number(end.lat).toFixed(2)}, ${Number(end.lng).toFixed(2)})`,
                originAddress: start?.address ? cleanAddr(start.address) : null,
                destinationAddress: end?.address ? cleanAddr(end.address) : null,
                originHasName: !!start?.name,
                destinationHasName: !!end?.name,
                pickupPoint: b.pickupLocation?.name || '-',
                date: dayjs(b.route.departureTime).format('D MMMM BBBB'),
                time: dayjs(b.route.departureTime).format('HH:mm น.'),
                price: (b.route.pricePerSeat || 0) * (b.numberOfSeats || 1),
                seats: b.numberOfSeats || 1,
                driver: driverData,
                coords: [
                    [start.lat, start.lng],
                    [end.lat, end.lng]
                ],
                polyline: b.route.routePolyline || null,
                stops,
                stopsCoords,
                carDetails,
                conditions: b.route.conditions,
                photos: b.route.vehicle?.photos || [],
                durationText:
                    (typeof b.route.duration === 'string' ? formatDuration(b.route.duration) : b.route.duration) ||
                    (typeof b.route.durationSeconds === 'number' ? `${Math.round(b.route.durationSeconds / 60)} นาที` : '-'),
                distanceText:
                    (typeof b.route.distance === 'string' ? formatDistance(b.route.distance) : b.route.distance) ||
                    (typeof b.route.distanceMeters === 'number' ? `${(b.route.distanceMeters / 1000).toFixed(1)} กม.` : '-')
            }
        })

        allTrips.value = formatted

        // รอให้แผนที่พร้อมก่อน แล้วค่อย reverse geocode เพื่อได้ "ชื่อสถานที่" สวยๆ
        await waitMapReady()

        const jobs = allTrips.value.map(async (t, idx) => {
            const [o, d] = await Promise.all([reverseGeocode(t.coords[0][0], t.coords[0][1]), reverseGeocode(t.coords[1][0], t.coords[1][1])])
            const oParts = await extractNameParts(o)
            const dParts = await extractNameParts(d)

            if (!allTrips.value[idx].originHasName && oParts.name) {
                allTrips.value[idx].origin = oParts.name
            }
            if (!allTrips.value[idx].destinationHasName && dParts.name) {
                allTrips.value[idx].destination = dParts.name
            }
        })

        await Promise.allSettled(jobs)
    } catch (error) {
        console.error('Failed to fetch my trips:', error)
        allTrips.value = []
    } finally {
        isLoading.value = false
    }
}



const getTripCount = (status) => {
    if (status === 'all') return allTrips.value.length
    return allTrips.value.filter((trip) => trip.status === status).length
}

const toggleTripDetails = (tripId) => {
    const tripForMap = allTrips.value.find((trip) => trip.id === tripId)
    if (tripForMap) {
        updateMap(tripForMap)
    }

    if (selectedTripId.value === tripId) {
        selectedTripId.value = null
    } else {
        selectedTripId.value = tripId
    }
}

// updateMap is from useRouteMap composable

// --- Modal Logic ---
const isModalVisible = ref(false)
const tripToAction = ref(null)
const modalContent = ref({
    title: '',
    message: '',
    confirmText: '',
    action: null,
    variant: 'danger'
})

const openConfirmModal = (trip, action) => {
    tripToAction.value = trip
    if (action === 'cancel') {
        // ตอนนี้ไม่ใช้ทางยืนยันตรง ๆ แล้ว แต่คงโครงไว้เผื่ออนาคต
        modalContent.value = {
            title: 'ยืนยันการยกเลิกการจอง',
            message: `คุณต้องการยกเลิกการเดินทางไปที่ "${trip.destination}" ใช่หรือไม่?`,
            confirmText: 'ใช่, ยกเลิกการจอง',
            action: 'cancel',
            variant: 'danger'
        }
    } else if (action === 'delete') {
        modalContent.value = {
            title: 'ยืนยันการลบรายการ',
            message: `คุณต้องการลบรายการเดินทางไปที่ "${trip.destination}" ออกจากประวัติใช่หรือไม่?`,
            confirmText: 'ใช่, ลบรายการ',
            action: 'delete',
            variant: 'danger'
        }
    }
    isModalVisible.value = true
}

const closeConfirmModal = () => {
    isModalVisible.value = false
    tripToAction.value = null
}

const handleConfirmAction = async () => {
    if (!tripToAction.value) return
    const action = modalContent.value.action
    const tripId = tripToAction.value.id
    try {
        if (action === 'cancel') {
            // ไม่ยิง PATCH ตรง ๆ — ต้องให้ผู้ใช้เลือกเหตุผลก่อน
            openCancelModal(tripToAction.value)
            closeConfirmModal()
            return
        } else if (action === 'delete') {
            await $api(`/bookings/${tripId}`, { method: 'DELETE' })
            toast.success('ลบรายการสำเร็จ', 'รายการได้ถูกลบออกจากประวัติแล้ว')
        }
        closeConfirmModal()
        await fetchMyTrips()
    } catch (error) {
        console.error(`Failed to ${action} booking:`, error)
        toast.error('เกิดข้อผิดพลาด', error.data?.message || 'ไม่สามารถดำเนินการได้')
        closeConfirmModal()
    }
}

function openCancelModal(trip) {
    tripToCancel.value = trip
    selectedCancelReason.value = ''
    cancelReasonError.value = ''
    isCancelModalVisible.value = true
}

function closeCancelModal() {
    isCancelModalVisible.value = false
    tripToCancel.value = null
}

async function submitCancel() {
    if (!selectedCancelReason.value) {
        cancelReasonError.value = 'กรุณาเลือกเหตุผล'
        return
    }
    if (!tripToCancel.value) return

    isSubmittingCancel.value = true
    try {
        await $api(`/bookings/${tripToCancel.value.id}/cancel`, {
            method: 'PATCH',
            body: { reason: selectedCancelReason.value } // ✅ ตรงกับ schema ฝั่ง backend
        })
        toast.success('ยกเลิกการจองสำเร็จ', 'ระบบบันทึกเหตุผลแล้ว')
        closeCancelModal()
        await fetchMyTrips()
    } catch (err) {
        console.error('Cancel booking failed:', err)
        toast.error('เกิดข้อผิดพลาด', err?.data?.message || 'ไม่สามารถยกเลิกได้')
    } finally {
        isSubmittingCancel.value = false
    }
}

const isChatLoading = ref(false)

async function openChat(trip) {
    if (isChatLoading.value) return
    isChatLoading.value = true
    try {
        const session = await createChatSession(trip.routeId, true)
        if (session?.id) {
            router.push(`/chat/${session.id}`)
        } else {
            toast.error('เปิดแชทไม่สำเร็จ', 'ไม่พบ session ID')
        }
    } catch (err) {
        console.error('Open chat failed:', err)
        toast.error('เปิดแชทไม่สำเร็จ', err?.statusMessage || err?.data?.message || 'กรุณาลองใหม่')
    } finally {
        isChatLoading.value = false
    }
}

// formatDistance and formatDuration imported from useRouteMap

// --- Lifecycle and Watchers ---
useHead({
    title: 'การเดินทางของฉัน - Drive To Survive',
    script:
        process.client && !window.google?.maps
            ? [
                {
                    key: 'gmaps',
                    src: `https://maps.googleapis.com/maps/api/js?key=${useRuntimeConfig().public.googleMapsApiKey}&libraries=places,geometry&callback=__gmapsReady__`,
                    async: true,
                    defer: true
                }
            ]
            : []
})

onMounted(() => {
    // Map initialization (google maps ready or waiting)
    if (window.google?.maps) {
        initializeMap(mapContainer.value)
        fetchMyTrips().then(() => {
            if (filteredTrips.value.length) updateMap(filteredTrips.value[0])
        })
        return
    }
    window[GMAPS_CB] = () => {
        try { delete window[GMAPS_CB] } catch { }
        initializeMap(mapContainer.value)
        fetchMyTrips().then(() => {
            if (filteredTrips.value.length) updateMap(filteredTrips.value[0])
        })
    }
})
</script>

<style>
@import '~/assets/css/trip-shared.css';
</style>