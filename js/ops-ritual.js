/**
 * Weekly ops ritual — checklist in localStorage + stock receive + sponsor activate.
 */
(function (global) {
  "use strict";

  var KEY = "fy_ops_ritual_v1";
  var TOKEN_KEY = "fy_ops_token_v1";

  var ITEMS = [
    { id: "cam", label: "Cam OK — Nest A plays; Run/Gate soon is fine" },
    { id: "paypal", label: "PayPal/Venmo skim — tips & sponsor:Name notes" },
    { id: "restock", label: "Restock draft only if needed; receive package when goods land" },
    { id: "sponsor", label: "Activate any new sponsor on the board" },
    { id: "clucky", label: "Clucky answers one test chat (optional)" },
  ];

  function weekKey() {
    var d = new Date();
    // ISO week-ish: year + week number
    var onejan = new Date(d.getFullYear(), 0, 1);
    var week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + week;
  }

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (raw.week !== weekKey()) return { week: weekKey(), done: {} };
      return raw;
    } catch (e) {
      return { week: weekKey(), done: {} };
    }
  }

  function saveState(st) {
    localStorage.setItem(KEY, JSON.stringify(st));
  }

  function solforgeBase() {
    var f = (global.FlockData && global.FlockData.FARM) || {};
    return (f.solforge || "https://solforge.lonetreeacres.com").replace(/\/$/, "");
  }

  function token() {
    var el = document.getElementById("ops-token");
    var t = (el && el.value) || localStorage.getItem(TOKEN_KEY) || "";
    if (el && el.value) localStorage.setItem(TOKEN_KEY, el.value);
    return t;
  }

  function renderList() {
    var st = loadState();
    var ul = document.getElementById("ritual-list");
    var label = document.getElementById("ritual-week-label");
    if (label) label.textContent = "Week " + st.week;
    if (!ul) return;
    ul.innerHTML = ITEMS.map(function (it) {
      var on = st.done[it.id] ? " checked" : "";
      return (
        "<li><label><input type='checkbox' data-ritual='" +
        it.id +
        "'" +
        on +
        "> " +
        it.label +
        "</label></li>"
      );
    }).join("");
    ul.querySelectorAll("[data-ritual]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var s = loadState();
        s.done[cb.getAttribute("data-ritual")] = cb.checked;
        saveState(s);
        updateStatus();
      });
    });
    updateStatus();
  }

  function updateStatus() {
    var st = loadState();
    var n = ITEMS.filter(function (it) {
      return st.done[it.id];
    }).length;
    var el = document.getElementById("ritual-status");
    if (el) {
      el.textContent =
        n === ITEMS.length
          ? "Ritual complete for " + st.week + " — go touch grass."
          : n + " / " + ITEMS.length + " done this week.";
    }
  }

  function bind() {
    var tag = document.getElementById("brand-tagline");
    if (tag && global.FlockData) {
      tag.textContent = FlockData.FARM.tagline + " " + FlockData.FARM.attribution;
    }
    var tok = document.getElementById("ops-token");
    if (tok) tok.value = localStorage.getItem(TOKEN_KEY) || "";

    document.getElementById("ritual-mark-all").addEventListener("click", function () {
      var s = loadState();
      ITEMS.forEach(function (it) {
        s.done[it.id] = true;
      });
      saveState(s);
      renderList();
    });
    document.getElementById("ritual-reset").addEventListener("click", function () {
      saveState({ week: weekKey(), done: {} });
      renderList();
    });

    var camEl = document.getElementById("ops-cam-status");
    if (camEl && global.CamConfig) {
      var s = (CamConfig.streams && CamConfig.streams["nest-a"]) || {};
      var live = s.mode && s.mode !== "none";
      camEl.textContent = live ? "Nest Cam A · configured live" : "Nest Cam A · offline / none";
    }

    document.getElementById("open-solforge").addEventListener("click", function () {
      if (global.SolForgeBridge) SolForgeBridge.openShop();
      else location.href = solforgeBase();
    });

    document.getElementById("pkg-receive").addEventListener("click", function () {
      var id = (document.getElementById("pkg-id").value || "").trim();
      var status = document.getElementById("pkg-status");
      if (!id) {
        status.textContent = "Enter package id (rp_…)";
        return;
      }
      var t = token();
      if (!t) {
        status.textContent = "Paste farm Bearer token first.";
        return;
      }
      status.textContent = "Receiving…";
      fetch(solforgeBase() + "/api/reorder/package/receive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + t,
        },
        body: JSON.stringify({ packageId: id }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (j) {
          if (!j.ok) {
            status.textContent = "Fail: " + (j.error || "unknown");
            return;
          }
          status.textContent =
            "OK bumped " +
            (j.bumped || []).length +
            " SKUs · reorders " +
            (j.reordersReceived || []).length;
          var s = loadState();
          s.done.restock = true;
          saveState(s);
          renderList();
        })
        .catch(function (e) {
          status.textContent = "Error: " + e.message;
        });
    });

    document.getElementById("sponsor-activate").addEventListener("click", function () {
      var name = (document.getElementById("sponsor-name-ops").value || "").trim();
      var note = (document.getElementById("sponsor-note-ops").value || "").trim();
      var status = document.getElementById("sponsor-ops-status");
      if (!name) {
        status.textContent = "Name required";
        return;
      }
      var headers = { "Content-Type": "application/json" };
      var t = token();
      if (t) headers.Authorization = "Bearer " + t;
      status.textContent = "Saving…";
      fetch(solforgeBase() + "/api/flock/sponsor", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          name: name,
          note: note,
          source: "ops",
          publicClaim: !t,
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (j) {
          if (!j.ok) {
            status.textContent = j.error || "failed";
            return;
          }
          status.textContent = "On board: " + j.sponsor.name + " (~" + j.sponsor.hoursLeft + "h)";
          var s = loadState();
          s.done.sponsor = true;
          saveState(s);
          renderList();
        })
        .catch(function (e) {
          status.textContent = e.message;
        });
    });
  }

  function init() {
    bind();
    renderList();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
