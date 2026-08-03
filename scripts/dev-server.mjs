/**
 * Flock Yeah local preview + Reolink Snap proxy + Clucky vision ticks.
 * Serves the static site, GET /cam/snap, GET /api/clucky/tick|status.
 *
 *   node scripts/dev-server.mjs
 *   npm run dev
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCluckyWatcher, loadAiConfig } from "./clucky-vision.mjs";
import { createCluckyChat } from "./clucky-chat.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.FLOCK_DEV_PORT || 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
};

let token = null;
let tokenAt = 0;
let lockUntil = 0;
const TOKEN_TTL_MS = 45 * 60 * 1000;

function loadSecrets() {
  const p = path.join(root, "cam-secrets.json");
  if (!fs.existsSync(p)) return null;
  // PowerShell Set-Content -Encoding utf8 may write a BOM
  const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "").trim();
  return JSON.parse(raw);
}

async function reolinkLogin(secrets) {
  const body = JSON.stringify([
    {
      cmd: "Login",
      param: {
        User: {
          userName: secrets.user || "admin",
          password: secrets.password,
        },
      },
    },
  ]);
  const res = await fetch(`http://${secrets.host}/cgi-bin/api.cgi?cmd=Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.code !== 0) {
    const detail = row?.error?.detail || "login failed";
    const err = new Error(detail);
    err.locked = /locked/i.test(detail);
    err.remain = row?.error?.auth_warning_info?.remain_times;
    throw err;
  }
  const name = row.value?.Token?.name;
  if (!name) throw new Error("Login OK but no token");
  return name;
}

async function fetchSnap(secrets) {
  const now = Date.now();
  if (now < lockUntil) {
    const err = new Error("Login locked — wait before retrying");
    err.locked = true;
    throw err;
  }
  if (!token || now - tokenAt > TOKEN_TTL_MS) {
    token = await reolinkLogin(secrets);
    tokenAt = now;
  }
  const snapUrl = (tok) =>
    `http://${secrets.host}/cgi-bin/api.cgi?cmd=Snap&channel=${
      secrets.channel ?? 0
    }&rs=flockyeah&token=${encodeURIComponent(tok)}`;

  let res = await fetch(snapUrl(token));
  let ct = res.headers.get("content-type") || "";
  if (!ct.includes("image")) {
    token = await reolinkLogin(secrets);
    tokenAt = Date.now();
    res = await fetch(snapUrl(token));
    ct = res.headers.get("content-type") || "";
  }
  if (!ct.includes("image")) {
    const text = await res.text();
    if (/locked/i.test(text)) {
      lockUntil = Date.now() + 15 * 60 * 1000;
      token = null;
    }
    throw new Error("Snap did not return an image");
  }
  return Buffer.from(await res.arrayBuffer());
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safeJoin(base, reqPath) {
  const decoded = decodeURIComponent((reqPath || "/").split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(base, cleaned);
  if (!full.startsWith(base)) return null;
  return full;
}

async function handleCamSnap(res) {
  const secrets = loadSecrets();
  if (!secrets?.host || !secrets?.password) {
    return send(
      res,
      503,
      "Missing cam-secrets.json — run scripts/link-cam.ps1 first.",
      { "Content-Type": "text/plain; charset=utf-8" }
    );
  }
  try {
    const jpg = await fetchSnap(secrets);
    return send(res, 200, jpg, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
    });
  } catch (e) {
    if (e.locked) {
      lockUntil = Math.max(lockUntil, Date.now() + 10 * 60 * 1000);
      token = null;
      return send(res, 503, "Camera login locked. Wait, then retry.", {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "600",
      });
    }
    console.error("[cam/snap]", e.message);
    return send(res, 502, "Snap proxy error: " + e.message, {
      "Content-Type": "text/plain; charset=utf-8",
    });
  }
}

function handleStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/hens.html";
  const filePath = safeJoin(root, urlPath);
  if (!filePath) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      return send(res, 404, "Not found", {
        "Content-Type": "text/plain; charset=utf-8",
      });
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function loadSolforgeSecrets() {
  const p = path.join(root, "solforge-secrets.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "").trim());
  } catch {
    return null;
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

/** Proxy gift consume → SolForge ERP-lite (secrets stay on disk). */
async function handleSolforgeFlockConsume(req, res) {
  const secrets = loadSolforgeSecrets();
  if (!secrets?.baseUrl || !secrets?.farmSecret) {
    return sendJson(res, 503, {
      ok: false,
      error:
        "Missing solforge-secrets.json — copy solforge-secrets.example.json and set baseUrl + farmSecret (FLOCK_FARM_SECRET or CRON_SECRET on SolForge).",
    });
  }
  const body = await readJsonBody(req);
  const url = String(secrets.baseUrl).replace(/\/$/, "") + "/api/farm/flock-consume";
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + secrets.farmSecret,
      },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text.slice(0, 300) };
    }
    return sendJson(res, upstream.status, data);
  } catch (e) {
    return sendJson(res, 502, {
      ok: false,
      error: e.message || "SolForge proxy failed",
    });
  }
}

