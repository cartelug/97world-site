/**
 * Generates every boost order page from one template.
 *
 * The five order pages must be identical in flow and markup — the only things
 * that may differ are the accent colour, the platform wording and the plan
 * table. Generating them guarantees that instead of hoping five hand-edited
 * files stay in sync.
 *
 *   node tools/build-order-pages.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec';
const WHATSAPP = '256762193386';
// The order Worker (worker/). Recording here is additive and fire-and-forget
// — the Sheet + WhatsApp hand-off above is still what actually reaches us,
// this just gives the admin desk a structured queue alongside it.
const WORKER_API = 'https://the97-orders.carteluganda.workers.dev';

/* Plan tables and regions live in assets/pricing.js — the one place prices are
 * defined, shared with the home page's price builder. Pages name a catalog
 * key ('ig', 'tt', 'fb', 'yt', 'bundle'); the wizard looks up the rest.
 * -------------------------------------------------------------------------- */

/* Gifts and proof are identical everywhere — same promises, same wording.
 * The refill line stays conditional in wording ("where it applies") because
 * not every service on every page is refill-eligible — only followers,
 * subscribers and members can actually drop after delivery; likes, views,
 * plays and traffic can't "drop" the same way, so we never promise a
 * blanket 30-day refill again. */
const GIFTS = [
    { icon: 'fa-rotate-left', title: 'Refill protection', sub: 'If your service includes refill cover and something drops within 30 days, we top it back up. Free.' },
    { icon: 'fa-comments', title: 'Free profile review', sub: "We'll tell you what's holding your page back, on WhatsApp." }
];
const WEBSITE_GIFTS = [
    { icon: 'fa-calendar-check', title: 'Free page-list planning call', sub: "We'll map out exactly what your site needs before anything starts." },
    { icon: 'fa-globe', title: 'Free domain name check', sub: "We'll check what's available for your business and advise, no charge." }
];

/* Subscription resells (Prime Video and anything added after it) are a
 * different promise from a boost order — there's no "delivery pace" or
 * refill to speak of, just shared access that either works or gets fixed. */
const SUB_GIFTS = [
    { icon: 'fa-rotate', title: 'Replacement guarantee', sub: "If access stops working during your paid period, we replace it. Free." },
    { icon: 'fa-comments', title: 'Real support, not a ticket queue', sub: "Message us on WhatsApp any time — a person replies, not a bot." }
];

const PROOF = [
    { icon: 'fa-lock', title: 'We never ask for your password', body: 'Delivery works entirely from your public handle. Your login stays yours.' },
    { icon: 'fa-bolt', title: 'You watch it start before you finish paying', body: 'The first batch lands in 1–6 hours. 50% starts the order, the balance is due once delivery is running.' },
    { icon: 'fa-location-dot', title: 'We are actually here', body: 'Kampala-based. Pay by MTN or Airtel Money, or bring cash to the office.' }
];

const SUB_PROOF = [
    { icon: 'fa-key', title: 'Simple, upfront pricing', body: 'Pick your months, pay once — no recurring charge, no surprise renewal.' },
    { icon: 'fa-rotate', title: "Replaced if it breaks", body: "If access stops working during your paid period, we sort it — free, same account." },
    { icon: 'fa-location-dot', title: 'We are actually here', body: 'Kampala-based. Pay by MTN or Airtel Money, or bring cash to the office.' }
];

/* ----------------------------------------------------------------- pages --- */

