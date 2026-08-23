/**
 * Nest Cam A activity + local Ollama vision → brief Clucky lines.
 * Used by scripts/dev-server.mjs — keys stay on the server.
 */
import fs from "node:fs";
import path from "node:path";
import jpeg from "jpeg-js";

const DEFAULTS = {
  ollamaUrl: "http://127.0.0.1:11434",
  visionModel: "moondream",
  voiceModel: "qwen2.5:7b",
  /** Chat can use a bigger model if you want — defaults to voiceModel */
  chatModel: "qwen2.5:7b",
  activityThreshold: 10,
  minGapMs: 90_000,
  heartbeatMs: 30 * 60_000,
  sampleW: 80,
  sampleH: 45,
};

export function loadAiConfig(root) {
  const p = path.join(root, "ai-secrets.json");
  let file = {};
  if (fs.existsSync(p)) {
    file = JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "").trim());
  }
  return {
    ...DEFAULTS,
    ...file,
    ollamaUrl: (file.ollamaUrl || process.env.FLOCK_OLLAMA_URL || DEFAULTS.ollamaUrl).replace(
      /\/$/,
      ""
    ),
    visionModel: file.visionModel || process.env.FLOCK_VISION_MODEL || DEFAULTS.visionModel,
    voiceModel: file.voiceModel || process.env.FLOCK_VOICE_MODEL || DEFAULTS.voiceModel,
    chatModel:
      file.chatModel ||
      process.env.FLOCK_CHAT_MODEL ||
      file.voiceModel ||
      DEFAULTS.chatModel,
  };
}

function sampleGray(jpegBuf, tw, th) {
  const img = jpeg.decode(jpegBuf, { useTArray: true });
  const { width, height, data } = img;
  const out = new Float32Array(tw * th);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const sx = Math.min(width - 1, Math.floor((x + 0.5) * (width / tw)));
      const sy = Math.min(height - 1, Math.floor((y + 0.5) * (height / th)));
      const i = (sy * width + sx) * 4;
      out[y * tw + x] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
  }
  return out;
}

function activityScore(a, b) {
  if (!a || !b || a.length !== b.length) return 999;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

async function ollamaGenerate(cfg, { model, prompt, images }) {
  const body = { model, prompt, stream: false };
  if (images) body.images = images;
  const res = await fetch(`${cfg.ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return String(data.response || "").trim();
}

function cleanLine(text) {
  let t = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  // Drop model thinking / multi-line spill
  t = t.split("\n").map((s) => s.trim()).filter(Boolean)[0] || t;
  t = t.replace(/^["'`]+|["'`]+$/g, "").trim();
  if (!/^Nest Cam A:/i.test(t)) t = "Nest Cam A: " + t.replace(/^Nest Cam A\s*/i, "");
  t = t.replace(/^(Nest Cam A:\s*)["'`]+/i, "$1");
  const words = t.split(/\s+/);
  if (words.length > 32) t = words.slice(0, 32).join(" ") + "…";
  return t;
}

async function captionScene(cfg, jpegBuf) {
  const b64 = jpegBuf.toString("base64");
  const prompt =
    "Describe this security camera still in one plain factual sentence. " +
    "Name the main objects and setting. No jokes.";
  return ollamaGenerate(cfg, {
    model: cfg.visionModel,
    prompt,
    images: [b64],
  });
}

async function cluckyVoice(cfg, caption) {
  const prompt =
    "You are Clucky, witty PG AI host of Flock Yeah at Lone Tree Acres. " +
    "Rewrite the scene notes into ONE brief on-air line people can read fast. " +
    "Max 28 words. Funny, pithy, lightly sarcastic. Start with exactly: Nest Cam A: " +
    "Never mention license plates or ALPR. Mom's rule if it fits: keep flocks for the birds.\n\n" +
    "Scene notes: " +
    caption +
    "\n\nLine:";
  const raw = await ollamaGenerate(cfg, { model: cfg.voiceModel, prompt });
  return cleanLine(raw);
}

function appendLog(root, row) {
  const dir = path.join(root, "logs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(
    path.join(dir, "clucky-day.jsonl"),
    JSON.stringify(row) + "\n",
    "utf8"
  );
}

export function createCluckyWatcher(root, fetchSnapBytes) {
  const state = {
    prevSample: null,
    lastCommentAt: 0,
    lastScore: 0,
    lastLine: "",
    comments: 0,
    ticks: 0,
    busy: false,
    lastError: "",
  };

  async function tick(opts = {}) {
    const force = Boolean(opts.force);
    const cfg = loadAiConfig(root);
    state.ticks += 1;

    if (state.busy) {
      return { ok: true, skipped: "busy", score: state.lastScore, comments: state.comments };
    }
    state.busy = true;
    const started = Date.now();
    try {
      const jpegBuf = await fetchSnapBytes();
      const sample = sampleGray(jpegBuf, cfg.sampleW, cfg.sampleH);
      const score = state.prevSample
        ? activityScore(state.prevSample, sample)
        : 999;
      state.prevSample = sample;
      state.lastScore = Math.round(score * 10) / 10;

      const now = Date.now();
      const gapOk = now - state.lastCommentAt >= cfg.minGapMs;
      const heartbeat =
        state.lastCommentAt > 0 && now - state.lastCommentAt >= cfg.heartbeatMs;
      const active = score >= cfg.activityThreshold;
      const first = state.comments === 0;

      if (!force && !first && !gapOk) {
        return {
          ok: true,
          skipped: "cooldown",
          score: state.lastScore,
          active,
          comments: state.comments,
          lastLine: state.lastLine,
        };
      }
      if (!force && !first && !active && !heartbeat) {
        return {
          ok: true,
          skipped: "quiet",
          score: state.lastScore,
          active: false,
          comments: state.comments,
          lastLine: state.lastLine,
        };
      }

      const reason = force ? "force" : first ? "startup" : active ? "activity" : "heartbeat";
      const caption = await captionScene(cfg, jpegBuf);
      const line = await cluckyVoice(cfg, caption || "busy farm scene");
      state.lastCommentAt = Date.now();
      state.lastLine = line;
      state.comments += 1;
      state.lastError = "";

      const row = {
        t: new Date().toISOString(),
        reason,
        score: state.lastScore,
        caption,
        line,
        ms: Date.now() - started,
      };
      appendLog(root, row);
      console.log(`[clucky] ${reason} score=${row.score} → ${line}`);

      return {
        ok: true,
        line,
        caption,
        reason,
        score: state.lastScore,
        comments: state.comments,
        ms: row.ms,
      };
    } catch (e) {
      state.lastError = e.message || String(e);
      console.error("[clucky]", state.lastError);
      appendLog(root, {
        t: new Date().toISOString(),
        error: state.lastError,
      });
      return {
        ok: false,
        error: state.lastError,
        score: state.lastScore,
        comments: state.comments,
      };
    } finally {
      state.busy = false;
    }
  }

  function status() {
    const cfg = loadAiConfig(root);
    return {
      ok: true,
      provider: "ollama",
      visionModel: cfg.visionModel,
      voiceModel: cfg.voiceModel,
      ollamaUrl: cfg.ollamaUrl,
      activityThreshold: cfg.activityThreshold,
      minGapMs: cfg.minGapMs,
      heartbeatMs: cfg.heartbeatMs,
      ticks: state.ticks,
      comments: state.comments,
      lastScore: state.lastScore,
      lastLine: state.lastLine,
      lastError: state.lastError,
      busy: state.busy,
    };
  }

  return { tick, status };
}
