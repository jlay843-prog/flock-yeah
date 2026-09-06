/**
 * Flock Yeah — Clucky + per-hen chat
 * Prefers /api/clucky/chat (SolForge production or npm run dev Ollama).
 * Instant witty canned replies when the LLM is slow or offline — never generic echo.
 */
(function (global) {
  "use strict";

  const { HENS, CLUCKY, getHen } = global.FlockData;

  const FALLBACKS = {
    clucky: [
      "Live from Lone Tree Acres — eggs, drama, and zero ALPR.",
      "Mom's rule still stands: keep flocks for the birds.",
      "I've got Nest Cam A, a short attention span, and strong opinions about dirt.",
    ],
    default: [
      "Cluck. (Translation: interesting question.)",
      "I'm pecking on that thought.",
      "Ask me again after dust bath.",
    ],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function eggCount() {
    return global.HenCam && typeof global.HenCam.getEggCount === "function"
      ? global.HenCam.getEggCount()
      : "?";
  }

  function topicReply(hen, text) {
    const t = normalize(text);
    if (!t) return pick(hen.catchphrases || FALLBACKS.default);

    if (/\b(clean|messy|mess|dirt|poop|manure|smell|stink|gross)\b/.test(t)) {
      if (hen.id === "henrietta") {
        return "The coop has standards. Farm desk — get the rake before I issue a formal complaint.";
      }
      if (hen.id === "scratch") {
        return "Messy? That's my research archive. Do not touch the dig site.";
      }
      if (hen.id === "daisy") {
        return "A little dust is a spa day. Actual mess? Jeff's department, not mine.";
      }
      return "If it's under the roost, that's a farm-desk job. We just generate the evidence.";
    }
    if (/\b(egg|lay|nest)\b/.test(t)) {
      return hen.id === "henrietta"
        ? "Eggs are a schedule, not a suggestion. Check the counter."
        : "Egg talk! Nest cams don't spoil the count — Pepper might.";
    }
    if (/\b(food|treat|mealworm|grain|snack|hungry)\b/.test(t)) {
      return hen.id === "pepper"
        ? "Gifts unlock snacks. Bribery works. I respect the system."
        : "Send a gift from the tray — we notice generosity.";
    }
    if (/\b(hawk|fox|danger|safe|predator|coyote)\b/.test(t)) {
      return hen.id === "cluck"
        ? "Sky threats get the roundhouse stare. We're covered."
        : "Sky watch is serious. Clucky calls it if something circles.";
    }
    if (/\b(hello|hi|hey|howdy)\b/.test(t)) {
      return pick(hen.catchphrases || FALLBACKS.default);
    }
    if (/\b(mom|flock yeah|tagline)\b/.test(t)) {
      return "Keep flocks for the birds. — Mom. We take that personally.";
    }
    if (/\b(name|who are you|about you)\b/.test(t)) {
      return "I'm " + hen.name + ". " + (hen.bio || "");
    }
    if (/\b(cam|camera|video|stream|see|watching)\b/.test(t)) {
      return "Nest Cam A is the main stage. I perform when the light's good.";
    }
    if (/\b(love|cute|pretty|beautiful|adorable)\b/.test(t)) {
      return hen.id === "pepper"
        ? "Flattery noted. Mealworms would make it official."
        : pick(hen.catchphrases || FALLBACKS.default);
    }

    // Wit bounce — catchphrase + light topic hook, never dumb echo of full sentence
    const hook = t.split(/\s+/).filter((w) => w.length > 3).slice(0, 3).join(" ");
    if (hook && hen.catchphrases && hen.catchphrases.length) {
      return pick(hen.catchphrases) + " (topic: " + hook + ")";
    }
    return pick(hen.catchphrases || FALLBACKS.default);
  }

  function cluckyReply(text) {
    const t = normalize(text);
    if (!t) return pick(CLUCKY.greetings);

    if (/\b(clean|messy|mess|dirt|poop|manure|smell|stink|gross|filthy|rake|shovel)\b/.test(t)) {
      return pick([
        "Honest take: the coop always needs a cleaning. I just host; Jeff owns the rake.",
        "Filed under farm desk. The hens call it 'interior design.' Visitors call it 'yikes.'",
        "Correct. Someone leave a note for Jeff — mealworms optional, shovel mandatory.",
        "Nest Cam A confirms: rustic vibes, ambitious dust. Cleaning is a plot arc, not a one-liner.",
      ]);
    }
    if (/\b(who|hen|flock|lineup|roster)\b/.test(t)) {
      return (
        "Tonight's lineup: " +
        HENS.map((h) => h.name).join(", ") +
        ". Who's Who has the jail-lineup zoom."
      );
    }
    if (/\b(egg|count|lay)\b/.test(t)) {
      return (
        "Egg counter reads " +
        eggCount() +
        ". Fresh math, questionable honesty from Pepper."
      );
    }
    if (/\b(shop|buy|gift|sponsor|merch|tee|sticker)\b/.test(t)) {
      return "Shop and gifts keep the coop glamorous. SolForge cuts the metal hens if you want steel.";
    }
    if (/\b(horse|herd|lincoln|grace|tia|winchester)\b/.test(t)) {
      return "Horses live next door — open Herd for Lincoln, Grace, and the rest.";
    }
    if (/\b(mom|tagline|flock yeah|birds not plates)\b/.test(t)) {
      return 'Brand check: Flock Yeah — “Keep flocks for the birds.” — Mom. I just host.';
    }
    if (/\b(hello|hi|hey|howdy|sup)\b/.test(t)) {
      return pick(CLUCKY.greetings);
    }
    if (/\b(cam|camera|video|stream|live|watching|see)\b/.test(t)) {
      return pick([
        "Nest Cam A is rolling — Fluent MP4, farm grit included. Ask what's happening and I'll color-comment.",
        "Cameras are hot. Hens are hotter. I'm the third-wheeling narrator.",
      ]);
    }
    if (/\b(treat|mealworm|food|feed|snack|hungry)\b/.test(t)) {
      return "Treat tray is open. Send a gift and the flock develops sudden religious feelings.";
    }
    if (/\b(drama|fight|peck|bully|mean)\b/.test(t)) {
      return "Drama suspects: Pepper (mouth), Scratch (dirt crimes), Henrietta (HR). Pick a hen and interrogate.";
    }
    if (isWeatherAsk(t)) {
      return pick([
        "Farm weather feed isn't in my beak yet. Ask again when the station's up — I don't invent forecasts.",
        "Station's quiet and I don't do fake weather. Ping me when the farm feed's back in my beak.",
      ]);
    }
    if (/\b(jeff|owner|farmer|desk)\b/.test(t)) {
      return "Jeff runs the farm desk. I run the commentary. Split responsibilities, shared blame.";
    }
    if (/\b(alpr|plate|license|surveillance|spy)\b/.test(t)) {
      return "Birds, not plates. Zero ALPR. Maximum dirt baths. Mom was very clear.";
    }
    if (isJokeAsk(t)) {
      return pick([
        "Why did the chicken cross the livestream? Content.",
        "I'd tell a longer joke, but Henrietta bills by the cluck.",
        "What do you call a hen who does stand-up? A cluck-median. I'll see myself to the run.",
        "Knock-knock. Who's there? Pepper. Pepper who? Pepper doesn't knock — she drops a dust-bath punchline.",
      ]);
    }
    if (/\b(thank|thanks|thx)\b/.test(t)) {
      return "You're welcome. Tip the flock with a treat if the bit landed.";
    }
    if (/\b(help|what can|commands|menu)\b/.test(t)) {
      return "Ask about eggs, the lineup, Nest Cam A, gifts, or which hen is causing drama. Short questions, sharp answers.";
    }

    // Honest quiet — never fake an on-air “noted” when Gemma/API missed.
    return pick([
      "Clucky's quiet — the chat station isn't answering. Try again in a bit; I don't invent an on-air take.",
      "Station's offline. I stay honest: no fake on-air notes when Gemma's out.",
      "Farm chat missed that one. Ping me again — I don't editorialize from a dead line.",
    ]);
  }

  function reply(speakerId, userText) {
    if (speakerId === "clucky") {
      return {
        speaker: CLUCKY.name,
        text: cluckyReply(userText),
        style: CLUCKY.chatStyle,
        source: "canned",
      };
    }
    const hen = getHen(speakerId);
    if (!hen) {
      return {
        speaker: "Clucky",
        text: cluckyReply(userText),
        style: CLUCKY.chatStyle,
        source: "canned",
      };
    }
    return {
      speaker: hen.name,
      text: topicReply(hen, userText),
      style: hen.chatStyle,
      source: "canned",
    };
  }

  function nestLineHint() {
    try {
      const pin = JSON.parse(localStorage.getItem("fy_clucky_pin_v1") || "null");
      return (pin && pin.line) || "";
    } catch (_) {
      return "";
    }
  }

  function isWeatherAsk(text) {
    return /\b(weather|cold|hot|rain|snow|wind|storm)\b/.test(normalize(text));
  }

  function isJokeAsk(text) {
    return /\b(jokes?|funny|puns?|laughs?|laughing|humor|hilarious)\b/.test(normalize(text));
  }

  /** Short GET — never block chat long. Empty string on any miss. */
  async function fetchWeatherLine() {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 1500) : null;
    try {
      const res = await fetch("/api/clucky/weather", {
        cache: "no-store",
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (!res.ok) return "";
      const data = await res.json();
      return data && data.line ? String(data.line) : "";
    } catch (_) {
      return "";
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * POST /api/clucky/chat — works on SolForge production (farm Ollama)
   * and local `npm run dev`. Hard timeout so UI stays snappy.
   */
  async function replyViaApi(speakerId, userText) {
    const egg =
      global.HenCam && typeof global.HenCam.getEggCount === "function"
        ? global.HenCam.getEggCount()
        : undefined;
    let weatherLine = "";
    if (isWeatherAsk(userText)) {
      weatherLine = await fetchWeatherLine();
    }
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
    try {
      const payload = {
        speakerId: speakerId || "clucky",
        text: userText,
        nestLine: nestLineHint(),
        eggCount: egg,
      };
      if (weatherLine) payload.weatherLine = weatherLine;
      const res = await fetch("/api/clucky/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.ok || !data.text) return null;
      return {
        speaker: data.speaker || "Clucky",
        text: data.text,
        style: CLUCKY.chatStyle,
        source: data.source || "ollama",
        model: data.model,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Prefer farm/local LLM, then optional bridge, then witty canned (instant).
   */
  async function replyAsync(speakerId, userText, bridge) {
    try {
      const llm = await replyViaApi(speakerId, userText);
      if (llm) return llm;
    } catch (_) {
      /* fall through */
    }
    if (bridge && typeof bridge.chat === "function") {
      try {
        const remote = await bridge.chat(speakerId, userText);
        if (remote && remote.text) return remote;
      } catch (_) {
        /* fall through */
      }
    }
    return reply(speakerId, userText);
  }

  global.HenVoice = { reply, replyAsync, CLUCKY, HENS };
})(typeof window !== "undefined" ? window : globalThis);
