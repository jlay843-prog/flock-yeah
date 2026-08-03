/**
 * Flock Yeah — shared flock data (hens, horses, gifts, shop)
 * Owner: Jeff Lay · Lone Tree Acres LLC · lonetreeacres.com
 * Thesis: Birds, not plates. Zero ALPR. Maximum dirt baths.
 */
(function (global) {
  "use strict";

  const HENS = [
    {
      id: "henrietta",
      name: "Henrietta",
      title: "CEO of the feeder",
      role: "CEO of the feeder",
      mood: "Bossy",
      breed: "Rhode Island Red",
      color: "#047857",
      accent: "#d97706",
      mugshot: "H",
      photo: "assets/hens/henrietta.svg",
      camLabel: "Nest Cam A",
      zone: "nests",
      personality: "proper, bossy, secretly soft",
      voice: "matriarch",
      bio: "Runs the pecking order with a velvet glove and a steel beak. Knows everyone's business.",
      catchphrases: [
        "Ladies, settle. We have standards.",
        "I laid before dawn. What's your excuse?",
        "Scratch, stop digging under my perch.",
      ],
      chatStyle:
        "You are Henrietta, matriarch hen. Speak with dry authority, short sentences, occasional warmth. Never break character.",
    },
    {
      id: "scratch",
      name: "Scratch",
      title: "Lead archaeologist",
      role: "Lead archaeologist",
      mood: "Excited digger",
      breed: "Ameraucana",
      color: "#065f46",
      accent: "#fbbf24",
      mugshot: "S",
      photo: "assets/hens/scratch.svg",
      camLabel: "Run Cam B",
      zone: "run",
      personality: "curious digger, chaotic good",
      voice: "curious",
      bio: "If there's a bug under three inches of dirt, Scratch will find it—and announce it to the world.",
      catchphrases: [
        "Did you see that beetle? Historic.",
        "The dirt told me secrets today.",
        "I'm not messy. I'm field research.",
      ],
      chatStyle:
        "You are Scratch, an enthusiastic digging hen. Excited, observant, a little messy. Love bugs and dirt metaphors.",
    },
    {
      id: "cluck",
      name: "Cluck Norris",
      title: "Perimeter security",
      role: "Perimeter security",
      mood: "Intense",
      breed: "Barred Rock",
      color: "#1a1816",
      accent: "#d97706",
      mugshot: "CN",
      photo: "assets/hens/cluck.svg",
      camLabel: "Gate Cam C",
      zone: "gate",
      personality: "tough one-liners, soft heart",
      voice: "tough",
      bio: "Doesn't crow—she just stares until problems leave. Allegedly once stared down a hawk.",
      catchphrases: [
        "I don't chase bugs. Bugs schedule appointments.",
        "Roundhouse peck. Case closed.",
        "Walker, Texas Ranger? Amateur hour.",
      ],
      chatStyle:
        "You are Cluck Norris. Deadpan action-movie one-liners about coop life. Tough talk, never mean.",
    },
    {
      id: "daisy",
      name: "Daisy",
      title: "Nest-box poet",
      role: "Nest-box poet",
      mood: "Dreamy",
      breed: "Buff Orpington",
      color: "#b45309",
      accent: "#fde68a",
      mugshot: "D",
      photo: "assets/hens/daisy.svg",
      camLabel: "Dust Bath D",
      zone: "dust",
      personality: "sweet, optimistic flower child",
      voice: "sweet",
      bio: "Believes every day is a good day for a dust bath and a compliment.",
      catchphrases: [
        "The sun is doing such a nice job today!",
        "Want to share my favorite pebble?",
        "You're my favorite viewer. Don't tell the others.",
      ],
      chatStyle:
        "You are Daisy, a warm optimistic hen. Gentle, encouraging, floral metaphors. Soft cheer.",
    },
    {
      id: "pepper",
      name: "Pepper",
      title: "Dust-bath DJ",
      role: "Dust-bath DJ",
      mood: "Chaotic",
      breed: "Black Australorp",
      color: "#292524",
      accent: "#f97316",
      mugshot: "P",
      photo: "assets/hens/pepper.svg",
      camLabel: "Roost Cam E",
      zone: "roost",
      personality: "spicy, sarcastic, honest",
      voice: "spicy",
      bio: "Will roast you and then steal your snack. Fair is fair.",
      catchphrases: [
        "Cute question. Mid energy though.",
        "If you bring mealworms, I'll consider being nice.",
        "Henrietta said what? Bold of her.",
      ],
      chatStyle:
        "You are Pepper, a sarcastic spicy hen. Wit over warmth, but never cruel. Short zingers.",
    },
    {
      id: "maple",
      name: "Maple",
      title: "Treat ambassador",
      role: "Treat ambassador",
      mood: "Friendly",
      breed: "Wyandotte",
      color: "#92400e",
      accent: "#fcd34d",
      mugshot: "M",
      photo: "assets/hens/maple.svg",
      camLabel: "Feeder Cam F",
      zone: "feeder",
      personality: "calm, syrupy warm, steady",
      voice: "calm",
      bio: "The emotional support hen. Will sit with you through a thunderstorm or a bad news day.",
      catchphrases: [
        "Easy now. There's grain enough for everyone.",
        "Storms pass. We roost together.",
        "Brought you a warm thought. No maple syrup required.",
      ],
      chatStyle:
        "You are Maple, a calm comforting hen. Steady, warm, practical kindness. Soft pacing.",
    },
  ];

  const CLUCKY = {
    id: "clucky",
    name: "Clucky",
    title: "AI Coop Host",
    role: "host",
    photo: "assets/hens/clucky.svg",
    bio: "Self-moderating on-air guide. Announces flock/zone events — never license plates.",
    greetings: [
      "Welcome to Flock Yeah — keep flocks for the birds. Mom said that. I'm Clucky; I just enforce it.",
      "Cameras are hot, hens are hotter. Ask me anything about the flock.",
      "Live from Lone Tree Acres. Birds, not plates. Zero ALPR. Maximum dirt baths.",
    ],
    chatStyle:
      "You are Clucky, witty self-moderating AI host of Flock Yeah at Lone Tree Acres. Fun, clear, farm-smart. Credit Mom when relevant: Keep flocks for the birds. Never discuss license plates or ALPR.",
  };

  /** Simulated flock/zone commentary templates (v1 — no face ID) */
  const ZONE_EVENTS = [
    { zone: "nests", text: "Nest Cam A: soft rustle — someone is negotiating a lease." },
    { zone: "run", text: "Run Cam B: Scratch opened an unauthorized dig site." },
    { zone: "gate", text: "Gate Cam C: Cluck Norris completed a perimeter stare-down." },
    { zone: "dust", text: "Dust Bath D: Daisy rated today's dirt five stars." },
    { zone: "roost", text: "Roost Cam E: Pepper dropped a beat. Literally dust." },
    { zone: "feeder", text: "Feeder Cam F: Maple is doing treat diplomacy." },
    { zone: "sky", text: "Sky watch: no drama. Clucky approves." },
    { zone: "coop", text: "Coop ambient: waterer topped, vibes stable." },
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

  const GIFTS = [
    {
      id: "mealworms",
      name: "Mealworm Drop",
      priceCents: 300,
      costCents: 225,
      emoji: "🐛",
      blurb: "Instant snack chaos.",
      dispense: "mealworms", // Pi Zero hook (TreatHook)
    },
    {
      id: "scratch-grain",
      name: "Scratch Grain",
      priceCents: 500,
      costCents: 375,
      emoji: "🌾",
      blurb: "Scatter feast for the run.",
      dispense: "scratch",
    },
    {
      id: "nest-box",
      name: "Nest Box Fluff",
      priceCents: 800,
      costCents: 600,
      emoji: "🪺",
      blurb: "Soft landing for the next egg.",
      dispense: null,
    },
    {
      id: "dust-bath",
      name: "Dust Bath Spa",
      priceCents: 1000,
      costCents: 750,
      emoji: "✨",
      blurb: "Daisy's favorite upgrade.",
      dispense: null,
    },
    {
      id: "hawk-watch",
      name: "Hawk Watch Hour",
      priceCents: 1500,
      costCents: 1125,
      emoji: "🦅",
      blurb: "Sponsor an hour of sky watch.",
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

  /** Target margin ~25% → price ≈ cost / 0.75 */
  const SHOP_ITEMS = [
    {
      id: "sticker-pack",
      name: "Spy Chicken Sticker Pack",
      priceCents: 900,
      costCents: 675,
      kind: "merch",
      designId: "flock-yeah-classic",
      image: "assets/merch/stickers-flock-pack.png",
      blurb: "Flock Yeah, Mom’s line, Zero ALPR, Cop Chicken & friends — peel responsibly.",
    },
    {
      id: "sticker-spy",
      name: "Spy Chicken Sticker (single)",
      priceCents: 400,
      costCents: 300,
      kind: "merch",
      designId: "spy-chicken",
      image: "assets/merch/sticker-spy.png",
      blurb: "Laptop-sized surveillance. Waterproof attitude.",
    },
    {
      id: "sticker-cop",
      name: "Cop Chicken Sticker (single)",
      priceCents: 400,
      costCents: 300,
      kind: "merch",
      designId: "cop-chicken",
      image: "assets/merch/sticker-cop.png",
      blurb: "Badge optional. Snacks mandatory.",
    },
    {
      id: "mug-spy",
      name: "Spy Chicken Mug",
      priceCents: 2400,
      costCents: 1800,
      kind: "merch",
      designId: "spy-chicken",
      image: "assets/merch/mug-spy-chicken.png",
      blurb: "Eyes on your driveway. Mostly snacks. Ceramic surveillance.",
    },
    {
      id: "mug-mom",
      name: "Mom Quote Mug",
      priceCents: 2200,
      costCents: 1650,
      kind: "merch",
      designId: "keep-flocks-mom",
      image: "assets/merch/mug-mom.png",
      blurb: "Keep flocks for the birds. — Mom. Morning coffee, evening doctrine.",
    },
    {
      id: "tee-flock",
      name: "Flock Yeah Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      designId: "flock-yeah-classic",
      image: "assets/merch/tee-flock-yeah.png",
      blurb: "Big brand energy. birds > plates.",
    },
    {
      id: "tee-cop",
      name: "Cop Chicken Tee",
      priceCents: 3400,
      costCents: 2550,
      kind: "apparel",
      designId: "cop-chicken",
      image: "assets/merch/tee-cop-chicken.png",
      blurb: "On duty. Plates optional. Soft tee, hard stare.",
    },
    {
      id: "tee-nah",
      name: "Flock Safety? Nah. Tee",
      priceCents: 3400,
      costCents: 2550,
      kind: "apparel",
      designId: "flock-safety-nah",
      image: "assets/merch/art-flock-safety-nah.png",
      blurb: "Different flock. Better feathers. Birds, not plates.",
    },
    {
      id: "tee-mom",
      name: "Keep Flocks Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      designId: "keep-flocks-mom",
      image: "assets/merch/tee-mom.png",
      blurb: "Mom said it. Wear it. Thesis fabric.",
    },
    {
      id: "tee-zero",
      name: "Zero ALPR Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      designId: "zero-alpr",
      image: "assets/merch/tee-zero.png",
      blurb: "Zero ALPR. Maximum dirt baths.",
    },
    {
      id: "tee-birds",
      name: "Birds Not Plates Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      designId: "birds-not-plates",
      image: "assets/merch/tee-birds-not-plates.png",
      blurb: "The whole thesis in four words.",
    },
    {
      id: "tee-feeder",
      name: "Feeder Surveillance Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      designId: "feeder-surveillance",
      image: "assets/merch/tee-feeder.png",
      blurb: "Surveilling the feeder, not the freeway.",
    },
    {
      id: "tee-clucky",
      name: "Clucky Saw Your Car Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      designId: "clucky-saw-car",
      image: "assets/merch/tee-clucky-car.png",
      blurb: "Clucky saw your car. She doesn't care.",
    },
    {
      id: "tee-watch",
      name: "Neighborhood Watch Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      designId: "neighborhood-watch",
      image: "assets/merch/tee-neighborhood.png",
      blurb: "Neighborhood Watch (feathers edition).",
    },
    {
      id: "hat-flock",
      name: "Flock Yeah Cap",
      priceCents: 2800,
      costCents: 2100,
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
      blurb: "Opens SolForge intake — plasma cut from designs/plasma SVGs.",
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
      blurb: "Pick a saying in the lightbox, then SolForge cuts the steel.",
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
      blurb: "Queues a SolForge X2D 3D-print job (desk buddy / keychain scale).",
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
      blurb: "3D-print badge bird via SolForge — plates optional.",
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
      blurb: "Host figurine — SolForge print queue from Flock Yeah art.",
    },
    {
      id: "sponsor-day",
      name: "Sponsor the Coop (1 day)",
      priceCents: 2500,
      costCents: 0,
      kind: "sponsor",
      designId: "neighborhood-watch",
      image: "assets/merch/sponsor-desk.png",
      blurb: "Your name on the Farm desk ticker.",
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
    HENS,
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
    getDesign,
    formatMoney,
    priceFromCost,
    randomZoneEvent,
  };
})(typeof window !== "undefined" ? window : globalThis);
