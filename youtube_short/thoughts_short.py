#!/usr/bin/env python3
"""
"What If You Could Hear Everyone's Thoughts For 24 Hours?"  (story Short, Part 1)

Built on the story_short.py engine, so it has the same layout: plaid frame, title box,
animated 16:9 panel, "Part 1" label, synced captions, time-of-day tag and 24h countdown.
New in this one:
  * thought clouds (next to the normal speech bubbles) and a purple "mind-reading" aura,
  * character voices for what people say and think, with an "inner voice" echo on
    thoughts and overlapping whispered thoughts for crowds.

Voices (ElevenLabs, eleven_multilingual_v2):
  narrator  Mike - 2D & 3D POV/Storytime (Voice Library, API use needs a paid plan)
            -> override with ELEVENLABS_VOICE_ID or --narrator
  cast      premade voices (Matilda, Jessica, Will, Roger, Laura, Chris, Sarah, Bill, Charlie)

Usage:
  python youtube_short/thoughts_short.py --tts elevenlabs   # -> youtube_short/thoughts_24h_story.mp4
  python youtube_short/thoughts_short.py --preview 3,20,40  # PNG stills only (youtube_short/preview/)
"""
import argparse
import functools
import math
import multiprocessing as mp
import os
import random
import subprocess
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import story_short as base  # noqa: E402
from make_short import (clamp01, ease_in_out, ease_out_back, ease_out_cubic, emoji_sized, font,  # noqa: E402
                        lerp, place, prog, text_sprite)
from story_short import (FLOOR, FPS, H, INK, SR, W, WH, WW, chunk_caption, floor_band, heart,  # noqa: E402
                         person, skyline, te, ts, vgrad, wall_clock, window)

TITLE = "What If You Could Hear Everyone's Thoughts For 24 Hours?"
PART = "Part 1"
NARRATOR = os.environ.get("ELEVENLABS_VOICE_ID", "zfc8CJQpe8Kqyl0vvCzo")   # Mike - 2D & 3D POV/Storytime
CAST = {                                   # ElevenLabs premade voices (usable on every plan)
    "mom": "XrExE9yKIg1WjnnlVkGX",         # Matilda
    "crush": "cgSgspJ2msm6clMCkdW9",       # Jessica
    "friend": "bIHbv24MWmeRgasZH58o",      # Will
    "c1": "CwhRBWXzGAHq8TQ4Fs17",          # Roger
    "c2": "FGY2WhTYpPnrIDTdsKH5",          # Laura
    "c3": "iP95p4xoKVk53GoZ742B",          # Chris
    "c4": "EXAVITQu4vr4xnSDxMaL",          # Sarah
    "c5": "pqHfZKP75CvOlQylNhV4",          # Bill
    "c6": "IKne3meq5aSn9XLyUdCD",          # Charlie
}

BLUE = base.BLUE
MOM = (150, 92, 170)
CRUSH = (236, 120, 160)
FRIEND = (236, 150, 60)
PSY = (178, 120, 255)                      # mind-reading purple
HAIR = "quiff"                             # the hero has the same brown quiff as the channel avatar


def N(text):
    return dict(text=text, who="narrator", kind="narr")


def SAY(who, text):
    return dict(text=text, who=who, kind="say")


def THINK(who, text):
    return dict(text=text, who=who, kind="think")


# ======================================================================================
# Thought clouds + aura
# ======================================================================================
ITALIC = "/usr/share/fonts/opentype/inter/Inter-SemiBoldItalic.otf"
MOODS = {"think": ((246, 240, 255), (52, 30, 96)),      # (cloud fill, text colour)
         "sad": ((224, 236, 255), (22, 46, 96)),
         "mean": ((255, 234, 234), (124, 24, 36)),
         "memory": ((232, 232, 238), (104, 104, 120))}


@functools.lru_cache(maxsize=16)
def ifont(size):
    try:
        return ImageFont.truetype(ITALIC, size)
    except OSError:
        return font("semi", size)


def wrap(text, f, maxw):
    lines, cur = [], ""
    for w_ in text.split():
        test = (cur + " " + w_).strip()
        if f.getlength(test) > maxw and cur:
            lines.append(cur)
            cur = w_
        else:
            cur = test
    lines.append(cur)
    return lines