const PAGES = [
    {
        dir: 'instagram-boost', accent: 'instagram',
        platformName: 'Instagram', logo: '/IMAGES/instagram.png',
        title: 'Instagram Boost', service: 'Instagram Boost',
        headline: 'Grow your <em>Instagram</em>',
        blurb: 'Real Instagram followers, likes and views, delivered gradually. No password, ever.',
        targetLabel: 'Instagram username', targetPlaceholder: 'Your Instagram username',
        targetError: 'We need the username to deliver to',
        icon: 'fab fa-instagram',
        platform: 'instagram',
        services: [
            { id: 'ig_followers', label: 'Followers' },
            { id: 'ig_likes', label: 'Likes' },
            { id: 'ig_reels', label: 'Reel views' },
            { id: 'ig_story', label: 'Story views' }
        ]
    },
    {
        dir: 'tiktok-boost', accent: 'tiktok',
        platformName: 'TikTok', logo: '/IMAGES/tiktok.png',
        title: 'TikTok Boost', service: 'TikTok Boost',
        headline: 'Blow up on <em>TikTok</em>',
        blurb: 'Real TikTok followers, likes and views, delivered gradually. No password, ever.',
        targetLabel: 'TikTok username', targetPlaceholder: 'Your TikTok username',
        targetError: 'We need the username to deliver to',
        icon: 'fab fa-tiktok',
        platform: 'tiktok',
        services: [
            { id: 'tt_followers', label: 'Followers' },
            { id: 'tt_likes', label: 'Likes' },
            { id: 'tt_views', label: 'Views' }
        ]
    },
    {
        dir: 'facebook-boost', accent: 'facebook',
        platformName: 'Facebook', logo: '/IMAGES/facebook.png',
        title: 'Facebook Boost', service: 'Facebook Boost',
        headline: 'Build a <em>Facebook</em> page people trust',
        blurb: 'Real Facebook followers, likes and views, delivered gradually. No password, ever.',
        targetLabel: 'Facebook page', targetPlaceholder: 'Your page name or username',
        targetError: 'We need the page name to deliver to',
        icon: 'fab fa-facebook-f',
        platform: 'facebook',
        services: [
            { id: 'fb_followers', label: 'Followers' },
            { id: 'fb_likes', label: 'Page likes' },
            { id: 'fb_reactions', label: 'Post reactions' },
            { id: 'fb_views', label: 'Views' }
        ]
    },
    {
        dir: 'youtube-boost', accent: 'youtube',
        platformName: 'YouTube', logo: '/IMAGES/youtube.png',
        title: 'YouTube Boost', service: 'YouTube Boost',
        headline: 'Get your channel <em>watched</em>',
        blurb: 'Subscribers, views, likes and watch time. No password, ever.',
        targetLabel: 'YouTube channel', targetPlaceholder: 'Your channel name or link',
        targetError: 'We need the channel to deliver to',
        icon: 'fab fa-youtube',
        platform: 'youtube',
        services: [
            { id: 'yt_subs', label: 'Subscribers' },
            { id: 'yt_views', label: 'Views' },
            { id: 'yt_likes', label: 'Likes' },
            { id: 'yt_hours', label: 'Watch time' }
        ]
    },
    {
        dir: 'x-boost', accent: 'x',
        platformName: 'X', logoIcon: 'fab fa-x-twitter',
        title: 'X Boost', service: 'X Boost',
        headline: 'Grow your <em>audience on X</em>',
        blurb: 'Real followers, likes, reposts and impressions. No password, ever.',
        targetLabel: 'X username', targetPlaceholder: 'Your X (Twitter) username',
        targetError: 'We need the username to deliver to',
        icon: 'fab fa-x-twitter',
        platform: 'x',
        services: [
            { id: 'x_followers', label: 'Followers' },
            { id: 'x_likes', label: 'Likes' },
            { id: 'x_reposts', label: 'Reposts' },
            { id: 'x_impressions', label: 'Impressions' }
        ]
    },
    {
        dir: 'telegram-boost', accent: 'telegram',
        platformName: 'Telegram', logoIcon: 'fab fa-telegram',
        title: 'Telegram Boost', service: 'Telegram Boost',
        headline: 'Fill your <em>Telegram</em>',
        blurb: 'Real members, premium members and post reactions. No password, ever.',
        targetLabel: 'Telegram channel or group', targetPlaceholder: 'Your channel or group link',
        targetError: 'We need the link to deliver to',
        icon: 'fab fa-telegram',
        platform: 'telegram',
        services: [
            { id: 'tg_members', label: 'Members' },
            { id: 'tg_premium', label: 'Premium members' },
            { id: 'tg_reactions', label: 'Post reactions' }
        ]
    },
    {
        dir: 'whatsapp-boost', accent: 'whatsapp',
        platformName: 'WhatsApp', logoIcon: 'fab fa-whatsapp',
        title: 'WhatsApp Boost', service: 'WhatsApp Boost',
        headline: 'Grow your <em>WhatsApp</em> channel',
        blurb: 'Real channel members, group members and post reactions. No password, ever.',
        targetLabel: 'WhatsApp channel or group', targetPlaceholder: 'Your channel or group link',
        targetError: 'We need the link to deliver to',
        icon: 'fab fa-whatsapp',
        platform: 'whatsapp',
        services: [
            { id: 'wa_channel', label: 'Channel members' },
            { id: 'wa_group', label: 'Group members' },
            { id: 'wa_react', label: 'Post reactions' }
        ]
    },
    {
        dir: 'linkedin-boost', accent: 'linkedin',
        platformName: 'LinkedIn', logoIcon: 'fab fa-linkedin',
        title: 'LinkedIn Boost', service: 'LinkedIn Boost',
        headline: 'Look established on <em>LinkedIn</em>',
        blurb: 'Real profile followers, company page followers and post likes. No password, ever.',
        targetLabel: 'LinkedIn profile or page', targetPlaceholder: 'Your profile or company page link',
        targetError: 'We need the link to deliver to',
        icon: 'fab fa-linkedin',
        platform: 'linkedin',
        services: [
            { id: 'li_profile', label: 'Profile followers' },
            { id: 'li_company', label: 'Company followers' },
            { id: 'li_postlikes', label: 'Post likes' }
        ]
    },
    {
        dir: 'spotify-boost', accent: 'spotify',
        platformName: 'Spotify', logo: '/IMAGES/spotify.png',
        title: 'Spotify Boost', service: 'Spotify Boost',
        headline: 'Get heard on <em>Spotify</em>',
        blurb: 'Real followers, plays and monthly listeners. No password, ever.',
        targetLabel: 'Spotify artist or track link', targetPlaceholder: 'Your Spotify artist or track link',
        targetError: 'We need the link to deliver to',
        icon: 'fab fa-spotify',
        platform: 'spotify',
        services: [
            { id: 'sp_followers', label: 'Followers' },
            { id: 'sp_plays', label: 'Plays' },
            { id: 'sp_listeners', label: 'Monthly listeners' }
        ]
    },
    {
        dir: 'audiomack-boost', accent: 'audiomack',
        platformName: 'Audiomack', logoIcon: 'fas fa-music',
        title: 'Audiomack Boost', service: 'Audiomack Boost',
        headline: 'Grow on <em>Audiomack</em>',
        blurb: 'Real followers, plays and likes/re-ups. No password, ever.',
        targetLabel: 'Audiomack profile link', targetPlaceholder: 'Your Audiomack profile link',
        targetError: 'We need the link to deliver to',
        icon: 'fas fa-music',
        platform: 'audiomack',
        services: [
            { id: 'am_followers', label: 'Followers' },
            { id: 'am_plays', label: 'Plays' },
            { id: 'am_likes', label: 'Likes / re-ups' }
        ]
    },
    {
        dir: 'soundcloud-boost', accent: 'soundcloud',
        platformName: 'SoundCloud', logoIcon: 'fab fa-soundcloud',
        title: 'SoundCloud Boost', service: 'SoundCloud Boost',
        headline: 'Get played on <em>SoundCloud</em>',
        blurb: 'Real followers, plays and likes. No password, ever.',
        targetLabel: 'SoundCloud profile link', targetPlaceholder: 'Your SoundCloud profile link',
        targetError: 'We need the link to deliver to',
        icon: 'fab fa-soundcloud',
        platform: 'soundcloud',
        services: [
            { id: 'sc_followers', label: 'Followers' },
            { id: 'sc_plays', label: 'Plays' },
            { id: 'sc_likes', label: 'Likes' }
        ]
    },
    {
        dir: 'website-traffic', accent: 'webtraffic',
        platformName: 'Website Traffic', logoIcon: 'fas fa-globe',
        title: 'Website Traffic', service: 'Website Traffic',
        headline: 'Send <em>real visits</em> to your site',
        blurb: 'Standard worldwide, premium-social or geo-targeted traffic. No password, ever.',
        targetLabel: 'Website URL', targetPlaceholder: 'https://yourwebsite.com',
        targetError: 'We need your website URL',
        icon: 'fas fa-globe',
        platform: 'webtraffic',
        services: [
            { id: 'wt_standard', label: 'Standard worldwide' },
            { id: 'wt_premium', label: 'Premium social' },
            { id: 'wt_geo', label: 'Geo-targeted premium' }
        ]
    },
    {
        dir: 'boost-package', accent: 'bundle',
        platformName: 'Bundles', logo: '/IMAGES/logo.png',
        title: 'Growth Bundles', service: 'Growth Bundle',
        headline: 'More reach, <em>one order</em>',
        blurb: 'Eight real bundles across platforms — pick the one that fits.',
        targetLabel: 'Your @handle', targetPlaceholder: 'Your @handle',
        targetError: 'We need your handle to deliver to',
        targetHint: 'If your handle differs on any platform, tell us on WhatsApp.',
        icon: 'fas fa-at',
        platform: 'bundle',
        // this one is reached from a row that gives nothing away, so it carries
        // the full pitch instead of the standard order-page header
        sell: true
    },
    {
        dir: 'website-order', accent: 'website',
        platformName: 'Website Package', logoIcon: 'fas fa-globe',
        title: 'Website Package', service: 'Website Package',
        headline: 'Order your <em>website</em>',
        blurb: 'One price, properly built — designed, launched and live, with a business email included.',
        targetLabel: 'Business or domain name', targetPlaceholder: 'Your business name or preferred domain',
        targetHint: "Don't have a domain yet? Tell us on WhatsApp and we'll help you pick one.",
        targetError: 'We need your business or domain name',
        icon: 'fas fa-building',
        platform: 'website',
        gifts: WEBSITE_GIFTS
    },
    {
        // Shared-profile subscription resell, not a boost service — see the
        // SUBSCRIPTIONS block in assets/pricing.js for why this page skips
        // the region gate (UGX-only, no USD rate given) and is paid in full
        // (depositPct: 1) rather than the usual 50/50 split.
        dir: 'prime-video', accent: 'prime-video',
        platformName: 'Prime Video', logoIcon: 'fas fa-clapperboard',
        title: 'Prime Video', service: 'Prime Video',
        headline: 'Get <em>Prime Video</em>',
        blurb: 'Shared Prime Video access, any term from 3 to 18 months. Pay once, watch the same day.',
        guaranteeTitle: 'Pay once, watch the same day',
        guaranteeBody: 'This is shared access, not a delivery that ramps up — pay in full and we send your login on WhatsApp as soon as it is confirmed.',
        platform: 'prime-video',
        depositPct: 1,
        fixedRegion: 'UG',
        backHref: '/offers/', backLabel: 'Back to offers',
        gifts: SUB_GIFTS,
        proof: SUB_PROOF
    }
];

