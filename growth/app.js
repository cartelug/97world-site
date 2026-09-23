/**
 * 97 GROWTH — the order panel
 *
 * Laid out to match the SMM panel our customers already order through:
 * platform tiles, search, category, service, link, quantity with min/max,
 * average time, charge, submit.
 *
 * Three places it departs from that panel, each because copying it would
 * mean printing something we do not actually have:
 *
 *   1. No service IDs or supplier strings ("5403", "Max: 15K | Real Mix").
 *      Those name our supplier's catalogue entry, and ours are unmapped —
 *      any ID shown here would be invented.
 *
 *   2. Average time is the window we quote everywhere else on the site,
 *      not a to-the-minute figure. Nothing reports per-service timing to us,
 *      so "3 hours 6 minutes" would be a number we made up.
 *
 *   3. Quantity takes any number, but settles on the nearest tier the price
 *      list actually sells and says so. The list is tiered; there is no
 *      per-1000 rate to multiply an arbitrary amount by.
 *
 * Everything priced comes from assets/pricing.js. Submitting hands off to
 * the same WhatsApp message, Sheets row and Worker queue as the order pages.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    if (!P || !document.getElementById('fwCat')) return;

    var WA = '256762193386';
    var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec';
    // The order Worker (worker/) — same additive, fire-and-forget recording
    // used on every order-wizard page. Never affects the WhatsApp hand-off.
    var WORKER_API = 'https://the97-orders.carteluganda.workers.dev';
    var PROFILE_KEY = 'k97_checkout_profile';

    /* Services delivered to one post/track rather than a profile. */
    var POST_LEVEL = {
        ig_likes: 1, ig_reels: 1, ig_story: 1, ig_comments: 1, ig_saves: 1,
        tt_likes: 1, tt_views: 1, tt_shares: 1,
        fb_likes: 1, fb_reactions: 1, fb_views: 1,
        yt_views: 1, yt_likes: 1, yt_hours: 1, yt_comments: 1,
        x_likes: 1, x_reposts: 1, x_impressions: 1,
        tg_reactions: 1, tg_views: 1, wa_react: 1,
        li_postlikes: 1, sp_plays: 1, am_plays: 1, am_likes: 1, sc_plays: 1, sc_likes: 1
    };

    /* Tiles up front, the rest behind the + — never a platform we don't sell.
     * 'snapchat' is a shortcut tile, not a priced platform: it never sets
     * `filter` or drives the Category/Service combos — see renderTiles() and
     * the click handler below. Website traffic is the real priced platform
     * for "website" requests; there is no separate website-builder tile here. */
    var TILES = ['instagram', 'tiktok', 'facebook', 'youtube', 'spotify', 'telegram', 'x', 'whatsapp', 'linkedin'];
    var TILES_MORE = ['audiomack', 'soundcloud', 'webtraffic', 'snapchat'];

    var $ = function (id) { return document.getElementById(id); };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var region = P.Region.get() || 'UG';
    var filter = null;        // selected platform tile, null = All
    var tilesOpen = false;

    function meta(key) { return P.PLAT_META[key] || { name: key }; }

    function mark(key) {
        var m = meta(key);
        if (m.logo) return '<img src="' + m.logo + '" alt="">';
        return '<i class="' + m.icon + '"' + (m.color ? ' style="color:' + m.color + '"' : '') + '></i>';
    }

    function haptic() { if (navigator.vibrate && !reduceMotion) navigator.vibrate(9); }

    function roll(el, text) {
        if (window.Motion) window.Motion.roll(el, text);
        else if (el) el.textContent = text;
    }

    /** One-shot attention shake — the moment a field becomes invalid, not a
     *  loop that keeps firing while it stays that way. */
    function shake(el) {
        if (!el || reduceMotion) return;
        el.classList.remove('is-shake');
        void el.offsetWidth;
        el.classList.add('is-shake');
        window.setTimeout(function () { el.classList.remove('is-shake'); }, 450);
        haptic();
    }

    /* ------------------------------------------------------------ sheets --- */

    function openSheet(id) {
        var el = $(id);
        if (!el) return;
        el.classList.add('is-open');
        document.body.classList.add('is-locked');

        // the sheet's contents arrive as a short wave behind the slide-up,
        // so the eye lands on the order before the form fields
        var card = el.querySelector('.sheet-card');
        if (card && !reduceMotion) {
            Array.prototype.forEach.call(card.children, function (c, i) { c.style.setProperty('--i', i); });
            card.classList.remove('is-entering');
            void card.offsetWidth;
            card.classList.add('is-entering');
            window.clearTimeout(card._enterT);
            card._enterT = window.setTimeout(function () { card.classList.remove('is-entering'); }, 800);
        }
        updateBar();
    }
    function closeSheet(id) {
        var el = $(id);
        if (!el) return;
        el.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        updateBar();
    }

    /* ------------------------------------------------------- order bar ---
     * Phones only (CSS hides it on desktop, where the summary sits beside
     * the form). It appears once there's a priced amount and the in-card
     * button has scrolled out of view, and gets out of the way of any sheet. */
    var barReady = false;
    var submitInView = true;

    function updateBar() {
        var bar = $('fwBar');
        if (!bar) return;
        var show = barReady && !submitInView && !document.body.classList.contains('is-locked');
        if (show === bar.classList.contains('is-on')) return;
        bar.classList.toggle('is-on', show);
        bar.setAttribute('aria-hidden', String(!show));
        $('fwBarBtn').tabIndex = show ? 0 : -1;
        document.body.classList.toggle('has-bar', show);
    }

    document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('#menuBtn')) { openSheet('menuSheet'); return; }
        var closer = t.closest('[data-close]');
        if (closer) { closeSheet(closer.dataset.close); return; }
        if (t.classList && t.classList.contains('sheet')) { closeSheet(t.id); return; }
    });

    /* ---------------------------------------------------------- combobox ---
     * A native <select> cannot show an icon or a price against an option, and
     * cannot be typed into. On a list of twelve platforms and forty-odd
     * services that is the difference between finding a thing and scrolling
     * for it — so this is a real listbox: filterable, keyboard-driven, and
     * announced properly.
     *
     * items: [{ value, label, icon, meta }]
     * -------------------------------------------------------------------- */

    function Combo(rootId, labelId, placeholder, onPick) {
        var root = $(rootId);
        if (!root) return null;

        var items = [];
        var shown = [];
        var value = null;
        var active = -1;
        var open = false;

        root.innerHTML =
            '<button type="button" class="fw-combo-btn" id="' + rootId + '-btn"' +
                ' aria-haspopup="listbox" aria-expanded="false" aria-labelledby="' + labelId + ' ' + rootId + '-val">' +
                '<span class="fw-combo-val" id="' + rootId + '-val"></span>' +
                '<span class="fw-combo-meta" id="' + rootId + '-meta"></span>' +
                '<i class="fas fa-chevron-down fw-combo-caret" aria-hidden="true"></i>' +
            '</button>' +
            '<div class="fw-combo-pop" id="' + rootId + '-pop" tabindex="-1" hidden>' +
                '<div class="fw-combo-search" id="' + rootId + '-sw">' +
                    '<i class="fas fa-magnifying-glass" aria-hidden="true"></i>' +
                    '<input type="text" id="' + rootId + '-q" role="combobox" autocomplete="off"' +
                        ' spellcheck="false" placeholder="' + placeholder + '"' +
                        ' aria-expanded="true" aria-controls="' + rootId + '-list" aria-autocomplete="list">' +
                '</div>' +
                '<ul class="fw-combo-list" id="' + rootId + '-list" role="listbox" tabindex="-1"' +
                    ' aria-labelledby="' + labelId + '"></ul>' +
            '</div>';

        var btn = $(rootId + '-btn');
        var val = $(rootId + '-val');
        var metaEl = $(rootId + '-meta');
        var pop = $(rootId + '-pop');
        var q = $(rootId + '-q');
        var sw = $(rootId + '-sw');
        var list = $(rootId + '-list');

        function current() {
            for (var i = 0; i < items.length; i++) if (items[i].value === value) return items[i];
            return null;
        }

        function paintButton() {
            var it = current();
            val.innerHTML = it ? (it.icon || '') + '<span>' + it.label + '</span>' : '<span>—</span>';
            metaEl.textContent = it && it.meta ? it.meta : '';
        }

        function renderList() {
            if (!shown.length) {
                list.innerHTML = '<li class="fw-combo-empty" role="presentation">Nothing matches that.</li>';
                q.removeAttribute('aria-activedescendant');
                list.removeAttribute('aria-activedescendant');
                return;
            }
            list.innerHTML = shown.map(function (it, i) {
                var sel = it.value === value;
                return '<li class="fw-opt' + (sel ? ' is-sel' : '') + (i === active ? ' is-active' : '') + '"' +
                    ' id="' + rootId + '-o' + i + '" role="option" aria-selected="' + sel + '"' +
                    ' data-val="' + it.value + '">' +
                    (it.icon || '') +
                    '<span class="fw-opt-label">' + it.label + '</span>' +
                    (it.meta ? '<span class="fw-opt-meta">' + it.meta + '</span>' : '') +
                    '<i class="fas fa-check fw-opt-tick" aria-hidden="true"></i>' +
                    '</li>';
            }).join('');
            var desc = active >= 0 ? rootId + '-o' + active : '';
            q.setAttribute('aria-activedescendant', desc);
            list.setAttribute('aria-activedescendant', desc);
        }

        function filter() {
            var t = q.value.trim().toLowerCase();
            shown = !t ? items.slice() : items.filter(function (it) {
                return it.label.toLowerCase().indexOf(t) !== -1;
            });
            active = shown.length ? 0 : -1;
            renderList();
        }

        function setOpen(next) {
            open = next;
            pop.hidden = !next;
            root.classList.toggle('is-open', next);
            btn.setAttribute('aria-expanded', String(next));
            if (!next) return;

            // A four-item service list does not need a search box, and putting
            // one there only throws up a phone keyboard over the options.
            var searchable = items.length > 6;
            sw.hidden = !searchable;

            q.value = '';
            filter();
            // open with the highlight already on what is chosen
            for (var i = 0; i < shown.length; i++) {
                if (shown[i].value === value) { active = i; break; }
            }
            renderList();

            // open upward when the field sits too low for the list to fit
            pop.classList.remove('is-up');
            var space = window.innerHeight - btn.getBoundingClientRect().bottom;
            if (space < pop.offsetHeight + 16) pop.classList.add('is-up');

            (searchable ? q : list).focus();
            scrollActive();
        }

        function scrollActive() {
            var el = $(rootId + '-o' + active);
            if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        }

        function choose(v) {
            value = v;
            paintButton();
            setOpen(false);
            btn.focus();
            if (onPick) onPick(v);
        }

        btn.addEventListener('click', function () { setOpen(!open); });
        q.addEventListener('input', filter);

        pop.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!shown.length) return;
                active = e.key === 'ArrowDown'
                    ? (active + 1) % shown.length
                    : (active - 1 + shown.length) % shown.length;
                renderList();
                scrollActive();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (active >= 0 && shown[active]) choose(shown[active].value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
                btn.focus();
            }
        });

        list.addEventListener('click', function (e) {
            var li = e.target.closest('[data-val]');
            if (li) { choose(li.dataset.val); haptic(); }
        });
        list.addEventListener('mousemove', function (e) {
            var li = e.target.closest('[data-val]');
            if (!li) return;
            var i = shown.findIndex(function (it) { return it.value === li.dataset.val; });
            if (i !== -1 && i !== active) { active = i; renderList(); }
        });

        document.addEventListener('click', function (e) {
            if (open && !root.contains(e.target)) setOpen(false);
        });

        return {
            setItems: function (next, keep) {
                items = next || [];
                var stillThere = keep && items.some(function (it) { return it.value === keep; });
                value = stillThere ? keep : (items[0] ? items[0].value : null);
                paintButton();
                return value;
            },
            setValue: function (v) {
                if (!items.some(function (it) { return it.value === v; })) return;
                value = v;
                paintButton();
            },
            value: function () { return value; }
        };
    }

    var catCombo = Combo('fwCat', 'fwCatLabel', 'Search platforms\u2026', function () {
        fillServices();
        haptic();
    });
    var svcCombo = Combo('fwSvc', 'fwSvcLabel', 'Search services\u2026', function () {
        onServiceChange();
        haptic();
    });

    /* ------------------------------------------------------------- tiles --- */

    function renderTiles() {
        var shown = tilesOpen ? TILES.concat(TILES_MORE) : TILES;
        var html = '<button type="button" class="fw-tile' + (filter === null ? ' is-on' : '') +
            '" data-tile="all" aria-label="All platforms"><i class="fas fa-bars"></i></button>';

        html += shown.map(function (key) {
            // shortcut tile: opens a WhatsApp quote instead of driving the
            // Category/Service combos, so it never shows as "selected".
            if (key === 'snapchat') {
                return '<button type="button" class="fw-tile" data-tile="snapchat" aria-label="Snapchat — ask on WhatsApp">' +
                    mark(key) +
                    '<span class="fw-tile-badge" aria-hidden="true"><i class="fab fa-whatsapp" style="color:#25D366"></i></span>' +
                    '</button>';
            }
            return '<button type="button" class="fw-tile' + (filter === key ? ' is-on' : '') +
                '" data-tile="' + key + '" aria-label="' + meta(key).name + '" aria-pressed="' +
                (filter === key) + '">' + mark(key) + '</button>';
        }).join('');

        if (!tilesOpen) {
            html += '<button type="button" class="fw-tile" data-tile="more" aria-label="More platforms">' +
                '<i class="fas fa-plus"></i></button>';
        }
        $('fwPlats').innerHTML = html;
    }

    /* ---------------------------------------------------------- the form --- */

    function fillCategories() {
        var all = filter ? [filter] : P.GROWTH_PRIMARY.concat(P.GROWTH_MORE);
        catCombo.setItems(all.map(function (key) {
            return { value: key, label: meta(key).name, icon: mark(key) };
        }), catCombo.value());
        fillServices();
    }

    function fillServices() {
        var key = catCombo.value();
        if (!key) return;
        var cur = P.Region.data(region).currency;

        // only services with a real ladder can be quoted on this form
        var ids = (P.PLATFORMS[key].services || []).filter(function (id) {
            var s = P.SERVICES_BY_ID[id];
            return s && s.sizes && s.sizes.length;
        });
        svcCombo.setItems(ids.map(function (id) {
            var s = P.SERVICES_BY_ID[id];
            var from = P.tierUsd(id, P.qtysFor(id)[0]);
            return {
                value: id,
                label: s.short,
                icon: mark(key),
                meta: 'from ' + P.money(P.localPrice(from, cur), cur)
            };
        }), svcCombo.value());

        var hint = P.ACCOUNT_HINTS[key] || { placeholder: 'Profile link' };
        $('fwLink').placeholder = hint.placeholder;
        onServiceChange();
    }

    function onServiceChange() {
        var id = svcCombo.value();
        var qtys = P.qtysFor(id);
        $('fwMinMax').textContent = qtys.length
            ? 'You can order between ' + qtys[0].toLocaleString() + ' and ' + qtys[qtys.length - 1].toLocaleString() + '.'
            : '';

        var s = P.SERVICES_BY_ID[id];
        roll($('fwSvcDesc'), (s && P.UNIT_DESC[s.unit]) || '');
        // the honest window, plus whether refill covers this specific service
        $('fwTime').textContent = '1\u20136 hours' +
            (s && s.refillEligible ? ' \u00b7 30-day refill' : '');

        // keep the typed amount if this service sells it, else start clean
        var typed = Number(String($('fwQty').value).replace(/[^\d]/g, ''));
        if (!typed || qtys.indexOf(typed) === -1) {
            $('fwQty').value = '';
            $('fwSnap').hidden = true;
        }
        renderChips();
        paint();
    }

    /** "1K", "2.5K", "250" — the chip face; the full number is in its label. */
    function qtyShort(n) {
        if (n >= 1000000) return (n / 1000000).toString().replace(/\.0+$/, '') + 'M';
        if (n >= 1000) return (n / 1000).toString().replace(/\.0+$/, '') + 'K';
        return String(n);
    }

    /* One chip per tier this service actually sells, each with its exact
     * price — tapping one is the same as typing that amount. */
    function renderChips() {
        var box = $('fwChips');
        if (!box) return;
        var id = svcCombo.value();
        var cur = P.Region.data(region).currency;
        box.innerHTML = P.qtysFor(id).map(function (n) {
            var price = P.money(P.localPrice(P.tierUsd(id, n), cur), cur);
            return '<button type="button" class="fw-chip m-press" data-qty="' + n + '" aria-pressed="false"' +
                ' aria-label="' + n.toLocaleString() + ' for ' + price + '">' +
                '<b>' + qtyShort(n) + '</b><small>' + price + '</small></button>';
        }).join('');
    }

    function syncChips(r) {
        var box = $('fwChips');
        if (!box) return;
        var want = r ? r.qty : null;
        box.querySelectorAll('[data-qty]').forEach(function (b) {
            var on = Number(b.dataset.qty) === want;
            if (on === b.classList.contains('is-on')) return;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', String(on));
        });
    }

    /** The desktop summary and the phone bar, both read off the same quote
     *  the in-card total uses — they can never show a different number. */
    var sumKey = null;
    function syncSummary(r, q) {
        var key = catCombo.value();
        var s = P.SERVICES_BY_ID[svcCombo.value()];
        var totalTxt = q ? P.money(q.total, q.currency) : '—';
        var qtyTxt = r ? r.qty.toLocaleString() + ' ' + (s ? s.unit : '') : 'Choose an amount';

        if ($('sumMark')) {
            if (key !== sumKey) { $('sumMark').innerHTML = key ? mark(key) : ''; sumKey = key; }
            $('sumSvc').textContent = (key ? meta(key).name + ' ' : '') + (s ? s.short : '');
            $('sumQty').textContent = qtyTxt;
            $('sumRefill').textContent = s && s.refillEligible ? '30 days' : 'Not included';
            roll($('sumTotal'), totalTxt);
            roll($('sumDeposit'), q ? P.money(P.roundMoney(q.total * 0.5, q.currency), q.currency) : '—');
        }
        if ($('fwBar')) {
            $('fwBarQty').textContent = r ? qtyTxt + ' · ' + meta(key).name : '';
            roll($('fwBarTotal'), totalTxt);
            barReady = !!r;
            updateBar();
        }
    }

    /** The exact tier this order will be placed at, or null. */
    function resolved() {
        var id = svcCombo.value();
        var qtys = P.qtysFor(id);
        var typed = Number(String($('fwQty').value).replace(/[^\d]/g, ''));
        if (!id || !typed || !qtys.length) return null;

        var exact = qtys.indexOf(typed) !== -1;
        var qty = exact ? typed : nearest(qtys, typed);
        return { platform: catCombo.value(), serviceId: id, qty: qty, typed: typed, exact: exact };
    }

    function nearest(list, n) {
        var best = list[0];
        for (var i = 1; i < list.length; i++) {
            if (Math.abs(list[i] - n) < Math.abs(best - n)) best = list[i];
        }
        return best;
    }

    function paint() {
        var r = resolved();
        var snap = $('fwSnap');
        var qtyField = $('fwQtyField');

        syncChips(r);

        if (!r) {
            roll($('fwChargeVal'), '—');
            snap.hidden = true;
            if (qtyField) qtyField.classList.remove('is-bad');
            syncSummary(null, null);
            return;
        }

        if (r.exact) {
            snap.hidden = true;
            if (qtyField) qtyField.classList.remove('is-bad');
        } else {
            var qtys = P.qtysFor(r.serviceId);
            var below = r.typed < qtys[0];
            var above = r.typed > qtys[qtys.length - 1];
            snap.hidden = false;
            snap.classList.toggle('is-danger', below || above);
            if (below) {
                snap.textContent = 'That is below our minimum. Smallest order is ' +
                    r.qty.toLocaleString() + ' — we’ve set it to that.';
            } else if (above) {
                snap.textContent = 'That is above our largest tier. Biggest order is ' +
                    r.qty.toLocaleString() + ' — we’ve set it to that.';
            } else {
                snap.textContent = 'We sell this in set amounts — priced at ' +
                    r.qty.toLocaleString() + '.';
            }
            if (qtyField) {
                var wasBad = qtyField.classList.contains('is-bad');
                var isBad = below || above;
                qtyField.classList.toggle('is-bad', isBad);
                // only shake on the moment it becomes invalid, not on every
                // keystroke while it stays invalid — that would just be noise
                if (isBad && !wasBad) shake(qtyField);
            }
        }

        var q = P.quote([{ platform: r.platform, serviceId: r.serviceId, qty: r.qty }], region, 1);
        roll($('fwChargeVal'), P.money(q.total, q.currency));
        syncSummary(r, q);
    }

    /* ------------------------------------------------------------ search --- */

    function runSearch() {
        var v = $('fwSearch').value.trim();
        var box = $('fwResults');
        if (!v) { box.hidden = true; box.innerHTML = ''; return; }

        var hits = P.searchServices(v).filter(function (s) { return s.sizes && s.sizes.length; });
        box.hidden = false;
        if (!hits.length) {
            box.innerHTML = '<p class="fw-minmax" style="padding:8px 2px">Nothing matches that. ' +
                '<a href="https://wa.me/' + WA + '?text=' +
                encodeURIComponent('Hi 97 World, do you sell: ' + v + '?') +
                '" target="_blank" rel="noopener" style="color:var(--g-acc);font-weight:700">Ask us</a>.</p>';
            return;
        }
        var cur = P.Region.data(region).currency;
        box.innerHTML = hits.slice(0, 8).map(function (s) {
            var from = P.tierUsd(s.id, P.qtysFor(s.id)[0]);
            return '<button type="button" class="fw-res" data-pick="' + s.id + '">' +
                mark(s.platform) +
                '<span>' + meta(s.platform).name + ' ' + s.short + '</span>' +
                '<b>from ' + P.money(P.localPrice(from, cur), cur) + '</b>' +
                '</button>';
        }).join('');
    }

    function pick(serviceId) {
        var s = P.SERVICES_BY_ID[serviceId];
        if (!s) return;
        filter = null;
        renderTiles();
        fillCategories();
        catCombo.setValue(s.platform);
        fillServices();
        svcCombo.setValue(serviceId);
        onServiceChange();
        $('fwSearch').value = '';
        runSearch();
    }

    /* --------------------------------------------------------- validation --- */

    function linkProblem(r, value) {
        var v = value.trim();
        if (!v) {
            return 'Add your ' + meta(r.platform).name +
                ' username or link so we know where to deliver.';
        }
        if (r.platform === 'webtraffic' && v.indexOf('.') === -1) {
            return 'That does not look like a website address. Paste the full URL.';
        }
        if (POST_LEVEL[r.serviceId] && r.platform !== 'webtraffic' &&
            v.indexOf('/') === -1 && v.length < 40) {
            var s = P.SERVICES_BY_ID[r.serviceId];
            return 'This looks like a profile. ' +
                (s ? s.short + ' go' + (/s$/.test(s.short) ? '' : 'es') : 'This') +
                ' to one post — paste the link to the post, reel or track instead.';
        }
        return null;
    }

    /* ------------------------------------------------------------ review --- */

    var pending = null;

    function submit() {
        var r = resolved();
        if (!r) {
            // point at the chips rather than popping a keyboard over them
            var field = $('fwQtyField');
            field.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
            var snap = $('fwSnap');
            snap.hidden = false;
            snap.classList.remove('is-danger');
            snap.textContent = 'Pick an amount to see your price.';
            shake(field);
            return;
        }
        var problem = linkProblem(r, $('fwLink').value);
        if (problem) {
            $('fwLinkField').classList.add('is-bad');
            $('fwLinkErr').hidden = false;
            $('fwLinkErr').textContent = problem;
            $('fwLinkField').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
            return;
        }
        $('fwLinkField').classList.remove('is-bad');
        $('fwLinkErr').hidden = true;

        var q = P.quote([{ platform: r.platform, serviceId: r.serviceId, qty: r.qty }], region, 1);
        // the deposit is rounded once; the balance is whatever is left of
        // the total, so the two always add back up to exactly what's shown
        var deposit = P.roundMoney(q.total * 0.5, q.currency);
        var balance = q.total - deposit;
        pending = {
            kind: 'single', r: r, account: $('fwLink').value.trim(), quote: q,
            total: q.total, currency: q.currency, deposit: deposit, balance: balance
        };
        paintReview();
    }

    /** A combo card is tapped: same review sheet, no navigation, no re-typed
     *  quantity — the two platforms and 10,000-follower quantities are fixed
     *  by the bundle itself. Only the handle is still asked. */
    function openCombo(id) {
        var b = null;
        for (var i = 0; i < P.BUNDLES.length; i++) {
            if (P.BUNDLES[i].id === id) { b = P.BUNDLES[i]; break; }
        }
        if (!b) return;
        var cur = P.Region.data(region).currency;
        var total = P.localPrice(b.usd, cur);
        var deposit = P.roundMoney(total * 0.5, cur);
        var balance = total - deposit;
        pending = {
            kind: 'bundle', bundle: b, account: pending && pending.account || '',
            total: total, currency: cur, deposit: deposit, balance: balance
        };
        paintReview();
    }

    /** Paints revList/revTotal/revDeposit/revBalance for whichever kind of
     *  order is pending, then opens the sheet — the one place either flow
     *  lands before it becomes a WhatsApp message. */
    function paintReview() {
        var cur = pending.currency;

        if (pending.kind === 'bundle') {
            var b = pending.bundle;
            var platforms = BUNDLE_PLATFORMS[b.id] || [];
            $('revList').innerHTML = platforms.map(function (key, i) {
                var f = b.feats[i];
                return '<div class="rev-row"><span class="rev-mark">' + mark(key) + '</span>' +
                    '<span class="rev-copy"><b>' + meta(key).name + '</b>' +
                    '<small>' + (f ? f.text : '') + '</small></span></div>';
            }).join('');
            $('revAccountField').hidden = false;
            $('revAccount').value = pending.account || '';
        } else {
            var r = pending.r, row = pending.quote.lines[0];
            $('revList').innerHTML =
                '<div class="rev-row"><span class="rev-mark">' + mark(r.platform) + '</span>' +
                '<span class="rev-copy"><b>' + meta(r.platform).name + ' ' +
                    (row.service ? row.service.short : '') + '</b>' +
                '<small>' + r.qty.toLocaleString() + ' ' + (row.service ? row.service.unit : '') +
                    ' — ' + pending.account + '</small></span>' +
                '<span class="rev-amt">' + P.money(row.price, cur) + '</span>' +
                '</div>';
            $('revAccountField').hidden = true;
        }

        $('revTotal').textContent = P.money(pending.total, cur);
        $('revDeposit').textContent = P.money(pending.deposit, cur);
        $('revBalance').textContent = P.money(pending.balance, cur);
        $('revSendAmt').textContent = P.money(pending.total, cur);
        $('revErr').hidden = true;
        setStep(1);
        sendReady('Confirm on WhatsApp');
        renderPayment();
        openSheet('revSheet');
    }

    function setStep(n) {
        var steps = $('revSteps');
        if (!steps) return;
        steps.querySelectorAll('li').forEach(function (li, i) {
            li.classList.toggle('is-done', i < n - 1);
            li.classList.toggle('is-on', i === n - 1);
        });
    }

    /* wa.me hands off to the WhatsApp app on phones and the page stays where
     * it was — so the button can't be left disabled on "Opening WhatsApp…",
     * or anyone who comes back to fix a detail is stuck. */
    var sendTimer = null;
    function sendReady(label) {
        window.clearTimeout(sendTimer);
        var b = $('revSend');
        b.disabled = false;
        b.classList.remove('is-busy');
        b.querySelector('.rev-send-label').textContent = label;
    }
    function sendBusy() {
        var b = $('revSend');
        b.disabled = true;
        b.classList.add('is-busy');
        b.querySelector('.rev-send-label').textContent = 'Opening WhatsApp…';
        setStep(2);
        window.clearTimeout(sendTimer);
        sendTimer = window.setTimeout(function () { sendReady('Open WhatsApp again'); }, 4000);
    }
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && $('revSend').disabled) sendReady('Open WhatsApp again');
    });
    window.addEventListener('pageshow', function (e) {
        if (e.persisted && $('revSend').disabled) sendReady('Open WhatsApp again');
    });

    /** The WhatsApp message, built from whichever kind of order is pending —
     *  the two flows share every line except how the package itself reads. */
    function buildMessage(name, phone) {
        var reg = P.Region.data(region);
        var lines = ['*NEW 97 GROWTH ORDER [' + reg.name.toUpperCase() + ']*', ''];

        if (pending.kind === 'bundle') {
            var b = pending.bundle;
            lines.push('*Package:* ' + b.name);
            lines.push('*Includes:* ' + b.feats.map(function (f) { return f.text; }).join(' + '));
            lines.push('*Handle:* ' + pending.account);
        } else {
            var row = pending.quote.lines[0];
            lines.push('*Service:* ' + meta(pending.r.platform).name + ' ' +
                (row.service ? row.service.short : ''));
            lines.push('*Quantity:* ' + pending.r.qty.toLocaleString() + ' ' +
                (row.service ? row.service.unit : ''));
            lines.push('*Link:* ' + pending.account);
        }

        lines.push('*Charge:* ' + P.money(pending.total, pending.currency));
        lines.push('*Pay now (50%):* ' + P.money(pending.deposit, pending.currency));
        lines.push('*Balance on delivery:* ' + P.money(pending.balance, pending.currency));
        if (paymentChoice) lines.push('*Payment method:* ' + paymentChoice);
        lines.push('');
        lines.push('*Name:* ' + name);
        lines.push('*WhatsApp:* ' + phone);
        return lines.join('\n');
    }

    $('revSend').addEventListener('click', function () {
        if (!pending) return;
        var errEl = $('revErr');

        if (pending.kind === 'bundle') {
            var acct = $('revAccount').value.trim();
            if (!acct) {
                $('revAccountField').classList.add('is-bad');
                shake($('revAccountField'));
                errEl.hidden = false;
                errEl.textContent = 'Add your @handle so we know where to deliver.';
                return;
            }
            $('revAccountField').classList.remove('is-bad');
            pending.account = acct;
        }

        var name = $('revName').value.trim();
        var phoneRaw = $('revPhone').value.trim();

        if (name.length < 2) { errEl.hidden = false; errEl.textContent = 'Please add your name.'; return; }
        if (phoneRaw.replace(/\D/g, '').length < 8) {
            errEl.hidden = false; errEl.textContent = 'Add a WhatsApp number we can reach you on.'; return;
        }
        errEl.hidden = true;

        var isBundle = pending.kind === 'bundle';
        var b = isBundle ? pending.bundle : null;
        var row = isBundle ? null : pending.quote.lines[0];
        var phone = window.OrderKit
            ? window.OrderKit.phone(phoneRaw)
            : { clean: phoneRaw, sheet: "'" + phoneRaw };

        try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name, phone: phoneRaw }));
        } catch (e) { /* private mode */ }

        var message = buildMessage(name, phone.clean);

        sendBusy();

        if (window.OrderKit) {
            window.OrderKit.send({
                sheetUrl: SHEET_URL,
                whatsapp: WA,
                message: message,
                sheet: {
                    ClientName: name,
                    Number: phone.sheet,
                    Service: '97 Growth [' + pending.currency + ']',
                    Package: isBundle
                        ? b.name + ' [' + pending.account + ']'
                        : meta(pending.r.platform).name + ' ' + pending.r.qty + ' ' +
                            (row.service ? row.service.short : '') + ' [' + pending.account + ']',
                    Price: String(pending.total),
                    Referrer: isBundle ? 'Combo panel' : 'Order panel'
                },
                worker: {
                    apiBase: WORKER_API,
                    body: {
                        serviceId: isBundle ? null : (pending.r.serviceId || null),
                        bundleId: isBundle ? b.id : null,
                        quantity: isBundle ? null : (pending.r.qty || null),
                        link: pending.account,
                        name: name,
                        phone: phone.clean,
                        region: region,
                        referrer: isBundle ? 'Combo panel' : 'Order panel',
                        payment: paymentChoice,
                        amount: pending.total,
                        currency: pending.currency,
                        deposit: pending.deposit,
                        balance: pending.balance
                    }
                }
            });
        } else {
            window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
        }
    });

    /* -------------------------------------------------------- payment --- */

    var paymentChoice = null;

    function payMeta(label) {
        if (/mtn/i.test(label)) return { icon: 'fas fa-mobile-screen-button', color: '#FFCC08' };
        if (/airtel/i.test(label)) return { icon: 'fas fa-mobile-screen-button', color: '#ED1C24' };
        if (/agent/i.test(label)) return { icon: 'fas fa-handshake', color: null };
        if (/cash/i.test(label)) return { icon: 'fas fa-money-bill-wave', color: null };
        return { icon: 'fas fa-wallet', color: null };
    }

    /** Real options for whichever region is selected — never Airtel/MTN
     *  where mobile money isn't actually how that region pays. */
    function renderPayment() {
        var grid = $('payGrid');
        if (!grid) return;
        var opts = P.Region.data(region).payments || [];
        if (opts.indexOf(paymentChoice) === -1) paymentChoice = opts[0] || null;

        $('payLabel').textContent = opts.length > 1 ? 'How will you pay?' : 'How you’ll pay';
        grid.innerHTML = opts.map(function (label) {
            var m = payMeta(label);
            var p = payParts(label);
            var on = label === paymentChoice;
            return '<button type="button" class="pay-opt m-press' + (on ? ' is-on' : '') + '"' +
                ' data-pay="' + encodeURIComponent(label) + '" aria-pressed="' + on + '">' +
                '<i class="' + m.icon + ' pay-ic"' + (m.color ? ' style="color:' + m.color + '"' : '') + '></i>' +
                '<span class="pay-txt"><b>' + p.name + '</b>' +
                    (p.code ? '<small>Code ' + p.code + '</small>' : '') + '</span>' +
                '<span class="pay-tick"><i class="fas fa-check"></i></span>' +
                '</button>';
        }).join('');
        paintPayCode(false);
    }

    /** "MTN Mobile Money — Code 196514" → { name, code }. Labels without a
     *  code (the agent deposit) come back with code: null. */
    function payParts(label) {
        var m = /^(.*?)\s+—\s+Code\s+(\S+)$/.exec(label || '');
        return m ? { name: m[1], code: m[2] } : { name: label, code: null };
    }

    /* The chosen network's code, big and copyable — it's the number they'll
     * be typing into their phone a minute from now. */
    function paintPayCode(animate) {
        var box = $('payCode');
        if (!box) return;
        var p = paymentChoice ? payParts(paymentChoice) : null;
        if (!p || !p.code) { box.hidden = true; box.innerHTML = ''; return; }
        box.hidden = false;
        box.innerHTML =
            '<span class="pay-code-copy"><small>After confirming, pay the 50% to this ' + p.name + ' code</small>' +
            '<b>' + p.code + '</b></span>' +
            '<button type="button" class="pay-copy m-press" data-code="' + p.code + '">' +
                '<i class="far fa-copy" aria-hidden="true"></i> <span>Copy</span></button>';
        if (animate && !reduceMotion) {
            box.classList.remove('is-swap');
            void box.offsetWidth;
            box.classList.add('is-swap');
        }
    }

    function copyText(text, onDone) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onDone, function () {});
            return;
        }
        var t = document.createElement('textarea');
        t.value = text;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        try { if (document.execCommand('copy')) onDone(); } catch (e) { /* nothing to copy with */ }
        document.body.removeChild(t);
    }

    /* -------------------------------------------------------- proof --- */

    /* Placeholder slots for real, redacted screenshots — no name, number or
     * date invented here. Each <img> quietly removes itself on a 404, so the
     * dashed placeholder keeps showing until a real file lands at that path;
     * dropping a real photo in at these exact paths is the whole update. */
    var PROOF_SLOTS = ['recent-1', 'recent-2', 'recent-3', 'recent-4', 'recent-5', 'recent-6'];

    function proofImg(slug, cls) {
        return '<img class="' + cls + '" src="/IMAGES/proof/' + slug + '.webp" alt=""' +
            ' loading="lazy" onerror="this.remove()">';
    }

    function renderProof() {
        var grid = $('proofGrid');
        if (grid) {
            grid.innerHTML = PROOF_SLOTS.map(function (slug) {
                return '<div class="proof-card"><span class="proof-ph"><i class="fas fa-image"></i></span>' +
                    proofImg(slug, '') + '</div>';
            }).join('');
        }
        var strip = $('revProofImgs');
        if (strip) {
            strip.innerHTML = PROOF_SLOTS.slice(0, 3).map(function (slug) {
                return '<span class="proof-strip-av"><i class="fas fa-image"></i>' +
                    proofImg(slug, '') + '</span>';
            }).join('');
        }
    }

    /* ------------------------------------------------------------ combos ---
     * Which real platforms each bundle touches, for the small mark row at
     * the top of the card. Bundles that reuse a generic feat icon (like
     * fa-user-plus for "5,000 followers") don't carry a brand icon in their
     * own feats, so this is the one place that mapping lives.
     */
    var BUNDLE_PLATFORMS = {
        'fb-ig': ['facebook', 'instagram'],
        'fb-tt': ['facebook', 'tiktok'],
        'ig-tt': ['instagram', 'tiktok']
    };

    function renderCombos() {
        var grid = $('comboGrid');
        if (!grid) return;
        var cur = P.Region.data(region).currency;

        // lead with the flagship bundles, same relative order otherwise
        var ordered = P.BUNDLES.slice().sort(function (a, b) {
            return (b.hero ? 1 : 0) - (a.hero ? 1 : 0);
        });
        var shown = ordered.slice(0, 6);
        var remaining = P.BUNDLES.length - shown.length;

        grid.innerHTML = shown.map(function (b) {
            var price = P.money(P.localPrice(b.usd, cur), cur);
            var was = b.wasUsd ? P.money(P.localPrice(b.wasUsd, cur), cur) : null;
            // real saving, derived from the same two numbers already shown —
            // never a separate, invented percentage
            var pct = b.wasUsd ? Math.round((1 - b.usd / b.wasUsd) * 100) : 0;

            var marks = (BUNDLE_PLATFORMS[b.id] || []).map(function (key) {
                return '<span class="combo-mark">' + mark(key) + '</span>';
            }).join('');

            var feats = b.feats.map(function (f) {
                return '<span class="combo-line' + (f.gold ? ' is-gold' : '') + '">' +
                    '<i class="' + f.icon + '"></i>' + f.text + '</span>';
            }).join('');

            return '<button type="button" data-plan="' + b.id + '" class="combo-item' +
                (b.hero ? ' is-hero' : '') + (b.tag ? ' has-tag' : '') + '">' +
                (b.tag ? '<span class="combo-tag">' + b.tag + '</span>' : '') +
                (marks ? '<span class="combo-marks">' + marks + '</span>' : '') +
                '<span class="combo-item-name">' + b.name + '</span>' +
                '<span class="combo-lines">' + feats + '</span>' +
                '<span class="combo-item-foot">' +
                    '<span class="combo-item-price-wrap">' +
                        '<span class="combo-item-price">' + price + '</span>' +
                        (was ? '<span class="combo-item-was-row">' +
                            '<s class="combo-item-was">' + was + '</s>' +
                            (pct ? '<span class="combo-item-save">Save ' + pct + '%</span>' : '') +
                            '</span>' : '') +
                    '</span>' +
                    '<span class="combo-item-go">Order <i class="fas fa-arrow-right"></i></span>' +
                '</span>' +
                '</button>';
        }).join('') + (remaining > 0
            ? '<a href="/growth/bundle/" class="combo-more">' +
                '<span class="combo-more-ic"><i class="fas fa-layer-group"></i></span>' +
                '<span class="combo-more-copy">' +
                    '<span class="combo-more-title">See all ' + P.BUNDLES.length + ' bundles</span>' +
                    '<span class="combo-more-sub">' + remaining + ' more, across every platform</span>' +
                '</span>' +
                '<span class="combo-more-go">Browse <i class="fas fa-arrow-right"></i></span>' +
                '</a>'
            : '');
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
            fillServices();
            renderCombos();
        });
        $('regionLabel').textContent = P.Region.data(region).currency;
    }

    /* -------------------------------------------------------------- wire --- */

    $('fwPlats').addEventListener('click', function (e) {
        var t = e.target.closest('[data-tile]');
        if (!t) return;
        var v = t.dataset.tile;
        if (v === 'more') { tilesOpen = true; renderTiles(); return; }
        if (v === 'snapchat') {
            haptic();
            window.open('https://wa.me/' + WA + '?text=' +
                encodeURIComponent('Hi 97 World, do you sell Snapchat services? Please send me pricing.'),
                '_blank', 'noopener');
            return;
        }
        filter = v === 'all' ? null : v;
        renderTiles();
        fillCategories();
        haptic();
    });

    $('fwResults').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick]');
        if (b) pick(b.dataset.pick);
    });

    $('comboGrid').addEventListener('click', function (e) {
        var card = e.target.closest('[data-plan]');
        if (!card) return;
        haptic();
        openCombo(card.dataset.plan);
    });

    var payGrid = $('payGrid');
    if (payGrid) {
        payGrid.addEventListener('click', function (e) {
            var b = e.target.closest('[data-pay]');
            if (!b) return;
            paymentChoice = decodeURIComponent(b.dataset.pay);
            payGrid.querySelectorAll('[data-pay]').forEach(function (x) {
                var on = x === b;
                x.classList.toggle('is-on', on);
                x.setAttribute('aria-pressed', String(on));
            });
            paintPayCode(true);
            haptic();
        });
    }

    var payCodeBox = $('payCode');
    if (payCodeBox) {
        payCodeBox.addEventListener('click', function (e) {
            var b = e.target.closest('[data-code]');
            if (!b) return;
            copyText(b.dataset.code, function () {
                b.classList.add('is-done');
                b.querySelector('i').className = 'fas fa-check';
                b.querySelector('span').textContent = 'Copied';
                haptic();
                window.setTimeout(function () {
                    b.classList.remove('is-done');
                    b.querySelector('i').className = 'far fa-copy';
                    b.querySelector('span').textContent = 'Copy';
                }, 1600);
            });
        });
    }

    // quick-amount chips: tapping one is exactly typing that tier
    $('fwChips').addEventListener('click', function (e) {
        var b = e.target.closest('[data-qty]');
        if (!b) return;
        $('fwQty').value = Number(b.dataset.qty).toLocaleString();
        paint();
        haptic();
    });

    // the summary and the phone bar both lead to the same review
    $('sumSubmit').addEventListener('click', submit);
    $('fwBarBtn').addEventListener('click', submit);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            submitInView = entries[0].isIntersecting;
            updateBar();
        }).observe($('fwSubmit'));
    }

    var comboMenuBtn = $('comboMenuBtn');
    if (comboMenuBtn) {
        comboMenuBtn.addEventListener('click', function () {
            closeSheet('menuSheet');
            window.setTimeout(function () {
                var el = $('combosSec');
                if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            }, reduceMotion ? 0 : 300);
        });
    }

    var revProofStrip = $('revProofStrip');
    if (revProofStrip) {
        revProofStrip.addEventListener('click', function () {
            closeSheet('revSheet');
            window.setTimeout(function () {
                var el = $('proofSec');
                if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            }, reduceMotion ? 0 : 300);
        });
    }

    $('fwQty').addEventListener('input', paint);
    $('fwSearch').addEventListener('input', runSearch);
    $('fwLink').addEventListener('input', function () {
        $('fwLinkErr').hidden = true;
        $('fwLinkField').classList.remove('is-bad');
    });
    $('fwSubmit').addEventListener('click', submit);
    $('fwQty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });

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

    renderTiles();
    fillCategories();
    renderCombos();
    renderProof();

    try {
        var savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
        if (savedProfile) {
            if (savedProfile.name) $('revName').value = savedProfile.name;
            if (savedProfile.phone) $('revPhone').value = savedProfile.phone;
        }
    } catch (e) { /* private mode */ }

    // Ask where they're ordering from on the first visit only, same as the
    // order pages' own gate — popping this up on every single load (even
    // with a region already saved) read as the page hanging then a sheet
    // seizing the screen, not as a helpful prompt. Still reachable any time
    // from the menu, and the page never waits on it either way — pricing
    // already defaults to the saved region (or UGX) the moment it paints.
    if (regionBtn && !P.Region.get()) {
        window.setTimeout(function () { openSheet('regionSheet'); }, 260);
    }

})(window, document);
