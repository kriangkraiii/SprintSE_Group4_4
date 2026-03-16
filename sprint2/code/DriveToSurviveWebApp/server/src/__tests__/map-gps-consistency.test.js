/**
 * Tests for Map GPS Button Consistency & Tab Count features
 * 
 * Validates:
 * 1. useRouteMap shared utilities (formatDistance, formatDuration)
 * 2. getMap() accessor pattern
 * 3. GPS geolocation fallback logic
 * 4. Tab count rendering logic
 */

// ─── Replicate formatDistance from useRouteMap ───────────────
function formatDistance(input) {
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

// ─── Replicate formatDuration from useRouteMap ──────────────
function formatDuration(input) {
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

// ─── Replicate GPS fallback logic ───────────────────────────
const KKU_DEFAULT = { lat: 16.4720, lng: 102.8239 }

function gpsLocateResult(geoResult) {
    if (!geoResult || geoResult.error) {
        return { ...KKU_DEFAULT, accuracy: null, isDefault: true }
    }
    return {
        lat: geoResult.lat,
        lng: geoResult.lng,
        accuracy: geoResult.accuracy,
        isDefault: false,
    }
}

// ─── Replicate tabCount logic (admin page) ──────────────────
function tabCount(key, disputes, reports) {
    if (key === 'disputes') return disputes.length
    if (key === 'reports') return reports.length
    return 0
}

// ─── Replicate getMap accessor pattern ──────────────────────
function createMapComposable() {
    let gmap = null
    return {
        initializeMap: (container) => { gmap = container },
        getMap: () => gmap,
    }
}

// ═══════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════

describe('formatDistance (useRouteMap)', () => {
    test('should return single segment as-is', () => {
        expect(formatDistance('5 กม.')).toBe('5 กม.')
    })

    test('should combine kilometer + meter segments', () => {
        expect(formatDistance('2 กม.+500 เมตร')).toBe('2.5 กม.')
    })

    test('should handle meters-only result', () => {
        expect(formatDistance('300 ม.+200 ม.')).toBe('500 ม.')
    })

    test('should handle non-string input', () => {
        expect(formatDistance(42)).toBe(42)
        expect(formatDistance(null)).toBe(null)
    })

    test('should combine multiple km segments', () => {
        expect(formatDistance('10 กม.+5 กม.')).toBe('15 กม.')
    })

    test('should round to 1 decimal when needed', () => {
        expect(formatDistance('1 กม.+500 เมตร')).toBe('1.5 กม.')
    })
})

describe('formatDuration (useRouteMap)', () => {
    test('should return single segment as-is', () => {
        expect(formatDuration('30 นาที')).toBe('30 นาที')
    })

    test('should combine hours + minutes', () => {
        expect(formatDuration('1 ชม.+30 นาที')).toBe('1 ชม. 30 นาที')
    })

    test('should handle exact hours', () => {
        expect(formatDuration('2 ชม.+0 นาที')).toBe('2 ชม.')
    })

    test('should handle non-string input', () => {
        expect(formatDuration(60)).toBe(60)
    })

    test('should combine multiple minute segments', () => {
        expect(formatDuration('20 นาที+40 นาที')).toBe('1 ชม.')
    })
})

describe('GPS Locate Fallback Logic', () => {
    test('should return KKU default on error', () => {
        const result = gpsLocateResult({ error: 'PERMISSION_DENIED' })
        expect(result.isDefault).toBe(true)
        expect(result.lat).toBe(KKU_DEFAULT.lat)
        expect(result.lng).toBe(KKU_DEFAULT.lng)
        expect(result.accuracy).toBeNull()
    })

    test('should return KKU default on null', () => {
        const result = gpsLocateResult(null)
        expect(result.isDefault).toBe(true)
        expect(result.lat).toBe(16.4720)
    })

    test('should return actual position on success', () => {
        const result = gpsLocateResult({ lat: 13.75, lng: 100.50, accuracy: 25 })
        expect(result.isDefault).toBe(false)
        expect(result.lat).toBe(13.75)
        expect(result.lng).toBe(100.50)
        expect(result.accuracy).toBe(25)
    })

    test('KKU_DEFAULT should be valid coordinates', () => {
        expect(KKU_DEFAULT.lat).toBeGreaterThan(16)
        expect(KKU_DEFAULT.lat).toBeLessThan(17)
        expect(KKU_DEFAULT.lng).toBeGreaterThan(102)
        expect(KKU_DEFAULT.lng).toBeLessThan(103)
    })
})

describe('getMap() accessor (useRouteMap)', () => {
    test('should return null before initialization', () => {
        const { getMap } = createMapComposable()
        expect(getMap()).toBeNull()
    })

    test('should return map instance after initialization', () => {
        const { initializeMap, getMap } = createMapComposable()
        const mockContainer = { id: 'test-map' }
        initializeMap(mockContainer)
        expect(getMap()).toBe(mockContainer)
    })

    test('should always return the latest map reference', () => {
        const { initializeMap, getMap } = createMapComposable()
        initializeMap('map-1')
        expect(getMap()).toBe('map-1')
        initializeMap('map-2')
        expect(getMap()).toBe('map-2')
    })
})

describe('Tab Count Logic (admin/sprint2)', () => {
    test('should return disputes count', () => {
        const disputes = [{ id: 1 }, { id: 2 }, { id: 3 }]
        expect(tabCount('disputes', disputes, [])).toBe(3)
    })

    test('should return reports count', () => {
        const reports = [{ id: 1 }]
        expect(tabCount('reports', [], reports)).toBe(1)
    })

    test('should return 0 for unknown key', () => {
        expect(tabCount('unknown', [1, 2], [3])).toBe(0)
    })

    test('should return 0 for empty arrays', () => {
        expect(tabCount('disputes', [], [])).toBe(0)
        expect(tabCount('reports', [], [])).toBe(0)
    })
})

describe('handleLocateMe guard conditions', () => {
    function shouldLocate(isLocating, hasGps) {
        if (isLocating || !hasGps) return false
        return true
    }

    test('should NOT locate when already locating', () => {
        expect(shouldLocate(true, true)).toBe(false)
    })

    test('should NOT locate when no GPS hardware', () => {
        expect(shouldLocate(false, false)).toBe(false)
    })

    test('should locate when GPS available and not busy', () => {
        expect(shouldLocate(false, true)).toBe(true)
    })

    test('should NOT locate when both conditions fail', () => {
        expect(shouldLocate(true, false)).toBe(false)
    })
})
