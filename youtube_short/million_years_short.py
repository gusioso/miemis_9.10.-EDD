#!/usr/bin/env python3
"""
"What If You Lived For 100 Million Years?"  (realistic story Short, ~2.5 min)

Same engine and layout as story_short.py (plaid frame, title box, animated 16:9 panel,
"Part 1" label, synced captions). The top-left tag names the chapter and the top-right
tag is a live year counter that runs from YEAR 0 to YEAR 100,000,000.

The science is kept realistic (round numbers from current estimates):
  * accidents would still kill an un-aging person within a few thousand years
  * Old English (1,000 years ago) is unreadable today
  * axial precession makes Vega the North Star in ~12,000-14,000 years
  * Niagara Falls erodes back to Lake Erie in ~50,000 years; the next glaciation
    is expected to start ~50,000-100,000 years from now
  * Homo sapiens is ~300,000 years old; VEI-8 supereruptions every ~50-100 kyr
  * East Africa splits off in ~5-10 Myr, LA slides toward SF along the San Andreas,
    Africa closes the Mediterranean in ~50 Myr, Australia moves north into Asia
  * non-avian dinosaurs died 66 Myr ago; 10 km impacts happen roughly every 100 Myr
  * after 100 Myr: day ~30 min longer (tidal braking ~2 ms/century), Moon ~3,800 km
    farther (3.8 cm/yr), Sun ~1% brighter

Usage:
  python youtube_short/million_years_short.py --tts elevenlabs   # -> youtube_short/100m_years_story.mp4
  python youtube_short/million_years_short.py --preview 3,20,40  # PNG stills only
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
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import story_short as base  # noqa: E402
from make_short import (clamp01, ease_in_out, ease_out_back, ease_out_cubic, emoji_sized, font,  # noqa: E402
                        lerp, paste, place, prog, text_sprite)
from story_short import (FLOOR, FPS, H, INK, NEON, SR, W, WH, WW, chunk_caption, floor_band,  # noqa: E402
                         person, show_card, star4, te, ts, vgrad, window)
from thoughts_short import aura, head_of, say_bubble, smooth  # noqa: E402

TITLE = "What If You Lived For 100 Million Years?"
PART = "Part 1"
NARRATOR = os.environ.get("ELEVENLABS_VOICE_ID", "zfc8CJQpe8Kqyl0vvCzo")   # Mike - 2D & 3D POV/Storytime
HAIR = "quiff"
BLUE = base.BLUE
MOM, DAD, SIS, FRIEND = (150, 92, 170), (70, 140, 110), (236, 120, 160), (236, 150, 60)
GOLD = (255, 205, 90)
LAND, COAST = (128, 176, 104), (74, 112, 64)


def N(text, cap=None):
    """Narrator line. `cap` = caption text (lets captions show digits while the voice reads words)."""
    return dict(text=text, cap=cap or text)


# ======================================================================================
# Helpers
# ======================================================================================
def label(d, xy, text, size=44, fill=(255, 255, 255), anchor="mm", kind="black", stroke=(20, 20, 30)):
    d.text(xy, text, font=font(kind, size), fill=fill, anchor=anchor, stroke_width=max(2, size // 12),
           stroke_fill=stroke)


def ghost(img, alpha, fn):
    """Draw with fn(draw) on a transparent layer, then composite it at `alpha`."""
    if alpha <= 0.01:
        return
    lay = Image.new("RGBA", (WW, WH), (0, 0, 0, 0))
    fn(ImageDraw.Draw(lay, "RGBA"))
    if alpha < 0.999:
        lay.putalpha(lay.getchannel("A").point(lambda v, k=alpha: int(v * k)))
    img.paste(lay, (0, 0), lay)


def old_person(d, x, yf, u=1.0, shirt=MOM, cane=True, bun=False, **kw):
    hx, hy = person(d, x, yf, u, shirt=shirt, hair="bald", hood=False, **kw)
    hr = 88 * u
    d.chord((hx - hr - 3, hy - hr - 4, hx + hr + 3, hy - 0.2 * hr), 180, 360, fill=(214, 214, 218))
    if bun:
        d.ellipse((hx - 30 * u, hy - 130 * u, hx + 30 * u, hy - 78 * u), fill=(214, 214, 218))
    if cane:
        sh_y = yf - 470 * u
        cx, cy = x + 66 * u, sh_y + 254 * u
        d.line((cx, cy, cx + 18 * u, yf - 4), fill=(120, 84, 56), width=int(10 * u))
        d.arc((cx - 30 * u, cy - 20 * u, cx + 4 * u, cy + 14 * u), 180, 360, fill=(120, 84, 56), width=int(10 * u))
    return hx, hy


@functools.lru_cache(maxsize=128)
def info_card(title, body, emo=None, width=900, theme="light", size=50):
    lines = body.split("\n")
    lh = int(size * 1.22)
    h = 96 + lh * len(lines) + 28
    im = Image.new("RGBA", (width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    dark = theme == "dark"
    d.rounded_rectangle((2, 2, width - 3, h - 3), radius=34, fill=(16, 40, 48) if dark else (255, 255, 252),
                        outline=NEON if dark else INK, width=4)
    x0 = 40
    if emo:
        e = emoji_sized(emo, 100)
        paste(im, e, 28 + (100 - e.width) // 2, (h - 100) // 2)
        x0 = 152
    d.text((x0, 30), title, font=font("black", 36), fill=NEON if dark else (120, 120, 135))
    for i, l in enumerate(lines):
        d.text((x0, 88 + i * lh), l, font=font("semi", size), fill=(230, 255, 250) if dark else INK)
    return im


@functools.lru_cache(maxsize=32)
def icon_card(emo, lab, mark="❌"):
    w, h = 240, 270
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((2, 2, w - 3, h - 3), radius=28, fill=(255, 255, 252), outline=INK, width=4)
    e = emoji_sized(emo, 120)
    paste(im, e, (w - e.width) // 2, 26)
    d.text((w / 2, h - 48), lab, font=font("black", 32), fill=INK, anchor="mm")
    if mark:
        m = emoji_sized(mark, 70)
        paste(im, m, w - m.width - 4, 4)
    return im


@functools.lru_cache(maxsize=64)
def polaroid(emo, text, blur=0):
    w, h = 250, 300
    im = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((26, 28, 26 + w, 28 + h), radius=8, fill=(0, 0, 0, 70))
    d.rounded_rectangle((20, 20, 20 + w, 20 + h), radius=8, fill=(252, 250, 244))
    d.rectangle((38, 38, 20 + w - 18, 244), fill=(200, 222, 240))
    e = emoji_sized(emo, 150)
    paste(im, e, 20 + (w - e.width) // 2, 64)
    d.text((20 + w / 2, 20 + h - 36), text, font=font("bold", 28), fill=(60, 60, 70), anchor="mm")
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    return im


@functools.lru_cache(maxsize=None)
def star_list(seed, n, x0, y0, x1, y1):
    r = random.Random(seed)
    return [(r.uniform(x0, x1), r.uniform(y0, y1), r.choice((1.5, 2, 2.5, 3, 4)), r.randint(140, 255))
            for _ in range(n)]


def draw_stars(d, seed, n, box=(0, 0, WW, WH), lt=0.0, alpha=1.0):
    for i, (x, y, s, a) in enumerate(star_list(seed, n, *box)):
        a = int(a * alpha * (0.75 + 0.25 * math.sin(lt * 3 + i)))
        d.ellipse((x - s, y - s, x + s, y + s), fill=(255, 255, 255, a))


def earth(img, cx, cy, r, phase, merge=0.0):
    s = int(2 * r)
    lay = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay, "RGBA")
    ld.ellipse((0, 0, s - 1, s - 1), fill=(40, 110, 200))
    for bx, by, bw, bh in ((0.12, 0.36, 0.24, 0.2), (0.42, 0.28, 0.2, 0.24), (0.6, 0.62, 0.18, 0.15),
                           (0.86, 0.42, 0.22, 0.17), (0.3, 0.7, 0.13, 0.11)):
        x = lerp((bx + phase) % 1.0, 0.5, merge * 0.55) * s
        y = lerp(by, 0.5, merge * 0.55) * s
        ld.ellipse((x - bw * s / 2, y - bh * s / 2, x + bw * s / 2, y + bh * s / 2), fill=(112, 172, 92))
    ld.ellipse((s * 0.3, -s * 0.06, s * 0.7, s * 0.09), fill=(240, 245, 250))
    ld.ellipse((s * 0.32, s * 0.92, s * 0.68, s * 1.05), fill=(240, 245, 250))
    ld.ellipse((s * 0.35, -s * 0.15, s * 1.45, s * 1.15), fill=(0, 0, 20, 120))      # night side
    m = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
    lay.putalpha(m)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((cx - r - 16, cy - r - 16, cx + r + 16, cy + r + 16), fill=(120, 180, 255, 50))
    paste(img, lay, cx - r, cy - r)


def compare_bars(img, d, x0, y0, w, rows, k):
    """rows: (emoji, label, fraction, colour). Bars grow with k."""
    h = 60 + 140 * len(rows)
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=30, fill=(255, 255, 252, 245), outline=INK, width=4)
    for i, (emo, lab, frac, col) in enumerate(rows):
        yy = y0 + 40 + i * 140
        place(img, emoji_sized(emo, 66), x0 + 76, yy + 30)
        d.text((x0 + 130, yy + 4), lab, font=font("black", 40), fill=INK)
        bw = (w - 170) * frac * k
        d.rounded_rectangle((x0 + 130, yy + 62, x0 + 130 + max(30, bw), yy + 108), radius=23, fill=col)


def tomb(d, x, yb, lab):
    d.rectangle((x - 95, yb - 200, x + 95, yb), fill=(150, 150, 160), outline=(110, 110, 120), width=5)
    d.chord((x - 95, yb - 296, x + 95, yb - 104), 180, 360, fill=(150, 150, 160), outline=(110, 110, 120), width=5)
    d.line((x - 90, yb - 200, x + 90, yb - 200), fill=(150, 150, 160), width=8)
    d.text((x, yb - 218), "R.I.P.", font=font("black", 34), fill=(90, 90, 100), anchor="mm")
    for i, l in enumerate(lab.split("\n")):
        d.text((x, yb - 150 + i * 40), l, font=font("black", 34 if len(lab) < 8 else 28), fill=(70, 70, 80),
               anchor="mm")


def headline(markup, size=120, glow_col=(255, 190, 60)):
    return text_sprite(markup, size, (255, 255, 255), GOLD, "black", glow_col=glow_col, maxw=2000)


# ======================================================================================
# Backgrounds
# ======================================================================================
def bg_bedroom():
    im = vgrad(WW, WH, (200, 208, 236), (184, 194, 226))
    d = ImageDraw.Draw(im)
    window(d, (1520, 150, 1960, 540), (255, 226, 180), (255, 198, 150), panes=2)
    d.rounded_rectangle((300, 170, 580, 430), radius=12, fill=(36, 42, 84), outline=(250, 250, 255), width=8)
    for x, y in ((340, 220), (520, 210), (380, 390), (540, 370), (450, 245)):
        star4(d, x, y, 14, (255, 240, 180))
    d.text((440, 320), "SPACE", font=font("black", 50), fill=(255, 210, 90), anchor="mm")
    d.rounded_rectangle((150, 600, 260, 980), radius=24, fill=(120, 84, 60))
    d.rounded_rectangle((170, 790, 1000, 900), radius=26, fill=(244, 244, 250))
    d.rounded_rectangle((430, 750, 1010, 880), radius=34, fill=(90, 130, 205))
    d.ellipse((220, 724, 420, 808), fill=(252, 252, 255))
    for x in (190, 960):
        d.rectangle((x, 900, x + 30, FLOOR - 20), fill=(110, 76, 54))
    d.rounded_rectangle((1760, 760, 1930, FLOOR - 20), radius=10, fill=(150, 108, 78))
    d.rectangle((1838, 640, 1852, 760), fill=(80, 70, 70))
    d.polygon([(1780, 640), (1910, 640), (1880, 570), (1810, 570)], fill=(255, 220, 150))
    floor_band(d, (150, 118, 96))
    d.ellipse((1050, FLOOR - 6, 1650, FLOOR + 50), fill=(190, 90, 90))
    return im


def bg_graveyard():
    im = vgrad(WW, WH, (92, 68, 138), (250, 168, 112))
    d = ImageDraw.Draw(im)
    d.ellipse((1640, 520, 1880, 760), fill=(255, 210, 140))
    d.ellipse((-300, 640, 1100, 1200), fill=(76, 96, 84))
    d.ellipse((800, 660, 2500, 1260), fill=(66, 88, 78))
    for x in range(0, WW, 64):
        d.rectangle((x, 720, x + 9, 880), fill=(42, 38, 52))
        d.polygon([(x - 4, 724), (x + 4, 700), (x + 13, 724)], fill=(42, 38, 52))
    d.rectangle((0, 750, WW, 760), fill=(42, 38, 52))
    d.rectangle((0, 840, WW, 850), fill=(42, 38, 52))
    d.line((300, FLOOR - 20, 310, 520), fill=(52, 40, 46), width=26)
    for (a, b, c, e) in ((310, 640, 200, 520), (305, 580, 420, 470), (200, 520, 150, 470), (420, 470, 470, 430),
                         (308, 700, 430, 620)):
        d.line((a, b, c, e), fill=(52, 40, 46), width=12)
    floor_band(d, (84, 112, 76))
    return im


def bg_future():
    im = vgrad(WW, WH, (110, 190, 230), (226, 240, 250))
    d = ImageDraw.Draw(im)
    r = random.Random(8)
    x = -40
    while x < WW:
        w = r.randint(120, 220)
        h = r.randint(380, 780)
        col = r.choice(((176, 206, 230), (150, 186, 220), (200, 220, 240)))
        d.rounded_rectangle((x, 860 - h, x + w, 900), radius=w // 2 if r.random() < 0.3 else 18, fill=col)
        for yy in range(860 - h + 50, 880, 46):
            d.line((x + 18, yy, x + w - 18, yy), fill=(120, 230, 255), width=4)
        x += w + r.randint(20, 60)
    d.rounded_rectangle((800, 130, 1360, 240), radius=18, fill=(30, 40, 70), outline=(120, 240, 255), width=5)
    d.text((1080, 185), "ZHEL · VO · TAAN", font=font("black", 50), fill=(120, 240, 255), anchor="mm")
    d.rectangle((0, 860, WW, FLOOR - 20), fill=(96, 106, 130))
    d.line((0, 880, WW, 880), fill=(150, 230, 255), width=6)
    floor_band(d, (70, 78, 100))
    return im


def bg_void():
    im = vgrad(WW, WH, (16, 18, 44), (36, 32, 74))
    d = ImageDraw.Draw(im)
    for rr, c in ((760, (40, 40, 86)), (520, (50, 48, 100)), (320, (62, 58, 118))):
        d.ellipse((1080 - rr, 560 - rr * 0.7, 1080 + rr, 560 + rr * 0.7), fill=c)
    d.ellipse((760, 1000, 1400, 1080), fill=(28, 28, 60))
    return im


def bg_nightsky():
    im = vgrad(WW, WH, (6, 10, 32), (26, 32, 72))
    d = ImageDraw.Draw(im)
    r = random.Random(4)
    for _ in range(1600):
        t = r.random()
        x, y = t * WW, 760 - t * 600 + r.gauss(0, 70)
        s = r.choice((1, 1, 2))
        b = r.randint(50, 120)
        d.ellipse((x - s, y - s, x + s, y + s), fill=(b, b, b + 24))
    d.ellipse((-400, 820, 1000, 1500), fill=(16, 22, 30))
    d.ellipse((700, 900, 2600, 1600), fill=(12, 18, 26))
    floor_band(d, (14, 20, 28))
    return im


RIVER = [(640, 640), (760, 610), (880, 640), (1000, 600), (1120, 560), (1240, 540), (1360, 500), (1480, 470),
         (1570, 440)]
ERIE = [(0, 300), (300, 320), (520, 420), (660, 560), (680, 700), (560, 860), (300, 920), (0, 960)]
ONTARIO = [(1520, 300), (1700, 230), (2000, 200), (2160, 210), (2160, 640), (1900, 620), (1660, 560), (1540, 460)]


def bg_niagara():
    im = vgrad(WW, WH, (134, 178, 110), (120, 166, 98))
    d = ImageDraw.Draw(im)
    r = random.Random(2)
    for _ in range(700):
        x, y = r.uniform(0, WW), r.uniform(0, WH)
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(104, 150, 88))
    for poly_ in (ERIE, ONTARIO):
        d.polygon(poly_, fill=(56, 130, 200), outline=(40, 100, 160), width=6)
    d.line(RIVER, fill=(60, 140, 210), width=46, joint="curve")
    label(d, (380, 640), "LAKE ERIE", 46)
    label(d, (1770, 400), "LAKE ONTARIO", 46)
    label(d, (980, 900), "USA", 40, fill=(235, 245, 225))
    label(d, (1150, 320), "CANADA", 40, fill=(235, 245, 225))
    return im


def bg_ice():
    im = vgrad(WW, WH, (186, 210, 230), (232, 240, 248))
    d = ImageDraw.Draw(im)
    for (a, pk, b) in ((560, 420, 1000), (900, 330, 1400), (1300, 450, 1700), (1600, 380, 2160)):
        d.polygon([(a, 780), ((a + b) / 2, pk), (b, 780)], fill=(214, 226, 240))
        d.polygon([((a + b) / 2 - 60, pk + 70), ((a + b) / 2, pk), ((a + b) / 2 + 60, pk + 70)], fill=(248, 250, 255))
    d.polygon([(0, 250), (220, 220), (420, 290), (620, 270), (720, 780), (0, 820)], fill=(226, 240, 252))
    for x in (120, 260, 400, 540):
        d.line((x, 300, x + 30, 760), fill=(170, 200, 232), width=8)
    floor_band(d, (238, 244, 252))
    return im


def bg_volcano():
    im = vgrad(WW, WH, (80, 70, 90), (210, 130, 100))
    d = ImageDraw.Draw(im)
    d.polygon([(1040, 830), (1380, 430), (1460, 384), (1560, 384), (1640, 430), (1990, 830)], fill=(70, 54, 50))
    d.polygon([(1460, 384), (1510, 400), (1560, 384), (1530, 430), (1490, 430)], fill=(140, 50, 30))
    for (a, b) in ((1180, 830), (1700, 830)):
        d.polygon([(a - 220, b), (a, b - 160), (a + 220, b)], fill=(60, 48, 46))
    d.rectangle((0, 830, WW, FLOOR - 20), fill=(60, 50, 48))
    floor_band(d, (52, 44, 42))
    return im


def bg_map():
    im = vgrad(WW, WH, (44, 118, 188), (30, 92, 160))
    d = ImageDraw.Draw(im)
    for x in range(0, WW, 180):
        d.line((x, 0, x, WH), fill=(56, 130, 198), width=2)
    for y in range(0, WH, 180):
        d.line((0, y, WW, y), fill=(56, 130, 198), width=2)
    return im


def bg_dusk():
    im = vgrad(WW, WH, (38, 46, 96), (236, 146, 108))
    d = ImageDraw.Draw(im)
    d.polygon([(0, 800), (300, 700), (700, 780), (1100, 690), (1500, 760), (1900, 680), (2160, 740), (2160, 860),
               (0, 860)], fill=(70, 52, 84))
    d.rectangle((0, 850, WW, FLOOR - 20), fill=(66, 58, 62))
    floor_band(d, (60, 52, 56))
    return im


def bg_space():
    im = vgrad(WW, WH, (6, 8, 20), (14, 16, 40))
    d = ImageDraw.Draw(im)
    for rr, c, cx, cy in ((420, (22, 18, 50), 1500, 300), (300, (30, 22, 60), 1560, 340)):
        d.ellipse((cx - rr, cy - rr * 0.6, cx + rr, cy + rr * 0.6), fill=c)
    r = random.Random(21)
    for _ in range(380):
        x, y, s = r.uniform(0, WW), r.uniform(0, WH), r.choice((1, 1, 2, 2, 3))
        b = r.randint(120, 255)
        d.ellipse((x - s, y - s, x + s, y + s), fill=(b, b, b))
    return im


def bg_cliff():
    im = vgrad(WW, WH, (120, 80, 150), (255, 170, 110))
    d = ImageDraw.Draw(im)
    d.ellipse((1380, 520, 1700, 840), fill=(255, 222, 150))
    d.rectangle((0, 700, WW, WH), fill=(50, 70, 130))
    for i, y in enumerate(range(716, 1000, 26)):
        w = 150 - i * 9
        d.line((1540 - w, y, 1540 + w, y), fill=(255, 196, 140), width=6)
    d.polygon([(0, 800), (1100, 800), (1160, 860), (1180, 1000), (1140, WH), (0, WH)], fill=(70, 56, 60))
    d.rectangle((0, 788, 1104, 812), fill=(92, 124, 72))
    return im


MY_BGS = {"bedroom": bg_bedroom, "graveyard": bg_graveyard, "future": bg_future, "void": bg_void,
          "nightsky": bg_nightsky, "niagara": bg_niagara, "ice": bg_ice, "volcano": bg_volcano, "map": bg_map,
          "dusk": bg_dusk, "space": bg_space, "cliff": bg_cliff}


# ======================================================================================
# Scenes
# ======================================================================================
def sc_wake(img, d, lt, S):
    stand_t = ts(S, 1, -0.3)
    k = ease_in_out(prog(lt, stand_t, stand_t + 1.0))
    on = prog(lt, ts(S, 0, 1.6), ts(S, 0, 2.4))
    sitting = lt < stand_t
    x = 760 if sitting else lerp(760, 1180, k)
    hx, hy = head_of(x, FLOOR, sit=sitting)
    aura(d, hx, hy, lt, on, col=GOLD)
    if lt < ts(S, 0, 1.6):
        ex = "tired"
    elif lt < ts(S, 1):
        ex = "shock"
    elif lt < ts(S, 2):
        ex = "smug"
    elif lt < ts(S, 3):
        ex = "nervous"
    else:
        ex = "shock" if lt < ts(S, 3, 1.4) else "happy"
    person(d, x, FLOOR, 1.0, pose="sit" if sitting else "stand", hair=HAIR, expr=ex, t=lt, seed=1,
           walk=None if sitting or k >= 1 else lt * 9, look=0.3 if sitting else 0.4)
    if ts(S, 1) <= lt < ts(S, 2, 0.2):
        span = S["te"][1] - S["ts"][1]
        for i, (emo, lab) in enumerate((("👴", "OLD AGE"), ("🦠", "SICKNESS"), ("💥", "ANYTHING"))):
            t0 = ts(S, 1, i * span / 3)
            if lt >= t0:
                place(img, icon_card(emo, lab), 420 + i * 270, 360,
                      scale=0.4 + 0.6 * ease_out_back(prog(lt, t0, t0 + 0.3)),
                      alpha=1 - prog(lt, ts(S, 2), ts(S, 2, 0.2)))
    if ts(S, 2) <= lt < ts(S, 3):
        cx, cy, R = hx, hy + 130, 330
        d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=(140, 220, 255, 26), outline=(140, 220, 255, 150), width=8)
        for i, (emo, ang) in enumerate((("🚗", -150), ("⚡", -90), ("☄️", -30))):
            t0 = ts(S, 2, 0.3 + i * 0.75)
            p = (lt - t0) / 0.9
            if not 0 <= p < 1:
                continue
            a = math.radians(ang)
            far, near = R + 760, R + 50
            dist = lerp(far, near, ease_in_out(p / 0.5)) if p < 0.5 else lerp(near, far, ease_in_out((p - 0.5) / 0.5))
            place(img, emoji_sized(emo, 130), cx + math.cos(a) * dist, cy + math.sin(a) * dist,
                  rot=(p - 0.5) * 300 if p > 0.5 else 0)
            if 0.44 < p < 0.62:
                star4(d, cx + math.cos(a) * R, cy + math.sin(a) * R, 60, (255, 255, 220))
    if lt >= ts(S, 3, 0.8):
        place(img, headline("*100,000,000* YEARS", 118), 1080, 200,
              scale=max(0.01, ease_out_back(prog(lt, ts(S, 3, 0.8), ts(S, 3, 1.2)))))
    return {}


def sc_family(img, d, lt, S):
    gone = ts(S, 1, 0.8)
    fade = ease_in_out(prog(lt, gone, gone + 0.9))
    sad = lt > gone
    person(d, 640, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look=1, look_y=0.6 if sad else 0,
           expr="sad" if sad else "happy")

    def fam(dd):
        old_person(dd, 1200, FLOOR, 0.97, shirt=MOM, cane=False, bun=True, facing=-1, look=-1, t=lt, seed=4,
                   expr="happy")
        old_person(dd, 1440, FLOOR, 0.97, shirt=DAD, facing=-1, look=-1, t=lt, seed=5, expr="happy")
        old_person(dd, 1680, FLOOR, 0.95, shirt=FRIEND, facing=-1, look=-1, t=lt, seed=6, expr="laugh")
    ghost(img, 1 - fade, fam)
    for i, (x, lab) in enumerate(((1060, "MOM"), (1280, "DAD"), (1500, "SIS"), (1720, "BEST\nFRIEND"))):
        t0 = gone + 0.25 + i * 0.25
        if lt < t0:
            continue
        k = ease_out_back(prog(lt, t0, t0 + 0.5))
        tomb(d, x, FLOOR - 10 + (1 - k) * 300, lab)
        d.rectangle((x - 110, FLOOR - 16, x + 110, WH), fill=(84, 112, 76))
    show_card(img, info_card("YOU", "Still 25 years old.\nEvery single day.", "🧑", 820), 1320, 250, lt, ts(S, 2, 0.1))
    return {}


CARS = [(220, 1, 260, (240, 90, 90)), (330, -1, 340, (90, 200, 240)), (130, 1, 420, (250, 210, 80)),
        (430, -1, 200, (180, 120, 255))]


def sc_future(img, d, lt, S):
    for i, (y, dirn, sp, col) in enumerate(CARS):
        x = (i * 700 + dirn * lt * sp) % 2700 - 270
        d.ellipse((x - 70, y + 24, x + 70, y + 44), fill=(120, 220, 255, 90))
        d.rounded_rectangle((x - 80, y - 26, x + 80, y + 26), radius=26, fill=col)
        d.rounded_rectangle((x - 40 + dirn * 12, y - 48, x + 40 + dirn * 12, y - 6), radius=20, fill=(210, 240, 255))
    person(d, 620, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look=1, expr="nervous" if lt < ts(S, 2) else "tired")
    fx = 1500
    person(d, fx, FLOOR, 0.98, shirt=(60, 200, 190), hair="bun", hood=False, facing=-1, look=-1, t=lt, seed=9,
           expr="happy", talk=ts(S, 0, 1.4) < lt < ts(S, 1, 0.1))
    fhx, fhy = head_of(fx, FLOOR, 0.98)
    d.rounded_rectangle((fhx - 82, fhy - 38, fhx + 82, fhy + 14), radius=22, fill=(90, 240, 255, 150))
    say_bubble(img, "Vrenn tako zhul, mira?", fx - 60, 410, lt, ts(S, 0, 1.3), ts(S, 1, 0.2), tail="right")
    show_card(img, info_card("ENGLISH, 1,000 YEARS AGO", "Fæder ūre, þū þe eart\non heofonum…", "📜", 900), 1080, 300,
              lt, ts(S, 1, 0.2), ts(S, 2, 0.1))
    if lt >= ts(S, 2):
        n = 1 + int(8 * prog(lt, ts(S, 2, 0.3), te(S, 2)))
        show_card(img, info_card("LANGUAGES LEARNED", f"{n}", "📚", 640, size=80), 1080, 290, lt, ts(S, 2))
    return {}


MEMS = [("👩", "MOM", 440, 360, -8), ("🏠", "FIRST HOME", 1720, 330, 7), ("🐶", "MAX", 420, 770, 6),
        ("🎂", "10TH BIRTHDAY", 1730, 750, -5), ("👫", "BEST FRIEND", 1080, 190, 2)]
FADE_ORDER = {"FIRST HOME": 0, "10TH BIRTHDAY": 1, "MAX": 2, "BEST FRIEND": 3, "MOM": 4}


def sc_memory(img, d, lt, S):
    r = random.Random(3)
    for _ in range(50):
        x = r.uniform(0, WW)
        y = (r.uniform(0, WH) - lt * r.uniform(10, 40)) % WH
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(200, 210, 255, 90))
    hx, hy = head_of(1080, FLOOR)
    aura(d, hx, hy, lt, 0.5, col=(150, 170, 255), speed=0.4)
    person(d, 1080, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look_y=-0.4, look=math.sin(lt * 0.8),
           expr="neutral" if lt < ts(S, 1) else "sad")
    if lt < ts(S, 1, 0.1):
        place(img, headline("*125* LIFETIMES", 110), 1080, 200,
              scale=max(0.01, ease_out_back(prog(lt, ts(S, 0, 1.0), ts(S, 0, 1.4)))),
              alpha=1 - prog(lt, ts(S, 1, -0.1), ts(S, 1, 0.1)))
    span = S["te"][1] - S["ts"][1]
    for i, (emo, lab, x, y, rot) in enumerate(MEMS):
        t0 = ts(S, 1, i * 0.2)
        if lt < t0:
            continue
        f0 = ts(S, 1, span * (0.35 + 0.12 * FADE_ORDER[lab]))
        fk = prog(lt, f0, f0 + 1.0)
        place(img, polaroid(emo, lab, int(round(8 * fk))), x, y + math.sin(lt * 1.5 + i) * 10,
              scale=0.5 + 0.5 * ease_out_back(prog(lt, t0, t0 + 0.35)), rot=rot,
              alpha=clamp01((lt - t0) / 0.25) * (1 - 0.85 * fk))
    return {}


LITTLE_DIPPER = [(760, 230), (840, 268), (905, 322), (975, 360), (1000, 430), (1090, 412), (1068, 345)]
LYRA = [(1500, 300), (1478, 365), (1528, 382), (1508, 452), (1458, 434)]
PC, PR = (1082, 707), 584


def sc_stars(img, d, lt, S):
    draw_stars(d, 5, 240, (0, 0, WW, 760), lt)
    lc = (170, 190, 255, 150)
    d.line(LITTLE_DIPPER[:4], fill=lc, width=3)
    d.line(LITTLE_DIPPER[3:] + [LITTLE_DIPPER[3]], fill=lc, width=3)
    d.line([LYRA[0], LYRA[1]], fill=lc, width=3)
    d.line(LYRA[1:] + [LYRA[1]], fill=lc, width=3)
    for x, y in LITTLE_DIPPER[1:] + LYRA[1:]:
        d.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(240, 240, 255))
    px_, py_ = LITTLE_DIPPER[0]
    vx, vy = LYRA[0]
    d.ellipse((px_ - 20, py_ - 20, px_ + 20, py_ + 20), fill=(255, 255, 220, 60))
    d.ellipse((px_ - 10, py_ - 10, px_ + 10, py_ + 10), fill=(255, 255, 230))
    d.ellipse((vx - 26, vy - 26, vx + 26, vy + 26), fill=(180, 210, 255, 70))
    d.ellipse((vx - 12, vy - 12, vx + 12, vy + 12), fill=(215, 232, 255))
    a0 = math.atan2(py_ - PC[1], px_ - PC[0])
    a1 = math.atan2(vy - PC[1], vx - PC[0])
    k = ease_in_out(prog(lt, ts(S, 1, 0.8), te(S, 1, -0.4)))
    if lt > ts(S, 0, 1.2):
        for j in range(44):
            a = lerp(a0 - 0.18, a1 + 0.18, j / 43)
            x, y = PC[0] + PR * math.cos(a), PC[1] + PR * math.sin(a)
            d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(255, 220, 120, 150))
        a = lerp(a0, a1, k)
        mx, my = PC[0] + PR * math.cos(a), PC[1] + PR * math.sin(a)
        d.ellipse((mx - 36, my - 36, mx + 36, my + 36), outline=(255, 220, 120), width=6)
        for ox, oy in ((-56, 0), (56, 0), (0, -56), (0, 56)):
            d.line((mx + ox * 0.6, my + oy * 0.6, mx + ox, my + oy), fill=(255, 220, 120), width=5)
    pa = int(255 * (1 - k))
    label(d, (px_, py_ - 52), "POLARIS", 38, fill=(255, 255, 255, pa), stroke=(20, 20, 30, pa))
    label(d, (vx, vy - 58), "VEGA", 40, fill=(215, 232, 255))
    if k > 0.97:
        place(img, text_sprite("NEW NORTH STAR {⭐}", 50, (255, 230, 140), (255, 230, 140), "black"), vx + 40, vy - 130,
              scale=max(0.01, ease_out_back(prog(lt, te(S, 1, -0.4), te(S, 1, -0.1)))))
    if ts(S, 0, 0.6) < lt < ts(S, 1, 0.6):
        al = clamp01((lt - ts(S, 0, 0.6)) / 0.3) * (1 - prog(lt, ts(S, 1, 0.3), ts(S, 1, 0.6)))
        cx, cy, r = 1700, 600, 110
        tilt = math.radians(23.5)
        L = r + 100
        ex, ey = math.sin(tilt) * L, math.cos(tilt) * L
        d.ellipse((cx - ex, cy - ey - 20, cx + ex, cy - ey + 20), outline=(255, 230, 140, int(150 * al)), width=3)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(40, 110, 200, int(255 * al)))
        d.ellipse((cx - 60, cy - 50, cx + 10, cy + 20), fill=(112, 172, 92, int(255 * al)))
        d.ellipse((cx + 20, cy - 10, cx + 80, cy + 60), fill=(112, 172, 92, int(255 * al)))
        ph = lt * 2.6
        dx, dy = math.sin(tilt) * math.cos(ph), -math.cos(tilt)
        d.line((cx - dx * L, cy - dy * L, cx + dx * L, cy + dy * L), fill=(255, 230, 140, int(255 * al)), width=7)
        label(d, (cx, cy + r + 56), "26,000-YEAR WOBBLE", 32, fill=(255, 255, 255, int(255 * al)),
              stroke=(20, 20, 30, int(255 * al)))
    person(d, 380, FLOOR, 1.0, pose="sit", hair=HAIR, t=lt, seed=1, look=0.8, look_y=-1,
           expr="neutral" if lt < ts(S, 1, 1.5) else "shock")
    return {}


U0, U_ESC = 0.55, 0.8


@functools.lru_cache(maxsize=None)
def _river_segs():
    segs = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(RIVER, RIVER[1:])]
    return segs, sum(segs)


def river_at(u):
    segs, tot = _river_segs()
    dist = u * tot
    for (a, b), s in zip(zip(RIVER, RIVER[1:]), segs):
        if dist <= s:
            k = dist / s
            return a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, math.atan2(b[1] - a[1], b[0] - a[0])
        dist -= s
    a, b = RIVER[-2], RIVER[-1]
    return b[0], b[1], math.atan2(b[1] - a[1], b[0] - a[0])


def river_pts(u0, u1, n=24):
    return [river_at(lerp(u0, u1, i / (n - 1)))[:2] for i in range(n)]


def gone_time(S):
    return te(S, 0, -0.5)


def sc_niagara(img, d, lt, S):
    g = gone_time(S)
    k = ease_in_out(prog(lt, ts(S, 0, 1.0), g))
    u = lerp(U0, 0.02, k)
    gorge = river_pts(u, U_ESC)
    d.line(gorge, fill=(84, 70, 60), width=74, joint="curve")
    d.line(gorge, fill=(46, 104, 164), width=34, joint="curve")
    if lt < g:
        x, y, a = river_at(u)
        nx, ny = -math.sin(a), math.cos(a)
        for j in range(5):
            ph = (lt * 1.5 + j / 5) % 1
            rr = 14 + ph * 28
            ox = x + math.cos(a) * (24 + ph * 34) + nx * (j - 2) * 16
            oy = y + math.sin(a) * (24 + ph * 34) + ny * (j - 2) * 16
            d.ellipse((ox - rr, oy - rr, ox + rr, oy + rr), fill=(255, 255, 255, int(130 * (1 - ph))))
        d.line((x - nx * 46, y - ny * 46, x + nx * 46, y + ny * 46), fill=(250, 250, 255), width=18)
        label(d, (x, y - 120), "NIAGARA FALLS", 42)
        label(d, (x, y - 72), f"{int(round(32 * u / U0))} km to Lake Erie", 34, fill=(255, 240, 170))
    else:
        s = text_sprite("GONE", 130, (235, 45, 45), (235, 45, 45), "black", stroke=6, shadow=True)
        place(img, s, 780, 520, scale=max(0.01, ease_out_back(prog(lt, g, g + 0.3))), rot=-12)
    ik = ease_in_out(prog(lt, ts(S, 1, 0.4), te(S, 1, 0.6)))
    fx = {}
    if ik > 0:
        ye = lerp(-60, 840, ik)
        pts = [(0, 0), (WW, 0)] + [(x, ye + 30 * math.sin(x * 0.02) + 22 * math.sin(x * 0.053))
                                   for x in range(WW, -61, -60)]
        d.polygon(pts, fill=(242, 248, 255, 235))
        r = random.Random(6)
        for _ in range(90):
            x = (r.uniform(0, WW) + lt * 60) % WW
            y = (r.uniform(0, WH) + lt * 140) % WH
            d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 255, 255, 200))
        if ik > 0.25:
            place(img, text_sprite("ICE SHEETS RETURN {❄️}", 64, (40, 80, 140), (40, 80, 140), "black", stroke=0,
                                   shadow=False), 1080, max(150, ye - 150),
                  scale=max(0.01, ease_out_back(prog(ik, 0.25, 0.45))))
        fx["tint"] = (230, 240, 255, int(60 * ik))
    return fx


BD_NOW = [(260, 200), (360, 214), (450, 250), (530, 300), (560, 392), (690, 382), (680, 290)]
BD_LATER = [(230, 168), (390, 262), (420, 206), (560, 330), (512, 440), (736, 352), (640, 246)]


@functools.lru_cache(maxsize=32)
def bering_sprite(step):
    k = step / 20
    w, h = 640, 480
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((2, 2, w - 3, h - 3), radius=30, fill=(46, 118, 190), outline=INK, width=5)
    g = 72 * k
    d.polygon([(4, 70), (200 + g, 90), (232 + g, 210), (212 + g, 340), (4, 420)], fill=LAND, outline=COAST, width=5)
    d.polygon([(w - 5, 50), (440 - g, 96), (410 - g, 214), (432 - g, 344), (w - 5, 440)], fill=LAND, outline=COAST,
              width=5)
    if k > 0.45:
        b = (k - 0.45) / 0.55 * 54
        d.polygon([(226 + g, 212 - b), (414 - g, 216 - b), (414 - g, 216 + b), (226 + g, 212 + b)], fill=LAND)
    for (x, y, t) in ((110, 250, "ASIA"), (540, 250, "ALASKA")):
        d.text((x, y), t, font=font("black", 40), fill=(255, 255, 255), anchor="mm", stroke_width=3,
               stroke_fill=(20, 40, 30))
    d.text((w / 2, 440), "SEA LEVEL DROPS", font=font("black", 34), fill=(255, 255, 255), anchor="mm")
    return im


def sc_ice(img, d, lt, S):
    night = ease_in_out(prog(lt, ts(S, 2, -0.3), ts(S, 2, 0.5)))
    if night > 0:
        d.rectangle((0, 0, WW, 860), fill=(10, 16, 40, int(215 * night)))
        draw_stars(d, 9, 160, (0, 0, WW, 760), lt, alpha=night)
        km = ease_in_out(prog(lt, ts(S, 2, 0.8), te(S, 2, -0.2)))
        pts = [(lerp(a[0], b[0], km), lerp(a[1], b[1], km)) for a, b in zip(BD_NOW, BD_LATER)]
        lc = (170, 190, 255, int(160 * night))
        d.line(pts[:4], fill=lc, width=3)
        d.line(pts[3:] + [pts[3]], fill=lc, width=3)
        for x, y in pts:
            d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(250, 250, 255, int(255 * night)))
        label(d, (470, 120), "BIG DIPPER" if km < 0.5 else "???", 40,
              fill=(255, 255, 255, int(255 * night)), stroke=(20, 20, 30, int(255 * night)))
    r = random.Random(7)
    for _ in range(150):
        sp = r.uniform(0.6, 1.4)
        x = (r.uniform(0, WW) + lt * 160 * sp) % WW
        y = (r.uniform(0, WH) + lt * 200 * sp) % WH
        s = r.choice((3, 4, 5))
        d.ellipse((x - s, y - s, x + s, y + s), fill=(255, 255, 255, 210))
    px = 980
    person(d, px, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look=0.6, look_y=-1 if night > 0.5 else 0,
           expr="nervous" if night < 0.5 else "shock")
    hx, hy = head_of(px, FLOOR)
    d.chord((hx - 92, hy - 122, hx + 92, hy + 2), 180, 360, fill=(210, 60, 60))
    d.rounded_rectangle((hx - 96, hy - 66, hx + 96, hy - 44), radius=10, fill=(244, 244, 244))
    d.ellipse((hx - 22, hy - 146, hx + 22, hy - 102), fill=(244, 244, 244))
    ph = (lt % 1.3) / 1.3
    if ph < 0.7:
        for j in range(3):
            q = ph + j * 0.08
            rr = 10 + q * 40
            d.ellipse((hx + 70 + q * 120 - rr, hy + 40 - q * 50 - rr, hx + 70 + q * 120 + rr, hy + 40 - q * 50 + rr),
                      fill=(255, 255, 255, int(150 * (1 - q / 0.9))))
    if ts(S, 1, -0.1) <= lt and night < 0.98:
        step = int(round(20 * ease_in_out(prog(lt, ts(S, 1, 0.3), te(S, 1, -0.2)))))
        place(img, bering_sprite(step), 1600, 410, scale=0.5 + 0.5 * ease_out_back(prog(lt, ts(S, 1, -0.1),
                                                                                         ts(S, 1, 0.2))),
              alpha=1 - night)
    return {}


def erupt_time(S):
    return ts(S, 1, 0.3)


def sc_volcano(img, d, lt, S):
    et = erupt_time(S)
    k = prog(lt, et, S["dur"])
    if lt < ts(S, 1, 0.2):
        bk = ease_out_cubic(prog(lt, ts(S, 0, 1.2), te(S, 0, -0.6)))
        al = 1 - prog(lt, ts(S, 1), ts(S, 1, 0.2))
        if al > 0.02:
            compare_bars(img, d, 560, 160, 1080, [("🧍", "HUMANS EXIST: 300,000 YEARS", 0.3, FRIEND),
                                                   ("⏳", "YOU: 1,000,000 YEARS", 1.0, BLUE)], bk)
    fx = {}
    if lt >= et:
        r = random.Random(11)
        for i in range(70):
            t0 = et + i * 0.06
            if lt < t0:
                break
            age = lt - t0
            x = 1510 + r.uniform(-60, 60) + age * r.uniform(-45, 45)
            y = 370 - age * r.uniform(90, 170)
            rad = 40 + age * r.uniform(30, 58)
            g = int(r.uniform(58, 100))
            if y + rad > -40:
                d.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(g, g - 6, g - 10, 235))
        for i in range(40):
            ph = ((lt - et) * 1.2 + i / 40) % 1
            ang = math.radians(-90 + r.uniform(-35, 35))
            v = r.uniform(300, 520)
            x = 1510 + math.cos(ang) * v * ph
            y = 380 + math.sin(ang) * v * ph + 600 * ph * ph
            d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(255, int(140 + 100 * (1 - ph)), 40))
        if int((lt - et) * 7) % 5 == 0:
            x0, y0 = 1400 + r.uniform(0, 200), 120
            pts = [(x0, y0)]
            for _ in range(5):
                x0 += r.uniform(-50, 50)
                y0 += r.uniform(40, 70)
                pts.append((x0, y0))
            d.line(pts, fill=(255, 250, 200), width=6)
        n = 1 + int(11 * prog(lt, et + 0.4, te(S, 1)))
        show_card(img, info_card("SUPERVOLCANOES SEEN", f"{n}", "🌋", 680, size=80), 800, 250, lt, et + 0.2)
        fx["tint"] = (30, 10, 10, int(110 * k))
        if lt - et < 0.25:
            fx["flash"] = 0.5 * (1 - (lt - et) / 0.25)
    person(d, 330, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look=1, expr="shock" if lt > et else "smug")
    return fx


EUROPE = [(520, 300), (540, 240), (600, 220), (640, 160), (700, 150), (740, 90), (800, 60), (860, 80), (860, 140),
          (920, 150), (980, 120), (1060, 140), (1080, 220), (1060, 300), (1000, 330), (960, 360), (930, 330),
          (900, 350), (870, 380), (850, 340), (800, 320), (760, 330), (700, 320), (640, 350), (580, 350)]
AFRICA_W = [(560, 470), (640, 430), (760, 420), (860, 430), (960, 440), (1040, 470), (1080, 520), (1060, 620),
            (1030, 720), (1000, 820), (980, 900), (995, 950), (940, 1010), (890, 1000), (870, 930), (860, 850),
            (830, 780), (790, 730), (710, 710), (640, 690), (580, 640), (540, 570)]
SOMALI = [(1080, 520), (1100, 540), (1170, 560), (1210, 600), (1170, 660), (1110, 720), (1080, 800), (1040, 880),
          (995, 950), (980, 900), (1000, 820), (1030, 720), (1060, 620)]
RIFT = [(1080, 520), (1060, 620), (1030, 720), (1000, 820), (980, 900), (995, 950)]
ARABIA = [(1060, 440), (1120, 420), (1200, 440), (1280, 480), (1320, 560), (1270, 610), (1200, 590), (1150, 540),
          (1100, 500)]
ASIA = [(1060, 140), (1200, 90), (1400, 60), (1700, 50), (2000, 90), (2160, 140), (2160, 480), (2060, 520),
        (1960, 600), (1880, 640), (1820, 600), (1760, 640), (1700, 600), (1640, 560), (1560, 560), (1500, 520),
        (1420, 500), (1340, 470), (1280, 480), (1200, 440), (1120, 420), (1080, 300), (1080, 220)]
INDIA = [(1420, 500), (1500, 520), (1540, 600), (1500, 700), (1470, 720), (1440, 640)]
AUSTRALIA = [(1800, 880), (1880, 830), (1980, 820), (2060, 850), (2120, 920), (2100, 1000), (2020, 1040),
             (1920, 1030), (1840, 1000), (1800, 940)]
ISLANDS = [(1700, 660, 1760, 690), (1770, 700, 1850, 730), (1870, 690, 1970, 722), (1990, 700, 2070, 736)]


MAP_S, MAP_C = 0.86, (1080, 560)


def M(x, y):
    """Shrink the world map toward the centre so it stays inside the Shorts safe zone."""
    return MAP_C[0] + (x - MAP_C[0]) * MAP_S, MAP_C[1] + (y - MAP_C[1]) * MAP_S


def poly(d, pts, dx=0.0, dy=0.0):
    d.polygon([M(x + dx, y + dy) for x, y in pts], fill=LAND, outline=COAST, width=6)


def draw_world(d, africa_dy=0.0, somali=(0.0, 0.0), aus_dy=0.0):
    for p in (EUROPE, ASIA, INDIA, ARABIA):
        poly(d, p)
    for (a, b, c, e) in ISLANDS:
        d.ellipse((*M(a, b), *M(c, e)), fill=LAND, outline=COAST, width=5)
    poly(d, AFRICA_W, dy=africa_dy)
    poly(d, SOMALI, dx=somali[0], dy=somali[1] + africa_dy)
    poly(d, AUSTRALIA, dy=aus_dy)
    label(d, M(790, 230), "EUROPE", 44)
    label(d, M(1650, 280), "ASIA", 48)
    label(d, M(800, 640 + africa_dy), "AFRICA", 48)
    label(d, M(1960, 940 + aus_dy), "AUSTRALIA", 38)


@functools.lru_cache(maxsize=32)
def california_sprite(step):
    k = step / 20
    w, h = 560, 600
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((2, 2, w - 3, h - 3), radius=30, fill=(46, 118, 190), outline=INK, width=5)
    d.polygon([(330, 6), (300, 120), (250, 200), (230, 300), (262, 400), (330, 480), (400, 560), (w - 5, 594),
               (w - 5, 6)], fill=LAND, outline=COAST, width=5)
    fault = [(300, 60), (330, 200), (370, 330), (410, 450), (440, 590)]
    for a, b in zip(fault, fault[1:]):
        for j in range(6):
            p0, p1 = j / 6, (j + 0.55) / 6
            d.line((lerp(a[0], b[0], p0), lerp(a[1], b[1], p0), lerp(a[0], b[0], p1), lerp(a[1], b[1], p1)),
                   fill=(220, 50, 50), width=6)
    sf = (292, 170)
    la0 = (380, 500)
    la = (lerp(la0[0], sf[0] + 20, 0.45 * k), lerp(la0[1], sf[1] + 60, 0.45 * k))
    d.line((la0[0], la0[1], la[0], la[1]), fill=(255, 255, 255), width=5)
    for (x, y), t, col in ((sf, "SAN FRANCISCO", (255, 255, 255)), (la, "LOS ANGELES", (255, 230, 120))):
        d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=col, outline=INK, width=4)
        d.text((x - 24, y), t, font=font("black", 34), fill=col, anchor="rm", stroke_width=3, stroke_fill=(20, 30, 40))
    d.text((w / 2, 40), "SAN ANDREAS FAULT", font=font("black", 34), fill=(255, 255, 255), anchor="mm",
           stroke_width=3, stroke_fill=(20, 30, 40))
    return im


ANIMALS = ["🦁", "🐘", "🦒", "🐼", "🐧"]


def sc_rift(img, d, lt, S):
    k = ease_in_out(prog(lt, ts(S, 0, 1.6), te(S, 0, 0.4)))
    draw_world(d, somali=(70 * k, 26 * k))
    if ts(S, 0, 1.0) < lt and k < 0.25:
        r = random.Random(int(lt * 20))
        pts = [M(x + r.uniform(-6, 6), y) for x, y in RIFT]
        d.line(pts, fill=(255, 90, 60), width=8)
    if k > 0.5:
        place(img, text_sprite("NEW OCEAN", 48, (210, 240, 255), (210, 240, 255), "black"), *M(1290, 870),
              scale=max(0.01, ease_out_back(prog(k, 0.5, 0.8))))
        d.line((*M(1170, 845), *M(1065, 790)), fill=(210, 240, 255), width=6)
    if ts(S, 1, -0.1) <= lt < ts(S, 2, 0.1):
        step = int(round(20 * ease_in_out(prog(lt, ts(S, 1, 0.4), te(S, 1, -0.2)))))
        place(img, california_sprite(step), 1640, 520,
              scale=0.5 + 0.5 * ease_out_back(prog(lt, ts(S, 1, -0.1), ts(S, 1, 0.2))),
              alpha=1 - prog(lt, ts(S, 2, -0.1), ts(S, 2, 0.1)))
    if lt >= ts(S, 2, -0.1):
        al = clamp01((lt - ts(S, 2, -0.1)) / 0.25)
        d.rounded_rectangle((1080, 120, 1940, 330), radius=30, fill=(255, 255, 252, int(240 * al)), outline=INK,
                            width=4)
        span = S["te"][2] - S["ts"][2]
        swap = ts(S, 2, span * 0.62)
        for i, emo in enumerate(ANIMALS):
            x = 1165 + i * 170
            if lt < swap:
                place(img, emoji_sized(emo, 120), x, 225, alpha=al)
                t0 = ts(S, 2, 0.3 + i * span * 0.1)
                if lt >= t0:
                    place(img, emoji_sized("❌", 90), x, 225, scale=max(0.01, ease_out_back(prog(lt, t0, t0 + 0.25))))
            else:
                place(img, emoji_sized("❓", 110), x, 225, scale=max(0.01, ease_out_back(prog(lt, swap + i * 0.08,
                                                                                            swap + i * 0.08 + 0.3))))
    return {}


def sc_collide(img, d, lt, S):
    k1 = ease_in_out(prog(lt, ts(S, 0, 1.2), te(S, 0, 0.2)))
    k2 = ease_in_out(prog(lt, ts(S, 1, 0.2), te(S, 1, 0.4)))
    draw_world(d, africa_dy=-64 * k1, somali=(70, 26), aus_dy=-150 * k2)
    if k1 < 0.7:
        label(d, M(790, 398 - 30 * k1), "MEDITERRANEAN SEA", 36, fill=(210, 235, 255, int(255 * (1 - k1 / 0.7))),
              stroke=(20, 40, 70, int(255 * (1 - k1 / 0.7))))
    if k1 > 0.3:
        r = random.Random(3)
        x = 560
        while x < 1080:
            w = r.uniform(50, 90)
            hgt = r.uniform(60, 120) * prog(k1, 0.3, 1.0)
            yb = 392 + r.uniform(-8, 8)
            d.polygon([M(x, yb), M(x + w / 2, yb - hgt), M(x + w, yb)], fill=(126, 104, 86), outline=(84, 68, 56))
            if hgt > 50:
                d.polygon([M(x + w / 2 - w * 0.13, yb - hgt * 0.76), M(x + w / 2, yb - hgt),
                           M(x + w / 2 + w * 0.13, yb - hgt * 0.76)], fill=(250, 250, 255))
            x += w * 0.62
    if k1 > 0.75:
        sc_ = max(0.01, ease_out_back(prog(k1, 0.75, 1.0)))
        place(img, text_sprite("NEW MOUNTAINS", 44, (255, 255, 255), (255, 255, 255), "black"), 400, 500, scale=sc_)
        if sc_ > 0.9:
            d.line((560, 470, 628, 428), fill=(255, 255, 255), width=6)
    if k2 > 0.1:
        place(img, text_sprite("AUSTRALIA → ASIA", 46, (255, 240, 170), (255, 240, 170), "black"), 1500, 870,
              scale=max(0.01, ease_out_back(prog(k2, 0.1, 0.35))))
    fx = {}
    for t_hit in (te(S, 0, 0.2), te(S, 1, 0.4)):
        if 0 <= lt - t_hit < 0.2:
            fx["flash"] = 0.3 * (1 - (lt - t_hit) / 0.2)
    return fx


def impact_time(S):
    return ts(S, 1, 0.45 * (S["te"][1] - S["ts"][1]))


def sc_dino(img, d, lt, S):
    it = impact_time(S)
    a0 = ts(S, 1, 0.2)
    if lt < ts(S, 1, 0.2):
        bk = ease_out_cubic(prog(lt, ts(S, 0, 1.2), te(S, 0, -0.4)))
        compare_bars(img, d, 500, 170, 1400, [("🦖", "SINCE THE DINOSAURS DIED: 66,000,000 YEARS", 1.0, (110, 170, 90)),
                                               ("🧍", "YOU: 66,000,000 YEARS", bk, BLUE)], 1.0)
        if bk > 0.98:
            place(img, emoji_sized("✅", 90), 1830, 460, scale=max(0.01, ease_out_back(prog(lt, te(S, 0, -0.4),
                                                                                            te(S, 0, -0.1)))))
    fx = {}
    if a0 <= lt < it:
        p = prog(lt, a0, it)
        for j in range(14, -1, -1):
            q = p - j * 0.018
            if q < 0:
                continue
            x, y = lerp(2300, 1500, q), lerp(-160, 760, q)
            rr = 44 - j * 2.6
            d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(255, max(60, 220 - j * 12), 90, max(20, 220 - j * 14)))
        x, y = lerp(2300, 1500, p), lerp(-160, 760, p)
        d.ellipse((x - 34, y - 34, x + 34, y + 34), fill=(255, 246, 210))
    if lt >= it:
        a = lt - it
        R = 140 + a * 540
        d.pieslice((1500 - R, 770 - R, 1500 + R, 770 + R), 180, 360,
                   fill=(255, 170, 80, int(max(0, 230 - a * 70))))
        R2 = 80 + a * 300
        d.pieslice((1500 - R2, 770 - R2 * 0.7, 1500 + R2, 770 + R2 * 0.7), 180, 360,
                   fill=(255, 245, 210, int(max(0, 255 - a * 160))))
        fx["tint"] = (255, 120, 40, int(min(110, a * 90)))
        if a < 0.45:
            fx["flash"] = 1 - a / 0.45
    person(d, 360, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, look=1, expr="shock" if lt > a0 + 0.3 else "neutral")
    return fx


STRATA_HUMAN, STRATA_DINO = 760, 1040


@functools.lru_cache(maxsize=1)
def strata_img():
    im = Image.new("RGB", (WW, WH), (120, 90, 70))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, WW, 70), fill=(150, 200, 240))
    d.rectangle((0, 70, WW, 100), fill=(96, 150, 80))
    r = random.Random(5)
    cols = [(176, 140, 104), (150, 118, 92), (196, 168, 128), (132, 104, 84), (170, 150, 120), (120, 96, 80),
            (160, 130, 100), (110, 88, 74), (184, 156, 116), (140, 112, 88)]
    prev = [(x, 100) for x in range(0, WW + 41, 40)]
    y, i = 100, 0
    while y < WH:
        if prev[0][1] < STRATA_HUMAN <= prev[0][1] + 150:
            nxt = [(x, STRATA_HUMAN) for x, _ in prev]
        else:
            hgt = r.randint(80, 140)
            nxt = [(x, yy + hgt + 10 * math.sin(x / 170 + i)) for x, yy in prev]
        d.polygon(prev + nxt[::-1], fill=cols[i % len(cols)])
        prev = nxt
        y = min(yy for _, yy in prev)
        i += 1
        if abs(y - STRATA_HUMAN) < 1:
            d.rectangle((0, STRATA_HUMAN, WW, STRATA_HUMAN + 26), fill=(150, 150, 160))
            for _ in range(320):
                x0, y0 = r.uniform(0, WW), r.uniform(STRATA_HUMAN + 2, STRATA_HUMAN + 22)
                w, h = r.uniform(6, 18), r.uniform(4, 8)
                d.rectangle((x0, y0, x0 + w, y0 + h), fill=r.choice(((230, 60, 60), (60, 120, 230), (250, 210, 60),
                                                                     (240, 240, 240), (60, 200, 120), (80, 80, 86))))
            prev = [(x, STRATA_HUMAN + 26) for x, _ in prev]
            y = STRATA_HUMAN + 26
    for _ in range(26):
        x0, y0 = r.uniform(80, WW - 80), r.uniform(140, WH - 40)
        if abs(y0 - STRATA_HUMAN) < 60 or abs(y0 - STRATA_DINO) < 70:
            continue
        for k in range(4):
            rr = 6 + k * 6
            d.arc((x0 - rr, y0 - rr, x0 + rr, y0 + rr), k * 90, k * 90 + 220, fill=(232, 222, 196), width=4)
    bx, by = 900, STRATA_DINO
    d.rounded_rectangle((bx - 110, by - 16, bx + 110, by + 16), radius=16, fill=(236, 226, 200))
    for ox in (-110, 110):
        for oy in (-16, 16):
            d.ellipse((bx + ox - 22, by + oy - 22, bx + ox + 22, by + oy + 22), fill=(236, 226, 200))
    return im


def sc_space(img, d, lt, S):
    st = ts(S, 3, -0.2)
    if lt < st + 0.7:
        for rr, a in ((440, 26), (360, 46), (300, 80)):
            d.ellipse((-60 - rr, 560 - rr, -60 + rr, 560 + rr), fill=(255, 220, 140, a))
        d.ellipse((-320, 300, 200, 820), fill=(255, 238, 180))
        merge = ease_in_out(prog(lt, ts(S, 2, 1.8), te(S, 2, -0.2)))
        earth(img, 820, 600, 210, 0.02 * lt * (1 - merge), merge)
        mk = ease_in_out(prog(lt, ts(S, 1, 0.2), te(S, 1, -0.2)))
        mx, my = 1560 + 300 * mk, 540
        d.ellipse((mx - 58, my - 58, mx + 58, my + 58), fill=(200, 200, 206))
        for ox, oy, rr in ((-18, -14, 12), (16, 10, 9), (-6, 22, 7)):
            d.ellipse((mx + ox - rr, my + oy - rr, mx + ox + rr, my + oy + rr), fill=(170, 170, 178))
        if lt > ts(S, 1):
            al = int(255 * clamp01((lt - ts(S, 1)) / 0.3))
            d.line((1050, 560, mx - 76, my), fill=(255, 255, 255, al), width=5)
            d.polygon([(mx - 76, my), (mx - 100, my - 14), (mx - 100, my + 14)], fill=(255, 255, 255, al))
            label(d, ((1050 + mx) / 2, 500), "+3,800 km", 46, fill=(255, 240, 170, al), stroke=(20, 20, 30, al))
        show_card(img, info_card("ONE DAY", "24 h  →  24 h 30 min", "🕐", 760, size=56), 1400, 210, lt,
                  ts(S, 0, 1.2), ts(S, 1, 0.1))
        if ts(S, 2) <= lt:
            al = int(255 * clamp01((lt - ts(S, 2)) / 0.3))
            label(d, (440, 200), "+1% BRIGHTER", 52, fill=(255, 220, 120, al), stroke=(40, 20, 0, al))
        if merge > 0.2:
            place(img, text_sprite("NEW SUPERCONTINENT FORMING", 46, (200, 240, 210), (200, 240, 210), "black"), 820,
                  880, scale=max(0.01, ease_out_back(prog(merge, 0.2, 0.45))))
    if lt >= st:
        k = ease_in_out(prog(lt, st, st + 0.7))
        yo = int((1 - k) * WH)
        img.paste(strata_img(), (0, yo))
        if k > 0.95:
            al = int(255 * clamp01((lt - st - 0.7) / 0.3))
            d.line((1420, STRATA_HUMAN - 90, 1260, STRATA_HUMAN + 8), fill=(255, 245, 170, al), width=7)
            label(d, (1560, STRATA_HUMAN - 130), "ALL OF HUMAN HISTORY", 48, fill=(255, 245, 170, al),
                  stroke=(30, 20, 10, al))
            label(d, (1240, STRATA_DINO - 70), "DINOSAURS (66 MILLION YEARS OLDER)", 38, fill=(255, 255, 255, al),
                  stroke=(30, 20, 10, al))
            d.line((260, 110, 260, STRATA_HUMAN - 10), fill=(255, 255, 255, al), width=6)
            for yy in (110, STRATA_HUMAN - 10):
                d.line((240, yy, 280, yy), fill=(255, 255, 255, al), width=6)
            label(d, (300, (110 + STRATA_HUMAN) / 2), "100,000,000 YEARS OF NEW ROCK", 40, anchor="lm",
                  fill=(255, 255, 255, al), stroke=(30, 20, 10, al))
    return {}


def sc_end(img, d, lt, S):
    for i, emo in enumerate(("❄️", "🌋", "🌊", "⛰️", "☄️")):
        t0 = ts(S, 0, 0.2 + i * 0.45)
        if t0 <= lt:
            a = math.radians(200 + i * 35)
            place(img, emoji_sized(emo, 110), 1540 + math.cos(a) * 380, 560 + math.sin(a) * 300,
                  scale=max(0.01, ease_out_back(prog(lt, t0, t0 + 0.3))), alpha=1 - prog(lt, ts(S, 1, 0.2), ts(S, 1, 0.8)))
    gk = ease_in_out(prog(lt, ts(S, 1, 0.6), ts(S, 1, 1.8)))

    def fam(dd):
        person(dd, 420, FLOOR, 1.0, shirt=MOM, hair="bun", hood=False, pose="sit", t=lt, seed=4, look=1,
               expr="happy")
        person(dd, 690, FLOOR, 0.98, shirt=FRIEND, hair="cap", hood=False, pose="sit", t=lt, seed=8, look=1,
               expr="laugh")
    ghost(img, 0.55 * gk, fam)
    person(d, 960, FLOOR, 1.0, pose="sit", hair=HAIR, t=lt, seed=1, look=1 if gk < 0.4 else -0.8,
           expr="sad" if gk < 0.4 else "happy")
    return {}


def sc_cta(img, d, lt, S):
    d.rectangle((0, 0, WW // 2, WH), fill=(12, 14, 34))
    draw_stars(d, 31, 90, (0, 0, WW // 2, WH), lt)
    earth(img, 380, 420, 110, lt * 0.03)
    d.rectangle((WW // 2, 0, WW, WH), fill=(240, 186, 104))
    d.ellipse((WW * 0.75 - 420, 140, WW * 0.75 + 420, 1000), fill=(255, 214, 140))
    d.line((WW // 2, 0, WW // 2, WH), fill=(255, 255, 255), width=8)
    hx, hy = head_of(640, FLOOR)
    aura(d, hx, hy, lt, 1.0, col=GOLD)
    person(d, 640, FLOOR, 1.0, hair=HAIR, t=lt, seed=1, expr="neutral", look=0.3)
    person(d, 1360, FLOOR, 1.0, hair=HAIR, t=lt, seed=3, expr="laugh", look=1)
    person(d, 1580, FLOOR, 0.98, shirt=MOM, hair="bun", hood=False, t=lt, seed=4, expr="happy", look=-1, facing=-1)
    person(d, 1800, FLOOR, 0.97, shirt=FRIEND, hair="cap", hood=False, t=lt, seed=8, expr="laugh", look=-1,
           facing=-1, arms=("down", "wave"))
    for x, lab in ((540, "100,000,000 YEARS {⏳}"), (1620, "NORMAL LIFE {❤️}")):
        s = text_sprite(lab, 52, INK, INK, "black", stroke=0, shadow=False)
        d.rounded_rectangle((x - s.width / 2 - 30, 70, x + s.width / 2 + 30, 190), radius=28, fill=(255, 255, 252))
        place(img, s, x, 130)
    return {}


# ======================================================================================
# Story
# ======================================================================================
SCENES = [
    dict(fn=sc_wake, bg="bedroom", tod="DAY 1", years=(0, 0), lines=[
        N("You wake up one morning, and you realize you will never die."),
        N("Not from old age. Not from sickness. Not from anything."),
        N("Because even if you just stopped aging, accidents would get you within a few thousand years."),
        N("But you? You're going to live for one hundred million years.",
          "But you? You're going to live for 100,000,000 years.")], extra=0.6),
    dict(fn=sc_family, bg="graveyard", tod="FAMILY", years=(80, 100), lines=[
        N("Year eighty. Everyone you love is getting old.", "Year 80. Everyone you love is getting old."),
        N("By year one hundred, your family and friends are all gone.",
          "By year 100, your family and friends are all gone."),
        N("And you still look exactly the same.")], extra=0.5),
    dict(fn=sc_future, bg="future", tod="THE FUTURE", years=(100, 1000), lines=[
        N("Year one thousand. Nobody speaks your language anymore.",
          "Year 1,000. Nobody speaks your language anymore."),
        N("Think about it: English from a thousand years ago looks like this.",
          "Think about it: English from 1,000 years ago looks like this."),
        N("So every few centuries, you have to learn to talk all over again.")]),
    dict(fn=sc_memory, bg="void", tod="MEMORIES", years=(1000, 10000), lines=[
        N("Year ten thousand. You've lived more than a hundred lifetimes.",
          "Year 10,000. You've lived more than 100 lifetimes."),
        N("Your brain can't keep it all. Your childhood, your first home, even your mom's face, slowly fade away.")],
         extra=0.7),
    dict(fn=sc_stars, bg="nightsky", tod="NIGHT SKY", years=(10000, 13000), lines=[
        N("Even the sky changes. Earth wobbles like a spinning top."),
        N("Around year thirteen thousand, the North Star isn't Polaris anymore. It's Vega.",
          "Around year 13,000, the North Star isn't Polaris anymore. It's Vega.")], extra=0.6),
    dict(fn=sc_niagara, bg="niagara", tod="NIAGARA FALLS", years=(13000, 50000), lines=[
        N("Year fifty thousand. Niagara Falls has worn itself all the way back to Lake Erie, and disappeared.",
          "Year 50,000. Niagara Falls has worn itself all the way back to Lake Erie, and disappeared."),
        N("And the ice is coming back. Glaciers start growing across North America and Europe.")], extra=0.3),
    dict(fn=sc_ice, bg="ice", tod="ICE AGE", years=(50000, 100000), lines=[
        N("Year one hundred thousand. You're living through an ice age.",
          "Year 100,000. You're living through an ice age."),
        N("The oceans have dropped so low, you can walk from Asia to Alaska."),
        N("And the stars have moved so much, the constellations you knew are unrecognizable.")], extra=0.3),
    dict(fn=sc_volcano, bg="volcano", tod="SUPERVOLCANO", years=(100000, 1000000), lines=[
        N("Year one million. You've lived longer than humans have even existed. Three times over.",
          "Year 1,000,000. You've lived longer than humans have even existed. 3 times over."),
        N("You've watched more than ten supervolcano eruptions turn the sky dark for years.",
          "You've watched more than 10 supervolcano eruptions turn the sky dark for years.")], extra=0.5),
    dict(fn=sc_rift, bg="map", tod="AFRICA", years=(1000000, 10000000), lines=[
        N("Year ten million. Africa is tearing apart, and the East African Rift fills with ocean water.",
          "Year 10,000,000. Africa is tearing apart, and the East African Rift fills with ocean water."),
        N("Los Angeles is sliding north along the San Andreas Fault, on its way to San Francisco."),
        N("Almost every animal you knew is extinct. New species have taken their place.")], extra=0.3),
    dict(fn=sc_collide, bg="map", tod="EUROPE + AFRICA", years=(10000000, 50000000), lines=[
        N("Year fifty million. Africa crashes into Europe. The Mediterranean Sea is gone, replaced by giant mountains.",
          "Year 50,000,000. Africa crashes into Europe. The Mediterranean Sea is gone, replaced by giant mountains."),
        N("And Australia has drifted north, crashing into Asia.")], extra=0.6),
    dict(fn=sc_dino, bg="dusk", tod="DINOSAUR TIME", years=(50000000, 66000000), lines=[
        N("Year sixty-six million. You've now lived as long as the time since the dinosaurs died out.",
          "Year 66,000,000. You've now lived as long as the time since the dinosaurs died out."),
        N("And there's a real chance you've seen another asteroid hit as big as the one that killed them.")],
         extra=1.3),
    dict(fn=sc_space, bg="space", tod="EARTH", years=(66000000, 100000000), lines=[
        N("Year one hundred million. A day now lasts about half an hour longer, because the Moon keeps slowing Earth "
          "down.", "Year 100,000,000. A day now lasts about half an hour longer, because the Moon keeps slowing Earth "
          "down."),
        N("The Moon has drifted almost four thousand kilometers farther away.",
          "The Moon has drifted almost 4,000 km farther away."),
        N("The Sun is about one percent brighter, and the continents are slowly crashing together into a new "
          "supercontinent.", "The Sun is about 1% brighter, and the continents are slowly crashing together into a "
          "new supercontinent."),
        N("And the only proof on Earth that humans ever existed? A thin layer in the rocks, full of strange traces "
          "of plastic, metal and concrete.")], extra=0.8),
    dict(fn=sc_end, bg="cliff", tod="LOOKING BACK", years=(100000000, 100000000), lines=[
        N("You've seen ice ages, new oceans, and mountains rise from the sea."),
        N("But what you miss most is one more day with the people from your first hundred years.")], extra=1.2),
    dict(fn=sc_cta, bg=None, tod=None, years=None, lines=[
        N("So, would you want to live for a hundred million years? Tell me in the comments.",
          "So, would you want to live for 100,000,000 years? Tell me in the comments.")], extra=1.2),
]


# ======================================================================================
# Engine hooks
# ======================================================================================
def timer_text(k, lt):
    sc, S = base.SCENES[k], base.TL[k]
    if not sc.get("years"):
        return None
    y0, y1 = sc["years"]
    p = ease_in_out(clamp01(lt / max(0.5, S["dur"] - 0.4)))
    y = y0 if y0 == y1 else (y0 * (y1 / y0) ** p if y0 > 0 else y1 * p)
    return f"YEAR {int(round(y)):,}", False


def install():
    base.TITLE, base.PART, base.SCENES = TITLE, PART, SCENES
    base.ARM_POSES.setdefault("head", ((110, -30), (34, -124)))
    orig_bg = base.bg

    @functools.lru_cache(maxsize=None)
    def bg(name):
        return MY_BGS[name]() if name in MY_BGS else orig_bg(name)

    base.bg = bg
    base.timer_text = timer_text


def build_timeline(voices):
    t = 0.35
    tl, caps, voice_at = [], [], []
    li = 0
    for sc in SCENES:
        start = t
        tsl, tel = [], []
        for line in sc["lines"]:
            dur = len(voices[li]) / SR if voices else max(1.2, len(line["text"].split()) / 2.8)
            tsl.append(t - start)
            tel.append(t - start + dur)
            voice_at.append((li, t))
            chunks = chunk_caption(line["cap"])
            wts = [len(c) + 3 for c in chunks]
            tot = sum(wts)
            ct = t
            for c, wgt in zip(chunks, wts):
                cd = dur * wgt / tot
                caps.append((ct, ct + cd, c.upper().strip(",.:")))
                ct += cd
            t += dur + 0.24
            li += 1
        t += sc.get("extra", 0.0) + 0.25
        tl.append(dict(start=start, dur=t - start, ts=tsl, te=tel))
    return tl, caps, voice_at, t


# ======================================================================================
# Audio
# ======================================================================================
LEVELS = [(1, .6, .6), (.7, 1, 0), (1, .6, 1), (.6, 1, 0), (.8, 1, 0), (1, .8, .6), (.8, 1, .4), (.8, 1, 1),
          (1, .8, 1), (1, .8, 1), (.8, 1, 1), (.8, 1, .5), (.7, 1, 0), (1, .6, 1)]   # (keys, pad, kick) per scene


def build_audio(voices, voice_at, total, tl):
    n = int(total * SR) + SR
    rng = np.random.default_rng(3)

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
        m = max(2, int(sec * SR))
        spec = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        spec[(fr < lo) | (fr > hi)] = 0
        s = np.fft.irfft(spec, m)
        return s / (np.abs(s).max() + 1e-9)

    def sweep(f0, f1, sec):
        x = tt(sec)
        return np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * x / sec) / SR)

    def thump(f0=42, sec=0.3):
        x = tt(sec)
        return np.sin(2 * np.pi * np.cumsum(f0 + 40 * np.exp(-x * 30)) / SR) * np.exp(-x * 12)

    def whoosh(sec=0.45):
        return bandnoise(sec, 500, 5000) * np.sin(np.pi * tt(sec) / sec) ** 2

    def mixs(*sigs):
        """Sum signals of different lengths (zero-padded)."""
        outp = np.zeros(max(len(x) for x in sigs))
        for x in sigs:
            outp[:len(x)] += x
        return outp

    def T(i, line=0, off=0.0, end=False):
        S = tl[i]
        return S["start"] + (S["te"][line] if end else S["ts"][line]) + off

    # --- music: piano arps, warm pad, soft kick (levels per scene)
    keys, pad, kick = np.zeros(n), np.zeros(n), np.zeros(n)
    chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]
    beat = 60 / 84
    b, tpos = 0, 0.0
    while tpos < total:
        ch = chords[(b // 4) % 4]
        for e in range(2):
            add(keys, tone(ch[(b * 2 + e) % 3] * (2 if e else 1), 1.4, dec=2.2), tpos + e * beat / 2, 0.15)
        if b % 4 == 0:
            ln = beat * 4 + 0.6
            x = tt(ln)
            env = np.minimum(1, x / 0.9) * np.minimum(1, (ln - x) / 0.6)
            add(pad, sum(np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x) for f in ch) * env / 3, tpos, 0.11)
            add(keys, tone(ch[0] / 2, beat * 4, (1, 0.3), 0.8), tpos, 0.2)
        x = tt(0.25)
        add(kick, np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-x * 25)) / SR) * np.exp(-x * 12), tpos, 0.25)
        b += 1
        tpos += beat
    ek, ep, eb = np.ones(n), np.ones(n), np.ones(n)
    for i, S in enumerate(tl):
        a, z = int(S["start"] * SR), int((S["start"] + S["dur"]) * SR)
        ek[a:z], ep[a:z], eb[a:z] = LEVELS[i]
    music = keys * smooth(ek, 0.5) + pad * smooth(ep, 0.5) + kick * smooth(eb, 0.5)

    out, venv = np.zeros(n), np.zeros(n)
    if voices:
        for li, t0 in voice_at:
            add(out, voices[li], t0, 1.0)
            add(venv, np.ones(len(voices[li])), t0)
    music *= 1 - 0.5 * np.clip(smooth(venv, 0.12), 0, 1)

    sfx = np.zeros(n)
    for S in tl[1:]:
        add(sfx, whoosh(), S["start"] - 0.15, 0.16)
    # 0 wake: shield dinks + the big number chime
    for i in range(3):
        add(sfx, tone(1800 + i * 200, 0.35, (1, 0.6), 12), T(0, 2, 0.3 + i * 0.75 + 0.45), 0.18)
    t_ch = T(0, 3, 0.8)
    for j, f in enumerate((1046.5, 1318.5, 1568)):
        add(sfx, tone(f, 1.6, (1, 0.5, 0.25), 2.2), t_ch + j * 0.07, 0.10)
    # 2 future hum + flying cars
    S = tl[2]
    x = tt(S["dur"])
    add(sfx, (np.sin(2 * np.pi * 110 * x) + 0.5 * np.sin(2 * np.pi * 220 * x)) * (0.6 + 0.4 * np.sin(2 * np.pi * 4 * x)),
        S["start"], 0.025)
    for j in range(5):
        add(sfx, bandnoise(0.6, 800, 4000) * np.sin(np.pi * tt(0.6) / 0.6) ** 2, S["start"] + 0.5 + j * 1.6, 0.06)
    # 3 memory swell
    add(sfx, sweep(300, 900, 1.2) * np.sin(np.pi * tt(1.2) / 1.2) ** 2, T(3, 1, -0.3), 0.06)
    # 4 crickets
    S = tl[4]
    br = random.Random(4)
    tc = S["start"] + 0.2
    while tc < S["start"] + S["dur"]:
        c = np.sin(2 * np.pi * 4400 * tt(0.16)) * (np.sin(2 * np.pi * 30 * tt(0.16)) > 0)
        add(sfx, c, tc, 0.02)
        tc += br.uniform(0.4, 0.9)
    # 5 Niagara: falls noise until it's gone, stamp, then wind
    S = tl[5]
    g = S["start"] + gone_time(S)
    fall = bandnoise(g - S["start"], 120, 3000)
    fall *= np.minimum(1, tt(len(fall) / SR) / 0.4)
    add(sfx, fall, S["start"], 0.09)
    add(sfx, mixs(thump(60, 0.4), bandnoise(0.15, 200, 2000) * np.exp(-tt(0.15) * 25) * 0.5), g, 0.5)
    wind_len = S["start"] + S["dur"] - T(5, 1)
    w = bandnoise(wind_len, 150, 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * tt(wind_len)))
    add(sfx, w * np.minimum(1, tt(wind_len) / 1.0), T(5, 1), 0.08)
    # 6 ice-age wind
    S = tl[6]
    w = bandnoise(S["dur"], 200, 900) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.25 * tt(S["dur"])))
    add(sfx, w, S["start"], 0.10)
    # 7 volcano rumble + boom + crackle
    S = tl[7]
    et = S["start"] + erupt_time(S)
    rum = bandnoise(S["dur"], 30, 120)
    rum *= np.linspace(0.3, 1.0, len(rum))
    add(sfx, rum, S["start"], 0.22)
    add(sfx, thump(40, 1.2) + bandnoise(1.2, 40, 600) * np.exp(-tt(1.2) * 3), et, 0.8)
    for _ in range(40):
        add(sfx, bandnoise(0.02, 2000, 8000), et + br.uniform(0.2, S["start"] + S["dur"] - et), 0.08)
    # 8 rift crack + 9 collisions
    add(sfx, mixs(bandnoise(0.3, 1000, 6000) * np.exp(-tt(0.3) * 12), thump(50, 0.5)), T(8, 0, 1.2), 0.4)
    add(sfx, bandnoise(tl[8]["te"][0] - tl[8]["ts"][0], 30, 90), T(8, 0), 0.12)
    for t_hit in (T(9, 0, 0.2, end=True), T(9, 1, 0.4, end=True)):
        add(sfx, mixs(bandnoise(0.9, 30, 200) * np.exp(-tt(0.9) * 4), thump(38, 0.8)), t_hit - 0.1, 0.5)
    # 10 asteroid: rising whoosh, impact, rumble
    S = tl[10]
    a0, it = T(10, 1, 0.2), S["start"] + impact_time(S)
    ln = it - a0
    if ln > 0.1:
        s = bandnoise(ln, 300, 6000) * np.linspace(0.05, 1, int(ln * SR)) ** 2
        add(sfx, s, a0, 0.25)
    add(sfx, sweep(90, 28, 2.2) * np.exp(-tt(2.2) * 1.6) + bandnoise(2.2, 30, 1500) * np.exp(-tt(2.2) * 2.5) * 0.6,
        it, 0.9)
    # 11 card dings + strata thud
    for t_d in (T(11, 0, 1.2), T(11, 1), T(11, 2)):
        add(sfx, tone(1568, 0.5, (1, 0.3), 8), t_d, 0.08)
    add(sfx, thump(55, 0.5), T(11, 3, -0.2 + 0.7), 0.4)
    # 13 pop
    add(sfx, tone(1200, 0.25, (1, 0.3), 14), tl[13]["start"] + 0.05, 0.15)

    mix = out + music * 0.8 + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.92
    f = int(0.6 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    return mix


# ======================================================================================
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "100m_years_story.mp4"))
    ap.add_argument("--preview", help="comma separated times: save PNG stills only")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    ap.add_argument("--tts", choices=["elevenlabs", "none"],
                    default="elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "none")
    ap.add_argument("--narrator", default=NARRATOR, help="ElevenLabs voice ID for the narrator")
    args = ap.parse_args()
    install()

    lines = [l["text"] for sc in SCENES for l in sc["lines"]]
    voices = None
    if args.tts == "elevenlabs":
        voices = base.synth_voice_elevenlabs(lines, os.path.join(HERE, ".tts_cache"), args.narrator)
        if voices is None:
            sys.exit("ElevenLabs narration failed (see message above).")
    tl, caps, voice_at, total = build_timeline(voices)
    base.init_worker(tl, caps, total)
    print(f"Video length: {total:.1f}s")
    for i, s in enumerate(tl):
        print(f"  scene {i:2d}  {s['start']:6.2f}s  ({s['dur']:.2f}s)  {SCENES[i]['fn'].__name__}")

    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for x in args.preview.split(","):
            p = os.path.join(HERE, "preview", f"100m_{float(x):06.2f}.png")
            base.render_frame(float(x)).save(p)
            print("saved", p)
        return

    wav = os.path.splitext(args.out)[0] + "_audio.wav"
    base.write_wav(wav, build_audio(voices, voice_at, total, tl))
    nfr = int(total * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000",
           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", args.out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    base.static_frame()
    t0 = time.time()
    with mp.get_context("fork").Pool(args.workers, initializer=base.init_worker, initargs=(tl, caps, total)) as pool:
        for i, buf in enumerate(pool.imap(base.render_bytes, range(nfr), chunksize=6)):
            ff.stdin.write(buf)
            if i % 600 == 0:
                print(f"  frame {i}/{nfr}  ({time.time() - t0:.0f}s)", flush=True)
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    print(f"Done -> {args.out}")


if __name__ == "__main__":
    main()
