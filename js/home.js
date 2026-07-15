/* ============================================================
   97 WORLD — HOME PAGE
   The rotating hero word. Everything else on the home page is
   static markup animated by the shared engine (js/site.js).
   ============================================================ */
(function () {
  "use strict";
  var el = document.getElementById("rotWord");
  if (!el) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { el.textContent = "PROOF."; return; }

  var words = ["WEBSITES.", "FLIERS.", "BRANDS.", "LOGOS.", "SOCIAL.", "PROOF."];
  var i = words.length - 1; // start on PROOF., matching the intro line

  function next() {
    i = (i + 1) % words.length;
    el.classList.remove("swap");
    // restart the CSS animation
    void el.offsetWidth;
    el.textContent = words[i];
    el.classList.add("swap");
    // hold the slogan word longer than the service words
    setTimeout(next, words[i] === "PROOF." ? 3000 : 1500);
  }
  setTimeout(next, 3200);
})();
