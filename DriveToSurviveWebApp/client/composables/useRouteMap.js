import { ref } from 'vue'

/**
 * useRouteMap — Shared composable for Google Maps logic
 * ใช้ร่วมกันระหว่าง myTrip และ myRoute
 */
export function useRouteMap() {
    let gmap = null
    let activePolyline = null
    let startMarker = null
    let endMarker = null
    let geocoder = null
    let placesService = null
    let stopMarkers = []
    let provinceLayer = null
    let provinceTooltip = null
    const mapReady = ref(false)

    // Province EN→TH name mapping for overlay labels
    const PROV_TH = {
        'Amnat Charoen':'อำนาจเจริญ','Ang Thong':'อ่างทอง','Bangkok Metropolis':'กรุงเทพฯ',
        'Bueng Kan':'บึงกาฬ','Buri Ram':'บุรีรัมย์','Chachoengsao':'ฉะเชิงเทรา',
        'Chai Nat':'ชัยนาท','Chaiyaphum':'ชัยภูมิ','Chanthaburi':'จันทบุรี',
        'Chiang Mai':'เชียงใหม่','Chiang Rai':'เชียงราย','Chon Buri':'ชลบุรี',
        'Chumphon':'ชุมพร','Kalasin':'กาฬสินธุ์','Kamphaeng Phet':'กำแพงเพชร',
        'Kanchanaburi':'กาญจนบุรี','Khon Kaen':'ขอนแก่น','Krabi':'กระบี่',
        'Lampang':'ลำปาง','Lamphun':'ลำพูน','Loei':'เลย','Lop Buri':'ลพบุรี',
        'Mae Hong Son':'แม่ฮ่องสอน','Maha Sarakham':'มหาสารคาม','Mukdahan':'มุกดาหาร',
        'Nakhon Nayok':'นครนายก','Nakhon Pathom':'นครปฐม','Nakhon Phanom':'นครพนม',
        'Nakhon Ratchasima':'นครราชสีมา','Nakhon Sawan':'นครสวรรค์',
        'Nakhon Si Thammarat':'นครศรีธรรมราช','Nan':'น่าน','Narathiwat':'นราธิวาส',
        'Nong Bua Lam Phu':'หนองบัวลำภู','Nong Khai':'หนองคาย','Nonthaburi':'นนทบุรี',
        'Pathum Thani':'ปทุมธานี','Pattani':'ปัตตานี','Phangnga':'พังงา',
        'Phatthalung':'พัทลุง','Phayao':'พะเยา','Phetchabun':'เพชรบูรณ์',
        'Phetchaburi':'เพชรบุรี','Phichit':'พิจิตร','Phitsanulok':'พิษณุโลก',
        'Phra Nakhon Si Ayutthaya':'อยุธยา','Phrae':'แพร่','Phuket':'ภูเก็ต',
        'Prachin Buri':'ปราจีนบุรี','Prachuap Khiri Khan':'ประจวบฯ',
        'Ranong':'ระนอง','Ratchaburi':'ราชบุรี','Rayong':'ระยอง','Roi Et':'ร้อยเอ็ด',
        'Sa Kaeo':'สระแก้ว','Sakon Nakhon':'สกลนคร','Samut Prakan':'สมุทรปราการ',
        'Samut Sakhon':'สมุทรสาคร','Samut Songkhram':'สมุทรสงคราม','Saraburi':'สระบุรี',
        'Satun':'สตูล','Si Sa Ket':'ศรีสะเกษ','Sing Buri':'สิงห์บุรี',
        'Songkhla':'สงขลา','Sukhothai':'สุโขทัย','Suphan Buri':'สุพรรณบุรี',
        'Surat Thani':'สุราษฎร์ธานี','Surin':'สุรินทร์','Tak':'ตาก',
        'Trang':'ตรัง','Trat':'ตราด','Ubon Ratchathani':'อุบลราชธานี',
        'Udon Thani':'อุดรธานี','Uthai Thani':'อุทัยธานี','Uttaradit':'อุตรดิตถ์',
        'Yala':'ยะลา','Yasothon':'ยโสธร'
    }

    function initializeMap(container) {
        if (!container || gmap) return
        gmap = new google.maps.Map(container, {
            center: { lat: 13.7563, lng: 100.5018 },
            zoom: 6,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        })
        geocoder = new google.maps.Geocoder()
        placesService = new google.maps.places.PlacesService(gmap)
        mapReady.value = true

        // Load province overlay (lazy, non-blocking)
        loadProvinceOverlay()
    }

    async function loadProvinceOverlay() {
        if (provinceLayer || !gmap) return
        try {
            const res = await fetch('/data/thailand-provinces.json')
            if (!res.ok) return
            const geojson = await res.json()

            provinceLayer = new google.maps.Data({ map: gmap })
            provinceLayer.addGeoJson(geojson)

            // Default style — subtle boundaries
            provinceLayer.setStyle({
                fillColor: '#3b82f6',
                fillOpacity: 0.03,
                strokeColor: '#2563eb',
                strokeWeight: 1,
                strokeOpacity: 0.25,
            })

            // Tooltip element
            provinceTooltip = document.createElement('div')
            Object.assign(provinceTooltip.style, {
                position: 'absolute', padding: '6px 12px',
                background: 'rgba(0,0,0,0.8)', color: '#fff',
                borderRadius: '6px', fontSize: '13px', fontWeight: '500',
                pointerEvents: 'none', display: 'none', zIndex: '999',
                whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            })
            gmap.getDiv().appendChild(provinceTooltip)

            // Hover highlight
            provinceLayer.addListener('mouseover', (e) => {
                provinceLayer.overrideStyle(e.feature, {
                    fillOpacity: 0.12,
                    strokeWeight: 2,
                    strokeOpacity: 0.6,
                })
                const name = e.feature.getProperty('name')
                const thName = PROV_TH[name] || name
                provinceTooltip.textContent = `📍 ${thName}`
                provinceTooltip.style.display = 'block'
            })

            provinceLayer.addListener('mousemove', (e) => {
                if (!provinceTooltip) return
                const mapDiv = gmap.getDiv()
                const rect = mapDiv.getBoundingClientRect()
                const point = e.domEvent || e
                if (point.clientX !== undefined) {
                    provinceTooltip.style.left = (point.clientX - rect.left + 12) + 'px'
                    provinceTooltip.style.top = (point.clientY - rect.top - 30) + 'px'
                }
            })

            provinceLayer.addListener('mouseout', () => {
                provinceLayer.revertStyle()
                if (provinceTooltip) provinceTooltip.style.display = 'none'
            })
        } catch (err) {
            console.warn('[ProvinceOverlay] Failed to load:', err.message)
        }
    }

    function waitMapReady() {
        return new Promise((resolve) => {
            if (mapReady.value) return resolve(true)
            const t = setInterval(() => {
                if (mapReady.value) { clearInterval(t); resolve(true) }
            }, 50)
        })
    }

    function reverseGeocode(lat, lng) {
        return new Promise((resolve) => {
            if (!geocoder) return resolve(null)
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status !== 'OK' || !results?.length) return resolve(null)
                resolve(results[0])
            })
        })
    }

    async function extractNameParts(geocodeResult, serverLocation) {
        if (!geocodeResult) return { name: null, area: null }
        const comps = geocodeResult.address_components || []
        const byType = (t) => comps.find(c => c.types.includes(t))?.long_name
        const byTypeShort = (t) => comps.find(c => c.types.includes(t))?.short_name

        const types = geocodeResult.types || []
        const isPoi = types.includes('point_of_interest') || types.includes('establishment') || types.includes('premise')

        let name = null
        if (isPoi && geocodeResult.place_id) {
            const poiName = await getPlaceName(geocodeResult.place_id)
            if (poiName) name = poiName
        }
        if (!name) {
            const streetNumber = byType('street_number')
            const route = byType('route')
            name = streetNumber && route ? `${streetNumber} ${route}` : route || geocodeResult.formatted_address || null
        }

        // Prefer province data from server (ThailandGISMap) over Google
        const serverProvince = serverLocation?.province
        const sublocality = byType('sublocality') || byType('neighborhood') || byType('locality') || byType('administrative_area_level_2')
        const province = serverProvince || byType('administrative_area_level_1') || byTypeShort('administrative_area_level_1')

        let area = null
        if (sublocality && province) area = `${sublocality}, ${province}`
        else if (province) area = province

        if (name) name = name.replace(/,?\s*(Thailand|ไทย)\s*$/i, '')
        return { name, area }
    }

    function getPlaceName(placeId) {
        return new Promise((resolve) => {
            if (!placesService || !placeId) return resolve(null)
            placesService.getDetails({ placeId, fields: ['name'] }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.name) resolve(place.name)
                else resolve(null)
            })
        })
    }

    async function updateMap(trip) {
        if (!trip) return
        await waitMapReady()
        if (!gmap) return

        // cleanup
        if (activePolyline) { activePolyline.setMap(null); activePolyline = null }
        if (startMarker) { startMarker.setMap(null); startMarker = null }
        if (endMarker) { endMarker.setMap(null); endMarker = null }
        if (stopMarkers.length) { stopMarkers.forEach(m => m.setMap(null)); stopMarkers = [] }

        const start = { lat: Number(trip.coords[0][0]), lng: Number(trip.coords[0][1]) }
        const end = { lat: Number(trip.coords[1][0]), lng: Number(trip.coords[1][1]) }

        // Markers with premium icons
        startMarker = new google.maps.Marker({
            position: start, map: gmap,
            icon: {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                fillColor: '#10b981', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2,
                scale: 1.8, anchor: new google.maps.Point(12, 22), labelOrigin: new google.maps.Point(12, 10),
            },
            label: { text: 'A', color: '#ffffff', fontWeight: 'bold', fontSize: '11px' },
            title: 'จุดเริ่มต้น', zIndex: 10,
        })
        endMarker = new google.maps.Marker({
            position: end, map: gmap,
            icon: {
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2,
                scale: 1.8, anchor: new google.maps.Point(12, 22), labelOrigin: new google.maps.Point(12, 10),
            },
            label: { text: 'B', color: '#ffffff', fontWeight: 'bold', fontSize: '11px' },
            title: 'จุดปลายทาง', zIndex: 10,
        })

        // Waypoint markers
        if (Array.isArray(trip.stopsCoords) && trip.stopsCoords.length) {
            stopMarkers = trip.stopsCoords.map((s, idx) => new google.maps.Marker({
                position: { lat: s.lat, lng: s.lng },
                map: gmap,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE, scale: 9,
                    fillColor: '#f59e0b', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2,
                    labelOrigin: new google.maps.Point(0, 0),
                },
                label: { text: String(idx + 1), color: '#ffffff', fontWeight: 'bold', fontSize: '10px' },
                title: s.name || s.address || `จุดแวะ ${idx + 1}`, zIndex: 5,
            }))
        }

        // Polyline
        if (trip.polyline && google.maps.geometry?.encoding) {
            const path = google.maps.geometry.encoding.decodePath(trip.polyline)
            activePolyline = new google.maps.Polyline({
                path, map: gmap,
                strokeColor: '#2563eb', strokeOpacity: 0.9, strokeWeight: 5,
            })
            const bounds = new google.maps.LatLngBounds()
            path.forEach(p => bounds.extend(p))
            if (trip.stopsCoords?.length) {
                trip.stopsCoords.forEach(s => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
            }
            gmap.fitBounds(bounds)
        } else {
            const bounds = new google.maps.LatLngBounds()
            bounds.extend(start)
            bounds.extend(end)
            if (trip.stopsCoords?.length) {
                trip.stopsCoords.forEach(s => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
            }
            gmap.fitBounds(bounds)
        }
    }

    return {
        mapReady,
        initializeMap,
        waitMapReady,
        reverseGeocode,
        extractNameParts,
        getPlaceName,
        updateMap,
    }
}

