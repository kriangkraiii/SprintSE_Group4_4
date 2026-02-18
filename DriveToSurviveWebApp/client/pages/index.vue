<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-[60vh] sm:min-h-[80vh] lg:min-h-[95vh] flex items-start justify-center ">
      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 opacity-100 bg-no-repeat bg-cover "
        style="background-image: url('/images/bgindex.png'); background-position:center 70%;"></div>

      <div class="relative py-12 sm:py-16 lg:py-24 mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 w-full ">
        <div class="max-w-7xl text-center mx-auto mt-2 sm:mt-10">

          <!-- Main Heading -->
          <h1
            class="text-3xl font-semibold leading-[1.1] text-white font-heading sm:text-5xl lg:text-8xl tracking-tight">
            แชร์รถ แชร์ค่าใช้จ่าย<br />
          </h1>
          <h1
            class="mb-8 text-xl font-semibold leading-[1.1] text-white font-heading sm:text-3xl lg:text-7xl tracking-tight">
            ปลอดภัยทุกเส้นทาง
          </h1>

          <!-- Trust Indicators -->
          <div class="hidden sm:flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-8 w-full">
            <div class="flex items-center gap-2 text-white">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20 shadow-lg">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ปลอดภัยทุกการเดินทาง ด้วยการยืนยันตัวตนก่อนใช้งาน</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20 shadow-lg">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ติดตามการเดินทางแบบเรียลไทม์ด้วยระบบระบุตำแหน่งที่แม่นยำ</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20 shadow-lg">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ประหยัดค่าใช้จ่าย และลดภาระสิ่งแวดล้อม</span>
            </div>
          </div>
        </div>

      </div>
      <div class="absolute -bottom-8 sm:-bottom-14 left-1/2 -translate-x-1/2 w-full px-4 sm:px-6">
        <div class="max-w-6xl mx-auto p-4 bg-white h-auto rounded-2xl shadow-[0_5px_10px_rgba(0,0,0,0.25)]">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">

            <!-- จุดเริ่มต้น -->
            <div class="relative">
              <label class="text-sm font-medium text-gray-600">จุดเริ่มต้น</label>
              <div class="relative">
                <input ref="originInputEl" type="text" placeholder="ค้นหาจุดเริ่มต้น..." v-model="from"
                  class="w-full mt-1 pl-4 pr-10 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" @click="openPlacePicker('origin')"
                  class="absolute right-1 top-2 p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- จุดปลายทาง -->
            <div class="relative">
              <label class="text-sm font-medium text-gray-600">จุดปลายทาง</label>
              <div class="relative">
                <input ref="destinationInputEl" type="text" placeholder="ค้นหาจุดปลายทาง..." v-model="to"
                  class="w-full mt-1 pl-4 pr-10 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" @click="openPlacePicker('destination')"
                  class="absolute right-1 top-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- วันที่ -->
            <div>
              <label class="text-sm font-medium text-gray-600">วันที่</label>
              <input type="date" v-model="date" :min="minDate"
                class="w-full mt-1 px-4 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <!-- ที่นั่ง -->
            <div>
              <label class="text-sm font-medium text-gray-600">ที่นั่ง</label>
              <select v-model="seat"
                class="w-full mt-1 px-4 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">ทั้งหมด</option>
                <option v-for="s in 5" :key="s" :value="s">{{ s }} ที่นั่ง</option>
              </select>
            </div>

            <!-- ปุ่ม -->
            <div class="flex gap-2 ">
              <button @click="searchTrip"
                class="flex-1 bg-[#1B9329] hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl shadow cursor-pointer">
                ค้นหา
              </button>
            </div>

          </div>
        </div>
      </div>

    </section>

    <!-- How It Works -->
    <section class="py-12 bg-white sm:py-20 lg:py-28">
      <div class="px-4 sm:px-10 lg:px-20 mx-auto max-w-7xl">
        <div class="max-w-3xl mb-16 text-left">
          <h2 class="text-2xl font-semibold text-[#137FEC] font-heading sm:text-4xl lg:text-7xl mb-4">
            ใช้งานง่าย เริ่มได้ทันที!
          </h2>
          <p class="text-base sm:text-lg text-slate-600 sm:pl-8">
            เพียง 3 ขั้นตอน ก็สามารถเริ่มแชร์รถหรือค้นหาเส้นทางได้แล้ว
          </p>
        </div>

        <div class="max-w-3xl mx-auto space-y-12">
          <!-- Step 1 -->
          <div class="relative">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div
                  class="flex items-center justify-center w-18 h-18 rounded-2xl bg-[#137FEC] text-white font-bold text-3xl shadow-lg shadow-blue-200">
                  1
                </div>
              </div>
              <div class="pt-1">
                <h3 class="text-2xl sm:text-4xl font-semibold text-[#137FEC] mb-2 font-heading">ลงทะเบียน</h3>
                <p class="text-slate-600 leading-relaxed text-base sm:text-lg sm:ml-5">
                  สร้างบัญชีและยืนยันตัวตนด้วยบัตรประชาชนและใบขับขี่ ผ่านระบบ OCR อัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div
                  class="flex items-center justify-center w-18 h-18 rounded-2xl bg-[#137FEC] text-white font-bold text-3xl shadow-lg shadow-blue-200">
                  2
                </div>
              </div>
              <div class="pt-1">
                <h3 class="text-2xl sm:text-4xl font-semibold text-[#137FEC] mb-2 font-heading">เลือก/ค้นหาเส้นทาง</h3>
                <p class="text-slate-600 leading-relaxed text-base sm:text-lg sm:ml-5">
                  ค้นหาเส้นทางที่ต้องการ หรือสร้างเส้นทางใหม่ พร้อมกำหนดจุดรับ-ส่ง และเวลาที่สะดวก
                </p>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div
                  class="flex items-center justify-center w-18 h-18 rounded-2xl bg-[#137FEC] text-white font-bold text-3xl shadow-lg shadow-blue-200">
                  3
                </div>
              </div>
              <div class="pt-1">
                <h3 class="text-2xl sm:text-4xl font-semibold text-[#137FEC] mb-2 font-heading">เริ่มเดินทาง</h3>
                <p class="text-slate-600 leading-relaxed text-base sm:text-lg sm:ml-5">
                  จองที่นั่ง ชำระเงิน และติดต่อกับคนขับหรือผู้โดยสาร พร้อมเริ่มต้นการเดินทางอย่างปลอดภัย
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section v-if="!token" class="pt-10 pb-32 sm:pb-55 bg-slate-100 sm:pt-24 lg:pt-28">
      <div class="px-6 mx-auto max-w-4xl sm:px-8 lg:px-12 text-center">
        <h2 class="text-2xl font-semibold text-[#137FEC] font-heading sm:text-4xl lg:text-7xl mb-4">
          พร้อมเริ่มต้นแล้วหรือยัง?
        </h2>
        <p class="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          สมัครสมาชิกฟรี ไม่มีค่าใช้จ่าย เริ่มแชร์รถหรือหาเส้นทางได้ทันที
        </p>
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
          <NuxtLink :to="localePath('/register')"
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 rounded-xl bg-[#137FEC] hover:bg-[#2058C0] shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            สมัครสมาชิกฟรี
          </NuxtLink>
          <NuxtLink :to="localePath('/findTrip')"
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-semibold text-[#137FEC] transition-all duration-200 border-2 rounded-xl border-[#137FEC] hover:bg-slate-200 hover:text-[#137FEC] shadow-lg">
            ดูเส้นทางทั้งหมด
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Place Picker Modal -->
    <transition name="modal-fade">
      <div v-if="showPlacePicker"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="closePlacePicker">
        <div class="bg-white rounded-2xl w-[95%] max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
          <div class="flex items-center justify-between px-7 py-5 border-b border-gray-100">
            <h3 class="text-base font-semibold text-gray-800">
              เลือก{{ pickingField === 'origin' ? 'จุดเริ่มต้น' : 'จุดปลายทาง' }}
            </h3>
            <button @click="closePlacePicker" class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div ref="placePickerMapEl" class="w-full h-80"></div>
          <div class="p-4 space-y-3">
            <div class="text-sm">
              <span class="font-medium text-gray-700">ตำแหน่ง: </span>
              <span class="text-gray-500">{{ pickedPlace.name || '— แตะบนแผนที่ —' }}</span>
            </div>
            <div class="flex gap-2">
              <button @click="closePlacePicker"
                class="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                ยกเลิก
              </button>
              <button :disabled="!pickedPlace.name" @click="applyPickedPlace"
                class="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 transition">
                ใช้ตำแหน่งนี้
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getProvinceFromPlace } from '~/utils/googleMaps'

const localePath = useLocalePath()
const { token } = useAuth()
const router = useRouter()
const config = useRuntimeConfig()
const GMAPS_CB = '__gmapsReady__'

const from = ref('')
const to = ref('')
const date = ref('')
const minDate = new Date().toISOString().split('T')[0]
const seat = ref('')

// Lat/Lng state
const fromData = ref({ lat: null, lng: null, province: null })
const toData = ref({ lat: null, lng: null, province: null })

// Google Maps Refs
const originInputEl = ref(null)
const destinationInputEl = ref(null)
let originAutocomplete = null
let destinationAutocomplete = null
let geocoder = null
let placesService = null

// Place Picker State
const showPlacePicker = ref(false)
const pickingField = ref(null)
const placePickerMapEl = ref(null)
let placePickerMap = null
let placePickerMarker = null
const pickedPlace = ref({ name: '', lat: null, lng: null })

// Load Google Maps Script
const headScripts = []
if (process.client && !window.google?.maps) {
  headScripts.push({
    key: 'gmaps',
    src: `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsApiKey}&libraries=places,geometry&callback=${GMAPS_CB}`,
    async: true,
    defer: true,
  })
}

useHead({
  title: 'Drive To Survive - แชร์รถ แชร์ค่าใช้จ่าย',
  script: headScripts,
})

// === Autocomplete Logic ===
function initAutocomplete() {
  if (!originInputEl.value || !destinationInputEl.value) return
  if (!window.google?.maps?.places) return

  const commonOpts = { fields: ['place_id', 'name', 'formatted_address', 'geometry'], types: ['geocode', 'establishment'] }

  originAutocomplete = new google.maps.places.Autocomplete(originInputEl.value, commonOpts)
  originAutocomplete.addListener('place_changed', () => {
    const p = originAutocomplete.getPlace()
    if (!p) return
    from.value = p.name || p.formatted_address || from.value
    fromData.value = { 
      lat: p.geometry?.location?.lat?.() ?? null, 
      lng: p.geometry?.location?.lng?.() ?? null,
      province: getProvinceFromPlace(p)
    }
  })

  destinationAutocomplete = new google.maps.places.Autocomplete(destinationInputEl.value, commonOpts)
  destinationAutocomplete.addListener('place_changed', () => {
    const p = destinationAutocomplete.getPlace()
    if (!p) return
    to.value = p.name || p.formatted_address || to.value
    toData.value = { 
      lat: p.geometry?.location?.lat?.() ?? null, 
      lng: p.geometry?.location?.lng?.() ?? null,
      province: getProvinceFromPlace(p)
    }
  })
}

// === Place Picker Logic ===
function openPlacePicker(field) {
  pickingField.value = field
  pickedPlace.value = { name: '', lat: null, lng: null }
  showPlacePicker.value = true
  nextTick(() => {
    const center = { lat: 13.7563, lng: 100.5018 }
    // If already has data, use it as center
    if (field === 'origin' && fromData.value.lat) { center.lat = fromData.value.lat; center.lng = fromData.value.lng }
    else if (field === 'destination' && toData.value.lat) { center.lat = toData.value.lat; center.lng = toData.value.lng }

    placePickerMap = new google.maps.Map(placePickerMapEl.value, {
      center,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })
    
    // Services
    if (!geocoder) geocoder = new google.maps.Geocoder()
    if (!placesService) placesService = new google.maps.places.PlacesService(placePickerMap)

    placePickerMap.addListener('click', (e) => { setPickerMarker(e.latLng); resolvePicked(e.latLng) })
  })
}

function setPickerMarker(latlng) {
  if (placePickerMarker) { placePickerMarker.setPosition(latlng); return }
  placePickerMarker = new google.maps.Marker({ position: latlng, map: placePickerMap, draggable: true })
  placePickerMarker.addListener('dragend', (e) => resolvePicked(e.latLng))
}

async function resolvePicked(latlng) {
  const lat = latlng.lat(), lng = latlng.lng()
  let geocodeRes = null
  await new Promise(resolve => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.length) {
        geocodeRes = results[0]
        resolve(results[0])
      } else resolve(null)
    })
  })
  
  let name = ''
  let province = null

  if (geocodeRes) {
      // Extract name parts logic similar to findTrip
      const comps = geocodeRes.address_components || []
      const byType = (t) => comps.find(c => c.types.includes(t))?.long_name
      // Try street + route
      const streetNumber = byType('street_number')
      const route = byType('route')
      name = (streetNumber && route) ? `${streetNumber} ${route}` : (route || geocodeRes.formatted_address || null)
      province = getProvinceFromPlace(geocodeRes)
  }
  
  // Clean address
  if (name) name = name.replace(/,?\s*(Thailand|ไทย|ประเทศ)\s*$/i, '')
  
  pickedPlace.value = { name: name || 'หมุดที่เลือก', lat, lng, province }
}

