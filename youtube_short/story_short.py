#!/usr/bin/env python3
"""
"What If You Were The Most Attractive Man In The World For 24 Hours?"  (story version, Part 1)

A narrated, cartoon-story YouTube Short in the popular "What If..." layout:
  plaid frame  ·  title box  ·  16:9 animated panel  ·  "Part 1" label
  black-headed characters with expressive eyes, speech bubbles,
  2-3 word captions synced to a narrator, a time-of-day tag and a 24h countdown tag.

Narration is generated offline with Kokoro TTS (kokoro-onnx). Without it the video
still renders, with captions only.

  pip install pillow numpy kokoro-onnx soundfile
  # model files (put them in youtube_short/kokoro/):
  #   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  #   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

Usage:
  python story_short.py                     # -> youtube_short/attractive_24h_story.mp4
  python story_short.py --preview 3,20,40   # PNG stills only
"""
import argparse
import functools
import hashlib
import math
import multiprocessing as mp
import os
import random
import subprocess
import sys
import time
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_short import (clamp01, ease_in_out, ease_out_back, ease_out_cubic, emoji_sized, font,  # noqa: E402
                        glow, lerp, lerp_col, paste, place, prog, text_sprite)

W, H, FPS, SR = 1080, 1920, 30, 24000
SS = 2
PW, PH = 1080, 620                 # panel size in the final frame
WW, WH = PW * SS, PH * SS          # "world" drawing resolution
PANEL_Y = 450
FLOOR = 1040

INK = (22, 22, 28)
EYE = (250, 250, 250)
BROW = (215, 215, 215)
PANTS = (36, 36, 48)
BLUE = (40, 96, 222)
NEON = (95, 235, 220)

TITLE = "What If You Were The Most Attractive Man In The World For 24 Hours?"
PART = "Part 1"
VOICE, SPEED = "am_michael", 1.08


# ======================================================================================
# Character
# ======================================================================================
def heart(d, cx, cy, r, col):
    d.ellipse((cx - r, cy - r * 0.8, cx, cy + r * 0.2), fill=col)
    d.ellipse((cx, cy - r * 0.8, cx + r, cy + r * 0.2), fill=col)
    d.polygon([(cx - r * 0.97, cy - 0.2 * r), (cx + r * 0.97, cy - 0.2 * r), (cx, cy + r)], fill=col)


def star4(d, cx, cy, r, col):
    w = r * 0.22
    d.polygon([(cx, cy - r), (cx + w, cy - w), (cx + r, cy), (cx + w, cy + w), (cx, cy + r),
               (cx - w, cy + w), (cx - r, cy), (cx - w, cy - w)], fill=col)


def jline(d, pts, col, w):
    d.line(pts, fill=col, width=int(w), joint="curve")
    r = w / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse((x - r, y - r, x + r, y + r), fill=col)


ARM_POSES = {
    "down": ((16, 112), (10, 220)),
    "phone": ((26, 118), (-26, 72)),
    "photo": ((46, -10), (78, -120)),
    "coffee": ((24, 112), (92, 84)),
    "point": ((110, 14), (215, 0)),
    "hips": ((88, 80), (34, 176)),
    "shrug": ((88, 40), (118, -40)),
    "belly": ((60, 104), (-6, 150)),
    "wave": ((84, -26), (104, -150)),
    "eat": ((40, 110), (-18, 10)),
}


