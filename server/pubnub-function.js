// PubNub Function: On Before Publish
// This function runs on PubNub's edge network before every publish event.
// It enforces rate limiting (anti-flood) and masks profanity.
//
// To install:
// 1. Go to your PubNub Dashboard -> Functions.
// 2. Create a new Function module tied to your keyset.
// 3. Add an new "On Before Publish" event handler.
// 4. Paste this entire file into the editor.
// 5. Save & start the function module.

const kvstore = require('kvstore');
const xhr = require('xhr');

// --------------------------------------------------------------------------
// CONFIGURATION
// --------------------------------------------------------------------------
const CONFIG = {
    // How many seconds a user must wait between messages
    cooldownSeconds: 2,

    // Maximum message length
    maxMessageLength: 1000,

    // If true, blocked messages are dropped. If false, bad words are masked.
    blockProfanity: false,

    // URL of the online profanity word list.
    // This is the LDNOOBW English list (one word/phrase per line).
    onlineListUrl: 'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en',

    // How long (in seconds) to cache the online list in the KV store.
    listCacheSeconds: 3600,

    // Fallback words to filter if the online list cannot be fetched.
    fallbackBadWords: [
        'badword', 'curse', 'profanity', 'spam', 'annoying'
    ]
};

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------

/**
 * Returns a normalized version of the text (lowercase, trimmed).
 */
function normalize(text) {
    return (text || '').toLowerCase().trim();
}

/**
 * Escapes a string for safe use inside a RegExp.
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a regex pattern for a bad word/phrase.
 * Multi-word phrases are matched as substrings; single words use word boundaries.
 */
function badWordPattern(word) {
    if (word.indexOf(' ') !== -1) {
        return escapeRegExp(word);
    }
    return '\\b' + escapeRegExp(word) + '\\b';
}

/**
 * Checks if a message contains any bad words.
 * Returns the first bad word found, or null.
 */
function findBadWord(text, badWords) {
    const normalized = normalize(text);
    for (let i = 0; i < badWords.length; i++) {
        const re = new RegExp(badWordPattern(badWords[i]), 'i');
        if (re.test(normalized)) {
            return badWords[i];
        }
    }
    return null;
}

/**
 * Masks bad words inside a string with asterisks.
 */
function maskProfanity(text, badWords) {
    let masked = text;
    badWords.forEach(function(word) {
        const re = new RegExp('(' + badWordPattern(word) + ')', 'gi');
        masked = masked.replace(re, function(match) {
            return '*'.repeat(match.length);
        });
    });
    return masked;
}

/**
 * Builds the KV key used to track the last message time for a user.
 */
function rateLimitKey(uuid) {
    return 'ratelimit:' + uuid;
}

/**
 * Fetches the online profanity list and caches it.
 * Returns a Promise that resolves to an array of bad words/phrases.
 */
function fetchOnlineBadWords() {
    return xhr.fetch(CONFIG.onlineListUrl, {
        method: 'GET',
        timeout: 3000
    }).then((resp) => {
        if (resp.status !== 200) {
            throw new Error('Online list returned status ' + resp.status);
        }
        const text = (resp.body || '').toString();
        const words = text.split(/\r?\n/).map(function(line) {
            return line.trim().toLowerCase();
        }).filter(function(word) {
            return word.length > 0;
        });
        return words;
    });
}

/**
 * Loads the bad word list, preferring the cached online version.
 * Falls back to the hardcoded list on any error.
 */
function loadBadWords() {
    return kvstore.get('badwords:list').then((cached) => {
        if (cached && Array.isArray(cached.words) && cached.words.length > 0) {
            return cached.words;
        }

        return fetchOnlineBadWords().then((words) => {
            return kvstore.set('badwords:list', { words: words }, CONFIG.listCacheSeconds).then(() => {
                return words;
            });
        });
    }).catch((err) => {
        console.error('Failed to load online bad word list:', err);
        return CONFIG.fallbackBadWords;
    });
}

// --------------------------------------------------------------------------
// MAIN HANDLER
// --------------------------------------------------------------------------
export default (request, response) => {
    const message = request.message || {};
    const uuid = message.uuid || 'unknown';
    const body = message.body || '';

    // 1. Validate message length
    if (body.length > CONFIG.maxMessageLength) {
        console.log('Message too long from', uuid);
        return request.abort();
    }

    // 2. Anti-flood: check cooldown using the KV store
    const key = rateLimitKey(uuid);

    return kvstore.get(key).then((lastTimestamp) => {
        const now = Date.now();
        const cooldownMs = CONFIG.cooldownSeconds * 1000;

        if (lastTimestamp && (now - lastTimestamp) < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - (now - lastTimestamp)) / 1000);
            console.log('Rate limited:', uuid, '-', remaining, 's remaining');
            return request.abort();
        }

        // 3. Profanity filter (uses online list with fallback)
        return loadBadWords().then((badWords) => {
            const badWord = findBadWord(body, badWords);
            if (badWord) {
                if (CONFIG.blockProfanity) {
                    console.log('Blocked profanity from', uuid, ':', badWord);
                    return request.abort();
                } else {
                    message.body = maskProfanity(body, badWords);
                    console.log('Masked profanity from', uuid, ':', badWord);
                }
            }

            // 4. Record this successful publish timestamp
            return kvstore.set(key, now, CONFIG.cooldownSeconds + 1).then(() => {
                return request.ok();
            });
        });
    }).catch((err) => {
        console.error('Moderation function error:', err);
        // Fail open: allow the message through if our logic breaks
        return request.ok();
    });
};
