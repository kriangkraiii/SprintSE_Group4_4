const { filterContent } = require('../utils/contentFilter');

describe('Content Filter', () => {
    describe('Phone number masking', () => {
        test('should mask Thai phone numbers', () => {
            const result = filterContent('โทรหาเบอร์ 081-234-5678 ได้เลย');
            expect(result.isFiltered).toBe(true);
            expect(result.filtered).toContain('***-***-****');
            expect(result.filtered).not.toContain('081-234-5678');
        });

        test('should mask phone numbers without dashes', () => {
            const result = filterContent('เบอร์ 0812345678 นะ');
            expect(result.isFiltered).toBe(true);
            expect(result.filtered).toContain('***-***-****');
        });

        test('should mask +66 format', () => {
            const result = filterContent('+66812345678');
            expect(result.isFiltered).toBe(true);
        });
    });

    describe('URL blocking', () => {
        test('should block https URLs', () => {
            const result = filterContent('ดูเส้นทางที่ https://maps.google.com/abc');
            expect(result.isFiltered).toBe(true);
            expect(result.filtered).toContain('[ลิงก์ถูกซ่อน / Link hidden]');
        });

        test('should block http URLs', () => {
            const result = filterContent('http://example.com');
            expect(result.isFiltered).toBe(true);
            expect(result.filtered).not.toContain('http://');
        });
    });

    describe('Profanity masking', () => {
        test('should mask Thai profanity in chat', () => {
            const result = filterContent('ไอ้ควาย ขับรถแย่');
            expect(result.isFiltered).toBe(true);
            expect(result.filtered).toContain('***');
        });

        test('should mask English profanity', () => {
            const result = filterContent('What the fuck is this route');
            expect(result.isFiltered).toBe(true);
            expect(result.filtered).toContain('***');
        });
    });

    describe('Clean text', () => {
        test('should pass clean text unchanged', () => {
            const text = 'สวัสดีครับ จอดรอตรงไหนดี';
            const result = filterContent(text);
            expect(result.isFiltered).toBe(false);
            expect(result.filtered).toBe(text);
        });

        test('should handle null/empty input', () => {
            expect(filterContent(null).isFiltered).toBe(false);
            expect(filterContent('').isFiltered).toBe(false);
        });
    });

    describe('Original content preserved', () => {
        test('should preserve original in output', () => {
            const original = 'โทร 0812345678 นะ';
            const result = filterContent(original);
            expect(result.original).toBe(original);
            expect(result.filtered).not.toBe(original);
        });
    });
});
