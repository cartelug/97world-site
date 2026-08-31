/**
 * 97 WORLD — OFFERS
 *
 * The Prime Video card's term picker on /offers/. Same term-picker pattern
 * as assets/pro-tools.js (CapCut/Canva), but instead of opening WhatsApp
 * directly, it hands the chosen term to /prime-video/ via P.Pending — the
 * same handoff already used from /growth/'s combo cards — so the visitor
 * lands on the full order wizard with their term pre-selected, gets a
 * tracked order (Sheets row + Worker record), not just a WhatsApp message.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    if (!P || !P.SUBSCRIPTIONS || !document.getElementById('pvDurs')) return;

    var sub = P.SUBSCRIPTIONS['prime-video'];
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var durs = document.getElementById('pvDurs');
    var priceEl = document.getElementById('pvPrice');
    var perEl = document.getElementById('pvPer');
    var cta = document.getElementById('pvCta');

    // Default to the first tagged tier ("Best value" / "Most popular") if
    // one exists, rather than always opening on the cheapest — matches the
    // steer already given in the card's own copy.
    var chosen = sub.tiers.filter(function (t) { return t.tag; })[0] || sub.tiers[0];

    function money(n) { return n.toLocaleString() + ' UGX'; }
    function haptic() { if (navigator.vibrate && !reduceMotion) navigator.vibrate(9); }
    function roll(el, text) {
        if (window.Motion) window.Motion.roll(el, text);
        else if (el) el.textContent = text;
    }

    function render() {
        durs.innerHTML = sub.tiers.map(function (t) {
            return '<button type="button" class="tool-dur m-press' +
                (t.months === chosen.months ? ' is-on' : '') + '"' +
                ' data-months="' + t.months + '" aria-pressed="' + (t.months === chosen.months) + '">' +
                t.months + ' mo</button>';
        }).join('');
    }

    function paint() {
        roll(priceEl, money(chosen.ugx));
        var perMonth = Math.round(chosen.ugx / chosen.months / 50) * 50;
        perEl.textContent = 'for ' + chosen.months + ' months · ~' + perMonth.toLocaleString() + ' UGX/mo' +
            (chosen.tag ? ' · ' + chosen.tag : '');
    }

    durs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-months]');
        if (!btn) return;
        var months = Number(btn.dataset.months);
        var term = sub.tiers.filter(function (t) { return t.months === months; })[0];
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

    // Carries the chosen term into the order wizard; the click still
    // navigates normally right after — sessionStorage.setItem is
    // synchronous, so nothing here can race the page change.
    cta.addEventListener('click', function () {
        P.Pending.set('prime-video', null, String(chosen.months));
    });

    render();
    paint();

})(window, document);