@functools.lru_cache(maxsize=128)
def thought(text, side="left", size=46, maxw=600, mood="think"):
    """Cloud-shaped thought bubble. Returns (sprite, tail tip xy). side = where the tail leaves the cloud."""
    fill, fg = MOODS[mood]
    f = ifont(size)
    lines = wrap(text, f, maxw)
    lh = int(size * 1.2)
    tw = max(f.getlength(l) for l in lines)
    padx, pady = 40, 30
    bw, bh = int(tw + 2 * padx), int(lh * len(lines) + 2 * pady)
    R = int(min(48, bh * 0.3))
    o = 5
    M = R + o + 4
    im = Image.new("RGBA", (bw + 2 * M, bh + 2 * M + R + 100), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ox, oy = M, M
    pts = []
    nx = max(2, round(bw / (R * 1.3)))
    ny = max(1, round(bh / (R * 1.3)))
    for i in range(nx + 1):
        x = ox + bw * i / nx
        pts += [(x, oy), (x, oy + bh)]
    for j in range(1, ny):
        y = oy + bh * j / ny
        pts += [(ox, y), (ox + bw, y)]
    sgn = -1 if side == "left" else 1
    tx0 = ox + (bw * 0.24 if side == "left" else bw * 0.76)
    ty0 = oy + bh + R + 14
    tails = [(tx0 + sgn * k * 30, ty0 + k * 32, 20 - k * 6) for k in range(3)]
    for col, grow in ((INK, o), (fill, 0)):
        for (x, y) in pts:
            d.ellipse((x - R - grow, y - R - grow, x + R + grow, y + R + grow), fill=col)
        d.rounded_rectangle((ox - grow, oy - grow, ox + bw + grow, oy + bh + grow), radius=R, fill=col)
        for (x, y, r) in tails:
            d.ellipse((x - r - grow, y - r - grow, x + r + grow, y + r + grow), fill=col)
    for i, l in enumerate(lines):
        d.text((ox + bw / 2, oy + pady + i * lh + lh / 2), l, font=f, fill=fg, anchor="mm")
    return im, (tails[-1][0], tails[-1][1])


def show_thought(img, text, x, y, lt, t0, t1=99.0, side="left", size=56, mood="think", alpha=1.0, out=0.15,
                 maxw=1150):
    """Thought cloud whose tail tip sits at (x, y); pops in from the tip, gently bobs."""
    if not (t0 <= lt < t1):
        return
    spr, (tx, ty) = thought(text, side, size, maxw, mood)
    sc = 0.3 + 0.7 * ease_out_back((lt - t0) / 0.35)
    al = alpha * clamp01((lt - t0) / 0.12) * (1 - prog(lt, t1 - out, t1))
    if t1 < 98:
        sc *= 1 - 0.4 * prog(lt, t1 - out, t1)
    cx, cy = x - tx + spr.width / 2, y - ty + spr.height / 2
    bob = math.sin((lt - t0) * 2.3 + x * 0.01) * 6
    place(img, spr, x + (cx - x) * sc, y + (cy - y) * sc + bob, scale=sc, alpha=al)


def say_bubble(img, text, x, y, lt, t0, t1, tail="left", size=62):
    """story_short.show_bubble with a bigger font (tail tip at x, y)."""
    if not (t0 <= lt < t1):
        return
    b = base.bubble(text, tail, size, 900)
    sc = 0.4 + 0.6 * ease_out_back((lt - t0) / 0.3)
    al = clamp01((lt - t0) / 0.1) * (1 - prog(lt, t1 - 0.12, t1))
    tx = 50 if tail == "left" else b.width - 58
    cx = x - tx + b.width / 2 + (30 if tail == "left" else -30)
    cy = y - b.height / 2
    place(img, b, cx + (x - cx) * (1 - sc), cy + (y - cy) * (1 - sc), scale=sc, alpha=al)


def head_of(x, yf, u=1.0, sit=False):
    return x, yf - (536 if sit else 562) * u


def aura(d, hx, hy, lt, k=1.0, col=PSY, speed=0.9):
    """Expanding rings + soft halo around a head = 'hearing thoughts'."""
    if k <= 0.01:
        return
    for rr, a in ((150, 34), (124, 54)):
        d.ellipse((hx - rr, hy - rr, hx + rr, hy + rr), fill=col + (int(a * k),))
    for i in range(3):
        a = (lt * speed + i / 3) % 1
        r = 110 + a * 180
        d.ellipse((hx - r, hy - r, hx + r, hy + r), outline=col + (int(170 * (1 - a) * k),), width=7)


def hoodie_tag(d, x, yf, u=1.0):
    """Inside-out hoodie: dashed seams + a care label on the chest."""
    sh_y, hip_y = yf - 470 * u, yf - 258 * u
    for s in (-1, 1):
        xx = x + s * 52 * u
        for yy in range(int(sh_y + 30 * u), int(hip_y), int(22 * u)):
            d.line((xx, yy, xx, yy + 11 * u), fill=(214, 224, 250), width=int(4 * u))
    d.rectangle((x - 11 * u, sh_y + 8 * u, x + 11 * u, sh_y + 42 * u), fill=(250, 250, 250), outline=(170, 170, 180),
                width=2)
    for k in range(3):
        yy = sh_y + 16 * u + k * 8 * u
        d.line((x - 6 * u, yy, x + 6 * u, yy), fill=(150, 150, 160), width=2)


# ======================================================================================
# Backgrounds (world resolution)
# ======================================================================================
def bg_kitchen():
    im = vgrad(WW, WH, (250, 232, 196), (240, 218, 180))
    d = ImageDraw.Draw(im)
    window(d, (140, 170, 560, 540), (255, 238, 205), (255, 212, 160), panes=2)
    wall_clock(d, 770, 200)
    d.rectangle((960, 430, WW, 760), fill=(226, 238, 242))
    for x in range(960, WW, 64):
        d.line((x, 430, x, 760), fill=(206, 220, 226), width=3)
    for y in range(430, 761, 48):
        d.line((960, y, WW, y), fill=(206, 220, 226), width=3)
    for x in range(990, WW, 290):
        d.rounded_rectangle((x, 110, x + 270, 430), radius=16, fill=(118, 168, 150))
        d.rounded_rectangle((x + 16, 126, x + 254, 414), radius=10, outline=(98, 146, 128), width=6)
        d.rounded_rectangle((x + 122, 380, x + 148, 396), radius=6, fill=(230, 230, 220))
    d.rectangle((940, 760, WW, 800), fill=(240, 238, 232))
    d.rectangle((960, 800, WW, FLOOR - 20), fill=(104, 152, 134))
    for x in range(960, WW, 240):
        d.rectangle((x + 10, 814, x + 230, FLOOR - 34), outline=(88, 132, 116), width=6)
        d.rounded_rectangle((x + 106, 830, x + 134, 844), radius=6, fill=(230, 230, 220))
    d.rounded_rectangle((1800, 680, 1960, 760), radius=20, fill=(200, 205, 212))
    d.rectangle((1830, 668, 1870, 684), fill=(60, 60, 66))
    d.rectangle((1890, 668, 1930, 684), fill=(60, 60, 66))
    d.rounded_rectangle((1120, 690, 1190, 760), radius=10, fill=(220, 120, 90))
    d.ellipse((1096, 596, 1214, 704), fill=(80, 150, 90))
    floor_band(d, (178, 134, 98))
    return im


def bg_hallway():
    im = vgrad(WW, WH, (214, 226, 238), (200, 214, 228))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, WW, 80), fill=(236, 240, 244))
    for x in (300, 1080, 1860):
        d.rounded_rectangle((x - 160, 22, x + 160, 52), radius=12, fill=(255, 252, 230))
    top, bot = 260, FLOOR - 24
    d.rectangle((0, top - 24, WW, top), fill=(46, 88, 150))
    for i, x in enumerate(range(-40, WW, 150)):
        col = (66, 118, 196) if i % 2 else (76, 128, 206)
        d.rectangle((x, top, x + 144, bot), fill=col, outline=(46, 88, 150), width=5)
        for v in range(4):
            d.line((x + 40, top + 40 + v * 18, x + 104, top + 40 + v * 18), fill=(46, 88, 150), width=5)
        d.rounded_rectangle((x + 108, top + 300, x + 122, top + 380), radius=6, fill=(210, 214, 222))
    for (x0, x1, col, txt) in ((520, 800, (250, 240, 200), "SCIENCE FAIR"), (1330, 1590, (255, 214, 214), "DANCE FRI")):
        d.rectangle((x0, 104, x1, 216), fill=col, outline=(120, 110, 100), width=4)
        d.text(((x0 + x1) / 2, 160), txt, font=font("black", 34), fill=(70, 60, 60), anchor="mm")
    floor_band(d, (226, 220, 206))
    return im


