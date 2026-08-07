/* ============================================================
   97 WORLD — KINETIC (v4) MOTION LAYER
   Custom cursor, magnetic buttons, card tilt, scroll-reveal with
   stagger, animated counters, glass nav, mobile menu, marquee
   duplication, scroll progress. Pure DOM/CSS — no dependencies.
   Every effect is reduced-motion aware and touch-safe.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------- custom cursor ---------- */
  (function () {
    if (touch || reduce) { document.documentElement.classList.add("no-cursor"); return; }
    var dot = document.createElement("div"); dot.className = "cur";
    var ring = document.createElement("div"); ring.className = "cur-ring";
    document.body.append(dot, ring);
    var mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    var hoverables = "a, button, .card4, .svc4-row, .work4-card, [data-magnetic]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) { dot.classList.add("hot"); ring.classList.add("hot"); }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) { dot.classList.remove("hot"); ring.classList.remove("hot"); }
    });
    document.addEventListener("mouseleave", function () { dot.style.opacity = "0"; ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", function () { dot.style.opacity = "1"; ring.style.opacity = "1"; });
  })();

  /* ---------- magnetic buttons ---------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var rect;
      el.addEventListener("mouseenter", function () { rect = el.getBoundingClientRect(); });
      el.addEventListener("mousemove", function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var relX = e.clientX - rect.left - rect.width / 2;
        var relY = e.clientY - rect.top - rect.height / 2;
        el.style.transform = "translate(" + relX * 0.28 + "px," + relY * 0.32 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  })();

  /* ---------- card tilt ---------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--rx", (px * 8).toFixed(2));
        el.style.setProperty("--ry", (-py * 8).toFixed(2));
      });
      el.addEventListener("mouseleave", function () {
        el.style.setProperty("--rx", 0); el.style.setProperty("--ry", 0);
      });
    });
  })();

  /* ---------- scroll reveal (stagger via --i) ---------- */
  (function () {
    var els = document.querySelectorAll(".rv");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var groups = {};
    els.forEach(function (el) {
      var g = el.getAttribute("data-group") || "_";
      (groups[g] = groups[g] || []).push(el);
    });
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (el, i) { el.style.transitionDelay = Math.min(i * 70, 420) + "ms"; });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- animated counters ---------- */
  (function () {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
      if (reduce || isNaN(target)) { el.textContent = target.toLocaleString() + suffix; return; }
      var from = 0, t0 = null, dur = 1400;
      (function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = from + (target - from) * eased;
        el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }
    if (!("IntersectionObserver" in window)) { els.forEach(animate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- nav: glass-in + solidify on scroll ---------- */
  (function () {
    var inner = document.querySelector(".nav4-inner");
    var nav = document.querySelector(".nav4");
    if (!inner) return;
    requestAnimationFrame(function () { inner.classList.add("on"); });
    function paint() {
      var sc = window.scrollY > 30;
      inner.style.background = sc ? "rgba(16,16,26,.86)" : "rgba(16,16,26,.6)";
      nav.style.top = sc ? "10px" : "16px";
    }
    paint();
    window.addEventListener("scroll", paint, { passive: true });
  })();

  /* ---------- mobile menu ---------- */
  window.toggleMenu4 = function () {
    var m = document.getElementById("mmenu4");
    var b = document.getElementById("burger4");
    var open = m.classList.toggle("open");
    b.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("lock", open);
  };
  document.querySelectorAll(".mmenu4-links a").forEach(function (a, i) {
    a.style.setProperty("--i", i);
    a.addEventListener("click", function () {
      document.getElementById("mmenu4").classList.remove("open");
      document.body.classList.remove("lock");
    });
  });

  /* ---------- scroll progress bar ---------- */
  (function () {
    var bar = document.querySelector(".progress4 i");
    if (!bar) return;
    function paint() {
      var h = document.documentElement;
      var scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.width = Math.min(100, scrolled * 100) + "%";
    }
    paint();
    document.addEventListener("scroll", paint, { passive: true });
  })();

  /* ---------- marquee: duplicate track content so the loop tiles seamlessly ---------- */
  document.querySelectorAll("[data-marquee]").forEach(function (host) {
    var track = host.querySelector(".marquee4-track");
    if (!track || track.dataset.doubled) return;
    track.insertAdjacentHTML("beforeend", track.innerHTML);
    track.dataset.doubled = "1";
  });

  /* ---------- live nation clocks ---------- */
  function paintClocks() {
    document.querySelectorAll("[data-clock]").forEach(function (el) {
      var tz = el.getAttribute("data-clock");
      try {
        el.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date());
      } catch (e) { el.textContent = "--:--"; }
    });
  }
  if (document.querySelector("[data-clock]")) { paintClocks(); setInterval(paintClocks, 15000); }

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- lightweight intro (home only): logo draws in, fades ---------- */
  (function () {
    var intro = document.getElementById("intro4");
    if (!intro) return;
    if (reduce || sessionStorage.getItem("k97-intro")) { intro.remove(); return; }
    try { sessionStorage.setItem("k97-intro", "1"); } catch (e) {}
    setTimeout(function () {
      intro.classList.add("done");
      setTimeout(function () { intro.remove(); }, 700);
    }, 900);
  })();
})();
