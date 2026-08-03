/**
 * Nest Cam A day-test watcher — polls /api/clucky/tick and posts brief Clucky lines.
 */
(function (global) {
  "use strict";

  const POLL_MS = 20000;

  function startCluckyWatch(hooks) {
    const h = hooks || {};
    const onLine = typeof h.onLine === "function" ? h.onLine : function () {};
    const onStatus = typeof h.onStatus === "function" ? h.onStatus : function () {};
    let timer = null;
    let stopped = false;
    let started = false;

    async function tick(force) {
      if (stopped) return;
      try {
        const url = "/api/clucky/tick" + (force ? "?force=1" : "");
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (data.line) onLine(data);
        else if (data.error) onStatus("Clucky vision: " + data.error);
        else if (data.skipped && data.skipped !== "quiet" && data.skipped !== "cooldown" && data.skipped !== "busy") {
          onStatus("Clucky: " + data.skipped);
        }
      } catch (e) {
        onStatus("");
      }
    }

    async function boot() {
      if (started) return;
      started = true;
      try {
        await fetch("/api/clucky/status", { cache: "no-store" }).then((r) =>
          r.json()
        );
        onStatus("Clucky is watching Nest Cam A");
      } catch (_) {
        onStatus("");
      }
      await tick(true);
      if (!stopped) timer = setInterval(function () { tick(false); }, POLL_MS);
    }

    function stop() {
      stopped = true;
      if (timer) clearInterval(timer);
      timer = null;
    }

    boot();
    return { stop, tick };
  }

  global.CluckyWatch = { start: startCluckyWatch };
})(typeof window !== "undefined" ? window : globalThis);
