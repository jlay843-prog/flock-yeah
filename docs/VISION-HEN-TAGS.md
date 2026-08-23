# Hen photo match / on-cam name tags — feasibility

## Ask

Detect a chicken in the Nest/Run/Gate stream, match to a still photo, float a name tag above the bird.

## Short answer

**Cool, not free.** Do **not** run this on the public webhost / browser for v1.

| Approach | Cost | Accuracy | Where |
|----------|------|----------|--------|
| Browser TF.js on every viewer | Heavy for phones, burns battery, poor at night | Low | Avoid |
| go2rtc + webhost CPU | Competes with SolForge Next | Low–med | Avoid |
| Jetson / Frigate + YOLO chicken class | One farm GPU box | OK for “a chicken” | Possible |
| Re-ID / photo match to Henrietta vs Pepper | Needs good gallery + lighting | **Often wrong** (similar brown birds) | Optional fun |

Similar-looking hens + dust + night IR means **name tags will mislabel often**. Fun as a *sometimes* Clucky joke (“maybe Pepper?”), not as truth.

## Recommended path (later)

1. **PIN first:** upload clear stills to `assets/hens/photos/{id}.jpg` (Who’s Who + chat avatars).  
2. Keep **area cams** (2–3) — not per-hen video.  
3. Optional Phase 2 on **Jetson**: person/animal detector → “bird blob” → Clucky line, not overlay spam.  
4. Optional Phase 3: multi-frame re-ID with human feedback; never block UX on it.

## Load estimate

Continuous multi-object tracking + re-ID at 640p is **edge AI work**, not a static-site feature. Nest Cam A MP4 already streams; adding vision on the same K12 box risks lagging Next + go2rtc.

**Defer vision tags** until photos exist and one extra camera is stable.
