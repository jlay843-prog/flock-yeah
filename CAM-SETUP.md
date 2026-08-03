# Test camera → Flock Yeah (LAN)

## What we found

| Field | Value |
|-------|--------|
| IP | `192.168.68.118` |
| MAC | `EC-71-DB-19-18-56` (Reolink OUI) |
| Reachable | Yes (ping) |
| Open TCP (after enable) | **80** (HTTP), **554** (RTSP), **8000** (ONVIF), **9000** (app client) |
| HTTPS 443 | Usually closed (fine) |

**ONVIF** is optional for Flock Yeah — we use HTTP Snap + optional RTSP→HLS. Keep ONVIF on if you also use Home Assistant / Frigate later.

Browsers cannot speak Baichuan on :9000. We need **HTTP snapshot** and/or **RTSP → HLS** for the cams page.

## Enable streams on the camera (Reolink app / Client)

1. Open the camera in **Reolink** app or Windows Client.
2. **Settings → Network → Advanced → Port Settings** (wording varies by firmware).
3. Enable:
   - **RTSP** (default `554`)
   - **HTTP** (default `80`) — for CGI snapshots
   - Optional: **ONVIF** (`8000`)
4. Save / reboot if prompted.
5. Re-probe from the repo:

```powershell
powershell -File scripts/probe-cam.ps1
```

You want `80` and/or `554` showing **OPEN**.

Typical RTSP URL (sub stream = lighter for LAN preview):

```text
rtsp://admin:PASSWORD@192.168.68.118:554/h264Preview_01_sub
```

Snapshot (after HTTP on):

```text
http://192.168.68.118/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=flock&user=admin&password=PASSWORD
```

## Wire into the site (dev)

Password-in-URL Snap often fails / locks the camera. Use the **local proxy** instead:

```powershell
cd C:\Users\jlay\Grok\flock-yeah
powershell -File scripts\link-cam.ps1 -User admin -Password 'YOUR_CAMERA_PASSWORD'
npm run dev
```

That writes gitignored `cam-secrets.json` + `js/cam-config.local.js` (browser points at `http://127.0.0.1:8080/cam/snap`).

Hard-refresh http://localhost:8080/hens.html — Nest Cam A polls stills via token auth.

If you see **Login has been locked**, close the hens tab, wait 10–30 minutes (or unlock in the Reolink app), then retry `link-cam.ps1` / `npm run dev`. Do not leave a failing page refreshing — it burns lockout attempts.

## Clucky Nest Cam A day test (local vision)

With `npm run dev` and [Ollama](https://ollama.com) running (`moondream` + `qwen2.5:7b`):

1. Page polls `/api/clucky/tick` about every 20s.
2. Server compares stills → on **activity** (or startup / 30‑min heartbeat) runs vision → brief Nest Cam A chat line.
3. Lines land in cam commentary + Clucky chat. Day log: `logs/clucky-day.jsonl`.

Optional tune: copy `ai-secrets.example.json` → `ai-secrets.json`. Force a line: http://localhost:8080/api/clucky/tick?force=1

## Optional: smooth video via go2rtc

Stills (`/cam/snap`) are choppy on purpose. For real video:

1. Put `go2rtc.exe` in `tools/go2rtc/` ([go2rtc_win64.zip](https://github.com/AlexxIT/go2rtc/releases)).
2. From repo root (uses `cam-secrets.json`, writes a gitignored yaml):

```powershell
powershell -File scripts\start-go2rtc.ps1
```

3. Keep `npm run dev` running — it proxies smooth video at  
   `http://127.0.0.1:8080/cam/live.mp4` → go2rtc.
4. `js/cam-config.local.js` should use `mode: "mp4"` + `mp4Url: "/cam/live.mp4"`  
   (HLS + snapshot kept as fallbacks).
5. Hard-refresh hens.html — status should say **LIVE video** (not “Stills”).

## Security

- Never commit `cam-config.local.js` (gitignored).
- Do not put camera passwords in Cloudflare / public static hosting.
- Production should use a private stream proxy (go2rtc / MediaMTX) on the farm LAN or tunnel, not raw cam credentials in the browser.

## Ops

`ops.html` shows discovery status from `CamConfig.discovery`.
