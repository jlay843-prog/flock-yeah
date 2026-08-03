/**
 * Flock Yeah — shop UI with merch art + lightbox + Stripe/SolForge handoff
 */
(function (global) {
  "use strict";

  function data() {
    return global.FlockData || {};
  }

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

  function itemImage(item) {
    if (item.image) return item.image;
    const design =
      item.designId && data().getDesign ? data().getDesign(item.designId) : null;
    return (design && (design.mockup || design.art)) || "";
  }

  function ensureLightbox() {
    let box = el("merch-lightbox");
    if (box) return box;
    box = document.createElement("div");
    box.id = "merch-lightbox";
    box.className = "merch-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML =
      '<div class="merch-lightbox-card">' +
      '<img id="lb-img" alt="">' +
      '<h3 id="lb-title"></h3>' +
      '<p class="shop-saying" id="lb-saying"></p>' +
      '<p id="lb-blurb" class="muted"></p>' +
      '<div class="btn-row" style="margin-top:0.75rem">' +
      '<button type="button" class="btn btn-primary" id="lb-buy">Get it</button>' +
      '<button type="button" class="btn" id="lb-close">Close</button>' +
      "</div>" +
      '<p class="muted" style="margin:0.85rem 0 0.35rem">More designs</p>' +
      '<div class="merch-lightbox-thumbs" id="lb-thumbs"></div>' +
      "</div>";
    document.body.appendChild(box);
    box.addEventListener("click", (e) => {
      if (e.target === box) closeLightbox();
    });
    el("lb-close").addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
    return box;
  }

  function closeLightbox() {
    const box = el("merch-lightbox");
    if (box) box.classList.remove("is-open");
  }

  function openLightbox(itemId, designId) {
    const { SHOP_ITEMS, MERCH_DESIGNS, getDesign, formatMoney } = data();
    const item = (SHOP_ITEMS || []).find((i) => i.id === itemId);
    if (!item) return;
    const box = ensureLightbox();
    const design = getDesign
      ? getDesign(designId || item.designId)
      : null;
    const img = (design && (design.mockup || design.art)) || itemImage(item);

    el("lb-img").src = img;
    el("lb-img").alt = item.name;
    el("lb-title").textContent = item.name;
    el("lb-saying").textContent = design
      ? "“" + design.saying + "”"
      : "";
    el("lb-blurb").textContent =
      item.blurb +
      (formatMoney ? " · " + formatMoney(item.priceCents) : "");

    const thumbs = el("lb-thumbs");
    thumbs.innerHTML = (MERCH_DESIGNS || [])
      .map((d) => {
        const src = d.mockup || d.art;
        const active =
          design && d.id === design.id ? " is-active" : "";
        return (
          '<button type="button" class="' +
          active.trim() +
          '" data-design="' +
          d.id +
          '" title="' +
          escapeHtml(d.saying) +
          '"><img src="' +
          src +
          '" alt="' +
          escapeHtml(d.saying) +
          '"></button>'
        );
      })
      .join("");

    thumbs.querySelectorAll("[data-design]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openLightbox(itemId, btn.getAttribute("data-design"));
      });
    });

    const buyBtn = el("lb-buy");
    buyBtn.onclick = () => {
      closeLightbox();
      buy(itemId);
    };

    box.classList.add("is-open");
  }

  function renderCatalog() {
    const grid = el("shop-grid");
    const { SHOP_ITEMS, getDesign, formatMoney } = data();
    if (!grid || !SHOP_ITEMS) return;

    grid.innerHTML = SHOP_ITEMS.map((item) => {
      const design = item.designId && getDesign ? getDesign(item.designId) : null;
      const img = itemImage(item);
      const saying = design
        ? '<p class="shop-saying">“' + escapeHtml(design.saying) + '”</p>'
        : "";
      const fallback =
        "this.onerror=null;this.src='" +
        (design && design.art
          ? design.art
          : "designs/merch/flock-yeah-classic.svg") +
        "'";
      return (
        '<article class="shop-card" data-kind="' +
        item.kind +
        '" data-item="' +
        item.id +
        '" data-sku="' +
        item.id +
        '">' +
        '<button type="button" class="shop-art" data-open="' +
        item.id +
        '" aria-label="Preview ' +
        escapeHtml(item.name) +
        '">' +
        (img
          ? '<img src="' +
            img +
            '" alt="' +
            escapeHtml(item.name) +
            '" loading="eager" onerror="' +
            fallback +
            '">'
          : '<img src="designs/merch/flock-yeah-classic.svg" alt="">') +
        "</button>" +
        '<h3 data-open="' +
        item.id +
        '">' +
        escapeHtml(item.name) +
        "</h3>" +
        saying +
        "<p>" +
        escapeHtml(item.blurb) +
        "</p>" +
        '<div class="shop-row">' +
        "<strong>" +
        (formatMoney ? formatMoney(item.priceCents) : "") +
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
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        buy(btn.getAttribute("data-buy"));
      });
    });
    grid.querySelectorAll("[data-open]").forEach((node) => {
      node.addEventListener("click", () => {
        openLightbox(node.getAttribute("data-open"));
      });
    });
  }

  function renderDesignWall() {
    const wall = el("design-wall");
    const { MERCH_DESIGNS } = data();
    if (!wall || !MERCH_DESIGNS) return;
    wall.innerHTML = MERCH_DESIGNS.map((d) => {
      const src = d.mockup || d.art;
      return (
        '<figure class="design-tile" data-design="' +
        d.id +
        '">' +
        '<img src="' +
        src +
        '" alt="' +
        escapeHtml(d.saying) +
        '" loading="eager">' +
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
    const { SHOP_ITEMS } = data();
    const item = (SHOP_ITEMS || []).find((i) => i.id === itemId);
    if (!item) return;
    const status = el("shop-status");
    const cfg = global.StripeConfig;
    const link = cfg && cfg.paymentLinks ? cfg.paymentLinks[itemId] : "";

    if (
      global.SolForgeBridge &&
      (item.kind === "solforge" ||
        item.kind === "print3d" ||
        item.fabricate === "plasma" ||
        item.fabricate === "print")
    ) {
      const design =
        item.designId && data().getDesign
          ? data().getDesign(item.designId)
          : null;
      const order = global.SolForgeBridge.orderFromShopItem(item, design);
      global.SolForgeBridge.openOrder(order);
      if (status) {
        status.textContent =
          "Opening SolForge intake for " +
          item.name +
          " (" +
          (order.process === "print_future" ? "3D print" : "plasma") +
          ")…";
      }
      return;
    }

    if (cfg && typeof cfg.beginCheckout === "function") {
      cfg.beginCheckout(item.id, { kind: "merch", name: item.name });
      return;
    }

    if (cfg && cfg.isConfigured() && link) {
      global.location.href = link;
      return;
    }

    if (status) {
      status.textContent = item.name + " — opening checkout…";
    }
    try {
      sessionStorage.setItem(
        "fy_last_order",
        JSON.stringify({ id: item.id, name: item.name, at: Date.now() })
      );
    } catch (_) {}
    global.location.href =
      "checkout-success.html?demo=1&item=" + encodeURIComponent(item.id);
  }

  function highlightHashSku() {
    const hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    const card = document.querySelector('[data-sku="' + hash + '"]');
    if (!card) return;
    card.classList.add("is-spotlight");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function init() {
    if (!data().SHOP_ITEMS) {
      console.error("FlockData missing — check script order on shop.html");
      return;
    }
    renderCatalog();
    renderDesignWall();
    highlightHashSku();
    const tag = el("brand-tagline");
    const { FARM } = data();
    if (tag && FARM) tag.textContent = FARM.tagline + " " + FARM.attribution;
    const status = el("shop-status");
    if (status) {
      status.textContent = "Click a product to preview designs.";
    }
  }

  global.FlockShop = { init, buy, openLightbox };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
