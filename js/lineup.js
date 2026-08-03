/**
 * Flock Yeah — Who's Who jail lineup + lens zoom (hens or horses)
 */
(function (global) {
  "use strict";

  const { HENS, HORSES, FARM } = global.FlockData;
  const mode = (document.body && document.body.dataset.lineup) || "hens";
  const roster = mode === "horses" ? HORSES : HENS;

  const state = {
    selected: null,
    zoom: 1.15,
    panX: 50,
    panY: 45,
  };

  function el(id) {
    return document.getElementById(id);
  }

  function getSubject(id) {
    if (mode === "horses") return HORSES.find((h) => h.id === id) || HORSES[0];
    return global.FlockData.getHen(id) || HENS[0];
  }

  function renderLineup() {
    const row = el("lineup-row");
    if (!row) return;
    row.innerHTML = roster
      .map((h, i) => {
        const height = 160 + (i % 3) * 18;
        const color = h.color || "#047857";
        const accent = h.accent || "#d97706";
        const plateSub = h.breed || h.role || "";
        const mark = h.mugshot || h.name.slice(0, 1);
        const real =
          (global.FlockData.henPhotoSrc && global.FlockData.henPhotoSrc(h)) ||
          h.photo;
        const fallback =
          (global.FlockData.henPhotoFallback &&
            global.FlockData.henPhotoFallback(h)) ||
          h.photo;
        const photo = real
          ? '<img src="' +
            real +
            '" alt="" onerror="this.onerror=null;this.src=\'' +
            fallback +
            "'\">"
          : '<span class="mug-mark">' + mark + "</span>";
        return (
          '<button type="button" class="mug' +
          (state.selected === h.id ? " is-selected" : "") +
          '" data-id="' +
          h.id +
          '" style="--hen:' +
          color +
          ";--hen-accent:" +
          accent +
          ";--mug-h:" +
          height +
          'px">' +
          '<div class="mug-height">' +
          (14 + i) +
          (mode === "horses" ? " hh" : '"') +
          "</div>" +
          '<div class="mug-body">' +
          photo +
          "</div>" +
          '<div class="mug-plate">' +
          "<strong>" +
          h.name.toUpperCase() +
          "</strong>" +
          "<span>" +
          plateSub +
          "</span>" +
          "<span>#" +
          String(i + 1).padStart(2, "0") +
          "</span>" +
          "</div>" +
          "</button>"
        );
      })
      .join("");

    row.querySelectorAll("[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => selectSubject(btn.getAttribute("data-id")));
    });
  }

  function selectSubject(id) {
    state.selected = id;
    state.zoom = 1.35;
    state.panX = 48 + Math.random() * 8;
    state.panY = 40 + Math.random() * 10;
    renderLineup();
    renderLens();
  }

  function renderLens() {
    const sub = getSubject(state.selected || roster[0].id);
    const lens = el("lens-view");
    const meta = el("lens-meta");
    const slider = el("lens-zoom");
    if (lens) {
      lens.style.setProperty("--hen", sub.color || "#047857");
      lens.style.setProperty("--hen-accent", sub.accent || "#d97706");
      lens.style.setProperty("--zoom", String(state.zoom));
      lens.style.setProperty("--pan-x", state.panX + "%");
      lens.style.setProperty("--pan-y", state.panY + "%");
      const mark = lens.querySelector(".lens-subject");
      if (mark) {
        if (sub.photo) {
          mark.outerHTML =
            '<img class="lens-subject" src="' +
            sub.photo +
            '" alt="' +
            sub.name +
            '">';
        } else {
          mark.textContent = sub.mugshot || sub.name.slice(0, 1);
          mark.classList.add("lens-subject-fallback");
        }
      }
    }
    if (meta) {
      const title = sub.title || sub.role || "";
      const bio = sub.bio || sub.note || "";
      const quote = sub.catchphrases ? sub.catchphrases[0] : "";
      const link =
        mode === "horses"
          ? ""
          : '<p class="lens-cam"><a href="hens.html#' +
            sub.id +
            '">Open ' +
            (sub.camLabel || "cam") +
            "</a></p>";
      meta.innerHTML =
        "<h2>" +
        sub.name +
        "</h2>" +
        '<p class="lens-title">' +
        title +
        (sub.breed ? " · " + sub.breed : "") +
        (sub.mood ? " · " + sub.mood : "") +
        "</p>" +
        "<p>" +
        bio +
        "</p>" +
        (quote ? "<blockquote>“" + quote + "”</blockquote>" : "") +
        link;
    }
    if (slider && document.activeElement !== slider) {
      slider.value = String(Math.round(state.zoom * 100));
    }
  }

  function bindControls() {
    const slider = el("lens-zoom");
    if (slider) {
      slider.addEventListener("input", () => {
        state.zoom = Math.max(1, Math.min(2.5, Number(slider.value) / 100));
        renderLens();
      });
    }
    const lens = el("lens-view");
    if (lens) {
      lens.addEventListener("pointermove", (e) => {
        if (!state.selected) return;
        const r = lens.getBoundingClientRect();
        state.panX = ((e.clientX - r.left) / r.width) * 100;
        state.panY = ((e.clientY - r.top) / r.height) * 100;
        renderLens();
      });
    }
    const tag = el("brand-tagline");
    if (tag) tag.textContent = FARM.tagline + " " + FARM.attribution;
  }

  function init() {
    state.selected = roster[0].id;
    renderLineup();
    renderLens();
    bindControls();
  }

  global.Lineup = { init, selectSubject };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
