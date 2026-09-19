/**
 * 97 WORLD GROWTH — the offer page
 *
 * One state model, one place prices come from, one place the outgoing message
 * is built. Everything on screen is derived from `state`; nothing is ever read
 * back off the DOM to work out what to charge or what to send.
 *
 *   state ──▶ K97Pricing.offerQuote() ──▶ render()      (what you see)
 *         └─▶ K97Pricing.offerQuote() ──▶ orderMessage() (what you send)
 *
 * Because both branches start from the same state and the same pricing call,
 * the message can never disagree with the summary — not even mid-animation:
 * the visual transitions interpolate a *label*, while the numbers used for the
 * message are recomputed at click time from state.
 *
 * Sections below, in order:
 *   1. Data the owner maintains (proof library — client timelines)
 *   2. State + persistence
 *   3. Derivations (pricing, message)
 *   4. DOM helpers, motion helpers (FLIP, number roll)
 *   5. Rendering
 *   6. Dialogs
 *   7. Proof section + image viewer
 *   8. Chat hand-off
 *   9. Wiring
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    if (!P || !P.offerQuote) return;

    /* ==================================================== 1. DATA === */

    var WA_NUMBER = '256762193386';

    // Owner-supplied evidence. Names and profile identity remain visible.
    // Country and elapsed delivery time are unknown; do not infer either.
    // A progress screenshot is not evidence of a completed 10K order.
    function shot(id, orderId, name, platform, shows, stage) {
        return {
            id: id, orderId: orderId,
            src: '/IMAGES/proof/' + name + '.webp',
            thumb: '/IMAGES/proof/' + name + '-420.webp',
            srcset: '/IMAGES/proof/' + name + '-420.webp 420w, /IMAGES/proof/' + name + '-840.webp 840w',
            sizes: '(min-width: 1000px) 320px, (min-width: 760px) 28vw, 85vw',
            w: 709, h: 680, platform: platform, country: null,
            shows: shows, period: null, stage: stage
        };
    }
    var PROOF = [
        shot('fb-01', 'fb-order', 'case-fb-before', 'facebook',
            'Yai Tong Akoon — starting profile showing 9.8K followers.', 'progress'),
        shot('fb-03', 'fb-order', 'case-progress', 'facebook',
            'Yai’s update in chat: “Boost nearly done.”', 'progress'),
        shot('fb-04', 'fb-order', 'case-fb-after', 'facebook',
            'Yai Tong Akoon — latest profile showing 13K followers.', 'progress'),
        shot('sale-01', 'sale-chat', 'offer-quote', 'instagram',
            'Nlmb 150 — the offer and the customer’s reply.', 'process'),
        shot('sale-02', 'sale-chat', 'offer-terms', 'instagram',
            'The same conversation: account review and the 50/50 agreement.', 'process')
    ];
    var STORIES = [
        {
            platform: 'facebook', title: 'Yai Tong Akoon', eyebrow: 'Facebook · Client progress',
            note: '9.8K → 13K followers in the supplied records. Delivery was still in progress.',
            footnote: 'Capture dates and delivery duration are not established by these screenshots.',
            steps: [
                { label: 'Before', proofId: 'fb-01', body: 'The starting profile: 9.8K followers.' },
                { label: 'Progress shared', proofId: 'fb-03', body: 'An account update sent directly in chat.' },
                { label: 'Latest result', proofId: 'fb-04', body: '13K followers. The same name and profile.' }
            ]
        },
        {
            platform: 'instagram', title: 'From selection to agreement', eyebrow: 'Nlmb 150 · Order conversation',
            note: 'A separate conversation showing how the offer and payment steps are agreed.',
            footnote: 'This records the order process; no delivery result is shown.',
            steps: [
                { label: 'Offer shared', proofId: 'sale-01', body: 'The package and price, clearly explained.' },
                { label: 'Accounts & terms', proofId: 'sale-02', body: 'All three chosen. Accounts reviewed. Half now, half after completion.' }
            ]
        }
    ];

    var PAGE_SIZE = 6;

    var PLAT_NAME = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook' };

    /**
     * What a record is allowed to claim about itself. A sales conversation is
     * not a delivery result and a part-way profile is not a finished order, so
     * each has its own label rather than being rounded up to the next one.
     */
    var STAGE = {
        complete: { cls: 'complete', tag: 'Completed order', long: 'Completed order' },
        progress: { cls: 'progress', tag: 'Delivery in progress', long: 'Delivery in progress, not a finished order' },
        process:  { cls: 'process',  tag: 'Order process',      long: 'Order process, not a delivery result' }
    };
    var ORDER = P.GROWTH_OFFER.platforms.slice();   // canonical display order

    /* =================================================== 2. STATE === */

    var STORE_KEY = 'k97_growth_offer';

    var sendTouched = false;   // the send button has produced a live result

    var state = {
        country: null,          // 'UG' | 'SS' | 'CD' | null
        platforms: [],          // subset of ORDER, always in ORDER's order
        trustSeen: false,       // the trust dialog has been shown this session
        resultsSeen: false,     // the customer has reached the proof section
        filter: 'all',
        shown: PAGE_SIZE
    };

    /** Session only, and only these five harmless fields. Never a name, number or link. */
    function save() {
        try {
            window.sessionStorage.setItem(STORE_KEY, JSON.stringify({
                country: state.country,
                platforms: state.platforms,
                trustSeen: state.trustSeen,
                resultsSeen: state.resultsSeen
            }));
        } catch (e) { /* private mode — the page works without it */ }
    }

    function load() {
        var raw;
        try { raw = window.sessionStorage.getItem(STORE_KEY); } catch (e) { return; }
        if (!raw) return;
        var data;
        try { data = JSON.parse(raw); } catch (e) { return; }
        if (!data || typeof data !== 'object') return;

        if (P.REGIONS[data.country]) state.country = data.country;
        if (Array.isArray(data.platforms)) state.platforms = normalise(data.platforms);
        state.trustSeen = !!data.trustSeen;
        state.resultsSeen = !!data.resultsSeen;
    }

    /** Only platforms this offer actually sells, always in canonical order. */
    function normalise(list) {
        return ORDER.filter(function (k) { return list.indexOf(k) !== -1; });
    }

    // Anonymous integration hooks. No network requests, identifiers or chat text.
    // A configured analytics listener can consume these without touching checkout.
    function trackEvent(event, extra) {
        var payload = Object.assign({ event: 'growth_' + event, version: 'campaign5',
            country: state.country, platforms: state.platforms.join(','),
            platform_count: state.platforms.length }, extra || {});
        try {
            window.dataLayer = window.dataLayer || [];
            if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
            window.dispatchEvent(new CustomEvent('k97:growth', { detail: payload }));
        } catch (e) { /* measurement cannot interrupt an order */ }
    }

    /* ============================================= 3. DERIVATIONS === */

    function quote() { return P.offerQuote(state.platforms, state.country); }

    function money(v) {
        var c = state.country ? P.REGIONS[state.country].currency : null;
        return (v == null || !c) ? '—' : P.money(v, c);
    }

    function countryName() {
        return state.country ? P.REGIONS[state.country].name : '';
    }

    function platformNames() {
        return state.platforms.map(function (k) { return PLAT_NAME[k]; });
    }

    /** Plain-English list: "Instagram, TikTok and Facebook". */
    function listSentence(items) {
        if (items.length <= 1) return items.join('');
        return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
    }

    /**
     * The message the customer sends. Built from state at the moment it is
     * needed, so it cannot lag a price transition or a country change.
     */
    function orderMessage() {
        var q = quote();
        if (!q.priced) return '';
        return 'Hello 97 World. I’m ready to place this Growth order.\n\n' +
            '*MY ORDER*\n' +
            'Country: ' + countryName() + '\n' +
            'Platforms: ' + listSentence(platformNames()) + '\n' +
            'Growth: 10,000 followers on each selected platform\n' +
            'Total: ' + P.money(q.total, q.currency) + '\n\n' +
            '*PAYMENT PLAN*\n' +
            '50% to start after confirmation: ' + P.money(q.deposit, q.currency) + '\n' +
            '50% after completion: ' + P.money(q.balance, q.currency) + '\n\n' +
            '*NEXT*\n' +
            'I’ll send my public account links in this chat. Please check them and confirm availability and the delivery schedule before I pay. No password will be shared.';
    }

    function chatUrl() {
        return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(orderMessage());
    }

    /* ================================== 4. DOM + MOTION HELPERS === */

    var $ = function (id) { return document.getElementById(id); };
    var reduced = (window.Motion && window.Motion.reduced) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Build an element. Text only — nothing on this page inserts raw HTML. */
    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) node.textContent = text;
        return node;
    }

    /** <svg><use href="#id"></svg> — the shared sprite at the top of the page. */
    function icon(id, cls) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        if (cls) svg.setAttribute('class', cls);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#' + id);
        svg.appendChild(use);
        return svg;
    }

    var canAnimate = typeof Element !== 'undefined' &&
        typeof Element.prototype.animate === 'function' && !reduced;

    /**
     * The last animation started on a node, kept so the next one can cancel it.
     *
     * The reference is deliberately NOT dropped when an animation finishes: a
     * finished `fill: 'forwards'` animation still holds the element at its end
     * state, so forgetting it leaves the next animation composing on top of an
     * opacity of 0 — a figure that is correct in the DOM and invisible on
     * screen. Cancelling on the way in releases the fill.
     */
    var running = new WeakMap();

    function play(node, frames, options) {
        if (!canAnimate) return null;
        var prev = running.get(node);
        if (prev) { try { prev.cancel(); } catch (e) { /* already gone */ } }
        var anim = node.animate(frames, options);
        running.set(node, anim);
        anim.finished.catch(function () { /* cancelled — expected */ });
        return anim;
    }

    /**
     * FLIP a container's rows across a re-render. Transform and opacity only,
     * so a summary that gains or loses a line glides instead of jumping.
     */
    function flip(container, render) {
        if (!canAnimate) { render(); return; }

        var before = {};
        container.querySelectorAll('[data-flip]').forEach(function (node) {
            before[node.getAttribute('data-flip')] = node.getBoundingClientRect();
        });

        render();

        container.querySelectorAll('[data-flip]').forEach(function (node) {
            var key = node.getAttribute('data-flip');
            var now = node.getBoundingClientRect();
            var old = before[key];

            if (!old) {                                    // newly added
                play(node, [
                    { opacity: 0, transform: 'translate3d(0,10px,0)' },
                    { opacity: 1, transform: 'none' }
                ], { duration: 240, easing: 'cubic-bezier(.16,1,.3,1)' });
                return;
            }
            var dx = old.left - now.left;
            var dy = old.top - now.top;
            if (!dx && !dy) return;
            play(node, [
                { transform: 'translate3d(' + dx + 'px,' + dy + 'px,0)' },
                { transform: 'none' }
            ], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
        });
    }

    /**
     * Swap a figure in place. The container never moves and the digits stay on
     * their column (tabular numerals in CSS), so nothing jitters.
     */
    function roll(node, text) {
        if (!node) return;
        /* Already showing it, or already animating towards it. Without the
           second guard a burst of renders re-enters the fade-out before it can
           finish, and the figure can be left invisible. */
        if (node.textContent === text && node._rollTo == null) return;
        if (node._rollTo === text) return;
        if (!canAnimate) { node.textContent = text; node._rollTo = null; return; }
        node._rollTo = text;

        var out = play(node, [
            { opacity: 1, transform: 'none' },
            { opacity: 0, transform: 'translate3d(0,-6px,0)' }
        ], { duration: 120, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });

        if (!out) { node.textContent = text; node._rollTo = null; return; }
        out.finished.then(function () {
            node.textContent = text;
            node._rollTo = null;
            play(node, [
                { opacity: 0, transform: 'translate3d(0,8px,0)' },
                { opacity: 1, transform: 'none' }
            ], { duration: 200, easing: 'cubic-bezier(.16,1,.3,1)' });
        }, function () {
            /* Cancelled by a newer value. That newer roll owns the node now and
               will land it on its own text; all this one has to do is not fight
               it. If it was the last one in flight, show the truth. */
            if (node._rollTo === text) {
                node.textContent = text;
                node._rollTo = null;
            }
        });
    }

    function scrollTo(node) {
        if (!node) return;
        try {
            node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        } catch (e) {
            node.scrollIntoView();
        }
    }

    /* Announce meaningful changes once they settle — never per frame. */
    var liveTimer = null;
    function announce(text) {
        var region = $('liveRegion');
        if (!region) return;
        window.clearTimeout(liveTimer);
        liveTimer = window.setTimeout(function () { region.textContent = text; }, 450);
    }

    /* ============================================== 5. RENDERING === */

    /* -- header country control ------------------------------------- */

    function renderCountry() {
        var btn = $('countryBtn');
        var flag = btn.querySelector('.gx-flag');
        var txt = btn.querySelector('.gx-country-txt');

        if (!state.country) {
            btn.setAttribute('data-state', 'unset');
            flag.textContent = '';
            txt.textContent = 'Choose your country';
            btn.setAttribute('aria-label', 'Choose your country to see prices');
            return;
        }
        var r = P.REGIONS[state.country];
        btn.setAttribute('data-state', 'set');
        flag.textContent = r.flag;
        txt.textContent = r.name + ' · ' + r.currency;
        btn.setAttribute('aria-label', r.name + ', prices in ' + r.currency + '. Change country');
    }

    /* Country campaign art follows the selected platforms. The models are
       fictional campaign artwork; client evidence remains in the proof section. */
    var campaignImage = null;
    var campaignVisual = 'creators';
    var campaignRequest = 0;
    var CAMPAIGN_IMAGES = {
        creators: '/IMAGES/growth-campaign/creators-v1.webp',
        UG: {
            base: '/IMAGES/growth-campaign/ug-base-v1.webp',
            facebook: '/IMAGES/growth-campaign/ug-facebook-v1.webp',
            instagram: '/IMAGES/growth-campaign/ug-instagram-v1.webp',
            tiktok: '/IMAGES/growth-campaign/ug-tiktok-v1.webp',
            all: '/IMAGES/growth-campaign/ug-all-three-v1.webp'
        },
        SS: {
            base: '/IMAGES/growth-campaign/ssd-base-v1.webp',
            facebook: '/IMAGES/growth-campaign/ssd-facebook-v1.webp',
            instagram: '/IMAGES/growth-campaign/ssd-instagram-v1.webp',
            tiktok: '/IMAGES/growth-campaign/ssd-tiktok-v1.webp',
            all: '/IMAGES/growth-campaign/ssd-all-three-v1.webp'
        },
        CD: {
            base: '/IMAGES/growth-campaign/cd-base-v1.webp',
            facebook: '/IMAGES/growth-campaign/cd-facebook-v1.webp',
            instagram: '/IMAGES/growth-campaign/cd-instagram-v1.webp',
            tiktok: '/IMAGES/growth-campaign/cd-tiktok-v1.webp',
            all: '/IMAGES/growth-campaign/cd-all-three-v1.webp'
        }
    };

    function renderCampaign() {
        var hero = $('campaignHero');
        if (!hero) return;
        var country = state.country;
        var visual = 'creators';
        if (country) {
            if (state.platforms.length === 1) visual = state.platforms[0];
            else if (state.platforms.length === ORDER.length) visual = 'all';
            else visual = 'base';
        }
        var imageKey = country ? country + '-' + visual : 'creators';
        var imageSrc = country ? CAMPAIGN_IMAGES[country][visual] : CAMPAIGN_IMAGES.creators;

        var pair = country && state.platforms.length === 2
            ? state.platforms.join('+') : 'none';
        hero.dataset.platformPair = pair;
        hero.closest('.gx-hero').dataset.country = country || 'none';
        var consoleCard = hero.parentElement.querySelector('.gx-console');
        consoleCard.dataset.campaign = country ? 'true' : 'false';
        if (country) consoleCard.style.setProperty('--campaign-art', 'url("' + imageSrc + '")');
        else consoleCard.style.removeProperty('--campaign-art');
        $('heroEyebrow').textContent = country
            ? '97 World Growth · ' + P.REGIONS[country].name : '97 World Growth';

        // Keep the current image visible until the new one is ready. A request
        // number prevents a slow earlier selection from replacing a newer one.
        var request = ++campaignRequest;
        if (imageKey === campaignVisual) return;
        var next = new window.Image();
        next.onload = function () {
            if (request !== campaignRequest) return;
            var current = campaignImage || $('campaignImageA');
            var target = current.id === 'campaignImageA' ? $('campaignImageB') : $('campaignImageA');
            target.src = imageSrc;
            target.alt = !country
                ? 'AI-generated campaign artwork of three fictional creators collaborating around a phone.'
                : 'AI-generated campaign artwork of a fictional woman, the ' + P.REGIONS[country].name + ' flag, and growth visuals.';
            target.removeAttribute('aria-hidden');
            target.classList.add('is-active');
            current.classList.remove('is-active');
            current.alt = '';
            current.setAttribute('aria-hidden', 'true');
            campaignImage = target;
            campaignVisual = imageKey;
            hero.dataset.visual = visual;
            hero.dataset.country = country || 'none';
        };
        next.src = imageSrc;
    }

    /* -- platform cards --------------------------------------------- */

    function renderPlatforms() {
        document.querySelectorAll('.gx-plat').forEach(function (label) {
            var key = label.getAttribute('data-plat');
            var on = state.platforms.indexOf(key) !== -1;
            var box = label.querySelector('input');
            if (box.checked !== on) box.checked = on;
            label.classList.toggle('is-on', on);
        });
        document.querySelectorAll('[data-hero-platform]').forEach(function (button) {
            var on = state.platforms.indexOf(button.dataset.heroPlatform) !== -1;
            button.setAttribute('aria-pressed', String(on));
            button.querySelector('.gx-mini-check').textContent = on ? '✓' : '+';
        });
        document.querySelectorAll('[data-wire]').forEach(function (wire) {
            wire.classList.toggle('is-connected', state.platforms.indexOf(wire.dataset.wire) !== -1);
        });
        var q = quote();
        $('heroSelection').textContent = q.count ? q.count + (q.count === 1 ? ' platform · ' : ' platforms · ') + (q.count * 10) + 'K total followers' : 'Choose your platforms above';
        roll($('heroTotal'), q.priced ? money(q.total) : '—');
        $('heroContinue').disabled = !q.priced;
        $('heroContinue').textContent = q.priced ? 'See client results →' : 'Choose a platform above';
    }

    /* -- the live summary ------------------------------------------- */

    /* What shape is the card in? A change here means rows moved, so FLIP.
       The same shape with different numbers means a currency change, so roll. */
    function shapeKey() {
        var q = quote();
        return state.platforms.join(',') + '|' + (q.priced ? '1' : '0') + '|' + (q.saving > 0 ? 's' : '');
    }

    var summaries = [];        // [{ body, count, shape }]

    function buildSummary(body, count, role) {
        var q = quote();

        body.textContent = '';
        count.textContent = state.platforms.length
            ? state.platforms.length + (state.platforms.length === 1 ? ' platform' : ' platforms')
            : '';

        /* ---- empty state ---- */
        if (!state.platforms.length) {
            var empty = el('div', 'gx-sum-empty');
            empty.setAttribute('data-flip', 'empty');
            var mark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            mark.setAttribute('viewBox', '0 0 24 24');
            mark.setAttribute('fill', 'none');
            mark.setAttribute('stroke', 'currentColor');
            mark.setAttribute('stroke-width', '1.6');
            mark.setAttribute('aria-hidden', 'true');
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M4 7.5h16M4 12h16M4 16.5h10');
            path.setAttribute('stroke-linecap', 'round');
            mark.appendChild(path);
            empty.appendChild(mark);
            empty.appendChild(el('p', null, 'Select a platform to see your total.'));
            body.appendChild(empty);
            if (role === 'choose') body.appendChild(continueBtn(true));
            return;
        }

        /* ---- selected platforms ---- */
        var lines = el('div', 'gx-sum-lines');
        lines.setAttribute('data-flip', 'lines');
        state.platforms.forEach(function (key) {
            var row = el('div', 'gx-sum-line');
            row.setAttribute('data-flip', 'line-' + key);
            var mark = el('span', 'gx-plat-mark');
            mark.appendChild(icon('mk-' + key));
            row.appendChild(mark);
            row.appendChild(el('b', null, PLAT_NAME[key]));
            row.appendChild(el('span', null, '10,000 followers'));
            lines.appendChild(row);
        });
        body.appendChild(lines);

        /* Stated exactly once all three are on, so "30,000" can never be read
           as 30,000 on each account. */
        if (state.platforms.length === ORDER.length) {
            var whole = el('p', 'gx-whole');
            whole.setAttribute('data-flip', 'whole');
            whole.appendChild(el('b', null, '10,000 followers on each platform'));
            whole.appendChild(document.createTextNode(' \u00b7 ' +
                (ORDER.length * P.GROWTH_OFFER.qty).toLocaleString() + ' total.'));
            body.appendChild(whole);
        }

        /* Without a country there is no currency, so there is no honest price
           to print. Say what is missing instead of guessing one. */
        if (!q.priced) {
            var pick = el('div', 'gx-sum-empty');
            pick.setAttribute('data-flip', 'needs-country');
            pick.appendChild(el('p', null, 'Choose your country to see this total in your currency.'));
            var open = el('button', 'gx-btn gx-btn--quiet', 'Choose your country');
            open.type = 'button';
            open.addEventListener('click', function () { openCountry(true); });
            pick.appendChild(open);
            body.appendChild(pick);
            if (role === 'choose') body.appendChild(continueBtn(false));
            return;
        }

        body.appendChild(rule('rule-1'));

        /* ---- total ---- */
        var dl = el('dl', 'gx-sum-money');
        dl.setAttribute('data-flip', 'money');

        dl.appendChild(row('total', 'gx-row gx-row-total', 'Total', money(q.total)));

        /* ---- saving, only when the bundle actually applies ---- */
        if (q.saving > 0) {
            var save = el('div', 'gx-saving');
            save.setAttribute('data-flip', 'saving');
            var tick = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            tick.setAttribute('viewBox', '0 0 16 16');
            tick.setAttribute('fill', 'none');
            tick.setAttribute('stroke', 'currentColor');
            tick.setAttribute('stroke-width', '2');
            tick.setAttribute('stroke-linecap', 'round');
            tick.setAttribute('stroke-linejoin', 'round');
            tick.setAttribute('aria-hidden', 'true');
            var tp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tp.setAttribute('d', 'M3 8.4 6.2 11.6 13 4.8');
            tick.appendChild(tp);
            save.appendChild(tick);
            /* Two short lines rather than one long parenthetical: an
               inline-block number inside brackets wraps badly at 320px. */
            var savingTxt = el('span');
            var lead = el('b');
            lead.appendChild(document.createTextNode('You save '));
            var savingVal = el('span', 'gx-roll', money(q.saving));
            savingVal.setAttribute('data-money', 'saving');
            lead.appendChild(savingVal);
            savingTxt.appendChild(lead);

            var sub = el('span', 'gx-saving-sub');
            sub.appendChild(document.createTextNode('Separately: '));
            var listVal = el('span', 'gx-roll', money(q.listPrice));
            listVal.setAttribute('data-money', 'list');
            sub.appendChild(listVal);
            sub.appendChild(document.createTextNode('.'));
            savingTxt.appendChild(sub);

            save.appendChild(savingTxt);
            dl.appendChild(save);
        }

        dl.appendChild(rule('rule-2'));

        /* ---- the two payment stages, each explained where it is read ---- */
        dl.appendChild(row('deposit', 'gx-row gx-row-split gx-stage gx-stage-1',
            '50% to start', money(q.deposit),
            'After confirmation in chat.'));

        dl.appendChild(row('balance', 'gx-row gx-row-split gx-stage gx-stage-2',
            '50% after completion', money(q.balance),
            'After the agreed delivery is finished.'));

        body.appendChild(dl);

        /* One primary action out of this card. The send step has its own. */
        if (role === 'choose') body.appendChild(continueBtn(false));
    }

    /** The summary's single primary action. */
    function continueBtn(disabled) {
        var wrap = el('div');
        wrap.setAttribute('data-flip', 'cta');
        var b = el('button', 'gx-btn gx-btn--primary gx-btn--block');
        b.type = 'button';
        b.setAttribute('data-action', 'continue');
        b.disabled = !!disabled;
        b.appendChild(el('span', 'gx-btn-label', 'Continue to client results'));
        wrap.appendChild(b);
        return wrap;
    }

    function rule(key) {
        var r = el('div', 'gx-rule');
        r.setAttribute('data-flip', key);
        return r;
    }

    function row(key, cls, label, value, note) {
        var wrap = el('div', cls);
        wrap.setAttribute('data-flip', 'row-' + key);
        var line = el('div', 'gx-row');
        line.appendChild(el('dt', null, label));
        var dd = el('dd');
        var span = el('span', 'gx-roll', value);
        span.setAttribute('data-money', key);
        dd.appendChild(span);
        line.appendChild(dd);
        wrap.appendChild(line);
        if (note) wrap.appendChild(el('p', 'gx-note', note));
        return wrap;
    }

    /** Same numbers, new currency: roll the figures rather than rebuild rows. */
    function refreshMoney(body) {
        var q = quote();
        if (!q.priced) return;
        var map = {
            total: q.total, deposit: q.deposit, balance: q.balance,
            saving: q.saving, list: q.listPrice
        };
        body.querySelectorAll('[data-money]').forEach(function (node) {
            var key = node.getAttribute('data-money');
            if (map[key] != null) roll(node, money(map[key]));
        });
    }

    function renderSummaries() {
        var key = shapeKey();
        summaries.forEach(function (s) {
            if (s.shape === key) {
                refreshMoney(s.body);                       // currency change
                return;
            }
            s.shape = key;
            flip(s.body, function () { buildSummary(s.body, s.count, s.role); });
        });
    }

    /* -- the three-step track ---------------------------------------- */

    function renderSteps() {
        var track = $('stepTrack');
        if (!track) return;
        track.querySelectorAll('li').forEach(function (li) {
            var step = li.getAttribute('data-step');
            var done = (step === 'choose' && state.platforms.length > 0) ||
                (step === 'results' && state.resultsSeen);
            li.classList.toggle('is-done', done);
        });
    }

    /* -- the send step ----------------------------------------------- */

    function renderSend() {
        var q = quote();
        var btn = $('sendBtn');
        var status = $('sendStatusTxt');
        var copy = $('copyBtn');
        var total = $('sendBtnTotal');

        btn.disabled = !q.priced;
        copy.hidden = !q.priced;
        total.hidden = !q.priced;
        total.textContent = q.priced ? money(q.total) : '';
        btn.setAttribute('aria-label', q.priced
            ? 'Send order for ' + money(q.total) + ' on WhatsApp'
            : 'Send order on WhatsApp');

        if (sendTouched) return;                            // keep the live result

        /* A country or platform change makes the previous order obsolete. */
        $('fallback').hidden = true;
        $('fallbackTxt').value = '';

        if (!state.platforms.length) {
            status.textContent = 'Choose at least one platform above to build your order.';
        } else if (!state.country) {
            status.textContent = 'Choose your country so the order carries the right currency.';
        } else {
            status.textContent = 'Nothing is charged here. You can review the message before sending.';
        }
    }

    /* -- the mobile action bar --------------------------------------- */

    var barVisible = { summaryCta: false, sendCta: false, heroCta: false };

    function renderBar() {
        var bar = $('bar');
        var q = quote();
        var wanted = q.priced && !barVisible.heroCta && !barVisible.summaryCta && !barVisible.sendCta;

        if (wanted) {
            bar.hidden = false;
            $('barLabel').textContent = 'Total';
            roll($('barTotal'), money(q.total));
            $('barBtn').querySelector('.gx-btn-label').textContent =
                state.resultsSeen ? 'Send order' : 'See client stories';
            $('barBtn').setAttribute('aria-label', state.resultsSeen
                ? 'Send order for ' + money(q.total) + ' on WhatsApp'
                : 'Continue to client stories');
            // let `hidden` clear before the transform transition starts
            window.requestAnimationFrame(function () { bar.classList.add('is-up'); });
        } else {
            bar.classList.remove('is-up');
            if (reduced) bar.hidden = true;
            else window.setTimeout(function () {
                if (!bar.classList.contains('is-up')) bar.hidden = true;
            }, 340);
        }
    }

    /* -- everything ---------------------------------------------------- */

    function render() {
        renderCountry();
        renderPlatforms();
        renderCampaign();
        renderOfferValue();
        renderSummaries();
        renderSteps();
        renderSend();
        renderBar();
        renderProof();
    }

    function renderOfferValue() {
        var full = P.offerQuote(ORDER, state.country);
        var all = state.platforms.length === ORDER.length;
        $('bundleBtn').setAttribute('aria-pressed', String(all));
        $('bundlePrice').textContent = full.priced ? money(full.total) : 'Choose country';
        $('bundleSaving').textContent = full.priced ? 'Save ' + money(full.saving) : '';
        $('bundleAction').textContent = all ? 'All three selected ✓' : 'Select all three ↗';
        document.querySelectorAll('.gx-plat').forEach(function (label) {
            var unit = P.offerQuote([label.dataset.plat], state.country);
            label.querySelector('[data-unit-price]').textContent = unit.priced ? money(unit.total) : '';
        });
    }

    function announceSelection() {
        var q = quote();
        if (!state.platforms.length) {
            announce('No platform selected. Select a platform to see your total.');
            return;
        }
        var names = listSentence(platformNames());
        if (!q.priced) {
            announce(names + ' selected. Choose your country to see the total.');
            return;
        }
        announce(names + ' selected, 10,000 followers each. Total ' + money(q.total) +
            '. ' + money(q.deposit) + ' to start, ' + money(q.balance) + ' after completion.' +
            (q.saving > 0 ? ' You save ' + money(q.saving) + '.' : ''));
    }

    /* ================================================ 6. DIALOGS === */

    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    /**
     * A modal that uses <dialog>.showModal() where it exists — which gives
     * focus containment and an inert background for free — and falls back to
     * a hand-rolled trap where it doesn't.
     */
    function Modal(node) {
        var self = {
            node: node,
            open: false,
            dismissible: true,
            onClose: null,
            _return: null,
            _scrim: null
        };
        var native = typeof node.showModal === 'function';

        function trap(e) {
            if (e.key !== 'Tab') return;
            var list = Array.prototype.filter.call(
                node.querySelectorAll(FOCUSABLE),
                function (n) { return n.offsetParent !== null || n === document.activeElement; }
            );
            if (!list.length) return;
            var first = list[0], last = list[list.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }

        function onKey(e) {
            if (e.key === 'Escape' && !self.dismissible) { e.preventDefault(); return; }
            if (e.key === 'Escape' && self.dismissible && !native) { e.preventDefault(); self.close(); return; }
            if (!native) trap(e);
        }

        /* Escape on a native dialog arrives as `cancel`. A dialog with one
           deliberate way out refuses it; the rest let it through. */
        node.addEventListener('cancel', function (e) {
            if (!self.dismissible) { e.preventDefault(); return; }
        });
        node.addEventListener('close', function () { finish(); });

        function finish() {
            if (!self.open) return;
            self.open = false;
            document.removeEventListener('keydown', onKey, true);
            document.documentElement.style.overflow = '';
            if (self._scrim) { self._scrim.remove(); self._scrim = null; }
            node.removeAttribute('data-fallback');
            backgroundInert(false);
            if (self._return && document.contains(self._return)) {
                try { self._return.focus({ preventScroll: true }); } catch (e) { self._return.focus(); }
            }
            if (self.onClose) { var fn = self.onClose; self.onClose = null; fn(); }
        }

        function backgroundInert(on) {
            if (native) return;                              // showModal handles it
            ['main', '.gx-head', '.gx-bar'].forEach(function (sel) {
                var n = document.querySelector(sel);
                if (!n) return;
                if (on) { n.setAttribute('inert', ''); n.setAttribute('aria-hidden', 'true'); }
                else { n.removeAttribute('inert'); n.removeAttribute('aria-hidden'); }
            });
        }

        self.show = function (opts) {
            opts = opts || {};
            if (self.open) return;
            self.dismissible = opts.dismissible !== false;
            self._return = document.activeElement;
            self.open = true;

            document.documentElement.style.overflow = 'hidden';

            if (native) {
                node.showModal();
            } else {
                node.setAttribute('data-fallback', '');
                node.setAttribute('open', '');
                node.setAttribute('aria-modal', 'true');
                node.setAttribute('role', 'dialog');
                self._scrim = el('div', 'gx-scrim');
                document.body.appendChild(self._scrim);
                backgroundInert(true);
            }
            document.addEventListener('keydown', onKey, true);

            var target = opts.focus || node.querySelector(FOCUSABLE);
            if (target) {
                window.requestAnimationFrame(function () {
                    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
                });
            }
        };

        self.close = function (after) {
            if (!self.open) return;
            self.onClose = after || self.onClose;
            if (native && node.open) node.close();
            else { node.removeAttribute('open'); node.removeAttribute('aria-modal'); finish(); }
        };

        return self;
    }

    var welcome, trust, viewer;

    /* -- welcome / country ------------------------------------------- */

    function openCountry(dismissible) {
        var current = state.country;
        document.querySelectorAll('.gx-ctry').forEach(function (label) {
            var on = label.getAttribute('data-country') === current;
            label.querySelector('input').checked = on;
            label.classList.toggle('is-on', on);
        });
        $('welcomeGo').disabled = !current;
        $('welcomeClose').hidden = !dismissible;
        /* Focus the card rather than a country: the dialog is announced, and
           no option looks pre-chosen before the customer has chosen one. */
        welcome.show({ dismissible: !!dismissible, focus: $('welcomeForm') });
    }

    function chooseCountry(code) {
        if (!P.REGIONS[code]) return;
        document.querySelectorAll('.gx-ctry').forEach(function (label) {
            label.classList.toggle('is-on', label.getAttribute('data-country') === code);
        });
        $('welcomeGo').disabled = false;
    }

    function commitCountry() {
        var picked = document.querySelector('.gx-ctry input:checked');
        if (!picked) return;
        state.country = picked.value;
        trackEvent('country_selected');       // platforms are untouched on purpose
        sendTouched = false;                // the old hand-off note no longer fits
        save();
        welcome.close(function () {
            render();
            announce('Country set to ' + countryName() + '. Prices now show in ' +
                P.REGIONS[state.country].currency + '.');
        });
    }

    /* -- trust ------------------------------------------------------- */

    function continueToResults() {
        trackEvent('continue_to_results');
        if (state.trustSeen) { goToResults(); return; }
        state.trustSeen = true;
        save();
        /* No close icon, no backdrop dismissal, no Escape, no countdown —
           one button, available immediately. */
        trust.show({ dismissible: false, focus: $('trustGo') });
    }

    function goToResults() {
        state.resultsSeen = true;
        trackEvent('results_reached');
        save();
        renderSteps();
        renderProof();
        var head = $('resultsH');
        scrollTo($('results'));
        if (head) {
            try { head.focus({ preventScroll: true }); } catch (e) { head.focus(); }
        }
    }

    /* ==================================== 7. PROOF + VIEWER === */

    /**
     * Frames are grouped into orders before anything is drawn. One order gets
     * one card however many screenshots back it, so a gallery of six cards is
     * six orders — never one order shown six times and read as six customers.
     */
    function groupProof(items) {
        var groups = [], byKey = {};
        items.forEach(function (it) {
            var key = it.orderId || it.id;
            if (!byKey[key]) { byKey[key] = { key: key, frames: [] }; groups.push(byKey[key]); }
            byKey[key].frames.push(it);
        });
        groups.forEach(function (g) {
            /* The card leads with the completed frame where there is one; a
               part-way frame never becomes the face of a finished order, and a
               finished label is never put on an order that has none. */
            var done = g.frames.filter(function (f) { return f.stage === 'complete'; });
            g.cover = done.length ? done[done.length - 1] : g.frames[g.frames.length - 1];
            if (!STAGE[g.cover.stage]) g.cover.stage = 'progress';
        });
        return groups;
    }

    /** Country first, then a platform the customer picked, then the rest. */
    function rank(item) {
        var score = 0;
        if (state.country && item.country === state.country) score -= 2;
        if (state.platforms.indexOf(item.platform) !== -1) score -= 1;
        return score;
    }

    /** The orders on show under the current filter, best match first. */
    function visibleProof() {
        var items = PROOF.filter(function (it) {
            return state.filter === 'all' || it.platform === state.filter;
        });
        return groupProof(items).sort(function (a, b) {
            return rank(a.cover) - rank(b.cover);
        });
    }

    function renderProof() {
        var grid = $('proofGrid');
        var empty = $('proofEmpty');
        var filters = $('proofFilters');
        var moreWrap = $('proofMoreWrap');
        var story = $('proofStory');
        var nextStep = $('proofNext');

        if (!PROOF.length) {
            grid.hidden = true;
            filters.hidden = true;
            moreWrap.hidden = true;
            story.hidden = true;
            nextStep.hidden = true;
            renderProofEmpty(empty);
            return;
        }

        empty.textContent = '';
        nextStep.hidden = false;
        var nextLink = $('proofNextLink');
        var hasPackage = state.platforms.length > 0;
        nextLink.href = hasPackage ? '#send' : '#choose';
        nextLink.querySelector('.gx-btn-label').textContent = hasPackage ? 'Review my order' : 'Choose my platforms';
        $('proofNextTitle').textContent = hasPackage ? 'Your package is ready.' : 'Ready to build your package?';
        $('proofNextCopy').textContent = hasPackage
            ? 'Review the exact total, then send your order in WhatsApp.'
            : 'Choose your platforms, then review the order with us in chat.';
        renderFilters(filters);
        renderStory(story);

        // Timelines already contain every frame; avoid repeating them as extra clients.
        grid.hidden = true;
        grid.textContent = '';
        moreWrap.hidden = true;
        var note = $('proofLocalNote');
        if (note) note.remove();
        if (state.country) {
            var local = PROOF.some(function (p) { return p.country === state.country; });
            if (!local) {
                var gap = el('p', 'gx-smallprint', 'These records do not establish the client\u2019s country.');
                gap.id = 'proofLocalNote';
                story.parentNode.insertBefore(gap, story);
            }
        }
    }

    /**
     * Built once, then only its two country/platform-dependent sentences are
     * updated — re-creating the block on every selection change would replay
     * its reveal animation while the customer is reading it.
     */
    function renderProofEmpty(mount) {
        var box = mount.querySelector('.gx-empty');

        if (!box) {
            mount.textContent = '';
            box = el('div', 'gx-empty m-up');

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '1.5');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            var frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            frame.setAttribute('x', '3'); frame.setAttribute('y', '4');
            frame.setAttribute('width', '18'); frame.setAttribute('height', '16');
            frame.setAttribute('rx', '3');
            var hills = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hills.setAttribute('d', 'M3 15.5 8 11l4 3.6 3-2.8 5 4.2');
            svg.appendChild(frame); svg.appendChild(hills);
            box.appendChild(svg);

            box.appendChild(el('h3', null, 'No client screenshots are published here yet.'));
            box.appendChild(el('p', null,
                'Nothing we hold has cleared that bar yet, so the space stays empty rather ' +
                'than being filled with somebody else\u2019s result.'));

            var ask = el('p', null);
            ask.id = 'proofAskCopy';
            box.appendChild(ask);

            var link = el('a', 'gx-btn gx-btn--quiet m-press');
            link.id = 'proofAskLink';
            link.target = '_blank';
            link.rel = 'noopener';
            link.appendChild(el('span', 'gx-btn-label', 'Ask to see the evidence'));
            box.appendChild(link);

            mount.appendChild(box);
            if (window.Motion) window.Motion.observe(mount);
        }

        var who = state.platforms.length ? listSentence(platformNames()) : 'your platform';
        document.getElementById('proofAskCopy').textContent =
            'Ask us in the chat and we will show you what we can share for ' + who +
            (state.country ? ', including anything we have from ' + countryName() : '') +
            '. You can ask before you commit to anything.';
        document.getElementById('proofAskLink').href =
            'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(
                'Hello 97 World, I am on the Growth page. Could you show me the client results ' +
                'you are able to share' +
                (state.platforms.length ? ' for ' + listSentence(platformNames()) : '') + '?');
    }

    function renderFilters(mount) {
        mount.hidden = false;
        var row = $('filterRow');
        row.textContent = '';

        var present = [];
        PROOF.forEach(function (it) {
            if (present.indexOf(it.platform) === -1) present.push(it.platform);
        });

        var options = [{ key: 'all', label: 'All stories' }];
        ORDER.forEach(function (k) {
            if (present.indexOf(k) !== -1) options.push({ key: k, label: k === 'instagram' ? 'Order conversation' : PLAT_NAME[k] });
        });

        options.forEach(function (opt) {
            var b = el('button', 'gx-chip m-press', opt.label);
            b.type = 'button';
            b.setAttribute('aria-pressed', state.filter === opt.key ? 'true' : 'false');
            b.addEventListener('click', function () {
                state.filter = opt.key;
                state.shown = PAGE_SIZE;
                renderProof();
                var active = row.querySelector('[aria-pressed="true"]');
                if (active) active.focus({ preventScroll: true });
                var n = visibleProof().length;
                announce(opt.label + ' selected. ' + n + ' documented ' +
                    (n === 1 ? 'order' : 'orders') + ' shown.');
            });
            row.appendChild(b);
        });
    }

    function renderStory(mount) {
        var signature = state.filter;
        if (mount.dataset.filter === signature && mount.childElementCount) return;
        mount.dataset.filter = signature;
        mount.hidden = false;
        mount.querySelectorAll('.gx-story-rail').forEach(function (rail) {
            if (rail._resizeObserver) rail._resizeObserver.disconnect();
        });
        mount.textContent = '';
        STORIES.filter(function (story) {
            return state.filter === 'all' || story.platform === state.filter;
        }).forEach(function (story) {
            var card = el('article', 'gx-story m-up');
            card.appendChild(el('p', 'gx-eyebrow', story.eyebrow));
            card.appendChild(el('h3', null, story.title));
            card.appendChild(el('p', 'gx-story-note', story.note));
            var rail = el('ol', 'gx-story-rail');
            rail.style.setProperty('--stages', story.steps.length);
            story.steps.forEach(function (step, index) {
                var frame = PROOF.find(function (p) { return p.id === step.proofId; });
                var node = el('li', 'gx-story-step');
                var heading = el('div', 'gx-timeline-heading');
                heading.appendChild(el('span', 'gx-timeline-dot', String(index + 1)));
                heading.appendChild(el('h4', null, step.label));
                node.appendChild(heading);
                if (frame) node.appendChild(proofCard({ key: frame.id, cover: frame, frames: story.steps.map(function (x) { return PROOF.find(function (p) { return p.id === x.proofId; }); }) }, 0, true));
                node.appendChild(el('p', null, step.body));
                rail.appendChild(node);
            });
            rail.tabIndex = 0;
            rail.setAttribute('aria-label', story.title + ' timeline. Scroll to see each step.');
            card.appendChild(rail);
            var nav = el('div', 'gx-timeline-nav');
            var previous = el('button', 'gx-chip', '← Previous');
            var next = el('button', 'gx-chip', 'Next step →');
            previous.type = next.type = 'button';
            previous.setAttribute('aria-label', 'Previous step in ' + story.title);
            next.setAttribute('aria-label', 'Next step in ' + story.title);
            var move = function (direction) {
                var distance = rail.firstElementChild.getBoundingClientRect().width + 22;
                rail.scrollBy({ left: direction * distance, behavior: reduced ? 'instant' : 'smooth' });
            };
            previous.addEventListener('click', function () { move(-1); });
            next.addEventListener('click', function () { move(1); });
            var sync = function () {
                previous.disabled = rail.scrollLeft < 2;
                next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 3;
            };
            rail.addEventListener('scroll', sync, { passive: true });
            if ('ResizeObserver' in window) {
                rail._resizeObserver = new ResizeObserver(sync);
                rail._resizeObserver.observe(rail);
            }
            nav.append(previous, next);
            card.appendChild(nav);
            window.requestAnimationFrame(sync);
            card.appendChild(el('p', 'gx-smallprint', story.footnote));
            mount.appendChild(card);
        });
        if (window.Motion) window.Motion.observe(mount);
    }

    /** One card per order. `order` is { key, cover, frames }. */
    function proofCard(order, index, compact) {
        var item = order.cover;
        var card = el('button', 'gx-shot m-up');
        card.type = 'button';

        var box = el('span', 'gx-shot-img');
        var img = document.createElement('img');
        img.src = item.thumb || item.src;
        /* `srcset` is optional: give the entry one and the browser picks the
           right file per screen, otherwise the single thumb is used. The full
           -size file is only ever fetched when the viewer opens. */
        if (item.srcset) {
            img.srcset = item.srcset;
            img.sizes = item.sizes || '(min-width: 760px) 210px, 45vw';
        }
        img.alt = item.shows;
        /* The whole evidence section sits below the fold, so nothing in it is
           eager: the box is reserved either way, so a late image costs a
           placeholder, never a reflow. */
        img.loading = 'lazy';
        img.decoding = 'async';
        if (item.w) img.width = item.w;
        if (item.h) img.height = item.h;
        img.addEventListener('load', function () { img.classList.add('is-loaded'); });
        if (img.complete) img.classList.add('is-loaded');
        box.appendChild(img);
        box.appendChild(el('span', 'gx-enlarge', 'View screenshot ↗'));
        card.appendChild(box);

        /* In the story rail the step supplies the words, so the card carries
           the image and the stage label only: the same sentence printed twice
           reads as two separate records. */
        var meta = el('span', 'gx-shot-meta');
        if (!compact) meta.appendChild(el('strong', null, item.shows));

        /* Only what the record actually supports. A country that was never
           verified prints nothing at all rather than a guess. */
        var facts = [PLAT_NAME[item.platform] || item.platform];
        if (item.country && P.REGIONS[item.country]) facts.push(P.REGIONS[item.country].name);
        if (item.period) facts.push(item.period);
        if (!compact) meta.appendChild(el('p', null, facts.join(' \u00b7 ')));

        var tags = el('span', 'gx-tags');
        tags.appendChild(el('span', 'gx-tag gx-tag--' + STAGE[item.stage].cls, STAGE[item.stage].tag));
        if (!compact && order.frames.length > 1) {
            tags.appendChild(el('span', 'gx-tag', order.frames.length + ' records \u00b7 one order'));
        }
        meta.appendChild(tags);
        card.appendChild(meta);

        var label = 'Enlarge: ' + item.shows;
        if (order.frames.length > 1) {
            label += ' \u2014 ' + order.frames.length + ' records from this one order';
        }
        card.setAttribute('aria-label', label);

        /* The viewer walks this order's own frames, so paging through it can
           never look like paging through different customers. */
        card.addEventListener('click', function () {
            openViewer(order.frames, order.frames.indexOf(item));
        });
        return card;
    }

    /* -- image viewer ------------------------------------------------ */

    var proofRevealed = false;
    var viewerList = [], viewerAt = 0;

    function openViewer(list, index) {
        trackEvent('evidence_opened', { proof_id: list[index].id });
        viewerList = list;
        viewerAt = Math.max(0, index);
        paintViewer();
        viewer.show({ dismissible: true, focus: $('viewerClose') });
    }

    function paintViewer() {
        var item = viewerList[viewerAt];
        if (!item) return;
        var img = $('viewerImg');
        img.src = item.src;
        img.alt = item.shows;
        $('viewerCapTitle').textContent = item.shows;

        var facts = [PLAT_NAME[item.platform] || item.platform];
        if (item.country && P.REGIONS[item.country]) facts.push(P.REGIONS[item.country].name);
        if (item.period) facts.push(item.period);
        facts.push(STAGE[item.stage].long);
        $('viewerCapMeta').textContent = facts.join(' · ');

        $('viewerCount').textContent = (viewerAt + 1) + ' of ' + viewerList.length;
        $('viewerPrev').disabled = viewerAt === 0;
        $('viewerNext').disabled = viewerAt >= viewerList.length - 1;

        if (canAnimate) {
            play(img, [
                { opacity: 0, transform: 'scale(.985)' },
                { opacity: 1, transform: 'none' }
            ], { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' });
        }
    }

    function step(delta) {
        var next = viewerAt + delta;
        if (next < 0 || next >= viewerList.length) return;
        viewerAt = next;
        paintViewer();
    }

    /* ============================================ 8. HAND-OFF === */

    function sendOrder() {
        var q = quote();
        if (!q.priced) return;

        var btn = $('sendBtn');
        var text = orderMessage();
        var url = chatUrl();
        trackEvent('chat_open_requested', { currency: q.currency, value: q.total });

        btn.classList.add('is-busy');
        var spin = el('span', 'gx-spin');
        btn.appendChild(spin);

        // With noopener, browsers can return null even when the tab opens.
        // Do not mistake that for a blocked popup or a successfully sent order.
        try { window.open(url, '_blank', 'noopener'); } catch (e) { /* copy fallback below */ }

        sendTouched = true;
        window.setTimeout(function () {
            btn.classList.remove('is-busy');
            spin.remove();

            /* Ignore a hand-off result if the customer changed the package. */
            if (!sendTouched || orderMessage() !== text) return;

            $('sendStatusTxt').textContent =
                'Review and send the order in WhatsApp. If it didn’t open, copy it below.';
            $('fallback').hidden = false;
            $('fallbackTxt').value = text;
            announce($('sendStatusTxt').textContent);
        }, 420);
    }

    function showFallback(text) {
        var box = $('fallback');
        box.hidden = false;
        $('fallbackTxt').value = text;
        scrollTo(box);
    }

    function copyMessage(button) {
        trackEvent('copy_requested');
        var text = orderMessage();
        if (!text) return;
        var done = function (ok) {
            var label = button.querySelector('.gx-btn-label') || button;
            var was = label.textContent;
            label.textContent = ok ? 'Copied' : 'Press and hold to copy';
            announce(ok ? 'Order summary copied.' : 'Copy the message from the box below.');
            window.setTimeout(function () { label.textContent = was; }, 2200);
        };

        if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
            window.navigator.clipboard.writeText(text).then(function () { done(true); },
                function () { showFallback(text); done(false); });
        } else {
            showFallback(text);
            var area = $('fallbackTxt');
            area.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            done(ok);
        }
    }

    /* ============================================== 9. WIRING === */

    function togglePlatform(key, on) {
        var next = state.platforms.filter(function (k) { return k !== key; });
        if (on) next.push(key);
        state.platforms = normalise(next);
        trackEvent('platform_selected');
        sendTouched = false;
        save();
        render();
        announceSelection();
        if (canAnimate) play(document.querySelector('.gx-core-number'), [
            { transform: 'scale(.94)', opacity: .65 },
            { transform: 'scale(1)', opacity: 1 }
        ], { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' });
    }

    /**
     * The real checkbox/radio is visually hidden, so the focus ring has to be
     * drawn on its label. `:focus-visible` can't be relied on here: clicking a
     * label moves focus to the input *after* the click, and focus we move
     * ourselves when a dialog opens is a separate case again. So the page
     * tracks the last input modality itself — a ring for keyboard, none for a
     * tap or a click.
     */
    var lastWasPointer = false;
    document.addEventListener('pointerdown', function () { lastWasPointer = true; }, true);
    document.addEventListener('keydown', function () { lastWasPointer = false; }, true);

    function wireFocusRing(label) {
        var box = label.querySelector('input');
        box.addEventListener('focus', function () {
            label.classList.toggle('is-kb', !lastWasPointer);
        });
        box.addEventListener('blur', function () { label.classList.remove('is-kb'); });
    }

    function start() {
        load();

        welcome = Modal($('welcomeDlg'));
        trust = Modal($('trustDlg'));
        viewer = Modal($('viewerDlg'));

        summaries = [
            { body: $('sumBody'), count: $('sumCount'), shape: null, role: 'choose' },
            { body: $('sum2Body'), count: $('sum2Count'), shape: null, role: 'send' }
        ];

        trackEvent('page_view');
        document.querySelectorAll('[data-hero-platform]').forEach(function (button) {
            button.addEventListener('click', function () {
                var key = button.dataset.heroPlatform;
                togglePlatform(key, state.platforms.indexOf(key) === -1);
            });
        });
        $('bundleBtn').addEventListener('click', function () {
            if (!state.country) { openCountry(false); return; }
            state.platforms = ORDER.slice();
            sendTouched = false;
            save(); render(); announceSelection();
            trackEvent('bundle_selected');
        });
        document.querySelectorAll('.gx-faq details').forEach(function (item, index) {
            item.addEventListener('toggle', function () {
                if (item.open) trackEvent('answer_opened', { answer_index: index });
            });
        });

        /* -- platforms -- */
        document.querySelectorAll('.gx-plat').forEach(function (label) {
            var box = label.querySelector('input');
            wireFocusRing(label);
            box.addEventListener('change', function () {
                togglePlatform(label.getAttribute('data-plat'), box.checked);
            });
        });

        /* -- country -- */
        document.querySelectorAll('.gx-ctry').forEach(function (label) {
            var box = label.querySelector('input');
            wireFocusRing(label);
            box.addEventListener('change', function () { chooseCountry(box.value); });
        });
        $('countryBtn').addEventListener('click', function () { openCountry(!!state.country); });
        $('welcomeGo').addEventListener('click', commitCountry);
        $('welcomeClose').addEventListener('click', function () { welcome.close(); });

        /* -- trust -- */
        $('trustGo').addEventListener('click', function () {
            trust.close(function () { goToResults(); });
        });

        /* -- proof -- */
        $('proofMore').addEventListener('click', function () {
            state.shown += PAGE_SIZE;
            renderProof();
            announce('Showing ' + Math.min(state.shown, visibleProof().length) + ' of ' +
                visibleProof().length + ' results.');
        });

        /* -- viewer -- */
        $('viewerClose').addEventListener('click', function () { viewer.close(); });
        $('viewerPrev').addEventListener('click', function () { step(-1); });
        $('viewerNext').addEventListener('click', function () { step(1); });
        $('viewerDlg').addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        });

        /* -- send -- */
        $('sendBtn').addEventListener('click', sendOrder);
        $('copyBtn').addEventListener('click', function () { copyMessage(this); });
        $('fallbackCopy').addEventListener('click', function () { copyMessage(this); });
        $('barBtn').addEventListener('click', function () {
            if (state.resultsSeen) {
                sendOrder();
                window.setTimeout(function () { scrollTo($('send')); }, reduced ? 0 : 420);
            } else {
                continueToResults();
            }
        });

        render();

        /* The bar only exists to reach a control that has scrolled away. */
        if ('IntersectionObserver' in window) {
            var watch = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var which = entry.target.getAttribute('data-bar-watch');
                    barVisible[which] = entry.isIntersecting;
                });
                renderBar();
            }, { threshold: 0 });

            var cta = $('sumBody');
            var heroCta = $('heroContinue');
            if (heroCta) { heroCta.setAttribute('data-bar-watch', 'heroCta'); watch.observe(heroCta); }
            if (cta) { cta.setAttribute('data-bar-watch', 'summaryCta'); watch.observe(cta); }
            var send = $('send');
            if (send) { send.setAttribute('data-bar-watch', 'sendCta'); watch.observe(send); }

            /* Which of the three steps is being read right now. */
            var track = $('stepTrack');
            if (track) {
                var here = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        var id = entry.target.id;
                        document.querySelectorAll('[data-chapter]').forEach(function (link) {
                            if (link.dataset.chapter === id) link.setAttribute('aria-current', 'step');
                            else link.removeAttribute('aria-current');
                        });
                        if (!entry.target.dataset.measured) {
                            entry.target.dataset.measured = 'true';
                            trackEvent('section_viewed', { section: id });
                        }
                        track.querySelectorAll('li').forEach(function (li) {
                            var on = li.getAttribute('data-step') === id;
                            if (on) li.setAttribute('aria-current', 'step');
                            else li.removeAttribute('aria-current');
                        });
                        if (id === 'results' && !state.resultsSeen) {
                            state.resultsSeen = true;
                            save();
                            renderSteps();
                            renderBar();
                        }
                    });
                }, { rootMargin: '-45% 0px -45% 0px' });
                ['choose', 'results', 'send'].forEach(function (id) {
                    var n = $(id);
                    if (n) here.observe(n);
                });
            }
        }

        /* First visit this session: no country, so nothing may show a price. */
        if (!state.country) {
            window.requestAnimationFrame(function () { openCountry(false); });
        }
    }

    /* The summary's primary action is created by buildSummary, so it is wired
       through delegation rather than re-bound on every render. */
    document.addEventListener('click', function (e) {
        var go = e.target.closest ? e.target.closest('[data-action="continue"]') : null;
        if (go) { e.preventDefault(); continueToResults(); }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

})(window, document);