def person(d, x, yf, u=1.0, shirt=BLUE, pants=PANTS, pose="stand", expr="neutral", look=0.0, look_y=0.0,
           talk=False, t=0.0, hair="messy", hot=0.0, arms=("down", "down"), facing=1, seed=0,
           walk=None, hood=True, tie=None, cup=False, phone_hand=None, chair=None):
    """Draw a 'What If'-style character.  d must be ImageDraw.Draw(img, 'RGBA')."""
    U = lambda v: v * u
    sit = pose == "sit"
    hip_y = yf - U(232) if sit else yf - U(258)
    sh_y = hip_y - U(212)
    hx, hy, hr = x, sh_y - U(92), U(88)
    dark = tuple(int(c * 0.78) for c in shirt)

    if sit and chair:
        bx = x - facing * U(78)
        d.rounded_rectangle((bx - U(12), hip_y - U(190), bx + U(12), hip_y + U(30)), radius=U(8), fill=chair)
        d.rounded_rectangle((x - U(84), hip_y + U(18), x + U(84), hip_y + U(44)), radius=U(10), fill=chair)
        for lx_ in (x - U(70), x + U(70)):
            d.line((lx_, hip_y + U(40), lx_, yf - U(4)), fill=chair, width=int(U(12)))
    # ---- legs
    for s in (-1, 1):
        hip = (x + s * U(24), hip_y)
        if sit:
            knee = (x + facing * U(128) + s * U(10), hip_y + U(6))
            foot = (knee[0] + facing * U(8), yf - U(16))
            pts = [hip, knee, foot]
        elif walk is not None:
            a = math.sin(walk) * 0.45 * s
            foot = (hip[0] + math.sin(a) * U(244), hip_y + math.cos(a) * U(244) - U(4))
            pts = [hip, foot]
        else:
            foot = (x + s * U(30), yf - U(16))
            pts = [hip, foot]
        jline(d, pts, pants, U(34))
        fx = pts[-1][0] + facing * U(16)
        d.ellipse((fx - U(32), yf - U(28), fx + U(32), yf), fill=INK)

    # ---- torso
    if hood:
        d.ellipse((x - U(76), sh_y - U(40), x + U(76), sh_y + U(44)), fill=dark)
    d.rounded_rectangle((x - U(64), sh_y, x + U(64), hip_y + U(20)), radius=U(42), fill=shirt)
    if hood:
        for s in (-1, 1):
            d.line((x + s * U(16), sh_y + U(22), x + s * U(18), sh_y + U(92)), fill=(235, 235, 240), width=int(U(6)))
        d.rounded_rectangle((x - U(40), hip_y - U(64), x + U(40), hip_y - U(10)), radius=U(14), fill=dark)
    if tie:
        d.polygon([(x - U(14), sh_y + U(6)), (x + U(14), sh_y + U(6)), (x + U(20), sh_y + U(120)),
                   (x, sh_y + U(150)), (x - U(20), sh_y + U(120))], fill=tie)
        d.polygon([(x - U(34), sh_y), (x, sh_y + U(40)), (x + U(34), sh_y)], fill=(240, 240, 245))

    # ---- arms
    for idx, s in enumerate((-1, 1)):
        mode = arms[idx]
        sx = facing if mode in ("point", "coffee") else s
        (ex, ey), (hx2, hy2) = ARM_POSES[mode]
        if mode == "wave":
            hx2 += math.sin(t * 10) * 18
        sh = (x + s * U(56), sh_y + U(34))
        el = (sh[0] + sx * U(ex), sh[1] + U(ey))
        hd = (sh[0] + sx * U(hx2), sh[1] + U(hy2))
        jline(d, [sh, el, hd], shirt, U(32))
        d.ellipse((hd[0] - U(16), hd[1] - U(16), hd[0] + U(16), hd[1] + U(16)), fill=INK)
        if mode in ("phone", "photo") and (phone_hand is None or phone_hand == idx):
            d.rounded_rectangle((hd[0] - U(22), hd[1] - U(40), hd[0] + U(22), hd[1] + U(30)), radius=U(8),
                                fill=(30, 30, 40), outline=(160, 160, 175), width=int(U(3)))
            d.rectangle((hd[0] - U(16), hd[1] - U(32), hd[0] + U(16), hd[1] + U(20)), fill=(120, 190, 255))
        if mode == "coffee" and cup:
            d.rounded_rectangle((hd[0] - U(22), hd[1] - U(60), hd[0] + U(22), hd[1] - U(4)), radius=U(6),
                                fill=(250, 248, 240))
            d.rectangle((hd[0] - U(22), hd[1] - U(44), hd[0] + U(22), hd[1] - U(28)), fill=(150, 95, 60))

    # ---- head
    if hair == "long":
        d.rounded_rectangle((hx - U(100), hy - U(96), hx + U(100), hy + U(150)), radius=U(90), fill=(58, 38, 30))
    if hot > 0:
        for rr, a in ((hr + U(44), 40), (hr + U(28), 70)):
            d.ellipse((hx - rr, hy - rr, hx + rr, hy + rr), fill=(255, 210, 110, int(a * hot)))
        rr = hr + U(8)
        d.ellipse((hx - rr, hy - rr, hx + rr, hy + rr), fill=(255, 205, 90, int(255 * hot)))
    d.ellipse((hx - hr, hy - hr, hx + hr, hy + hr), fill=INK)
    if hair == "quiff":
        d.polygon([(hx - U(74), hy - U(46)), (hx - U(66), hy - U(92)), (hx - U(14), hy - U(132)),
                   (hx + U(58), hy - U(134)), (hx + U(98), hy - U(96)), (hx + U(86), hy - U(48)),
                   (hx + U(36), hy - U(80)), (hx - U(18), hy - U(70))], fill=(96, 62, 38))
        d.line((hx - U(20), hy - U(112), hx + U(50), hy - U(120), hx + U(80), hy - U(96)),
               fill=(150, 104, 66), width=int(U(7)), joint="curve")
    elif hair == "messy":
        for ox, oy in ((-46, -70), (-12, -86), (26, -84), (56, -66)):
            d.polygon([(hx + U(ox - 22), hy + U(oy + 26)), (hx + U(ox + 4), hy + U(oy - 30)),
                       (hx + U(ox + 24), hy + U(oy + 22))], fill=INK)
    elif hair == "bun":
        d.ellipse((hx - U(34), hy - U(146), hx + U(34), hy - U(78)), fill=INK)
    elif hair == "cap":
        d.chord((hx - hr - U(4), hy - hr - U(6), hx + hr + U(4), hy + hr * 0.5), 180, 360, fill=(210, 70, 60))
        bx = hx + facing * U(70)
        d.rounded_rectangle((min(hx, bx + facing * U(80)), hy - U(36), max(hx, bx + facing * U(80)), hy - U(16)),
                            radius=U(8), fill=(180, 55, 50))
    elif hair == "long":
        d.chord((hx - hr - U(6), hy - hr - U(8), hx + hr + U(6), hy + hr * 0.3), 180, 360, fill=(58, 38, 30))

    # ---- face
    blink = ((t + seed * 1.37) % 3.4) < 0.11 and expr not in ("shock", "love")
    lx, ly = look * U(15), look_y * U(10)
    for s in (-1, 1):
        ex, ey = hx + s * U(31) + lx, hy - U(6)
        if expr == "love":
            heart(d, ex, ey, U(24), (235, 50, 80))
        elif blink:
            d.line((ex - U(20), ey, ex + U(20), ey), fill=EYE, width=int(U(5)))
        else:
            rx, ry = (U(25), U(30)) if expr == "shock" else (U(21), U(25))
            d.ellipse((ex - rx, ey - ry, ex + rx, ey + ry), fill=EYE)
            pr = U(7) if expr == "shock" else U(10)
            px, py = ex + look * U(8), ey + look_y * U(10)
            d.ellipse((px - pr, py - pr, px + pr, py + pr), fill=INK)
            if expr in ("smug", "tired"):
                d.rectangle((ex - rx - 2, ey - ry - 2, ex + rx + 2, ey - U(4)), fill=INK)
        # brows
        by = hy - U(46)
        inner, outer = (ex - s * U(16), ex + s * U(16))
        if expr == "shock":
            a, b = by - U(14), by - U(14)
        elif expr in ("sad", "nervous"):
            a, b = by - U(10), by + U(4)
        elif expr == "angry":
            a, b = by + U(10), by - U(8)
        elif expr == "smug":
            a, b = (by - U(12), by - U(12)) if s == 1 else (by + U(2), by + U(2))
        elif expr in ("happy", "love", "laugh"):
            a, b = by - U(6), by - U(4)
        else:
            a, b = by, by
        d.line((inner + lx * 0.6, a, outer + lx * 0.6, b), fill=BROW, width=int(U(6)))

    mx, my = hx + lx * 0.7, hy + U(46)
    mcol = (240, 240, 240)
    if talk:
        o = U(5 + 15 * abs(math.sin(t * 14 + seed)))
        d.ellipse((mx - U(15), my - o / 2, mx + U(15), my + o / 2), fill=(150, 40, 55), outline=mcol, width=int(U(3)))
    elif expr == "shock":
        d.ellipse((mx - U(13), my - U(14), mx + U(13), my + U(16)), fill=mcol)
        d.ellipse((mx - U(8), my - U(8), mx + U(8), my + U(10)), fill=(150, 40, 55))
    elif expr == "laugh":
        d.chord((mx - U(26), my - U(20), mx + U(26), my + U(22)), 0, 180, fill=mcol)
    elif expr in ("happy", "love"):
        d.arc((mx - U(22), my - U(18), mx + U(22), my + U(12)), 20, 160, fill=mcol, width=int(U(5)))
    elif expr == "smug":
        d.arc((mx - U(18), my - U(16), mx + U(26), my + U(8)), 10, 120, fill=mcol, width=int(U(5)))
    elif expr in ("sad", "nervous"):
        d.arc((mx - U(18), my, mx + U(18), my + U(22)), 200, 340, fill=mcol, width=int(U(5)))
    elif expr == "angry":
        d.rounded_rectangle((mx - U(20), my - U(4), mx + U(20), my + U(10)), radius=U(4), fill=mcol)
        d.line((mx - U(10), my - U(4), mx - U(10), my + U(10)), fill=INK, width=int(U(2)))
        d.line((mx + U(10), my - U(4), mx + U(10), my + U(10)), fill=INK, width=int(U(2)))
    else:
        d.line((mx - U(14), my + U(4), mx + U(14), my + U(4)), fill=mcol, width=int(U(5)))
    if expr == "nervous":
        sx2, sy2 = hx + U(92), hy - U(36)
        d.ellipse((sx2 - U(10), sy2, sx2 + U(10), sy2 + U(22)), fill=(140, 200, 255))
        d.polygon([(sx2 - U(9), sy2 + U(8)), (sx2 + U(9), sy2 + U(8)), (sx2, sy2 - U(14))], fill=(140, 200, 255))
    if hot > 0.3:
        for k in range(3):
            ph = (t * 1.3 + k * 0.33 + seed * 0.1) % 1.0
            r = U(18) * math.sin(ph * math.pi) * hot
            ang = k * 2.1 + seed
            star4(d, hx + math.cos(ang) * U(140), hy + math.sin(ang) * U(110), r, (255, 245, 200))
    return hx, hy


