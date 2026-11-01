#!/usr/bin/env python3
"""
"What If You Lived For 1 Quadrillion Years?"  (story Short, Part 1)

Same look as the other story videos (story_short.py engine): plaid frame, title box, animated 16:9 panel,
"Part 1" label, synced captions, a chapter tag and a live YEAR counter (0 -> 1,000,000,000,000,000).

You can't age, can't get hurt and don't need food, water or air. The story follows real science
(round numbers from current estimates) through deep time: Earth's future, the Sun's death, the end of
the stars, and the black dwarf era. A personal thread (Mom's last words: "whenever it gets dark, look up")
pays off at the end, when two brown dwarfs collide and a new star is born in the dark.

Narrator: Mike (ElevenLabs). Mom: Matilda. Score and sound effects: ElevenLabs Music / sound-effects API,
generated once and kept in audio/quadrillion/.

Usage:
  python youtube_short/quadrillion_short.py                     # -> youtube_short/quadrillion_years_story.mp4
  python youtube_short/quadrillion_short.py --preview 3,60,150  # PNG stills only (youtube_short/preview/)
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
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import million_years_short as my  # noqa: E402
import story_short as base  # noqa: E402
import thoughts_short as th  # noqa: E402
from crush_swap_short import (decode, eleven_post, fft_filter, keys_at, loudnorm_filter, reverb,  # noqa: E402
                              tears)
from make_short import (clamp01, ease_in_out, ease_out_back, ease_out_cubic, emoji_sized, font,  # noqa: E402
                        lerp, paste, place, prog, text_sprite)
from story_short import (FLOOR, FPS, H, INK, PH, PW, SR, TAG_INSET, W, WH, WW, chunk_caption,  # noqa: E402
                         floor_band, person, star4, te, ts, vgrad, window)

TITLE = "What If You Lived For 1 Quadrillion Years?"
PART = "Part 1"
NARRATOR = os.environ.get("ELEVENLABS_VOICE_ID", "zfc8CJQpe8Kqyl0vvCzo")   # Mike - 2D & 3D POV/Storytime
VOICE = {"narr": NARRATOR, "mom": "XrExE9yKIg1WjnnlVkGX"}                   # Matilda
ASSETS = os.path.join(HERE, "audio", "quadrillion")
GARAMOND_IT = os.path.join(HERE, "fonts", "EBGaramond-Italic.ttf")
HAIR = "quiff"
MOM = my.MOM
GOLD = (255, 205, 90)
VOICE_LEVEL = 0.2


def N(text, cap=None, pre=0.0):
    return dict(text=text, cap=cap or text, voice="narr", mark="", pre=pre, echo=False)


def MOMSAYS(text, echo=False, pre=0.0):
    return dict(text=text, cap=text, voice="mom", mark="~", pre=pre, echo=echo)


# ======================================================================================
# Helpers
# ======================================================================================
def label(d, xy, text, size=44, fill=(255, 255, 255), a=255, anchor="mm"):
    d.text(xy, text, font=font("black", size), fill=fill[:3] + (int(a),), anchor=anchor,
           stroke_width=max(2, size // 12), stroke_fill=(16, 16, 26, int(a)))


def hero(d, x, yf, lt, **kw):
    kw.setdefault("expr", "neutral")
    person(d, x, yf, kw.pop("u", 1.0), hair=HAIR, t=lt, seed=1, **kw)
    return th.head_of(x, yf, 1.0, kw.get("pose") == "sit")


def floater(img, x, y, lt, u=0.62, alpha=1.0, rot=None, tint=None, **kw):
    """The hero floating in space: drawn on a layer, slowly turning and bobbing."""
    lay = Image.new("RGBA", (720, 900), (0, 0, 0, 0))
    kw.setdefault("arms", ("shrug", "shrug"))
    kw.setdefault("expr", "neutral")
    person(ImageDraw.Draw(lay, "RGBA"), 360, 800, u, hair=HAIR, t=lt, seed=1, **kw)
    if tint:
        col = Image.new("RGBA", lay.size, tint[:3] + (255,))
        a = lay.getchannel("A")
        lay = Image.blend(lay, Image.composite(col, lay, a), tint[3] / 255)
        lay.putalpha(a)
    r = math.sin(lt * 0.6) * 9 if rot is None else rot
    place(img, lay, x, y + math.sin(lt * 1.1) * 14, rot=r, alpha=alpha)


def glow_dot(d, x, y, r, col, a=1.0, layers=((4.0, 18), (2.4, 40), (1.5, 90))):
    for k, al in layers:
        d.ellipse((x - r * k, y - r * k, x + r * k, y + r * k), fill=col + (int(al * a),))
    d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(min(255, c + 40) for c in col) + (int(255 * a),))


@functools.lru_cache(maxsize=8)
def galaxy_sprite(size, seed, tilt=0.45, col=(210, 200, 255), core=(255, 236, 200)):
    """Spiral galaxy made of thousands of dots, softly glowing."""
    S = size
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    r = random.Random(seed)
    c = S / 2
    for arm in range(2):
        for i in range(1400):
            t = r.random() ** 0.8 * 4.2
            ang = t * 1.7 + arm * math.pi + r.gauss(0, 0.18)
            rad = (0.06 + 0.9 * t / 4.2) * S * 0.48
            x = c + math.cos(ang) * rad + r.gauss(0, S * 0.012)
            y = c + math.sin(ang) * rad * tilt + r.gauss(0, S * 0.01)
            s = r.choice((1, 1, 1.5, 2))
            a = int(r.randint(90, 220) * (1 - t / 5))
            d.ellipse((x - s, y - s, x + s, y + s), fill=col + (a,))
    for rr, a in ((0.2, 50), (0.12, 110), (0.06, 230)):
        d.ellipse((c - rr * S, c - rr * S * tilt * 1.3, c + rr * S, c + rr * S * tilt * 1.3), fill=core + (a,))
    g = im.filter(ImageFilter.GaussianBlur(S * 0.012))
    g.alpha_composite(im)
    return g


@functools.lru_cache(maxsize=4)
def quote_card(text, size=96):
    f = ImageFont.truetype(GARAMOND_IT, size)
    tw = f.getlength(text)
    im = Image.new("RGBA", (int(tw + 120), int(size * 1.9)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((60, size * 0.35), text, font=f, fill=(255, 236, 170))
    g = im.filter(ImageFilter.GaussianBlur(14))
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    for _ in range(2):
        out.alpha_composite(g)
    out.alpha_composite(im)
    return out


def snow(d, lt, n=120, seed=3, speed=140, alpha=200):
    r = random.Random(seed)
    for _ in range(n):
        x0, y0, s, v = r.uniform(0, WW), r.uniform(0, WH), r.choice((3, 4, 5, 6)), r.uniform(0.6, 1.4)
        y = (y0 + lt * speed * v) % WH
        x = x0 + math.sin(lt * 1.3 + y0) * 30
        d.ellipse((x - s, y - s, x + s, y + s), fill=(255, 255, 255, alpha))


def embers(d, lt, n=80, seed=5, col=(255, 170, 60)):
    r = random.Random(seed)
    for _ in range(n):
        x0, y0, s, v = r.uniform(0, WW), r.uniform(0, WH), r.choice((3, 4, 6)), r.uniform(0.5, 1.5)
        y = (y0 - lt * 160 * v) % WH
        x = x0 + math.sin(lt * 2 + y0) * 26
        d.ellipse((x - s, y - s, x + s, y + s), fill=col + (int(200 * (y / WH)),))


def cards_row(img, lt, S, line, items, y=330, x0=None, gap=270):
    """Icon cards popping in one by one across a narration line."""
    span = te(S, line) - ts(S, line)
    x0 = x0 if x0 is not None else 1080 - gap * (len(items) - 1) / 2
    for i, (emo, lab) in enumerate(items):
        t0 = ts(S, line, 0.15 + i * span / (len(items) + 0.4))
        if lt >= t0:
            place(img, my.icon_card(emo, lab), x0 + i * gap, y, scale=0.4 + 0.6 * ease_out_back(prog(lt, t0, t0 + 0.3)))


# ======================================================================================
# Backgrounds
# ======================================================================================
def bg_hospital():
    im = vgrad(WW, WH, (204, 226, 222), (188, 212, 208))
    d = ImageDraw.Draw(im, "RGBA")
    window(d, (240, 170, 640, 540), (255, 196, 150), (255, 160, 130), frame=(240, 244, 244), panes=2)
    d.rectangle((0, 700, WW, FLOOR), fill=(214, 230, 226))
    floor_band(d, (170, 186, 190))
    d.rounded_rectangle((1060, 640, 1120, FLOOR - 20), radius=20, fill=(230, 232, 236))     # headboard
    d.rounded_rectangle((1090, 800, 1880, 880), radius=24, fill=(250, 252, 252))
    d.rounded_rectangle((1110, 780, 1890, 900), radius=36, fill=(196, 218, 240))
    for lx in (1120, 1850):
        d.rectangle((lx, 900, lx + 22, FLOOR - 20), fill=(160, 166, 176))
    d.rectangle((1966, 300, 1978, FLOOR - 20), fill=(150, 156, 166))                         # monitor stand
    d.rounded_rectangle((1880, 260, 2080, 400), radius=14, fill=(30, 34, 42))
    d.rounded_rectangle((680, 790, 760, 860), radius=10, fill=(150, 120, 200))               # vase + flowers
    for fx, fy, c in ((700, 740, (255, 140, 170)), (730, 720, (255, 220, 120)), (750, 750, (255, 160, 200))):
        d.line((fx, fy, 720, 795), fill=(70, 140, 80), width=5)
        d.ellipse((fx - 18, fy - 18, fx + 18, fy + 18), fill=c)
    d.rectangle((600, 860, 840, 880), fill=(170, 140, 110))
    d.rectangle((620, 880, 640, FLOOR - 20), fill=(150, 120, 96))
    d.rectangle((800, 880, 820, FLOOR - 20), fill=(150, 120, 96))
    return im


def bg_ruins():
    im = vgrad(WW, WH, (62, 54, 110), (240, 150, 110))
    d = ImageDraw.Draw(im, "RGBA")
    d.ellipse((1560, 420, 1780, 640), fill=(255, 200, 130))
    r = random.Random(12)
    for x0 in range(-40, WW, 260):
        h = r.randint(280, 560)
        top = 840 - h
        pts = [(x0, 840), (x0, top + r.randint(0, 60))]
        for k in range(4):
            pts.append((x0 + 40 + k * 45, top + r.randint(-20, 120)))
        pts += [(x0 + 210, top + r.randint(40, 160)), (x0 + 210, 840)]
        d.polygon(pts, fill=(70, 60, 92))
        for wy in range(top + 80, 820, 70):
            for wx in range(x0 + 30, x0 + 190, 56):
                if r.random() < 0.6:
                    d.rectangle((wx, wy, wx + 22, wy + 32), fill=(48, 40, 70))
        for _ in range(4):
            vx, vy = x0 + r.randint(0, 210), r.randint(top + 40, 820)
            d.ellipse((vx - 40, vy - 30, vx + 40, vy + 30), fill=(70, 120, 80, 220))
    d.rectangle((0, 830, WW, FLOOR - 20), fill=(78, 92, 66))
    floor_band(d, (66, 84, 58))
    d.ellipse((780, 900, 1080, 1010), fill=(90, 84, 80))                                     # rock to sit on
    return im


def bg_hotland():
    im = vgrad(WW, WH, (250, 170, 90), (255, 222, 150))
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((0, 800, WW, FLOOR - 20), fill=(196, 140, 92))
    for x in range(0, WW, 180):
        d.polygon([(x, 800), (x + 90, 740 - (x % 360) // 6), (x + 180, 800)], fill=(206, 150, 100))
    floor_band(d, (176, 120, 80))
    return im


def bg_seabed():
    im = vgrad(WW, WH, (255, 246, 214), (255, 214, 160))
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((0, 760, WW, WH), fill=(222, 206, 176))
    r = random.Random(7)
    for _ in range(70):
        x, y = r.uniform(0, WW), r.uniform(790, WH)
        pts = [(x, y)]
        for _k in range(3):
            x, y = x + r.uniform(-90, 90), y + r.uniform(-24, 24)
            pts.append((x, y))
        d.line(pts, fill=(176, 158, 130), width=4)
    for x in range(0, WW, 140):
        d.ellipse((x + 20, 770, x + 120, 800), fill=(244, 238, 226))                          # salt crust
    d.polygon([(0, 760), (300, 600), (520, 700), (760, 560), (1000, 760)], fill=(206, 186, 156))   # old sea cliffs
    return im


def bg_desertnight():
    im = vgrad(WW, WH, (8, 8, 26), (40, 24, 60))
    d = ImageDraw.Draw(im, "RGBA")
    my.draw_stars(d, 41, 260, (0, 0, WW, 820))
    d.polygon([(0, 860), (400, 790), (900, 840), (1400, 780), (2160, 850), (2160, WH), (0, WH)], fill=(40, 26, 30))
    floor_band(d, (46, 30, 32))
    return im


def bg_redsky():
    im = vgrad(WW, WH, (60, 10, 16), (190, 60, 30))
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((0, 860, WW, WH), fill=(70, 30, 26))
    floor_band(d, (64, 26, 22))
    return im


def bg_deepspace():
    im = vgrad(WW, WH, (4, 4, 12), (10, 8, 24))
    d = ImageDraw.Draw(im, "RGBA")
    my.draw_stars(d, 77, 160)
    return im


def bg_black():
    return vgrad(WW, WH, (2, 2, 6), (6, 5, 12))


MY_BGS = {"bedroom": my.bg_bedroom, "hospital": bg_hospital, "future": my.bg_future, "void": my.bg_void,
          "ice": my.bg_ice, "ruins": bg_ruins, "space": my.bg_space, "hotland": bg_hotland, "seabed": bg_seabed,
          "desertnight": bg_desertnight, "redsky": bg_redsky, "deepspace": bg_deepspace, "black": bg_black}


@functools.lru_cache(maxsize=None)
def bg(name):
    return MY_BGS[name]()


# ======================================================================================
# Scenes
# ======================================================================================
def sc_wake(img, d, lt, S):
    stand_t = ts(S, 1, -0.3)
    k = ease_in_out(prog(lt, stand_t, stand_t + 1.0))
    sitting = lt < stand_t
    x = 760 if sitting else lerp(760, 1560, k)
    on = prog(lt, ts(S, 0, 1.4), ts(S, 0, 2.2))
    hx, hy = th.head_of(x, FLOOR, sit=sitting)
    th.aura(d, hx, hy, lt, on, col=GOLD)
    ex = "tired" if lt < ts(S, 0, 1.4) else ("shock" if lt < ts(S, 1) else ("smug" if lt < ts(S, 2) else "shock"))
    if lt > ts(S, 3, 0.8):
        ex = "nervous"
    hero(d, x, FLOOR, lt, pose="sit" if sitting else "stand", expr=ex, walk=None if sitting or k >= 1 else lt * 9,
         look=0.3)
    if ts(S, 1) <= lt < ts(S, 2, 0.1):
        cards_row(img, lt, S, 1, (("👴", "AGING"), ("🤕", "PAIN"), ("🍔", "FOOD"), ("💨", "AIR")), y=330, x0=400,
                  gap=270)
    if ts(S, 2, 0.3) <= lt < ts(S, 3):
        place(img, my.headline("*1 QUADRILLION* YEARS", 120), 1080, 210,
              scale=max(0.01, ease_out_back(prog(lt, ts(S, 2, 0.3), ts(S, 2, 0.7)))))
    if lt >= ts(S, 3):
        n = int(15 * clamp01((lt - ts(S, 3, 0.4)) / max(0.4, te(S, 3) - ts(S, 3) - 0.3)))
        digits = "1" + "0" * n
        groups = []
        while digits:
            groups.insert(0, digits[-3:])
            digits = digits[:-3]
        place(img, my.headline("*" + ",".join(groups) + "*", 112), 1080, 210)
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.08, 1080, 600))])}


def sc_mom(img, d, lt, S):
    gone = prog(lt, ts(S, 3, 0.3), ts(S, 3, 1.6))
    talk = ts(S, 2) < lt < te(S, 2)

    def draw_mom(dd):
        my.old_person(dd, 1300, FLOOR - 90, 0.96, shirt=MOM, cane=False, bun=True, pose="sit", facing=-1, look=-1,
                      expr="happy" if lt > te(S, 2, -0.6) else "tired", talk=talk, t=lt, seed=4, arms=("point", "down"))
    if gone < 1:
        my.ghost(img, 1 - gone, draw_mom)
    else:
        d.ellipse((1240, 760, 1330, 800), fill=(255, 150, 180))                               # a flower left behind
    d.rounded_rectangle((1110, 860, 1890, 900), radius=20, fill=(176, 200, 226))
    hx, hy = hero(d, 820, FLOOR, lt, pose="sit", chair=(150, 120, 96), look=1,
                  arms=("down", "point") if gone < 0.5 else ("down", "down"),
                  expr="sad" if lt < ts(S, 3, 0.4) or lt > ts(S, 3, 1.4) else "shock")
    if lt > ts(S, 3, 1.2):
        tears(d, hx, hy, lt, 1.0, prog(lt, ts(S, 3, 1.2), ts(S, 3, 1.8)))
    # heart monitor: steady beeps, then a flat line
    ox, oy = 1898, 330
    for i in range(18):
        x = ox + i * 10
        ph = ((lt * 1.1) * 18 - i) % 18
        y = oy - (40 if (gone < 0.6 and ph < 1) else 0)
        d.line((x, oy, x + 10, y), fill=(90, 255, 140), width=4)
    th.say_bubble(img, "Promise me... whenever it gets dark, look up.", 1240, 400, lt, ts(S, 2, -0.05), te(S, 2, 0.6),
                  tail="right", size=54)
    cam = keys_at(lt, [(0, (1.0, 1080, 620)), (ts(S, 2), (1.18, 1080, 600)), (te(S, 2), (1.3, 1060, 580)),
                       (ts(S, 3, 1.0), (1.5, 860, 540)), (S["dur"], (1.55, 840, 530))])
    return {"cam": cam, "tint": (255, 150, 90, 26)}


def sc_future(img, d, lt, S):
    for i, (sh, x0, dirn, sp) in enumerate((((120, 230, 255), 300, 1, 120), ((200, 140, 255), 1900, -1, 100),
                                             ((255, 180, 120), 2300, -1, 140))):
        x = x0 + dirn * lt * sp
        person(d, x, FLOOR, 0.92, shirt=sh, hair="bald", hood=False, facing=dirn, walk=lt * 8 + i, t=lt, seed=20 + i)
        hx, hy = th.head_of(x, FLOOR, 0.92)
        d.rounded_rectangle((hx - 70, hy - 24, hx + 70, hy + 6), radius=12, fill=(120, 240, 255, 200))
    hero(d, 1120, FLOOR, lt, expr="nervous", look=1)
    th.say_bubble(img, "Zhel vo taan?", 1640, 430, lt, 0.6, 3.0, tail="right", size=56)
    cards_row(img, lt, S, 0, (("🗣️", "LANGUAGE"), ("🏳️", "COUNTRY"), ("🪪", "YOUR NAME")), y=262, x0=420, gap=270)
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.1, 1040, 600))])}


MEMS = [("👩", "MOM", 1080, 300), ("🏠", "HOME", 460, 380), ("🐶", "MAX", 1720, 380), ("🎂", "10TH BIRTHDAY", 520, 780),
        ("🧑‍🤝‍🧑", "BEST FRIEND", 1660, 790)]


def sc_memory(img, d, lt, S):
    look_up = lt > ts(S, 1, 0.6)
    hero(d, 1080, FLOOR, lt, expr="sad" if not look_up else "neutral", look_y=-1 if look_up else 1)
    span = te(S, 0) - ts(S, 0)
    for i, (emo, lab, x, y) in enumerate(MEMS):
        order = 4 if lab == "MOM" else i - 1
        f = prog(lt, ts(S, 0, span * (0.15 + 0.16 * order)), ts(S, 0, span * (0.35 + 0.16 * order)))
        if f >= 1:
            continue
        sc = 0.9 if lab != "MOM" else 1.0
        place(img, my.polaroid(emo if f < 0.5 else "❔", lab, int(f * 10)), x, y, scale=sc, alpha=1 - f * 0.85,
              rot=(-6 + i * 4))
    if lt >= ts(S, 1, 0.5):
        k = ease_out_cubic(prog(lt, ts(S, 1, 0.5), ts(S, 1, 1.4)))
        place(img, quote_card("“look up.”"), 1080, 300 - 30 * k, alpha=k)
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (ts(S, 1), (1.12, 1080, 600)), (S["dur"], (1.2, 1080, 520))])}


def sc_ice(img, d, lt, S):
    snow(d, lt, 150)
    hero(d, 900 + lt * 40, FLOOR, lt, expr="tired", walk=lt * 6, look=0.4)
    # constellation inset: the Big Dipper drifting apart
    k = ease_in_out(prog(lt, ts(S, 0, 1.6), te(S, 0, -0.3)))
    x0, y0 = 1330, 150
    d.rounded_rectangle((x0, y0, x0 + 640, y0 + 470), radius=30, fill=(10, 16, 42, 235), outline=(255, 255, 255, 200),
                        width=4)
    pts = [(x0 + lerp(a[0], b[0], k) - 120, y0 + lerp(a[1], b[1], k) - 50) for a, b in zip(my.BD_NOW, my.BD_LATER)]
    d.line(pts, fill=(140, 180, 255, int(200 * (1 - k))), width=4)
    for x, y in pts:
        glow_dot(d, x, y, 6, (255, 255, 240))
    label(d, (x0 + 320, y0 + 420), "THE BIG DIPPER" if k < 0.5 else "...GONE", 38)
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.08, 1120, 600))])}


def sc_alone(img, d, lt, S):
    r = random.Random(3)
    for i in range(16):
        x = r.uniform(200, 2000) + math.sin(lt + i) * 40
        y = r.uniform(500, 960) + math.cos(lt * 1.3 + i) * 30
        glow_dot(d, x, y, 4, (220, 255, 140), 0.5 + 0.5 * math.sin(lt * 3 + i))
    fx, fy = 1210, FLOOR - 30
    for k_ in range(3):
        fl = 60 + 20 * math.sin(lt * 9 + k_)
        d.polygon([(fx - 50 + k_ * 30, fy), (fx - 20 + k_ * 20, fy - fl), (fx + 10 + k_ * 10, fy)],
                  fill=(255, 150 + k_ * 40, 60, 220))
    d.ellipse((fx - 260, fy - 200, fx + 260, fy + 100), fill=(255, 170, 80, 30))
    hx, hy = hero(d, 930, FLOOR - 40, lt, pose="sit", expr="sad", look=0.6, look_y=0.5)
    th.show_thought(img, "hello...?", hx - 90, hy - 70, lt, ts(S, 1, 0.3), 99, side="right", size=54, mood="sad")
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.3, 1000, 600))])}


def sc_pangaea(img, d, lt, S):
    merge = ease_in_out(prog(lt, 0.6, te(S, 0, -0.4)))
    cx, cy, R = 1080, 660, 380
    globe(img, cx, cy, R, merge, lt)
    person(d, cx, cy - R + 8, 0.2, hair=HAIR, t=lt, seed=1, expr="happy")
    if merge > 0.5:
        label(d, (1080, 230), "ONE SUPERCONTINENT", 62, fill=(200, 255, 210), a=255 * prog(merge, 0.5, 0.8))
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.06, 1080, 640))])}


BLOBS = [(-0.55, -0.2, 0.34, 0.26), (-0.1, -0.45, 0.3, 0.2), (0.45, -0.25, 0.36, 0.28), (0.5, 0.35, 0.24, 0.2),
         (-0.35, 0.4, 0.22, 0.24), (0.05, 0.62, 0.2, 0.14)]


def globe(img, cx, cy, R, merge, lt):
    s = int(2 * R)
    lay = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay, "RGBA")
    ld.ellipse((0, 0, s - 1, s - 1), fill=(40, 110, 200))
    for bx, by, bw, bh in BLOBS:
        x = (0.5 + bx * 0.5 * (1 - merge * 0.62)) * s + math.sin(lt * 0.3) * 6
        y = (0.5 + by * 0.5 * (1 - merge * 0.62)) * s
        ld.ellipse((x - bw * s / 2, y - bh * s / 2, x + bw * s / 2, y + bh * s / 2), fill=(112, 172, 92))
    ld.ellipse((s * 0.32, -s * 0.05, s * 0.68, s * 0.08), fill=(240, 245, 250))
    m = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
    lay.putalpha(m)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((cx - R - 18, cy - R - 18, cx + R + 18, cy + R + 18), fill=(120, 180, 255, 50))
    paste(img, lay, cx - R, cy - R)


TREES = [(330, 1.1), (620, 0.85), (1500, 1.0), (1800, 1.2), (2060, 0.9)]


def sc_plants(img, d, lt, S):
    k = ease_in_out(prog(lt, 0.4, te(S, 0, -0.4)))
    sr = 220 + 90 * k
    for rr, a in ((sr * 1.8, 40), (sr * 1.35, 70)):
        d.ellipse((1080 - rr, 120 - rr, 1080 + rr, 120 + rr), fill=(255, 250, 220, a))
    d.ellipse((1080 - sr, 120 - sr, 1080 + sr, 120 + sr), fill=(255, 252, 236))
    r = random.Random(4)
    for x, s in TREES:
        d.line((x, FLOOR - 20, x, FLOOR - 20 - 330 * s), fill=(90, 62, 44), width=int(26 * s))
        for (a, b) in ((-0.6, 0.55), (0.5, 0.65), (-0.3, 0.8), (0.35, 0.9)):
            ex, ey = x + a * 160 * s, FLOOR - 20 - 330 * s * b - 60 * s
            d.line((x, FLOOR - 20 - 330 * s * b, ex, ey), fill=(90, 62, 44), width=int(12 * s))
            for j in range(3):
                drop = clamp01((k - r.random() * 0.6) / 0.4)
                lx, ly = ex + r.uniform(-40, 40) * s, ey + r.uniform(-30, 20) * s + drop * 400
                col = (int(lerp(80, 170, k)), int(lerp(160, 120, k)), int(lerp(80, 50, k)), int(255 * (1 - drop * 0.9)))
                d.ellipse((lx - 34 * s, ly - 26 * s, lx + 34 * s, ly + 26 * s), fill=col)
    for i in range(6):
        y = 700 + i * 50
        d.line([(x, y + math.sin(x * 0.02 + lt * 6 + i) * 6) for x in range(0, WW, 40)], fill=(255, 240, 200, 50),
               width=3)
    hero(d, 1080, FLOOR, lt, expr="sad", look=-0.3, look_y=-0.4)
    show = ts(S, 0, 1.6)
    if lt > show:
        base.show_card(img, my.info_card("THE SUN", "6% brighter than today", "☀️", 800, size=52), 580, 420, lt, show)
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.1, 1080, 640))])}


def sc_oceans(img, d, lt, S):
    k = ease_in_out(prog(lt, 0.3, te(S, 0)))
    wy = lerp(760, 1240, k)
    d.rectangle((0, wy, WW, WH), fill=(70, 140, 190, 230))
    for i in range(14):
        ph = (lt * 0.4 + i / 14) % 1
        x = 100 + i * 150 + math.sin(lt + i) * 30
        y = wy - ph * 500
        d.ellipse((x - 60, y - 40, x + 60, y + 40), fill=(255, 255, 255, int(110 * (1 - ph) * (1 - k * 0.7))))
    for rr, a in ((420, 50), (300, 90)):
        d.ellipse((1640 - rr, 160 - rr, 1640 + rr, 160 + rr), fill=(255, 255, 240, a))
    d.ellipse((1460, -20, 1820, 340), fill=(255, 255, 248))
    hero(d, 1300, FLOOR, lt, expr="neutral" if lt < ts(S, 1) else "sad", look_y=1 if lt > ts(S, 1) else 0)
    if lt >= ts(S, 1, 0.8):
        base.show_card(img, my.info_card("STILL ALIVE", "microbes, deep underground", "🦠", 900, size=50), 560, 380,
                       lt, ts(S, 1, 0.8))
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.1, 1040, 620))])}


def sc_andromeda(img, d, lt, S):
    k = ease_in_out(prog(lt, 0.2, S["dur"]))
    g1 = galaxy_sprite(900, 5)
    g2 = galaxy_sprite(900, 9, tilt=0.35, col=(255, 210, 230))
    place(img, g1, lerp(700, 980, k), 380, scale=lerp(0.9, 1.4, k), rot=12)
    place(img, g2, lerp(1600, 1200, k), 360, scale=lerp(1.0, 1.3, k), rot=-25)
    r = random.Random(int(lt * 5))
    if k > 0.4:
        for _ in range(int(12 * k)):
            star4(d, r.uniform(700, 1500), r.uniform(200, 560), r.uniform(8, 20), (255, 240, 255, 230))
    hero(d, 1080, FLOOR, lt, expr="shock" if lt < 2.5 else "happy", look_y=-1, look=0.1)
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.12, 1080, 560))])}


def sc_redgiant(img, d, lt, S):
    grow = ease_in_out(prog(lt, 0.2, te(S, 0)))
    melt = ease_in_out(prog(lt, ts(S, 1), te(S, 1, 0.4)))
    R = lerp(260, 2400, grow)
    cy = 300 + R * 0.55
    for rr, a in ((R * 1.25, 50), (R * 1.1, 90)):
        d.ellipse((1080 - rr, cy - rr, 1080 + rr, cy + rr), fill=(255, 110, 40, a))
    d.ellipse((1080 - R, cy - R, 1080 + R, cy + R), fill=(236, 70, 30))
    r = random.Random(2)
    for _ in range(24):
        a, rr = r.uniform(0, math.tau), r.uniform(0.2, 0.95) * R
        x, y = 1080 + math.cos(a) * rr, cy + math.sin(a) * rr
        s = R * r.uniform(0.04, 0.09)
        d.ellipse((x - s, y - s, x + s, y + s), fill=(255, 140, 60, 120))
    gy = min(WH - 2, 860 + melt * 420)
    d.rectangle((0, gy, WW, WH), fill=(int(lerp(70, 255, melt)), int(lerp(30, 120, melt)), 30))
    for i in range(10):
        x = 120 + i * 210
        d.line((x, gy, x + 60, gy + 160), fill=(255, 200, 80, int(200 * min(1, grow * 2))), width=8)
    embers(d, lt, int(40 + 80 * melt))
    hy = FLOOR - melt * 160
    hero(d, 1080, hy, lt, expr="neutral" if lt < ts(S, 1, 0.6) else "sad", look_y=-1 if lt < ts(S, 1) else 0,
         arms=("shrug", "shrug") if melt > 0.3 else ("down", "down"))
    fx = {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.15, 1080, 600))]),
          "tint": (255, 60, 20, int(60 * grow + 60 * melt))}
    if ts(S, 1) < lt:
        fx["shake"] = 0.35 * (1 - prog(lt, ts(S, 1), S["dur"]))
    return fx


def sc_whitedwarf(img, d, lt, S):
    k = prog(lt, 0, S["dur"])
    for i, (col, rr) in enumerate((((120, 220, 255), 520), ((255, 120, 170), 430), ((170, 255, 200), 340))):
        rr = rr * (0.9 + 0.15 * k)
        d.ellipse((900 - rr, 600 - rr * 0.8, 900 + rr, 600 + rr * 0.8), outline=col + (90,), width=60 - i * 12)
    glow_dot(d, 900, 600, 22, (240, 246, 255), layers=((7, 30), (4, 60), (2, 140)))
    drift = ease_in_out(prog(lt, ts(S, 1), S["dur"]))
    floater(img, lerp(1640, 1300, drift), 560, lt, expr="sad" if lt < ts(S, 1) else "happy", look=-1,
            tint=(200, 220, 255, 40))
    if lt < ts(S, 1):
        label(d, (900, 230), "WHITE DWARF (WHAT'S LEFT OF THE SUN)", 40, a=255 * prog(lt, 1.0, 1.4))
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.2, 1080, 600))])}


GALAXIES = [(360, 260, 300, 3), (1780, 240, 260, 7), (620, 820, 220, 11), (1600, 860, 280, 13), (1100, 180, 180, 17),
            (220, 600, 160, 19)]


def sc_vanish(img, d, lt, S):
    span = te(S, 0) - ts(S, 0)
    for i, (x, y, s, seed) in enumerate(GALAXIES):
        f = prog(lt, ts(S, 0, span * (0.35 + 0.1 * i)), ts(S, 0, span * (0.55 + 0.1 * i)))
        if f < 1:
            place(img, galaxy_sprite(400, seed, col=(int(lerp(210, 255, f)), int(lerp(200, 120, f)), int(lerp(255, 120, f)))),
                  x, y, scale=s / 400 * (1 - 0.6 * f), alpha=1 - f, rot=seed * 13)
    floater(img, 1080, 620, lt, expr="sad", look_y=-0.6)
    if lt > te(S, 0, -0.6):
        label(d, (1080, 1000), "EVERY OTHER GALAXY: GONE", 52, a=255 * prog(lt, te(S, 0, -0.6), te(S, 0, -0.2)))
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.08, 1080, 620))])}


REDS = [(300, 300), (620, 180), (900, 420), (1300, 260), (1640, 420), (1900, 200), (420, 700), (760, 880), (1460, 780),
        (1820, 900), (1180, 960), (200, 1000)]


def sc_reddwarfs(img, d, lt, S):
    span = te(S, 0) - ts(S, 0)
    for i, (x, y) in enumerate(REDS):
        f = prog(lt, ts(S, 0, span * (0.4 + 0.05 * i)), ts(S, 0, span * (0.45 + 0.05 * i) + 0.5))
        if f < 1:
            glow_dot(d, x, y, 10, (255, 90, 60), 1 - f)
    floater(img, 1080, 600, lt, expr="tired", look=0.5, tint=(255, 80, 60, 30))
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (S["dur"], (1.1, 1080, 620))])}


def sc_laststar(img, d, lt, S):
    out_t = te(S, 0, -0.35)
    f = prog(lt, out_t - 0.6, out_t)
    if f < 1:
        glow_dot(d, 1080, 330, 14 * (1 - 0.5 * f), (255, 80, 50), 1 - f, layers=((8, 20), (4, 50), (2, 110)))
    dark = prog(lt, out_t, out_t + 1.2)
    floater(img, 1080, 680, lt, expr="sad", look_y=-1, alpha=1 - 0.75 * dark, tint=(40, 30, 60, int(160 * dark)))
    return {"cam": keys_at(lt, [(0, (1.0, 1080, 560)), (S["dur"], (1.25, 1080, 520))])}


def sc_quad(img, d, lt, S):
    # the Sun as a black dwarf: a cold ball, only a faint rim
    for w_, a in ((60, 30), (34, 60), (14, 120)):
        d.ellipse((-560 - w_, 200 - w_, 440 + w_, 1200 + w_), outline=(120, 50, 60, a), width=w_)
    d.ellipse((-560, 200, 440, 1200), fill=(8, 7, 12))
    if lt < ts(S, 1):
        label(d, (420, 1090), "BLACK DWARF (THE SUN)", 40, fill=(210, 170, 180), a=230 * prog(lt, 1.5, 2.0))
    star_t = te(S, 5, -0.4)                         # the brown dwarfs collide
    light = ease_in_out(prog(lt, star_t, star_t + 2.2))
    look = lt > ts(S, 4, 0.2)
    sx, sy = 1500, 300
    if ts(S, 5) <= lt < star_t:
        p = ease_in_out(prog(lt, ts(S, 5), star_t))
        for side in (-1, 1):
            glow_dot(d, sx + side * lerp(380, 8, p), sy + side * lerp(-60, 0, p), 12, (150, 50, 40), 0.9)
    if lt >= star_t:
        r = 18 + 20 * light
        for i in range(10):
            a = i * math.pi / 5 + lt * 0.15
            d.polygon([(sx, sy), (sx + math.cos(a) * 1800, sy + math.sin(a) * 1800),
                       (sx + math.cos(a + 0.08) * 1800, sy + math.sin(a + 0.08) * 1800)], fill=(255, 210, 150, int(26 * light)))
        glow_dot(d, sx, sy, r, (255, 196, 120), layers=((9, 26), (5, 50), (2.5, 120)))
        if lt < star_t + 0.25:
            d.rectangle((0, 0, WW, WH), fill=(255, 255, 255, int(200 * (1 - (lt - star_t) / 0.25))))
    span1 = te(S, 1) - ts(S, 1)
    for i, (word, wx, wy) in enumerate((("YOUR NAME", 600, 640), ("EARTH", 860, 420), ("YOUR LIFE", 1620, 560))):
        t0 = ts(S, 1, span1 * (0.1 + 0.28 * i))
        if t0 <= lt < t0 + 2.2:
            q = (lt - t0) / 2.2
            label(d, (wx, wy - q * 200), word, 52, fill=(200, 200, 220), a=220 * (1 - q))
    if ts(S, 3, -0.1) <= lt < ts(S, 5):
        k = prog(lt, ts(S, 3, -0.1), ts(S, 3, 0.8)) * (1 - prog(lt, ts(S, 4, 0.6), ts(S, 5)))
        place(img, quote_card("“look up.”"), 1080, 300, alpha=k)
    vis = 0.5 + 0.5 * light
    floater(img, 1180, 640, lt, expr="happy" if light > 0.4 else ("sad" if not look else "neutral"),
            look=0.5 if look else 0, look_y=-1 if look else 0.5, alpha=vis, tint=(255, 190, 120, int(60 * light)))
    if light > 0.3:                                 # and for a second, she's right there with you
        def momg(dd):
            for rr, a in ((300, 30), (210, 50)):
                dd.ellipse((860 - rr, 640 - rr, 860 + rr, 640 + rr), fill=(255, 220, 170, a))
            person(dd, 860, 980, 0.62, shirt=MOM, hair="bun", hood=False, t=lt, seed=4, expr="happy", look=1,
                   arms=("down", "wave"))
        my.ghost(img, 0.7 * prog(light, 0.3, 1.0) * (1 - prog(lt, S["dur"] - 0.8, S["dur"])), momg)
    fx = {"cam": keys_at(lt, [(0, (1.0, 1080, 620)), (ts(S, 4), (1.18, 1080, 620)), (ts(S, 4, 1.2), (1.18, 1300, 470)),
                              (star_t + 2.0, (1.05, 1200, 560)), (S["dur"], (1.12, 1150, 580))])}
    if light > 0:
        fx["tint"] = (255, 170, 90, int(36 * light))
    return fx


def sc_cta(img, d, lt, S):
    d.rectangle((0, 0, WW // 2, WH), fill=(6, 6, 16))
    my.draw_stars(d, 31, 70, (0, 0, WW // 2, WH), lt)
    glow_dot(d, 820, 300, 26, (255, 196, 120), layers=((7, 26), (4, 50), (2, 120)))
    d.rectangle((WW // 2, 0, WW, WH), fill=(240, 186, 104))
    d.ellipse((WW * 0.75 - 420, 140, WW * 0.75 + 420, 1000), fill=(255, 214, 140))
    d.line((WW // 2, 0, WW // 2, WH), fill=(255, 255, 255), width=8)
    floater(img, 520, 640, lt, expr="neutral", look=0.4)
    hero(d, 1380, FLOOR, lt, expr="laugh", look=1)
    person(d, 1640, FLOOR, 0.98, shirt=MOM, hair="bun", hood=False, t=lt, seed=4, expr="happy", look=-1, facing=-1,
           arms=("down", "wave"))
    for x, lab in ((540, "1 QUADRILLION YEARS {⏳}"), (1620, "NORMAL LIFE {❤️}")):
        s = text_sprite(lab, 50, INK, INK, "black", stroke=0, shadow=False)
        d.rounded_rectangle((x - s.width / 2 - 30, 70, x + s.width / 2 + 30, 190), radius=28, fill=(255, 255, 252))
        place(img, s, x, 130)
    return {}


# ======================================================================================
# Story
# ======================================================================================
Q = 10 ** 15
SCENES = [
    dict(fn=sc_wake, bg="bedroom", tod="DAY 1", years=(0, 0), lines=[
        N("You wake up one morning, and something is different."),
        N("You don't age. Nothing can hurt you. You never need food, water, or even air."),
        N("And you're going to live for one quadrillion years.", "And you're going to live for 1 quadrillion years."),
        N("That's a one, with fifteen zeros.", "That's a 1, with 15 zeros.")], extra=0.5),
    dict(fn=sc_mom, bg="hospital", tod="MOM", years=(82, 82), lines=[
        N("Year eighty-two. Your mom is dying. She looks older than you ever will.",
          "Year 82. Your mom is dying. She looks older than you ever will."),
        N("She squeezes your hand, and whispers..."),
        MOMSAYS("Promise me... whenever it gets dark, look up."),
        N("Then she's gone. And you still look twenty.", "Then she's gone. And you still look 20.", pre=0.3)],
         extra=0.4),
    dict(fn=sc_future, bg="future", tod="THE FUTURE", years=(82, 1000), lines=[
        N("Year one thousand. Your language is dead. Your country is gone. Nobody even remembers your name.",
          "Year 1,000. Your language is dead. Your country is gone. Nobody even remembers your name.")], extra=0.4),
    dict(fn=sc_memory, bg="void", tod="MEMORIES", years=(1000, 10000), lines=[
        N("Year ten thousand. You've forgotten your mom's face.", "Year 10,000. You've forgotten your mom's face."),
        N("But you never forget her words. Look up.")], extra=0.6),
    dict(fn=sc_ice, bg="ice", tod="ICE AGE", years=(10000, 100000), lines=[
        N("Year one hundred thousand. Ice covers half the planet, and the stars have moved so far, every "
          "constellation you knew is gone.", "Year 100,000. Ice covers half the planet, and the stars have moved so "
          "far, every constellation you knew is gone.")], extra=0.4),
    dict(fn=sc_alone, bg="ruins", tod="ALONE", years=(100000, 1000000), lines=[
        N("Year one million. Humans are gone, or they've changed into something you don't even recognize.",
          "Year 1,000,000. Humans are gone, or they've changed into something you don't even recognize."),
        N("You haven't heard a voice in a very long time.")], extra=0.6),
    dict(fn=sc_pangaea, bg="space", tod="ONE CONTINENT", years=(1000000, 250000000), lines=[
        N("Year two hundred fifty million. All the continents crash together into one giant supercontinent.",
          "Year 250,000,000. All the continents crash together into one giant supercontinent.")], extra=0.5),
    dict(fn=sc_plants, bg="hotland", tod="THE FORESTS", years=(250000000, 600000000), lines=[
        N("Year six hundred million. The Sun keeps getting brighter. Plants can't survive the heat, and the "
          "forests die.", "Year 600,000,000. The Sun keeps getting brighter. Plants can't survive the heat, and the "
          "forests die.")], extra=0.6),
    dict(fn=sc_oceans, bg="seabed", tod="THE OCEANS", years=(600000000, 10 ** 9), lines=[
        N("Year one billion. The oceans boil away into the sky.", "Year 1,000,000,000. The oceans boil away into "
          "the sky."),
        N("Earth is a burning desert. Only tiny microbes survive, deep underground.")], extra=0.5),
    dict(fn=sc_andromeda, bg="desertnight", tod="ANDROMEDA", years=(10 ** 9, 5 * 10 ** 9), lines=[
        N("Year five billion. Our neighbor galaxy, Andromeda, is probably crashing into the Milky Way, and the night "
          "sky lights up with new stars.", "Year 5,000,000,000. Our neighbor galaxy, Andromeda, is probably crashing "
          "into the Milky Way, and the night sky lights up with new stars.")], extra=0.5),
    dict(fn=sc_redgiant, bg="redsky", tod="THE SUN", years=(5 * 10 ** 9, 7600000000), lines=[
        N("Year seven point six billion. The Sun swells into a red giant, and swallows the Earth.",
          "Year 7,600,000,000. The Sun swells into a red giant, and swallows the Earth."),
        N("You're still standing on it. It doesn't hurt. Everything around you just melts.")], extra=0.5),
    dict(fn=sc_whitedwarf, bg="deepspace", tod="WHITE DWARF", years=(7600000000, 8 * 10 ** 9), lines=[
        N("What's left of the Sun shrinks into a white dwarf. A dead star, the size of Earth."),
        N("You float next to it, just to feel something warm.")], extra=0.6),
    dict(fn=sc_vanish, bg="deepspace", tod="THE SKY", years=(8 * 10 ** 9, 150 * 10 ** 9), lines=[
        N("Year one hundred fifty billion. Space is expanding so fast, every other galaxy has vanished from the sky.",
          "Year 150,000,000,000. Space is expanding so fast, every other galaxy has vanished from the sky.")],
         extra=0.6),
    dict(fn=sc_reddwarfs, bg="black", tod="THE LAST STARS", years=(150 * 10 ** 9, 10 ** 13), lines=[
        N("Year ten trillion. The only stars left are tiny red dwarfs. And one by one, they're running out of fuel.",
          "Year 10,000,000,000,000. The only stars left are tiny red dwarfs. And one by one, they're running out of "
          "fuel.")], extra=0.5),
    dict(fn=sc_laststar, bg="black", tod="THE END OF STARS", years=(10 ** 13, 10 ** 14), lines=[
        N("Year one hundred trillion. The very last star in the universe... goes out.",
          "Year 100,000,000,000,000. The very last star in the universe... goes out."),
        N("And it's dark. Completely dark.", pre=0.5)], extra=0.9),
    dict(fn=sc_quad, bg="black", tod="1 QUADRILLION", years=(10 ** 14, Q), count=2.2, lines=[
        N("Year one quadrillion. Even the Sun has cooled into a black dwarf. A cold, dead ball, floating in the dark.",
          "Year 1,000,000,000,000,000. Even the Sun has cooled into a black dwarf. A cold, dead ball, floating in "
          "the dark."),
        N("You've forgotten your name. Your planet. Your whole life."),
        N("But you still remember one thing."),
        MOMSAYS("Whenever it gets dark... look up.", echo=True, pre=0.2),
        N("So you look up.", pre=0.3),
        N("Far away, two failed stars called brown dwarfs crash into each other... and a brand new star is born."),
        N("After trillions of years of darkness, there's light. And for a second, it feels like she's right there "
          "with you.", pre=0.5)], extra=1.0),
    dict(fn=sc_cta, bg=None, tod=None, years=None, lines=[
        N("Would you want to live for one quadrillion years? Tell me in the comments.",
          "Would you want to live for 1 quadrillion years? Tell me in the comments.")], extra=1.0),
]
IDX = {sc["fn"].__name__: i for i, sc in enumerate(SCENES)}


# ======================================================================================
# Engine hooks
# ======================================================================================
def timer_text(k, lt):
    sc, S = SCENES[k], base.TL[k]
    if not sc.get("years"):
        return None
    y0, y1 = sc["years"]
    p = ease_in_out(clamp01(lt / max(0.5, sc.get("count", S["dur"] - 0.4))))
    y = y0 if y0 == y1 else (y0 * (y1 / y0) ** p if y0 > 0 else y1 * p)
    y = int(round(y))
    if y > 10 ** 6:                                  # keep the big counters readable: 3 significant digits
        mag = 10 ** (len(str(y)) - 3)
        y = y // mag * mag
    return f"YEAR {y:,}", False


@functools.lru_cache(maxsize=512)
def caption(markup):
    col = (255, 255, 255)
    if markup[:1] == "~":
        col, markup = (255, 196, 225), markup[1:]
    return text_sprite(markup, 64, col, col, "bold", stroke=3, shadow=True, maxw=860)


def render_panel(t):
    k = base.scene_at(t)
    sc, S = SCENES[k], base.TL[k]
    lt = t - S["start"]
    img = bg(sc["bg"]).copy() if sc["bg"] else Image.new("RGB", (WW, WH), (200, 200, 200))
    d = ImageDraw.Draw(img, "RGBA")
    fx = sc["fn"](img, d, lt, S) or {}
    if "tint" in fx:
        img = Image.alpha_composite(img.convert("RGBA"), Image.new("RGBA", img.size, fx["tint"])).convert("RGB")
    z, cx, cy = fx.get("cam") or (1.0 + 0.05 * ease_in_out(lt / max(1.0, S["dur"])), WW / 2, WH / 2)
    if fx.get("shake"):
        cx += math.sin(t * 71) * 22 * fx["shake"]
        cy += math.cos(t * 53) * 14 * fx["shake"]
    cw, ch = WW / z, WH / z
    x0 = min(max(cx - cw / 2, 0), WW - cw)
    y0 = min(max(cy - ch / 2, 0), WH - ch)
    pan = img.resize((PW, PH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
    arr = np.asarray(pan, np.float32) * base._VIGN
    pan = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if fx.get("flash"):
        pan = Image.blend(pan, Image.new("RGB", pan.size, (255, 255, 255)), min(1.0, fx["flash"]))
    if sc["tod"]:
        paste(pan, base.tag(sc["tod"], 28), TAG_INSET, 16)
    tt = timer_text(k, lt)
    if tt:
        tg = base.tag("{⏳} " + tt[0], 28, (10, 10, 10))
        paste(pan, tg, PW - tg.width - TAG_INSET, 16)
    for c0, c1, txt in base.CAPS:
        if c0 <= t < c1:
            place(pan, caption(txt), PW / 2, PH * 0.80, scale=0.85 + 0.15 * ease_out_back((t - c0) / 0.12))
            break
    fade = 1.0
    if lt < 0.12 and k > 0:
        fade = lt / 0.12
    if S["dur"] - lt < 0.08 and k < len(base.TL) - 1:
        fade = min(fade, (S["dur"] - lt) / 0.08)
    if fade < 1:
        pan = Image.blend(Image.new("RGB", pan.size, (0, 0, 0)), pan, fade)
    return pan


def install():
    base.TITLE, base.PART, base.SCENES = TITLE, PART, SCENES
    base.ARM_POSES.setdefault("head", ((110, -30), (34, -124)))
    base.render_panel = render_panel


def build_timeline(voices):
    t = 0.35
    tl, caps, voice_at = [], [], []
    li = 0
    for sc in SCENES:
        start = t
        tsl, tel = [], []
        for line in sc["lines"]:
            t += line.get("pre", 0.0)
            dur = len(voices[li]) / SR if voices else max(1.2, len(line["text"].split()) / 2.8)
            tsl.append(t - start)
            tel.append(t - start + dur)
            voice_at.append((li, t))
            chunks = chunk_caption(line["cap"])
            wts = [len(c) + 3 for c in chunks]
            ct = t
            for c, wgt in zip(chunks, wts):
                cd = dur * wgt / sum(wts)
                caps.append((ct, ct + cd, line["mark"] + c.upper().strip(",.:")))
                ct += cd
            t += dur + 0.24
            li += 1
        t += sc.get("extra", 0.0) + 0.25
        tl.append(dict(start=start, dur=t - start, ts=tsl, te=tel))
    return tl, caps, voice_at, t


# ======================================================================================
# Audio assets (ElevenLabs Music + sound effects), generated once into audio/quadrillion/
# ======================================================================================
MUSIC_GLOBAL = (["cinematic orchestral underscore for an epic, emotional space documentary story", "piano and strings",
                 "D minor", "70 bpm", "instrumental only"],
                ["vocals", "singing", "humming", "choir", "spoken word", "rap", "drum kit", "EDM", "electric guitar"])
SFX = {
    "sfx_wind": ("Cold howling arctic wind over an ice field", 8.0),
    "sfx_rumble": ("Huge deep cosmic rumble, a star roaring and burning, low and powerful", 8.0),
    "sfx_newstar": ("A bright shimmering cosmic swell, a new star igniting with sparkling chimes", 4.0),
    "sfx_fire": ("Small crackling campfire at night with crickets", 6.0),
}


def music_plan(tl, total):
    def S(name):
        return tl[IDX[name]]

    def T(name, j=0):
        return S(name)["start"] + S(name)["ts"][j]

    def sec(name, styles, a, b):
        return name, styles, max(3.5, b - a)
    q = S("sc_quad")
    return {
        "cue_life": [
            sec("Waking up", ["gentle wonder", "soft piano", "magical"], 0, S("sc_mom")["start"]),
            sec("Mom", ["very tender sad piano", "soft strings", "heartbreaking"], S("sc_mom")["start"],
                S("sc_future")["start"]),
            sec("Time passes", ["melancholic", "piano ostinato", "passing time"], S("sc_future")["start"],
                S("sc_ice")["start"] + 1.0)],
        "cue_earth": [
            sec("Ice and loneliness", ["cold", "sparse", "lonely high strings"], S("sc_ice")["start"],
                S("sc_pangaea")["start"]),
            sec("Deep time", ["epic, slowly building strings", "sense of scale", "awe"], S("sc_pangaea")["start"],
                S("sc_oceans")["start"]),
            sec("The dying Earth", ["ominous", "heavy low strings", "hot and dry"], S("sc_oceans")["start"],
                S("sc_andromeda")["start"] + 1.0)],
        "cue_cosmos": [
            sec("Galaxies collide", ["huge cosmic awe", "soaring strings", "wonder"], S("sc_andromeda")["start"],
                S("sc_redgiant")["start"]),
            sec("Red giant", ["intense", "powerful low brass and timpani swells", "apocalyptic"],
                S("sc_redgiant")["start"], S("sc_whitedwarf")["start"]),
            sec("White dwarf", ["quiet", "fragile piano", "lonely"], S("sc_whitedwarf")["start"],
                S("sc_reddwarfs")["start"] + 1.0)],
        "cue_fade": [
            sec("The last stars", ["very sparse", "fading", "dark ambient pads", "slow"], S("sc_reddwarfs")["start"],
                S("sc_laststar")["start"]),
            sec("Darkness", ["almost silent", "one low sustained note", "empty"], S("sc_laststar")["start"],
                q["start"] + 0.5)],
        "cue_hope": [
            sec("Black dwarf", ["dark", "very quiet", "deep low drone", "distant piano notes"], q["start"], T("sc_quad", 3)),
            sec("Her words", ["tender piano melody", "memory", "soft"], T("sc_quad", 3), T("sc_quad", 5)),
            sec("A new star", ["emotional swell", "rising strings", "hopeful", "light breaking through"],
                T("sc_quad", 5), q["start"] + q["dur"]),
            sec("Outro", ["warm", "gentle resolution", "ending"], q["start"] + q["dur"], total + 1.0)],
    }


def load_assets(tl, total, generate=True):
    os.makedirs(ASSETS, exist_ok=True)
    out = {}
    for name, sections in music_plan(tl, total).items():
        p = os.path.join(ASSETS, name + ".mp3")
        if not os.path.exists(p) and generate:
            cp = {"positive_global_styles": MUSIC_GLOBAL[0], "negative_global_styles": MUSIC_GLOBAL[1],
                  "sections": [{"section_name": n, "positive_local_styles": st, "negative_local_styles": [],
                                "duration_ms": int(s * 1000), "lines": []} for n, st, s in sections]}
            print(f"  generating {name} ({sum(s for _, _, s in sections):.1f}s)")
            eleven_post("/v1/music?output_format=mp3_44100_128", {"composition_plan": cp, "model_id": "music_v1"}, p)
        if os.path.exists(p):
            out[name] = decode(p)
    for name, (prompt, sec) in SFX.items():
        p = os.path.join(ASSETS, name + ".mp3")
        if not os.path.exists(p) and generate:
            print(f"  generating {name}")
            eleven_post("/v1/sound-generation?output_format=mp3_44100_128",
                        {"text": prompt, "duration_seconds": sec, "prompt_influence": 0.5}, p)
        if os.path.exists(p):
            out[name] = decode(p)
    return out


# ======================================================================================
# Audio mix
# ======================================================================================
def build_audio(voices, voice_at, total, tl, assets):
    n = int(total * SR) + SR
    rng = np.random.default_rng(11)
    lines = [l for sc in SCENES for l in sc["lines"]]

    def tt(sec):
        return np.arange(int(sec * SR)) / SR

    def add(buf, sig, at, g=1.0):
        i = int(at * SR)
        if sig is None or i >= n:
            return
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(n, i + len(sig))
        buf[i:j] += sig[:j - i] * g

    def tone(f, sec, harm=(1, 0.4, 0.15), dec=3.0):
        x = tt(sec)
        return sum(a * np.sin(2 * np.pi * f * (k + 1) * x) for k, a in enumerate(harm)) * np.minimum(1, x / 0.006) * np.exp(-x * dec)

    def bandnoise(sec, lo, hi):
        m = max(2, int(sec * SR))
        spec = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        spec[(fr < lo) | (fr > hi)] = 0
        s = np.fft.irfft(spec, m)
        return s / (np.abs(s).max() + 1e-9)

    def sweep(f0, f1, sec):
        x = tt(sec)
        return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * x / sec) / SR)

    def fades(sig, a=0.05, r=0.3):
        sig = sig.copy()
        ia, ir = min(len(sig), int(a * SR)), min(len(sig), int(r * SR))
        if ia:
            sig[:ia] *= np.linspace(0, 1, ia)
        if ir:
            sig[-ir:] *= np.linspace(1, 0, ir)
        return sig

    def loop(name, sec):
        s = assets.get(name)
        if s is None:
            return None
        return np.tile(s, int(sec * SR / len(s)) + 1)[:int(sec * SR)]

    def T(name, j=0, off=0.0, end=False):
        S = tl[IDX[name]]
        return S["start"] + (S["te"][j] if end else S["ts"][j]) + off

    def boom(sec=1.8):
        return sweep(80, 28, sec) * np.exp(-tt(sec) * 2.2)

    # --- score
    music = np.zeros(n)
    st = {name: tl[i]["start"] for name, i in IDX.items()}
    spans = [("cue_life", 0.0, st["sc_ice"] + 0.4, 0.4, 0.8), ("cue_earth", st["sc_ice"] - 0.3, st["sc_andromeda"] + 0.4, 0.5, 0.8),
             ("cue_cosmos", st["sc_andromeda"] - 0.3, st["sc_reddwarfs"] + 0.4, 0.5, 0.9),
             ("cue_fade", st["sc_reddwarfs"] - 0.3, st["sc_quad"] + 0.4, 0.6, 0.8),
             ("cue_hope", st["sc_quad"] - 0.2, total, 0.8, 1.5)]
    for name, a, b, fi, fo in spans:
        s = assets.get(name)
        if s is not None:
            add(music, fades(s[:int((b - a) * SR)], fi, fo), a, 1.0)
    if np.any(music):
        music *= 0.42 / (np.percentile(np.abs(music[music != 0]), 99.5) + 1e-9)
    env = np.sqrt(th.smooth(music ** 2, 0.4) + 1e-12)
    music *= th.smooth(np.minimum(1.0, 0.075 / env), 0.25)

    # --- voices (matched levels; Mom's memory at the end echoes like a voice in your head)
    def level(sig):
        a = np.abs(sig)
        return np.sqrt(np.mean(sig[a > 0.1 * a.max()] ** 2)) + 1e-9

    out, venv = np.zeros(n), np.zeros(n)
    if voices:
        for li, t0 in voice_at:
            line, sig = lines[li], voices[li]
            proc = sig * (VOICE_LEVEL / level(sig))
            if line["echo"]:
                proc = th.inner_voice(proc) * 0.95
            elif line["voice"] == "mom":
                proc = reverb(proc, wet=0.12, decay=9.0, length=0.35)
            proc *= min(1.0, 0.98 / (np.abs(proc).max() + 1e-9))
            add(out, proc, t0, 1.0)
            add(venv, np.ones(len(sig)), t0)
    music *= 1 - 0.55 * np.clip(th.smooth(venv, 0.15), 0, 1)

    # --- sound effects
    sfx = np.zeros(n)
    for S in tl[1:]:
        add(sfx, bandnoise(0.4, 600, 5000) * np.sin(np.pi * tt(0.4) / 0.4) ** 2, S["start"] - 0.15, 0.1)
    # wake: shimmer when the power turns on, a hit on the number
    on = T("sc_wake", 0, 1.4)
    add(sfx, fades(sweep(500, 1400, 0.8) * np.sin(np.pi * tt(0.8) / 0.8), 0.01, 0.2), on, 0.08)
    add(sfx, boom(), T("sc_wake", 2, 0.3), 0.5)
    for j in range(15):
        add(sfx, tone(900 + j * 40, 0.08, (1,), 30), T("sc_wake", 3, 0.4) + j * (T("sc_wake", 3, 0, True) - T("sc_wake", 3, 0.4)) / 15,
            0.12)
    # hospital: monitor beeps that stop
    S = tl[IDX["sc_mom"]]
    tb, stop = S["start"] + 0.3, T("sc_mom", 3, 0.9)
    while tb < stop:
        add(sfx, tone(1046, 0.12, (1,), 18), tb, 0.08)
        tb += 1 / 1.1
    # future city hum
    S = tl[IDX["sc_future"]]
    add(sfx, fades(bandnoise(S["dur"], 200, 1200), 0.3, 0.3), S["start"], 0.03)
    # ice wind / campfire
    S = tl[IDX["sc_ice"]]
    add(sfx, fades(loop("sfx_wind", S["dur"]), 0.4, 0.6), S["start"], 0.35)
    S = tl[IDX["sc_alone"]]
    add(sfx, fades(loop("sfx_fire", S["dur"]), 0.4, 0.6), S["start"], 0.35)
    # heat: steam hiss as the oceans boil
    S = tl[IDX["sc_oceans"]]
    add(sfx, fades(bandnoise(S["dur"], 2000, 8000), 1.0, 1.0), S["start"], 0.03)
    # red giant: roar + the swallow
    S = tl[IDX["sc_redgiant"]]
    add(sfx, fades(loop("sfx_rumble", S["dur"]), 1.0, 1.0), S["start"], 0.6)
    add(sfx, boom(2.4), T("sc_redgiant", 0, -0.2, True), 0.6)
    # stars going out: soft ticks
    S = tl[IDX["sc_reddwarfs"]]
    span = S["te"][0] - S["ts"][0]
    for i in range(12):
        add(sfx, tone(330 - i * 12, 0.5, (1, 0.3), 6), S["start"] + S["ts"][0] + span * (0.45 + 0.05 * i), 0.05)
    add(sfx, tone(220, 2.5, (1, 0.5), 1.2), T("sc_laststar", 0, -0.35, True), 0.12)
    # the new star
    star_t = T("sc_quad", 5, -0.4, True)
    add(sfx, fades(bandnoise(1.6, 800, 7000) * (tt(1.6) / 1.6) ** 3, 0.01, 0.05), star_t - 1.6, 0.12)
    add(sfx, boom(), star_t, 0.45)
    if "sfx_newstar" in assets:
        add(sfx, fades(assets["sfx_newstar"], 0.01, 1.0), star_t - 0.1, 0.5)
    i0, i1 = int(T("sc_laststar", 1, 0) * SR), int((star_t - 1.5) * SR)
    music[i0:i1] *= 0.6

    mix = out + music + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.92
    f = int(0.8 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    return mix


# ======================================================================================
def tts_one(text, voice_id, cache):
    r = base.synth_voice_elevenlabs([text], cache, voice_id)
    return r[0] if r else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "quadrillion_years_story.mp4"))
    ap.add_argument("--preview", help="comma separated times: save PNG stills only")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    ap.add_argument("--tts", choices=["elevenlabs", "none"],
                    default="elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "none")
    ap.add_argument("--no-gen", action="store_true", help="don't generate missing music / sound effects")
    ap.add_argument("--assets-only", action="store_true", help="only generate the audio assets")
    args = ap.parse_args()
    install()

    lines = [l for sc in SCENES for l in sc["lines"]]
    cache = os.path.join(HERE, ".tts_cache")
    voices = None
    if args.tts == "elevenlabs":
        voices = [tts_one(l["text"], VOICE[l["voice"]], cache) for l in lines]
        if any(v is None for v in voices):
            sys.exit("ElevenLabs narration failed (see message above).")
    tl, caps, voice_at, total = build_timeline(voices)
    base.init_worker(tl, caps, total)
    print(f"Video length: {total:.1f}s")
    for i, s in enumerate(tl):
        print(f"  scene {i:2d}  {s['start']:6.2f}s  ({s['dur']:5.2f}s)  {SCENES[i]['fn'].__name__}")

    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for x in args.preview.split(","):
            p = os.path.join(HERE, "preview", f"quad_{float(x):06.2f}.png")
            base.render_frame(float(x)).save(p)
            print("saved", p)
        return
    assets = load_assets(tl, total, generate=not args.no_gen)
    if args.assets_only:
        print("assets:", sorted(assets))
        return

    wav = os.path.splitext(args.out)[0] + "_audio.wav"
    base.write_wav(wav, build_audio(voices, voice_at, total, tl, assets))
    nfr = int(total * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-af", loudnorm_filter(wav), "-ar", "48000",
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
