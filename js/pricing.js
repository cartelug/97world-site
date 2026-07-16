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
      var on = selected[s.id] ? " sel" : "";
      var pop = s.popular ? ' <span class="pop">Popular</span>' : "";
      return '<div class="svc' + on + '" onclick="toggleSvc(\'' + s.id + '\')">' +
        '<div class="check">✓</div>' +
        '<div class="info"><b>' + s.name + pop + '</b><span>' + s.short + '</span></div>' +
        '<div class="amt">' + S.money(s.usd) + '<small>' + s.days + ' days</small></div>' +
        '</div>';
    }).join("");
    lists.forEach(function (el) { el.innerHTML = html; });
  }

  window.toggleSvc = function (id) { selected[id] = !selected[id]; persist(); render(); calc(); };

  /* ---------- totals (all instances) ---------- */
  function put(cls, v) {
    document.querySelectorAll("." + cls).forEach(function (el) { el.textContent = v; });
  }
  function quote() {
    var tot = 0, n = 0;
    D.services.forEach(function (s) { if (selected[s.id]) { tot += s.usd; n++; } });
    return { tot: tot, n: n };
  }
  function calc() {
    var q = quote();
    // floor + derive so deposit + balance always equals the quoted total
    var dep = Math.floor(q.tot / 2), bal = q.tot - dep;
    put("js-sum-count", q.n);
    put("js-sum-total", q.n ? S.money(q.tot) : "—");
    put("js-dep", q.n ? S.money(dep) : "—");
    put("js-bal", q.n ? S.money(bal) : "—");
    updateQbar(q);
  }

  /* ---------- sticky mobile quote bar ---------- */
  function updateQbar(q) {
    var bars = document.querySelectorAll(".qbar");
    if (!bars.length) return;
    put("js-qbar-count", q.n);
    put("js-qbar-total", q.n ? S.money(q.tot) : "—");
    var on = q.n > 0;
    bars.forEach(function (bar) {
      bar.classList.toggle("on", on);
      bar.setAttribute("aria-hidden", String(!on));
    });
    document.body.classList.toggle("qbar-on", on);
  }

  /* ---------- country (all toggles) ---------- */
  function paintCountry(c) {
    document.querySelectorAll(".ctry button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-c") === c);
    });
    put("js-cur-note", "Showing prices in " + S.curName(c));
  }
  window.setCountry = function (c) {
    S.setCountry(c);
    paintCountry(c);
    S.paintPrices();
    render(); calc();
  };
  paintCountry(S.getCountry());

  // back/forward-cache restore: another page may have changed the saved
  // quote while this document was frozen — re-sync instead of overwriting
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    selected = {};
    S.getSel().forEach(function (id) { selected[id] = true; });
    paintCountry(S.getCountry());
    S.paintPrices();
    render(); calc();
  });

  render(); calc();
  if (window.kickReveals) window.kickReveals();
})();
