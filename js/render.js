/* ============================================================
   97 WORLD — KINETIC (v4) DATA RENDER LAYER
   Renders window.SITE (js/data.js — untouched, still the single
   source of truth) into the new v4 markup. Owns money formatting,
   country/currency state (localStorage, same keys as before so a
   quote already on a visitor's device still resolves), and the
   selection state the pricing calculator and start-page summary
   both read from.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE;
  if (!D) return;

  /* ---------- money + country (shared, same localStorage keys as before) ---------- */
  var CK = "q97.ctry", SK = "q97.sel";
  function getCountry() { try { return localStorage.getItem(CK) || "UG"; } catch (e) { return "UG"; } }
  function setCountry(c) {
    try { localStorage.setItem(CK, c); } catch (e) {}
    document.querySelectorAll("[data-country-flag]").forEach(function (el) { el.textContent = c; });
    window.dispatchEvent(new CustomEvent("k97country"));
  }
  function money(usd) {
    if (getCountry() === "UG") {
      var ugx = Math.round(usd * D.usdToUgx / 1000) * 1000;
      return ugx.toLocaleString() + " UGX";
    }
    return "$" + usd.toLocaleString();
  }
  function getSel() { try { return JSON.parse(localStorage.getItem(SK) || "[]"); } catch (e) { return []; } }
  function setSel(ids) { try { localStorage.setItem(SK, JSON.stringify(ids)); } catch (e) {} }

  var K = window.K97 = { money: money, getCountry: getCountry, setCountry: setCountry, getSel: getSel, setSel: setSel };

  /* ---------- paint prices whenever country changes ---------- */
  function paintPrices() {
    document.querySelectorAll("[data-usd]").forEach(function (el) {
      var usd = parseFloat(el.getAttribute("data-usd"));
      if (!isNaN(usd)) el.textContent = money(usd);
    });
  }
  window.addEventListener("k97country", paintPrices);
  K.paintPrices = paintPrices;

  /* ---------- services list (services.html, pricing.html, home) ---------- */
  var selected = {};
  getSel().forEach(function (id) { selected[id] = true; });
  function persistSel() { setSel(D.services.filter(function (s) { return selected[s.id]; }).map(function (s) { return s.id; })); }

  var lastToggled = null;
  function renderSvcList() {
    var hosts = document.querySelectorAll("[data-svc4-list]");
    if (!hosts.length) return;
    var html = D.services.map(function (s, i) {
      var on = !!selected[s.id];
      var justPopped = on && s.id === lastToggled;
      return '<button type="button" class="svc4-row card4' + (on ? " sel" : "") + '" data-svc4="' + s.id + '" aria-pressed="' + on + '">' +
        '<span class="l"><span class="num mono">0' + (i + 1) + '</span>' +
        '<h3>' + s.name + (s.popular ? ' <span class="tag4 pop">Popular</span>' : "") + '</h3>' +
        '<p>' + s.short + "</p></span>" +
        '<span class="r"><span class="price" data-usd="' + s.usd + '">' + money(s.usd) + '</span><span class="days mono">~' + s.days + " days</span></span>" +
        '<span class="check4' + (justPopped ? " pop" : "") + '">✓</span></button>';
    }).join("");
    hosts.forEach(function (el) { el.innerHTML = html; });
    lastToggled = null;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-svc4]");
    if (!b) return;
    var id = b.getAttribute("data-svc4");
    selected[id] = !selected[id];
    lastToggled = selected[id] ? id : null;
    persistSel(); renderSvcList(); paintPrices();
    window.dispatchEvent(new CustomEvent("k97selchange"));
  });
  K.renderSvcList = renderSvcList;
  K.selectedIds = function () { return D.services.filter(function (s) { return selected[s.id]; }).map(function (s) { return s.id; }); };

  /* ---------- catalog (services.html full pitch cards) ---------- */
  function renderCatalog() {
    var host = document.querySelector("[data-catalog4]");
    if (!host) return;
    host.innerHTML = D.services.map(function (s, i) {
      return '<article class="svc4-row card4 rv" data-group="cat">' +
        '<span class="l"><span class="num mono">0' + (i + 1) + " · " + s.cat.toUpperCase() + '</span>' +
        '<h3>' + s.name + (s.popular ? ' <span class="tag4 pop">Popular</span>' : "") + '</h3>' +
        '<p>' + s.pitch + "</p></span>" +
        '<span class="r"><span class="price" data-usd="' + s.usd + '">' + money(s.usd) + '</span><span class="days mono">~' + s.days + ' days</span>' +
        '<a class="btn4 grad sm" href="/pricing/?svc=' + s.id + '">Add to quote</a></span></article>';
    }).join("");
  }

  /* ---------- work / case studies ---------- */
  function renderWork(limit) {
    var host = document.querySelector("[data-work4]");
    if (!host) return;
    var items = limit ? D.work.filter(function (w) { return w.featured; }).slice(0, limit) : D.work;
    host.innerHTML = items.map(function (w) {
      var d = w.disp || {};
      var img = d.shot ? '<picture><source srcset="/assets/work/' + d.shot + '.avif" type="image/avif"><img src="/assets/work/' + d.shot + '.jpg" alt="' + w.project + '" loading="lazy"></picture>' :
        '<div class="placeholder" style="background:' + (d.accent || "var(--grad-cta)") + ';-webkit-background-clip:text;background-clip:text;color:transparent">' + (d.title || w.project).slice(0, 2) + '</div>';
      return '<article class="work4-card card4 tilt rv" data-group="work">' +
        '<div class="shot">' + img + '</div>' +
        '<div class="body"><span class="type">' + (d.typeLabel || w.type) + '</span>' +
        '<h3>' + (d.title || w.project) + '</h3><p>' + w.description + '</p>' +
        '<div class="foot"><span class="status4' + (w.status !== "Live" ? " soon" : "") + '"><i></i>' + w.status + '</span>' +
        (w.link ? '<a href="' + w.link + '" target="_blank" rel="noopener" class="btn4 ghost sm" data-magnetic>Visit ↗</a>' : '<a href="/work/#' + (d.id || "") + '" class="btn4 ghost sm">Details</a>') +
        "</div></div></article>";
    }).join("");
  }

  /* ---------- FAQ ---------- */
  function renderFaq() {
    var host = document.querySelector("[data-faq4]");
    if (!host || !D.faqs) return;
    host.innerHTML = D.faqs.map(function (f) {
      return '<details class="card4 rv" data-group="faq"><summary>' + f.q + '<span class="plus" aria-hidden="true">+</span></summary><p class="a">' + f.a + "</p></details>";
    }).join("");
  }

  /* ---------- process rail ---------- */
  function renderProcess() {
    var host = document.querySelector("[data-proc4]");
    if (!host || !D.process) return;
    host.innerHTML = D.process.map(function (p, i) {
      return '<div class="p card4 rv" data-group="proc"><div class="n mono">0' + (i + 1) + '</div>' +
        '<div class="when mono">' + p.when + " · " + p.who + '</div><h3>' + p.k + "</h3><p>" + p.d + "</p></div>";
    }).join("");
  }

  /* ---------- client marquee ---------- */
  function renderClientMarquee() {
    var host = document.querySelector("[data-clients4]");
    if (!host || !D.clients) return;
    host.setAttribute("aria-label", "Selected clients");
    host.innerHTML = D.clients.map(function (c) { return "<span>" + c.name + " <i aria-hidden=\"true\">✦</i></span>"; }).join("");
  }

  /* ---------- partners grid (partners.html) ---------- */
  function renderPartners() {
    var host = document.querySelector("[data-partners4]");
    if (!host || !D.clients) return;
    host.innerHTML = D.clients.map(function (c, i) {
      var num = "NO. " + String(i + 1).padStart(2, "0");
      var action = c.link ? '<a class="btn4 ghost sm" href="' + c.link + '" target="_blank" rel="noopener">Visit ↗</a>' :
        c.ref ? '<a class="btn4 ghost sm" href="/work/#' + c.ref + '">More info</a>' :
        '<a class="btn4 ghost sm" href="https://wa.me/' + D.whatsapp + '" target="_blank" rel="noopener">Ask us</a>';
      return '<div class="card4 rv" data-group="partners" style="--pc:' + c.c + ';padding:18px;display:flex;flex-direction:column;gap:14px;border-top:3px solid ' + c.c + '">' +
        '<picture><source srcset="/assets/clients/' + c.id + '.avif" type="image/avif"><img src="/assets/clients/' + c.id + '.jpg" alt="' + c.name + ' logo" loading="lazy" style="border-radius:10px;aspect-ratio:3/2;object-fit:cover"></picture>' +
        '<span class="mono" style="font-size:10px;letter-spacing:.1em;color:var(--dim)">' + num + '</span>' +
        '<h3 style="font-family:var(--font-display);font-size:16px;font-weight:700">' + c.name + "</h3>" + action + "</div>";
    }).join("");
  }

  /* ---------- principles (home teaser + about.html) ---------- */
  function renderPrinciples() {
    var hosts = document.querySelectorAll("[data-principles4]");
    if (!hosts.length || !D.principles) return;
    var html = D.principles.map(function (pr, i) {
      return '<div class="card4 rv" data-group="principles" style="padding:22px">' +
        '<span class="mono" style="font-size:10px;color:var(--dim);letter-spacing:.1em">ART. 0' + (i + 1) + '</span>' +
        '<h3 style="font-family:var(--font-display);font-size:16px;font-weight:700;margin:10px 0 6px">' + pr.k + '</h3>' +
        '<p style="color:var(--muted);font-size:13.5px;line-height:1.5">' + pr.d + '</p></div>';
    }).join("");
    hosts.forEach(function (h) { h.innerHTML = html; });
  }

  /* ---------- nation cards (about.html) ---------- */
  function renderNations() {
    var host = document.querySelector("[data-nations4]");
    if (!host || !D.nations) return;
    host.innerHTML = D.nations.map(function (n) {
      return '<div class="card4 rv" data-group="nations" style="padding:24px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<h3 style="font-family:var(--font-display);font-size:19px;font-weight:700">' + n.name + '</h3>' +
        '<b class="mono" data-clock="' + n.tz + '" style="font-family:var(--font-display);font-size:22px;color:var(--accent)">--:--</b></div>' +
        '<span class="mono" style="font-size:11px;color:var(--dim);letter-spacing:.06em;text-transform:uppercase">' + n.city + " · " + n.coords + " · " + n.cur + "</span></div>";
    }).join("");
  }

  /* ---------- init ---------- */
  renderSvcList(); renderCatalog(); renderWork(document.body.dataset.workLimit ? parseInt(document.body.dataset.workLimit, 10) : null);
  renderFaq(); renderProcess(); renderClientMarquee(); renderPartners(); renderNations(); renderPrinciples();
  paintPrices();
  document.querySelectorAll("[data-country-flag]").forEach(function (el) { el.textContent = getCountry(); });

  /* ?svc=web,brand deep link from work/services CTAs */
  (function () {
    var m = /[?&]svc=([^&#]+)/.exec(location.search);
    if (!m) return;
    var added = 0;
    m[1].split(",").forEach(function (id) {
      if (D.services.some(function (s) { return s.id === id; })) { selected[id] = true; added++; }
    });
    if (added) { persistSel(); renderSvcList(); try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {} }
  })();
})();
