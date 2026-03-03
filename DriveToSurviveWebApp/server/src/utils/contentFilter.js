/**
 * Content Filter — Chat Message Pipeline
 * Filters phone numbers, URLs, and profanity from chat messages.
 * Unlike review profanity filter (which blocks), this MASKS content.
 */

const { maskProfanity, containsProfanity } = require('./profanityFilter');
const { isEnabled } = require('./securityConfig');

// Thai phone number patterns
const PHONE_REGEX = /(\+?66|0)[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}/g;
const PHONE_SPELLED_REGEX = /(zero|one|two|three|four|five|six|seven|eight|nine|ศูนย์|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)[\s.,]*\1[\s.,]*/gi;

// URL patterns
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

// Line ID / social media patterns
const LINE_REGEX = /@?line[\s:]*[a-zA-Z0-9._-]+/gi;

/**
 * Filter content through the pipeline
 * @param {string} text - Original message text
 * @returns {{ filtered: string, original: string, isFiltered: boolean, matches: string[] }}
 */
const filterContent = (text) => {
    if (!text || typeof text !== 'string') {
        return { filtered: text, original: text, isFiltered: false, matches: [] };
    }

    // Skip all filtering if content filter is disabled by admin
    if (!isEnabled('contentFilterEnabled')) {
        return { filtered: text, original: text, isFiltered: false, matches: [] };
    }

    let filtered = text;
    const matches = [];

    // 1. Phone number masking
    const phoneMatches = filtered.match(PHONE_REGEX);
    if (phoneMatches) {
        matches.push(...phoneMatches.map(p => `phone:${p}`));
        filtered = filtered.replace(PHONE_REGEX, '***-***-****');
    }

    // 2. URL blocking
    const urlMatches = filtered.match(URL_REGEX);
    if (urlMatches) {
        matches.push(...urlMatches.map(u => `url:${u}`));
        filtered = filtered.replace(URL_REGEX, '[ลิงก์ถูกซ่อน / Link hidden]');
    }

    // 3. Line ID masking
    const lineMatches = filtered.match(LINE_REGEX);
    if (lineMatches) {
        matches.push(...lineMatches.map(l => `line:${l}`));
        filtered = filtered.replace(LINE_REGEX, '[ID ถูกซ่อน / ID hidden]');
    }

    // 4. Profanity masking
    const profanityCheck = containsProfanity(filtered);
    if (profanityCheck.hasProfanity) {
        matches.push(...profanityCheck.words.map(w => `profanity:${w}`));
        filtered = maskProfanity(filtered);
    }

    const isFiltered = matches.length > 0;

    return {
        filtered,
        original: text,
        isFiltered,
        matches,
    };
};

module.exports = {
    filterContent,
    PHONE_REGEX,
    URL_REGEX,
};