def bg_cafeteria():
    im = vgrad(WW, WH, (244, 232, 206), (236, 222, 194))
    d = ImageDraw.Draw(im)
    for x0 in (120, 820, 1520):
        window(d, (x0, 150, x0 + 520, 520), (190, 220, 245), (226, 238, 245), frame=(250, 248, 240),
               city=((170, 190, 205), None), seed=x0, panes=2)
    d.rectangle((0, 640, WW, FLOOR), fill=(210, 196, 170))
    d.line((0, 640, WW, 640), fill=(180, 164, 138), width=8)
    floor_band(d, (150, 160, 170))
    return im


def bg_street():
    im = vgrad(WW, WH, (70, 48, 110), (236, 128, 96))
    d = ImageDraw.Draw(im)
    d.ellipse((1560, 420, 1780, 640), fill=(255, 196, 120))
    skyline(d, -20, WW + 20, 820, (62, 42, 82), 21, (255, 210, 130), 200, 560)
    d.rectangle((0, 820, WW, FLOOR - 20), fill=(112, 102, 122))
    d.line((0, 820, WW, 820), fill=(150, 140, 160), width=6)
    for x in (260, 1240, 2000):
        d.rectangle((x - 8, 380, x + 8, FLOOR - 20), fill=(40, 34, 50))
        d.rounded_rectangle((x - 46, 360, x + 46, 392), radius=12, fill=(40, 34, 50))
        d.ellipse((x - 30, 384, x + 30, 410), fill=(255, 230, 150))
    floor_band(d, (84, 76, 94))
    return im


def bg_park():
    im = vgrad(WW, WH, (168, 214, 246), (236, 246, 240))
    d = ImageDraw.Draw(im, "RGBA")
    d.ellipse((1760, 90, 1960, 290), fill=(255, 238, 170))
    for cx, cy, s in ((420, 160, 1.0), (1180, 110, 0.8)):
        for ox, oy, r in ((-70, 10, 50), (0, -10, 66), (74, 12, 48)):
            d.ellipse((cx + ox * s - r * s, cy + oy * s - r * s, cx + ox * s + r * s, cy + oy * s + r * s),
                      fill=(255, 255, 255, 230))
    d.ellipse((-400, 560, 1200, 1300), fill=(150, 200, 120))
    d.ellipse((900, 600, 2600, 1400), fill=(136, 190, 110))
    for x, s in ((190, 1.1), (470, 0.85), (1760, 1.0), (2040, 1.2)):
        d.rectangle((x - 16 * s, 820 - 260 * s, x + 16 * s, 830), fill=(110, 76, 50))
        for ox, oy, r in ((0, -330, 120), (-80, -260, 90), (80, -260, 90)):
            d.ellipse((x + ox * s - r * s, 820 + oy * s - r * s, x + ox * s + r * s, 820 + oy * s + r * s),
                      fill=(78, 150, 84))
    d.rectangle((0, 830, WW, WH), fill=(120, 182, 96))
    for y in (668, 718):
        d.rounded_rectangle((620, y, 1540, y + 30), radius=10, fill=(150, 98, 60))
    for x in (660, 1500):
        d.rectangle((x - 12, 668, x + 12, 812), fill=(120, 78, 48))
    d.rounded_rectangle((600, 812, 1560, 846), radius=10, fill=(162, 108, 66))
    for x in (650, 1510):
        d.rectangle((x - 14, 846, x + 14, FLOOR - 12), fill=(80, 70, 70))
    floor_band(d, (104, 160, 84))
    return im


MY_BGS = {"kitchen": bg_kitchen, "hallway": bg_hallway, "cafeteria": bg_cafeteria, "street": bg_street,
          "park": bg_park}


# ======================================================================================
# Scenes
# ======================================================================================
def sc_kitchen(img, d, lt, S):
    px, mx = 600, 1540
    t_on = ts(S, 0, 1.0)                                # "...and suddenly"
    hx, hy = head_of(px, FLOOR)
    aura(d, hx, hy, lt, prog(lt, t_on, t_on + 0.6))
    if lt < t_on:
        pe = "tired"
    elif lt < ts(S, 1):
        pe = "shock"
    elif lt < ts(S, 3):
        pe = "happy"
    else:
        pe = "nervous"
    person(d, px, FLOOR, 1.0, hair=HAIR, expr=pe, t=lt, seed=1, look=0.7 if lt > ts(S, 1) else 0.0,
           arms=("head", "head") if t_on < lt < t_on + 1.3 else ("down", "down"))
    person(d, mx, FLOOR, 0.98, shirt=MOM, hair="bun", hood=False, facing=-1, look=-1, t=lt, seed=4, expr="happy",
           arms=("down", "coffee"), cup=True, talk=ts(S, 1) < lt < te(S, 1))
    say_bubble(img, "Morning, sweetie!", mx - 60, 420, lt, ts(S, 1, -0.05), ts(S, 2, 0.3), tail="right")
    show_thought(img, "Please don't ask for money again.", mx - 80, 380, lt, ts(S, 3, -0.15), side="right")
    if t_on <= lt < t_on + 0.3:
        return {"flash": 0.55 * (1 - (lt - t_on) / 0.3)}
    return {}


