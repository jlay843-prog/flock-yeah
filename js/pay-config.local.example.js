/**
 * Copy to pay-config.local.js (gitignored) and set handles from SolForge production:
 *   PAYPAL_ME_USERNAME  → paypalMe
 *   VENMO_USERNAME      → venmoUser
 * Do not invent new payment accounts.
 */
(function (global) {
  "use strict";
  if (!global.PayConfig) return;
  Object.assign(global.PayConfig, {
    paypalMe: "YOUR_PAYPAL_ME", // no @
    venmoUser: "YOUR_VENMO", // no @
  });
})(typeof window !== "undefined" ? window : globalThis);
