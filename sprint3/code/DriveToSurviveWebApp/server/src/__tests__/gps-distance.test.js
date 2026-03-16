const { haversineDistance, getCrossedRadii, EARTH_RADIUS_KM } = require('../utils/gpsUtils');

describe('GPS Utils', () => {
    describe('haversineDistance', () => {
        test('should return 0 for identical coordinates', () => {
            expect(haversineDistance(16.4720, 102.8239, 16.4720, 102.8239)).toBe(0);
        });

        test('should calculate distance between KKU and Khon Kaen city center (~5km)', () => {
            // KKU: 16.4720, 102.8239
            // Khon Kaen center: 16.4419, 102.8360
            const distance = haversineDistance(16.4720, 102.8239, 16.4419, 102.8360);
            expect(distance).toBeGreaterThan(3);
            expect(distance).toBeLessThan(5);
        });

        test('should calculate distance between Bangkok and Khon Kaen (~450km)', () => {
            const distance = haversineDistance(13.7563, 100.5018, 16.4419, 102.8360);
            expect(distance).toBeGreaterThan(350);
            expect(distance).toBeLessThan(500);
        });

        test('should be symmetric', () => {
            const d1 = haversineDistance(16.47, 102.82, 16.44, 102.84);
            const d2 = haversineDistance(16.44, 102.84, 16.47, 102.82);
            expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
        });
    });

    describe('getCrossedRadii', () => {
        test('should return no radii for distance > 5km', () => {
            expect(getCrossedRadii(10)).toEqual([]);
        });

        test('should return FIVE_KM for distance <= 5km', () => {
            const radii = getCrossedRadii(4.5);
            expect(radii).toContain('FIVE_KM');
            expect(radii).not.toContain('ONE_KM');
        });

        test('should return FIVE_KM and ONE_KM for distance <= 1km', () => {
            const radii = getCrossedRadii(0.8);
            expect(radii).toContain('FIVE_KM');
            expect(radii).toContain('ONE_KM');
            expect(radii).not.toContain('ZERO_KM');
        });

        test('should return all three for distance <= 0.1km (arrived)', () => {
            const radii = getCrossedRadii(0.05);
            expect(radii).toContain('FIVE_KM');
            expect(radii).toContain('ONE_KM');
            expect(radii).toContain('ZERO_KM');
        });

        test('should return all three for distance = 0', () => {
            const radii = getCrossedRadii(0);
            expect(radii).toHaveLength(3);
        });
    });

    test('EARTH_RADIUS_KM should be 6371', () => {
        expect(EARTH_RADIUS_KM).toBe(6371);
    });
});
