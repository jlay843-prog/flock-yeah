/**
 * Copy to cam-config.local.js and fill credentials.
 * cam-config.local.js is gitignored — never commit passwords.
 *
 * After enabling RTSP + HTTP in the Reolink app:
 *  1. Prefer snapshotUrl for a quick win (no proxy).
 *  2. Or run go2rtc (see CAM-SETUP.md) and set hlsUrl.
 */
(function (global) {
  "use strict";

  const USER = "admin";
  const PASS = "REPLACE_ME";
  const HOST = "192.168.68.116";

  const local = {
    discovery: {
      host: HOST,
      vendor: "Reolink",
      mac: "EC-71-DB-19-18-56",
      openPorts: [9000],
      notes: "Local override active.",
    },
    streams: {
      henrietta: {
        mode: "snapshot", // snapshot | hls | mjpeg | none
        label: "Test Reolink (local)",
        snapshotUrl:
          "http://" +
          HOST +
          "/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=flockyeah&user=" +
          encodeURIComponent(USER) +
          "&password=" +
          encodeURIComponent(PASS),
        // After go2rtc: mode:"hls", hlsUrl:"http://127.0.0.1:1984/api/stream.m3u8?src=reolink-test"
        rtspHint:
          "rtsp://" + USER + ":" + PASS + "@" + HOST + ":554/h264Preview_01_sub",
        refreshMs: 1500,
      },
    },
    proxyBase: "http://127.0.0.1:1984",
  };

  // Merge over defaults
  const base = global.CamConfig || {};
  global.CamConfig = Object.assign({}, base, local, {
    discovery: Object.assign({}, base.discovery || {}, local.discovery),
    streams: Object.assign({}, base.streams || {}, local.streams),
  });
})(typeof window !== "undefined" ? window : globalThis);
