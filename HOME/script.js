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

    // === 2. MOBILE MENU ===
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

    // === 3. ONE BATCHED SCROLL LOOP =========================================
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

});
