/**
 * Flock Yeah — public camera defaults (no secrets).
 * Nest Cam A streams via same-origin /cam/* proxies on SolForge (go2rtc on the farm).
 * Local LAN day-tests can still override with cam-config.local.js on localhost only.
 */
(function (global) {
  "use strict";

  const CamConfig = {
    discovery: {
      host: "",
      vendor: "",
      mac: "",
      openPorts: [],
      notes: "",
    },

    streams: {
      henrietta: {
        mode: "mp4",
        label: "Nest Cam A",
        mp4Url: "/cam/live.mp4",
        snapshotUrl: "/cam/snap",
        refreshMs: 2000,
      },
    },

    proxyBase: "",
  };

  global.CamConfig = CamConfig;
})(typeof window !== "undefined" ? window : globalThis);
