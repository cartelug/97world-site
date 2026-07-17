/* ============================================================
   97 WORLD — QUOTE CALCULATOR (component)
   Runs anywhere a [data-svc-list] container exists (home page
   and pricing page). All hooks are class-based so multiple
   instances stay in sync. Selection + country persist in
   localStorage (q97.*) so the quote follows the visitor to the
   start page. Supports preselection via ?svc=web,brand links.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE, S = window.S97;
  var lists = document.querySelectorAll("[data-svc-list]");
  if (!lists.length || !D || !S) return;

  /* ---------- state ---------- */
  var selected = {};
  S.getSel().forEach(function (id) { selected[id] = true; });

  // ?svc=web,brand — add to the saved quote, then clean the URL
  (function () {
    var m = /[?&]svc=([^&#]+)/.exec(location.search);
    if (!m) return;
    m[1].split(",").forEach(function (id) {
      if (D.services.some(function (s) { return s.id === id; })) selected[id] = true;
    });
    persist();
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
  })();

  function persist() {
    S.setSel(D.services.filter(function (s) { return selected[s.id]; }).map(function (s) { return s.id; }));
  }

  /* ---------- render (all instances) ---------- */
  function render() {
    var html = D.services.map(function (s) {
      var on = !!selected[s.id];
      var pop = s.popular ? ' <span class="pop">Popular</span>' : "";
      return '<button type="button" class="svc' + (on ? " sel" : "") + '" data-svc="' + s.id + '" aria-pressed="' + on + '">' +
        '<span class="check">✓</span>' +
        '<span class="info"><b>' + s.name + pop + '</b><span>' + s.short + '</span></span>' +
        '<span class="amt">' + S.money(s.usd) + '<small>' + s.days + ' days</small></span>' +
        '</button>';
    }).join("");
    lists.forEach(function (el) { el.innerHTML = html; });
    renderBundles();
  }
  lists.forEach(function (el) {
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".svc");
      if (b) window.toggleSvc(b.getAttribute("data-svc"));
    });
  });

  /* one-tap bundles */
  function renderBundles() {
    var hosts = document.querySelectorAll("[data-bundles]");
    if (!hosts.length || !D.bundles) return;
    var ids = D.services.filter(function (s) { return selected[s.id]; }).map(function (s) { return s.id; }).sort().join(",");
    var html = D.bundles.map(function (b) {
      var on = b.services.slice().sort().join(",") === ids;
      return '<button type="button" class="bundle-chip' + (on ? " on" : "") + '" data-bundle="' + b.id + '" aria-pressed="' + on + '">' +
        "<b>" + b.name + "</b><small>" + b.note + "</small></button>";
    }).join("");
    hosts.forEach(function (h) { h.innerHTML = html; });
  }
  document.addEventListener("click", function (e) {
    var chip = e.target.closest && e.target.closest("[data-bundle]");
    if (!chip) return;
    var b = D.bundles.filter(function (x) { return x.id === chip.getAttribute("data-bundle"); })[0];
    if (!b) return;
    selected = {};
    b.services.forEach(function (id) { selected[id] = true; });
    persist(); render(); calc();
  });

  window.toggleSvc = function (id) { selected[id] = !selected[id]; persist(); render(); calc(); };

  /* ---------- totals (all instances) ---------- */
  function put(cls, v) {
    document.querySelectorAll("." + cls).forEach(function (el) {
      if (el.textContent === String(v)) return;
      el.textContent = v;
      // punched-ticket pop on the item counters
      if (cls === "js-sum-count" || cls === "js-qbar-count") {
        el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
      }
    });
  }
  function quote() {
    var tot = 0, n = 0;
    D.services.forEach(function (s) { if (selected[s.id]) { tot += s.usd; n++; } });
    return { tot: tot, n: n };
  }
  var prevTot = 0, tweenRaf = null;
  var noTween = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function paintTotals(totUsd, n) {
    var dep = Math.floor(totUsd / 2), bal = totUsd - dep;
    put("js-sum-total", n ? S.money(totUsd) : "—");
    put("js-dep", n ? S.money(dep) : "—");
    put("js-bal", n ? S.money(bal) : "—");
    put("js-qbar-total", n ? S.money(dep) : "—");
  }
  function calc() {
    var q = quote();
    put("js-sum-count", q.n);
    // honest timeline: work runs in parallel, so the longest item leads
    var days = 0;
    D.services.forEach(function (s) { if (selected[s.id] && s.days > days) days = s.days; });
    put("js-est", q.n ? "~" + days + " working days" : "—");
    put("js-rate", S.getCountry() === "UG"
      ? "Rate: 1 USD ≈ " + D.usdToUgx.toLocaleString() + " UGX — confirmed in your final quote."
      : "Prices in USD — confirmed in your final quote.");
    // tween money from the previous total (count-up feel)
    if (tweenRaf) cancelAnimationFrame(tweenRaf);
    if (noTween || !q.n || prevTot === q.tot) {
      paintTotals(q.tot, q.n);
    } else {
      var from = prevTot, t0 = null;
      (function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / 500);
        var e = 1 - Math.pow(1 - p, 3);
        paintTotals(Math.round(from + (q.tot - from) * e), q.n);
        if (p < 1) tweenRaf = requestAnimationFrame(step);
      })(performance.now());
    }
    prevTot = q.tot;
    updateQbar(q);
  }

  /* ---------- sticky mobile quote bar ---------- */
  function updateQbar(q) {
    var bars = document.querySelectorAll(".qbar");
    if (!bars.length) return;
    put("js-qbar-count", q.n);
    var on = q.n > 0;
    bars.forEach(function (bar) {
      bar.classList.toggle("on", on);
      bar.setAttribute("aria-hidden", String(!on));
      try { bar.inert = !on; } catch (e) {} // hidden bar must not trap focus
    });
    document.body.classList.toggle("qbar-on", on);
  }

  /* ---------- country: the header pill, mobile-menu selector and this
     calculator's own toggle are all wired site-wide by js/site.js
     (window.setCountry / paintCountryUI). We just re-render rows on change. */
  window.addEventListener("q97country", function () { render(); calc(); });

  // back/forward-cache restore: another page may have changed the saved
  // quote while this document was frozen — re-sync instead of overwriting
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    selected = {};
    S.getSel().forEach(function (id) { selected[id] = true; });
    S.paintPrices();
    render(); calc();
  });

  /* ---------- interactive gate: ask the country first, then reveal prices ----------
     chooseCountry() records the pick, sets the currency site-wide, and reveals
     the price body; changeCountry() reopens the question. Returning visitors
     (already picked) skip straight to the prices. */
  (function gate() {
    var gates = document.querySelectorAll(".price-gate");
    var lives = document.querySelectorAll(".price-live");
    if (!gates.length && !lives.length) return;
    var PK = "q97.picked";
    function picked() { try { return localStorage.getItem(PK) === "1"; } catch (e) { return false; } }
    function reveal() { gates.forEach(function (g) { g.classList.add("done"); }); lives.forEach(function (l) { l.hidden = false; }); }
    function open() { gates.forEach(function (g) { g.classList.remove("done"); }); lives.forEach(function (l) { l.hidden = true; }); }
    window.chooseCountry = function (c) { try { localStorage.setItem(PK, "1"); } catch (e) {} window.setCountry(c); reveal(); };
    window.changeCountry = function () { open(); };
    if (picked()) reveal();
  })();

  render(); calc();
  if (window.kickReveals) window.kickReveals();
})();
