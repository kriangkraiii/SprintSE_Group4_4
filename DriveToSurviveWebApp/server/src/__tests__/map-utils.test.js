/**
 * Tests for bearing calculation, outlier detection, and haversine distance
 * Pure math functions replicated from useVehicleTracking composable
 */

// Since the composable uses ES module exports, we'll test the pure functions
// by extracting them. For this test, we replicate them as they're pure math:

function _calculateBearing(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180
    const toDeg = (rad) => (rad * 180) / Math.PI
    const φ1 = toRad(lat1), φ2 = toRad(lat2)
    const Δλ = toRad(lon2 - lon1)
    const x = Math.sin(Δλ) * Math.cos(φ2)
    const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    return (toDeg(Math.atan2(x, y)) + 360) % 360
}

function _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3
    const toRad = (deg) => (deg * Math.PI) / 180
    const Δφ = toRad(lat2 - lat1)
    const Δλ = toRad(lon2 - lon1)
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(Δλ / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

describe('Bearing Calculation', () => {
    it('North (0°): moving due north', () => {
        const bearing = _calculateBearing(16.47, 102.82, 16.48, 102.82)
        expect(bearing).toBeCloseTo(0, 0)
    })

    it('East (90°): moving due east', () => {
        const bearing = _calculateBearing(16.47, 102.82, 16.47, 102.83)
        expect(bearing).toBeCloseTo(90, 0)
    })

    it('South (180°): moving due south', () => {
        const bearing = _calculateBearing(16.48, 102.82, 16.47, 102.82)
        expect(bearing).toBeCloseTo(180, 0)
    })

    it('West (270°): moving due west', () => {
        const bearing = _calculateBearing(16.47, 102.83, 16.47, 102.82)
        expect(bearing).toBeCloseTo(270, 0)
    })

    it('Northeast (~45°): KKU area movement', () => {
        const bearing = _calculateBearing(16.47, 102.82, 16.48, 102.83)
        expect(bearing).toBeGreaterThan(30)
        expect(bearing).toBeLessThan(60)
    })

    it('returns value between 0 and 360', () => {
        const bearing = _calculateBearing(16.47, 102.82, 16.46, 102.81)
        expect(bearing).toBeGreaterThanOrEqual(0)
        expect(bearing).toBeLessThan(360)
    })

    it('same point returns 0', () => {
        const bearing = _calculateBearing(16.47, 102.82, 16.47, 102.82)
        expect(bearing).toBe(0)
    })
})

describe('Haversine Distance', () => {
    it('same point = 0 meters', () => {
        const dist = _haversineDistance(16.47, 102.82, 16.47, 102.82)
        expect(dist).toBeCloseTo(0, 1)
    })

    it('KKU to BKK ≈ 400-500 km', () => {
        const dist = _haversineDistance(16.4720, 102.8239, 13.7563, 100.5018)
        const km = dist / 1000
        expect(km).toBeGreaterThan(350)
        expect(km).toBeLessThan(500)
    })

    it('short distance (~100m)', () => {
        const dist = _haversineDistance(16.4720, 102.8239, 16.4729, 102.8239)
        expect(dist).toBeGreaterThan(90)
        expect(dist).toBeLessThan(110)
    })
})

describe('Outlier Detection Logic', () => {
    const OUTLIER_THRESHOLD_KM = 50

    function isOutlier(prevLat, prevLng, newLat, newLng) {
        const dist = _haversineDistance(prevLat, prevLng, newLat, newLng)
        return dist > OUTLIER_THRESHOLD_KM * 1000
    }

    it('normal movement (50m) is NOT an outlier', () => {
        expect(isOutlier(16.4720, 102.8239, 16.4725, 102.8239)).toBe(false)
    })

    it('large jump (100km) IS an outlier', () => {
        expect(isOutlier(16.4720, 102.8239, 17.4720, 102.8239)).toBe(true)
    })

    it('edge case: exactly at threshold', () => {
        // ~50km north
        const newLat = 16.4720 + (50 / 111.32) // rough degrees
        expect(isOutlier(16.4720, 102.8239, newLat, 102.8239)).toBe(false)
    })
})

describe('Stillness Detection Logic', () => {
    const STILLNESS_THRESHOLD_M = 10
    const STILLNESS_COUNT = 3

    function checkStillness(distances) {
        let count = 0
        for (const d of distances) {
            if (d < STILLNESS_THRESHOLD_M) {
                count++
                if (count >= STILLNESS_COUNT) return true
            } else {
                count = 0
            }
        }
        return false
    }

    it('3 consecutive small movements → stillness detected', () => {
        expect(checkStillness([5, 3, 8])).toBe(true)
    })

    it('2 small + 1 large → NOT still', () => {
        expect(checkStillness([5, 3, 50])).toBe(false)
    })

    it('4 small movements → stillness detected', () => {
        expect(checkStillness([2, 5, 3, 1])).toBe(true)
    })

    it('all large movements → NOT still', () => {
        expect(checkStillness([50, 100, 200])).toBe(false)
    })

    it('resetting after large movement', () => {
        expect(checkStillness([5, 5, 100, 5, 5])).toBe(false) // only 2 consecutive after reset
    })
})
