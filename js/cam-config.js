/**
 * Flock Yeah — public AREA camera defaults (no secrets).
 * Cam 1 Coop · Cam 2 Chicken Run · Cam 3 donate CTA overlay (no stream).
 * Coop → same-origin /cam/* (go2rtc on the farm).
 * Run reserved for 2nd camera (mode: none until live).
 */
(function (global) {
  "use strict";

  const CamConfig = {
    discovery: {
      host: "",
      vendor: "",
      mac: "",
      openPorts: [],
      notes: "Cam 1 Coop live · Cam 2 Run soon · Cam 3 donate CTA (no hardware).",
    },

    /** Keys match AREA_CAMS ids in flock-data.js */
    streams: {
      "nest-a": {
        mode: "mp4",
        label: "Coop Cam",
        mp4Url: "/cam/live.mp4",
        snapshotUrl: "/cam/snap",
        refreshMs: 2000,
      },
      "run-b": {
        mode: "none",
        label: "Chicken Run",
        comingSoon: true,
      },
      "donate-c": {
        mode: "cta",
        label: "Want more chickens?",
        headline: "Want more chickens?",
        body: "Help grow the flock — tips and day sponsorships fund feed, care, and more birds.",
        cta: "Donate today",
        href: "#sponsor",
        secondaryHref: "#gifts",
        secondaryCta: "Send a tip",
      },
    },

    proxyBase: "",
  };

  global.CamConfig = CamConfig;
})(typeof window !== "undefined" ? window : globalThis);
