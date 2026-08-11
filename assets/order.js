/**
 * 97 WORLD — ORDER KIT
 * Shared checkout engine for every boost page.
 *
 * The revenue-critical part (Google Sheets logging + WhatsApp hand-off) lives
 * in exactly one place — OrderKit.send() — so it only has to be right once.
 * Everything else here is UI plumbing: sheets, toasts, the step rail, reveal
 * animations and field validation.
 */
(function (window, document) {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var OrderKit = {

        reduceMotion: reduceMotion,

        /* ------------------------------------------------------ formatting */

        // 1000 -> "1k", 7500 -> "7.5k"
        vol: function (n) {
            if (n < 1000) return String(n);
            var k = n / 1000;
            return (Math.round(k * 10) / 10) + 'k';
        },

        // price + currency, the way a customer expects to read it
        money: function (amount, currency) {
            return currency === 'USD'
                ? '$' + amount.toLocaleString()
                : amount.toLocaleString() + ' UGX';
        },

        haptic: function (ms) {
            if (navigator.vibrate) navigator.vibrate(ms || 10);
        },

        /* ---------------------------------------------------------- toasts */

        toast: function (message, type) {
            var stack = document.getElementById('toastStack');
            if (!stack) { return; }
            var el = document.createElement('div');
            el.className = 'toast ' + (type === 'ok' ? 'is-ok' : 'is-error');
            el.setAttribute('role', 'status');
            el.innerHTML = '<i class="fas ' +
                (type === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation') +
                '"></i><span></span>';
            el.querySelector('span').textContent = message;
            stack.appendChild(el);
            OrderKit.haptic(type === 'ok' ? 12 : [18, 40, 18]);
            setTimeout(function () {
                el.classList.add('is-gone');
                setTimeout(function () { el.remove(); }, 340);
            }, 3200);
        },

        /* ----------------------------------------------------- bottom sheet */

        _sheetReturn: null,

        openSheet: function (id) {
            var sheet = document.getElementById(id);
            if (!sheet) return;
            OrderKit._sheetReturn = document.activeElement;
            sheet.setAttribute('aria-hidden', 'false');
            document.body.classList.add('is-locked');
            var focusable = sheet.querySelector('button, [href], input, select');
            if (focusable) setTimeout(function () { focusable.focus(); }, 60);
        },

        closeSheet: function (id) {
            var sheet = document.getElementById(id);
            if (!sheet) return;
            sheet.setAttribute('aria-hidden', 'true');
            if (!document.querySelector('.sheet[aria-hidden="false"]')) {
                document.body.classList.remove('is-locked');
            }
            var back = OrderKit._sheetReturn;
            if (back && back.focus) back.focus();
        },

        // backdrop click, Escape, swipe-down and [data-close] all dismiss —
        // wired once for every .sheet on the page
        wireSheets: function () {
            document.querySelectorAll('[data-close]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    OrderKit.closeSheet(btn.dataset.close);
                });
            });

            var sheets = document.querySelectorAll('.sheet');
            Array.prototype.forEach.call(sheets, function (sheet) {
                sheet.addEventListener('click', function (e) {
                    if (e.target === sheet && sheet.dataset.dismissible !== 'false') {
                        OrderKit.closeSheet(sheet.id);
                    }
                });

                var card = sheet.querySelector('.sheet-card');
                if (!card) return;
                var startY = null;
                card.addEventListener('touchstart', function (e) {
                    startY = card.scrollTop <= 0 ? e.touches[0].clientY : null;
                }, { passive: true });
                card.addEventListener('touchmove', function (e) {
                    if (startY === null) return;
                    if (e.touches[0].clientY - startY > 90 && sheet.dataset.dismissible !== 'false') {
                        OrderKit.closeSheet(sheet.id);
                        startY = null;
                    }
                }, { passive: true });
            });

            window.addEventListener('keydown', function (e) {
                if (e.key !== 'Escape') return;
                var open = document.querySelector('.sheet[aria-hidden="false"]');
                if (open && open.dataset.dismissible !== 'false') OrderKit.closeSheet(open.id);
            });

            // focus trap across whichever sheet is open
            window.addEventListener('keydown', function (e) {
                if (e.key !== 'Tab') return;
                var open = document.querySelector('.sheet[aria-hidden="false"]');
                if (!open) return;
                var items = Array.prototype.slice.call(
                    open.querySelectorAll('button, [href], input, select')
                ).filter(function (el) { return el.offsetParent !== null && !el.disabled; });
                if (!items.length) return;
                var first = items[0];
                var last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            });
        },

        /* ----------------------------------------------------------- region */

        /**
         * Region picker. Remembers the choice so a returning customer never
         * gets asked twice, and exposes the current currency to the page.
         * @param {{key:string, onChange:function, badge?:string}} opts
         */
        region: function (opts) {
            var store = opts.key;
            var badge = document.getElementById(opts.badge || 'regionBadge');
            var flag = document.getElementById('regionFlag');

            var FLAGS = { UG: '🇺🇬', SS: '🇸🇸', CD: '🇨🇩' };
            var PHONE = {
                UG: 'e.g. +256 700 000 000',
                SS: 'e.g. +211 900 000 000',
                CD: 'e.g. +243 800 000 000'
            };

            var api = {
                currency: 'UGX',
                code: 'UG',

                set: function (currency, code, save) {
                    api.currency = currency;
                    api.code = code || 'UG';
                    if (save !== false) {
                        try {
                            localStorage.setItem(store + '_curr', currency);
                            localStorage.setItem(store + '_code', api.code);
                        } catch (e) { /* private mode — just don't persist */ }
                    }
                    if (badge) badge.textContent = currency;
                    if (flag) flag.textContent = FLAGS[api.code] || '🌍';

                    var phone = document.getElementById('client-number');
                    if (phone) phone.placeholder = PHONE[api.code] || PHONE.UG;

                    OrderKit.closeSheet('regionSheet');
                    opts.onChange(currency, api.code);
                },

                open: function () { OrderKit.openSheet('regionSheet'); }
            };

            var savedCurr, savedCode;
            try {
                savedCurr = localStorage.getItem(store + '_curr');
                savedCode = localStorage.getItem(store + '_code');
            } catch (e) { /* ignore */ }

            if (savedCurr && savedCode) {
                api.set(savedCurr, savedCode, false);
            } else {
                // first visit — we genuinely can't price without this
                var sheet = document.getElementById('regionSheet');
                if (sheet) sheet.dataset.dismissible = 'false';
                setTimeout(function () { OrderKit.openSheet('regionSheet'); }, 260);
            }

            document.querySelectorAll('[data-geo]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var parts = btn.dataset.geo.split(':'); // "UGX:UG"
                    var sheet = document.getElementById('regionSheet');
                    if (sheet) sheet.dataset.dismissible = 'true';
                    api.set(parts[0], parts[1], true);
                    OrderKit.haptic(12);
                });
            });

            var trigger = document.getElementById('regionBtn');
            if (trigger) trigger.addEventListener('click', api.open);

            return api;
        },

        /* ------------------------------------------------------- validation */

        /** Show an inline error under a field and focus it. */
        fieldError: function (fieldId, message) {
            var input = document.getElementById(fieldId);
            if (!input) return;
            var field = input.closest('.field');
            if (!field) return;
            field.classList.add('has-error');
            var err = field.querySelector('.field-err span');
            if (err && message) err.textContent = message;
            input.focus();
            OrderKit.haptic([18, 40, 18]);
        },

        clearErrors: function (scope) {
            (scope || document).querySelectorAll('.field.has-error')
                .forEach(function (f) { f.classList.remove('has-error'); });
        },

        /** Clear a field's error as soon as the customer starts fixing it. */
        wireFieldClearing: function () {
            document.querySelectorAll('.field input').forEach(function (input) {
                input.addEventListener('input', function () {
                    var field = input.closest('.field');
                    if (field) field.classList.remove('has-error');
                });
            });
        },

        /* ------------------------------------------------------- step rail */

        /**
         * @param {number} current 1-based index of the step being worked on
         * @param {number} done how many steps are fully complete
         */
        rail: function (current, done) {
            var items = document.querySelectorAll('.ord-rail li');
            Array.prototype.forEach.call(items, function (li, i) {
                var n = i + 1;
                li.classList.toggle('is-done', n <= done);
                li.classList.toggle('is-current', n === current && n > done);
            });
        },

        /* ----------------------------------------------------------- motion */

        reveal: function () {
            document.querySelectorAll('[data-stagger]').forEach(function (group) {
                Array.prototype.forEach.call(group.children, function (child, i) {
                    child.style.setProperty('--i', i);
                });
            });

            var targets = document.querySelectorAll('.r-up, [data-stagger]');
            if (reduceMotion || !('IntersectionObserver' in window)) {
                targets.forEach(function (el) { el.classList.add('is-in'); });
                return;
            }
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target); // checkout: reveal once, never re-hide
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
            targets.forEach(function (el) { io.observe(el); });
        },

        stickyNav: function () {
            var nav = document.querySelector('.ord-nav');
            if (!nav) return;
            var raf = null;
            var tick = function () {
                nav.classList.toggle('is-stuck', window.scrollY > 8);
                raf = null;
            };
            window.addEventListener('scroll', function () {
                if (raf) return;
                raf = requestAnimationFrame(tick);
            }, { passive: true });
            tick();
        },

        /** Scroll an element into a comfortable reading position. */
        scrollTo: function (id, delay) {
            setTimeout(function () {
                var el = document.getElementById(id);
                if (el) el.scrollIntoView({
                    behavior: reduceMotion ? 'auto' : 'smooth',
                    block: 'start'
                });
            }, delay || 0);
        },

        /* ------------------------------------------------------------ dock */

        setBusy: function (btnId, isBusy, busyLabel) {
            var btn = document.getElementById(btnId);
            if (!btn) return;
            var label = btn.querySelector('.cta-label');
            if (isBusy) {
                btn.dataset.idleLabel = label ? label.textContent : '';
                btn.classList.add('is-busy');
                if (label) label.textContent = busyLabel || 'Securing order…';
                var icon = btn.querySelector('.cta-icon');
                if (icon) icon.innerHTML = '<span class="spinner"></span>';
            } else {
                btn.classList.remove('is-busy');
                if (label && btn.dataset.idleLabel) label.textContent = btn.dataset.idleLabel;
            }
        },

        /* ------------------------------------------------- THE HAND-OFF ---
         * Logs the order to the Google Sheet, then opens WhatsApp with the
         * message pre-filled. The Sheets call is fire-and-forget on purpose:
         * a logging failure must never block a customer from reaching us.
         */
        send: function (cfg) {
            var payload = new URLSearchParams();
            payload.append('ClientName', cfg.sheet.ClientName);
            payload.append('Number', cfg.sheet.Number);
            payload.append('Service', cfg.sheet.Service);
            payload.append('Package', cfg.sheet.Package);
            payload.append('Price', cfg.sheet.Price);
            payload.append('Referrer', cfg.sheet.Referrer);

            var go = function () {
                window.location.href = 'https://wa.me/' + cfg.whatsapp +
                    '?text=' + encodeURIComponent(cfg.message);
            };

            try {
                var req = fetch(cfg.sheetUrl, {
                    method: 'POST',
                    body: payload,
                    mode: 'no-cors'
                });
                // hand off as soon as the log lands, but never wait more than
                // 1.2s for it — the customer's time matters more than the row
                var done = false;
                var fire = function () { if (!done) { done = true; go(); } };
                req.then(fire).catch(fire);
                setTimeout(fire, 1200);
            } catch (e) {
                go();
            }
        },

        /** Turn "+256 700 000 000" into the two shapes we need downstream. */
        phone: function (raw) {
            var clean = raw.replace(/\D/g, '');
            return {
                clean: clean,
                // leading apostrophe stops Sheets treating it as a number and
                // dropping the leading zero / rendering it in scientific form
                sheet: "'" + clean
            };
        },

        boot: function () {
            OrderKit.wireSheets();
            OrderKit.wireFieldClearing();
            OrderKit.reveal();
            OrderKit.stickyNav();
        }
    };

    window.OrderKit = OrderKit;

})(window, document);