# ======================================================================================
# Sprites: bubbles, cards, overlays
# ======================================================================================
@functools.lru_cache(maxsize=128)
def bubble(text, tail="left", size=54, maxw=700):
    f = font("semi", size)
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if f.getlength(test) > maxw and cur:
            lines.append(cur); cur = w_
        else:
            cur = test
    lines.append(cur)
    lh = int(size * 1.22)
    tw = max(f.getlength(l) for l in lines)
    pad = 28
    bw, bh = int(tw + pad * 2), int(lh * len(lines) + pad * 1.6)
    im = Image.new("RGBA", (bw + 8, bh + 50), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    tx = 50 if tail == "left" else bw - 50
    d.polygon([(tx - 22, bh - 4), (tx + 22, bh - 4), (tx + (-30 if tail == "left" else 30), bh + 40)],
              fill=(255, 255, 250), outline=INK)
    d.rounded_rectangle((3, 3, bw, bh), radius=30, fill=(255, 255, 250), outline=INK, width=4)
    d.polygon([(tx - 18, bh - 6), (tx + 18, bh - 6), (tx + (-26 if tail == "left" else 26), bh + 34)],
              fill=(255, 255, 250))
    d.line((tx - 21, bh, tx + (-30 if tail == "left" else 30), bh + 40), fill=INK, width=4)
    d.line((tx + 21, bh, tx + (-30 if tail == "left" else 30), bh + 40), fill=INK, width=4)
    for i, l in enumerate(lines):
        d.text((bw / 2 + 2, pad * 0.8 + i * lh + lh / 2), l, font=f, fill=INK, anchor="mm")
    return im


def show_bubble(img, text, x, y, lt, t0, t1, tail="left"):
    """Bubble whose tail tip sits at (x, y)."""
    if not (t0 <= lt < t1):
        return
    b = bubble(text, tail)
    sc = 0.4 + 0.6 * ease_out_back((lt - t0) / 0.3)
    al = clamp01((lt - t0) / 0.1) * (1 - prog(lt, t1 - 0.12, t1))
    tx = 50 if tail == "left" else b.width - 58
    cx = x - tx + b.width / 2 + (30 if tail == "left" else -30)
    cy = y - b.height / 2
    place(img, b, cx + (x - cx) * (1 - sc), cy + (y - cy) * (1 - sc), scale=sc, alpha=al)


@functools.lru_cache(maxsize=64)
def msg_card(sender, text, emo, width=780, theme="light"):
    S = 1
    fz = 50
    h = 196
    bg = (255, 255, 252) if theme == "light" else (16, 40, 48)
    fg = INK if theme == "light" else (220, 255, 250)
    im = Image.new("RGBA", (width, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((2, 2, width - 3, h - 3), radius=34, fill=bg,
                        outline=(INK if theme == "light" else NEON), width=4)
    paste(im, emoji_sized(emo, 96), 26, (h - 96) // 2)
    d.text((146, 32), sender, font=font("black", 38), fill=(120, 120, 135) if theme == "light" else NEON)
    d.text((146, 88), text, font=font("semi", fz), fill=fg)
    return im


def show_card(img, card, x, y, lt, t0, t1=1e9):
    if not (t0 <= lt < t1):
        return
    sc = 0.5 + 0.5 * ease_out_back((lt - t0) / 0.32)
    place(img, card, x, y, scale=sc, alpha=clamp01((lt - t0) / 0.1) * (1 - prog(lt, t1 - 0.12, t1)))


# ======================================================================================
# Backgrounds (world resolution, cached)
# ======================================================================================
def vgrad(w, h, top, bot):
    yy = np.linspace(0, 1, h)[:, None, None]
    arr = np.array(top) * (1 - yy) + np.array(bot) * yy
    return Image.fromarray(np.repeat(arr, w, axis=1).astype(np.uint8))


def skyline(d, x0, x1, base, col, seed, win=None, hmin=120, hmax=360):
    rng = random.Random(seed)
    x = x0
    while x < x1:
        bw, bh = rng.randint(70, 150), rng.randint(hmin, hmax)
        d.rectangle((x, base - bh, x + bw, base), fill=col)
        if win:
            for wy in range(base - bh + 18, base - 20, 34):
                for wx in range(x + 12, x + bw - 16, 26):
                    if rng.random() < 0.45:
                        d.rectangle((wx, wy, wx + 12, wy + 18), fill=win)
        x += bw + rng.randint(4, 14)


def window(d, box, sky_top, sky_bot, frame=(245, 240, 230), city=None, seed=1, panes=2):
    x0, y0, x1, y1 = box
    g = vgrad(x1 - x0, y1 - y0, sky_top, sky_bot)
    d._image.paste(g, (x0, y0))
    if city:
        skyline(d, x0, x1, y1, city[0], seed, city[1], 60, int((y1 - y0) * 0.75))
    d.rectangle(box, outline=frame, width=18)
    for k in range(1, panes):
        xm = x0 + (x1 - x0) * k // panes
        d.line((xm, y0, xm, y1), fill=frame, width=12)
    d.line((x0, (y0 + y1) // 2, x1, (y0 + y1) // 2), fill=frame, width=12)
    d.rectangle((x0 - 20, y1, x1 + 20, y1 + 24), fill=tuple(int(c * 0.9) for c in frame))


def wall_clock(d, cx, cy, r=62):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(250, 248, 240), outline=INK, width=6)
    d.line((cx, cy, cx, cy - r * 0.7), fill=INK, width=6)
    d.line((cx, cy, cx + r * 0.45, cy + r * 0.2), fill=INK, width=6)


def floor_band(d, col, y=FLOOR - 20):
    d.rectangle((0, y, WW, WH), fill=col)
    d.line((0, y, WW, y), fill=tuple(int(c * 0.8) for c in col), width=6)


@functools.lru_cache(maxsize=None)
def bg(name):
    if name == "bathroom":
        im = vgrad(WW, WH, (222, 205, 178), (205, 186, 158))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 640, WW, FLOOR), fill=(232, 228, 216))
        for x in range(0, WW, 90):
            d.line((x, 640, x, FLOOR), fill=(210, 205, 192), width=3)
        for y in range(640, FLOOR, 90):
            d.line((0, y, WW, y), fill=(210, 205, 192), width=3)
        floor_band(d, (150, 128, 108))
        window(d, (130, 180, 520, 560), (255, 236, 200), (255, 210, 160), panes=2)
        d.rounded_rectangle((1090, 230, 1510, 780), radius=26, fill=(120, 96, 72))
        d.rectangle((1080, 790, 1520, 850), fill=(245, 245, 240))
        d.rounded_rectangle((1120, 850, 1480, FLOOR - 20), radius=10, fill=(170, 140, 110))
        d.line((1300, 860, 1300, FLOOR - 30), fill=(140, 112, 86), width=5)
        d.rectangle((1290, 750, 1310, 795), fill=(190, 190, 195))
        d.rounded_rectangle((1620, 360, 1700, 640), radius=12, fill=(120, 170, 190))
        d.rectangle((1600, 350, 1720, 370), fill=(130, 110, 90))
        return im
    if name == "bus":
        im = Image.new("RGBA", (WW, WH), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, WW, 170), fill=(214, 216, 205, 255))
        d.rectangle((0, 600, WW, WH), fill=(206, 208, 196, 255))
        for x in range(0, WW, 540):
            d.rectangle((x, 160, x + 60, 610), fill=(70, 78, 90, 255))
        d.rectangle((0, 160, WW, 182), fill=(70, 78, 90, 255))
        d.rectangle((0, 590, WW, 612), fill=(70, 78, 90, 255))
        floor_band(d, (96, 96, 104))
        d.rectangle((0, FLOOR - 20, WW, WH), fill=(96, 96, 104, 255))
        for x in (300, 820, 1300, 1860):
            d.rectangle((x - 10, 0, x + 10, FLOOR - 20), fill=(232, 192, 70, 255))
        for x in range(0, WW, 120):
            d.ellipse((x + 40, 100, x + 80, 140), outline=(120, 120, 130, 255), width=5)
        return im
    if name == "office":
        im = vgrad(WW, WH, (212, 228, 210), (200, 218, 198))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 700, WW, FLOOR), fill=(194, 212, 192))
        floor_band(d, (230, 226, 210))
        window(d, (1500, 140, 2040, 560), (215, 230, 235), (235, 240, 240), city=((175, 188, 196), None), seed=4)
        wall_clock(d, 470, 200)
        d.rectangle((700, 150, 790, 250), fill=(250, 248, 240))
        d.rectangle((700, 150, 790, 178), fill=(220, 50, 50))
        d.rectangle((40, 250, 200, 520), outline=INK, width=10)
        d.ellipse((60, 300, 180, 460), outline=(120, 140, 150), width=8)
        d.rounded_rectangle((1580, 560, 1860, 740), radius=10, fill=(40, 46, 60))
        d.rectangle((1600, 578, 1840, 722), fill=(160, 220, 225))
        d.rectangle((1700, 740, 1740, 800), fill=(40, 46, 60))
        d.rectangle((1280, 790, 2160, 820), fill=(240, 236, 222))
        d.rectangle((1300, 820, 1320, FLOOR - 20), fill=(180, 176, 165))
        d.rectangle((2100, 820, 2120, FLOOR - 20), fill=(180, 176, 165))
        d.polygon([(1000, FLOOR - 20), (1060, 870), (1120, FLOOR - 20)], fill=(120, 90, 70))
        d.ellipse((990, 760, 1130, 900), fill=(80, 150, 90))
        return im
    if name == "phone":
        return infographic_bg()
    if name == "cafe":
        im = Image.new("RGBA", (WW, WH), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, WW, WH), fill=(190, 132, 92, 255))
        for y in range(40, 700, 70):
            off = 0 if (y // 70) % 2 else 60
            for x in range(-60 + off, WW, 120):
                d.rectangle((x, y, x + 112, y + 62), outline=(176, 118, 80, 255), width=4)
        d.rectangle((640, 160, 1560, 640), fill=(0, 0, 0, 0))
        d.rectangle((640, 160, 1560, 640), outline=(90, 58, 40, 255), width=22)
        d.line((1100, 160, 1100, 640), fill=(90, 58, 40, 255), width=16)
        d.rectangle((0, 700, WW, FLOOR), fill=(150, 98, 66, 255))
        floor_band(d, (96, 64, 48))
        d.rectangle((0, FLOOR - 20, WW, WH), fill=(96, 64, 48, 255))
        d.rounded_rectangle((1720, 170, 2080, 460), radius=12, fill=(40, 40, 44, 255))
        for k, txt in enumerate(["LATTE  4", "MOCHA  5", "CAKE   6"]):
            d.text((1760, 210 + k * 80), txt, font=font("bold", 44), fill=(240, 240, 230, 255))
        for lx in (420, 1800):
            d.line((lx, 0, lx, 120), fill=INK + (255,), width=4)
            d.chord((lx - 70, 90, lx + 70, 190), 180, 360, fill=(240, 200, 90, 255))
        return im
    if name == "cafe_out":
        im = vgrad(WW, WH, (200, 225, 240), (235, 240, 235))
        d = ImageDraw.Draw(im)
        skyline(d, 600, 1600, 640, (176, 186, 196), 9, (210, 218, 226), 120, 380)
        return im
    if name == "living":
        im = vgrad(WW, WH, (206, 132, 92), (180, 108, 74))
        d = ImageDraw.Draw(im)
        window(d, (1480, 160, 1980, 560), (255, 170, 110), (255, 210, 140), frame=(240, 210, 180),
               city=((160, 90, 80), (255, 220, 140)), seed=6)
        floor_band(d, (110, 70, 54))
        for fx, fy in ((300, 230), (520, 280)):
            d.rectangle((fx, fy, fx + 160, fy + 120), fill=(240, 220, 190), outline=(90, 56, 40), width=8)
        d.line((1300, 300, 1300, 860), fill=(70, 46, 36), width=10)
        d.polygon([(1230, 300), (1370, 300), (1340, 220), (1260, 220)], fill=(250, 220, 150))
        d.rounded_rectangle((520, 760, 1700, 940), radius=40, fill=(110, 72, 64))
        d.rounded_rectangle((470, 640, 1750, 800), radius=50, fill=(128, 84, 74))
        d.rounded_rectangle((440, 760, 560, 960), radius=30, fill=(118, 78, 68))
        d.rounded_rectangle((1660, 760, 1780, 960), radius=30, fill=(118, 78, 68))
        return im
    if name == "night":
        im = vgrad(WW, WH, (34, 38, 70), (24, 26, 50))
        d = ImageDraw.Draw(im)
        window(d, (1420, 150, 1940, 560), (12, 18, 42), (30, 36, 80), frame=(70, 76, 110),
               city=((18, 22, 44), (255, 214, 120)), seed=12)
        d.ellipse((1760, 190, 1840, 270), fill=(250, 245, 220))
        floor_band(d, (40, 40, 66))
        d.rounded_rectangle((520, 770, 1500, 960), radius=30, fill=(70, 78, 130))
        d.rounded_rectangle((500, 600, 580, 960), radius=20, fill=(90, 70, 70))
        d.rounded_rectangle((600, 720, 820, 800), radius=30, fill=(220, 220, 235))
        d.rounded_rectangle((1560, 820, 1720, FLOOR - 20), radius=10, fill=(80, 62, 60))
        return im
    if name == "pizza":
        im = vgrad(WW, WH, (196, 78, 64), (176, 64, 52))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 640, WW, FLOOR), fill=(240, 236, 226))
        for x in range(0, WW, 80):
            d.line((x, 640, x, FLOOR), fill=(220, 214, 200), width=3)
        floor_band(d, (90, 60, 50))
        d.text((WW / 2, 200), "LUIGI'S PIZZA", font=font("black", 110), fill=(255, 230, 160), anchor="mm")
        for lx in (600, 1560):
            d.line((lx, 0, lx, 300), fill=INK, width=4)
            d.chord((lx - 80, 280, lx + 80, 390), 180, 360, fill=(250, 210, 100))
        return im
    if name == "dark":
        im = vgrad(WW, WH, (30, 8, 14), (12, 4, 8))
        return im
    raise KeyError(name)


