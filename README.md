# Flock Yeah — Lone Tree Acres chicken cam

Static multi-cam chicken site for **Lone Tree Acres** (Longmont, CO).

> **Flock Yeah** — “Keep flocks for the birds.” — Mom  
> AI host: **Clucky** · Owner: **Jeff Lay** · [lonetreeacres.com](https://lonetreeacres.com)

## Quick start

Open `index.html` (redirects to `hens.html`) or any page in a modern browser. No build step.

## Pages

| File | Purpose |
|------|---------|
| `hens.html` | Multi-cam grid, Clucky + per-hen chat, egg counter, Farm desk, gifts, sponsor |
| `whos-who.html` | Jail lineup mugshots + lens zoom |
| `herd.html` | Horse herd neighbors |
| `shop.html` | Merch / eggs / plasma / sponsor SKUs |
| `ops.html` | Ops checklist + local resets |
| `checkout-success.html` | Post-checkout thank-you |

## Scripts & styles

- `css/hens.css` — brand UI
- `js/flock-data.js` — hens, horses, gifts, shop SKUs
- `js/hen-voice.js` — Clucky + hen personalities (local)
- `js/hen-cam.js` — cams, counter, desk, gifts, sponsor, chat
- `js/lineup.js` — who's-who lens
- `js/shop.js` — catalog + Stripe/SolForge handoff
- `js/stripe-config.js` — **publishable** key + Payment Links only
- `js/solforge-bridge.js` — links to `solforge.lonetreeacres.com`

## Hens

Henrietta · Scratch · Cluck Norris · Daisy · Pepper · Maple

## Plasma / print

SVG silhouettes in `print/` for SolForge plasma cuts (`*-plasma.svg`, `flock-yeah-mark.svg`).

## Configure payments

1. Set `publishableKey` in `js/stripe-config.js` (pk_test / pk_live).
2. Paste Stripe Payment Link URLs into `paymentLinks` by SKU id.
3. Keep secret keys on a server (SolForge / Farm desk) — never in this repo.

## Deploy

Any static host (Netlify Drop, Cloudflare Pages, IONOS, nginx). Point a path or subdomain (e.g. `flock.lonetreeacres.com`) at this folder.

## Docs

- [SECURITY.md](SECURITY.md) — threat model for a static cam shop
- [CHAT-HANDOFF.md](CHAT-HANDOFF.md) — next-agent notes
