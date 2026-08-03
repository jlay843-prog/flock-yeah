/**
 * Flock Yeah — public camera defaults (no secrets).
 * Override locally with js/cam-config.local.js (gitignored).
 *
 * Discovered test cam: 192.168.68.118
 * MAC EC-71-DB → Reolink
 * HTTP :80 / RTSP :554 — enable in Reolink app; live stills via /cam/snap proxy.
 */
(function (global) {
  "use strict";

  const CamConfig = {
    /** LAN discovery / ops panel */
    discovery: {
      host: "192.168.68.118",
      vendor: "Reolink",
      mac: "EC-71-DB-19-18-56",
      openPorts: [80, 554, 8000, 9000],
      notes:
        "HTTP 80 + RTSP 554 + ONVIF 8000 + client 9000. Nest Cam A needs js/cam-config.local.js + cam-secrets.json for /cam/snap. ONVIF optional for Home Assistant later.",
    },

    /**
     * Per-hen stream map. Modes:
     *  - none: photo stub
     *  - snapshot: refresh <img> from HTTP snapshot URL
     *  - mjpeg: continuous MJPEG URL in <img>
     *  - hls: HLS playlist (.m3u8) via hls.js / native Safari
     *  - iframe: embed URL
     */
    streams: {
      // Test cam wired to Nest Cam A until more cams arrive
      henrietta: {
        mode: "none",
        label: "Test Reolink @ 192.168.68.118",
        // Fill these in cam-config.local.js after enabling HTTP/RTSP:
        // snapshotUrl: "http://127.0.0.1:8080/cam/snap",
        // hlsUrl: "http://127.0.0.1:1984/api/stream.m3u8?src=reolink-test",
        // mjpegUrl: "http://127.0.0.1:1984/api/stream.mjpeg?src=reolink-test",
        rtspHint: "rtsp://USER:PASS@192.168.68.118:554/h264Preview_01_sub",
        refreshMs: 2000,
      },
    },

    /** Optional local go2rtc / MediaMTX base (dev only) */
    proxyBase: "http://127.0.0.1:1984",
  };

  global.CamConfig = CamConfig;
})(typeof window !== "undefined" ? window : globalThis);
