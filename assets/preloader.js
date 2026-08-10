(function () {
  "use strict";
  function hide() {
    var el = document.getElementById("k97pl");
    if (!el) return;
    el.classList.add("k97pl-hide");
    setTimeout(function () { el.remove(); }, 550);
  }
  if (document.readyState === "complete") hide();
  else window.addEventListener("load", hide);
  setTimeout(hide, 2500); // safety timeout so a slow asset never traps the visitor
})();
