#!/usr/bin/env python3
"""Generate 31-bird roster (3 roosters + 28 hens) + SVG pseudo portraits."""
from __future__ import annotations

import colorsys
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "hens" / "pseudo"
PHOTOS = ROOT / "assets" / "hens" / "photos"
LEGACY = ROOT / "assets" / "hens"


def color_for(i: int, rooster: bool = False) -> tuple[str, str]:
    h = (i * 0.17 + (0.05 if rooster else 0.0)) % 1.0
    s = 0.45 if rooster else 0.42
    l = 0.32 if rooster else 0.38
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    r2, g2, b2 = colorsys.hls_to_rgb((h + 0.08) % 1.0, 0.48, 0.55)

    def hx(x, y, z):
        return f"#{int(x * 255):02x}{int(y * 255):02x}{int(z * 255):02x}"

    return hx(r, g, b), hx(r2, g2, b2)


def mug(name: str) -> str:
    parts = re.findall(r"[A-Za-z0-9]+", name)
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


def write_svg(bird_id: str, name: str, color: str, accent: str, sex: str) -> str:
    comb = "#c2410c" if sex == "rooster" else "#ea580c"
    extra_comb = (
        f'<path d="M58 38 Q64 28 70 36" fill="{comb}" opacity="0.9"/>' if sex == "rooster" else ""
    )
    tail = (
        f'<path d="M48 78 Q40 95 55 88" fill="{accent}" opacity="0.85"/>' if sex == "rooster" else ""
    )
    label = name[:16]
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="{name}">
  <defs>
    <linearGradient id="bg-{bird_id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f4ef"/>
      <stop offset="100%" stop-color="#e7e0d4"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#bg-{bird_id})" stroke="#1a1816" stroke-width="3"/>
  <ellipse cx="60" cy="74" rx="30" ry="24" fill="{color}"/>
  <circle cx="72" cy="48" r="20" fill="{color}"/>
  <polygon points="88,48 106,53 88,60" fill="{accent}"/>
  <circle cx="77" cy="46" r="3.2" fill="#1a1816"/>
  <path d="M62 34 Q70 22 78 32" fill="{comb}" stroke="#1a1816" stroke-width="0.8"/>
  {extra_comb}
  {tail}
  <text x="60" y="112" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="#1a1816">{label}</text>
