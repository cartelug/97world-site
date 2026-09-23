/**
 * 97 MARKETPLACE — the order panel
 *
 * The same one-page panel as /growth/: product tiles, search, category,
 * product, plan, the exact price, then a review sheet that hands off to
 * WhatsApp. Shared machinery (dropdowns, sheets, the phone bar, payment
 * codes, the WhatsApp button) is assets/panel.js.
 *
 * What is sold here differs from growth in three ways, and the panel says
 * so rather than smoothing it over:
 *
 *   1. Subscriptions are priced for Uganda (UGX) and South Sudan (USD)
 *      only, straight from K97Pricing.SUBSCRIPTIONS. They're paid in full,
 *      not 50/50, and the login is sent after payment.
 *   2. Gift cards, keys and top-ups (K97Pricing.DIGITAL_PRODUCTS) have
 *      Uganda prices only, and stock and region are confirmed before any
 *      money is taken.
 *   3. Anything without a real price for the chosen region — or a tier the
 *      price list marks as needing a stock check — becomes a request for a
 *      quote. Nothing here is converted or guessed.
 *
 * Product copy, categories and search terms come from subs/marketplace-data.js.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    var K = window.K97Panel;
    var DATA = window.K97MarketplaceData;
    if (!P || !K || !DATA || !document.getElementById('fwCat')) return;

    var WA = '256762193386';
    var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec';
    // same additive, fire-and-forget order record every order page uses
    var WORKER_API = 'https://the97-orders.carteluganda.workers.dev';
    var PROFILE_KEY = 'k97_checkout_profile';

    var $ = function (id) { return document.getElementById(id); };
    var reduceMotion = K.reduceMotion;
    var haptic = K.haptic, roll = K.roll, shake = K.shake;
    var openSheet = K.openSheet, closeSheet = K.closeSheet;

    var CATS = [
        { key: 'watch',  name: 'Entertainment', icon: 'fas fa-film' },
        { key: 'create', name: 'Create',        icon: 'fas fa-palette' },
        { key: 'ai',     name: 'AI',            icon: 'fas fa-wand-magic-sparkles' },
        { key: 'work',   name: 'Work',          icon: 'fas fa-briefcase' },
        { key: 'learn',  name: 'Learn',         icon: 'fas fa-graduation-cap' },
        { key: 'gaming', name: 'Gaming',        icon: 'fas fa-gamepad' },
        { key: 'gifts',  name: 'Gift cards',    icon: 'fas fa-gift' }
    ];
    var TILE_COUNT = 8;

    /* Brand colours that disappear on this page's light tiles are darkened
     * for legibility — a readability call, not a claim about the brand. */
    var INK = { 'capcut-pro': '#111111', 'apple-tv-plus': '#111111' };

    /* ---------------------------------------------------------- products --- */

    var PRODUCTS = [];
    var BY_ID = {};

    DATA.forEach(function (d, index) {
        var sub = P.SUBSCRIPTIONS[d.id];
        var dig = P.DIGITAL_PRODUCTS[d.id];
        if (!sub && !dig) return;

        var p = {
            id: d.id,
            name: d.name,
            cat: d.primaryCategory,
            desc: d.description,
            search: [d.name, d.label].concat(d.aliases || [], d.keywords || [], d.intents || []).join(' ').toLowerCase(),
            score: (d.popularity || 0) + (d.manualBoost || 0),
            index: index,
            kind: sub ? 'sub' : 'digital',
            brand: INK[d.id] || (sub ? sub.brand : dig.brand) || '#3D3838',
            notice: dig ? dig.notice || null : null,
            fulfilment: sub ? 'Login sent on WhatsApp after payment' : dig.fulfilment + ' on WhatsApp',
            tiers: sub
                ? sub.tiers.map(function (t) {
                    return {
                        id: String(t.months), face: t.months + ' mo', name: t.months + ' months',
                        months: t.months, ugx: t.ugx, usd: t.usd,
                        tag: t.tag ? 'Recommended' : null, orderable: true
                    };
                })
                : dig.tiers.map(function (t) {
                    return {
                        id: t.id, face: t.name, name: t.name, months: null, ugx: t.ugx, usd: t.usd,
                        tag: t.orderable ? t.tag : 'Checked first', orderable: t.orderable
                    };
                })
        };
        p.needs = accountDetail(p, dig);
        PRODUCTS.push(p);
        BY_ID[p.id] = p;
    });

    /* What we need from the customer to deliver it. Subscriptions need
     * nothing — we send the login. Top-ups need the Player ID; codes and
     * keys have to match the account's country. Always optional here: it
     * can equally be sent on WhatsApp, and asking twice costs orders. */
    function accountDetail(p, dig) {
        if (p.kind === 'sub') return null;
        if (/player-id/i.test(dig.fulfilment)) {
            return { label: 'Player ID', key: 'Player ID', placeholder: 'Player ID (and Server ID if the game has one)',
                hint: 'Optional — you can also send it on WhatsApp. We never need your password.' };
        }
        if (!dig.tiers.length) {
            return { label: 'What do you need?', key: 'Request', placeholder: 'e.g. the amount, term or app you want',
                hint: 'Optional — tell us here or on WhatsApp and we’ll quote it.' };
        }
        return { label: 'Account country', key: 'Account country', placeholder: 'e.g. Uganda, United States',
            hint: 'Optional — codes must match your account’s country. We check before you pay.' };
    }

    function mark(p) {
        var svg = window.K97Brandmarks ? window.K97Brandmarks.render(p.id) : '';
        return '<span class="pm" style="color:' + p.brand + '">' + svg + '</span>';
    }

    function catOf(key) {
        for (var i = 0; i < CATS.length; i++) if (CATS[i].key === key) return CATS[i];
        return CATS[0];
    }

    /** The real price for a tier in the chosen region, or null. */
    function priceOf(tier) {
        if (region === 'UG' && tier.ugx != null) return { amount: tier.ugx, currency: 'UGX' };
        if (region === 'SS' && tier.usd != null) return { amount: tier.usd, currency: 'USD' };
        return null;
    }
    function sellable(tier) { return !!(tier && tier.orderable && priceOf(tier)); }
    function fmt(pr) { return P.money(pr.amount, pr.currency); }

    function fromText(p) {
        var best = null;
        p.tiers.forEach(function (t) {
            if (!sellable(t)) return;
            var pr = priceOf(t);
            if (!best || pr.amount < best.amount) best = pr;
        });
        return best ? 'from ' + fmt(best) : 'Quoted';
    }

    /* ------------------------------------------------------------- state --- */

    var region = P.Region.get() || 'UG';
    var tilesOpen = false;
    var tierId = null;
    var pending = null;

    function product() { return BY_ID[svcCombo.value()] || PRODUCTS[0]; }
    function tier() {
        var p = product();
        for (var i = 0; i < p.tiers.length; i++) if (p.tiers[i].id === tierId) return p.tiers[i];
        return null;
    }

    /* A product with nothing sellable in this region is a quote request as
     * a whole; a product with sellable tiers only becomes one when the
     * customer picks a tier the price list says must be checked first. */
    function isQuote() {
        var p = product();
        var t = tier();
        if (!p.tiers.some(sellable)) return true;
        return !!(t && !sellable(t));
    }

    document.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('#menuBtn')) openSheet('menuSheet');
    });

    var bar = K.Bar({ bar: $('fwBar'), btn: $('fwBarBtn'), watch: $('fwSubmit'), onGo: submit });
    var payment = K.Payment({
        grid: $('payGrid'), code: $('payCode'), label: $('payLabel'),
        codeLead: function (name) {
            return pending && pending.p.kind === 'digital'
                ? 'Once we confirm stock, pay to this ' + name + ' code'
                : 'After confirming, pay the full amount to this ' + name + ' code';
        }
    });
    var send = K.SendButton($('revSend'));
    function setStep(n) { K.setStep($('revSteps'), n); }

    /* ------------------------------------------------------------- combos --- */

    var catCombo = K.Combo('fwCat', 'fwCatLabel', 'Search categories…', function () {
        fillProducts(null);
        haptic();
    });
    var svcCombo = K.Combo('fwSvc', 'fwSvcLabel', 'Search products…', function () {
        tierId = null;
        onProductChange();
        haptic();
    });

    function fillCategories(keep) {
        catCombo.setItems(CATS.filter(function (c) {
            return PRODUCTS.some(function (p) { return p.cat === c.key; });
        }).map(function (c) {
            return { value: c.key, label: c.name, icon: '<i class="' + c.icon + '"></i>' };
        }), keep || catCombo.value());
    }

    function fillProducts(keep) {
        var cat = catCombo.value();
        svcCombo.setItems(PRODUCTS.filter(function (p) { return p.cat === cat; })
            .sort(function (a, b) { return b.score - a.score || a.index - b.index; })
            .map(function (p) { return { value: p.id, label: p.name, icon: mark(p), meta: fromText(p) }; }), keep);
        if (!keep) tierId = null;
        onProductChange();
    }

    /** Select a product from anywhere — a tile, a search hit, a 12-month pick. */
    function pick(id, withTier) {
        var p = BY_ID[id];
        if (!p) return;
        fillCategories(p.cat);
        catCombo.setValue(p.cat);
        fillProducts(p.id);
        svcCombo.setValue(p.id);
        tierId = withTier || null;
        onProductChange();
    }

    /* ------------------------------------------------------------- tiles --- */

    function tileOrder() {
        return PRODUCTS.slice().sort(function (a, b) {
            var sa = a.tiers.some(sellable) ? 1 : 0, sb = b.tiers.some(sellable) ? 1 : 0;
            return sb - sa || b.score - a.score || a.index - b.index;
        });
    }

    function renderTiles() {
        var list = tileOrder();
        var shown = tilesOpen ? list : list.slice(0, TILE_COUNT);
        var cur = svcCombo.value();
        var html = shown.map(function (p) {
            var on = p.id === cur;
            return '<button type="button" class="fw-tile' + (on ? ' is-on' : '') + '" data-tile="' + p.id + '"' +
                ' aria-label="' + p.name + '" aria-pressed="' + on + '">' + mark(p) + '</button>';
        }).join('');
        if (!tilesOpen && list.length > TILE_COUNT) {
            html += '<button type="button" class="fw-tile" data-tile="more" aria-label="All ' + list.length + ' products">' +
                '<i class="fas fa-plus"></i></button>';
        }
        $('fwPlats').innerHTML = html;
    }

    /* -------------------------------------------------------------- form --- */

    var shownId = null;
    function onProductChange() {
        var p = product();
        // a Player ID typed for one game means nothing to the next product
        if (p.id !== shownId) { $('fwLink').value = ''; shownId = p.id; }
        roll($('fwSvcDesc'), p.desc || '');
        var notice = $('fwNotice');
        notice.hidden = !p.notice;
        notice.textContent = p.notice || '';

        var link = $('fwLinkField');
        link.hidden = !p.needs;
        if (p.needs) {
            $('fwLinkLabel').textContent = p.needs.label;
            $('fwLink').placeholder = p.needs.placeholder;
            $('fwLinkHint').textContent = p.needs.hint;
        }
        $('fwTime').textContent = p.fulfilment;
        $('fwSnap').hidden = true;
        renderChips();
        renderTiles();
        paint();
    }

    function renderChips() {
        var p = product();
        var box = $('fwChips');
        var quoteBox = $('fwQuote');
        var anySellable = p.tiers.some(sellable);

        if (!anySellable) {
            box.innerHTML = '';
            quoteBox.hidden = false;
            quoteBox.innerHTML = '<i class="fas fa-comments" aria-hidden="true"></i><span>' + quoteReason(p) + '</span>';
            return;
        }
        quoteBox.hidden = true;
        box.classList.toggle('has-tags', p.tiers.some(function (t) { return t.tag; }));
        box.innerHTML = p.tiers.map(function (t) {
            var pr = priceOf(t);
            var check = !t.orderable;
            var price = pr ? fmt(pr) : 'Quoted';
            return '<button type="button" class="fw-chip m-press' + (check ? ' is-check' : '') + '"' +
                ' data-tier="' + t.id + '" aria-pressed="false"' +
                ' aria-label="' + t.name + ', ' + (check ? 'price confirmed first' : price) + '">' +
                (t.tag ? '<span class="fw-chip-tag">' + t.tag + '</span>' : '') +
                '<b>' + t.face + '</b><small>' + price + '</small></button>';
        }).join('');
    }

    function quoteReason(p) {
        if (!p.tiers.length) return 'We quote this one on request — tell us what you need and we’ll confirm availability and price on WhatsApp.';
        if (p.kind === 'sub') return 'We haven’t priced ' + p.name + ' for ' + P.Region.data(region).name + ' yet — ask us on WhatsApp and we’ll quote it.';
        if (region !== 'UG') return p.name + ' is priced for Uganda only for now — ask us on WhatsApp and we’ll quote it for ' + P.Region.data(region).name + '.';
        return 'Every package here needs a stock check first — ask us on WhatsApp and we’ll confirm what’s available and the price.';
    }

    function syncChips() {
        $('fwChips').querySelectorAll('[data-tier]').forEach(function (b) {
            var on = b.dataset.tier === tierId;
            if (on === b.classList.contains('is-on')) return;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', String(on));
        });
    }

    /** Price, summary and phone bar — all from the same tier and region. */
    function paint() {
        var p = product();
        var t = tier();
        var quote = isQuote();
        var pr = t && !quote ? priceOf(t) : null;
        var cta = quote ? 'Ask on WhatsApp' : 'Review order';

        syncChips();
        $('fwMinMax').textContent = perMonth(t, pr);
        roll($('fwChargeVal'), pr ? fmt(pr) : (quote ? 'Quoted first' : '—'));
        $('fwSubmitLabel').textContent = cta;
        $('sumSubmitLabel').textContent = cta;
        $('fwBarLabel').textContent = quote ? 'Ask us' : 'Review order';

        if ($('sumMark').dataset.id !== p.id) { $('sumMark').innerHTML = mark(p); $('sumMark').dataset.id = p.id; }
        $('sumSvc').textContent = p.name;
        $('sumQty').textContent = t ? t.name : (quote ? 'Quoted on request' : 'Choose a plan');
        $('sumDelivery').textContent = p.kind === 'sub' ? 'Login on WhatsApp' : p.fulfilment.replace(/ on WhatsApp$/, '');
        $('sumRenew').textContent = p.kind === 'sub' ? 'None — pay once' : 'One-off';
        $('sumNowLabel').textContent = p.kind === 'sub' ? 'Pay in full' : 'Paid after stock check';
        $('sumPromise').textContent = p.kind === 'sub' ? 'Replaced free if access stops' : 'Stock and region checked before you pay';
        roll($('sumTotal'), pr ? fmt(pr) : (quote ? 'Quoted' : '—'));
        roll($('sumDeposit'), pr ? fmt(pr) : '—');

        $('fwBarQty').textContent = p.name + (t ? ' · ' + t.name : '');
        roll($('fwBarTotal'), pr ? fmt(pr) : 'Quoted first');
        bar.setReady(!!pr || (quote && (!!t || !p.tiers.some(sellable))));
    }

    /** "≈ 20,750 UGX a month" for a subscription term — the same rounding
     *  the order pages use, so the two never disagree. */
    function perMonth(t, pr) {
        if (!t || !pr) return '';
        if (!t.months) return '';
        var each = pr.currency === 'USD'
            ? Math.round((pr.amount / t.months) * 100) / 100
            : Math.round(pr.amount / t.months / 50) * 50;
        return '≈ ' + P.money(each, pr.currency) + ' a month · paid once, no renewal';
    }

    /* ------------------------------------------------------------ search --- */

    function runSearch() {
        var v = $('fwSearch').value.trim().toLowerCase();
        var box = $('fwResults');
        if (!v) { box.hidden = true; box.innerHTML = ''; return; }
        var words = v.split(/\s+/);
        var hits = PRODUCTS.filter(function (p) {
            return words.every(function (w) { return p.search.indexOf(w) !== -1; });
        }).sort(function (a, b) { return b.score - a.score; });

        box.hidden = false;
        if (!hits.length) {
            box.innerHTML = '<p class="fw-minmax" style="padding:8px 2px">Nothing matches that. ' +
                '<a href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Hi 97 World, do you sell: ' + v + '?') +
                '" target="_blank" rel="noopener" style="color:var(--g-acc);font-weight:700">Ask us</a>.</p>';
            return;
        }
        box.innerHTML = hits.slice(0, 8).map(function (p) {
            return '<button type="button" class="fw-res" data-pick="' + p.id + '">' + mark(p) +
                '<span>' + p.name + '</span><b>' + fromText(p) + '</b></button>';
        }).join('');
    }

    /* --------------------------------------------------------- 12-month picks
     * Every subscription's own Recommended tier (the price list's "12 months
     * is the primary package to push"), priced for this region. Tapping one
     * goes straight to review — same as a combo card on /growth/. */
    function renderPicks() {
        var grid = $('picksGrid');
        var picks = PRODUCTS.filter(function (p) { return p.kind === 'sub'; })
            .map(function (p) {
                var t = p.tiers.filter(function (x) { return x.tag === 'Recommended'; })[0];
                return t && sellable(t) ? { p: p, t: t, pr: priceOf(t) } : null;
            })
            .filter(Boolean)
            .sort(function (a, b) { return b.p.score - a.p.score || a.p.index - b.p.index; })
            .slice(0, 6);

        $('picksSec').hidden = !picks.length;
        $('picksMenuBtn').hidden = !picks.length;
        grid.innerHTML = picks.map(function (x) {
            return '<button type="button" class="combo-item" data-pick-plan="' + x.p.id + '" data-pick-tier="' + x.t.id + '">' +
                '<span class="combo-marks"><span class="combo-mark">' + mark(x.p) + '</span></span>' +
                '<span class="combo-item-name">' + x.p.name + '</span>' +
                '<span class="combo-lines">' +
                    '<span class="combo-line is-gold"><i class="fas fa-calendar-check"></i>' + x.t.name + ' of access</span>' +
                    '<span class="combo-line"><i class="fas fa-coins"></i>' + perMonth(x.t, x.pr).split(' · ')[0] + '</span>' +
                '</span>' +
                '<span class="combo-item-foot">' +
                    '<span class="combo-item-price-wrap"><span class="combo-item-price">' + fmt(x.pr) + '</span></span>' +
                    '<span class="combo-item-go">Order <i class="fas fa-arrow-right"></i></span>' +
                '</span>' +
                '</button>';
        }).join('');
    }

    /* ------------------------------------------------------------ review --- */

    function submit() {
        var p = product();
        var t = tier();
        var quote = isQuote();

        if (!quote && !t) {
            // point at the plans rather than letting the tap do nothing
            var field = $('fwQtyField');
            field.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
            var snap = $('fwSnap');
            snap.hidden = false;
            snap.classList.remove('is-danger');
            snap.textContent = 'Pick a plan to see your price.';
            shake(field);
            return;
        }

        pending = {
            p: p, t: t, quote: quote,
            price: quote ? null : priceOf(t),
            detail: p.needs ? $('fwLink').value.trim() : ''
        };
        paintReview();
    }

    function paintReview() {
        var p = pending.p, t = pending.t, pr = pending.price;

        $('revTitle').textContent = pending.quote ? 'Ask for a quote' : 'Your order';
        $('revList').innerHTML =
            '<div class="rev-row"><span class="rev-mark">' + mark(p) + '</span>' +
            '<span class="rev-copy"><b>' + p.name + '</b>' +
            '<small>' + (t ? t.name : 'Quoted on request') + (pending.detail ? ' — ' + pending.detail : '') + '</small></span>' +
            (pr ? '<span class="rev-amt">' + fmt(pr) + '</span>' : '') +
            '</div>';

        $('revPrice').hidden = !pr;
        $('payField').hidden = !pr;
        $('revShotNote').hidden = !pr;
        var q = $('revQuote');
        q.hidden = !!pr;
        q.innerHTML = pr ? '' : '<i class="fas fa-comments" aria-hidden="true"></i><span>' +
            (t ? t.name + ' needs a stock check first' : 'This one is quoted on request') +
            ' — we’ll confirm availability and the price on WhatsApp before anything is paid.</span>';

        if (pr) {
            $('revTotal').textContent = fmt(pr);
            $('revNow').textContent = fmt(pr);
            $('revNowLabel').textContent = p.kind === 'sub' ? 'Pay in full' : 'Pay after stock check';
            $('revThenLabel').textContent = p.kind === 'sub' ? 'Login sent' : 'Delivered';
            $('revThen').textContent = 'On WhatsApp';
            $('revSendAmt').textContent = fmt(pr);
            payment.render(P.Region.data(region).payments);
        } else {
            $('revSendAmt').textContent = '';
        }

        $('revStep3').textContent = pr ? 'Pay & screenshot' : 'Quote & pay';
        $('revErr').hidden = true;
        setStep(1);
        send.ready(pr ? 'Confirm on WhatsApp' : 'Ask on WhatsApp');
        openSheet('revSheet');
    }

    function buildMessage(name, phone) {
        var p = pending.p, t = pending.t, pr = pending.price;
        var reg = P.Region.data(region);
        var lines;

        if (!pr) {
            lines = ['*97 MARKETPLACE REQUEST [' + reg.name.toUpperCase() + ']*', '',
                '*Product:* ' + p.name];
            if (t) lines.push('*Package:* ' + t.name);
            if (pending.detail) lines.push('*' + (p.needs ? p.needs.key : 'Detail') + ':* ' + pending.detail);
            lines.push('', 'Please confirm availability and the price.');
        } else {
            lines = ['*NEW 97 MARKETPLACE ORDER [' + reg.name.toUpperCase() + ']*', '',
                '*Product:* ' + p.name,
                '*Plan:* ' + t.name,
                '*Price:* ' + fmt(pr),
                '*Pay:* ' + (p.kind === 'sub' ? 'In full' : 'After stock and region check')];
            if (payment.value()) lines.push('*Payment method:* ' + payment.value());
            if (pending.detail) lines.push('*' + p.needs.key + ':* ' + pending.detail);
            if (p.kind === 'digital') lines.push('', 'Please confirm stock and region.');
        }
        lines.push('', '*Name:* ' + name, '*WhatsApp:* ' + phone);
        return lines.join('\n');
    }

    $('revSend').addEventListener('click', function () {
        if (!pending) return;
        var errEl = $('revErr');
        var name = $('revName').value.trim();
        var phoneRaw = $('revPhone').value.trim();

        if (name.length < 2) { errEl.hidden = false; errEl.textContent = 'Please add your name.'; return; }
        if (phoneRaw.replace(/\D/g, '').length < 8) {
            errEl.hidden = false; errEl.textContent = 'Add a WhatsApp number we can reach you on.'; return;
        }
        errEl.hidden = true;

        var phone = window.OrderKit ? window.OrderKit.phone(phoneRaw) : { clean: phoneRaw, sheet: "'" + phoneRaw };
        try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name, phone: phoneRaw })); } catch (e) { /* private mode */ }

        var message = buildMessage(name, phone.clean);
        var p = pending.p, t = pending.t, pr = pending.price;
        send.busy();
        setStep(2);

        // a quote request has no price to record — it's a question, not an order
        if (!pr || !window.OrderKit) {
            window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
            return;
        }
        window.OrderKit.send({
            sheetUrl: SHEET_URL,
            whatsapp: WA,
            message: message,
            sheet: {
                ClientName: name,
                Number: phone.sheet,
                Service: p.name + ' [' + pr.currency + ']',
                Package: t.name + (pending.detail ? ' [' + pending.detail + ']' : '') + ' [Pay: ' + payment.value() + ']',
                Price: String(pr.amount),
                Referrer: 'Marketplace panel'
            },
            worker: {
                apiBase: WORKER_API,
                body: {
                    serviceId: p.id,
                    bundleId: null,
                    quantity: t.months || null,
                    link: pending.detail || p.name,
                    name: name,
                    phone: phone.clean,
                    region: region,
                    referrer: 'Marketplace panel',
                    payment: payment.value(),
                    amount: pr.amount,
                    currency: pr.currency,
                    deposit: pr.amount,
                    balance: 0
                }
            }
        });
    });

    /* ------------------------------------------------------------ region --- */

    $('regionBtn').addEventListener('click', function () {
        closeSheet('menuSheet');
        openSheet('regionSheet');
    });
    $('regionGrid').innerHTML = Object.keys(P.REGIONS).map(function (code) {
        var r = P.REGIONS[code];
        return '<button type="button" class="goal-card' + (region === code ? ' is-on' : '') + '" data-region="' + code + '">' +
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
        fillProducts(svcCombo.value());
        renderPicks();
        runSearch();
    });
    $('regionLabel').textContent = P.Region.data(region).currency;

    /* -------------------------------------------------------------- wire --- */

    $('fwPlats').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tile]');
        if (!b) return;
        if (b.dataset.tile === 'more') { tilesOpen = true; renderTiles(); return; }
        pick(b.dataset.tile);
        haptic();
    });
    $('fwResults').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick]');
        if (!b) return;
        pick(b.dataset.pick);
        $('fwSearch').value = '';
        runSearch();
    });
    $('fwChips').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tier]');
        if (!b) return;
        tierId = b.dataset.tier;
        $('fwSnap').hidden = true;
        paint();
        haptic();
    });
    $('picksGrid').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick-plan]');
        if (!b) return;
        haptic();
        pick(b.dataset.pickPlan, b.dataset.pickTier);
        submit();
    });
    $('picksMenuBtn').addEventListener('click', function () {
        closeSheet('menuSheet');
        window.setTimeout(function () {
            $('picksSec').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }, reduceMotion ? 0 : 300);
    });
    $('fwSearch').addEventListener('input', runSearch);
    $('fwSubmit').addEventListener('click', submit);
    $('sumSubmit').addEventListener('click', submit);

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

    /* -------------------------------------------------------------- boot --- */

    var first = tileOrder()[0];
    fillCategories(first.cat);
    catCombo.setValue(first.cat);
    fillProducts(first.id);
    renderPicks();

    // a link like /subs/?product=canva-pro lands on that product
    var wanted = new URL(window.location.href).searchParams.get('product');
    if (wanted && BY_ID[wanted]) pick(wanted);

    try {
        var saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
        if (saved) {
            if (saved.name) $('revName').value = saved.name;
            if (saved.phone) $('revPhone').value = saved.phone;
        }
    } catch (e) { /* private mode */ }

    // ask where they're ordering from on the first visit only
    if (!P.Region.get()) window.setTimeout(function () { openSheet('regionSheet'); }, 260);

})(window, document);