def infographic_bg():
    yy, xx = np.mgrid[0:WH, 0:WW].astype(np.float32)
    r = np.hypot((xx - WW / 2) / WW, (yy - WH / 2) / WH)
    k = np.clip(1 - r * 1.4, 0, 1)[:, :, None]
    arr = np.array([10, 26, 34]) + k * np.array([16, 40, 44])
    im = Image.fromarray(arr.astype(np.uint8))
    d = ImageDraw.Draw(im)
    for x in range(0, WW, 80):
        d.line((x, 0, x, WH), fill=(22, 50, 58), width=2)
    for y in range(0, WH, 80):
        d.line((0, y, WW, y), fill=(22, 50, 58), width=2)
    d.ellipse((380, 980, 1780, 1140), outline=(40, 110, 110), width=4)
    return im


def bg_copy(name):
    b = bg(name)
    return b.copy() if b.mode == "RGB" else None


# ======================================================================================
# Scenes
# ======================================================================================
def ts(S, i, off=0.0):
    return S["ts"][min(i, len(S["ts"]) - 1)] + off


def te(S, i, off=0.0):
    return S["te"][min(i, len(S["te"]) - 1)] + off


def sc_mirror(img, d, lt, S, after=False):
    walking = (not after) and lt < 1.7
    x = lerp(240, 800, ease_in_out(prog(lt, 0.0, 1.7))) if not after else 800
    if not after:
        expr = "neutral"
        if lt > te(S, 0, -0.9):
            expr = "shock"
        if lt > ts(S, 2, 0.6):
            expr = "smug"
        hot = clamp01(prog(lt, te(S, 0, -0.9), ts(S, 1, 0.8)))
    else:
        expr = "happy" if lt > te(S, 0, -0.6) else "neutral"
        if lt > ts(S, 2, 0.6):
            expr = "laugh"
        hot = 0.0
    # reflection inside the mirror glass
    gx0, gy0, gx1, gy1 = 1110, 250, 1490, 760
    glass = vgrad(gx1 - gx0, gy1 - gy0, (198, 222, 230), (176, 204, 214))
    gd = ImageDraw.Draw(glass, "RGBA")
    person(gd, 190, 760, 1.0, pose="stand", expr=expr, look=-0.3, t=lt, hair="quiff" if not after else "messy",
           hot=hot, seed=3)
    for k in range(3):
        gd.polygon([(60 + k * 120, 0), (110 + k * 120, 0), (-40 + k * 120, 510), (-90 + k * 120, 510)],
                   fill=(255, 255, 255, 40))
    img.paste(glass, (gx0, gy0))
    person(d, x, FLOOR, 1.0, pose="stand", expr=expr, look=1.0 if not walking else 0.5, t=lt,
           hair="quiff" if not after else "messy", hot=hot, walk=(lt * 9 if walking else None), seed=1)
    fx = {}
    if after:
        show_card(img, msg_card("Trending", "#48,213  ...and falling", "📉"), 1080, 300, lt, ts(S, 1, 0.2), ts(S, 2))
        show_card(img, msg_card("Best friend", "pizza later? like normal?", "🍕"), 1080, 300, lt, ts(S, 2, 0.9))
    return fx


def sc_bus(img, d, lt, S):
    # moving city behind windows
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
    img.paste(bg("bus"), (0, 0), bg("bus"))
    look_k = clamp01(prog(lt, ts(S, 0, 1.0), ts(S, 0, 1.5)))
    bob = math.sin(lt * 9) * 3
    turned = look_k > 0.5
    # seats
    for sx in (520, 1080, 1620):
        d.rounded_rectangle((sx - 130, 600, sx + 130, 820), radius=30, fill=(70, 110, 160))
        d.rounded_rectangle((sx - 140, 800, sx + 150, 860), radius=20, fill=(60, 96, 140))
    person(d, 520, FLOOR + bob, 0.95, shirt=(232, 110, 150), pose="sit", hair="long", facing=1, t=lt, seed=2,
           expr="love" if turned else "neutral", look=1 if turned else 0, look_y=0 if turned else 1,
           arms=("down", "photo" if ts(S, 1, 0.2) < lt < ts(S, 2) else "phone"), phone_hand=1, hood=False)
    person(d, 1080, FLOOR + bob, 1.0, pose="sit", hair="quiff", hot=1.0, facing=1, t=lt, seed=1,
           expr="nervous" if lt > ts(S, 1, 1.2) else "neutral", look=-1 if lt > ts(S, 1, 1.0) else 0)
    person(d, 1620, FLOOR + bob, 0.95, shirt=(90, 160, 110), pose="sit", hair="cap", facing=-1, t=lt, seed=5,
           expr="shock" if turned else "neutral", look=-1 if turned else 0, look_y=0 if turned else 1,
           arms=("phone", "down"), phone_hand=0, hood=False)
    person(d, 1330, FLOOR + bob, 1.0, shirt=(230, 140, 60), pose="stand", hair="messy", t=lt, seed=7,
           expr="love" if turned else "neutral", look=-1 if turned else 0, look_y=0 if turned else 1,
           arms=("phone", "down"), phone_hand=0)
    fx = {}
    ft = lt - ts(S, 1, 1.0)
    if 0 <= ft < 0.3:
        fx["flash"] = 0.8 * (1 - ft / 0.3)
    if lt > ts(S, 2, 0.1):
        n = int(2_014_332 * ease_out_cubic(prog(lt, ts(S, 2, 0.3), te(S, 2, 0.1))))
        show_card(img, msg_card("Your photo", f"{n:,} views", "👀"), 1080, 330, lt, ts(S, 2, 0.1))
    return fx


