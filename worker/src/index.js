/**
 * 97 WORLD — ORDER WORKER
 *
 * The only thing on the internet that holds the Fastway API key. The website
 * is static and public; anything in its JavaScript can be read by anyone, and
 * that key spends real money. So it lives here, as an encrypted secret, and
 * the site talks to this instead.
 *
 * Public routes let a customer see prices and lodge an order. They cannot
 * spend a shilling — an order sits as `pending` until you place it yourself
 * from the admin routes. That is deliberate: without it, anyone who found the
 * endpoint could drain the balance for free.
 *
 * Secrets (wrangler secret put ...):
 *   FASTWAY_KEY    the API key from your Fastway panel
 *   ADMIN_TOKEN    a long random string; the admin page sends it as a header
 *
 * Bindings (wrangler.toml):
 *   ORDERS         KV namespace
 */

import { CATALOGUE, BUNDLES, PLATFORMS } from './catalogue.js';

const FASTWAY_API = 'https://fastwaysmm.com/api/v2';
const UGX_PER_USD = 3750;

/* Where the site is allowed to call from. Anything else is refused, so the
   endpoint can't be embedded in somebody else's page. */
const ALLOWED_ORIGINS = [
  'https://the97.world',
  'https://www.the97.world',
  'http://localhost:8899'
];

/* ------------------------------------------------------------- helpers --- */

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(body, init = {}, origin = '') {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin), ...(init.headers || {}) }
  });
}

