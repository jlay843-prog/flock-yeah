/**
 * Flock Yeah — visitor engagement (pin, share, chips, notify, hen-of-week, merch bridge)
 */
(function (global) {
  "use strict";

  const { HENS, FARM, STORAGE_KEYS, getHen } = global.FlockData;

  const KEYS = {
    chat: STORAGE_KEYS.chat || "fy_chat_v1",
    pin: "fy_clucky_pin_v1",
    notify: "fy_notify_v1",
    pending: "fy_pending_announce_v1",
  };

  const CHIPS = [
    { label: "Who's nesting?", text: "Who's nesting right now?" },
    { label: "Support the flock", text: "I'd like to support the flock", action: "gift:flock-tip" },
    { label: "What's Coop Cam seeing?", text: "What's Coop Cam seeing?" },
    { label: "Sponsor the coop", text: "How do I sponsor the coop today?", action: "scroll:sponsor" },
  ];

  /** Keyword → shop item id for “wear the bit” */
  const JOKE_SHOP = [
    { re: /garage|box|amazon|truck|cardboard/i, sku: "tee-clucky", label: "Clucky Saw Your Car Tee" },
    { re: /nest|egg|soft rustle/i, sku: "tee-mom", label: "Keep Flocks Mom Tee" },
    { re: /plate|alpr|cop|spy/i, sku: "tee-zero", label: "Zero ALPR Tee" },
    { re: /feeder|snack|mealworm|grain/i, sku: "tee-feeder", label: "Feeder Surveillance Tee" },
    { re: /./, sku: "tee-flock", label: "Flock Yeah Tee" },
  ];

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

  function henOfWeek() {
    const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return HENS[week % HENS.length];
  }

  function shopForLine(line) {
    for (let i = 0; i < JOKE_SHOP.length; i++) {
      if (JOKE_SHOP[i].re.test(line || "")) return JOKE_SHOP[i];
    }
    return JOKE_SHOP[JOKE_SHOP.length - 1];
  }

  /** Drop old LAN/dev chatter that leaked into visitor chat history. */
  function isJunkChatLine(text) {
    const t = String(text || "");
    return (
      /192\.168\./.test(t) ||
      /Test Reolink/i.test(t) ||
      /cam-config\.local/i.test(t) ||
      /npm run dev/i.test(t) ||
      /open ports/i.test(t) ||
      /client port 9000/i.test(t) ||
      /RTSP\/HTTP/i.test(t) ||
      /go2rtc/i.test(t) ||
      /solforge-secrets/i.test(t) ||
      /Pi Zero/i.test(t) ||
      /LAN test/i.test(t)
    );
  }

  function loadChat() {
    try {
      const rows = JSON.parse(localStorage.getItem(KEYS.chat) || "[]");
      const clean = (rows || []).filter(function (r) {
        return r && !isJunkChatLine(r.text);
      });
      if (clean.length !== (rows || []).length) {
        localStorage.setItem(KEYS.chat, JSON.stringify(clean.slice(-40)));
      }
      return clean;
    } catch (_) {
      return [];
    }
  }

  function saveChat(rows) {
    const clean = (rows || []).filter(function (r) {
      return r && !isJunkChatLine(r.text);
    });
    localStorage.setItem(KEYS.chat, JSON.stringify(clean.slice(-40)));
  }

  function loadPin() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.pin) || "null");
    } catch (_) {
      return null;
    }
  }

  function savePin(line) {
    const row = { line: line, at: Date.now() };
    localStorage.setItem(KEYS.pin, JSON.stringify(row));
    return row;
  }

  function renderPin(line) {
    if (!line) return;
    savePin(line);
    const text = el("clucky-pin-text");
    const pin = el("clucky-pin");
    if (text) text.textContent = line;
    if (pin) pin.hidden = false;
    const wear = el("btn-wear-the-bit");
    if (wear) {
      const hit = shopForLine(line);
      wear.href = "shop.html#" + encodeURIComponent(hit.sku);
      wear.textContent = "Wear the bit · " + hit.label;
      wear.hidden = false;
    }
    const ticker = el("live-ticker");
    if (ticker) ticker.textContent = line;
  }

  async function shareLine() {
    const pin = loadPin();
    const line = (pin && pin.line) || (el("clucky-pin-text") || {}).textContent || "";
    if (!line) return;
    const shareUrl = location.origin + location.pathname + "#cams";
    const payload = { title: "Flock Yeah · Clucky", text: line, url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (_) {}
    try {
      await navigator.clipboard.writeText(line + "\n" + shareUrl);
      const btn = el("btn-share-line");
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(function () {
          btn.textContent = prev;
        }, 1600);
      }
    } catch (_) {
      window.prompt("Copy Clucky's line:", line);
    }
  }

  function renderHenOfWeek() {
    const box = el("hen-of-week");
    if (!box) return;
    const hen = henOfWeek();
    box.innerHTML =
      '<p class="how-kicker">Hen of the week</p>' +
      '<a class="how-card" href="whos-who.html#' +
      hen.id +
      '">' +
      '<img src="' +
      hen.photo +
      '" alt="">' +
      "<div><strong>" +
      escapeHtml(hen.name) +
      "</strong>" +
      "<span>" +
      escapeHtml(hen.role) +
      " · " +
      escapeHtml(hen.mood) +
      "</span>" +
      "<span class=\"muted\">" +
      escapeHtml(hen.bio) +
      "</span></div></a>";
  }

  function renderChips(onChip) {
    const row = el("chat-chips");
    if (!row) return;
    row.innerHTML = CHIPS.map(function (c, i) {
      return (
        '<button type="button" class="chip" data-chip="' +
        i +
        '">' +
        escapeHtml(c.label) +
        "</button>"
      );
    }).join("");
    row.querySelectorAll("[data-chip]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const c = CHIPS[Number(btn.getAttribute("data-chip"))];
        if (!c) return;
        if (c.action && c.action.indexOf("scroll:") === 0) {
          const id = c.action.slice(7);
          const target = el(id);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (c.action && c.action.indexOf("gift:") === 0 && typeof onChip === "function") {
          onChip({ type: "gift", id: c.action.slice(5), text: c.text });
          return;
        }
        if (typeof onChip === "function") onChip({ type: "chat", text: c.text });
      });
    });
  }

  function looksLikeEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  /**
   * Submit notify signup to farm Formspree (same hook as lonetreeacres.com inquiry).
   * Formspree docs: POST JSON with Accept: application/json.
   */
  function postNotifyWebhook(cfg, contact) {
    const url = cfg.notifyWebhook;
    if (!url) return Promise.resolve({ ok: false, skipped: true });

    const isFormspree =
      cfg.notifyProvider === "formspree" || /formspree\.io/i.test(url);
    const message =
      "Flock Yeah — Stay in the loop signup.\n" +
      "Source: flock/hens\n" +
      "Contact: " +
      contact +
      "\n" +
      "Please add to coop cam / Clucky alerts list.\n";

    let headers = { Accept: "application/json" };
    let body;
    if (isFormspree) {
      // Match LTA inquiry fields so Formspree inbox is consistent.
      const payload = {
        _subject: "Flock Yeah — Stay in the loop",
        interest: "Flock Yeah / coop cams",
        source: "flock-yeah-hens",
        message: message,
        contact: contact,
      };
      if (looksLikeEmail(contact)) {
        payload.email = contact;
        payload._replyto = contact;
      } else {
        // Formspree often requires email — use farm inbox as shell, put phone in message.
        payload.email = (FARM && FARM.email) || "jeffrey@lonetreeacres.com";
        payload.phone = contact;
        payload.name = "Flock visitor (phone/SMS)";
      }
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        contact: contact,
        at: Date.now(),
        source: "hens",
      });
    }

    return fetch(url, { method: "POST", headers: headers, body: body }).then(
      function (res) {
        return res.json().catch(function () {
          return {};
        }).then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      }
    );
  }

  function renderNotify() {
    const form = el("notify-form");
    const status = el("notify-status");
    if (!form) return;
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.notify) || "null");
      if (saved && saved.contact && status) {
        status.textContent =
          "You're on the list (" +
          saved.contact +
          "). Coop cam / Clucky alerts when we post them.";
      }
    } catch (_) {}
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const input = el("notify-contact");
      const contact = input && input.value.trim();
      if (!contact) return;
      const row = { contact: contact, at: Date.now(), source: "hens" };
      localStorage.setItem(KEYS.notify, JSON.stringify(row));
      const cfg = global.EngageConfig || {};
      const mail = (FARM && FARM.email) || "jeffrey@lonetreeacres.com";
      const subject = encodeURIComponent("Flock Yeah notify signup");
      const body = encodeURIComponent(
        "Please add me to coop cam / Clucky alerts.\n\nContact: " + contact + "\n"
      );
      const mailBtn = el("notify-mail-jeff");
      if (mailBtn) {
        mailBtn.href = "mailto:" + mail + "?subject=" + subject + "&body=" + body;
      }

      if (status) status.textContent = "Sending to the farm list…";

      postNotifyWebhook(cfg, contact)
        .then(function (result) {
          if (result && result.skipped) {
            if (status) {
              status.textContent =
                "Saved on this device. Optional: email Jeff so it’s on the farm list.";
            }
            if (mailBtn) mailBtn.hidden = false;
            return;
          }
          if (result && result.ok) {
            if (status) {
              status.textContent =
                "You're on the farm list (" +
                contact +
                "). We'll use the same inbox as Lone Tree Acres inquiries.";
            }
            if (mailBtn) mailBtn.hidden = true;
          } else {
            if (status) {
              status.textContent =
                "Saved here, but the farm form didn’t accept it. Try Email Jeff.";
            }
            if (mailBtn) mailBtn.hidden = false;
          }
        })
        .catch(function () {
          if (status) {
            status.textContent =
              "Saved here, but network failed. Try Email Jeff as backup.";
          }
          if (mailBtn) mailBtn.hidden = false;
        });

      if (input) input.value = "";
    });
  }

  function offerGiftBridge(line, pushSystemChat) {
    const offer = el("gift-bridge");
    if (!offer) return;
    const hen = henOfWeek();
    offer.hidden = false;
    offer.innerHTML =
      "<p><strong>Clucky bridge:</strong> Nest Cam A just sparked. Send a treat to " +
      escapeHtml(hen.name) +
      "?</p>" +
      '<div class="btn-row">' +
      '<a class="btn btn-primary" href="#gifts">Support the flock</a>' +
      '<button type="button" class="btn" id="gift-bridge-dismiss">Not now</button>' +
      "</div>";
    const dismiss = el("gift-bridge-dismiss");
    if (dismiss) {
      dismiss.addEventListener("click", function () {
        offer.hidden = true;
      });
    }
    if (typeof pushSystemChat === "function") {
      pushSystemChat(
        "Gift bridge open — treat " + hen.name + " while the bit is hot."
      );
    }
  }

  function consumePendingAnnounce(hooks) {
    const h = hooks || {};
    let pending = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(KEYS.pending) || "null");
      sessionStorage.removeItem(KEYS.pending);
    } catch (_) {}
    const params = new URLSearchParams(location.search);
    if (!pending && params.get("thanks")) {
      pending = {
        kind: params.get("kind") || "order",
        name: params.get("name") || "Your support",
        henId: params.get("hen") || "",
        giftId: params.get("gift") || "",
        demo: params.get("demo") === "1",
      };
    }
    if (!pending) return;
    // Complete gift ERP / local log after pay or demo (not on gift click)
    if (
      pending.giftId &&
      global.HenCam &&
      typeof global.HenCam.completeGiftAfterCheckout === "function"
    ) {
      try {
        global.HenCam.completeGiftAfterCheckout({
          giftId: pending.giftId,
          henId: pending.henId || "",
          demo: !!pending.demo,
          method: pending.method || "",
        });
      } catch (_) {}
    }
    const hen = pending.henId ? getHen(pending.henId) : null;
    const label = hen ? hen.name : "the flock";
    const prefix = pending.demo ? "Thanks for the send: " : "Paid & queued: ";
    const line =
      prefix +
      (pending.name || "your support") +
      " → " +
      label +
      ". Keep flocks for the birds.";
    if (typeof h.onAnnounce === "function") h.onAnnounce(line, pending);
    if (params.get("thanks")) {
      params.delete("thanks");
      params.delete("kind");
      params.delete("name");
      params.delete("hen");
      params.delete("gift");
      params.delete("demo");
      const qs = params.toString();
      history.replaceState({}, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    }
  }

  function bindPinActions(hooks) {
    const h = hooks || {};
    const share = el("btn-share-line");
    if (share) share.addEventListener("click", shareLine);
    const giftBtn = el("btn-gift-from-line");
    if (giftBtn) {
      giftBtn.addEventListener("click", function () {
        const g = el("gifts");
        if (g) g.scrollIntoView({ behavior: "smooth" });
        if (typeof h.onGiftCta === "function") h.onGiftCta();
      });
    }
  }

  function init(hooks) {
    const h = hooks || {};
    renderHenOfWeek();
    renderChips(h.onChip);
    renderNotify();
    bindPinActions(h);
    const saved = loadPin();
    if (saved && saved.line) renderPin(saved.line);
    consumePendingAnnounce(h);
    return {
      renderPin: renderPin,
      offerGiftBridge: offerGiftBridge,
      loadChat: loadChat,
      saveChat: saveChat,
      isJunkChatLine: isJunkChatLine,
      henOfWeek: henOfWeek,
      shopForLine: shopForLine,
      KEYS: KEYS,
    };
  }

  global.FlockEngage = {
    init: init,
    renderPin: renderPin,
    shareLine: shareLine,
    henOfWeek: henOfWeek,
    shopForLine: shopForLine,
    loadChat: loadChat,
    saveChat: saveChat,
    isJunkChatLine: isJunkChatLine,
    KEYS: KEYS,
  };
})(typeof window !== "undefined" ? window : globalThis);
