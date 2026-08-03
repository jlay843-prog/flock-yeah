/**
 * Optional engagement endpoints (no long-lived secrets in git).
 *
 * treatDispenseUrl — Pi Zero (or LAN proxy) for physical dispense.
 * solforgeConsumeUrl — defaults to /api/solforge/flock-consume (npm run dev proxy).
 *   Proxy reads solforge-secrets.json and POSTs to SolForge /api/farm/flock-consume.
 * solforgeErpEnabled — set false to skip ERP consume.
 *
 * notifyWebhook — POST JSON { contact, at, source } for alert signups.
 */
(function (global) {
  "use strict";
  global.EngageConfig = {
    notifyWebhook: "",
    treatDispenseUrl: "",
    treatDispenseHeader: "",
    treatDispenseHeaderValue: "",
    solforgeConsumeUrl: "/api/solforge/flock-consume",
    solforgeErpEnabled: true,
  };
})(typeof window !== "undefined" ? window : globalThis);
