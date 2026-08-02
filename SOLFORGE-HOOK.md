# Flock Yeah → SolForge fabrication hook

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
