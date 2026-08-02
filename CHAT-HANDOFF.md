# Chat handoff — Flock Yeah

For the next agent or human picking up this repo.

## What this is

Static **Flock Yeah** chicken-cam experience for **Lone Tree Acres**.

- Brand: Flock Yeah — “Keep flocks for the birds.” — Mom
- AI host: Clucky
- Owner: Jeff Lay · lonetreeacres.com
- Hens: Henrietta, Scratch, Cluck Norris, Daisy, Pepper, Maple
- Horses (herd page): Lincoln, Grace, Winchester, Tia, Buster, Thunder

## Architecture

```
index.html → hens.html
hens.html  → flock-data, hen-voice, hen-cam, stripe-config, solforge-bridge
whos-who   → flock-data, lineup
shop       → flock-data, shop, stripe-config, solforge-bridge
ops        → ops checklist + storage reset
print/*.svg → SolForge plasma silhouettes
```

No bundler. Vanilla JS IIFEs on `window`.

## Done in this recreate

- [x] Multi-cam UI + personality chat (local)
- [x] Egg counter / Farm desk / gifts / sponsor (localStorage)
- [x] Jail lineup + lens zoom
- [x] Herd, shop, ops, checkout-success
- [x] Stripe + SolForge client stubs
- [x] Plasma SVGs + README / SECURITY

## Sensible next steps

1. Replace cam stage placeholders with real HLS/YouTube/WebRTC embeds per hen id.
2. Fill Stripe Payment Links in `js/stripe-config.js`.
3. Optionally implement `SolForgeBridge.chat` against a farm edge LLM (server-keyed).
4. Sync egg counter / sponsor to a tiny backend if multiple viewers need one truth.
5. Deploy under a Lone Tree Acres hostname and link from the main site nav.

## Related local projects

- `C:\Users\jlay\Grok\lonetreeacres-website` — main farm marketing site
- `C:\Users\jlay\Grok\fabrication-agent` — SolForge shop stack
- `C:\Users\jlay\Grok\farm-brain` — farm agents / deploy notes

## Tone

Playful coop broadcast, not corporate. Clucky announces; hens stay in character; Mom’s line stays sacred.