def sc_bus(img, d, lt, S):
    city = vgrad(WW, 440, (190, 214, 230), (226, 232, 230))
    cd = ImageDraw.Draw(city)
    off = (lt * 520) % 1400
    for rep in range(-1, 3):
        rng = random.Random(77)
        x = rep * 1400 - off
        while x < rep * 1400 - off + 1400:
            bw, bh = rng.randint(90, 180), rng.randint(140, 400)
            cd.rectangle((x, 440 - bh, x + bw, 440), fill=(150 + rng.randint(0, 40),) * 2 + (175,))
            x += bw + 10
    img.paste(city, (0, 170))
    img.paste(base.bg("bus"), (0, 0), base.bg("bus"))
    bob = math.sin(lt * 9) * 3
    for sx in (330, 1110, 1660):
        d.rounded_rectangle((sx - 130, 600, sx + 130, 820), radius=30, fill=(70, 110, 160))
        d.rounded_rectangle((sx - 140, 800, sx + 150, 860), radius=20, fill=(60, 96, 140))
    chat = S["chat"]
    loud = bool(chat) and lt > chat[0][0]
    person(d, 330, FLOOR + bob, 0.95, shirt=(90, 160, 110), pose="sit", hair="cap", facing=1, t=lt, seed=5,
           hood=False, look_y=1, arms=("down", "phone"), phone_hand=1)
    person(d, 760, FLOOR + bob, 0.97, shirt=(230, 140, 60), hair="messy", hood=False, t=lt, seed=7, look_y=1,
           arms=("phone", "down"), phone_hand=0)
    person(d, 1660, FLOOR + bob, 0.95, shirt=(232, 110, 150), pose="sit", hair="long", facing=-1, t=lt, seed=2,
           hood=False, look_y=1, arms=("phone", "down"), phone_hand=0)
    stare = len(chat) > 3 and lt > chat[3][0]
    person(d, 1960, FLOOR + bob, 0.97, shirt=(120, 120, 200), hair="bun", hood=False, t=lt, seed=6,
           look=-1 if stare else 0, look_y=0 if stare else 1, expr="smug" if stare else "neutral")
    hx, hy = head_of(1110, FLOOR + bob, sit=True)
    aura(d, hx, hy, lt, 0.5 + 0.5 * loud, speed=0.9 + 0.8 * loud)
    look = 0.0
    if loud:
        idx = max(i for i, (c0, _) in enumerate(chat) if lt >= c0)
        look = (-1, 1, -0.6, 1)[idx % 4]
    person(d, 1110, FLOOR + bob, 1.0, pose="sit", hair=HAIR, t=lt, seed=1, look=look,
           expr=("shock" if loud else "neutral") if not stare else "nervous")
    items = SCENES[1]["chatter"]["items"]
    for (c0, clen), (_, text, x, y, side, mood) in zip(chat, items):
        show_thought(img, text, x, y, lt, c0, c0 + clen + 0.25, side=side, size=50, mood=mood)
    return {}


def sc_hallway(img, d, lt, S):
    px, cx = 640, 1520
    caught = lt > te(S, 1, 0.1)
    hx, hy = head_of(px, FLOOR)
    aura(d, hx, hy, lt, 0.55)
    if lt < ts(S, 0, 1.3):
        pe = "happy"
    elif lt < ts(S, 1, 0.3):
        pe = "love"
    else:
        pe = "shock" if caught else "nervous"
    person(d, px, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look=0 if caught else 1, look_y=1 if caught else 0, expr=pe)
    hoodie_tag(d, px, FLOOR)
    if caught:
        k = ease_out_cubic(prog(lt, te(S, 1, 0.1), te(S, 1, 0.5)))
        sh_y = FLOOR - 470
        d.arc((px - 66, sh_y - 22, px + 66, sh_y + 78), -90, -90 + 360 * k, fill=(235, 40, 40), width=10)
    ce = "neutral" if lt < ts(S, 1, -0.1) else ("laugh" if caught else "smug")
    person(d, cx, FLOOR, 0.97, shirt=CRUSH, hair="long", hood=False, facing=-1, look=-1, t=lt, seed=2, expr=ce,
           arms=("down", "down"))
    show_thought(img, "Why is his hoodie inside out?", cx - 70, 380, lt, ts(S, 1, -0.15), side="right")
    if caught:
        place(img, emoji_sized("😳", 120), px + 190, 300, scale=max(0.01, ease_out_back(prog(lt, te(S, 1, 0.3),
                                                                                              te(S, 1, 0.6)))))
    return {}


def sc_lunch(img, d, lt, S):
    d.rectangle((860, 830, 1300, 868), fill=(236, 236, 230))
    for x in (900, 1260):
        d.rectangle((x - 14, 868, x + 14, FLOOR - 20), fill=(150, 150, 156))
    for x0, food in ((900, (230, 180, 70)), (1120, (200, 80, 60))):
        d.rounded_rectangle((x0, 806, x0 + 140, 832), radius=8, fill=(110, 170, 200))
        d.ellipse((x0 + 30, 790, x0 + 110, 818), fill=food)
    px, fx = 760, 1400
    laughing = lt < ts(S, 2)
    reveal = lt > ts(S, 3, -0.1)
    hx, hy = head_of(px, FLOOR, sit=True)
    aura(d, hx, hy, lt, 0.5 if not reveal else 0.9, speed=0.6)
    person(d, px, FLOOR, 1.0, pose="sit", hair=HAIR, t=lt, seed=1, look=1, chair=(110, 80, 60),
           expr="laugh" if laughing else ("sad" if lt > te(S, 3, 0.2) else "neutral"))
    person(d, fx, FLOOR, 0.98, shirt=FRIEND, hair="cap", hood=False, pose="sit", facing=-1, t=lt, seed=8, look=-1,
           chair=(110, 80, 60), expr="laugh" if laughing else "happy",
           arms=("belly", "belly") if laughing else ("down", "down"))
    say_bubble(img, "HAHA! Bro, that's hilarious!", fx - 40, 430, lt, ts(S, 1, -0.05), ts(S, 2, 0.2), tail="right")
    show_thought(img, "I'm not okay. Please don't notice.", fx - 50, 400, lt, ts(S, 3, -0.15), side="right",
                 mood="sad")
    if reveal:
        return {"tint": (20, 40, 100, int(70 * ease_in_out(prog(lt, ts(S, 3), te(S, 3)))))}
    return {}


PEDS = [((90, 160, 110), "cap", 1, 180, 0), ((232, 110, 150), "long", -1, 150, 700),
        ((120, 120, 200), "bun", 1, 210, 1300), ((200, 60, 60), "messy", -1, 170, 1900),
        ((230, 180, 60), "cap", 1, 140, 2400)]


