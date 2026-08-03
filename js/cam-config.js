/**
 * Flock Yeah — public AREA camera defaults (no secrets).
 * Streams are coop zones (Nest / Run / Gate), not per-hen "rooms."
 * Nest Cam A → same-origin /cam/* (go2rtc on the farm).
 * Run B / Gate C reserved for 2nd–3rd cameras (mode: none until live).
 */
(function (global) {
  "use strict";

  const CamConfig = {
    discovery: {
      host: "",
      vendor: "",
      mac: "",
      openPorts: [],
      notes: "Area cams only — 2–3 coop zones planned.",
    },

    /** Keys match AREA_CAMS ids in flock-data.js */
    streams: {
      "nest-a": {
        mode: "mp4",
        label: "Nest Cam A",
        mp4Url: "/cam/live.mp4",
        snapshotUrl: "/cam/snap",
        refreshMs: 2000,
      },
      "run-b": {
        mode: "none",
        label: "Run Cam B",
        comingSoon: true,
      },
      "gate-c": {
        mode: "none",
        label: "Gate Cam C",
        comingSoon: true,
      },
    },

    proxyBase: "",
  };

  global.CamConfig = CamConfig;
})(typeof window !== "undefined" ? window : globalThis);
