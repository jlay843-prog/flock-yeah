/**
 * Local Ollama chat for Clucky + per-hen personalities.
 * Used by POST /api/clucky/chat on the dev server.
 */
import fs from "node:fs";
import path from "node:path";
import { loadAiConfig } from "./clucky-vision.mjs";

const HEN_FALLBACK = {
  henrietta: {
    name: "Henrietta",
    style:
      "You are Henrietta, matriarch hen. Dry, bossy, schedule-obsessed. Short answers.",
  },
  scratch: {
    name: "Scratch",
    style: "You are Scratch, dig-site hen. Curious, chaotic, dirt under every nail. Short answers.",
  },
  cluck: {
    name: "Cluck Norris",
    style: "You are Cluck Norris. Tough, perimeter stares, PG martial-arts one-liners. Short answers.",
  },
  daisy: {
    name: "Daisy",
    style: "You are Daisy. Sweet, dust-bath reviews, five-star dirt energy. Short answers.",
  },
  pepper: {
    name: "Pepper",
    style: "You are Pepper. Spicy, snack-bribery realist. Short answers.",
  },
  maple: {
    name: "Maple",
    style: "You are Maple. Calm treat diplomat. Short answers.",
  },
};

function loadFlockPromptBits(root) {
  // Optional: pull richer styles from flock-data.js via naive parse — keep fallbacks.
  const p = path.join(root, "js", "flock-data.js");
  if (!fs.existsSync(p)) return { hens: HEN_FALLBACK, cluckyStyle: null };
  const raw = fs.readFileSync(p, "utf8");
  const cluckyMatch = raw.match(/chatStyle:\s*\n?\s*"([^"]+)"/);
  // First chatStyle after CLUCKY block is fragile; use fixed Clucky style below if missing
  return {
    hens: HEN_FALLBACK,
    cluckyStyle: cluckyMatch ? cluckyMatch[1] : null,
  };
}

async function ollamaChat(cfg, { system, user, model }) {
  const res = await fetch(`${cfg.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || cfg.chatModel || cfg.voiceModel,
      stream: false,
      options: { temperature: 0.8, num_predict: 120 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama chat ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return String(data.message?.content || "").trim();
}

function cleanReply(text) {
  let t = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  t = t
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)[0] || t;
  t = t.replace(/^["'`]+|["'`]+$/g, "");
  const words = t.split(/\s+/);
  if (words.length > 55) t = words.slice(0, 55).join(" ") + "…";
  return t;
}

export function createCluckyChat(root) {
  const bits = loadFlockPromptBits(root);

  async function chat({ speakerId, text, nestLine, eggCount }) {
    const cfg = loadAiConfig(root);
    const model = cfg.chatModel || cfg.voiceModel || "qwen2.5:7b";
    const sid = speakerId || "clucky";
    const userText = String(text || "").trim();
    if (!userText) {
      return { ok: false, error: "empty message" };
    }

    let speaker = "Clucky";
    let persona =
      bits.cluckyStyle ||
      "You are Clucky, witty self-moderating AI host of Flock Yeah at Lone Tree Acres. Fun, clear, farm-smart. Credit Mom when relevant: Keep flocks for the birds.";

    if (sid !== "clucky" && HEN_FALLBACK[sid]) {
      speaker = HEN_FALLBACK[sid].name;
      persona = HEN_FALLBACK[sid].style;
    }

    const system = [
      persona,
      "Reply in 1–3 short sentences. Funny, pithy, lightly sarcastic, PG.",
      "Never discuss license plates or ALPR tech as a product — birds not plates.",
      "If asked what the cam sees, use the Nest Cam A note when provided; otherwise say you're waiting on a still.",
      "Do not invent payment or open gates. Suggest gifts/sponsor only if it fits naturally.",
      nestLine ? "Latest Nest Cam A line: " + nestLine : "No fresh Nest Cam A line yet.",
      eggCount != null ? "Egg counter: " + eggCount : "",
    ]
      .filter(Boolean)
      .join(" ");

    const reply = cleanReply(
      await ollamaChat(cfg, { system, user: userText, model })
    );
    if (!reply) {
      return { ok: false, error: "empty model reply", speaker };
    }
    return { ok: true, speaker, text: reply, model, source: "ollama" };
  }

  return { chat };
}
