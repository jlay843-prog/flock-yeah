# Test camera → Flock Yeah (LAN)

## What we found

| Field | Value |
|-------|--------|
| IP | `192.168.68.116` |
| MAC | `EC-71-DB-19-18-56` (Reolink OUI) |
| Reachable | Yes (ping) |
| Open TCP | **9000 only** (Reolink Baichuan / client) |
| HTTP 80 / HTTPS 443 / RTSP 554 | **Closed** |

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
rtsp://admin:PASSWORD@192.168.68.116:554/h264Preview_01_sub
```

Snapshot (after HTTP on):

```text
http://192.168.68.116/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=flock&user=admin&password=PASSWORD
```

## Wire into the site (dev)

1. Copy config:

```powershell
copy js\cam-config.local.example.js js\cam-config.local.js
```

2. Edit `js/cam-config.local.js` — set `PASS` and `mode: "snapshot"`.
3. Refresh http://localhost:8080/hens.html — Nest Cam A (Henrietta) should poll live stills.

## Optional: smooth video via go2rtc

When RTSP is open, run [go2rtc](https://github.com/AlexxIT/go2rtc) locally and point HLS at Nest Cam A:

```yaml
# go2rtc.yaml (example)
streams:
  reolink-test: rtsp://admin:PASSWORD@192.168.68.116:554/h264Preview_01_sub
```

Then in `cam-config.local.js`:

```js
henrietta: {
  mode: "hls",
  hlsUrl: "http://127.0.0.1:1984/api/stream.m3u8?src=reolink-test",
  label: "Test Reolink HLS",
}
```

## Security

- Never commit `cam-config.local.js` (gitignored).
- Do not put camera passwords in Cloudflare / public static hosting.
- Production should use a private stream proxy (go2rtc / MediaMTX) on the farm LAN or tunnel, not raw cam credentials in the browser.

## Ops

`ops.html` shows discovery status from `CamConfig.discovery`.
