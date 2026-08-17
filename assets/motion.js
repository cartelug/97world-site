/**
 * 97 WORLD — MOTION ENGINE
 *
 * The one reveal/scroll engine for every page. It replaces three separate
 * implementations that had drifted apart (one in HOME/script.js for the dark
 * pages, one in order.js for the wizard, one in growth/app.js).
 *
 * It also understands the legacy class names still in the markup — .fade-up
 * with .is-visible on the dark pages, .r-up with .is-in on the order and
 * growth pages — so nothing had to be renamed across twenty-odd files to
 * move onto a single engine.
 *
 * Exposes window.Motion for pages that render their own DOM at runtime:
 *   Motion.observe(root)  register newly-inserted nodes
 *   Motion.roll(el, text) swap a figure without moving what surrounds it
 *   Motion.flash(el)      one-shot attention on something that just changed
 */
(function (window, document) {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* New vocabulary plus the two legacy ones already in the markup. */
    var SELECTOR = '.m-up, .m-fade, .m-scale, .m-left, .m-right, .fade-up, .r-up, ' +
                   '.scale-in, .slide-in-right, .fade-in, [data-stagger]';

    /* Legacy classes use .is-visible; everything else uses .is-in. Adding
       both is harmless and saves a per-element lookup. */
    function show(el) {
        el.classList.add('is-in', 'is-visible');
        el.classList.remove('is-out');
    }

    var io = null;

    function markBusy(el) {
        el.classList.add('m-busy', 'anim-busy');
        window.clearTimeout(el._mTimer);
        el._mTimer = window.setTimeout(function () {
            el.classList.remove('m-busy', 'anim-busy');
        }, 900);
    }

    /** Number the children of a stagger group so CSS can cascade them. */
    function index(root) {
        (root || document).querySelectorAll('[data-stagger]').forEach(function (group) {
            for (var i = 0; i < group.children.length; i++) {
                group.children[i].style.setProperty('--i', i);
            }
        });
    }

    function observe(root) {
        var scope = root || document;
        var targets = scope.querySelectorAll(SELECTOR);

        if (reduce || !('IntersectionObserver' in window)) {
            targets.forEach(show);
            return;
        }
        if (!io) {
            io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    show(entry.target);
                    markBusy(entry.target);
                    countUp(entry.target);
                    io.unobserve(entry.target);   // reveal is one-shot
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
        }
        targets.forEach(function (el) {
            if (el._mSeen) return;
            el._mSeen = true;
            io.observe(el);
        });
    }

    /* -------------------------------------------------------- counters --- */

    /**
     * Counts a number up when it scrolls into view. Reads the target from the
     * markup, so the honest figure is always what's in the HTML — the
     * animation can never invent a number the page didn't already state.
     */
    function countUp(scope) {
        var nodes = scope.querySelectorAll ? scope.querySelectorAll('.anim-counter') : [];
        if (scope.classList && scope.classList.contains('anim-counter')) {
            nodes = [scope];
        }
        Array.prototype.forEach.call(nodes, function (el) {
            if (el._mCounted) return;
            el._mCounted = true;

            // data-target is the existing markup's attribute; data-count and
            // the rendered text are accepted too so new pages need neither.
            var raw = (el.dataset.target || el.dataset.count || el.textContent || '').trim();
            var target = parseFloat(raw.replace(/[^\d.]/g, ''));
            if (isNaN(target)) return;

            var prefix = el.dataset.prefix || '';
            var suffix = el.dataset.suffix || '';
            var decimals = (String(target).split('.')[1] || '').length;

            if (reduce) {
                el.textContent = prefix + target.toLocaleString() + suffix;
                return;
            }

            var dur = 1100;
            var start = null;
            function step(ts) {
                if (start === null) start = ts;
                var p = Math.min((ts - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                var val = target * eased;
                el.textContent = prefix +
                    (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()) +
                    suffix;
                if (p < 1) window.requestAnimationFrame(step);
            }
            window.requestAnimationFrame(step);
        });
    }

    /* ------------------------------------------------------ value swap --- */

    /** Change a figure in place. The element moves; its container doesn't. */
    function roll(el, text) {
        if (!el) return;
        if (el.textContent === text) return;
        if (reduce) { el.textContent = text; return; }
        el.classList.add('is-swap');
        window.setTimeout(function () {
            el.textContent = text;
            el.classList.remove('is-swap');
        }, 150);
    }

    /** One-shot attention on a block whose meaning just changed. */
    function flash(el) {
        if (!el || reduce) return;
        el.classList.remove('m-flash');
        void el.offsetWidth;          // restart the animation
        el.classList.add('m-flash');
        window.setTimeout(function () { el.classList.remove('m-flash'); }, 950);
    }

    /** Replay an entrance on content that was just re-rendered in place. */
    function swap(el) {
        if (!el || reduce) return;
        el.classList.remove('m-swap');
        void el.offsetWidth;
        el.classList.add('m-swap');
    }

    /* --------------------------------------------------- sticky header --- */

    /**
     * Any element with data-motion-header gets .is-stuck past a small scroll
     * offset. One shared passive listener, rAF-throttled, so pages don't each
     * add their own scroll handler.
     */
    function stickyHeaders() {
        var heads = document.querySelectorAll('[data-motion-header]');
        if (!heads.length) return;
        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(function () {
                var y = window.scrollY || window.pageYOffset;
                for (var i = 0; i < heads.length; i++) {
                    heads[i].classList.toggle('is-stuck', y > 12);
                }
                ticking = false;
            });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* --------------------------------------------------------- start --- */

    function start() {
        // Deliberately no body fade-in here: this script runs at
        // DOMContentLoaded, by which point the page is already painted, so
        // animating body from opacity 0 would flash visible content away and
        // back. .m-enter stays available for anything that opts into it.
        index();
        observe();
        stickyHeaders();

        // Anything rendered later — a re-built step, a sheet's contents.
        // Coalesced into one rAF because /growth/ re-renders several
        // containers per interaction and each would otherwise re-scan.
        if ('MutationObserver' in window) {
            var queued = false;
            var mo = new MutationObserver(function (muts) {
                if (queued) return;
                for (var i = 0; i < muts.length; i++) {
                    for (var j = 0; j < muts[i].addedNodes.length; j++) {
                        if (muts[i].addedNodes[j].nodeType !== 1) continue;
                        queued = true;
                        window.requestAnimationFrame(function () {
                            queued = false;
                            index();
                            observe();
                        });
                        return;
                    }
                }
            });
            mo.observe(document.body, { childList: true, subtree: true });
        }
    }

    window.Motion = {
        observe: observe,
        index: index,
        roll: roll,
        flash: flash,
        swap: swap,
        countUp: countUp,
        reduced: reduce
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

})(window, document);
