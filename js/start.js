/* ============================================================
   97 WORLD — KINETIC (v4) START / ORDER PAGE
   WhatsApp message-building logic, reading the quote K97 saved
   from the pricing page, repainted into the .total4 summary card.

   Order-form pattern (phone validation, payment method per
   country, dormant sheet-logging hook, location.href handoff)
   adapted from 97 World's own AccessUG order flow.
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
        '<a class="btn4 ghost full" href="/pricing/">Build your quote →</a>';
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
      '<a class="btn4 ghost full sm" style="margin-top:16px" href="/pricing/">Edit quote →</a>';
  }

  function paymentKey(countryVal) {
    return countryVal === "UG" ? "UG" : countryVal === "SS" ? "SS" : "INTL";
  }

  function paintPayments() {
    var sel = document.getElementById("fPayment");
    var cn = document.getElementById("fCountry");
    if (!sel || !cn) return;
    var methods = (D.payments && D.payments.methods && D.payments.methods[paymentKey(cn.value)]) || [];
    var prev = sel.value;
    sel.innerHTML = methods.map(function (m) { return '<option value="' + m + '">' + m + "</option>"; }).join("");
    if (methods.indexOf(prev) !== -1) sel.value = prev;
  }

  function prefill() {
    var items = picked();
    var needs = document.getElementById("fNeeds");
    if (needs && !needs.value.trim() && items.length) {
      needs.value = items.map(function (s) { return "• " + s.name; }).join("\n");
    }
    var sel = document.getElementById("fCountry");
    if (sel) sel.value = K.getCountry() === "SS" ? "SS" : "UG";
    paintPayments();
  }
  window.setCountryFromForm4 = function () {
    var v = document.getElementById("fCountry").value;
    K.setCountry(v === "UG" ? "UG" : "SS");
    K.paintPrices();
    renderQuote();
    paintPayments();
  };

  // Fire-and-forget order log to a Google Sheets Apps Script Web App.
  // Stays a no-op until SITE.orderLogUrl is set to a real endpoint —
  // no network call, no console noise, honest until it's real.
  function logOrder(fields) {
    if (!D.orderLogUrl) return;
    try {
      var body = new URLSearchParams(fields);
      fetch(D.orderLogUrl, { method: "POST", body: body, mode: "no-cors" });
    } catch (e) { /* logging is best-effort, never blocks the order */ }
  }

  window.sendOrder4 = function (e) {
    if (e) e.preventDefault();
    var name = (document.getElementById("fName").value || "").trim();
    var rawPhone = (document.getElementById("fPhone").value || "").trim();
    var needs = (document.getElementById("fNeeds").value || "").trim();
    var extra = (document.getElementById("fExtra").value || "").trim();
    var terms = document.getElementById("fTerms");
    var heardEl = document.getElementById("fHeard");
    var heard = heardEl ? heardEl.value : "";
    var payEl = document.getElementById("fPayment");
    var payment = payEl && payEl.value ? payEl.value : "Ask on WhatsApp";
    var cn = document.getElementById("fCountry");
    var cLabel = cn.options[cn.selectedIndex].text;

    if (!name) {
      alert("Please tell us your name.");
      document.getElementById("fName").focus();
      return false;
    }
    var cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
      alert("Please enter a valid WhatsApp number.");
      document.getElementById("fPhone").focus();
      return false;
    }
    if (terms && !terms.checked) {
      alert("Please agree to the Terms of Service and Privacy Policy to continue.");
      terms.focus();
      return false;
    }

    var items = picked();
    var tot = items.reduce(function (a, s) { return a + s.usd; }, 0);
    var dep = Math.floor(tot / 2), bal = tot - dep;

    var msg = "*NEW QUOTE REQUEST — 97 WORLD (Design Sector)*\n";
    msg += "━━━━━━━━━━━━━━\n";
    msg += "Name: " + name + "\n";
    msg += "WhatsApp: " + cleanPhone + "\n";
    msg += "Country: " + cLabel + "\n";
    msg += "Payment method: " + payment + "\n";
    if (heard) msg += "Heard about us via: " + heard + "\n";
    msg += "\n*What I need built:*\n" + (needs || "(see quote below)") + "\n";
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

    logOrder({
      Name: name,
      WhatsApp: "'" + cleanPhone,
      Country: cLabel,
      PaymentMethod: payment,
      HeardAboutUs: heard,
      Needs: needs,
      Total: String(tot),
      Deposit: String(dep)
    });

    // location.href (not window.open) — more reliable on mobile, no popup blocker.
    window.location.href = "https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(msg);
  };

  renderQuote();
  prefill();
})();