def sc_overload(img, d, lt, S):
    for i, (sh, hair, dirn, sp, x0) in enumerate(PEDS):
        x = (x0 + dirn * lt * sp) % 2700 - 270
        person(d, x, FLOOR - 40, 0.8, shirt=sh, hair=hair, hood=False, facing=dirn, walk=lt * 8 + i, t=lt,
               seed=10 + i, look=dirn)
    px = 1080
    k = prog(lt, 0.4, S["dur"] - 0.3)
    shake = math.sin(lt * 47) * 8 * k
    hx, hy = head_of(px, FLOOR, 1.05)
    aura(d, hx + shake, hy, lt, 0.7 + 0.3 * k, col=(int(lerp(178, 255, k)), int(lerp(120, 70, k)), int(lerp(255, 90, k))),
         speed=1.0 + 2.0 * k)
    person(d, px + shake, FLOOR, 1.05, hair=HAIR, t=lt, seed=1,
           arms=("head", "head") if lt > ts(S, 1) else ("down", "down"),
           expr="nervous" if lt < ts(S, 1, 1.4) else "shock")
    items = SCENES[4]["chatter"]["items"]
    for (c0, clen), (_, text, x, y, side, mood) in zip(S["chat"], items):
        show_thought(img, text, x, y, lt, c0, side=side, size=44, mood=mood)
    pulse = 0.6 + 0.4 * math.sin(lt * 8)
    return {"tint": (210, 20, 40, int((20 + 60 * k) * pulse))}


FADE_CLOUDS = [("Loser.", 1000, 380, "left", "mean"), ("Hoodie?!", 1040, 620, "left", "think"),
               ("Money again...", 300, 400, "left", "think"), ("So tired...", 270, 680, "left", "think"),
               ("I'm not okay.", 640, 320, "left", "sad")]


def sc_fade(img, d, lt, S):
    sc = SCENES[5]
    nmax, tick = sc["count_n"], sc["tick"]
    n0 = te(S, 0, 0.3)
    n = None
    if lt >= n0:
        n = max(1, nmax - int((lt - n0) / tick))
    left = nmax if n is None else n
    hx, hy = head_of(740, FLOOR)
    aura(d, hx, hy, lt, left / nmax * (0.6 + 0.4 * abs(math.sin(lt * 9))))
    d.ellipse((1150, 120, 2050, 1020), fill=(255, 40, 60, 40 if n is None else int(40 + 40 * (1 - ((lt - n0) % tick) / tick))))
    person(d, 740, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look_y=-0.6, look=0.4,
           expr="tired" if n is None else ("sad" if n <= 1 else "neutral"))
    for i, (text, x, y, side, mood) in enumerate(FADE_CLOUDS):
        show_thought(img, text, x, y, lt, 0.15 + i * 0.12, n0 + (i + 1) * tick - 0.05, side=side, size=44, mood=mood,
                     out=0.3)
    if n:
        st = (lt - n0) % tick
        s = text_sprite(str(n), 560, (255, 70, 80), (255, 70, 80), glow_col=(255, 50, 60))
        place(img, s, 1600, 570, scale=1 + 0.5 * (1 - ease_out_back(st / 0.25)), alpha=clamp01(st / 0.05))
    end = S["dur"] - 0.45
    if lt > end:
        return {"flash": clamp01((lt - end) / 0.2)}
    return {}


def sc_talk(img, d, lt, S):
    sx, sy = 1860, 190
    for i in range(10):
        a = i * math.pi / 5 + lt * 0.08
        d.polygon([(sx, sy), (sx + math.cos(a) * 2600, sy + math.sin(a) * 2600),
                   (sx + math.cos(a + 0.14) * 2600, sy + math.sin(a + 0.14) * 2600)], fill=(255, 244, 210, 34))
    px, fx = 860, 1300
    listening = lt > ts(S, 3)
    person(d, px, FLOOR, 1.0, pose="sit", hair=HAIR, t=lt, seed=1, look=1 if lt > ts(S, 0, 1.5) else 0,
           look_y=1 if lt < ts(S, 0, 1.5) else 0,
           expr="sad" if lt < ts(S, 1) else ("neutral" if not listening else "happy"))
    talking = (ts(S, 2) < lt < te(S, 2)) or (ts(S, 3, 0.4) < lt < te(S, 4))
    person(d, fx, FLOOR, 0.98, shirt=FRIEND, hair="cap", hood=False, pose="sit", facing=-1, t=lt, seed=8,
           look=-1 if (lt > ts(S, 1, 0.4) and not (ts(S, 2) < lt < ts(S, 3, 0.6))) else 0,
           look_y=1 if ts(S, 2) < lt < ts(S, 3, 0.6) else 0,
           expr="neutral" if lt < ts(S, 2) else ("sad" if lt < ts(S, 4) else "happy"), talk=talking)
    show_thought(img, "I'm not okay.", fx - 40, 410, lt, ts(S, 0, 1.0), ts(S, 1, 0.3), side="right", mood="memory",
                 alpha=0.85, size=52)
    say_bubble(img, "Are you actually okay?", px + 60, 420, lt, ts(S, 1, 0.5), ts(S, 2, 0.1))
    say_bubble(img, "...No. Not really.", fx - 60, 420, lt, ts(S, 2, -0.05), ts(S, 3, 0.4), tail="right")
    if listening:
        for i in range(6):
            ph = (lt * 0.45 + i / 6) % 1
            x = 1080 + math.sin(i * 2.1 + lt) * 70
            heart(d, x, 560 - ph * 380, 18 + 10 * (i % 2), (240, 80, 110, int(220 * (1 - ph))))
    return {}