const clucky = createCluckyWatcher(root, async () => {
  const secrets = loadSecrets();
  if (!secrets?.host || !secrets?.password) {
    throw new Error("Missing cam-secrets.json — run scripts/link-cam.ps1 first.");
  }
  return fetchSnap(secrets);
});
const cluckyChat = createCluckyChat(root);

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  const u = new URL(req.url || "/", "http://127.0.0.1");

  if (req.method === "GET" && (urlPath === "/cam/snap" || urlPath === "/cam/snap.jpg")) {
    return handleCamSnap(res);
  }
  if (req.method === "GET" && urlPath === "/api/clucky/status") {
    const ai = loadAiConfig(root);
    return sendJson(res, 200, {
      ...clucky.status(),
      chatModel: ai.chatModel || ai.voiceModel,
    });
  }
  if (req.method === "GET" && urlPath === "/api/clucky/tick") {
    const force = u.searchParams.get("force") === "1";
    const result = await clucky.tick({ force });
    return sendJson(res, result.ok ? 200 : 502, result);
  }
  if (req.method === "POST" && urlPath === "/api/clucky/chat") {
    const body = await readJsonBody(req);
    try {
      const st = clucky.status();
      const result = await cluckyChat.chat({
        speakerId: body.speakerId || "clucky",
        text: body.text || body.message || "",
        nestLine: body.nestLine || st.lastLine || "",
        eggCount: body.eggCount,
      });
      return sendJson(res, result.ok ? 200 : 502, result);
    } catch (e) {
      return sendJson(res, 502, { ok: false, error: e.message || "chat failed" });
    }
  }
  if (req.method === "POST" && urlPath === "/api/solforge/flock-consume") {
    return handleSolforgeFlockConsume(req, res);
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method not allowed");
  }
  return handleStatic(req, res);
});

server.listen(port, "127.0.0.1", () => {
  const secrets = loadSecrets();
  const ai = loadAiConfig(root);
  console.log("");
  console.log("Flock Yeah DEV");
  console.log("  Root: " + root);
  console.log("  URL:  http://localhost:" + port + "/hens.html");
  console.log(
    "  Cam:  " +
      (secrets?.host
        ? "http://localhost:" + port + "/cam/snap → " + secrets.host
        : "no cam-secrets.json (run link-cam.ps1)")
  );
  console.log(
    "  Clucky: /api/clucky/tick · " +
      ai.visionModel +
      " → " +
      ai.voiceModel +
      " · chat " +
      (ai.chatModel || ai.voiceModel) +
      " @ " +
      ai.ollamaUrl
  );
  console.log("  Ctrl+C to stop.");
  console.log("");
});
