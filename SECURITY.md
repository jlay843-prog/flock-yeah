# Security — Flock Yeah static site

## Model

This repo is a **static front end**. It must never contain:

- Stripe **secret** keys (`sk_…`)
- Webhook signing secrets
- LLM API keys
- SMTP / mailbox passwords
- Camera DVR admin credentials
- Private SolForge / Farm Brain tokens

## Allowed client config

| Item | Where | Notes |
|------|--------|------|
| Stripe publishable key | `js/stripe-config.js` | `pk_test_…` / `pk_live_…` only |
| Payment Link URLs | `js/stripe-config.js` | Public Stripe-hosted links |
| SolForge public URLs | `js/solforge-bridge.js` | `https://solforge.lonetreeacres.com` |

## Chat

`hen-voice.js` runs **on-device** personality replies. If you later wire `SolForgeBridge.chat` to an edge LLM:

- Authenticate on the server
- Rate-limit by IP / session
- Do not embed provider API keys in the browser bundle

## Cameras

Do not hardcode RTSP passwords or DVR admin URLs in HTML/JS. Prefer:

- Vendor embed tokens with short TTL, or
- A reverse proxy that strips credentials

## localStorage

Egg count, sponsor, desk notes, and gift log are browser-local (`fy_*` keys). Treat as UX state, not authoritative farm records.

## Reporting

Owner: Jeff Lay · `jeffrey@lonetreeacres.com` · [lonetreeacres.com](https://lonetreeacres.com)
