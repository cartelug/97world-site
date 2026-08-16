# 97 World — Order Worker

The only place the Fastway API key exists. The website is static and public;
anything in its JavaScript can be read by anyone, and that key spends real
money — so it lives here as an encrypted secret and the site calls this instead.

## What it does

| Route | Method | Auth | Does |
|---|---|---|---|
| `/catalogue` | GET | — | Our services with retail prices, built from Fastway's live rates. Never returns wholesale cost. Cached 1 hour. |
| `/order` | POST | — | Records a **pending** order. Does not contact Fastway. Does not spend anything. |
| `/admin/orders` | GET | token | Your queue |
| `/admin/place` | POST | token | **The only route that spends money.** Sends the order to Fastway. |
| `/admin/status` | POST | token | Live delivery status for a placed order |
| `/admin/refill` | POST | token | Requests a refill on a dropped order |
| `/admin/balance` | GET | token | Your Fastway balance |
| `/admin/catalogue` | GET | token | **Everything Fastway sells, raw.** Add `?q=instagram` to filter. This is how we pick services. |

A stranger who finds this endpoint can create pending rows and read prices.
That's all. Your balance is only ever spent by you calling `/admin/place`.

## Deploy

Once, from this folder:

```bash
npm install

# 1. storage for orders + the cached catalogue
npx wrangler kv namespace create ORDERS
#    paste the printed id into wrangler.toml

# 2. the secrets — these never touch git
npx wrangler secret put FASTWAY_KEY     # your NEW Fastway key
npx wrangler secret put ADMIN_TOKEN     # any long random string; keep it safe

# 3. ship it
npx wrangler deploy
```

Then in the Cloudflare dashboard, add a custom domain of `api.the97.world`
pointing at this Worker.

Generate the admin token with something like:

```bash
openssl rand -hex 32
```

## First thing to run after deploying

```bash
curl -H "X-Admin-Token: YOUR_TOKEN" https://api.the97.world/admin/balance
curl -H "X-Admin-Token: YOUR_TOKEN" "https://api.the97.world/admin/catalogue?q=instagram+followers"
```

The second one prints Fastway's real service IDs, names and rates. Paste that
output back into the chat and the `fastwayId` fields in `src/catalogue.js` get
filled in — that's the step that turns this from scaffolding into a live shop.

## Pricing

`src/catalogue.js` holds what we sell and the markup per service. Retail is
computed at request time as `fastwayRate × markup`, then rounded to a number a
person would actually say out loud.

Markup is deliberately *not* one figure:

- **`compared` (3.5×)** — followers, subscribers, members. People shop these
  against other sellers, so they stay keen and win on volume.
- **`uncompared` (8×)** — likes, views, reactions. The absolute price is small
  enough that nobody price-checks, so this is where the margin lives.
- **`premium` (5×)** — watch hours, comments, live views. Scarce and
  high-intent.

Change a multiplier and every price on the site follows, in both currencies.

## A service with no `fastwayId`

It is returned as `available: false` and the site hides it. We never invent a
price for something we can't actually buy.
