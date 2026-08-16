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

    if (gate) {
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

    // === 3. THE PRICE BUILDER ==============================================
    // Section 2 is the first step of the order: platform, package, real price.
    // The choice is handed to the order page so nothing has to be picked twice.
    const builder = {
        region: P.Region.get() || 'UG',
        platform: 'ig',
        plan: 0,

        setRegion(code) {
            builder.region = code;
            builder.render();
        },

        render() {
            const platEl = document.getElementById('bd-plats');
            const planEl = document.getElementById('bd-plans');
            if (!platEl || !planEl) return;

            const all3 = document.getElementById('bd-all3');
            if (all3) {
                const on = builder.platform === 'bundle';
                all3.classList.toggle('is-on', on);
                all3.setAttribute('aria-pressed', String(on));
                const bundlePlan = P.plansFor('bundle', builder.region)[0];
                document.getElementById('bd-all3-price').textContent =
                    P.money(bundlePlan.price, bundlePlan.currency);
            }

            platEl.innerHTML = ['ig', 'tt', 'fb', 'yt'].map((key) => {
                const p = P.PLATFORMS[key];
                const on = builder.platform === key;
                return `<button type="button" class="bd-plat${on ? ' is-on' : ''}"
                    data-plat="${key}" aria-pressed="${on}">
                    <img src="${p.logo}" alt=""><span>${p.name}</span></button>`;
            }).join('');

            const plans = P.plansFor(builder.platform, builder.region);
            if (builder.plan >= plans.length) builder.plan = 0;

            // the bundle is one fixed package, so there is nothing to pick
            const step2 = planEl.closest('.bd-step');
            if (step2) step2.hidden = builder.platform === 'bundle';

            planEl.innerHTML = plans.map((plan, i) => {
                const on = builder.plan === i;
                return `<button type="button" class="bd-plan${on ? ' is-on' : ''}"
                    data-plan="${i}" aria-pressed="${on}">
                    ${plan.tag ? `<span class="bd-plan-tag">${plan.tag}</span>` : ''}
                    <span class="bd-plan-copy">
                        <b>${plan.name}</b>
                        ${plan.note ? `<small>${plan.note}</small>` : ''}
                    </span>
                    <span class="bd-plan-price">${P.money(plan.price, plan.currency)}</span>
                </button>`;
            }).join('');

            const chosen = plans[builder.plan];
            document.getElementById('bd-price').textContent = P.money(chosen.price, chosen.currency);
            document.getElementById('bd-was').textContent =
                chosen.was ? P.money(chosen.was, chosen.currency) : '';
            document.getElementById('bd-go').setAttribute('href', P.PLATFORMS[builder.platform].href);
            document.getElementById('bd-region').textContent = P.Region.data(builder.region).name;
        }
    };

    if (document.getElementById('builder')) {
        builder.render();

        document.getElementById('bd-plats').addEventListener('click', (e) => {
            const btn = e.target.closest('.bd-plat');
            if (!btn) return;
            builder.platform = btn.dataset.plat;
            builder.plan = 0;
            builder.render();
            if (navigator.vibrate) navigator.vibrate(10);
        });

        document.getElementById('bd-plans').addEventListener('click', (e) => {
            const btn = e.target.closest('.bd-plan');
            if (!btn) return;
            builder.plan = Number(btn.dataset.plan);
            builder.render();
            if (navigator.vibrate) navigator.vibrate(10);
        });

        // carry the built order into the order page so step 1 arrives done
        document.getElementById('bd-go').addEventListener('click', () => {
            const plans = P.plansFor(builder.platform, builder.region);
            P.Pending.set(builder.platform, plans[builder.plan].id);
        });

        document.getElementById('bd-all3').addEventListener('click', () => {
            builder.platform = 'bundle';
            builder.plan = 0;
            builder.render();
            if (navigator.vibrate) navigator.vibrate(12);
        });

        document.getElementById('bd-change').addEventListener('click', openGate);

        // first visit — we genuinely cannot price anything until they answer
        if (!P.Region.get()) openGate();
    }

    // the hero cards just route to the right part of the page now
    document.querySelectorAll('.choice-panel').forEach((panel) => {
        panel.addEventListener('click', () => {
            const target = document.getElementById(panel.dataset.path === 'build' ? 'build' : 'path');
            if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });
    });
    document.querySelectorAll('.mm-intent-card').forEach((card) => {
        card.addEventListener('click', () => {
            const target = document.getElementById(card.dataset.path === 'build' ? 'build' : 'path');
            if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 380);
        });
    });

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
