/* ============================================================
   97 WORLD — START (ORDER) PAGE
   Reads the quote saved by the pricing page (localStorage q97.*),
   shows it beside the form, prefills the message and turns the
   whole thing into a ready-to-send WhatsApp order.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE, S = window.S97;
  var form = document.getElementById("fName");
  if (!form || !D || !S) return;

  function picked() {
    var ids = S.getSel();
    return D.services.filter(function (s) { return ids.indexOf(s.id) !== -1; });
  }

  /* ---------- quote summary panel ---------- */
  function renderQuote() {
    var host = document.getElementById("quoteBox");
    if (!host) return;
    var items = picked();
    if (!items.length) {
      host.innerHTML =
        '<h4>Your quote</h4>' +
        '<p class="empty">Nothing selected yet. Build a quote first — or just describe what you need in the form.</p>' +
        '<a class="btn ghost full" href="pricing.html">Build your quote →</a>';
      return;
    }
    var tot = items.reduce(function (a, s) { return a + s.usd; }, 0);
    host.innerHTML =
      '<h4>Your quote</h4>' +
      '<ul class="qlist">' + items.map(function (s) {
        return '<li><span>' + s.name + '</span><b>' + S.money(s.usd) + '</b></li>';
      }).join("") + '</ul>' +
      '<div class="qtot"><span>Total</span><b>' + S.money(tot) + '</b></div>' +
      '<div class="qdep"><span>Start with 50%</span><b>' + S.money(tot / 2) + '</b></div>' +
      '<a class="edit" href="pricing.html">Edit quote →</a>';
  }

  /* ---------- prefill ---------- */
  function prefill() {
    var items = picked();
    var needs = document.getElementById("fNeeds");
    if (needs && !needs.value.trim() && items.length) {
      needs.value = items.map(function (s) { return "• " + s.name + " — " + S.money(s.usd); }).join("\n");
    }
    var sel = document.getElementById("fCountry");
    if (sel) sel.value = S.getCountry() === "SS" ? "SS" : "UG";
  }
  window.setCountryFromForm = function () {
    var v = document.getElementById("fCountry").value;
    S.setCountry(v === "SS" ? "SS" : "UG");
    S.paintPrices();
    renderQuote();
  };

  /* ---------- send ---------- */
  window.sendOrder = function (e) {
    if (e) e.preventDefault();
    var name = (document.getElementById("fName").value || "").trim();
    var needs = (document.getElementById("fNeeds").value || "").trim();
    var extra = (document.getElementById("fExtra").value || "").trim();
    var cn = document.getElementById("fCountry");
    var cLabel = cn.options[cn.selectedIndex].text;
    var items = picked();
    var tot = items.reduce(function (a, s) { return a + s.usd; }, 0);

    var msg = "*NEW ORDER — 97 WORLD (Design Sector)*\n";
    msg += "━━━━━━━━━━━━━━\n";
    msg += "Name: " + (name || "(not given)") + "\n";
    msg += "Country: " + cLabel + "\n\n";
    msg += "*What I need built:*\n" + (needs || "(see quote below)") + "\n";
    if (items.length) {
      msg += "\n*Quote from the website:*\n" + items.map(function (s) {
        return "• " + s.name + " — " + S.money(s.usd);
      }).join("\n");
      msg += "\nTotal: " + S.money(tot);
      msg += "\n1st deposit (50%): " + S.money(tot / 2);
      msg += "\nBalance on delivery: " + S.money(tot / 2) + "\n";
    }
    if (extra) msg += "\nNotes: " + extra + "\n";
    msg += "\nProof isn’t fabricated. It’s built. — Let’s start.";
    window.open("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
  };

  renderQuote();
  prefill();
})();
