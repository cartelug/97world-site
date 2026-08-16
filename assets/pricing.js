/**
 * 97 WORLD — PRICING
 *
 * The one place prices and regions are defined. The home page's price builder
 * and every order page read from here, so a price can never say one thing on
 * the home page and another at checkout.
 *
 * Everything is declared in USD. UGX is derived at 3,750 UGX = $1 — the rate
 * already encoded in the original Facebook and YouTube tables, so converting
 * reproduces those prices exactly instead of inventing new ones.
 */
(function (window) {
    'use strict';

    var UGX_PER_USD = 3750;

    var REGIONS = {
        UG: {
            name: 'Uganda',
            currency: 'UGX',
            flag: '🇺🇬',
            blurb: 'Prices in UGX · Mobile Money',
            phone: 'e.g. +256 700 000 000',
            payments: ['MTN Mobile Money', 'Airtel Money', 'Cash in office (Kampala)']
        },
        SS: {
            name: 'South Sudan',
            currency: 'USD',
            flag: '🇸🇸',
            blurb: 'Prices in USD',
            phone: 'e.g. +211 900 000 000',
            payments: ['Mobile Money via agent', 'Cash in South Sudan']
        },
        CD: {
            name: 'DR Congo',
            currency: 'USD',
            flag: '🇨🇩',
            blurb: 'Prices in USD',
            phone: 'e.g. +243 800 000 000',
            payments: ['Mobile Money', 'Cash on delivery']
        }
    };

    /* ------------------------------------------------------------- plans ---
     *   10,000 followers ......... $100   (375,000 UGX)
     *   all three together ....... $250   (937,500 UGX)
     * ---------------------------------------------------------------------- */

    // A single platform: followers only.
    function followerPlans() {
        return [
            {
                id: 'f10',
                name: '10,000 followers',
                short: '10k followers',
                usd: 100,
                tag: 'Best seller',
                hero: true,
                label: '10,000 followers',
                feats: [
                    { icon: 'fas fa-user-plus', text: '10,000 followers', gold: true },
                    { icon: 'fas fa-gauge-simple', text: 'Gradual, natural pace' },
                    { icon: 'fas fa-rotate-left', text: '30-day refill' }
                ]
            },
            {
                id: 'f3',
                name: '3,000 followers',
                short: '3k followers',
                usd: 35,
                tag: 'Starter',
                label: '3,000 followers',
                feats: [
                    { icon: 'fas fa-user-plus', text: '3,000 followers' },
                    { icon: 'fas fa-gauge-simple', text: 'Gradual, natural pace' }
                ]
            }
        ];
    }

    // The bundle: the same 10,000 followers, on all three platforms at once.
    // $100 each bought separately is $300, so the bundle saves $50.
    var bundlePlans = [
        {
            id: 'all3',
            name: 'All three platforms',
            short: 'All 3',
            note: 'Instagram + TikTok + Facebook',
            usd: 250,
            wasUsd: 300,
            tag: 'Best value',
            hero: true,
            label: 'All 3 — 10,000 followers each on Instagram, TikTok and Facebook',
            feats: [
                { icon: 'fab fa-instagram', text: '10,000 on Instagram', gold: true },
                { icon: 'fab fa-tiktok', text: '10,000 on TikTok' },
                { icon: 'fab fa-facebook-f', text: '10,000 on Facebook' },
                { icon: 'fas fa-rotate-left', text: '30-day refill' }
            ]
        }
    ];

    // YouTube keeps its own ladder. Declared in USD; converting reproduces the
    // original UGX prices exactly (262,500 / 412,500 / 600,000 / ...).
    var youtubePlans = [
        { id: 'yt5', name: 'Domination', short: 'Domination', usd: 400, tag: 'Max impact', hero: true, label: 'Domination Tier',
          feats: [{ icon: 'fas fa-users', text: '10k subs', gold: true }, { icon: 'fas fa-eye', text: '15k views' }, { icon: 'fas fa-thumbs-up', text: '10k likes' }] },
        { id: 'yt4', name: 'Viral', short: 'Viral', usd: 310, label: 'Viral Tier',
          feats: [{ icon: 'fas fa-users', text: '7.5k subs' }, { icon: 'fas fa-eye', text: '13k views' }, { icon: 'fas fa-thumbs-up', text: '8k likes' }] },
        { id: 'yt3', name: 'Authority', short: 'Authority', usd: 230, label: 'Authority Tier',
          feats: [{ icon: 'fas fa-users', text: '5.5k subs' }, { icon: 'fas fa-eye', text: '11k views' }, { icon: 'fas fa-thumbs-up', text: '6.5k likes' }] },
        { id: 'yt2', name: 'Growth', short: 'Growth', usd: 160, tag: 'Most popular', label: 'Growth Tier',
          feats: [{ icon: 'fas fa-users', text: '3.5k subs' }, { icon: 'fas fa-eye', text: '9k views' }, { icon: 'fas fa-thumbs-up', text: '5k likes' }] },
        { id: 'yt1', name: 'Kickstart', short: 'Kickstart', usd: 110, label: 'Kickstart Tier',
          feats: [{ icon: 'fas fa-users', text: '2k subs' }, { icon: 'fas fa-eye', text: '7k views' }, { icon: 'fas fa-thumbs-up', text: '3.5k likes' }] },
        { id: 'yt0', name: 'Starter', short: 'Starter', usd: 70, tag: 'Starter', label: 'Starter Tier',
          feats: [{ icon: 'fas fa-users', text: '1k subs' }, { icon: 'fas fa-eye', text: '5k views' }, { icon: 'fas fa-thumbs-up', text: '2k likes' }] }
    ];

    var PLATFORMS = {
        ig: { key: 'ig', name: 'Instagram', logo: '/IMAGES/instagram.png', href: '/instagram-boost/', plans: followerPlans() },
        tt: { key: 'tt', name: 'TikTok',    logo: '/IMAGES/tiktok.png',    href: '/tiktok-boost/',    plans: followerPlans() },
        fb: { key: 'fb', name: 'Facebook',  logo: '/IMAGES/facebook.png',  href: '/facebook-boost/',  plans: followerPlans() },
        yt: { key: 'yt', name: 'YouTube',   logo: '/IMAGES/youtube.png',   href: '/youtube-boost/',   plans: youtubePlans },
        bundle: { key: 'bundle', name: 'All 3 platforms', logo: '/IMAGES/logo.png', href: '/boost-package/', plans: bundlePlans }
    };

    /* ---------------------------------------------------------- helpers --- */

    function localPrice(usd, currency) {
        return currency === 'UGX' ? usd * UGX_PER_USD : usd;
    }

    function money(amount, currency) {
        return currency === 'USD'
            ? '$' + amount.toLocaleString()
            : amount.toLocaleString() + ' UGX';
    }

    /** Plans for a platform, priced for a region. */
    function plansFor(platformKey, regionCode) {
        var platform = PLATFORMS[platformKey];
        if (!platform) return [];
        var currency = REGIONS[regionCode] ? REGIONS[regionCode].currency : 'UGX';
        return platform.plans.map(function (plan) {
            var out = {};
            for (var k in plan) { if (Object.prototype.hasOwnProperty.call(plan, k)) out[k] = plan[k]; }
            out.price = localPrice(plan.usd, currency);
            out.was = plan.wasUsd ? localPrice(plan.wasUsd, currency) : null;
            out.currency = currency;
            return out;
        });
    }

    /* ------------------------------------------------------------ region ---
     * One key for the whole site. Choosing a region on the home page means the
     * order pages never ask again.
     */
    var STORE_KEY = 'k97_region';
    var PENDING_KEY = 'k97_pending';

    var Region = {
        get: function () {
            try {
                var v = localStorage.getItem(STORE_KEY);
                return REGIONS[v] ? v : null;
            } catch (e) { return null; }
        },
        set: function (code) {
            if (!REGIONS[code]) return;
            try { localStorage.setItem(STORE_KEY, code); } catch (e) { /* private mode */ }
        },
        data: function (code) { return REGIONS[code] || REGIONS.UG; }
    };

    /** Hand a chosen plan from the home builder to the order page. */
    var Pending = {
        set: function (platformKey, planId) {
            try {
                sessionStorage.setItem(PENDING_KEY, platformKey + ':' + planId);
            } catch (e) { /* ignore */ }
        },
        take: function (platformKey) {
            try {
                var raw = sessionStorage.getItem(PENDING_KEY);
                if (!raw) return null;
                var parts = raw.split(':');
                if (parts[0] !== platformKey) return null;
                sessionStorage.removeItem(PENDING_KEY);
                return parts[1];
            } catch (e) { return null; }
        }
    };

    window.K97Pricing = {
        UGX_PER_USD: UGX_PER_USD,
        REGIONS: REGIONS,
        PLATFORMS: PLATFORMS,
        localPrice: localPrice,
        money: money,
        plansFor: plansFor,
        Region: Region,
        Pending: Pending
    };

})(window);
