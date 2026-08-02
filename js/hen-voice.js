/**
 * Flock Yeah — local personality chat (Clucky + per-hen)
 * Offline-friendly canned replies; optional bridge hook for a real LLM later.
 */
(function (global) {
  "use strict";

  const { HENS, CLUCKY, getHen } = global.FlockData;

  const FALLBACKS = {
    clucky: [
      "Cameras rolling. Ask about eggs, gifts, or which hen is causing drama.",
      "Farm desk tip: sponsors keep the mealworms flowing.",
      "Mom's rule still stands: keep flocks for the birds.",
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
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function topicReply(hen, text) {
    const t = normalize(text);
    if (!t) return pick(hen.catchphrases || FALLBACKS.default);

    if (/\b(egg|lay|nest)\b/.test(t)) {
      return hen.id === "henrietta"
        ? "Eggs are a schedule, not a suggestion. Check the counter."
        : "Egg talk! Watch the nest cams — we don't spoil the count on purpose.";
    }
    if (/\b(food|treat|mealworm|grain|snack)\b/.test(t)) {
      return hen.id === "pepper"
        ? "Gifts unlock snacks. Bribery works. I respect the system."
        : "Send a gift from the tray — we notice generosity.";
    }
    if (/\b(hawk|fox|danger|safe)\b/.test(t)) {
      return hen.id === "cluck"
        ? "Sky threats get the roundhouse stare. We're covered."
        : "Sky watch is serious. Clucky calls it if something circles.";
    }
    if (/\b(hello|hi|hey|howdy)\b/.test(t)) {
      return pick(hen.catchphrases || FALLBACKS.default);
    }
    if (/\b(mom|flock yeah|tagline)\b/.test(t)) {
      return 'Keep flocks for the birds. — Mom. We take that personally.';
    }
    if (/\b(name|who are you|about you)\b/.test(t)) {
      return "I'm " + hen.name + ". " + (hen.bio || "");
    }

    // Light keyword bounce into catchphrase + echo
    if (t.length < 40) {
      return pick(hen.catchphrases) + " (re: “" + text.trim().slice(0, 48) + "”)";
    }
    return pick(hen.catchphrases || FALLBACKS.default);
  }

  function cluckyReply(text) {
    const t = normalize(text);
    if (!t) return pick(CLUCKY.greetings);

    if (/\b(who|hen|flock|lineup)\b/.test(t)) {
      return (
        "Tonight's lineup: " +
        HENS.map((h) => h.name).join(", ") +
        ". Visit Who's Who for the jail lineup zoom."
      );
    }
    if (/\b(egg|count)\b/.test(t)) {
      const n = global.HenCam && global.HenCam.getEggCount ? global.HenCam.getEggCount() : "?";
      return "Egg counter reads " + n + ". Fresh math, questionable honesty from Pepper.";
    }
    if (/\b(shop|buy|gift|sponsor)\b/.test(t)) {
      return "Shop and gifts keep the coop glamorous. SolForge cuts the metal hens if you want steel.";
    }
    if (/\b(horse|herd)\b/.test(t)) {
      return "Horses live next door — open Herd for Lincoln, Grace, and the rest.";
    }
    if (/\b(mom|tagline|flock yeah)\b/.test(t)) {
      return 'Brand check: Flock Yeah — “Keep flocks for the birds.” — Mom. I just host.';
    }
    if (/\b(hello|hi|hey)\b/.test(t)) {
      return pick(CLUCKY.greetings);
    }
    return pick(FALLBACKS.clucky) + " You said: “" + text.trim().slice(0, 60) + "”";
  }

  /**
   * @param {string} speakerId hen id or "clucky"
   * @param {string} userText
   * @returns {{ speaker: string, text: string, style: string }}
   */
  function reply(speakerId, userText) {
    if (speakerId === "clucky") {
      return {
        speaker: CLUCKY.name,
        text: cluckyReply(userText),
        style: CLUCKY.chatStyle,
      };
    }
    const hen = getHen(speakerId);
    if (!hen) {
      return { speaker: "Clucky", text: pick(FALLBACKS.clucky), style: CLUCKY.chatStyle };
    }
    return {
      speaker: hen.name,
      text: topicReply(hen, userText),
      style: hen.chatStyle,
    };
  }

  /** Optional hook: replace with fetch to a farm LLM endpoint */
  async function replyAsync(speakerId, userText, bridge) {
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