/* ------------------------------------------------------- the bundle pitch ---
 * Only /boost-package/ gets this. Every other order page is reached from a card
 * that already sold the package; the bundle is reached from a single row on
 * /growth/ that deliberately says nothing about size or price, so the whole
 * argument has to happen here instead.
 *
 * Money figures carry data-usd and are filled in at runtime by wizard.js, in
 * whichever currency the visitor chose — hardcoding them would put a second
 * source of truth next to pricing.js and guarantee they drift.
 * -------------------------------------------------------------------------- */
const BUNDLE_SELL = `        <header class="bs-hero">
            <span class="bs-badge r-up"><i class="fas fa-layer-group"></i> 8 real bundles</span>
            <h1 class="bs-title r-up">More reach.<br><em>One order.</em></h1>
            <p class="bs-sub r-up">Eight curated compositions across Instagram, TikTok, Facebook, YouTube, Spotify, Audiomack and LinkedIn — each priced against buying the parts separately. Pick the one that matches what you're building, below.</p>

            <div class="bs-marks r-up" aria-hidden="true">
                <img src="/IMAGES/instagram.png" alt="">
                <img src="/IMAGES/tiktok.png" alt="">
                <img src="/IMAGES/facebook.png" alt="">
                <img src="/IMAGES/youtube.png" alt="">
                <img src="/IMAGES/spotify.png" alt="">
            </div>
        </header>

        <!-- why a bundle beats ordering pieces separately -->
        <section class="bs-why r-up">
            <h2>One platform looks lucky.<br><em>A few looks like a business.</em></h2>
            <div class="bs-why-grid">
                <div class="bs-why-card">
                    <i class="fas fa-magnifying-glass"></i>
                    <b>People check more than one place</b>
                    <p>Someone deciding whether to trust you rarely stops at the first profile. A strong Instagram and an empty TikTok answers the question the wrong way.</p>
                </div>
                <div class="bs-why-card">
                    <i class="fas fa-arrow-trend-up"></i>
                    <b>The same handle, growing everywhere</b>
                    <p>Consistent numbers across platforms read as a real operation. One spike on one app reads as something you bought.</p>
                </div>
                <div class="bs-why-card">
                    <i class="fas fa-piggy-bank"></i>
                    <b>One order, one timeline</b>
                    <p>Each bundle below is priced against buying its parts one at a time — see the struck-out price on the card. Delivered together instead of three separate orders.</p>
                </div>
            </div>
        </section>

        <!-- the same promises as everywhere else, restated where the money is -->
        <section class="bs-terms r-up">
            <div><i class="fas fa-lock"></i><span>No password, ever</span></div>
            <div><i class="fas fa-gauge-simple"></i><span>Delivered gradually</span></div>
            <div><i class="fas fa-rotate-left"></i><span>Refill where the parts include it</span></div>
            <div><i class="fas fa-hand-holding-dollar"></i><span>50% starts it</span></div>
        </section>
`;

