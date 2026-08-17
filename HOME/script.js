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
            builder.setRegion(btn.dataset.region);
        });
    }

    // === 3. THE PICKER =====================================================
    // Two taps: what am I growing, then which package. Deliberately NOT a
    // platform x size grid — that made "All 3" look like a platform while it
    // carried its own price, so three prices competed on screen at once and
    // choosing the bundle silently deleted the step below it.
    //
    // Now every card is one whole offer: what you get, where, what it costs,
    // and tapping it goes straight to that order page with the package
    // already chosen. Nothing to assemble, nothing to confirm twice.
    // P is only present on pages that load pricing.js.
    const KEYS = ['ig', 'tt', 'fb', 'yt'];

    const builder = {
        region: (P && P.Region.get()) || 'UG',
        platform: 'ig',

        setRegion(code) {
            builder.region = code;
            builder.render();
        },

        /* The line under a package name — what you're actually getting.
         * The bundle never renders here; it has its own page. */
        subtitle(plan, key) {
            if (key === 'yt') return plan.feats.map((f) => f.text).join(' · ');
            return 'on ' + P.PLATFORMS[key].name;
        },

        render() {
            const tabsEl = document.getElementById('bd-tabs');
            const listEl = document.getElementById('bd-list');
            if (!tabsEl || !listEl) return;

            tabsEl.innerHTML = KEYS.map((key) => {
                const p = P.PLATFORMS[key];
                const on = builder.platform === key;
                return `<button type="button" class="pick-tab${on ? ' is-on' : ''}"
                    data-plat="${key}" aria-pressed="${on}">
                    <img src="${p.logo}" alt=""><span>${p.name}</span>
                </button>`;
            }).join('');

            const key = builder.platform;
            const plans = P.plansFor(key, builder.region);
            const href = P.PLATFORMS[key].href;

            listEl.innerHTML = plans.map((plan) => `
                <a href="${href}" class="deal${plan.hero ? ' is-hero' : ''}" data-plan="${plan.id}">
                    ${plan.tag ? `<span class="deal-tag">${plan.tag}</span>` : ''}
                    <span class="deal-head">
                        <b>${plan.name}</b>
                        <small>${builder.subtitle(plan, key)}</small>
                    </span>
                    <span class="deal-foot">
                        <span class="deal-money">
                            <b>${P.money(plan.price, plan.currency)}</b>
                            ${plan.was ? `<s>${P.money(plan.was, plan.currency)}</s>` : ''}
                        </span>
                        <span class="deal-go">Choose <i class="fas fa-arrow-right"></i></span>
                    </span>
                </a>`).join('');

            const regionEl = document.getElementById('bd-region');
            if (regionEl) regionEl.textContent = P.Region.data(builder.region).name;
        }
    };

    if (document.getElementById('builder') && P) {
        builder.render();

        document.getElementById('bd-tabs').addEventListener('click', (e) => {
            const btn = e.target.closest('.pick-tab');
            if (!btn) return;
            builder.platform = btn.dataset.plat;
            builder.render();
            if (navigator.vibrate) navigator.vibrate(10);
        });

        // The bundle is a whole page, not a filter. Tapping it drops everything
        // else away and leaves only the choice lit, then follows the link — the
        // dim IS the transition, so the next page doesn't arrive out of nowhere.
        const wide = document.getElementById('bd-all3');
        const veil = document.getElementById('focusVeil');
        if (wide && veil && !reduceMotion) {
            wide.addEventListener('click', (e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                document.body.classList.add('is-focusing');
                if (navigator.vibrate) navigator.vibrate(14);
                const go = () => { window.location.href = wide.getAttribute('href'); };
                veil.addEventListener('transitionend', go, { once: true });
                // never strand them if the transition never fires
                setTimeout(go, 600);
            });
        }

        // the card itself is the call to action — hand the choice to the order
        // page so step 1 there arrives already done
        document.getElementById('bd-list').addEventListener('click', (e) => {
            const card = e.target.closest('.deal');
            if (card) P.Pending.set(builder.platform, card.dataset.plan);
        });

        // === SERVICE SEARCH ================================================
        // The picker covers the four things most people want. This covers the
        // other twenty-odd without putting them all on screen by default.
        // A service with no agreed price is still listed and still orderable —
        // it just goes to WhatsApp for a quote rather than showing a number we
        // would be inventing.
        const search = document.getElementById('svcSearch');
        const results = document.getElementById('svc-results');
        const pickBody = document.getElementById('pickBody');
        const clearBtn = document.getElementById('svcClear');

        if (search && results && pickBody) {
            const WA = 'https://wa.me/256762193386?text=';

            const card = (s) => {
                const meta = P.PLAT_META[s.platform];
                const mark = meta.logo
                    ? `<img src="${meta.logo}" alt="">`
                    : `<span class="svc-ic"><i class="${meta.icon}"></i></span>`;

                // priced services link to their order page; the rest ask
                const priced = s.sizes && s.sizes[0] && s.sizes[0].usd != null;
                let money, href, cta;

                if (priced) {
                    const currency = P.Region.data(builder.region).currency;
                    const top = s.sizes[s.sizes.length - 1];
                    const from = s.sizes.length > 1 || top.qty === null;
                    money = (from ? 'From ' : '') + P.money(P.localPrice(top.usd, currency), currency);
                    href = s.href;
                    cta = 'Order';
                } else {
                    // "Price on request" next to an "Ask" button says the same
                    // thing twice and squeezes the name into three lines — the
                    // action alone carries it
                    money = '';
                    href = WA + encodeURIComponent(`Hi, I'd like a price for ${s.name}.`);
                    cta = 'Get a price';
                }

                return `<a class="svc${priced ? '' : ' is-quote'}" href="${href}"${priced ? '' : ' target="_blank" rel="noopener"'}>
                    <span class="svc-mark">${mark}</span>
                    <span class="svc-copy">
                        <b>${s.name}</b>
                        <small>${meta.name} · ${s.unit}</small>
                    </span>
                    <span class="svc-end">
                        ${money ? `<span class="svc-money">${money}</span>` : ''}
                        <span class="svc-go">${cta} <i class="fas fa-arrow-right"></i></span>
                    </span>
                </a>`;
            };

            const run = () => {
                const q = search.value.trim();
                clearBtn.hidden = !q;

                if (!q) {
                    results.hidden = true;
                    results.innerHTML = '';
                    pickBody.hidden = false;
                    return;
                }

                pickBody.hidden = true;
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
                    hits.map(card).join('');
            };

            search.addEventListener('input', run);
            search.addEventListener('search', run);
            clearBtn.addEventListener('click', () => {
                search.value = '';
                run();
                search.focus();
            });
        }

        const change = document.getElementById('bd-change');
        if (change) change.addEventListener('click', openGate);

        // first visit — we genuinely cannot price anything until they answer
        if (!P.Region.get()) openGate();
    }

    // === 5. MOBILE MENU ===
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

    // === 6. ONE BATCHED SCROLL LOOP =========================================
    // navbar state + progress rail + hero parallax all read/write inside a
    // single rAF tick, so scrolling never triggers competing layout passes.
    const navbar = document.getElementById('navbar');
    const progressFill = document.querySelector('#scrollProgress i');
    const heroContent = document.querySelector('.hero-content');
    const heroCue = document.querySelector('.hero-cue');
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
        scrollRaf = null;
    };

    window.addEventListener('scroll', () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(onScrollFrame);
    }, { passive: true });
    onScrollFrame();

    // === 7. COUNTERS ===
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

    // === 8. SCROLL REVEAL — IN *AND* OUT ===================================
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
