/**
 * useMapBounds — Auto-fit bounds with manual override lock
 * 
 * Features:
 * - fitBounds with 20% padding
 * - Max zoom cap (17)
 * - Manual pan detection → pause auto-fit for 15 seconds
 * - "กลับสู่มุมมองเดิม" button state
 * - Re-center on button press or timeout
 */
import { ref, onUnmounted } from 'vue'

const AUTO_FIT_PAUSE_MS = 15000
const MAX_ZOOM = 17
const BOUNDS_PADDING = { top: 60, right: 60, bottom: 60, left: 60 }

export function useMapBounds() {
    const isAutoFitPaused = ref(false)
    const showRecenterButton = ref(false)

    let map = null
    let pauseTimer = null
    let dragListener = null

    /**
     * Initialize with a Google Map instance
     */
    function init(mapInstance) {
        map = mapInstance
        if (!map) return

        // Detect manual pan/zoom → pause auto-fit
        dragListener = map.addListener('dragstart', () => {
            pauseAutoFit()
        })
    }

    /**
     * Fit bounds to include all given points
     * Respects manual override pause
     */
    function fitBounds(points) {
        if (!map || !window.google?.maps || isAutoFitPaused.value) return
        if (!points || points.length === 0) return

        const bounds = new google.maps.LatLngBounds()
        points.forEach(p => {
            if (p.lat != null && p.lng != null) {
                bounds.extend(new google.maps.LatLng(p.lat, p.lng))
            }
        })

        map.fitBounds(bounds, BOUNDS_PADDING)

        // Cap max zoom
        const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
            if (map.getZoom() > MAX_ZOOM) {
                map.setZoom(MAX_ZOOM)
            }
        })
    }

    /**
     * Pause auto-fit for 15 seconds (user manually panned)
     */
    function pauseAutoFit() {
        isAutoFitPaused.value = true
        showRecenterButton.value = true

        if (pauseTimer) clearTimeout(pauseTimer)
        pauseTimer = setTimeout(() => {
            resumeAutoFit()
        }, AUTO_FIT_PAUSE_MS)
    }

    /**
     * Resume auto-fit (button press or timeout)
     */
    function resumeAutoFit() {
        isAutoFitPaused.value = false
        showRecenterButton.value = false
        if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null }
    }

    /**
     * Smooth zoom to a location
     */
    function zoomTo(lat, lng, zoomLevel = 16) {
        if (!map) return
        map.panTo({ lat, lng })
        // Smooth zoom step
        const currentZoom = map.getZoom()
        if (currentZoom < zoomLevel) {
            const step = () => {
                const z = map.getZoom()
                if (z < zoomLevel) {
                    map.setZoom(z + 1)
                    setTimeout(step, 100)
                }
            }
            setTimeout(step, 300)
        } else {
            map.setZoom(zoomLevel)
        }
    }

    function destroy() {
        if (dragListener) google.maps.event.removeListener(dragListener)
        if (pauseTimer) clearTimeout(pauseTimer)
    }

    onUnmounted(() => destroy())

    return {
        isAutoFitPaused,
        showRecenterButton,
        init,
        fitBounds,
        pauseAutoFit,
        resumeAutoFit,
        zoomTo,
        destroy,
    }
}
