/**
 * Flock Yeah — Stripe client config (publishable key only)
 * Never put secret keys in this static site. Checkout sessions should be
 * created by a trusted backend (SolForge / Farm desk) and redirected here.
 */
(function (global) {
  "use strict";

  const StripeConfig = {
    /** Replace with pk_live_… or pk_test_… when wiring payments */
    publishableKey: "pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY",
    /** Optional Payment Links or Checkout URLs keyed by shop item id */
    paymentLinks: {
      "flock-sticker": "",
      "coop-mug": "",
      "flock-hat": "",
      "flock-tee": "",
      "egg-carton": "",
      "hen-plasma": "",
      "sponsor-day": "",
    },
    successUrl: "checkout-success.html",
    currency: "usd",
    enabled: false,
  };

  StripeConfig.isConfigured = function () {
    return (
      !!StripeConfig.publishableKey &&
      !StripeConfig.publishableKey.includes("REPLACE_WITH")
    );
  };

  global.StripeConfig = StripeConfig;
})(typeof window !== "undefined" ? window : globalThis);
