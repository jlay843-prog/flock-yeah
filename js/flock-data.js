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
    { id: "mealworms", name: "Mealworm Drop", priceCents: 300, costCents: 225, emoji: "🐛", blurb: "Instant snack chaos." },
    { id: "scratch-grain", name: "Scratch Grain", priceCents: 500, costCents: 375, emoji: "🌾", blurb: "Scatter feast for the run." },
    { id: "nest-box", name: "Nest Box Fluff", priceCents: 800, costCents: 600, emoji: "🪺", blurb: "Soft landing for the next egg." },
    { id: "dust-bath", name: "Dust Bath Spa", priceCents: 1000, costCents: 750, emoji: "✨", blurb: "Daisy's favorite upgrade." },
    { id: "hawk-watch", name: "Hawk Watch Hour", priceCents: 1500, costCents: 1125, emoji: "🦅", blurb: "Sponsor an hour of sky watch." },
  ];

  /** Target margin ~25% → price ≈ cost / 0.75 */
  const SHOP_ITEMS = [
    {
      id: "flock-sticker",
      name: "Flock Yeah Sticker Pack",
      priceCents: 800,
      costCents: 600,
      kind: "merch",
      blurb: "Six hens, one attitude. ~25% margin target.",
    },
    {
      id: "coop-mug",
      name: "Clucky Coffee Mug",
      priceCents: 2200,
      costCents: 1650,
      kind: "merch",
      blurb: "Keep flocks for the birds — printed inside the rim.",
    },
    {
      id: "flock-hat",
      name: "Flock Yeah Cap",
      priceCents: 2800,
      costCents: 2100,
      kind: "apparel",
      blurb: "Hat edition of Mom's line.",
    },
    {
      id: "flock-tee",
      name: "Flock Yeah Tee",
      priceCents: 3200,
      costCents: 2400,
      kind: "apparel",
      blurb: "Soft tee. Hard stance against ALPR vibes.",
    },
    {
      id: "egg-carton",
      name: "Farm Fresh Dozen (local pickup)",
      priceCents: 700,
      costCents: 400,
      kind: "farm",
      blurb: "Longmont pickup · while the ladies cooperate.",
    },
    {
      id: "hen-plasma",
      name: "Hen Silhouette — Plasma Cut",
      priceCents: 4500,
      costCents: 3375,
      kind: "solforge",
      blurb: "Cut at SolForge from designs/plasma SVGs.",
    },
    {
      id: "sponsor-day",
      name: "Sponsor the Coop (1 day)",
      priceCents: 2500,
      costCents: 0,
      kind: "sponsor",
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

  global.FlockData = {
    HENS,
    CLUCKY,
    ZONE_EVENTS,
    HORSES,
    GIFTS,
    SHOP_ITEMS,
    CAMERAS,
    FARM,
    STORAGE_KEYS,
    getHen,
    formatMoney,
    priceFromCost,
    randomZoneEvent,
  };
})(typeof window !== "undefined" ? window : globalThis);
