/**
 * Flock Yeah — multi-cam UI, zone commentary, egg counter, farm desk, gifts, sponsor, chat
 */
(function (global) {
  "use strict";

  const {
    HENS,
    CLUCKY,
    GIFTS,
    FARM,
    STORAGE_KEYS,
    formatMoney,
    randomZoneEvent,
    getHen,
  } = global.FlockData;

  const state = {
    activeCam: HENS[0].id,
    chatTarget: "clucky",
    eggs: 0,
    sponsor: null,
    deskNotes: [],
    giftLog: [],
  };

  function load() {
    try {
      const eggs = localStorage.getItem(STORAGE_KEYS.eggs);
      state.eggs = eggs != null ? parseInt(eggs, 10) || 0 : seedEggs();
      const sponsor = localStorage.getItem(STORAGE_KEYS.sponsor);
      state.sponsor = sponsor ? JSON.parse(sponsor) : null;
      const desk = localStorage.getItem(STORAGE_KEYS.desk);
      state.deskNotes = desk ? JSON.parse(desk) : defaultDesk();
      const gifts = localStorage.getItem(STORAGE_KEYS.gifts);
      state.giftLog = gifts ? JSON.parse(gifts) : [];
    } catch (_) {
      state.eggs = seedEggs();
      state.deskNotes = defaultDesk();
    }
  }

  function seedEggs() {
    const d = new Date();
    return 4 + ((d.getDate() + d.getMonth()) % 5);
  }

  function defaultDesk() {
    return [
      { t: "Clucky", m: "Cams online. Nest A looking productive." },
      { t: "Ops", m: "Waterers topped. Run gate latched." },
      { t: "Mom", m: "Keep flocks for the birds." },
    ];
  }

  function saveEggs() {
    localStorage.setItem(STORAGE_KEYS.eggs, String(state.eggs));
  }
  function saveSponsor() {
    localStorage.setItem(STORAGE_KEYS.sponsor, JSON.stringify(state.sponsor));
  }
  function saveDesk() {
    localStorage.setItem(STORAGE_KEYS.desk, JSON.stringify(state.deskNotes.slice(0, 40)));
  }
  function saveGifts() {
    localStorage.setItem(STORAGE_KEYS.gifts, JSON.stringify(state.giftLog.slice(0, 40)));
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

  function photoFor(speakerId) {
    if (speakerId === "clucky") return CLUCKY.photo;
    const hen = getHen(speakerId);
    return hen ? hen.photo : CLUCKY.photo;
  }

  function renderCams() {
    const grid = el("cam-grid");
    if (!grid) return;
    grid.innerHTML = HENS.map((h) => {
      const active = h.id === state.activeCam ? " is-active" : "";
      return (
        '<button type="button" class="cam-tile' +
        active +
        '" data-hen="' +
        h.id +
        '" style="--hen:' +
        h.color +
        ";--hen-accent:" +
        h.accent +
        '">' +
        '<div class="cam-screen">' +
        '<span class="cam-live">LIVE</span>' +
        '<img src="' +
        h.photo +
        '" alt="' +
        escapeHtml(h.name) +
        '" onerror="this.style.display=\'none\'">' +
        '<span class="cam-hen-mark" aria-hidden="true">' +
        h.mugshot +
        "</span>" +
        '<div class="cam-scanlines"></div>' +
        "</div>" +
        '<div class="cam-meta">' +
        "<strong>" +
        h.name +
        "</strong>" +
        "<span>" +
        h.camLabel +
        " · " +
        h.mood +
        "</span>" +
        "</div>" +
        "</button>"
      );
    }).join("");

    grid.querySelectorAll("[data-hen]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeCam = btn.getAttribute("data-hen");
        state.chatTarget = state.activeCam;
        renderCams();
        renderStage();
        renderChatTabs();
        const hen = getHen(state.activeCam);
        pushSystemChat("Switched to " + (hen ? hen.name : "cam") + ".");
      });
    });
  }

  function renderStage() {
    const hen = getHen(state.activeCam) || HENS[0];
    const stage = el("cam-stage");
    if (!stage) return;
    stage.style.setProperty("--hen", hen.color);
    stage.style.setProperty("--hen-accent", hen.accent);
    const name = el("stage-hen-name");
    const label = el("stage-cam-label");
    const bio = el("stage-hen-bio");
    const mark = el("stage-mark");
    const photo = el("stage-photo");
    if (name) name.textContent = hen.name;
    if (label) label.textContent = hen.camLabel + " · " + hen.role + " · " + hen.mood;
    if (bio) bio.textContent = hen.bio;
    if (mark) mark.textContent = hen.mugshot;
    if (photo) {
      photo.src = hen.photo;
      photo.alt = hen.name;
    }
  }

  function renderCommentary(text) {
    const box = el("cam-commentary");
    if (!box) return;
    const line = text || (randomZoneEvent() || {}).text || "Coop ambient: waiting…";
    box.innerHTML = "<strong>Cam commentary</strong>" + escapeHtml(line);
    const ticker = el("live-ticker");
    if (ticker) ticker.textContent = line;
  }

  function renderEggs() {
    const n = el("egg-count");
    if (n) n.textContent = String(state.eggs);
  }

  function renderSponsor() {
    const box = el("sponsor-slot");
    if (!box) return;
    if (state.sponsor && state.sponsor.name) {
      box.innerHTML =
        '<p class="sponsor-live">Today\'s coop sponsor</p><strong>' +
        escapeHtml(state.sponsor.name) +
        "</strong>" +
        (state.sponsor.note
          ? "<span>" + escapeHtml(state.sponsor.note) + "</span>"
          : "");
    } else {
      box.innerHTML =
        '<p class="sponsor-live">Sponsor open</p><strong>Your name here</strong><span>Support the flock — use the form below.</span>';
    }
  }

  function renderDesk() {
    const list = el("farm-desk-list");
    if (!list) return;
    list.innerHTML = state.deskNotes
      .map(
        (n) =>
          "<li><span class=\"desk-who\">" +
          escapeHtml(n.t) +
          '</span><span class="desk-msg">' +
          escapeHtml(n.m) +
          "</span></li>"
      )
      .join("");
  }

  function renderGifts() {
    const tray = el("gift-tray");
    if (!tray) return;
    tray.innerHTML = GIFTS.map((g) => {
      return (
        '<button type="button" class="gift-btn" data-gift="' +
        g.id +
        '">' +
        '<span class="gift-emoji">' +
        g.emoji +
        "</span>" +
        "<span>" +
        g.name +
        "</span>" +
        "<small>" +
        formatMoney(g.priceCents) +
        "</small>" +
        "</button>"
      );
    }).join("");

    tray.querySelectorAll("[data-gift]").forEach((btn) => {
      btn.addEventListener("click", () => sendGift(btn.getAttribute("data-gift")));
    });

    const log = el("gift-log");
    if (log) {
      log.innerHTML = state.giftLog.length
        ? state.giftLog
            .slice(0, 8)
            .map((g) => "<li>" + escapeHtml(g) + "</li>")
            .join("")
        : "<li class=\"muted\">No gifts yet — be the first snack hero.</li>";
    }
  }

  function sendGift(giftId) {
    const gift = GIFTS.find((g) => g.id === giftId);
    if (!gift) return;
    const hen = getHen(state.activeCam);
    const line =
      gift.emoji +
      " " +
      gift.name +
      " → " +
      (hen ? hen.name : "flock") +
      " (" +
      formatMoney(gift.priceCents) +
      ")";
    state.giftLog.unshift(line);
    saveGifts();
    state.deskNotes.unshift({ t: "Gift", m: line });
    state.deskNotes.unshift({
      t: "Farm desk",
      m: "Queue for Jeff: deliver " + gift.name + " to " + (hen ? hen.zone : "coop"),
    });
    saveDesk();
    renderGifts();
    renderDesk();
    pushSystemChat(line + " — queued on the Farm desk for Jeff.");

    const cfg = global.StripeConfig;
    if (cfg && cfg.isConfigured() && cfg.paymentLinks[giftId]) {
      global.open(cfg.paymentLinks[giftId], "_blank", "noopener,noreferrer");
    }
  }

  function renderChatTabs() {
    const tabs = el("chat-tabs");
    if (!tabs) return;
    const items = [{ id: "clucky", name: "Clucky" }].concat(
      HENS.map((h) => ({ id: h.id, name: h.name }))
    );
    tabs.innerHTML = items
      .map((it) => {
        const on = it.id === state.chatTarget ? " is-active" : "";
        return (
          '<button type="button" class="chat-tab' +
          on +
          '" data-chat="' +
          it.id +
          '">' +
          it.name +
          "</button>"
        );
      })
      .join("");
    tabs.querySelectorAll("[data-chat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.chatTarget = btn.getAttribute("data-chat");
        renderChatTabs();
        updateChatLabel();
      });
    });
    updateChatLabel();
  }

  function updateChatLabel() {
    const label = el("chat-target-label");
    if (!label) return;
    if (state.chatTarget === "clucky") {
      label.textContent = CLUCKY.name + " · " + CLUCKY.title;
    } else {
      const hen = getHen(state.chatTarget);
      label.textContent = hen
        ? hen.name + " · " + hen.role + " · " + hen.mood
        : "";
    }
  }

  function pushChat(role, text, speakerId) {
    const log = el("chat-log");
    if (!log) return;
    const row = document.createElement("div");
    const isYou = role === "you";
    row.className = "chat-row chat-" + (isYou ? "you" : "bot");
    if (isYou) {
      row.innerHTML =
        '<div class="chat-bubble"><strong>You</strong><p>' +
        escapeHtml(text) +
        "</p></div>";
    } else {
      const src = photoFor(speakerId || "clucky");
      row.innerHTML =
        '<img class="chat-avatar" src="' +
        src +
        '" alt="" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="chat-bubble"><strong>' +
        escapeHtml(role) +
        "</strong><p>" +
        escapeHtml(text) +
        "</p></div>";
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function pushSystemChat(text) {
    pushChat("Clucky", text, "clucky");
  }

  async function sendChat(text) {
    const msg = String(text || "").trim();
    if (!msg) return;
    pushChat("you", msg);
    const bridge = global.SolForgeBridge;
    const answer = await global.HenVoice.replyAsync(state.chatTarget, msg, bridge);
    pushChat(answer.speaker, answer.text, state.chatTarget);

    // Self-moderating farm-desk hint: physical action verbs → queue for Jeff
    if (/\b(feed|treat|open|close|clean|refill|check)\b/i.test(msg)) {
      state.deskNotes.unshift({
        t: "Farm desk",
        m: "Chat asked: “" + msg.slice(0, 80) + "” — review before acting.",
      });
      saveDesk();
      renderDesk();
    }
  }

  function bindForms() {
    const chatForm = el("chat-form");
    if (chatForm) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = el("chat-input");
        const v = input ? input.value : "";
        if (input) input.value = "";
        sendChat(v);
      });
    }

    const eggPlus = el("egg-plus");
    const eggMinus = el("egg-minus");
    if (eggPlus) {
      eggPlus.addEventListener("click", () => {
        state.eggs += 1;
        saveEggs();
        renderEggs();
        state.deskNotes.unshift({ t: "Eggs", m: "Counter +1 → " + state.eggs });
        saveDesk();
        renderDesk();
        renderCommentary("Nest zone: egg tally moved to " + state.eggs + ".");
      });
    }
    if (eggMinus) {
      eggMinus.addEventListener("click", () => {
        state.eggs = Math.max(0, state.eggs - 1);
        saveEggs();
        renderEggs();
      });
    }

    const deskForm = el("desk-form");
    if (deskForm) {
      deskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = el("desk-input");
        const v = input && input.value.trim();
        if (!v) return;
        state.deskNotes.unshift({ t: "Desk", m: v });
        if (input) input.value = "";
        saveDesk();
        renderDesk();
      });
    }

    const sponsorForm = el("sponsor-form");
    if (sponsorForm) {
      sponsorForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = (el("sponsor-name") || {}).value || "";
        const note = (el("sponsor-note") || {}).value || "";
        if (!name.trim()) return;
        state.sponsor = { name: name.trim(), note: note.trim(), at: Date.now() };
        saveSponsor();
        renderSponsor();
        state.deskNotes.unshift({
          t: "Sponsor",
          m: name.trim() + " is on the board.",
        });
        saveDesk();
        renderDesk();
        pushSystemChat(
          "Sponsor locked: " + name.trim() + ". Thank you for keeping flocks for the birds."
        );
      });
    }

    const solforgeBtn = el("btn-solforge");
    if (solforgeBtn && global.SolForgeBridge) {
      solforgeBtn.addEventListener("click", () => {
        global.SolForgeBridge.openCustomMetal(
          global.SolForgeBridge.plasmaOrderNote(state.activeCam)
        );
      });
    }
  }

  function simulateCamLife() {
    renderCommentary();
    setInterval(() => {
      const ev = randomZoneEvent();
      renderCommentary(ev.text);
    }, 14000);
  }

  function init() {
    load();
    renderCams();
    renderStage();
    renderEggs();
    renderSponsor();
    renderDesk();
    renderGifts();
    renderChatTabs();
    bindForms();
    simulateCamLife();
    pushSystemChat(CLUCKY.greetings[0]);
    const brand = el("brand-tagline");
    if (brand) brand.textContent = FARM.tagline + " " + FARM.attribution;
  }

  global.HenCam = {
    init,
    getEggCount: () => state.eggs,
    getState: () => state,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
