/**
 * Flock Yeah ↔ SolForge bridge (static client)
 * Points gift/shop/plasma orders at solforge.lonetreeacres.com without secrets.
 */
(function (global) {
  "use strict";

  const { FARM } = global.FlockData || { FARM: { solforge: "https://solforge.lonetreeacres.com" } };

  const SolForgeBridge = {
    baseUrl: (FARM && FARM.solforge) || "https://solforge.lonetreeacres.com",
    startPath: "/start",
    shopPath: "/",

    url(path) {
      const base = String(this.baseUrl).replace(/\/$/, "");
      const p = path.startsWith("/") ? path : "/" + path;
      return base + p;
    },

    openShop() {
      global.open(this.url(this.shopPath), "_blank", "noopener,noreferrer");
    },

    openCustomMetal(note) {
      const u = new URL(this.url(this.startPath));
      if (note) u.searchParams.set("from", "flock-yeah");
      if (note) u.searchParams.set("note", note);
      global.open(u.toString(), "_blank", "noopener,noreferrer");
    },

    /** Build a deep-link note for plasma hen cuts */
    plasmaOrderNote(henId) {
      return "Flock Yeah plasma cut request: hen=" + (henId || "flock") + " svg=print/";
    },

    /**
     * Optional chat bridge stub — wire to a farm edge LLM later.
     * @returns {Promise<null|{speaker:string,text:string}>}
     */
    async chat(_speakerId, _userText) {
      return null;
    },
  };

  global.SolForgeBridge = SolForgeBridge;
})(typeof window !== "undefined" ? window : globalThis);
