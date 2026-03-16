/**
 * useGeolocation — GPS wrapper with permission handling, accuracy circle, loading state
 * 
 * Features:
 * - getCurrentPosition with enableHighAccuracy + timeout 15s
 * - watchPosition for real-time tracking
 * - Permission denied → fallback to KKU (16.4720, 102.8239)
 * - No GPS hardware detection
 * - Accuracy circle rendering
 * - Loading/active state management
 */
import { ref, onUnmounted } from 'vue'

const KKU_DEFAULT = { lat: 16.4720, lng: 102.8239 }
const GPS_TIMEOUT = 15000
const MAX_ACCURACY = 500 // meters — discard if GPS accuracy worse than this

export function useGeolocation() {
    const position = ref({ lat: null, lng: null })
    const accuracy = ref(null)
    const isLocating = ref(false)
    const isActive = ref(false)
    const hasGps = ref(typeof navigator !== 'undefined' && !!navigator.geolocation)
    const permissionDenied = ref(false)
    const lastError = ref(null)

    let watchId = null

    /**
     * One-shot high accuracy position
     * Returns { lat, lng, accuracy } or null on failure
     */
    async function locate() {
        if (!hasGps.value) {
            lastError.value = 'NO_HARDWARE'
            return { ...KKU_DEFAULT, accuracy: null, isDefault: true }
        }

        isLocating.value = true
        lastError.value = null

        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: GPS_TIMEOUT,
                    maximumAge: 5000,
                })
            })

            const result = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                isDefault: false,
            }
            position.value = { lat: result.lat, lng: result.lng }
            accuracy.value = result.accuracy
            isActive.value = true
            permissionDenied.value = false
            return result
        } catch (err) {
            if (err.code === 1) { // PERMISSION_DENIED
                permissionDenied.value = true
                lastError.value = 'PERMISSION_DENIED'
            } else if (err.code === 2) {
                lastError.value = 'POSITION_UNAVAILABLE'
            } else if (err.code === 3) {
                lastError.value = 'TIMEOUT'
            }
            return { ...KKU_DEFAULT, accuracy: null, isDefault: true }
        } finally {
            isLocating.value = false
        }
    }

    /**
     * Start watching position (returns unwatch function)
     */
    function startWatch(onUpdate, onError) {
        if (!hasGps.value || watchId != null) return

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const coords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                }

                // Filter low accuracy
                if (coords.accuracy > MAX_ACCURACY) return

                position.value = { lat: coords.lat, lng: coords.lng }
                accuracy.value = coords.accuracy
                isActive.value = true

                if (onUpdate) onUpdate(coords)
            },
            (err) => {
                if (err.code === 1) {
                    permissionDenied.value = true
                    lastError.value = 'PERMISSION_DENIED'
                }
                if (onError) onError(err)
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        )
    }

    function stopWatch() {
        if (watchId != null) {
            navigator.geolocation.clearWatch(watchId)
            watchId = null
        }
        isActive.value = false
    }

    /**
     * Render blue pulsing marker + accuracy circle on a Google Map
     */
    function renderLocationMarker(map, lat, lng, accuracyMeters) {
        if (!map || !window.google?.maps) return { marker: null, circle: null }

        const pos = new google.maps.LatLng(lat, lng)

        const marker = new google.maps.Marker({
            position: pos,
            map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
            },
            zIndex: 999,
            title: 'ตำแหน่งของคุณ',
        })

        const circle = new google.maps.Circle({
            map,
            center: pos,
            radius: accuracyMeters || 50,
            fillColor: '#3B82F6',
            fillOpacity: 0.08,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.25,
            strokeWeight: 1,
            clickable: false,
        })

        return { marker, circle }
    }

    onUnmounted(() => stopWatch())

    return {
        position,
        accuracy,
        isLocating,
        isActive,
        hasGps,
        permissionDenied,
        lastError,
        locate,
        startWatch,
        stopWatch,
        renderLocationMarker,
        KKU_DEFAULT,
    }
}
