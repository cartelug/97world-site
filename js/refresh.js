/* 97 WORLD — interactive white conversion experience */
(function () {
  "use strict";
  var D = window.SITE;
  if (!D) return;

  var icons = { Web: "◎", Branding: "◇", Print: "▤", Social: "◌", Growth: "◉", Systems: "⚙" };
  var state = { country: read("q97.country") || "", service: null, plan: null };
  var grid = document.getElementById("serviceGrid");
  var country = document.getElementById("countrySelect");
  var currencyNote = document.getElementById("currencyNote");
  var summary = document.getElementById("serviceSummary");
  var modal = document.getElementById("quoteModal");
  var modalCountry = document.getElementById("modalCountry");
  var modalProduct = document.getElementById("modalProduct");
  var planPicker = document.getElementById("planPicker");
  var continueWork = document.getElementById("continueWork");
  var orderWhatsApp = document.getElementById("orderWhatsApp");
  var modalTitle = document.getElementById("modalTitle");
  var selectedService = null;

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function getService(id) { return D.services.filter(function (s) { return s.id === id; })[0]; }
  function getCountryLabel(c) { return c === "UG" ? "Uganda" : c === "SS" ? "South Sudan" : "International"; }
  function price(usd, c) {
    if (!c) return "—";
    if (c === "UG") return new Intl.NumberFormat("en-UG").format(Math.round(usd * (D.usdToUgx || 3800))) + " UGX";
    return "$" + Number(usd).toLocaleString("en-US") + " USD";
  }
  function priceHtml(usd) { return state.country ? price(usd, state.country) : '<span class="unpriced">Choose country for price</span>'; }

  function renderServices() {
    if (!grid) return;
    grid.innerHTML = D.services.map(function (s) {
      var active = selectedService && selectedService.id === s.id;
      return '<button class="service-card" type="button" data-service="' + s.id + '" aria-pressed="' + active + '">' +
        '<span class="service-icon" aria-hidden="true">' + (icons[s.cat] || "•") + '</span>' +
        '<h3>' + s.name + '</h3><p>' + s.short + '</p>' +
        '<span class="service-price"><small>From</small>' + priceHtml(s.usd) + '</span></button>';
    }).join("");
    if (state.country) {
      country.value = state.country;
      currencyNote.textContent = state.country === "UG" ? "Showing starting prices in UGX." : "Showing starting prices in USD.";
    } else {
      country.value = "";
      currencyNote.textContent = "Prices appear after you choose a country.";
    }
  }

  function setCountry(c) {
    state.country = c || "";
    if (state.country) write("q97.country", state.country);
    renderServices();
    if (modal && modal.open && selectedService) updateModal();
  }

  function renderPlans(s) {
    if (!s.plans || !s.plans.length) { planPicker.hidden = true; planPicker.innerHTML = ""; state.plan = null; return; }
    if (!state.plan || s.plans.indexOf(state.plan) === -1) state.plan = s.plans[0];
    planPicker.hidden = false;
    planPicker.innerHTML = s.plans.map(function (p) {
      var on = state.plan && state.plan.id === p.id;
      return '<button class="plan-option" type="button" data-plan="' + p.id + '" aria-pressed="' + on + '"><span><strong>' + p.name + '</strong><small>' + p.qty + ' · ' + p.note + '</small></span><b>' + price(p.usd, state.country) + '</b></button>';
    }).join("");
  }

  function updateModal() {
    if (!selectedService) return;
    modalTitle.textContent = state.country ? "Here’s your starting point." : "Start with your country.";
    modalCountry.value = state.country;
    var activePrice = state.plan ? state.plan.usd : selectedService.usd;
    modalProduct.innerHTML = '<strong>' + selectedService.name + '</strong><b>' + price(activePrice, state.country) + '</b><span>' + selectedService.pitch + '</span>';
    renderPlans(selectedService);
    var ready = Boolean(state.country);
    continueWork.disabled = !ready;
    orderWhatsApp.disabled = !ready;
  }

  function openProduct(id) {
    selectedService = getService(id);
    if (!selectedService) return;
    state.service = selectedService.id;
    state.plan = selectedService.plans ? selectedService.plans[0] : null;
    document.querySelectorAll(".service-card").forEach(function (card) { card.setAttribute("aria-pressed", String(card.dataset.service === id)); });
    updateSummary();
    updateModal();
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  }

  function updateSummary() {
    if (!summary || !selectedService) return;
    summary.hidden = false;
    document.getElementById("summaryName").textContent = selectedService.name;
    document.getElementById("summaryShort").textContent = selectedService.short;
    document.getElementById("summaryPrice").textContent = price(state.plan ? state.plan.usd : selectedService.usd, state.country);
  }

  function sendWhatsApp() {
    if (!selectedService || !state.country) return;
    var chosen = state.plan ? " · " + state.plan.name + " (" + state.plan.qty + ")" : "";
    var amount = price(state.plan ? state.plan.usd : selectedService.usd, state.country);
    var message = "*NEW 97 WORLD ENQUIRY*\n\nService: " + selectedService.name + chosen + "\nCountry: " + getCountryLabel(state.country) + "\nStarting price: " + amount + "\n\nI’d like to continue with this package and discuss my project brief.";
    window.open("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(message), "_blank", "noopener");
  }

  if (grid) grid.addEventListener("click", function (e) {
    var card = e.target.closest("[data-service]");
    if (card) openProduct(card.dataset.service);
  });
  document.querySelectorAll(".product-trigger").forEach(function (button) { button.addEventListener("click", function () { openProduct(button.dataset.service); }); });
  if (country) country.addEventListener("change", function () { setCountry(country.value); });
  if (modalCountry) modalCountry.addEventListener("change", function () { setCountry(modalCountry.value); });
  if (planPicker) planPicker.addEventListener("click", function (e) {
    var button = e.target.closest("[data-plan]");
    if (!button || !selectedService || !selectedService.plans) return;
    state.plan = selectedService.plans.filter(function (p) { return p.id === button.dataset.plan; })[0] || selectedService.plans[0];
    updateModal(); updateSummary();
  });
  if (continueWork) continueWork.addEventListener("click", function () { if (!state.country) return; if (modal.open) modal.close(); document.getElementById("work").scrollIntoView({ behavior: "smooth", block: "start" }); });
  if (orderWhatsApp) orderWhatsApp.addEventListener("click", sendWhatsApp);
  if (summary) document.getElementById("summaryContinue").addEventListener("click", function () { if (selectedService) { updateModal(); if (typeof modal.showModal === "function") modal.showModal(); } });

  var menuToggle = document.querySelector(".menu-toggle");
  var mobileMenu = document.getElementById("mobileMenu");
  if (menuToggle && mobileMenu) menuToggle.addEventListener("click", function () { var open = menuToggle.getAttribute("aria-expanded") === "true"; menuToggle.setAttribute("aria-expanded", String(!open)); mobileMenu.hidden = open; });
  if (mobileMenu) mobileMenu.querySelectorAll("a").forEach(function (link) { link.addEventListener("click", function () { mobileMenu.hidden = true; if (menuToggle) menuToggle.setAttribute("aria-expanded", "false"); }); });

  renderServices();
  if (state.country) setCountry(state.country);
})();
