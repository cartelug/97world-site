/**
 * 97 WORLD — PRICING
 *
 * The one place prices and regions are defined. The home page's price builder
 * and every order page read from here, so a price can never say one thing on
 * one page and another at checkout.
 *
 * SERVICES is the single source of truth (Aug 2026 final price list). Every
 * priced service carries its full real quantity ladder in `sizes`. PLATFORMS
 * is a thin, derived view over SERVICES — for each platform it just lists
 * which services are sellable, in the order their tabs appear on that
 * platform's order page. There is nowhere else a price is typed twice.
 *
 * `sizes: null` means the service is real and orderable, but has no fixed
 * price table (custom-quantity quotes, e.g. comments, or genuinely bespoke
 * work) — it is quoted on WhatsApp. A made-up number here would be a number
 * someone gets charged, so we never invent one.
 *
 * Everything is declared in USD. UGX is derived at 3,750 UGX = $1.
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

    /* ---------------------------------------------------------- platforms --- */

    var PLAT_META = {
        instagram:  { name: 'Instagram',      logo: '/IMAGES/instagram.png', href: '/instagram-boost/' },
        tiktok:     { name: 'TikTok',         logo: '/IMAGES/tiktok.png',    href: '/tiktok-boost/' },
        facebook:   { name: 'Facebook',       logo: '/IMAGES/facebook.png',  href: '/facebook-boost/' },
        youtube:    { name: 'YouTube',        logo: '/IMAGES/youtube.png',   href: '/youtube-boost/' },
        x:          { name: 'X',              logo: '/IMAGES/x.png',        href: '/x-boost/' },
        telegram:   { name: 'Telegram',       icon: 'fab fa-telegram',       href: '/telegram-boost/' },
        whatsapp:   { name: 'WhatsApp',       icon: 'fab fa-whatsapp',       href: '/whatsapp-boost/' },
        linkedin:   { name: 'LinkedIn',       icon: 'fab fa-linkedin',       href: '/linkedin-boost/' },
        spotify:    { name: 'Spotify',        logo: '/IMAGES/spotify.png',   href: '/spotify-boost/' },
        audiomack:  { name: 'Audiomack',      icon: 'fas fa-music',          href: '/audiomack-boost/' },
        soundcloud: { name: 'SoundCloud',     icon: 'fab fa-soundcloud',     href: '/soundcloud-boost/' },
        webtraffic: { name: 'Website traffic',icon: 'fas fa-globe',          href: '/website-traffic/' }
    };

    // The 4 platforms shown up front in the growth builder's step 1, and the
    // rest revealed behind "More platforms" — these are the only 12 platforms
    // we actually sell; nothing here should ever list a platform we don't.
    var PLATFORMS_PRIMARY = ['instagram', 'tiktok', 'youtube', 'facebook'];
    var PLATFORMS_SECONDARY = ['telegram', 'x', 'whatsapp', 'linkedin', 'spotify', 'audiomack', 'soundcloud', 'webtraffic'];

    /* ------------------------------------------------------------ catalogue ---
     * `sizes` pairs are transcribed straight from the 97 World Final Service
     * Price List (Aug 2026). T(...) reads as [qty, usd, qty, usd, ...].
     * -------------------------------------------------------------------- */

    function T() {
        var out = [];
        for (var i = 0; i < arguments.length; i += 2) {
            out.push({ qty: arguments[i], usd: arguments[i + 1] });
        }
        return out;
    }

    function svc(id, platform, name, short, unit, sizes, keywords, popular, refillEligible) {
        return {
            id: id, platform: platform, name: name,
            short: short,               // compact label for step-2 buttons, e.g. "Reels views"
            unit: unit,
            sizes: sizes || null,       // [{ qty, usd }] — null = quoted on WhatsApp
            href: sizes ? (PLAT_META[platform] && PLAT_META[platform].href) : null,
            keywords: keywords || '',
            popular: !!popular,
            // followers/subscribers/members can drop after delivery and get
            // topped back up; likes/views/plays/reactions/traffic can't
            // "drop" the same way, so refill only ever applies to the former.
            refillEligible: !!refillEligible
        };
    }

    var SERVICES = [
        /* --------------------------------------------------------- Instagram --- */
        svc('ig_followers', 'instagram', 'Instagram followers', 'Followers', 'followers',
            T(500,15, 1000,25, 2500,50, 5000,70, 10000,100, 25000,250),
            'ig insta gram follow subs audience', true, true),
        svc('ig_likes', 'instagram', 'Instagram post likes', 'Likes', 'likes',
            T(500,5, 1000,8, 5000,20, 10000,35, 25000,70, 50000,120),
            'ig heart engagement', true, false),
        svc('ig_reels', 'instagram', 'Instagram reel & video views', 'Reel views', 'views',
            T(10000,10, 50000,25, 100000,40, 500000,150),
            'ig reel video plays', true, false),
        svc('ig_story', 'instagram', 'Instagram story views', 'Story views', 'views',
            T(1000,5, 5000,15, 10000,25, 25000,50, 50000,90),
            'ig stories', false, false),
        svc('ig_comments', 'instagram', 'Instagram comments', 'Comments', 'comments', null,
            'ig reply engagement custom quote', false, false),
        svc('ig_saves', 'instagram', 'Instagram saves', 'Saves', 'saves', null,
            'ig bookmark', false, false),

        /* ------------------------------------------------------------ TikTok --- */
        svc('tt_followers', 'tiktok', 'TikTok followers', 'Followers', 'followers',
            T(500,15, 1000,25, 2500,50, 5000,70, 10000,100, 25000,250),
            'tik tok follow audience', true, true),
        svc('tt_likes', 'tiktok', 'TikTok likes', 'Likes', 'likes',
            T(500,5, 1000,8, 5000,25, 10000,40, 25000,80, 50000,140),
            'tik tok heart', true, false),
        svc('tt_views', 'tiktok', 'TikTok video views', 'Views', 'views',
            T(10000,12, 50000,35, 100000,55, 500000,180),
            'tik tok plays', true, false),
        svc('tt_shares', 'tiktok', 'TikTok shares', 'Shares', 'shares', null,
            'tik tok repost custom quote', false, false),
        svc('tt_live', 'tiktok', 'TikTok live views', 'Live viewers', 'viewers', null,
            'tik tok stream live custom quote', false, false),

        /* ---------------------------------------------------------- Facebook --- */
        svc('fb_followers', 'facebook', 'Facebook page followers', 'Followers', 'followers',
            T(500,15, 1000,25, 2500,50, 5000,70, 10000,100, 25000,250),
            'fb face book page follow', true, true),
        svc('fb_likes', 'facebook', 'Facebook page likes', 'Page likes', 'likes',
            T(500,10, 1000,18, 2500,40, 5000,70, 10000,120),
            'fb face book', true, false),
        svc('fb_reactions', 'facebook', 'Facebook post likes & reactions', 'Post reactions', 'reactions',
            T(500,8, 1000,12, 2500,25, 5000,45, 10000,80),
            'fb emoji love', true, false),
        svc('fb_views', 'facebook', 'Facebook video & reel views', 'Views', 'views',
            T(10000,12, 50000,35, 100000,55),
            'fb watch plays', true, false),
        svc('fb_group', 'facebook', 'Facebook group members', 'Group members', 'members', null,
            'fb join community custom quote', false, true),

        /* ----------------------------------------------------------- YouTube --- */
        svc('yt_subs', 'youtube', 'YouTube subscribers', 'Subscribers', 'subscribers',
            T(500,35, 1000,65, 2500,150, 5000,280, 10000,520),
            'yt you tube subscribers channel', true, true),
        svc('yt_views', 'youtube', 'YouTube views', 'Views', 'views',
            T(1000,8, 5000,20, 10000,35, 25000,75, 50000,130, 100000,220),
            'yt you tube plays', true, false),
        svc('yt_likes', 'youtube', 'YouTube likes', 'Likes', 'likes',
            T(500,5, 1000,10, 5000,35, 10000,60, 25000,120, 50000,220),
            'yt thumbs', true, false),
        svc('yt_hours', 'youtube', 'YouTube watch time & retention views', 'Watch time', 'watch views',
            T(500,20, 1000,35, 2500,80, 5000,150, 10000,280),
            'yt monetisation 4000 partner retention', true, false),
        svc('yt_comments', 'youtube', 'YouTube comments', 'Comments', 'comments', null,
            'yt reply custom quote', false, false),

        /* ---------------------------------------------------------------- X --- */
        svc('x_followers', 'x', 'X followers', 'Followers', 'followers',
            T(500,15, 1000,25, 2500,50, 5000,70, 10000,100, 25000,250),
            'twitter tweet follow', true, true),
        svc('x_likes', 'x', 'X likes', 'Likes', 'likes',
            T(100,5, 250,10, 500,18, 1000,30, 2500,65, 5000,120),
            'twitter tweet heart', true, false),
        svc('x_reposts', 'x', 'X reposts', 'Reposts', 'reposts',
            T(100,3, 500,8, 1000,12, 5000,30, 10000,50),
            'twitter retweet repost', false, false),
        svc('x_impressions', 'x', 'X impressions', 'Impressions', 'impressions',
            T(10000,10, 50000,25, 100000,40, 500000,120, 1000000,200),
            'twitter reach views', false, false),

        /* --------------------------------------------------------- Telegram --- */
        svc('tg_members', 'telegram', 'Telegram channel or group members', 'Members', 'members',
            T(500,10, 1000,15, 2500,30, 5000,45, 10000,75, 25000,150, 50000,250),
            'tg join group channel', true, true),
        svc('tg_premium', 'telegram', 'Telegram premium members', 'Premium members', 'members',
            T(500,15, 1000,25, 2500,55, 5000,100, 10000,180, 25000,400),
            'tg join premium', true, true),
        svc('tg_reactions', 'telegram', 'Telegram post reactions', 'Post reactions', 'reactions',
            T(100,3, 500,5, 1000,8, 5000,20, 10000,35, 50000,120),
            'tg emoji react', false, false),
        svc('tg_views', 'telegram', 'Telegram post views', 'Post views', 'views', null,
            'tg plays custom quote', false, false),

        /* --------------------------------------------------------- WhatsApp --- */
        svc('wa_channel', 'whatsapp', 'WhatsApp channel members', 'Channel members', 'members',
            T(500,20, 1000,35, 2500,75, 5000,140, 10000,250),
            'whats app status broadcast channel', true, true),
        svc('wa_group', 'whatsapp', 'WhatsApp group members', 'Group members', 'members',
            T(500,25, 1000,45, 2500,95, 5000,180, 10000,330),
            'whats app group join', true, true),
        svc('wa_react', 'whatsapp', 'WhatsApp channel post reactions', 'Post reactions', 'reactions',
            T(100,3, 500,8, 1000,12, 5000,35, 10000,65, 25000,150),
            'whats app emoji', false, false),

        /* --------------------------------------------------------- LinkedIn --- */
        svc('li_profile', 'linkedin', 'LinkedIn profile followers', 'Profile followers', 'followers',
            T(500,18, 1000,30, 2500,65, 5000,120),
            'linkedin profile connect', true, true),
        svc('li_company', 'linkedin', 'LinkedIn company page followers', 'Company followers', 'followers',
            T(500,25, 1000,45, 2500,100, 5000,180, 10000,330),
            'linkedin company page business', true, true),
        svc('li_postlikes', 'linkedin', 'LinkedIn post likes', 'Post likes', 'likes',
            T(100,8, 250,18, 500,30, 1000,55, 2500,130, 5000,250),
            'linkedin engagement', false, false),

        /* ----------------------------------------------------------- Spotify --- */
        svc('sp_followers', 'spotify', 'Spotify followers', 'Followers', 'followers',
            T(500,15, 1000,25, 2500,50, 5000,70, 10000,100, 25000,250),
            'spotify artist follow', true, true),
        svc('sp_plays', 'spotify', 'Spotify plays', 'Plays', 'plays',
            T(1000,5, 5000,15, 10000,25, 25000,50, 50000,85, 100000,150),
            'spotify streams track song', true, false),
        svc('sp_listeners', 'spotify', 'Spotify monthly listeners', 'Monthly listeners', 'monthly listeners',
            T(1000,20, 2500,45, 5000,80, 10000,140, 20000,260, 50000,550),
            'spotify listeners audience', false, false),

        /* --------------------------------------------------------- Audiomack --- */
        svc('am_followers', 'audiomack', 'Audiomack followers', 'Followers', 'followers',
            T(500,15, 1000,25, 2500,50, 5000,70, 10000,100, 25000,250),
            'audiomack artist follow', true, true),
        svc('am_plays', 'audiomack', 'Audiomack plays', 'Plays', 'plays',
            T(1000,5, 5000,15, 10000,25, 25000,50, 50000,90, 100000,160),
            'audiomack streams track song', true, false),
        svc('am_likes', 'audiomack', 'Audiomack likes & re-ups', 'Likes / re-ups', 'likes',
            T(500,8, 1000,15, 2500,30, 5000,55, 10000,100, 25000,200),
            'audiomack reup favourite', false, false),

        /* -------------------------------------------------------- SoundCloud --- */
        svc('sc_followers', 'soundcloud', 'SoundCloud followers', 'Followers', 'followers',
            T(100,25, 250,55, 500,100, 1000,180, 2500,420),
            'soundcloud artist follow', true, true),
        svc('sc_plays', 'soundcloud', 'SoundCloud plays', 'Plays', 'plays',
            T(1000,8, 5000,20, 10000,35, 25000,75, 50000,130, 100000,240),
            'soundcloud streams track song', true, false),
        svc('sc_likes', 'soundcloud', 'SoundCloud likes', 'Likes', 'likes',
            T(100,30, 250,60, 500,110, 1000,190, 2500,450),
            'soundcloud favourite', false, false),

        /* ---------------------------------------------------- Website traffic --- */
        svc('wt_standard', 'webtraffic', 'Standard worldwide website traffic', 'Standard worldwide', 'visits',
            T(1000,5, 5000,15, 10000,25, 25000,50, 50000,90, 100000,160),
            'website traffic visitors worldwide', true, false),
        svc('wt_premium', 'webtraffic', 'Premium social website traffic', 'Premium social', 'visits',
            T(1000,8, 5000,25, 10000,45, 25000,90, 50000,160, 100000,300),
            'website traffic visitors social referral', true, false),
        svc('wt_geo', 'webtraffic', 'Geo-targeted premium website traffic', 'Geo-targeted premium', 'visits',
            T(1000,10, 5000,30, 10000,55, 25000,110, 50000,200, 100000,380),
            'website traffic visitors geo targeted country', false, false)
    ];

    var SERVICES_BY_ID = {};
    for (var si = 0; si < SERVICES.length; si++) SERVICES_BY_ID[SERVICES[si].id] = SERVICES[si];

    /** Which services sell on each platform's order page, tab order. First = default. */
    var PLATFORMS = {
        instagram:  { key: 'instagram',  name: 'Instagram',       href: '/instagram-boost/',  services: ['ig_followers', 'ig_likes', 'ig_reels', 'ig_story'] },
        tiktok:     { key: 'tiktok',     name: 'TikTok',          href: '/tiktok-boost/',     services: ['tt_followers', 'tt_likes', 'tt_views'] },
        facebook:   { key: 'facebook',   name: 'Facebook',        href: '/facebook-boost/',   services: ['fb_followers', 'fb_likes', 'fb_reactions', 'fb_views'] },
        youtube:    { key: 'youtube',    name: 'YouTube',         href: '/youtube-boost/',    services: ['yt_subs', 'yt_views', 'yt_likes', 'yt_hours'] },
        x:          { key: 'x',          name: 'X',               href: '/x-boost/',          services: ['x_followers', 'x_likes', 'x_reposts', 'x_impressions'] },
        telegram:   { key: 'telegram',   name: 'Telegram',        href: '/telegram-boost/',   services: ['tg_members', 'tg_premium', 'tg_reactions'] },
        whatsapp:   { key: 'whatsapp',   name: 'WhatsApp',        href: '/whatsapp-boost/',   services: ['wa_channel', 'wa_group', 'wa_react'] },
        linkedin:   { key: 'linkedin',   name: 'LinkedIn',        href: '/linkedin-boost/',   services: ['li_profile', 'li_company', 'li_postlikes'] },
        spotify:    { key: 'spotify',    name: 'Spotify',         href: '/spotify-boost/',    services: ['sp_followers', 'sp_plays', 'sp_listeners'] },
        audiomack:  { key: 'audiomack',  name: 'Audiomack',       href: '/audiomack-boost/',  services: ['am_followers', 'am_plays', 'am_likes'] },
        soundcloud: { key: 'soundcloud', name: 'SoundCloud',      href: '/soundcloud-boost/', services: ['sc_followers', 'sc_plays', 'sc_likes'] },
        webtraffic: { key: 'webtraffic', name: 'Website traffic', href: '/website-traffic/',  services: ['wt_standard', 'wt_premium', 'wt_geo'] }
    };

    /* The $500 website package — one fixed plan, not a quantity ladder, so it
     * lives outside SERVICES. The wizard auto-skips step 1's tap-to-confirm
     * when there's exactly one plan, same as it always has. */
    var websitePlans = [
        {
            id: 'standard', name: 'Website Package', short: 'Website Package',
            usd: 500, tag: 'Full build', hero: true, label: 'Website Package — designed, built and launched, with business email',
            feats: [
                { icon: 'fas fa-mobile-screen-button', text: 'Designed mobile-first', gold: true },
                { icon: 'fab fa-whatsapp', text: 'WhatsApp built into every page' },
                { icon: 'fas fa-envelope', text: 'Business email on your own domain, included' },
                { icon: 'fas fa-screwdriver-wrench', text: 'Setup and launch handled on our side' },
                { icon: 'fas fa-hand-holding-dollar', text: '$250 starts it, the rest on delivery' }
            ]
        }
    ];

    /* --------------------------------------------------------------- bundles ---
     * Curated compositions, priced against the sum of their real parts above.
     * Creator Starter/Pro need a platform choice, so each is two self-
     * contained cards (Instagram / TikTok) instead of a runtime picker —
     * one fewer decision on the order page.
     * -------------------------------------------------------------------- */

    var bundlePlans = [
        {
            id: 'creator-starter-ig', name: 'Creator Starter — Instagram', short: 'Creator Starter (IG)',
            usd: 100, wasUsd: 115, tag: 'Starter', label: 'Creator Starter — Instagram (5K followers + 50K views + 5K likes)',
            feats: [
                { icon: 'fas fa-user-plus', text: '5,000 Instagram followers', gold: true },
                { icon: 'fas fa-eye', text: '50,000 reel views' },
                { icon: 'fas fa-heart', text: '5,000 likes' }
            ]
        },
        {
            id: 'creator-starter-tt', name: 'Creator Starter — TikTok', short: 'Creator Starter (TT)',
            usd: 100, wasUsd: 130, tag: 'Starter', label: 'Creator Starter — TikTok (5K followers + 50K views + 5K likes)',
            feats: [
                { icon: 'fas fa-user-plus', text: '5,000 TikTok followers', gold: true },
                { icon: 'fas fa-eye', text: '50,000 video views' },
                { icon: 'fas fa-heart', text: '5,000 likes' }
            ]
        },
        {
            id: 'creator-pro-ig', name: 'Creator Pro — Instagram', short: 'Creator Pro (IG)',
            usd: 175, tag: 'Popular', hero: true, label: 'Creator Pro — Instagram (10K followers + 100K views + 10K likes)',
            feats: [
                { icon: 'fas fa-user-plus', text: '10,000 Instagram followers', gold: true },
                { icon: 'fas fa-eye', text: '100,000 reel views' },
                { icon: 'fas fa-heart', text: '10,000 likes' },
                { icon: 'fas fa-layer-group', text: 'One order instead of three' }
            ]
        },
        {
            id: 'creator-pro-tt', name: 'Creator Pro — TikTok', short: 'Creator Pro (TT)',
            usd: 175, wasUsd: 195, tag: 'Popular', hero: true, label: 'Creator Pro — TikTok (10K followers + 100K views + 10K likes)',
            feats: [
                { icon: 'fas fa-user-plus', text: '10,000 TikTok followers', gold: true },
                { icon: 'fas fa-eye', text: '100,000 video views' },
                { icon: 'fas fa-heart', text: '10,000 likes' }
            ]
        },
        {
            id: 'multi-platform', name: 'Multi-Platform Growth', short: 'Multi-Platform',
            usd: 300, wasUsd: 305, tag: 'All 3', label: 'Multi-Platform Growth (5K followers + 50K views on Instagram, TikTok & Facebook)',
            feats: [
                { icon: 'fab fa-instagram', text: '5,000 followers + 50,000 views on Instagram', gold: true },
                { icon: 'fab fa-tiktok', text: '5,000 followers + 50,000 views on TikTok' },
                { icon: 'fab fa-facebook-f', text: '5,000 followers + 50,000 views on Facebook' }
            ]
        },
        {
            id: 'artist-launch', name: 'Artist Launch', short: 'Artist Launch',
            usd: 200, wasUsd: 315, tag: 'Best value', hero: true, label: 'Artist Launch (Spotify + Audiomack plays & followers)',
            feats: [
                { icon: 'fab fa-spotify', text: '50,000 Spotify plays + 5,000 Spotify followers', gold: true },
                { icon: 'fas fa-music', text: '50,000 Audiomack plays + 5,000 Audiomack followers' }
            ]
        },
        {
            id: 'youtube-growth', name: 'YouTube Growth', short: 'YouTube Growth',
            usd: 300, wasUsd: 340, tag: 'Channel builder', label: 'YouTube Growth (2.5K subscribers + 50K views + 10K likes)',
            feats: [
                { icon: 'fas fa-user-plus', text: '2,500 subscribers', gold: true },
                { icon: 'fas fa-eye', text: '50,000 views' },
                { icon: 'fas fa-thumbs-up', text: '10,000 likes' }
            ]
        },
        {
            id: 'business-visibility', name: 'Business Visibility', short: 'Business Visibility',
            usd: 250, wasUsd: 280, tag: 'For business pages', label: 'Business Visibility (5K LinkedIn followers + 50K premium website visits)',
            feats: [
                { icon: 'fab fa-linkedin', text: '5,000 LinkedIn profile followers', gold: true },
                { icon: 'fas fa-globe', text: '50,000 premium-social website visits' }
            ]
        }
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

    function qtyLabel(qty) {
        if (qty >= 1000000) return (qty / 1000000) + 'M';
        if (qty >= 1000) {
            var k = qty / 1000;
            return (k % 1 === 0 ? k : k.toFixed(1)) + 'K';
        }
        return String(qty);
    }

    var UNIT_ICONS = {
        followers: 'fas fa-user-plus', subscribers: 'fas fa-user-plus', members: 'fas fa-users',
        likes: 'fas fa-heart', views: 'fas fa-eye', 'watch views': 'fas fa-clock',
        reactions: 'fas fa-face-smile', comments: 'fas fa-comment', saves: 'fas fa-bookmark',
        shares: 'fas fa-share-nodes', viewers: 'fas fa-satellite-dish', reposts: 'fas fa-retweet',
        impressions: 'fas fa-chart-line', plays: 'fas fa-play', 'monthly listeners': 'fas fa-headphones',
        visits: 'fas fa-arrow-trend-up'
    };

    function planFeats(service, qty) {
        var feats = [
            { icon: UNIT_ICONS[service.unit] || 'fas fa-bolt', text: qty.toLocaleString() + ' ' + service.unit, gold: true },
            { icon: 'fas fa-gauge-simple', text: 'Gradual, natural pace' }
        ];
        if (service.refillEligible) feats.push({ icon: 'fas fa-rotate-left', text: '30-day refill' });
        return feats;
    }

    /** Plans for one service on a platform, priced for a region. Bundles are handled separately. */
    function plansFor(platformKey, regionCode, serviceId) {
        var currency = REGIONS[regionCode] ? REGIONS[regionCode].currency : 'UGX';

        if (platformKey === 'bundle' || platformKey === 'website') {
            var list = platformKey === 'bundle' ? bundlePlans : websitePlans;
            return list.map(function (plan) {
                var out = {};
                for (var k in plan) { if (Object.prototype.hasOwnProperty.call(plan, k)) out[k] = plan[k]; }
                out.price = localPrice(plan.usd, currency);
                out.was = plan.wasUsd ? localPrice(plan.wasUsd, currency) : null;
                out.currency = currency;
                return out;
            });
        }

        var platform = PLATFORMS[platformKey];
        if (!platform) return [];
        var svcId = serviceId || platform.services[0];
        var service = SERVICES_BY_ID[svcId];
        if (!service || !service.sizes) return [];

        return service.sizes.map(function (tier) {
            var isAnchor = tier.qty === 10000 && tier.usd === 100;
            return {
                id: String(tier.qty),
                name: tier.qty.toLocaleString() + ' ' + service.unit,
                short: qtyLabel(tier.qty),
                price: localPrice(tier.usd, currency),
                was: null,
                currency: currency,
                tag: isAnchor ? 'Best seller' : null,
                hero: isAnchor,
                label: tier.qty.toLocaleString() + ' ' + service.unit + ' — ' + service.short,
                feats: planFeats(service, tier.qty)
            };
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

    /** Hand a chosen platform+service+plan from the home builder to the order page. */
    var Pending = {
        set: function (platformKey, serviceId, planId) {
            try {
                sessionStorage.setItem(PENDING_KEY, platformKey + ':' + (serviceId || '') + ':' + planId);
            } catch (e) { /* ignore */ }
        },
        /** Returns { serviceId, planId } for this platform, or null. */
        take: function (platformKey) {
            try {
                var raw = sessionStorage.getItem(PENDING_KEY);
                if (!raw) return null;
                var parts = raw.split(':');
                if (parts[0] !== platformKey) return null;
                sessionStorage.removeItem(PENDING_KEY);
                return { serviceId: parts[1] || null, planId: parts[2] };
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
        SERVICES_BY_ID: SERVICES_BY_ID,
        BUNDLES: bundlePlans,
        servicesFor: servicesFor,
        searchServices: searchServices,
        localPrice: localPrice,
        money: money,
        qtyLabel: qtyLabel,
        plansFor: plansFor,
        Region: Region,
        Pending: Pending
    };

})(window);