/* -------------------------------------------------------------- template --- */

const html = (p) => `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<link rel="stylesheet" href="/assets/preloader.css">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <meta name="theme-color" content="#050505">

    <title>${p.title} | 97 World</title>
    <meta name="description" content="${p.blurb}">

    <link rel="icon" href="/IMAGES/logo.png" type="image/png">

    <link rel="preconnect" href="https://api.fontshare.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

    <link rel="stylesheet" href="/assets/motion.css">
    <link rel="stylesheet" href="/assets/order.css">
</head>
<body class="order-page" data-accent="${p.accent}">
<div id="k97pl" aria-hidden="true">
  <img src="/IMAGES/logo.png" alt="">
  <div class="k97pl-word">97 WORLD</div>
  <div class="k97pl-bar"><i></i></div>
</div>

    <div class="ord-aura" aria-hidden="true"></div>
    <div class="toast-stack" id="toastStack" aria-live="polite"></div>

    <!-- region gate: we cannot show a price until we know where they are -->
    <div class="gate" id="regionGate" role="dialog" aria-modal="true" aria-labelledby="gate-h">
        <div class="gate-card">
            <img src="/IMAGES/logo.png" alt="" class="gate-logo">
            <h2 id="gate-h">Where are you ordering from?</h2>
            <p>So we show you the right currency and payment options.</p>
            <div class="region-grid"></div>
        </div>
    </div>

    <nav class="ord-nav">
        <a href="${p.backHref || '/growth/'}" class="ord-back" aria-label="${p.backLabel || 'Back to growth plans'}"><i class="fas fa-arrow-left"></i></a>
        <a href="/" class="ord-brand">
            <img src="/IMAGES/logo.png" alt="">
            <span>World</span>
        </a>
        <button class="ord-region" id="regionBtn" type="button">
            <span class="flag" id="regionFlag">🌍</span>
            <span id="regionBadge">UGX</span>
        </button>
    </nav>

    <main class="ord-shell">

${p.sell ? BUNDLE_SELL : `        <header class="ord-hero">
            <span class="ord-plat r-up">
                ${p.logo ? `<img src="${p.logo}" alt="">` : `<i class="${p.logoIcon}"></i>`}
                ${p.platformName}
            </span>
            <h1 class="ord-title r-up">${p.headline}</h1>
            <p class="ord-sub r-up">${p.blurb}</p>
        </header>`}

        <div class="ord-card" id="wizardCard">
            <ol class="wiz-track">
                <li class="is-on">1. Package</li>
                <li>2. Gifts</li>
                <li>3. Proof</li>
                <li>4. Finish</li>
            </ol>

            <!-- 1 ------------------------------------------------------- -->
            <section class="wiz-step is-on" data-step="1" aria-label="Choose your package">
                <div class="wiz-head">
                    <h2>Choose your <em>package</em></h2>
                    <p>Best value first. Everything is delivered together.</p>
                </div>
                <div class="svc-tabs" id="svcTabs" role="tablist" hidden></div>
                <div class="plan-grid" id="plan-grid" role="group"></div>
                <button type="button" class="wiz-btn" id="btn-step-1" data-go="2" disabled>
                    <span class="wb-label">Choose a package</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
            </section>

            <!-- 2 ------------------------------------------------------- -->
            <section class="wiz-step" data-step="2" aria-label="Your free gifts">
                <div class="wiz-head">
                    <h2>Your <em>free gifts</em></h2>
                    <p>Included with every order. Tap each one to claim it.</p>
                </div>
                <div class="gift-list" id="gift-list"></div>
                <button type="button" class="wiz-btn" id="btn-step-2" data-go="3" disabled>
                    <span class="wb-label">Claim your gifts</span>
                    <i class="fas fa-check"></i>
                </button>
                <button type="button" class="wiz-back" data-go="1">Back</button>
            </section>

            <!-- 3 ------------------------------------------------------- -->
            <section class="wiz-step" data-step="3" aria-label="Why people trust us">
                <div class="wiz-head">
                    <h2>Why people <em>trust us</em></h2>
                    <p>The three things customers ask before every order.</p>
                </div>
                <div class="proof-list" id="proof-list"></div>
                <button type="button" class="wiz-btn" data-go="4">
                    <span class="wb-label">Makes sense — continue</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
                <button type="button" class="wiz-back" data-go="2">Back</button>
            </section>

            <!-- 4 ------------------------------------------------------- -->
            <section class="wiz-step" data-step="4" aria-label="Finish your order">
                <div class="wiz-head">
                    <h2>Finish your <em>order</em></h2>
                    <p>Last step. Nothing is charged on this page.</p>
                </div>

                <div class="guarantee">
                    <i class="fas fa-shield-halved"></i>
                    <div>
                        <b>${p.guaranteeTitle || '50% starts it, the rest on delivery'}</b>
                        <p>${p.guaranteeBody || 'We begin your order on a 50% deposit. The balance is only due once you can see it working.'}</p>
                    </div>
                </div>

                <div class="field">
                    <div class="field-box">
                        <i class="fas fa-user"></i>
                        <input type="text" id="client-name" placeholder="Your full name" autocomplete="name" spellcheck="false">
                    </div>
                    <p class="field-err"><i class="fas fa-circle-exclamation"></i><span>Please enter your name</span></p>
                </div>

                <div class="field">
                    <div class="field-box">
                        <i class="fab fa-whatsapp" style="color:var(--ord-wa)"></i>
                        <input type="tel" id="client-number" placeholder="WhatsApp number" autocomplete="tel" inputmode="tel">
                    </div>
                    <p class="field-err"><i class="fas fa-circle-exclamation"></i><span>Enter a valid WhatsApp number</span></p>
                </div>

${p.targetLabel ? `                <div class="field">
                    <div class="field-box">
                        <i class="${p.icon}"></i>
                        <input type="text" id="target-handle" placeholder="${p.targetPlaceholder}" autocomplete="off" spellcheck="false" autocapitalize="none">
                    </div>
                    <p class="field-err"><i class="fas fa-circle-exclamation"></i><span>${p.targetError}</span></p>
                </div>
