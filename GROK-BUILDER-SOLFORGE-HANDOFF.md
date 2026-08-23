# Grok Builder → SolForge + Flock Yeah production handoff

> **Audience:** Grok Builder / deploy agent on the SolForge webhost (K12).  
> **Owner:** Jeff Lay · Lone Tree Acres  
> **Goal:** Sync production SolForge with the Flock Yeah work started on the Legion laptop, wire **PayPal + Venmo** (already on SolForge — **not Stripe**), and keep treat inventory / merch deep-links working.

**Do not introduce Stripe.** Jeff does not use Stripe for this stack. SolForge production already has PayPal + Venmo.

---

## 1. Repos and roles

| Repo | GitHub | Role |
|------|--------|------|
| **Flock Yeah** (cams / Clucky / gifts UI) | https://github.com/jlay843-prog/flock-yeah | Static site + local `npm run dev` proxy (cam snap, Clucky, go2rtc MP4, SolForge consume proxy) |
| **SolForge** (ERP / fab / payments) | https://github.com/jlay843-prog/Fabrication-Agent | Production at https://solforge.lonetreeacres.com |
| Mirror (optional) | https://github.com/jlay843-prog/Chicken-Coop-Commentary | Earlier handoff mirror — prefer **flock-yeah** as active |

### Local Legion tips (as of 2026-08-02)

| Item | Value |
|------|--------|
| Flock Yeah branch | `dev` @ `6ef358d` (pushed to `origin/dev`) |
| SolForge local `main` | `2213fd7` **ahead of `origin/main` by 1** (treat ERP) — **not pushed / not confirmed deployed** |
| SolForge `origin/main` tip (known) | `50a809d` — Flock `/start` deep-link IntakeForm prefill |
| Production URL | https://solforge.lonetreeacres.com |
| Nest Cam A | `192.168.68.118` (DHCP reserved), Fluent 640p / 10fps / 256kbps H.264 sub-stream |

**Sync risk:** Production may have been deployed by Grok Builder from an older or different tree than the Legion. Always `git fetch` + compare SHAs before deploying.

---

## 2. What each system does today

### Flock Yeah (`flock-yeah`)

- Live Nest Cam A: stills via `/cam/snap`, smooth video via `/cam/live.mp4` → local go2rtc → Reolink RTSP sub-stream.
- Clucky: activity vision (moondream) + chat (Ollama `qwen2.5:7b`) on the Legion only (`npm run dev`).
- Gifts / sponsor UI: demo checkout + optional Stripe stubs (**ignore Stripe**).
- Treat hook: queues Pi dispense (future) + can `POST /api/solforge/flock-consume` (local proxy → SolForge).
- Merch: SolForge deep-links for plasma / 3D print SKUs.

### SolForge production (webhost)

- Customer fab intake `/start`, orders, PayPal + Venmo checkout, jobs, ERP-lite inventory.
- Env (production): `PAYPAL_ME_USERNAME`, `VENMO_USERNAME`, and/or `PAYPAL_CLIENT_ID` + secrets — **already wired**.
- Flock deep-link prefill: commit `50a809d` (should be on origin).

### Not done / not on production yet (Legion-only commit `2213fd7`)

- `POST /api/farm/flock-consume` — decrement treat SKUs, `syncAutoReorders()`.
- Materials: `TREAT-MEALWORMS-1LB`, `TREAT-SCRATCH-25LB`.
- Docs note: `reorder-buyer` emails **PO drafts** only — no Amazon auto-buy.

---

## 3. Tie-in map (what to connect)

```text
┌─────────────────────────────┐         deep-link (no secrets)
│  Flock Yeah (static / CDN)  │ ──────────────────────────────► SolForge /start
│  hens.html · shop.html      │                                 (plasma / 3D print)
└─────────────┬───────────────┘
              │
              │ gifts / sponsor (TO BUILD)
              │ PayPal.me + Venmo URLs
              │ amounts from flock-data GIFTS
              ▼
┌─────────────────────────────┐
│  SolForge payment rails     │  PAYPAL_ME_USERNAME · VENMO_USERNAME
│  (same as /track checkout)  │  optional PayPal REST /api/payments/paypal/create
└─────────────┬───────────────┘
              │
              │ after paid gift (TO BUILD)
              │ Bearer FLOCK_FARM_SECRET
              ▼
┌─────────────────────────────┐
│  POST /api/farm/flock-consume│  (deploy commit 2213fd7+)
│  → inventory −qty            │
│  → syncAutoReorders()        │
│  → reorder-buyer PO drafts   │
└─────────────────────────────┘

Legion-only (not production CDN):
  npm run dev · go2rtc · Ollama · cam-secrets.json · solforge-secrets.json
```

---

## 4. Deploy checklist for Grok Builder (SolForge webhost)

### A. Sync git first

On the webhost SolForge checkout (often `/opt/solforge` or the docker compose project):

```bash
cd /path/to/Fabrication-Agent   # or /opt/solforge
git fetch origin
git log -1 --oneline
git log origin/main -1 --oneline
```

