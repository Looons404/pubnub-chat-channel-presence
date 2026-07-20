// Standalone test for the client-side moderation logic in chat.js

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

var badWords = ['badword', 'curse', 'profanity', 'spam', 'annoying', 'bad phrase'];

function badWordPattern(word) {
    if (word.indexOf(' ') !== -1) {
        return escapeRegExp(word);
    }
    return '\\b' + escapeRegExp(word) + '\\b';
}

function maskProfanity(text) {
    var masked = '' + text;
    badWords.forEach(function(word) {
        var re = new RegExp('(' + badWordPattern(word) + ')', 'gi');
        masked = masked.replace(re, function(match) {
            return '*'.repeat(match.length);
        });
    });
    return masked;
}

function test(name, actual, expected) {
    if (actual === expected) {
        console.log('PASS:', name);
    } else {
        console.log('FAIL:', name, '\n  expected:', expected, '\n  actual:  ', actual);
    }
}

// Profanity filter tests
test('masks a bad word', maskProfanity('this is a badword message'), 'this is a ******* message');
test('does not match partial words', maskProfanity('class should not match ass'), 'class should not match ass');
test('masks multiple bad words', maskProfanity('badword and curse here'), '******* and ***** here');
test('preserves normal text', maskProfanity('no bad words here'), 'no bad words here');

// Rate limiter tests
var lastMessageTime = 0;
var cooldownSeconds = 2;

function checkRateLimit() {
    var now = +new Date();
    if ((now - lastMessageTime) < cooldownSeconds * 1000) {
        return false;
    }
    lastMessageTime = now;
    return true;
}

console.log('Rate limit first call:', checkRateLimit() === true ? 'PASS' : 'FAIL');
console.log('Rate limit second call (same window):', checkRateLimit() === false ? 'PASS' : 'FAIL');
