/**
 * 97 GROWTH — the buying interface
 *
 * One state object, one render pass. The page is the product: pick where you
 * want to grow, pick what you want, see the exact price, continue. Combo is a
 * pricing mode rather than a product — select three or more platforms and the
 * whole order comes down by a published rate.
 *
 * Every price shown comes from assets/pricing.js, which holds the real
 * published ladder. Quantities the price list does not sell are never offered
 * and never invented: the stepper walks real tiers, and a quantity we cannot
 * price simply is not selectable.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    if (!P || !document.getElementById('platGrid')) return;

    var WA = '256762193386';
    var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec';

    var PACKS = [
        { id: 'start', name: 'Start', qty: 1000 },
        { id: 'grow', name: 'Grow', qty: 5000, flag: 'Most popular' },
        { id: 'scale', name: 'Scale', qty: 10000 }
    ];

    /* Services delivered to a specific post/track rather than to a profile.
     * Used to tell someone they have pasted the wrong kind of link. */
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

    /* ------------------------------------------------------------ state --- */

    var S = {
        region: P.Region.get() || 'UG',
        platforms: [],        // selected platform keys, in tap order
        goal: null,           // 'followers' | 'engagement' | 'full' | 'custom' | a serviceId (single platform)
        mix: {},              // platformKey -> [{ serviceId, qty }]
        accounts: {},         // platformKey -> string
        errors: {},           // platformKey -> message
        submitted: false
    };

    // last combo rate rendered, so we only celebrate an actual improvement
    var lastRate = 0;

    function meta(key) { return P.PLAT_META[key] || { name: key }; }

    function mark(key, cls) {
        var m = meta(key);
        return m.logo
            ? '<img src="' + m.logo + '" alt="">'
            : '<i class="' + m.icon + (cls ? ' ' + cls : '') + '"></i>';
    }

    /** Every order line, flattened. */
    function lines() {
        var out = [];
        for (var i = 0; i < S.platforms.length; i++) {
            var key = S.platforms[i];
            var rows = S.mix[key] || [];
            for (var j = 0; j < rows.length; j++) {
                out.push({ platform: key, serviceId: rows[j].serviceId, qty: rows[j].qty });
            }
        }
        return out;
    }

    function priced() {
        return lines().filter(function (l) { return l.qty != null; });
    }

    function quote() {
        return P.quote(priced(), S.region, S.platforms.length);
    }

    /** Quantities every current line can actually be sold at. */
    function commonQtys() {
        var ls = lines();
        if (!ls.length) return [];
        var set = null;
        for (var i = 0; i < ls.length; i++) {
            var q = P.qtysFor(ls[i].serviceId);
            if (set === null) { set = q.slice(); continue; }
            set = set.filter(function (n) { return q.indexOf(n) !== -1; });
        }
        return (set || []).sort(function (a, b) { return a - b; });
    }

    function currentQty() {
        var ls = lines();
        if (!ls.length) return null;
        var first = ls[0].qty;
        for (var i = 1; i < ls.length; i++) if (ls[i].qty !== first) return null;
        return first;
    }

    function setQtyAll(n) {
        for (var key in S.mix) {
            if (!Object.prototype.hasOwnProperty.call(S.mix, key)) continue;
            for (var i = 0; i < S.mix[key].length; i++) {
                var row = S.mix[key][i];
                var avail = P.qtysFor(row.serviceId);
                row.qty = avail.indexOf(n) !== -1 ? n : nearest(avail, n);
            }
        }
    }

    function nearest(list, n) {
        if (!list.length) return null;
        var best = list[0];
        for (var i = 1; i < list.length; i++) {
            if (Math.abs(list[i] - n) < Math.abs(best - n)) best = list[i];
        }
        return best;
    }

    function fmtQty(n) {
        if (n == null) return '—';
        if (n >= 1000000) return (n / 1000000) + 'M';
        if (n >= 1000) { var k = n / 1000; return (k % 1 === 0 ? k : k.toFixed(1)) + 'K'; }
        return String(n);
    }

    /* --------------------------------------------------- mix composition --- */

    /** Rebuild every platform's lines from the chosen goal. */
    function applyGoal() {
        var keepQty = currentQty();
        var next = {};
        for (var i = 0; i < S.platforms.length; i++) {
            var key = S.platforms[i];
            var roles = P.PLATFORM_ROLES[key] || {};
            var ids = [];

            if (S.goal === 'followers' && roles.followers) ids = [roles.followers];
            else if (S.goal === 'engagement' && roles.engagement) ids = [roles.engagement];
            else if (S.goal === 'full') {
                if (roles.followers) ids.push(roles.followers);
                if (roles.engagement) ids.push(roles.engagement);
            } else if (S.goal === 'custom') {
                // keep whatever is already set, else fall back to the first service
                var existing = S.mix[key];
                if (existing && existing.length) { next[key] = existing; continue; }
                ids = [(P.PLATFORMS[key].services || [])[0]];
            } else if (S.platforms.length === 1 && S.goal) {
                ids = [S.goal];   // single-platform mode: the goal *is* the service
            }

            if (!ids.length) ids = [(P.PLATFORMS[key].services || [])[0]];

            next[key] = ids.filter(Boolean).map(function (id) {
                var avail = P.qtysFor(id);
                return { serviceId: id, qty: keepQty != null && avail.indexOf(keepQty) !== -1 ? keepQty : null };
            });
        }
        S.mix = next;
    }

    /* -------------------------------------------------------- rendering --- */

    function render() {
        renderPlatforms();
        renderStrip();
        renderCombo();
        renderGoal();
        renderPacks();
        renderQty();
        renderMix();
        renderAccounts();
        renderPrice();
        renderDock();
    }

    function platTile(key) {
        var on = S.platforms.indexOf(key) !== -1;
        return '<button type="button" class="plat-tile' + (on ? ' is-on' : '') + '"' +
            ' data-plat="' + key + '" aria-pressed="' + on + '">' +
            '<span class="plat-check"><i class="fas fa-check"></i></span>' +
            mark(key) + '<span>' + meta(key).name + '</span>' +
            '</button>';
    }

    function renderPlatforms() {
        $('platGrid').innerHTML =
            P.GROWTH_PRIMARY.map(platTile).join('') +
            '<button type="button" class="plat-tile" id="moreTile">' +
                '<i class="fas fa-ellipsis"></i><span>More</span>' +
            '</button>';

        var sheet = $('moreGrid');
        if (sheet) sheet.innerHTML = P.GROWTH_MORE.map(platTile).join('');

        var n = S.platforms.length;
        var nudge = $('platNudge');
        var next = P.nextComboTier(n);
        if (n === 0 || !next || !comboPossible()) {
            nudge.hidden = true;
        } else {
            nudge.hidden = false;
            var need = next.min - n;
            nudge.innerHTML = n < 3
                ? n + ' platform' + (n > 1 ? 's' : '') + ' selected. Add ' + need +
                  ' more to unlock <b>Combo pricing</b>.'
                : 'Add ' + need + ' more platform' + (need > 1 ? 's' : '') +
                  ' for an even better rate — <b>' + P.ratePct(next.rate) + '% off</b>.';
        }
    }

    /** Combo needs three platforms that can all actually join one. */
    function comboPossible() {
        return S.platforms.every(P.comboEligible) || S.platforms.length < 3;
    }

    function renderStrip() {
        var wrap = $('platStripIn');
        if (!wrap) return;
        var keys = S.platforms.slice();
        P.GROWTH_PRIMARY.forEach(function (k) { if (keys.indexOf(k) === -1) keys.push(k); });
        wrap.innerHTML = keys.slice(0, 9).map(function (key) {
            var on = S.platforms.indexOf(key) !== -1;
            return '<button type="button" class="strip-chip' + (on ? ' is-on' : '') + '" data-plat="' + key + '">' +
                mark(key) + '<span>' + meta(key).name + '</span>' +
                (on ? '<i class="fas fa-check"></i>' : '') +
                '</button>';
        }).join('') + '<button type="button" class="strip-chip" id="stripMore"><i class="fas fa-plus"></i></button>';
    }

    function renderCombo() {
        var card = $('comboCard');
        var n = S.platforms.length;
        var isCombo = n >= 3 && comboPossible();
        card.classList.toggle('is-on', isCombo);

        $('comboMeter').innerHTML = [0, 1, 2].map(function (i) {
            return '<span class="combo-pip' + (i < Math.min(n, 3) ? ' is-on' : '') + '"></span>';
        }).join('');

        var state = $('comboState');
        if (isCombo) {
            state.hidden = false;
            state.innerHTML = '<i class="fas fa-circle-check"></i> Combo unlocked · ' +
                P.ratePct(P.comboRate(n)) + '% off ' + n + ' platforms';
        } else {
            state.hidden = true;
        }
    }

    function renderGoal() {
        var sec = $('goalSec');
        if (!S.platforms.length) { sec.hidden = true; return; }
        sec.hidden = false;

        var single = S.platforms.length === 1;
        $('goalHead').textContent = single
            ? 'What do you want to grow?'
            : 'What do you want across these platforms?';

        var wrap = $('goalWrap');

        if (single) {
            var key = S.platforms[0];
            var ids = P.PLATFORMS[key].services || [];
            wrap.className = 'goal-row';
            wrap.innerHTML = ids.map(function (id) {
                var s = P.SERVICES_BY_ID[id];
                if (!s) return '';
                var on = S.goal === id;
                return '<button type="button" class="goal-chip' + (on ? ' is-on' : '') + '"' +
                    ' data-goal="' + id + '" aria-pressed="' + on + '">' + s.short + '</button>';
            }).join('');
            return;
        }

        var opts = [
            { id: 'followers', name: 'Followers', sub: 'Grow follower counts across the platforms you picked.' },
            { id: 'engagement', name: 'Engagement', sub: 'Likes, views and interaction.' },
            { id: 'full', name: 'Full Growth', sub: 'Followers and engagement together.' },
            { id: 'custom', name: 'Custom', sub: 'Choose separately for each platform.' }
        ].filter(function (o) {
            if (o.id === 'custom') return true;
            return S.platforms.every(function (k) {
                var r = P.PLATFORM_ROLES[k] || {};
                if (o.id === 'followers') return !!r.followers;
                if (o.id === 'engagement') return !!r.engagement;
                return !!(r.followers && r.engagement);
            });
        });

        wrap.className = 'goal-cards';
        wrap.innerHTML = opts.map(function (o) {
            var on = S.goal === o.id;
            return '<button type="button" class="goal-card' + (on ? ' is-on' : '') + '"' +
                ' data-goal="' + o.id + '" aria-pressed="' + on + '">' +
                '<span class="goal-card-copy"><b>' + o.name + '</b><small>' + o.sub + '</small></span>' +
                '<span class="goal-card-tick"><i class="fas fa-check"></i></span>' +
                '</button>';
        }).join('');
    }

    function renderPacks() {
        var sec = $('packSec');
        if (!S.goal || S.goal === 'custom' || S.platforms.length < 2) { sec.hidden = true; return; }

        var common = commonQtys();
        var usable = PACKS.filter(function (p) { return common.indexOf(p.qty) !== -1; });
        if (usable.length < 2) { sec.hidden = true; return; }

        sec.hidden = false;
        var cur = currentQty();

        $('packGrid').innerHTML = usable.map(function (pk) {
            var q = P.quote(lines().map(function (l) {
                return { platform: l.platform, serviceId: l.serviceId, qty: pk.qty };
            }), S.region, S.platforms.length);
            var on = cur === pk.qty;
            var rows = S.platforms.map(function (key) {
                var each = (S.mix[key] || []).map(function (r) {
                    var s = P.SERVICES_BY_ID[r.serviceId];
                    return fmtQty(pk.qty) + ' ' + (s ? s.unit : '');
                }).join(' + ');
                return '<span class="pack-line">' + mark(key) + meta(key).name + ' &middot; ' + each + '</span>';
            }).join('');
            return '<button type="button" class="pack-card' + (on ? ' is-on' : '') + (pk.flag ? ' has-flag' : '') + '"' +
                ' data-pack="' + pk.qty + '" aria-pressed="' + on + '">' +
                (pk.flag ? '<span class="pack-flag">' + pk.flag + '</span>' : '') +
                '<span class="pack-top"><span class="pack-name">' + pk.name + '</span>' +
                '<span class="pack-price">' + P.money(q.total, q.currency) + '</span></span>' +
                '<span class="pack-headline">' + fmtQty(pk.qty) + ' on each platform</span>' +
                '<span class="pack-lines">' + rows + '</span>' +
                '</button>';
        }).join('');
    }

    function renderQty() {
        var sec = $('qtySec');
        if (!S.goal || S.goal === 'custom') { sec.hidden = true; return; }

        var common = commonQtys();
        if (!common.length) {
            sec.hidden = false;
            $('qtyRow').innerHTML = '';
            $('qtyStepper').hidden = true;
            $('qtyNote').textContent =
                'These platforms do not share a common quantity — switch to Custom above to set each one separately.';
            return;
        }

        sec.hidden = false;
        $('qtyStepper').hidden = false;
        var cur = currentQty();

        $('qtyRow').innerHTML = common.map(function (n) {
            var on = cur === n;
            return '<button type="button" class="qty-chip' + (on ? ' is-on' : '') + '"' +
                ' data-qty="' + n + '" aria-pressed="' + on + '">' + fmtQty(n) + '</button>';
        }).join('');

        var input = $('qtyInput');
        input.value = cur == null ? '' : cur.toLocaleString();
        var idx = common.indexOf(cur);
        $('qtyMinus').disabled = idx <= 0;
        $('qtyPlus').disabled = idx === -1 ? false : idx >= common.length - 1;

        $('qtyNote').textContent = cur == null
            ? 'Pick an amount to see your price.'
            : 'Amounts follow our published tiers — the arrows step between them.';
    }

    function renderMix() {
        var sec = $('mixSec');
        if (S.goal !== 'custom' || !S.platforms.length) { sec.hidden = true; return; }
        sec.hidden = false;

        $('mixList').innerHTML = S.platforms.map(function (key) {
            return (S.mix[key] || []).map(function (row, i) {
                var s = P.SERVICES_BY_ID[row.serviceId];
                return '<div class="mix-row">' +
                    '<span class="mix-mark">' + mark(key) + '</span>' +
                    '<span class="mix-copy"><b>' + meta(key).name + '</b>' +
                        '<small>' + (s ? s.short : '') + '</small></span>' +
                    '<span class="mix-amt"><b>' + (row.qty == null ? 'Choose' : fmtQty(row.qty)) + '</b>' +
                        '<button type="button" class="mix-edit" data-mix="' + key + ':' + i + '">Edit</button>' +
                    '</span>' +
                    '</div>';
            }).join('');
        }).join('');
    }

    function renderAccounts() {
        var sec = $('acctSec');
        if (!priced().length) { sec.hidden = true; return; }
        sec.hidden = false;

        $('acctList').innerHTML = S.platforms.map(function (key) {
            var hint = P.ACCOUNT_HINTS[key] || { label: meta(key).name, placeholder: 'Profile link' };
            var err = S.errors[key];
            return '<div class="acct-field' + (err ? ' is-bad' : '') + '" data-acct-field="' + key + '">' +
                '<label for="acct-' + key + '">' + hint.label + '</label>' +
                '<div class="acct-box">' + mark(key) +
                    '<input type="text" id="acct-' + key + '" data-acct="' + key + '"' +
                    ' placeholder="' + hint.placeholder + '" autocomplete="off" spellcheck="false"' +
                    ' autocapitalize="none" value="' + (S.accounts[key] || '').replace(/"/g, '&quot;') + '">' +
                '</div>' +
                (err ? '<p class="acct-err">' + err + '</p>' : '') +
                '</div>';
        }).join('');
    }

    function renderPrice() {
        var sec = $('priceSec');
        var q = quote();
        if (!q.lines.length) { sec.hidden = true; return; }
        sec.hidden = false;

        $('priceSub').textContent = P.money(q.subtotal, q.currency);
        var saveRow = $('priceSaveRow');
        if (q.isCombo && q.discount > 0) {
            saveRow.hidden = false;
            $('priceSave').textContent = '− ' + P.money(q.discount, q.currency);
            $('priceSaveLabel').textContent = 'Combo saving (' + q.comboPct + '%)';
        } else {
            saveRow.hidden = true;
        }
        rollTo($('priceTotal'), P.money(q.total, q.currency));

        // Crossing into a better combo rate is the moment worth marking, and
        // the price is where the reward actually lands — so the price card
        // gets the one-shot ring rather than the whole page getting confetti.
        if (q.comboRate !== lastRate) {
            if (q.comboRate > lastRate && window.Motion) {
                window.Motion.flash(sec.querySelector('.price-card'));
            }
            lastRate = q.comboRate;
        }
    }

    function renderDock() {
        var dock = $('gDock');
        var q = quote();
        var ready = q.lines.length > 0 && q.complete;
        dock.classList.toggle('is-on', ready);
        if (!ready) return;

        rollTo($('dockPrice'), P.money(q.total, q.currency));
        $('dockMeta').textContent =
            q.platformCount + ' platform' + (q.platformCount > 1 ? 's' : '') +
            ' · ' + fmtQty(q.totalQty) + ' total';

        var missing = S.platforms.filter(function (k) { return !(S.accounts[k] || '').trim(); });
        $('dockCta').disabled = false;
        $('dockMissing').hidden = !(S.submitted && missing.length);
        if (missing.length && S.submitted) {
            $('dockMissing').textContent = 'Add your ' +
                missing.map(function (k) { return meta(k).name; }).join(', ') + ' details above.';
        }
    }

    /** Animate the figure, never the bar around it. */
    function rollTo(el, text) {
        if (window.Motion) window.Motion.roll(el, text);
        else if (el) el.textContent = text;
    }

    /* ------------------------------------------------------ interactions --- */

    function togglePlatform(key) {
        var i = S.platforms.indexOf(key);
        if (i === -1) S.platforms.push(key);
        else S.platforms.splice(i, 1);

        if (!S.platforms.length) { S.goal = null; S.mix = {}; }
        else if (S.platforms.length === 1) {
            // single-platform mode goals are service ids; a multi goal no longer fits
            if (['followers', 'engagement', 'full', 'custom'].indexOf(S.goal) !== -1) S.goal = null;
            if (S.goal) applyGoal(); else S.mix = {};
        } else {
            // leaving single mode: a service-id goal no longer fits either
            if (S.goal && ['followers', 'engagement', 'full', 'custom'].indexOf(S.goal) === -1) S.goal = null;
            if (S.goal) applyGoal(); else S.mix = {};
        }
        haptic();
        render();
    }

    function haptic() { if (navigator.vibrate && !reduceMotion) navigator.vibrate(9); }

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

        var tile = t.closest('.plat-tile[data-plat], .strip-chip[data-plat]');
        if (tile) { togglePlatform(tile.dataset.plat); return; }

        if (t.closest('#moreTile') || t.closest('#stripMore')) { openSheet('moreSheet'); return; }

        var goal = t.closest('[data-goal]');
        if (goal) {
            S.goal = goal.dataset.goal;
            applyGoal();
            haptic();
            render();
            return;
        }

        var pack = t.closest('[data-pack]');
        if (pack) { setQtyAll(Number(pack.dataset.pack)); haptic(); render(); return; }

        var qty = t.closest('[data-qty]');
        if (qty) { setQtyAll(Number(qty.dataset.qty)); haptic(); render(); return; }

        var edit = t.closest('[data-mix]');
        if (edit) { openMixSheet(edit.dataset.mix); return; }

        var closer = t.closest('[data-close]');
        if (closer) { closeSheet(closer.dataset.close); return; }

        if (t.classList && t.classList.contains('sheet')) { closeSheet(t.id); return; }

        var res = t.closest('[data-pick]');
        if (res) { pickService(res.dataset.pick); return; }
    });

    /* ---- quantity stepper: walks real tiers, never invents one between --- */

    $('qtyMinus').addEventListener('click', function () {
        var common = commonQtys();
        var i = common.indexOf(currentQty());
        if (i > 0) { setQtyAll(common[i - 1]); haptic(); render(); }
    });
    $('qtyPlus').addEventListener('click', function () {
        var common = commonQtys();
        var cur = currentQty();
        var i = common.indexOf(cur);
        if (i === -1 && common.length) { setQtyAll(common[0]); haptic(); render(); return; }
        if (i < common.length - 1) { setQtyAll(common[i + 1]); haptic(); render(); }
    });
    $('qtyInput').addEventListener('change', function () {
        var common = commonQtys();
        var typed = Number(String(this.value).replace(/[^\d]/g, ''));
        if (!typed || !common.length) { render(); return; }
        var snap = nearest(common, typed);
        setQtyAll(snap);
        render();
        if (snap !== typed) {
            $('qtyNote').textContent = 'We sell this in set amounts — rounded to ' +
                snap.toLocaleString() + '.';
        }
    });

    /* ---------------------------------------------------- custom mix ----- */

    function openMixSheet(ref) {
        var parts = ref.split(':');
        var key = parts[0];
        var idx = Number(parts[1]);
        var row = (S.mix[key] || [])[idx];
        if (!row) return;

        $('mixSheetTitle').textContent = meta(key).name;
        var ids = P.PLATFORMS[key].services || [];

        $('mixSheetBody').innerHTML =
            '<p class="g-sec-head" style="margin-bottom:10px"><b>Service</b></p>' +
            '<div class="goal-row" id="mixSvc">' +
                ids.map(function (id) {
                    var s = P.SERVICES_BY_ID[id];
                    if (!s) return '';
                    return '<button type="button" class="goal-chip' + (row.serviceId === id ? ' is-on' : '') + '"' +
                        ' data-mixsvc="' + id + '">' + s.short + '</button>';
                }).join('') +
            '</div>' +
            '<p class="g-sec-head" style="margin:16px 0 10px"><b>Amount</b></p>' +
            '<div class="qty-row" id="mixQty">' +
                P.qtysFor(row.serviceId).map(function (n) {
                    return '<button type="button" class="qty-chip' + (row.qty === n ? ' is-on' : '') + '"' +
                        ' data-mixqty="' + n + '">' + fmtQty(n) + '</button>';
                }).join('') +
            '</div>';

        $('mixSheetBody').onclick = function (e) {
            var svc = e.target.closest('[data-mixsvc]');
            if (svc) {
                row.serviceId = svc.dataset.mixsvc;
                var avail = P.qtysFor(row.serviceId);
                if (avail.indexOf(row.qty) === -1) row.qty = null;
                openMixSheet(ref);
                render();
                return;
            }
            var q = e.target.closest('[data-mixqty]');
            if (q) {
                row.qty = Number(q.dataset.mixqty);
                openMixSheet(ref);
                render();
                haptic();
            }
        };

        openSheet('mixSheet');
    }

    /* ------------------------------------------------------------ search --- */

    var search = $('gSearch');
    var results = $('gResults');
    var clearBtn = $('gSearchClear');

    function runSearch() {
        var q = search.value.trim();
        clearBtn.hidden = !q;
        if (!q) { results.hidden = true; results.innerHTML = ''; return; }

        var hits = P.searchServices(q).filter(function (s) { return s.sizes && s.sizes.length; });
        results.hidden = false;
        if (!hits.length) {
            results.innerHTML = '<p class="g-empty">Nothing matches “' +
                q.replace(/</g, '&lt;') + '”. <a href="https://wa.me/' + WA + '?text=' +
                encodeURIComponent('Hi 97 World, do you sell: ' + q + '?') +
                '" target="_blank" rel="noopener">Ask us</a></p>';
            return;
        }
        results.innerHTML = hits.slice(0, 6).map(function (s) {
            var from = P.tierUsd(s.id, P.qtysFor(s.id)[0]);
            var cur = P.Region.data(S.region).currency;
            return '<button type="button" class="g-result" data-pick="' + s.id + '">' +
                mark(s.platform, 'g-result-ic') +
                '<span class="g-result-copy"><b>' + meta(s.platform).name + ' ' + s.short.toLowerCase() + '</b>' +
                '<small>from ' + P.money(P.localPrice(from, cur), cur) + '</small></span>' +
                '<span class="g-result-go">Choose</span>' +
                '</button>';
        }).join('');
    }

    /** Jump straight to a service — used by search and the popular row. */
    function pickService(serviceId, qty) {
        var s = P.SERVICES_BY_ID[serviceId];
        if (!s) return;
        S.platforms = [s.platform];
        S.goal = serviceId;
        applyGoal();
        if (qty != null) setQtyAll(qty);
        search.value = '';
        runSearch();
        render();
        var target = $('goalSec');
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    search.addEventListener('input', runSearch);
    clearBtn.addEventListener('click', function () { search.value = ''; runSearch(); search.focus(); });

    document.querySelectorAll('[data-pop]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var parts = btn.dataset.pop.split(':');
            pickService(parts[0], parts[1] ? Number(parts[1]) : null);
        });
    });

    /** Popular cards carry no hardcoded price — they read the same ladder. */
    function paintPopular() {
        var cur = P.Region.data(S.region).currency;
        document.querySelectorAll('[data-pop-price]').forEach(function (el) {
            var parts = el.dataset.popPrice.split(':');
            var usd = P.tierUsd(parts[0], Number(parts[1]));
            el.textContent = usd == null ? '—' : P.money(P.localPrice(usd, cur), cur);
        });
    }

    /* ---------------------------------------------------------- accounts --- */

    document.addEventListener('input', function (e) {
        var input = e.target.closest('[data-acct]');
        if (!input) return;
        S.accounts[input.dataset.acct] = input.value;
        delete S.errors[input.dataset.acct];
        renderDock();
    });

    /** Human-readable checks only — we never claim to have inspected the account. */
    function validate() {
        S.errors = {};
        var ok = true;
        S.platforms.forEach(function (key) {
            var v = (S.accounts[key] || '').trim();
            if (!v) {
                S.errors[key] = 'Add your ' + meta(key).name + ' username or link so we know where to deliver.';
                ok = false;
                return;
            }
            if (key === 'webtraffic' && v.indexOf('.') === -1) {
                S.errors[key] = 'That does not look like a website address. Paste the full URL.';
                ok = false;
                return;
            }
            var postLevel = (S.mix[key] || []).some(function (r) { return POST_LEVEL[r.serviceId]; });
            if (postLevel && key !== 'webtraffic' && v.indexOf('/') === -1 && v.length < 40) {
                var svc = P.SERVICES_BY_ID[(S.mix[key] || [])[0].serviceId];
                S.errors[key] = 'This looks like a profile. ' +
                    (svc ? svc.short + ' go' + (/s$/.test(svc.short) ? '' : 'es') : 'This') +
                    ' to one post — paste the link to the post, reel or track instead.';
                ok = false;
            }
        });
        return ok;
    }

    /* ------------------------------------------------------------ review --- */

    $('dockCta').addEventListener('click', function () {
        S.submitted = true;
        var okAccounts = validate();
        render();
        if (!okAccounts) {
            var bad = document.querySelector('.acct-field.is-bad');
            if (bad) bad.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
            return;
        }
        openReview();
    });

    function openReview() {
        var q = quote();
        $('revList').innerHTML = q.lines.map(function (l) {
            return '<div class="rev-row">' + mark(l.platform, 'rev-ic') +
                '<span class="rev-copy"><b>' + meta(l.platform).name + '</b>' +
                '<small>' + l.qty.toLocaleString() + ' ' + (l.service ? l.service.unit : '') + '</small></span>' +
                '<span class="rev-amt">' + P.money(l.price, q.currency) + '</span>' +
                '</div>';
        }).join('');

        $('revSub').textContent = P.money(q.subtotal, q.currency);
        var sr = $('revSaveRow');
        if (q.isCombo && q.discount > 0) {
            sr.hidden = false;
            $('revSave').textContent = '− ' + P.money(q.discount, q.currency);
        } else { sr.hidden = true; }
        $('revTotal').textContent = P.money(q.total, q.currency);
        openSheet('revSheet');
    }

    $('revSend').addEventListener('click', function () {
        var name = $('revName').value.trim();
        var phoneRaw = $('revPhone').value.trim();
        var err = $('revErr');

        if (name.length < 2) { err.hidden = false; err.textContent = 'Please add your name.'; return; }
        if (phoneRaw.replace(/\D/g, '').length < 8) {
            err.hidden = false; err.textContent = 'Add a WhatsApp number we can reach you on.'; return;
        }
        err.hidden = true;

        var q = quote();
        var region = P.Region.data(S.region);
        var phone = window.OrderKit ? window.OrderKit.phone(phoneRaw) : { clean: phoneRaw, sheet: "'" + phoneRaw };

        var itemLines = q.lines.map(function (l) {
            return '• ' + meta(l.platform).name + ' — ' + l.qty.toLocaleString() + ' ' +
                (l.service ? l.service.unit : '') + ' (' + P.money(l.price, q.currency) + ')' +
                '\n   ' + (S.accounts[l.platform] || '');
        }).join('\n');

        var message = '*NEW 97 GROWTH ORDER [' + region.name.toUpperCase() + ']*\n\n' +
            itemLines + '\n\n' +
            '*Subtotal:* ' + P.money(q.subtotal, q.currency) + '\n' +
            (q.isCombo ? '*Combo saving (' + q.comboPct + '%):* − ' +
                P.money(q.discount, q.currency) + '\n' : '') +
            '*Total:* ' + P.money(q.total, q.currency) + '\n\n' +
            '*Name:* ' + name + '\n' +
            '*WhatsApp:* ' + phone.clean;

        var pkg = q.lines.map(function (l) {
            return meta(l.platform).name + ' ' + l.qty + ' ' + (l.service ? l.service.short : '') +
                ' [' + (S.accounts[l.platform] || '') + ']';
        }).join(' | ');

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
                    Service: '97 Growth [' + region.currency + ']' + (q.isCombo ? ' COMBO x' + q.platformCount : ''),
                    Package: pkg,
                    Price: String(q.total),
                    Referrer: 'Growth builder'
                }
            });
        } else {
            window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
        }
    });

    /* ------------------------------------------------------ quick order --- */

    /**
     * The panel-shaped shortcut: category, service, link, quantity, charge.
     *
     * It is a second *entrance*, not a second checkout — submitting writes
     * into the same S the guided flow uses and opens the same review sheet,
     * so there is exactly one order pipeline, one WhatsApp message and one
     * Sheets row no matter which way somebody came in.
     *
     * Quantity is a select of real tiers rather than a free number box: the
     * price list is tiered, so a typed 7,500 has no price we could quote
     * without inventing one.
     */
    var QO = {
        el: {},

        init: function () {
            QO.el.cat = $('qoCat');
            QO.el.svc = $('qoSvc');
            QO.el.qty = $('qoQty');
            QO.el.link = $('qoLink');
            QO.el.charge = $('qoCharge');
            if (!QO.el.cat) return;

            var all = P.GROWTH_PRIMARY.concat(P.GROWTH_MORE);
            QO.el.cat.innerHTML = all.map(function (key) {
                return '<option value="' + key + '">' + meta(key).name + '</option>';
            }).join('');

            QO.el.cat.addEventListener('change', function () { QO.fillServices(); });
            QO.el.svc.addEventListener('change', function () { QO.fillQtys(); });
            QO.el.qty.addEventListener('change', function () { QO.paint(); });
            QO.el.link.addEventListener('input', function () {
                $('qoLinkErr').hidden = true;
                $('qoLinkField').classList.remove('is-bad');
            });
            $('qoSubmit').addEventListener('click', QO.submit);

            QO.fillServices();
        },

        fillServices: function () {
            var key = QO.el.cat.value;
            // only services with a real ladder can be quoted here
            var ids = (P.PLATFORMS[key].services || []).filter(function (id) {
                var s = P.SERVICES_BY_ID[id];
                return s && s.sizes && s.sizes.length;
            });
            QO.el.svc.innerHTML = ids.map(function (id) {
                return '<option value="' + id + '">' + P.SERVICES_BY_ID[id].short + '</option>';
            }).join('');

            var hint = P.ACCOUNT_HINTS[key] || { placeholder: 'Profile link' };
            QO.el.link.placeholder = hint.placeholder;
            QO.fillQtys();
        },

        fillQtys: function () {
            var id = QO.el.svc.value;
            var cur = P.Region.data(S.region).currency;
            QO.el.qty.innerHTML = P.qtysFor(id).map(function (n) {
                var usd = P.tierUsd(id, n);
                return '<option value="' + n + '">' + n.toLocaleString() + ' — ' +
                    P.money(P.localPrice(usd, cur), cur) + '</option>';
            }).join('');
            QO.paint();
        },

        /** The single line this panel is describing, or null. */
        line: function () {
            var key = QO.el.cat.value;
            var id = QO.el.svc.value;
            var n = Number(QO.el.qty.value);
            if (!key || !id || !n) return null;
            return { platform: key, serviceId: id, qty: n };
        },

        paint: function () {
            var l = QO.line();
            if (!l) { rollTo(QO.el.charge, '—'); return; }
            var q = P.quote([l], S.region, 1);
            rollTo(QO.el.charge, P.money(q.total, q.currency));
        },

        submit: function () {
            var l = QO.line();
            if (!l) return;

            var v = QO.el.link.value.trim();
            if (!v) {
                $('qoLinkField').classList.add('is-bad');
                $('qoLinkErr').hidden = false;
                $('qoLinkErr').textContent = 'Add your ' + meta(l.platform).name +
                    ' username or link so we know where to deliver.';
                return;
            }

            // hand the whole thing to the shared state, then the shared review
            S.platforms = [l.platform];
            S.goal = l.serviceId;
            S.mix = {};
            S.mix[l.platform] = [{ serviceId: l.serviceId, qty: l.qty }];
            S.accounts[l.platform] = v;
            S.errors = {};

            if (!validate()) {
                var msg = S.errors[l.platform];
                if (msg) {
                    $('qoLinkField').classList.add('is-bad');
                    $('qoLinkErr').hidden = false;
                    $('qoLinkErr').textContent = msg;
                }
                return;
            }

            // deliberately no render() — the guided DOM is hidden in this
            // mode, and re-rendering it here would un-hide its sections
            // behind the panel. Switching back to Guided renders it fresh.
            openReview();
        }
    };

    /* Mode switch. Guided stays the default — the panel is the shortcut for
       someone who already knows what they are buying. */
    var GUIDED_SECTIONS = ['comboSec', 'platSec', 'goalSec', 'packSec', 'qtySec', 'mixSec', 'acctSec', 'priceSec'];

    function setMode(mode) {
        var quick = mode === 'quick';
        document.querySelectorAll('.mode-tab').forEach(function (t) {
            var on = t.dataset.mode === mode;
            t.classList.toggle('is-on', on);
            t.setAttribute('aria-pressed', String(on));
        });
        $('quickPanel').hidden = !quick;
        GUIDED_SECTIONS.forEach(function (id) {
            var el = $(id);
            if (!el) return;
            if (quick) { el.dataset.modeHidden = '1'; el.hidden = true; }
            else if (el.dataset.modeHidden) { delete el.dataset.modeHidden; el.hidden = false; }
        });
        // the panel carries its own CTA, so the dock would be a second one
        $('gDock').classList.toggle('is-off', quick);
        if (!quick) render();
        else QO.paint();
        if (window.Motion) window.Motion.swap(quick ? $('quickPanel') : $('platSec'));
    }

    document.querySelectorAll('.mode-tab').forEach(function (t) {
        t.addEventListener('click', function () { setMode(t.dataset.mode); haptic(); });
    });

    QO.init();

    /* -------------------------------------------------------- scroll fx --- */

    var header = $('gHeader');
    var strip = $('platStrip');
    var platSec = $('platSec');
    var ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            var y = window.scrollY || window.pageYOffset;
            header.classList.toggle('is-stuck', y > 12);
            if (platSec && strip) {
                var bottom = platSec.getBoundingClientRect().bottom;
                strip.classList.toggle('is-on', bottom < 60 && S.platforms.length > 0);
            }
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Scroll reveal comes from assets/motion.js — the shared engine also
       picks up the nodes this file renders at runtime. */

    /* --------------------------------------------------------- region ----- */

    var regionBtn = $('regionBtn');
    if (regionBtn) {
        regionBtn.addEventListener('click', function () {
            closeSheet('menuSheet');
            openSheet('regionSheet');
        });
        $('regionGrid').innerHTML = Object.keys(P.REGIONS).map(function (code) {
            var r = P.REGIONS[code];
            return '<button type="button" class="goal-card' + (S.region === code ? ' is-on' : '') + '"' +
                ' data-region="' + code + '">' +
                '<span class="goal-card-copy"><b>' + r.flag + ' ' + r.name + '</b><small>' + r.blurb + '</small></span>' +
                '<span class="goal-card-tick"><i class="fas fa-check"></i></span></button>';
        }).join('');
        $('regionGrid').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-region]');
            if (!btn) return;
            S.region = btn.dataset.region;
            P.Region.set(S.region);
            $('regionLabel').textContent = P.Region.data(S.region).currency;
            closeSheet('regionSheet');
            renderRegionGrid();
            paintPopular();
            render();
        });
        $('regionLabel').textContent = P.Region.data(S.region).currency;
    }

    function renderRegionGrid() {
        $('regionGrid').querySelectorAll('[data-region]').forEach(function (b) {
            b.classList.toggle('is-on', b.dataset.region === S.region);
        });
    }

    /* ------------------------------------------------------------- boot --- */

    render();
    paintPopular();
    onScroll();

})(window, document);
