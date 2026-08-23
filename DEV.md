# Development environment — Flock Yeah

Local preview for browsing and editing pages **before** production.

## Start preview

From the repo root:

```powershell
powershell -File scripts/dev.ps1
```

Or:

```powershell
npm run dev
```

Then open **http://localhost:8080/hens.html** (the script opens this for you).

| Page | URL |
|------|-----|
| Cams | http://localhost:8080/hens.html |
| Who's Who | http://localhost:8080/whos-who.html |
| Herd | http://localhost:8080/herd.html |
| Shop | http://localhost:8080/shop.html |
| Ops | http://localhost:8080/ops.html |

Edit any HTML/CSS/JS, save, **refresh** the browser. No build step.

## Workflow

1. **Develop** on branch `dev` with the local server running.
2. Scroll/click through pages; use chat, gifts, lineup lens, shop demo checkout.
3. Run QC: `npm run qc` or `powershell -File scripts/qc-check.ps1`
4. Commit when happy.
5. **Production** = merge into `main` and push to GitHub. Deploy Cloudflare / lonetreeacres.com from `main` when wired.

```text
local :8080  →  branch dev  →  QC  →  main (production)
```

## Stop

Ctrl+C in the terminal running the server.
