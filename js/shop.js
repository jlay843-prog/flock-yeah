/**
 * Flock Yeah — shop UI with merch art + lightbox + Stripe/SolForge handoff
 * Images: SVG/instant shell → WebP thumbs (lazy) → full WebP only in lightbox.
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

  /**
   * Map assets/merch/foo.png → optimized WebP paths when present.
   * Thumbs (~480px) for grid; full (~960px) for lightbox.
   */
  function merchVariants(src) {
    const original = String(src || "");
    const m = original.match(/^(?:\.\/)?assets\/merch\/([^/]+)\.(png|jpe?g|webp)$/i);
    if (!m) {
      return { original: original, thumb: original, full: original, hasWebp: false };
    }
    const base = m[1];
    return {
      original: original,
      thumb: "assets/merch/thumbs/" + base + ".webp",
      full: "assets/merch/full/" + base + ".webp",
      hasWebp: true,
    };
  }

  function itemImage(item) {
    if (item.image) return item.image;
    const design =
      item.designId && data().getDesign ? data().getDesign(item.designId) : null;
    return (design && (design.mockup || design.art)) || "";
  }

  function itemArtFallback(item) {
    const design =
      item.designId && data().getDesign ? data().getDesign(item.designId) : null;
    if (design && design.art) return design.art;
    return "designs/merch/flock-yeah-classic.svg";
  }

  /** Progressive card image: optional SVG shell, then WebP thumb (or PNG). */
  function catalogImgHtml(item, index) {
    const raw = itemImage(item);
    const art = itemArtFallback(item);
    const v = merchVariants(raw);
    const eager = index < 6; // first row-ish: fetch soon; rest lazy
    const loading = eager ? "eager" : "lazy";
    const prio = index < 3 ? ' fetchpriority="high"' : "";
    const alt = escapeHtml(item.name);
    const fallbackOnErr =
      "this.onerror=null;this.src='" + escapeHtml(art).replace(/'/g, "\\'") + "'";

    if (!raw) {
      return (
        '<img src="' +
        art +
        '" alt="' +
        alt +
        '" loading="' +
        loading +
        '" decoding="async" class="shop-img is-ready">'
      );
    }

    // WebP thumb for modern browsers; SVG art fallback (never multi-MB PNG in grid)
    if (v.hasWebp) {
      return (
        '<picture class="shop-picture">' +
        '<source srcset="' +
        v.thumb +
        '" type="image/webp">' +
        '<img src="' +
        art +
        '" alt="' +
        alt +
        '" loading="' +
        loading +
        '" decoding="async" width="480" height="480" class="shop-img is-ready"' +
        prio +
        " onerror=\"" +
        fallbackOnErr +
        '" onload="this.classList.add(\'is-ready\')">' +
        "</picture>"
      );
    }

    return (
      '<img src="' +
      raw +
      '" alt="' +
      alt +
      '" loading="' +
      loading +
      '" decoding="async" class="shop-img"' +
      prio +
      " onerror=\"" +
      fallbackOnErr +
      '" onload="this.classList.add(\'is-ready\')">'
    );
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
      '<img id="lb-img" alt="" decoding="async" width="960" height="960">' +
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
    const design = getDesign ? getDesign(designId || item.designId) : null;
    const raw = (design && (design.mockup || design.art)) || itemImage(item);
    const v = merchVariants(raw);
    // Prefer optimized full WebP; fall back to original PNG/SVG
    const imgEl = el("lb-img");
    imgEl.alt = item.name;
    imgEl.onload = function () {
      imgEl.classList.add("is-ready");
    };
    imgEl.onerror = function () {
      // Prefer original only if full webp missing; else SVG art (no multi-MB crawl)
      if (imgEl.dataset.tried !== "1" && raw && raw !== v.full) {
        imgEl.dataset.tried = "1";
        imgEl.src = raw;
        return;
      }
      imgEl.onerror = null;
      imgEl.src = itemArtFallback(item);
      imgEl.classList.add("is-ready");
    };
    imgEl.classList.remove("is-ready");
    delete imgEl.dataset.tried;
    imgEl.src = v.full || raw || itemArtFallback(item);

    el("lb-title").textContent = item.name;
    el("lb-saying").textContent = design ? "“" + design.saying + "”" : "";
    el("lb-blurb").textContent =
      item.blurb +
      (formatMoney ? " · " + formatMoney(item.priceCents) : "") +
      (item.kind === "merch" || item.kind === "apparel" ? " + shipping" : "");

    const thumbs = el("lb-thumbs");
    thumbs.innerHTML = (MERCH_DESIGNS || [])
      .map((d) => {
        const srcRaw = d.mockup || d.art;
        const tv = merchVariants(srcRaw);
        const src = tv.thumb || srcRaw;
        const active = design && d.id === design.id ? " is-active" : "";
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
          '" loading="lazy" decoding="async" width="72" height="72"></button>'
        );
      })
      .join("");

    thumbs.querySelectorAll("[data-design]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openLightbox(itemId, btn.getAttribute("data-design"));
      });
    });

    const buyBtn = el("lb-buy");
    buyBtn.dataset.itemId = itemId;
    const ok = isOrderable(itemId);
    buyBtn.disabled = !ok;
    buyBtn.textContent = ok ? "Get it" : "Out of stock";
    buyBtn.onclick = () => {
      if (!isOrderable(itemId)) return;
      closeLightbox();
      buy(itemId);
    };

    box.classList.add("is-open");
  }

  function renderCatalog() {
    const grid = el("shop-grid");
    const { SHOP_ITEMS, getDesign, formatMoney } = data();
    if (!grid || !SHOP_ITEMS) return;

    grid.innerHTML = SHOP_ITEMS.map((item, index) => {
      const design = item.designId && getDesign ? getDesign(item.designId) : null;
      const saying = design
        ? '<p class="shop-saying">“' + escapeHtml(design.saying) + "”</p>"
        : "";
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
        catalogImgHtml(item, index) +
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
        (item.kind === "merch" || item.kind === "apparel"
          ? '<span class="muted"> + shipping</span>'
          : "") +
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
    wall.innerHTML = MERCH_DESIGNS.map((d, index) => {
      const raw = d.mockup || d.art;
      const v = merchVariants(raw);
      const src = v.thumb || raw;
      const art = d.art || "designs/merch/flock-yeah-classic.svg";
      const loading = index < 4 ? "eager" : "lazy";
      const alt = escapeHtml(d.saying);
      const media = v.hasWebp
        ? '<div class="design-media"><picture>' +
          '<source srcset="' +
          v.thumb +
          '" type="image/webp">' +
          '<img src="' +
          art +
          '" alt="' +
          alt +
          '" loading="' +
          loading +
          '" decoding="async" class="shop-img is-ready" onload="this.classList.add(\'is-ready\')">' +
          "</picture></div>"
        : '<div class="design-media"><img src="' +
          src +
          '" alt="' +
          alt +
          '" loading="' +
          loading +
          '" decoding="async" class="shop-img" onload="this.classList.add(\'is-ready\')"></div>';
      return (
        '<figure class="design-tile" data-design="' +
        d.id +
        '">' +
        media +
        "<figcaption><strong>" +
        escapeHtml(d.saying) +
        "</strong><span>" +
        escapeHtml(d.sub || "") +
        "</span></figcaption>" +
        "</figure>"
      );
    }).join("");
  }

  /** @type {Record<string, { inStock?: boolean, madeToOrder?: boolean, label?: string, available?: number }>} */
  let stockMap = {};

  function stockUrl() {
    const base =
      (global.FlockData && global.FlockData.FARM && global.FlockData.FARM.solforge) ||
      "https://solforge.lonetreeacres.com";
    return String(base).replace(/\/$/, "") + "/api/shop/stock";
  }

  function isOrderable(itemId) {
    const row = stockMap[itemId];
    if (!row) {
      // Unknown / stock API down — allow made-to-order kinds only offline-safe
      const item = (data().SHOP_ITEMS || []).find((i) => i.id === itemId);
      if (
        item &&
        (item.kind === "solforge" ||
          item.kind === "print3d" ||
          item.fabricate === "plasma" ||
          item.fabricate === "print")
      ) {
        return true;
      }
      // Physical merch: fail closed when we have loaded stock and SKU missing → treat as OOS
      if (stockMap && Object.keys(stockMap).length && item) return false;
      return true;
    }
    return Boolean(row.inStock || row.madeToOrder);
  }

  function stockLabel(itemId) {
    const row = stockMap[itemId];
    if (!row) return "";
    return row.label || (row.inStock ? "In stock" : "Out of stock");
  }

  function applyStockToDom() {
    const cards = document.querySelectorAll(".shop-card[data-sku]");
    cards.forEach((card) => {
      const sku = card.getAttribute("data-sku");
      const orderable = isOrderable(sku);
      const label = stockLabel(sku) || (orderable ? "" : "Out of stock");
      card.classList.toggle("is-oos", !orderable);
      card.setAttribute("data-stock", orderable ? "in" : "out");
      let badge = card.querySelector(".shop-stock-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "shop-stock-badge";
        card.appendChild(badge);
      }
      badge.textContent = label;
      badge.hidden = !label;
      const buyBtn = card.querySelector("[data-buy]");
      if (buyBtn) {
        buyBtn.disabled = !orderable;
        buyBtn.setAttribute("aria-disabled", orderable ? "false" : "true");
        buyBtn.textContent = orderable ? "Get it" : "Out of stock";
        buyBtn.classList.toggle("btn-primary", orderable);
        buyBtn.classList.toggle("btn-disabled", !orderable);
      }
      const title = card.querySelector("h3");
      if (title) title.classList.toggle("is-struck", !orderable);
    });
    // Lightbox buy
    const lbBuy = el("lb-buy");
    if (lbBuy && lbBuy.dataset.itemId) {
      const ok = isOrderable(lbBuy.dataset.itemId);
      lbBuy.disabled = !ok;
      lbBuy.textContent = ok ? "Get it" : "Out of stock";
    }
  }

  async function loadStock() {
    try {
      const res = await fetch(stockUrl(), { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.ok || !json.items) return;
      stockMap = json.items;
      if (global.PayConfig) global.PayConfig.stockMap = stockMap;
      global.FlockShop = global.FlockShop || {};
      global.FlockShop._stockMap = stockMap;
      applyStockToDom();
      const status = el("shop-status");
      if (status) {
        const oos = Object.values(stockMap).filter(
          (r) => r && !r.inStock && !r.madeToOrder
        ).length;
        status.textContent =
          oos > 0
            ? "Greyed items are out of stock — restock package is with farm ops. Made-to-order metal/3D still open."
            : "Click a product to preview designs.";
      }
    } catch (_) {
      /* offline: leave cards orderable */
    }
  }

  function buy(itemId) {
    const { SHOP_ITEMS } = data();
    const item = (SHOP_ITEMS || []).find((i) => i.id === itemId);
    if (!item) return;
    const status = el("shop-status");

    if (!isOrderable(itemId)) {
      if (status) {
        status.textContent =
          item.name + " is out of stock. We cannot take orders until restocked.";
      }
      return;
    }

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
    if (status) status.textContent = "Loading stock…";
    loadStock();
  }

  global.FlockShop = {
    init: init,
    buy: buy,
    openLightbox: openLightbox,
    loadStock: loadStock,
    isOrderable: isOrderable,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
