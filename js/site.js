/* ============================================================
   97 WORLD — SHARED SITE ENGINE (all pages)
   Aurora background, cursor, scroll FX, reveals, nav + mobile
   menu, intro (home only), live clocks, count-ups, money utils.
   Vanilla JS, no dependencies, honours reduced motion.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE;
  var mqf = window.matchMedia ? window.matchMedia.bind(window) : function () { return { matches: false }; };
  var reduce = mqf("(prefers-reduced-motion: reduce)").matches;
  var fine = mqf("(hover: hover) and (pointer: fine)").matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };

  /* ---------- money / quote persistence (shared) ---------- */
  function getCountry() {
    try { return localStorage.getItem("q97.ctry") === "SS" ? "SS" : "UG"; } catch (e) { return "UG"; }
  }
  function setCountry(c) { try { localStorage.setItem("q97.ctry", c); } catch (e) {} }
  function getSel() {
    try { return JSON.parse(localStorage.getItem("q97.sel") || "[]"); } catch (e) { return []; }
  }
  function setSel(ids) { try { localStorage.setItem("q97.sel", JSON.stringify(ids)); } catch (e) {} }
  function money(usd, c) {
    c = c || getCountry();
    if (c === "UG") return Math.round(usd * D.usdToUgx).toLocaleString() + " UGX";
    return "$" + Math.round(usd).toLocaleString();
  }
  function curName(c) { return (c || getCountry()) === "UG" ? "Ugandan Shillings (UGX)" : "US Dollars (USD)"; }
  window.S97 = { money: money, curName: curName, getCountry: getCountry, setCountry: setCountry, getSel: getSel, setSel: setSel };

  /* format any [data-usd] price stubs in the current currency */
  function paintPrices() {
    document.querySelectorAll("[data-usd]").forEach(function (el) {
      el.textContent = money(parseFloat(el.getAttribute("data-usd")));
    });
  }
  window.S97.paintPrices = paintPrices;

  /* ---------- aurora background ---------- */
  (function aurora() {
    var canvas = document.getElementById("fxCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = 1, H = 1, SCALE = 0.42;
    var blobs = [
      { c: [255, 206, 0],  r: 0.62, ax: 0.20, ay: 0.14, px: 0.0, py: 1.1, sx: 0.00013, sy: 0.00017 },
      { c: [217, 0, 0],    r: 0.46, ax: 0.24, ay: 0.18, px: 2.1, py: 0.4, sx: 0.00017, sy: 0.00011 },
      { c: [15, 71, 175],  r: 0.66, ax: 0.22, ay: 0.20, px: 4.0, py: 3.2, sx: 0.00011, sy: 0.00015 },
      { c: [7, 137, 48],   r: 0.44, ax: 0.18, ay: 0.22, px: 1.2, py: 5.0, sx: 0.00015, sy: 0.00013 },
      { c: [124, 92, 255], r: 0.40, ax: 0.26, ay: 0.16, px: 3.4, py: 2.0, sx: 0.00012, sy: 0.00016 }
    ];
    function size() {
      W = canvas.width = Math.max(2, Math.floor(window.innerWidth * SCALE));
      H = canvas.height = Math.max(2, Math.floor(window.innerHeight * SCALE));
    }
    size(); window.addEventListener("resize", size);
    var p = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 };
    if (fine) window.addEventListener("pointermove", function (e) {
      p.tx = e.clientX / window.innerWidth; p.ty = e.clientY / window.innerHeight;
    }, { passive: true });
    function blob(x, y, rad, col) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      var h = "rgba(" + col[0] + "," + col[1] + "," + col[2] + ",";
      g.addColorStop(0, h + "0.42)"); g.addColorStop(0.45, h + "0.14)"); g.addColorStop(1, h + "0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    function draw(t) {
      p.x += (p.tx - p.x) * 0.05; p.y += (p.ty - p.y) * 0.05;
      var base = Math.max(W, H), ox = (p.x - 0.5) * W * 0.12, oy = (p.y - 0.5) * H * 0.12;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        blob(W * (0.5 + b.ax * Math.sin(t * b.sx + b.px)) + ox,
             H * (0.5 + b.ay * Math.cos(t * b.sy + b.py)) + oy, base * b.r, b.c);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    if (reduce) { draw(9000); return; }
    (function loop(ts) { if (!document.hidden) draw(ts || 0); raf(loop); })(0);
  })();

  /* ---------- spotlight cursor ---------- */
  if (fine && !reduce) (function () {
    var glow = document.querySelector(".cursor-glow"), dot = document.querySelector(".cursor-dot");
    if (!glow || !dot) return;
    var gx = innerWidth / 2, gy = innerHeight / 2, dx = gx, dy = gy, mx = gx, my = gy, shown = false;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; glow.style.opacity = "1"; dot.style.opacity = "1"; }
    }, { passive: true });
    window.addEventListener("pointerout", function (e) {
      if (!e.relatedTarget) { glow.style.opacity = "0"; dot.style.opacity = "0"; }
    });
    var hot = "a,button,.svc,.work,.exp-line,.bcard,input,textarea,select,label,summary";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(hot)) dot.classList.add("hot");
      else dot.classList.remove("hot");
    });
    (function follow() {
      gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
      dx += (mx - dx) * 0.35; dy += (my - dy) * 0.35;
      glow.style.transform = "translate(" + gx + "px," + gy + "px) translate(-50%,-50%)";
      dot.style.transform = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
      raf(follow);
    })();
  })();

  /* ---------- scroll progress + header state ---------- */
  (function () {
    var bar = document.querySelector(".scroll-progress i");
    var nav = document.getElementById("nav");
    var tick = false;
    function upd() {
      var h = document.documentElement;
      if (bar) bar.style.width = (Math.min(1, h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1)) * 100).toFixed(2) + "%";
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);
      tick = false;
    }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; raf(upd); } }, { passive: true });
    upd();
  })();

  /* ---------- reveal on scroll (staggered) ---------- */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 }) : null;
  function kickReveals() {
    if (!io) { document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); }); return; }
    var groups = {};
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      var key = el.parentNode ? (el.parentNode.id || el.parentNode.className || "root") : "root";
      var i = (groups[key] = (groups[key] || 0)); groups[key]++;
      if (!el.style.transitionDelay) el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
      io.observe(el);
    });
  }
  window.kickReveals = kickReveals;

  /* ---------- magnetic + tilt (fine pointers) ---------- */
  if (fine && !reduce) {
    document.querySelectorAll(".btn.primary,.nav-cta,.send-wa,.float-wa,.ctry button").forEach(function (el) {
      var k = el.classList.contains("float-wa") ? 0.4 : 0.28;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * k) + "px," +
          ((e.clientY - r.top - r.height / 2) * k - 2) + "px) scale(1.03)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
    document.querySelectorAll(".work,.bcard.tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = "perspective(1000px) rotateX(" + ((0.5 - py) * 7).toFixed(2) + "deg) rotateY(" +
          ((px - 0.5) * 9).toFixed(2) + "deg) translateY(-5px)";
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- parallax for [data-plx] ---------- */
  if (!reduce) (function () {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-plx]"));
    if (!els.length) return;
    var tick = false;
    function upd() {
      var y = window.pageYOffset;
      els.forEach(function (el) { el.style.transform = "translate3d(0," + (y * parseFloat(el.getAttribute("data-plx"))) + "px,0)"; });
      tick = false;
    }
    window.addEventListener("scroll", function () {
      if (window.pageYOffset < window.innerHeight * 1.6 && !tick) { tick = true; raf(upd); }
    }, { passive: true });
  })();

  /* ---------- count-up for [data-count] ---------- */
  (function () {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || !io) return;
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, target = parseInt(el.getAttribute("data-count"), 10);
        if (!target || reduce) { el.textContent = el.getAttribute("data-count"); return; }
        var t0 = null, dur = 1100;
        el.textContent = "0";
        (function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toString();
          if (p < 1) raf(step);
        })(performance.now());
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { cio.observe(n); });
  })();

  /* ---------- live clocks (.clock[data-tz]) ---------- */
  (function () {
    var clocks = document.querySelectorAll(".clock[data-tz]");
    if (!clocks.length) return;
    function tick() {
      clocks.forEach(function (el) {
        try {
          el.textContent = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit", minute: "2-digit", hour12: false, timeZone: el.getAttribute("data-tz")
          }).format(new Date());
        } catch (e) { el.textContent = ""; }
      });
    }
    tick(); setInterval(tick, 20000);
  })();

  /* ---------- mobile menu ---------- */
  window.toggleMenu = function () {
    var m = document.getElementById("mmenu"), b = document.getElementById("burger");
    if (!m || !b) return;
    var open = !m.classList.contains("open");
    m.classList.toggle("open", open);
    m.setAttribute("aria-hidden", String(!open));
    b.classList.toggle("x", open);
    b.setAttribute("aria-expanded", String(open));
    b.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
  };
  document.querySelectorAll("#mmenu a").forEach(function (a) {
    a.addEventListener("click", function () {
      var m = document.getElementById("mmenu");
      if (m && m.classList.contains("open")) window.toggleMenu();
    });
  });

  /* ---------- intro (home only) — plays once per session ---------- */
  var intro = document.getElementById("intro");
  function endIntro() {
    if (!intro || intro.classList.contains("done")) return;
    intro.classList.add("done");
    try { sessionStorage.setItem("i97", "1"); } catch (e) {}
    var nav = document.getElementById("nav");
    if (nav) nav.classList.add("reveal-nav");
    kickReveals();
  }
  window.endIntro = endIntro;
  if (intro) {
    var seen = false;
    try { seen = !!sessionStorage.getItem("i97"); } catch (e) {}
    if (seen || reduce) {
      intro.classList.add("done", "instant");
      var nav0 = document.getElementById("nav");
      if (nav0) nav0.classList.add("reveal-nav");
    } else {
      // safety net; js/intro.js takes ownership of the deadline when its
      // particle engine actually starts (clears this and re-times from t0)
      window.__introTimer = setTimeout(endIntro, 4600);
    }
  } else {
    var nav1 = document.getElementById("nav");
    if (nav1) nav1.classList.add("reveal-nav");
  }

  /* ---------- services catalog (services page) ---------- */
  (function () {
    var host = document.getElementById("svcCatalog");
    if (!host || !D) return;
    host.innerHTML = D.services.map(function (s) {
      return '<article class="cat-row reveal" id="' + s.id + '">' +
        '<div class="cat-main">' +
          '<div class="cat-head"><span class="cat-tag">' + s.cat + '</span><h3>' + s.name + '</h3>' +
          (s.popular ? '<span class="pop">Popular</span>' : '') + '</div>' +
          '<p class="pitch">' + s.pitch + '</p>' +
          '<ul class="includes">' + s.includes.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        '<aside class="cat-side">' +
          '<span class="from">From</span>' +
          '<span class="price" data-usd="' + s.usd + '"></span>' +
          '<span class="days">~' + s.days + ' days · 50% to start</span>' +
          '<a class="btn primary" href="pricing.html?svc=' + s.id + '">Add to quote →</a>' +
        '</aside></article>';
    }).join('');
  })();

  /* ---------- FAQ (any [data-faq] container) ---------- */
  (function () {
    var hosts = document.querySelectorAll("[data-faq]");
    if (!hosts.length || !D) return;
    hosts.forEach(function (host) {
      host.innerHTML = D.faqs.map(function (f) {
        return '<details><summary>' + f.q + '</summary><p class="a">' + f.a + '</p></details>';
      }).join('');
    });
  })();

  /* ---------- init ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
  paintPrices();
  kickReveals();
})();
