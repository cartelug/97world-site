/* ============================================================
   97 WORLD — SITE DATA
   Single source of truth for every page. Mirrors the
   "97 World — Design Sector HQ" Notion hub — edit here (or in
   Notion) to keep the site and back-office in sync.
   ============================================================ */

window.SITE = {
  whatsapp: "256708735878",            // digits only, for wa.me links
  phonePretty: "+256 708 735 878",
  usdToUgx: 3800,                      // approx rate, editable

  /* The two home nations (clocks, currency, coordinates) */
  nations: [
    { code: "UG", name: "Uganda",      city: "Kampala", tz: "Africa/Kampala", cur: "UGX", coords: "0.31°N · 32.58°E" },
    { code: "SS", name: "South Sudan", city: "Juba",    tz: "Africa/Juba",    cur: "USD", coords: "4.85°N · 31.58°E" }
  ],

  /* Mirrors Notion → Services & Pricing.
     usd + days are the real quoted numbers — edit freely. */
  services: [
    {
      id: "web", cat: "Web", name: "Website", usd: 500, days: 10, popular: true,
      short: "Multi-page, responsive, built to convert.",
      pitch: "A complete website designed and built end-to-end — structure, visuals, copy polish and launch. Made to turn visitors into orders, bookings and calls.",
      includes: ["Up to ~6 pages, mobile-first", "Conversion-focused layout & copy polish", "WhatsApp / contact integration", "Speed + basic SEO pass", "Launch support & handover"]
    },
    {
      id: "landing", cat: "Web", name: "Landing Page", usd: 200, days: 4, popular: false,
      short: "One high-impact page, fast turnaround.",
      pitch: "A single page with one job — launch a campaign, sell one thing, capture one audience. Designed and shipped in days.",
      includes: ["One high-impact page", "Campaign-ready structure", "WhatsApp / form capture", "Fast turnaround"]
    },
    {
      id: "logo", cat: "Branding", name: "Logo & Brand Mark", usd: 150, days: 5, popular: false,
      short: "Custom logo with full variations.",
      pitch: "A mark that holds up from a WhatsApp avatar to a billboard — drawn for your business, not pulled from a template.",
      includes: ["Custom mark + wordmark", "Light & dark variations", "Print and screen files", "Simple usage sheet"]
    },
    {
      id: "brand", cat: "Branding", name: "Full Brand Kit", usd: 300, days: 10, popular: true,
      short: "Logo, colors, fonts, guidelines.",
      pitch: "The complete identity: logo suite, color system, typography and the rules that keep it consistent everywhere it shows up.",
      includes: ["Full logo suite", "Color + type system", "Brand guidelines", "Social profile starter set"]
    },
    {
      id: "flier", cat: "Print", name: "Campaign Flier / Poster", usd: 40, days: 2, popular: false,
      short: "Print + social ready design.",
      pitch: "Posters and fliers that stop the scroll and fill the room — delivered print-ready and sized for every feed.",
      includes: ["Print-ready artwork", "Social media sizes included", "Quick revision loop"]
    },
    {
      id: "cards", cat: "Print", name: "Business Cards", usd: 35, days: 2, popular: false,
      short: "Design + print-ready files.",
      pitch: "A card people keep. Front and back designed to match your brand, handed off ready for any printer.",
      includes: ["Front + back design", "Print-ready files", "Printer handoff support"]
    },
    {
      id: "social", cat: "Social", name: "Social Media Pack", usd: 120, days: 5, popular: false,
      short: "Templates + a set of posts.",
      pitch: "Reusable templates and a launch batch of posts so your feed stays loud and on-brand long after delivery.",
      includes: ["Reusable post templates", "Profile + cover set", "Launch batch of posts"]
    }
  ],

  /* How every project runs (real sequence — brief → deposit → build → deliver) */
  process: [
    { k: "Brief us", who: "You", when: "Day 0", d: "Tell us what you need on WhatsApp — goals, references, deadline. We shape it into a clear brief with a fixed quote." },
    { k: "Lock your slot", who: "You", when: "Day 0–1", d: "A 50% deposit locks your place in the build queue. The timeline starts counting the moment it lands." },
    { k: "We build, you react", who: "Us", when: "Days 1–9", d: "Tight feedback loops on WhatsApp while we design and build — no long silences, no surprises." },
    { k: "Delivery day", who: "Us", when: "Delivery", d: "Final files, live site, full handover. The balance clears on delivery — and the proof is yours." }
  ],

  /* One-tap quote bundles (ids must exist in services) */
  bundles: [
    { id: "launch",   name: "Launch",   note: "Website + full brand", services: ["web", "brand"] },
    { id: "campaign", name: "Campaign", note: "Flier + social pack",  services: ["flier", "social"] },
    { id: "starter",  name: "Starter",  note: "Logo + business cards", services: ["logo", "cards"] }
  ],

  /* Honest availability — EDIT MONTHLY. Renderers hide it automatically
     when `month` is not the current month, so it can never silently lie. */
  capacity: { month: "2026-07", total: 4, taken: 2 },

  /* How deposits are paid. TODO(owner): fill the real Equity account
     name/number — panels show a clearly-marked placeholder until then. */
  payments: {
    bank: {
      name: "Equity Bank",
      accountName: "— account name coming soon —",
      accountNumber: "— ask on WhatsApp —",
      note: "Send the payment screenshot on WhatsApp with your order reference — your slot is confirmed the moment it lands."
    },
    intl: "Outside Uganda? Ask on WhatsApp for USD payment options (bank transfer or mobile money)."
  },

  /* Real client quotes only — leave empty until you have permission
     to quote someone. Renderers hide the block when this is empty. */
  testimonials: [],

  /* What the sector stands on */
  principles: [
    { k: "Proof over hype", d: "We don't decorate promises. Everything we show is something we actually built." },
    { k: "Speed with standards", d: "Days, not months — without shipping anything we wouldn't put our mark on." },
    { k: "Two nations, one bar", d: "From Kampala to Juba, the quality bar does not move." },
    { k: "Built to convert", d: "Design is judged by what it makes happen — orders, bookings, calls, results." }
  ],

  faqs: [
    { q: "How do payments work?", a: "Every project runs on a 50 / 50 plan: a 50% deposit locks your slot and starts the work, and the balance is paid on delivery. In Uganda you pay in UGX; in South Sudan and internationally, USD." },
    { q: "How fast will I get my work?", a: "Each service lists its usual turnaround — from 2 days for fliers and cards up to about 10 days for full websites and brand kits. On a deadline? Say so on WhatsApp and we'll tell you honestly if it's doable." },
    { q: "What do you need from me to start?", a: "A short brief: what you do, what you need built, any materials you already have (logo, photos, text) and examples you like. Send it all on WhatsApp — we'll shape it into a plan." },
    { q: "Do you work outside Uganda & South Sudan?", a: "Yes. The sector is based in Kampala and Juba but works remotely with clients anywhere — international projects are quoted in USD." },
    { q: "What about changes and revisions?", a: "We work in feedback loops, so you react while we build and we adjust as we go. If the scope itself changes mid-project, we re-quote the difference before continuing — no surprise bills." },
    { q: "How do I start?", a: "Build your quote on the pricing page, then hit start — it turns into a ready-to-send WhatsApp message straight to the sector." }
  ],

  /* Portfolio — mirrors the Notion "Portfolio" database 1:1.
     Content fields (project/client/description/status/tags/type/year/link/
     featured) are copied straight from Notion on each sync. `disp` is the
     visual treatment layered on top (split title, accent, focus bullets);
     when it's omitted the site auto-derives a look from `type`. To add a
     project: create the row in Notion, then sync it in here. */
  work: [
    {
      project: "AFRICA63",
      client: "AFRICA63 — Mubembe Nathan",
      type: "Website",
      status: "Live",                 // Live | Coming Soon | In Progress
      tags: ["Web", "Branding"],
      year: 2026,
      link: "https://theafrica63.com",
      featured: true,
      description: "A website and brand foundation for AFRICA63, a public-affairs firm — a custom-built site with refreshed A63 monogram direction, domain, SSL, SEO and four business inboxes. Live at theafrica63.com.",
      disp: {
        id: "africa63", title: "AFRICA63", sub: "Public Affairs",
        accent: "linear-gradient(92deg,#ffce00,#63d67f)", grad: "campaign",
        typeLabel: "Website · Brand & Email",
        focus: ["Custom site — coded & deployed", "Brand direction & A63 monogram", "Domain, SSL, SEO & 4 inboxes"]
      }
    },
    {
      project: "Maya Nature Resort",
      client: "Maya Nature Resort",
      type: "Website",
      status: "Live",
      tags: ["Web", "Hospitality", "Booking"],
      year: 2026,
      link: "",
      featured: true,
      description: "A full hospitality website — bookings, gallery and story, built to make the resort feel as good online as it does in person.",
      disp: {
        id: "maya-nature", title: "Maya Nature", sub: "Resort",
        accent: "linear-gradient(92deg,#63d67f,#ffce00)", grad: "may",
        typeLabel: "Website · Hospitality",
        focus: ["Booking-first structure", "Gallery & storytelling", "Mobile guests covered"]
      }
    },
    {
      project: "WATP — My Weekly Track",
      client: "WATP",
      type: "Web App",
      status: "Coming Soon",
      tags: ["Web", "Tracking", "UI/UX"],
      year: 2026,
      link: "",
      featured: true,
      description: "My Weekly Track — a personal tracking platform. Preview slot reserved on the site; live build in progress.",
      disp: {
        id: "watp", title: "WATP", sub: "My Weekly Track",
        accent: "linear-gradient(92deg,#7aa2ff,#c58bff)", grad: "watp",
        typeLabel: "Web App · Personal Tracking",
        focus: ["Product UI & dashboards", "Tracking flows", "Identity & interface system"]
      }
    },
    {
      project: "Lumu Group of Companies",
      client: "Lumu Group of Companies",
      type: "Website",
      status: "In Progress",
      tags: ["Web"],
      year: 2026,
      link: "",
      featured: true,
      description: "A group website presenting the Lumu Group parent brand and routing visitors to its two divisions — Lumu Auto Dealers and Lumu Real Estate — each with its own inquiry flow.",
      disp: {
        id: "lumu", title: "Lumu Group", sub: "Group of Companies",
        accent: "linear-gradient(92deg,#7aa2ff,#63d67f)", grad: "brand",
        typeLabel: "Website · Auto & Real Estate",
        focus: ["Parent brand + two divisions", "Auto Dealers inquiry flows", "Real Estate listings & inquiries"]
      }
    },
    {
      project: "Keer Art Gallery",
      client: "Keer Art Gallery",
      type: "Website",
      status: "In Progress",
      tags: ["Web", "Booking"],
      year: 2026,
      link: "",
      featured: false,
      description: "An art-gallery website — browse and buy original works, plus a custom commission builder where clients upload a photo, choose size and framing, and see a live price estimate.",
      disp: {
        id: "keer", title: "Keer", sub: "Art Gallery",
        accent: "linear-gradient(92deg,#e8e8ec,#9a9aa2)", grad: "brand",
        typeLabel: "Website · Art & Commissions",
        focus: ["Artwork gallery & sales", "Custom commission builder", "Live price estimate + payments"]
      }
    },
    {
      project: "Fodman International Ltd",
      client: "Fodman International Ltd",
      type: "Web App",
      status: "In Progress",
      tags: ["Web", "Tracking"],
      year: 2026,
      link: "",
      featured: false,
      description: "An online branch system for a money-lending business — track loan applications, borrowers, repayments and follow-ups — delivered alongside professional campaign fliers.",
      disp: {
        id: "fodman", title: "Fodman", sub: "Online Branch System",
        accent: "linear-gradient(92deg,#63d67f,#7aa2ff)", grad: "watp",
        typeLabel: "Web App · Lending System",
        focus: ["Loan application tracking", "Borrowers & repayments", "Campaign fliers"]
      }
    }
  ]
};
