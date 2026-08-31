/**
 * 97 WORLD — TOOLS
 *
 * Renders every entry in P.SUBSCRIPTIONS as a term-picker card on /tools/ —
 * one grid, driven entirely by data, so a new product (Apple TV+, DStv
 * Stream, whatever's added next) never means hand-writing another card.
 * Same interaction as the old single-card /offers/ page: pick a term, the
 * price rolls, hit Continue and the term is handed to that product's own
 * order page via P.Pending — same handoff /growth/'s combo cards use.
 *
 * Unlike the old page, this one is region-aware: Uganda (UGX) and South
 * Sudan (USD) both have real prices now, so a toggle switches every card
 * at once. DR Congo isn't priced for any of these yet — deliberately not
 * offered here rather than guessed at.
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

    function cardHTML(key, sub) {
        return '<article class="offer-card tool-card" id="card-' + key + '" data-tool="' + key + '">' +
            '<div class="oc-head">' +
                '<span class="oc-ic"><i class="' + sub.icon + '"></i></span>' +
                '<div class="oc-title"><h3>' + sub.name + '</h3><p>Pick your months below — the price updates as you go.</p></div>' +
                '<div class="oc-price"><b class="m-roll" id="price-' + key + '">—</b><small class="oc-per" id="per-' + key + '">&nbsp;</small></div>' +
            '</div>' +
            '<div class="tool-durs" role="group" aria-label="' + sub.name + ' term" id="durs-' + key + '"></div>' +
            '<a href="/' + key + '/" class="oc-cta" id="cta-' + key + '">Continue to order <i class="fas fa-arrow-right"></i></a>' +
        '</article>';
    }

    grid.innerHTML = ORDER.map(function (key) { return cardHTML(key, P.SUBSCRIPTIONS[key]); }).join('') +
        '<article class="offer-card">' +
            '<div class="oc-head">' +
                '<span class="oc-ic"><i class="fas fa-comments"></i></span>' +
                '<div class="oc-title"><h3>Looking for something else?</h3>' +
                    '<p>DStv Stream and more are being added as real prices get set — never before that. Tell us what you’re after.</p></div>' +
            '</div>' +
            '<a href="https://wa.me/256762193386?text=Hi%2097%20World%2C%20do%20you%20sell%20a%20subscription%20I%20don%27t%20see%20on%20the%20tools%20page%3F"' +
               ' target="_blank" rel="noopener" class="oc-cta oc-cta--quiet"><i class="fab fa-whatsapp"></i> Ask about another platform</a>' +
        '</article>';

    function setUp(key) {
        var sub = P.SUBSCRIPTIONS[key];
        var plans = sub.tiers; // raw tiers; priced per-region at paint time
        var durs = document.getElementById('durs-' + key);
        var priceEl = document.getElementById('price-' + key);
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
            var perMonth = useUsd ? Math.round((t.usd / t.months) * 100) / 100 : Math.round(t.ugx / t.months / 50) * 50;
            perEl.textContent = 'for ' + t.months + ' months · ~' + money(perMonth, currency) + '/mo' + (t.tag ? ' · ' + t.tag : '');
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
