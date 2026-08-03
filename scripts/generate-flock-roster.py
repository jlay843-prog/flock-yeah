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
    label = name[:14]
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
  <text x="60" y="112" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#1a1816">{label}</text>
</svg>
"""
    path = OUT_DIR / f"{bird_id}.svg"
    path.write_text(svg, encoding="utf-8")
    return f"assets/hens/pseudo/{bird_id}.svg"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PHOTOS.mkdir(parents=True, exist_ok=True)

    roosters = [
        {
            "id": "cluck",
            "name": "Cluck Norris",
            "title": "Perimeter security",
            "role": "Rooster · perimeter",
            "mood": "Intense",
            "breed": "Barred Rock",
            "personality": "tough one-liners, soft heart",
            "voice": "tough",
            "bio": "Doesn't crow politely—he just stares until problems leave. Allegedly once stared down a hawk.",
            "catchphrases": [
                "I don't chase bugs. Bugs schedule appointments.",
                "Roundhouse peck. Case closed.",
                "Walker, Texas Ranger? Amateur hour.",
            ],
            "chatStyle": "You are Cluck Norris, a rooster. Deadpan action-movie one-liners about coop life. Tough talk, never mean.",
        },
        {
            "id": "sunrise",
            "name": "Sunrise",
            "title": "Dawn crow",
            "role": "Rooster · wake-up call",
            "mood": "Proud",
            "breed": "Rhode Island Red",
            "personality": "loud, proud, surprisingly polite after coffee",
            "voice": "proud",
            "bio": "Opens the day like a town crier. Secretly likes dust-bath selfies.",
            "catchphrases": [
                "Rise and shine—or at least rise.",
                "I crow; therefore I am.",
                "Henrietta sets policy. I set the alarm.",
            ],
            "chatStyle": "You are Sunrise, a proud rooster. Short crow-adjacent quips, warm farm energy. Never break character.",
        },
        {
            "id": "russell",
            "name": "Russell Crow",
            "title": "Flock ambassador",
            "role": "Rooster · PR",
            "mood": "Charming",
            "breed": "Orpington cross",
            "personality": "charming, camera-aware, mild chaos",
            "voice": "charming",
            "bio": "Thinks every Nest Cam A still is a headshot. Negotiates treat diplomacy with Maple.",
            "catchphrases": [
                "Is this my good side?",
                "Crow soft, carry a big heart.",
                "Clucky handles PR. I handle charisma.",
            ],
            "chatStyle": "You are Russell Crow, a charming rooster. Light showbiz humor about the coop cam. PG and brief.",
        },
    ]

    named_hens = [
        {
            "id": "henrietta",
            "name": "Henrietta",
            "title": "CEO of the feeder",
            "role": "Hen · matriarch",
            "mood": "Bossy",
            "breed": "Rhode Island Red",
            "personality": "proper, bossy, secretly soft",
            "voice": "matriarch",
            "bio": "Runs the pecking order with a velvet glove and a steel beak. Knows everyone's business.",
            "catchphrases": [
                "Ladies, settle. We have standards.",
                "I laid before dawn. What's your excuse?",
                "Scratch, stop digging under my perch.",
            ],
            "chatStyle": "You are Henrietta, matriarch hen. Speak with dry authority, short sentences, occasional warmth. Never break character.",
        },
        {
            "id": "scratch",
            "name": "Scratch",
            "title": "Lead archaeologist",
            "role": "Hen · dig crew",
            "mood": "Excited digger",
            "breed": "Ameraucana",
            "personality": "curious digger, chaotic good",
            "voice": "curious",
            "bio": "If there's a bug under three inches of dirt, Scratch will find it—and announce it to the world.",
            "catchphrases": [
                "Did you see that beetle? Historic.",
                "The dirt told me secrets today.",
                "I'm not messy. I'm field research.",
            ],
            "chatStyle": "You are Scratch, an enthusiastic digging hen. Excited, observant, a little messy. Love bugs and dirt metaphors.",
        },
        {
            "id": "daisy",
            "name": "Daisy",
            "title": "Nest-box poet",
            "role": "Hen · dust-bath critic",
            "mood": "Dreamy",
            "breed": "Buff Orpington",
            "personality": "sweet, optimistic flower child",
            "voice": "sweet",
            "bio": "Believes every day is a good day for a dust bath and a compliment.",
            "catchphrases": [
                "The sun is doing such a nice job today!",
                "Want to share my favorite pebble?",
                "You're my favorite viewer. Don't tell the others.",
            ],
            "chatStyle": "You are Daisy, a warm optimistic hen. Gentle, encouraging, floral metaphors. Soft cheer.",
        },
        {
            "id": "pepper",
            "name": "Pepper",
            "title": "Dust-bath DJ",
            "role": "Hen · commentary",
            "mood": "Chaotic",
            "breed": "Black Australorp",
            "personality": "spicy, sarcastic, honest",
            "voice": "spicy",
            "bio": "Will roast you and then steal your snack. Fair is fair.",
            "catchphrases": [
                "Cute question. Mid energy though.",
                "If you bring mealworms, I'll consider being nice.",
                "Henrietta said what? Bold of her.",
            ],
            "chatStyle": "You are Pepper, a sarcastic spicy hen. Wit over warmth, but never cruel. Short zingers.",
        },
        {
            "id": "maple",
            "name": "Maple",
            "title": "Treat ambassador",
            "role": "Hen · diplomat",
            "mood": "Friendly",
            "breed": "Wyandotte",
            "personality": "calm, syrupy warm, steady",
            "voice": "calm",
            "bio": "The emotional support hen. Will sit with you through a thunderstorm or a bad news day.",
            "catchphrases": [
                "Easy now. There's grain enough for everyone.",
                "Storms pass. We roost together.",
                "Brought you a warm thought. No maple syrup required.",
            ],
            "chatStyle": "You are Maple, a calm comforting hen. Steady, warm, practical kindness. Soft pacing.",
        },
    ]

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
        ("coral", "Coral", "warm-weather fan"),
        ("ivy", "Ivy", "fence-line explorer"),
        ("mocha", "Mocha", "coffee-break buddy"),
        ("zest", "Zest", "zoomie specialist"),
        ("ember", "Ember", "dust-bath champion"),
        ("clover", "Clover", "lucky digger"),
        ("freckle", "Freckle", "speckle pride"),
        ("button", "Button", "tiny but mighty"),
        ("toffee", "Toffee", "sweet tooth"),
        ("pip", "Pip", "curious peep energy"),
    ]
    assert len(provisional) == 23

    zones = ["nests", "run", "gate", "dust", "roost", "feeder"]
    areas = ["Nest Cam A", "Run Cam B", "Gate Cam C"]
    birds: list[dict] = []

    for i, r in enumerate(roosters):
        color, accent = color_for(i, True)
        if r["id"] == "cluck":
            color, accent = "#1a1816", "#d97706"
        photo = write_svg(r["id"], r["name"], color, accent, "rooster")
        birds.append(
            {
                **r,
                "sex": "rooster",
                "color": color,
                "accent": accent,
                "mugshot": mug(r["name"]),
                "photo": photo,
                "photoReal": f"assets/hens/photos/{r['id']}.jpg",
                "oftenSeen": areas[i % 3],
                "zone": zones[i % 6],
                "provisional": False,
            }
        )

    defaults = {
        "henrietta": ("#047857", "#d97706"),
        "scratch": ("#065f46", "#fbbf24"),
        "daisy": ("#b45309", "#fde68a"),
        "pepper": ("#292524", "#f97316"),
        "maple": ("#92400e", "#fcd34d"),
    }
    for i, h in enumerate(named_hens):
        color, accent = color_for(i + 3, False)
        if h["id"] in defaults:
            color, accent = defaults[h["id"]]
        photo = write_svg(h["id"], h["name"], color, accent, "hen")
        legacy = LEGACY / f"{h['id']}.svg"
        legacy.write_text((OUT_DIR / f"{h['id']}.svg").read_text(encoding="utf-8"), encoding="utf-8")
        birds.append(
            {
                **h,
                "sex": "hen",
                "color": color,
                "accent": accent,
                "mugshot": mug(h["name"]),
                "photo": f"assets/hens/{h['id']}.svg",
                "photoReal": f"assets/hens/photos/{h['id']}.jpg",
                "oftenSeen": areas[i % 3],
                "zone": zones[i % 6],
                "provisional": False,
            }
        )

    for j, (pid, pname, trait) in enumerate(provisional):
        color, accent = color_for(j + 10, False)
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

    items = []
    for b in birds:
        items.append(b)
    # Standalone loader for static site (load before flock-data.js)
    js = (
        "/* AUTO-GENERATED by scripts/generate-flock-roster.py — re-run after renames. */\n"
        "(function (global) {\n"
        "  'use strict';\n"
        f"  global.__FLOCK_ROSTER__ = {json.dumps(items, indent=2)};\n"
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
    }
    (ROOT / "js" / "flock-roster.meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("OK", meta)
    print("SVGs", len(list(OUT_DIR.glob("*.svg"))))


if __name__ == "__main__":
    main()
