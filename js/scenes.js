/* ============================================================
   97 WORLD — CINEMATIC SCROLL SCENES (home page)
   Crossfades a fixed background image per section as you scroll
   the story 1→5 (Lesson → Screen → Hand → Make → Reveal). The
   section whose center crosses the viewport middle wins.
   Scene 1 is active on load; degrades to a static first scene
   without IntersectionObserver.
   ============================================================ */
(function () {
  "use strict";
  var scenes = document.getElementById("scenes");
  if (!scenes) return;

  var byNum = {};
  Array.prototype.forEach.call(scenes.querySelectorAll(".scene"), function (s) {
    var m = /\bs(\d)\b/.exec(s.className);
    if (m) byNum[m[1]] = s;
  });

  var sections = document.querySelectorAll("[data-scene]");
  if (!sections.length || !("IntersectionObserver" in window)) return; // scene 1 stays

  var current = "1";
  function activate(n) {
    if (n === current || !byNum[n]) return;
    if (byNum[current]) byNum[current].classList.remove("active");
    byNum[n].classList.add("active");
    current = n;
  }

  // a thin band across the viewport centre: whichever section spans it is active
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) activate(e.target.getAttribute("data-scene"));
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

  sections.forEach(function (s) { io.observe(s); });
})();