/** Constant-time-ish compare so the admin token can't be guessed by timing. */
function tokenMatches(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string') return false;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Every Fastway call goes through here. */
async function fastway(env, action, params = {}) {
  const body = new URLSearchParams({ key: env.FASTWAY_KEY, action, ...params });
  const res = await fetch(FASTWAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Fastway returned ${res.status}`);
  const data = await res.json();
  if (data && data.error) throw new Error(String(data.error));
  return data;
}

/**
 * Retail is deliberately rounded to something a person would say out loud.
 * 37,412 UGX reads like a machine wrote it; 37,500 reads like a price.
 */
function tidyUsd(usd) {
  if (usd >= 100) return Math.round(usd / 5) * 5;
  if (usd >= 20)  return Math.round(usd);
  if (usd >= 5)   return Math.round(usd * 2) / 2;
  return Math.round(usd * 100) / 100;
}

function ref() {
  return 'K97-' + Date.now().toString(36).toUpperCase() +
         '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

/* ----------------------------------------------------------- catalogue --- */

/**
 * Fastway's live rates, keyed by their service id. Cached for an hour so a
 * busy day doesn't hammer their API — prices don't move minute to minute.
 */
async function fastwayRates(env, ctx) {
  const cached = await env.ORDERS.get('cache:services', { type: 'json' });
  if (cached && cached.at > Date.now() - 3600_000) return cached.map;

  const services = await fastway(env, 'services');
  const map = {};
  for (const s of services) {
    map[String(s.service)] = {
      name: s.name,
      category: s.category,
      rate: parseFloat(s.rate),      // their price per 1,000, in USD
      min: parseInt(s.min, 10),
      max: parseInt(s.max, 10),
      refill: !!s.refill,
      type: s.type
    };
  }
  ctx.waitUntil(env.ORDERS.put('cache:services', JSON.stringify({ at: Date.now(), map })));
  return map;
}

/** What the site shows: our services, priced from their live rates. */
async function buildCatalogue(env, ctx) {
  const rates = await fastwayRates(env, ctx);

  const services = CATALOGUE.map((item) => {
    const live = item.fastwayId ? rates[String(item.fastwayId)] : null;
    // no mapping yet, or Fastway dropped the service — mark it unavailable
    // rather than inventing a price
    if (!live) {
      return { ...publicFields(item), available: false, usdPer1000: null, ugxPer1000: null };
    }
    const usd = tidyUsd(live.rate * item.markup);
    return {
      ...publicFields(item),
      available: true,
      usdPer1000: usd,
      ugxPer1000: Math.round(usd * UGX_PER_USD),
      min: Math.max(item.min, live.min),
      max: live.max,
      refillable: live.refill
    };
  });

  const byId = Object.fromEntries(services.map((s) => [s.id, s]));

  const bundles = BUNDLES.map((b) => {
    const parts = b.parts.map((p) => ({ ...p, service: byId[p.service] }));
    if (parts.some((p) => !p.service || !p.service.available)) {
      return { id: b.id, name: b.name, note: b.note, available: false };
    }
    const full = parts.reduce((sum, p) => sum + p.service.usdPer1000 * (p.quantity / 1000), 0);
    const usd = tidyUsd(full * (1 - b.discount));
    return {
      id: b.id, name: b.name, note: b.note, available: true,
      parts: b.parts,
      usd, ugx: Math.round(usd * UGX_PER_USD),
      wasUsd: tidyUsd(full), wasUgx: Math.round(tidyUsd(full) * UGX_PER_USD)
    };
  });

  return { platforms: PLATFORMS, services, bundles, ugxPerUsd: UGX_PER_USD };
}

/** Never leak wholesale cost or markup to the browser. */
function publicFields(item) {
  return {
    id: item.id, platform: item.platform, name: item.name, unit: item.unit,
    min: item.min, typical: item.typical,
    headline: !!item.headline, note: item.note || null
  };
}

/* -------------------------------------------------------------- routes --- */

async function handleOrder(request, env, origin) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Bad request' }, { status: 400 }, origin);

  const { serviceId, bundleId, quantity, link, name, phone, region, referrer, payment } = body;

  if (!link || !name || !phone) {
    return json({ error: 'Name, phone and account link are all required' }, { status: 400 }, origin);
  }
  if (!serviceId && !bundleId) {
    return json({ error: 'No service chosen' }, { status: 400 }, origin);
  }

  const id = ref();
  const order = {
    ref: id,
    createdAt: new Date().toISOString(),
    status: 'pending',            // pending -> placed -> (fastway status)
    serviceId: serviceId || null,
    bundleId: bundleId || null,
    quantity: quantity ? parseInt(quantity, 10) : null,
    link: String(link).slice(0, 300),
    name: String(name).slice(0, 120),
    phone: String(phone).slice(0, 40),
    region: region || 'UG',
    referrer: referrer || 'Direct',
    payment: payment || null,
    fastway: null                 // filled in when you place it
  };

  await env.ORDERS.put('order:' + id, JSON.stringify(order));
  // a lightweight index so the admin list doesn't need a full KV scan
  const index = (await env.ORDERS.get('index:pending', { type: 'json' })) || [];
  index.unshift(id);
  await env.ORDERS.put('index:pending', JSON.stringify(index.slice(0, 500)));

  return json({ ok: true, ref: id }, {}, origin);
}

async function handleAdminOrders(env, origin) {
  const index = (await env.ORDERS.get('index:pending', { type: 'json' })) || [];
  const orders = [];
  for (const id of index.slice(0, 100)) {
    const o = await env.ORDERS.get('order:' + id, { type: 'json' });
    if (o) orders.push(o);
  }
  return json({ orders }, {}, origin);
}

/** The only route that spends money. */
async function handleAdminPlace(request, env, ctx, origin) {
  const { ref: orderRef } = await request.json().catch(() => ({}));
  if (!orderRef) return json({ error: 'No order reference' }, { status: 400 }, origin);

  const order = await env.ORDERS.get('order:' + orderRef, { type: 'json' });
  if (!order) return json({ error: 'Order not found' }, { status: 404 }, origin);
  if (order.status !== 'pending') {
    return json({ error: `Order is already ${order.status}` }, { status: 409 }, origin);
  }

  // resolve what to actually send Fastway
  const lines = [];
  if (order.bundleId) {
    const bundle = BUNDLES.find((b) => b.id === order.bundleId);
    if (!bundle) return json({ error: 'Unknown bundle' }, { status: 400 }, origin);
    for (const part of bundle.parts) {
      const item = CATALOGUE.find((c) => c.id === part.service);
      if (!item || !item.fastwayId) {
        return json({ error: `${part.service} is not mapped to a Fastway service yet` }, { status: 409 }, origin);
      }
      lines.push({ service: item.fastwayId, quantity: part.quantity, label: item.name });
    }
  } else {
    const item = CATALOGUE.find((c) => c.id === order.serviceId);
    if (!item || !item.fastwayId) {
      return json({ error: `${order.serviceId} is not mapped to a Fastway service yet` }, { status: 409 }, origin);
    }
    lines.push({ service: item.fastwayId, quantity: order.quantity, label: item.name });
  }

  const placed = [];
  for (const line of lines) {
    try {
      const res = await fastway(env, 'add', {
        service: String(line.service),
        link: order.link,
        quantity: String(line.quantity)
      });
      placed.push({ label: line.label, quantity: line.quantity, orderId: res.order, error: null });
    } catch (err) {
      placed.push({ label: line.label, quantity: line.quantity, orderId: null, error: err.message });
    }
  }

  const anyFailed = placed.some((p) => p.error);
  order.status = anyFailed ? (placed.some((p) => p.orderId) ? 'partial' : 'failed') : 'placed';
  order.placedAt = new Date().toISOString();
  order.fastway = placed;

  await env.ORDERS.put('order:' + orderRef, JSON.stringify(order));
  return json({ ok: !anyFailed, order }, {}, origin);
}

async function handleAdminStatus(request, env, origin) {
  const { ref: orderRef } = await request.json().catch(() => ({}));
  const order = await env.ORDERS.get('order:' + orderRef, { type: 'json' });
  if (!order || !order.fastway) return json({ error: 'Nothing placed yet' }, { status: 404 }, origin);

  const ids = order.fastway.filter((p) => p.orderId).map((p) => p.orderId);
  if (!ids.length) return json({ error: 'No Fastway orders on this record' }, { status: 404 }, origin);

  const res = await fastway(env, 'multistatus', { orders: ids.join(',') });
  return json({ ok: true, status: res }, {}, origin);
}

async function handleAdminRefill(request, env, origin) {
  const { fastwayOrderId } = await request.json().catch(() => ({}));
  if (!fastwayOrderId) return json({ error: 'No Fastway order id' }, { status: 400 }, origin);
  const res = await fastway(env, 'refill', { order: String(fastwayOrderId) });
  return json({ ok: true, refill: res }, {}, origin);
}

/* --------------------------------------------------------------- entry --- */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    const isAdmin = path.startsWith('/admin');
    if (isAdmin && !tokenMatches(request.headers.get('X-Admin-Token') || '', env.ADMIN_TOKEN || '')) {
      return json({ error: 'Not authorised' }, { status: 401 }, origin);
    }

    try {
      /* ---- public ---- */
      if (path === '/catalogue' && request.method === 'GET') {
        const data = await buildCatalogue(env, ctx);
        return json(data, { headers: { 'Cache-Control': 'public, max-age=600' } }, origin);
      }
      if (path === '/order' && request.method === 'POST') {
        return await handleOrder(request, env, origin);
      }

      /* ---- yours ---- */
      if (path === '/admin/orders' && request.method === 'GET') {
        return await handleAdminOrders(env, origin);
      }
      if (path === '/admin/place' && request.method === 'POST') {
        return await handleAdminPlace(request, env, ctx, origin);
      }
      if (path === '/admin/status' && request.method === 'POST') {
        return await handleAdminStatus(request, env, origin);
      }
      if (path === '/admin/refill' && request.method === 'POST') {
        return await handleAdminRefill(request, env, origin);
      }
      if (path === '/admin/balance' && request.method === 'GET') {
        return json(await fastway(env, 'balance'), {}, origin);
      }
      /* Everything Fastway sells, raw. This is how we pick what to carry and
         fill in the fastwayId fields in catalogue.js. */
      if (path === '/admin/catalogue' && request.method === 'GET') {
        const services = await fastway(env, 'services');
        const q = (url.searchParams.get('q') || '').toLowerCase();
        const filtered = q
          ? services.filter((s) =>
              String(s.name).toLowerCase().includes(q) ||
              String(s.category).toLowerCase().includes(q))
          : services;
        return json({ count: filtered.length, total: services.length, services: filtered }, {}, origin);
      }

      return json({ error: 'Not found' }, { status: 404 }, origin);
    } catch (err) {
      return json({ error: err.message || 'Something went wrong' }, { status: 502 }, origin);
    }
  }
};
