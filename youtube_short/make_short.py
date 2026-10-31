#!/usr/bin/env python3
"""
YouTube Short generator
"What if you were the most attractive man in the world for 24 hours?"

Renders a vertical 1080x1920 / 30 fps MP4 (~60 s) with:
  * a hook intro, a 3-2-1 countdown and a live 24-hour countdown clock (HUD)
  * 9 animated story scenes (morning -> night), each with its own visuals
  * a dramatic final 10..1 countdown, "time's up" twist, lesson and call-to-action
  * a fully synthesized soundtrack (beat, bass, pads, ticks, whooshes, SFX)

Requirements: Python 3.9+, Pillow, numpy and ffmpeg on PATH.

Usage:
  python make_short.py                      # render youtube_short/attractive_24h_short.mp4
  python make_short.py --out my.mp4
  python make_short.py --preview 1,12,45    # only save PNG stills at those seconds
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
import wave

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
SR = 44100

# --------------------------------------------------------------------------------------
# Timeline (seconds)
# --------------------------------------------------------------------------------------
T_HOOK_END = 3.6          # title hook
T_GO = 6.6                # 3-2-1 countdown runs from T_HOOK_END to T_GO
T_STORY = 7.2             # 24h clock starts
SCENE_DUR = 4.2
T_FINAL = 43.8            # final 10..1 countdown
NUM_DUR = 0.65
T_UP = T_FINAL + 10 * NUM_DUR   # 50.3 time's up
T_MORAL = 53.3
T_CTA = 56.3
T_END = 59.5

WHITE = (255, 255, 255)
GOLD = (255, 205, 60)
PINK = (255, 80, 150)
RED = (255, 55, 70)
GREEN = (90, 255, 140)
CYAN = (90, 220, 255)
BLACK = (0, 0, 0)

# --------------------------------------------------------------------------------------
# Fonts / emoji
# --------------------------------------------------------------------------------------
FONT_CANDIDATES = {
    "black": ["/usr/share/fonts/opentype/inter/Inter-Black.otf",
              "C:/Windows/Fonts/ariblk.ttf",
              "/System/Library/Fonts/Supplemental/Arial Black.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
    "bold": ["/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf",
             "C:/Windows/Fonts/arialbd.ttf",
             "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
    "semi": ["/usr/share/fonts/opentype/inter/Inter-SemiBold.otf",
             "C:/Windows/Fonts/arial.ttf",
             "/System/Library/Fonts/Supplemental/Arial.ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
}
EMOJI_CANDIDATES = [("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109),
                    ("C:/Windows/Fonts/seguiemj.ttf", 109),
                    ("/System/Library/Fonts/Apple Color Emoji.ttc", 160)]


@functools.lru_cache(maxsize=None)
def font(kind, size):
    for path in FONT_CANDIDATES[kind]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


@functools.lru_cache(maxsize=None)
def emoji_font():
    for path, size in EMOJI_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return None


@functools.lru_cache(maxsize=None)
def emoji(ch):
    """Colour emoji rendered to a ~128px tall RGBA sprite (falls back to a gold dot)."""
    ch = ch.replace("\ufe0f", "")
    f = emoji_font()
    if f is not None:
        im = Image.new("RGBA", (260, 260), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((30, 30), ch, font=f, embedded_color=True)
        bb = im.getbbox()
        if bb:
            im = im.crop(bb)
            s = 128 / im.height
            return im.resize((max(1, int(im.width * s)), 128), Image.LANCZOS)
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse((8, 8, 120, 120), fill=GOLD + (255,))
    return im


@functools.lru_cache(maxsize=512)
def emoji_sized(ch, h):
    e = emoji(ch)
    return e.resize((max(1, int(e.width * h / e.height)), max(1, h)), Image.LANCZOS)


# --------------------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------------------
def clamp01(x):
    return 0.0 if x < 0 else 1.0 if x > 1 else x


def prog(t, a, b):
    return clamp01((t - a) / (b - a))


def ease_out_cubic(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = clamp01(x)
    return 3 * x * x - 2 * x * x * x


def ease_out_back(x, s=1.9):
    x = clamp01(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def lerp(a, b, k):
    return a + (b - a) * k


def lerp_col(a, b, k):
    return tuple(int(lerp(x, y, k)) for x, y in zip(a, b))


def paste(dst, spr, x, y):
    """Alpha-blend sprite onto dst at integer (x, y), clipping to bounds."""
    x, y = int(round(x)), int(round(y))
    dw, dh = dst.size
    w, h = spr.size
    x0, y0, x1, y1 = max(0, x), max(0, y), min(dw, x + w), min(dh, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    box = (x0 - x, y0 - y, x1 - x, y1 - y)
    if dst.mode == "RGBA":
        dst.alpha_composite(spr, dest=(x0, y0), source=box)
    else:
        piece = spr.crop(box)
        dst.paste(piece, (x0, y0), piece)


def _scaled(spr, s):
    return spr.resize((max(1, int(spr.width * s)), max(1, int(spr.height * s))), Image.BILINEAR)


def with_alpha(spr, a):
    if a >= 0.999:
        return spr
    out = spr.copy()
    out.putalpha(spr.getchannel("A").point(lambda v: int(v * a)))
    return out


def place(dst, spr, cx, cy, scale=1.0, rot=0.0, alpha=1.0, flip=False):
    """Draw sprite centred at (cx, cy) with scale / rotation / opacity."""
    if scale <= 0.01 or alpha <= 0.01:
        return
    s = spr
    if flip:
        s = s.transpose(Image.FLIP_LEFT_RIGHT)
    if abs(scale - 1) > 0.004:
        s = _scaled(s, scale)
    if abs(rot) > 0.05:
        s = s.rotate(rot, resample=Image.BICUBIC, expand=True)
    s = with_alpha(s, alpha)
    paste(dst, s, cx - s.width / 2, cy - s.height / 2)


def pop(lt, t0, dur=0.38):
    """Pop-in animation -> (scale, alpha)."""
    x = lt - t0
    if x <= 0:
        return 0.0, 0.0
    return 0.35 + 0.65 * ease_out_back(x / dur), clamp01(x / 0.14)


def glow(spr, radius, color, strength=1.0):
    pad = int(radius * 2)
    big = Image.new("L", (spr.width + 2 * pad, spr.height + 2 * pad), 0)
    big.paste(spr.getchannel("A"), (pad, pad))
    small = big.resize((max(1, big.width // 4), max(1, big.height // 4)), Image.BILINEAR)
    small = small.filter(ImageFilter.GaussianBlur(max(1, radius / 4)))
    m = small.resize(big.size, Image.BILINEAR)
    if strength != 1:
        m = m.point(lambda v: min(255, int(v * strength)))
    out = Image.new("RGBA", big.size, color + (0,))
    out.putalpha(m)
    out.alpha_composite(spr, (pad, pad))
    return out


# --------------------------------------------------------------------------------------
# Text rendering with markup:  *highlight*   {emoji}
# --------------------------------------------------------------------------------------
def parse_markup(s):
    words, cur, buf, hl = [], [], [], False
    i = 0
    while i < len(s):
        ch = s[i]
        if ch == "*":
            if buf:
                cur.append(("t", "".join(buf), hl)); buf = []
            hl = not hl
        elif ch == "{":
            if buf:
                cur.append(("t", "".join(buf), hl)); buf = []
            j = s.index("}", i)
            cur.append(("e", s[i + 1:j], hl))
            i = j
        elif ch == " ":
            if buf:
                cur.append(("t", "".join(buf), hl)); buf = []
            if cur:
                words.append(cur); cur = []
        else:
            buf.append(ch)
        i += 1
    if buf:
        cur.append(("t", "".join(buf), hl))
    if cur:
        words.append(cur)
    return words


@functools.lru_cache(maxsize=1024)
def text_sprite(markup, size, color=WHITE, hl=GOLD, kind="black", stroke=-1,
                shadow=True, maxw=920, align="center", glow_col=None):
    f = font(kind, size)
    sw = int(size * 0.085) if stroke < 0 else stroke
    words = parse_markup(markup)
    space = f.getlength(" ")
    esz = int(size * 0.92)

    def seg_w(seg):
        return emoji_sized(seg[1], esz).width + size * 0.06 if seg[0] == "e" else f.getlength(seg[1])

    lines, line, lw = [], [], 0.0
    for wd in words:
        ww = sum(seg_w(s) for s in wd)
        add = ww if not line else lw + space + ww
        if line and add > maxw:
            lines.append((line, lw)); line, lw = [wd], ww
        else:
            line.append(wd); lw = add
    if line:
        lines.append((line, lw))

    asc, desc = f.getmetrics()
    lh = int((asc + desc) * 0.98)
    P = int(size * 0.18) + sw
    maxl = max(l[1] for l in lines)
    im = Image.new("RGBA", (int(maxl + 2 * P), int(lh * len(lines) + 2 * P)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    y = P
    for line, lwid in lines:
        x = P + ((maxl - lwid) / 2 if align == "center" else 0)
        for wd in line:
            for seg in wd:
                if seg[0] == "e":
                    e = emoji_sized(seg[1], esz)
                    paste(im, e, x + size * 0.03, y + asc * 0.58 - e.height / 2 + size * 0.06)
                    x += seg_w(seg)
                else:
                    d.text((x, y), seg[1], font=f, fill=(hl if seg[2] else color),
                           stroke_width=sw, stroke_fill=BLACK)
                    x += f.getlength(seg[1])
            x += space
        y += lh
    if glow_col:
        im = glow(im, size * 0.18, glow_col, 1.1)
    if shadow:
        off = int(size * 0.06) + 2
        a = im.getchannel("A").filter(ImageFilter.GaussianBlur(size * 0.05 + 2)).point(lambda v: int(v * 0.65))
        out = Image.new("RGBA", (im.width, im.height + off), (0, 0, 0, 0))
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        sh.putalpha(a)
        out.alpha_composite(sh, (0, off))
        out.alpha_composite(im, (0, 0))
        im = out
    return im


@functools.lru_cache(maxsize=256)
def sub_sprite(markup, size=52):
    """Subtitle in a dark translucent pill."""
    t = text_sprite(markup, size, WHITE, GOLD, "bold", stroke=int(size * 0.06), shadow=False, maxw=820)
    pw, ph = t.width + 24, t.height + 4
    S = 2
    pill = Image.new("RGBA", (pw * S, ph * S), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle((0, 0, pw * S - 1, ph * S - 1), radius=int(min(ph, 70) * S * 0.5),
                                           fill=(8, 6, 20, 165), outline=(255, 255, 255, 50), width=3 * S)
    pill = pill.resize((pw, ph), Image.LANCZOS)
    pill.alpha_composite(t, (12, 2))
    return pill


@functools.lru_cache(maxsize=256)
def glyph(ch, size, color, glow_col):
    f = font("black", size)
    sw = int(size * 0.06)
    bb = f.getbbox("0", stroke_width=sw)
    cell = bb[2] - bb[0] + 4 if ch.isdigit() else int((bb[2] - bb[0]) * 0.45)
    hgt = bb[3] + sw + 6
    im = Image.new("RGBA", (cell, hgt), (0, 0, 0, 0))
    gw = f.getlength(ch)
    ImageDraw.Draw(im).text(((cell - gw) / 2, 0), ch, font=f, fill=color, stroke_width=sw, stroke_fill=BLACK)
    return im


def mono_sprite(text, size, color, glow_col=None):
    gl = [glyph(c, size, color, glow_col) for c in text]
    im = Image.new("RGBA", (sum(g.width for g in gl), max(g.height for g in gl)), (0, 0, 0, 0))
    x = 0
    for g in gl:
        im.alpha_composite(g, (x, 0)); x += g.width
    if glow_col:
        im = glow(im, size * 0.16, glow_col, 0.9)
    return im


# --------------------------------------------------------------------------------------
# Sprites (built once per process)
# --------------------------------------------------------------------------------------
def make_hero(variant):
    S, Wd, Hd = 3, 600, 800
    im = Image.new("RGBA", (Wd * S, Hd * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    P = lambda pts: [(x * S, y * S) for x, y in pts]
    B = lambda x0, y0, x1, y1: [x0 * S, y0 * S, x1 * S, y1 * S]
    cool = variant == "cool"
    skin = (238, 184, 142) if cool else (224, 174, 138)
    skin_sh = (206, 146, 108)
    hair = (38, 24, 18) if cool else (82, 58, 42)

    if cool:
        suit, lapel = (22, 26, 54), (40, 48, 92)
        d.ellipse(B(40, 545, 560, 1150), fill=suit)
        d.rounded_rectangle(B(252, 430, 348, 580), radius=30 * S, fill=skin_sh)
        d.polygon(P([(236, 548), (364, 548), (300, 705)]), fill=(246, 246, 252))
        d.polygon(P([(286, 566), (314, 566), (324, 660), (300, 712), (276, 660)]), fill=(255, 196, 40))
        d.polygon(P([(282, 552), (318, 552), (312, 578), (288, 578)]), fill=(225, 160, 20))
        d.polygon(P([(186, 562), (236, 548), (300, 712), (228, 644)]), fill=lapel)
        d.polygon(P([(414, 562), (364, 548), (300, 712), (372, 644)]), fill=lapel)
        d.polygon(P([(394, 650), (446, 638), (442, 660), (396, 668)]), fill=(255, 196, 40))
        for yy in (735, 785):
            d.ellipse(B(292, yy, 308, yy + 16), fill=(200, 170, 80))
    else:
        hood = (118, 124, 142)
        d.ellipse(B(50, 552, 550, 1150), fill=hood)
        d.rounded_rectangle(B(252, 430, 348, 580), radius=30 * S, fill=skin_sh)
        d.ellipse(B(212, 520, 388, 604), fill=(92, 96, 112))
        d.ellipse(B(236, 528, 364, 586), fill=skin_sh)
        d.line(P([(268, 596), (260, 700)]), fill=(235, 235, 240), width=6 * S)
        d.line(P([(332, 596), (340, 700)]), fill=(235, 235, 240), width=6 * S)
        d.rounded_rectangle(B(210, 720, 390, 800), radius=20 * S, fill=(104, 110, 128))

    d.ellipse(B(180, 150, 420, 340), fill=hair)                  # back hair
    d.ellipse(B(174, 300, 214, 374), fill=skin_sh)               # ears
    d.ellipse(B(386, 300, 426, 374), fill=skin_sh)
    d.ellipse(B(196, 190, 404, 440), fill=skin)                  # face
    d.rounded_rectangle(B(204, 300, 396, 472), radius=85 * S, fill=skin)
    if cool:
        d.polygon(P([(192, 292), (196, 215), (232, 165), (300, 140), (372, 152), (410, 200), (410, 292),
                     (392, 238), (330, 214), (250, 224), (212, 252)]), fill=hair)
        d.polygon(P([(222, 196), (262, 118), (350, 94), (420, 124), (436, 182), (394, 170), (330, 160),
                     (268, 188)]), fill=hair)
        d.line(P([(270, 150), (338, 118), (404, 134)]), fill=(96, 66, 46), width=7 * S, joint="curve")
        d.line(P([(196, 300), (198, 330)]), fill=hair, width=10 * S)
        d.line(P([(404, 300), (402, 330)]), fill=hair, width=10 * S)
    else:
        d.polygon(P([(190, 290), (186, 200), (210, 220), (214, 160), (246, 190), (262, 130), (292, 176),
                     (316, 120), (338, 172), (370, 132), (378, 190), (412, 168), (406, 224), (420, 228),
                     (410, 290), (392, 244), (340, 226), (270, 234), (214, 254)]), fill=hair)
    d.polygon(P([(222, 292), (282, 282), (284, 296), (224, 306)]), fill=hair)    # brows
    d.polygon(P([(378, 292), (318, 282), (316, 296), (376, 306)]), fill=hair)
    if cool:
        g = (14, 14, 24)
        d.rounded_rectangle(B(210, 306, 294, 360), radius=20 * S, fill=g)
        d.rounded_rectangle(B(306, 306, 390, 360), radius=20 * S, fill=g)
        d.rectangle(B(290, 316, 310, 326), fill=g)
        d.line(P([(212, 318), (184, 312)]), fill=g, width=7 * S)
        d.line(P([(388, 318), (416, 312)]), fill=g, width=7 * S)
        d.polygon(P([(224, 352), (246, 312), (262, 312), (240, 352)]), fill=(70, 74, 110))
        d.polygon(P([(320, 352), (342, 312), (358, 312), (336, 352)]), fill=(70, 74, 110))
    else:
        for ex in (252, 348):
            d.ellipse(B(ex - 21, 316, ex + 21, 352), fill=WHITE)
            d.ellipse(B(ex - 11, 322, ex + 9, 346), fill=(52, 36, 30))
            d.ellipse(B(ex - 5, 326, ex + 1, 332), fill=WHITE)
    d.line(P([(302, 346), (292, 394), (310, 398)]), fill=skin_sh, width=5 * S, joint="curve")
    if cool:
        d.chord(B(258, 400, 344, 446), 0, 180, fill=WHITE, outline=(140, 70, 60), width=4 * S)
        d.line(P([(256, 414), (264, 410)]), fill=(140, 70, 60), width=4 * S)
    else:
        d.arc(B(270, 408, 330, 432), 20, 160, fill=(140, 70, 60), width=5 * S)
    return im.resize((Wd, Hd), Image.LANCZOS)


def make_sparkle(size, color):
    S = 4
    s = size * S
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    c, w = s / 2, s * 0.11
    ImageDraw.Draw(im).polygon([(c, 0), (c + w, c - w), (s, c), (c + w, c + w), (c, s), (c - w, c + w),
                                (0, c), (c - w, c - w)], fill=color + (255,))
    im = im.resize((size, size), Image.LANCZOS)
    return glow(im, size * 0.25, color, 1.2)


def make_rays(n=18, size=640):
    S = 2
    s = size * S
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s / 2
    for i in range(n):
        a0 = (i / n) * 2 * math.pi
        a1 = a0 + math.pi / n * 0.9
        d.polygon([(c, c), (c + math.cos(a0) * s, c + math.sin(a0) * s),
                   (c + math.cos(a1) * s, c + math.sin(a1) * s)], fill=(255, 220, 120, 255))
    im = im.resize((size, size), Image.LANCZOS)
    yy, xx = np.mgrid[0:size, 0:size]
    r = np.hypot(xx - size / 2, yy - size / 2) / (size / 2)
    fall = np.clip(1 - r, 0, 1) ** 1.6 * 0.55
    a = (np.asarray(im.getchannel("A"), dtype=np.float32) * fall).astype(np.uint8)
    im.putalpha(Image.fromarray(a))
    return im


def make_starburst(size=360):
    yy, xx = np.mgrid[0:size, 0:size]
    dx, dy = xx - size / 2, yy - size / 2
    r = np.hypot(dx, dy) / (size / 2)
    ang = np.arctan2(dy, dx)
    core = np.exp(-(r / 0.28) ** 2)
    spikes = np.exp(-(r / 0.95) ** 2) * (np.abs(np.cos(ang * 2)) ** 40 + np.abs(np.cos(ang * 2 + math.pi / 4)) ** 60 * 0.5)
    a = np.clip(core + spikes, 0, 1) * 255
    im = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    im.putalpha(Image.fromarray(a.astype(np.uint8)))
    return im


def make_person(color):
    S = 3
    w, h = 200, 300
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((60 * S, 20 * S, 140 * S, 110 * S), fill=color)
    d.ellipse((10 * S, 120 * S, 190 * S, 420 * S), fill=color)
    d.rounded_rectangle((80 * S, 95 * S, 120 * S, 140 * S), radius=10 * S, fill=color)
    return im.resize((w, h), Image.LANCZOS)


def make_mirror():
    S = 3
    w, h = 620, 760
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((20 * S, 20 * S, (w - 20) * S, (h - 20) * S), fill=(255, 200, 70, 255))
    d.ellipse((34 * S, 34 * S, (w - 34) * S, (h - 34) * S), fill=(230, 150, 30, 255))
    d.ellipse((46 * S, 46 * S, (w - 46) * S, (h - 46) * S), fill=(170, 215, 255, 80))
    for k in range(10):
        a = k / 10 * 2 * math.pi
        x = w / 2 + math.cos(a) * (w / 2 - 33)
        y = h / 2 + math.sin(a) * (h / 2 - 33)
        d.ellipse(((x - 9) * S, (y - 9) * S, (x + 9) * S, (y + 9) * S), fill=(255, 245, 200, 255))
    im = im.resize((w, h), Image.LANCZOS)
    mask = Image.new("L", (w * S, h * S), 0)
    ImageDraw.Draw(mask).ellipse((46 * S, 46 * S, (w - 46) * S, (h - 46) * S), fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    return glow(im, 30, GOLD, 0.8), mask


def make_phone():
    S = 2
    w, h = 440, 800
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w * S - 1, h * S - 1), radius=64 * S, fill=(20, 20, 30, 255),
                        outline=(150, 150, 175, 255), width=5 * S)
    d.rounded_rectangle((170 * S, 26 * S, 270 * S, 52 * S), radius=13 * S, fill=(5, 5, 8, 255))
    im = im.resize((w, h), Image.LANCZOS)
    sw, sh = 400, 740
    yy = np.linspace(0, 1, sh)[:, None]
    top, bot = np.array([60, 30, 140]), np.array([255, 70, 140])
    arr = (top * (1 - yy) + bot * yy)[:, None, :].repeat(sw, axis=1)
    screen = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")
    m = Image.new("L", (sw * S, sh * S), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, sw * S - 1, sh * S - 1), radius=46 * S, fill=255)
    return glow(im, 26, PINK, 0.9), screen, m.resize((sw, sh), Image.LANCZOS)


def make_card(emo, title, line):
    S = 2
    w, h = 360, 118
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, w * S - 1, h * S - 1), radius=26 * S, fill=(255, 255, 255, 238))
    im = im.resize((w, h), Image.LANCZOS)
    paste(im, emoji_sized(emo, 64), 18, 27)
    d = ImageDraw.Draw(im)
    d.text((98, 22), title, font=font("black", 26), fill=(25, 20, 40))
    d.text((98, 62), line, font=font("semi", 23), fill=(100, 95, 120))
    return im


CARDS = [("😍", "Instagram", "+48,201 new followers"), ("❤", "Likes", "Your selfie: 2.3M likes"),
         ("💌", "New DM", "\"marry me??\""), ("🔥", "TikTok", "You're #1 trending"),
         ("📞", "Unknown", "34 missed calls"), ("💍", "New DM", "\"i'm in love\""),
         ("🎬", "Hollywood", "Movie role offer"), ("😳", "Mom", "why is ur face on TV"),
         ("🌹", "New DM", "\"hi gorgeous\""), ("📸", "Vogue", "Cover shoot tomorrow?"),
         ("💯", "Twitter", "\"most beautiful man\""), ("👑", "Royal Mail", "Prince invite"),
         ("😍", "Instagram", "+91,770 new followers")]


def make_receipt():
    w, h = 500, 640
    im = Image.new("RGBA", (w, h + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pts = [(0, 0), (w, 0), (w, h)]
    for k in range(20, -1, -1):
        pts.append((k * w / 20, h + (24 if k % 2 else 0)))
    d.polygon(pts, fill=(250, 248, 240, 255))
    ink = (40, 36, 50)
    d.text((w / 2, 46), "CHEZ LUXE", font=font("black", 46), fill=ink, anchor="mm")
    d.text((w / 2, 92), "Table 1  ·  VIP", font=font("semi", 26), fill=(120, 115, 130), anchor="mm")
    items = [("Wagyu steak", "$189"), ("Lobster x2", "$240"), ("Champagne", "$420"), ("Gold dessert", "$95")]
    y = 150
    for name, price in items:
        d.text((40, y), name, font=font("semi", 32), fill=ink)
        d.text((w - 40, y), price, font=font("bold", 32), fill=ink, anchor="ra")
        y += 62
    for x in range(40, w - 40, 18):
        d.line((x, y + 10, x + 9, y + 10), fill=(150, 145, 160), width=3)
    d.text((40, y + 40), "TOTAL", font=font("black", 44), fill=ink)
    d.text((w - 40, y + 40), "$0.00", font=font("black", 50), fill=(220, 30, 60), anchor="ra")
    d.text((w / 2, y + 140), "\"on the house, sir\"", font=font("semi", 28), fill=(120, 115, 130), anchor="mm")
    return glow(im, 22, (0, 0, 0), 0.6)


def make_stamp():
    S = 2
    w, h = 470, 210
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    col = (235, 30, 60, 235)
    d.rounded_rectangle((6 * S, 6 * S, (w - 6) * S, (h - 6) * S), radius=30 * S, outline=col, width=16 * S)
    d.text((w / 2 * S, h / 2 * S + 6 * S), "FREE", font=font("black", 150 * S), fill=col, anchor="mm")
    return im.resize((w, h), Image.LANCZOS)


def make_skyline():
    rng = random.Random(7)
    w, h = 1080, 560
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = -20
    while x < w:
        bw = rng.randint(90, 170)
        bh = rng.randint(220, 540)
        shade = rng.randint(18, 36)
        d.rectangle((x, h - bh, x + bw, h), fill=(shade, shade - 6, shade + 30, 255))
        for wy in range(h - bh + 24, h - 30, 38):
            for wx in range(x + 14, x + bw - 20, 30):
                if rng.random() < 0.55:
                    c = (255, 220, 120, 255) if rng.random() < 0.8 else (255, 140, 190, 255)
                    d.rectangle((wx, wy, wx + 14, wy + 20), fill=c)
        x += bw + rng.randint(-10, 8)
    return im


def make_spotlight():
    w, h = 1080, 1000
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = yy / h
    hw = 70 + 330 * v
    a = np.clip(1 - np.abs(xx - w / 2) / hw, 0, 1) ** 0.7 * (0.12 + 0.28 * v)
    im = Image.new("RGBA", (w, h), (210, 225, 255, 0))
    im.putalpha(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14)))
    return im


def make_clockface(size=620):
    S = 2
    s = size * S
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, s - 1, s - 1), fill=(255, 200, 60, 255))
    d.ellipse((24 * S, 24 * S, s - 24 * S, s - 24 * S), fill=(252, 250, 244, 255))
    c = s / 2
    for k in range(60):
        a = k / 60 * 2 * math.pi
        r0 = c - 40 * S if k % 5 == 0 else c - 34 * S
        r1 = c - 70 * S if k % 5 == 0 else c - 46 * S
        d.line((c + math.cos(a) * r0, c + math.sin(a) * r0, c + math.cos(a) * r1, c + math.sin(a) * r1),
               fill=(30, 26, 46, 255), width=(9 if k % 5 == 0 else 4) * S)
    for num, k in (("12", -90), ("3", 0), ("6", 90), ("9", 180)):
        a = math.radians(k)
        d.text((c + math.cos(a) * (c - 120 * S), c + math.sin(a) * (c - 120 * S)), num,
               font=font("black", 64 * S), fill=(30, 26, 46, 255), anchor="mm")
    return glow(im.resize((size, size), Image.LANCZOS), 30, RED, 1.0)


def make_button():
    S = 2
    w, h = 560, 140
    im = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w * S - 1, h * S - 1), radius=70 * S, fill=(235, 25, 40, 255))
    d.text((w * S / 2 - 30 * S, h * S / 2 + 4 * S), "SUBSCRIBE", font=font("black", 64 * S), fill=WHITE, anchor="mm")
    im = im.resize((w, h), Image.LANCZOS)
    paste(im, emoji_sized("🔔", 70), w - 108, 34)
    return glow(im, 24, RED, 1.0)


class Assets:
    def __init__(self):
        self.hero = {v: make_hero(v) for v in ("cool", "normal")}
        self.hero_glow = glow(self.hero["cool"], 22, GOLD, 0.9)
        self.hero_sad = glow(self.hero["cool"], 18, (120, 160, 255), 0.6)
        self.hero_norm = glow(self.hero["normal"], 14, WHITE, 0.5)
        self.sparkles = [make_sparkle(s, c) for s in (16, 26, 40) for c in (GOLD, WHITE, PINK)]
        self.big_sparkle = make_sparkle(90, WHITE)
        self.rays = make_rays()
        self.burst = make_starburst()
        self.people = [make_person((34, 20, 66, 255)), make_person((54, 30, 92, 255))]
        self.mirror, self.mirror_mask = make_mirror()
        self.phone, self.screen, self.screen_mask = make_phone()
        self.cards = [make_card(*c) for c in CARDS]
        self.receipt = make_receipt()
        self.stamp = make_stamp()
        self.skyline = make_skyline()
        self.spot = make_spotlight()
        self.clockface = make_clockface()
        self.button = make_button()
        # HUD panel
        S = 2
        pw, ph = 900, 270
        pan = Image.new("RGBA", (pw * S, ph * S), (0, 0, 0, 0))
        ImageDraw.Draw(pan).rounded_rectangle((0, 0, pw * S - 1, ph * S - 1), radius=44 * S,
                                              fill=(8, 6, 22, 165), outline=(255, 255, 255, 60), width=3 * S)
        self.panel = pan.resize((pw, ph), Image.LANCZOS)
        # background helpers (half resolution)
        hw, hh = W // 2, H // 2
        yy, xx = np.mgrid[0:hh, 0:hw].astype(np.float32)
        self.g = (yy / hh)[:, :, None]
        self.radial = np.exp(-((xx - hw / 2) ** 2 + (yy - hh * 0.45) ** 2) / (2 * (hw * 0.55) ** 2))[:, :, None]
        d = np.hypot((xx - hw / 2) / (hw / 2), (yy - hh / 2) / (hh / 2))
        self.vign = np.clip(1 - 0.42 * np.clip(d - 0.35, 0, None) ** 1.5, 0, 1)[:, :, None]
        rng = random.Random(3)
        self.particles = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(40, 140), rng.randrange(9),
                           rng.uniform(0, 6.28), rng.uniform(1.5, 4)) for _ in range(46)]


_ASSETS = None


def A():
    global _ASSETS
    if _ASSETS is None:
        _ASSETS = Assets()
    return _ASSETS


# --------------------------------------------------------------------------------------
# Story data
# --------------------------------------------------------------------------------------
SCENES = [
    dict(left=86400, head="YOU WAKE UP *GORGEOUS*", sub="even your mirror needs a minute {😳}", vis="mirror"),
    dict(left=82800, head="*9,999+* NOTIFICATIONS", sub="your phone is literally overheating {🔥}", vis="phone"),
    dict(left=75600, head="STRANGERS *FOLLOW* YOU", sub="a whole crowd walks you to get coffee {☕}", vis="crowd"),
    dict(left=68400, head="EVERYTHING IS *FREE*", sub="no restaurant will take your money {🍔}", vis="free"),
    dict(left=57600, head="*PAPARAZZI* EVERYWHERE", sub="1,000 camera flashes per second {📸}", vis="paparazzi"),
    dict(left=46800, head=None, sub="every brand on Earth wants your face {💸}", vis="money"),
    dict(left=36000, head="THE CITY *STOPS*", sub="traffic jams because everyone is staring {🚗}", vis="city"),
    dict(left=18000, head="BUT THEN YOU *NOTICE*...", sub="nobody asks who you *really* are {💔}", vis="lonely"),
    dict(left=13, head="THE CLOCK IS *RUNNING OUT*", sub="{⏳} only seconds left...", vis="clock"),
]
for _i, _s in enumerate(SCENES):
    _s["start"] = T_STORY + _i * SCENE_DUR
    _s["dur"] = SCENE_DUR if _i < len(SCENES) - 1 else T_FINAL - _s["start"]
FF = 0.6  # fast-forward duration at the start of each scene

_r = random.Random(5)
FLASHES = sorted((0.45 + i * 0.25 + _r.uniform(-0.06, 0.06), _r.randrange(6)) for i in range(14))
CAMS = [(140, 640), (940, 620), (110, 960), (970, 980), (230, 1200), (850, 1210)]
HONKS = [(0.9, 0), (1.45, 3), (2.0, 1), (2.5, 2), (3.0, 0), (3.45, 3)]
CARS = [(120, 1170, "🚗"), (310, 1195, "🚕"), (770, 1195, "🚙"), (960, 1170, "🚓")]
CARD_T = [0.3 + k * 0.26 for k in range(len(CARDS))]
STAMP_T = 1.35
KACHING_T = 2.5


def clock_left(t):
    """Seconds left on the 24h clock at video time t."""
    if t < T_STORY:
        return 86400.0
    if t >= T_FINAL:
        n = 10 - int((t - T_FINAL) / NUM_DUR)
        return float(max(0, n))
    k = max(i for i, s in enumerate(SCENES) if t >= s["start"])
    s = SCENES[k]
    lt = t - s["start"]
    if k == 0:
        return s["left"] - lt
    p = SCENES[k - 1]
    prev_end = p["left"] - (p["dur"] - (FF if k - 1 > 0 else 0))
    if lt < FF:
        return lerp(prev_end, s["left"], ease_in_out(lt / FF))
    return s["left"] - (lt - FF)


def fmt_hms(sec):
    sec = int(math.ceil(sec - 1e-6))
    return f"{sec // 3600:02d}:{sec % 3600 // 60:02d}:{sec % 60:02d}"


def time_of_day(left):
    tod = (7 * 3600 + (86400 - left)) % 86400
    return tod


def fmt_tod(tod):
    h = int(tod // 3600)
    m = int(tod % 3600 // 60)
    ap = "AM" if h < 12 else "PM"
    h12 = h % 12 or 12
    return f"{h12}:{m:02d} {ap}"


# --------------------------------------------------------------------------------------
# Background
# --------------------------------------------------------------------------------------
PALETTE = [(0, (12, 12, 44), (48, 16, 86)), (5, (26, 18, 72), (110, 44, 124)),
           (7, (66, 26, 118), (255, 116, 96)), (10, (34, 68, 186), (96, 188, 255)),
           (14, (22, 84, 196), (70, 196, 240)), (17, (92, 38, 168), (255, 108, 132)),
           (19, (70, 20, 112), (255, 94, 62)), (21, (16, 16, 62), (96, 26, 132)), (24, (12, 12, 44), (48, 16, 86))]
HOOK_PAL = ((52, 12, 104), (255, 70, 120))


def palette(hour):
    hour %= 24
    for (h0, t0, b0), (h1, t1, b1) in zip(PALETTE, PALETTE[1:]):
        if h0 <= hour <= h1:
            k = ease_in_out((hour - h0) / (h1 - h0))
            return lerp_col(t0, t1, k), lerp_col(b0, b1, k)
    return PALETTE[0][1], PALETTE[0][2]


def bg_params(t):
    """-> top, bottom, glow colour, glow strength."""
    left = clock_left(t)
    if t < T_STORY:
        top, bot = HOOK_PAL
        return top, bot, GOLD, 0.55
    top, bot = palette(time_of_day(left) / 3600)
    g, gs = GOLD, 0.35
    s8 = SCENES[7]
    if s8["start"] <= t < s8["start"] + s8["dur"]:
        k = ease_in_out(prog(t, s8["start"], s8["start"] + 0.8))
        top, bot = lerp_col(top, (4, 6, 18), k * 0.7), lerp_col(bot, (16, 22, 60), k * 0.8)
        g, gs = (120, 160, 255), 0.25
    if SCENES[8]["start"] <= t < T_UP:
        k = ease_in_out(prog(t, SCENES[8]["start"], SCENES[8]["start"] + 0.6))
        beat = 0.5 + 0.5 * math.cos(((t - T_FINAL) % NUM_DUR) / NUM_DUR * 2 * math.pi) if t >= T_FINAL else 0.3
        top = lerp_col(top, (70, 0, 20), k)
        bot = lerp_col(bot, lerp_col((150, 10, 40), (255, 50, 70), beat), k)
        g, gs = (255, 80, 80), 0.25 + 0.35 * beat * k
    if t >= T_UP:
        top, bot = palette(7.2 + (t - T_UP) * 0.4)
        g, gs = GOLD, 0.45
    if t >= T_CTA:
        top, bot = HOOK_PAL
        g, gs = GOLD, 0.5
    return top, bot, g, gs


def background(t):
    a = A()
    top, bot, gcol, gs = bg_params(t)
    top, bot, gcol = np.array(top, np.float32), np.array(bot, np.float32), np.array(gcol, np.float32)
    arr = top * (1 - a.g) + bot * a.g
    arr = arr + a.radial * gcol * gs * (0.85 + 0.15 * math.sin(t * 3))
    arr = arr * a.vign
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return img.resize((W, H), Image.BILINEAR)


def draw_particles(c, t, amount=1.0):
    a = A()
    for x0, y0, sp, k, ph, tw in a.particles:
        y = (y0 - sp * t) % (H + 80) - 40
        x = x0 + math.sin(t * 0.8 + ph) * 30
        al = (0.35 + 0.65 * (0.5 + 0.5 * math.sin(t * tw + ph))) * amount
        place(c, a.sparkles[k], x, y, alpha=al * 0.8)


# --------------------------------------------------------------------------------------
# Shared elements
# --------------------------------------------------------------------------------------
def draw_rays(c, t, cx, cy, scale=1.6, alpha=1.0, speed=12):
    a = A()
    r = a.rays.rotate(t * speed % 360, resample=Image.BILINEAR)
    place(c, r, cx, cy, scale=scale, alpha=alpha)


def draw_hero(c, cx, cy, scale, variant="glow", alpha=1.0, rot=0.0):
    a = A()
    spr = {"glow": a.hero_glow, "sad": a.hero_sad, "normal": a.hero_norm}[variant]
    place(c, spr, cx, cy, scale=scale, alpha=alpha, rot=rot)


def draw_captions(c, lt, head, sub, y=1250, t_head=0.2, t_sub=0.6):
    """Headline + subtitle stack with pop-in."""
    yb = y
    if head:
        hs = text_sprite(head, 98, WHITE, GOLD, maxw=900)
        sc, al = pop(lt, t_head)
        place(c, hs, W / 2, yb + hs.height / 2, scale=sc, alpha=al)
        yb += hs.height - 6
    if sub:
        ss = sub_sprite(sub)
        sc, al = pop(lt, t_sub, 0.3)
        place(c, ss, W / 2, yb + ss.height / 2 + 8, scale=sc, alpha=al)


def ring(c, cx, cy, r, width, frac, color, bg=(255, 255, 255, 45)):
    S = 2
    size = int((r + width) * 2 * S) + 8
    lay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    o = size / 2 - r * S
    box = (o, o, size - o, size - o)
    d.arc(box, 0, 360, fill=bg, width=width * S)
    if frac > 0.001:
        d.arc(box, -90, -90 + 360 * frac, fill=color + (255,), width=width * S)
    lay = lay.resize((size // S, size // S), Image.LANCZOS)
    paste(c, lay, cx - lay.width / 2, cy - lay.height / 2)


def draw_hud(c, t):
    a = A()
    fade = prog(t, T_STORY - 0.25, T_STORY + 0.2) * (1 - prog(t, T_MORAL - 0.35, T_MORAL))
    if fade <= 0:
        return
    left = clock_left(t)
    lay = a.panel.copy()
    red = left <= 3600
    col = RED if red else GOLD
    if t >= T_UP:
        col = RED if int((t - T_UP) * 4) % 2 == 0 else WHITE
    paste(lay, text_sprite("{⏳} TIME LEFT", 38, WHITE, GOLD, "bold", stroke=0, shadow=False), 28, 14)
    tod = time_of_day(left)
    icon = "☀" if 6 <= tod / 3600 < 19 else "🌙"
    ts = text_sprite("{%s} %s" % (icon, fmt_tod(tod)), 38, WHITE, GOLD, "bold", stroke=0, shadow=False)
    paste(lay, ts, 900 - 28 - ts.width, 14)
    digits = mono_sprite(fmt_hms(left), 132, col, glow_col=col)
    # fast-forward wobble
    ff = 0.0
    k = [i for i, s in enumerate(SCENES) if s["start"] <= t]
    if k and k[-1] > 0 and t < T_FINAL:
        lt = t - SCENES[k[-1]]["start"]
        ff = math.sin(prog(lt, 0, FF) * math.pi)
    sc = 1 + 0.06 * ff
    if T_FINAL <= t < T_UP:
        sc = 1 + 0.12 * (1 - ease_out_cubic(((t - T_FINAL) % NUM_DUR) / 0.25))
    place(lay, digits, 450, 140, scale=sc)
    if ff > 0.05:
        badge = text_sprite("{⏩} FAST FORWARD", 30, WHITE, GOLD, "bold", stroke=0, shadow=False)
        place(lay, badge, 450, 72, alpha=ff)
    # progress bar
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle((40, 222, 860, 240), radius=9, fill=(255, 255, 255, 50))
    frac = clamp01(left / 86400)
    if frac > 0.0005:
        d.rounded_rectangle((40, 222, 40 + max(18, int(820 * frac)), 240), radius=9, fill=col + (255,))
    place(c, lay, W / 2, 150 + lay.height / 2, alpha=fade)


# --------------------------------------------------------------------------------------
# Sections
# --------------------------------------------------------------------------------------
def sec_hook(c, t):
    draw_rays(c, t, 540, 1000, 1.9, alpha=ease_out_cubic(t / 0.6))
    sc, al = pop(t, 0.35, 0.5)
    draw_hero(c, 540, 1010 + math.sin(t * 2.4) * 8, 0.78 * sc, alpha=al)
    lines = [("WHAT IF YOU WERE", 74, 290, 0.0), ("THE *MOST ATTRACTIVE*", 84, 400, 0.3),
             ("MAN IN THE WORLD", 84, 510, 0.6)]
    for txt, size, y, t0 in lines:
        s = text_sprite(txt, size, WHITE, GOLD, maxw=1060)
        sc, al = pop(t, t0)
        place(c, s, W / 2, y, scale=sc, alpha=al)
    s = text_sprite("FOR *24 HOURS?* {⏳}", 118, WHITE, GOLD, maxw=1040, glow_col=(255, 120, 60))
    sc, al = pop(t, 1.25, 0.45)
    wob = 1 + 0.03 * math.sin(t * 9) if t > 1.7 else 1
    place(c, s, W / 2, 1450, scale=sc * wob, alpha=al)
    for i, (x, y) in enumerate([(220, 760), (860, 820), (300, 1240), (800, 1200), (540, 660)]):
        tt = (t * 1.4 + i * 0.37) % 1.4
        place(c, A().big_sparkle, x, y, scale=math.sin(tt / 1.4 * math.pi) * 0.9, rot=tt * 60)


def sec_321(c, t):
    lt = t - T_HOOK_END
    n = 3 - int(lt)
    st = lt % 1.0
    draw_rays(c, t, 540, 940, 2.0, alpha=0.8, speed=40)
    gr = text_sprite("GET READY...", 70, WHITE, GOLD, "black")
    place(c, gr, W / 2, 470, alpha=ease_out_cubic(lt / 0.3))
    ring(c, 540, 960, 300, 26, 1 - st, GOLD)
    num = text_sprite(str(n), 470, GOLD, GOLD, glow_col=(255, 140, 40))
    sc = 1.0 + 0.6 * (1 - ease_out_back(st / 0.35))
    place(c, num, W / 2, 960, scale=sc, alpha=clamp01(st / 0.08) * (1 - prog(st, 0.85, 1.0)))


def sec_go(c, t):
    lt = t - T_GO
    draw_rays(c, t, 540, 960, 2.2, alpha=1, speed=70)
    s = text_sprite("GO!", 380, GREEN, GREEN, glow_col=(60, 255, 120))
    sc, al = pop(lt, 0.0, 0.3)
    place(c, s, W / 2, 960, scale=sc * (1 + lt * 0.3), alpha=al * (1 - prog(lt, 0.4, 0.6)))


# ---- story visuals -------------------------------------------------------------------
def vis_mirror(c, lt, d):
    a = A()
    sc, al = pop(lt, 0.05, 0.5)
    place(c, a.mirror, 540, 820, scale=sc, alpha=al)
    sc2, al2 = pop(lt, 0.25, 0.5)
    draw_hero(c, 540, 880 + math.sin(lt * 2.5) * 6, 0.86 * sc2, alpha=al2)
    # glass shine sweeping across
    sh = Image.new("L", a.mirror_mask.size, 0)
    x = -300 + prog(lt, 0.9, 2.0) * 1200
    ImageDraw.Draw(sh).polygon([(x, 0), (x + 120, 0), (x - 160, 760), (x - 280, 760)], fill=150)
    sh = ImageChops.multiply(sh, a.mirror_mask)
    shine = Image.new("RGBA", sh.size, (255, 255, 255, 0))
    shine.putalpha(sh)
    place(c, shine, 540 + (a.mirror.width - shine.width) / 2 - (a.mirror.width - shine.width) / 2, 820,
          scale=sc, alpha=al)
    for i, (x, y, t0) in enumerate([(380, 600, 1.0), (700, 640, 1.3), (330, 900, 1.6), (750, 940, 1.9),
                                    (540, 520, 2.2), (420, 760, 2.6), (680, 1000, 2.9)]):
        tt = lt - t0
        if 0 < tt < 0.7:
            place(c, a.big_sparkle, x, y, scale=math.sin(tt / 0.7 * math.pi), rot=tt * 120)
    sc3, al3 = pop(lt, 1.5, 0.35)
    place(c, emoji_sized("😍", 150), 820, 560, scale=sc3, alpha=al3, rot=-12)


def vis_phone(c, lt, d):
    a = A()
    scr = a.screen.copy()
    ds = ImageDraw.Draw(scr)
    ds.text((200, 70), "8:00", font=font("bold", 70), fill=WHITE, anchor="mm")
    ds.text((200, 122), "Saturday", font=font("semi", 26), fill=(255, 255, 255), anchor="mm")
    shown = [k for k, ct in enumerate(CARD_T) if lt >= ct]
    for rank, k in enumerate(reversed(shown)):
        age = lt - CARD_T[k]
        target = 170 + rank * 132
        prev = 170 + (rank - 1) * 132 if rank else 170 - 140
        y = lerp(prev, target, ease_out_cubic(age / 0.22))
        if y > 760:
            continue
        paste(scr, with_alpha(a.cards[k], clamp01(age / 0.12)), 20, y)
    scr.putalpha(ImageChops.multiply(scr.getchannel("A"), a.screen_mask))
    ph = a.phone.copy()
    pad = (ph.width - 440) // 2
    paste(ph, scr, pad + 20, pad + 30)
    sc, al = pop(lt, 0.0, 0.45)
    jx = math.sin(lt * 95) * 6 if lt > 0.5 else 0
    jr = math.sin(lt * 70) * 2.0 if lt > 0.5 else 0
    place(c, ph, 540 + jx, 830, scale=0.92 * sc, alpha=al, rot=jr)
    # badge counter
    n = int(9999 * ease_out_cubic(prog(lt, 0.4, 2.8)))
    label = "9,999+" if lt >= 2.8 else f"{n:,}"
    b = text_sprite(label, 64, WHITE, WHITE, "black", stroke=0, shadow=False)
    bw, bh = max(b.width + 16, 140), 120
    S = 2
    pill = Image.new("RGBA", (bw * S, bh * S), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle((0, 0, bw * S - 1, bh * S - 1), radius=60 * S, fill=(255, 40, 60, 255),
                                           outline=WHITE + (255,), width=6 * S)
    pill = pill.resize((bw, bh), Image.LANCZOS)
    paste(pill, b, (bw - b.width) / 2, (bh - b.height) / 2)
    bsc, bal = pop(lt, 0.35, 0.3)
    place(c, glow(pill, 18, RED), 760, 460, scale=bsc * (1 + 0.05 * math.sin(lt * 20)), alpha=bal)
    # floating hearts
    for i in range(10):
        tt = (lt - 0.5 - i * 0.3)
        if 0 < tt < 1.6:
            x = 540 + (-1) ** i * (260 + (i * 37) % 80) + math.sin(tt * 5 + i) * 20
            y = 1050 - tt * 420
            place(c, emoji_sized(["❤", "😍", "💌", "🔥"][i % 4], 90), x, y,
                  alpha=1 - prog(tt, 1.1, 1.6), scale=0.6 + 0.4 * ease_out_back(tt / 0.3))


def vis_crowd(c, lt, d):
    a = A()
    rows = [(830, 0.85, 7, 150, 0), (950, 1.05, 6, 175, 1)]
    for ry, scl, n, gap, pk in rows:
        for i in range(n):
            x0 = 540 + (i - (n - 1) / 2) * gap
            side = -1 if x0 < 540 else 1
            enter = ease_out_cubic(prog(lt, 0.05 + i * 0.05, 0.7 + i * 0.05))
            x = x0 + side * (1 - enter) * 700
            bob = abs(math.sin(lt * 7 + i * 1.3)) * 14
            place(c, a.people[pk], x, ry - bob, scale=scl)
            t0 = 0.8 + ((i * 7 + pk * 3) % 13) * 0.14
            esc, eal = pop(lt, t0, 0.3)
            emo = ["😍", "❤", "😳", "💘", "🤩"][(i + pk) % 5]
            place(c, emoji_sized(emo, 76), x, ry - 150 * scl - bob - 14, scale=esc * scl, alpha=eal)
    sc, al = pop(lt, 0.2, 0.45)
    ImageDraw.Draw(c, "RGBA").ellipse((370, 1185, 710, 1235), fill=(0, 0, 0, 90))
    draw_hero(c, 540, 905 + abs(math.sin(lt * 3.5)) * -8, 0.74 * sc, alpha=al)
    place(c, emoji_sized("☕", 110), 760, 1120, scale=pop(lt, 1.2)[0], rot=10 + math.sin(lt * 4) * 6)


def vis_free(c, lt, d):
    a = A()
    foods = ["🍔", "🍕", "🍣", "🍰", "🥂", "🦞"]
    pts = []
    for i, f in enumerate(foods):
        ang = lt * 1.1 + i * 2 * math.pi / len(foods)
        pts.append((math.sin(ang), 540 + math.cos(ang) * 400, 820 + math.sin(ang) * 300, f))
    sc0, al0 = pop(lt, 0.0, 0.5)
    for z, x, y, f in sorted(pts):
        if z < 0:
            place(c, emoji_sized(f, 140), x, y, scale=(0.7 + 0.15 * z) * sc0, alpha=al0 * 0.8)
    rise = ease_out_back(prog(lt, 0.1, 0.65), 1.2)
    place(c, a.receipt, 540, 840 + (1 - rise) * 1100, rot=3 + math.sin(lt * 2) * 1.5)
    for z, x, y, f in sorted(pts):
        if z >= 0:
            place(c, emoji_sized(f, 140), x, y, scale=(0.85 + 0.2 * z) * sc0, alpha=al0)
    st = lt - STAMP_T
    if st > 0:
        k = clamp01(st / 0.16)
        scl = 2.8 - 1.8 * (k ** 2)
        place(c, a.stamp, 560, 1100, scale=scl, rot=-14, alpha=k)
        if 0 < st < 0.4:
            for i in range(8):
                ang = i / 8 * 2 * math.pi
                r = 200 + st * 700
                place(c, a.sparkles[i % 9], 560 + math.cos(ang) * r, 1100 + math.sin(ang) * r * 0.6,
                      alpha=1 - st / 0.4)


def vis_paparazzi(c, lt, d):
    a = A()
    sc, al = pop(lt, 0.05, 0.45)
    draw_rays(c, lt, 540, 870, 1.6, alpha=0.6)
    draw_hero(c, 540, 900 + math.sin(lt * 2) * 6, 0.86 * sc, alpha=al)
    for i, (x, y) in enumerate(CAMS):
        csc, cal = pop(lt, 0.15 + i * 0.07, 0.3)
        place(c, emoji_sized("📸", 150), x, y, scale=csc, alpha=cal, flip=x > 540,
              rot=(8 if x > 540 else -8) + math.sin(lt * 6 + i) * 3)
    for ft, ci in FLASHES:
        x = lt - ft
        if 0 <= x < 0.22:
            k = 1 - x / 0.22
            cx, cy = CAMS[ci]
            place(c, a.burst, cx + (25 if cx < 540 else -25), cy - 10, scale=1.4 * (0.6 + 0.4 * k), alpha=k)


def vis_money(c, lt, d):
    a = A()
    rng = random.Random(11)
    bills = [(rng.uniform(60, 1020), rng.uniform(0, 1.6), rng.uniform(420, 700), rng.uniform(0, 6.28),
              rng.random() < 0.5, rng.choice(["💵", "💵", "💰", "💎"])) for _ in range(26)]

    def draw_bills(front):
        for x, t0, sp, ph, fr, e in bills:
            if fr != front:
                continue
            tt = lt - t0
            if tt < 0:
                continue
            y = 380 + tt * sp
            if y > 1300:
                continue
            place(c, emoji_sized(e, 110 if fr else 80), x + math.sin(tt * 3 + ph) * 40, y,
                  rot=math.sin(tt * 4 + ph) * 35, alpha=1 if fr else 0.75)

    draw_bills(False)
    sc, al = pop(lt, 0.05, 0.45)
    draw_rays(c, lt, 540, 880, 1.7, alpha=0.7, speed=25)
    draw_hero(c, 540, 900 + math.sin(lt * 2) * 6, 0.82 * sc, alpha=al)
    draw_bills(True)
    if lt > KACHING_T:
        tt = lt - KACHING_T
        place(c, text_sprite("KA-CHING!", 80, GREEN, GREEN, glow_col=(40, 200, 90)), 770, 560,
              scale=pop(tt, 0, 0.3)[0], rot=10, alpha=1 - prog(tt, 1.2, 1.5))


def vis_city(c, lt, d):
    a = A()
    sc0 = ease_out_cubic(prog(lt, 0, 0.6))
    place(c, emoji_sized("🌙", 120), 880, 570, alpha=sc0)
    place(c, a.skyline, 540, 1240 - a.skyline.height / 2 + (1 - sc0) * 200, alpha=sc0)
    for i in range(8):
        tt = (lt - 0.6 - i * 0.35)
        if 0 < tt < 1.8:
            x = 120 + (i * 137) % 860
            place(c, emoji_sized("❤", 60), x + math.sin(tt * 4 + i) * 18, 1020 - tt * 300,
                  alpha=1 - prog(tt, 1.2, 1.8), scale=ease_out_back(tt / 0.3))
    sc, al = pop(lt, 0.2, 0.45)
    draw_hero(c, 540, 935 + math.sin(lt * 2) * 5, 0.70 * sc, alpha=al)
    for i, (x, y, e) in enumerate(CARS):
        enter = ease_out_cubic(prog(lt, 0.1, 0.8))
        xx = x + (-1 if x < 540 else 1) * (1 - enter) * 500
        bounce = abs(math.sin(lt * 9 + i)) * 4
        place(c, emoji_sized(e, 150), xx, y - bounce, flip=x > 540)
    for ht, ci in HONKS:
        tt = lt - ht
        if 0 <= tt < 0.55:
            x, y, _ = CARS[ci]
            hs = text_sprite("HONK!", 58, (255, 235, 60), (255, 235, 60), "black")
            place(c, hs, x + (30 if x < 540 else -30), y - 130 - tt * 60, scale=pop(tt, 0, 0.18)[0],
                  rot=(12 if x < 540 else -12), alpha=1 - prog(tt, 0.35, 0.55))


def vis_lonely(c, lt, d):
    a = A()
    k = ease_in_out(prog(lt, 0, 0.8))
    place(c, a.spot, 540, 420 + a.spot.height / 2, alpha=k)
    dr = ImageDraw.Draw(c, "RGBA")
    rng = random.Random(21)
    for _ in range(70):
        x0 = rng.uniform(-100, 1180)
        sp = rng.uniform(1300, 1900)
        y = (rng.uniform(0, H) + lt * sp) % (H + 200) - 100
        dr.line((x0 - y * 0.12, y, x0 - y * 0.12 - 9, y + 60), fill=(190, 205, 255, int(70 * k)), width=3)
    dr.ellipse((390, 1190, 690, 1235), fill=(0, 0, 0, int(110 * k)))
    zoom = 0.80 + 0.06 * ease_in_out(lt / d)
    draw_hero(c, 540, 930, zoom, variant="sad")
    esc, eal = pop(lt, 1.7, 0.4)
    place(c, emoji_sized("💔", 130), 780, 540, scale=esc, alpha=eal, rot=-10 + math.sin(lt * 3) * 4)
    for i, (x, y) in enumerate([(250, 620), (290, 1040), (830, 1000)]):
        qs, qa = pop(lt, 2.2 + i * 0.25, 0.3)
        place(c, text_sprite("?", 120, (170, 190, 255), WHITE), x, y, scale=qs, alpha=qa * 0.8,
              rot=math.sin(lt * 2 + i) * 10)


def vis_clock(c, lt, d):
    a = A()
    sc, al = pop(lt, 0.0, 0.45)
    shake = (lt / d) ** 2 * 10
    cx = 540 + math.sin(lt * 80) * shake
    cy = 830 + math.cos(lt * 67) * shake
    place(c, a.clockface, cx, cy, scale=0.95 * sc, alpha=al)
    if al > 0.5:
        dr = ImageDraw.Draw(c, "RGBA")
        spin = 360 * 7 * ease_out_cubic(prog(lt, 0, d))
        R = 290 * 0.95 * sc
        for ang, ln, wd, col in ((spin / 12 - 60, 0.45, 18, (30, 26, 46, 255)),
                                 (spin, 0.68, 12, (30, 26, 46, 255)),
                                 (spin * 4, 0.75, 5, (230, 30, 50, 255))):
            rad = math.radians(ang - 90)
            x2, y2 = cx + math.cos(rad) * R * ln, cy + math.sin(rad) * R * ln
            dr.line((cx, cy, x2, y2), fill=col, width=wd)
            dr.ellipse((x2 - wd / 2, y2 - wd / 2, x2 + wd / 2, y2 + wd / 2), fill=col)
        dr.ellipse((cx - 16, cy - 16, cx + 16, cy + 16), fill=(230, 30, 50, 255))
    for i in range(4):
        es, ea = pop(lt, 0.5 + i * 0.3, 0.3)
        x, y = [(200, 560), (880, 600), (190, 1100), (890, 1080)][i]
        place(c, emoji_sized(["⏳", "😱", "⏰", "😰"][i], 110), x, y, scale=es, alpha=ea,
              rot=math.sin(lt * 8 + i) * 12)


VISUALS = dict(mirror=vis_mirror, phone=vis_phone, crowd=vis_crowd, free=vis_free, paparazzi=vis_paparazzi,
               money=vis_money, city=vis_city, lonely=vis_lonely, clock=vis_clock)


def sec_scene(c, t):
    k = max(i for i, s in enumerate(SCENES) if t >= s["start"])
    s = SCENES[k]
    lt = t - s["start"]
    VISUALS[s["vis"]](c, lt, s["dur"])
    head = s["head"]
    if s["vis"] == "money":
        n = int(10_000_000 * ease_out_cubic(prog(lt, 0.3, KACHING_T)))
        head = f"*${n:,}* IN DEALS"
    draw_captions(c, lt, head, s["sub"], t_head=0.15 if k else 0.3, t_sub=0.55 if k else 0.7)


def sec_final(c, t):
    lt = t - T_FINAL
    i = int(lt / NUM_DUR)
    n = 10 - i
    st = lt - i * NUM_DUR
    draw_rays(c, t, 540, 930, 2.2, alpha=0.5 + 0.3 * (1 - st / NUM_DUR), speed=60 + i * 15)
    flick = 0.25 + 0.25 * (0.5 + 0.5 * math.sin(t * 40)) * (n / 10)
    draw_hero(c, 540, 960, 0.9, alpha=flick)
    ring(c, 540, 930, 330, 30, 1 - st / NUM_DUR, RED if n <= 3 else GOLD)
    col = lerp_col(GOLD, RED, (10 - n) / 9)
    num = text_sprite(str(n), 520, col, col, glow_col=(255, 60, 60) if n <= 3 else (255, 150, 40))
    sc = 1 + 0.7 * (1 - ease_out_back(st / 0.3))
    place(c, num, W / 2, 935, scale=sc, alpha=clamp01(st / 0.06))
    lab = text_sprite("FINAL SECONDS!", 76, WHITE, RED, glow_col=(255, 40, 40))
    place(c, lab, W / 2, 1400, scale=1 + 0.05 * math.sin(lt * 18))


def sec_timesup(c, t):
    lt = t - T_UP
    sc, al = pop(lt, 0.25, 0.5)
    draw_rays(c, t, 540, 900, 1.6, alpha=0.35, speed=8)
    for i in range(6):
        ang = i / 6 * 2 * math.pi + 0.4
        r = 120 + ease_out_cubic(lt / 0.8) * 260
        place(c, emoji_sized("💨", 130), 540 + math.cos(ang) * r, 880 + math.sin(ang) * r * 0.8,
              alpha=1 - prog(lt, 0.4, 0.9), scale=0.8 + lt)
    draw_hero(c, 540, 900 + math.sin(lt * 2) * 5, 0.84 * sc, variant="normal", alpha=al)
    head = text_sprite("TIME'S *UP!* {⏰}", 120, WHITE, RED, glow_col=(255, 60, 60))
    hs, ha = pop(lt, 0.1, 0.4)
    place(c, head, W / 2, 1320, scale=hs, alpha=ha)
    ss = sub_sprite("back to normal... but your dog still loves you {🐶}")
    s2, a2 = pop(lt, 0.8, 0.3)
    place(c, ss, W / 2, 1480, scale=s2, alpha=a2)


def sec_moral(c, t):
    lt = t - T_MORAL
    pill = sub_sprite("THE LESSON {💡}", 48)
    p, pa = pop(lt, 0.05, 0.3)
    place(c, pill, W / 2, 235, scale=p, alpha=pa)
    head = text_sprite("THE *REAL* GLOW-UP?", 90, WHITE, GOLD, maxw=1060)
    hs, ha = pop(lt, 0.2, 0.4)
    place(c, head, W / 2, 370, scale=hs, alpha=ha)
    draw_rays(c, t, 540, 900, 1.5 * ease_out_cubic(lt / 1.2), alpha=0.8, speed=15)
    draw_hero(c, 540, 920 + math.sin(lt * 2) * 6, 0.82, variant="normal")
    for i in range(7):
        tt = lt - 0.6 - i * 0.28
        if 0 < tt < 1.8:
            x = 540 + (-1) ** i * (230 + i * 18)
            place(c, emoji_sized(["💛", "✨", "😊"][i % 3], 90), x + math.sin(tt * 4) * 18, 1100 - tt * 380,
                  alpha=1 - prog(tt, 1.2, 1.8), scale=ease_out_back(tt / 0.3))
    t1 = text_sprite("*CONFIDENCE* + *KINDNESS*", 70, WHITE, GOLD, maxw=1060)
    s1, a1 = pop(lt, 0.9, 0.35)
    place(c, t1, W / 2, 1330, scale=s1, alpha=a1)
    ss = sub_sprite("make you attractive every single day {💛}")
    s2, a2 = pop(lt, 1.4, 0.3)
    place(c, ss, W / 2, 1450, scale=s2, alpha=a2)


def sec_cta(c, t):
    lt = t - T_CTA
    a = A()
    head = text_sprite("WOULD *YOU* TAKE THE 24 HOURS?", 96, WHITE, GOLD, maxw=960)
    hs, ha = pop(lt, 0.05, 0.4)
    place(c, head, W / 2, 380, scale=hs, alpha=ha)
    draw_rays(c, t, 540, 860, 1.6, alpha=0.9, speed=20)
    sc, al = pop(lt, 0.2, 0.45)
    draw_hero(c, 540, 870 + math.sin(lt * 2.5) * 6, 0.68 * sc, alpha=al)
    ss = sub_sprite("comment {👇} *YES* or *NO*", 60)
    s2, a2 = pop(lt, 0.6, 0.3)
    place(c, ss, W / 2, 1250, scale=s2, alpha=a2)
    bs, ba = pop(lt, 1.0, 0.35)
    place(c, a.button, W / 2, 1420, scale=bs * (1 + 0.04 * math.sin(lt * 7)), alpha=ba)
    s3 = text_sprite("follow for more *WHAT IF* videos", 52, WHITE, GOLD, "bold", maxw=960)
    ts, ta = pop(lt, 1.4, 0.3)
    place(c, s3, W / 2, 1560, scale=ts, alpha=ta)
    if lt > 1.0:
        tt = (lt - 1.0) % 1.2
        place(c, emoji_sized("👈", 100), 900 + math.sin(tt / 1.2 * math.pi) * 30, 1420)


# --------------------------------------------------------------------------------------
# Frame composition
# --------------------------------------------------------------------------------------
IMPACTS = ([(T_GO, 22), (T_UP, 30)] + [(T_FINAL + i * NUM_DUR, 10 + i * 2) for i in range(10)]
           + [(SCENES[3]["start"] + STAMP_T + 0.16, 24)])


def flash_alpha(t):
    a = 0.0
    for s in SCENES[1:]:
        a = max(a, 0.35 * (1 - prog(t, s["start"], s["start"] + 0.18)) if t >= s["start"] else 0)
    for tt, k in [(T_GO, 0.8), (T_UP, 1.0), (T_MORAL, 0.4), (T_CTA, 0.4), (T_HOOK_END, 0.35)]:
        if t >= tt:
            a = max(a, k * (1 - prog(t, tt, tt + 0.3)))
    s5 = SCENES[4]
    for ft, _ in FLASHES:
        x = t - s5["start"] - ft
        if 0 <= x < 0.12:
            a = max(a, 0.5 * (1 - x / 0.12))
    return a


def shake(t):
    dx = dy = 0.0
    for tt, mag in IMPACTS:
        x = t - tt
        if 0 <= x < 0.3:
            k = (1 - x / 0.3) * mag
            dx += math.sin(x * 90) * k
            dy += math.cos(x * 77) * k
    return int(dx), int(dy)


def render_frame(t):
    c = background(t)
    if t < T_HOOK_END:
        draw_particles(c, t, 1.0)
        sec_hook(c, t)
    elif t < T_GO:
        draw_particles(c, t, 1.0)
        sec_321(c, t)
    elif t < T_STORY:
        draw_particles(c, t, 1.0)
        sec_go(c, t)
    elif t < T_FINAL:
        k = max(i for i, s in enumerate(SCENES) if t >= s["start"])
        draw_particles(c, t, 0.15 if k == 7 else 0.8)
        sec_scene(c, t)
    elif t < T_UP:
        draw_particles(c, t, 0.6)
        sec_final(c, t)
    elif t < T_MORAL:
        draw_particles(c, t, 0.7)
        sec_timesup(c, t)
    elif t < T_CTA:
        draw_particles(c, t, 1.0)
        sec_moral(c, t)
    else:
        draw_particles(c, t, 1.0)
        sec_cta(c, t)
    draw_hud(c, t)
    fa = flash_alpha(t)
    if fa > 0.01:
        c = Image.blend(c, Image.new("RGB", c.size, WHITE), min(1, fa))
    dx, dy = shake(t)
    if dx or dy:
        c = ImageChops.offset(c, dx, dy)
    return c


def render_bytes(i):
    return render_frame(i / FPS).tobytes()


# --------------------------------------------------------------------------------------
# Audio
# --------------------------------------------------------------------------------------
def synth_audio(duration):
    n = int(duration * SR) + SR
    out = np.zeros(n, np.float64)
    rng = np.random.default_rng(1)

    def tt(sec):
        return np.arange(int(sec * SR)) / SR

    def add(sig, at, gain=1.0):
        i = int(at * SR)
        if i >= n or i < 0:
            return
        j = min(n, i + len(sig))
        out[i:j] += sig[:j - i] * gain

    def kick():
        x = tt(0.35)
        f = 45 + 110 * np.exp(-x * 30)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9)

    def snare():
        x = tt(0.22)
        nz = rng.standard_normal(len(x))
        nz = np.diff(nz, prepend=0)
        return (nz * 0.5 * np.exp(-x * 22) + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 30) * 0.6)

    def hat():
        x = tt(0.06)
        nz = np.diff(np.diff(rng.standard_normal(len(x)), prepend=0), prepend=0)
        return nz * np.exp(-x * 70) * 0.25

    def tone(f, sec, harm=(1,), decay=4.0, attack=0.005):
        x = tt(sec)
        s = sum(np.sin(2 * np.pi * f * (k + 1) * x) * a for k, a in enumerate(harm))
        env = np.minimum(1, x / attack) * np.exp(-x * decay)
        return s * env

    def pad(freqs, sec):
        x = tt(sec)
        s = sum(np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.003 * x) for f in freqs)
        env = np.minimum(1, x / 0.4) * np.minimum(1, (sec - x) / 0.4)
        return s * env / len(freqs)

    def bandnoise(sec, lo, hi):
        m = int(sec * SR)
        spec = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        spec[(fr < lo) | (fr > hi)] = 0
        s = np.fft.irfft(spec, m)
        return s / (np.abs(s).max() + 1e-9)

    def whoosh(sec=0.55):
        x = tt(sec)
        env = np.sin(np.pi * x / sec) ** 2
        sweep = np.sin(2 * np.pi * np.cumsum(300 + 1400 * (x / sec)) / SR) * 0.15
        return (bandnoise(sec, 400, 5000) + sweep) * env

    def boom():
        x = tt(1.6)
        return (np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-x * 6)) / SR) * np.exp(-x * 2.5)
                + bandnoise(1.6, 60, 9000) * np.exp(-x * 4) * 0.5)

    def riser(sec):
        x = tt(sec)
        f = 180 + 1400 * (x / sec) ** 2
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + bandnoise(sec, 800, 9000) * 0.3) * (x / sec) ** 2

    def click():
        x = tt(0.03)
        return np.sin(2 * np.pi * 2800 * x) * np.exp(-x * 220)

    def buzz(sec=0.35):
        x = tt(sec)
        return np.sign(np.sin(2 * np.pi * 150 * x)) * 0.3 * (np.sin(2 * np.pi * 18 * x) > 0)

    def shutter():
        s = bandnoise(0.07, 1500, 9000) * np.exp(-tt(0.07) * 60)
        c = click()
        s[:len(c)] += c * 0.5
        return s

    def honk():
        x = tt(0.35)
        s = np.sign(np.sin(2 * np.pi * 415 * x)) + np.sign(np.sin(2 * np.pi * 520 * x))
        return s * 0.25 * np.minimum(1, (0.35 - x) / 0.05)

    def kaching():
        s = tone(1760, 0.8, (1, 0.4, 0.2), 5)
        hi = tone(2637, 0.7, (1, 0.3), 5)
        o = int(0.08 * SR)
        s[o:o + len(hi)] += hi[:len(s) - o]
        return s

    A2, F2, C3, G2 = 110.0, 87.31, 130.81, 98.0
    prog_roots = [A2, F2, C3, G2]
    chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]
    beat = 0.5

    # --- hook: boom + pad + hats
    add(boom(), 0.0, 0.8)
    add(pad(chords[0], 3.6), 0.0, 0.18)
    for k in range(14):
        add(hat(), 0.25 * k + 0.125, 0.6)
    add(whoosh(0.6), 1.0, 0.4)
    # --- 3-2-1
    add(riser(3.0), T_HOOK_END, 0.35)
    for k in range(3):
        add(tone(880, 0.35, (1, 0.3), 9), T_HOOK_END + k, 0.45)
        add(kick(), T_HOOK_END + k, 0.8)
    add(tone(1320, 0.6, (1, 0.4), 6), T_GO, 0.5)
    add(boom(), T_GO, 0.9)

    # --- main groove
    def groove(t0, t1, drums=True, gain=1.0):
        nb = int((t1 - t0) / beat)
        for b in range(nb):
            bt = t0 + b * beat
            bar = (b // 4) % 4
            if drums:
                add(kick(), bt, 0.85 * gain)
                if b % 2 == 1:
                    add(snare(), bt, 0.45 * gain)
                add(hat(), bt + beat / 2, 0.8 * gain)
                add(hat(), bt + beat / 4 * 3, 0.4 * gain)
            for e in range(2):
                add(tone(prog_roots[bar], 0.24, (1, 0.5, 0.33, 0.25, 0.2), 9, 0.004), bt + e * beat / 2, 0.32 * gain)
            if b % 4 == 0:
                add(pad(chords[bar], 4 * beat), bt, 0.13 * gain)

    groove(T_GO, SCENES[7]["start"])
    # sad section: pad + soft piano
    s8 = SCENES[7]["start"]
    add(pad([220, 261.63, 329.63], 2.1), s8, 0.2)
    add(pad([174.61, 220, 261.63], 2.1), s8 + 2.1, 0.2)
    for k, f in enumerate([659.25, 587.33, 523.25, 440.0, 523.25, 493.88, 440.0]):
        add(tone(f, 1.2, (1, 0.3, 0.1), 3.5), s8 + 0.3 + k * 0.55, 0.28)
    # clock running out
    s9 = SCENES[8]["start"]
    groove(s9, T_FINAL, drums=True, gain=0.8)
    add(riser(T_UP - s9), s9, 0.45)
    for k in range(int((T_FINAL - s9) / 0.25)):
        add(click(), s9 + k * 0.25, 0.45)
    # ticks during the story
    for k in range(int(T_FINAL - T_STORY)):
        add(click(), T_STORY + k, 0.25)
    # final countdown
    for i in range(10):
        bt = T_FINAL + i * NUM_DUR
        add(kick(), bt, 1.0)
        add(tone(660 + i * 40, 0.3, (1, 0.4), 10), bt, 0.42)
        add(click(), bt + NUM_DUR / 2, 0.5)
    add(boom(), T_UP, 1.0)
    add(bandnoise(1.2, 3000, 12000) * np.exp(-tt(1.2) * 3), T_UP, 0.4)
    # happy outro
    arp = [[523.25, 659.25, 783.99, 659.25], [392, 493.88, 587.33, 493.88],
           [440, 523.25, 659.25, 523.25], [349.23, 440, 523.25, 440]]
    t0 = T_UP + 0.5
    nb = int((T_END - 0.6 - t0) / beat)
    for b in range(nb):
        bt = t0 + b * beat
        bar = (b // 4) % 4
        add(kick(), bt, 0.55)
        add(hat(), bt + beat / 2, 0.6)
        if b % 2 == 1:
            add(snare(), bt, 0.25)
        for e in range(2):
            add(tone(arp[bar][(b * 2 + e) % 4], 0.3, (1, 0.5, 0.2), 8), bt + e * beat / 2, 0.22)
        if b % 4 == 0:
            add(tone([C3, G2, A2, 87.31][bar], 2.0, (1, 0.5, 0.3), 1.5), bt, 0.3)
    add(pad([261.63, 329.63, 392, 523.25], 1.6), T_END - 1.4, 0.25)

    # transitions + scene SFX
    for s in SCENES[1:]:
        add(whoosh(), s["start"] - 0.1, 0.5)
    for tt0 in (T_MORAL, T_CTA):
        add(whoosh(), tt0 - 0.1, 0.45)
    s2 = SCENES[1]["start"]
    for k, ct in enumerate(CARD_T):
        add(tone(1568 if k % 2 else 2093, 0.18, (1, 0.2), 18), s2 + ct, 0.25)
    for b in (0.5, 1.4, 2.3, 3.2):
        add(buzz(), s2 + b, 0.2)
    add(boom() * np.exp(-tt(1.6) * 4), SCENES[3]["start"] + STAMP_T + 0.16, 0.8)
    for ft, _ in FLASHES:
        add(shutter(), SCENES[4]["start"] + ft, 0.55)
    add(kaching(), SCENES[5]["start"] + KACHING_T, 0.45)
    for ht, _ in HONKS:
        add(honk(), SCENES[6]["start"] + ht, 0.35)

    out = out[:int(duration * SR)]
    out = np.tanh(out * 1.1)
    out = out / (np.abs(out).max() + 1e-9) * 0.9
    fade = int(0.4 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def write_wav(path, sig):
    pcm = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    stereo = np.repeat(pcm[:, None], 2, axis=1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


# --------------------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "attractive_24h_short.mp4"))
    ap.add_argument("--preview", help="comma separated times (s): save PNG stills instead of a video")
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2)))
    args = ap.parse_args()

    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for ts in args.preview.split(","):
            t = float(ts)
            p = os.path.join(HERE, "preview", f"frame_{t:05.2f}.png")
            render_frame(t).save(p)
            print("saved", p)
        return

    wav = os.path.splitext(args.out)[0] + "_audio.wav"
    print("Synthesizing soundtrack...")
    write_wav(wav, synth_audio(T_END))

    total = int(T_END * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "19",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", args.out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    print(f"Rendering {total} frames with {args.workers} workers...")
    A()  # build sprites before forking so workers share them
    t0 = time.time()
    with mp.Pool(args.workers) as pool:
        for i, buf in enumerate(pool.imap(render_bytes, range(total), chunksize=4)):
            ff.stdin.write(buf)
            if i % 60 == 0:
                el = time.time() - t0
                print(f"  frame {i}/{total}  ({el:.0f}s elapsed)", flush=True)
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    print(f"Done -> {args.out}  ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
