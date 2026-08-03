# Hen / rooster assets

| Path | Purpose |
|------|---------|
| `pseudo/*.svg` | Stylized placeholders for all 31 birds (generated) |
| `photos/{id}.jpg` | Real photos when ready (site prefers these) |
| `*.svg` (root) | Legacy featured portraits (still used as fallback art) |
| `clucky.svg` | AI host avatar |

## Replace a placeholder with a real photo

1. Drop `photos/{id}.jpg` (ids in `js/flock-roster.meta.json`).
2. Specs: ≤800px wide, &lt;150 KB JPG.
3. No code change required — roster already points `photoReal` at that path; SVG stays as `onerror` fallback.

## Rename / re-roster

```bash
# edit scripts/generate-flock-roster.py then:
python scripts/generate-flock-roster.py
```

See `PIN-HEN-PHOTOS.md` at repo root.
