/* ============================================================
   97 WORLD — SITE DATA
   This mirrors the "97 World — Design Sector HQ" Notion hub.
   Edit here (or in Notion) to keep the site and back-office in sync.
   To go fully live later, this file can be replaced by a fetch()
   from the Notion API — the shape below matches the Notion databases.
   ============================================================ */

window.SITE = {
  whatsapp: "256708735878",          // +256 708 735 878
  usdToUgx: 3800,                     // approx rate, editable

  /* Mirrors Notion → Services & Pricing */
  services: [
    { id: "web",     name: "Website",                 category: "Web",      usd: 500, days: 10, popular: true,  note: "Multi-page, responsive, built to convert" },
    { id: "landing", name: "Landing Page",            category: "Web",      usd: 200, days: 4,  popular: false, note: "One high-impact page, fast turnaround" },
    { id: "logo",    name: "Logo & Brand Mark",       category: "Branding", usd: 150, days: 5,  popular: false, note: "Custom logo with full variations" },
    { id: "brand",   name: "Full Brand Kit",          category: "Branding", usd: 300, days: 10, popular: true,  note: "Logo, colors, fonts, guidelines" },
    { id: "flier",   name: "Campaign Flier / Poster", category: "Print",    usd: 40,  days: 2,  popular: false, note: "Print + social ready design" },
    { id: "cards",   name: "Business Cards",          category: "Print",    usd: 35,  days: 2,  popular: false, note: "Design + print-ready files" },
    { id: "social",  name: "Social Media Pack",       category: "Social",   usd: 120, days: 5,  popular: false, note: "Templates + a set of posts" }
  ],

  /* The experience ladder (hero → services story) */
  experience: [
    { name: "Websites",            desc: "Fast, modern, conversion-first sites that work on every screen." },
    { name: "Campaign Fliers",     desc: "Posters & fliers that stop the scroll and fill the room." },
    { name: "Brand & Logo Design", desc: "Identities that hold up from a business card to a billboard." },
    { name: "Social Media Kits",   desc: "Content that keeps your brand loud across every feed." },
    { name: "…and more — all your needs", desc: "If it can be designed, the 97 sector builds it.", dim: true }
  ],

  /* Mirrors Notion → Portfolio */
  work: [
    {
      title: "WATP", sub: "My Weekly Track",
      status: "soon", statusLabel: "Coming Soon",
      desc: "My Weekly Track — a personal tracking platform. Preview slot reserved; live build in progress.",
      tags: ["Web App", "Tracking", "UI/UX"],
      grad: "watp", accent: "linear-gradient(92deg,#7aa2ff,#c58bff)"
    },
    {
      title: "Mayanyure", sub: "Resort",
      status: "live", statusLabel: "Live",
      desc: "A full hospitality website — bookings, gallery and story, built to make the resort feel as good online as it does in person.",
      tags: ["Website", "Hospitality", "Booking"],
      grad: "may", accent: "linear-gradient(92deg,#63d67f,#ffce00)"
    }
  ]
};
