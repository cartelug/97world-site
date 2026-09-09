/**
 * 97 WORLD — ORDER WIZARD
 *
 * The compact checkout every order page shares:
 *
 *   region gate  ->  1. Package  ->  2. Checkout  ->  WhatsApp
 *
 * A page supplies data only (plans, gifts, proof, copy) — never behaviour.
 * That is the whole point: one flow, one set of bugs, one place to fix them.
 *
 * Depends on OrderKit (/assets/order.js) for money formatting, the phone
 * sanitiser, field errors and the Sheets + WhatsApp hand-off.
 */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    var REGIONS = P.REGIONS;
    var PROFILE_KEY = 'k97_checkout_profile';

    var Wizard = {

        REGIONS: REGIONS,

        cfg: null,
        state: {
            region: null,
            step: 1,
            service: null,
            plan: -1,
            intent: null,
            quickStart: false,
            referred: false,
            busy: false
        },

        $: function (id) { return document.getElementById(id); },

        /* A package can arrive from a Growth card, the subscription builder,
         * or a shareable ?plan= URL. Read it once, then keep it in wizard
         * state so changing currency cannot throw the customer's choice away. */
        captureIntent: function () {
            var pending = P.Pending.take(Wizard.cfg.platform);
            var planId = pending && pending.planId;
            var serviceId = pending && pending.serviceId;
            try {
                var params = new URLSearchParams(window.location.search);
                planId = params.get('plan') || planId;
                serviceId = params.get('service') || serviceId;
            } catch (e) { /* older webview: session hand-off still works */ }
            Wizard.state.intent = planId ? {
                planId: String(planId),
                serviceId: serviceId || null
            } : null;
            Wizard.state.quickStart = !!planId;
        },

        rememberPlan: function () {
            var plan = Wizard.selectedPlan();
            if (!plan) return;
            Wizard.state.intent = {
                planId: String(plan.id),
                serviceId: Wizard.state.service || null
            };
            try {
                var url = new URL(window.location.href);
                url.searchParams.set('plan', plan.id);
                if (Wizard.state.service) url.searchParams.set('service', Wizard.state.service);
                else url.searchParams.delete('service');
                window.history.replaceState({}, '', url.pathname + url.search + url.hash);
            } catch (e) { /* selection still lives in state */ }
        },

        clearPlanIntent: function () {
            Wizard.state.intent = null;
            Wizard.state.quickStart = false;
            try {
                var url = new URL(window.location.href);
                url.searchParams.delete('plan');
                if (Wizard.state.service) url.searchParams.set('service', Wizard.state.service);
                else url.searchParams.delete('service');
                window.history.replaceState({}, '', url.pathname + url.search + url.hash);
            } catch (e) { /* state remains correct */ }
        },

        loadProfile: function () {
            try {
                var saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
                if (!saved) return;
                if (saved.name) Wizard.$('client-name').value = saved.name;
                if (saved.phone) Wizard.$('client-number').value = saved.phone;
            } catch (e) { /* private mode */ }
        },

        saveProfile: function (name, phone) {
            try {
                localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name, phone: phone }));
            } catch (e) { /* private mode */ }
        },

        track: function (name, detail) {
            var payload = Object.assign({ event: name, platform: Wizard.cfg.platform }, detail || {});
            if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
            try { window.dispatchEvent(new CustomEvent('k97:order-event', { detail: payload })); }
            catch (e) { /* analytics must never block checkout */ }
        },

        /* --------------------------------------------------------- region */

        openGate: function () {
            var gate = Wizard.$('regionGate');
            var list = gate.querySelector('.region-grid');

            list.innerHTML = Object.keys(REGIONS).map(function (code) {
                var r = REGIONS[code];
                return '<button type="button" class="region-btn" data-region="' + code + '">' +
                    '<span class="flag">' + r.flag + '</span>' +
                    '<span class="rb-copy"><b>' + r.name + '</b><small>' + r.blurb + '</small></span>' +
                    '<i class="fas fa-chevron-right"></i>' +
                    '</button>';
            }).join('');

            list.addEventListener('click', function (e) {
                var btn = e.target.closest('.region-btn');
                if (btn) Wizard.setRegion(btn.dataset.region, true);
            });

            document.body.classList.add('is-locked');
        },

        setRegion: function (code, save) {
            var region = REGIONS[code];
            if (!region) return;
            Wizard.state.region = code;

            if (save !== false) P.Region.set(code);

            // region badge in the nav
            var badge = Wizard.$('regionBadge');
            var flag = Wizard.$('regionFlag');
            if (badge) badge.textContent = region.currency;
            if (flag) flag.textContent = region.flag;

            // phone placeholder + the payment methods this region can actually use
            var phone = Wizard.$('client-number');
            if (phone) phone.placeholder = region.phone;

            var pay = Wizard.$('payment-method');
            if (pay) {
                pay.innerHTML = region.payments.map(function (m) {
                    return '<option value="' + m + '">' + m + '</option>';
                }).join('');
            }

            // Re-price the same package when the region changes. The order
            // intent was captured once at boot and remains valid in state.
            var wanted = Wizard.state.intent;
            Wizard.state.plan = -1;
            if (wanted) {
                if (wanted.serviceId && Wizard.cfg.services) {
                    var has = Wizard.cfg.services.some(function (s) { return s.id === wanted.serviceId; });
                    if (has) { Wizard.state.service = wanted.serviceId; Wizard.renderServiceTabs(); }
                }
                Wizard.plans().forEach(function (plan, i) {
                    if (String(plan.id) === String(wanted.planId)) Wizard.state.plan = i;
                });
            }
            // one package means there is nothing to choose — asking for a tap
            // to confirm the only option is a step that buys nobody anything
            if (Wizard.state.plan === -1 && Wizard.plans().length === 1) {
                Wizard.state.plan = 0;
                Wizard.state.quickStart = true;
            }
            Wizard.renderPlans();
            Wizard.syncPlanBtn();
            Wizard.paintMoney();

            var gate = Wizard.$('regionGate');
            gate.hidden = true;
            document.body.classList.remove('is-locked');

            if (Wizard.state.quickStart && Wizard.state.plan !== -1) {
                Wizard.go(2);
            } else if (Wizard.state.step === 2 && Wizard.state.plan === -1) {
                Wizard.go(1, true);
            }
        },

        /* Any element carrying data-usd gets the figure in the region's own
         * currency. The bundle page's value stack uses this so its numbers can
         * never drift from pricing.js — there is still only one place a price
         * is defined. No-ops on pages without any. */
        paintMoney: function () {
            var currency = (REGIONS[Wizard.state.region] || {}).currency || 'UGX';
            var nodes = document.querySelectorAll('[data-usd]');
            for (var i = 0; i < nodes.length; i++) {
                var usd = Number(nodes[i].getAttribute('data-usd'));
                if (isNaN(usd)) continue;
                nodes[i].textContent = P.money(P.localPrice(usd, currency), currency);
            }
        },

        region: function () { return REGIONS[Wizard.state.region]; },

        /** Same 50/50 split shown everywhere else on the site — rounded
         *  once, balance is whatever's left, so the two always add back up
         *  to exactly the total. A page can override the fraction with
         *  cfg.depositPct (e.g. 1 for products paid in full, like a
         *  subscription term with nothing to deliver "gradually"). */
        split: function (price, currency) {
            var pct = typeof Wizard.cfg.depositPct === 'number' ? Wizard.cfg.depositPct : 0.5;
            var deposit = P.roundMoney(price * pct, currency);
            return { deposit: deposit, balance: price - deposit };
        },

        /* ------------------------------------------------------- services */

        /** The service tabs above the plan grid — only rendered when a
         * platform sells more than one priced service. Selecting a tab
         * re-prices the plan grid for that service. */
        renderServiceTabs: function () {
            var wrap = Wizard.$('svcTabs');
            if (!wrap) return;
            var services = Wizard.cfg.services || [];
            if (services.length < 2) { wrap.hidden = true; return; }
            wrap.hidden = false;
            if (!Wizard.state.service) Wizard.state.service = services[0].id;
            wrap.innerHTML = services.map(function (s) {
                var on = Wizard.state.service === s.id;
                return '<button type="button" class="svc-tab' + (on ? ' is-on' : '') + '"' +
                    ' data-service="' + s.id + '" aria-pressed="' + on + '">' + s.label + '</button>';
            }).join('');
        },

        /* ---------------------------------------------------------- plans */

        /** Plans for this platform's selected service, priced for the active region. */
        plans: function () {
            return P.plansFor(Wizard.cfg.platform, Wizard.state.region, Wizard.state.service);
        },

        renderPlans: function () {
            var currency = Wizard.region().currency;
            var plans = Wizard.plans();

            // A region this product genuinely isn't priced in yet (e.g. DR
            // Congo for a subscription only priced for Uganda/South Sudan)
            // — never an invented conversion, an honest dead end instead.
            if (!plans.length) {
                Wizard.$('plan-grid').innerHTML =
                    '<div class="plan-empty">' +
                        '<i class="fas fa-circle-info"></i>' +
                        '<p>We don\'t have this priced for ' + Wizard.region().name +
                            ' yet. Message us and we\'ll quote you directly.</p>' +
                        '<a href="https://wa.me/' + (Wizard.cfg.whatsapp || '') + '?text=' +
                            encodeURIComponent('Hi 97 World, can you quote me for ' + (Wizard.cfg.service || 'this') +
                                ' in ' + Wizard.region().name + '?') +
                            '" target="_blank" rel="noopener" class="oc-cta oc-cta--quiet">' +
                            '<i class="fab fa-whatsapp"></i> Ask on WhatsApp</a>' +
                    '</div>';
                return;
            }

            Wizard.$('plan-grid').innerHTML = plans.map(function (plan, i) {
                var on = Wizard.state.plan === i;
                return '<button type="button" class="plan-card' +
                    (on ? ' is-on' : '') + (plan.hero ? ' is-hero' : '') + '"' +
                    ' data-index="' + i + '" aria-pressed="' + on + '">' +
                    (plan.tag ? '<span class="tier-tag">' + plan.tag + '</span>' : '') +
                    '<span class="pc-top">' +
                        '<span class="pc-name">' + plan.name +
                            (plan.note ? '<small class="pc-note">' + plan.note + '</small>' : '') +
                        '</span>' +
                        '<span class="pc-price">' +
                            (plan.was ? '<span class="pc-old">' + OrderKit.money(plan.was, currency) + '</span>' : '') +
                            '<span class="pc-new">' + (currency === 'USD' ? '$' : '') + plan.price.toLocaleString() +
                                '<span class="pc-cur">' + currency + '</span></span>' +
                        '</span>' +
                    '</span>' +
                    '<ul class="pc-feats">' +
                        plan.feats.map(function (f) {
                            return '<li' + (f.gold ? ' class="is-gold"' : '') + '>' +
                                '<i class="' + f.icon + '"></i>' + f.text + '</li>';
                        }).join('') +
                    '</ul>' +
                    '</button>';
            }).join('');
        },

        selectedPlan: function () {
            return Wizard.state.plan === -1 ? null : Wizard.plans()[Wizard.state.plan];
        },

        syncPlanBtn: function () {
            var btn = Wizard.$('btn-step-1');
            var plan = Wizard.selectedPlan();
            btn.disabled = !plan;
            btn.querySelector('.wb-label').textContent = plan ? 'Continue with ' + plan.name : 'Choose a package';
            Wizard.syncTotal();
        },

        syncTotal: function () {
            var plan = Wizard.selectedPlan();
            var el = Wizard.$('total-value');
            var currency = Wizard.state.region ? Wizard.region().currency : 'UGX';
            var formatted = plan ? OrderKit.money(plan.price, currency) : '—';
            if (el) el.textContent = formatted;

            var name = Wizard.$('checkout-plan-name');
            var price = Wizard.$('checkout-plan-price');
            var feats = Wizard.$('checkout-plan-feats');
            if (name) name.textContent = plan ? (plan.label || plan.name) : '—';
            if (price) price.textContent = formatted;
            if (feats) {
                feats.innerHTML = plan ? plan.feats.map(function (f) {
                    return '<li><i class="' + f.icon + '"></i>' + f.text + '</li>';
                }).join('') : '';
            }

            var splitWrap = Wizard.$('checkout-split');
            if (splitWrap && plan) {
                var split = Wizard.split(plan.price, currency);
                splitWrap.hidden = split.balance <= 0;
                if (split.balance > 0) {
                    var pct = Math.round((split.deposit / plan.price) * 100);
                    Wizard.$('checkout-deposit-label').textContent = 'Pay now (' + pct + '%)';
                    Wizard.$('checkout-deposit').textContent = OrderKit.money(split.deposit, currency);
                    Wizard.$('checkout-balance').textContent = OrderKit.money(split.balance, currency);
                }
            } else if (splitWrap) {
                splitWrap.hidden = true;
            }
        },

        /* ---------------------------------------------------------- gifts */

        renderGifts: function () {
            Wizard.$('gift-list').innerHTML = Wizard.cfg.gifts.map(function (gift) {
                return '<div class="gift gift--included">' +
                    '<span class="gift-ic"><i class="fas ' + gift.icon + '"></i></span>' +
                    '<span class="gift-copy"><b>' + gift.title + '</b><small>' + gift.sub + '</small></span>' +
                    '<span class="gift-state"><i class="fas fa-check"></i> Included</span>' +
                    '</div>';
            }).join('');
        },

        /* ---------------------------------------------------------- proof */

        renderProof: function () {
            Wizard.$('proof-list').innerHTML = Wizard.cfg.proof.map(function (row) {
                return '<div class="proof-row">' +
                    '<i class="fas ' + row.icon + '"></i>' +
                    '<div><b>' + row.title + '</b><p>' + row.body + '</p></div>' +
                    '</div>';
            }).join('');
        },

        /* ----------------------------------------------------------- flow */

        go: function (step, quiet) {
            Wizard.state.step = step;
            document.querySelectorAll('.wiz-step').forEach(function (pane) {
                pane.classList.toggle('is-on', Number(pane.dataset.step) === step);
            });
            document.querySelectorAll('.wiz-track li').forEach(function (li, i) {
                li.classList.toggle('is-on', i + 1 <= step);
                if (i + 1 === step) li.setAttribute('aria-current', 'step');
                else li.removeAttribute('aria-current');
            });
            if (step === 2) {
                Wizard.syncTotal();
                Wizard.track('checkout_open', {
                    planId: Wizard.selectedPlan() ? Wizard.selectedPlan().id : null,
                    region: Wizard.state.region
                });
            }
            if (!quiet) OrderKit.scrollTo('wizardCard', 40);
        },

        /* ----------------------------------------------------- validation */

        validate: function () {
            var plan = Wizard.selectedPlan();
            if (!plan) { Wizard.go(1); return null; }

            OrderKit.clearErrors();

            var target = null;
            var targetEl = Wizard.$('target-handle');
            if (targetEl) {
                target = targetEl.value.trim().replace(/^@/, '');
                if (!target) {
                    OrderKit.fieldError('target-handle', Wizard.cfg.targetError || 'We need this to deliver');
                    return null;
                }
            }

            var name = Wizard.$('client-name').value.trim();
            if (name.length < 2) {
                OrderKit.fieldError('client-name', 'Please enter your name');
                return null;
            }

            var raw = Wizard.$('client-number').value.trim();
            if (raw.replace(/\D/g, '').length < 8) {
                OrderKit.fieldError('client-number', 'Enter a valid WhatsApp number');
                return null;
            }

            var referrer = 'Direct';
            if (Wizard.state.referred) {
                var typed = Wizard.$('ref-code').value.trim();
                if (typed) referrer = typed;
            }

            // one optional extra choice (the bundle page uses it for platform)
            var extraEl = Wizard.$('extra-select');

            return {
                plan: plan,
                name: name,
                phone: OrderKit.phone(raw),
                rawPhone: raw,
                target: target,
                extra: extraEl ? extraEl.value : null,
                payment: Wizard.$('payment-method').value,
                referrer: referrer
            };
        },

        confirm: function () {
            if (Wizard.state.busy) return;
            var order = Wizard.validate();
            if (!order) return;

            Wizard.state.busy = true;
            var btn = Wizard.$('btn-submit');
            btn.classList.add('is-busy');
            btn.disabled = true;
            btn.querySelector('.cta-label').textContent = 'Opening WhatsApp…';
            btn.querySelector('.cta-icon').innerHTML = '<span class="spinner"></span>';

            var region = Wizard.region();
            var total = OrderKit.money(order.plan.price, region.currency);
            var service = Wizard.cfg.service;

            var split = Wizard.split(order.plan.price, region.currency);
            var splitLines = '';
            if (split.balance > 0) {
                var pctLabel = Math.round((split.deposit / order.plan.price) * 100);
                splitLines = '*Pay now (' + pctLabel + '%):* ' + OrderKit.money(split.deposit, region.currency) + '\n' +
                    '*Balance on delivery:* ' + OrderKit.money(split.balance, region.currency) + '\n';
            }

            var message = '*NEW ORDER [' + region.name.toUpperCase() + ']*\n\n' +
                '*Service:* ' + service + '\n' +
                '*Package:* ' + (order.plan.label || order.plan.name) + '\n' +
                '*Price:* ' + total + '\n' +
                splitLines +
                '*Referrer:* ' + order.referrer + '\n\n' +
                '*Name:* ' + order.name + '\n' +
                '*WhatsApp:* ' + order.phone.clean + '\n' +
                (order.extra ? '*' + (Wizard.cfg.extraLabel || 'Choice') + ':* ' + order.extra + '\n' : '') +
                (order.target ? '*' + (Wizard.cfg.targetLabel || 'Account') + ':* ' + order.target + '\n' : '') +
                '*Payment Method:* ' + order.payment;

            // Regular platform pages sell a serviceId+quantity tier; the
            // bundle and website pages sell a fixed plan.id with no
            // quantity — same distinction Wizard.plans()/plansFor() already
            // draws, just carried over into what the Worker records. A
            // subscription page (no service tabs) also has no
            // Wizard.state.service to fall back on, so it's recorded as
            // "quantity months of <platform key>" — e.g. "6 x prime-video" —
            // not as a bundle, since it isn't one.
            var isFixedPlan = Wizard.cfg.platform === 'bundle' || Wizard.cfg.platform === 'website';
            var subKey = P.SUBSCRIPTIONS[Wizard.cfg.platform] ? Wizard.cfg.platform : null;

            Wizard.saveProfile(order.name, order.rawPhone);
            Wizard.track('checkout_submit', {
                planId: order.plan.id,
                serviceId: isFixedPlan ? null : (subKey || Wizard.state.service || null),
                region: Wizard.state.region,
                currency: region.currency,
                amount: order.plan.price
            });
            Wizard.track('whatsapp_order_start', {
                planId: order.plan.id,
                region: Wizard.state.region
            });

            OrderKit.send({
                sheetUrl: Wizard.cfg.sheetUrl,
                whatsapp: Wizard.cfg.whatsapp,
                message: message,
                sheet: {
                    ClientName: order.name,
                    Number: order.phone.sheet,
                    Service: service + ' [' + region.currency + ']',
                    Package: (order.plan.label || order.plan.name) +
                        (order.extra ? ' [' + order.extra + ']' : '') +
                        (order.target ? ' [Target: ' + order.target + ']' : '') +
                        ' [Pay: ' + order.payment + ']',
                    Price: String(order.plan.price),
                    Referrer: order.referrer
                },
                worker: Wizard.cfg.apiBase ? {
                    apiBase: Wizard.cfg.apiBase,
                    body: {
                        serviceId: isFixedPlan ? null : (subKey || Wizard.state.service || null),
                        bundleId: isFixedPlan ? order.plan.id : null,
                        quantity: isFixedPlan ? null : (parseInt(order.plan.id, 10) || null),
                        link: order.target || order.extra || service,
                        name: order.name,
                        phone: order.phone.clean,
                        region: Wizard.state.region,
                        referrer: order.referrer,
                        payment: order.payment,
                        amount: order.plan.price,
                        currency: region.currency,
                        deposit: split.deposit,
                        balance: split.balance
                    }
                } : null
            });

            setTimeout(function () {
                Wizard.state.busy = false;
                btn.classList.remove('is-busy');
                btn.disabled = false;
                btn.querySelector('.cta-label').textContent = 'Confirm on WhatsApp';
                btn.querySelector('.cta-icon').innerHTML = '<i class="fab fa-whatsapp"></i>';
            }, 6000);
        },

        /* ----------------------------------------------------------- boot */

        start: function (cfg) {
            Wizard.cfg = cfg;
            OrderKit.boot();
            Wizard.captureIntent();

            Wizard.renderGifts();
            Wizard.renderProof();
            Wizard.renderServiceTabs();
            Wizard.loadProfile();

            if (cfg.fixedRegion) {
                // A single-currency product (e.g. a subscription priced only
                // in UGX) has nothing for the gate to offer — asking someone
                // to "pick a region" when there's only one real price would
                // be theatre, not a choice.
                Wizard.setRegion(cfg.fixedRegion, false);
            } else {
                Wizard.openGate();
                // the home page (or an earlier order) already told us where they are
                var saved = P.Region.get();
                if (saved) Wizard.setRegion(saved, false);
            }

            var trigger = Wizard.$('regionBtn');
            if (trigger) {
                trigger.addEventListener('click', function () {
                    if (Wizard.cfg.fixedRegion) return;
                    Wizard.$('regionGate').hidden = false;
                    document.body.classList.add('is-locked');
                });
            }

            Wizard.$('plan-grid').addEventListener('click', function (e) {
                var card = e.target.closest('.plan-card');
                if (!card) return;
                Wizard.state.plan = Number(card.dataset.index);
                Wizard.renderPlans();
                Wizard.rememberPlan();
                Wizard.syncPlanBtn();
                OrderKit.haptic(14);
                Wizard.track('plan_select', {
                    planId: Wizard.selectedPlan().id,
                    serviceId: Wizard.state.service,
                    region: Wizard.state.region
                });
                window.setTimeout(function () { Wizard.go(2); }, 150);
            });

            var svcTabs = Wizard.$('svcTabs');
            if (svcTabs) {
                svcTabs.addEventListener('click', function (e) {
                    var tab = e.target.closest('.svc-tab');
                    if (!tab || tab.dataset.service === Wizard.state.service) return;
                    Wizard.state.service = tab.dataset.service;
                    Wizard.state.plan = -1;
                    Wizard.clearPlanIntent();
                    Wizard.renderServiceTabs();
                    Wizard.renderPlans();
                    Wizard.syncPlanBtn();
                    OrderKit.haptic(14);
                });
            }

            document.querySelectorAll('[data-go]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    if (btn.disabled) return;
                    var next = Number(btn.dataset.go);
                    if (next === 1) Wizard.state.quickStart = false;
                    Wizard.go(next);
                });
            });

            var setReferred = function (yes) {
                Wizard.state.referred = yes;
                Wizard.$('ref-yes').classList.toggle('is-on', yes);
                Wizard.$('ref-yes').setAttribute('aria-pressed', String(yes));
                Wizard.$('ref-no').classList.toggle('is-on', !yes);
                Wizard.$('ref-no').setAttribute('aria-pressed', String(!yes));
                Wizard.$('ref-drawer').classList.toggle('is-open', yes);
                if (yes) setTimeout(function () { Wizard.$('ref-code').focus(); }, 260);
                else Wizard.$('ref-code').value = '';
            };
            Wizard.$('ref-yes').addEventListener('click', function () { setReferred(true); });
            Wizard.$('ref-no').addEventListener('click', function () { setReferred(false); });

            document.querySelectorAll('.field input').forEach(function (input) {
                input.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') { e.preventDefault(); Wizard.confirm(); }
                });
            });

            Wizard.$('btn-submit').addEventListener('click', Wizard.confirm);

            if (Wizard.state.step !== 2) Wizard.go(1, true);
        }
    };

    window.OrderWizard = Wizard;

})(window, document);
