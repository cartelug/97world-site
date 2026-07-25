/* ============================================================
   97 WORLD — SOCIAL GROWTH (followers.html)
   The "grow my following" funnel: pick a platform, pick a package,
   order straight on WhatsApp. Prices come from js/data.js
   (SITE.social) and are shown in the visitor's currency via S97.
   Displayed price = package.usd × platform.mult.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE, S = window.S97;
  var host = document.querySelector("[data-platforms]");
  if (!host || !D || !S || !D.social) return;

  var PLATS = D.social.platforms || [];
  var PKGS = D.social.packages || [];
  if (!PLATS.length || !PKGS.length) return;

  /* ---------- state (persists so a currency hop keeps the pick) ---------- */
  function load(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  var platId = load("soc97.plat", PLATS[0].id);
  if (!PLATS.some(function (p) { return p.id === platId; })) platId = PLATS[0].id;
  var popular = PKGS.filter(function (p) { return p.popular; })[0] || PKGS[0];
  var pkgId = load("soc97.pkg", popular.id);
  if (!PKGS.some(function (p) { return p.id === pkgId; })) pkgId = popular.id;

  function plat() { return PLATS.filter(function (p) { return p.id === platId; })[0]; }
  function pkg() { return PKGS.filter(function (p) { return p.id === pkgId; })[0]; }
  function priceUsd(pk, pl) { return Math.round(pk.usd * (pl.mult || 1)); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function qty(n) { return Number(n).toLocaleString(); }

  /* ---------- render: platforms ---------- */
  function renderPlats() {
    host.innerHTML = PLATS.map(function (p) {
      var on = p.id === platId;
      return '<button type="button" class="plat' + (on ? " sel" : "") + '" role="radio" aria-checked="' + on + '"' +
        ' data-plat="' + p.id + '" style="--pc:' + esc(p.c || "#ffce00") + '">' +
        '<span class="plat-dot" aria-hidden="true"></span>' +
        '<b>' + esc(p.name) + '</b><small>' + esc(p.unit) + '</small></button>';
    }).join("");
  }

  /* ---------- render: packages (prices reflect the chosen platform) ---------- */
  function renderPkgs() {
    var hostP = document.querySelector("[data-packages]");
    if (!hostP) return;
    var pl = plat();
    hostP.innerHTML = PKGS.map(function (p) {
      var on = p.id === pkgId;
      var pop = p.popular ? '<span class="pkg-pop">' + esc(p.note || "Popular") + '</span>' : "";
      return '<button type="button" class="pkg' + (on ? " sel" : "") + (p.popular ? " pop" : "") + '"' +
        ' role="radio" aria-checked="' + on + '" data-pkg="' + p.id + '">' +
        pop +
        '<span class="pkg-qty">' + qty(p.qty) + '</span>' +
        '<span class="pkg-unit">' + esc(pl.unit) + '</span>' +
        '<span class="pkg-price">' + S.money(priceUsd(p, pl)) + '</span>' +
        '<span class="pkg-days">~' + p.days + ' days</span></button>';
    }).join("");
  }

  /* ---------- render: order summary rail ---------- */
  function renderSummary() {
    var box = document.querySelector("[data-social-summary]");
    if (!box) return;
    var pl = plat(), pk = pkg();
    box.innerHTML =
      '<ul class="qlist">' +
        '<li><span>Platform</span><b>' + esc(pl.name) + '</b></li>' +
        '<li><span>Package</span><b>' + qty(pk.qty) + ' ' + esc(pl.unit) + '</b></li>' +
        '<li><span>Delivery</span><b>~' + pk.days + ' days</b></li>' +
      '</ul>' +
      '<div class="qtot"><span>Price</span><b>' + S.money(priceUsd(pk, pl)) + '</b></div>';
    var noteEl = document.querySelector("[data-social-note]");
    if (noteEl && D.social.note) noteEl.textContent = D.social.note;
  }

  function paintAll() { renderPlats(); renderPkgs(); renderSummary(); }

  /* ---------- interactions ---------- */
  host.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-plat]");
    if (!b) return;
    platId = b.getAttribute("data-plat"); save("soc97.plat", platId);
    renderPlats(); renderPkgs(); renderSummary();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-pkg]");
    if (!b) return;
    pkgId = b.getAttribute("data-pkg"); save("soc97.pkg", pkgId);
    renderPkgs(); renderSummary();
  });

  // currency toggle (site.js fires this on setCountry) → reprice
  window.addEventListener("q97country", function () { renderPkgs(); renderSummary(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) paintAll(); });

  /* ---------- send to WhatsApp ---------- */
  window.sendFollowersOrder = function (e) {
    if (e) e.preventDefault();
    var pl = plat(), pk = pkg();
    var name = (document.getElementById("sName").value || "").trim();
    var handle = (document.getElementById("sHandle").value || "").trim();
    var notes = (document.getElementById("sNotes").value || "").trim();
    var country = S.getCountry() === "SS" ? "South Sudan / International" : "Uganda";

    var msg = "*NEW SOCIAL GROWTH ORDER — 97 WORLD*\n";
    msg += "━━━━━━━━━━━━━━\n";
    msg += "Name: " + (name || "(not given)") + "\n";
    msg += "Country: " + country + "\n\n";
    msg += "Platform: " + pl.name + "\n";
    msg += "Package: " + qty(pk.qty) + " " + pl.unit + "\n";
    msg += "Price: " + S.money(priceUsd(pk, pl)) + "\n";
    msg += "Profile: " + (handle || "(will share on chat)") + "\n";
    if (notes) msg += "Notes: " + notes + "\n";
    msg += "\nLet's grow it. — 97 Design";
    window.open("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
  };

  paintAll();
  if (window.kickReveals) window.kickReveals();
})();
