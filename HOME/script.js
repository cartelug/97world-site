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

    // === 2. THE CHOOSER — "What would you like to get?" =====================
    // One question, two answers. Picking one reveals only that path's offers
    // and collapses the other, so the page never shows 15 options at once.
    const pathSection = document.getElementById('path');
    const panes = document.querySelectorAll('.path-pane');
    const choicePanels = document.querySelectorAll('.choice-panel');
    const intentBtns = document.querySelectorAll('.intent-btn');
    const mmIntentCards = document.querySelectorAll('.mm-intent-card');
    const pathLinks = document.querySelectorAll('[data-path-link]');
    const VALID = ['grow', 'build'];
    let activePath = null;

    const readStoredPath = () => {
        try {
            const v = sessionStorage.getItem('k97-path');
            return VALID.indexOf(v) !== -1 ? v : null;
        } catch (e) { return null; }
    };

    function setPath(path, opts) {
        if (VALID.indexOf(path) === -1) return;
        const options = opts || {};
        activePath = path;
        try { sessionStorage.setItem('k97-path', path); } catch (e) {}

        panes.forEach((pane) => {
            pane.classList.toggle('is-active', pane.dataset.pane === path);
        });
        choicePanels.forEach((btn) => {
            btn.setAttribute('aria-pressed', String(btn.dataset.path === path));
        });
        intentBtns.forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.path === path);
        });
        mmIntentCards.forEach((btn) => {
            btn.setAttribute('aria-pressed', String(btn.dataset.path === path));
        });

        if (options.scroll && pathSection) {
            pathSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
    }

    if (panes.length) {
        // Only hide the inactive pane once JS is confirmed running — without
        // this class both paths stay visible, so a JS failure never hides content.
        if (pathSection) pathSection.classList.add('js-paths');
        setPath(readStoredPath() || 'grow');

        choicePanels.forEach((btn) => {
            btn.addEventListener('click', () => setPath(btn.dataset.path, { scroll: true }));
        });
        intentBtns.forEach((btn) => {
            btn.addEventListener('click', () => setPath(btn.dataset.path));
        });
        pathLinks.forEach((link) => {
            link.addEventListener('click', () => setPath(link.dataset.pathLink, { scroll: false }));
        });
    }

    // === 4. STICKY INTENT BAR — keeps the question with them while scrolling ==
    const intentBar = document.getElementById('intentBar');
    const proofSection = document.getElementById('proof');
    if (intentBar && pathSection) {
        let atOffers = false;
        let atProof = false;
        const sync = () => {
            const show = atOffers && !atProof;
            intentBar.classList.toggle('is-visible', show);
            intentBar.setAttribute('aria-hidden', String(!show));
        };
        // show it whenever the offers are on screen — that's exactly when
        // being able to switch path is useful
        // the -30% bottom margin means the offers must actually rise into the
        // upper 70% of the viewport before the bar appears — otherwise it
        // triggers while still parked at the very bottom edge on first paint
        new IntersectionObserver(([entry]) => {
            atOffers = entry.isIntersecting;
            sync();
        }, { rootMargin: '-70px 0px -30% 0px', threshold: 0 }).observe(pathSection);

        // hide it again once they've reached the proof section — the question
        // has been asked, stop nagging
        if (proofSection) {
            new IntersectionObserver(([entry]) => {
                atProof = entry.isIntersecting;
                sync();
            }, { threshold: 0 }).observe(proofSection);
        }
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

        // any link closes it; the intent cards also set the path first
        mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
        mmIntentCards.forEach((card) => {
            card.addEventListener('click', () => {
                setPath(card.dataset.path, { scroll: true });
                closeMenu();
            });
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
