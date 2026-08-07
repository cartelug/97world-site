/* ============================================================
   97 WORLD — KINETIC (v4) START / ORDER PAGE
   Same WhatsApp message-building logic as before, reading the
   quote K97 saved from the pricing page, repainted into the new
   .total4 summary card.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE, K = window.K97;
  var nameEl = document.getElementById("fName");
  if (!nameEl || !D || !K) return;

  function picked() {
    var ids = K.getSel();
    return D.services.filter(function (s) { return ids.indexOf(s.id) !== -1; });
  }

  function renderQuote() {
    var host = document.getElementById("quoteBox4");
    if (!host) return;
    var items = picked();
    if (!items.length) {
      host.innerHTML =
        '<h4 class="mono">Tale of the tape</h4>' +
        '<p style="color:var(--muted);font-size:14px;margin-bottom:16px">Nothing selected yet. Build a quote first — or just describe what you need in the form.</p>' +
        '<a class="btn4 ghost full" href="pricing.html">Build your quote →</a>';
      return;
    }
    var tot = items.reduce(function (a, s) { return a + s.usd; }, 0);
    var dep = Math.floor(tot / 2);
    host.innerHTML =
      '<h4 class="mono">Tale of the tape</h4>' +
      '<ul class="total4-list">' + items.map(function (s) {
        return "<li><span>" + s.name + "</span><b>" + K.money(s.usd) + "</b></li>";
      }).join("") + "</ul>" +
      '<div class="total4-sum"><span>Total</span><b>' + K.money(tot) + "</b></div>" +
      '<div class="total4-dep"><span>Start with 50%</span><b>' + K.money(dep) + "</b></div>" +
      '<a class="btn4 ghost full sm" style="margin-top:16px" href="pricing.html">Edit quote →</a>';
  }

  function prefill() {
    var items = picked();
    var needs = document.getElementById("fNeeds");
    if (needs && !needs.value.trim() && items.length) {
      needs.value = items.map(function (s) { return "• " + s.name; }).join("\n");
    }
    var sel = document.getElementById("fCountry");
    if (sel) sel.value = K.getCountry() === "SS" ? "SS" : "UG";
  }
  window.setCountryFromForm4 = function () {
    var v = document.getElementById("fCountry").value;
    K.setCountry(v === "UG" ? "UG" : "SS");
    K.paintPrices();
    renderQuote();
  };

  window.sendOrder4 = function (e) {
    if (e) e.preventDefault();
    var name = (document.getElementById("fName").value || "").trim();
    var needs = (document.getElementById("fNeeds").value || "").trim();
    var extra = (document.getElementById("fExtra").value || "").trim();
    var cn = document.getElementById("fCountry");
    var cLabel = cn.options[cn.selectedIndex].text;
    var items = picked();
    var tot = items.reduce(function (a, s) { return a + s.usd; }, 0);
    var dep = Math.floor(tot / 2), bal = tot - dep;

    var msg = "*NEW ORDER — 97 WORLD (Design Sector)*\n";
    msg += "━━━━━━━━━━━━━━\n";
    msg += "Name: " + (name || "(not given)") + "\n";
    msg += "Country: " + cLabel + "\n\n";
    msg += "*What I need built:*\n" + (needs || "(see quote below)") + "\n";
    if (items.length) {
      msg += "\n*Quote from the website:*\n" + items.map(function (s) {
        return "• " + s.name + " — " + K.money(s.usd);
      }).join("\n");
      msg += "\nTotal: " + K.money(tot);
      msg += "\n1st deposit (50%): " + K.money(dep);
      msg += "\nBalance on delivery: " + K.money(bal) + "\n";
    }
    if (extra) msg += "\nNotes: " + extra + "\n";
    msg += "\nProof isn't fabricated. It's built. — Let's start.";
    window.open("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
  };

  renderQuote();
  prefill();
})();
