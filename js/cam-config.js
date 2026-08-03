/**
 * Flock Yeah — public camera defaults (no secrets, no LAN inventory).
 * Local overrides: js/cam-config.local.js (gitignored).
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
        mode: "none",
        label: "Nest Cam A",
        refreshMs: 2000,
      },
    },

    proxyBase: "",
  };

  global.CamConfig = CamConfig;
})(typeof window !== "undefined" ? window : globalThis);
