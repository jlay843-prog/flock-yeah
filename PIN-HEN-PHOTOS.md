# PINNED — Real names + photos (31 birds)

**Status:** Partial names from Jeff (2026-08-05)  
**Live now:** Named birds + provisional placeholders + stylized SVG portraits  
**Replace anytime:** drop real JPGs + rename remaining provisionals  

## Counts

| | Count |
|--|------:|
| Roosters | 3 (2 named · 1 provisional) |
| Hens | 28 (15 named · 13 provisional) |
| **Total** | **31** |

## Named (Jeff)

**Roosters:** Mac · Whisky · *(third TBD → provisional “Rook”)*  

**Hens:** Cheese · Daisy · George Washington · Red · Yoda · Purple Nightingale · Dirt Diver · Potato · Shadow Fax · Picket Fent · Snowbird · Angel · Dutch Blitz · Lace · Queen Ann  

## Provisional (still random placeholders)

**Rooster:** Rook  

**Hens:** Biscuit, Nugget, Poppy, Wren, Hazel, Cleo, Ginger, Olive, Ruby, Pearl, Sage, Luna, Penny  

## Photos (when ready)

```
assets/hens/photos/{id}.jpg
```

Ids in `js/flock-roster.meta.json` (e.g. `mac.jpg`, `whisky.jpg`, `cheese.jpg`).  
Specs: ≤800px, &lt;150 KB JPG. Site prefers `photoReal`, falls back to SVG.

## Rename a provisional bird

1. Edit `scripts/generate-flock-roster.py` (named lists / provisional list).  
2. `python scripts/generate-flock-roster.py`  
3. Redeploy Flock static.

## Camera plan (production)

| Slot | Name | Role |
|------|------|------|
| **1** | **Coop Cam** (`nest-a`) | Live indoors / nests · `.118` |
| **2** | **Chicken Run** (`run-b`) | Live outdoor run · `.98` |
| **3** | **Want more chickens?** (`donate-c`) | CTA overlay — *donate today* |

- Area cams only — not 31 private streams.  
- Chat still talks to any bird by name.  
