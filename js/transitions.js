/* ============================================================
   97 WORLD — KINETIC (v4) PRELOADER + PAGE TRANSITIONS
   Cold load: a short branded preloader (mark + wordmark + progress
   bar) that hands straight off into the hero entrance timeline —
   one continuous piece of motion, not "preloader, then separately
   whatever the page happens to do."
   In-site navigation: internal link clicks are intercepted, a
   gradient curtain wipes the current page away, then the browser
   navigates for real (this stays a plain multi-page site — no
   client-side router). The arriving page detects it came from a
   transition (sessionStorage flag, read before first paint by the
   inline snippet in <head>) and skips the long preloader, instead
   wiping the curtain away into its own entrance.
   Fires a "k97:entrance" event once the page is clear to animate,
   which motion.js's hero timelines listen for.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var isNav = false;
  try { isNav = sessionStorage.getItem("k97-nav") === "1"; sessionStorage.removeItem("k97-nav"); } catch (e) {}

  var pre = document.getElementById("preloader");
  var curtain = document.getElementById("curtain");

  function fireEntrance() {
    window.dispatchEvent(new CustomEvent("k97:entrance"));
  }

  /* ---------- reveal the page we just landed on ---------- */
  function reveal() {
    if (isNav && curtain) {
      if (pre) pre.remove(); // was only hidden by the is-nav class below — must go before that class does
      document.documentElement.classList.remove("is-nav");
      if (reduce || !hasGsap) { curtain.style.opacity = "0"; curtain.style.transform = "scaleY(0)"; fireEntrance(); return; }
      gsap.to(curtain, {
        scaleY: 0, transformOrigin: "top", opacity: 1, duration: .6, ease: "power3.inOut", delay: .05,
        onComplete: function () { curtain.style.opacity = "0"; fireEntrance(); },
      });
      return;
    }
    if (pre) {
      if (reduce || !hasGsap) { pre.remove(); fireEntrance(); return; }
      var words = pre.querySelectorAll(".pl-word span");
      var tl = gsap.timeline({ onComplete: function () { pre.remove(); fireEntrance(); } });
      tl.to(".pl-mark", { opacity: 1, scale: 1, duration: .5, ease: "back.out(2)" }, 0)
        .to(words, { opacity: 1, y: 0, duration: .5, ease: "power3.out", stagger: .04 }, .1)
        .to(".pl-bar i", { scaleX: 1, duration: .55, ease: "power2.inOut" }, .15)
        .to(pre, { opacity: 0, duration: .5, ease: "power2.inOut" }, "+=.25");
      return;
    }
    fireEntrance();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") reveal();
  else document.addEventListener("DOMContentLoaded", reveal);

  /* ---------- intercept internal link clicks ---------- */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchor
    if (url.href === location.href) return;

    e.preventDefault();
    try { sessionStorage.setItem("k97-nav", "1"); } catch (err) {}
    if (reduce || !hasGsap || !curtain) { location.href = a.href; return; }
    gsap.fromTo(curtain, { scaleY: 0, opacity: 1 }, {
      scaleY: 1, transformOrigin: "bottom", duration: .5, ease: "power3.inOut",
      onComplete: function () { location.href = a.href; },
    });
  });
})();
