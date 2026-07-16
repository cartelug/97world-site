/* ============================================================
   97 WORLD — INTRO ENGINE (home page)
   The preloader's particle assembly: brand-colored particles fly
   in from the edges and lock into the 97 monogram, then a
   shockwave ring + sheen fire and the crisp mark takes over.
   Also drives the 00→100% boot counter.

   Degrades gracefully: if the canvas can't sample the logo
   (no context, tainted canvas), the CSS-only intro plays as
   before. Skipped entirely for reduced-motion and repeat
   visits (handled by js/site.js).
   ============================================================ */
(function () {
  "use strict";
  var intro = document.getElementById("intro");
  if (!intro) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = false;
  try { seen = !!sessionStorage.getItem("i97"); } catch (e) {}
  var conn = navigator.connection || {};
  var lite = !!(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""));
  if (seen || reduce || lite) return; // site.js already dismissed the intro

  /* Signal Bridge: the HTML ships a static copy of the city names so the
     no-JS paint is complete — this re-sync keeps it from drifting when
     SITE.nations changes. */
  try {
    var nations = (window.SITE || {}).nations || [];
    var cities = intro.querySelectorAll(".bcity");
    nations.forEach(function (n, i) {
      var el = cities[i];
      if (!el) return;
      el.querySelector("b").textContent = n.city.toUpperCase();
      var lat = (n.coords || "").split("·")[0].trim();
      var latEl = el.querySelector(".lat");
      if (latEl && lat) latEl.textContent = lat;
    });
  } catch (e) {}

  var canvas = document.getElementById("introCanvas");
  var markImg = intro.querySelector(".intro-mark");
  var pctEl = intro.querySelector(".intro-count b");
  if (!canvas || !canvas.getContext || !markImg) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  /* ---------- timeline (ms) ---------- */
  var T_START = 250;     // particles begin moving
  var T_LOCK = 1400;     // assembled: crisp mark + ring + sheen
  var T_FADE = 500;      // particle fade-out after lock
  var T_BLOOM = 2450;    // final bloom
  var PCT0 = 250, PCT1 = 2300; // boot counter window

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var mobile = window.innerWidth < 760;
  var mem = navigator.deviceMemory || 8;
  var MAX_P = mem <= 2 ? 400 : (mobile ? 650 : 1600);
  var COLORS = [
    [255, 206, 0], [255, 206, 0],      // Uganda yellow (weighted)
    [217, 0, 0], [15, 71, 175],        // Uganda red, SS blue
    [7, 137, 48], [124, 92, 255],      // SS green, violet
    [244, 244, 246]                    // white
  ];

  var tEval = (window.performance && performance.now) ? performance.now() : null;

  var W = 0, H = 0;
  function size() {
    // clientWidth/Height: the canvas is CSS-stretched to the layout viewport,
    // so sizing from innerWidth (which includes the scrollbar) would skew targets
    var de = document.documentElement;
    W = canvas.width = Math.floor(de.clientWidth * DPR);
    H = canvas.height = Math.floor(de.clientHeight * DPR);
  }

  /* ---------- sample the mark into particle targets ---------- */
  var parts = null;
  function build() {
    var r = markImg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var ow = Math.round(r.width), oh = Math.round(r.height);
    var off = document.createElement("canvas");
    off.width = ow; off.height = oh;
    var octx = off.getContext("2d");
    var data;
    try {
      octx.drawImage(markImg, 0, 0, ow, oh);
      data = octx.getImageData(0, 0, ow, oh).data;
    } catch (e) { return null; } // tainted canvas → CSS fallback
    var step = mobile ? 4 : 3;
    var pts = [];
    for (var y = 0; y < oh; y += step)
      for (var x = 0; x < ow; x += step)
        if (data[(y * ow + x) * 4 + 3] > 120) pts.push([x, y]);
    if (pts.length < 40) return null;
    // shuffle then cap
    for (var i = pts.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, tmp = pts[i]; pts[i] = pts[j]; pts[j] = tmp;
    }
    if (pts.length > MAX_P) pts.length = MAX_P;

    var cx = W / 2, cy = H / 2, spread = Math.max(W, H) * 0.72;
    return pts.map(function (p) {
      var a = Math.random() * Math.PI * 2;
      var rad = spread * (0.55 + Math.random() * 0.55);
      var c = COLORS[(Math.random() * COLORS.length) | 0];
      return {
        sx: cx + Math.cos(a) * rad, sy: cy + Math.sin(a) * rad,
        tx: (r.left + p[0]) * DPR, ty: (r.top + p[1]) * DPR,
        delay: Math.random() * 420,
        dur: 700 + Math.random() * 380,
        sz: (mobile ? 1.7 : 1.5) + Math.random() * 1.3,
        c: c
      };
    });
  }

  /* ---------- render loop ---------- */
  var t0 = null, raf = null, lockDone = false, bloomDone = false, ended = false;
  function ease(p) { return 1 - Math.pow(1 - p, 3); }

  function frame(ts) {
    if (intro.classList.contains("done")) { ctx.clearRect(0, 0, W, H); return; } // skipped / ended
    if (t0 === null) t0 = ts;
    var t = ts - t0;
    ctx.clearRect(0, 0, W, H);

    // particles
    var fade = t > T_LOCK ? Math.max(0, 1 - (t - T_LOCK) / T_FADE) : 1;
    if (fade > 0) {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var pr = Math.min(1, Math.max(0, (t - T_START - p.delay) / p.dur));
        var e = ease(pr);
        var x = p.sx + (p.tx - p.sx) * e;
        var y = p.sy + (p.ty - p.sy) * e;
        // resolve brand colors to white as each particle settles
        var w = pr > 0.65 ? (pr - 0.65) / 0.35 : 0;
        var R = p.c[0] + (255 - p.c[0]) * w;
        var G = p.c[1] + (255 - p.c[1]) * w;
        var B = p.c[2] + (255 - p.c[2]) * w;
        var a = (pr <= 0 ? 0 : 0.28 + 0.72 * e) * fade;
        if (a <= 0.01) continue;
        ctx.fillStyle = "rgba(" + (R | 0) + "," + (G | 0) + "," + (B | 0) + "," + a.toFixed(3) + ")";
        ctx.fillRect(x - p.sz / 2, y - p.sz / 2, p.sz * DPR * 0.75, p.sz * DPR * 0.75);
      }
    }

    // lock moment: crisp mark + sheen (CSS) and shockwave rings (canvas)
    if (!lockDone && t >= T_LOCK) { lockDone = true; intro.classList.add("locked"); }
    if (lockDone && t < T_LOCK + 1000) {
      var rp = (t - T_LOCK) / 1000;
      var mr = markImg.getBoundingClientRect();
      var mcx = (mr.left + mr.width / 2) * DPR, mcy = (mr.top + mr.height / 2) * DPR;
      var base = Math.max(mr.width, mr.height) * DPR * 0.6;
      var reach = Math.max(W, H) * 0.5;
      ctx.lineWidth = 1.5 * DPR;
      ctx.strokeStyle = "rgba(255,255,255," + (0.5 * (1 - rp)).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(mcx, mcy, base + reach * ease(rp), 0, Math.PI * 2); ctx.stroke();
      if (rp > 0.12) {
        var rp2 = (rp - 0.12) / 0.88;
        ctx.strokeStyle = "rgba(255,206,0," + (0.35 * (1 - rp2)).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(mcx, mcy, base + reach * ease(rp2) * 0.8, 0, Math.PI * 2); ctx.stroke();
      }
    }

    if (!bloomDone && t >= T_BLOOM) { bloomDone = true; intro.classList.add("lockup"); }

    // boot counter
    if (pctEl) {
      var cp = Math.min(1, Math.max(0, (t - PCT0) / (PCT1 - PCT0)));
      var n = Math.round(ease(cp) * 100);
      pctEl.textContent = (n < 10 ? "0" : "") + n + "%";
    }

    // the engine owns the intro deadline (timed from ITS t0, not page eval)
    if (!ended && t >= T_BLOOM + 650) { ended = true; window.endIntro && window.endIntro(); }

    if (t < T_BLOOM + 1000) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  }

  /* ---------- CSS-fallback counter: keep 00% ticking when the engine doesn't run ---------- */
  function fallbackCounter() {
    if (!pctEl) return;
    var s = null;
    function tick(ts) {
      if (intro.classList.contains("done")) return;
      if (s === null) s = ts;
      var p = Math.min(1, (ts - s) / 2100); // matches the CSS introLoad bar timing
      var n = Math.round(ease(p) * 100);
      pctEl.textContent = (n < 10 ? "0" : "") + n + "%";
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- boot ---------- */
  function start() {
    // If the mark loaded late, the CSS intro is already mid-play and hijacking
    // it now would blank the visible mark — let CSS finish, just run the counter.
    var late = tEval === null || (performance.now() - tEval) > 280;
    if (late) { fallbackCounter(); return; }
    size();
    // .engine first: it neutralizes the CSS scale/translate on the mark, so the
    // particle targets get measured against the mark's true (locked) geometry
    intro.classList.add("engine");
    parts = build();
    if (!parts) { // sampling failed → default CSS intro plays untouched
      intro.classList.remove("engine");
      fallbackCounter();
      return;
    }
    // the engine took over: its own frame() call ends the intro relative to t0
    if (window.__introTimer) clearTimeout(window.__introTimer);
    window.addEventListener("resize", function () {
      size();
      var again = build();
      if (again) parts = again;
    });
    raf = requestAnimationFrame(frame);
  }

  if (markImg.complete && markImg.naturalWidth) {
    // wait one frame so layout (clamp() sizing) is settled
    requestAnimationFrame(start);
  } else {
    markImg.addEventListener("load", function () { requestAnimationFrame(start); });
    markImg.addEventListener("error", function () { fallbackCounter(); });
  }
})();
