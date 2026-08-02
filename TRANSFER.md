# Transfer notes — Flock Yeah → Chicken-Coop-Commentary

## Canonical repo

https://github.com/jlay843-prog/Chicken-Coop-Commentary

Mirror also kept at `jlay843-prog/flock-yeah` (same site content). **Chicken-Coop-Commentary is the source of truth.**

## What transferred

| Area | Location |
|------|----------|
| Pages | `*.html` |
| Styles | `css/hens.css` (emerald/cream/gold/charcoal) |
| Logic | `js/*` |
| Hen/horse art | `assets/hens`, `assets/horses` |
| Plasma cut files | `designs/plasma/*-plasma.svg` |
| Print logos | `designs/print/logos/` |
| Docs | `CHAT-HANDOFF.md`, `README.md`, `SECURITY.md`, this file |
| QC | `scripts/qc-check.ps1` |

## Alignments from deleted-conversation handoff

- Hen id `cluck` (display name Cluck Norris)
- Horses: Lincoln, Grace, Winchester, Tia only
- Zone commentary (no face ID / no ALPR)
- Farm desk queues physical actions for Jeff
- Shop margin target ~25%; hats/tees SKUs
- SolForge bridge for metal/plasma

## Deploy from here

1. Push `main` to GitHub (already the remote).
2. Cloudflare Pages: connect this repo, output dir = `/` (static root).
3. Optional custom domain: `flock.lonetreeacres.com` or path on www.
4. Link from https://www.lonetreeacres.com nav when live.

## Do not transfer

- Stripe secret keys, DVR passwords, LLM API keys (never belonged in static site).
