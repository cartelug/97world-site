/**
 * 97 WORLD — FACEBOOK BOOST
 * Tier pricing, Sheets logging and the WhatsApp hand-off.
 * All shared UI behaviour lives in /assets/order.js (OrderKit).
 */
(function () {
    'use strict';

    var CONFIG = {
        sheetUrl: 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec',
        whatsapp: '256762193386',

        // icons line up 1:1 with the perk order below
        icons: ['fa-user-plus', 'fa-thumbs-up', 'fa-heart', 'fa-comment-dots'],

        matrix: {
            UGX: [
                { id: 0, title: 'Advanced', price: 375000, perks: ['10k Followers', '3k Page Likes', '3k Reactions', '5k Post Likes'] },
                { id: 1, title: 'Pro', price: 506250, perks: ['15k Followers', '5k Page Likes', '5k Reactions', '10k Post Likes'] },
                { id: 2, title: 'Elite', price: 618750, tag: 'Most popular', perks: ['20k Followers', '7.5k Page Likes', '7.5k Reactions', '15k Post Likes'] },
                { id: 3, title: 'Ultimate', price: 750000, tag: 'Max impact', perks: ['30k Followers', '10k Page Likes', '10k Reactions', '20k Post Likes'] }
            ],
            USD: [
                { id: 0, title: 'Advanced', price: 100, perks: ['10k Followers', '3k Page Likes', '3k Reactions', '5k Post Likes'] },
                { id: 1, title: 'Pro', price: 135, perks: ['15k Followers', '5k Page Likes', '5k Reactions', '10k Post Likes'] },
                { id: 2, title: 'Elite', price: 165, tag: 'Most popular', perks: ['20k Followers', '7.5k Page Likes', '7.5k Reactions', '15k Post Likes'] },
                { id: 3, title: 'Ultimate', price: 200, tag: 'Max impact', perks: ['30k Followers', '10k Page Likes', '10k Reactions', '20k Post Likes'] }
            ]
        }
    };

    var state = {
        currency: 'UGX',
        code: 'UG',
        selected: -1,
        referred: false,
        busy: false,
        total: 0
    };

    var $ = function (id) { return document.getElementById(id); };

    /* ------------------------------------------------------------ render */

    function renderTiers() {
        var tiers = CONFIG.matrix[state.currency];
        var sym = state.currency === 'USD' ? '$' : '';
        var cur = state.currency === 'USD' ? 'USD' : 'UGX';

        $('package-list').innerHTML = tiers.map(function (tier) {
            var on = state.selected === tier.id;
            return '<button type="button" class="tier-row' + (on ? ' is-on' : '') + '"' +
                ' data-id="' + tier.id + '" aria-pressed="' + on + '">' +
                (tier.tag ? '<span class="tier-tag">' + tier.tag + '</span>' : '') +
                '<span class="tr-top">' +
                    '<span class="tr-name">' + tier.title + '</span>' +
                    '<span class="tr-price">' + sym + tier.price.toLocaleString() +
                        '<small>' + cur + '</small></span>' +
                '</span>' +
                '<ul class="tr-perks">' +
                    tier.perks.map(function (perk, i) {
                        return '<li><i class="fas ' + CONFIG.icons[i] + '"></i><span>' + perk + '</span></li>';
                    }).join('') +
                '</ul>' +
                '</button>';
        }).join('');
    }

    function updateDock() {
        var chip = $('chip-tier');

        if (state.selected === -1) {
            state.total = 0;
            $('dock-price').textContent = '0';
            $('dock-curr').textContent = state.currency;
            chip.classList.remove('is-on');
        } else {
            var tier = CONFIG.matrix[state.currency][state.selected];
            state.total = tier.price;
            $('dock-price').textContent =
                (state.currency === 'USD' ? '$' : '') + tier.price.toLocaleString();
            $('dock-curr').textContent = state.currency === 'USD' ? 'USD' : 'UGX';
            $('chip-tier-name').textContent = tier.title;
            chip.classList.add('is-on');
        }

        syncRail();
    }

    function syncRail() {
        var filled = $('client-name').value.trim().length > 2 &&
            $('client-number').value.trim().replace(/\D/g, '').length >= 8 &&
            $('fb-link').value.trim().length > 2;

        if (state.selected === -1) OrderKit.rail(1, 0);
        else if (!filled) OrderKit.rail(2, 1);
        else OrderKit.rail(3, 2);

        // the CTA label is the fastest way to tell someone what's missing
        var label = $('btn-submit').querySelector('.cta-label');
        if (state.selected === -1) label.textContent = 'Select a package';
        else if (!filled) label.textContent = 'Add your details';
        else label.textContent = 'Review order';
    }

    /* -------------------------------------------------------- validation */

    function validate() {
        if (state.selected === -1) {
            OrderKit.toast('Choose a package first.');
            OrderKit.scrollTo('package-list');
            return null;
        }

        OrderKit.clearErrors();

        var name = $('client-name').value.trim();
        if (name.length < 3) {
            OrderKit.fieldError('client-name', 'Please enter your full name');
            return null;
        }

        var raw = $('client-number').value.trim();
        if (raw.replace(/\D/g, '').length < 8) {
            OrderKit.fieldError('client-number', 'Enter a valid WhatsApp number');
            return null;
        }

        var target = $('fb-link').value.trim();
        if (target.length < 3) {
            OrderKit.fieldError('fb-link', 'We need the page name or username');
            return null;
        }

        var referrer = 'Direct';
        if (state.referred) {
            var typed = $('ref-code').value.trim();
            if (typed) referrer = typed;
        }

        return { name: name, phone: OrderKit.phone(raw), target: target, referrer: referrer };
    }

    /* ------------------------------------------------------------ review */

    function openReview() {
        var order = validate();
        if (!order) return;

        var tier = CONFIG.matrix[state.currency][state.selected];
        var rows = [
            '<div class="sum-row"><span>Package</span><b>' + tier.title + ' Tier</b></div>'
        ];
        tier.perks.forEach(function (perk) {
            rows.push('<div class="sum-row"><span>Includes</span><b>' + perk + '</b></div>');
        });
        rows.push('<div class="sum-row"><span>Page</span><b>' + order.target + '</b></div>');
        rows.push('<div class="sum-row"><span>WhatsApp</span><b>' + order.phone.clean + '</b></div>');
        rows.push('<div class="sum-row is-total"><span>Total</span><b>' +
            OrderKit.money(tier.price, state.currency) + '</b></div>');

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

        var tier = CONFIG.matrix[state.currency][state.selected];
        var displayPrice = OrderKit.money(tier.price, state.currency);

        var message = '🚀 *NEW FACEBOOK BOOST*\n\n' +
            '*Client Name:* ' + order.name + '\n' +
            '*WhatsApp:* ' + order.phone.clean + '\n' +
            '*Package:* ' + tier.title + ' Tier\n' +
            '*Total:* ' + displayPrice + '\n\n' +
            '👤 *Target Page:* ' + order.target + '\n' +
            '🎁 *Referrer:* ' + order.referrer + '\n\n' +
            '_I have accepted the terms and am ready to pay the 30% deposit._';

        OrderKit.send({
            sheetUrl: CONFIG.sheetUrl,
            whatsapp: CONFIG.whatsapp,
            message: message,
            sheet: {
                ClientName: order.name,
                Number: order.phone.sheet,
                Service: 'Facebook Boost [' + state.currency + ']',
                Package: tier.title + ' Tier',
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
            key: 'k97_fb',
            onChange: function (currency, code) {
                state.currency = currency;
                state.code = code;
                state.selected = -1;   // prices changed, so the choice must too
                renderTiers();
                updateDock();
            }
        });

        $('package-list').addEventListener('click', function (e) {
            var row = e.target.closest('.tier-row');
            if (!row || state.busy) return;
            state.selected = parseInt(row.dataset.id, 10);
            renderTiers();
            updateDock();
            OrderKit.haptic(14);
            OrderKit.scrollTo('details', 220);
        });

        var setReferred = function (yes) {
            state.referred = yes;
            $('ref-yes').classList.toggle('is-on', yes);
            $('ref-yes').setAttribute('aria-pressed', String(yes));
            $('ref-no').classList.toggle('is-on', !yes);
            $('ref-no').setAttribute('aria-pressed', String(!yes));
            $('ref-drawer').classList.toggle('is-open', yes);
            if (yes) setTimeout(function () { $('ref-code').focus(); }, 260);
            else $('ref-code').value = '';
        };
        $('ref-yes').addEventListener('click', function () { setReferred(true); });
        $('ref-no').addEventListener('click', function () { setReferred(false); });

        ['client-name', 'client-number', 'fb-link'].forEach(function (id) {
            $(id).addEventListener('input', syncRail);
        });

        document.querySelectorAll('.field input').forEach(function (input) {
            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); openReview(); }
            });
        });

        $('btn-submit').addEventListener('click', openReview);
        $('btn-confirm').addEventListener('click', confirmOrder);

        renderTiers();
        updateDock();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
