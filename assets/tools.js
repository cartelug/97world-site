/**
 * 97 WORLD — OFFERS (/subs/)
 *
 * Renders every entry in P.SUBSCRIPTIONS as a pricing card — one grid,
 * driven entirely by data, so a new product never means hand-writing
 * another card. Each card: a brand-tinted logo badge, the same three
 * honest feature lines every subscription order page already promises,
 * a term picker, a price with a real "was" comparison, and a Get now
 * button that hands the chosen term to that product's own order page via
 * P.Pending — same handoff /growth/'s combo cards use.
 *
 * The "was" price and savings figure are not invented: they're the
 * product's own 3-month rate multiplied out to the chosen term length,
 * compared against the real price of that term. Every number in it comes
 * straight from P.SUBSCRIPTIONS. On the 3-month term itself there is
 * nothing to compare against, so the discount row is hidden rather than
 * showing a fake "save 0".
 *
 * Region-aware: Uganda (UGX) and South Sudan (USD) both have real prices,
 * so a toggle switches every card at once. DR Congo isn't priced for any
 * of these yet — deliberately not offered here rather than guessed at.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    var grid = document.getElementById('toolsGrid');
    if (!P || !P.SUBSCRIPTIONS || !grid) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Display order matches the customer's own price list, not alphabetical.
    var ORDER = [
        'canva-pro', 'capcut-pro', 'google-ai-pro', 'coursera-plus', 'duolingo-super',
        'perplexity-pro', 'prime-video', 'apple-tv-plus', 'crunchyroll',
        'linkedin-premium-career', 'adobe-creative-cloud'
    ];

    // The same three lines every subscription order page's own guarantee
    // copy already promises (tools/build-order-pages.mjs SUB_GIFTS/SUB_PROOF)
    // — restated here, not reinvented, so the card can never claim more
    // than the order page it hands off to actually delivers.
    var FEATS = [
        'Pick your months, pay once',
        'Replaced if it breaks',
        'Real support on WhatsApp'
    ];

    var region = (P.Region.get() === 'SS') ? 'SS' : 'UG';
    // one chosen term per product, remembered across a region switch
    var chosen = {};

    function haptic() { if (navigator.vibrate && !reduceMotion) navigator.vibrate(9); }
    function roll(el, text) {
        if (window.Motion) window.Motion.roll(el, text);
        else if (el) el.textContent = text;
    }
    function money(n, currency) {
        return currency === 'USD' ? '$' + n.toLocaleString() : n.toLocaleString() + ' UGX';
    }
    function roundLike(n, useUsd) {
        return useUsd ? Math.round(n * 100) / 100 : Math.round(n / 50) * 50;
    }

    // computed once here rather than leaned on color-mix() in CSS, which
    // still isn't universal on the older Android browsers this audience
    // actually uses
    function brandVars(hex) {
        if (!hex) return '';
        var n = parseInt(hex.replace('#', ''), 16);
        var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return ' style="--tc-brand:' + hex + ';--tc-brand-bg:rgba(' + r + ',' + g + ',' + b + ',0.16)"';
    }

    function cardHTML(key, sub) {
        var style = brandVars(sub.brand);
        return '<article class="offer-card tool-card" id="card-' + key + '" data-tool="' + key + '"' + style + '>' +
            '<span class="oc-flag" id="flag-' + key + '" hidden>⭐ Recommended</span>' +
            '<div class="oc-head">' +
                '<span class="oc-ic tc-ic"><i class="' + sub.icon + '"></i></span>' +
                '<div class="oc-title"><h3>' + sub.name + '</h3><p>Shared login, fixed term — pick your months below.</p></div>' +
            '</div>' +
            '<ul class="oc-feats tc-feats">' +
                FEATS.map(function (f) { return '<li><i class="fas fa-check"></i> ' + f + '</li>'; }).join('') +
            '</ul>' +
            '<div class="tool-durs" role="group" aria-label="' + sub.name + ' term" id="durs-' + key + '"></div>' +
            '<div class="tc-price-block">' +
                '<div class="tc-price-row">' +
                    '<s class="tc-was" id="was-' + key + '" hidden></s>' +
                    '<b class="m-roll tc-price" id="price-' + key + '">—</b>' +
                '</div>' +
                '<span class="tc-save" id="save-' + key + '" hidden><i class="fas fa-tag"></i> Save <b></b></span>' +
                '<small class="oc-per" id="per-' + key + '">&nbsp;</small>' +
            '</div>' +
            '<a href="/subs/' + sub.slug + '/" class="oc-cta" id="cta-' + key + '">Get now <i class="fas fa-arrow-right"></i></a>' +
        '</article>';
    }

    grid.innerHTML = ORDER.map(function (key) { return cardHTML(key, P.SUBSCRIPTIONS[key]); }).join('') +
        '<article class="offer-card">' +
            '<div class="oc-head">' +
                '<span class="oc-ic"><i class="fas fa-comments"></i></span>' +
                '<div class="oc-title"><h3>Looking for something else?</h3>' +
                    '<p>DStv Stream and more are being added as real prices get set — never before that. Tell us what you’re after.</p></div>' +
            '</div>' +
            '<a href="https://wa.me/256762193386?text=Hi%2097%20World%2C%20do%20you%20sell%20a%20subscription%20I%20don%27t%20see%20on%20the%20offers%20page%3F"' +
               ' target="_blank" rel="noopener" class="oc-cta oc-cta--quiet"><i class="fab fa-whatsapp"></i> Ask about another platform</a>' +
        '</article>';

    function setUp(key) {
        var sub = P.SUBSCRIPTIONS[key];
        var plans = sub.tiers; // raw tiers; priced per-region at paint time
        var shortest = plans[0]; // the 3-month term — the rate every "was" price scales from
        var card = document.getElementById('card-' + key);
        var flag = document.getElementById('flag-' + key);
        var durs = document.getElementById('durs-' + key);
        var wasEl = document.getElementById('was-' + key);
        var priceEl = document.getElementById('price-' + key);
        var saveEl = document.getElementById('save-' + key);
        var saveB = saveEl.querySelector('b');
        var perEl = document.getElementById('per-' + key);
        var cta = document.getElementById('cta-' + key);

        if (!chosen[key]) {
            chosen[key] = plans.filter(function (t) { return t.tag; })[0] || plans[0];
        }

        function render() {
            durs.innerHTML = plans.map(function (t) {
                return '<button type="button" class="tool-dur m-press' +
                    (t.months === chosen[key].months ? ' is-on' : '') + '"' +
                    ' data-months="' + t.months + '" aria-pressed="' + (t.months === chosen[key].months) + '">' +
                    t.months + ' mo</button>';
            }).join('');
        }

        function paint() {
            var t = chosen[key];
            var useUsd = region === 'SS';
            var price = useUsd ? t.usd : t.ugx;
            var currency = useUsd ? 'USD' : 'UGX';
            roll(priceEl, money(price, currency));

            var perMonth = roundLike(useUsd ? t.usd / t.months : t.ugx / t.months, useUsd);
            perEl.textContent = 'for ' + t.months + ' months · ~' + money(perMonth, currency) + '/mo';

            // real "was" price: the 3-month term's own rate, scaled to this
            // many months — only ever a genuine comparison against a real
            // published tier, never an invented number.
            var shortRate = useUsd ? shortest.usd / shortest.months : shortest.ugx / shortest.months;
            var compareAt = roundLike(shortRate * t.months, useUsd);
            var save = compareAt - price;

            if (save > 0) {
                wasEl.hidden = false;
                roll(wasEl, money(compareAt, currency));
                saveEl.hidden = false;
                saveB.textContent = money(save, currency);
                // spelled out, not left implicit — the "was" figure is the
                // product's own 3-month rate scaled up, not an official
                // list price, and that basis should never be a guess
                saveEl.title = 'Compared to paying the 3-month rate for ' + t.months + ' months.';
                perEl.textContent += ' · vs the 3-mo rate';
            } else {
                wasEl.hidden = true;
                saveEl.hidden = true;
            }

            var isTagged = !!t.tag;
            flag.hidden = !isTagged;
            card.classList.toggle('has-flag', isTagged);
        }

        durs.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-months]');
            if (!btn) return;
            var months = Number(btn.dataset.months);
            var term = plans.filter(function (t) { return t.months === months; })[0];
            if (!term) return;
            chosen[key] = term;
            durs.querySelectorAll('.tool-dur').forEach(function (b) {
                var on = Number(b.dataset.months) === months;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-pressed', String(on));
            });
            paint();
            haptic();
        });

        cta.addEventListener('click', function () {
            P.Pending.set(key, null, String(chosen[key].months));
        });

        render();
        paint();

        return paint; // exposed so the region toggle can repaint without re-rendering the term buttons
    }

    var repaint = ORDER.map(setUp);

    var toggle = document.getElementById('regionToggle');
    if (toggle) {
        toggle.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-region]');
            if (!btn || btn.dataset.region === region) return;
            region = btn.dataset.region;
            P.Region.set(region);
            toggle.querySelectorAll('[data-region]').forEach(function (b) {
                b.classList.toggle('is-on', b.dataset.region === region);
            });
            repaint.forEach(function (fn) { fn(); });
            haptic();
        });
    }

})(window, document);
