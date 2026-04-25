import LinkifyIt from 'linkify-it';

const linkify = new LinkifyIt();

// Invisible / directionality abuse characters:
//   ​-‏  zero-width space, ZWNJ, ZWJ, LRM, RLM
//   ‪-‮  LRE, RLE, PDF, LRO, RLO (direction embedding/override)
//   ⁦-⁩  LRI, RLI, FSI, PDI (bidi isolates)
//   ﻿         BOM / zero-width no-break space
const INVISIBLE_REGEX = /[​-‏‪-‮⁦-⁩﻿]/;
const EMOJI_REGEX     = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;
const ZALGO_REGEX     = /[̀-ͯ]{5,}/;
const MENTION_REGEX   = /[@#]/;

const NAME_ALLOWLIST      = /^[\p{L}\p{N} \-']+$/u;
const CODE_NAME_ALLOWLIST = /^[a-z][a-z0-9_]*$/;

const SLURS = [
    'nigger', 'faggot', 'kike', 'chink', 'spic',
    'tranny', 'coon', 'gook', 'raghead',
];

const PROFANITY = [
    'ass', 'fuck', 'shit', 'bitch', 'cunt', 'cock', 'dick',
    'pussy', 'bastard', 'whore', 'slut', 'piss', 'arse',
    'wank', 'twat', 'bollocks', 'penis', 'vagina',
];

const LEET_MAP: Record<string, string> = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
    '6': 'g', '7': 't', '8': 'b', '$': 's', '!': 'i',
    '|': 'i', '+': 't',
};

function normalizeLeet(text: string): string {
    return text.split('').map(c => LEET_MAP[c.toLowerCase()] ?? c).join('');
}

function normalizeForDetection(text: string): string {
    let result = text.normalize('NFKC');
    result = normalizeLeet(result);
    result = result.replace(/[.\-_ ]+/g, '');
    return result.toLowerCase();
}

function containsWord(text: string, wordList: string[]): boolean {
    const normalized  = normalizeForDetection(text);
    const lettersOnly = normalized.replace(/[^a-z]/g, '');

    return wordList.some(word => {
        const boundary = new RegExp(`(?<![a-z])${word}(?![a-z])`, 'i');
        if (boundary.test(text) || boundary.test(normalized)) return true;
        if (word.length >= 5 && lettersOnly.includes(word)) return true;
        return false;
    });
}

function checkBase(value: string): 'invalid_characters' | 'link' | 'emoji' | 'mention' | 'slur' | null {
    if (INVISIBLE_REGEX.test(value) || ZALGO_REGEX.test(value)) return 'invalid_characters';
    if (linkify.match(value))                                    return 'link';
    if (EMOJI_REGEX.test(value))                                 return 'emoji';
    if (MENTION_REGEX.test(value))                               return 'mention';
    if (containsWord(value, SLURS))                              return 'slur';
    return null;
}

export type NameValidationResult =
    | { valid: true;  value: string }
    | { valid: false; reason: 'slur' | 'profanity' | 'link' | 'emoji' | 'mention' | 'invalid_characters' };

export type CodeNameValidationResult =
    | { valid: true;  value: string }
    | { valid: false; reason: 'slur' | 'profanity' | 'link' | 'emoji' | 'mention' | 'invalid_characters' };

export type DescriptionValidationResult =
    | { valid: true;  value: string }
    | { valid: false; reason: 'slur' | 'link' | 'emoji' | 'mention' | 'invalid_characters' };

/** Display names — letters, numbers, spaces, hyphens, apostrophes. No profanity. */
export function validateName(value: string): NameValidationResult {
    if (typeof value !== 'string') return { valid: true, value: '' };
    value = value.trim();
    if (value.length === 0) return { valid: true, value: '' };

    const base = checkBase(value);
    if (base) return { valid: false, reason: base };

    if (!NAME_ALLOWLIST.test(value))    return { valid: false, reason: 'invalid_characters' };
    if (containsWord(value, PROFANITY)) return { valid: false, reason: 'profanity' };

    return { valid: true, value };
}

/** Slug identifiers — normalised to lowercase. Must start with a letter, then letters, digits, underscores. No profanity. */
export function validateCodeName(value: string): CodeNameValidationResult {
    if (typeof value !== 'string') return { valid: true, value: '' };
    value = value.trim().toLowerCase();
    if (value.length === 0) return { valid: true, value: '' };

    const base = checkBase(value);
    if (base) return { valid: false, reason: base };

    if (!CODE_NAME_ALLOWLIST.test(value)) return { valid: false, reason: 'invalid_characters' };
    if (containsWord(value, PROFANITY))   return { valid: false, reason: 'profanity' };

    return { valid: true, value };
}

/** Free-form text — no profanity restriction, but slurs and structural abuses are still blocked. */
export function validateDescription(value: string): DescriptionValidationResult {
    if (typeof value !== 'string') return { valid: true, value: '' };
    value = value.trim();
    if (value.length === 0) return { valid: true, value: '' };

    const base = checkBase(value);
    if (base) return { valid: false, reason: base };

    return { valid: true, value };
}
