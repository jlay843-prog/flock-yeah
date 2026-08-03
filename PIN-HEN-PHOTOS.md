# PINNED — Real names + photos (31 birds)

**Status:** Waiting on Jeff  
**Live now:** 31 stylized SVG placeholders (3 roosters · 28 hens)  
**Replace anytime:** drop real JPGs + rename in generator / roster  

## Counts

| | Count |
|--|------:|
| Roosters | 3 |
| Hens | 28 |
| **Total** | **31** |

## Named today (keep or rename)

**Roosters:** Cluck Norris · Sunrise · Russell Crow  
**Hens (featured):** Henrietta · Scratch · Daisy · Pepper · Maple  
**Provisional hens (23):** Biscuit, Nugget, Poppy, Wren, Hazel, Cleo, Ginger, Olive, Ruby, Pearl, Sage, Luna, Penny, Coral, Ivy, Mocha, Zest, Ember, Clover, Freckle, Button, Toffee, Pip  

## Photos (when ready)

```
assets/hens/photos/{id}.jpg
```

Use ids from `js/flock-roster.meta.json` (e.g. `henrietta.jpg`, `sunrise.jpg`, `biscuit.jpg`).  
Specs: ≤800px, &lt;150 KB JPG. Site prefers `photoReal`, falls back to SVG.

## Rename a provisional bird

1. Edit `scripts/generate-flock-roster.py` (provisional list or named lists).  
2. `python scripts/generate-flock-roster.py`  
3. Redeploy Flock static.

## Camera plan (production)

| Slot | Name | Role |
|------|------|------|
| **1** | **Coop Cam** (`nest-a`) | Live indoors / nests |
| **2** | **Chicken Run** (`run-b`) | Live outdoor run (hardware next) |
| **3** | **Want more chickens?** (`donate-c`) | CTA overlay — *donate today* (no hardware) |

- Area cams only — not 31 private streams.  
- Chat still talks to any bird by name.  
- Cam 2 arrives → flip `run-b` to live in `cam-config.js` (same go2rtc path as Coop).
