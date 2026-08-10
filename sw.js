/* ============================================================
   97 DESIGN — SERVICE WORKER
   GitHub Pages pins Cache-Control: max-age=600, so this SW is
   the real caching story: static assets cache-first (immutable
   per version), pages network-first with cache fallback.
   Bump VERSION on every deploy (tools/build.mjs stamps ?v= to
   match).
   ============================================================ */
const VERSION = "v12";
const STATIC_CACHE = "97d-static-" + VERSION;
const PAGE_CACHE = "97d-pages-" + VERSION;

const PRECACHE = [
  "/css/fonts-v4.css", "/css/v4.css",
  "/js/vendor/gsap.min.js", "/js/vendor/ScrollTrigger.min.js", "/js/vendor/SplitText.min.js",
  "/js/data.js", "/js/render.js", "/js/motion.js", "/js/transitions.js", "/js/pricing.js", "/js/start.js",
  "/assets/fonts/spacegrotesk-var.woff2", "/assets/fonts/manrope-var.woff2",
  "/assets/fonts/fraunces-italic-500.woff2", "/assets/fonts/fraunces-normal-600.woff2",
  "/assets/fonts/spacemono-400.woff2", "/assets/fonts/spacemono-700.woff2",
  "/assets/mark-white.png", "/assets/favicon.png", "/assets/favicon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // pages: network-first so content updates land within one visit
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((m) => m || caches.match("/")))
    );
    return;
  }

  // static assets: cache-first (the ?v= query makes them effectively immutable)
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
