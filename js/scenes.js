/* ============================================================
   97 DESIGN — CINEMATIC SCROLL SCENES (home page)
   Crossfades a fixed background <picture> per section as you
   scroll the story 1→5. Scene 1 ships in the HTML (it's the
   LCP); scenes 2–5 are injected here on idle / first interaction
   so they never compete with first paint. Under Save-Data or
   reduced motion the story stays on scene 1.
   ============================================================ */
// @ts-check
(function () {
  "use strict";
  try {
    var scenes = document.getElementById("scenes");
    if (!scenes) return;

    var conn = navigator.connection || {};
    var lite = !!(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""));
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- lazy-inject scenes 2–5 ---------- */
    var injected = lite; // Save-Data: never inject, scene 1 only
    function picture(n) {
      return '<picture>' +
        '<source type="image/avif" media="(max-width:820px)" srcset="assets/bg/bg' + n + '-mobile.avif">' +
        '<source type="image/avif" srcset="assets/bg/bg' + n + '-desktop.avif">' +
        '<source media="(max-width:820px)" srcset="assets/bg/bg' + n + '-mobile.jpg">' +
        '<img src="assets/bg/bg' + n + '-desktop.jpg" alt="" width="1600" height="900" loading="lazy" decoding="async">' +
        '</picture>';
    }
    function inject() {
      if (injected) return;
      injected = true;
      for (var n = 2; n <= 5; n++) {
        var d = document.createElement("div");
        d.className = "scene s" + n;
        d.innerHTML = picture(n);
        scenes.appendChild(d);
      }
    }
    if (!injected) {
      var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1800); };
      idle(inject, { timeout: 2500 });
      window.addEventListener("scroll", inject, { once: true, passive: true });
      window.addEventListener("pointerdown", inject, { once: true, passive: true });
    }

    /* ---------- crossfade per section ---------- */
    var sections = document.querySelectorAll("[data-scene]");
    if (!sections.length || !("IntersectionObserver" in window) || lite || reduce) return;

    var current = "1";
    function activate(n) {
      if (n === current) return;
      var next = scenes.querySelector(".scene.s" + n);
      if (!next) return; // not injected yet — stay on the current scene
      var prev = scenes.querySelector(".scene.s" + current);
      if (prev) prev.classList.remove("active");
      next.classList.add("active");
      current = n;
    }

    // a thin band across the viewport centre: whichever section spans it wins
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) activate(e.target.getAttribute("data-scene"));
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  } catch (err) {
    // fail to content: scene 1 (in the HTML) keeps the page presentable
    if (window.console) console.error("[97] scenes:", err);
  }
})();
