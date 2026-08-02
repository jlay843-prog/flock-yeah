/**
 * Flock Yeah ↔ SolForge bridge
 *
 * Static-safe deep links into https://solforge.lonetreeacres.com/start
 * SolForge IntakeForm reads: from, process, title, note, materialHint,
 * dimensions, quantity, sku, saying, designUrl / svg.
 *
 * Direct browser POST to /api/intake is blocked by CORS and would expose
 * an unauthenticated public intake to abuse — use deep-link (today) or a
 * tiny authenticated proxy later (see SOLFORGE-HOOK.md).
 */
(function (global) {
  "use strict";

  const { FARM } = global.FlockData || {
    FARM: { solforge: "https://solforge.lonetreeacres.com" },
  };

  const SolForgeBridge = {
    baseUrl: (FARM && FARM.solforge) || "https://solforge.lonetreeacres.com",
    startPath: "/start",
    shopPath: "/",
    trackPath: "/track",

    url(path) {
      const base = String(this.baseUrl).replace(/\/$/, "");
      const p = path.startsWith("/") ? path : "/" + path;
      return base + p;
    },

    openShop() {
      global.open(this.url(this.shopPath), "_blank", "noopener,noreferrer");
    },

    openTrack(orderPublicId) {
      const u = new URL(this.url(this.trackPath));
      if (orderPublicId) u.searchParams.set("id", orderPublicId);
      global.open(u.toString(), "_blank", "noopener,noreferrer");
    },

    /**
     * @param {object} order
     * @param {"plasma"|"print_future"|"design_only"|string} order.process
     * @param {string} order.title
     * @param {string} [order.note]
     * @param {string} [order.materialHint]
     * @param {string} [order.dimensions]
     * @param {number} [order.quantity]
     * @param {string} [order.sku]
     * @param {string} [order.saying]
     * @param {string} [order.designUrl] absolute or site-relative path to SVG/PNG
     * @param {boolean} [order.sameTab]
     */
    buildStartUrl(order) {
      const o = order || {};
      const u = new URL(this.url(this.startPath));
      u.searchParams.set("from", "flock-yeah");
      if (o.process) u.searchParams.set("process", o.process);
      if (o.title) u.searchParams.set("title", o.title);
      if (o.note) u.searchParams.set("note", o.note);
      if (o.materialHint) u.searchParams.set("materialHint", o.materialHint);
      if (o.dimensions) u.searchParams.set("dimensions", o.dimensions);
      if (o.quantity) u.searchParams.set("quantity", String(o.quantity));
      if (o.sku) u.searchParams.set("sku", o.sku);
      if (o.saying) u.searchParams.set("saying", o.saying);
      if (o.designUrl) {
        const abs = this.resolveAssetUrl(o.designUrl);
        u.searchParams.set("designUrl", abs);
        u.searchParams.set("svg", abs);
      }
      return u.toString();
    },

    resolveAssetUrl(path) {
      if (!path) return "";
      if (/^https?:\/\//i.test(path)) return path;
      try {
        return new URL(path, global.location.href).toString();
      } catch (_) {
        return path;
      }
    },

    openOrder(order) {
      const href = this.buildStartUrl(order);
      if (order && order.sameTab) {
        global.location.href = href;
      } else {
        global.open(href, "_blank", "noopener,noreferrer");
      }
      return href;
    },

    /** @deprecated use openOrder — kept for hens.html button */
    openCustomMetal(note) {
      return this.openOrder({
        process: "plasma",
        title: "Flock Yeah plasma cut",
        note: note || this.plasmaOrderNote(),
        materialHint: '1/8" mild steel',
        dimensions: "12in x 10in x 0.125in",
      });
    },

    plasmaOrderNote(henId) {
      return (
        "Flock Yeah plasma cut request: hen=" +
        (henId || "flock") +
        " · use designs/plasma SVG silhouette · birds not plates"
      );
    },

    /**
     * Map a Flock shop item (+ optional design) into a SolForge start order.
     */
    orderFromShopItem(item, design) {
      if (!item) return null;
      const saying = design && design.saying ? design.saying : item.name;
      const art =
        (design && design.art) ||
        item.image ||
        "designs/merch/flock-yeah-classic.svg";

      if (item.kind === "solforge" || item.fabricate === "plasma") {
        return {
          process: "plasma",
          title: item.name + " — plasma",
          sku: item.id,
          saying: saying,
          designUrl: art.indexOf("plasma") >= 0 ? art : "designs/plasma/flock-yeah-mark.svg",
          materialHint: item.materialHint || '1/8" mild steel',
          dimensions: item.dimensions || "12in x 10in x 0.125in",
          quantity: 1,
          note:
            "Plasma-cut Flock Yeah design. Match merch art / hen silhouette. " +
            "Saying: “" +
            saying +
            "”. Source SVG under designs/plasma or designs/merch.",
        };
      }

      if (item.fabricate === "print" || item.kind === "print3d") {
        return {
          process: "print_future",
          title: item.name + " — 3D print",
          sku: item.id,
          saying: saying,
          designUrl: art,
          materialHint: item.materialHint || "PLA / PETG (X2D)",
          dimensions: item.dimensions || "4in x 4in x 0.25in",
          quantity: 1,
          note:
            "3D-print Flock Yeah design (X2D queue). Relief / keychain / desk toy inspired by: “" +
            saying +
            "”. Attach or fetch design reference URL.",
        };
      }

      // Default: open as custom fab brief
      return {
        process: item.process || "plasma",
        title: item.name,
        sku: item.id,
        saying: saying,
        designUrl: art,
        note: item.blurb || item.name,
        materialHint: item.materialHint || "",
        dimensions: item.dimensions || "",
      };
    },

    async chat(_speakerId, _userText) {
      return null;
    },
  };

  global.SolForgeBridge = SolForgeBridge;
})(typeof window !== "undefined" ? window : globalThis);
