/**
 * Copy to cam-config.local.js for farm-LAN day tests only.
 * Loaded only when hostname is localhost / private LAN (see hens.html).
 *
 * Prefer same-origin proxies from `npm run dev`:
 *   mp4Url: "/cam/live.mp4"
 *   snapshotUrl: "/cam/snap"
 * Keys = area cam ids: nest-a (Coop) | run-b (Chicken Run) | donate-c (CTA)
 * Never put camera passwords in files that ship to the public CDN.
 */
(function (global) {
  "use strict";

  const local = {
    discovery: { host: "", vendor: "", openPorts: [], notes: "" },
    streams: {
      "nest-a": {
        mode: "mp4",
        label: "Coop Cam",
        mp4Url: "/cam/live.mp4",
        snapshotUrl: "/cam/snap",
        refreshMs: 2000,
      },
    },
    proxyBase: "",
  };

  const base = global.CamConfig || {};
  global.CamConfig = Object.assign({}, base, local, {
    discovery: Object.assign({}, base.discovery || {}, local.discovery),
    streams: Object.assign({}, base.streams || {}, local.streams),
  });
})(typeof window !== "undefined" ? window : globalThis);