function applyPickedPlace() {
  if (!pickingField.value || !pickedPlace.value.name) return
  if (pickingField.value === 'origin') {
    from.value = pickedPlace.value.name
    fromData.value = { lat: pickedPlace.value.lat, lng: pickedPlace.value.lng, province: pickedPlace.value.province }
  } else {
    to.value = pickedPlace.value.name
    toData.value = { lat: pickedPlace.value.lat, lng: pickedPlace.value.lng, province: pickedPlace.value.province }
  }
  closePlacePicker()
}

function closePlacePicker() {
  showPlacePicker.value = false; pickingField.value = null; placePickerMarker = null; placePickerMap = null
}

const searchTrip = () => {
  router.push({
    path: localePath('/findTrip'),
    query: {
      from: from.value,
      to: to.value,
      date: date.value,
      seat: seat.value,
      fromLat: fromData.value.lat,
      fromLng: fromData.value.lng,
      fromProvince: fromData.value.province,
      toLat: toData.value.lat,
      toLng: toData.value.lng,
      toProvince: toData.value.province
    }
  })
}

// === Lifecycle ===
onMounted(() => {
  if (window.google?.maps) { initAutocomplete(); return }
  window[GMAPS_CB] = () => {
      try { delete window[GMAPS_CB] } catch { }
      initAutocomplete()
  }
})

</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active>div,
.modal-fade-leave-active>div {
  transition: all 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from>div,
.modal-fade-leave-to>div {
  transform: scale(0.95) translateY(10px);
}
</style>