def sc_office(img, d, lt, S):
    person(d, 1760, FLOOR, 1.0, shirt=(92, 98, 116), pose="stand", hair="bald", tie=(200, 50, 60), hood=False,
           expr="laugh" if lt < ts(S, 1) else ("love" if lt > ts(S, 2, 0.8) else "happy"),
           arms=("belly", "belly") if lt < ts(S, 1) else ("down", "down"), look=-1, t=lt, seed=4,
           talk=ts(S, 0, 0.5) < lt < ts(S, 0, 1.6))
    for k, (shirt, hair, tx, seed) in enumerate([((90, 165, 115), "bun", 1180, 6), ((232, 140, 64), "messy", 1440, 8)]):
        t0 = ts(S, 1, 0.1 + k * 0.35)
        kk = ease_in_out(prog(lt, t0, t0 + 1.3))
        if lt < t0:
            continue
        x = lerp(2400, tx, kk)
        person(d, x, FLOOR, 0.96, shirt=shirt, hair=hair, hood=False, arms=("down", "coffee"), cup=True,
               facing=-1, walk=(lt * 9 if kk < 1 else None), expr="love" if kk >= 1 else "happy", look=-1, t=lt,
               seed=seed)
    talking = ts(S, 2) < lt < te(S, 2, -0.8)
    person(d, 560, FLOOR, 1.0, pose="stand", hair="quiff", hot=1.0, look=1, t=lt, seed=1,
           expr="smug" if lt < ts(S, 2) else ("sad" if lt > te(S, 2, -0.6) else "neutral"), talk=talking,
           arms=("down", "point" if talking else "down"))
    show_bubble(img, "HAHA! You're hilarious!", 1700, 470, lt, ts(S, 0, 0.5), ts(S, 1), tail="right")
    show_bubble(img, "So... our sales dropped 40%.", 600, 470, lt, ts(S, 2, 0.1), te(S, 2, -0.9))
    show_bubble(img, "...wow. Your jawline.", 1700, 470, lt, te(S, 2, -1.1), 99, tail="right")
    return {}


def neon_box(d, box, col=NEON, w=6, r=30, fill=None):
    d.rounded_rectangle(box, radius=r, outline=col, width=w, fill=fill)


def sc_phone(img, d, lt, S):
    red = lt > ts(S, 2, 0.2)
    jit = math.sin(lt * 80) * 10 if lt < te(S, 0) or red else 0
    px0, py0, px1, py1 = 560 + jit, 170, 960 + jit, 1010
    neon_box(d, (px0 - 14, py0 - 14, px1 + 14, py1 + 14), (40, 120, 120), 4, 64)
    neon_box(d, (px0, py0, px1, py1), (255, 90, 90) if red else NEON, 8, 56, fill=(70, 12, 18) if red else (8, 30, 38))
    d.rounded_rectangle((px0 + 150, py0 + 24, px1 - 150, py0 + 46), radius=10, fill=(255, 90, 90) if red else NEON)
    if lt < te(S, 0, 0.3):
        for k in range(3):
            a = (lt * 3 + k * 0.33) % 1
            for s in (-1, 1):
                cx = (px0 if s < 0 else px1) + s * (40 + a * 120)
                d.arc((cx - 60, 480, cx + 60, 700), (90 if s < 0 else -90) + 50, (270 if s < 0 else 90) - 50,
                      fill=NEON + (int(255 * (1 - a)),), width=8)
    n = int(50000 * ease_out_cubic(prog(lt, ts(S, 1), ts(S, 1, 1.4))))
    d.text(((px0 + px1) / 2, 300), f"+{n:,}" if lt > ts(S, 1) else "", font=font("black", 64),
           fill=(255, 255, 255), anchor="mm")
    d.text(((px0 + px1) / 2, 360), "followers" if lt > ts(S, 1) else "", font=font("semi", 36), fill=NEON, anchor="mm")
    cards = [("Elite Models", "Can we sign you?", "📸", 1.0), ("Fake account", "@the_real_you (not you)", "⚠", 2.3),
             ("Fake account", "@you_official_2 (not you)", "⚠", 3.0)]
    for k, (a, b, e, off) in enumerate(cards):
        t0 = ts(S, 1, off * (S["te"][1] - S["ts"][1]) / 3.4)
        if lt >= t0 and not red:
            y = 360 + k * 220
            d.line((px1, 520 + k * 60, 1230, y), fill=NEON, width=4)
            show_card(img, msg_card(a, b, e, 860, "dark"), 1660, y, lt, t0)
    if red:
        pin = emoji_sized("📍", 180)
        sc = ease_out_back(prog(lt, ts(S, 2, 0.2), ts(S, 2, 0.6)))
        place(img, pin, (px0 + px1) / 2, 640, scale=max(0.01, sc))
        card = msg_card("Posted publicly", "Your home address", "🏠", 820, "dark")
        show_card(img, card, 1640, 620, lt, ts(S, 2, 0.6))
        return {"tint": (255, 30, 40, int(50 + 40 * math.sin(lt * 10)))}
    return {}


def sc_halo(img, d, lt, S):
    hx, hy = 620, 560
    k = ease_out_cubic(prog(lt, 0.1, 1.0))
    d.arc((hx - 200, hy - 230, hx + 200, hy + 210), -90, -90 + 360 * k, fill=NEON, width=10)
    if k > 0.9:
        d.arc((hx - 340, hy + 260, hx + 340, hy + 760), 200, 340, fill=NEON, width=10)
        for s in (-1, 1):
            d.ellipse((hx + s * 70 - 18, hy - 40, hx + s * 70 + 18, hy - 4), fill=NEON)
        d.arc((hx - 70, hy + 10, hx + 70, hy + 100), 20, 160, fill=NEON, width=10)
    hk = ease_out_back(prog(lt, ts(S, 0, 0.7), ts(S, 0, 1.2)))
    if hk > 0:
        for w_, a in ((40, 50), (22, 110), (10, 255)):
            d.ellipse((hx - 190 * hk, hy - 330 - 46 * hk, hx + 190 * hk, hy - 330 + 46 * hk),
                      outline=(255, 210, 90, a), width=w_)
    if ts(S, 1) <= lt < ts(S, 2):
        labels = ["SMARTER", "KINDER", "MORE TRUSTED"]
        span = S["te"][1] - S["ts"][1]
        for i, lab in enumerate(labels):
            t0 = ts(S, 1, 0.2 + i * span * 0.22)
            v = ease_out_cubic(prog(lt, t0, t0 + 0.7))
            if lt < t0:
                continue
            y = 300 + i * 220
            d.text((1120, y), lab, font=font("black", 60), fill=(230, 255, 250), anchor="lm")
            d.rounded_rectangle((1120, y + 50, 1120 + 760, y + 100), radius=25, outline=(40, 110, 110), width=4)
            d.rounded_rectangle((1120, y + 50, 1120 + max(50, int(760 * 0.85 * v)), y + 100), radius=25, fill=NEON)
            d.text((1920, y + 75), "▲", font=font("black", 56), fill=(110, 255, 140), anchor="mm")
    if lt >= ts(S, 2):
        items = [("☕", "FREE COFFEE"), ("🚶", "SKIPS EVERY LINE"), ("👮", "JUST A WARNING")]
        span = S["te"][2] - S["ts"][2]
        for i, (e, lab) in enumerate(items):
            t0 = ts(S, 2, 0.4 + i * span * 0.28)
            if lt < t0:
                continue
            sc = ease_out_back(prog(lt, t0, t0 + 0.3))
            y = 330 + i * 230
            place(img, emoji_sized(e, 130), 1200, y, scale=max(0.01, sc))
            d.text((1310, y), lab, font=font("black", 62), fill=(230, 255, 250), anchor="lm")
            place(img, emoji_sized("✅", 80), 1990, y, scale=max(0.01, sc))
    return {}


def sc_cafe(img, d, lt, S):
    img.paste(bg("cafe_out"), (0, 0))
    od = ImageDraw.Draw(img, "RGBA")
    if lt > ts(S, 1, -0.2):
        rng = random.Random(5)
        for i in range(14):
            t0 = ts(S, 1, -0.2 + i * 0.12)
            rise = ease_out_back(prog(lt, t0, t0 + 0.4))
            x = 690 + rng.random() * 820
            yb = 680 + (1 - rise) * 400 - rng.random() * 120
            col = (70 + rng.randint(0, 30),) * 3
            od.ellipse((x - 54, yb - 260, x + 54, yb - 150), fill=col)
            od.ellipse((x - 90, yb - 140, x + 90, yb + 120), fill=col)
            if i % 3 == 0:
                od.rounded_rectangle((x + 40, yb - 240, x + 76, yb - 180), radius=6, fill=(240, 240, 250))
    img.paste(bg("cafe"), (0, 0), bg("cafe"))
    for tx in (720, 1580):
        d.rectangle((tx - 18, 840, tx + 18, FLOOR - 20), fill=(70, 46, 36))
        d.ellipse((tx - 150, 800, tx + 150, 860), fill=(120, 80, 58))
    leaving = lt > ts(S, 2, 0.1)
    hx = lerp(470, -300, ease_in_out(prog(lt, ts(S, 2, 0.2), ts(S, 2, 2.0)))) if leaving else 470
    if leaving:
        person(d, hx, FLOOR, 1.0, pose="stand", hair="quiff", hot=1.0, t=lt, seed=1, expr="nervous", look=-1,
               facing=-1, walk=lt * 10)
    else:
        d.rounded_rectangle((330, 820, 560, 860), radius=10, fill=(90, 60, 44))
        person(d, 470, FLOOR, 1.0, pose="sit", hair="quiff", hot=1.0, t=lt, seed=1, chair=(70, 46, 36),
               look=1 if lt > ts(S, 0, 1.2) else 0,
               expr="nervous" if lt > ts(S, 0, 1.6) else "neutral", arms=("down", "coffee"), cup=True)
        d.ellipse((620, 770, 700, 800), fill=(250, 248, 240))
    d.rounded_rectangle((1310, 820, 1540, 860), radius=10, fill=(90, 60, 44))
    person(d, 1420, FLOOR, 0.95, shirt=(236, 120, 160), pose="sit", hair="long", facing=-1, t=lt, seed=2,
           chair=(70, 46, 36),
           expr="love", look=-1 if not leaving else -1, hood=False)
    standing = lt > ts(S, 0, 1.3)
    person(d, 1800, FLOOR, 1.04, shirt=(200, 60, 60), pose="stand" if standing else "sit", hair="cap", facing=-1,
           chair=(70, 46, 36),
           t=lt, seed=9, expr="angry" if standing else "neutral", look=-1, hood=False,
           arms=("down", "point") if standing else ("down", "down"), talk=ts(S, 0, 1.6) < lt < ts(S, 1, 0.2))
    show_bubble(img, "Bro. What's your problem??", 1780, 420, lt, ts(S, 0, 1.5), ts(S, 1, 0.6), tail="right")
    fx = {}
    if lt > ts(S, 1, 0.5) and int(lt * 5) % 4 == 0:
        fx["flash"] = 0.15
    return fx