` : ''}${p.targetHint ? `                <p class="field-hint"><i class="fas fa-circle-info"></i> ${p.targetHint}</p>
` : ''}
${p.extraOptions ? `
                <div class="field select-box">
                    <select id="extra-select" aria-label="${p.extraLabel}">
${p.extraOptions.map((o) => `                        <option value="${o}">${o}</option>`).join('\n')}
                    </select>
                </div>
` : ''}
                <div class="field select-box">
                    <select id="payment-method" aria-label="Payment method"></select>
                </div>

                <div class="ref-block">
                    <div class="ref-row">
                        <span>Did a friend refer you?</span>
                        <div class="pill-group" role="group" aria-label="Referral">
                            <button type="button" class="pill is-on" id="ref-no" aria-pressed="true">No</button>
                            <button type="button" class="pill" id="ref-yes" aria-pressed="false">Yes</button>
                        </div>
                    </div>
                    <div class="ref-drawer" id="ref-drawer">
                        <div>
                            <div class="field">
                                <div class="field-box">
                                    <i class="fas fa-user-group"></i>
                                    <input type="text" id="ref-code" placeholder="Their name" autocomplete="off">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="total-line">
                    <span>Total</span>
                    <b id="total-value">—</b>
                </div>

                <button type="button" class="wiz-btn" id="btn-submit">
                    <span class="wb-label">Review my order</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
                <button type="button" class="wiz-back" data-go="3">Back</button>
            </section>
        </div>

        <div class="ord-assure">
            <a href="/trust/"><i class="fas fa-shield-halved"></i> Is this real? Check us</a>
            <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener" class="is-wa"><i class="fab fa-whatsapp"></i> Ask before you order</a>
        </div>

        <p class="ord-foot">
            Your account stays yours — we never ask for a password.<br>
            <a href="/growth/">All plans</a> · <a href="/terms-of-service/">Terms</a> · <a href="/privacy-policy/">Privacy</a>
        </p>
    </main>

    <!-- confirm -->
    <div class="sheet" id="confirmSheet" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="confirm-h">
        <div class="sheet-card">
            <div class="sheet-grab"></div>
            <div class="sheet-head">
                <div class="sheet-icon"><i class="fas fa-receipt"></i></div>
                <h2 id="confirm-h">Check it over</h2>
                <p>This is exactly what we'll receive.</p>
            </div>
            <div class="sum-list" id="sum-list"></div>
            <div class="sheet-note">
                <i class="fas fa-shield-halved"></i>
                <span>Next you'll land in WhatsApp with this order already typed out. Nothing is charged here — we confirm everything with you first.</span>
            </div>
            <div class="sheet-actions">
                <button type="button" class="btn-wa" id="btn-confirm">
                    <span class="cta-icon"><i class="fab fa-whatsapp"></i></span>
                    <span class="cta-label">Send on WhatsApp</span>
                </button>
                <button type="button" class="btn-ghost" data-close="confirmSheet">Go back and edit</button>
            </div>
        </div>
    </div>

    <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, I have a question about ${p.service}.`)}" target="_blank" rel="noopener" class="wa-fab" aria-label="Chat on WhatsApp">
        <i class="fab fa-whatsapp"></i>
    </a>

    <script src="/assets/pricing.js"></script>
    <script src="/assets/motion.js" defer></script>
    <script src="/assets/order.js"></script>
    <script src="/assets/wizard.js"></script>
    <script src="script.js"></script>