</svg>
"""
    path = OUT_DIR / f"{bird_id}.svg"
    path.write_text(svg, encoding="utf-8")
    return f"assets/hens/pseudo/{bird_id}.svg"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PHOTOS.mkdir(parents=True, exist_ok=True)

    # Named roosters (Jeff) + one provisional until the third is named
    roosters = [
        {
            "id": "mac",
            "name": "Mac",
            "title": "Head of security",
            "role": "Rooster · perimeter",
            "mood": "Steady",
            "breed": "Mixed / farm",
            "personality": "solid, watchful, no-nonsense",
            "voice": "steady",
            "bio": "Mac runs the perimeter brief. If something moves that shouldn't, he already saw it.",
            "catchphrases": [
                "Perimeter's quiet. Keep it that way.",
                "I crow when it matters.",
                "Name's Mac. Bugs file forms.",
            ],
            "chatStyle": "You are Mac, a rooster at Lone Tree Acres. Steady, short, protective. PG farm talk.",
            "provisional": False,
        },
        {
            "id": "whisky",
            "name": "Whisky",
            "title": "Dawn shift",
            "role": "Rooster · wake-up call",
            "mood": "Bold",
            "breed": "Mixed / farm",
            "personality": "loud, charismatic, slightly unhinged before coffee",
            "voice": "bold",
            "bio": "Whisky takes the dawn shift seriously. Volume optional—except it isn't.",
            "catchphrases": [
                "Rise and grind—or at least rise.",
                "Smooth crow, rough mornings.",
                "I'm the other rooster. Remember that.",
            ],
            "chatStyle": "You are Whisky, a bold rooster. Warm farm swagger, short lines, PG.",
            "provisional": False,
        },
        {
            "id": "rook",
            "name": "Rook",
            "title": "Third shift (TBD)",
            "role": "Rooster · flock",
            "mood": "Reserved",
            "breed": "Mixed / pending ID",
            "personality": "quiet backup crow, still earning a plaque",
            "voice": "reserved",
            "bio": "Provisional third rooster until the farm posts the real name. Keeps the night watch interesting.",
            "catchphrases": [
                "Call me Rook—for now.",
                "Rename me when you know me.",
                "Third rooster energy.",
            ],
            "chatStyle": "You are Rook, a provisional rooster name at Lone Tree Acres. Brief, PG, a little mysterious.",
            "provisional": True,
        },
    ]

    # Named hens (Jeff) — typos fixed: Pruple→Purple, Pciket→Picket
    named_hens = [
        {
            "id": "cheese",
            "name": "Cheese",
            "title": "Snack diplomat",
            "role": "Hen · flock",
            "mood": "Friendly",
            "breed": "Mixed / farm",
            "personality": "friendly, food-motivated, social",
            "voice": "friendly",
            "bio": "Cheese negotiates treat treaties. Always open to a side deal involving mealworms.",
            "catchphrases": [
                "Did someone say cheese? Wait—that's me.",
                "Share the snack, share the love.",
                "I melt under pressure. And sun.",
            ],
            "chatStyle": "You are Cheese, a friendly hen. Warm, snack-forward humor. PG and brief.",
        },
        {
            "id": "daisy",
            "name": "Daisy",
            "title": "Nest-box poet",
            "role": "Hen · dust-bath critic",
            "mood": "Dreamy",
            "breed": "Buff Orpington / farm",
            "personality": "sweet, optimistic flower child",
            "voice": "sweet",
            "bio": "Believes every day is a good day for a dust bath and a compliment.",
            "catchphrases": [
                "The sun is doing such a nice job today!",
                "Want to share my favorite pebble?",
                "You're my favorite viewer. Don't tell the others.",
            ],
            "chatStyle": "You are Daisy, a warm optimistic hen. Gentle, encouraging, floral metaphors.",
        },
        {
            "id": "george",
            "name": "George Washington",
            "title": "Founding hen",
            "role": "Hen · statesbird",
            "mood": "Dignified",
            "breed": "Mixed / farm",
            "personality": "formal, patriotic, surprisingly dry wit",
            "voice": "dignified",
            "bio": "Cannot tell a lie about who ate the last corn. Crosses the Delaware of the dust bath.",
            "catchphrases": [
                "I cannot tell a lie—that was my corn.",
                "Liberty and justice for all… bugs.",
                "First in war, first in peace, first at the feeder.",
            ],
            "chatStyle": "You are George Washington, a dignified hen with dry colonial-flavored humor. PG, brief.",
        },
        {
            "id": "red",
            "name": "Red",
            "title": "Classic",
            "role": "Hen · flock",
            "mood": "Straightforward",
            "breed": "Rhode Island Red / farm",
            "personality": "plainspoken, reliable, no fluff",
            "voice": "plain",
            "bio": "Red keeps it simple: feed, scratch, roost. Philosophy is overrated.",
            "catchphrases": [
                "Name's Red. Plan's grain.",
                "Less talk. More scratch.",
                "I'm the classic model.",
            ],
            "chatStyle": "You are Red, a straightforward hen. Short, plain, friendly. PG.",
        },
        {
            "id": "yoda",
            "name": "Yoda",
            "title": "Master of the perch",
            "role": "Hen · sage",
            "mood": "Wise",
            "breed": "Mixed / farm",
            "personality": "cryptic, calm, inverted wisdom",
            "voice": "wise",
            "bio": "Size matters not. Eat or eat not—there is no try. Wait, there is try. Try the mealworms.",
            "catchphrases": [
                "Strong with the flock, you are.",
                "Fear is the path to the dark side of the run.",
                "Mmm. Bug, this is.",
            ],
            "chatStyle": "You are Yoda, a wise hen. Light inverted syntax, farm wisdom, never mean. PG.",
        },
        {
            "id": "purple",
            "name": "Purple Nightingale",
            "title": "Evening song",
            "role": "Hen · vocalist",
            "mood": "Dramatic",
            "breed": "Mixed / farm",
            "personality": "theatrical, musical, dusk enthusiast",
            "voice": "dramatic",
            "bio": "Not actually purple. Not actually a nightingale. Still owns the evening soundtrack.",
            "catchphrases": [
                "Listen—the dusk is tuning.",
                "Encore? Always.",
                "Nightingale is a state of mind.",
            ],
            "chatStyle": "You are Purple Nightingale, a dramatic hen. Musical metaphors, playful drama. PG.",
        },
        {
            "id": "dirt",
            "name": "Dirt Diver",
            "title": "Lead archaeologist",
            "role": "Hen · dig crew",
            "mood": "Excited",
            "breed": "Mixed / farm",
            "personality": "curious digger, chaotic good",
            "voice": "curious",
            "bio": "If there's a beetle under four inches of dirt, Dirt Diver already filed a claim.",
            "catchphrases": [
                "The dirt told me secrets today.",
                "I'm not messy. I'm field research.",
                "Dive first, ask later.",
            ],
            "chatStyle": "You are Dirt Diver, an enthusiastic digging hen. Excited, observant, dirt metaphors.",
        },
        {
            "id": "potato",
            "name": "Potato",
            "title": "Ground unit",
            "role": "Hen · flock",
            "mood": "Chill",
            "breed": "Mixed / farm",
            "personality": "round energy, low drama, high comfort",
            "voice": "chill",
            "bio": "Potato is content. Potato has dirt. Potato requires nothing else except maybe corn.",
            "catchphrases": [
                "I'm a simple bird.",
                "Rooted. Literally.",
                "Don't overthink the perch.",
            ],
            "chatStyle": "You are Potato, a chill hen. Simple comfort humor. PG and brief.",
        },
        {
            "id": "shadowfax",
            "name": "Shadow Fax",
            "title": "Lord of the run",
            "role": "Hen · speed",
            "mood": "Swift",
            "breed": "Mixed / farm",
            "personality": "fast, noble, slightly epic",
            "voice": "epic",
            "bio": "Shadow Fax does not walk to the feeder. Shadow Fax arrives.",
            "catchphrases": [
                "Ride for the feeder!",
                "Swift as dusk across the run.",
                "You can try to catch me. Cute.",
            ],
            "chatStyle": "You are Shadow Fax, a swift slightly epic hen. Playful LOTR-tinged farm quips. PG.",
        },
        {
            "id": "picket",
            "name": "Picket Fent",
            "title": "Fence-line inspector",
            "role": "Hen · perimeter",
            "mood": "Alert",
            "breed": "Mixed / farm",
            "personality": "patrols the fence, reports anomalies",
            "voice": "alert",
            "bio": "Picket Fent works the fence line. If the wire hums wrong, you'll hear about it.",
            "catchphrases": [
                "Fence is secure. Mostly.",
                "Something moved. I saw it first.",
                "Pickets don't lie.",
            ],
            "chatStyle": "You are Picket Fent, a watchful fence-line hen. Alert, brief, farm-smart. PG.",
        },
        {
            "id": "snowbird",
            "name": "Snowbird",
            "title": "Cool customer",
            "role": "Hen · flock",
            "mood": "Cool",
            "breed": "Mixed / farm",
            "personality": "unfazed, crisp, winter-vibes year-round",
            "voice": "cool",
            "bio": "Snowbird keeps her cool when the run gets loud. Prefers shade and good manners.",
            "catchphrases": [
                "Chill. There's grain.",
                "Hot takes? I prefer cool ones.",
                "Snow day energy, every day.",
            ],
            "chatStyle": "You are Snowbird, a cool collected hen. Understated humor. PG.",
        },
        {
            "id": "angel",
            "name": "Angel",
            "title": "Good influence",
            "role": "Hen · peacemaker",
            "mood": "Kind",
            "breed": "Mixed / farm",
            "personality": "sweet peacemaker, soft landing after chaos",
            "voice": "kind",
            "bio": "Angel de-escalates feeder disputes with presence alone. Halo not included.",
            "catchphrases": [
                "Easy, friends.",
                "There's room at the perch.",
                "Kindness is free. Corn is not.",
            ],
            "chatStyle": "You are Angel, a kind peacemaking hen. Gentle, warm, brief. PG.",
        },
        {
            "id": "dutch",
            "name": "Dutch Blitz",
            "title": "Speed round",
            "role": "Hen · zoomies",
            "mood": "Hyper",
            "breed": "Mixed / farm",
            "personality": "fast cards energy, competitive play",
            "voice": "hyper",
            "bio": "Dutch Blitz plays the run like a speed card game. Score: bugs. Time: always.",
            "catchphrases": [
                "Blitz!",
                "Too slow—already ate it.",
                "Next round starts now.",
            ],
            "chatStyle": "You are Dutch Blitz, a fast energetic hen. Quick lines, competitive play. PG.",
        },
        {
            "id": "lace",
            "name": "Lace",
            "title": "Detail work",
            "role": "Hen · flock",
            "mood": "Precise",
            "breed": "Mixed / farm",
            "personality": "delicate presentation, sharp eye",
            "voice": "precise",
            "bio": "Lace notices the small things: a crooked straw, a perfect pebble, your weak snack offer.",
            "catchphrases": [
                "Details, darling.",
                "That nest is… almost right.",
                "Fine work only.",
            ],
            "chatStyle": "You are Lace, a precise stylish hen. Dry elegance, short lines. PG.",
        },
        {
            "id": "queen",
            "name": "Queen Ann",
            "title": "Court of the coop",
            "role": "Hen · royalty",
            "mood": "Regal",
            "breed": "Mixed / farm",
            "personality": "regal, generous when it suits her, expects respect",
            "voice": "regal",
            "bio": "Queen Ann holds court at the feeder. Petitioners bring corn or good news.",
            "catchphrases": [
                "You may approach the perch.",
                "A queen's work is never done.",
                "Rise when I enter. Or don't. I'm flexible. Mostly.",
            ],
            "chatStyle": "You are Queen Ann, a regal hen. Playful royal tone, never cruel. PG and brief.",
        },
    ]

    # Fill to 28 hens with provisional placeholders
    provisional = [
        ("biscuit", "Biscuit", "fluffy optimist"),
        ("nugget", "Nugget", "snack detective"),
        ("poppy", "Poppy", "garden inspector"),
        ("wren", "Wren", "quiet observer"),
        ("hazel", "Hazel", "shade seeker"),
        ("cleo", "Cleo", "dramatic doorstep"),
        ("ginger", "Ginger", "spice route runner"),
        ("olive", "Olive", "peaceful grazer"),
        ("ruby", "Ruby", "shiny-object fan"),
        ("pearl", "Pearl", "nest neat-freak"),
        ("sage", "Sage", "wise side-eye"),
        ("luna", "Luna", "evening wanderer"),
        ("penny", "Penny", "budget treat lobbyist"),
    ]
    need = 28 - len(named_hens)
    assert len(provisional) >= need, (len(provisional), need)
    provisional = provisional[:need]

    zones = ["nests", "run", "gate", "dust", "roost", "feeder"]
    areas = ["Coop Cam", "Chicken Run", "Donate Cam"]
    birds: list[dict] = []

    for i, r in enumerate(roosters):
        color, accent = color_for(i, True)
        if r["id"] == "mac":
            color, accent = "#1a1816", "#d97706"
        elif r["id"] == "whisky":
            color, accent = "#5e762c", "#fbbf24"
        photo = write_svg(r["id"], r["name"], color, accent, "rooster")
        birds.append(
            {
                **{k: v for k, v in r.items() if k != "provisional"},
                "sex": "rooster",
                "color": color,
                "accent": accent,
                "mugshot": mug(r["name"]),
                "photo": photo,
                "photoReal": f"assets/hens/photos/{r['id']}.jpg",
                "oftenSeen": areas[i % 3],
                "zone": zones[i % 6],
                "provisional": bool(r.get("provisional")),
            }
        )

    for i, h in enumerate(named_hens):
        color, accent = color_for(i + 3, False)
        photo = write_svg(h["id"], h["name"], color, accent, "hen")
        # featured legacy path for first few
        photo_path = photo
        if i < 5:
            legacy = LEGACY / f"{h['id']}.svg"
            legacy.write_text((OUT_DIR / f"{h['id']}.svg").read_text(encoding="utf-8"), encoding="utf-8")
            photo_path = f"assets/hens/{h['id']}.svg"
        birds.append(
            {
                **h,
                "sex": "hen",
                "color": color,
                "accent": accent,
                "mugshot": mug(h["name"]),
                "photo": photo_path,
                "photoReal": f"assets/hens/photos/{h['id']}.jpg",
                "oftenSeen": areas[i % 3],
                "zone": zones[i % 6],
                "provisional": False,
            }
        )

    for j, (pid, pname, trait) in enumerate(provisional):
        color, accent = color_for(j + 20, False)
        photo = write_svg(pid, pname, color, accent, "hen")
        birds.append(
            {
                "id": pid,
                "name": pname,
                "title": trait.title(),
                "role": "Hen · flock",
                "mood": trait.split()[0].title(),
                "breed": "Mixed / pending ID",
                "sex": "hen",
                "color": color,
                "accent": accent,
                "mugshot": mug(pname),
                "photo": photo,
                "photoReal": f"assets/hens/photos/{pid}.jpg",
                "oftenSeen": areas[j % 3],
                "zone": zones[j % 6],
                "personality": trait,
                "voice": "friendly",
                "bio": f'Provisional name “{pname}” until the farm posts the real roll call. {trait.capitalize()} energy.',
                "catchphrases": [
                    f"I'm {pname}—for now.",
                    "Rename me when you know me.",
                    "Still earning my Who's Who plaque.",
                ],
                "chatStyle": (
                    f"You are {pname}, a backyard hen at Lone Tree Acres (provisional name). "
                    f"Personality: {trait}. Short, PG, funny. Never break character."
                ),
                "provisional": True,
            }
        )

    assert len(birds) == 31, len(birds)
    assert sum(1 for b in birds if b["sex"] == "rooster") == 3
    assert sum(1 for b in birds if b["sex"] == "hen") == 28

    js = (
        "/* AUTO-GENERATED by scripts/generate-flock-roster.py — re-run after renames. */\n"
        "(function (global) {\n"
        "  'use strict';\n"
        f"  global.__FLOCK_ROSTER__ = {json.dumps(birds, indent=2)};\n"
        "  global.__FLOCK_META__ = "
        + json.dumps(
            {
                "total": 31,
                "roosters": 3,
                "hens": 28,
                "provisional": sum(1 for b in birds if b.get("provisional")),
            }
        )
        + ";\n"
        "})(typeof window !== 'undefined' ? window : globalThis);\n"
    )
    (ROOT / "js" / "flock-roster.generated.js").write_text(js, encoding="utf-8")
    meta = {
        "total": 31,
        "roosters": 3,
        "hens": 28,
        "provisional": sum(1 for b in birds if b.get("provisional")),
        "ids": [b["id"] for b in birds],
        "named": [b["name"] for b in birds if not b.get("provisional")],
    }
    (ROOT / "js" / "flock-roster.meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("OK", meta)
    print("SVGs", len(list(OUT_DIR.glob("*.svg"))))


if __name__ == "__main__":
    main()
