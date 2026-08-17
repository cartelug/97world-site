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

    /* ------------------------------------------------------- the catalogue ---
     * Everything we can sell, in one searchable list.
     *
     * `usd` is only ever set where a retail price has actually been agreed.
     * Where it is null the service is real and orderable, but the price is
     * quoted on WhatsApp — we do not have a wholesale rate for it yet, and a
     * made-up number here would be a number someone gets charged.
     *
     * When the supplier rates land, filling in `usd` is the only change needed:
     * the listing, the search and the ordering already work.
     * -------------------------------------------------------------------- */

    var PLAT_META = {
        instagram: { name: 'Instagram', logo: '/IMAGES/instagram.png' },
        tiktok:    { name: 'TikTok',    logo: '/IMAGES/tiktok.png' },
        facebook:  { name: 'Facebook',  logo: '/IMAGES/facebook.png' },
        youtube:   { name: 'YouTube',   logo: '/IMAGES/youtube.png' },
        x:         { name: 'X',         logo: '/IMAGES/x.png' },
        whatsapp:  { name: 'WhatsApp',  icon: 'fab fa-whatsapp' },
        telegram:  { name: 'Telegram',  icon: 'fab fa-telegram' }
    };

    // The 4 platforms shown up front in the growth builder's step 1, and the
    // rest revealed behind "More platforms" — these are the only 7 platforms
    // we actually sell; nothing here should ever list a platform we don't.
    var PLATFORMS_PRIMARY = ['instagram', 'tiktok', 'youtube', 'facebook'];
    var PLATFORMS_SECONDARY = ['telegram', 'x', 'whatsapp'];

    function svc(id, platform, name, short, unit, sizes, href, keywords, popular) {
        return {
            id: id, platform: platform, name: name,
            short: short,               // compact label for step-2 buttons, e.g. "Reels views"
            unit: unit,
            sizes: sizes || null,       // [{ qty, usd, tag }] — usd null = quote
            href: href || null,         // an order page, or null for WhatsApp
            keywords: keywords || '',
            popular: !!popular          // shown before "More" is tapped in step 2
        };
    }

    var SERVICES = [
        /* --------------------------------------------------------- priced --- */
        svc('ig_followers', 'instagram', 'Instagram followers', 'Followers', 'followers',
            [{ qty: 10000, usd: 100, tag: 'Best seller' }, { qty: 3000, usd: 35 }],
            '/instagram-boost/', 'ig insta gram follow subs audience', true),
        svc('tt_followers', 'tiktok', 'TikTok followers', 'Followers', 'followers',
            [{ qty: 10000, usd: 100, tag: 'Best seller' }, { qty: 3000, usd: 35 }],
            '/tiktok-boost/', 'tik tok follow audience', true),
        svc('fb_followers', 'facebook', 'Facebook page followers', 'Followers', 'followers',
            [{ qty: 10000, usd: 100, tag: 'Best seller' }, { qty: 3000, usd: 35 }],
            '/facebook-boost/', 'fb face book page follow', true),
        svc('yt_package', 'youtube', 'YouTube growth package', 'Growth package', 'subs, views & likes',
            [{ qty: null, usd: 70, tag: 'From' }],
            '/youtube-boost/', 'yt you tube subscribers views likes watch channel', true),

        /* ------------------------------------------------- quoted on request --- */
        svc('ig_likes', 'instagram', 'Instagram post likes', 'Likes', 'likes', null, null, 'ig heart engagement', true),
        svc('ig_reels', 'instagram', 'Instagram reels views', 'Reels views', 'views', null, null, 'ig reel video plays', true),
        svc('ig_story', 'instagram', 'Instagram story views', 'Story views', 'views', null, null, 'ig stories'),
        svc('ig_comments', 'instagram', 'Instagram comments', 'Comments', 'comments', null, null, 'ig reply engagement'),
        svc('ig_saves', 'instagram', 'Instagram saves', 'Saves', 'saves', null, null, 'ig bookmark'),

        svc('tt_likes', 'tiktok', 'TikTok likes', 'Likes', 'likes', null, null, 'tik tok heart', true),
        svc('tt_views', 'tiktok', 'TikTok video views', 'Views', 'views', null, null, 'tik tok plays', true),
        svc('tt_shares', 'tiktok', 'TikTok shares', 'Shares', 'shares', null, null, 'tik tok repost'),
        svc('tt_live', 'tiktok', 'TikTok live views', 'Live viewers', 'viewers', null, null, 'tik tok stream live'),

        svc('fb_likes', 'facebook', 'Facebook page likes', 'Likes', 'likes', null, null, 'fb face book', true),
        svc('fb_views', 'facebook', 'Facebook video views', 'Views', 'views', null, null, 'fb watch plays', true),
        svc('fb_reactions', 'facebook', 'Facebook post reactions', 'Reactions', 'reactions', null, null, 'fb emoji love'),
        svc('fb_group', 'facebook', 'Facebook group members', 'Group members', 'members', null, null, 'fb join community'),

        svc('yt_views', 'youtube', 'YouTube views', 'Views', 'views', null, null, 'yt you tube plays', true),
        svc('yt_hours', 'youtube', 'YouTube watch hours', 'Watch hours', 'hours', null, null, 'yt monetisation 4000 partner', true),
        svc('yt_likes', 'youtube', 'YouTube likes', 'Likes', 'likes', null, null, 'yt thumbs'),
        svc('yt_comments', 'youtube', 'YouTube comments', 'Comments', 'comments', null, null, 'yt reply'),

        svc('wa_channel', 'whatsapp', 'WhatsApp channel followers', 'Channel followers', 'followers', null, null, 'whats app status broadcast', true),
        svc('wa_react', 'whatsapp', 'WhatsApp channel reactions', 'Reactions', 'reactions', null, null, 'whats app emoji', true),

        svc('tg_members', 'telegram', 'Telegram channel members', 'Channel members', 'members', null, null, 'tg join group', true),
        svc('tg_views', 'telegram', 'Telegram post views', 'Post views', 'views', null, null, 'tg plays', true),

        svc('x_followers', 'x', 'X followers', 'Followers', 'followers', null, null, 'twitter tweet follow', true),
        svc('x_likes', 'x', 'X likes', 'Likes', 'likes', null, null, 'twitter tweet heart', true)
    ];

    /** All services for one platform, popular ones first. */
    function servicesFor(platformKey) {
        return SERVICES.filter(function (s) { return s.platform === platformKey; })
            .sort(function (a, b) { return (b.popular ? 1 : 0) - (a.popular ? 1 : 0); });
    }

    /**
     * Free-text search, ranked. Every word must match somewhere, but a hit in
     * the service's own name counts for far more than one in its keywords —
     * otherwise searching "likes" surfaces a followers package that merely
     * mentions likes, ahead of the likes service itself.
     */
    function searchServices(query) {
        var q = String(query || '').trim().toLowerCase();
        if (!q) return [];
        var words = q.split(/\s+/);

        var scored = [];
        for (var i = 0; i < SERVICES.length; i++) {
            var s = SERVICES[i];
            var name = s.name.toLowerCase();
            var rest = (s.unit + ' ' + PLAT_META[s.platform].name + ' ' + s.keywords).toLowerCase();

            var score = 0, matchedAll = true;
            for (var w = 0; w < words.length; w++) {
                var word = words[w];
                if (name.indexOf(word) !== -1) score += 10;
                else if (rest.indexOf(word) !== -1) score += 1;
                else { matchedAll = false; break; }
            }
            if (!matchedAll) continue;

            if (name.indexOf(q) !== -1) score += 15;          // whole phrase in the name
            if (name.indexOf(q) === 0) score += 10;           // and at the front of it
            if (s.sizes && s.sizes[0] && s.sizes[0].usd != null) score += 2;  // priced edges it
            scored.push({ s: s, score: score, order: i });
        }

        scored.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
        return scored.map(function (x) { return x.s; });
    }

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
        PLAT_META: PLAT_META,
        PLATFORMS_PRIMARY: PLATFORMS_PRIMARY,
        PLATFORMS_SECONDARY: PLATFORMS_SECONDARY,
        SERVICES: SERVICES,
        servicesFor: servicesFor,
        searchServices: searchServices,
        localPrice: localPrice,
        money: money,
        plansFor: plansFor,
        Region: Region,
        Pending: Pending
    };

})(window);