def sc_cta(img, d, lt, S):
    d.rectangle((0, 0, WW // 2, WH), fill=(44, 22, 78))
    d.rectangle((WW // 2, 0, WW, WH), fill=(240, 186, 104))
    d.ellipse((WW * 0.75 - 420, 140, WW * 0.75 + 420, 1000), fill=(255, 214, 140))
    d.line((WW // 2, 0, WW // 2, WH), fill=(255, 255, 255), width=8)
    hx, hy = head_of(540, FLOOR)
    aura(d, hx, hy, lt, 1.0)
    person(d, 540, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, expr="smug", look=0.4)
    person(d, 1620, FLOOR, 1.0, hair=HAIR, t=lt, seed=3, expr="happy", arms=("head", "head"))
    for i, (txt, x, y) in enumerate((("hmm...", 300, 520), ("lol", 830, 580), ("?!", 810, 330))):
        show_thought(img, txt, x, y, lt, 0.3 + i * 0.25, side="left", size=44)
    for x, lab in ((540, "YES {🧠}"), (1620, "NO {🙉}")):
        s = text_sprite(lab, 66, INK, INK, "black", stroke=0, shadow=False)
        d.rounded_rectangle((x - 230, 64, x + 230, 196), radius=28, fill=(255, 255, 252))
        place(img, s, x, 130)
    return {}


# ======================================================================================
# Story
# ======================================================================================
SCENES = [
    dict(fn=sc_kitchen, bg="kitchen", tod="7:00 AM", timer=0, lines=[
        N("You wake up, and suddenly, you can hear everyone's thoughts."),
        SAY("mom", "Morning, sweetie!"),
        N("But in her head..."),
        THINK("mom", "Please don't ask for money again.")], extra=0.2),
    dict(fn=sc_bus, bg=None, tod="8:00 AM", timer=1, lines=[
        N("On the bus, everyone looks calm."),
        N("But their heads are screaming.")],
         chatter=dict(at=(1, 0.1), gap=0.7, items=[
             ("c1", "Did I lock the door?!", 400, 410, "left", "think"),
             ("c4", "Don't fall asleep...", 1600, 410, "right", "think"),
             ("c3", "I hate Mondays.", 720, 390, "right", "think"),
             ("c2", "Is he staring at me?", 1810, 390, "right", "think")])),
    dict(fn=sc_hallway, bg="hallway", tod="9:30 AM", timer=2.5, lines=[
        N("At school, your crush looks at you, and thinks..."),
        THINK("crush", "Why is his hoodie inside out?")], extra=1.0),
    dict(fn=sc_lunch, bg="cafeteria", tod="12:30 PM", timer=5.5, lines=[
        N("At lunch, your best friend laughs louder than anyone."),
        SAY("friend", "Ha ha! Bro, that's hilarious!"),
        N("But in his head..."),
        THINK("friend", "I'm not okay. Please don't notice.")], extra=0.5),
    dict(fn=sc_overload, bg="street", tod="6:00 PM", timer=11, lines=[
        N("By evening, there's no off switch."),
        N("Judging. Worrying. Fake smiles. Your head is about to explode.")],
         chatter=dict(at=(0, 0.5), gap=0.36, items=[
             ("c2", "Ew. Nice shoes.", 330, 380, "left", "mean"),
             ("c1", "I'm so tired.", 1840, 380, "right", "think"),
             ("c6", "Nobody likes me.", 360, 600, "left", "sad"),
             ("c4", "Smile. Just smile.", 1800, 600, "right", "think"),
             ("c3", "I'm gonna be late!", 330, 810, "left", "think"),
             ("c5", "Everyone's staring.", 1840, 810, "right", "think"),
             ("c2", "Why am I like this?", 860, 300, "left", "sad")])),
    dict(fn=sc_fade, bg="dark", tod="6:59 AM", timer="count", count_n=5, tick=0.7, lines=[
        N("Six fifty-nine. The voices start to fade.")], extra=5 * 0.7 + 0.6),
    dict(fn=sc_talk, bg="park", tod="NEXT DAY", timer=None, lines=[
        N("The power is gone. But you remember one thought."),
        N("So you ask him: are you actually okay?"),
        SAY("friend", "...No. Not really."),
        N("And for the first time, he talks."),
        N("Sometimes the loudest laugh hides the most pain.")]),
    dict(fn=sc_cta, bg=None, tod=None, timer=None, lines=[
        N("So, would you want to hear everyone's thoughts? Tell me in the comments.")], extra=1.2),
]


# ======================================================================================
# Engine hooks (patch story_short so its renderer draws this story)
# ======================================================================================
CAP_COLORS = {"^": (255, 224, 120), "~": (208, 184, 255)}


def timer_text(k, lt):
    sc, S = base.SCENES[k], base.TL[k]
    if sc["timer"] is None:
        return None
    if sc["timer"] == "count":
        nmax, tick = sc.get("count_n", 10), sc.get("tick", 0.62)
        n0 = S["te"][0] + 0.3
        if lt < n0:
            return f"00:00:{nmax:02d}", True
        n = max(0, nmax - int((lt - n0) / tick))
        if lt > S["dur"] - 0.45:
            n = 0
        return f"00:00:{n:02d}", True
    left = int(86400 - sc["timer"] * 3600 - lt)
    return f"{left // 3600:02d}:{left % 3600 // 60:02d}:{left % 60:02d}", False


def install():
    base.TITLE, base.PART, base.SCENES = TITLE, PART, SCENES
    base.ARM_POSES["head"] = ((110, -30), (34, -124))       # hands on head / covering ears
    orig_bg = base.bg

    @functools.lru_cache(maxsize=None)
    def bg(name):
        return MY_BGS[name]() if name in MY_BGS else orig_bg(name)

    base.bg = bg
    base.timer_text = timer_text
    orig_ts = base.text_sprite

    def caption_sprite(markup, size, color=(255, 255, 255), hl=(255, 255, 255), kind="black", **kw):
        if markup[:1] in CAP_COLORS:                       # coloured captions for said / thought lines
            c = CAP_COLORS[markup[0]]
            return orig_ts(markup[1:], size, c, c, kind, **kw)
        return orig_ts(markup, size, color, hl, kind, **kw)

    base.text_sprite = caption_sprite


def build_timeline(voices, chat_v):
    t = 0.35
    tl, caps, voice_at, chat_at = [], [], [], []
    li = ci = 0
    for sc in SCENES:
        start = t
        tsl, tel = [], []
        for line in sc["lines"]:
            v = voices[li] if voices else None
            dur = len(v) / SR if v is not None else max(1.0, len(line["text"].split()) / 2.7)
            if line["kind"] == "think":
                t += 0.12
            tsl.append(t - start)
            tel.append(t - start + dur)
            voice_at.append((li, t))
            mark = {"narr": "", "say": "^", "think": "~"}[line["kind"]]
            chunks = chunk_caption(line["text"])
            wts = [len(c) + 3 for c in chunks]
            tot = sum(wts)
            ct = t
            for c, wgt in zip(chunks, wts):
                cd = dur * wgt / tot
                caps.append((ct, ct + cd, mark + c.upper().strip(",.:")))
                ct += cd
            t += dur + (0.32 if line["kind"] == "think" else 0.22)
            li += 1
        chat = []
        ch = sc.get("chatter")
        if ch:
            k, off = ch["at"]
            for i in range(len(ch["items"])):
                c0 = tsl[k] + off + i * ch["gap"]
                clen = len(chat_v[ci]) / SR if chat_v else 1.0
                chat.append((c0, clen))
                chat_at.append((ci, start + c0))
                t = max(t, start + c0 + clen + 0.3)
                ci += 1
        t += sc.get("extra", 0.0) + 0.25
        tl.append(dict(start=start, dur=t - start, ts=tsl, te=tel, chat=chat))
    return tl, caps, voice_at, chat_at, t


# ======================================================================================
# Audio
# ======================================================================================
def smooth(x, sec):
    k = max(1, int(sec * SR))
    c = np.cumsum(np.concatenate([np.zeros(k), x, np.full(k, x[-1])]))
    return ((c[2 * k:] - c[:-2 * k]) / (2 * k))[:len(x)]


def fftconv(a, b):
    m = 1 << int(np.ceil(np.log2(len(a) + len(b))))
    return np.fft.irfft(np.fft.rfft(a, m) * np.fft.rfft(b, m), m)[:len(a) + len(b) - 1]


def inner_voice(sig):
    """'Voice in your head': band-limited, short echoes + a small room."""
    n = len(sig) + int(0.9 * SR)
    x = np.zeros(n)
    x[:len(sig)] = sig
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X *= np.where((f < 200) | (f > 5500), 0.3, 1.0)
    x = np.fft.irfft(X, n)
    y = x.copy()
    for dly, g in ((0.085, 0.32), (0.17, 0.18), (0.26, 0.09)):
        k = int(dly * SR)
        y[k:] += x[:-k] * g
    rng = np.random.default_rng(11)
    L = int(0.7 * SR)
    ir = rng.standard_normal(L) * np.exp(-np.arange(L) / SR * 6.5)
    ir /= np.sqrt(np.sum(ir ** 2))
    out = 0.82 * y + 0.22 * fftconv(y, ir)[:n]
    return out * (np.abs(sig).max() / (np.abs(out).max() + 1e-9))


def build_audio(voices, voice_at, chat_v, chat_at, total, tl):
    n = int(total * SR) + SR
    rng = np.random.default_rng(3)
    lines = [l for sc in SCENES for l in sc["lines"]]

    def tt(sec):
        return np.arange(int(sec * SR)) / SR

    def add(buf, sig, at, g=1.0):
        i = int(at * SR)
        if i < 0 or i >= n:
            return
        j = min(n, i + len(sig))
        buf[i:j] += sig[:j - i] * g

    def tone(f, sec, harm=(1, 0.4, 0.15), dec=3.0):
        x = tt(sec)
        return sum(a * np.sin(2 * np.pi * f * (k + 1) * x) for k, a in enumerate(harm)) * np.minimum(1, x / 0.006) * np.exp(-x * dec)

    def bandnoise(sec, lo, hi):
        m = int(sec * SR)
        spec = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        spec[(fr < lo) | (fr > hi)] = 0
        s = np.fft.irfft(spec, m)
        return s / (np.abs(s).max() + 1e-9)

    def sweep(f0, f1, sec):
        x = tt(sec)
        return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * x / sec) / SR)

    def at(i, line, off=0.0):
        return tl[i]["start"] + tl[i]["ts"][line] + off

    # --- music: piano arps + pad (keys) and a soft kick, each with its own level curve
    keys, kick = np.zeros(n), np.zeros(n)
    chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]
    beat = 60 / 92
    b, tpos = 0, 0.0
    while tpos < total:
        ch = chords[(b // 4) % 4]
        for e in range(2):
            add(keys, tone(ch[(b * 2 + e) % 3] * (2 if e else 1), 1.2, dec=2.5), tpos + e * beat / 2, 0.16)
        if b % 4 == 0:
            add(keys, tone(ch[0] / 2, beat * 4, (1, 0.3), 0.8), tpos, 0.22)
        x = tt(0.25)
        add(kick, np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-x * 25)) / SR) * np.exp(-x * 12), tpos, 0.25)
        b += 1
        tpos += beat
    ek, eb = np.ones(n), np.ones(n)

    def level(t0, t1, k_, b_):
        i, j = int(t0 * SR), int(t1 * SR)
        ek[i:j], eb[i:j] = k_, b_

    S = tl[3]
    level(at(3, 3, -0.2), S["start"] + S["dur"], 0.45, 0.0)          # the friend's real thought
    level(tl[4]["start"], tl[4]["start"] + tl[4]["dur"], 0.45, 0.0)  # overload
    level(tl[5]["start"], tl[5]["start"] + tl[5]["dur"], 0.12, 0.0)  # countdown
    level(tl[6]["start"], tl[6]["start"] + tl[6]["dur"], 0.75, 0.0)  # the talk
    music = keys * smooth(ek, 0.3) + kick * smooth(eb, 0.3)

    # --- voices
    out, venv = np.zeros(n), np.zeros(n)
    if voices:
        for li, t0 in voice_at:
            sig, kind = voices[li], lines[li]["kind"]
            if kind == "think":
                sig = inner_voice(sig)
            add(out, sig, t0, 1.0 if kind == "narr" else 0.95)
            add(venv, np.ones(len(voices[li])), t0)
    if chat_v:
        for ci, t0 in chat_at:
            add(out, inner_voice(chat_v[ci]), t0, 0.40)
            add(venv, np.ones(len(chat_v[ci])) * 0.6, t0)
    music *= 1 - 0.55 * np.clip(smooth(venv, 0.12), 0, 1)

    # --- SFX
    sfx = np.zeros(n)

    def whoosh(sec=0.4):
        return bandnoise(sec, 500, 5000) * np.sin(np.pi * tt(sec) / sec) ** 2

    def shimmer():
        x = tt(0.7)
        env = np.sin(np.pi * x / 0.7) ** 2 * (0.75 + 0.25 * np.sin(2 * np.pi * 7 * x))
        s = sweep(420, 1300, 0.7) * env
        for k in range(4):
            sp = tone(2093 * (1 + k * 0.125), 0.3, (1,), 12) * 0.4
            i = int((0.1 + k * 0.12) * SR)
            j = min(len(s), i + len(sp))
            s[i:j] += sp[:j - i]
        return s

    def thump():
        x = tt(0.22)
        return np.sin(2 * np.pi * np.cumsum(42 + 40 * np.exp(-x * 30)) / SR) * np.exp(-x * 16)

    for s_ in tl[1:]:
        add(sfx, whoosh(), s_["start"] - 0.15, 0.18)
    li = 0
    for i, sc in enumerate(SCENES):
        for j, line in enumerate(sc["lines"]):
            if line["kind"] == "think":
                add(sfx, shimmer(), at(i, j, -0.25), 0.10)
            li += 1
    # 0 kitchen: the power switches on
    t_on = at(0, 0, 1.0)
    x = tt(0.6)
    add(sfx, bandnoise(0.6, 2000, 9000) * (x / 0.6) ** 2, t_on - 0.6, 0.18)
    add(sfx, thump(), t_on, 0.7)
    add(sfx, shimmer(), t_on, 0.14)
    # 1 bus rumble + chatter
    S = tl[1]
    rum = bandnoise(S["dur"], 40, 180) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * tt(S["dur"])))
    add(sfx, rum, S["start"], 0.22)
    # 2 hallway: bell, then the "bonk" when he sees the tag
    S = tl[2]
    bell = tone(1250, 0.9, (1, 0.5, 0.2), 3) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 28 * tt(0.9))))
    add(sfx, bell, S["start"] + 0.1, 0.05)
    x = tt(0.4)
    add(sfx, np.sign(sweep(700, 160, 0.4)) * np.exp(-x * 6) * 0.5, S["start"] + S["te"][1] + 0.25, 0.22)
    # 3 cafeteria murmur that drops out when you hear his real thought
    S = tl[3]
    mur = bandnoise(S["dur"], 250, 1300)
    env = np.ones(len(mur))
    i0 = int((S["ts"][3] - 0.3) * SR)
    env[i0:] = np.exp(-np.arange(len(env) - i0) / SR * 4)
    add(sfx, mur * env, S["start"], 0.07)
    # 4 overload: heartbeat speeding up + rising drone
    S = tl[4]
    tb, gap = S["start"] + 0.3, 0.95
    while tb < S["start"] + S["dur"] - 0.3:
        add(sfx, thump(), tb, 0.55)
        add(sfx, thump(), tb + 0.16, 0.38)
        tb += gap
        gap = max(0.42, gap * 0.9)
    x = tt(S["dur"])
    drone = (np.sin(2 * np.pi * 55 * x) + 0.5 * np.sin(2 * np.pi * 82.4 * x) + 0.3 * np.sin(2 * np.pi * 110 * x))
    add(sfx, drone * (x / S["dur"]) ** 1.5, S["start"], 0.12)
    # 5 countdown ticks, then everything goes quiet
    S = tl[5]
    sc5 = SCENES[5]
    n0 = S["start"] + S["te"][0] + 0.3
    for i in range(sc5["count_n"]):
        add(sfx, np.sin(2 * np.pi * 2600 * tt(0.03)) * np.exp(-tt(0.03) * 200), n0 + i * sc5["tick"], 0.7)
        add(sfx, tone(330 + i * 40, 0.25, (1, 0.5), 9), n0 + i * sc5["tick"], 0.25)
    x = tt(1.4)
    add(sfx, sweep(1400, 300, 1.4) * np.exp(-x * 3) * 0.6 + bandnoise(1.4, 300, 4000) * np.exp(-x * 4) * 0.3,
        S["start"] + S["dur"] - 0.45, 0.35)
    # 6 park: a few birds
    S = tl[6]
    br = random.Random(9)
    for _ in range(9):
        t0 = S["start"] + br.uniform(0.3, S["dur"] - 0.5)
        for c in range(br.randint(2, 3)):
            add(sfx, sweep(3200, 4600, 0.07) * np.sin(np.pi * tt(0.07) / 0.07), t0 + c * 0.11, 0.05)
    # 7 CTA pop
    add(sfx, tone(1200, 0.25, (1, 0.3), 14), tl[7]["start"] + 0.05, 0.15)

    mix = out + music * 0.85 + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.92
    f = int(0.5 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    return mix


# ======================================================================================
def tts_one(text, voice_id, cache):
    r = base.synth_voice_elevenlabs([text], cache, voice_id)
    return r[0] if r else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "thoughts_24h_story.mp4"))
    ap.add_argument("--preview", help="comma separated times: save PNG stills only")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    ap.add_argument("--tts", choices=["elevenlabs", "none"],
                    default="elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "none")
    ap.add_argument("--narrator", default=NARRATOR, help="ElevenLabs voice ID for the narrator")
    args = ap.parse_args()
    install()

    lines = [l for sc in SCENES for l in sc["lines"]]
    chats = [it for sc in SCENES for it in sc.get("chatter", {}).get("items", [])]
    cache = os.path.join(HERE, ".tts_cache")
    voices = chat_v = None
    if args.tts == "elevenlabs":
        voices = [tts_one(l["text"], args.narrator if l["who"] == "narrator" else CAST[l["who"]], cache)
                  for l in lines]
        chat_v = [tts_one(it[1], CAST[it[0]], cache) for it in chats]
        if any(v is None for v in voices + chat_v):
            sys.exit("ElevenLabs narration failed (see message above).")
    tl, caps, voice_at, chat_at, total = build_timeline(voices, chat_v)
    base.init_worker(tl, caps, total)
    print(f"Video length: {total:.1f}s")
    for i, s in enumerate(tl):
        print(f"  scene {i}  {s['start']:6.2f}s  ({s['dur']:.2f}s)  {SCENES[i]['fn'].__name__}")

    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for x in args.preview.split(","):
            p = os.path.join(HERE, "preview", f"thoughts_{float(x):06.2f}.png")
            base.render_frame(float(x)).save(p)
            print("saved", p)
        return

    wav = os.path.splitext(args.out)[0] + "_audio.wav"
    base.write_wav(wav, build_audio(voices, voice_at, chat_v, chat_at, total, tl))
    nfr = int(total * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000",   # YouTube level
           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", args.out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    base.static_frame()
    t0 = time.time()
    with mp.get_context("fork").Pool(args.workers, initializer=base.init_worker, initargs=(tl, caps, total)) as pool:
        for i, buf in enumerate(pool.imap(base.render_bytes, range(nfr), chunksize=6)):
            ff.stdin.write(buf)
            if i % 300 == 0:
                print(f"  frame {i}/{nfr}  ({time.time() - t0:.0f}s)", flush=True)
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    print(f"Done -> {args.out}")


if __name__ == "__main__":
    main()
