/**
 * Flock Yeah — PayPal.me + Venmo checkout (SolForge-aligned).
 *
 * Same URL patterns as SolForge src/lib/payments.ts:
 *   PayPal: https://www.paypal.com/paypalme/{user}/{dollars}USD
 *   Venmo:  https://venmo.com/{user}?txn=pay&amount={dollars}&note={note}
 *
 * Do NOT put FLOCK_FARM_SECRET or PayPal client secrets here.
 * Optional overrides: js/pay-config.local.js (gitignored).
 *
 * StripeConfig is legacy — gifts/sponsor should use PayConfig.
 */
(function (global) {
  "use strict";

  const PayConfig = {
    /** Same handles as SolForge PAYPAL_ME_USERNAME / VENMO_USERNAME (no @) */
    paypalMe: "",
    venmoUser: "",
    successPath: "checkout-success.html",
    currency: "usd",
    /** When false, only demo checkout is offered until local config is filled */
    enabled: true,
    notePrefix: "FlockYeah",
    /** Filled by loadFromSolforge() — no manual paste when SolForge rails API is live */
    railsSource: "",
    railsLoadedAt: 0,
    railsError: "",
  };

  function solforgeBase() {
    const farm = (global.FlockData && global.FlockData.FARM) || {};
    const bridge = global.SolForgeBridge;
    return (
      (bridge && bridge.baseUrl) ||
      farm.solforge ||
      "https://solforge.lonetreeacres.com"
    ).replace(/\/$/, "");
  }

  /**
   * Pull public PayPal/Venmo handles from SolForge (same env as /track checkout).
   * local pay-config.local.js wins if already set. Safe CORS on SolForge rails route.
   * @returns {Promise<object|null>}
   */
  PayConfig.loadFromSolforge = function (opts) {
    const o = opts || {};
    const force = !!o.force;
    if (!force && PayConfig.isLiveConfigured() && PayConfig.railsSource === "local") {
      return Promise.resolve({ skipped: true, reason: "local_override" });
    }
    // Prefer same-origin dev proxy when present, else production SolForge
    const candidates = [];
    if (typeof location !== "undefined" && location.origin) {
      candidates.push(location.origin + "/api/solforge/rails");
    }
    candidates.push(solforgeBase() + "/api/payments/rails");

    function tryOne(i) {
      if (i >= candidates.length) {
        PayConfig.railsError = "rails_unreachable";
        return Promise.resolve(null);
      }
      const url = candidates[i];
      return fetch(url, { credentials: "omit", mode: "cors" })
        .then(function (res) {
          if (!res.ok) throw new Error("http_" + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.ok) throw new Error("bad_payload");
          const pp = (data.paypal && data.paypal.me) || "";
          const vn = (data.venmo && data.venmo.username) || "";
          // Local file overrides win unless force
          if (force || !PayConfig.paypalMe) {
            if (pp) PayConfig.paypalMe = pp;
          }
          if (force || !PayConfig.venmoUser) {
            if (vn) PayConfig.venmoUser = vn;
          }
          PayConfig.railsSource = url.indexOf("/api/solforge/") >= 0 ? "proxy" : "solforge";
          PayConfig.railsLoadedAt = Date.now();
          PayConfig.railsError = "";
          return data;
        })
        .catch(function () {
          return tryOne(i + 1);
        });
    }
    return tryOne(0);
  };

  PayConfig.isPaypalConfigured = function () {
    return !!(PayConfig.paypalMe && String(PayConfig.paypalMe).trim());
  };

  PayConfig.isVenmoConfigured = function () {
    return !!(PayConfig.venmoUser && String(PayConfig.venmoUser).trim());
  };

  PayConfig.isLiveConfigured = function () {
    return PayConfig.isPaypalConfigured() || PayConfig.isVenmoConfigured();
  };

  PayConfig.dollarsFromCents = function (cents) {
    const n = Number(cents);
    if (!isFinite(n) || n < 0) return "0.00";
    return (n / 100).toFixed(2);
  };

  PayConfig.buildNote = function (id, meta) {
    const m = meta || {};
    const parts = [PayConfig.notePrefix, id || "gift"];
    if (m.henId) parts.push("hen=" + m.henId);
    if (m.kind && m.kind !== "gift") parts.push(m.kind);
    return parts.join(" ");
  };

  PayConfig.buildPaypalUrl = function (priceCents, note) {
    if (!PayConfig.isPaypalConfigured()) return null;
    const user = String(PayConfig.paypalMe).replace(/^@/, "").trim();
    const d = PayConfig.dollarsFromCents(priceCents);
    // SolForge pattern — amount in path
    return "https://www.paypal.com/paypalme/" + encodeURIComponent(user) + "/" + d + "USD";
  };

  PayConfig.buildVenmoUrl = function (priceCents, note) {
    if (!PayConfig.isVenmoConfigured()) return null;
    const user = String(PayConfig.venmoUser).replace(/^@/, "").trim();
    const d = PayConfig.dollarsFromCents(priceCents);
    const n = encodeURIComponent(note || PayConfig.notePrefix);
    return (
      "https://venmo.com/" +
      encodeURIComponent(user) +
      "?txn=pay&amount=" +
      encodeURIComponent(d) +
      "&note=" +
      n
    );
  };

  PayConfig.urlsForCents = function (priceCents, note) {
    return {
      amountDollars: PayConfig.dollarsFromCents(priceCents),
      paypal: PayConfig.buildPaypalUrl(priceCents, note),
      venmo: PayConfig.buildVenmoUrl(priceCents, note),
    };
  };

  function resolvePriceCents(id, meta) {
    if (meta && meta.priceCents != null) return Number(meta.priceCents);
    const data = global.FlockData || {};
    const gifts = data.GIFTS || [];
    const g = gifts.find(function (x) {
      return x.id === id;
    });
    if (g) return g.priceCents;
    const items = data.SHOP_ITEMS || [];
    const s = items.find(function (x) {
      return x.id === id;
    });
    if (s) return s.priceCents;
    return 0;
  }

  function stashOrder(id, meta, demo, method) {
    const m = meta || {};
    const order = {
      id: id,
      name: m.name || id,
      henId: m.henId || "",
      kind: m.kind || "order",
      priceCents: resolvePriceCents(id, m),
      at: Date.now(),
      demo: !!demo,
      method: method || (demo ? "demo" : "unknown"),
      rail: "paypal-venmo",
    };
    try {
      sessionStorage.setItem("fy_last_order", JSON.stringify(order));
      sessionStorage.setItem(
        (global.FlockEngage && global.FlockEngage.KEYS && global.FlockEngage.KEYS.pending) ||
          "fy_pending_announce_v1",
        JSON.stringify({
          kind: order.kind,
          name: order.name,
          henId: order.henId,
          giftId: order.kind === "gift" ? id : "",
          demo: order.demo,
          method: order.method,
        })
      );
    } catch (_) {}
    return order;
  }

  function goSuccess(id, meta, demo, method) {
    const m = meta || {};
    const base =
      (global.location && global.location.href) ||
      "http://127.0.0.1/hens.html";
    const u = new URL(PayConfig.successPath, base);
    u.searchParams.set("item", id);
    u.searchParams.set("demo", demo ? "1" : "0");
    u.searchParams.set("kind", m.kind || "order");
    u.searchParams.set("method", method || (demo ? "demo" : "paid"));
    if (m.henId) u.searchParams.set("hen", m.henId);
    if (m.name) u.searchParams.set("name", m.name);
    const cents = resolvePriceCents(id, m);
    if (cents) u.searchParams.set("cents", String(cents));
    // Node / test harnesses may lack assignable location
    if (global.location && typeof global.location === "object") {
      try {
        global.location.href = u.toString();
      } catch (_) {
        /* ignore in non-browser */
      }
    }
    return u.toString();
  }

  /**
   * @param {string} id gift or shop id
   * @param {object} [meta]
   * @param {string} [meta.method] "paypal" | "venmo" | "demo" | "chooser"
   */
  PayConfig.beginCheckout = function (id, meta) {
    const m = meta || {};
    // Out-of-stock guard (shop + gifts) — stockMap filled by shop.js / hen-cam
    const stock = PayConfig.stockMap || (global.FlockShop && global.FlockShop._stockMap);
    if (stock && stock[id]) {
      const row = stock[id];
      if (!row.inStock && !row.madeToOrder) {
        const status =
          document.getElementById("shop-status") ||
          document.getElementById("chat-status");
        if (status) {
          status.textContent =
            (m.name || id) + " is out of stock — orders are closed for this item.";
        } else {
          global.alert((m.name || id) + " is out of stock.");
        }
        return { mode: "blocked", reason: "out_of_stock" };
      }
    }
    if (global.FlockShop && typeof global.FlockShop.isOrderable === "function") {
      if (!global.FlockShop.isOrderable(id)) {
        return { mode: "blocked", reason: "out_of_stock" };
      }
    }

    const method = (m.method || "chooser").toLowerCase();
    const priceCents = resolvePriceCents(id, m);
    const note = PayConfig.buildNote(id, m);

    if (method === "demo") {
      const order = stashOrder(id, m, true, "demo");
      goSuccess(id, m, true, "demo");
      return { mode: "demo", order: order };
    }

    if (method === "paypal") {
      const url = PayConfig.buildPaypalUrl(priceCents, note);
      if (!url) {
        return PayConfig.beginCheckout(id, Object.assign({}, m, { method: "chooser" }));
      }
      const order = stashOrder(id, m, false, "paypal");
      global.open(url, "_blank", "noopener,noreferrer");
      // Return path: user confirms paid on success page via "I've paid"
      goSuccess(id, m, false, "paypal");
      return { mode: "paypal", order: order, url: url };
    }

    if (method === "venmo") {
      const url = PayConfig.buildVenmoUrl(priceCents, note);
      if (!url) {
        return PayConfig.beginCheckout(id, Object.assign({}, m, { method: "chooser" }));
      }
      const order = stashOrder(id, m, false, "venmo");
      global.open(url, "_blank", "noopener,noreferrer");
      goSuccess(id, m, false, "venmo");
      return { mode: "venmo", order: order, url: url };
    }

    // chooser
    return PayConfig.showChooser(id, m);
  };

  PayConfig.showChooser = function (id, meta) {
    const m = meta || {};
    const priceCents = resolvePriceCents(id, m);
    const dollars = PayConfig.dollarsFromCents(priceCents);
    const name = m.name || id;

    let overlay = document.getElementById("fy-pay-chooser");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "fy-pay-chooser";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.innerHTML =
        '<div class="fy-pay-card">' +
        '<h3 id="fy-pay-title">Checkout</h3>' +
        '<p class="muted" id="fy-pay-blurb"></p>' +
        '<div class="btn-row" id="fy-pay-actions"></div>' +
        '<p class="muted" style="margin-top:0.75rem;font-size:0.85rem">' +
        "Same rails as SolForge fab checkout (PayPal.me / Venmo). " +
        "Secure checkout via PayPal or Venmo." +
        "</p>" +
        '<button type="button" class="btn" id="fy-pay-cancel" style="margin-top:0.5rem">Cancel</button>' +
        "</div>";
      document.body.appendChild(overlay);
      if (!document.getElementById("fy-pay-chooser-style")) {
        const style = document.createElement("style");
        style.id = "fy-pay-chooser-style";
        style.textContent =
          "#fy-pay-chooser{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:9999;padding:1rem}" +
          "#fy-pay-chooser.is-open{display:flex}" +
          "#fy-pay-chooser .fy-pay-card{background:var(--panel,#1a1f1a);color:inherit;max-width:22rem;width:100%;border-radius:12px;padding:1.25rem;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 40px rgba(0,0,0,.4)}" +
          "#fy-pay-chooser .btn-row{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}";
        document.head.appendChild(style);
      }
    }

    document.getElementById("fy-pay-title").textContent = "Send " + name;
    document.getElementById("fy-pay-blurb").textContent =
      "Amount: $" + dollars + " USD.";

    const actions = document.getElementById("fy-pay-actions");
    actions.innerHTML = "";

    function addBtn(label, cls, method) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn " + (cls || "");
      b.textContent = label;
      b.addEventListener("click", function () {
        close();
        PayConfig.beginCheckout(id, Object.assign({}, m, { method: method }));
      });
      actions.appendChild(b);
    }

    if (PayConfig.isPaypalConfigured()) {
      addBtn("PayPal · $" + dollars, "btn-primary", "paypal");
    }
    if (PayConfig.isVenmoConfigured()) {
      addBtn("Venmo · $" + dollars, "btn-primary", "venmo");
    }
    if (!PayConfig.isLiveConfigured()) {
      addBtn("Continue", "btn-primary", "demo");
      document.getElementById("fy-pay-blurb").textContent =
        "Amount: $" + dollars + " USD. Loading payment options…";
      PayConfig.loadFromSolforge().then(function () {
        if (!overlay.classList.contains("is-open")) return;
        if (PayConfig.isLiveConfigured()) {
          PayConfig.showChooser(id, m);
        }
      });
    }

    function close() {
      overlay.classList.remove("is-open");
    }
    document.getElementById("fy-pay-cancel").onclick = close;
    overlay.onclick = function (e) {
      if (e.target === overlay) close();
    };
    overlay.classList.add("is-open");

    return {
      mode: "chooser",
      order: stashOrder(id, m, true, "chooser"),
      priceCents: priceCents,
    };
  };

  global.PayConfig = PayConfig;

  // Auto-link payment handles from SolForge when the page loads (non-blocking)
  if (typeof document !== "undefined") {
    const boot = function () {
      PayConfig.loadFromSolforge().catch(function () {});
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  // Back-compat: StripeConfig.beginCheckout → PayConfig (no Stripe expansion)
  if (!global.StripeConfig) {
    global.StripeConfig = {
      publishableKey: "",
      paymentLinks: {},
      enabled: false,
      isConfigured: function () {
        return false;
      },
      hasLink: function () {
        return false;
      },
    };
  }
  const prevBegin = global.StripeConfig.beginCheckout;
  global.StripeConfig.beginCheckout = function (id, meta) {
    if (global.PayConfig && typeof global.PayConfig.beginCheckout === "function") {
      return global.PayConfig.beginCheckout(id, meta);
    }
    if (typeof prevBegin === "function") return prevBegin.call(global.StripeConfig, id, meta);
    return { mode: "none" };
  };
})(typeof window !== "undefined" ? window : globalThis);
