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
 * the same review sheet, WhatsApp message and Sheets row as the order pages.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    if (!P || !document.getElementById('fwCat')) return;

    var WA = '256762193386';
    var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec';

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

    /* Tiles up front, the rest behind the + — never a platform we don't sell. */
    var TILES = ['instagram', 'tiktok', 'facebook', 'youtube', 'spotify', 'telegram', 'x', 'whatsapp', 'linkedin'];
    var TILES_MORE = ['audiomack', 'soundcloud', 'webtraffic'];

    var $ = function (id) { return document.getElementById(id); };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var region = P.Region.get() || 'UG';
    var filter = null;        // selected platform tile, null = All
    var tilesOpen = false;

    function meta(key) { return P.PLAT_META[key] || { name: key }; }

    function mark(key) {
        var m = meta(key);
        return m.logo ? '<img src="' + m.logo + '" alt="">' : '<i class="' + m.icon + '"></i>';
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
            ? 'Min: ' + qtys[0].toLocaleString() + ' - Max: ' + qtys[qtys.length - 1].toLocaleString()
            : '';

        var s = P.SERVICES_BY_ID[id];
        // the honest window, plus whether refill covers this specific service
        $('fwTime').textContent = '1\u20136 hours' +
            (s && s.refillEligible ? ' \u00b7 30-day refill' : '');

        // keep the typed amount if this service sells it, else start clean
        var typed = Number(String($('fwQty').value).replace(/[^\d]/g, ''));
        if (!typed || qtys.indexOf(typed) === -1) {
            $('fwQty').value = '';
            $('fwSnap').hidden = true;
        }
        paint();
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
        if (!r) {
            roll($('fwChargeVal'), '—');
            snap.hidden = true;
            return;
        }
        if (r.exact) {
            snap.hidden = true;
        } else {
            snap.hidden = false;
            snap.textContent = 'We sell this in set amounts — priced at ' +
                r.qty.toLocaleString() + '.';
        }
        var q = P.quote([{ platform: r.platform, serviceId: r.serviceId, qty: r.qty }], region, 1);
        roll($('fwChargeVal'), P.money(q.total, q.currency));
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
            $('fwQty').focus();
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
        var row = q.lines[0];
        pending = { r: r, account: $('fwLink').value.trim(), quote: q };

        $('revList').innerHTML =
            '<div class="rev-row">' + mark(r.platform) +
            '<span class="rev-copy"><b>' + meta(r.platform).name + ' ' +
                (row.service ? row.service.short : '') + '</b>' +
            '<small>' + r.qty.toLocaleString() + ' ' + (row.service ? row.service.unit : '') +
                ' — ' + pending.account + '</small></span>' +
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
        var reg = P.Region.data(region);
        var phone = window.OrderKit
            ? window.OrderKit.phone(phoneRaw)
            : { clean: phoneRaw, sheet: "'" + phoneRaw };

        var message = '*NEW 97 GROWTH ORDER [' + reg.name.toUpperCase() + ']*\n\n' +
            '*Service:* ' + meta(pending.r.platform).name + ' ' +
                (row.service ? row.service.short : '') + '\n' +
            '*Quantity:* ' + pending.r.qty.toLocaleString() + ' ' +
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
                    Package: meta(pending.r.platform).name + ' ' + pending.r.qty + ' ' +
                        (row.service ? row.service.short : '') + ' [' + pending.account + ']',
                    Price: String(q.total),
                    Referrer: 'Order panel'
                }
            });
        } else {
            window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
        }
    });

    /* ------------------------------------------------------------ combos --- */

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
        filter = v === 'all' ? null : v;
        renderTiles();
        fillCategories();
        haptic();
    });

    $('fwResults').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick]');
        if (b) pick(b.dataset.pick);
    });

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

})(window, document);
