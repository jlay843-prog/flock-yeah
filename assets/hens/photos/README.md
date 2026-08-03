# PIN — upload real hen photos (owner action)

**Pinned for Jeff:** drop real photos of each hen here so the site shows them instead of SVG stubs.

## Files (exact names)

| File | Hen |
|------|-----|
| `henrietta.jpg` | Henrietta |
| `scratch.jpg` | Scratch |
| `cluck.jpg` | Cluck Norris |
| `daisy.jpg` | Daisy |
| `pepper.jpg` | Pepper |
| `maple.jpg` | Maple |
| `clucky.jpg` | optional host art |

## Specs (keep it light)

- **JPG or WebP**, square-ish crop of the bird’s face/body  
- **Longest side ≤ 800px**, aim **&lt; 150 KB** each  
- Good daylight, name-clear pose if possible  

## After upload

1. Put files in this folder (repo: `flock-yeah/assets/hens/photos/`).  
2. Redeploy Flock static (`DEPLOY-FLOCK-STATIC` / bundle).  
3. Who’s Who + flock strip will auto-prefer `photoReal` paths; SVG remains fallback.

## Not required for live video tags

Matching a moving bird on cam to these photos (overlay name tags) is a **separate edge vision project** (see `docs/VISION-HEN-TAGS.md`). Photos still power chat avatars, lineup, and merch personality.
