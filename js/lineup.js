/**
 * Flock Yeah — Who's Who jail lineup + lens zoom
 */
(function (global) {
  "use strict";

  const { HENS, FARM } = global.FlockData;

  const state = {
    selected: null,
    zoom: 1.15,
    panX: 50,
    panY: 45,
  };

  function el(id) {
    return document.getElementById(id);
  }

  function renderLineup() {
    const row = el("lineup-row");
    if (!row) return;
    row.innerHTML = HENS.map((h, i) => {
      const height = 160 + (i % 3) * 18;
      return (
        '<button type="button" class="mug' +
        (state.selected === h.id ? " is-selected" : "") +
        '" data-hen="' +
        h.id +
        '" style="--hen:' +
        h.color +
        ";--hen-accent:" +
        h.accent +
        ";--mug-h:" +
        height +
        'px">' +
        '<div class="mug-height">' +
        (14 + i) +
        '"</div>' +
        '<div class="mug-body">' +
        '<span class="mug-mark">' +
        h.mugshot +
        "</span>" +
        "</div>" +
        '<div class="mug-plate">' +
        "<strong>" +
        h.name.toUpperCase() +
        "</strong>" +
        "<span>" +
        h.breed +
        "</span>" +
        "<span>#" +
        String(i + 1).padStart(2, "0") +
        "</span>" +
        "</div>" +
        "</button>"
      );
    }).join("");

    row.querySelectorAll("[data-hen]").forEach((btn) => {
      btn.addEventListener("click", () => selectHen(btn.getAttribute("data-hen")));
    });
  }

  function selectHen(id) {
    state.selected = id;
    state.zoom = 1.35;
    state.panX = 48 + Math.random() * 8;
    state.panY = 40 + Math.random() * 10;
    renderLineup();
    renderLens();
  }

  function renderLens() {
    const hen = global.FlockData.getHen(state.selected) || HENS[0];
    const lens = el("lens-view");
    const meta = el("lens-meta");
    const slider = el("lens-zoom");
    if (lens) {
      lens.style.setProperty("--hen", hen.color);
      lens.style.setProperty("--hen-accent", hen.accent);
      lens.style.setProperty("--zoom", String(state.zoom));
      lens.style.setProperty("--pan-x", state.panX + "%");
      lens.style.setProperty("--pan-y", state.panY + "%");
      lens.classList.toggle("has-subject", !!state.selected);
      const mark = lens.querySelector(".lens-subject");
      if (mark) mark.textContent = hen.mugshot;
    }
    if (meta) {
      meta.innerHTML =
        "<h2>" +
        hen.name +
        "</h2>" +
        "<p class=\"lens-title\">" +
        hen.title +
        " · " +
        hen.breed +
        "</p>" +
        "<p>" +
        hen.bio +
        "</p>" +
        "<blockquote>“" +
        hen.catchphrases[0] +
        "”</blockquote>" +
        '<p class="lens-cam"><a href="hens.html#' +
        hen.id +
        '">Open ' +
        hen.camLabel +
        "</a></p>";
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
    state.selected = HENS[0].id;
    renderLineup();
    renderLens();
    bindControls();
  }

  global.Lineup = { init, selectHen };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