**Then either:**

1. **Pull Legion treat commit onto GitHub, then deploy**  
   - On Legion: push `2213fd7` to `origin/main` (Jeff must approve push to main), **or** open a PR from that commit.  
   - On webhost: `git pull origin main` → build/restart.

2. **Or** cherry-pick / apply only these paths from `2213fd7` if production has divergent Grok Builder commits:

   - `src/lib/flock-treats.ts`
   - `src/app/api/farm/flock-consume/route.ts`
   - `prisma/seed.ts` (treat materials + farm vendors only — review diff)
   - `docs/AGENTS.md` (reorder-buyer clarification)
   - `.env.example` line: `FLOCK_FARM_SECRET=`

**Do not blindly reset production** if Grok Builder has newer unmerged work — merge or cherry-pick.

### B. Env on production SolForge

Ensure these exist (values already used for fab checkout — reuse):

```bash
# Existing (keep)
PAYPAL_ME_USERNAME=...          # paypal.me handle without @
VENMO_USERNAME=...              # venmo handle without @
# Optional richer PayPal Checkout API:
# PAYPAL_CLIENT_ID=...
# PAYPAL_CLIENT_SECRET=...

# New for Flock treat inventory
FLOCK_FARM_SECRET=<long random>   # or reuse CRON_SECRET
CRON_SECRET=...                   # workers / fallback auth for flock-consume
```

Expose to Flock Legion box via gitignored `flock-yeah/solforge-secrets.json`:

```json
{
  "baseUrl": "https://solforge.lonetreeacres.com",
  "farmSecret": "<same as FLOCK_FARM_SECRET or CRON_SECRET>"
}
```

### C. Ensure treat SKUs on live DB

After deploy (no full re-seed required):

```bash
curl -sS -H "Authorization: Bearer $FLOCK_FARM_SECRET" \
  https://solforge.lonetreeacres.com/api/farm/flock-consume
```

Expect JSON listing `TREAT-MEALWORMS-1LB` and `TREAT-SCRATCH-25LB`.

Smoke consume (demo):

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $FLOCK_FARM_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"giftId":"mealworms","henId":"henrietta","demo":true}' \
  https://solforge.lonetreeacres.com/api/farm/flock-consume
```

### D. Restart app / workers

Follow existing SolForge deploy (docker compose / pm2 / systemd). Confirm:

- https://solforge.lonetreeacres.com/start → 200  
- Cron still runs `reorder-buyer` + `comms-dispatcher` with `CRON_SECRET`

---

## 5. Financial hooks to implement (Flock → PayPal/Venmo)

**Replace** Flock’s Stripe / demo-only gift path with SolForge-style links.

### Gift price table (from `js/flock-data.js`)

| giftId | Name | priceCents | Automates inventory? |
|--------|------|------------|----------------------|
| `mealworms` | Mealworm Drop | 300 | Yes → `TREAT-MEALWORMS-1LB` (−0.05 lb) |
| `scratch-grain` | Scratch Grain | 500 | Yes → `TREAT-SCRATCH-25LB` (−0.25 lb) |
| `nest-box` | Nest Box Fluff | 800 | No |
| `dust-bath` | Dust Bath Spa | 1000 | No |
| `hawk-watch` | Hawk Watch Hour | 1500 | No |
| `sponsor-day` | Sponsor coop 1 day | 2500 | No (shop SKU) |

### URL patterns (same as SolForge `src/lib/payments.ts`)

```text
PayPal.me:
  https://www.paypal.com/paypalme/{PAYPAL_ME_USERNAME}/{dollars}USD

Venmo:
  https://venmo.com/{VENMO_USERNAME}?txn=pay&amount={dollars}&note={urlencoded note}
```

Suggested note: `FlockYeah {giftId} hen={henId}` or a short public id.

### Recommended Flock UX

1. User clicks gift → modal/chooser: **PayPal** | **Venmo**.  
2. Open payment URL in new tab with correct dollar amount.  
3. On return / “I’ve paid” (or `checkout-success.html?item=…&demo=0&method=paypal`):  
   - Announce in Clucky chat (existing pending-announce flow).  
   - If `mealworms` / `scratch-grain`: call SolForge `flock-consume` via Legion proxy or a tiny Cloudflare Worker with `FLOCK_FARM_SECRET` (never put the secret in static CDN JS).  
4. Sponsor: same pattern at $25.00 → name on board 24h (already in Flock localStorage logic).

### Optional stronger path (SolForge-native order)

Create a lightweight SolForge SKU/order for “Flock gift” so PayPal webhook reconciles like fab orders — more work, better ledger. v1 can be PayPal.me/Venmo links + manual/ops confirmation.

### Config on Flock (no Stripe)

Add gitignored `js/pay-config.local.js` (or extend `engage-config.js` locally):

```js
window.PayConfig = {
  paypalMe: "YOUR_PAYPAL_ME",   // same as SolForge PAYPAL_ME_USERNAME
  venmoUser: "YOUR_VENMO",      // same as SolForge VENMO_USERNAME
};
```

Grok Builder should **copy usernames from SolForge production `.env`** — do not invent new payment accounts.

---

## 6. Merch / fab deep-links (already designed)

Flock shop SKUs open:

```text
https://solforge.lonetreeacres.com/start
  ?from=flock-yeah
  &process=plasma|print_future
  &title=…
  &sku=…
  &designUrl=…
  …
