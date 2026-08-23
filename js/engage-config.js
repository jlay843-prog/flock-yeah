/**
 * Optional engagement endpoints (no long-lived secrets in git).
 *
 * treatDispenseUrl — Pi Zero (or LAN proxy) for physical dispense.
 * solforgeConsumeUrl — defaults to /api/solforge/flock-consume (npm run dev proxy).
 *   Proxy reads solforge-secrets.json and POSTs to SolForge /api/farm/flock-consume.
 * solforgeErpEnabled — set false to skip ERP consume.
 *
 * notifyWebhook — Formspree (same farm form as lonetreeacres.com inquiry).
 *   Live LTA: https://formspree.io/f/xvzjvwqj
 */
(function (global) {
  "use strict";
  global.EngageConfig = {
    /** Same Formspree form as Lone Tree Acres contact / inquiry. */
    notifyWebhook: "https://formspree.io/f/xvzjvwqj",
    /** formspree | json — Formspree wants Accept: application/json + email/message fields */
    notifyProvider: "formspree",
    treatDispenseUrl: "",
    treatDispenseHeader: "",
    treatDispenseHeaderValue: "",
    solforgeConsumeUrl: "/api/solforge/flock-consume",
    solforgeErpEnabled: true,
  };
})(typeof window !== "undefined" ? window : globalThis);
