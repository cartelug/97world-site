(function () {
  "use strict";

  var layer = (window.dataLayer = window.dataLayer || []);
  function record(name, details) {
    layer.push(Object.assign({ event: name, page: "growth" }, details || {}));
  }

  record("growth_view");

  var catalog = (window.K97Pricing && window.K97Pricing.BUNDLES) || [];
  document.querySelectorAll("[data-growth-plan]").forEach(function (card) {
    var plan = catalog.find(function (item) {
      return item.id === card.dataset.growthPlan;
    });
    if (!plan) {
      card.hidden = true;
      return;
    }
    card.querySelector("[data-growth-price]").textContent = "$" + plan.usd;
    var link = card.querySelector("[data-growth-cta]");
    var message =
      card.dataset.growthPlan === "multi-platform"
        ? "Hi THE97. Please check my accounts for the " +
          plan.name +
          " package before I order."
        : "Hi THE97. Please check my Instagram or TikTok account for the Creator Starter package before I order.";
    link.href =
      "https://wa.me/256762193386?text=" + encodeURIComponent(message);
  });

  document.querySelectorAll("[data-growth-cta]").forEach(function (link) {
    link.addEventListener("click", function () {
      record("growth_check_accounts_click", {
        placement: link.closest("header")
          ? "header"
          : link.classList.contains("v-sticky-cta")
            ? "sticky"
            : link.closest(".v-final")
              ? "final"
              : link.closest(".v-package")
                ? "package"
                : "hero",
      });
      record("growth_whatsapp_open");
    });
  });

  var resultsTracked = false;
  function trackResults() {
    if (resultsTracked) return;
    resultsTracked = true;
    record("growth_view_results");
  }
  document.querySelectorAll("[data-growth-results]").forEach(function (link) {
    link.addEventListener("click", trackResults);
  });

  document.querySelectorAll("#questions details").forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open)
        record("growth_faq_open", {
          question: item.querySelector("summary").textContent.trim(),
        });
    });
  });

  var hero = document.querySelector(".v-hero");
  var sticky = document.getElementById("stickyGrowthCta");
  var final = document.querySelector(".v-final");
  var order = document.getElementById("orderSec");
  if (hero && sticky && "IntersectionObserver" in window) {
    var heroVisible = true;
    var finalVisible = false;
    var orderVisible = false;
    function updateSticky() {
      sticky.classList.toggle(
        "is-visible",
        !heroVisible && !finalVisible && !orderVisible,
      );
    }
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      updateSticky();
    }).observe(hero);
    if (final)
      new IntersectionObserver(function (entries) {
        finalVisible = entries[0].isIntersecting;
        updateSticky();
      }).observe(final);
    if (order)
      new IntersectionObserver(function (entries) {
        orderVisible = entries[0].isIntersecting;
        updateSticky();
      }).observe(order);
  }

  if ("IntersectionObserver" in window) {
    var seen = {};
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || seen[entry.target.id]) return;
          seen[entry.target.id] = true;
          if (entry.target.id === "packages") record("growth_pricing_view");
          else trackResults();
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 },
    );
    ["results", "packages"].forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  document.querySelectorAll('#menuSheet a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      document.getElementById("menuSheet").classList.remove("is-open");
      document.body.classList.remove("is-locked");
    });
  });
})();
