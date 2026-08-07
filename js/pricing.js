/* ============================================================
   97 WORLD — KINETIC (v4) QUOTE CALCULATOR
   Same math as before (50% deposit, country → currency switch,
   longest-service timeline estimate) against the shared K97
   selection state from render.js — just repainted for the new
   card list instead of the old .svc rows.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE, K = window.K97;
  if (!D || !K) return;
  var hasCalc = document.querySelector("[data-svc4-list]");
  if (!hasCalc) return;

  function quote() {
    var ids = K.selectedIds();
    var items = D.services.filter(function (s) { return ids.indexOf(s.id) !== -1; });
    var tot = items.reduce(function (a, s) { return a + s.usd; }, 0);
    var days = items.reduce(function (a, s) { return Math.max(a, s.days); }, 0);
    return { n: items.length, tot: tot, days: days };
  }
  function put(cls, v) {
    document.querySelectorAll("." + cls).forEach(function (el) { el.textContent = v; });
  }
  var prevTot = 0;
  function calc() {
    var q = quote();
    put("js-count", q.n);
    put("js-est", q.n ? "~" + q.days + " working days" : "—");
    var dep = Math.floor(q.tot / 2), bal = q.tot - dep;
    put("js-total", q.n ? K.money(q.tot) : "—");
    put("js-dep", q.n ? K.money(dep) : "—");
    put("js-bal", q.n ? K.money(bal) : "—");
    put("js-qbar-total", q.n ? K.money(dep) : "—");
    put("js-qbar-count", q.n);
    var bars = document.querySelectorAll(".qbar4");
    bars.forEach(function (bar) { bar.classList.toggle("on", q.n > 0); });
    prevTot = q.tot;
  }
  window.addEventListener("k97selchange", calc);
  window.addEventListener("k97country", calc);
  calc();

  /* ---------- bundles: one-tap presets ---------- */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest && e.target.closest("[data-bundle4]");
    if (!chip || !D.bundles) return;
    var b = D.bundles.filter(function (x) { return x.id === chip.getAttribute("data-bundle4"); })[0];
    if (!b) return;
    K.setSel(b.services);
    K.renderSvcList(); calc();
  });

  /* ---------- country gate ---------- */
  (function () {
    var gates = document.querySelectorAll(".price-gate4");
    var lives = document.querySelectorAll(".price-live4");
    if (!gates.length && !lives.length) return;
    var PK = "q97.picked";
    function picked() { try { return localStorage.getItem(PK) === "1"; } catch (e) { return false; } }
    function reveal() { gates.forEach(function (g) { g.classList.add("done"); }); lives.forEach(function (l) { l.classList.add("on"); }); }
    window.chooseCountry4 = function (c) { try { localStorage.setItem(PK, "1"); } catch (e) {} K.setCountry(c); reveal(); };
    window.changeCountry4 = function () { gates.forEach(function (g) { g.classList.remove("done"); }); lives.forEach(function (l) { l.classList.remove("on"); }); };
    if (picked()) reveal();
  })();
})();