/** Shared utility functions */
export function cleanAddr(a) {
    return (a || '')
        .replace(/,?\s*(Thailand|ไทย|ประเทศ)\s*$/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

export function formatDistance(input) {
    if (typeof input !== 'string') return input
    const parts = input.split('+')
    if (parts.length <= 1) return input

    let meters = 0
    for (const seg of parts) {
        const n = parseFloat(seg.replace(/[^\d.]/g, ''))
        if (Number.isNaN(n)) continue
        if (/กม/.test(seg)) meters += n * 1000
        else if (/เมตร|ม\./.test(seg)) meters += n
        else meters += n
    }

    if (meters >= 1000) {
        const km = Math.round((meters / 1000) * 10) / 10
        return `${(km % 1 === 0 ? km.toFixed(0) : km)} กม.`
    }
    return `${Math.round(meters)} ม.`
}

export function formatDuration(input) {
    if (typeof input !== 'string') return input
    const parts = input.split('+')
    if (parts.length <= 1) return input

    let minutes = 0
    for (const seg of parts) {
        const n = parseFloat(seg.replace(/[^\d.]/g, ''))
        if (Number.isNaN(n)) continue
        if (/ชม/.test(seg)) minutes += n * 60
        else minutes += n
    }

    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h ? (m ? `${h} ชม. ${m} นาที` : `${h} ชม.`) : `${m} นาที`
}

/** Status badge config */
export const STATUS_BADGES = {
    pending: { class: 'bg-amber-100 text-amber-700', label: 'รอดำเนินการ' },
    confirmed: { class: 'bg-green-100 text-green-700', label: 'ยืนยันแล้ว' },
    in_progress: { class: 'bg-blue-100 text-blue-700', label: 'กำลังเดินทาง' },
    completed: { class: 'bg-emerald-100 text-emerald-700', label: 'เสร็จสิ้น' },
    rejected: { class: 'bg-red-100 text-red-700', label: 'ปฏิเสธ' },
    cancelled: { class: 'bg-slate-100 text-slate-600', label: 'ยกเลิก' },
    no_show: { class: 'bg-orange-100 text-orange-700', label: 'ไม่มาตามนัด' },
    available: { class: 'bg-green-100 text-green-700', label: 'เปิดรับผู้โดยสาร' },
    full: { class: 'bg-amber-100 text-amber-700', label: 'เต็ม' },
}

export function getStatusBadge(status) {
    return STATUS_BADGES[status] || { class: 'bg-slate-100 text-slate-600', label: status }
}

/** Cancel reason options (shared) */
export const CANCEL_REASONS = [
    { value: 'CHANGE_OF_PLAN', label: 'เปลี่ยนแผน/มีธุระกะทันหัน' },
    { value: 'FOUND_ALTERNATIVE', label: 'พบวิธีเดินทางอื่นแล้ว' },
    { value: 'DRIVER_DELAY', label: 'คนขับล่าช้าหรือเลื่อนเวลา' },
    { value: 'PRICE_ISSUE', label: 'ราคาหรือค่าใช้จ่ายไม่เหมาะสม' },
    { value: 'WRONG_LOCATION', label: 'เลือกจุดรับ–ส่งผิด' },
    { value: 'DUPLICATE_OR_WRONG_DATE', label: 'จองซ้ำหรือจองผิดวัน' },
    { value: 'SAFETY_CONCERN', label: 'กังวลด้านความปลอดภัย' },
    { value: 'WEATHER_OR_FORCE_MAJEURE', label: 'สภาพอากาศ/เหตุสุดวิสัย' },
    { value: 'COMMUNICATION_ISSUE', label: 'สื่อสารไม่สะดวก/ติดต่อไม่ได้' },
]

/** Cancel reason label map */
export const REASON_LABEL_MAP = Object.fromEntries(CANCEL_REASONS.map(r => [r.value, r.label]))
export function reasonLabel(v) { return REASON_LABEL_MAP[v] || v }
