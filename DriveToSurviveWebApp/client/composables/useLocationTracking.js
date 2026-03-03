/**
 * useLocationTracking — Multi-participant GPS tracking via Socket.IO
 *
 * Route-level: driver + all passengers share GPS in one room.
 * Features:
 * - Socket.IO real-time (route:{routeId} rooms)
 * - Multiple participant markers with smooth animation
 * - Bearing calculation for marker rotation
 * - GPS outlier detection (>50km jump discarded)
 * - Signal loss banner (>30s without update from any participant)
 * - Geolocation watchPosition for own GPS
 * - Preview mode (pre-booking, see driver only)
 */
import { ref, reactive, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const ANIMATION_DURATION = 1000
const OUTLIER_THRESHOLD_KM = 50
const SIGNAL_LOSS_TIMEOUT = 30000 // 30s — realistic for mobile GPS gaps

// ─── Geo Math ─────────────────────────────────────────────

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3
    const toRad = (deg) => (deg * Math.PI) / 180
    const Δφ = toRad(lat2 - lat1)
    const Δλ = toRad(lon2 - lon1)
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(Δλ / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function animateMarker(marker, from, to, duration = ANIMATION_DURATION) {
    if (!marker) return () => { }
    const startTime = performance.now()
    let animId = null

    function step(timestamp) {
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const lat = from.lat + (to.lat - from.lat) * eased
        const lng = from.lng + (to.lng - from.lng) * eased
        marker.setPosition({ lat, lng })
        if (progress < 1) animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => { if (animId) cancelAnimationFrame(animId) }
}

// Colors for participant markers
const MARKER_COLORS = ['#E8491D', '#059669', '#7C3AED', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#BE185D']

// ─── Composable ───────────────────────────────────────────

export function useLocationTracking() {
    const config = useRuntimeConfig()

    const myPosition = ref({ lat: null, lng: null })
    // Participants map: userId → { lat, lng, role, name, timestamp }
    const participants = reactive(new Map())
    const isConnected = ref(false)
    const signalLost = ref(false)
    const driverPosition = ref(null) // For preview mode
    const arrivalAlerts = ref([]) // Real-time arrival notifications
    const pickupPosition = ref({ lat: null, lng: null }) // Pickup location for proximity alerts

    let socket = null
    let watchId = null
    let cancelAnimations = new Map() // userId → cancel fn
    let previousPositions = new Map() // userId → {lat,lng}
    let signalLossTimer = null
    let reemitInterval = null
    let participantMarkers = new Map() // userId → google.maps.Marker
    let pickupMarkers = [] // Green pickup location markers
    let directionsRenderer = null // Google Directions route line

    // Proximity alert thresholds (meters) and tracking which have fired
    const PROXIMITY_THRESHOLDS = [
        { key: 'FIVE_KM', distance: 5000, title: 'คนขับอยู่ห่าง 5 กม.', body: 'คนขับกำลังเดินทางมาหาคุณ เตรียมตัวให้พร้อม' },
        { key: 'ONE_KM', distance: 1000, title: 'คนขับใกล้ถึงแล้ว! (1 กม.)', body: 'คนขับอยู่ห่างคุณประมาณ 1 กิโลเมตร' },
        { key: 'ZERO_KM', distance: 200, title: 'คนขับมาถึงแล้ว!', body: 'คนขับอยู่ใกล้คุณมาก เตรียมขึ้นรถได้เลย' },
    ]
    const firedAlerts = new Set() // track which thresholds have been fired

    function checkProximityAlerts(driverLat, driverLng) {
        const pickup = pickupPosition.value
        if (!pickup.lat || !pickup.lng) return

        const dist = haversineDistance(pickup.lat, pickup.lng, driverLat, driverLng)

        for (const threshold of PROXIMITY_THRESHOLDS) {
            if (dist <= threshold.distance && !firedAlerts.has(threshold.key)) {
                firedAlerts.add(threshold.key)
                const alert = {
                    radiusType: threshold.key,
                    title: threshold.title,
                    body: `${threshold.body} (${dist < 1000 ? Math.round(dist) + ' ม.' : (dist / 1000).toFixed(1) + ' กม.'})`,
                    timestamp: Date.now(),
                }
                arrivalAlerts.value = [...arrivalAlerts.value, alert]
            }
        }
    }

    /**
     * Set pickup location for proximity alerts
     * Call this after fetching booking pickup location
     */
    function setPickupLocation(lat, lng) {
        pickupPosition.value = { lat, lng }
    }

    function resetSignalLossTimer() {
        if (signalLossTimer) clearTimeout(signalLossTimer)
        signalLossTimer = setTimeout(() => { signalLost.value = true }, SIGNAL_LOSS_TIMEOUT)
    }

    function connectSocket(token) {
        if (socket) return socket
        const serverUrl = config.public.apiBase?.replace('/api', '') || 'http://localhost:3001'
        socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
        })
        socket.on('connect', () => { isConnected.value = true })
        socket.on('disconnect', () => { isConnected.value = false })
        return socket
    }

    /**
     * Start route-level GPS tracking (post-booking)
     * All participants see each other's markers on map
     */
    function startTracking(routeId, token, map, myName) {
        const sock = connectSocket(token)

        sock.on('connect', () => {
            sock.emit('join-route', routeId)
        })
        if (sock.connected) sock.emit('join-route', routeId)

        // Receive participant locations
        sock.on('participant-location', (data) => {
            handleParticipantUpdate(data, map)
        })

        // Start watching own GPS
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords
                    myPosition.value = { lat, lng }
                    sock.emit('location-update', { routeId, lat, lng, name: myName || '' })
                },
                (err) => console.warn('[GPS] error:', err.message),
                { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
            )

            // Re-emit position periodically — but only if GPS hasn't updated (fallback for desktop)
            let lastEmittedPos = { lat: null, lng: null }
            reemitInterval = setInterval(() => {
                const pos = myPosition.value
                if (pos.lat && sock.connected) {
                    // Only re-emit if position is same as last (GPS stuck) to keep alive
                    // If GPS is updating normally, watchPosition already emits
                    if (pos.lat === lastEmittedPos.lat && pos.lng === lastEmittedPos.lng) {
                        sock.emit('location-update', { routeId, lat: pos.lat, lng: pos.lng, name: myName || '' })
                    }
                    lastEmittedPos = { lat: pos.lat, lng: pos.lng }
                }
            }, 5000)
        }

        resetSignalLossTimer()
    }

    /**
     * Preview mode: pre-booking, see driver position only (no auth for GPS broadcast)
     */
    function startPreview(routeId, token, map) {
        const sock = connectSocket(token)

        sock.on('connect', () => {
            sock.emit('join-route-preview', routeId)
        })
        if (sock.connected) sock.emit('join-route-preview', routeId)

        sock.on('driver-location-preview', (data) => {
            driverPosition.value = { lat: data.lat, lng: data.lng, name: data.name }
            handleParticipantUpdate(data, map)
        })
    }

    function handleParticipantUpdate(data, map) {
        const { userId, lat, lng, role, name } = data
        const newPos = { lat, lng }

        // Outlier detection
        const prev = previousPositions.get(userId)
        if (prev) {
            const dist = haversineDistance(prev.lat, prev.lng, newPos.lat, newPos.lng)
            if (dist > OUTLIER_THRESHOLD_KM * 1000) return
        }

        // Get or create marker
        let marker = participantMarkers.get(userId)
        if (!marker && map && window.google?.maps) {
            const colorIdx = participantMarkers.size % MARKER_COLORS.length
            const isDriver = role === 'DRIVER'
            marker = new google.maps.Marker({
                map,
                icon: {
                    path: isDriver
                        ? 'M12 2C7.03 2 3 6.03 3 11c0 3.22 1.72 6.22 4.26 8.2L12 22l4.74-2.8C19.28 17.22 21 14.22 21 11c0-4.97-4.03-9-9-9zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z'
                        : 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                    fillColor: isDriver ? '#1B4D89' : MARKER_COLORS[colorIdx],
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                    scale: 1.5,
                    anchor: new google.maps.Point(12, isDriver ? 22 : 12),
                },
                zIndex: isDriver ? 1001 : 1000,
                title: `${name || (isDriver ? 'คนขับ' : 'ผู้โดยสาร')}`,
            })
            participantMarkers.set(userId, marker)
        }

        // Animate
        if (prev && marker) {
            const cancelPrev = cancelAnimations.get(userId)
            if (cancelPrev) cancelPrev()
            cancelAnimations.set(userId, animateMarker(marker, prev, newPos))
        } else if (marker) {
            marker.setPosition(newPos)
        }

        previousPositions.set(userId, { ...newPos })
        participants.set(userId, { lat, lng, role, name, timestamp: Date.now() })
        signalLost.value = false
        resetSignalLossTimer()

        // Client-side proximity alerts: when driver moves, check distance to pickup location
        if (role === 'DRIVER') {
            checkProximityAlerts(lat, lng)
        }
    }

    function stopTracking() {
        if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null }
        if (reemitInterval) { clearInterval(reemitInterval); reemitInterval = null }
        cancelAnimations.forEach(fn => fn())
        cancelAnimations.clear()
        if (signalLossTimer) { clearTimeout(signalLossTimer); signalLossTimer = null }
        participantMarkers.forEach(m => m.setMap(null))
        participantMarkers.clear()
        pickupMarkers.forEach(m => m.setMap(null))
        pickupMarkers = []
        if (directionsRenderer) { directionsRenderer.setMap(null); directionsRenderer = null }
        previousPositions.clear()
        pickupPosition.value = { lat: null, lng: null }
        firedAlerts.clear()
        if (socket) { socket.disconnect(); socket = null }
        isConnected.value = false
    }

    /**
     * Add a green pickup marker on the map for a passenger's pickup location
     * Uses Google Maps standard green pin with "A" label (like Google Maps directions)
     */
    function addPickupMarker(map, lat, lng, label) {
        if (!map || !window.google?.maps) return null
        const marker = new google.maps.Marker({
            map,
            position: { lat, lng },
            icon: {
                url: 'https://maps.google.com/mapfiles/marker_greenA.png',
            },
            zIndex: 1002,
            title: label || 'จุดรับผู้โดยสาร',
        })
        pickupMarkers.push(marker)
        return marker
    }

    /**
     * Draw/update a green route polyline from driver to pickup using Google Directions API
     */
    function drawRouteToPickup(map, driverPos, pickupPos) {
        if (!map || !window.google?.maps || !driverPos || !pickupPos) return

        const directionsService = new google.maps.DirectionsService()

        if (!directionsRenderer) {
            directionsRenderer = new google.maps.DirectionsRenderer({
                map,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: '#22c55e',
                    strokeOpacity: 0.85,
                    strokeWeight: 5,
                },
            })
        }

        directionsService.route(
            {
                origin: new google.maps.LatLng(driverPos.lat, driverPos.lng),
                destination: new google.maps.LatLng(pickupPos.lat, pickupPos.lng),
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(result)
                }
            }
        )
    }

    /**
     * Create a marker for "my" position (blue dot)
     */
    function createMyMarker(map) {
        if (!map || !window.google?.maps) return null
        return new google.maps.Marker({
            map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
                scale: 8,
            },
            zIndex: 999,
            title: 'ตำแหน่งของฉัน',
        })
    }

    onUnmounted(() => stopTracking())

    return {
        myPosition,
        participants,
        driverPosition,
        isConnected,
        signalLost,
        arrivalAlerts,
        pickupPosition,
        startTracking,
        startPreview,
        stopTracking,
        setPickupLocation,
        createMyMarker,
        addPickupMarker,
        drawRouteToPickup,
        haversineDistance,
    }
}
