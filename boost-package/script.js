/**
 * 97 WORLD — GROWTH BUNDLE
 * Followers + likes in one bundle, landing on Instagram, TikTok or both.
 * Priced in USD only. Shared UI behaviour lives in /assets/order.js.
 */
(function () {
    'use strict';

    var CONFIG = {
        sheetUrl: 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec',
        whatsapp: '256762193386',

        // core = what you pay for, bonus = the 1,000 we add on top
        plans: [
            {
                id: 0, title: 'Creator Mode', price: 50, tag: 'Entry',
                core: 4000, bonus: 1000, likes: 400, posts: 5
            },
            {
                id: 1, title: 'Starter Pack', price: 75, tag: 'Popular',
                core: 6000, bonus: 1000, likes: 600, posts: 5
            },
            {
                id: 2, title: 'VVIP Status', price: 99, tag: 'Best seller',
                core: 10000, bonus: 1000, likes: 1000, posts: 5
            }
        ]
    };

    var state = {
        plan: -1,
        platform: null,
        referred: false,
        busy: false
    };

    var $ = function (id) { return document.getElementById(id); };
    var n = function (v) { return v.toLocaleString(); };

    /* ------------------------------------------------------------ render */

    function renderPlans() {
        $('plan-list').innerHTML = CONFIG.plans.map(function (plan) {
            var on = state.plan === plan.id;
            return '<button type="button" class="tier-row' + (on ? ' is-on' : '') + '"' +
                ' data-id="' + plan.id + '" aria-pressed="' + on + '">' +
                (plan.tag ? '<span class="tier-tag">' + plan.tag + '</span>' : '') +
                '<span class="tr-top">' +
                    '<span class="tr-name">' + plan.title + '</span>' +
                    '<span class="tr-price">$' + plan.price + '<small>USD</small></span>' +
                '</span>' +
                '<ul class="tr-perks">' +
                    '<li><i class="fas fa-user-plus"></i><span>' + n(plan.core + plan.bonus) + ' followers</span></li>' +
                    '<li><i class="fas fa-gift"></i><span>' + n(plan.bonus) + ' of those free</span></li>' +
                    '<li><i class="fas fa-heart"></i><span>' + n(plan.likes) + ' likes</span></li>' +
                    '<li><i class="fas fa-images"></i><span>Across ' + plan.posts + ' posts</span></li>' +
                '</ul>' +
                '</button>';
        }).join('');
    }

    function renderPlatforms() {
        document.querySelectorAll('.pick').forEach(function (btn) {
            var on = btn.dataset.platform === state.platform;
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-pressed', String(on));
        });
    }

    /** Plain-English breakdown of where the followers actually go. */
    function distribution() {
        if (state.plan === -1 || !state.platform) return null;
        var plan = CONFIG.plans[state.plan];

        if (state.platform === 'Ultimate Mix') {
            return n(plan.core) + ' on TikTok + ' + n(plan.bonus) + ' on Instagram';
        }
        var where = state.platform === 'Instagram Only' ? 'Instagram' : 'TikTok';
        return n(plan.core + plan.bonus) + ' Followers on ' + where;
    }

    function updateSplitInfo() {
        var text = distribution();
        var box = $('split-info').querySelector('span');
        box.textContent = text
            ? text + ', plus ' + n(CONFIG.plans[state.plan].likes) + ' likes across ' +
              CONFIG.plans[state.plan].posts + ' posts.'
            : 'Choose a platform to see exactly how your followers get distributed.';
    }

    function updateDock() {
        var chipPlan = $('chip-plan');
        var chipPlat = $('chip-plat');

        if (state.plan === -1) {
            $('dock-price').textContent = '$0';
            chipPlan.classList.remove('is-on');
        } else {
            var plan = CONFIG.plans[state.plan];
            $('dock-price').textContent = '$' + plan.price;
            $('chip-plan-name').textContent = plan.title;
            chipPlan.classList.add('is-on');
        }

        if (state.platform) {
            $('chip-plat-name').textContent =
                state.platform === 'Ultimate Mix' ? 'Both platforms' : state.platform.replace(' Only', '');
            chipPlat.classList.add('is-on');
        } else {
            chipPlat.classList.remove('is-on');
        }

        syncRail();
    }

    function syncRail() {
        var filled = $('client-name').value.trim().length > 1 &&
            $('client-number').value.trim().replace(/\D/g, '').length >= 8 &&
            $('social-handle').value.trim().length > 0;

        var done = 0;
        if (state.plan > -1) done = 1;
        if (state.plan > -1 && state.platform) done = 2;
        if (done === 2 && filled) done = 3;
        OrderKit.rail(Math.min(done + 1, 3), done);

        var label = $('btn-submit').querySelector('.cta-label');
        if (state.plan === -1) label.textContent = 'Pick a bundle';
        else if (!state.platform) label.textContent = 'Choose platform';
        else if (!filled) label.textContent = 'Add your details';
        else label.textContent = 'Review order';
    }

    /* -------------------------------------------------------- validation */

    function validate() {
        if (state.plan === -1) {
            OrderKit.toast('Pick a bundle first.');
            OrderKit.scrollTo('plan-list');
            return null;
        }
        if (!state.platform) {
            OrderKit.toast('Tell us where the bundle should land.');
            OrderKit.scrollTo('where');
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

        var handle = $('social-handle').value.trim();
        if (!handle) {
            OrderKit.fieldError('social-handle', 'We need the handle to send to');
            return null;
        }

        var referrer = 'Direct';
        if (state.referred) {
            var typed = $('ref-code').value.trim();
            if (typed) referrer = typed;
        }

        return {
            name: name,
            phone: OrderKit.phone(raw),
            handle: handle,
            payment: $('payment-method').value,
            referrer: referrer
        };
    }

    /* ------------------------------------------------------------ review */

    function openReview() {
        var order = validate();
        if (!order) return;

        var plan = CONFIG.plans[state.plan];
        $('sum-list').innerHTML = [
            '<div class="sum-row"><span>Bundle</span><b>' + plan.title + '</b></div>',
            '<div class="sum-row"><span>Followers</span><b>' + distribution() + '</b></div>',
            '<div class="sum-row"><span>Likes</span><b>' + n(plan.likes) + ' across ' + plan.posts + ' posts</b></div>',
            '<div class="sum-row"><span>Handle</span><b>' + order.handle + '</b></div>',
            '<div class="sum-row"><span>WhatsApp</span><b>' + order.phone.clean + '</b></div>',
            '<div class="sum-row"><span>Payment</span><b>' + order.payment + '</b></div>',
            '<div class="sum-row is-total"><span>Total</span><b>$' + plan.price + ' USD</b></div>'
        ].join('');

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

        var plan = CONFIG.plans[state.plan];
        var details = distribution();

        var message = 'Order for 97 World:\n\n' +
            '*Service:* Growth Bundle\n' +
            '*Level:* ' + plan.title + ' ($' + plan.price + ')\n' +
            '*Target:* ' + state.platform + '\n' +
            '*Details:* ' + details + '\n' +
            '*Likes:* ' + n(plan.likes) + ' (Included)\n' +
            '*Handle:* ' + order.handle + '\n' +
            '*Name:* ' + order.name + '\n' +
            '*WhatsApp:* ' + order.phone.clean + '\n' +
            '*Referrer:* ' + order.referrer + '\n' +
            '*Payment:* ' + order.payment;

        OrderKit.send({
            sheetUrl: CONFIG.sheetUrl,
            whatsapp: CONFIG.whatsapp,
            message: message,
            sheet: {
                ClientName: order.name,
                Number: order.phone.sheet,
                Service: 'Growth Bundle [USD]',
                Package: plan.title + ' — ' + details + ' + ' + n(plan.likes) +
                    ' Likes [Target: ' + order.handle + '] [Pay: ' + order.payment + ']',
                Price: String(plan.price),
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

        $('plan-list').addEventListener('click', function (e) {
            var row = e.target.closest('.tier-row');
            if (!row || state.busy) return;
            state.plan = parseInt(row.dataset.id, 10);
            renderPlans();
            updateSplitInfo();
            updateDock();
            OrderKit.haptic(14);
            OrderKit.scrollTo('where', 220);
        });

        $('platform-list').addEventListener('click', function (e) {
            var btn = e.target.closest('.pick');
            if (!btn || state.busy) return;
            state.platform = btn.dataset.platform;
            renderPlatforms();
            updateSplitInfo();
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

        ['client-name', 'client-number', 'social-handle'].forEach(function (id) {
            $(id).addEventListener('input', syncRail);
        });

        document.querySelectorAll('.field input').forEach(function (input) {
            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); openReview(); }
            });
        });

        $('btn-submit').addEventListener('click', openReview);
        $('btn-confirm').addEventListener('click', confirmOrder);

        renderPlans();
        updateDock();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
