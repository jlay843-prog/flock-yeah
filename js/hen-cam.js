/**
 * Flock Yeah — multi-cam UI, zone commentary, egg counter, farm desk, gifts, sponsor, chat
 */
(function (global) {
  "use strict";

  const {
    HENS,
    AREA_CAMS,
    CLUCKY,
    GIFTS,
    FARM,
    STORAGE_KEYS,
    formatMoney,
    randomZoneEvent,
    getHen,
    getAreaCam,
    henPhotoSrc,
    henPhotoFallback,
  } = global.FlockData;

  const state = {
    /** Area cam id: nest-a (Coop) | run-b (Run) | donate-c (CTA) */
    activeCam: (AREA_CAMS && AREA_CAMS[0] && AREA_CAMS[0].id) || "nest-a",
    /** Optional hen for gift dedicate / plasma — not a live "room" */
    giftHenId: null,
    flockFilter: "all",
    chatTarget: "clucky",
    eggs: 0,
    sponsor: null,
    deskNotes: [],
    giftLog: [],
    snapshotTimer: null,
    hls: null,
  };

  function camStream(areaId) {
    const cfg = global.CamConfig || {};
    const streams = cfg.streams || {};
    return streams[areaId] || null;
  }

  function photoImgAttrs(hen) {
    const real = henPhotoSrc ? henPhotoSrc(hen) : hen.photo;
    const fallback = henPhotoFallback ? henPhotoFallback(hen) : hen.photo;
    return (
      'src="' +
      real +
      '" alt="' +
      escapeHtml(hen.name) +
      '" onerror="this.onerror=null;this.src=\'' +
      fallback +
      "'\""
    );
  }

  function stopLive() {
    if (state.snapshotTimer) {
      clearInterval(state.snapshotTimer);
      state.snapshotTimer = null;
    }
    if (state._leadTimer) {
      clearInterval(state._leadTimer);
      state._leadTimer = null;
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
    if (stage) {
      stage.classList.remove("has-live");
      stage.classList.remove("has-cta");
    }
    const cta = el("stage-cta");
    if (cta) cta.hidden = true;
  }

  function setStreamStatus(text) {
    const s = el("cam-stream-status");
    if (s) s.textContent = text || "";
  }

  function mountCta(areaId, stream, cam) {
    const stage = el("cam-stage");
    const cta = el("stage-cta");
    const photo = el("stage-photo");
    if (stage) stage.classList.add("has-cta");
    if (photo) photo.hidden = true;
    const headline =
      (stream && stream.headline) ||
      (cam && cam.ctaHeadline) ||
      "Want more chickens?";
    const body =
      (stream && stream.body) ||
      (cam && cam.ctaBody) ||
      "Help grow the flock — donate today.";
    const btn =
      (stream && stream.cta) || (cam && cam.ctaButton) || "Donate today";
    const href =
      (stream && stream.href) || (cam && cam.ctaHref) || "#sponsor";
    const secHref = (stream && stream.secondaryHref) || "#gifts";
    const secCta = (stream && stream.secondaryCta) || "Send a tip";
    if (cta) {
      cta.hidden = false;
      cta.innerHTML =
        '<div class="stage-cta-inner">' +
        '<p class="stage-cta-kicker">Camera 3 · flock expansion</p>' +
        "<h3>" +
        escapeHtml(headline) +
        "</h3>" +
        "<p>" +
        escapeHtml(body) +
        "</p>" +
        '<div class="stage-cta-actions">' +
        '<a class="btn btn-primary" href="' +
        escapeHtml(href) +
        '">' +
        escapeHtml(btn) +
        "</a>" +
        '<a class="btn" href="' +
        escapeHtml(secHref) +
        '">' +
        escapeHtml(secCta) +
        "</a>" +
        "</div>" +
        "</div>";
    }
    setStreamStatus("Support the flock · no live stream on this channel");
  }

  function mountLive(areaId) {
    stopLive();
    const stream = camStream(areaId);
    const cam = getAreaCam ? getAreaCam(areaId) : null;
    const stage = el("cam-stage");
    const vid = el("stage-live-video");
    const img = el("stage-live-img");
    const disc = (global.CamConfig && global.CamConfig.discovery) || {};

    if (
      (stream && stream.mode === "cta") ||
      (cam && cam.kind === "cta")
    ) {
      mountCta(areaId, stream, cam);
      return;
    }

    if (!stream || !stream.mode || stream.mode === "none") {
      setStreamStatus(
        cam && cam.status === "soon"
          ? "Coming soon — camera hardware on the way."
          : ""
      );
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

    // Continuous MP4 — buffer-ahead (~4–5s behind live edge) absorbs camera keyframe hitches
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
      vid.autoplay = true;
      try {
        vid.setAttribute("playsinline", "");
        vid.setAttribute("webkit-playsinline", "");
        vid.preload = "auto";
      } catch (_) {}

      // Play ~4.5s behind the buffered tip so brief stalls don't freeze the picture
      const TARGET_LEAD = 4.5;
      const MAX_LEAD = 9;
      const MIN_START = 3.5;
      let stallTimer = null;
      let recoveries = 0;
      let leadTimer = null;
      let started = false;

      const clearStall = () => {
        if (stallTimer) {
          clearTimeout(stallTimer);
          stallTimer = null;
        }
      };
      const bufferedEnd = () => {
        try {
          if (vid.buffered && vid.buffered.length) {
            return vid.buffered.end(vid.buffered.length - 1);
          }
        } catch (_) {}
        return 0;
      };
      const leadSecs = () => {
        const end = bufferedEnd();
        if (!end) return 0;
        return end - (vid.currentTime || 0);
      };
      const maintainLead = () => {
        const end = bufferedEnd();
        if (end < MIN_START) return;
        const L = leadSecs();
        try {
          if (L < 2.2) {
            // Too close to live edge — step back into buffer (absorbs next hitch)
            const t = Math.max(0, end - TARGET_LEAD);
            if (t + 0.25 < end) vid.currentTime = t;
          } else if (L > MAX_LEAD) {
            // Too far behind — catch up to target lag
            vid.currentTime = Math.max(0, end - TARGET_LEAD);
          }
        } catch (_) {}
      };
      const softRecover = () => {
        if (recoveries >= 5) {
          setStreamStatus("Live · recovering… stills");
          if (leadTimer) clearInterval(leadTimer);
          fallBackToStills("");
          return;
        }
        recoveries += 1;
        setStreamStatus("Live · smoothing…");
        maintainLead();
        vid.play().catch(function () {});
      };

      vid.onwaiting = () => {
        clearStall();
        // Prefer buffer-ahead fix before hard recover
        maintainLead();
        stallTimer = setTimeout(softRecover, 900);
      };
      vid.onstalled = () => {
        clearStall();
        maintainLead();
        stallTimer = setTimeout(softRecover, 700);
      };
      vid.onplaying = () => {
        clearStall();
        recoveries = Math.max(0, recoveries - 1);
        setStreamStatus("Live · " + label);
      };
      vid.onprogress = () => {
        if (!started && bufferedEnd() >= MIN_START) {
          started = true;
          try {
            vid.currentTime = Math.max(0, bufferedEnd() - TARGET_LEAD);
          } catch (_) {}
          vid.play()
            .then(() => setStreamStatus("Live · " + label))
            .catch(() => setStreamStatus("Live · tap play · " + label));
        }
        maintainLead();
      };

      const tryPlay = () => {
        if (bufferedEnd() < MIN_START) {
          setStreamStatus("Live · buffering…");
          return;
        }
        started = true;
        try {
          vid.currentTime = Math.max(0, bufferedEnd() - TARGET_LEAD);
        } catch (_) {}
        return vid.play().then(
          () => setStreamStatus("Live · " + label),
          () => setStreamStatus("Live · tap play · " + label)
        );
      };

      const mp4Src =
        stream.mp4Url +
        (stream.mp4Url.indexOf("?") >= 0 ? "&" : "?") +
        "buf=5";
      vid.src = mp4Src;
      vid.onloadeddata = () => {
        setStreamStatus("Live · buffering…");
        // Give MSE a moment to accumulate before sitting on live edge
        setTimeout(tryPlay, 1200);
      };
      if (leadTimer) clearInterval(leadTimer);
      leadTimer = setInterval(maintainLead, 1000);
      // Store for stopLive cleanup
      state._leadTimer = leadTimer;

      vid.onerror = () => {
        clearStall();
        if (leadTimer) clearInterval(leadTimer);
        if (stream.hlsUrl && global.Hls && global.Hls.isSupported()) {
          vid.removeAttribute("src");
          vid.load();
          state.hls = new global.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 24,
            maxMaxBufferLength: 48,
            backBufferLength: 15,
            liveSyncDurationCount: 4,
            liveMaxLatencyDurationCount: 12,
          });
          state.hls.loadSource(stream.hlsUrl);
          state.hls.attachMedia(vid);
          state.hls.on(global.Hls.Events.MANIFEST_PARSED, () => {
            tryPlay();
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
    return hen ? henPhotoSrc(hen) : CLUCKY.photo;
  }

  function renderCams() {
    const grid = el("cam-grid");
    if (!grid) return;
    const areas = AREA_CAMS || [];
    grid.innerHTML = areas
      .map((c) => {
        const stream = camStream(c.id);
        const isCta =
          c.kind === "cta" || (stream && stream.mode === "cta");
        const live =
          !isCta &&
          stream &&
          stream.mode &&
          stream.mode !== "none" &&
          !stream.comingSoon;
        const active = c.id === state.activeCam ? " is-active" : "";
        const badge = isCta ? "DONATE" : live ? "LIVE" : "SOON";
        const badgeClass = isCta ? "cam-cta" : live ? "cam-live" : "cam-soon";
        return (
          '<button type="button" class="cam-tile cam-tile-area' +
          active +
          (live ? "" : isCta ? " is-cta" : " is-soon") +
          '" data-area="' +
          c.id +
          '" style="--hen:' +
          c.color +
          ";--hen-accent:" +
          c.accent +
          '">' +
          '<div class="cam-screen">' +
          '<span class="' +
          badgeClass +
          '">' +
          badge +
          "</span>" +
          '<div class="cam-area-icon" aria-hidden="true">' +
          escapeHtml(c.short || "Cam") +
          "</div>" +
          '<div class="cam-scanlines"></div>' +
          "</div>" +
          '<div class="cam-meta">' +
          "<strong>" +
          escapeHtml(c.name) +
          "</strong>" +
          "<span>" +
          escapeHtml(c.blurb) +
          "</span>" +
          "</div>" +
          "</button>"
        );
      })
      .join("");

    grid.querySelectorAll("[data-area]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeCam = btn.getAttribute("data-area");
        renderCams();
        renderStage();
        const cam = getAreaCam ? getAreaCam(state.activeCam) : null;
        if (cam && cam.kind === "cta") {
          pushSystemChat(
            "Cam 3: Want more chickens? Donate today — tips and day sponsors grow the flock."
          );
        } else {
          pushSystemChat(
            "Watching " +
              (cam ? cam.name : "area cam") +
              " — flock area, not a private hen booth."
          );
        }
      });
    });

    renderFlockStrip();
  }

  /** Hen portraits — chat / who they are, NOT individual live streams */
  function renderFlockStrip() {
    const strip = el("flock-strip");
    if (!strip) return;
    strip.innerHTML =
      '<p class="flock-strip-label">Meet the flock <span class="muted">(' +
      HENS.length +
      " birds · chat only, not private cams)</span></p>" +
      '<div class="flock-strip-filters" role="group" aria-label="Filter flock">' +
      '<button type="button" class="btn flock-filter' +
      (state.flockFilter === "all" ? " is-active" : "") +
      '" data-ff="all">All</button>' +
      '<button type="button" class="btn flock-filter' +
      (state.flockFilter === "hen" ? " is-active" : "") +
      '" data-ff="hen">Hens</button>' +
      '<button type="button" class="btn flock-filter' +
      (state.flockFilter === "rooster" ? " is-active" : "") +
      '" data-ff="rooster">Roosters</button>' +
      "</div>" +
      '<div class="flock-strip-row">' +
      HENS.filter(function (h) {
        if (!state.flockFilter || state.flockFilter === "all") return true;
        return (h.sex || "hen") === state.flockFilter;
      })
        .map((h) => {
          const on =
            state.giftHenId === h.id || state.chatTarget === h.id ? " is-active" : "";
          const badge = h.provisional
            ? '<span class="flock-chip-tag">TBD</span>'
            : h.sex === "rooster"
              ? '<span class="flock-chip-tag rooster">♂</span>'
              : "";
          return (
            '<button type="button" class="flock-chip' +
            on +
            (h.provisional ? " is-provisional" : "") +
            '" data-hen="' +
            h.id +
            '" style="--hen:' +
            h.color +
            '" title="' +
            escapeHtml(h.role || h.title || "") +
            '">' +
            "<img " +
            photoImgAttrs(h) +
            ' loading="lazy" decoding="async">' +
            "<span>" +
            escapeHtml(h.name) +
            "</span>" +
            badge +
            "</button>"
          );
        })
        .join("") +
      "</div>";

    strip.querySelectorAll("[data-ff]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.flockFilter = btn.getAttribute("data-ff") || "all";
        renderFlockStrip();
      });
    });
    strip.querySelectorAll("[data-hen]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-hen");
        state.giftHenId = id;
        state.chatTarget = id;
        renderFlockStrip();
        renderChatTabs();
        updateChatLabel();
        const hen = getHen(id);
        pushSystemChat(
          "Now chatting with " +
            (hen ? hen.name : "a bird") +
            (hen && hen.provisional ? " (provisional name — farm is still labeling the flock)." : "") +
            ". Cameras stay on the coop areas above."
        );
      });
    });
  }

  function renderStage() {
    const cam =
      (getAreaCam && getAreaCam(state.activeCam)) ||
      (AREA_CAMS && AREA_CAMS[0]) ||
      { id: "nest-a", name: "Coop Cam", blurb: "Coop area", color: "#047857", accent: "#d97706" };
    const stage = el("cam-stage");
    if (!stage) return;
    stage.style.setProperty("--hen", cam.color);
    stage.style.setProperty("--hen-accent", cam.accent);
    const name = el("stage-hen-name");
    const label = el("stage-cam-label");
    const bio = el("stage-hen-bio");
    const mark = el("stage-mark");
    const photo = el("stage-photo");
    if (name) name.textContent = cam.name;
    if (label) {
      if (cam.kind === "cta") {
        label.textContent = "Cam 3 · support overlay · not a live feed";
      } else {
        label.textContent =
          (cam.short || "Area") + " · area camera · birds not private rooms";
      }
    }
    if (bio) bio.textContent = cam.blurb || "";
    if (mark) {
      mark.textContent =
        cam.kind === "cta" ? "♥" : (cam.short || "FY").slice(0, 4);
    }
    if (photo) {
      photo.src = (HENS[0] && HENS[0].photo) || CLUCKY.photo;
      photo.alt = cam.name;
      photo.hidden = cam.kind === "cta";
    }
    mountLive(cam.id);
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
        '<p class="sponsor-live">Sponsor open</p><strong>Your name here</strong>' +
        "<span>24h board · form below or PayPal note <code>sponsor:YourName</code></span>";
    }
  }

  async function loadSponsorFromServer() {
    try {
      const base = (FARM && FARM.solforge) || "https://solforge.lonetreeacres.com";
      const res = await fetch(String(base).replace(/\/$/, "") + "/api/flock/sponsor", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const j = await res.json();
      if (j && j.ok && j.sponsor && j.sponsor.name) {
        state.sponsor = {
          name: j.sponsor.name,
          note: j.sponsor.note || "",
          until: j.sponsor.until,
          at: Date.now(),
        };
        saveSponsor();
        renderSponsor();
      }
    } catch (_) {
      /* local fallback */
    }
  }

  async function pushSponsorToServer(name, note) {
    try {
      const base = (FARM && FARM.solforge) || "https://solforge.lonetreeacres.com";
      await fetch(String(base).replace(/\/$/, "") + "/api/flock/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          note: note || "",
          source: "public-form",
          publicClaim: true,
        }),
      });
    } catch (_) {
      /* ignore */
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
    const hen =
      getHen(state.giftHenId) ||
      (state.chatTarget !== "clucky" ? getHen(state.chatTarget) : null);
    pushSystemChat(
      "Opening support checkout for " +
        gift.emoji +
        " " +
        gift.name +
        (hen ? " (for " + hen.name + ")" : " (whole flock)") +
        " (" +
        formatMoney(gift.priceCents) +
        ")… Funds coop care — not a live dispenser."
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
    pushSystemChat(line + " — thanks for supporting the flock.");
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
    // Clucky + compact select for 31 birds (tabs would overflow)
    const current = state.chatTarget || "clucky";
    const opts =
      '<option value="clucky"' +
      (current === "clucky" ? " selected" : "") +
      ">Clucky (host)</option>" +
      HENS.map(function (h) {
        return (
          '<option value="' +
          h.id +
          '"' +
          (current === h.id ? " selected" : "") +
          ">" +
          (h.sex === "rooster" ? "♂ " : "") +
          h.name +
          (h.provisional ? " · TBD" : "") +
          "</option>"
        );
      }).join("");
    tabs.innerHTML =
      '<label class="chat-pick-label muted">Talk to</label>' +
      '<select id="chat-pick" class="chat-pick" aria-label="Choose Clucky or a bird">' +
      opts +
      "</select>" +
      '<div class="chat-tab-row">' +
      '<button type="button" class="chat-tab' +
      (current === "clucky" ? " is-active" : "") +
      '" data-chat="clucky">Clucky</button>' +
      HENS.filter(function (h) {
        return !h.provisional;
      })
        .slice(0, 8)
        .map(function (h) {
          const on = h.id === current ? " is-active" : "";
          return (
            '<button type="button" class="chat-tab' +
            on +
            '" data-chat="' +
            h.id +
            '">' +
            h.name +
            "</button>"
          );
        })
        .join("") +
      "</div>";
    const pick = el("chat-pick");
    if (pick) {
      pick.addEventListener("change", function () {
        state.chatTarget = pick.value;
        if (pick.value !== "clucky") state.giftHenId = pick.value;
        renderChatTabs();
        updateChatLabel();
      });
    }
    tabs.querySelectorAll("[data-chat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.chatTarget = btn.getAttribute("data-chat");
        if (state.chatTarget !== "clucky") state.giftHenId = state.chatTarget;
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
    const junk =
      global.FlockEngage.isJunkChatLine ||
      function () {
        return false;
      };
    rows.slice(-24).forEach((r) => {
      if (!r || junk(r.text)) return;
      pushChat(r.role, r.text, r.speakerId, { skipPersist: true });
    });
  }

  function pushSystemChat(text) {
    if (
      global.FlockEngage &&
      typeof global.FlockEngage.isJunkChatLine === "function" &&
      global.FlockEngage.isJunkChatLine(text)
    ) {
      return;
    }
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

    // Public egg +/- removed — owner labor sink; display-only tally if present
    const eggPlus = el("egg-plus");
    const eggMinus = el("egg-minus");
    if (eggPlus) eggPlus.hidden = true;
    if (eggMinus) eggMinus.hidden = true;

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
        pushSponsorToServer(name.trim(), note.trim());
        state.deskNotes.unshift({
          t: "Sponsor",
          m: name.trim() + " is on the board for 24h.",
        });
        saveDesk();
        renderDesk();
        pushSystemChat(
          "Sponsor board: " +
            name.trim() +
            ". Opening PayPal/Venmo — put sponsor:" +
            name.trim() +
            " in the note if paying separately."
        );
        const pay = global.PayConfig || global.StripeConfig;
        if (pay && typeof pay.beginCheckout === "function") {
          pay.beginCheckout("sponsor-day", {
            kind: "sponsor",
            name: "Sponsor: " + name.trim(),
            henId: state.giftHenId || "",
            priceCents: 2500,
            method: "chooser",
          });
        }
      });
    }

    const solforgeBtn = el("btn-solforge");
    if (solforgeBtn && global.SolForgeBridge) {
      solforgeBtn.addEventListener("click", () => {
        const hen =
          getHen(state.giftHenId) ||
          (state.chatTarget !== "clucky" ? getHen(state.chatTarget) : null) ||
          HENS[0];
        global.SolForgeBridge.openOrder({
          process: "plasma",
          title: (hen ? hen.name : "Flock") + " silhouette — plasma",
          sku: "hen-" + (hen ? hen.id : "flock"),
          saying: hen ? hen.name : "Flock Yeah",
          designUrl: "designs/plasma/" + (hen ? hen.id : "flock-yeah") + "-plasma.svg",
          materialHint: '1/8" mild steel',
          dimensions: "12in x 10in x 0.125in",
          note: global.SolForgeBridge.plasmaOrderNote(hen ? hen.id : "flock"),
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
    // Vision/chat tick only when Nest Cam A is live (LAN day-test path)
    const nestStream = camStream("nest-a") || camStream("henrietta");
    const live =
      nestStream &&
      nestStream.mode &&
      nestStream.mode !== "none" &&
      nestStream.snapshotUrl &&
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
        pushSystemChat(
          "Support tray's open — tip the flock fund (not a live snack machine)."
        );
      },
    });
  }

  function init() {
    load();
    renderCams();
    renderStage();
    renderEggs();
    renderSponsor();
    loadSponsorFromServer();
    renderDesk();
    renderGifts();
    renderChatTabs();
    bindForms();
    restoreChat();
    initEngage();
    startLiveNestWatch();
    if (!el("chat-log") || !el("chat-log").children.length) {
      pushSystemChat(CLUCKY.greetings[0]);
      pushSystemChat(
        "Tip: cameras show coop areas (Nest / Run / Gate). Chat tabs still talk to each hen."
      );
    }
    const brand = el("brand-tagline");
    if (brand) brand.textContent = FARM.tagline + " " + FARM.attribution;

    const banner = el("cam-lan-banner");
    if (banner) {
      banner.hidden = true;
      banner.textContent = "";
    }
    const stream = camStream(state.activeCam);
    if (!stream || !stream.mode || stream.mode === "none") {
      const cam = getAreaCam ? getAreaCam(state.activeCam) : null;
      setStreamStatus((cam ? cam.name : "Cam") + " · offline or coming soon");
    }

    const eggNote = el("egg-note");
    if (eggNote) {
      eggNote.textContent = "Farm estimate (not live-weighed).";
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
