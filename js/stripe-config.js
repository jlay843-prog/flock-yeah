/**
 * Flock Yeah — LEGACY Stripe stubs (kept for optional merch Payment Links only).
 * Gifts / sponsor use PayConfig (PayPal.me + Venmo) — same rails as SolForge.
 * Do NOT expand Stripe for the farm stack. Never put secret keys here.
 *
 * Prefer: js/pay-config.js + pay-config.local.js
 */
(function (global) {
  "use strict";

  const StripeConfig = {
    /** Replace with pk_live_… or pk_test_… when wiring payments */
    publishableKey: "pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY",
    /** Payment Links keyed by shop item id OR gift id */
    paymentLinks: {
      mealworms: "",
      "scratch-grain": "",
      "nest-box": "",
      "dust-bath": "",
      "hawk-watch": "",
      "sticker-pack": "",
      "sticker-spy": "",
      "sticker-cop": "",
      "mug-spy": "",
      "mug-mom": "",
      "tee-flock": "",
      "tee-cop": "",
      "tee-nah": "",
      "tee-mom": "",
      "tee-zero": "",
      "tee-birds": "",
      "tee-feeder": "",
      "tee-clucky": "",
      "tee-watch": "",
      "hat-flock": "",
      "egg-carton": "",
      "hen-plasma": "",
      "saying-plasma": "",
      "spy-print": "",
      "cop-print": "",
      "clucky-print": "",
      "sponsor-day": "",
    },
    successPath: "checkout-success.html",
    currency: "usd",
    enabled: false,
  };

  StripeConfig.isConfigured = function () {
    return (
      !!StripeConfig.publishableKey &&
      !StripeConfig.publishableKey.includes("REPLACE_WITH")
    );
  };

  StripeConfig.hasLink = function (id) {
    return !!(StripeConfig.paymentLinks && StripeConfig.paymentLinks[id]);
  };

  /**
   * Start checkout for a gift/shop/sponsor id.
   * Uses Payment Link when present; otherwise completes a local demo checkout
   * so the thank-you → chat announce loop still works for day tests.
   */
  StripeConfig.beginCheckout = function (id, meta) {
    const m = meta || {};
    const name = m.name || id;
    const henId = m.henId || "";
    const kind = m.kind || "order";
    const order = {
      id: id,
      name: name,
      henId: henId,
      kind: kind,
      at: Date.now(),
      demo: !StripeConfig.hasLink(id),
    };
    try {
      sessionStorage.setItem("fy_last_order", JSON.stringify(order));
      sessionStorage.setItem(
        (global.FlockEngage && global.FlockEngage.KEYS.pending) || "fy_pending_announce_v1",
        JSON.stringify({
          kind: kind,
          name: name,
          henId: henId,
          giftId: kind === "gift" ? id : "",
          demo: order.demo,
        })
      );
    } catch (_) {}

    if (StripeConfig.hasLink(id)) {
      global.open(StripeConfig.paymentLinks[id], "_blank", "noopener,noreferrer");
      return { mode: "stripe", order: order };
    }

    const u = new URL(StripeConfig.successPath, global.location.href);
    u.searchParams.set("item", id);
    u.searchParams.set("demo", "1");
    u.searchParams.set("kind", kind);
    if (henId) u.searchParams.set("hen", henId);
    if (m.name) u.searchParams.set("name", m.name);
    global.location.href = u.toString();
    return { mode: "demo", order: order };
  };

  global.StripeConfig = StripeConfig;
})(typeof window !== "undefined" ? window : globalThis);
