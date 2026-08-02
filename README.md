# Flock Yeah — Chicken Coop Commentary

Static multi-cam chicken site for **Lone Tree Acres LLC** (Longmont, CO).

> **Flock Yeah** — “Keep flocks for the birds.” — Mom  
> AI host: **Clucky** · Owner: **Jeff Lay** · [www.lonetreeacres.com](https://www.lonetreeacres.com)  
> Repo: [jlay843-prog/Chicken-Coop-Commentary](https://github.com/jlay843-prog/Chicken-Coop-Commentary)

**Thesis:** Birds, not plates. Zero ALPR. Maximum dirt baths.

## Quick start

```bash
cd Chicken-Coop-Commentary
python -m http.server 8080
# open http://localhost:8080/hens.html
```

Or open `index.html` / `hens.html` directly in a browser (no build step).

## Pages

| File | Purpose |
|------|---------|
| `hens.html` | Multi-cam, zone commentary, Clucky + per-hen chat, eggs, Farm desk, gifts, sponsor |
| `whos-who.html` | Hen jail lineup + lens zoom |
| `herd.html` | Horse lineup + lens (Lincoln, Grace, Winchester, Tia) |
| `shop.html` | Merch / apparel / eggs / plasma / sponsor |
| `ops.html` | Ops checklist, camera notes, resets |
| `checkout-success.html` | Post-checkout thank-you |

## Flock

Henrietta · Scratch · Cluck Norris · Daisy · Pepper · Maple

## Brand colors

| Token | Hex |
|-------|-----|
| Emerald | `#047857` |
| Cream | `#f7f4ef` |
| Gold | `#d97706` |
| Charcoal | `#1a1816` |

## Cameras (recommended)

- Coop / nests: **Reolink PoE**
- Outdoor run: **Reolink Argus** (solar/wireless)

Photos stub the feeds today; drop HLS/embeds into the stage when ready. Face ID not required for v1 — use flock/zone events.

## Shop / margin

Target ~25% margin (`price ≈ cost / 0.75`). Configure Stripe publishable key + Payment Links in `js/stripe-config.js`. Plasma/metal via SolForge (`js/solforge-bridge.js`).

## Designs

- `designs/plasma/` — hen silhouettes for plasma cut
- `designs/print/logos/` — wordmark + badge

## QC

```powershell
powershell -File scripts/qc-check.ps1
```

## Deploy (Cloudflare / lonetreeacres.com)

1. Connect this GitHub repo to Cloudflare Pages (framework: none, build command empty, output `/`).
2. Attach custom hostname (e.g. `flock.lonetreeacres.com`) in the Lonetreeacres Cloudflare zone.
3. Add a nav link from the main marketing site when ready.
4. Keep secrets off this static origin — see `SECURITY.md`.

## Docs

- [CHAT-HANDOFF.md](CHAT-HANDOFF.md) — full product handoff
- [TRANSFER.md](TRANSFER.md) — repo transfer notes
- [SECURITY.md](SECURITY.md) — static-site threat model
