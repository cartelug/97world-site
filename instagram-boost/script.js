/**
 * 97 WORLD — INSTAGRAM BOOST
 * Pricing, discount rules, Sheets logging and the WhatsApp hand-off.
 * All shared UI behaviour lives in /assets/order.js (OrderKit).
 */
(function () {
    'use strict';

    var CONFIG = {
        sheetUrl: 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec',
        whatsapp: '256762193386',

        prices: {
            UGX: {
                followers: [
                    { v: 1000, p: 75000 }, { v: 4000, p: 141000 },
                    { v: 7000, p: 208000 }, { v: 10000, p: 250000 }
                ],
                likes: [
                    { v: 1000, p: 50000 }, { v: 4000, p: 83000 },
                    { v: 7000, p: 116000 }, { v: 10000, p: 150000 }
                ],
                rules: { floor: 50000, ceiling: 360000 }
            },
            USD: {
                followers: [
                    { v: 3000, p: 35 }, { v: 5000, p: 50 },
                    { v: 8000, p: 75 }, { v: 10000, p: 100 }
                ],
                likes: [
                    { v: 2500, p: 35 }, { v: 5000, p: 50 },
                    { v: 7500, p: 75 }, { v: 10000, p: 100 }
                ],
                rules: { floor: 35, ceiling: 100 }
            }
        }
    };

    var state = {
        currency: 'UGX',
        code: 'UG',
        fol: -1,          // -1 = not buying this category
        lik: -1,
        splits: 5,
        referred: false,
        busy: false,
        total: 0
    };

    var $ = function (id) { return document.getElementById(id); };

    /* ------------------------------------------------------------ render */

    function tierMarkup(kind, tier, index, selected, bonus) {
        return '<button type="button" class="tier' + (selected ? ' is-on' : '') + '"' +
            ' data-kind="' + kind + '" data-index="' + index + '"' +
            ' aria-pressed="' + selected + '">' +
            '<span class="tier-check"></span>' +
            '<span class="tier-vol">' + OrderKit.vol(tier.v) + '</span>' +
            (bonus ? '<span class="tier-bonus">+ ' + bonus + ' views</span>' : '') +
            '<span class="tier-price">' + OrderKit.money(tier.p, state.currency) + '</span>' +
            '</button>';
    }

    function skipMarkup(kind, label, selected) {
        return '<button type="button" class="tier tier--skip' + (selected ? ' is-on' : '') + '"' +
            ' data-kind="' + kind + '" data-index="-1" aria-pressed="' + selected + '">' +
            '<i class="fas fa-ban"></i> ' + label + '</button>';
    }

    function renderTiers() {
        var matrix = CONFIG.prices[state.currency];

        $('grid-followers').innerHTML =
            matrix.followers.map(function (tier, i) {
                return tierMarkup('fol', tier, i, state.fol === i, null);
            }).join('') +
            skipMarkup('fol', "I don't need followers", state.fol === -1);

        $('grid-likes').innerHTML =
            matrix.likes.map(function (tier, i) {
                return tierMarkup('lik', tier, i, state.lik === i, OrderKit.vol(tier.v * 2));
            }).join('') +
            skipMarkup('lik', "I don't need likes", state.lik === -1);

        $('split-box').hidden = state.lik === -1;
    }

    /* -------------------------------------------------------- the maths */

    function recalc() {
        var matrix = CONFIG.prices[state.currency];
        var subtotal = 0;
        var categories = 0;

        if (state.fol > -1) {
            subtotal += matrix.followers[state.fol].p;
            categories++;
        }

        if (state.lik > -1) {
            var lik = matrix.likes[state.lik];
            subtotal += lik.p;
            categories++;
            $('split-math').textContent =
                '~' + Math.floor(lik.v / state.splits).toLocaleString() + ' likes per post';
        }

        var total = subtotal;
        var chipBundle = $('chip-bundle');
        var chipCap = $('chip-cap');
        var strike = $('dock-strike');

        chipBundle.classList.remove('is-on');
        chipCap.classList.remove('is-on');
        strike.textContent = '';

        // both categories together earn 10% off
        if (categories === 2 && subtotal > 0) {
            total = subtotal * 0.90;
            chipBundle.classList.add('is-on');
            strike.textContent = OrderKit.money(subtotal, state.currency);
        }

        if (categories > 0) {
            if (total < matrix.rules.floor) total = matrix.rules.floor;
            if (total >= matrix.rules.ceiling) {
                total = matrix.rules.ceiling;
                chipBundle.classList.remove('is-on');
                chipCap.classList.add('is-on');
                strike.textContent = '';
            }
        } else {
            total = 0;
        }

        state.total = total;

        if (state.currency === 'USD') {
            $('dock-price').textContent = '$' + total.toLocaleString();
            $('dock-curr').textContent = 'USD';
        } else {
            $('dock-price').textContent = total.toLocaleString();
            $('dock-curr').textContent = 'UGX';
        }

        syncRail();
    }

    function syncRail() {
        var picked = state.fol > -1 || state.lik > -1;
        var filled = $('client-name').value.trim().length > 1 &&
            $('client-number').value.trim().replace(/\D/g, '').length >= 8 &&
            $('target-username').value.trim().length > 0;

        if (!picked) OrderKit.rail(1, 0);
        else if (!filled) OrderKit.rail(2, 1);
        else OrderKit.rail(3, 2);
    }

    /* --------------------------------------------------------- packaging */

    function describe() {
        var matrix = CONFIG.prices[state.currency];
        var sheetStr = '';
        var waStr = '';
        var lines = [];

        if (state.fol > -1) {
            var folVol = matrix.followers[state.fol].v;
            sheetStr += folVol + ' Followers. ';
            waStr += '🚀 *Followers:* ' + folVol.toLocaleString() + '\n';
            lines.push(['Followers', folVol.toLocaleString()]);
        }

        if (state.lik > -1) {
            var likVol = matrix.likes[state.lik].v;
            var views = likVol * 2;
            sheetStr += likVol + ' Likes (Split ' + state.splits + ') + ' + views + ' Views.';
            waStr += '❤️ *Likes:* ' + likVol.toLocaleString() + ' (Across ' + state.splits + ' posts)\n';
            waStr += '👁️ *Free Views:* ' + views.toLocaleString() + '\n';
            lines.push(['Likes', likVol.toLocaleString() + ' across ' + state.splits + ' posts']);
            lines.push(['Free views', views.toLocaleString()]);
        }

        return { sheet: sheetStr, wa: waStr, lines: lines };
    }

    /* -------------------------------------------------------- validation */

    function validate() {
        if (state.fol === -1 && state.lik === -1) {
            OrderKit.toast('Pick a followers or likes package first.');
            OrderKit.scrollTo('grid-followers');
            return null;
        }

        OrderKit.clearErrors();

        var name = $('client-name').value.trim();
        if (name.length < 2) {
            OrderKit.fieldError('client-name', 'Please enter your name');
            return null;
        }

        var raw = $('client-number').value.trim();
        if (raw.replace(/\D/g, '').length < 8) {
            OrderKit.fieldError('client-number', 'Enter a valid WhatsApp number');
            return null;
        }

        var username = $('target-username').value.trim().replace(/^@/, '');
        if (!username) {
            OrderKit.fieldError('target-username', 'We need the username to send to');
            return null;
        }

        var referrer = 'Direct';
        if (state.referred) {
            var typed = $('referrer-name').value.trim();
            if (typed) referrer = typed;
        }

        return { name: name, phone: OrderKit.phone(raw), username: username, referrer: referrer };
    }

    /* ------------------------------------------------------------ review */

    function openReview() {
        var order = validate();
        if (!order) return;

        var pack = describe();
        var rows = pack.lines.map(function (pair) {
            return '<div class="sum-row"><span>' + pair[0] + '</span><b>' + pair[1] + '</b></div>';
        });
        rows.push('<div class="sum-row"><span>Instagram</span><b>@' + order.username + '</b></div>');
        rows.push('<div class="sum-row"><span>WhatsApp</span><b>' + order.phone.clean + '</b></div>');
        rows.push('<div class="sum-row is-total"><span>Total</span><b>' +
            OrderKit.money(state.total, state.currency) + '</b></div>');

        $('sum-list').innerHTML = rows.join('');
        OrderKit.openSheet('confirmSheet');
        OrderKit.haptic(12);
    }

    function confirmOrder() {
        if (state.busy) return;
        var order = validate();
        if (!order) { OrderKit.closeSheet('confirmSheet'); return; }

        state.busy = true;
        var btn = $('btn-confirm');
        btn.classList.add('is-busy');
        btn.querySelector('.cta-label').textContent = 'Opening WhatsApp…';
        btn.querySelector('.cta-icon').innerHTML = '<span class="spinner"></span>';

        var pack = describe();
        var totalText = OrderKit.money(state.total, state.currency);

        var message = '*NEW INSTAGRAM ORDER [' + order.username.toUpperCase() + ']*\n\n' +
            '*Service:* Instagram Boost\n' +
            '*Client Name:* ' + order.name + '\n' +
            '*WhatsApp:* ' + order.phone.clean + '\n' +
            '*Package:* \n' + pack.wa + '\n' +
            '*Price:* ' + totalText + '\n' +
            '*Referrer:* ' + order.referrer + '\n' +
            '*Username:* ' + order.username;

        OrderKit.send({
            sheetUrl: CONFIG.sheetUrl,
            whatsapp: CONFIG.whatsapp,
            message: message,
            sheet: {
                ClientName: order.name,
                Number: order.phone.sheet,
                Service: 'Instagram Boost [' + state.currency + ']',
                Package: (pack.sheet + ' [Target: ' + order.username + ']').trim(),
                Price: String(state.total),
                Referrer: order.referrer
            }
        });

        setTimeout(function () {
            state.busy = false;
            btn.classList.remove('is-busy');
            btn.querySelector('.cta-label').textContent = 'Send on WhatsApp';
            btn.querySelector('.cta-icon').innerHTML = '<i class="fab fa-whatsapp"></i>';
        }, 6000);
    }

    /* -------------------------------------------------------------- wire */

    function init() {
        OrderKit.boot();

        OrderKit.region({
            key: 'k97_ig',
            onChange: function (currency, code) {
                state.currency = currency;
                state.code = code;
                // reset to a sensible starting point for the new price list
                state.fol = 0;
                state.lik = -1;
                state.splits = 5;
                $('split-count').textContent = '5';
                renderTiers();
                recalc();
            }
        });

        // tiers are re-rendered on every change, so delegate rather than rebind
        document.querySelectorAll('.tier-grid').forEach(function (grid) {
            grid.addEventListener('click', function (e) {
                var btn = e.target.closest('.tier');
                if (!btn || state.busy) return;
                var index = parseInt(btn.dataset.index, 10);
                if (btn.dataset.kind === 'fol') state.fol = index;
                else state.lik = index;
                renderTiers();
                recalc();
                OrderKit.haptic(10);
            });
        });

        var adjust = function (delta) {
            state.splits = Math.min(10, Math.max(1, state.splits + delta));
            $('split-count').textContent = state.splits;
            recalc();
            OrderKit.haptic(8);
        };
        $('split-minus').addEventListener('click', function () { adjust(-1); });
        $('split-plus').addEventListener('click', function () { adjust(1); });

        var setReferred = function (yes) {
            state.referred = yes;
            $('ref-yes').classList.toggle('is-on', yes);
            $('ref-yes').setAttribute('aria-pressed', String(yes));
            $('ref-no').classList.toggle('is-on', !yes);
            $('ref-no').setAttribute('aria-pressed', String(!yes));
            $('ref-drawer').classList.toggle('is-open', yes);
            if (yes) setTimeout(function () { $('referrer-name').focus(); }, 260);
            else $('referrer-name').value = '';
        };
        $('ref-yes').addEventListener('click', function () { setReferred(true); });
        $('ref-no').addEventListener('click', function () { setReferred(false); });

        ['client-name', 'client-number', 'target-username'].forEach(function (id) {
            $(id).addEventListener('input', syncRail);
        });

        // Enter anywhere in the form jumps straight to review
        document.querySelectorAll('.field input').forEach(function (input) {
            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); openReview(); }
            });
        });

        $('btn-submit').addEventListener('click', openReview);
        $('btn-confirm').addEventListener('click', confirmOrder);

        renderTiers();
        recalc();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
