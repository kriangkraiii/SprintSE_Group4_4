/**
 * useVehicleTracking — Polling + smooth interpolation + bearing + outlier detection
 * 
 * Features:
 * - Poll driver location every 5 seconds
 * - Smooth marker animation (ease-out cubic, 1000ms)
 * - Bearing calculation (Forward Azimuth)
 * - GPS outlier detection (>50km jump discarded)
 * - Stillness detection (<10m in 3 consecutive updates → freeze)
 * - GPS signal loss banner (>30s without update)
 */
import { ref, onUnmounted } from 'vue'

const POLL_INTERVAL = 5000
const ANIMATION_DURATION = 1000
const OUTLIER_THRESHOLD_KM = 50
const STILLNESS_THRESHOLD_M = 10
const STILLNESS_COUNT = 3
const SIGNAL_LOSS_TIMEOUT = 30000

// ─── Geo Math ─────────────────────────────────────────────

export function calculateBearing(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180
    const toDeg = (rad) => (rad * 180) / Math.PI

    const φ1 = toRad(lat1), φ2 = toRad(lat2)
    const Δλ = toRad(lon2 - lon1)

    const x = Math.sin(Δλ) * Math.cos(φ2)
    const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    return (toDeg(Math.atan2(x, y)) + 360) % 360
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180
    const Δφ = toRad(lat2 - lat1)
    const Δλ = toRad(lon2 - lon1)
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(Δλ / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Animation ────────────────────────────────────────────

function animateMarker(marker, from, to, duration = ANIMATION_DURATION) {
    const startTime = performance.now()
    const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng)

    // Rotate car icon
    const icon = marker.getIcon()
    if (icon && typeof icon === 'object') {
        marker.setIcon({ ...icon, rotation: bearing })
    }

    let animId = null

    function step(timestamp) {
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic for natural deceleration
        const eased = 1 - Math.pow(1 - progress, 3)

        const lat = from.lat + (to.lat - from.lat) * eased
        const lng = from.lng + (to.lng - from.lng) * eased
        marker.setPosition({ lat, lng })

        if (progress < 1) {
            animId = requestAnimationFrame(step)
        }
    }

    animId = requestAnimationFrame(step)
    return () => { if (animId) cancelAnimationFrame(animId) }
}

// ─── Composable ───────────────────────────────────────────

export function useVehicleTracking() {
    const { $api } = useNuxtApp()

    const driverPosition = ref({ lat: null, lng: null })
    const bearing = ref(0)
    const isTracking = ref(false)
    const signalLost = ref(false)
    const lastUpdateTime = ref(null)

    let pollTimer = null
    let cancelAnimation = null
    let previousPosition = null
    let stillnessCount = 0
    let signalLossTimer = null

    /**
     * Create car marker with custom icon
     */
    function createCarMarker(map, lat, lng) {
        if (!map || !window.google?.maps) return null

        return new google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
                path: 'M12 2C7.03 2 3 6.03 3 11c0 3.22 1.72 6.22 4.26 8.2L12 22l4.74-2.8C19.28 17.22 21 14.22 21 11c0-4.97-4.03-9-9-9zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z',
                fillColor: '#1B4D89',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.5,
                anchor: new google.maps.Point(12, 22),
                rotation: 0,
            },
            zIndex: 1000,
            title: 'คนขับ',
        })
    }

    /**
     * Start polling driver location
     */
    function startTracking(bookingId, carMarker, options = {}) {
        if (isTracking.value) return

        isTracking.value = true
        resetSignalLossTimer()

        const poll = async () => {
            try {
                const res = await $api(`/arrival-notifications/location/${bookingId}`)
                const newPos = {
                    lat: parseFloat(res?.lat || res?.latitude),
                    lng: parseFloat(res?.lng || res?.longitude),
                }

                if (isNaN(newPos.lat) || isNaN(newPos.lng)) return

                // ─── Outlier Detection ─────────────────────
                if (previousPosition) {
                    const dist = haversineDistance(
                        previousPosition.lat, previousPosition.lng,
                        newPos.lat, newPos.lng
                    )

                    // > 50km in 5s → impossible → discard
                    if (dist > OUTLIER_THRESHOLD_KM * 1000) {
                        console.warn(`GPS outlier detected: ${(dist / 1000).toFixed(1)}km jump. Discarding.`)
                        return
                    }

                    // ─── Stillness Detection ───────────────
                    if (dist < STILLNESS_THRESHOLD_M) {
                        stillnessCount++
                        if (stillnessCount >= STILLNESS_COUNT) {
                            // Driver is stationary, don't animate
                            return
                        }
                    } else {
                        stillnessCount = 0
                    }

                    // ─── Smooth Animation ──────────────────
                    if (cancelAnimation) cancelAnimation()
                    cancelAnimation = animateMarker(carMarker, previousPosition, newPos, ANIMATION_DURATION)

                    bearing.value = calculateBearing(
                        previousPosition.lat, previousPosition.lng,
                        newPos.lat, newPos.lng
                    )
                } else {
                    // First position — just set it
                    carMarker?.setPosition(newPos)
                }

                previousPosition = { ...newPos }
                driverPosition.value = { ...newPos }
                lastUpdateTime.value = Date.now()
                signalLost.value = false
                resetSignalLossTimer()

                if (options.onUpdate) options.onUpdate(newPos)
            } catch (err) {
                // Silent — API might not have location yet
            }
        }

        poll()
        pollTimer = setInterval(poll, POLL_INTERVAL)
    }

    function stopTracking() {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
        if (cancelAnimation) { cancelAnimation(); cancelAnimation = null }
        if (signalLossTimer) { clearTimeout(signalLossTimer); signalLossTimer = null }
        isTracking.value = false
        previousPosition = null
        stillnessCount = 0
    }

    function resetSignalLossTimer() {
        if (signalLossTimer) clearTimeout(signalLossTimer)
        signalLossTimer = setTimeout(() => {
            signalLost.value = true
        }, SIGNAL_LOSS_TIMEOUT)
    }

    onUnmounted(() => stopTracking())

    return {
        driverPosition,
        bearing,
        isTracking,
        signalLost,
        lastUpdateTime,
        startTracking,
        stopTracking,
        createCarMarker,
        calculateBearing,
        haversineDistance,
    }
}
