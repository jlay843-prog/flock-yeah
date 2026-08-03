#!/usr/bin/env python3
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
for name in [
    "hens.html",
    "shop.html",
    "ops.html",
    "whos-who.html",
    "herd.html",
    "checkout-success.html",
]:
    p = root / name
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    if "flock-roster.generated.js" in t:
        print("skip", name)
        continue
    t2, n = re.subn(
        r'<script src="js/flock-data\.js[^"]*"></script>',
        '<script src="js/flock-roster.generated.js?v=flock31"></script>\n  <script src="js/flock-data.js?v=flock31"></script>',
        t,
        count=1,
    )
    p.write_text(t2, encoding="utf-8")
    print("ok" if n else "fail", name)

hens = root / "hens.html"
t = hens.read_text(encoding="utf-8")
t = t.replace("css/hens.css?v=area-cams1", "css/hens.css?v=flock31")
t = t.replace("css/hens.css?v=shop-perf3", "css/hens.css?v=flock31")
t = t.replace("hen-cam.js?v=buf-ahead5", "hen-cam.js?v=flock31")
t = t.replace("hen-cam.js?v=area-cams1", "hen-cam.js?v=flock31")
if "css/hens.css?v=flock31" not in t and 'href="css/hens.css"' in t:
    t = t.replace('href="css/hens.css"', 'href="css/hens.css?v=flock31"')
hens.write_text(t, encoding="utf-8")
print("hens version bump done")