def sc_living(img, d, lt, S):
    leave = lt > ts(S, 2, 0.1)
    k = ease_in_out(prog(lt, ts(S, 2, 0.2), ts(S, 2, 2.0)))
    if not leave:
        person(d, 1430, FLOOR - 70, 0.98, shirt=(236, 150, 60), pose="sit", hair="cap", facing=-1, t=lt, seed=8,
               expr="nervous", look=-1 if lt < ts(S, 1) else 0, talk=ts(S, 0, 0.7) < lt < ts(S, 0, 2.0))
    else:
        person(d, lerp(1430, 2500, k), FLOOR, 0.98, shirt=(236, 150, 60), pose="stand", hair="cap", facing=1,
               t=lt, seed=8, expr="nervous", walk=lt * 9 if k < 1 else None)
    phone = ts(S, 1) < lt < ts(S, 2, 0.4)
    person(d, 820, FLOOR - 70, 1.0, pose="sit", hair="quiff", hot=1.0, t=lt, seed=1,
           expr="shock" if phone and lt > ts(S, 1, 0.8) else ("sad" if lt > ts(S, 2, 0.8) else "neutral"),
           look=0 if phone else 1, look_y=1 if (phone or lt > ts(S, 2, 0.8)) else 0,
           arms=("down", "phone") if phone else ("down", "down"))
    show_bubble(img, "uh... you look... different, bro", 1420, 430, lt, ts(S, 0, 0.6), ts(S, 1, 0.2), tail="right")
    show_card(img, msg_card("Ex", "hey stranger... u up?", "💔"), 1080, 300, lt, ts(S, 1, 0.6), ts(S, 2, 0.4))
    if leave:
        return {"tint": (10, 10, 40, int(110 * ease_in_out(prog(lt, ts(S, 2, 0.6), te(S, 2)))))}
    return {}


def sc_night(img, d, lt, S):
    r = random.Random(4)
    for _ in range(40):
        x = 1440 + r.random() * 480
        y = 170 + ((r.random() * 400 + lt * 600) % 380)
        d.line((x, y, x - 8, y + 40), fill=(140, 160, 220, 140), width=3)
    lowered = lt > ts(S, 1, 0.8)
    glow_a = 0 if lowered else 70
    if glow_a:
        d.ellipse((780, 350, 1220, 760), fill=(120, 190, 255, glow_a))
    person(d, 1000, FLOOR - 80, 1.0, pose="sit", hair="quiff", hot=0.6, t=lt, seed=1,
           expr="sad" if lt > ts(S, 1) else "tired", look_y=1, arms=("down", "down") if lowered else ("phone", "phone"),
           phone_hand=1)
    n = int(400 * ease_out_cubic(prog(lt, 0.2, te(S, 0))))
    badge = text_sprite(f"{{💬}} {n}", 70, (255, 255, 255), (255, 255, 255), "black", stroke=0, shadow=False)
    S2 = Image.new("RGBA", (badge.width + 30, badge.height + 10), (0, 0, 0, 0))
    ImageDraw.Draw(S2).rounded_rectangle((0, 0, S2.width - 1, S2.height - 1), radius=50, fill=(230, 40, 60, 255))
    S2.alpha_composite(badge, (15, 5))
    place(img, S2, 1330, 330, scale=max(0.01, ease_out_back(prog(lt, 0.1, 0.5))))
    return {"tint": (0, 0, 20, 40)}


def sc_count(img, d, lt, S):
    n0 = te(S, 0, 0.3)
    hot = 1.0
    n = None
    if lt >= n0:
        i = int((lt - n0) / 0.62)
        n = max(1, 10 - i)
        hot = max(0.0, n / 10) * (0.6 + 0.4 * abs(math.sin(lt * 23)))
    pulse = 0.5 + 0.5 * math.cos(((lt - n0) % 0.62) / 0.62 * 2 * math.pi) if n else 0.3
    d.ellipse((1100, 100, 2100, 1100), fill=(255, 40, 60, int(40 + 50 * pulse)))
    person(d, 640, FLOOR, 1.05, pose="stand", hair="quiff", hot=hot, t=lt, seed=1,
           expr="nervous" if n and n > 3 else ("shock" if n else "neutral"), look=1)
    if n:
        st = ((lt - n0) % 0.62)
        s = text_sprite(str(n), 600, (255, 70, 80), (255, 70, 80), glow_col=(255, 50, 60))
        place(img, s, 1600, 600, scale=1 + 0.5 * (1 - ease_out_back(st / 0.25)), alpha=clamp01(st / 0.05))
    end = S["dur"] - 0.45
    if lt > end:
        return {"flash": clamp01((lt - end) / 0.2)}
    return {}


def sc_after(img, d, lt, S):
    return sc_mirror(img, d, lt, S, after=True)


def sc_pizza(img, d, lt, S):
    d.rectangle((840, 830, 1320, 870), fill=(250, 250, 245))
    for i in range(12):
        if i % 2 == 0:
            d.rectangle((840 + i * 40, 830, 880 + i * 40, 870), fill=(220, 60, 60))
    d.rectangle((1060, 870, 1100, FLOOR - 20), fill=(70, 46, 36))
    person(d, 700, FLOOR, 1.0, pose="sit", hair="messy", t=lt, seed=1, look=1, chair=(110, 70, 50),
           expr="laugh" if (lt % 2.4) < 1.2 else "happy", arms=("down", "eat"))
    person(d, 1480, FLOOR, 0.98, shirt=(236, 150, 60), pose="sit", hair="cap", facing=-1, t=lt, seed=8, look=-1,
           chair=(110, 70, 50),
           expr="laugh" if (lt % 2.4) >= 1.2 else "happy", arms=("eat", "down"))
    place(img, emoji_sized("🍕", 150), 1080, 790)
    show_bubble(img, "so... you're normal again? lol", 1460, 430, lt, ts(S, 0, 0.3), ts(S, 1, 0.2), tail="right")
    show_bubble(img, "best day ever.", 720, 430, lt, ts(S, 1, 0.4), 99)
    return {}


