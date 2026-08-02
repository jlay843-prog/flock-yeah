/**
 * Flock Yeah — shop UI with merch art + Stripe/SolForge handoff
 */
(function (global) {
  "use strict";

  const { SHOP_ITEMS, MERCH_DESIGNS, formatMoney, FARM, getDesign } = global.FlockData;

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCatalog() {
    const grid = el("shop-grid");
    if (!grid) return;
    grid.innerHTML = SHOP_ITEMS.map((item) => {
      const design = item.designId ? getDesign(item.designId) : null;
      const img = item.image || (design && (design.mockup || design.art)) || "";
      const saying = design
        ? '<p class="shop-saying">“' + escapeHtml(design.saying) + '”</p>'
        : "";
      return (
        '<article class="shop-card" data-kind="' +
        item.kind +
        '">' +
        (img
          ? '<div class="shop-art"><img src="' +
            img +
            '" alt="' +
            escapeHtml(item.name) +
            '" loading="lazy"></div>'
          : "") +
        "<h3>" +
        escapeHtml(item.name) +
        "</h3>" +
        saying +
        "<p>" +
        escapeHtml(item.blurb) +
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

  function renderDesignWall() {
    const wall = el("design-wall");
    if (!wall || !MERCH_DESIGNS) return;
    wall.innerHTML = MERCH_DESIGNS.map((d) => {
      const src = d.mockup || d.art;
      return (
        '<figure class="design-tile">' +
        '<img src="' +
        src +
        '" alt="' +
        escapeHtml(d.saying) +
        '" loading="lazy">' +
        "<figcaption><strong>" +
        escapeHtml(d.saying) +
        "</strong><span>" +
        escapeHtml(d.sub || "") +
        "</span></figcaption>" +
        "</figure>"
      );
    }).join("");
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
    renderDesignWall();
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
