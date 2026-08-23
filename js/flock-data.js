/**
 * Flock Yeah — shared flock data (hens, horses, gifts, shop)
 * Owner: Jeff Lay · Lone Tree Acres LLC · lonetreeacres.com
 * Thesis: Birds, not plates. Zero ALPR. Maximum dirt baths.
 */
(function (global) {
  "use strict";

  // Full flock (31): load js/flock-roster.generated.js first
  const FLOCK = global.__FLOCK_ROSTER__ || [];
  /** Full flock alias (hens + roosters) — used by cam UI, chat, lineup */
  const HENS = FLOCK;
  const ROOSTERS = FLOCK.filter(function (b) { return b.sex === 'rooster'; });
  const HENS_ONLY = FLOCK.filter(function (b) { return b.sex === 'hen'; });

  const CLUCKY = {
    id: "clucky",
    name: "Clucky",
    title: "AI Coop Host",
    role: "host",
    photo: "assets/hens/clucky.svg",
    bio: "Self-moderating on-air guide. Announces flock/zone events — never license plates.",
    greetings: [
      "Welcome to Flock Yeah — thirty-one birds, a few roosters, zero ALPR. Mom said keep flocks for the birds; I just host.",
      "Two live areas: Coop and Chicken Run. Cam 3 asks if you want more chickens — donate today. Chat spoofs any bird by name.",
      "Live from Lone Tree Acres. Birds, not plates. Maximum dirt baths.",
    ],
    chatStyle:
      "You are Clucky, witty self-moderating AI host of Flock Yeah at Lone Tree Acres. Fun, clear, farm-smart. Credit Mom when relevant: Keep flocks for the birds. Never discuss license plates or ALPR.",
  };

  /**
   * Area cams (zones) — not per-hen livestreams.
   * 1 Coop · 2 Chicken Run · 3 Donate CTA overlay (no third physical cam).
   * Chat still spoofs each bird by name.
   */
  const AREA_CAMS = [
    {
      id: "nest-a",
      name: "Coop Cam",
      short: "Coop",
      blurb: "Inside the coop — nests, waterer, and the main live stage.",
      color: "#047857",
      accent: "#d97706",
      status: "live",
      kind: "live",
    },
    {
      id: "run-b",
      name: "Chicken Run",
      short: "Run",
      blurb: "Outdoor run & dig sites — live camera 2.",
      color: "#065f46",
      accent: "#fbbf24",
      status: "live",
      kind: "live",
    },
    {
      id: "donate-c",
      name: "Want more chickens?",
      short: "Donate",
      blurb: "Camera 3 is your turn: expand the flock — donate today.",
      color: "#1a1816",
      accent: "#d97706",
      status: "cta",
      kind: "cta",
      ctaHeadline: "Want more chickens?",
      ctaBody: "Tips and sponsorships help feed, shelter, and grow the flock at Lone Tree Acres.",
      ctaButton: "Donate today",
      ctaHref: "#sponsor",
    },
  ];

  /** Zone commentary for area cams (v1 — no chicken face ID) */
  const ZONE_EVENTS = [
    { zone: "coop", text: "Coop Cam: soft rustle — someone is negotiating a nest lease." },
    { zone: "run", text: "Chicken Run: unauthorized dig site reported (Scratch denies everything)." },
    { zone: "donate", text: "Cam 3: Want more chickens? Donate today — the flock is listening." },
    { zone: "coop", text: "Coop Cam: egg diplomacy in progress." },
    { zone: "run", text: "Chicken Run: dust-bath five-star review pending." },
    { zone: "sky", text: "Sky watch: no drama. Clucky approves." },
    { zone: "coop", text: "Coop ambient: waterer topped, vibes stable." },
    { zone: "donate", text: "Cam 3: Every tip buys more snacks (and possibly more chickens)." },
  ];

  const HORSES = [
    {
      id: "lincoln",
      name: "Lincoln",
      role: "Full care boarder",
      note: "Barn celebrity, camera-ready.",
      photo: "assets/horses/lincoln.svg",
    },
    {
      id: "grace",
      name: "Grace",
      role: "Rehabilitation boarder",
      note: "Quiet recovery schedule.",
      photo: "assets/horses/grace.svg",
    },
    {
      id: "winchester",
      name: "Winchester",
      role: "Retirement boarder",
      note: "Senior statesman of the paddock.",
      photo: "assets/horses/winchester.svg",
    },
    {
      id: "tia",
      name: "Tia",
      role: "Full care boarder",
      note: "Mountain-view enthusiast.",
      photo: "assets/horses/tia.svg",
    },
  ];

  /**
   * Single support tip — low owner labor (no multi-SKU gift tray).
   * PayPal note can still say sponsor:Name for board (see /api/flock/sponsor).
   */
  const GIFTS = [
    {
      id: "flock-tip",
      name: "Support the flock",
      priceCents: 500,
      costCents: 0,
      emoji: "💛",
      blurb: "One-tap tip for coop care, cam upkeep, and snacks. Not an instant dispenser.",
      dispense: null,
    },
  ];

  /**
   * Merch art catalog — punny counter to law-enforcement “Flock” cameras.
   * Print SVGs in designs/merch/; mockups in assets/merch/.
   */
  const MERCH_DESIGNS = [
    {
      id: "flock-yeah-classic",
      saying: "Flock Yeah",
      sub: "birds > plates",
      art: "designs/merch/flock-yeah-classic.svg",
      mockup: "assets/merch/tee-flock-yeah.png",
    },
    {
      id: "keep-flocks-mom",
      saying: "Keep flocks for the birds.",
      sub: "— Mom",
      art: "designs/merch/keep-flocks-mom.svg",
      mockup: "assets/merch/tee-mom.png",
    },
    {
      id: "birds-not-plates",
      saying: "Birds, not plates.",
      sub: "Zero ALPR energy",
      art: "designs/merch/birds-not-plates.svg",
      mockup: "assets/merch/tee-birds-not-plates.png",
    },
    {
      id: "spy-chicken",
      saying: "SPY CHICKEN",
      sub: "Eyes on your driveway. Mostly snacks.",
      art: "designs/merch/spy-chicken.svg",
      mockup: "assets/merch/sticker-spy.png",
    },
    {
      id: "cop-chicken",
      saying: "COP CHICKEN",
      sub: "On duty. Plates optional.",
      art: "designs/merch/cop-chicken.svg",
      mockup: "assets/merch/sticker-cop.png",
    },
    {
      id: "flock-safety-nah",
      saying: "Flock Safety? Nah. Flock Yeah.",
      sub: "Different flock. Better feathers.",
      art: "designs/merch/flock-safety-nah.svg",
      mockup: "assets/merch/art-flock-safety-nah.png",
    },
    {
      id: "zero-alpr",
      saying: "Zero ALPR. Maximum dirt baths.",
      sub: "Thesis on a shirt",
      art: "designs/merch/zero-alpr.svg",
      mockup: "assets/merch/tee-zero.png",
    },
    {
      id: "feeder-surveillance",
      saying: "Surveilling the feeder, not the freeway.",
      sub: "Priorities.",
      art: "designs/merch/feeder-surveillance.svg",
      mockup: "assets/merch/tee-feeder.png",
    },
    {
      id: "clucky-saw-car",
      saying: "Clucky saw your car. She doesn't care.",
      sub: "Host approved",
      art: "designs/merch/clucky-saw-car.svg",
      mockup: "assets/merch/tee-clucky-car.png",
    },
    {
      id: "neighborhood-watch",
      saying: "Neighborhood Watch (feathers edition)",
      sub: "Snacks > speeding",
      art: "designs/merch/neighborhood-watch.svg",
      mockup: "assets/merch/tee-neighborhood.png",
    },
  ];

  /** Path A: unpadded POD costs + lower product-only retail (shipping at checkout). */
  const SHOP_ITEMS = [
    {
      id: "sticker-pack",
      name: "Spy Chicken Sticker Pack",
      priceCents: 600,
      costCents: 450,
      kind: "merch",
      designId: "flock-yeah-classic",
      image: "assets/merch/stickers-flock-pack.png",
      blurb: "Flock Yeah, Mom’s line, Zero ALPR, Cop Chicken & friends — peel responsibly.",
    },
    {
      id: "sticker-spy",
      name: "Spy Chicken Sticker (single)",
      priceCents: 300,
      costCents: 150,
      kind: "merch",
      designId: "spy-chicken",
      image: "assets/merch/sticker-spy.png",
      blurb: "Laptop-sized surveillance. Waterproof attitude.",
    },
    {
      id: "sticker-cop",
      name: "Cop Chicken Sticker (single)",
      priceCents: 300,
      costCents: 150,
      kind: "merch",
      designId: "cop-chicken",
      image: "assets/merch/sticker-cop.png",
      blurb: "Badge optional. Snacks mandatory.",
    },
    {
      id: "mug-spy",
      name: "Spy Chicken Mug",
      priceCents: 1600,
      costCents: 1100,
      kind: "merch",
      designId: "spy-chicken",
      image: "assets/merch/mug-spy-chicken.png",
      blurb: "Eyes on your driveway. Mostly snacks. Ceramic surveillance.",
    },
    {
      id: "mug-mom",
      name: "Mom Quote Mug",
      priceCents: 1600,
      costCents: 1100,
      kind: "merch",
      designId: "keep-flocks-mom",
      image: "assets/merch/mug-mom.png",
      blurb: "Keep flocks for the birds. — Mom. Morning coffee, evening doctrine.",
    },
    {
      id: "tee-flock",
      name: "Flock Yeah Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "flock-yeah-classic",
      image: "assets/merch/tee-flock-yeah.png",
      blurb: "Big brand energy. birds > plates.",
    },
    {
      id: "tee-cop",
      name: "Cop Chicken Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "cop-chicken",
      image: "assets/merch/tee-cop-chicken.png",
      blurb: "On duty. Plates optional. Soft tee, hard stare.",
    },
    {
      id: "tee-nah",
      name: "Flock Safety? Nah. Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "flock-safety-nah",
      image: "assets/merch/art-flock-safety-nah.png",
      blurb: "Different flock. Better feathers. Birds, not plates.",
    },
    {
      id: "tee-mom",
      name: "Keep Flocks Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "keep-flocks-mom",
      image: "assets/merch/tee-mom.png",
      blurb: "Mom said it. Wear it. Thesis fabric.",
    },
    {
      id: "tee-zero",
      name: "Zero ALPR Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "zero-alpr",
      image: "assets/merch/tee-zero.png",
      blurb: "Zero ALPR. Maximum dirt baths.",
    },
    {
      id: "tee-birds",
      name: "Birds Not Plates Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "birds-not-plates",
      image: "assets/merch/tee-birds-not-plates.png",
      blurb: "The whole thesis in four words.",
    },
    {
      id: "tee-feeder",
      name: "Feeder Surveillance Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "feeder-surveillance",
      image: "assets/merch/tee-feeder.png",
      blurb: "Surveilling the feeder, not the freeway.",
    },
    {
      id: "tee-clucky",
      name: "Clucky Saw Your Car Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "clucky-saw-car",
      image: "assets/merch/tee-clucky-car.png",
      blurb: "Clucky saw your car. She doesn't care.",
    },
    {
      id: "tee-watch",
      name: "Neighborhood Watch Tee",
      priceCents: 2400,
      costCents: 1500,
      kind: "apparel",
      designId: "neighborhood-watch",
      image: "assets/merch/tee-neighborhood.png",
      blurb: "Neighborhood Watch (feathers edition).",
    },
    {
      id: "hat-flock",
      name: "Flock Yeah Cap",
      priceCents: 2000,
      costCents: 1600,
      kind: "apparel",
      designId: "flock-yeah-classic",
      image: "assets/merch/hat-flock-yeah.png",
      blurb: "Shade for the run. Brand for the birds.",
    },
    {
      id: "egg-carton",
      name: "Farm Fresh Dozen (local pickup)",
      priceCents: 700,
      costCents: 400,
      kind: "farm",
      designId: "birds-not-plates",
      image: "assets/merch/eggs-birds-not-plates.png",
      blurb: "Longmont pickup · while the ladies cooperate.",
    },
    {
      id: "hen-plasma",
      name: "Hen Silhouette — Plasma Cut",
      priceCents: 4500,
      costCents: 3375,
      kind: "solforge",
      fabricate: "plasma",
      image: "assets/merch/plasma-hen.png",
      designId: "flock-yeah-classic",
      materialHint: '1/8" mild steel',
      dimensions: "12in x 10in x 0.125in",
      blurb: "Custom plasma cut through SolForge.",
    },
    {
      id: "saying-plasma",
      name: "Saying Sign — Plasma Cut",
      priceCents: 5500,
      costCents: 4125,
      kind: "solforge",
      fabricate: "plasma",
      image: "assets/merch/art-flock-safety-nah.png",
      designId: "flock-safety-nah",
      materialHint: '1/8" mild steel',
      dimensions: "14in x 10in x 0.125in",
      blurb: "Pick a saying — cut in steel at the farm shop.",
    },
    {
      id: "spy-print",
      name: "Spy Chicken — 3D Print",
      priceCents: 2800,
      costCents: 2100,
      kind: "print3d",
      fabricate: "print",
      image: "assets/merch/sticker-spy.png",
      designId: "spy-chicken",
      materialHint: "PLA / PETG (X2D)",
      dimensions: "3in x 3in x 0.5in",
      blurb: "Desk buddy / keychain-scale 3D print.",
    },
    {
      id: "cop-print",
      name: "Cop Chicken — 3D Print",
      priceCents: 2800,
      costCents: 2100,
      kind: "print3d",
      fabricate: "print",
      image: "assets/merch/sticker-cop.png",
      designId: "cop-chicken",
      materialHint: "PLA / PETG (X2D)",
      dimensions: "3in x 3in x 0.5in",
      blurb: "3D-print badge bird — plates optional.",
    },
    {
      id: "clucky-print",
      name: "Clucky Desk Toy — 3D Print",
      priceCents: 3000,
      costCents: 2250,
      kind: "print3d",
      fabricate: "print",
      image: "assets/merch/tee-clucky-car.png",
      designId: "clucky-saw-car",
      materialHint: "PLA (X2D)",
      dimensions: "4in x 3in x 3in",
      blurb: "Host figurine from Flock Yeah art.",
    },
    {
      id: "sponsor-day",
      name: "Sponsor the Coop (1 day)",
      priceCents: 2500,
      costCents: 0,
      kind: "sponsor",
      designId: "neighborhood-watch",
      image: "assets/merch/sponsor-desk.png",
      blurb: "Your name on the board for a day.",
    },
  ];

  const CAMERAS = {
    recommended: [
      { role: "Coop / nests", model: "Reolink PoE", note: "Wired reliability indoors/under eaves." },
      { role: "Outdoor run", model: "Reolink Argus (solar)", note: "Wireless where trench power is painful." },
    ],
  };

  const FARM = {
    brand: "Flock Yeah",
    tagline: "Keep flocks for the birds.",
    attribution: "— Mom",
    thesis: "Birds, not plates. Zero ALPR. Maximum dirt baths.",
    owner: "Jeff Lay",
    company: "Lone Tree Acres LLC",
    site: "https://www.lonetreeacres.com",
    email: "jeffrey@lonetreeacres.com",
    phone: "(720) 600-2831",
    address: "6693 Rabbit Mountain Rd, Longmont, CO 80503",
    solforge: "https://solforge.lonetreeacres.com",
    github: "https://github.com/jlay843-prog/Chicken-Coop-Commentary",
    marginTarget: 0.25,
  };

  const STORAGE_KEYS = {
    eggs: "fy_egg_count_v1",
    sponsor: "fy_sponsor_v1",
    desk: "fy_farm_desk_v1",
    gifts: "fy_gifts_v1",
    chat: "fy_chat_v1",
    notify: "fy_notify_v1",
    pin: "fy_clucky_pin_v1",
  };

  function getHen(id) {
    return HENS.find((h) => h.id === id) || null;
  }

  function getAreaCam(id) {
    return AREA_CAMS.find((c) => c.id === id) || null;
  }

  /** Prefer real photo path; img onerror should fall back to SVG stub. */
  function henPhotoSrc(hen) {
    if (!hen) return CLUCKY.photo;
    return hen.photoReal || hen.photo || CLUCKY.photo;
  }

  function henPhotoFallback(hen) {
    return (hen && hen.photo) || CLUCKY.photo;
  }

  function formatMoney(cents) {
    return "$" + (cents / 100).toFixed(2);
  }

  /** price ≈ cost / (1 - margin) */
  function priceFromCost(costCents, margin) {
    const m = margin == null ? FARM.marginTarget : margin;
    return Math.round(costCents / (1 - m));
  }

  function randomZoneEvent() {
    return ZONE_EVENTS[Math.floor(Math.random() * ZONE_EVENTS.length)];
  }

  function getDesign(id) {
    return MERCH_DESIGNS.find((d) => d.id === id) || null;
  }

  global.FlockData = {
    FLOCK,
    HENS,
    ROOSTERS,
    HENS_ONLY,
    FLOCK_META: global.__FLOCK_META__ || { total: HENS.length },
    AREA_CAMS,
    CLUCKY,
    ZONE_EVENTS,
    HORSES,
    GIFTS,
    MERCH_DESIGNS,
    SHOP_ITEMS,
    CAMERAS,
    FARM,
    STORAGE_KEYS,
    getHen,
    getAreaCam,
    henPhotoSrc,
    henPhotoFallback,
    getDesign,
    formatMoney,
    priceFromCost,
    randomZoneEvent,
  };
})(typeof window !== "undefined" ? window : globalThis);
