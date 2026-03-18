/**
 * Profanity Filter — Thai + English
 * Blocks submission (review) or masks content (chat) containing profanity.
 */

// Thai profanity dictionary (common terms)
const THAI_PROFANITY = [
    'สัตว์', 'ควาย', 'หน้าหี', 'เหี้ย', 'สันดาน', 'ไอ้บ้า',
    'อีบ้า', 'มึง', 'กู', 'เย็ด', 'หี', 'ควย', 'แม่ง', 'เชี่ย',
    'อีเหี้ย', 'อีสัตว์', 'ไอ้โง่', 'อีโง่', 'ส้นตีน', 'อีดอก',
    'ไอ้หน้าหี', 'ห่า', 'อีห่า', 'สาด', 'อีสาด',
];

// English profanity dictionary
const ENGLISH_PROFANITY = [
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn',
    'dick', 'pussy', 'cunt', 'motherfucker', 'bullshit',
    'wtf', 'stfu', 'idiot', 'stupid', 'moron',
];

// Whitelist — Thai words that are legitimate but look like profanity
const WHITELIST = [
    'ฟักทอง', 'ฟักข้าว', 'สระว่ายน้ำ',
];

// Character substitution map for circumvention detection
const CHAR_SUBS = {
    '@': 'a', '0': 'o', '1': 'i', '3': 'e', '$': 's',
    '!': 'i', '+': 't', '©': 'c', '¢': 'c',
};

/**
 * Normalize text for matching: lowercase, strip spaces in known patterns,
 * replace common character substitutions.
 */
const normalizeText = (text) => {
    let normalized = text.toLowerCase();

    // Replace character substitutions
    for (const [sub, char] of Object.entries(CHAR_SUBS)) {
        normalized = normalized.replaceAll(sub, char);
    }

    return normalized;
};

/**
 * Remove whitelist words from text before checking profanity
 */
const removeWhitelisted = (text) => {
    let cleaned = text;
    for (const word of WHITELIST) {
        cleaned = cleaned.replaceAll(word, '');
    }
    return cleaned;
};

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {{ hasProfanity: boolean, words: string[] }}
 */
const containsProfanity = (text) => {
    if (!text || typeof text !== 'string') {
        return { hasProfanity: false, words: [] };
    }

    const cleanedText = removeWhitelisted(text);
    const normalized = normalizeText(cleanedText);
    const foundWords = [];

    // Check Thai profanity
    for (const word of THAI_PROFANITY) {
        if (cleanedText.includes(word)) {
            foundWords.push(word);
        }
    }

    // Check English profanity (normalized)
    for (const word of ENGLISH_PROFANITY) {
        // Word boundary check using regex
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(normalized)) {
            foundWords.push(word);
        }
    }

    // Check spaced-out English profanity (e.g., "f u c k")
    const noSpaces = normalized.replace(/\s+/g, '');
    for (const word of ENGLISH_PROFANITY) {
        if (word.length >= 4 && noSpaces.includes(word) && !foundWords.includes(word)) {
            foundWords.push(word);
        }
    }

    return {
        hasProfanity: foundWords.length > 0,
        words: [...new Set(foundWords)],
    };
};

/**
 * Mask profanity in text (replace with ***)
 * Used for chat messages (not reviews — reviews are blocked entirely)
 */
const maskProfanity = (text) => {
    if (!text) return text;

    let masked = text;

    for (const word of THAI_PROFANITY) {
        if (masked.includes(word)) {
            masked = masked.replaceAll(word, '***');
        }
    }

    for (const word of ENGLISH_PROFANITY) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        masked = masked.replace(regex, '***');
    }

    return masked;
};

module.exports = {
    containsProfanity,
    maskProfanity,
    normalizeText,
    THAI_PROFANITY,
    ENGLISH_PROFANITY,
    WHITELIST,
};
