/**
 * Flock Yeah — public camera defaults (no secrets).
 * Override locally with js/cam-config.local.js (gitignored).
 *
 * Discovered test cam: 192.168.68.116
 * MAC EC-71-DB → Reolink · only Baichuan client port :9000 open
 * HTTP :80 / RTSP :554 currently closed — enable in Reolink app to stream in-browser.
 */
(function (global) {
  "use strict";

  const CamConfig = {
    /** LAN discovery / ops panel */
    discovery: {
      host: "192.168.68.116",
      vendor: "Reolink",
      mac: "EC-71-DB-19-18-56",
      openPorts: [9000],
      notes:
        "Port 9000 = Reolink client (Baichuan). Enable RTSP (554) and/or HTTP (80) in the Reolink app for browser streams.",
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
        label: "Test Reolink @ 192.168.68.116",
        // Fill these in cam-config.local.js after enabling HTTP/RTSP:
        // snapshotUrl: "http://192.168.68.116/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=flock&user=admin&password=***",
        // hlsUrl: "http://127.0.0.1:1984/api/stream.m3u8?src=reolink-test",
        // mjpegUrl: "http://127.0.0.1:1984/api/stream.mjpeg?src=reolink-test",
        rtspHint: "rtsp://USER:PASS@192.168.68.116:554/h264Preview_01_sub",
        refreshMs: 2000,
      },
    },

    /** Optional local go2rtc / MediaMTX base (dev only) */
    proxyBase: "http://127.0.0.1:1984",
  };

  global.CamConfig = CamConfig;
})(typeof window !== "undefined" ? window : globalThis);