<script src="/assets/preloader.js" defer></script>
</body>
</html>
`;

const script = (p) => `/**
 * 97 WORLD — ${p.title.toUpperCase()}
 *
 * Data only. The flow lives in /assets/wizard.js and is identical on every
 * order page. Generated by tools/build-order-pages.mjs — edit that, not this.
 *
 * Prices are USD; UGX is derived at 3,750 UGX = $1.
 */
OrderWizard.start(${JSON.stringify({
    sheetUrl: SHEET_URL,
    whatsapp: WHATSAPP,
    apiBase: WORKER_API,
    platform: p.platform,
    service: p.service,
    targetLabel: p.targetLabel,
    targetError: p.targetError,
    ...(p.extraLabel ? { extraLabel: p.extraLabel } : {}),
    ...(p.services ? { services: p.services } : {}),
    ...(typeof p.depositPct === 'number' ? { depositPct: p.depositPct } : {}),
    ...(p.fixedRegion ? { fixedRegion: p.fixedRegion } : {}),
    gifts: p.gifts || GIFTS,
    proof: p.proof || PROOF
}, null, 4)});
`;

for (const page of PAGES) {
    const dir = join(ROOT, page.dir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html(page));
    writeFileSync(join(dir, 'script.js'), script(page));
    console.log(`built ${page.dir}/`);
}
