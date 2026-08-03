/**
 * Flock Yeah → Pi Zero treat dispenser + SolForge ERP-lite restock hook.
 *
 * On Mealworm Drop / Scratch Grain checkout:
 *  1) Queue Pi dispense job (localStorage + optional treatDispenseUrl)
 *  2) Notify SolForge inventory consume (default /api/solforge/flock-consume via npm run dev)
 *     → decrements TREAT-* SKUs → syncAutoReorders → reorder-buyer PO drafts
 *
 * SolForge does NOT auto-buy on Amazon today — reorder-buyer emails ops a PO draft.
 */
(function (global) {
  "use strict";

  const QUEUE_KEY = "fy_treat_queue_v1";

  /** gift id → dispenser action */
  const ACTIONS = {
    mealworms: "mealworms",
    "scratch-grain": "scratch",
  };

  function cfg() {
    return global.EngageConfig || {};
  }

  function loadQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }

  function saveQueue(rows) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify((rows || []).slice(-50)));
  }

  function isAutomatable(giftId) {
    return !!ACTIONS[giftId];
  }

  function actionFor(giftId) {
    return ACTIONS[giftId] || null;
  }

  function notifySolforgeErp(job) {
    const c = cfg();
    if (c.solforgeErpEnabled === false) return;
    const url = (c.solforgeConsumeUrl || "/api/solforge/flock-consume").trim();
    if (!url) return;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        giftId: job.giftId,
        henId: job.henId,
        demo: job.demo,
        note: "Flock Yeah gift " + job.giftId,
        source: "treat-hook",
      }),
      keepalive: true,
    })
      .then(function (res) {
        job.erp = res.ok ? "ok" : "error";
        job.erpHttp = res.status;
        return res.json().catch(function () {
          return {};
        });
      })
      .then(function (data) {
        if (data && data.sku) {
          job.erpSku = data.sku;
          job.erpOnHand = data.material && data.material.onHand;
          job.reordersCreated = data.reordersCreated;
        }
        const all = loadQueue();
        const i = all.findIndex(function (r) {
          return r.at === job.at;
        });
        if (i >= 0) {
          all[i] = job;
          saveQueue(all);
        }
      })
      .catch(function (err) {
        job.erp = "error";
        job.erpError = String(err && err.message ? err.message : err);
        const all = loadQueue();
        const i = all.findIndex(function (r) {
          return r.at === job.at;
        });
        if (i >= 0) {
          all[i] = job;
          saveQueue(all);
        }
      });
  }

  /**
   * @returns {{ queued: boolean, action: string|null, mode: "live"|"queued"|"skip", job?: object }}
   */
  function requestDispense(opts) {
    const o = opts || {};
    const giftId = o.giftId;
    const action = actionFor(giftId);
    if (!action) {
      return { queued: false, action: null, mode: "skip" };
    }

    const job = {
      v: 1,
      action: action,
      giftId: giftId,
      henId: o.henId || "",
      zone: o.zone || "",
      demo: !!o.demo,
      at: Date.now(),
      source: o.source || "flock-yeah",
      status: "pending",
    };

    const rows = loadQueue();
    rows.unshift(job);
    saveQueue(rows);

    // Always try SolForge ERP consume (proxy no-ops if secrets missing)
    notifySolforgeErp(job);

    const url = (cfg().treatDispenseUrl || "").trim();
    if (!url) {
      console.info(
        "[treat-hook] Pi queued (no treatDispenseUrl) + ERP notify",
        job.action,
        job.giftId
      );
      return { queued: true, action: action, mode: "queued", job: job };
    }

    const headers = { "Content-Type": "application/json" };
    if (cfg().treatDispenseHeader && cfg().treatDispenseHeaderValue) {
      headers[cfg().treatDispenseHeader] = cfg().treatDispenseHeaderValue;
    }

    fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(job),
      mode: "cors",
      keepalive: true,
    })
      .then(function (res) {
        job.status = res.ok ? "sent" : "error";
        job.http = res.status;
        const all = loadQueue();
        if (all[0] && all[0].at === job.at) {
          all[0] = job;
          saveQueue(all);
        }
      })
      .catch(function (err) {
        job.status = "error";
        job.error = String(err && err.message ? err.message : err);
        const all = loadQueue();
        if (all[0] && all[0].at === job.at) {
          all[0] = job;
          saveQueue(all);
        }
      });

    return { queued: true, action: action, mode: "live", job: job };
  }

  function pendingCount() {
    return loadQueue().filter(function (j) {
      return j.status === "pending" || j.status === "error";
    }).length;
  }

  global.TreatHook = {
    ACTIONS: ACTIONS,
    QUEUE_KEY: QUEUE_KEY,
    isAutomatable: isAutomatable,
    actionFor: actionFor,
    requestDispense: requestDispense,
    loadQueue: loadQueue,
    pendingCount: pendingCount,
  };
})(typeof window !== "undefined" ? window : globalThis);
