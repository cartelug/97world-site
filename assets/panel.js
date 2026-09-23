/**
 * 97 WORLD — ORDER PANEL KIT
 *
 * The machinery /growth/ and /subs/ share, so the two order panels behave
 * identically: the searchable dropdown, bottom sheets, the phone order bar,
 * the payment picker with its deposit codes, and a WhatsApp button that
 * can't get stuck. Each page keeps its own data, form flow and message —
 * this file holds nothing about what is being sold.
 *
 * Requires nothing but the DOM; uses window.Motion for value rolls when
 * motion.js is on the page.
 */
(function (window, document) {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function haptic() { if (navigator.vibrate && !reduceMotion) navigator.vibrate(9); }

    function roll(el, text) {
        if (window.Motion) window.Motion.roll(el, text);
        else if (el) el.textContent = text;
    }

    /** One-shot attention shake — the moment a field becomes invalid, not a
     *  loop that keeps firing while it stays that way. */
    function shake(el) {
        if (!el || reduceMotion) return;
        el.classList.remove('is-shake');
        void el.offsetWidth;
        el.classList.add('is-shake');
        window.setTimeout(function () { el.classList.remove('is-shake'); }, 450);
        haptic();
    }

    /* ------------------------------------------------------------ sheets --- */

    var sheetListeners = [];
    function onSheet(fn) { sheetListeners.push(fn); }
    function sheetChanged() { sheetListeners.forEach(function (fn) { fn(); }); }

    function openSheet(id) {
        var el = $(id);
        if (!el) return;
        el.classList.add('is-open');
        document.body.classList.add('is-locked');

        // the sheet's contents arrive as a short wave behind the slide-up,
        // so the eye lands on the order before the form fields
        var card = el.querySelector('.sheet-card');
        if (card && !reduceMotion) {
            Array.prototype.forEach.call(card.children, function (c, i) { c.style.setProperty('--i', i); });
            card.classList.remove('is-entering');
            void card.offsetWidth;
            card.classList.add('is-entering');
            window.clearTimeout(card._enterT);
            card._enterT = window.setTimeout(function () { card.classList.remove('is-entering'); }, 800);
        }
        sheetChanged();
    }
    function closeSheet(id) {
        var el = $(id);
        if (!el) return;
        el.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        sheetChanged();
    }

    document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        var closer = t.closest('[data-close]');
        if (closer) { closeSheet(closer.dataset.close); return; }
        if (t.classList && t.classList.contains('sheet')) closeSheet(t.id);
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

    /* ------------------------------------------------------- order bar ---
     * Phones only (CSS hides it on desktop, where the summary sits beside
     * the form). It appears once there's a priced order and `watch` — the
     * in-card button — has scrolled out of view, and gets out of the way of
     * any open sheet. */
    function Bar(opts) {
        var bar = opts.bar;
        var ready = false;
        var watchInView = true;

        function update() {
            if (!bar) return;
            var show = ready && !watchInView && !document.body.classList.contains('is-locked');
            if (show === bar.classList.contains('is-on')) return;
            bar.classList.toggle('is-on', show);
            bar.setAttribute('aria-hidden', String(!show));
            if (opts.btn) opts.btn.tabIndex = show ? 0 : -1;
            document.body.classList.toggle('has-bar', show);
        }

        onSheet(update);
        if (opts.watch && 'IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                watchInView = entries[0].isIntersecting;
                update();
            }).observe(opts.watch);
        }
        if (opts.btn && opts.onGo) opts.btn.addEventListener('click', opts.onGo);

        return { setReady: function (v) { ready = !!v; update(); } };
    }

    /* ----------------------------------------------------------- payment ---
     * Options come straight from a region's `payments` list in pricing.js.
     * A label carrying " — Code 123456" is split so the network reads as the
     * option and the code gets its own big, copyable panel — it's the number
     * the customer will type into their phone a minute from now. */

    function payMeta(label) {
        if (/mtn/i.test(label)) return { icon: 'fas fa-mobile-screen-button', color: '#FFCC08' };
        if (/airtel/i.test(label)) return { icon: 'fas fa-mobile-screen-button', color: '#ED1C24' };
        if (/agent/i.test(label)) return { icon: 'fas fa-handshake', color: null };
        if (/cash/i.test(label)) return { icon: 'fas fa-money-bill-wave', color: null };
        return { icon: 'fas fa-wallet', color: null };
    }

    /** "MTN Mobile Money — Code 196514" → { name, code }. Labels without a
     *  code (the agent deposit) come back with code: null. */
    function payParts(label) {
        var m = /^(.*?)\s+—\s+Code\s+(\S+)$/.exec(label || '');
        return m ? { name: m[1], code: m[2] } : { name: label, code: null };
    }

    function copyText(text, onDone) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onDone, function () {});
            return;
        }
        var t = document.createElement('textarea');
        t.value = text;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        try { if (document.execCommand('copy')) onDone(); } catch (e) { /* nothing to copy with */ }
        document.body.removeChild(t);
    }

    /** opts: { grid, code, label, codeLead } — codeLead(name) is the line
     *  above the code, since when to pay differs by what's being sold. */
    function Payment(opts) {
        var choice = null;

        function paintCode(animate) {
            var box = opts.code;
            if (!box) return;
            var p = choice ? payParts(choice) : null;
            if (!p || !p.code) { box.hidden = true; box.innerHTML = ''; return; }
            box.hidden = false;
            box.innerHTML =
                '<span class="pay-code-copy"><small>' + opts.codeLead(p.name) + '</small>' +
                '<b>' + p.code + '</b></span>' +
                '<button type="button" class="pay-copy m-press" data-code="' + p.code + '">' +
                    '<i class="far fa-copy" aria-hidden="true"></i> <span>Copy</span></button>';
            if (animate && !reduceMotion) {
                box.classList.remove('is-swap');
                void box.offsetWidth;
                box.classList.add('is-swap');
            }
        }

        function render(options) {
            options = options || [];
            if (options.indexOf(choice) === -1) choice = options[0] || null;
            if (opts.label) opts.label.textContent = options.length > 1 ? 'How will you pay?' : 'How you’ll pay';
            opts.grid.innerHTML = options.map(function (label) {
                var m = payMeta(label);
                var p = payParts(label);
                var on = label === choice;
                return '<button type="button" class="pay-opt m-press' + (on ? ' is-on' : '') + '"' +
                    ' data-pay="' + encodeURIComponent(label) + '" aria-pressed="' + on + '">' +
                    '<i class="' + m.icon + ' pay-ic"' + (m.color ? ' style="color:' + m.color + '"' : '') + '></i>' +
                    '<span class="pay-txt"><b>' + p.name + '</b>' +
                        (p.code ? '<small>Code ' + p.code + '</small>' : '') + '</span>' +
                    '<span class="pay-tick"><i class="fas fa-check"></i></span>' +
                    '</button>';
            }).join('');
            paintCode(false);
        }

        opts.grid.addEventListener('click', function (e) {
            var b = e.target.closest('[data-pay]');
            if (!b) return;
            choice = decodeURIComponent(b.dataset.pay);
            opts.grid.querySelectorAll('[data-pay]').forEach(function (x) {
                var on = x === b;
                x.classList.toggle('is-on', on);
                x.setAttribute('aria-pressed', String(on));
            });
            paintCode(true);
            haptic();
        });

        if (opts.code) {
            opts.code.addEventListener('click', function (e) {
                var b = e.target.closest('[data-code]');
                if (!b) return;
                copyText(b.dataset.code, function () {
                    b.classList.add('is-done');
                    b.querySelector('i').className = 'fas fa-check';
                    b.querySelector('span').textContent = 'Copied';
                    haptic();
                    window.setTimeout(function () {
                        b.classList.remove('is-done');
                        b.querySelector('i').className = 'far fa-copy';
                        b.querySelector('span').textContent = 'Copy';
                    }, 1600);
                });
            });
        }

        return { render: render, value: function () { return choice; } };
    }

    /* ------------------------------------------------------- send button ---
     * wa.me hands off to the WhatsApp app on phones and the page stays where
     * it was — so the button can't be left disabled on "Opening WhatsApp…",
     * or anyone who comes back to fix a detail is stuck. */
    function SendButton(btn) {
        var timer = null;
        var label = btn.querySelector('.rev-send-label');

        function ready(text) {
            window.clearTimeout(timer);
            btn.disabled = false;
            btn.classList.remove('is-busy');
            label.textContent = text;
        }
        function busy() {
            btn.disabled = true;
            btn.classList.add('is-busy');
            label.textContent = 'Opening WhatsApp…';
            window.clearTimeout(timer);
            timer = window.setTimeout(function () { ready('Open WhatsApp again'); }, 4000);
        }
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden && btn.disabled) ready('Open WhatsApp again');
        });
        window.addEventListener('pageshow', function (e) {
            if (e.persisted && btn.disabled) ready('Open WhatsApp again');
        });
        return { ready: ready, busy: busy };
    }

    /** Marks step n of a <ol> of steps as current and the ones before as done. */
    function setStep(list, n) {
        if (!list) return;
        list.querySelectorAll('li').forEach(function (li, i) {
            li.classList.toggle('is-done', i < n - 1);
            li.classList.toggle('is-on', i === n - 1);
        });
    }

    window.K97Panel = {
        reduceMotion: reduceMotion,
        haptic: haptic,
        roll: roll,
        shake: shake,
        openSheet: openSheet,
        closeSheet: closeSheet,
        onSheet: onSheet,
        Combo: Combo,
        Bar: Bar,
        Payment: Payment,
        SendButton: SendButton,
        setStep: setStep
    };
})(window, document);
