/**
 * 97 GROWTH — new order
 *
 * The panel form: category, service, link, quantity, charge, submit. One
 * screen, one order, no guided detour.
 *
 * Two things it deliberately does not copy from a stock SMM panel:
 *
 *   1. No supplier language. The dropdowns say "Instagram" and "Followers",
 *      never a service ID or a "Max 10K / Non Drop API" string — those
 *      describe where we buy, not what the customer is getting.
 *
 *   2. Quantity is a select of real tiers, not a free number box. A panel
 *      multiplies a per-1000 rate by whatever you type; this price list is
 *      tiered, so that rate would disagree with the customer's own numbers
 *      at every amount in between. We list what we sell and price it exactly.
 *
 * Everything shown comes from assets/pricing.js. Submitting hands off to the
 * same review sheet, WhatsApp message and Sheets row the order pages use.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    if (!P || !document.getElementById('qoCat')) return;

    var WA = '256762193386';
    var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec';

    /* Services delivered to one post/track rather than to a profile — used to
     * tell someone they have pasted the wrong kind of link. */
    var POST_LEVEL = {
        ig_likes: 1, ig_reels: 1, ig_story: 1, ig_comments: 1, ig_saves: 1,
        tt_likes: 1, tt_views: 1, tt_shares: 1,
        fb_likes: 1, fb_reactions: 1, fb_views: 1,
        yt_views: 1, yt_likes: 1, yt_hours: 1, yt_comments: 1,
        x_likes: 1, x_reposts: 1, x_impressions: 1,
        tg_reactions: 1, tg_views: 1, wa_react: 1,
        li_postlikes: 1, sp_plays: 1, am_plays: 1, am_likes: 1, sc_plays: 1, sc_likes: 1
    };

    var $ = function (id) { return document.getElementById(id); };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var region = P.Region.get() || 'UG';

    function meta(key) { return P.PLAT_META[key] || { name: key }; }

    function mark(key, cls) {
        var m = meta(key);
        return m.logo
            ? '<img src="' + m.logo + '" alt="">'
            : '<i class="' + m.icon + (cls ? ' ' + cls : '') + '"></i>';
    }

    function haptic() { if (navigator.vibrate && !reduceMotion) navigator.vibrate(9); }

    function roll(el, text) {
        if (window.Motion) window.Motion.roll(el, text);
        else if (el) el.textContent = text;
    }

    /* ------------------------------------------------------------ sheets --- */

    function openSheet(id) {
        var el = $(id);
        if (!el) return;
        el.classList.add('is-open');
        document.body.classList.add('is-locked');
    }
    function closeSheet(id) {
        var el = $(id);
        if (!el) return;
        el.classList.remove('is-open');
        document.body.classList.remove('is-locked');
    }

    document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('#menuBtn')) { openSheet('menuSheet'); return; }
        var closer = t.closest('[data-close]');
        if (closer) { closeSheet(closer.dataset.close); return; }
        if (t.classList && t.classList.contains('sheet')) { closeSheet(t.id); return; }
    });

    /* ------------------------------------------------------- the order --- */

    var el = {
        cat: $('qoCat'), svc: $('qoSvc'), qty: $('qoQty'),
        link: $('qoLink'), charge: $('qoCharge'),
        desc: $('qoDesc'), minmax: $('qoMinMax')
    };

    function fillCategories() {
        var all = P.GROWTH_PRIMARY.concat(P.GROWTH_MORE);
        el.cat.innerHTML = all.map(function (key) {
            return '<option value="' + key + '">' + meta(key).name + '</option>';
        }).join('');
    }

    function fillServices() {
        var key = el.cat.value;
        // only services with a real ladder can be quoted on this form
        var ids = (P.PLATFORMS[key].services || []).filter(function (id) {
            var s = P.SERVICES_BY_ID[id];
            return s && s.sizes && s.sizes.length;
        });
        el.svc.innerHTML = ids.map(function (id) {
            return '<option value="' + id + '">' + P.SERVICES_BY_ID[id].short + '</option>';
        }).join('');

        var hint = P.ACCOUNT_HINTS[key] || { placeholder: 'Profile link' };
        el.link.placeholder = hint.placeholder;
        fillQtys();
    }

    function fillQtys() {
        var id = el.svc.value;
        var cur = P.Region.data(region).currency;
        // Rebuilding the options drops the selection, which would silently
        // change someone's order when all they did was switch currency —
        // so keep the chosen amount if this service still sells it.
        var keep = el.qty.value;
        var avail = P.qtysFor(id);

        el.qty.innerHTML = avail.map(function (n) {
            var usd = P.tierUsd(id, n);
            return '<option value="' + n + '">' + n.toLocaleString() + ' — ' +
                P.money(P.localPrice(usd, cur), cur) + '</option>';
        }).join('');

        if (keep && avail.indexOf(Number(keep)) !== -1) el.qty.value = keep;

        paintDetails();
        paint();
    }

    /** The service detail box — only claims we can actually stand behind. */
    function paintDetails() {
        var s = P.SERVICES_BY_ID[el.svc.value];
        if (!s) { el.desc.innerHTML = ''; el.minmax.textContent = ''; return; }

        var qtys = P.qtysFor(s.id);
        var rows = [
            ['Start time', '1–6 hours'],
            ['Delivery', 'Gradual, natural pace'],
            ['Refill', s.refillEligible
                ? '30 days'
                : 'Not applicable — ' + s.unit + ' cannot drop once delivered']
        ];

        el.desc.innerHTML = rows.map(function (r) {
            return '<div class="qo-desc-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
        }).join('');

        el.minmax.textContent = qtys.length
            ? 'Min ' + qtys[0].toLocaleString() + ' · Max ' + qtys[qtys.length - 1].toLocaleString()
            : '';
        if (window.Motion) window.Motion.swap(el.desc);
    }

    /** The single line this form describes, or null. */
    function line() {
        var key = el.cat.value;
        var id = el.svc.value;
        var n = Number(el.qty.value);
        if (!key || !id || !n) return null;
        return { platform: key, serviceId: id, qty: n };
    }

    function paint() {
        var l = line();
        if (!l) { roll(el.charge, '—'); return; }
        var q = P.quote([l], region, 1);
        roll(el.charge, P.money(q.total, q.currency));
    }

    /** Human-readable checks only — we never claim to have inspected the account. */
    function validate(l, value) {
        var v = value.trim();
        if (!v) {
            return 'Add your ' + meta(l.platform).name +
                ' username or link so we know where to deliver.';
        }
        if (l.platform === 'webtraffic' && v.indexOf('.') === -1) {
            return 'That does not look like a website address. Paste the full URL.';
        }
        if (POST_LEVEL[l.serviceId] && l.platform !== 'webtraffic' &&
            v.indexOf('/') === -1 && v.length < 40) {
            var s = P.SERVICES_BY_ID[l.serviceId];
            return 'This looks like a profile. ' +
                (s ? s.short + ' go' + (/s$/.test(s.short) ? '' : 'es') : 'This') +
                ' to one post — paste the link to the post, reel or track instead.';
        }
        return null;
    }

    function submit() {
        var l = line();
        if (!l) return;

        var err = validate(l, el.link.value);
        if (err) {
            $('qoLinkField').classList.add('is-bad');
            $('qoLinkErr').hidden = false;
            $('qoLinkErr').textContent = err;
            $('qoLinkField').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
            return;
        }
        $('qoLinkField').classList.remove('is-bad');
        $('qoLinkErr').hidden = true;
        openReview(l, el.link.value.trim());
    }

    /* ------------------------------------------------------------ review --- */

    var pending = null;

    function openReview(l, account) {
        var q = P.quote([l], region, 1);
        var row = q.lines[0];
        pending = { line: l, account: account, quote: q };

        $('revList').innerHTML =
            '<div class="rev-row">' + mark(l.platform, 'rev-ic') +
            '<span class="rev-copy"><b>' + meta(l.platform).name + ' · ' +
                (row.service ? row.service.short : '') + '</b>' +
            '<small>' + l.qty.toLocaleString() + ' ' + (row.service ? row.service.unit : '') +
                ' — ' + account + '</small></span>' +
            '<span class="rev-amt">' + P.money(row.price, q.currency) + '</span>' +
            '</div>';

        $('revTotal').textContent = P.money(q.total, q.currency);
        openSheet('revSheet');
    }

    $('revSend').addEventListener('click', function () {
        if (!pending) return;
        var name = $('revName').value.trim();
        var phoneRaw = $('revPhone').value.trim();
        var errEl = $('revErr');

        if (name.length < 2) { errEl.hidden = false; errEl.textContent = 'Please add your name.'; return; }
        if (phoneRaw.replace(/\D/g, '').length < 8) {
            errEl.hidden = false; errEl.textContent = 'Add a WhatsApp number we can reach you on.'; return;
        }
        errEl.hidden = true;

        var q = pending.quote;
        var row = q.lines[0];
        var r = P.Region.data(region);
        var phone = window.OrderKit
            ? window.OrderKit.phone(phoneRaw)
            : { clean: phoneRaw, sheet: "'" + phoneRaw };

        var message = '*NEW 97 GROWTH ORDER [' + r.name.toUpperCase() + ']*\n\n' +
            '*Service:* ' + meta(pending.line.platform).name + ' — ' +
                (row.service ? row.service.short : '') + '\n' +
            '*Quantity:* ' + pending.line.qty.toLocaleString() + ' ' +
                (row.service ? row.service.unit : '') + '\n' +
            '*Link:* ' + pending.account + '\n' +
            '*Charge:* ' + P.money(q.total, q.currency) + '\n\n' +
            '*Name:* ' + name + '\n' +
            '*WhatsApp:* ' + phone.clean;

        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Opening WhatsApp…';

        if (window.OrderKit) {
            window.OrderKit.send({
                sheetUrl: SHEET_URL,
                whatsapp: WA,
                message: message,
                sheet: {
                    ClientName: name,
                    Number: phone.sheet,
                    Service: '97 Growth [' + q.currency + ']',
                    Package: meta(pending.line.platform).name + ' ' + pending.line.qty + ' ' +
                        (row.service ? row.service.short : '') + ' [' + pending.account + ']',
                    Price: String(q.total),
                    Referrer: 'New order form'
                }
            });
        } else {
            window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
        }
    });

    /* ------------------------------------------------------------ combos --- */

    /**
     * The real named packages from the price list. Each is a fixed
     * composition at a fixed price, so they are shown as products and
     * ordered on /boost-package/, which already sells all of them.
     */
    function renderCombos() {
        var grid = $('comboGrid');
        if (!grid) return;
        var cur = P.Region.data(region).currency;

        grid.innerHTML = P.BUNDLES.slice(0, 6).map(function (b) {
            var price = P.money(P.localPrice(b.usd, cur), cur);
            var was = b.wasUsd ? P.money(P.localPrice(b.wasUsd, cur), cur) : null;
            var feats = b.feats.map(function (f) {
                return '<span class="combo-line"><i class="' + f.icon + '"></i>' + f.text + '</span>';
            }).join('');
            return '<a href="/boost-package/" class="combo-item' + (b.tag ? ' has-tag' : '') + '">' +
                (b.tag ? '<span class="combo-tag">' + b.tag + '</span>' : '') +
                '<span class="combo-item-name">' + b.name + '</span>' +
                '<span class="combo-lines">' + feats + '</span>' +
                '<span class="combo-item-foot">' +
                    '<span class="combo-item-price">' + price +
                        (was ? ' <s>' + was + '</s>' : '') + '</span>' +
                    '<span class="combo-item-go">Order <i class="fas fa-arrow-right"></i></span>' +
                '</span>' +
                '</a>';
        }).join('');
    }

    /* ------------------------------------------------------------ region --- */

    var regionBtn = $('regionBtn');
    if (regionBtn) {
        regionBtn.addEventListener('click', function () {
            closeSheet('menuSheet');
            openSheet('regionSheet');
        });
        $('regionGrid').innerHTML = Object.keys(P.REGIONS).map(function (code) {
            var r = P.REGIONS[code];
            return '<button type="button" class="goal-card' + (region === code ? ' is-on' : '') + '"' +
                ' data-region="' + code + '">' +
                '<span class="goal-card-copy"><b>' + r.flag + ' ' + r.name + '</b><small>' + r.blurb + '</small></span>' +
                '<span class="goal-card-tick"><i class="fas fa-check"></i></span></button>';
        }).join('');
        $('regionGrid').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-region]');
            if (!btn) return;
            region = btn.dataset.region;
            P.Region.set(region);
            $('regionLabel').textContent = P.Region.data(region).currency;
            $('regionGrid').querySelectorAll('[data-region]').forEach(function (b) {
                b.classList.toggle('is-on', b.dataset.region === region);
            });
            closeSheet('regionSheet');
            fillQtys();
            renderCombos();
        });
        $('regionLabel').textContent = P.Region.data(region).currency;
    }

    /* -------------------------------------------------------------- wire --- */

    el.cat.addEventListener('change', function () { fillServices(); haptic(); });
    el.svc.addEventListener('change', function () { fillQtys(); haptic(); });
    el.qty.addEventListener('change', function () { paint(); haptic(); });
    el.link.addEventListener('input', function () {
        $('qoLinkErr').hidden = true;
        $('qoLinkField').classList.remove('is-bad');
    });
    el.link.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    $('qoSubmit').addEventListener('click', submit);

    var header = $('gHeader');
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            header.classList.toggle('is-stuck', (window.scrollY || window.pageYOffset) > 12);
            ticking = false;
        });
    }, { passive: true });

    fillCategories();
    fillServices();
    renderCombos();

})(window, document);
