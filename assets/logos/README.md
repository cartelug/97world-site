# Product logos

Real brand marks for products resold on `/subs/`, sourced from
[Simple Icons](https://simpleicons.org) (CC0 1.0 — public domain, no
attribution required). Each file's `fill` is set to this site's own
tuned accent for that product (the same colour its order page already
uses under `assets/order.css`'s `[data-accent]` rules), not necessarily
the icon set's own default hex, so it stays legible against the site's
dark background.

The marketplace-wide presentation layer now lives in
`/assets/brandmarks.js`. It combines these locally stored Simple Icons
with compact, 97-produced brandmarks for every other catalogue entry.
That gives all 30 marketplace products a consistent visual identifier
without adding a third-party icon-CDN dependency. Product names always
remain visible alongside each mark; the marks are navigation aids, not
replacement brand labels.
