/* ============================================================
   97 WORLD — KINETIC (v4) MOTION LAYER (GSAP-powered)
   Custom cursor + magnetic buttons + card tilt (all via gsap
   quickTo for real spring physicality), cursor-follow spotlight
   glow on cards, a sliding nav indicator, ScrollTrigger-batched
   scroll reveals with real stagger, animated counters, a
   SplitText hero-entrance timeline that plays once transitions.js
   signals the page is clear ("k97:entrance"), and per-page
   flourishes registered by data attributes so this file stays the
   single animation engine for every page rather than one script
   per page.
   Everything here is reduced-motion aware and touch-safe.
   ============================================================ */
(function () {
  "use strict";
  var hasGsap = typeof window.gsap !== "undefined";
  if (!hasGsap) { document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); el.style.opacity = 1; }); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
  gsap.defaults({ ease: "power3.out" });
  if (reduce) ScrollTrigger.normalizeScroll(false);

  /* ---------- custom cursor ---------- */
  (function () {
    if (touch || reduce) { document.documentElement.classList.add("no-cursor"); return; }
    var dot = document.createElement("div"); dot.className = "cur";
    var ring = document.createElement("div"); ring.className = "cur-ring";
    document.body.append(dot, ring);
    var dotX = gsap.quickTo(dot, "x", { duration: .12, ease: "power3" });
    var dotY = gsap.quickTo(dot, "y", { duration: .12, ease: "power3" });
    var ringX = gsap.quickTo(ring, "x", { duration: .35, ease: "power3" });
    var ringY = gsap.quickTo(ring, "y", { duration: .35, ease: "power3" });
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    window.addEventListener("mousemove", function (e) {
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });
    var hoverables = "a, button, .card4, .svc4-row, .work4-card, [data-magnetic]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) { dot.classList.add("hot"); ring.classList.add("hot"); }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverables)) { dot.classList.remove("hot"); ring.classList.remove("hot"); }
    });
    document.addEventListener("mouseleave", function () { gsap.to([dot, ring], { opacity: 0, duration: .2 }); });
    document.addEventListener("mouseenter", function () { gsap.to([dot, ring], { opacity: 1, duration: .2 }); });
  })();

  /* ---------- magnetic buttons ---------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var x = gsap.quickTo(el, "x", { duration: .5, ease: "elastic.out(1,.4)" });
      var y = gsap.quickTo(el, "y", { duration: .5, ease: "elastic.out(1,.4)" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .3);
        y((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener("mouseleave", function () { x(0); y(0); });
    });
  })();

  /* ---------- card tilt ---------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll(".tilt").forEach(function (el) {
      var rx = gsap.quickTo(el, "--rx", { duration: .4, ease: "power3" });
      var ry = gsap.quickTo(el, "--ry", { duration: .4, ease: "power3" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        rx(((e.clientX - r.left) / r.width - .5) * 8);
        ry((-((e.clientY - r.top) / r.height - .5)) * 8);
      });
      el.addEventListener("mouseleave", function () { rx(0); ry(0); });
    });
  })();

  /* ---------- cursor-follow spotlight on cards ---------- */
  (function () {
    if (touch) return;
    document.addEventListener("mousemove", function (e) {
      var card = e.target.closest && e.target.closest(".card4");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  })();

  /* ---------- sliding nav indicator ---------- */
  (function () {
    var nav = document.querySelector(".nav4-links");
    if (!nav) return;
    var pill = document.createElement("span");
    pill.className = "nav4-indicator";
    nav.prepend(pill);
    function moveTo(el) {
      var nr = nav.getBoundingClientRect(), er = el.getBoundingClientRect();
      gsap.to(pill, { x: er.left - nr.left, width: er.width, opacity: 1, duration: .35, ease: "power3.out" });
    }
    var current = nav.querySelector("a.on");
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("mouseenter", function () { moveTo(a); });
    });
    nav.addEventListener("mouseleave", function () {
      if (current) moveTo(current); else gsap.to(pill, { opacity: 0, duration: .25 });
    });
    if (current) requestAnimationFrame(function () { moveTo(current); });
  })();

  /* ---------- nav: glass-in + solidify on scroll ---------- */
  (function () {
    var inner = document.querySelector(".nav4-inner");
    var nav = document.querySelector(".nav4");
    if (!inner) return;
    gsap.to(inner, { opacity: 1, y: 0, duration: .6, ease: "power3.out", delay: .1 });
    ScrollTrigger.create({
      start: 30, onUpdate: function (self) {
        inner.style.background = self.scroll() > 30 ? "rgba(16,16,26,.86)" : "rgba(16,16,26,.6)";
        nav.style.top = self.scroll() > 30 ? "10px" : "16px";
      },
    });
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
    gsap.to(bar, {
      width: "100%", ease: "none",
      scrollTrigger: { scrub: .3, start: "top top", end: "max" },
    });
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

  /* ---------- animated counters (scroll-triggered) ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    if (isNaN(target)) return;
    if (reduce) { el.textContent = target.toLocaleString() + suffix; return; }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: function () { el.textContent = (decimals ? obj.v.toFixed(decimals) : Math.round(obj.v)).toLocaleString() + suffix; },
    });
  });

  /* ---------- scroll reveal: below-fold .rv via ScrollTrigger.batch, grouped for stagger ---------- */
  (function () {
    var heroHost = "main .hero4, main .phero4"; // entrance-timeline territory, handled separately below
    var groups = {};
    document.querySelectorAll(".rv").forEach(function (el) {
      if (el.closest(heroHost)) return;
      var g = el.getAttribute("data-group") || el.id || Math.random();
      (groups[g] = groups[g] || []).push(el);
    });
    if (reduce) {
      Object.values(groups).flat().forEach(function (el) { el.classList.add("in"); });
      return;
    }
    Object.keys(groups).forEach(function (g) {
      var els = groups[g];
      ScrollTrigger.batch(els, {
        start: "top 88%",
        onEnter: function (batch) {
          batch.forEach(function (el, i) { el.style.transitionDelay = Math.min(i * 70, 420) + "ms"; el.classList.add("in"); });
        },
        once: true,
      });
    });
  })();

  /* ---------- hero entrance timeline: waits for transitions.js's "k97:entrance" ---------- */
  window.addEventListener("k97:entrance", function () {
    var hero = document.querySelector(".hero4, .phero4");
    if (!hero) { document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); }); return; }
    if (reduce) { document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); }); return; }

    var heroClass = hero.classList.contains("hero4") ? ".hero4" : ".phero4";
    var h1 = hero.querySelector("h1");
    var rest = document.querySelectorAll(heroClass + " .rv");

    // GSAP owns these elements now — kill the CSS transition first so it
    // can't fight the tween over the same opacity/transform/filter props
    rest.forEach(function (el) { el.style.transition = "none"; });

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (h1 && !h1.dataset.split) {
      h1.dataset.split = "1";
      h1.style.transition = "none";
      gsap.set(h1, { opacity: 1, y: 0, filter: "none" });
      var split = new SplitText(h1, { type: "words,chars", mask: "words", wordsClass: "sw", charsClass: "sc" });
      gsap.set(split.chars, { yPercent: 130, opacity: 0 });
      tl.to(split.chars, { yPercent: 0, opacity: 1, duration: .9, stagger: .015, ease: "power4.out" }, .05);
    }

    rest.forEach(function (el, i) {
      if (el === h1) return;
      tl.fromTo(el, { opacity: 0, y: 34, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .8 }, .15 + i * .07);
    });

    // parallax the mesh blobs gently with scroll (subtle, scrub-based)
    gsap.utils.toArray(".mesh i").forEach(function (blob, i) {
      gsap.to(blob, { y: (i % 2 ? -1 : 1) * 60, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom top", scrub: 1 } });
    });
  });
})();
