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
 *   1. Data the owner maintains (proof library — currently empty, see PROOF)
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

    /**
     * THE PROOF LIBRARY
     *
     * Six records from two real 97 World conversations, supplied by the owner
     * in the Growth master package. Every file here was re-encoded after solid
     * rectangles were painted over the private parts, so what ships contains no
     * recoverable original — this is redaction, not a blur over an intact file.
     * Removed: the client's name, their photographs, their date of birth, their
     * spouse's name, their bio, the contact names in both chats, the amounts,
     * 97 World's own Mobile Money number, the mobile-money balance and
     * transaction ID, the client's name inside the receipt and its filename,
     * and two third-party reference accounts. EXIF was dropped on encode.
     *
     * Two records from the package were not published at all: a duplicate
     * capture of the same sales chat, and a chat carrying 97 World's Mobile
     * Money number and account name, a third party's phone number and three
     * third-party Instagram handles.
     *
     * What each record is allowed to say is bounded by what it shows:
     *   - `country: null` on all of them. The client's names read as South
     *     Sudanese and the payment was in shillings, but neither is a verified
     *     country, and country is never inferred from a name.
     *   - Nothing is `stage: 'complete'`. 97 World's own message on the last
     *     frame reads "Boost nearly done", so the order was still running when
     *     the 13K profile was captured. There is no completion record here.
     *   - `orderId` groups the four frames of the Facebook order into one card
     *     and the two frames of the sales chat into another, so six screenshots
     *     are never read as six customers.
     *
     * Shape of an entry, for whatever is added next:
     *   {
     *     id:       'ug-ig-2026-03',            // stable, unique
     *     orderId:  'ug-ig-2026-03',            // frames of one order share it
     *     src:      '/IMAGES/proof/x.webp',     // cleared file, private data removed
     *     thumb:    '/IMAGES/proof/x-420.webp', // the card's crop, 709:460
     *     srcset:   '…-420.webp 420w, …-840.webp 840w',   // optional, responsive
     *     sizes:    '(min-width: 760px) 210px, 45vw',     // optional, with srcset
     *     w: 709, h: 460,                       // the crop's size, reserves the box
     *     platform: 'instagram',                // a key this page sells
     *     country:  'UG',                       // ONLY if actually verified; else null
     *     shows:    'What the screenshot shows, in one sentence.',
     *     period:   'March 2026',               // omit if not known
     *     stage:    'progress'                  // 'process' | 'progress' | 'complete'
     *   }
     */
    function shot(id, orderId, name, platform, shows, stage, period) {
        return {
            id: id,
            orderId: orderId,
            src: '/IMAGES/proof/' + name + '.webp',
            thumb: '/IMAGES/proof/' + name + '-420.webp',
            srcset: '/IMAGES/proof/' + name + '-420.webp 420w, ' +
                    '/IMAGES/proof/' + name + '-840.webp 840w',
            sizes: '(min-width: 1000px) 210px, (min-width: 620px) 30vw, 45vw',
            w: 709, h: 460,          // the card's crop; the viewer's file is taller
            platform: platform,
            country: null,
            shows: shows,
            period: period || null,
            stage: stage
        };
    }

    var PROOF = [
        /* --- one Facebook follower order, four records, one client --- */
        shot('fb-01', 'fb-order', 'case-fb-before', 'facebook',
            'The client\u2019s Facebook profile before the boost: 9.8K followers, at 16:25.',
            'progress', '16 September 2026'),
        shot('fb-02', 'fb-order', 'case-payment-receipt', 'facebook',
            'The client\u2019s mobile-money payment for this order, and the numbered receipt 97 World issued for it.',
            'progress', '16 September 2026'),
        shot('fb-03', 'fb-order', 'case-progress', 'facebook',
            '97 World sends the client their updated profile with the message \u201cBoost nearly done\u201d.',
            'progress', '16 September 2026'),
        shot('fb-04', 'fb-order', 'case-fb-after', 'facebook',
            'The same profile at 16:31, six minutes later: 13K followers, while the order was still running.',
            'progress', '16 September 2026'),

        /* --- one sales conversation, two records: how an order is agreed --- */
        shot('sale-01', 'sale-chat', 'offer-quote', 'instagram',
            'The offer as 97 World sends it: 10,000 followers on Instagram, TikTok or Facebook \u2014 ' +
            '$100 for one platform, $250 for all three. Prices are set in US dollars; the total above ' +
            'is the same offer in your own currency.',
            'process', '17 September 2026'),
        shot('sale-02', 'sale-chat', 'offer-terms', 'instagram',
            'The same chat: all three chosen, account links checked, then the terms \u2014 $250 total, $125 to start and $125 after completion.',
            'process', '17 September 2026')
    ];

    /**
     * The one documented order, told in the order it happened. Every claim in
     * `note` is one the screenshots themselves carry; the increase is stated as
     * what it is rather than rounded up to the package size.
     */
    var STORY = {
        title: 'One Facebook order, as it was recorded',
        note: 'Four records from a single order \u2014 one client, not four. Between ' +
              '16:25 and 16:31 on the same day the profile went from 9.8K to 13K ' +
              'followers, an increase of about 3,200. 97 World\u2019s own message calls ' +
              'the boost \u201cnearly done\u201d at that point, so this is delivery in ' +
              'progress, not a finished 10,000-follower order, and it is not proof ' +
              'that any particular account will grow the same way. Names, photographs, ' +
              'payment details and personal information were removed from the image files.',
        steps: [
            { label: 'Starting point', proofId: 'fb-01',
              body: '9.8K followers on the client\u2019s Facebook profile before the boost began.' },
            { label: 'Progress', proofId: 'fb-03',
              body: '97 World sends the client their profile mid-delivery: \u201cBoost nearly done.\u201d' },
            { label: 'Latest documented result', proofId: 'fb-04',
              body: '13K followers six minutes after the first capture. The order was still running.' }
        ]
    };

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
        return 'Hello 97 World, I’ve reviewed the Growth page and would like you to check this order.\n\n' +
            'Country: ' + countryName() + '\n' +
            'Platforms: ' + platformNames().join(', ') + '\n' +
            'Package: 10,000 followers per selected platform\n' +
            'Total: ' + P.money(q.total, q.currency) + '\n' +
            'First payment after confirmation: ' + P.money(q.deposit, q.currency) + '\n' +
            'Balance after completion: ' + P.money(q.balance, q.currency) + '\n\n' +
            'Please review my accounts and confirm the order details before sending payment instructions.';
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

    /* -- platform cards --------------------------------------------- */

    function renderPlatforms() {
        document.querySelectorAll('.gx-plat').forEach(function (label) {
            var key = label.getAttribute('data-plat');
            var on = state.platforms.indexOf(key) !== -1;
            var box = label.querySelector('input');
            if (box.checked !== on) box.checked = on;
            label.classList.toggle('is-on', on);
        });
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
            sub.appendChild(document.createTextNode('The three packages bought separately are '));
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
            'After we review and confirm your order in chat.'));

        dl.appendChild(row('balance', 'gx-row gx-row-split gx-stage gx-stage-2',
            '50% after completion', money(q.balance),
            'Remaining balance after the agreed delivery is finished.'));

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

        btn.disabled = !q.priced;
        copy.hidden = !q.priced;

        if (sendTouched) return;                            // keep the live result

        if (!state.platforms.length) {
            status.textContent = 'Choose at least one platform above to build your request.';
        } else if (!state.country) {
            status.textContent = 'Choose your country so the request carries the right currency.';
        } else {
            status.textContent = 'Nothing is charged here. You read the message and send it yourself, ' +
                'and we reply in the chat before any payment instructions.';
        }
    }

    /* -- the mobile action bar --------------------------------------- */

    var barVisible = { summaryCta: false, sendCta: false };

    function renderBar() {
        var bar = $('bar');
        var q = quote();
        var wanted = q.priced && !barVisible.summaryCta && !barVisible.sendCta;

        if (wanted) {
            bar.hidden = false;
            $('barLabel').textContent = 'Total';
            roll($('barTotal'), money(q.total));
            $('barBtn').querySelector('.gx-btn-label').textContent =
                state.resultsSeen ? 'Send request' : 'Continue';
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
        renderSummaries();
        renderSteps();
        renderSend();
        renderBar();
        renderProof();
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
        state.country = picked.value;       // platforms are untouched on purpose
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
        if (state.trustSeen) { goToResults(); return; }
        state.trustSeen = true;
        save();
        /* No close icon, no backdrop dismissal, no Escape, no countdown —
           one button, available immediately. */
        trust.show({ dismissible: false, focus: $('trustGo') });
    }

    function goToResults() {
        state.resultsSeen = true;
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

        if (!PROOF.length) {
            grid.hidden = true;
            filters.hidden = true;
            moreWrap.hidden = true;
            story.hidden = true;
            renderProofEmpty(empty);
            return;
        }

        empty.textContent = '';
        renderFilters(filters);
        renderStory(story);

        var orders = visibleProof();
        var page = orders.slice(0, state.shown);

        grid.hidden = false;
        grid.textContent = '';
        page.forEach(function (order, i) { grid.appendChild(proofCard(order, i)); });

        /* Cards are rebuilt whenever the ranking changes, which can happen
           while the customer is looking at them. The entrance plays once; after
           that new cards arrive already revealed rather than fading in again
           under the reader's eyes. */
        if (proofRevealed) {
            grid.querySelectorAll('.m-up').forEach(function (n) {
                n.classList.add('is-in', 'is-visible');
            });
        } else if ('IntersectionObserver' in window) {
            proofRevealed = grid.getBoundingClientRect().top < window.innerHeight;
        }

        moreWrap.hidden = orders.length <= state.shown;
        if (window.Motion) window.Motion.observe(grid);

        /* Evidence we do not have is said out loud, not papered over: for the
           country the customer chose and for the platforms they picked. */
        var note = $('proofLocalNote');
        if (note) note.remove();

        var gaps = [];
        if (state.country) {
            var local = orders.some(function (o) {
                return o.frames.some(function (f) { return f.country === state.country; });
            });
            if (!local) {
                gaps.push('We have not verified the country on any of these records, so none ' +
                    'of them is published as a result from ' + countryName() + '.');
            }
        }
        var missing = state.platforms.filter(function (k) {
            return !orders.some(function (o) { return o.cover.platform === k; });
        });
        if (missing.length) {
            gaps.push('We have nothing published yet for ' +
                listSentence(missing.map(function (k) { return PLAT_NAME[k]; })) + '.');
        }
        if (gaps.length) {
            var gapNote = el('p', 'gx-smallprint', gaps.join(' ') +
                ' Ask us in the chat and we will show you what else we can share.');
            gapNote.id = 'proofLocalNote';
            grid.parentNode.insertBefore(gapNote, grid);
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

        var options = [{ key: 'all', label: 'All results' }];
        ORDER.forEach(function (k) {
            if (present.indexOf(k) !== -1) options.push({ key: k, label: PLAT_NAME[k] });
        });

        options.forEach(function (opt) {
            var b = el('button', 'gx-chip m-press', opt.label);
            b.type = 'button';
            b.setAttribute('aria-pressed', state.filter === opt.key ? 'true' : 'false');
            b.addEventListener('click', function () {
                state.filter = opt.key;
                state.shown = PAGE_SIZE;
                renderProof();
                var n = visibleProof().length;
                announce(opt.label + ' selected. ' + n + ' documented ' +
                    (n === 1 ? 'order' : 'orders') + ' shown.');
            });
            row.appendChild(b);
        });
    }

    function renderStory(mount) {
        if (!STORY) { mount.hidden = true; mount.textContent = ''; return; }
        mount.hidden = false;
        mount.textContent = '';

        var card = el('div', 'gx-story m-up');
        card.appendChild(el('h3', null, STORY.title));
        if (STORY.note) card.appendChild(el('p', 'gx-smallprint', STORY.note));

        var rail = el('div', 'gx-story-rail');
        STORY.steps.forEach(function (step) {
            var s = el('div', 'gx-story-step');
            s.appendChild(el('h4', null, step.label));
            var shot = PROOF.filter(function (p) { return p.id === step.proofId; })[0];
            if (shot) s.appendChild(proofCard({ key: shot.id, cover: shot, frames: [shot] }, 0, true));
            s.appendChild(el('p', null, step.body));
            rail.appendChild(s);
        });
        card.appendChild(rail);
        mount.appendChild(card);
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

        btn.classList.add('is-busy');
        var spin = el('span', 'gx-spin');
        btn.appendChild(spin);

        var opened = null;
        try { opened = window.open(url, '_blank', 'noopener'); } catch (e) { opened = null; }

        sendTouched = true;
        window.setTimeout(function () {
            btn.classList.remove('is-busy');
            spin.remove();

            if (opened) {
                $('sendStatusTxt').textContent =
                    'WhatsApp is opening with your request. Read it, send it, and we’ll reply ' +
                    'in the chat — nothing is ordered or paid until we confirm it with you.';
                $('fallback').hidden = true;
            } else {
                $('sendStatusTxt').textContent =
                    'Your browser blocked the chat from opening. Copy the message below and paste ' +
                    'it into your chat with 97 World.';
                showFallback(text);
            }
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
        sendTouched = false;
        save();
        render();
        announceSelection();
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
                scrollTo($('send'));
                var btn = $('sendBtn');
                if (btn && !btn.disabled) {
                    window.setTimeout(function () {
                        try { btn.focus({ preventScroll: true }); } catch (e) { btn.focus(); }
                    }, reduced ? 0 : 420);
                }
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
