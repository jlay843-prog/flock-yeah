/**
 * Flock Yeah — shop UI + Stripe/SolForge handoff
 */
(function (global) {
  "use strict";

  const { SHOP_ITEMS, formatMoney, FARM } = global.FlockData;

  function el(id) {
    return document.getElementById(id);
  }

  function renderCatalog() {
    const grid = el("shop-grid");
    if (!grid) return;
    grid.innerHTML = SHOP_ITEMS.map((item) => {
      return (
        '<article class="shop-card" data-kind="' +
        item.kind +
        '">' +
        "<h3>" +
        item.name +
        "</h3>" +
        "<p>" +
        item.blurb +
        "</p>" +
        '<div class="shop-row">' +
        "<strong>" +
        formatMoney(item.priceCents) +
        "</strong>" +
        '<button type="button" class="btn btn-primary" data-buy="' +
        item.id +
        '">Get it</button>' +
        "</div>" +
        '<span class="shop-kind">' +
        item.kind +
        "</span>" +
        "</article>"
      );
    }).join("");

    grid.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => buy(btn.getAttribute("data-buy")));
    });
  }

  function buy(itemId) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const status = el("shop-status");
    const cfg = global.StripeConfig;
    const link = cfg && cfg.paymentLinks ? cfg.paymentLinks[itemId] : "";

    if (item.kind === "solforge" && global.SolForgeBridge) {
      global.SolForgeBridge.openCustomMetal(
        "Flock Yeah shop: " + item.name + " / svg under designs/plasma/"
      );
      if (status) status.textContent = "Opening SolForge for " + item.name + "…";
      return;
    }

    if (cfg && cfg.isConfigured() && link) {
      global.location.href = link;
      return;
    }

    // Demo checkout path when Stripe isn't wired
    if (status) {
      status.textContent =
        item.name +
        " queued locally. Add a Stripe Payment Link in js/stripe-config.js or pay via SolForge.";
    }
    try {
      sessionStorage.setItem(
        "fy_last_order",
        JSON.stringify({ id: item.id, name: item.name, at: Date.now() })
      );
    } catch (_) {}
    global.location.href = "checkout-success.html?demo=1&item=" + encodeURIComponent(item.id);
  }

  function init() {
    renderCatalog();
    const tag = el("brand-tagline");
    if (tag) tag.textContent = FARM.tagline + " " + FARM.attribution;
    const status = el("shop-status");
    const cfg = global.StripeConfig;
    if (status && cfg) {
      status.textContent = cfg.isConfigured()
        ? "Stripe publishable key detected."
        : "Demo mode — Stripe publishable key not set (safe).";
    }
  }

  global.FlockShop = { init, buy };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
