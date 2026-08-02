# Security — Flock Yeah / Chicken-Coop-Commentary

## Model

Static front end only. It must never contain:

- Stripe **secret** keys (`sk_…`) or webhook secrets
- LLM / API keys
- SMTP / mailbox passwords
- Camera DVR / RTSP credentials
- Private SolForge / Farm Brain tokens

## Allowed client config

| Item | Where | Notes |
|------|--------|------|
| Stripe publishable key | `js/stripe-config.js` | `pk_test_…` / `pk_live_…` only |
| Payment Link URLs | `js/stripe-config.js` | Public Stripe-hosted links |
| SolForge public URLs | `js/solforge-bridge.js` | `https://solforge.lonetreeacres.com` |

## Product constraints

- **No ALPR / license plates.** Cam commentary is flock/zone events only.
- Chat is on-device personality (`hen-voice.js`) until a server-keyed bridge exists.
- Farm desk entries are local UX queues — not remote device control.

## Cameras

Do not hardcode RTSP passwords or DVR admin URLs. Prefer vendor embeds with short TTL or a credential-stripping reverse proxy.

## localStorage

Keys `fy_*` store egg count, sponsor, desk notes, gifts. Browser-local only — not authoritative farm records.

## Reporting

Owner: Jeff Lay · Lone Tree Acres LLC · `jeffrey@lonetreeacres.com` · https://www.lonetreeacres.com