def sc_cta(img, d, lt, S):
    d.rectangle((0, 0, WW // 2, WH), fill=(18, 22, 48))
    d.rectangle((WW // 2, 0, WW, WH), fill=(232, 176, 92))
    d.ellipse((WW * 0.75 - 420, 120, WW * 0.75 + 420, 1000), fill=(255, 214, 130))
    d.line((WW // 2, 0, WW // 2, WH), fill=(255, 255, 255), width=8)
    person(d, 540, FLOOR, 1.0, pose="stand", hair="quiff", hot=1.0, t=lt, seed=1, expr="smug")
    person(d, 1500, FLOOR, 1.0, pose="stand", hair="messy", t=lt, seed=3, expr="happy", arms=("down", "wave"))
    person(d, 1800, FLOOR, 0.96, shirt=(236, 150, 60), pose="stand", hair="cap", t=lt, seed=8, expr="laugh",
           facing=-1)
    for x, lab in ((540, "24H OF FAME"), (1620, "REAL LIFE")):
        d.rounded_rectangle((x - 300, 70, x + 300, 190), radius=26, fill=(255, 255, 252))
        d.text((x, 130), lab, font=font("black", 64), fill=INK, anchor="mm")
    return {}


SCENES = [
    dict(fn=sc_mirror, bg="bathroom", tod="7:00 AM", timer=0, timer_from=2, lines=[
        "You wake up at seven a.m., walk to the mirror, and freeze.",
        "Overnight, you became the most attractive man in the world.",
        "And you only have twenty-four hours."]),
    dict(fn=sc_bus, bg=None, tod="8:15 AM", timer=1.25, lines=[
        "On the bus, people stop scrolling their phones, and stare.",
        "Someone secretly takes a picture of you.",
        "By nine o'clock, it has two million views."]),
    dict(fn=sc_office, bg="office", tod="9:30 AM", timer=2.5, lines=[
        "At work, your boss laughs at every single joke you make.",
        "Coworkers who ignored you for a year bring you coffee.",
        "But nobody actually listens to your ideas. They just stare."]),
    dict(fn=sc_phone, bg="phone", tod="12:00 PM", timer=5, lines=[
        "By lunch, your phone won't stop buzzing.",
        "Fifty thousand new followers. A modeling agency. Fake accounts using your face.",
        "Then a stranger posts your home address online."]),
    dict(fn=sc_halo, bg="phone", tod="2:00 PM", timer=7, lines=[
        "Psychologists call this the halo effect.",
        "Good-looking people get judged as smarter, kinder, and more trustworthy, even when they're not.",
        "So you get free coffee, skip every line, and a cop lets you go with just a warning."]),
    dict(fn=sc_cafe, bg=None, tod="4:00 PM", timer=9, lines=[
        "At a cafe, a guy gets angry, because his girlfriend can't stop looking at you.",
        "Outside, a crowd is pressing against the window.",
        "You sneak out through the kitchen."]),
    dict(fn=sc_living, bg="living", tod="7:00 PM", timer=12, lines=[
        "At home, even your best friend acts weird around you.",
        "Your ex texts you for the first time in two years.",
        "And you realize, people don't see you anymore. Only your face."]),
    dict(fn=sc_night, bg="night", tod="11:00 PM", timer=16, lines=[
        "That night, you have four hundred unread messages.",
        "Not one of them asks how you're actually doing."]),
    dict(fn=sc_count, bg="dark", tod="6:59 AM", timer="count", lines=[
        "Six fifty-nine. The final seconds."], extra=10 * 0.62 + 0.6),
    dict(fn=sc_after, bg="bathroom", tod="NEXT MORNING", timer=None, lines=[
        "You look in the mirror. Your old face is back.",
        "In two days, the internet forgets you.",
        "But your best friend texts: pizza later? Like normal?"]),
    dict(fn=sc_pizza, bg="pizza", tod="THAT NIGHT", timer=None, lines=[
        "Turns out, being wanted for your face is easy.",
        "Being liked for who you are is the real flex."]),
    dict(fn=sc_cta, bg=None, tod=None, timer=None, lines=[
        "So, would you take the twenty-four hours? Tell me in the comments."], extra=1.2),
]


# ======================================================================================
# Narration / timeline
# ======================================================================================
def trim(sig, thr=0.012):
    idx = np.where(np.abs(sig) > thr)[0]
    if len(idx) == 0:
        return sig
    a, b = max(0, idx[0] - int(0.03 * SR)), min(len(sig), idx[-1] + int(0.06 * SR))
    return sig[a:b]


def synth_voice(lines, kokoro_dir, cache_dir):
    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        print("kokoro-onnx not installed -> rendering without narration")
        return None
    mp_ = os.path.join(kokoro_dir, "kokoro-v1.0.onnx")
    vp = os.path.join(kokoro_dir, "voices-v1.0.bin")
    if not (os.path.exists(mp_) and os.path.exists(vp)):
        print(f"Kokoro model files not found in {kokoro_dir} -> rendering without narration")
        return None
    os.makedirs(cache_dir, exist_ok=True)
    k = None
    out = []
    for text in lines:
        key = hashlib.md5(f"{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:16]
        p = os.path.join(cache_dir, key + ".npy")
        if os.path.exists(p):
            out.append(np.load(p))
            continue
        if k is None:
            k = Kokoro(mp_, vp)
        s, sr = k.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        assert sr == SR
        s = trim(np.asarray(s, np.float32))
        np.save(p, s)
        out.append(s)
        print("  tts:", text)
    return out


def chunk_caption(text):
    words = text.replace("—", " ").split()
    chunks, cur = [], []
    for w_ in words:
        cur.append(w_)
        joined = " ".join(cur)
        if len(cur) >= 3 or len(joined) >= 13 or w_.endswith((",", ".", "?", "!", ":")):
            chunks.append(joined); cur = []
    if cur:
        chunks.append(" ".join(cur))
    return chunks


def build_timeline(voices):
    t = 0.35
    tl = []
    caps = []
    voice_at = []
    li = 0
    for sc in SCENES:
        start = t
        tsl, tel = [], []
        for line in sc["lines"]:
            dur = len(voices[li]) / SR if voices else max(1.2, len(line.split()) / 2.7)
            tsl.append(t - start)
            tel.append(t - start + dur)
            voice_at.append((li, t))
            chunks = chunk_caption(line)
            wts = [len(c) + 3 for c in chunks]
            tot = sum(wts)
            ct = t
            for c, wgt in zip(chunks, wts):
                cd = dur * wgt / tot
                caps.append((ct, ct + cd, c.upper().strip(",.:")))
                ct += cd
            t += dur + 0.22
            li += 1
        t += sc.get("extra", 0.0) + 0.25
        tl.append(dict(start=start, dur=t - start, ts=tsl, te=tel))
    return tl, caps, voice_at, t


# ======================================================================================
# Frame composition
# ======================================================================================
def plaid():
    yy, xx = np.mgrid[0:H, 0:W]
    P = 270
    bh = (yy % P) < 100
    bv = (xx % P) < 100
    hatch = ((xx + yy) % 12) < 5
    base = np.array([232, 204, 166], np.float32)
    mid = np.array([198, 152, 108], np.float32)
    dark = np.array([164, 116, 80], np.float32)
    arr = np.zeros((H, W, 3), np.float32) + base
    either = bh ^ bv
    arr[either & hatch] = mid
    arr[either & ~hatch] = (base + mid) / 2
    arr[bh & bv] = dark
    thin = ((yy % P) // 3 == 60) | ((xx % P) // 3 == 60)
    arr[thin] = arr[thin] * 0.85
    thin2 = ((yy % P) // 3 == 75) | ((xx % P) // 3 == 75)
    arr[thin2] = np.minimum(255, arr[thin2] * 1.12)
    return Image.fromarray(arr.astype(np.uint8))


def label_box(text, size, kind="semi", maxw=980):
    f = font(kind, size)
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if f.getlength(test) > maxw - 60 and cur:
            lines.append(cur); cur = w_
        else:
            cur = test
    lines.append(cur)
    lh = int(size * 1.25)
    bw = int(max(f.getlength(l) for l in lines) + 56)
    bh = int(lh * len(lines) + size * 0.6)
    im = Image.new("RGBA", (bw * 2, bh * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, bw * 2 - 1, bh * 2 - 1), radius=22, fill=(255, 255, 255, 255))
    im = im.resize((bw, bh), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        d.text((bw / 2, size * 0.3 + i * lh + lh / 2), l, font=f, fill=(10, 10, 10), anchor="mm")
    return im


_STATIC = None
_VIGN = None


def static_frame():
    global _STATIC, _VIGN
    if _STATIC is None:
        im = plaid()
        tb = label_box(TITLE, 44)
        sh = glow(tb, 10, (0, 0, 0), 0.4)
        paste(im, sh, (W - sh.width) / 2, 330 - sh.height / 2)
        pb = label_box(PART, 54)
        sh = glow(pb, 10, (0, 0, 0), 0.4)
        paste(im, sh, (W - sh.width) / 2, PANEL_Y + PH + 95 - sh.height / 2)
        _STATIC = im
        yy, xx = np.mgrid[0:PH, 0:PW].astype(np.float32)
        r = np.hypot((xx - PW / 2) / (PW / 2), (yy - PH / 2) / (PH / 2))
        _VIGN = np.clip(1.05 - 0.38 * np.clip(r - 0.45, 0, None) ** 1.4, 0, 1)[:, :, None]
    return _STATIC


def tag(text, size=30, fg=(10, 10, 10)):
    return _tag(text, size, fg)


@functools.lru_cache(maxsize=256)
def _tag(text, size, fg):
    s = text_sprite(text, size, fg, fg, "black", stroke=0, shadow=False, maxw=900)
    im = Image.new("RGBA", (s.width + 10, s.height - size // 4), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=12, fill=(255, 255, 255, 235))
    paste(im, s, 5, -size // 8)
    return im


TL = CAPS = None
TOTAL = 0.0


def init_worker(tl, caps, total):
    global TL, CAPS, TOTAL
    TL, CAPS, TOTAL = tl, caps, total


def scene_at(t):
    k = 0
    for i, s in enumerate(TL):
        if t >= s["start"]:
            k = i
    return k


def timer_text(k, lt):
    sc, S = SCENES[k], TL[k]
    if sc["timer"] is None:
        return None
    if sc["timer"] == "count":
        n0 = S["te"][0] + 0.3
        if lt < n0:
            return "00:00:10", True
        n = max(0, 10 - int((lt - n0) / 0.62))
        if lt > S["dur"] - 0.45:
            n = 0
        return f"00:00:{n:02d}", True
    if "timer_from" in sc and lt < S["ts"][sc["timer_from"]]:
        return None
    if "timer_from" in sc:
        lt -= S["ts"][sc["timer_from"]]
    left = int(86400 - sc["timer"] * 3600 - lt)
    return f"{left // 3600:02d}:{left % 3600 // 60:02d}:{left % 60:02d}", False


def render_panel(t):
    k = scene_at(t)
    sc, S = SCENES[k], TL[k]
    lt = t - S["start"]
    if sc["bg"]:
        img = bg(sc["bg"]).copy()
    else:
        img = Image.new("RGB", (WW, WH), (200, 200, 200))
    d = ImageDraw.Draw(img, "RGBA")
    fx = sc["fn"](img, d, lt, S) or {}
    if "tint" in fx:
        img = Image.alpha_composite(img.convert("RGBA"), Image.new("RGBA", img.size, fx["tint"])).convert("RGB")
    # slow push-in camera
    z = 1.0 + 0.06 * ease_in_out(lt / max(1.0, S["dur"]))
    cw, ch = WW / z, WH / z
    x0, y0 = (WW - cw) / 2, (WH - ch) / 2
    pan = img.resize((PW, PH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
    arr = np.asarray(pan, np.float32) * _VIGN
    pan = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if fx.get("flash"):
        pan = Image.blend(pan, Image.new("RGB", pan.size, (255, 255, 255)), min(1.0, fx["flash"]))
    # tags
    if sc["tod"]:
        tg = tag(sc["tod"], 28)
        paste(pan, tg, 18, 16)
    tt = timer_text(k, lt)
    if tt:
        txt, red = tt
        tg = tag("{⏳} " + txt, 30, (215, 30, 40) if red or txt.startswith("0") else (10, 10, 10))
        paste(pan, tg, PW - tg.width - 18, 16)
    # captions
    for c0, c1, txt in CAPS:
        if c0 <= t < c1:
            cs = text_sprite(txt, 64, (255, 255, 255), (255, 255, 255), "bold", stroke=3, shadow=True, maxw=1000)
            sc_ = 0.85 + 0.15 * ease_out_back((t - c0) / 0.12)
            place(pan, cs, PW / 2, PH * 0.80, scale=sc_)
            break
    # scene transitions (quick dip)
    fade = 1.0
    if lt < 0.12 and k > 0:
        fade = lt / 0.12
    if S["dur"] - lt < 0.08 and k < len(TL) - 1:
        fade = min(fade, (S["dur"] - lt) / 0.08)
    if fade < 1:
        pan = Image.blend(Image.new("RGB", pan.size, (0, 0, 0)), pan, fade)
    return pan


def render_frame(t):
    fr = static_frame().copy()
    fr.paste(render_panel(t), (0, PANEL_Y))
    return fr


def render_bytes(i):
    return render_frame(i / FPS).tobytes()


# ======================================================================================
# Audio
# ======================================================================================
def build_audio(voices, voice_at, total):
    n = int(total * SR) + SR
    out = np.zeros(n)
    music = np.zeros(n)
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
        m = int(sec * SR)
        spec = np.fft.rfft(rng.standard_normal(m))
        fr = np.fft.rfftfreq(m, 1 / SR)
        spec[(fr < lo) | (fr > hi)] = 0
        s = np.fft.irfft(spec, m)
        return s / (np.abs(s).max() + 1e-9)

    # --- mellow storytelling bed (piano arps + pad + soft kick)
    chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]
    beat = 60 / 92
    b = 0
    tpos = 0.0
    while tpos < total:
        bar = (b // 4) % 4
        ch = chords[bar]
        for e in range(2):
            f = ch[(b * 2 + e) % 3] * (2 if e else 1)
            add(music, tone(f, 1.2, dec=2.5), tpos + e * beat / 2, 0.16)
        if b % 4 == 0:
            add(music, tone(ch[0] / 2, beat * 4, (1, 0.3), 0.8), tpos, 0.22)
        x = tt(0.25)
        add(music, np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-x * 25)) / SR) * np.exp(-x * 12), tpos, 0.25)
        b += 1
        tpos += beat

    # --- narration
    venv = np.zeros(n)
    if voices:
        for li, at in voice_at:
            add(out, voices[li], at, 1.0)
            add(venv, np.ones(len(voices[li])), at)
    k = int(0.25 * SR)
    venv = np.convolve(venv, np.ones(k) / k, mode="same")
    music *= 1 - 0.55 * np.clip(venv, 0, 1)

    # --- SFX
    def whoosh(sec=0.4):
        x = tt(sec)
        return bandnoise(sec, 500, 5000) * np.sin(np.pi * x / sec) ** 2

    def click():
        x = tt(0.03)
        return np.sin(2 * np.pi * 2600 * x) * np.exp(-x * 200)

    def ping():
        return tone(1568, 0.4, (1, 0.3), 9) + np.concatenate([np.zeros(int(0.09 * SR)), tone(2093, 0.31, (1, 0.3), 9)])

    sfx = np.zeros(n)
    for s in TL[1:]:
        add(sfx, whoosh(), s["start"] - 0.15, 0.18)
    S = TL[1]
    add(sfx, bandnoise(0.08, 1500, 8000) * np.exp(-tt(0.08) * 50), S["start"] + S["ts"][1] + 1.0, 0.5)
    S = TL[3]
    x = tt(0.4)
    for b_ in (0.1, 0.7, 1.3):
        add(sfx, np.sign(np.sin(2 * np.pi * 150 * x)) * (np.sin(2 * np.pi * 16 * x) > 0) * 0.3, S["start"] + b_, 0.5)
    for off in (0.0, 1.2, 2.3, 3.0):
        add(sfx, ping(), S["start"] + S["ts"][1] + off, 0.25)
    for r in range(4):
        add(sfx, tone(880, 0.22, (1, 0.5, 0.3), 2) - tone(660, 0.22, (1, 0.5), 2) * 0, S["start"] + S["ts"][2] + 0.2 + r * 0.3, 0.18)
    S = TL[5]
    crowd = bandnoise(S["dur"] - S["ts"][1], 200, 1800) * 0.4
    crowd *= np.minimum(1, tt(len(crowd) / SR) / 0.8)
    add(sfx, crowd, S["start"] + S["ts"][1], 0.35)
    for idx, off in ((6, 1), (9, 2)):
        S = TL[idx]
        add(sfx, ping(), S["start"] + S["ts"][off] + (0.6 if idx == 6 else 0.9), 0.3)
    S = TL[8]
    n0 = S["start"] + S["te"][0] + 0.3
    for i in range(10):
        add(sfx, click(), n0 + i * 0.62, 0.7)
        add(sfx, tone(330 + i * 25, 0.25, (1, 0.5), 9), n0 + i * 0.62, 0.25)
    x = tt(1.4)
    add(sfx, np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-x * 5)) / SR) * np.exp(-x * 3), S["start"] + S["dur"] - 0.45, 0.8)
    music[int((S["start"]) * SR):int((S["start"] + S["dur"]) * SR)] *= 0.25

    mix = out + music * 0.9 + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.92
    f = int(0.5 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    return mix


def write_wav(path, sig):
    pcm = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ======================================================================================
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "attractive_24h_story.mp4"))
    ap.add_argument("--kokoro-dir", default=os.environ.get("KOKORO_DIR", os.path.join(HERE, "kokoro")))
    ap.add_argument("--preview", help="comma separated times: save PNG stills only")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    args = ap.parse_args()

    lines = [l for sc in SCENES for l in sc["lines"]]
    voices = synth_voice(lines, args.kokoro_dir, os.path.join(HERE, ".tts_cache"))
    tl, caps, voice_at, total = build_timeline(voices)
    init_worker(tl, caps, total)
    print(f"Video length: {total:.1f}s")
    for i, s in enumerate(tl):
        print(f"  scene {i:2d}  {s['start']:6.2f}s  ({s['dur']:.2f}s)")

    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for x in args.preview.split(","):
            p = os.path.join(HERE, "preview", f"story_{float(x):06.2f}.png")
            render_frame(float(x)).save(p)
            print("saved", p)
        return

    wav = os.path.splitext(args.out)[0] + "_audio.wav"
    write_wav(wav, build_audio(voices, voice_at, total))
    nfr = int(total * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", args.out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    static_frame()
    t0 = time.time()
    with mp.Pool(args.workers, initializer=init_worker, initargs=(tl, caps, total)) as pool:
        for i, buf in enumerate(pool.imap(render_bytes, range(nfr), chunksize=6)):
            ff.stdin.write(buf)
            if i % 150 == 0:
                print(f"  frame {i}/{nfr}  ({time.time() - t0:.0f}s)", flush=True)
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    print(f"Done -> {args.out}")


if __name__ == "__main__":
    main()
