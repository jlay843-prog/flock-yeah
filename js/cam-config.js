/**
 * Flock Yeah — public AREA camera defaults (no secrets).
 * Cam 1 Coop · Cam 2 Chicken Run · Cam 3 donate CTA overlay (no stream).
 * Streams are same-origin /cam/* → SolForge → go2rtc on the farm.
 */
(function (global) {
  "use strict";

  const CamConfig = {
    discovery: {
      host: "",
      vendor: "Reolink",
      mac: "",
      openPorts: [],
      notes: "Cam 1 Coop live · Cam 2 Chicken Run live · Cam 3 donate CTA.",
    },

    /** Keys match AREA_CAMS ids in flock-data.js */
    streams: {
      "nest-a": {
        mode: "mp4",
        label: "Coop Cam",
        mp4Url: "/cam/coop/live.mp4",
        snapshotUrl: "/cam/coop/snap",
        refreshMs: 2000,
      },
      "run-b": {
        mode: "mp4",
        label: "Chicken Run",
        mp4Url: "/cam/run/live.mp4",
        snapshotUrl: "/cam/run/snap",
        refreshMs: 2000,
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
