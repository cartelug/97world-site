/**
 * 97 WORLD — PRO TOOLS (CapCut Pro / Canva Pro)
 *
 * Two term-priced cards on /business/. Unlike the boost catalogue, this is
 * not region-aware: the customer's price list quotes these only in UGX via
 * Mobile Money, so there is no USD rate to convert for the SS/CD regions —
 * showing one would be inventing a number, so the price is always UGX.
 *
 * Picking a term updates the price (rolled, not snapped — same value-change
 * rule as everywhere else), the per-month line, and the WhatsApp message,
 * so the order the team receives always names the exact term and price the
 * visitor saw.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    if (!P || !P.TOOL_PLANS || !document.getElementById('capcutDurs')) return;

    var WA = '256762193386';
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var $ = function (id) { return document.getElementById(id); };
    var money = function (n) { return n.toLocaleString() + ' UGX'; };

    function haptic() { if (navigator.vibrate && !reduceMotion) navigator.vibrate(9); }

    function roll(el, text) {
        if (window.Motion) window.Motion.roll(el, text);
        else if (el) el.textContent = text;
    }

    function setUp(key) {
        var tool = P.TOOL_PLANS[key];
        if (!tool) return;

        var durs = $(key + 'Durs');
        var priceEl = $(key + 'Price');
        var perEl = $(key + 'Per');
        var cta = $(key + 'Cta');
        var chosen = tool.terms[0];

        function render() {
            durs.innerHTML = tool.terms.map(function (t) {
                return '<button type="button" class="tool-dur m-press' +
                    (t.months === chosen.months ? ' is-on' : '') + '"' +
                    ' data-months="' + t.months + '" aria-pressed="' + (t.months === chosen.months) + '">' +
                    t.months + ' mo</button>';
            }).join('');
        }

        function paint() {
            roll(priceEl, money(chosen.ugx));
            var perMonth = Math.round(chosen.ugx / chosen.months / 50) * 50;
            perEl.textContent = 'for ' + chosen.months + ' months · ~' + perMonth.toLocaleString() + ' UGX/mo';

            var msg = 'Hi 97 World, I’d like ' + tool.name + ' for ' + chosen.months +
                ' months (' + money(chosen.ugx) + ').';
            cta.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
        }

        durs.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-months]');
            if (!btn) return;
            var months = Number(btn.dataset.months);
            var term = tool.terms.filter(function (t) { return t.months === months; })[0];
            if (!term) return;
            chosen = term;
            durs.querySelectorAll('.tool-dur').forEach(function (b) {
                var on = Number(b.dataset.months) === months;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-pressed', String(on));
            });
            paint();
            haptic();
        });

        render();
        paint();
    }

    setUp('capcut');
    setUp('canva');

})(window, document);
