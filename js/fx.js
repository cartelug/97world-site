/* ============================================================
   97 WORLD — FX ENGINE
   Flowing gradient background, spotlight cursor, magnetic CTAs,
   3D tilt + sheen cards, scroll parallax, count-up numbers,
   scroll-progress bar. Vanilla JS, no dependencies.
   Everything degrades gracefully and honours reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var mq = window.matchMedia ? window.matchMedia.bind(window) : function () { return { matches: false, addListener: function () {} }; };
  var reduce = mq("(prefers-reduced-motion: reduce)").matches;
  var fine = mq("(hover: hover) and (pointer: fine)").matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };

  /* ------------------------------------------------------------
     1. FLOWING GRADIENT BACKGROUND (canvas aurora)
     ------------------------------------------------------------ */
  (function aurora() {
    var canvas = document.getElementById("fxCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = 1, H = 1;
    // rendered at low resolution then blurred in CSS — cheap + silky
    var SCALE = 0.42;

    // brand-coloured drifting blobs [r,g,b, radius%, ampX, ampY, phaseX, phaseY, speedX, speedY]
    var blobs = [
      { c: [255, 206, 0],  r: 0.62, ax: 0.20, ay: 0.14, px: 0.0, py: 1.1, sx: 0.00013, sy: 0.00017 },
      { c: [217, 0, 0],    r: 0.46, ax: 0.24, ay: 0.18, px: 2.1, py: 0.4, sx: 0.00017, sy: 0.00011 },
      { c: [15, 71, 175],  r: 0.66, ax: 0.22, ay: 0.20, px: 4.0, py: 3.2, sx: 0.00011, sy: 0.00015 },
      { c: [7, 137, 48],   r: 0.44, ax: 0.18, ay: 0.22, px: 1.2, py: 5.0, sx: 0.00015, sy: 0.00013 },
      { c: [124, 92, 255], r: 0.40, ax: 0.26, ay: 0.16, px: 3.4, py: 2.0, sx: 0.00012, sy: 0.00016 }
    ];

    function size() {
      W = canvas.width  = Math.max(2, Math.floor(window.innerWidth  * SCALE));
      H = canvas.height = Math.max(2, Math.floor(window.innerHeight * SCALE));
    }
    size();
    window.addEventListener("resize", size);

    // pointer nudges the aurora slightly for a "living" feel
    var pointer = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 };
    if (fine) {
      window.addEventListener("pointermove", function (e) {
        pointer.tx = e.clientX / window.innerWidth;
        pointer.ty = e.clientY / window.innerHeight;
      }, { passive: true });
    }

    function frame(x, y, rad, col, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      var head = "rgba(" + col[0] + "," + col[1] + "," + col[2] + ",";
      g.addColorStop(0,    head + (0.42 * a) + ")");
      g.addColorStop(0.45, head + (0.14 * a) + ")");
      g.addColorStop(1,    head + "0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function draw(t) {
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      var base = Math.max(W, H);
      var ox = (pointer.x - 0.5) * W * 0.12;
      var oy = (pointer.y - 0.5) * H * 0.12;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var x = W * (0.5 + b.ax * Math.sin(t * b.sx + b.px)) + ox;
        var y = H * (0.5 + b.ay * Math.cos(t * b.sy + b.py)) + oy;
        frame(x, y, base * b.r, b.c, 1);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    if (reduce) { draw(9000); return; }              // one static, pretty frame
    (function loop(ts) {
      if (!document.hidden) draw(ts || 0);
      raf(loop);
    })(0);
  })();

  /* ------------------------------------------------------------
     2. SPOTLIGHT CURSOR (fine pointers only)
     ------------------------------------------------------------ */
  if (fine && !reduce) {
    var glow = document.querySelector(".cursor-glow");
    var dot  = document.querySelector(".cursor-dot");
    if (glow && dot) {
      var gx = window.innerWidth / 2, gy = window.innerHeight / 2, dx = gx, dy = gy;
      var mx = gx, my = gy, shown = false;
      window.addEventListener("pointermove", function (e) {
        mx = e.clientX; my = e.clientY;
        if (!shown) { shown = true; glow.style.opacity = "1"; dot.style.opacity = "1"; }
      }, { passive: true });
      window.addEventListener("pointerout", function (e) {
        if (!e.relatedTarget) { glow.style.opacity = "0"; dot.style.opacity = "0"; }
      });
      // grow dot over interactive targets
      var hotSel = "a,button,.svc,.work,.exp-line,input,textarea,select,label";
      document.addEventListener("pointerover", function (e) {
        if (e.target.closest && e.target.closest(hotSel)) dot.classList.add("hot");
        else dot.classList.remove("hot");
      });
      (function follow() {
        gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
        dx += (mx - dx) * 0.35; dy += (my - dy) * 0.35;
        glow.style.transform = "translate(" + gx + "px," + gy + "px) translate(-50%,-50%)";
        dot.style.transform  = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
        raf(follow);
      })();
    }
  }

  /* ------------------------------------------------------------
     3. SCROLL PROGRESS BAR
     ------------------------------------------------------------ */
  (function progress() {
    var bar = document.querySelector(".scroll-progress i");
    if (!bar) return;
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      bar.style.width = (Math.min(1, h.scrollTop / max) * 100).toFixed(2) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; raf(update); }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------
     4. MAGNETIC BUTTONS (fine pointers only)
     ------------------------------------------------------------ */
  if (fine && !reduce) {
    var mags = document.querySelectorAll(".btn.primary,.nav-cta,.send-wa,.float-wa,.ctry button");
    Array.prototype.forEach.call(mags, function (el) {
      var strength = el.classList.contains("float-wa") ? 0.4 : 0.28;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = "translate(" + x + "px," + (y - 2) + "px) scale(1.03)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------
     5. 3D TILT + SHEEN on work cards (fine pointers only)
     ------------------------------------------------------------ */
  if (fine && !reduce) {
    var tiltCards = document.querySelectorAll(".work");
    Array.prototype.forEach.call(tiltCards, function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * 9;
        var ry = (px - 0.5) * 11;
        card.style.transform = "perspective(1000px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-6px)";
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------
     6. PARALLAX — hero glows / grid drift on scroll
     ------------------------------------------------------------ */
  if (!reduce) {
    var layers = [
      { el: document.querySelector(".glow.a"),   f: 0.18 },
      { el: document.querySelector(".glow.b"),   f: -0.12 },
      { el: document.querySelector(".hero-grid"), f: 0.06 }
    ].filter(function (l) { return l.el; });
    var pTick = false;
    function px() {
      var y = window.pageYOffset;
      layers.forEach(function (l) { l.el.style.transform = "translate3d(0," + (y * l.f) + "px,0)"; });
      pTick = false;
    }
    window.addEventListener("scroll", function () {
      if (window.pageYOffset < window.innerHeight * 1.3 && !pTick) { pTick = true; raf(px); }
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     7. COUNT-UP hero stats
     ------------------------------------------------------------ */
  (function countUp() {
    var nums = document.querySelectorAll(".hero-meta .m b");
    if (!nums.length) return;
    function run(el) {
      var target = parseInt((el.textContent || "").replace(/[^0-9]/g, ""), 10);
      if (!target || reduce) return;
      var dur = 1100, t0 = null;
      el.textContent = "0";
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toString();
        if (p < 1) raf(step);
      }
      raf(step);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.5 });
      Array.prototype.forEach.call(nums, function (n) {
        if (/\d/.test(n.textContent)) io.observe(n);
      });
    }
  })();

})();
