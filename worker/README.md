# 97 World — Order Worker

The only place the Fastway API key exists. The website is static and public;
anything in its JavaScript can be read by anyone, and that key spends real
money — so it lives here as an encrypted secret and the site calls this instead.

## What it does

| Route | Method | Auth | Does |
|---|---|---|---|
| `/catalogue` | GET | — | Our services with retail prices, built from Fastway's live rates. Never returns wholesale cost. Cached 1 hour. |
| `/order` | POST | — | Records a **pending** order, with the price/deposit/balance the site already showed the customer. Does not contact Fastway. Does not spend anything. |
| `/order/confirm` | POST | — | Customer says "I've sent the money" (WhatsApp agent, mobile money, cash — this site never collects payment itself). Moves the order to `awaiting_confirmation`. Still spends nothing. |
| `/order/status` | GET | — | `?ref=K97-XXXX`. What a customer's own tracking page sees: status and amount only — never their name, phone or link. |
| `/admin/orders` | GET | token | Your queue |
| `/admin/confirm` | POST | token | You've checked the money actually landed. Moves the order to `paid` — the only status `/admin/place` will accept. |
| `/admin/place` | POST | token | **The only route that spends money.** Sends a `paid` order to Fastway. Refuses anything not yet marked paid. |
| `/admin/status` | POST | token | Live delivery status for a placed order |
| `/admin/refill` | POST | token | Requests a refill on a dropped order |
| `/admin/balance` | GET | token | Your Fastway balance |
| `/admin/catalogue` | GET | token | **Everything Fastway sells, raw.** Add `?q=instagram` to filter. This is how we pick services. |

## Order status flow

```
pending -> awaiting_confirmation -> paid -> placed -> (Fastway's own status)
```

`pending` and `awaiting_confirmation` are both reachable by anyone with the
order's ref — a stranger who finds this endpoint can create pending rows,
read prices, and tap "I've sent it" on an order that isn't theirs. That's
all they can do. Nothing spends money, and nothing reaches `paid` — the
gate in front of `/admin/place` — without you calling `/admin/confirm`
yourself, after checking your own balance or mobile money statement.

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
