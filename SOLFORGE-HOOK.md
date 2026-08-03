# Flock Yeah → SolForge fabrication hook

> **Production / Grok Builder deploy handoff:** see [GROK-BUILDER-SOLFORGE-HANDOFF.md](./GROK-BUILDER-SOLFORGE-HANDOFF.md)  
> (git sync, PayPal/Venmo — not Stripe, treat ERP, acceptance tests).

Tie chicken-cam merch designs into **SolForge** for:

- **Plasma** — steel silhouettes / saying signs (`designs/plasma`, `designs/merch`)
- **3D print** — X2D desk toys / keychains (queued as `print_future`)

## How it works today (static-safe)

1. Shop item has `fabricate: "plasma" | "print"` (or `kind: solforge | print3d`).
2. **Get it** calls `SolForgeBridge.orderFromShopItem()` → builds a deep link:

```text
https://solforge.lonetreeacres.com/start
  ?from=flock-yeah
  &process=plasma|print_future
  &title=…
  &note=…
  &sku=…
  &saying=…
  &designUrl=https://…/designs/….svg
  &materialHint=…
  &dimensions=…
  &quantity=1
```

3. SolForge **`IntakeForm`** reads those query params, prefills the brief, and (for Flock) allows selecting **3D print** even while the public chip says “coming soon”.
4. Customer submits → `POST /api/intake` creates intake + order + job on SolForge → pay/track on `/track?id=ord_…`.

No secrets in the static site. No cross-origin `fetch` to `/api/intake` (CORS + abuse risk).

## Shop SKUs that open SolForge

| SKU | Process |
|-----|---------|
| `hen-plasma`, `saying-plasma` | Plasma |
| `spy-print`, `cop-print`, `clucky-print` | 3D print (`print_future`) |

Cams page **Cut this hen in steel** also uses the bridge (`plasma` + hen note).

## One-click API later (optional)

When you want Flock to create the order without the form:

1. Tiny proxy (Cloudflare Worker / Farm edge) with a shared secret.
2. Proxy `POST https://solforge.lonetreeacres.com/api/intake` server-side.
3. Return `order.publicId` → redirect browser to `/track?id=…`.

Do **not** call intake from browser JS on the Flock origin.

## Deploy notes

- Flock Yeah: ship updated `js/solforge-bridge.js` + shop SKUs (this repo `dev`).
- SolForge: deploy `fabrication-agent` with the IntakeForm prefill change so `/start?from=flock-yeah…` actually fills the form.
- Until SolForge is redeployed, deep links still open `/start` but fields may be empty — customer can paste the note from the URL.

## Payments (gifts / sponsor)

**Do not use Stripe** for the farm stack. SolForge production is **PayPal.me + Venmo**.

| Piece | Path |
|-------|------|
| URL builders + chooser | `js/pay-config.js` |
| **Auto-link handles** | `PayConfig.loadFromSolforge()` → `GET {solforge}/api/payments/rails` (no paste) |
| Optional local override | `js/pay-config.local.js` (wins over auto if set) |
| ERP secret link | `scripts/link-solforge.ps1` → `solforge-secrets.json` from SolForge `.env` |
| Gift click | Chooser → PayPal \| Venmo \| Demo — **no ERP yet** |
| After pay / demo | `checkout-success.html` → TreatHook ERP notify (once) → cams announce |

Integration stage gates: sibling control plane `../flock-solforge-integration/` (S0–S7).  
SolForge safe branch worktree: `../solforge-flock-integration` (`flock-integration`).

## Treat inventory + min-qty auto-reorder (ERP-lite)

Flock gift sales for **mealworms** / **scratch-grain** also hit SolForge inventory:

| Gift | SolForge SKU | Consume / gift | Reorder when |
|------|--------------|----------------|--------------|
| Mealworm Drop | `TREAT-MEALWORMS-1LB` | 0.05 lb | onHand ≤ 2 → order 10 lb |
| Scratch Grain | `TREAT-SCRATCH-25LB` | 0.25 lb | onHand ≤ 25 → order 50 lb |

**Flow**

1. Visitor buys treat on Flock → `TreatHook` → `POST /api/solforge/flock-consume` (local `npm run dev` proxy).
2. Proxy → SolForge `POST /api/farm/flock-consume` with `Authorization: Bearer $FLOCK_FARM_SECRET` (or `CRON_SECRET`).
3. SolForge decrements stock, runs `syncAutoReorders()`.
4. Cron / worker `reorder-buyer` emails ops a **PO draft** (vendor text from `preferredVendor`).

**Wire secrets (local)**

```text
copy solforge-secrets.example.json solforge-secrets.json
# baseUrl: https://solforge.lonetreeacres.com
# farmSecret: same value as FLOCK_FARM_SECRET or CRON_SECRET on SolForge
```

**Ensure SKUs on a live SolForge DB** (no full re-seed):

```bash
curl -H "Authorization: Bearer $FLOCK_FARM_SECRET" \
  https://solforge.lonetreeacres.com/api/farm/flock-consume
```

### Online auto-buy? Not yet

| Agent | What it does today |
|-------|--------------------|
| `reorder-buyer` | Creates `ReorderRequest` + emails PO draft to ops |
| `price-watcher` | Cost notes (EIA/steel) — not a shopping cart |

There is **no** Amazon / Chewy / McMaster auto-checkout in SolForge. Best path now:

1. Keep min-qty → PO draft email (human buys at feed store or online).
2. Later: add a `purchase-executor` agent with approval limits + one supplier API — never from the static Flock site.
