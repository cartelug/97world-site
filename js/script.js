/* ============================================================
   97 WORLD — SITE LOGIC
   Renders from js/data.js (which mirrors the Notion hub),
   runs the intro, scroll reveals, pricing calculator and the
   WhatsApp order form.
   ============================================================ */
(function () {
  "use strict";
  var D = window.SITE;
  var country = "UG";
  var selected = {};

  var CUR = {
    UG: { name: "Ugandan Shillings (UGX)", fmt: function (v) { return Math.round(v).toLocaleString() + " UGX"; }, rate: D.usdToUgx },
    SS: { name: "US Dollars (USD)",        fmt: function (v) { return "$" + Math.round(v).toLocaleString(); },     rate: 1 }
  };
  function money(usd) { var c = CUR[country]; return c.fmt(usd * c.rate); }

  /* ---------- INTRO ---------- */
  function endIntro() {
    clearTimeout(introTimer);
    var i = document.getElementById("intro");
    if (!i || i.classList.contains("done")) return;
    i.classList.add("done");
    document.getElementById("nav").classList.add("reveal");
    kickReveals();
  }
  window.endIntro = endIntro;
  var introTimer = setTimeout(endIntro, 6200);

  /* ---------- NAV scroll shadow ---------- */
  window.addEventListener("scroll", function () {
    document.getElementById("nav").classList.toggle("scrolled", window.scrollY > 30);
  });

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  function kickReveals() {
    var groups = {};
    document.querySelectorAll(".reveal").forEach(function (el) {
      // stagger siblings within the same parent for a cascading entrance
      var key = el.parentNode ? (el.parentNode.id || el.parentNode.className || "root") : "root";
      groups[key] = (groups[key] || 0);
      var i = groups[key]++;
      if (!el.style.transitionDelay) el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
      io.observe(el);
    });
  }

  /* ---------- RENDER: experience ---------- */
  function renderExperience() {
    var host = document.getElementById("expLines");
    host.innerHTML = D.experience.map(function (x, i) {
      var n = (i + 1 < 10 ? "0" : "") + (i + 1);
      return '<div class="exp-line reveal">' +
        '<span class="idx">' + n + '</span>' +
        '<span class="name' + (x.dim ? " dim" : "") + '">' + x.name + '</span>' +
        '<span class="desc">' + x.desc + '</span>' +
        '<span class="arrow">→</span></div>';
    }).join("");
  }

  /* ---------- RENDER: portfolio ---------- */
  function renderWork() {
    var host = document.getElementById("workGrid");
    host.innerHTML = D.work.map(function (w) {
      var badge = w.status === "live" ? "live" : "soon";
      var tags = w.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("");
      var topBadge = w.status === "live"
        ? '<span class="badge live">Website</span>'
        : '<span class="badge soon">Placeholder · Coming Soon</span>';
      return '<div class="work reveal">' +
        '<div class="thumb ' + w.grad + '">' +
          '<div class="browser">' +
            '<div class="bbar"><i></i><i></i><i></i></div>' +
            '<div class="bbody">' + topBadge +
              '<div class="lg" style="background:' + w.accent + ';-webkit-background-clip:text;background-clip:text">' + w.title + '</div>' +
              '<div class="cap">' + w.sub + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="meta">' +
          '<h4>' + w.title + ' ' + w.sub + ' <span class="badge ' + badge + '">' + w.statusLabel + '</span></h4>' +
          '<p>' + w.desc + '</p>' +
          '<div class="tags">' + tags + '</div>' +
        '</div></div>';
    }).join("");
  }

  /* ---------- RENDER: services (pricing) ---------- */
  function renderServices() {
    var host = document.getElementById("svcList");
    host.innerHTML = D.services.map(function (s) {
      var on = selected[s.id] ? " sel" : "";
      var pop = s.popular ? ' <span class="pop">Popular</span>' : "";
      return '<div class="svc' + on + '" onclick="toggleSvc(\'' + s.id + '\')">' +
        '<div class="check">✓</div>' +
        '<div class="info"><b>' + s.name + pop + '</b><span>' + s.note + '</span></div>' +
        '<div class="amt">' + money(s.usd) + '<small>' + s.days + ' days</small></div>' +
        '</div>';
    }).join("");
  }

  window.toggleSvc = function (id) { selected[id] = !selected[id]; renderServices(); calc(); };

  function calc() {
    var totUsd = 0, count = 0;
    D.services.forEach(function (s) { if (selected[s.id]) { totUsd += s.usd; count++; } });
    document.getElementById("sumCount").textContent = count;
    document.getElementById("sumTotal").textContent = count ? money(totUsd) : "—";
    document.getElementById("dep1").textContent = count ? money(totUsd / 2) : "—";
    document.getElementById("dep2").textContent = count ? money(totUsd / 2) : "—";
  }

  /* ---------- COUNTRY ---------- */
  window.setCountry = function (c) {
    country = c;
    document.querySelectorAll("#ctry button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-c") === c);
    });
    document.getElementById("curNote").textContent = "Showing prices in " + CUR[c].name;
    var f = document.getElementById("fCountry");
    if (f) f.value = (c === "UG") ? "UG" : "SS";
    renderServices(); calc();
  };
  window.setCountryFromForm = function () {
    var v = document.getElementById("fCountry").value;
    window.setCountry(v === "UG" ? "UG" : "SS");
  };

  /* ---------- ORDER ---------- */
  function summary() {
    var lines = [], totUsd = 0;
    D.services.forEach(function (s) {
      if (selected[s.id]) { lines.push("• " + s.name + " — " + money(s.usd)); totUsd += s.usd; }
    });
    return { lines: lines, totUsd: totUsd };
  }
  window.syncOrder = function () {
    var d = summary();
    if (d.lines.length) document.getElementById("fNeeds").value = d.lines.join("\n");
  };
  window.sendOrder = function (e) {
    if (e) e.preventDefault();
    var name = (document.getElementById("fName").value || "").trim();
    var needs = (document.getElementById("fNeeds").value || "").trim();
    var extra = (document.getElementById("fExtra").value || "").trim();
    var cn = document.getElementById("fCountry");
    var cLabel = cn.options[cn.selectedIndex].text;
    var d = summary();

    var msg = "*NEW ORDER — 97 WORLD (Design Sector)*\n";
    msg += "━━━━━━━━━━━━━━\n";
    msg += "Name: " + (name || "(not given)") + "\n";
    msg += "Country: " + cLabel + "\n\n";
    msg += "*What I need built:*\n" + (needs || "(see below)") + "\n";
    if (d.lines.length) {
      msg += "\n*Quote from the website:*\n" + d.lines.join("\n");
      msg += "\nTotal: " + money(d.totUsd);
      msg += "\n1st deposit (50%): " + money(d.totUsd / 2);
      msg += "\nBalance on delivery: " + money(d.totUsd / 2) + "\n";
    }
    if (extra) msg += "\nNotes: " + extra + "\n";
    msg += "\nProof isn’t fabricated. It’s built. — Let’s start.";

    window.open("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
  };

  /* ---------- INIT ---------- */
  document.getElementById("yr").textContent = new Date().getFullYear();
  renderExperience();
  renderWork();
  renderServices();
  calc();
  // In case the intro is skipped instantly or blocked, still observe reveals.
  kickReveals();
})();
