/* ============================================================
   97 WORLD — PRICING PAGE
   Live quote calculator. Selection + country persist in
   localStorage (q97.*) so the quote follows the visitor to the
   start page. Supports preselection via ?svc=web,brand links.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE, S = window.S97;
  var list = document.getElementById("svcList");
  if (!list || !D || !S) return;

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

  /* ---------- render ---------- */
  function render() {
    list.innerHTML = D.services.map(function (s) {
      var on = selected[s.id] ? " sel" : "";
      var pop = s.popular ? ' <span class="pop">Popular</span>' : "";
      return '<div class="svc' + on + '" onclick="toggleSvc(\'' + s.id + '\')">' +
        '<div class="check">✓</div>' +
        '<div class="info"><b>' + s.name + pop + '</b><span>' + s.short + '</span></div>' +
        '<div class="amt">' + S.money(s.usd) + '<small>' + s.days + ' days</small></div>' +
        '</div>';
    }).join("");
  }

  window.toggleSvc = function (id) { selected[id] = !selected[id]; persist(); render(); calc(); };

  /* ---------- totals ---------- */
  function quote() {
    var tot = 0, n = 0;
    D.services.forEach(function (s) { if (selected[s.id]) { tot += s.usd; n++; } });
    return { tot: tot, n: n };
  }
  function put(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function calc() {
    var q = quote();
    put("sumCount", q.n);
    put("sumTotal", q.n ? S.money(q.tot) : "—");
    put("dep1", q.n ? S.money(q.tot / 2) : "—");
    put("dep2", q.n ? S.money(q.tot / 2) : "—");
    updateQbar(q);
  }

  /* ---------- sticky mobile quote bar ---------- */
  function updateQbar(q) {
    var bar = document.getElementById("qbar");
    if (!bar) return;
    put("qbarCount", q.n);
    put("qbarTotal", q.n ? S.money(q.tot) : "—");
    var on = q.n > 0;
    bar.classList.toggle("on", on);
    bar.setAttribute("aria-hidden", String(!on));
    document.body.classList.toggle("qbar-on", on);
  }

  /* ---------- country ---------- */
  window.setCountry = function (c) {
    S.setCountry(c);
    document.querySelectorAll("#ctry button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-c") === c);
    });
    put("curNote", "Showing prices in " + S.curName(c));
    S.paintPrices();
    render(); calc();
  };
  document.querySelectorAll("#ctry button").forEach(function (b) {
    b.classList.toggle("on", b.getAttribute("data-c") === S.getCountry());
  });
  put("curNote", "Showing prices in " + S.curName());

  render(); calc();
  if (window.kickReveals) window.kickReveals();
})();