```

Customer pays on SolForge with **existing PayPal/Venmo**. No change needed if `50a809d` IntakeForm prefill is live.

Verify: open a Flock “plasma” / “3D print” shop item → `/start` fields prefilled → checkout shows PayPal + Venmo.

---

## 7. What stays on the Legion (not Grok Builder CDN)

These are **LAN day-test** pieces; production static Flock hosting will not run them unless you add a farm edge proxy later:

| Piece | Path / command |
|-------|----------------|
| Dev server + proxies | `npm run dev` → `scripts/dev-server.mjs` |
| Camera secrets | `cam-secrets.json` (gitignored) |
| go2rtc | `scripts/start-go2rtc.ps1` · `tools/go2rtc/` |
| Clucky vision/chat | Ollama + `/api/clucky/*` |
| SolForge consume proxy | `/api/solforge/flock-consume` + `solforge-secrets.json` |

Public Flock on Cloudflare/pages can keep deep-links + PayPal/Venmo gift URLs; cam AI stays on-LAN until an edge proxy exists.

---

## 8. Acceptance tests (Grok Builder)

- [ ] `git rev-parse HEAD` on webhost matches intended GitHub SHA (includes flock-consume if treating ERP is in scope).  
- [ ] `GET /api/farm/flock-consume` with Bearer secret → 200 + treat SKUs.  
- [ ] `POST` mealworms demo consume → `ok: true`, onHand decreases.  
- [ ] SolForge `/track` or checkout still shows PayPal + Venmo.  
- [ ] Flock shop plasma SKU → `/start?from=flock-yeah` prefills.  
- [ ] Flock gift opens PayPal.me / Venmo with correct **$3.00** / **$5.00** (etc.).  
- [ ] No Stripe keys required anywhere in the path.  
- [ ] `reorder-buyer` still cronable; low treat stock creates PO draft email (not auto-buy).

---

## 9. Explicit non-goals (this pass)

- Stripe Payment Links  
- Pi Zero physical dispenser (hook exists in Flock; hardware later)  
- Amazon/Chewy auto-purchase agents  
- Face ID / per-hen recognition  

---

## 10. Quick file index

### Flock Yeah

| File | Why |
|------|-----|
| `SOLFORGE-HOOK.md` | Deep-links + treat consume flow |
| `js/solforge-bridge.js` | `/start` URL builder |
| `js/treat-hook.js` | Pi queue + SolForge ERP notify |
| `js/stripe-config.js` | **Legacy stubs — do not expand; use PayPal/Venmo instead** |
| `solforge-secrets.example.json` | Legion → SolForge consume auth |
| `scripts/dev-server.mjs` | `/cam/snap`, `/cam/live.mp4`, `/api/solforge/flock-consume`, Clucky APIs |

### SolForge (Fabrication-Agent)

| File | Why |
|------|-----|
| `src/lib/payments.ts` | PayPal.me / Venmo URL builders (source of truth) |
| `src/components/PaymentPanel.tsx` | Production checkout UI |
| `src/lib/flock-treats.ts` | Treat SKUs + consume (local commit `2213fd7`) |
| `src/app/api/farm/flock-consume/route.ts` | Authenticated consume API |
| `prisma/seed.ts` | Seed rows for treat materials |

---

## 11. Message to paste into Grok Builder

```text
Deploy SolForge from Fabrication-Agent with Flock Yeah tie-ins.

1) Sync git: production may diverge from Legion. Legion has local commit 2213fd7
   (flock-consume + TREAT-* SKUs) NOT on origin/main yet. origin/main has 50a809d
   (Flock /start prefill). Merge/cherry-pick carefully — do not wipe newer Grok Builder work.

2) Keep PayPal + Venmo (PAYPAL_ME_USERNAME, VENMO_USERNAME). Do NOT add Stripe.

3) After flock-consume is live: set FLOCK_FARM_SECRET (or reuse CRON_SECRET); ensure
   treat SKUs via GET /api/farm/flock-consume with Bearer token.

4) Implement Flock gift/sponsor checkout using same PayPal.me + Venmo URL patterns as
   src/lib/payments.ts, amounts from flock-yeah js/flock-data.js GIFTS. On paid
   mealworms/scratch-grain, call POST /api/farm/flock-consume (secret only on server/proxy).

5) Verify shop deep-links to /start?from=flock-yeah still prefill and pay via SolForge.

Full detail: flock-yeah/GROK-BUILDER-SOLFORGE-HANDOFF.md
```

---

*Generated for Lone Tree Acres Flock Yeah ↔ SolForge sync · 2026-08-02*
