/**
 * 97 WORLD — HOME INTERACTIVE ENGINE
 * Location: HOME/script.js
 */

document.addEventListener('DOMContentLoaded', () => {

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // === 1. CURSOR SPOTLIGHT ===
    // transform-only updates (never left/top) so this stays on the compositor
    // thread and can't force a layout reflow on mousemove.
    const spotlight = document.getElementById('spotlight');
    if (spotlight) {
        if (window.matchMedia('(pointer: fine)').matches) {
            let spotRaf = null;
            window.addEventListener('mousemove', (e) => {
                if (spotRaf) return;
                spotRaf = requestAnimationFrame(() => {
                    spotlight.style.transform =
                        `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
                    spotRaf = null;
                });
            });
            document.addEventListener('mouseleave', () => { spotlight.style.opacity = '0'; });
            document.addEventListener('mouseenter', () => { spotlight.style.opacity = '1'; });
        } else {
            spotlight.style.display = 'none';
        }
    }

    // === 2. REGION GATE ====================================================
    // No price appears anywhere on this site until we know which currency to
    // show it in. The answer is stored once and reused by every order page.
    const P = window.K97Pricing;
    const gate = document.getElementById('regionGate');

    function openGate() {
        if (!gate) return;
        gate.hidden = false;
        document.body.classList.add('gate-open');
    }

    function closeGate() {
        if (!gate) return;
        gate.hidden = true;
        document.body.classList.remove('gate-open');
    }

    if (gate && P) {
        const grid = gate.querySelector('.region-grid');
        grid.innerHTML = Object.keys(P.REGIONS).map((code) => {
            const r = P.REGIONS[code];
            return `<button type="button" class="region-btn" data-region="${code}">
                <span class="flag">${r.flag}</span>
                <span class="rb-copy"><b>${r.name}</b><small>${r.blurb}</small></span>
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }).join('');

        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.region-btn');
            if (!btn) return;
            P.Region.set(btn.dataset.region);
            closeGate();
            if (typeof gb !== 'undefined') { gb.region = btn.dataset.region; gb.render(); }
            if (typeof paintPkgCards === 'function') paintPkgCards();
        });
    }

    // === 3. THE GROWTH BUILDER =============================================
    // Three decisions, one card: platform, then service, then quantity. Each
    // step only appears once the one before it is answered — the 27-service
    // catalogue never has to be shown at once, and at any moment there is
    // exactly one thing on screen to decide.
    //
    // Pricing honesty rule, load-bearing throughout this block: only 4
    // services (Instagram/TikTok/Facebook followers, the YouTube package)
    // have a real, agreed retail price. Selecting any of the other 23 routes
    // to a WhatsApp quote request with the choice attached — never a number
    // we invented. Whether a service is priced is decided once, by id, and
    // that decision drives everything downstream (quantity step, summary,
    // which trust lines are honest to show, and where "Continue" goes).
    const PRICED_IDS = ['ig_followers', 'tt_followers', 'fb_followers', 'yt_package'];
    const PLAT_KEY_FOR = { instagram: 'ig', tiktok: 'tt', facebook: 'fb', youtube: 'yt' };
    const GENERIC_QTYS = [1000, 5000, 10000];
    const WA_NUMBER = '256762193386';

    // === 3a. STICKY MOBILE CTA (state object) =============================
    // Defined before gb below because gb.render() calls growSticky.render() —
    // moving it first avoids a temporal-dead-zone error on first render.
    const growSticky = {
        render() {
            const bar = document.getElementById('growSticky');
            if (!bar) return;
            const before = document.getElementById('stickyBefore');
            const after = document.getElementById('stickyAfter');

            if (!gb.qty) {
                before.hidden = false; after.hidden = true;
                return;
            }
            before.hidden = true; after.hidden = false;
            const plat = P.PLAT_META[gb.platform].name;
            document.getElementById('stickyWhat').textContent = `${plat} · ${gb.service.short}`;
            const priceLine = document.getElementById('stickyPrice');
            const cta = document.getElementById('stickyCta');
            if (gb.isPriced()) {
                const deposit = Math.round(gb.qty.price * 0.3);
                priceLine.textContent = `${P.money(deposit, gb.qty.currency)} to start`;
                cta.href = gb.pricedHref();
                cta.target = '_self';
                cta.removeAttribute('rel');
            } else {
                priceLine.textContent = 'Price on request';
                cta.href = gb.waHref(true);
                cta.target = '_blank';
                cta.rel = 'noopener';
            }
        }
    };

    const gb = {
        region: (P && P.Region.get()) || 'UG',
        platform: null,
        service: null,   // a SERVICES entry
        qty: null,       // a plan object (priced) or { label, custom } (unpriced)
        platformOpen: false,
        serviceOpen: false,

        isPriced() { return gb.service && PRICED_IDS.indexOf(gb.service.id) !== -1; },

        reset(fromStep) {
            if (fromStep === 'platform') { gb.platform = null; gb.service = null; gb.qty = null; }
            if (fromStep === 'service') { gb.service = null; gb.qty = null; }
            if (fromStep === 'qty') { gb.qty = null; }
        },

        /* The real priced plans for the selected service — the existing
         * per-platform ladder for followers/the YouTube package, unchanged. */
        pricedPlans() {
            const key = gb.service.id === 'yt_package' ? 'yt' : PLAT_KEY_FOR[gb.platform];
            return P.plansFor(key, gb.region);
        },

        pricedHref() {
            const key = gb.service.id === 'yt_package' ? 'yt' : PLAT_KEY_FOR[gb.platform];
            return P.PLATFORMS[key].href;
        },

        waHref(withQty) {
            const plat = P.PLAT_META[gb.platform].name;
            const svc = gb.service.short.toLowerCase();
            const qtyPart = withQty && gb.qty && !gb.qty.custom ? ` — ${gb.qty.label}` : '';
            const msg = `Hi 97 World, I'd like ${plat} ${svc}${qtyPart}. Please send me a price.`;
            return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
        },

        platformTile(key, on) {
            const meta = P.PLAT_META[key];
            const mark = meta.logo ? `<img src="${meta.logo}" alt="">` : `<i class="${meta.icon}"></i>`;
            return `<button type="button" class="gb-tile${on ? ' is-on' : ''}" data-platform="${key}" aria-pressed="${on}">
                ${mark}<span>${meta.name}</span>
            </button>`;
        },

        serviceChip(svc, on) {
            return `<button type="button" class="gb-chip${on ? ' is-on' : ''}" data-service="${svc.id}" aria-pressed="${on}">
                ${svc.short}
            </button>`;
        },

        render() {
            const root = document.getElementById('growBuilder');
            if (!root) return;

            // ---- step 1: platform -------------------------------------------------
            const doneP = document.getElementById('stepPlatformDone');
            const openP = document.getElementById('stepPlatformOpen');
            if (gb.platform) {
                doneP.hidden = false; openP.hidden = true;
                doneP.querySelector('.gb-done-val').textContent = P.PLAT_META[gb.platform].name;
            } else {
                doneP.hidden = true; openP.hidden = false;
                document.getElementById('platformPrimary').innerHTML =
                    P.PLATFORMS_PRIMARY.map((k) => gb.platformTile(k, false)).join('');
                const moreWrap = document.getElementById('platformSecondary');
                moreWrap.hidden = !gb.platformOpen;
                moreWrap.innerHTML = P.PLATFORMS_SECONDARY.map((k) => gb.platformTile(k, false)).join('');
                document.getElementById('platformMoreBtn').setAttribute('aria-expanded', String(gb.platformOpen));
            }

            // ---- step 2: service ---------------------------------------------------
            const stepService = document.getElementById('stepService');
            if (!gb.platform) { stepService.hidden = true; }
            else {
                stepService.hidden = false;
                const doneS = document.getElementById('stepServiceDone');
                const openS = document.getElementById('stepServiceOpen');
                if (gb.service) {
                    doneS.hidden = false; openS.hidden = true;
                    doneS.querySelector('.gb-done-val').textContent = gb.service.short;
                } else {
                    doneS.hidden = true; openS.hidden = false;
                    const all = P.servicesFor(gb.platform);
                    const popular = all.filter((s) => s.popular);
                    const rest = all.filter((s) => !s.popular);
                    document.getElementById('servicePopular').innerHTML =
                        popular.map((s) => gb.serviceChip(s, false)).join('');
                    const moreBtn = document.getElementById('serviceMoreBtn');
                    moreBtn.hidden = rest.length === 0;
                    const moreWrap = document.getElementById('serviceMore');
                    moreWrap.hidden = !gb.serviceOpen;
                    moreWrap.innerHTML = rest.map((s) => gb.serviceChip(s, false)).join('');
                    moreBtn.setAttribute('aria-expanded', String(gb.serviceOpen));
                }
            }

            // ---- step 3: quantity ---------------------------------------------------
            const stepQty = document.getElementById('stepQty');
            if (!gb.service) { stepQty.hidden = true; }
            else {
                stepQty.hidden = false;
                const qtyGrid = document.getElementById('qtyGrid');
                if (gb.isPriced()) {
                    const plans = gb.pricedPlans();
                    qtyGrid.innerHTML = plans.map((plan) => {
                        const on = gb.qty && gb.qty.id === plan.id;
                        return `<button type="button" class="gb-qty${on ? ' is-on' : ''}" data-plan="${plan.id}" aria-pressed="${on}">
                            <b>${plan.name}</b>
                            <span>${P.money(plan.price, plan.currency)}</span>
                        </button>`;
                    }).join('');
                } else {
                    qtyGrid.innerHTML = GENERIC_QTYS.map((n) => {
                        const label = n >= 1000 ? (n / 1000) + 'K' : String(n);
                        const on = gb.qty && gb.qty.n === n;
                        return `<button type="button" class="gb-qty" data-qty="${n}" data-label="${label}" aria-pressed="${on ? 'true' : 'false'}">
                            <b>${label}</b>
                        </button>`;
                    }).join('') + `<button type="button" class="gb-qty" data-qty="custom" aria-pressed="${gb.qty && gb.qty.custom ? 'true' : 'false'}">
                        <b>Custom</b>
                    </button>`;
                }
            }

            // ---- summary --------------------------------------------------------
            const summary = document.getElementById('bSummary');
            if (!gb.qty) { summary.hidden = true; }
            else {
                summary.hidden = false;
                const plat = P.PLAT_META[gb.platform].name;
                document.getElementById('sumWhat').textContent = `${plat} · ${gb.service.short}`;
                document.getElementById('sumQty').textContent = gb.qty.label;

                const priceEl = document.getElementById('sumPrice');
                const depositEl = document.getElementById('sumDeposit');
                const trustEl = document.getElementById('sumTrust');
                const ctaEl = document.getElementById('sumCta');

                if (gb.isPriced()) {
                    priceEl.textContent = P.money(gb.qty.price, gb.qty.currency);
                    const deposit = Math.round(gb.qty.price * 0.3);
                    depositEl.hidden = false;
                    depositEl.innerHTML = `<b>${P.money(deposit, gb.qty.currency)}</b> to start<br><span>Balance due once delivery is running</span>`;
                    trustEl.innerHTML = `
                        <li><i class="fas fa-check"></i> No password needed</li>
                        <li><i class="fas fa-check"></i> Gradual delivery</li>
                        <li><i class="fas fa-check"></i> 30-day refill</li>`;
                    ctaEl.textContent = 'Continue to order';
                    ctaEl.href = gb.pricedHref();
                    ctaEl.target = '_self';
                    ctaEl.removeAttribute('rel');
                } else {
                    priceEl.textContent = 'Price on request';
                    depositEl.hidden = true;
                    depositEl.innerHTML = '';
                    trustEl.innerHTML = `
                        <li><i class="fas fa-check"></i> No password needed</li>
                        <li><i class="fas fa-circle-info"></i> Delivery &amp; refill terms confirmed on WhatsApp</li>`;
                    ctaEl.textContent = 'Get a price on WhatsApp';
                    ctaEl.href = gb.waHref(true);
                    ctaEl.target = '_blank';
                    ctaEl.rel = 'noopener';
                }
            }

            const regionEl = document.getElementById('bRegion');
            if (regionEl) regionEl.textContent = P.Region.data(gb.region).name;

            growSticky.render();
        }
    };

    if (document.getElementById('growBuilder') && P) {
        gb.render();

        document.getElementById('platformPrimary').addEventListener('click', (e) => {
            const btn = e.target.closest('.gb-tile');
            if (!btn) return;
            gb.platform = btn.dataset.platform;
            gb.platformOpen = false;
            gb.render();
            if (navigator.vibrate) navigator.vibrate(10);
        });
        document.getElementById('platformMoreBtn').addEventListener('click', () => {
            gb.platformOpen = !gb.platformOpen;
            gb.render();
        });
        document.getElementById('platformSecondary').addEventListener('click', (e) => {
            const btn = e.target.closest('.gb-tile');
            if (!btn) return;
            gb.platform = btn.dataset.platform;
            gb.platformOpen = false;
            gb.render();
            if (navigator.vibrate) navigator.vibrate(10);
        });

        const pickService = (id) => {
            gb.service = P.SERVICES.filter((s) => s.id === id)[0] || null;
            gb.serviceOpen = false;
            gb.render();
            if (navigator.vibrate) navigator.vibrate(10);
        };
        document.getElementById('servicePopular').addEventListener('click', (e) => {
            const btn = e.target.closest('.gb-chip');
            if (btn) pickService(btn.dataset.service);
        });
        document.getElementById('serviceMoreBtn').addEventListener('click', () => {
            gb.serviceOpen = !gb.serviceOpen;
            gb.render();
        });
        document.getElementById('serviceMore').addEventListener('click', (e) => {
            const btn = e.target.closest('.gb-chip');
            if (btn) pickService(btn.dataset.service);
        });

        document.getElementById('qtyGrid').addEventListener('click', (e) => {
            const btn = e.target.closest('.gb-qty');
            if (!btn) return;
            if (gb.isPriced()) {
                const plan = gb.pricedPlans().filter((p) => p.id === btn.dataset.plan)[0];
                if (plan) gb.qty = plan;
            } else if (btn.dataset.qty === 'custom') {
                gb.qty = { label: 'a custom amount', custom: true };
            } else {
                gb.qty = { n: Number(btn.dataset.qty), label: btn.dataset.label };
            }
            gb.render();
            if (navigator.vibrate) navigator.vibrate(10);
        });

        // handing a priced choice to the order page so step 1 there arrives done
        document.getElementById('sumCta').addEventListener('click', () => {
            if (gb.isPriced()) {
                const key = gb.service.id === 'yt_package' ? 'yt' : PLAT_KEY_FOR[gb.platform];
                P.Pending.set(key, gb.qty.id);
            }
        });

        // "Change" on any step clears it and everything after it
        document.querySelectorAll('[data-reset]').forEach((btn) => {
            btn.addEventListener('click', () => {
                gb.reset(btn.dataset.reset);
                gb.render();
            });
        });

        const change = document.getElementById('bd-change');
        if (change) change.addEventListener('click', openGate);

        // first visit — we genuinely cannot price anything until they answer
        if (!P.Region.get()) openGate();
    }


    if (document.getElementById('growSticky') && P) {
        document.getElementById('stickyBefore').addEventListener('click', () => {
            const target = document.getElementById('growBuilder');
            if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });
        document.getElementById('stickyCta').addEventListener('click', () => {
            if (gb.isPriced()) {
                const key = gb.service.id === 'yt_package' ? 'yt' : PLAT_KEY_FOR[gb.platform];
                P.Pending.set(key, gb.qty.id);
            }
        });
    }

    // === 4. SHOP BY GOAL =====================================================
    // A shortcut layer over the same real builder — a goal never invents a
    // product, it just opens the builder to the platform/service that answers
    // it. "Grow multiple platforms" points at the one real bundle instead of
    // the single-platform builder, and "I manage client accounts" routes to
    // the reseller banner rather than into the retail funnel, per the
    // standing rule that reseller traffic stays out of that funnel.
    document.querySelectorAll('.goal-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const jumpTo = btn.dataset.goalTarget; // 'bundle' | 'reseller' | absent = builder
            if (jumpTo) {
                const el = document.getElementById(jumpTo);
                if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
                return;
            }
            if (!document.getElementById('growBuilder')) return;
            const platKey = btn.dataset.goalPlatform;
            const svcId = btn.dataset.goalService;
            if (platKey) { gb.platform = platKey; gb.platformOpen = false; }
            if (svcId) {
                gb.service = P.SERVICES.filter((s) => s.id === svcId)[0] || null;
                gb.serviceOpen = false;
            }
            gb.render();
            const target = document.getElementById('growBuilder');
            if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });
    });

    // === 4a. STATIC PACKAGE CARDS ============================================
    // Popular-package and bundle shortcuts show a real price without
    // duplicating it as a hardcoded number — each carries data-pkg="key:id"
    // and reads the same plansFor() data the builder itself uses, so a price
    // can never say one thing in the shortcut and another in the builder.
    function paintPkgCards() {
        if (!P) return;
        const region = P.Region.get() || 'UG';
        document.querySelectorAll('[data-pkg]').forEach((el) => {
            const parts = el.dataset.pkg.split(':');
            const plans = P.plansFor(parts[0], region);
            const plan = plans.filter((p) => p.id === parts[1])[0];
            if (!plan) return;
            const from = el.textContent.trim().indexOf('From') === 0 ? 'From ' : '';
            el.textContent = from + P.money(plan.price, plan.currency);
        });
        document.querySelectorAll('[data-pkg-was]').forEach((el) => {
            const parts = el.dataset.pkgWas.split(':');
            const plans = P.plansFor(parts[0], region);
            const plan = plans.filter((p) => p.id === parts[1])[0];
            if (plan && plan.was) el.textContent = P.money(plan.was, plan.currency);
            else el.hidden = true;
        });
    }
    paintPkgCards();

    // === 5. BROWSE ALL SERVICES — ACCORDION + SEARCH ========================
    // The full 27-service catalogue lives here, not in the main funnel above.
    // Accordions group by platform; opening one shows its real categories.
    // Search sits in this section on purpose, not above the guided builder —
    // it is the escape hatch for someone who already knows what they want,
    // not the default way in.
    document.querySelectorAll('.accordion-head').forEach((head) => {
        head.addEventListener('click', () => {
            const item = head.closest('.accordion-item');
            const open = item.classList.toggle('is-open');
            head.setAttribute('aria-expanded', String(open));
        });
    });

    if (P) {
        document.querySelectorAll('.accordion-body[data-platform]').forEach((body) => {
            const key = body.dataset.platform;
            const services = P.servicesFor(key);
            body.innerHTML = services.map((s) => browseRow(s)).join('');
        });
    }

    function browseRow(s) {
        const priced = PRICED_IDS.indexOf(s.id) !== -1;
        const meta = P.PLAT_META[s.platform];
        let money, href, cta, blank;
        if (priced) {
            const currency = P.Region.data((P.Region.get() || 'UG')).currency;
            const plans = s.id === 'yt_package' ? P.plansFor('yt', P.Region.get() || 'UG') : P.plansFor(PLAT_KEY_FOR[s.platform] || '', P.Region.get() || 'UG');
            const top = plans[0];
            money = 'From ' + P.money(top.price, top.currency);
            href = s.href; cta = 'Order'; blank = false;
        } else {
            money = '';
            href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi 97 World, I'd like a price for ${meta.name} ${s.short.toLowerCase()}.`)}`;
            cta = 'Get a price'; blank = true;
        }
        return `<a class="svc${priced ? '' : ' is-quote'}" href="${href}"${blank ? ' target="_blank" rel="noopener"' : ''}>
            <span class="svc-copy"><b>${s.short}</b><small>${s.unit}</small></span>
            <span class="svc-end">
                ${money ? `<span class="svc-money">${money}</span>` : ''}
                <span class="svc-go">${cta} <i class="fas fa-arrow-right"></i></span>
            </span>
        </a>`;
    }

    const search = document.getElementById('svcSearch');
    const results = document.getElementById('svc-results');
    const browseAll = document.getElementById('browseAll');
    const clearBtn = document.getElementById('svcClear');

    if (search && results && browseAll && P) {
        const WA = `https://wa.me/${WA_NUMBER}?text=`;

        const run = () => {
            const q = search.value.trim();
            clearBtn.hidden = !q;

            if (!q) {
                results.hidden = true;
                results.innerHTML = '';
                browseAll.hidden = false;
                return;
            }

            browseAll.hidden = true;
            results.hidden = false;

            const hits = P.searchServices(q);
            if (!hits.length) {
                results.innerHTML = `<p class="svc-empty">
                    Nothing matches “${q.replace(/</g, '&lt;')}”.
                    <a href="${WA + encodeURIComponent('Hi, do you sell: ' + q + '?')}" target="_blank" rel="noopener">Ask us — we may still do it</a>.
                </p>`;
                return;
            }
            results.innerHTML =
                `<p class="svc-count">${hits.length} service${hits.length > 1 ? 's' : ''}</p>` +
                hits.map(browseRow).join('');
        };

        search.addEventListener('input', run);
        search.addEventListener('search', run);
        clearBtn.addEventListener('click', () => {
            search.value = '';
            run();
            search.focus();
        });
    }

    // === 6. MOBILE MENU ===
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mmClose = document.getElementById('mmClose');
    if (burgerBtn && mobileMenu) {
        const FOCUSABLE = 'a[href], button:not([disabled])';
        let lastFocus = null;

        const openMenu = () => {
            lastFocus = document.activeElement;
            burgerBtn.setAttribute('aria-expanded', 'true');
            mobileMenu.classList.add('is-open');
            mobileMenu.setAttribute('aria-hidden', 'false');
            document.body.classList.add('menu-open');
            if (mmClose) mmClose.focus();
        };
        const closeMenu = () => {
            burgerBtn.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('is-open');
            mobileMenu.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('menu-open');
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        };
        const isOpen = () => mobileMenu.classList.contains('is-open');

        burgerBtn.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));
        if (mmClose) mmClose.addEventListener('click', closeMenu);

        // any link closes it; so do the two intent cards
        mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
        document.querySelectorAll('.mm-intent-card').forEach((card) => {
            card.addEventListener('click', closeMenu);
        });

        // Escape + focus trap
        window.addEventListener('keydown', (e) => {
            if (!isOpen()) return;
            if (e.key === 'Escape') { closeMenu(); return; }
            if (e.key !== 'Tab') return;
            const items = Array.prototype.slice.call(mobileMenu.querySelectorAll(FOCUSABLE))
                .filter((el) => el.offsetParent !== null);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });

        // swipe down to dismiss
        let touchStartY = null;
        mobileMenu.addEventListener('touchstart', (e) => {
            const scroller = mobileMenu.querySelector('.mm-scroll');
            touchStartY = (!scroller || scroller.scrollTop <= 0) ? e.touches[0].clientY : null;
        }, { passive: true });
        mobileMenu.addEventListener('touchmove', (e) => {
            if (touchStartY === null) return;
            if (e.touches[0].clientY - touchStartY > 90) { closeMenu(); touchStartY = null; }
        }, { passive: true });
    }

    // === 7. ONE BATCHED SCROLL LOOP =========================================
    // navbar state + progress rail + hero parallax all read/write inside a
    // single rAF tick, so scrolling never triggers competing layout passes.
    const navbar = document.getElementById('navbar');
    const progressFill = document.querySelector('#scrollProgress i');
    const heroContent = document.querySelector('.hero-content');
    const heroCue = document.querySelector('.hero-cue');
    const waFab = document.getElementById('waFab');
    let scrollRaf = null;

    const onScrollFrame = () => {
        const y = window.scrollY;

        if (navbar) navbar.classList.toggle('scrolled', y > 50);

        if (progressFill) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progressFill.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
        }

        // hero drifts up and dissolves as it leaves — cheap depth, transform only
        if (heroContent && !reduceMotion) {
            const vh = window.innerHeight;
            if (y < vh * 1.2) {
                const t = y / vh;
                // gentle: content is still ~40% visible at the point the hero
                // leaves, instead of snapping to invisible a third of the way down
                heroContent.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
                heroContent.style.opacity = String(Math.max(1 - t * 0.75, 0));
                if (heroCue) heroCue.style.opacity = String(Math.max(1 - t * 2, 0));
            }
        }

        // the WhatsApp fab waits until the hero (and its own WhatsApp button)
        // has scrolled away, so the two never compete for the same tap
        if (waFab) waFab.classList.toggle('is-visible', y > window.innerHeight * 0.8);

        scrollRaf = null;
    };

    window.addEventListener('scroll', () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(onScrollFrame);
    }, { passive: true });
    onScrollFrame();

    // === 8. COUNTERS ===
    const runCounters = (parent) => {
        parent.querySelectorAll('.anim-counter').forEach((counter) => {
            const target = +counter.getAttribute('data-target');
            if (isNaN(target)) return;
            if (reduceMotion) { counter.innerText = target.toLocaleString(); return; }
            let current = 0;
            const increment = target / 60;
            const update = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current).toLocaleString();
                    requestAnimationFrame(update);
                } else {
                    counter.innerText = target.toLocaleString();
                }
            };
            update();
        });
    };

    // === 9. SCROLL REVEAL — IN *AND* OUT ===================================
    // number every stagger child so CSS can cascade them
    document.querySelectorAll('[data-stagger]').forEach((group) => {
        Array.prototype.forEach.call(group.children, (child, i) => {
            child.style.setProperty('--i', i);
        });
    });

    // will-change is switched on only while a transition is actually running,
    // so we don't pin a compositor layer on every element for the whole session
    const markBusy = (el) => {
        el.classList.add('anim-busy');
        clearTimeout(el._animTimer);
        el._animTimer = setTimeout(() => el.classList.remove('anim-busy'), 900);
    };

    const revealTargets = document.querySelectorAll('.fade-up, .scale-in, .slide-in-right, .fade-in, [data-stagger]');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const el = entry.target;
            if (entry.isIntersecting) {
                el.classList.add('is-visible');
                el.classList.remove('is-out');
                markBusy(el);
                if (el.querySelector('.anim-counter') && !el.classList.contains('counted')) {
                    el.classList.add('counted');
                    runCounters(el);
                }
            } else if (!reduceMotion) {
                el.classList.remove('is-visible');
                el.classList.add('is-out');
                markBusy(el);
                // let the counter replay next time it comes back into view
                el.classList.remove('counted');
            }
        });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0 });

    revealTargets.forEach((el) => revealObserver.observe(el));

});
