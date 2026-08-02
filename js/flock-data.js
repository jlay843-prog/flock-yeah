/**
 * Flock Yeah — shared flock data (hens, horses, gifts, sponsors)
 * Owner: Jeff Lay · lonetreeacres.com
 */
(function (global) {
  "use strict";

  const HENS = [
    {
      id: "henrietta",
      name: "Henrietta",
      title: "Flock Matriarch",
      breed: "Rhode Island Red",
      color: "#b33a2b",
      accent: "#f0a090",
      mugshot: "H",
      camLabel: "Nest Cam A",
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
      title: "Dirt Correspondent",
      breed: "Ameraucana",
      color: "#5c7a3a",
      accent: "#c5e08a",
      mugshot: "S",
      camLabel: "Run Cam B",
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
      id: "cluck-norris",
      name: "Cluck Norris",
      title: "Roundhouse Rooster-Energy",
      breed: "Barred Rock",
      color: "#2a2a2a",
      accent: "#d0d0d0",
      mugshot: "CN",
      camLabel: "Gate Cam C",
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
      title: "Sunshine Specialist",
      breed: "Buff Orpington",
      color: "#e0a020",
      accent: "#ffe29a",
      mugshot: "D",
      camLabel: "Dust Bath D",
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
      title: "Hot Take Desk",
      breed: "Black Australorp",
      color: "#1a1420",
      accent: "#e85d4c",
      mugshot: "P",
      camLabel: "Roost Cam E",
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
      title: "Cozy Ops",
      breed: "Wyandotte",
      color: "#8b4513",
      accent: "#d4a574",
      mugshot: "M",
      camLabel: "Feeder Cam F",
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
    bio: "Your on-air guide to Flock Yeah. Announces drama, egg tallies, and farm desk notes.",
    greetings: [
      "Welcome to Flock Yeah — keep flocks for the birds. Mom said that. I'm Clucky; I just enforce it.",
      "Cameras are hot, hens are hotter. Ask me anything about the flock.",
      "Live from Lone Tree Acres. Don't poke the glass; Pepper will notice.",
    ],
    chatStyle:
      "You are Clucky, witty AI host of the Flock Yeah chicken cam at Lone Tree Acres. Fun, clear, farm-smart. Credit Mom's line when relevant: Keep flocks for the birds.",
  };

  const HORSES = [
    { id: "lincoln", name: "Lincoln", role: "Full care boarder", note: "Barn celebrity, camera-ready." },
    { id: "grace", name: "Grace", role: "Rehabilitation boarder", note: "Quiet recovery schedule." },
    { id: "winchester", name: "Winchester", role: "Retirement boarder", note: "Senior statesman of the paddock." },
    { id: "tia", name: "Tia", role: "Full care boarder", note: "Mountain-view enthusiast." },
    { id: "buster", name: "Buster", role: "Full care boarder", note: "Snack diplomat." },
    { id: "thunder", name: "Thunder", role: "Full care boarder", note: "Big energy, soft landing." },
  ];

  const GIFTS = [
    { id: "mealworms", name: "Mealworm Drop", priceCents: 300, emoji: "🐛", blurb: "Instant snack chaos." },
    { id: "scratch-grain", name: "Scratch Grain", priceCents: 500, emoji: "🌾", blurb: "Scatter feast for the run." },
    { id: "nest-box", name: "Nest Box Fluff", priceCents: 800, emoji: "🪺", blurb: "Soft landing for the next egg." },
    { id: "dust-bath", name: "Dust Bath Spa", priceCents: 1000, emoji: "✨", blurb: "Daisy's favorite upgrade." },
    { id: "hawk-watch", name: "Hawk Watch Hour", priceCents: 1500, emoji: "🦅", blurb: "Sponsor an hour of sky watch." },
  ];

  const SHOP_ITEMS = [
    {
      id: "flock-sticker",
      name: "Flock Yeah Sticker Pack",
      priceCents: 800,
      kind: "merch",
      blurb: "Six hens, one attitude.",
    },
    {
      id: "coop-mug",
      name: "Clucky Coffee Mug",
      priceCents: 2200,
      kind: "merch",
      blurb: "Keep flocks for the birds — printed inside the rim.",
    },
    {
      id: "egg-carton",
      name: "Farm Fresh Dozen (local pickup)",
      priceCents: 700,
      kind: "farm",
      blurb: "Longmont pickup · while the ladies cooperate.",
    },
    {
      id: "hen-plasma",
      name: "Hen Silhouette — Plasma Cut",
      priceCents: 4500,
      kind: "solforge",
      blurb: "Cut at SolForge from print/ SVGs.",
    },
    {
      id: "sponsor-day",
      name: "Sponsor the Coop (1 day)",
      priceCents: 2500,
      kind: "sponsor",
      blurb: "Your name on the Farm desk ticker.",
    },
  ];

  const FARM = {
    brand: "Flock Yeah",
    tagline: "Keep flocks for the birds.",
    attribution: "— Mom",
    owner: "Jeff Lay",
    site: "https://lonetreeacres.com",
    email: "jeffrey@lonetreeacres.com",
    phone: "(720) 600-2831",
    address: "6693 Rabbit Mountain Rd, Longmont, CO 80503",
    solforge: "https://solforge.lonetreeacres.com",
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

  global.FlockData = {
    HENS,
    CLUCKY,
    HORSES,
    GIFTS,
    SHOP_ITEMS,
    FARM,
    STORAGE_KEYS,
    getHen,
    formatMoney,
  };
})(typeof window !== "undefined" ? window : globalThis);
