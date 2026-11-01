#!/usr/bin/env python3
"""
"What If GTA 6 Was Delayed For Another Year?"  (cinematic POV Short, ~1:45)

Style: full-screen blocky low-poly 3D POV scenes (pov3d.py) with minimal serif typography:
a small letter-spaced kicker, a big serif chapter label ("MINUTE 3", "DAY 1", "MONTH 6")
and one italic caption per narration line. Narrated by Mike, with ambient music + sound design.

Facts used (checked Nov 1, 2026): GTA 6 is set for Nov 19, 2026 on PS5 / Xbox Series X|S,
no PC version at launch, pre-orders open since June 2026; it was delayed twice before
(fall 2025 -> May 26, 2026 -> Nov 19, 2026) and Take-Two's stock fell after both delays;
GTA 5 launched Sept 17, 2013 and has sold over 200 million copies; a 2022 hack leaked ~90 videos
of early footage; trailer 1 passed 90 million views in 24 hours; GTA games are rated 17+.
Everything after the delay announcement is a hypothetical "what if".

Usage:
  python youtube_short/gta6_delay_short.py --tts elevenlabs   # -> youtube_short/gta6_delay_story.mp4
  python youtube_short/gta6_delay_short.py --preview 2,10,40  # PNG stills only
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
import pov3d as P  # noqa: E402
import story_short as base  # noqa: E402
from make_short import clamp01, ease_in_out, ease_out_back, ease_out_cubic, lerp, prog  # noqa: E402
from make_short import font as uf  # noqa: E402
from thoughts_short import smooth  # noqa: E402

W, H, FPS, SR = P.W, P.H, 30, 24000
NARRATOR = os.environ.get("ELEVENLABS_VOICE_ID", "zfc8CJQpe8Kqyl0vvCzo")   # Mike - 2D & 3D POV/Storytime
TITLE = "What if GTA 6 was delayed for another year?"
WHITE = (255, 255, 255)


def N(text, cap=None, show=True):
    return dict(text=text, cap=cap or text, show=show)


# ======================================================================================
# Textures (PIL images shown on screens, posters and phones)
# ======================================================================================
def vgrad_img(w, h, top, bot):
    yy = np.linspace(0, 1, h)[:, None, None]
    arr = np.array(top, float) * (1 - yy) + np.array(bot, float) * yy
    return Image.fromarray(np.repeat(arr, w, axis=1).astype(np.uint8))


def wrap(text, f, maxw):
    lines, cur = [], ""
    for w_ in text.split():
        t = (cur + " " + w_).strip()
        if f.getlength(t) > maxw and cur:
            lines.append(cur)
            cur = w_
        else:
            cur = t
    lines.append(cur)
    return lines


def sunset_art(w, h, palms=True, city=True):
    im = vgrad_img(w, h, (70, 36, 120), (255, 150, 100))
    d = ImageDraw.Draw(im)
    d.ellipse((w * 0.32, h * 0.38, w * 0.68, h * 0.38 + w * 0.36), fill=(255, 214, 140))
    d.rectangle((0, h * 0.66, w, h), fill=(40, 60, 120))
    for i in range(8):
        y = h * 0.68 + i * h * 0.035
        d.line((w * 0.36 + i * 6, y, w * 0.64 - i * 6, y), fill=(255, 190, 130), width=max(2, h // 160))
    if city:
        r = random.Random(4)
        x = 0
        while x < w:
            bw, bh = r.randint(w // 30, w // 14), r.randint(h // 12, h // 4)
            d.rectangle((x, h * 0.66 - bh, x + bw, h * 0.66), fill=(60, 30, 80))
            x += bw + r.randint(2, 8)
    if palms:
        for px, s in ((w * 0.1, 1.0), (w * 0.86, 1.2), (w * 0.72, 0.7)):
            base_y = h * 0.9
            top = (px + 18 * s, base_y - h * 0.42 * s)
            d.line((px, base_y, top[0], top[1]), fill=(26, 16, 30), width=int(10 * s))
            for a in range(0, 360, 45):
                ex = top[0] + math.cos(math.radians(a)) * 80 * s
                ey = top[1] + math.sin(math.radians(a)) * 34 * s + 20 * s
                d.line((top[0], top[1], ex, ey), fill=(26, 16, 30), width=int(9 * s))
    return im


@functools.lru_cache(maxsize=1)
def T_city():
    w, h = 1400, 800
    im = vgrad_img(w, h, (10, 12, 32), (46, 34, 78))
    d = ImageDraw.Draw(im)
    r = random.Random(3)
    d.ellipse((1080, 90, 1150, 160), fill=(240, 236, 220))
    x = 0
    while x < w:
        bw, bh = r.randint(50, 130), r.randint(160, 600)
        d.rectangle((x, h - bh, x + bw, h), fill=(16, 18, 34))
        for yy in range(h - bh + 12, h - 10, 22):
            for xx in range(x + 8, x + bw - 10, 16):
                if r.random() < 0.38:
                    d.rectangle((xx, yy, xx + 7, yy + 10),
                                fill=r.choice(((255, 214, 140), (255, 236, 190), (140, 190, 255))))
        x += bw + r.randint(2, 10)
    return im


CHAT_OK = [("leo", "still on time right??"), ("mia_", "no delay pls"), ("kev", "W"), ("dre", "nov 19 lets gooo"),
           ("sam", "trust"), ("jj", "10 days")]
CHAT_BAD = [("leo", "NOOOO"), ("mia_", "ANOTHER YEAR"), ("kev", "L"), ("dre", "im crying"), ("sam", "bro..."),
            ("jj", "2027??"), ("tay", "refund"), ("max", "not again")]


@functools.lru_cache(maxsize=96)
def T_stream(step, delayed):
    w, h = 960, 600
    im = Image.new("RGB", (w, h), (12, 15, 32))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 66), fill=(22, 28, 56))
    d.ellipse((22, 21, 46, 45), fill=(235, 50, 50))
    d.text((58, 33), "LIVE", font=uf("black", 28), fill=WHITE, anchor="lm")
    d.text((146, 33), "Q2 FY2027 Earnings Call", font=uf("semi", 26), fill=(200, 210, 240), anchor="lm")
    d.rectangle((18, 84, 650, 520), fill=(30, 36, 70))
    d.rectangle((18, 400, 650, 520), fill=(24, 28, 56))
    d.rectangle((300, 196, 368, 266), fill=(196, 160, 132))
    d.rectangle((292, 186, 376, 210), fill=(60, 44, 36))
    d.rectangle((268, 268, 400, 400), fill=(40, 46, 74))
    d.rectangle((236, 330, 432, 440), fill=(58, 64, 100))
    rng = random.Random(step)
    for i in range(26):
        hh = 4 + rng.random() * (32 if not delayed else 14)
        d.rectangle((40 + i * 23, 476 - hh, 52 + i * 23, 476 + hh), fill=(90, 200, 255))
    if delayed:
        d.rectangle((18, 318, 650, 420), fill=(200, 30, 40))
        d.text((36, 344), "GTA VI", font=uf("black", 30), fill=WHITE, anchor="lm")
        d.text((36, 390), "NEW RELEASE DATE: NOVEMBER 2027", font=uf("black", 29), fill=WHITE, anchor="lm")
    else:
        d.rectangle((18, 360, 650, 420), fill=(30, 70, 160))
        d.text((36, 390), "Q2 FISCAL 2027 RESULTS", font=uf("black", 28), fill=WHITE, anchor="lm")
    d.rectangle((668, 84, 942, 520), fill=(18, 22, 44))
    d.text((684, 108), "LIVE CHAT", font=uf("black", 22), fill=(150, 160, 200), anchor="lm")
    msgs = CHAT_BAD if delayed else CHAT_OK
    for i in range(8):
        name, txt = msgs[(step + i) % len(msgs)]
        y = 136 + i * 46
        f1 = uf("black", 20)
        d.text((684, y), name, font=f1, fill=(255, 120, 120) if delayed else (120, 200, 255))
        d.text((684 + f1.getlength(name) + 10, y), txt, font=uf("semi", 20), fill=(230, 230, 240))
    d.text((24, 560), "812K watching", font=uf("semi", 22), fill=(150, 160, 200), anchor="lm")
    return im


@functools.lru_cache(maxsize=40)
def T_chart(step):
    k = step / 30
    w, h = 960, 600
    im = Image.new("RGB", (w, h), (10, 12, 22))
    d = ImageDraw.Draw(im)
    d.text((40, 52), "TTWO", font=uf("black", 46), fill=WHITE, anchor="lm")
    d.text((196, 54), "Take-Two Interactive · after hours", font=uf("semi", 24), fill=(150, 160, 190), anchor="lm")
    x0, x1, y0, y1 = 50, 910, 130, 540
    for gy in range(y0, y1 + 1, 82):
        d.line((x0, gy, x1, gy), fill=(30, 34, 52), width=2)
    rng = random.Random(9)
    n = 140
    pts = []
    for i in range(n):
        t = i / (n - 1)
        v = rng.uniform(-1.2, 1.2) + 0.8 * math.sin(i * 0.2)
        if t > 0.72:
            v -= 13 * ((t - 0.72) / 0.28) ** 0.7
        pts.append(v)
    lo, hi = min(pts), max(pts)

    def pt(i):
        return x0 + (x1 - x0) * i / (n - 1), y0 + 20 + (y1 - y0 - 40) * (hi - pts[i]) / (hi - lo)
    m = max(2, int(n * k))
    line = [pt(i) for i in range(m)]
    red = m > n * 0.73
    d.polygon(line + [(line[-1][0], y1), (line[0][0], y1)], fill=(64, 22, 30) if red else (16, 48, 34))
    d.line(line, fill=(240, 60, 70) if red else (60, 220, 120), width=6)
    if red:
        drop = min(11.4, 11.4 * (m - n * 0.72) / (n * 0.28))
        d.text((910, 54), f"-{drop:.1f}%", font=uf("black", 56), fill=(240, 60, 70), anchor="rm")
    return im


FLOOD = [("TRENDING", "#1 worldwide: GTA 6 delayed"), ("Marcus", "bro."), ("Alex", "ANOTHER YEAR??"),
         ("Sam", "i literally preordered"), ("Group chat", "we'll be 30 before gta 6"), ("Jay", "nah this cant be real"),
         ("Mom", "why are you screaming")]
ICON = {"NEWS": (220, 40, 50), "TRENDING": (30, 30, 34), "Mom": (240, 120, 160), "Group chat": (60, 200, 120)}


def notif(d, y, app, body, w=540):
    f = uf("semi", 28)
    lines = wrap(body, f, w - 150)
    hh = 74 + 38 * len(lines)
    d.rounded_rectangle((22, y, w - 22, y + hh), radius=28, fill=(238, 238, 244))
    d.rounded_rectangle((42, y + 22, 92, y + 72), radius=12, fill=ICON.get(app, (70, 130, 240)))
    d.text((108, y + 36), app, font=uf("black", 26), fill=(30, 30, 40), anchor="lm")
    d.text((w - 44, y + 36), "now", font=uf("semi", 22), fill=(120, 120, 130), anchor="rm")
    for i, l in enumerate(lines):
        d.text((108, y + 64 + i * 38), l, font=f, fill=(40, 40, 50))
    return y + hh + 14


@functools.lru_cache(maxsize=96)
def T_phone(mode, step):
    w, h = 540, 1100
    if mode == "preorder":
        return T_store_app(step)
    im = vgrad_img(w, h, (46, 32, 96), (14, 12, 34))
    d = ImageDraw.Draw(im)
    tt_, dd_ = ("4:43", "Monday, November 9") if mode in ("delay", "flood") else ("11:59", "Thursday, November 18")
    d.text((w / 2, 196), tt_, font=uf("bold", 150), fill=WHITE, anchor="mm")
    d.text((w / 2, 304), dd_, font=uf("semi", 30), fill=(220, 220, 240), anchor="mm")
    if mode == "delay":
        items = [("NEWS", "Breaking: GTA 6 has been delayed to November 2027.")] if step > 0 else []
    elif mode == "flood":
        items = FLOOD[:min(len(FLOOD), 1 + step // 2)][::-1]
    elif mode == "mom":
        items = [("Mom", "go to sleep. NOW.")] if step > 0 else []
    else:
        items = [("YouTube", "NEW: GTA 6 Trailer 3")] if step > 0 else []
    y = 370
    for app, body in items:
        y = notif(d, y, app, body)
        if y > h - 140:
            break
    d.rounded_rectangle((w / 2 - 70, h - 34, w / 2 + 70, h - 26), radius=4, fill=(230, 230, 240))
    return im


def T_store_app(step):
    w, h = 540, 1100
    im = Image.new("RGB", (w, h), (16, 18, 26))
    d = ImageDraw.Draw(im)
    d.text((30, 90), "Pre-orders", font=uf("black", 42), fill=WHITE, anchor="lm")
    im.paste(sunset_art(492, 280), (24, 140))
    d.text((40, 470), "GTA 6", font=uf("black", 46), fill=WHITE, anchor="lm")
    d.text((40, 524), "Release date: November 2027", font=uf("semi", 28), fill=(255, 200, 120), anchor="lm")
    d.text((40, 566), "Status: pre-ordered", font=uf("semi", 26), fill=(150, 156, 170), anchor="lm")
    d.rounded_rectangle((24, 690, 516, 780), radius=20, outline=(130, 130, 145), width=3)
    d.text((w / 2, 735), "Cancel pre-order", font=uf("bold", 32), fill=(200, 200, 210), anchor="mm")
    pressed = step >= 20
    d.rounded_rectangle((24, 810, 516, 900), radius=20, fill=(60, 140, 255) if pressed else (40, 100, 210))
    d.text((w / 2, 855), "Keep pre-order", font=uf("bold", 32), fill=WHITE, anchor="mm")
    if pressed:
        d.text((w / 2, 960), "Keeping it. Obviously.", font=uf("semi", 28), fill=(120, 220, 140), anchor="mm")
    return im


@functools.lru_cache(maxsize=1)
def T_poster():
    w, h = 600, 900
    im = sunset_art(w, h)
    d = ImageDraw.Draw(im)
    for dx, dy, col in ((5, 6, (40, 20, 40)), (0, 0, WHITE)):
        d.text((w / 2 + dx, 230 + dy), "GTA 6", font=uf("black", 150), fill=col, anchor="mm")
    d.text((w / 2, 380), "NOVEMBER 19", font=uf("black", 62), fill=WHITE, anchor="mm")
    d.rounded_rectangle((150, 790, 450, 856), radius=30, fill=(255, 255, 255))
    d.text((w / 2, 823), "PRE-ORDER NOW", font=uf("black", 30), fill=(200, 60, 90), anchor="mm")
    return im


@functools.lru_cache(maxsize=1)
def T_sign():
    w, h = 620, 400
    im = Image.new("RGB", (w, h), (250, 250, 244))
    d = ImageDraw.Draw(im)
    d.text((w / 2, 110), "NEW RELEASE DATE", font=uf("black", 44), fill=(40, 40, 46), anchor="mm")
    d.text((w / 2, 250), "November 2027", font=P._font(P.SERIF_I, 92, 600), fill=(200, 30, 40), anchor="mm")
    d.line((120, 330, 500, 330), fill=(200, 30, 40), width=6)
    return im


MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


@functools.lru_cache(maxsize=40)
def T_board(step):
    k = step / 30
    w, h = 1100, 620
    im = Image.new("RGB", (w, h), (246, 247, 244))
    d = ImageDraw.Draw(im)
    d.text((40, 56), "RELEASE PLAN 2027", font=uf("black", 46), fill=(40, 46, 70), anchor="lm")
    x0, cw = 40, 80
    for i, m in enumerate(MONTHS):
        x = x0 + i * cw
        d.text((x + cw / 2, 140), m, font=uf("bold", 24), fill=(80, 86, 110), anchor="mm")
        d.line((x, 160, x, 560), fill=(210, 212, 220), width=2)

    def sticky(cx, cy, txt, col, rot=0):
        s = Image.new("RGBA", (150, 110), col + (255,))
        ImageDraw.Draw(s).text((75, 55), txt, font=uf("black", 24), fill=(30, 30, 30), anchor="mm")
        s = s.rotate(rot, expand=True, resample=Image.BICUBIC)
        im.paste(s, (int(cx - s.width / 2), int(cy - s.height / 2)), s)
    sticky(x0 + 2.5 * cw, 260, "Racing", (150, 220, 255), -3)
    sticky(x0 + 5.5 * cw, 400, "Shooter", (190, 240, 170), 4)
    gx = lerp(-100, x0 + 10.5 * cw, ease_out_cubic(clamp01(k / 0.35)))
    ox = lerp(x0 + 10.5 * cw, w - 70, ease_in_out(clamp01((k - 0.4) / 0.5)))
    sticky(ox, 420, "OUR GAME", (255, 230, 90), 3 if k < 0.4 else -6)
    sticky(gx, 270, "GTA 6", (255, 120, 120), -2)
    if k > 0.6:
        d.line((x0 + 10.5 * cw + 40, 470, ox - 60, 470), fill=(220, 40, 40), width=6)
        d.text((w - 70, 520), "2028?", font=uf("black", 40), fill=(220, 40, 40), anchor="mm")
    return im


@functools.lru_cache(maxsize=1)
def T_leak():
    w, h = 960, 600
    im = Image.new("RGB", (w, h), (14, 10, 12))
    d = ImageDraw.Draw(im)
    d.text((30, 40), "/clips   (90 files)", font=uf("bold", 28), fill=(200, 190, 190), anchor="lm")
    r = random.Random(5)
    for i in range(9):
        x, y = 30 + (i % 3) * 305, 80 + (i // 3) * 165
        th = sunset_art(290, 150, palms=r.random() < 0.6, city=True).filter(ImageFilter.GaussianBlur(3))
        im.paste(th, (x, y))
        d.polygon([(x + 130, y + 55), (x + 130, y + 95), (x + 165, y + 75)], fill=(255, 255, 255))
    ban = Image.new("RGBA", (1300, 120), (220, 30, 40, 235))
    ImageDraw.Draw(ban).text((650, 60), "LEAKED", font=uf("black", 84), fill=WHITE, anchor="mm")
    ban = ban.rotate(-14, expand=True, resample=Image.BICUBIC)
    im.paste(ban, (int(w / 2 - ban.width / 2), int(h / 2 - ban.height / 2)), ban)
    d.rectangle((0, 560, w, h), fill=(30, 10, 12))
    d.text((w / 2, 580), "SEPTEMBER 2022  ·  90 VIDEOS", font=uf("black", 26), fill=(255, 130, 130), anchor="mm")
    return im


@functools.lru_cache(maxsize=4)
def T_pc(stage):
    w, h = 960, 540
    im = vgrad_img(w, h, (20, 22, 40), (10, 10, 20))
    d = ImageDraw.Draw(im)
    d.text((w / 2, 110), "GTA 6", font=uf("black", 92), fill=WHITE, anchor="mm")
    d.text((w / 2, 190), "PLATFORMS AT LAUNCH", font=uf("bold", 28), fill=(150, 156, 190), anchor="mm")
    rows = [("PlayStation 5", True), ("Xbox Series X|S", True), ("PC", False)]
    for i, (name, ok) in enumerate(rows):
        y = 270 + i * 80
        d.text((330, y), name, font=uf("bold", 40), fill=WHITE if ok else (255, 120, 120), anchor="lm")
        if ok:
            d.line((250, y, 270, y + 20, 300, y - 22), fill=(90, 230, 120), width=9)
        elif stage:
            d.line((252, y - 20, 296, y + 22), fill=(240, 60, 70), width=9)
            d.line((252, y + 22, 296, y - 20), fill=(240, 60, 70), width=9)
            d.text((560, y), "not at launch", font=uf("semi", 32), fill=(240, 60, 70), anchor="lm")
    return im


@functools.lru_cache(maxsize=1)
def T_banner():
    w, h = 1000, 200
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cols = [(255, 90, 90), (255, 200, 60), (90, 200, 255), (130, 230, 120), (220, 120, 255)]
    for i in range(14):
        x = 20 + i * 70
        d.polygon([(x, 10), (x + 60, 10), (x + 30, 60)], fill=cols[i % 5] + (255,))
    f = uf("black", 70)
    txt = "HAPPY 14TH BIRTHDAY"
    x = (w - f.getlength(txt)) / 2
    for i, ch in enumerate(txt):
        d.text((x, 130), ch, font=f, fill=cols[i % 5] + (255,), anchor="lm", stroke_width=3, stroke_fill=(40, 30, 40))
        x += f.getlength(ch)
    return im


@functools.lru_cache(maxsize=40)
def T_trailer(step):
    w, h = 960, 540
    im = sunset_art(w, h)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 50), fill=(0, 0, 0))
    d.rectangle((0, h - 50, w, h), fill=(0, 0, 0))
    d.text((30, 25), "TRAILER 3", font=uf("black", 26), fill=WHITE, anchor="lm")
    views = 9_000_000 + step * 3_400_000
    d.text((w - 30, h - 25), f"{views:,} views", font=uf("bold", 26), fill=WHITE, anchor="rm")
    return im


@functools.lru_cache(maxsize=40)
def T_tv(mode, step):
    w, h = 960, 540
    if mode == "game":
        im = vgrad_img(w, h, (90, 170, 240), (200, 230, 250))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 330, w, h), fill=(30, 120, 200))
        r = random.Random(2)
        x = 0
        while x < w:
            bw, bh = r.randint(40, 110), r.randint(60, 220)
            col = r.choice(((250, 230, 210), (255, 200, 210), (210, 240, 230), (255, 240, 190)))
            d.rectangle((x, 330 - bh, x + bw, 330), fill=col)
            x += bw + r.randint(4, 16)
        d.rectangle((0, 420, w, h), fill=(240, 220, 170))
        for px in (120, 820):
            d.line((px, 520, px + 20, 300), fill=(90, 60, 40), width=12)
            for a in range(0, 360, 45):
                d.line((px + 20, 300, px + 20 + math.cos(math.radians(a)) * 90, 300 + math.sin(math.radians(a)) * 40 + 20),
                       fill=(40, 140, 70), width=12)
        if (step // 8) % 2 == 0:
            d.text((w / 2, 470), "PRESS ANY BUTTON", font=uf("black", 34), fill=WHITE, anchor="mm",
                   stroke_width=3, stroke_fill=(30, 30, 40))
        return im
    im = Image.new("RGB", (w, h), (6, 6, 10))
    d = ImageDraw.Draw(im)
    k = step / 30
    d.text((w / 2, 230), "LOADING", font=uf("black", 50), fill=WHITE, anchor="mm")
    d.rounded_rectangle((180, 300, 780, 330), radius=15, outline=(80, 80, 96), width=3)
    d.rounded_rectangle((184, 304, 184 + 592 * min(0.99, 0.9 + 0.09 * k), 326), radius=12, fill=(255, 255, 255))
    d.text((w / 2, 380), f"{int(90 + 9 * k)}%", font=uf("bold", 32), fill=(170, 170, 190), anchor="mm")
    return im


@functools.lru_cache(maxsize=4)
def T_laptop(mode):
    w, h = 960, 600
    if mode == "party":
        im = Image.new("RGB", (w, h), (18, 20, 34))
        d = ImageDraw.Draw(im)
        d.text((40, 60), "PARTY CHAT  ·  5 online", font=uf("black", 36), fill=WHITE, anchor="lm")
        for i, nm in enumerate(["Marcus", "Alex", "Sam", "Jay", "You"]):
            y = 140 + i * 74
            d.ellipse((50, y - 14, 78, y + 14), fill=(80, 230, 120))
            d.text((100, y), nm, font=uf("bold", 34), fill=WHITE, anchor="lm")
        d.text((40, 540), "Jay: 1 MINUTE", font=uf("semi", 30), fill=(150, 230, 170), anchor="lm")
        return im
    return Image.new("RGB", (w, h), (12, 14, 24))


@functools.lru_cache(maxsize=8)
def T_count(days):
    w, h = 960, 540
    im = sunset_art(w, h).point(lambda v: int(v * 0.55))
    d = ImageDraw.Draw(im)
    late = days > 10
    d.text((w / 2, 110), "GTA 6 COUNTDOWN", font=uf("black", 40), fill=WHITE, anchor="mm")
    d.text((w / 2, 270), str(days), font=uf("black", 210), fill=(255, 90, 90) if late else WHITE, anchor="mm",
           stroke_width=6, stroke_fill=(20, 10, 20))
    d.text((w / 2, 410), "DAYS LEFT", font=uf("black", 50), fill=WHITE, anchor="mm")
    d.text((w / 2, 480), "NOVEMBER 2027" if late else "NOVEMBER 19, 2026", font=uf("bold", 32),
           fill=(255, 150, 150) if late else (220, 220, 240), anchor="mm")
    return im


@functools.lru_cache(maxsize=1)
def T_wallposter():
    w, h = 500, 700
    im = sunset_art(w, h)
    d = ImageDraw.Draw(im)
    d.text((w / 2, 110), "MIAMI", font=uf("black", 96), fill=WHITE, anchor="mm", stroke_width=4, stroke_fill=(60, 20, 60))
    d.text((w / 2, 190), "NIGHTS", font=uf("black", 64), fill=(255, 220, 120), anchor="mm")
    return im


@functools.lru_cache(maxsize=1)
def T_neon():
    w, h = 620, 170
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for r_, a in ((14, 70), (8, 120), (0, 255)):
        d.text((w / 2, h / 2), "PLAYER 1", font=uf("black", 104), fill=(255, 90, 200, a), anchor="mm",
               stroke_width=r_, stroke_fill=(255, 60, 180, a // 3))
    return im


@functools.lru_cache(maxsize=4)
def T_clock(txt):
    im = Image.new("RGB", (300, 120), (8, 8, 10))
    ImageDraw.Draw(im).text((150, 60), txt, font=uf("bold", 84), fill=(255, 60, 60), anchor="mm")
    return im


@functools.lru_cache(maxsize=1)
def T_shelf():
    w, h = 1200, 300
    im = Image.new("RGB", (w, h), (236, 236, 232))
    d = ImageDraw.Draw(im)
    r = random.Random(7)
    for row in range(2):
        x = 10
        while x < w - 40:
            cw = r.randint(34, 42)
            col = r.choice(((60, 90, 200), (220, 60, 60), (40, 160, 90), (240, 180, 40), (30, 30, 40), (150, 60, 200),
                            (240, 240, 250)))
            d.rectangle((x, 20 + row * 140, x + cw, 130 + row * 140), fill=col)
            d.rectangle((x + 4, 30 + row * 140, x + cw - 4, 60 + row * 140), fill=tuple(min(255, c + 50) for c in col))
            x += cw + 4
        d.rectangle((0, 132 + row * 140, w, 140 + row * 140), fill=(180, 180, 176))
    return im


# ======================================================================================
# Sets
# ======================================================================================
WALL, FLOOR_C, CEIL, WOOD = (92, 88, 132), (104, 80, 68), (70, 70, 96), (156, 112, 78)


def night_scene(amb=0.3, dif=0.12):
    return P.Scene(sky=(8, 10, 22), fog=(8, 10, 22), fog_k=0.025, amb=amb, dif=dif, sun=(0.4, -1.0, 0.7),
                   amb_col=(0.82, 0.9, 1.18))


def bedroom(sc, lt, tv=None, laptop=None, desk_phone=None, monitor=None, pc=False, clock=None, headset=False,
            laptop_light=(120, 160, 255), tv_light=None, led=True, screen_layer=2.5, lamp=True):
    sc.box((0, -0.05, -0.6), (4.2, 0.1, 4.2), FLOOR_C, layer=0)
    sc.box((0, 2.65, -0.6), (4.2, 0.1, 4.2), CEIL, layer=0)
    sc.box((-2.05, 1.3, -0.6), (0.1, 2.6, 4.2), WALL, layer=0)
    sc.box((2.05, 1.3, -0.6), (0.1, 2.6, 4.2), WALL, layer=0)
    sc.box((-0.75, 1.3, 1.05), (2.5, 2.6, 0.1), WALL, layer=0)
    sc.box((1.6, 1.3, 1.05), (0.8, 2.6, 0.1), WALL, layer=0)
    sc.box((0.85, 0.525, 1.05), (0.7, 1.05, 0.1), WALL, layer=0)
    sc.box((0.85, 2.3, 1.05), (0.7, 0.6, 0.1), WALL, layer=0)
    sc.quad(P.rect_quad((1.0, 1.6, 7.5), (1, 0, 0), (0, 1, 0), 9.0, 5.2), tex=T_city(), layer=0)
    for (c, s) in (((0.85, 1.05, 0.99), (0.74, 0.04, 0.06)), ((0.85, 2.0, 0.99), (0.74, 0.04, 0.06)),
                   ((0.5, 1.525, 0.99), (0.04, 0.99, 0.06)), ((1.2, 1.525, 0.99), (0.04, 0.99, 0.06)),
                   ((0.85, 1.525, 0.99), (0.025, 0.95, 0.04))):
        sc.box(c, s, (210, 210, 220))
    sc.box((0, 0.72, 0.64), (1.7, 0.04, 0.6), WOOD)
    for x in (-0.8, 0.8):
        sc.box((x, 0.35, 0.64), (0.05, 0.7, 0.55), (112, 80, 56))
    sc.box((-0.62, 0.45, 0.64), (0.34, 0.5, 0.52), (120, 86, 60))
    # TV on the wall
    sc.box((-0.18, 1.6, 0.985), (0.92, 0.54, 0.03), (14, 14, 18))
    if tv is not None:
        sc.quad(P.rect_quad((-0.18, 1.6, 0.968), (1, 0, 0), (0, 1, 0), 0.88, 0.495), tex=tv, layer=screen_layer)
        sc.light((-0.18, 1.5, 0.6), tv_light or (160, 170, 220), 0.55, 1.1)
        sc.glow((-0.18, 1.6, 0.96), 0.55, tv_light or (90, 100, 160), 0.35)
    else:
        sc.quad(P.rect_quad((-0.18, 1.6, 0.968), (1, 0, 0), (0, 1, 0), 0.88, 0.495), col=(22, 24, 32), layer=2)
    if led:
        sc.box((-0.18, 1.33, 0.995), (0.9, 0.012, 0.012), (210, 110, 255), emissive=True)
        sc.light((-0.18, 1.4, 0.9), (170, 80, 255), 0.45, 0.9)
        sc.glow((-0.18, 1.33, 0.99), 0.4, (120, 50, 180), 0.5)
    # shelf + figures
    sc.box((-1.25, 1.75, 0.92), (0.8, 0.03, 0.2), WOOD)
    for i, col in enumerate(((220, 60, 60), (60, 160, 230), (240, 200, 60), (120, 220, 120))):
        sc.box((-1.55 + i * 0.2, 1.83, 0.92), (0.08, 0.13, 0.08), col)
    # laptop / monitor
    if monitor is not None:
        sc.box((-0.05, 0.78, 0.84), (0.2, 0.08, 0.14), (30, 30, 36))
        sc.box((-0.05, 0.95, 0.88), (0.04, 0.3, 0.04), (30, 30, 36))
        sc.box((-0.05, 1.12, 0.895), (0.66, 0.4, 0.03), (20, 20, 24))
        sc.quad(P.rect_quad((-0.05, 1.12, 0.877), (1, 0, 0), (0, 1, 0), 0.62, 0.35), tex=monitor, layer=screen_layer)
        sc.light((-0.05, 1.0, 0.6), laptop_light, 0.6, 0.7)
        sc.glow((-0.05, 1.12, 0.87), 0.4, (70, 80, 140), 0.4)
    else:
        sc.box((-0.05, 0.75, 0.55), (0.36, 0.018, 0.25), (66, 68, 78))
        sc.box((-0.05, 0.751, 0.52), (0.3, 0.004, 0.11), (40, 42, 50))
        hinge, ang = np.array([-0.05, 0.76, 0.675]), math.radians(14)
        up = np.array([0, math.cos(ang), math.sin(ang)])
        c = hinge + up * 0.11
        sc.box(c + np.array([0, 0, 0.008]), (0.36, 0.23, 0.01), (56, 58, 68), P.rot_x(-ang))
        if laptop is not None:
            sc.quad(P.rect_quad(c - np.array([0, 0, 0.002]), (1, 0, 0), up, 0.33, 0.205), tex=laptop,
                    layer=screen_layer)
            sc.light((-0.05, 0.9, 0.5), laptop_light, 0.55, 0.5)
            sc.glow(c, 0.25, (60, 80, 150), 0.35)
    if pc:
        sc.box((0.6, 0.98, 0.72), (0.22, 0.48, 0.44), (24, 24, 30))
        for i, col in enumerate(((255, 60, 120), (60, 200, 255), (160, 90, 255))):
            sc.box((0.488, 0.86 + i * 0.12, 0.72), (0.004, 0.025, 0.4), col, emissive=True)
        sc.light((0.4, 1.0, 0.6), (200, 90, 255), 0.5, 0.6)
        sc.glow((0.49, 0.98, 0.72), 0.3, (140, 60, 200), 0.5)
    if desk_phone is not None:
        R = P.rot_y(0.25)
        sc.box((0.4, 0.747, 0.48), (0.078, 0.01, 0.16), (20, 20, 24), R)
        if desk_phone is not False:
            corners = [np.array([0.4, 0.753, 0.48]) + R @ np.array(v) for v in
                       ((-0.035, 0, 0.074), (0.035, 0, 0.074), (0.035, 0, -0.074), (-0.035, 0, -0.074))]
            sc.quad(corners, tex=desk_phone, layer=screen_layer)
            sc.glow((0.4, 0.76, 0.48), 0.12, (80, 70, 150), 0.5)
    sc.box((-0.5, 0.8, 0.5), (0.08, 0.12, 0.08), (236, 236, 240))
    sc.box((-0.45, 0.8, 0.5), (0.03, 0.06, 0.02), (236, 236, 240))
    sc.box((0.3, 0.75, 0.48), (0.06, 0.02, 0.1), (36, 36, 42))
    # plant, poster, neon sign, fairy lights, desk LED strip, lamp
    sc.box((-0.72, 0.8, 0.82), (0.12, 0.13, 0.12), (190, 110, 80))
    for dx, dy, dz in ((0, 0.14, 0), (-0.05, 0.2, 0.02), (0.05, 0.22, -0.02), (0.0, 0.28, 0.03)):
        sc.box((-0.72 + dx, 0.8 + dy, 0.82 + dz), (0.1, 0.1, 0.1), (70, 160, 90))
    sc.quad(P.rect_quad((-1.15, 1.55, 0.998), (1, 0, 0), (0, 1, 0), 0.5, 0.7), tex=T_wallposter(), layer=1,
            emissive=False)
    sc.quad(P.rect_quad((-0.18, 2.08, 0.996), (1, 0, 0), (0, 1, 0), 0.62, 0.17), tex=T_neon(), layer=1)
    sc.glow((-0.18, 2.08, 0.99), 0.3, (200, 60, 150), 0.55)
    for i in range(26):
        x = -1.9 + i * 0.15
        y = 2.42 - 0.09 * math.sin(math.pi * ((x + 1.9) % 0.9) / 0.9)
        sc.box((x, y, 0.99), (0.022, 0.022, 0.022), (255, 214, 150), emissive=True)
        sc.glow((x, y, 0.985), 0.07, (255, 180, 100), 0.85)
    sc.box((0, 0.745, 0.935), (1.6, 0.01, 0.01), (90, 230, 255), emissive=True)
    sc.light((0, 0.85, 0.85), (60, 200, 255), 0.3, 0.6)
    if lamp:
        sc.box((-0.5, 0.75, 0.86), (0.12, 0.02, 0.12), (40, 40, 46))
        sc.box((-0.5, 0.95, 0.86), (0.02, 0.38, 0.02), (40, 40, 46))
        sc.box((-0.44, 1.13, 0.83), (0.14, 0.06, 0.1), (40, 40, 46), P.rot_z(0.3))
        sc.box((-0.42, 1.1, 0.82), (0.07, 0.015, 0.06), (255, 230, 170), emissive=True)
        sc.light((-0.42, 1.0, 0.75), (255, 190, 120), 0.6, 0.8)
        sc.glow((-0.42, 1.09, 0.82), 0.16, (255, 190, 110), 0.7)
    if headset:
        sc.box((0.42, 0.77, 0.78), (0.2, 0.06, 0.08), (30, 30, 34))
        sc.box((0.42, 0.85, 0.78), (0.2, 0.03, 0.05), (30, 30, 34))
    if clock is not None:
        sc.box((0.68, 0.78, 0.82), (0.17, 0.08, 0.05), (16, 16, 18))
        sc.quad(P.rect_quad((0.68, 0.78, 0.794), (1, 0, 0), (0, 1, 0), 0.15, 0.06), tex=clock, layer=screen_layer)
        sc.glow((0.68, 0.78, 0.79), 0.08, (200, 40, 40), 0.6)


def store(sc, lt, poster_k):
    sc.box((0, -0.05, 2), (8, 0.1, 12), (214, 214, 210), layer=0)
    sc.box((0, 3.25, 2), (8, 0.1, 12), (240, 240, 238), layer=0)
    sc.box((0, 1.6, 4.05), (8, 3.3, 0.1), (120, 196, 214), layer=0)
    sc.box((0, 2.95, 3.99), (8, 0.5, 0.02), (40, 50, 90), layer=1)
    sc.box((-3.05, 1.6, 2), (0.1, 3.3, 12), (236, 214, 196), layer=0)
    sc.box((3.05, 1.6, 2), (0.1, 3.3, 12), (236, 214, 196), layer=0)
    for z in (0.0, 2.0):
        for x in (-1.2, 1.2):
            sc.box((x, 3.17, z + 1), (1.2, 0.04, 0.3), (255, 255, 250), emissive=True)
            sc.glow((x, 3.1, z + 1), 0.7, (60, 60, 60), 0.4)
    for side in (-1, 1):
        x = side * 2.55
        sc.box((x, 0.9, 1.4), (0.8, 1.8, 3.6), (200, 200, 196))
        sc.quad([(x - side * 0.401, 1.7, 3.2 if side < 0 else -0.4), (x - side * 0.401, 1.7, -0.4 if side < 0 else 3.2),
                 (x - side * 0.401, 0.3, -0.4 if side < 0 else 3.2), (x - side * 0.401, 0.3, 3.2 if side < 0 else -0.4)],
                tex=T_shelf(), layer=2, emissive=False)
    sc.box((0, 0.5, 1.2), (1.6, 1.0, 0.7), (40, 40, 46))
    sc.box((0, 1.01, 1.2), (1.62, 0.03, 0.72), (230, 230, 232))
    sc.box((0.4, 1.2, 1.2), (0.3, 0.3, 0.05), (20, 20, 24))
    sc.quad(P.rect_quad((0, 1.75, 3.99), (1, 0, 0), (0, 1, 0), 1.2, 0.774), tex=T_sign(), layer=1, emissive=False)
    drop = ease_in_out(clamp01(poster_k))
    pc = np.array([0, 1.95 - 2.2 * drop ** 1.6, 3.97 - 0.3 * drop])
    rot = 0.35 * drop
    right = np.array([math.cos(rot), math.sin(rot), 0.0])
    up = np.array([-math.sin(rot), math.cos(rot), -0.35 * drop])
    up = up / np.linalg.norm(up)
    if drop < 0.98:
        sc.quad(P.rect_quad(pc, right, up, 1.3, 1.95), tex=T_poster(), layer=2, emissive=False)
    P.person(sc, (1.05, 0, 3.4), yaw=math.pi + 0.5, shirt=(200, 40, 50), arm_r=2.6 - 1.4 * drop, arm_l=0.3,
             head_pitch=0.35 - 0.6 * drop, hair=(30, 24, 20))
    P.person(sc, (-1.4, 0, 2.2), yaw=math.pi * 0.8, shirt=(90, 140, 220), head_yaw=0.5)


def meeting(sc, lt, k):
    sc.box((0, -0.05, 1), (7, 0.1, 8), (150, 140, 130), layer=0)
    sc.box((0, 2.85, 1), (7, 0.1, 8), (236, 236, 232), layer=0)
    sc.box((0, 1.4, 3.05), (7, 2.9, 0.1), (214, 218, 222), layer=0)
    sc.box((-3.05, 1.4, 1), (0.1, 2.9, 8), (220, 222, 226), layer=0)
    sc.box((3.05, 1.4, 1), (0.1, 2.9, 8), (220, 222, 226), layer=0)
    sc.quad(P.rect_quad((2.99, 1.5, 0.8), (0, 0, 1), (0, 1, 0), 3.0, 1.6), col=(210, 236, 255), layer=1)
    sc.box((0, 1.45, 2.97), (2.3, 1.32, 0.04), (180, 184, 190))
    sc.quad(P.rect_quad((0, 1.45, 2.945), (1, 0, 0), (0, 1, 0), 2.2, 1.24), tex=T_board(int(round(k * 30))), layer=2,
            emissive=False)
    sc.box((0, 0.74, 1.0), (1.2, 0.05, 2.2), (120, 90, 66))
    sc.box((0, 0.37, 1.0), (0.2, 0.7, 1.6), (90, 70, 52))
    seats = [(-0.95, 0.4, math.pi / 2, (90, 140, 220)), (-0.95, 1.5, math.pi / 2, (230, 150, 60)),
             (0.95, 0.4, -math.pi / 2, (120, 120, 130)), (0.95, 1.5, -math.pi / 2, (200, 80, 120))]
    for i, (x, z, yaw, col) in enumerate(seats):
        sc.box((x + (0.1 if x < 0 else -0.1) * 0, 0.45, z), (0.5, 0.06, 0.5), (40, 40, 46))
        P.person(sc, (x, 0, z), yaw=yaw, shirt=col, sit=True, seat=0.47, arm_l=1.1, arm_r=1.1 if i % 2 else 0.9,
                 head_yaw=(0.4 if x < 0 else -0.4) + 0.15 * math.sin(lt * 0.8 + i), head_pitch=0.15)
    P.person(sc, (1.55, 0, 2.55), yaw=math.pi - 0.5, shirt=(60, 60, 70), arm_l=1.5 + 0.2 * math.sin(lt * 2), head_yaw=-0.5)
    sc.box((2.4, 0.3, 2.5), (0.3, 0.6, 0.3), (180, 120, 90))
    sc.box((2.4, 0.9, 2.5), (0.5, 0.6, 0.5), (70, 150, 80))


def birthday(sc, lt):
    sc.box((0, -0.05, 1), (6, 0.1, 7), (120, 92, 70), layer=0)
    sc.box((0, 2.75, 1), (6, 0.1, 7), (90, 80, 76), layer=0)
    sc.box((0, 1.35, 2.85), (6, 2.8, 0.1), (190, 150, 130), layer=0)
    sc.box((-2.55, 1.35, 1), (0.1, 2.8, 7), (180, 140, 122), layer=0)
    sc.box((2.55, 1.35, 1), (0.1, 2.8, 7), (180, 140, 122), layer=0)
    sc.quad(P.rect_quad((0, 2.1, 2.79), (1, 0, 0), (0, 1, 0), 2.2, 0.44), tex=T_banner(), layer=1, emissive=False)
    sc.box((0, 0.74, 1.0), (1.8, 0.05, 1.0), (150, 104, 70))
    for x in (-0.8, 0.8):
        for z in (0.6, 1.4):
            sc.box((x, 0.36, z), (0.06, 0.72, 0.06), (110, 76, 52))
    sc.box((0, 0.83, 0.95), (0.36, 0.13, 0.36), (250, 246, 240))
    sc.box((0, 0.94, 0.95), (0.26, 0.09, 0.26), (255, 170, 200))
    for i, x in enumerate((-0.05, 0.05)):
        sc.box((x, 1.02, 0.95), (0.02, 0.08, 0.02), (120, 200, 255) if i else (255, 220, 90))
        fl = 0.012 * math.sin(lt * 17 + i)
        sc.box((x + fl, 1.085, 0.95), (0.016, 0.03, 0.016), (255, 200, 90), emissive=True)
        sc.glow((x, 1.09, 0.95), 0.12, (255, 170, 80), 0.9)
    sc.light((0, 1.15, 0.9), (255, 180, 110), 0.9, 0.9)
    clap = abs(math.sin(lt * 5))
    P.person(sc, (0, 0, 1.75), yaw=math.pi, shirt=(90, 200, 160), scale=0.74, arm_l=0.6 + 0.4 * clap,
             arm_r=0.6 + 0.4 * clap, hat=(255, 90, 140), hair=(50, 34, 24))
    P.person(sc, (-0.75, 0, 2.15), yaw=math.pi + 0.2, shirt=(220, 120, 90), arm_l=1.0 + 0.3 * clap, arm_r=1.0 + 0.3 * clap)
    P.person(sc, (0.8, 0, 2.15), yaw=math.pi - 0.2, shirt=(120, 120, 200), arm_l=1.0 + 0.3 * clap,
             arm_r=1.0 + 0.3 * clap, hair=(30, 26, 24))
    for i, (x, y, z, col) in enumerate(((-1.4, 2.0, 2.3, (255, 80, 90)), (-1.1, 2.25, 2.5, (90, 180, 255)),
                                        (1.3, 2.1, 2.4, (255, 210, 60)), (1.55, 1.9, 2.2, (140, 230, 120)))):
        bob = 0.03 * math.sin(lt * 1.5 + i)
        sc.box((x, y + bob, z), (0.24, 0.28, 0.24), col)
        sc.box((x, y - 0.5 + bob, z), (0.01, 0.72, 0.01), (240, 240, 240))


# ======================================================================================
# Camera helpers
# ======================================================================================
def cam_move(lt, dur, a, b, sway=1.0, seed=0):
    """a, b = (position, look-at target, vertical fov); eased move from a to b over the shot."""
    k = ease_in_out(clamp01(lt / max(0.1, dur)))
    pos = np.array(a[0], float) * (1 - k) + np.array(b[0], float) * k
    tgt = np.array(a[1], float) * (1 - k) + np.array(b[1], float) * k
    fov = a[2] * (1 - k) + b[2] * k
    dv = tgt - pos
    yaw, pitch = math.atan2(dv[0], dv[2]), math.atan2(dv[1], math.hypot(dv[0], dv[2]))
    t = lt + seed * 3.1
    pos = pos + np.array([math.sin(t * 0.9) * 0.004, math.sin(t * 1.3 + 1) * 0.004, 0]) * sway
    yaw += math.sin(t * 0.7 + 2) * 0.006 * sway
    pitch += math.sin(t * 1.1) * 0.005 * sway
    return P.Camera(pos, yaw, pitch, fov=fov)


def fill_light(sc, cam, k=0.55, col=(255, 226, 205)):
    sc.light(cam.attach((0.0, -0.05, 0.12)), col, k, 0.45)


def held_phone(sc, cam, tex, buzz=0.0, off=(0.05, 0.05, 0.42), tilt=0.12):
    B = cam.basis()
    jit = buzz * 0.004 * math.sin(time_hash(cam) * 50)
    c = cam.attach((off[0] + jit, off[1], off[2]))
    R = B @ P.rot_x(tilt)
    up = R @ np.array([0, 1.0, 0])
    nrm = R @ np.array([0, 0, 1.0])
    sc.box(c + nrm * 0.006, (0.082, 0.166, 0.009), (22, 22, 26), R, layer=3)
    sc.quad(P.rect_quad(c - nrm * 0.0005, cam.r, up, 0.074, 0.155), tex=tex, layer=3)
    for side in (-1, 1):
        sc.box(c + cam.r * side * 0.046 - up * 0.045 + nrm * 0.012, (0.022, 0.075, 0.03), P.SKIN, R, layer=3)
    sc.box(c - up * 0.095 + nrm * 0.03, (0.085, 0.04, 0.045), P.SKIN, R, layer=3)
    sc.box(c - up * 0.14 + nrm * 0.07, (0.09, 0.06, 0.12), (52, 62, 110), R @ P.rot_x(0.7), layer=3)


def time_hash(cam):
    return float(cam.pos[0] * 13.1 + cam.pos[1] * 7.7 + cam.pos[2] * 3.3)


# ======================================================================================
# Shots
# ======================================================================================
LAPTOP_C, TV_C = (-0.05, 0.87, 0.7), (-0.18, 1.6, 0.97)


def hands(sc, cam):
    P.pov_hands(sc, cam, left=(-0.09, -0.2, 0.37), right=(0.1, -0.205, 0.37), pitch=0.55, sleeve=(52, 62, 110))
    fill_light(sc, cam)


def sh_title(lt, S):
    sc = night_scene()
    bedroom(sc, lt, laptop=T_stream(int(lt * 2), False), desk_phone=False, tv=T_count(10))
    cam = cam_move(lt, S["dur"], ((0.25, 1.45, -1.05), (-0.1, 1.25, 0.9), 72), ((0.0, 1.24, -0.4), (-0.08, 1.12, 0.9), 70))
    hands(sc, cam)
    return sc, cam


def sh_call(lt, S):
    sc = night_scene()
    bedroom(sc, lt, laptop=T_stream(int(lt * 2), False), desk_phone=False, tv=T_count(10))
    cam = cam_move(lt, S["dur"], ((0.0, 1.24, -0.4), (-0.08, 1.05, 0.9), 70), ((0.0, 1.16, -0.12), (-0.06, 0.8, 0.8), 62))
    hands(sc, cam)
    return sc, cam


def sh_sentence(lt, S):
    sc = night_scene()
    delayed = lt >= ts(S, 1, 0.2)
    bedroom(sc, lt, laptop=T_stream(int(lt * 2), delayed), desk_phone=False, tv=T_count(375 if delayed else 10),
            laptop_light=(255, 90, 90) if delayed else (120, 160, 255))
    t1 = ts(S, 1, -0.2)
    if lt < t1:
        cam = cam_move(lt, t1, ((0.0, 1.1, 0.02), (-0.05, 0.74, 0.7), 56), ((-0.02, 1.06, 0.12), (-0.05, 0.76, 0.7), 52),
                       sway=0.6)
    else:
        cam = cam_move(lt - t1, 1.1, ((-0.02, 1.06, 0.12), (-0.05, 0.76, 0.7), 52), ((-0.05, 1.12, -0.2), (-0.16, 1.42, 0.97), 56),
                       sway=0.6)
    fill_light(sc, cam, 0.35)
    return sc, cam


def sh_stock(lt, S):
    sc = night_scene()
    k = clamp01((lt - 0.3) / max(0.5, S["te"][0] - 0.3))
    bedroom(sc, lt, laptop=T_chart(int(round(k * 30))), desk_phone=False, laptop_light=(255, 80, 90), tv=T_count(375))
    cam = cam_move(lt, S["dur"], ((0.0, 1.1, 0.0), (-0.05, 0.74, 0.7), 56), ((-0.02, 1.05, 0.14), (-0.05, 0.76, 0.7), 50),
                   sway=0.7)
    fill_light(sc, cam, 0.35)
    return sc, cam


def sh_flood(lt, S):
    sc = night_scene()
    bedroom(sc, lt, laptop=T_stream(int(lt * 2), True), desk_phone=None, laptop_light=(255, 90, 90), tv=T_count(375))
    cam = cam_move(lt, S["dur"], ((0.0, 1.2, -0.25), (-0.05, 0.95, 0.8), 62), ((0.0, 1.18, -0.2), (-0.05, 0.92, 0.8), 58),
                   sway=1.4)
    held_phone(sc, cam, T_phone("flood", int(lt * 4)), buzz=1.0 if (lt * 3) % 1 < 0.4 else 0.0)
    fill_light(sc, cam)
    return sc, cam


def sh_store(lt, S):
    sc = P.Scene(sky=(232, 236, 240), fog=(232, 236, 240), fog_k=0.01, amb=0.86, dif=0.3, sun=(-0.3, -1, 0.4))
    store(sc, lt, clamp01((lt - 0.6) / 1.6))
    cam = cam_move(lt, S["dur"], ((-0.7, 1.62, -1.2), (0.25, 1.2, 4.0), 64), ((-0.45, 1.6, -0.2), (0.3, 1.15, 4.0), 60))
    return sc, cam


def sh_preorder(lt, S):
    sc = P.Scene(sky=(232, 236, 240), fog=(232, 236, 240), fog_k=0.01, amb=0.86, dif=0.3, sun=(-0.3, -1, 0.4))
    store(sc, lt, 1.0)
    cam = cam_move(lt, S["dur"], ((-0.6, 1.6, -0.4), (-2.6, 1.0, 1.6), 60), ((-0.6, 1.6, -0.35), (-2.6, 0.95, 1.7), 56),
                   sway=1.2)
    step = int(round(30 * clamp01((lt - 0.2) / max(0.5, S["te"][0] - 0.2))))
    held_phone(sc, cam, T_phone("preorder", step))
    return sc, cam


def sh_meeting(lt, S):
    sc = P.Scene(sky=(226, 232, 238), fog=(226, 232, 238), fog_k=0.01, amb=0.82, dif=0.32, sun=(0.5, -1, 0.3))
    k = clamp01(lt / max(0.5, S["te"][-1]))
    meeting(sc, lt, k)
    cam = cam_move(lt, S["dur"], ((-0.5, 2.05, -1.9), (0.0, 1.0, 2.9), 60), ((0.35, 1.95, -1.6), (0.0, 1.05, 2.9), 56))
    return sc, cam


def sh_leak(lt, S):
    sc = P.Scene(sky=(8, 5, 12), fog=(8, 5, 12), fog_k=0.03, amb=0.26, dif=0.06, amb_col=(1.0, 0.72, 0.85))
    bedroom(sc, lt, laptop=T_leak(), desk_phone=False, laptop_light=(255, 70, 80), led=False, screen_layer=2,
            tv=T_count(280), lamp=False)
    P.person(sc, (0.0, 0, 0.05), yaw=0.0, shirt=(30, 30, 36), sit=True, seat=0.5, arm_l=1.25, arm_r=1.25, hood=True)
    sc.box((0, 0.48, 0.05), (0.5, 0.06, 0.5), (30, 30, 34))
    sc.light((0.0, 1.0, 0.45), (255, 60, 70), 0.9, 0.6)
    cam = cam_move(lt, S["dur"], ((0.62, 1.82, -0.5), (-0.08, 0.8, 0.7), 48), ((0.5, 1.7, -0.3), (-0.08, 0.82, 0.7), 42))
    sc.light((0.0, 1.1, 0.5), (255, 70, 80), 0.8, 0.7)
    return sc, cam


def sh_pc(lt, S):
    sc = night_scene()
    stage = 1 if lt >= ts(S, 1, 0.3) else 0
    bedroom(sc, lt, monitor=T_pc(stage), pc=True, desk_phone=False, laptop_light=(140, 150, 255), tv=T_count(190))
    cam = cam_move(lt, S["dur"], ((0.12, 1.32, -0.6), (-0.03, 0.95, 0.9), 70), ((0.0, 1.22, -0.2), (-0.04, 0.88, 0.9), 62))
    hands(sc, cam)
    return sc, cam


def sh_bday(lt, S):
    sc = P.Scene(sky=(20, 14, 12), fog=(20, 14, 12), fog_k=0.03, amb=0.34, dif=0.1, amb_col=(1.18, 0.96, 0.82))
    birthday(sc, lt)
    cam = cam_move(lt, S["dur"], ((0.0, 1.5, -1.1), (0.0, 1.05, 1.8), 62), ((0.0, 1.45, -0.75), (0.0, 1.05, 1.8), 58))
    return sc, cam


def sh_trailer(lt, S):
    sc = night_scene(amb=0.26)
    step = int(round(30 * clamp01(lt / max(1.0, S["dur"]))))
    bedroom(sc, lt, tv=T_trailer(step), laptop=T_laptop("off"), desk_phone=T_phone("trailer", 1), led=True,
            tv_light=(255, 150, 110))
    cam = cam_move(lt, S["dur"], ((0.05, 1.3, -1.0), (-0.18, 1.2, 0.97), 70), ((-0.1, 1.36, -0.4), (-0.18, 1.3, 0.97), 58))
    fill_light(sc, cam, 0.3)
    return sc, cam


def sh_launch(lt, S):
    sc = night_scene(amb=0.24)
    step = int(round(30 * clamp01(lt / max(1.0, S["dur"]))))
    bedroom(sc, lt, tv=T_tv("load", step), laptop=T_laptop("party"), desk_phone=False, clock=T_clock("11:59"),
            headset=True, tv_light=(150, 150, 170))
    cam = cam_move(lt, S["dur"], ((0.35, 1.28, -0.95), (-0.1, 1.25, 0.9), 70), ((0.2, 1.22, -0.45), (-0.1, 1.15, 0.9), 64))
    hands(sc, cam)
    return sc, cam


def sh_mom(lt, S):
    sc = night_scene(amb=0.24)
    bedroom(sc, lt, tv=T_tv("load", 30), laptop=T_laptop("party"), desk_phone=None, clock=T_clock("11:59"),
            headset=True)
    cam = cam_move(lt, S["dur"], ((0.0, 1.2, -0.25), (-0.05, 0.95, 0.8), 62), ((0.0, 1.18, -0.2), (-0.05, 0.92, 0.8), 58),
                   sway=1.2)
    held_phone(sc, cam, T_phone("mom", 1 if lt > 0.25 else 0), buzz=1.0 if lt < 0.9 else 0.0)
    fill_light(sc, cam)
    return sc, cam


def sh_game(lt, S):
    sc = night_scene(amb=0.3)
    bedroom(sc, lt, tv=T_tv("game", int(lt * 10)), laptop=T_laptop("party"), desk_phone=False, clock=T_clock("12:00"),
            headset=True, tv_light=(150, 210, 255))
    cam = cam_move(lt, S["dur"], ((-0.1, 1.32, -0.7), (-0.18, 1.25, 0.97), 64), ((-0.16, 1.4, -0.25), (-0.18, 1.33, 0.97), 54))
    return sc, cam


def ts(S, i, off=0.0):
    return S["ts"][min(i, len(S["ts"]) - 1)] + off


SHOTS = [
    dict(fn=sh_title, title=True, kicker="", label="", lines=[
        N("What if GTA 6 got delayed... for another year?", show=False)], extra=0.4),
    dict(fn=sh_call, kicker="TAKE-TWO EARNINGS CALL", label="10 DAYS LEFT", lines=[
        N("GTA 6 comes out in ten days.", "GTA 6 comes out in 10 days."),
        N("You're watching Take-Two's earnings call, just to hear them say it's still on time.")]),
    dict(fn=sh_sentence, kicker="TAKE-TWO EARNINGS CALL", label="4:43 PM", lines=[
        N("Then one sentence ruins your night."),
        N("GTA 6 is moving to November 2027.")], extra=0.3),
    dict(black=True, kicker="", label="", lines=[N("Another year.")], extra=0.9),
    dict(fn=sh_stock, kicker="DELAYED", label="MINUTE 3", lines=[
        N("Take-Two's stock crashes after hours. It fell after both earlier delays too."),
        N("Billions of dollars in expected sales just moved a whole year.")]),
    dict(fn=sh_flood, kicker="DELAYED", label="MINUTE 10", lines=[
        N("Your phone won't stop buzzing. It's the number one trend in the world.",
          "Your phone won't stop buzzing. It's the #1 trend in the world.")]),
    dict(fn=sh_store, kicker="DELAYED", label="DAY 1", lines=[N("Stores take down the launch posters.")], extra=0.3),
    dict(fn=sh_preorder, kicker="DELAYED", label="DAY 1", lines=[
        N("You can cancel your pre-order and get your money back. Most people don't.")], extra=0.3),
    dict(fn=sh_meeting, kicker="DELAYED", label="WEEK 1", lines=[
        N("Other studios moved their games to stay out of GTA's way. Now they have to move them again.")], extra=0.3),
    dict(fn=sh_leak, kicker="DELAYED", label="MONTH 3", lines=[
        N("Every extra month is another chance for leaks."),
        N("In 2022, a hacker leaked ninety videos of early GTA 6 footage.",
          "In 2022, a hacker leaked 90 videos of early GTA 6 footage.")]),
    dict(fn=sh_pc, kicker="DELAYED", label="MONTH 6", lines=[
        N("Some fans get tired of waiting and buy a gaming PC."),
        N("Bad news. GTA 6 isn't coming to PC at launch.")], extra=0.3),
    dict(fn=sh_bday, kicker="SEPTEMBER 17, 2027", label="MONTH 10", lines=[
        N("A kid born the day GTA 5 came out turns fourteen today.",
          "A kid born the day GTA 5 came out turns 14 today."),
        N("Still too young to play it.")], extra=0.3),
    dict(fn=sh_trailer, kicker="DELAYED", label="MONTH 11", lines=[
        N("Then a new trailer drops. The first one got over ninety million views in a day.",
          "Then a new trailer drops. The first one got over 90 million views in a day."),
        N("And just like that, everyone forgets they were mad.")]),
    dict(fn=sh_launch, kicker="NOVEMBER 2027", label="LAUNCH NIGHT", lines=[
        N("Fourteen years after GTA 5, your whole friend group is online.",
          "14 years after GTA 5, your whole friend group is online."),
        N("Eleven fifty-nine. Your phone buzzes again.", "11:59. Your phone buzzes again.")], extra=0.2),
    dict(fn=sh_mom, kicker="NOVEMBER 2027", label="11:59 PM", lines=[
        N("It's just your mom. Telling you to go to sleep.")], extra=0.3),
    dict(fn=sh_game, kicker="NOVEMBER 2027", label="12:00 AM", lines=[N("The game starts.")], extra=0.9),
    dict(black=True, end=True, kicker="", label="", lines=[
        N("Would you wait one more year for GTA 6? Tell me in the comments.")], extra=1.6),
]


# ======================================================================================
# Timeline + frame composition
# ======================================================================================
def build_timeline(voices):
    t = 0.3
    tl, voice_at = [], []
    li = 0
    for sh in SHOTS:
        start = t
        tsl, tel = [], []
        for line in sh["lines"]:
            dur = len(voices[li]) / SR if voices else max(1.2, len(line["text"].split()) / 2.8)
            tsl.append(t - start)
            tel.append(t - start + dur)
            voice_at.append((li, t))
            t += dur + 0.3
            li += 1
        t += sh.get("extra", 0.0) + 0.2
        tl.append(dict(start=start, dur=t - start, ts=tsl, te=tel))
    return tl, voice_at, t


TL = []
TOTAL = 0.0


def init_worker(tl, total):
    global TL, TOTAL
    TL, TOTAL = tl, total


def shot_at(t):
    k = 0
    for i, s in enumerate(TL):
        if t >= s["start"]:
            k = i
    return k


def render_frame(t):
    k = shot_at(t)
    sh, S = SHOTS[k], TL[k]
    lt = t - S["start"]
    if sh.get("black"):
        img = Image.new("RGB", (W, H), (0, 0, 0))
    else:
        sc, cam = sh["fn"](lt, S)
        img = P.post(P.render(sc, cam), bloom=sh.get("bloom", 0.5), vignette=0.5)
    fade = 1.0
    if k > 0 and lt < 0.18:
        fade = lt / 0.18
    if k < len(TL) - 1 and S["dur"] - lt < 0.14:
        fade = min(fade, (S["dur"] - lt) / 0.14)
    if fade < 1:
        img = Image.blend(Image.new("RGB", img.size, (0, 0, 0)), img, max(0.0, fade))
    if sh.get("title"):
        img = Image.blend(img.filter(ImageFilter.GaussianBlur(9)), Image.new("RGB", img.size, (0, 0, 0)), 0.4)
    if sh.get("title") or sh.get("end"):
        spr = P.title_sprite(TITLE, "delayed")
        a = clamp01((lt - 0.15) / 0.5)
        P.paste_alpha(img, spr, (W - spr.width) / 2, (560 if sh.get("title") else 700) - spr.height / 2, a)
    if sh.get("kicker") or sh.get("label"):
        spr = P.label_sprite(sh["kicker"], sh["label"])
        P.paste_alpha(img, spr, 106, 1000, clamp01((lt - 0.2) / 0.5))
    for i, line in enumerate(sh["lines"]):
        if not line["show"]:
            continue
        a0, a1 = S["ts"][i] - 0.05, S["te"][i] + 0.28
        if a0 <= lt < a1:
            al = clamp01((lt - a0) / 0.22) * clamp01((a1 - lt) / 0.2)
            spr = P.caption_sprite(line["cap"], 50, 700)
            P.paste_alpha(img, spr, (W - spr.width) / 2, 1290 - spr.height / 2, al)
    return img


def render_bytes(i):
    return render_frame(i / FPS).tobytes()


# ======================================================================================
# Audio: ambient music + sound design under the narration
# ======================================================================================
LEVELS = [0.8, 0.55, 0.35, 0.0, 0.7, 0.75, 0.7, 0.7, 0.7, 0.55, 0.75, 0.8, 1.0, 0.65, 0.2, 1.0, 0.8]


def build_audio(voices, voice_at, total, tl):
    n = int(total * SR) + SR
    rng = np.random.default_rng(5)

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

    def env(sig, a=0.05, r=0.2):
        e = np.ones(len(sig))
        ia, ir = int(a * SR), int(r * SR)
        if ia:
            e[:ia] = np.linspace(0, 1, ia)
        if ir:
            e[-ir:] *= np.linspace(1, 0, ir)
        return sig * e

    def buzz(sec=0.45):
        x = tt(sec)
        return np.sign(np.sin(2 * np.pi * 165 * x)) * 0.4 * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * x)) * env(np.ones(len(x)), 0.01, 0.05)

    def ping():
        return tone(1568, 0.35, (1, 0.3), 10) + np.concatenate([np.zeros(int(0.08 * SR)), tone(2093, 0.27, (1, 0.3), 10)])

    def T(i, line=0, off=0.0, end=False):
        S = tl[i]
        return S["start"] + (S["te"][line] if end else S["ts"][line]) + off

    # --- music: slow pad + sparse piano (A minor), level per shot
    pad, keys = np.zeros(n), np.zeros(n)
    chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]
    bar = 4.0
    b, tpos = 0, 0.0
    while tpos < total:
        ch = chords[b % 4]
        x = tt(bar + 1.2)
        e = np.minimum(1, x / 1.2) * np.minimum(1, (bar + 1.2 - x) / 1.2)
        add(pad, sum(np.sin(2 * np.pi * f * x) + 0.25 * np.sin(4 * np.pi * f * x) for f in ch) * e / 3, tpos, 0.09)
        for j, f in enumerate((ch[0] * 2, ch[2] * 2, ch[1] * 2, ch[2] * 2)):
            add(keys, tone(f, 1.6, (1, 0.3), 2.4), tpos + j * 1.0, 0.07)
        b += 1
        tpos += bar
    lev = np.ones(n)
    for i, S in enumerate(tl):
        a, z = int(S["start"] * SR), int((S["start"] + S["dur"]) * SR)
        lev[a:z] = LEVELS[i]
    music = (pad + keys) * smooth(lev, 0.4)

    out, venv = np.zeros(n), np.zeros(n)
    if voices:
        for li, t0 in voice_at:
            add(out, voices[li], t0, 1.0)
            add(venv, np.ones(len(voices[li])), t0)
    music *= 1 - 0.45 * np.clip(smooth(venv, 0.12), 0, 1)

    sfx = np.zeros(n)
    # room tone in the bedroom shots
    for i in (0, 1, 2, 4, 5, 10, 12, 13, 14, 15):
        S = tl[i]
        add(sfx, bandnoise(S["dur"], 60, 400), S["start"], 0.02)
    # earnings-call voice murmur from the laptop until the sentence lands
    a0, a1 = tl[1]["start"], T(2, 1, 0.1)
    mur = bandnoise(a1 - a0, 300, 2400) * (0.55 + 0.45 * np.sin(2 * np.pi * 4.3 * tt(a1 - a0)) ** 2)
    add(sfx, env(mur, 0.3, 0.1), a0, 0.035)
    # the sentence: everything drops, then a low hit + ringing into the black frame
    hit = T(3, 0, -0.05)
    add(sfx, sweep(70, 30, 1.6) * np.exp(-tt(1.6) * 2), hit, 0.6)
    add(sfx, np.sin(2 * np.pi * 3800 * tt(2.5)) * np.exp(-tt(2.5) * 1.3), hit, 0.012)
    # stock crash
    add(sfx, env(sweep(900, 120, 1.4), 0.05, 0.4), T(4, 0, 0.8), 0.06)
    add(sfx, tone(55, 0.8, (1, 0.5), 4), T(4, 0, 2.0), 0.4)
    # phone flood: buzzes + pings
    S = tl[5]
    tb = S["start"] + 0.1
    while tb < S["start"] + S["dur"] - 0.3:
        add(sfx, buzz(), tb, 0.12)
        add(sfx, ping(), tb + 0.15, 0.07)
        tb += 0.5
    # store: ambience + poster tear
    S = tl[6]
    add(sfx, bandnoise(S["dur"], 250, 1600), S["start"], 0.025)
    add(sfx, env(bandnoise(0.5, 1500, 7000), 0.01, 0.3), S["start"] + 0.9, 0.12)
    # pre-order: tap on "Keep"
    S = tl[7]
    add(sfx, tone(2400, 0.05, (1,), 60), S["start"] + 0.2 + (S["te"][0] - 0.2) * 0.67, 0.25)
    # meeting: office murmur + marker squeaks
    S = tl[8]
    add(sfx, bandnoise(S["dur"], 300, 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * tt(S["dur"])) ** 2),
        S["start"], 0.02)
    for j in range(4):
        add(sfx, env(bandnoise(0.12, 2500, 6000), 0.01, 0.05), S["start"] + 1.2 + j * 0.25, 0.05)
    # leak: drone + typing
    S = tl[9]
    x = tt(S["dur"])
    add(sfx, (np.sin(2 * np.pi * 55 * x) + 0.5 * np.sin(2 * np.pi * 82.4 * x)) * 0.5, S["start"], 0.05)
    r = random.Random(3)
    tk = S["start"] + 0.2
    while tk < S["start"] + S["dur"] - 0.2:
        add(sfx, env(bandnoise(0.025, 1500, 6000), 0.002, 0.015), tk, 0.08)
        tk += r.uniform(0.07, 0.18)
    # PC: fan whir, then an error bonk on "isn't coming to PC"
    S = tl[10]
    add(sfx, bandnoise(S["dur"], 150, 700) * np.linspace(0.3, 1, int(S["dur"] * SR)), S["start"], 0.03)
    add(sfx, np.sign(sweep(420, 180, 0.35)) * np.exp(-tt(0.35) * 7) * 0.4, T(10, 1, 0.5), 0.22)
    # birthday: claps + the "Happy Birthday" opening on piano (public domain melody)
    S = tl[11]
    for j in range(16):
        add(sfx, env(bandnoise(0.05, 800, 6000), 0.002, 0.04), S["start"] + 0.3 + j * 0.2 + r.uniform(-0.03, 0.03), 0.05)
    tm = S["start"] + 0.1
    for f, dur in ((392, 0.3), (392, 0.15), (440, 0.45), (392, 0.45), (523.25, 0.45), (493.88, 0.9)):
        add(sfx, tone(f, dur + 0.4, (1, 0.35, 0.1), 3), tm, 0.08)
        tm += dur
    # trailer: boom + riser + crowd swell
    S = tl[12]
    add(sfx, sweep(60, 30, 2.0) * np.exp(-tt(2.0) * 1.5), S["start"] + 0.1, 0.5)
    sw = bandnoise(S["dur"], 300, 3000) * np.sin(np.pi * tt(S["dur"]) / S["dur"]) ** 2
    add(sfx, sw, S["start"], 0.04)
    # launch night: clock ticks, then the buzz
    S = tl[13]
    for j in range(int(S["dur"])):
        add(sfx, tone(3000, 0.03, (1,), 80), S["start"] + 0.3 + j, 0.12)
    add(sfx, buzz(0.5), T(13, 1, 1.3), 0.16)
    add(sfx, buzz(0.5), tl[14]["start"] + 0.05, 0.16)
    # game start: bright chord + ocean
    S = tl[15]
    for j, f in enumerate((523.25, 659.25, 783.99, 1046.5)):
        add(sfx, tone(f, 2.5, (1, 0.3), 1.2), S["start"] + 0.05 + j * 0.04, 0.06)
    add(sfx, bandnoise(S["dur"], 200, 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt(S["dur"]))), S["start"], 0.04)
    # whoosh between shots
    for S in tl[1:]:
        x = tt(0.4)
        add(sfx, bandnoise(0.4, 600, 5000) * np.sin(np.pi * x / 0.4) ** 2, S["start"] - 0.12, 0.05)

    mix = out + music * 0.9 + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.92
    f = int(0.6 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    return mix


# ======================================================================================
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "gta6_delay_story.mp4"))
    ap.add_argument("--preview", help="comma separated times: save PNG stills only")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    ap.add_argument("--tts", choices=["elevenlabs", "none"],
                    default="elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "none")
    ap.add_argument("--narrator", default=NARRATOR)
    args = ap.parse_args()

    lines = [l["text"] for sh in SHOTS for l in sh["lines"]]
    voices = None
    if args.tts == "elevenlabs":
        voices = base.synth_voice_elevenlabs(lines, os.path.join(HERE, ".tts_cache"), args.narrator)
        if voices is None:
            sys.exit("ElevenLabs narration failed (see message above).")
    tl, voice_at, total = build_timeline(voices)
    init_worker(tl, total)
    print(f"Video length: {total:.1f}s")
    for i, s in enumerate(tl):
        nm = SHOTS[i]["fn"].__name__ if "fn" in SHOTS[i] else "black"
        print(f"  shot {i:2d}  {s['start']:6.2f}s  ({s['dur']:.2f}s)  {nm}")

    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for x in args.preview.split(","):
            p = os.path.join(HERE, "preview", f"gta_{float(x):06.2f}.png")
            render_frame(float(x)).save(p)
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
    t0 = time.time()
    with mp.get_context("fork").Pool(args.workers, initializer=init_worker, initargs=(tl, total)) as pool:
        for i, buf in enumerate(pool.imap(render_bytes, range(nfr), chunksize=4)):
            ff.stdin.write(buf)
            if i % 300 == 0:
                print(f"  frame {i}/{nfr}  ({time.time() - t0:.0f}s)", flush=True)
    ff.stdin.close()
    ff.wait()
    os.remove(wav)
    print(f"Done -> {args.out}")


if __name__ == "__main__":
    main()
