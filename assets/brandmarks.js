/** 97 WORLD — local marketplace brandmark system.
 *  Every catalogue item resolves to a deliberate, recognizable mark without
 *  relying on a third-party icon CDN. Product names remain visible beside the
 *  marks, so these act as fast visual wayfinding rather than standalone labels.
 */
(function (window) {
    'use strict';

    function svg(body, className) {
        return '<svg class="brandmark ' + (className || '') + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
    }
    function word(text, size, y) {
        return '<text x="32" y="' + (y || 38) + '" text-anchor="middle" fill="currentColor" font-family="Arial,Helvetica,sans-serif" font-size="' + (size || 20) + '" font-weight="800" letter-spacing="-1">' + text + '</text>';
    }

    var xbox = svg('<circle cx="32" cy="32" r="25" fill="currentColor"/><path d="M18 20c7 2 11 6 14 10 3-4 7-8 14-10-5-4-10-6-14-6s-9 2-14 6Zm1 26c3-7 7-13 13-18 6 5 10 11 13 18-4 3-8 5-13 5s-9-2-13-5Z" fill="#fff"/>');
    var apple = svg('<path fill="currentColor" d="M39 13c2.5-3 2.2-6.3 2.1-7.5-2.7.2-5.8 1.9-7.6 4-1.7 1.8-3.1 4.6-2.8 7.3 3 .2 6-1.4 8.3-3.8Zm9.6 29.4c-1.2 2.7-2.8 5.3-4.8 7.9-2.4 3.1-4.9 6.2-8.9 6.2-3.5 0-4.7-2.1-8.8-2.1-4.2 0-5.5 2.1-8.8 2.2-3.8.1-6.7-3.4-9.1-6.5C3.3 43.8-.5 32.3 4.6 23.4c2.5-4.4 7.1-7.2 12-7.3 3.7-.1 7.3 2.5 9.6 2.5 2.2 0 6.5-3.1 10.9-2.7 1.9.1 7.1.8 10.5 5.7-8.9 5.2-7.5 17.8 1 20.8Z"/>');
    var youtube = svg('<rect x="5" y="14" width="54" height="36" rx="11" fill="#ff0033"/><path d="m27 23 15 9-15 9V23Z" fill="#fff"/>');
    var spotify = svg('<circle cx="32" cy="32" r="28" fill="#1ed760"/><path d="M17 24c10-3 23-2 32 3M19 32c9-2 20-1 28 3M21 40c7-1 16 0 23 3" fill="none" stroke="#09110b" stroke-width="4" stroke-linecap="round"/>');
    var playstation = svg('<path fill="currentColor" d="M25 8v39l9 3V18c0-3 1-5 4-4 3 1 4 4 4 7v12c6 3 11 0 11-7 0-8-3-14-12-17-6-2-11-2-16-1Zm10 43 15-5c2-.7 2-2-.7-3-3-1-7-.8-10 .3l-4 1.4V51ZM11 47c-3-1-3-3 .4-4.2l9-3.1v5l-6 2.2c-1 .4-1 .9.2 1.3 1 .3 3 .3 4 0l2-.7v4.6c-4 .7-7 .2-10-1.1-3-1-4-3 1-4Z"/>');
    var steam = svg('<circle cx="32" cy="32" r="27" fill="#183e5b"/><circle cx="43" cy="21" r="8" fill="none" stroke="#fff" stroke-width="4"/><circle cx="21" cy="43" r="6" fill="none" stroke="#fff" stroke-width="4"/><path d="m26 39 11-12M8 35l8 4" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>');

    var MARKS = {
        'canva-pro': svg('<circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="3"/><path d="M42 23c-3-4-7-6-12-5-8 1-13 8-12 16 1 9 10 14 18 11 3-1 6-3 8-6" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>'),
        'capcut-pro': svg('<path d="M12 18h30l10 8-40 20h40M12 18v9l40 19v-9L22 22" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'),
        'google-ai-pro': svg('<path d="M32 6c2 15 11 24 26 26-15 2-24 11-26 26-2-15-11-24-26-26C21 30 30 21 32 6Z" fill="#4285f4"/><circle cx="49" cy="15" r="5" fill="#fbbc04"/><circle cx="15" cy="49" r="5" fill="#34a853"/><path d="M32 6c.7 6 2.5 11 5.5 15.2L32 32l-5.5-10.8C29.5 17 31.3 12 32 6Z" fill="#ea4335"/>'),
        'coursera-plus': '<img class="brandmark brandmark-image" src="/assets/logos/coursera.svg" alt="" loading="lazy">',
        'duolingo-super': '<img class="brandmark brandmark-image" src="/assets/logos/duolingo.svg" alt="" loading="lazy">',
        'perplexity-pro': '<img class="brandmark brandmark-image" src="/assets/logos/perplexity.svg" alt="" loading="lazy">',
        'prime-video': svg(word('prime', 17, 31) + '<path d="M14 40c10 7 25 7 36 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="m46 38 6 1-3 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'),
        'apple-tv-plus': svg('<g transform="translate(-6 0) scale(.75)">' + apple.replace(/^.*?<svg[^>]*>|<\/svg>$/g, '') + '</g>' + '<text x="43" y="39" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-size="15" font-weight="700">tv+</text>'),
        'crunchyroll': '<img class="brandmark brandmark-image" src="/assets/logos/crunchyroll.svg" alt="" loading="lazy">',
        'linkedin-premium-career': svg('<rect x="7" y="7" width="50" height="50" rx="8" fill="#0a66c2"/><circle cx="20" cy="23" r="4" fill="#fff"/><path d="M16 31h8v20h-8V31Zm13 0h8v3c2-3 5-4 8-4 7 0 9 4 9 11v10h-8v-9c0-4-1-6-4-6s-5 2-5 6v9h-8V31Z" fill="#fff"/>'),
        'adobe-creative-cloud': svg('<path d="M8 10h20l22 44H38L20 20 8 44V10Zm48 0H36l20 40V10Z" fill="#ff0000"/><path d="m28 44 4-9 9 19H20l4-10h4Z" fill="#ff0000"/>'),
        'xbox-game-pass': xbox,
        'roblox-gift-card': svg('<g transform="rotate(13 32 32)"><rect x="8" y="8" width="48" height="48" rx="5" fill="currentColor"/><rect x="25" y="25" width="14" height="14" fill="#fff"/></g>'),
        'mobile-legends': svg('<path d="M10 44 23 15h12l-7 16 12-16h14L38 49H25l6-14-10 9H10Z" fill="currentColor"/><path d="M12 50h40" stroke="#ffd65a" stroke-width="4" stroke-linecap="round"/>'),
        'free-fire': svg(word('FREE', 14, 27) + word('FIRE', 14, 45) + '<path d="m33 29 5 0-4 12h-5l4-12Z" fill="#f6a800"/>'),
        'pubg-mobile': svg('<rect x="6" y="14" width="52" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>' + word('PUBG', 17, 38)),
        'valorant-points': svg('<path d="M8 15v18l17 17 8-9L8 15Zm48 0L36 37l-8-9 28-13Z" fill="currentColor"/>'),
        'steam-wallet': steam,
        'psn-wallet': playstation,
        'xbox-gift-card': xbox,
        'google-play-credit': svg('<path d="M12 7 40 32 12 57V7Z" fill="#34a853"/><path d="m12 7 33 19-8 9L12 7Z" fill="#4285f4"/><path d="m12 57 33-19-8-9-25 28Z" fill="#fbbc04"/><path d="m45 26 12 6-12 6-8-6 8-6Z" fill="#ea4335"/>'),
        'apple-gift-card': apple,
        'netflix-gift-card': svg('<path d="M14 7h12l24 50H38L14 7Z" fill="#b20710"/><path d="M14 7h12v50H14V7Zm24 0h12v50H38V7Z" fill="#e50914"/>'),
        'discord-nitro': svg('<path d="M17 17c10-5 20-5 30 0 6 8 9 17 8 27-6 5-11 7-16 8l-2-4c3-1 5-2 7-4-8 4-16 4-24 0 2 2 5 3 7 4l-2 4c-6-1-11-3-16-8-1-10 2-19 8-27Z" fill="#5865f2"/><circle cx="24" cy="34" r="4" fill="#fff"/><circle cx="40" cy="34" r="4" fill="#fff"/>'),
        'youtube-premium': youtube,
        'spotify-premium': spotify,
        'software-licenses': svg('<circle cx="22" cy="25" r="12" fill="none" stroke="currentColor" stroke-width="6"/><path d="m31 34 24 24M43 46l6-6M49 52l6-6" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>'),
        'fortnite-gifts': svg('<path d="M16 8h38v12H30v9h20v11H30v16H16V8Z" fill="currentColor"/><path d="M13 56h38" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'),
        'efootball-coins': svg('<path d="M10 32c0-13 9-23 23-23 9 0 16 4 21 11l-9 7c-3-4-7-6-12-6-6 0-10 3-11 8h21v8H22c2 4 6 7 11 7 5 0 9-2 12-6l9 7c-5 7-12 11-21 11-14 0-23-10-23-24Z" fill="currentColor"/>'),
        'cod-mobile-cp': svg(word('CALL OF', 9, 20) + word('DUTY', 18, 38) + '<path d="M20 46h24" stroke="#f4d03f" stroke-width="5" stroke-linecap="round"/>')
    };

    function render(productId) {
        return MARKS[productId] || svg(word('97', 24, 40));
    }

    window.K97Brandmarks = { render: render, ids: Object.keys(MARKS) };
})(window);
