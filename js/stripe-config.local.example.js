/**
 * LOCAL / PRODUCTION override — copy to stripe-config.local.js (gitignored).
 *
 * Stripe Dashboard → Payment Links:
 *  1. Create a link per gift/SKU (mealworms, scratch-grain, sponsor-day, …)
 *  2. After payment → redirect to:
 *       https://YOUR_SITE/checkout-success.html?item=ITEM_ID
 *     (or localhost while testing)
 *  3. Paste buy.stripe.com URLs below + your publishable key.
 */
(function (global) {
  "use strict";
  if (!global.StripeConfig) return;
  Object.assign(global.StripeConfig, {
    publishableKey: "pk_live_REPLACE_ME",
    enabled: true,
    paymentLinks: Object.assign({}, global.StripeConfig.paymentLinks, {
      mealworms: "https://buy.stripe.com/REPLACE_MEALWORMS",
      "scratch-grain": "https://buy.stripe.com/REPLACE_SCRATCH",
      "nest-box": "",
      "dust-bath": "",
      "hawk-watch": "",
      "sponsor-day": "https://buy.stripe.com/REPLACE_SPONSOR",
      // Optional merch — fill as you create links:
      // "tee-flock": "https://buy.stripe.com/…",
    }),
  });
})(typeof window !== "undefined" ? window : globalThis);
