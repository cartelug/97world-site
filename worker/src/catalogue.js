/**
 * 97 WORLD — WHAT WE SELL
 *
 * Fastway carries thousands of services. This is the curated set customers
 * actually see. Everything here is sourced live from Fastway at request time —
 * we only decide *which* services to surface and *what markup* to apply.
 *
 * `fastwayId` is null until we've seen their real catalogue. Hit
 * GET /admin/catalogue (with the admin token) to dump every service Fastway
 * offers, then paste the matching IDs in here.
 *
 * Markup is per-service on purpose. Followers and subscribers get
 * price-compared, so they stay keen. Likes, views and reactions don't — the
 * absolute price is small enough that nobody shops it — so they carry the
 * margin.
 */

export const MARKUP = {
  compared: 3.5,     // followers, subscribers — people shop these
  uncompared: 8,     // likes, views, reactions — people don't
  premium: 5         // watch hours, live views — scarce, high intent
};

export const CATALOGUE = [
  /* ---------------------------------------------------------- Instagram -- */
  { id: 'ig_followers', platform: 'instagram', name: 'Instagram followers',
    unit: 'followers', markup: MARKUP.compared,   min: 100, typical: 10000, fastwayId: null, headline: true },
  { id: 'ig_likes',     platform: 'instagram', name: 'Instagram post likes',
    unit: 'likes',     markup: MARKUP.uncompared, min: 50,  typical: 5000,  fastwayId: null },
  { id: 'ig_reels',     platform: 'instagram', name: 'Instagram reels views',
    unit: 'views',     markup: MARKUP.uncompared, min: 100, typical: 20000, fastwayId: null },
  { id: 'ig_story',     platform: 'instagram', name: 'Instagram story views',
    unit: 'views',     markup: MARKUP.uncompared, min: 100, typical: 10000, fastwayId: null },
  { id: 'ig_comments',  platform: 'instagram', name: 'Instagram comments',
    unit: 'comments',  markup: MARKUP.premium,    min: 10,  typical: 100,   fastwayId: null },
  { id: 'ig_saves',     platform: 'instagram', name: 'Instagram saves',
    unit: 'saves',     markup: MARKUP.uncompared, min: 100, typical: 2000,  fastwayId: null },

  /* ------------------------------------------------------------- TikTok -- */
  { id: 'tt_followers', platform: 'tiktok', name: 'TikTok followers',
    unit: 'followers', markup: MARKUP.compared,   min: 100, typical: 10000, fastwayId: null, headline: true },
  { id: 'tt_likes',     platform: 'tiktok', name: 'TikTok likes',
    unit: 'likes',     markup: MARKUP.uncompared, min: 50,  typical: 5000,  fastwayId: null },
  { id: 'tt_views',     platform: 'tiktok', name: 'TikTok video views',
    unit: 'views',     markup: MARKUP.uncompared, min: 100, typical: 50000, fastwayId: null },
  { id: 'tt_shares',    platform: 'tiktok', name: 'TikTok shares',
    unit: 'shares',    markup: MARKUP.uncompared, min: 100, typical: 2000,  fastwayId: null },
  { id: 'tt_live',      platform: 'tiktok', name: 'TikTok live views',
    unit: 'viewers',   markup: MARKUP.premium,    min: 100, typical: 1000,  fastwayId: null },

  /* ----------------------------------------------------------- Facebook -- */
  { id: 'fb_followers', platform: 'facebook', name: 'Facebook page followers',
    unit: 'followers', markup: MARKUP.compared,   min: 100, typical: 10000, fastwayId: null, headline: true },
  { id: 'fb_likes',     platform: 'facebook', name: 'Facebook page likes',
    unit: 'likes',     markup: MARKUP.uncompared, min: 100, typical: 5000,  fastwayId: null },
  { id: 'fb_reactions', platform: 'facebook', name: 'Facebook post reactions',
    unit: 'reactions', markup: MARKUP.uncompared, min: 50,  typical: 3000,  fastwayId: null },
  { id: 'fb_views',     platform: 'facebook', name: 'Facebook video views',
    unit: 'views',     markup: MARKUP.uncompared, min: 100, typical: 20000, fastwayId: null },
  { id: 'fb_group',     platform: 'facebook', name: 'Facebook group members',
    unit: 'members',   markup: MARKUP.compared,   min: 100, typical: 3000,  fastwayId: null },

  /* ------------------------------------------------------------ YouTube -- */
  { id: 'yt_subs',     platform: 'youtube', name: 'YouTube subscribers',
    unit: 'subscribers', markup: MARKUP.compared, min: 50,  typical: 3500, fastwayId: null, headline: true },
  { id: 'yt_views',    platform: 'youtube', name: 'YouTube views',
    unit: 'views',     markup: MARKUP.uncompared, min: 500, typical: 10000, fastwayId: null },
  { id: 'yt_hours',    platform: 'youtube', name: 'YouTube watch hours',
    unit: 'hours',     markup: MARKUP.premium,    min: 500, typical: 4000,  fastwayId: null,
    note: 'Monetisation threshold is 4,000 hours' },
  { id: 'yt_likes',    platform: 'youtube', name: 'YouTube likes',
    unit: 'likes',     markup: MARKUP.uncompared, min: 50,  typical: 5000,  fastwayId: null },
  { id: 'yt_comments', platform: 'youtube', name: 'YouTube comments',
    unit: 'comments',  markup: MARKUP.premium,    min: 10,  typical: 100,   fastwayId: null },

  /* -------------------------------------------------- WhatsApp, Telegram -- */
  { id: 'wa_channel', platform: 'whatsapp', name: 'WhatsApp channel followers',
    unit: 'followers', markup: MARKUP.compared,   min: 100, typical: 5000,  fastwayId: null },
  { id: 'wa_react',   platform: 'whatsapp', name: 'WhatsApp channel reactions',
    unit: 'reactions', markup: MARKUP.uncompared, min: 100, typical: 2000,  fastwayId: null },
  { id: 'tg_members', platform: 'telegram', name: 'Telegram channel members',
    unit: 'members',   markup: MARKUP.compared,   min: 100, typical: 5000,  fastwayId: null },
  { id: 'tg_views',   platform: 'telegram', name: 'Telegram post views',
    unit: 'views',     markup: MARKUP.uncompared, min: 100, typical: 10000, fastwayId: null },

  /* ------------------------------------------------------------------ X -- */
  { id: 'x_followers', platform: 'x', name: 'X followers',
    unit: 'followers', markup: MARKUP.compared,   min: 100, typical: 5000, fastwayId: null },
  { id: 'x_likes',     platform: 'x', name: 'X likes',
    unit: 'likes',     markup: MARKUP.uncompared, min: 50,  typical: 2000, fastwayId: null }
];

/** Bundles are priced against the sum of their parts, not from a rate. */
export const BUNDLES = [
  {
    id: 'all3',
    name: 'All three platforms',
    note: '10,000 followers each on Instagram, TikTok and Facebook',
    parts: [
      { service: 'ig_followers', quantity: 10000 },
      { service: 'tt_followers', quantity: 10000 },
      { service: 'fb_followers', quantity: 10000 }
    ],
    // what the customer saves against buying the three separately
    discount: 0.1667   // 300 -> 250
  }
];

export const PLATFORMS = {
  instagram: { name: 'Instagram', order: 1 },
  tiktok:    { name: 'TikTok',    order: 2 },
  facebook:  { name: 'Facebook',  order: 3 },
  youtube:   { name: 'YouTube',   order: 4 },
  whatsapp:  { name: 'WhatsApp',  order: 5 },
  telegram:  { name: 'Telegram',  order: 6 },
  x:         { name: 'X',         order: 7 }
};
