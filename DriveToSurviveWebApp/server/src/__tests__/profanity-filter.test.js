const { containsProfanity, maskProfanity, normalizeText } = require('../utils/profanityFilter');

describe('Profanity Filter', () => {
    describe('containsProfanity', () => {
        test('should detect Thai profanity', () => {
            const result = containsProfanity('ไอ้ควาย ขับรถแย่มาก');
            expect(result.hasProfanity).toBe(true);
            expect(result.words).toContain('ควาย');
        });

        test('should detect English profanity', () => {
            const result = containsProfanity('This driver is a damn idiot');
            expect(result.hasProfanity).toBe(true);
            expect(result.words.length).toBeGreaterThan(0);
        });

        test('should return false for clean text', () => {
            const result = containsProfanity('คนขับสุภาพมากครับ ขับดี');
            expect(result.hasProfanity).toBe(false);
            expect(result.words).toHaveLength(0);
        });

        test('should whitelist legitimate Thai words', () => {
            const result = containsProfanity('วันนี้กินฟักทองอร่อยมาก');
            expect(result.hasProfanity).toBe(false);
        });

        test('should handle null/empty input', () => {
            expect(containsProfanity(null).hasProfanity).toBe(false);
            expect(containsProfanity('').hasProfanity).toBe(false);
            expect(containsProfanity(undefined).hasProfanity).toBe(false);
        });

        test('should detect spaced-out English profanity', () => {
            const result = containsProfanity('f u c k this ride');
            expect(result.hasProfanity).toBe(true);
        });
    });

    describe('maskProfanity', () => {
        test('should replace profanity with ***', () => {
            const result = maskProfanity('ไอ้ควาย ขับรถ');
            expect(result).toContain('***');
            expect(result).not.toContain('ควาย');
        });

        test('should not alter clean text', () => {
            const text = 'คนขับดีมาก';
            expect(maskProfanity(text)).toBe(text);
        });

        test('should handle null input', () => {
            expect(maskProfanity(null)).toBeNull();
        });
    });

    describe('normalizeText', () => {
        test('should replace character substitutions', () => {
            expect(normalizeText('@ss')).toBe('ass');
            expect(normalizeText('$h!t')).toBe('shit');
        });

        test('should lowercase text', () => {
            expect(normalizeText('HELLO')).toBe('hello');
        });
    });
});
