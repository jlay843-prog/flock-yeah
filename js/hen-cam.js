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
    snapshotTimer: null,
    hls: null,
  };

  function camStream(henId) {
    const cfg = global.CamConfig || {};
    const streams = cfg.streams || {};
    return streams[henId] || null;
  }

  function stopLive() {
    if (state.snapshotTimer) {
      clearInterval(state.snapshotTimer);
      state.snapshotTimer = null;
    }
    if (state.hls) {
      try {
        state.hls.destroy();
      } catch (_) {}
      state.hls = null;
    }
    const vid = el("stage-live-video");
    const img = el("stage-live-img");
    if (vid) {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      vid.hidden = true;
    }
    if (img) {
      img.removeAttribute("src");
      img.hidden = true;
    }
    const stage = el("cam-stage");
    if (stage) stage.classList.remove("has-live");
  }

  function setStreamStatus(text) {
    const s = el("cam-stream-status");
    if (s) s.textContent = text || "";
  }

  function mountLive(henId) {
    stopLive();
    const stream = camStream(henId);
    const statusEl = el("cam-stream-status");
    const stage = el("cam-stage");
    const vid = el("stage-live-video");
    const img = el("stage-live-img");
    const disc = (global.CamConfig && global.CamConfig.discovery) || {};

    if (!stream || !stream.mode || stream.mode === "none") {
      setStreamStatus("");
      return;
    }

    const label = stream.label || "Live feed";
    if (stream.mode === "snapshot" && stream.snapshotUrl) {
      if (img && stage) {
        img.hidden = false;
        stage.classList.add("has-live");
        let fails = 0;
        const onOk = () => {
          fails = 0;
          setStreamStatus("Live · " + label);
        };
        const onFail = () => {
          fails += 1;
          if (fails >= 3) {
            if (state.snapshotTimer) {
              clearInterval(state.snapshotTimer);
              state.snapshotTimer = null;
            }
            setStreamStatus("Cam offline — check back soon.");
          } else {
            setStreamStatus("Reconnecting…");
          }
        };
        img.onload = onOk;
        img.onerror = onFail;
        const tick = () => {
          if (!state.snapshotTimer && fails >= 3) return;
          img.src =
            stream.snapshotUrl +
            (stream.snapshotUrl.indexOf("?") >= 0 ? "&" : "?") +
            "_ts=" +
            Date.now();
        };
        tick();
        state.snapshotTimer = setInterval(tick, stream.refreshMs || 2000);
        setStreamStatus("Connecting…");
      }
      return;
    }

    if (stream.mode === "mjpeg" && stream.mjpegUrl && img && stage) {
      img.hidden = false;
      stage.classList.add("has-live");
      img.src = stream.mjpegUrl;
      setStreamStatus("Live · " + label);
      return;
    }

    const fallBackToStills = (why) => {
      if (!stream.snapshotUrl || !img) {
        setStreamStatus(why || "");
        return;
      }
      stopLive();
      img.hidden = false;
      stage.classList.add("has-live");
      let fails = 0;
      img.onload = () => {
        fails = 0;
        setStreamStatus("Live · " + label);
      };
      img.onerror = () => {
        fails += 1;
        if (fails >= 3 && state.snapshotTimer) {
          clearInterval(state.snapshotTimer);
          state.snapshotTimer = null;
          setStreamStatus("Cam offline — check back soon.");
        }
      };
      const tick = () => {
        img.src =
          stream.snapshotUrl +
          (stream.snapshotUrl.indexOf("?") >= 0 ? "&" : "?") +
          "_ts=" +
          Date.now();
      };
      tick();
      state.snapshotTimer = setInterval(tick, stream.refreshMs || 2000);
      setStreamStatus("Live · " + label);
    };

    // Continuous MP4 / video
    if (
      (stream.mode === "mp4" || stream.mode === "hls" || stream.mode === "video") &&
      stream.mp4Url &&
      vid &&
      stage
    ) {
      vid.hidden = false;
      stage.classList.add("has-live");
      vid.muted = true;
      vid.playsInline = true;
      vid.src = stream.mp4Url;
      const tryPlay = () =>
        vid.play().then(
          () => setStreamStatus("Live · " + label),
          () => setStreamStatus("Live · tap play · " + label)
        );
      vid.onloadeddata = tryPlay;
      vid.onerror = () => {
        // Prefer HLS next if configured
        if (stream.hlsUrl && global.Hls && global.Hls.isSupported()) {
          vid.removeAttribute("src");
          vid.load();
          state.hls = new global.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
          });
          state.hls.loadSource(stream.hlsUrl);
          state.hls.attachMedia(vid);
          state.hls.on(global.Hls.Events.MANIFEST_PARSED, () => {
            tryPlay();
            setStreamStatus("Live · " + label);
          });
          state.hls.on(global.Hls.Events.ERROR, (_evt, data) => {
            if (!data || !data.fatal) return;
            if (data.type === global.Hls.ErrorTypes.NETWORK_ERROR) {
              state.hls.startLoad();
              return;
            }
            if (data.type === global.Hls.ErrorTypes.MEDIA_ERROR) {
              state.hls.recoverMediaError();
              return;
            }
            fallBackToStills("");
          });
        } else {
          fallBackToStills("");
        }
      };
      tryPlay();
      return;
    }

    if (stream.mode === "hls" && stream.hlsUrl && vid && stage) {
      vid.hidden = false;
      stage.classList.add("has-live");
      if (global.Hls && global.Hls.isSupported()) {
        state.hls = new global.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        state.hls.loadSource(stream.hlsUrl);
        state.hls.attachMedia(vid);
        state.hls.on(global.Hls.Events.MANIFEST_PARSED, () => {
          vid.play().catch(() => {});
          setStreamStatus("Live · " + label);
        });
        state.hls.on(global.Hls.Events.ERROR, (_evt, data) => {
          if (!data || !data.fatal) return;
          if (data.type === global.Hls.ErrorTypes.NETWORK_ERROR) {
            state.hls.startLoad();
            return;
          }
          if (data.type === global.Hls.ErrorTypes.MEDIA_ERROR) {
            state.hls.recoverMediaError();
            return;
          }
          fallBackToStills("");
        });
      } else if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = stream.hlsUrl;
        vid.play().catch(() => fallBackToStills(""));
        setStreamStatus("Live · " + label);
      } else if (stream.snapshotUrl) {
        fallBackToStills("");
      } else {
        setStreamStatus("");
      }
      return;
    }

    if (stream.mode === "iframe" && stream.iframeUrl) {
      setStreamStatus("Live · " + label);
      return;
    }

    setStreamStatus("");
  }

  function load() {
    try {
      const eggs = localStorage.getItem(STORAGE_KEYS.eggs);
      state.eggs = eggs != null ? parseInt(eggs, 10) || 0 : seedEggs();
      const sponsor = localStorage.getItem(STORAGE_KEYS.sponsor);
      state.sponsor = sponsor ? JSON.parse(sponsor) : null;
      // Sponsor board is a 24h slot
      if (state.sponsor && state.sponsor.until && Date.now() > state.sponsor.until) {
        state.sponsor = null;
        localStorage.removeItem(STORAGE_KEYS.sponsor);
      }
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
    mountLive(hen.id);
  }

  function renderCommentary(text, opts) {
    const box = el("cam-commentary");
    if (!box) return;
    const line = text || (randomZoneEvent() || {}).text || "Coop ambient: waiting…";
    box.innerHTML = "<strong>Cam commentary</strong>" + escapeHtml(line);
    const ticker = el("live-ticker");
    if (ticker) ticker.textContent = line;
    const o = opts || {};
    if (o.pin && global.FlockEngage) {
      global.FlockEngage.renderPin(line);
    }
  }

  function publishCluckyLine(line, opts) {
    const o = opts || {};
    if (!line) return;
    renderCommentary(line, { pin: true });
    if (o.chat !== false) pushSystemChat(line);
    if (o.bridge && global.FlockEngage) {
      global.FlockEngage.offerGiftBridge(line, pushSystemChat);
    }
  }

  function renderEggs() {
    const n = el("egg-count");
    if (n) n.textContent = String(state.eggs);
  }

  function renderSponsor() {
    const box = el("sponsor-slot");
    if (!box) return;
    if (state.sponsor && state.sponsor.name) {
      const hoursLeft =
        state.sponsor.until != null
          ? Math.max(0, Math.ceil((state.sponsor.until - Date.now()) / 3600000))
          : 24;
      box.innerHTML =
        '<p class="sponsor-live">On the board · ~' +
        hoursLeft +
        "h left</p><strong>" +
        escapeHtml(state.sponsor.name) +
        "</strong>" +
        (state.sponsor.note
          ? "<span>" + escapeHtml(state.sponsor.note) + "</span>"
          : "");
    } else {
      box.innerHTML =
        '<p class="sponsor-live">Sponsor open</p><strong>Your name here</strong><span>24 hours on Nest Cam A’s board — use the form below.</span>';
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

  function queueTreatDispense(gift, hen, demo) {
    if (!global.TreatHook || !gift || !gift.dispense) return null;
    const result = global.TreatHook.requestDispense({
      giftId: gift.id,
      henId: hen ? hen.id : "",
      zone: hen ? hen.zone : "",
      demo: !!demo,
      source: "gift-checkout",
    });
    if (!result.queued) return null;
    state.deskNotes.unshift({
      t: "Treat",
      m: gift.emoji + " " + gift.name + " queued for the coop",
    });
    saveDesk();
    renderDesk();
    return result;
  }

  function recordGiftLocal(gift, hen) {
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
    saveDesk();
    renderGifts();
    renderDesk();
    return line;
  }

  function sendGift(giftId) {
    const gift = GIFTS.find((g) => g.id === giftId);
    if (!gift) return;
    const hen = getHen(state.activeCam);
    pushSystemChat(
      "Opening checkout for " +
        gift.emoji +
        " " +
        gift.name +
        " → " +
        (hen ? hen.name : "the flock") +
        " (" +
        formatMoney(gift.priceCents) +
        ")…"
    );

    const pay = global.PayConfig || global.StripeConfig;
    if (pay && typeof pay.beginCheckout === "function") {
      pay.beginCheckout(giftId, {
        kind: "gift",
        name: gift.emoji + " " + gift.name,
        henId: hen ? hen.id : "",
        priceCents: gift.priceCents,
        method: "chooser",
      });
      return;
    }
    const line = recordGiftLocal(gift, hen);
    pushSystemChat(line + " — noted on the farm desk.");
  }

  /** After checkout-success return — log gift on the board. */
  function completeGiftAfterCheckout(opts) {
    const o = opts || {};
    const gift = GIFTS.find((g) => g.id === o.giftId);
    if (!gift) return null;
    const hen = o.henId ? getHen(o.henId) : getHen(state.activeCam);
    const line = recordGiftLocal(gift, hen);
    pushSystemChat(line + " — thanks from the flock.");
    return { line: line, treat: null };
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

  function persistChatRow(entry) {
    if (!global.FlockEngage) return;
    const rows = global.FlockEngage.loadChat();
    rows.push(entry);
    global.FlockEngage.saveChat(rows);
  }

  function pushChat(role, text, speakerId, opts) {
    const log = el("chat-log");
    if (!log) return;
    const o = opts || {};
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
    if (!o.skipPersist) {
      persistChatRow({
        role: role,
        text: text,
        speakerId: speakerId || (isYou ? "you" : "clucky"),
        at: Date.now(),
      });
    }
  }

  function restoreChat() {
    if (!global.FlockEngage) return;
    const rows = global.FlockEngage.loadChat();
    if (!rows.length) return;
    rows.slice(-24).forEach((r) => {
      pushChat(r.role, r.text, r.speakerId, { skipPersist: true });
    });
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
        state.sponsor = {
          name: name.trim(),
          note: note.trim(),
          at: Date.now(),
          until: Date.now() + 24 * 60 * 60 * 1000,
        };
        saveSponsor();
        renderSponsor();
        state.deskNotes.unshift({
          t: "Sponsor",
          m: name.trim() + " is on the board for 24h.",
        });
        saveDesk();
        renderDesk();
        pushSystemChat(
          "Sponsor board hold: " + name.trim() + ". Opening PayPal/Venmo checkout…"
        );
        const pay = global.PayConfig || global.StripeConfig;
        if (pay && typeof pay.beginCheckout === "function") {
          pay.beginCheckout("sponsor-day", {
            kind: "sponsor",
            name: "Sponsor: " + name.trim(),
            henId: state.activeCam,
            priceCents: 2500,
            method: "chooser",
          });
        }
      });
    }

    const solforgeBtn = el("btn-solforge");
    if (solforgeBtn && global.SolForgeBridge) {
      solforgeBtn.addEventListener("click", () => {
        const hen = getHen(state.activeCam);
        global.SolForgeBridge.openOrder({
          process: "plasma",
          title: (hen ? hen.name : "Flock") + " silhouette — plasma",
          sku: "cam-" + state.activeCam,
          saying: hen ? hen.name : "Flock Yeah",
          designUrl: "designs/plasma/" + state.activeCam + "-plasma.svg",
          materialHint: '1/8" mild steel',
          dimensions: "12in x 10in x 0.125in",
          note: global.SolForgeBridge.plasmaOrderNote(state.activeCam),
        });
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

  function startLiveNestWatch() {
    const henStream = camStream("henrietta");
    const live =
      henStream &&
      henStream.mode &&
      henStream.mode !== "none" &&
      henStream.snapshotUrl &&
      global.CluckyWatch;

    if (!live) {
      simulateCamLife();
      return;
    }

    global.CluckyWatch.start({
      onLine: (data) => {
        publishCluckyLine(data.line, { bridge: true });
      },
      onStatus: (msg) => {
        setStreamStatus(msg);
      },
    });
  }

  function initEngage() {
    if (!global.FlockEngage) return;
    global.FlockEngage.init({
      onChip: (chip) => {
        if (chip.type === "gift") {
          sendGift(chip.id);
          return;
        }
        if (chip.type === "chat") {
          const input = el("chat-input");
          if (input) input.value = chip.text;
          sendChat(chip.text);
        }
      },
      onAnnounce: (line) => {
        publishCluckyLine(line, { bridge: false });
      },
      onGiftCta: () => {
        pushSystemChat("Treat tray's open — pick a gift for the hen on cam.");
      },
    });
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
    restoreChat();
    initEngage();
    startLiveNestWatch();
    if (!el("chat-log") || !el("chat-log").children.length) {
      pushSystemChat(CLUCKY.greetings[0]);
    }
    const brand = el("brand-tagline");
    if (brand) brand.textContent = FARM.tagline + " " + FARM.attribution;

    const banner = el("cam-lan-banner");
    if (banner) {
      banner.hidden = true;
      banner.textContent = "";
    }
  }

  global.HenCam = {
    init,
    getEggCount: () => state.eggs,
    getState: () => state,
    sendGift,
    completeGiftAfterCheckout,
    queueTreatDispense,
    recordGiftLocal,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
