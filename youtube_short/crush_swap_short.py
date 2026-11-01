#!/usr/bin/env python3
"""
"What If You Switched Bodies With Your Crush?"  (story Short, Part 1)

Same look as the first story video (story_short.py engine): plaid frame, title box, animated 16:9
cartoon panel, "Part 1" label, synced captions, a time-of-day tag and a live countdown tag.
New in this one:
  * soul badges: a little bubble over each head shows whose mind is inside that body,
  * colour-coded captions: white = narrator, pink = Mia, blue = me. The voice always matches the BODY,
    so Mia talking from my body uses my voice (Mike) and I talk from hers with her voice (Jessica),
  * a real sung lyric for the talent show and a piano score made with the ElevenLabs Music API, plus
    applause / ambience from the ElevenLabs sound-effects API (generated once, kept in audio/crush_swap/),
  * camera moves and punch-ins on the big moments.

Usage:
  python youtube_short/crush_swap_short.py                     # -> youtube_short/crush_swap_story.mp4
  python youtube_short/crush_swap_short.py --preview 3,40,90   # PNG stills only (youtube_short/preview/)
"""
import argparse
import functools
import json
import math
import multiprocessing as mp
import os
import random
import subprocess
import sys
import time
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import story_short as base  # noqa: E402
import thoughts_short as th  # noqa: E402
from make_short import (clamp01, ease_in_out, ease_out_back, ease_out_cubic, emoji_sized, font,  # noqa: E402
                        lerp, paste, place, prog, text_sprite)
from story_short import (EYE, FLOOR, FPS, H, INK, PH, PW, SR, TAG_INSET, W, WH, WW, chunk_caption,  # noqa: E402
                         floor_band, heart, person, star4, te, ts, vgrad, wall_clock, window)

TITLE = "What If You Switched Bodies With Your Crush?"
PART = "Part 1"
NARRATOR = os.environ.get("ELEVENLABS_VOICE_ID", "zfc8CJQpe8Kqyl0vvCzo")   # Mike - 2D & 3D POV/Storytime
VOICE = {"narrator": NARRATOR,
         "my_body": NARRATOR,                  # my body talks with my voice, whoever is inside it
         "mia_body": "cgSgspJ2msm6clMCkdW9",   # Jessica = Mia's voice
         "host": "CwhRBWXzGAHq8TQ4Fs17"}       # Roger = the talent-show host
ASSETS = os.path.join(HERE, "audio", "crush_swap")
GARAMOND_IT = os.path.join(HERE, "fonts", "EBGaramond-Italic.ttf")

BLUE = base.BLUE
PINK = (236, 120, 160)
MIA_HAIR = (238, 198, 110)       # Mia is blonde
MIA_U = 0.96
SOUL = {"me": (70, 160, 255), "mia": (255, 96, 165)}
CAP_COL = {"@": (255, 150, 200), "#": (130, 200, 255), "^": (255, 224, 120), "%": (255, 238, 175)}
TICK = 0.8                       # final countdown: seconds per number
VOICE_LEVEL = 0.2                # speech RMS every voice clip is matched to


# ======================================================================================
# Script helpers
# ======================================================================================
def N(text, pre=0.0):
    return dict(text=text, voice="narrator", mark="", kind="narr", pre=pre)


def TEXTMSG(text, pre=0.0):      # the narrator reads Mia's text message (pink caption)
    return dict(text=text, voice="narrator", mark="@", kind="narr", pre=pre)


def MIA_IN_ME(text, pre=0.0):    # Mia talking with MY body -> my voice, pink caption
    return dict(text=text, voice="my_body", mark="@", kind="say", pre=pre)


def ME_IN_MIA(text, pre=0.0):    # me talking with HER body -> her voice, blue caption
    return dict(text=text, voice="mia_body", mark="#", kind="say", pre=pre)


def MIA(text, pre=0.0):          # Mia, back in her own body
    return dict(text=text, voice="mia_body", mark="@", kind="say", pre=pre)


def HOST(text, pre=0.0):
    return dict(text=text, voice="host", mark="^", kind="say", pre=pre)


# word timings of the sung line (ElevenLabs speech-to-text on audio/crush_swap/song_back_row.mp3)
SONG_CAPS = [(0.42, 1.28, "%{🎵} YOU SIT IN"), (1.28, 2.76, "%THE BACK ROW"), (2.76, 4.10, "%AND YOU NEVER"),
             (4.10, 5.30, "%SAY HI {🎵}")]
SONG_VOCAL = [(0.42, 2.72), (2.80, 5.06)]


def SONG(pre=0.0):
    return dict(text="", voice=None, mark="%", kind="song", pre=pre, dur=6.1)


# ======================================================================================
# Small drawing helpers
# ======================================================================================
def keys_at(lt, keys):
    """[(t, (values...)), ...] -> eased interpolation between key frames."""
    if lt <= keys[0][0]:
        return keys[0][1]
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if lt < t1:
            k = ease_in_out((lt - t0) / max(1e-6, t1 - t0))
            return tuple(lerp(x, y, k) for x, y in zip(a, b))
    return keys[-1][1]


def head(x, yf, u=1.0, sit=False):
    return x, yf - (536 if sit else 562) * u


def hand_pos(x, yf, u, idx, mode, facing=1, sit=False):
    """Where person() puts hand idx (0 = left, 1 = right) for an arm pose."""
    hip_y = yf - (232 if sit else 258) * u
    sh_y = hip_y - 212 * u
    s = (-1, 1)[idx]
    sx = facing if mode in ("point", "coffee") else s
    (_, _), (hx2, hy2) = base.ARM_POSES[mode]
    return x + s * 56 * u + sx * hx2 * u, sh_y + 34 * u + hy2 * u


def hood_front(d, x, yf, u, shirt, sit=False):
    """Hoodie on backwards: the hood hangs on the chest."""
    sh_y = yf - (232 if sit else 258) * u - 212 * u
    d.ellipse((x - 58 * u, sh_y - 4 * u, x + 58 * u, sh_y + 94 * u), fill=tuple(int(c * 0.8) for c in shirt))
    d.ellipse((x - 38 * u, sh_y + 10 * u, x + 38 * u, sh_y + 74 * u), fill=tuple(int(c * 0.62) for c in shirt))


def body_me(d, x, yf, lt, backwards=False, **kw):
    sit = kw.get("pose") == "sit"
    person(d, x, yf, 1.0, shirt=BLUE, hair="quiff", t=lt, seed=1, hood=not backwards, **kw)
    if backwards:
        hood_front(d, x, yf, 1.0, BLUE, sit)
    return head(x, yf, 1.0, sit)


def body_mia(d, x, yf, lt, **kw):
    sit = kw.get("pose") == "sit"
    person(d, x, yf, MIA_U, shirt=PINK, hair="long", hair_col=MIA_HAIR, hood=False, t=lt, seed=2, **kw)
    return head(x, yf, MIA_U, sit)


def mini_head(d, cx, cy, r, who):
    k = r / 88
    if who == "mia":
        d.rounded_rectangle((cx - 100 * k, cy - 96 * k, cx + 100 * k, cy + 150 * k), radius=90 * k, fill=MIA_HAIR)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=INK)
    if who == "me":
        pts = [(-74, -46), (-66, -92), (-14, -132), (58, -134), (98, -96), (86, -48), (36, -80), (-18, -70)]
        d.polygon([(cx + px * k, cy + py * k) for px, py in pts], fill=(96, 62, 38))
    else:
        d.chord((cx - r - 6 * k, cy - r - 8 * k, cx + r + 6 * k, cy + r * 0.3), 180, 360, fill=MIA_HAIR)
    for s in (-1, 1):
        ex, ey = cx + s * 31 * k, cy - 6 * k
        d.ellipse((ex - 21 * k, ey - 25 * k, ex + 21 * k, ey + 25 * k), fill=EYE)
        d.ellipse((ex - 10 * k, ey - 10 * k, ex + 10 * k, ey + 10 * k), fill=INK)
    d.arc((cx - 22 * k, cy + 24 * k, cx + 22 * k, cy + 58 * k), 20, 160, fill=(240, 240, 240), width=max(2, int(5 * k)))


@functools.lru_cache(maxsize=4)
def badge_sprite(who):
    """White bubble with a tiny head + name: 'this mind is in that body'."""
    S, R = 3, 60
    size = (R * 2 + 30) * S
    c = size // 2
    col = SOUL[who]
    im = Image.new("RGBA", (size, size + 30 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((c - (R + 12) * S, c - (R + 12) * S, c + (R + 12) * S, c + (R + 12) * S), fill=col + (70,))
    d.ellipse((c - R * S, c - R * S, c + R * S, c + R * S), fill=(255, 255, 255, 255), outline=col + (255,),
              width=7 * S)
    hd = Image.new("RGBA", im.size, (0, 0, 0, 0))
    mini_head(ImageDraw.Draw(hd), c, c - 4 * S, 33 * S, who)
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).ellipse((c - (R - 7) * S, c - (R - 7) * S, c + (R - 7) * S, c + (R - 7) * S), fill=255)
    hd.putalpha(ImageChops.multiply(hd.getchannel("A"), mask))
    im.alpha_composite(hd)
    name = "ME" if who == "me" else "MIA"
    f = font("black", 26 * S)
    tw = f.getlength(name)
    y = c + (R - 6) * S
    d.rounded_rectangle((c - tw / 2 - 14 * S, y - 18 * S, c + tw / 2 + 14 * S, y + 18 * S), radius=18 * S, fill=col)
    d.text((c, y), name, font=f, fill=(255, 255, 255), anchor="mm")
    return im.resize((im.width // S, im.height // S), Image.LANCZOS)


def badge_xy(hx, hy, side):
    return hx + side * 122, hy - 132


def soul(img, d, hx, hy, who, lt, k=1.0, side=-1, at=None, ring=True, jitter=0.0):
    """Ring around the head + trail dots + badge showing whose mind is inside."""
    if k <= 0.01:
        return
    col = SOUL[who]
    if ring:
        pulse = 0.5 + 0.5 * math.sin(lt * 3.2)
        d.ellipse((hx - 106, hy - 106, hx + 106, hy + 106), outline=col + (int((80 + 70 * pulse) * k),), width=7)
    bx, by = at if at else badge_xy(hx, hy, side)
    bx += math.sin(lt * 60) * 9 * jitter
    by += math.cos(lt * 47) * 6 * jitter
    if at is None:
        for f_, r in ((0.32, 8), (0.58, 12)):
            x, y = lerp(hx + side * 70, bx, f_), lerp(hy - 80, by + 40, f_)
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, int(235 * k)), outline=col + (int(255 * k),),
                      width=3)
    sc = 0.4 + 0.6 * ease_out_back(min(1.0, k * 1.6))
    place(img, badge_sprite(who), bx, by + 6 * math.sin(lt * 2.2 + side), scale=sc, alpha=min(1.0, k * 1.6))


def tears(d, hx, hy, lt, u=1.0, k=1.0):
    for s in (-1, 1):
        ph = (lt * 0.9 + (0.5 if s > 0 else 0.0)) % 1
        x, y = hx + s * 34 * u, hy + 20 * u + ph * 70 * u
        a = int(230 * k * (1 - ph))
        d.ellipse((x - 7 * u, y - 9 * u, x + 7 * u, y + 9 * u), fill=(150, 210, 255, a))
        d.polygon([(x - 6 * u, y - 3 * u), (x + 6 * u, y - 3 * u), (x, y - 17 * u)], fill=(150, 210, 255, a))


def blush(d, hx, hy, u=1.0, k=1.0):
    for s in (-1, 1):
        x, y = hx + s * 54 * u, hy + 30 * u
        d.ellipse((x - 21 * u, y - 10 * u, x + 21 * u, y + 10 * u), fill=(255, 110, 140, int(150 * k)))


def hearts_up(d, cx, cy, lt, n=6, spread=80, rise=380, speed=0.45, k=1.0):
    for i in range(n):
        ph = (lt * speed + i / n) % 1
        x = cx + math.sin(i * 2.1 + lt) * spread
        heart(d, x, cy - ph * rise, 18 + 10 * (i % 2), (240, 80, 120, int(220 * (1 - ph) * k)))


def note(d, x, y, s, a, col=(255, 236, 170)):
    c = col + (int(a),)
    d.ellipse((x - 14 * s, y - 10 * s, x + 14 * s, y + 10 * s), fill=c)
    d.line((x + 12 * s, y, x + 12 * s, y - 60 * s), fill=c, width=max(2, int(5 * s)))
    d.line((x + 12 * s, y - 60 * s, x + 34 * s, y - 44 * s), fill=c, width=max(2, int(5 * s)))


def pop_emoji(img, e, x, y, lt, t0, t1=99.0, size=120):
    if t0 <= lt < t1:
        sc = ease_out_back(prog(lt, t0, t0 + 0.3)) * (1 - prog(lt, t1 - 0.15, t1))
        place(img, emoji_sized(e, size), x, y - 10 * math.sin((lt - t0) * 3), scale=max(0.01, sc))


def wrap(text, f, maxw):
    return th.wrap(text, f, maxw) if text else []


def rr_paste(img, spr, x, y, r):
    """Paste sprite with rounded corners (for screens)."""
    mask = Image.new("L", spr.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, spr.width - 1, spr.height - 1), radius=r, fill=255)
    if spr.mode == "RGBA":
        mask = ImageChops.multiply(mask, spr.getchannel("A"))
    img.paste(spr.convert("RGB"), (int(x), int(y)), mask)


# ======================================================================================
# Cards and screens
# ======================================================================================
@functools.lru_cache(maxsize=16)
def flyer_sprite(top="TALENT SHOW", mid="TONIGHT · 9 PM", low="school gym"):
    im = Image.new("RGBA", (392, 312), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((14, 18, 390, 310), fill=(0, 0, 0, 60))
    d.rectangle((4, 4, 374, 296), fill=(255, 248, 225), outline=(210, 190, 150), width=4)
    d.text((189, 62), top, font=font("black", 40), fill=(40, 60, 150), anchor="mm")
    star4(d, 189, 142, 46, (255, 196, 60))
    d.text((189, 218), mid, font=font("black", 36), fill=(220, 60, 90), anchor="mm")
    d.text((189, 260), low, font=font("semi", 26), fill=(90, 90, 100), anchor="mm")
    d.rectangle((150, 0, 228, 22), fill=(255, 255, 255, 170))
    return im


@functools.lru_cache(maxsize=16)
def sms_card(sender, body, width=1060):
    """A 'Messages' notification banner."""
    pad = 32
    bsp = text_sprite(body, 48, INK, INK, "semi", stroke=0, shadow=False, maxw=width - 2 * pad - 140, align="left")
    h = max(150, 104 + bsp.height)
    im = Image.new("RGBA", (width + 14, h + 18), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((8, 14, width + 8, h + 14), radius=40, fill=(0, 0, 0, 70))
    d.rounded_rectangle((0, 0, width, h), radius=40, fill=(250, 250, 252))
    d.rounded_rectangle((pad, pad, pad + 92, pad + 92), radius=24, fill=(52, 199, 89))
    d.ellipse((pad + 16, pad + 20, pad + 76, pad + 66), fill=(255, 255, 255))
    d.polygon([(pad + 26, pad + 56), (pad + 40, pad + 60), (pad + 20, pad + 78)], fill=(255, 255, 255))
    d.text((pad + 124, pad - 2), "MESSAGES", font=font("bold", 26), fill=(130, 130, 140))
    d.text((width - pad, pad - 2), "now", font=font("semi", 26), fill=(130, 130, 140), anchor="ra")
    d.text((pad + 124, pad + 30), sender, font=font("black", 36), fill=INK)
    paste(im, bsp, pad + 124 - 10, pad + 78)
    return im


@functools.lru_cache(maxsize=64)
def mystery_banner(body, body2="", width=508, chip=None, size=38, col=(255, 255, 255), emo=None):
    """The 'no app, no sender' notification: header row, then the text across the full width."""
    pad = 26
    f = font("semi", size)
    lines = [(l, col) for l in wrap(body, f, width - 2 * pad)]
    lines += [(l, (255, 110, 120)) for l in wrap(body2, f, width - 2 * pad)]
    lh = int(size * 1.3)
    top = pad + 78
    h = top + lh * len(lines) + (80 if chip else 0) + pad - 6
    im = Image.new("RGBA", (width + 14, h + 18), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((8, 14, width + 8, h + 14), radius=40, fill=(0, 0, 0, 90))
    d.rounded_rectangle((0, 0, width, h), radius=40, fill=(28, 28, 34, 246))
    d.ellipse((pad, pad, pad + 62, pad + 62), fill=(6, 6, 8), outline=(96, 96, 106), width=3)
    d.text((pad + 31, pad + 32), "?", font=font("black", 40), fill=(255, 255, 255), anchor="mm")
    d.text((pad + 80, pad + 31), "UNKNOWN", font=font("bold", 25), fill=(150, 150, 160), anchor="lm")
    d.text((width - pad, pad + 31), "now", font=font("semi", 25), fill=(150, 150, 160), anchor="rm")
    for i, (l, c) in enumerate(lines):
        d.text((pad, top + i * lh), l, font=f, fill=c)
    if emo:
        e = emoji_sized(emo, int(size * 1.25))
        lw = f.getlength(lines[-1][0]) if lines else 0
        paste(im, e, pad + lw + 14, top + (len(lines) - 1) * lh - 4)
    if chip:
        cs = text_sprite(chip, 40, (255, 90, 100), (255, 90, 100), "black", stroke=0, shadow=False)
        y = top + lh * len(lines) + 8
        d.rounded_rectangle((pad, y, pad + cs.width + 30, y + 64), radius=32, fill=(70, 20, 26))
        paste(im, cs, pad + 15, y + (64 - cs.height) / 2)
    return im


@functools.lru_cache(maxsize=4)
def wallpaper(w, h):
    im = vgrad(w, h, (255, 170, 206), (138, 118, 236)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    for cx, cy, r, c in ((120, 260, 220, (255, 220, 240, 70)), (420, 700, 260, (120, 200, 255, 60)),
                         (300, 980, 180, (255, 255, 255, 40))):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=c)
    return im.filter(ImageFilter.GaussianBlur(30))


PHX, PHY, PHW, PHH = 1160, 100, 560, 1080       # the big phone in the text scene (world coords)


def draw_phone(img, d, lt, S):
    jit = math.sin(lt * 95) * 7 if ts(S, 0) <= lt < ts(S, 0, 0.7) else 0.0
    x0, y0 = PHX + jit, PHY
    d.rounded_rectangle((x0 + 18, y0 + 26, x0 + PHW + 18, y0 + PHH + 26), radius=86, fill=(0, 0, 0, 80))
    d.rounded_rectangle((x0, y0, x0 + PHW, y0 + PHH), radius=86, fill=(22, 22, 28), outline=(80, 80, 92), width=5)
    sx, sy, sw, sh = x0 + 16, y0 + 16, PHW - 32, PHH - 32
    cx = sx + sw / 2
    t_open = ts(S, 1, -0.3)
    if lt < t_open:                                                        # lock screen
        rr_paste(img, wallpaper(sw, sh), sx, sy, 70)
        opening = prog(lt, t_open - 0.45, t_open - 0.1)
        d.rounded_rectangle((cx - 15, sy + 70, cx + 15, sy + 94), radius=5, fill=(255, 255, 255))
        d.arc((cx - 11, sy + 52 - 10 * opening, cx + 11, sy + 80 - 10 * opening), 180, 360, fill=(255, 255, 255),
              width=5)
        d.text((cx, sy + 150), "Monday", font=font("semi", 40), fill=(255, 255, 255), anchor="mm")
        d.text((cx, sy + 262), "7:01", font=font("black", 150), fill=(255, 255, 255), anchor="mm")
        if lt >= ts(S, 0, 0.12):
            k = ease_out_back(prog(lt, ts(S, 0, 0.12), ts(S, 0, 0.45)))
            y = sy + 430 + (1 - k) * 60
            d.rounded_rectangle((sx + 26, y, sx + sw - 26, y + 168), radius=36, fill=(255, 255, 255, int(220 * k)))
            d.rounded_rectangle((sx + 48, y + 22, sx + 120, y + 94), radius=20, fill=(52, 199, 89, int(255 * k)))
            d.ellipse((sx + 60, y + 36, sx + 108, y + 72), fill=(255, 255, 255, int(255 * k)))
            d.text((sx + 140, y + 22), "MESSAGES", font=font("bold", 24), fill=(120, 120, 130))
            d.text((sx + sw - 46, y + 22), "now", font=font("semi", 24), fill=(120, 120, 130), anchor="ra")
            d.text((sx + 140, y + 56), "+1 (555) 284-0193", font=font("black", 31), fill=INK)
            d.text((sx + 140, y + 104), "1 new message", font=font("semi", 28), fill=(110, 110, 120))
    else:                                                                  # Messages thread
        d.rounded_rectangle((sx, sy, sx + sw, sy + sh), radius=70, fill=(255, 255, 255))
        d.ellipse((cx - 48, sy + 74, cx + 48, sy + 170), fill=(190, 192, 200))
        d.text((cx, sy + 122), "?", font=font("black", 50), fill=(255, 255, 255), anchor="mm")
        d.text((cx, sy + 200), "+1 (555) 284-0193 ›", font=font("semi", 28), fill=INK, anchor="mm")
        d.line((sx, sy + 238, sx + sw, sy + 238), fill=(225, 225, 230), width=3)
        d.text((cx, sy + 280), "Today 7:01 AM", font=font("semi", 24), fill=(140, 140, 150), anchor="mm")
        if lt >= ts(S, 1, -0.1):
            k = ease_out_back(prog(lt, ts(S, 1, -0.1), ts(S, 1, 0.2)))
            f = font("semi", 40)
            lines = wrap("why am i in your body??", f, 330)
            bw = max(f.getlength(l) for l in lines) + 56
            bh = 52 * len(lines) + 36
            bx, by = sx + 30, sy + 316
            bub = Image.new("RGBA", (int(bw), int(bh)), (0, 0, 0, 0))
            bd = ImageDraw.Draw(bub)
            bd.rounded_rectangle((0, 0, bw - 1, bh - 1), radius=38, fill=(233, 233, 237))
            for i, l in enumerate(lines):
                bd.text((28, 16 + i * 52), l, font=f, fill=INK)
            place(img, bub, bx + bw / 2, by + bh / 2, scale=max(0.01, 0.6 + 0.4 * k))
            if te(S, 1, 0.15) <= lt < ts(S, 2, 0.35):                    # she's typing...
                ty = by + bh + 22
                d.rounded_rectangle((bx, ty, bx + 124, ty + 66), radius=33, fill=(233, 233, 237))
                for j in range(3):
                    a = 0.5 + 0.5 * math.sin(lt * 9 - j * 0.9)
                    d.ellipse((bx + 26 + j * 28 - 9, ty + 33 - 9 - 6 * a, bx + 26 + j * 28 + 9, ty + 33 + 9 - 6 * a),
                              fill=(int(150 - 40 * a),) * 3)
        d.rounded_rectangle((sx + 26, sy + sh - 120, sx + sw - 26, sy + sh - 56), radius=32, outline=(210, 210, 216),
                            width=3)
        d.text((sx + 56, sy + sh - 88), "iMessage", font=font("semi", 28), fill=(170, 170, 178), anchor="lm")
    d.rounded_rectangle((cx - 82, sy + 18, cx + 82, sy + 58), radius=20, fill=(10, 10, 12))   # dynamic island
    d.rounded_rectangle((cx - 90, sy + sh - 22, cx + 90, sy + sh - 12), radius=5,
                        fill=(30, 30, 34) if lt >= t_open else (255, 255, 255))


@functools.lru_cache(maxsize=2)
def notebook_sprite():
    Wn, Hn = 1240, 820
    im = Image.new("RGBA", (Wn, Hn), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((10, 16, Wn - 1, Hn - 1), radius=22, fill=(0, 0, 0, 70))
    d.rounded_rectangle((0, 0, Wn - 12, Hn - 16), radius=22, fill=(255, 252, 238))
    for i in range(9):
        y = NB_RULE0 + i * NB_STEP
        if y < Hn - 40:
            d.line((30, y, Wn - 44, y), fill=(170, 200, 235), width=3)
    d.line((150, 20, 150, Hn - 34), fill=(240, 140, 150), width=4)
    for y in range(46, Hn - 60, 84):
        d.ellipse((44, y, 80, y + 36), fill=(225, 220, 205))
        d.arc((20, y - 12, 72, y + 48), 100, 260, fill=(150, 150, 160), width=7)
    ft = ImageFont.truetype(GARAMOND_IT, 92)
    f = ImageFont.truetype(GARAMOND_IT, 64)
    d.text((190, 34), "back row", font=ft, fill=(40, 40, 96))
    heart(d, 190 + ft.getlength("back row") + 52, 92, 28, (230, 80, 120))
    for i, l in enumerate(NB_LINES):
        d.text((190, NB_RULE0 + i * NB_STEP - 62), l, font=f, fill=(30, 40, 116))
    mini_head(d, 1040, 610, 66, "me")                     # the doodle in the margin
    for hx, hy, r in ((950, 506, 17), (1134, 496, 22), (1150, 690, 15), (936, 680, 12)):
        heart(d, hx, hy, r, (230, 80, 120))
    return im


NB_LINES = ["you sit in the back row", "and you never say hi", "i've drawn you in the margins", "a hundred times"]
NB_RULE0, NB_STEP = 236, 78


NOTES = [("Mia, I've liked you since…", "Sep 4"), ("Mia, ok don't laugh but…", "Sep 19"),
         ("Mia, hey so I was wondering…", "Oct 2"), ("Mia, you probably don't know me…", "Oct 30"),
         ("Mia, your song at lunch was…", "Nov 14"), ("Mia, happy birthday!! from…", "Dec 8"),
         ("Mia, nvm", "Jan 6"), ("Mia, would you maybe want to…", "Feb 13"), ("Mia, I think about…", "Mar 3"),
         ("Mia, sorry I was weird in…", "Apr 21"), ("Mia, I almost said hi today", "May 2"),
         ("Mia, okay this is the one…", "Jun 9")]


def notes_view(scroll, count):
    """My phone, Notes app, folder 'Unsent'."""
    w, h = 560, 860
    im = Image.new("RGBA", (w + 20, h + 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((12, 18, w + 12, h + 18), radius=70, fill=(0, 0, 0, 90))
    d.rounded_rectangle((0, 0, w, h), radius=70, fill=(22, 22, 28))
    scr = Image.new("RGBA", (w - 28, h - 28), (250, 249, 246, 255))
    sd = ImageDraw.Draw(scr)
    lw = scr.width
    top = 230
    for i, (a, b) in enumerate(NOTES * 2):
        y = top + i * 104 - scroll
        if y < top - 104 or y > scr.height:
            continue
        sd.text((34, y + 14), a, font=font("bold", 30), fill=INK)
        sd.text((34, y + 56), b + "  ·  never sent", font=font("semi", 24), fill=(150, 150, 156))
        sd.line((34, y + 100, lw - 20, y + 100), fill=(226, 224, 220), width=2)
    sd.rectangle((0, 0, lw, top - 6), fill=(250, 249, 246))
    sd.text((30, 64), "‹ Folders", font=font("semi", 30), fill=(232, 168, 0))
    sd.text((30, 104), "Unsent", font=font("black", 62), fill=INK)
    sd.text((30, 180), f"{count} notes", font=font("semi", 28), fill=(150, 150, 156))
    sd.line((0, top - 6, lw, top - 6), fill=(226, 224, 220), width=2)
    rr_mask = Image.new("L", scr.size, 0)
    ImageDraw.Draw(rr_mask).rounded_rectangle((0, 0, scr.width - 1, scr.height - 1), radius=58, fill=255)
    scr.putalpha(rr_mask)
    im.alpha_composite(scr, (14, 14))
    d.rounded_rectangle((w / 2 - 70, 30, w / 2 + 70, 62), radius=16, fill=(10, 10, 12))
    return im


# ======================================================================================
# Backgrounds (world resolution, cached)
# ======================================================================================
MIRROR = (1580, 286, 1860, 960)          # glass of the standing mirror in her room
BED_TOP = 790


def bed(d, x0, x1, top, duvet, frame=(250, 246, 248)):
    d.rounded_rectangle((x0, top - 210, x0 + 64, FLOOR - 20), radius=30, fill=frame)
    d.rounded_rectangle((x0 + 30, top + 30, x1, top + 112), radius=18, fill=(248, 248, 250))
    d.rounded_rectangle((x0 + 50, top, x1 + 12, top + 124), radius=44, fill=duvet)
    d.rounded_rectangle((x0 + 50, top + 86, x1 + 12, top + 124), radius=20, fill=tuple(int(c * 0.86) for c in duvet))
    d.rounded_rectangle((x0 + 84, top - 58, x0 + 290, top + 24), radius=36, fill=(252, 252, 255))
    for lx in (x0 + 70, x1 - 26):
        d.rectangle((lx, top + 112, lx + 26, FLOOR - 20), fill=tuple(int(c * 0.78) for c in frame))


@functools.lru_cache(maxsize=None)
def guitar_sprite():
    im = Image.new("RGBA", (260, 640), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    body, edge = (204, 134, 74), (124, 76, 40)
    d.ellipse((30, 330, 230, 570), fill=body, outline=edge, width=6)
    d.ellipse((55, 220, 205, 380), fill=body, outline=edge, width=6)
    d.rectangle((70, 340, 190, 372), fill=body)
    d.ellipse((100, 296, 160, 356), fill=(40, 26, 18))
    d.rectangle((116, 40, 144, 300), fill=(92, 58, 36))
    d.rounded_rectangle((104, 0, 156, 62), radius=10, fill=(72, 46, 30))
    for k in range(3):
        for s in (-1, 1):
            d.ellipse((130 + s * 34 - 8, 10 + k * 17 - 5, 130 + s * 34 + 8, 10 + k * 17 + 5), fill=(222, 222, 228))
    d.rectangle((94, 484, 166, 500), fill=(64, 42, 28))
    for k in range(6):
        d.line((120 + k * 4, 30, 120 + k * 4, 492), fill=(238, 238, 238), width=1)
    return im.rotate(-11, resample=Image.BICUBIC, expand=True)


def fairy_bulbs(x0=150, x1=2010, y=118, sag=96, step=68, seed=3):
    rng = random.Random(seed)
    out = []
    x = x0 + step / 2
    while x < x1:
        u = (x - (x0 + x1) / 2) / ((x1 - x0) / 2)
        out.append((x, y + sag * (1 - u * u) + 16, rng.choice([(255, 226, 150), (255, 200, 120), (255, 240, 205)])))
        x += step
    return out


def bg_her_room():
    im = vgrad(WW, WH, (238, 212, 234), (224, 194, 224))
    d = ImageDraw.Draw(im, "RGBA")
    window(d, (180, 190, 560, 560), (255, 238, 214), (255, 214, 186), frame=(252, 248, 250), panes=2)
    d.rectangle((120, 150, 620, 168), fill=(200, 170, 190))
    for xa, xb in ((126, 236), (504, 614)):
        d.rounded_rectangle((xa, 160, xb, 660), radius=44, fill=(255, 255, 255, 150))
    # polaroids on a string
    d.line((640, 300, 1000, 318, 1360, 300), fill=(120, 96, 100), width=3, joint="curve")
    rng = random.Random(4)
    for i, x in enumerate(range(680, 1340, 132)):
        y = 316 - abs(x - 1000) * 0.05
        d.rectangle((x, y, x + 96, y + 112), fill=(255, 255, 255), outline=(225, 220, 220), width=2)
        d.rectangle((x + 8, y + 8, x + 88, y + 82), fill=rng.choice([(250, 190, 200), (180, 210, 250),
                                                                      (250, 220, 160), (200, 240, 210)]))
        d.ellipse((x + 30, y + 26, x + 66, y + 62), fill=(255, 255, 255, 120))
        d.rectangle((x + 40, y - 8, x + 56, y + 10), fill=(150, 110, 90))
    # band poster
    d.rectangle((1180, 430, 1420, 700), fill=(36, 30, 70))
    d.ellipse((1250, 460, 1350, 560), fill=(255, 224, 140))
    d.ellipse((1272, 452, 1372, 552), fill=(36, 30, 70))
    d.text((1300, 610), "MOON CLUB", font=font("black", 34), fill=(255, 255, 255), anchor="mm")
    d.text((1300, 656), "world tour", font=font("semi", 22), fill=(200, 190, 255), anchor="mm")
    floor_band(d, (210, 172, 144))
    d.rectangle((0, FLOOR - 46, WW, FLOOR - 22), fill=(250, 240, 248))
    d.ellipse((900, 1018, 1520, 1110), fill=(246, 184, 206))
    bed(d, 240, 1080, BED_TOP, (246, 160, 196))
    paste(im, guitar_sprite(), 1110, 470)
    x0, y0, x1, y1 = MIRROR
    d.line((x0 + 30, y1 + 20, x0 - 40, FLOOR - 14), fill=(206, 180, 140), width=16)
    d.line((x1 - 30, y1 + 20, x1 + 40, FLOOR - 14), fill=(206, 180, 140), width=16)
    d.rounded_rectangle((x0 - 28, y0 - 28, x1 + 28, y1 + 28), radius=44, fill=(242, 228, 200), outline=(206, 180, 140),
                        width=6)
    d.rectangle(MIRROR, fill=(196, 220, 230))
    # fairy lights along the top of the wall
    bulbs = fairy_bulbs()
    pts = []
    for i in range(0, 233):
        x = 150 + (2010 - 150) * i / 232
        u = (x - 1080) / 930
        pts.append((x, 118 + 96 * (1 - u * u)))
    d.line(pts, fill=(96, 76, 86), width=4)
    for x, y, col in bulbs:
        d.ellipse((x - 28, y - 28, x + 28, y + 28), fill=col + (70,))
        d.ellipse((x - 10, y - 13, x + 10, y + 13), fill=col)
    return im


def bg_phone_room():
    im = bg("her_room").filter(ImageFilter.GaussianBlur(10))
    return Image.blend(im, Image.new("RGB", im.size, (60, 40, 70)), 0.3)


def bg_school_back():
    im = vgrad(WW, WH, (172, 210, 242), (214, 232, 246))
    d = ImageDraw.Draw(im, "RGBA")
    for cx, cy, s in ((420, 74, 0.8), (1480, 56, 1.0)):
        for ox, oy, r in ((-70, 10, 50), (0, -10, 66), (74, 12, 48)):
            d.ellipse((cx + ox * s - r * s, cy + oy * s - r * s, cx + ox * s + r * s, cy + oy * s + r * s),
                      fill=(255, 255, 255, 235))
    top = 150
    d.rectangle((0, top, WW, FLOOR - 20), fill=(146, 112, 100))
    rng = random.Random(8)
    for row, y in enumerate(range(top + 30, FLOOR - 20, 46)):
        off = 0 if row % 2 == 0 else 62
        for x in range(-124 + off, WW, 124):
            v = rng.randint(-12, 12)
            d.rectangle((x + 4, y + 4, x + 120, y + 42), fill=(180 + v, 92 + v // 2, 72 + v // 2))
    d.rectangle((0, top, WW, top + 34), fill=(156, 150, 144))
    for x0 in (300, 1000):
        d.rectangle((x0, 230, x0 + 380, 440), fill=(70, 92, 112))
        d.polygon([(x0, 230), (x0 + 140, 230), (x0, 360)], fill=(110, 140, 160))
        d.rectangle((x0, 230, x0 + 380, 440), outline=(222, 222, 216), width=14)
        d.line((x0 + 190, 230, x0 + 190, 440), fill=(222, 222, 216), width=10)
    dx0, dx1 = 1680, 1920
    d.rectangle((dx0 - 16, 540, dx1 + 16, FLOOR - 20), fill=(118, 122, 128))
    d.rectangle((dx0, 556, dx1, FLOOR - 20), fill=(150, 156, 162))
    d.rectangle((dx0 + 70, 600, dx1 - 70, 700), fill=(196, 220, 230))
    d.rounded_rectangle((dx0 + 20, 800, dx1 - 20, 826), radius=10, fill=(90, 94, 100))
    d.rounded_rectangle((1740, 470, 1860, 520), radius=8, fill=(40, 150, 80))
    d.text((1800, 495), "EXIT", font=font("black", 30), fill=(230, 255, 230), anchor="mm")
    floor_band(d, (156, 156, 160))
    return im


def bg_classroom():
    im = vgrad(WW, WH, (240, 230, 204), (230, 218, 190))
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((0, 700, WW, FLOOR), fill=(218, 204, 176))
    d.rectangle((240, 140, 1420, 590), fill=(130, 92, 58))
    d.rectangle((262, 162, 1398, 568), fill=(46, 86, 68))
    d.rectangle((240, 586, 1420, 606), fill=(150, 110, 72))
    d.text((830, 270), "PUBLIC SPEAKING", font=font("black", 70), fill=(236, 240, 232), anchor="mm")
    d.text((830, 360), "Period 3", font=font("semi", 44), fill=(210, 226, 214), anchor="mm")
    d.line((560, 410, 1100, 410), fill=(210, 226, 214), width=4)
    wall_clock(d, 1560, 236)
    window(d, (1700, 160, 2080, 560), (190, 220, 245), (226, 238, 245), frame=(250, 248, 240), panes=2)
    floor_band(d, (176, 150, 120))
    return im


def bg_backstage():
    im = vgrad(WW, WH, (34, 26, 46), (18, 14, 28))
    d = ImageDraw.Draw(im, "RGBA")
    for row, y in enumerate(range(0, FLOOR - 20, 60)):
        off = 0 if row % 2 else 70
        for x in range(-140 + off, WW, 140):
            d.rectangle((x + 4, y + 4, x + 136, y + 56), fill=(40, 32, 54))
    gap = 1470
    d.polygon([(gap - 10, 0), (gap + 22, 0), (gap + 60, FLOOR - 20), (gap - 360, FLOOR - 20)], fill=(255, 236, 190, 36))
    for i, x in enumerate(range(gap + 18, WW + 60, 60)):
        d.rectangle((x, 0, x + 60, FLOOR - 20), fill=(150, 26, 40) if i % 2 == 0 else (120, 18, 32))
    for x in (300, 362):
        d.line((x, 0, x, 760), fill=(170, 150, 120), width=6)
    d.rounded_rectangle((268, 756, 394, 860), radius=30, fill=(120, 100, 80))
    d.rounded_rectangle((120, 840, 520, FLOOR - 20), radius=10, fill=(30, 30, 36))
    d.rectangle((120, 840, 520, 858), fill=(170, 170, 180))
    d.rectangle((120, 940, 520, 952), fill=(170, 170, 180))
    d.rounded_rectangle((560, 170, 900, 260), radius=12, fill=(80, 10, 16), outline=(255, 70, 70), width=5)
    d.text((730, 215), "QUIET PLEASE", font=font("black", 40), fill=(255, 120, 120), anchor="mm")
    floor_band(d, (36, 30, 40))
    return im


def bg_stage():
    im = vgrad(WW, WH, (34, 26, 58), (16, 12, 30))
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((620, 150, 1540, 270), radius=16, fill=(30, 60, 140))
    d.text((1080, 210), "TALENT SHOW", font=font("black", 74), fill=(255, 220, 90), anchor="mm")
    for xx in (680, 1480):
        star4(d, xx, 210, 30, (255, 220, 90))
    for side in (0, 1):
        for i in range(8):
            x = i * 56 if side == 0 else WW - 448 + i * 56
            d.rectangle((x, 0, x + 56, 860), fill=(160, 26, 42) if i % 2 == 0 else (128, 18, 34))
    d.rectangle((0, 0, WW, 110), fill=(150, 22, 38))
    for x in range(0, WW, 120):
        d.chord((x, 60, x + 120, 160), 0, 180, fill=(150, 22, 38))
    d.rectangle((0, 100, WW, 112), fill=(220, 180, 80))
    d.rectangle((0, 860, WW, FLOOR), fill=(150, 98, 60))
    for y in range(884, FLOOR, 36):
        d.line((0, y, WW, y), fill=(130, 84, 50), width=3)
    d.rectangle((0, FLOOR, WW, FLOOR + 30), fill=(70, 44, 30))
    d.rectangle((0, FLOOR + 30, WW, WH), fill=(14, 12, 22))
    return im


def car(d, x, yb, col):
    d.rounded_rectangle((x, yb - 120, x + 420, yb - 34), radius=34, fill=col)
    d.rounded_rectangle((x + 80, yb - 196, x + 320, yb - 100), radius=40, fill=col)
    d.rounded_rectangle((x + 104, yb - 180, x + 196, yb - 112), radius=16, fill=(40, 50, 80))
    d.rounded_rectangle((x + 206, yb - 180, x + 298, yb - 112), radius=16, fill=(40, 50, 80))
    for wx in (x + 88, x + 330):
        d.ellipse((wx - 42, yb - 76, wx + 42, yb + 8), fill=(10, 10, 14))
        d.ellipse((wx - 16, yb - 50, wx + 16, yb - 18), fill=(70, 70, 80))


def bg_parking():
    im = vgrad(WW, WH, (10, 14, 42), (44, 30, 74))
    d = ImageDraw.Draw(im, "RGBA")
    rng = random.Random(21)
    for _ in range(150):
        x, y = rng.uniform(0, WW), rng.uniform(0, 500)
        r = rng.choice((1.6, 2.2, 2.8, 3.6))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 240, rng.randint(110, 255)))
    d.ellipse((1712, 102, 1868, 258), fill=(250, 244, 220, 40))
    d.ellipse((1748, 138, 1832, 222), fill=(250, 244, 220))
    d.rectangle((0, 470, 1500, 832), fill=(26, 24, 52))
    d.polygon([(0, 470), (750, 400), (1500, 470)], fill=(26, 24, 52))
    for x in range(90, 1440, 150):
        d.rectangle((x, 560, x + 88, 640), fill=(255, 214, 130) if (x // 150) % 3 else (56, 52, 90))
    d.rectangle((1500, 520, WW, 832), fill=(32, 30, 60))
    for x in range(1560, 2120, 110):
        d.rectangle((x, 600, x + 70, 650), fill=(255, 226, 150))
    d.rectangle((0, 832, WW, WH), fill=(38, 38, 56))
    for x in range(-240, WW + 240, 270):
        d.line((x, WH, x + 140, 850), fill=(140, 140, 165), width=6)
    car(d, 100, 1020, (60, 70, 112))
    car(d, 1660, 1020, (112, 52, 62))
    d.rectangle((1071, 300, 1089, FLOOR - 16), fill=(28, 28, 38))
    d.rectangle((1060, FLOOR - 40, 1100, FLOOR - 12), fill=(28, 28, 38))
    d.polygon([(1030, 296), (1130, 296), (1112, 262), (1048, 262)], fill=(28, 28, 38))
    return im


def bg_my_room():
    im = vgrad(WW, WH, (174, 194, 226), (158, 180, 214))
    d = ImageDraw.Draw(im, "RGBA")
    window(d, (180, 190, 560, 560), (255, 196, 150), (255, 230, 188), frame=(240, 242, 248), panes=2)
    d.rectangle((700, 190, 920, 470), fill=(18, 22, 52))
    d.ellipse((746, 266, 874, 394), fill=(232, 124, 72))
    d.ellipse((700, 316, 920, 344), outline=(244, 206, 156), width=6)
    rng = random.Random(9)
    for _ in range(14):
        x, y = rng.uniform(712, 908), rng.uniform(200, 460)
        d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(255, 255, 255))
    d.rectangle((980, 210, 1170, 450), fill=(246, 130, 52))
    d.ellipse((1015, 270, 1135, 390), fill=(222, 104, 34), outline=(50, 24, 10), width=5)
    d.line((1075, 270, 1075, 390), fill=(50, 24, 10), width=4)
    d.line((1015, 330, 1135, 330), fill=(50, 24, 10), width=4)
    d.text((1075, 420), "HOOPS", font=font("black", 28), fill=(255, 240, 220), anchor="mm")
    floor_band(d, (150, 118, 94))
    d.rectangle((1500, 780, 2040, 810), fill=(122, 92, 72))
    for lx in (1520, 1996):
        d.rectangle((lx, 810, lx + 24, FLOOR - 20), fill=(100, 74, 58))
    d.rounded_rectangle((1580, 540, 1900, 744), radius=10, fill=(30, 32, 40))
    d.rectangle((1598, 558, 1882, 726), fill=(60, 92, 146))
    d.rectangle((1722, 744, 1758, 780), fill=(30, 32, 40))
    d.arc((1930, 690, 2010, 770), 180, 360, fill=(30, 30, 36), width=10)
    d.rounded_rectangle((1922, 726, 1944, 772), radius=8, fill=(30, 30, 36))
    d.rounded_rectangle((1996, 726, 2018, 772), radius=8, fill=(30, 30, 36))
    bed(d, 240, 1080, BED_TOP, (56, 74, 124), frame=(236, 236, 242))
    return im


def bg_lockers():
    im = th.bg_hallway()
    d = ImageDraw.Draw(im, "RGBA")
    paste(im, flyer_sprite("TALENT SHOW", "WINNER: MIA", "congrats!!"), 920, 470)
    return im


MY_BGS = {"her_room": bg_her_room, "phone_room": bg_phone_room, "school_back": bg_school_back,
          "classroom": bg_classroom, "backstage": bg_backstage, "stage": bg_stage, "parking": bg_parking,
          "my_room": bg_my_room, "lockers": bg_lockers}


@functools.lru_cache(maxsize=None)
def bg(name):
    return MY_BGS[name]() if name in MY_BGS else base.bg(name)


# ======================================================================================
# Scenes
# ======================================================================================
def twinkle(d, lt):
    for i, (x, y, col) in enumerate(fairy_bulbs()):
        a = 0.5 + 0.5 * math.sin(lt * 2.4 + i * 1.7)
        if a > 0.75:
            r = 34
            d.ellipse((x - r, y - r, x + r, y + r), fill=col + (int(110 * (a - 0.75) * 4),))


def sc_wake(img, d, lt, S):
    """Her room: wake up, walk to the mirror, it's Mia."""
    twinkle(d, lt)
    t_walk0, t_walk1 = ts(S, 1, 0.05), ts(S, 1, 1.75)
    t_rev = ts(S, 2)
    d2 = te(S, 2) - ts(S, 2)
    t_badge = t_rev + d2 * 0.62
    if lt < t_walk0:
        x, walk, sit = 800, None, True
    else:
        k = ease_in_out(prog(lt, t_walk0, t_walk1))
        x, walk, sit = lerp(800, 1340, k), (lt * 9 if k < 1 else None), False
    if lt < 0.55:
        expr = "tired"
    elif lt < t_rev:
        expr = "nervous" if lt > te(S, 0, -0.6) else "neutral"
    elif lt < ts(S, 3):
        expr = "shock"
    else:
        expr = "nervous"
    look = math.sin(lt * 2.3) if lt < t_walk0 else 1.0
    # reflection
    gx0, gy0, gx1, gy1 = MIRROR
    glass = vgrad(gx1 - gx0, gy1 - gy0, (200, 224, 232), (178, 206, 216)).convert("RGBA")
    gd = ImageDraw.Draw(glass, "RGBA")
    near = prog(lt, t_walk1 - 0.6, t_walk1)
    if near > 0:
        refl = Image.new("RGBA", glass.size, (0, 0, 0, 0))
        person(ImageDraw.Draw(refl, "RGBA"), 140, gy1 - gy0 - 4, 0.92, shirt=PINK, hair="long", hair_col=MIA_HAIR,
               hood=False, t=lt,
               seed=2, expr=expr, look=-0.5,
               arms=("head", "head") if ts(S, 3, 0.2) < lt < ts(S, 3, 1.6) else ("down", "down"))
        glass.alpha_composite(Image.blend(Image.new("RGBA", glass.size, (0, 0, 0, 0)), refl, near))
    for poly in (((256, 0), (280, 0), (230, 160), (240, 120)), ((70, 500), (92, 500), (34, 674), (12, 674))):
        gd.polygon(poly, fill=(255, 255, 255, 44))
    img.paste(glass.convert("RGB"), (gx0, gy0))
    arms = ("head", "head") if ts(S, 3, 0.2) < lt < ts(S, 3, 1.6) else ("down", "down")
    hx, hy = body_mia(d, x, FLOOR, lt, pose="sit" if sit else "stand", expr=expr, look=look,
                      look_y=-0.4 if lt < t_walk0 else 0, walk=walk, arms=arms)
    soul(img, d, hx, hy, "me", lt, k=prog(lt, t_badge, t_badge + 0.35), side=1)
    th.show_thought(img, "3 years. Zero words.", hx - 120, hy - 70, lt, ts(S, 3, 0.4), te(S, 3, 0.5), side="right",
                    size=50)
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (ts(S, 1), (1.04, 1080, 620)), (t_walk1, (1.2, 1440, 600)),
                       (t_rev, (1.2, 1440, 600)), (t_rev + 0.16, (2.15, 1720, 480)), (t_badge - 0.2, (2.2, 1720, 480)),
                       (t_badge + 0.35, (1.32, 1420, 560)), (S["dur"], (1.4, 1400, 560))])
    fx = {"cam": cam}
    if t_rev <= lt < t_rev + 0.4:
        fx["flash"] = 0.65 * (1 - (lt - t_rev) / 0.4)
    if t_rev <= lt < t_rev + 0.6:
        fx["shake"] = 1 - (lt - t_rev) / 0.6
    return fx


def sc_phone(img, d, lt, S):
    """The text from my own number + the notification with the rule."""
    hx, hy = body_mia(d, 560, FLOOR, lt, arms=("down", "phone"), phone_hand=1, look=0.8, look_y=0.4,
                      expr="neutral" if lt < ts(S, 0, 0.5) else ("shock" if lt < ts(S, 2) else "nervous"))
    soul(img, d, hx, hy, "me", lt, side=-1)
    draw_phone(img, d, lt, S)
    t_b = ts(S, 2, 0.15)
    if lt >= t_b:
        k = ease_out_back(prog(lt, t_b, t_b + 0.45))
        rule = "To switch back, you must each do the thing the other person is most afraid of."
        n = int(len(rule) * clamp01((lt - ts(S, 3)) / max(0.1, (te(S, 3) - ts(S, 3)) * 0.85))) if lt >= ts(S, 3) else 0
        body = rule[:n] if n else "…"
        body2, chip = "", None
        if lt >= ts(S, 4):
            body2 = "Deadline: midnight. Or you stay like this. Forever."
            if lt >= ts(S, 4, 0.5):
                tt = timer_text(base.scene_at(S["start"] + lt + 1e-4), lt)
                chip = "{⏳} " + (tt[0] if tt else "16:59:00")
        spr = mystery_banner(body, body2, chip=chip)
        place(img, spr, PHX + PHW / 2 + 7, PHY + 66 + spr.height / 2 - (1 - k) * 420, scale=1.0)
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (ts(S, 2), (1.04, 1100, 620)), (ts(S, 3), (1.3, 1440, 520)),
                       (S["dur"], (1.36, 1440, 520))])
    return {"cam": cam}


def sc_meet(img, d, lt, S):
    """Behind the school: meeting my own body."""
    k_in = ease_in_out(prog(lt, 0.3, 2.6))
    mx = lerp(2400, 1420, k_in)
    walking = k_in < 1
    me_expr = "nervous" if lt < ts(S, 1) else "neutral"
    if ts(S, 2) <= lt < te(S, 3):
        me_expr = "nervous"
    if lt >= ts(S, 4, 0.6):
        me_expr = "shock"
    hx, hy = body_mia(d, 780, FLOOR, lt, expr=me_expr, look=-1 if ts(S, 3) <= lt < te(S, 3) else 1,
                      talk=ts(S, 2) < lt < te(S, 2), arms=("chest", "chest") if ts(S, 2) <= lt < te(S, 3) else ("down", "down"))
    soul(img, d, hx, hy, "me", lt, side=-1)
    mia_expr = "nervous" if lt < ts(S, 1) else ("neutral" if lt < ts(S, 4) else "sad")
    hx2, hy2 = body_me(d, mx, FLOOR, lt, backwards=True, facing=-1, walk=lt * 9 if walking else None, look=-1,
                       expr=mia_expr, talk=(ts(S, 1) < lt < te(S, 1)) or (ts(S, 4) < lt < te(S, 4)),
                       arms=("down", "hips") if ts(S, 1) <= lt < te(S, 1) else ("down", "down"))
    soul(img, d, hx2, hy2, "mia", lt, side=1, k=prog(lt, 1.6, 2.2))
    th.say_bubble(img, "Okay. What are you scared of?", hx2 - 40, 396, lt, ts(S, 1, -0.05), te(S, 1, 0.4),
                  tail="right", size=56)
    th.say_bubble(img, "Uh... public speaking.", hx + 50, 396, lt, ts(S, 2, -0.05), te(S, 2, 0.5), size=56)
    pop_emoji(img, "🤥", hx + 150, hy - 10, lt, ts(S, 3), te(S, 3, 0.4), 110)
    th.say_bubble(img, "Mine? The talent show. Tonight.", hx2 - 40, 396, lt, ts(S, 4, -0.05), te(S, 4, 0.2),
                  tail="right", size=56)
    if lt >= ts(S, 4, 1.0):
        sc = ease_out_back(prog(lt, ts(S, 4, 1.0), ts(S, 4, 1.35)))
        place(img, flyer_sprite(), 1806, 700, scale=max(0.01, sc * 0.9), rot=-3)
    pop_emoji(img, "🎤", hx + 140, hy - 40, lt, ts(S, 5, 0.9), 99, 120)
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (ts(S, 5), (1.04, 1080, 620)), (ts(S, 5, 0.5), (1.45, 800, 520)),
                       (S["dur"], (1.5, 800, 520))])
    return {"cam": cam}


def back_head(d, x, y, r, kind, col=INK):
    if kind == "long":
        d.rounded_rectangle((x - r * 1.1, y - r * 1.05, x + r * 1.1, y + r * 1.6), radius=r, fill=(58, 38, 30))
    d.ellipse((x - r, y - r, x + r, y + r), fill=col)
    if kind == "bun":
        d.ellipse((x - r * 0.4, y - r * 1.55, x + r * 0.4, y - r * 0.75), fill=col)
    elif kind == "cap":
        d.chord((x - r - 4, y - r - 6, x + r + 4, y + r * 0.4), 180, 360, fill=(210, 70, 60))
    elif kind == "long":
        d.chord((x - r - 6, y - r - 8, x + r + 6, y + r * 0.3), 180, 360, fill=(58, 38, 30))


CLASS = [(330, "cap", (90, 160, 110)), (640, "long", (232, 140, 64)), (950, "messy", (120, 120, 200)),
         (1260, "bun", (200, 70, 80)), (1570, "long", (90, 150, 200)), (1880, "messy", (230, 180, 60))]


def sc_class(img, d, lt, S):
    """She gives my 'scary' speech. Nails it. Nothing happens."""
    nailed = lt > te(S, 0, -0.9)
    hx, hy = body_me(d, 1170, FLOOR - 40, lt, backwards=True, arms=("down", "phone"), phone_hand=9,
                     talk=lt < te(S, 0, -1.0), expr="happy" if nailed else "neutral", look=-0.2)
    px, py = hand_pos(1170, FLOOR - 40, 1.0, 1, "phone")
    d.rectangle((px - 34, py - 52, px + 34, py + 40), fill=(252, 252, 248), outline=(200, 200, 200), width=2)
    for j in range(4):
        d.line((px - 22, py - 36 + j * 18, px + 22, py - 36 + j * 18), fill=(150, 150, 160), width=3)
    fizz = ts(S, 1) <= lt < ts(S, 1, 0.8)
    soul(img, d, hx, hy, "mia", lt, side=1, jitter=1.0 if fizz else 0.0)
    pop_emoji(img, "💨", hx + 230, hy - 200, lt, ts(S, 1, 0.2), ts(S, 1, 1.0), 100)
    for i, (x, kind, shirt) in enumerate(CLASS):
        y = 1118 + 6 * math.sin(lt * 2 + i)
        d.rounded_rectangle((x - 130, y + 56, x + 130, y + 280), radius=64, fill=shirt)
        back_head(d, x, y, 80, kind)
        if nailed and lt < ts(S, 1):
            a = 0.5 + 0.5 * math.sin(lt * 18 + i)
            for s in (-1, 1):
                hxx = x + s * (30 + 30 * a)
                d.ellipse((hxx - 22, y - 120 - 22, hxx + 22, y - 120 + 22), fill=INK)
    pop_emoji(img, "👏", 1500, 600, lt, te(S, 0, -0.8), ts(S, 1), 110)
    t_card = te(S, 1, 0.15)
    if lt >= t_card:
        card = sms_card("+1 (555) 284-0193", "it didn't work {😭} what are you ACTUALLY scared of??")
        sc = 0.5 + 0.5 * ease_out_back(prog(lt, t_card, t_card + 0.32))
        cy = 250
        place(img, card, 1080, cy, scale=sc, alpha=clamp01((lt - t_card) / 0.1))
        if lt >= ts(S, 2, -0.2):                                       # typing a reply... then deleting it
            msg = "i'm scared of"
            p = prog(lt, ts(S, 2, -0.2), ts(S, 2, 0.9))
            q = prog(lt, ts(S, 2, 1.0), ts(S, 2, 1.5))
            shown = msg[:int(len(msg) * p * (1 - q))]
            y0 = cy + card.height / 2 + 24
            d.rounded_rectangle((560, y0, 1600, y0 + 84), radius=42, fill=(255, 255, 255), outline=(200, 200, 208),
                                width=3)
            d.text((604, y0 + 42), shown + ("|" if int(lt * 3) % 2 else ""), font=font("semi", 40), fill=INK,
                   anchor="lm")
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (ts(S, 1), (1.06, 1060, 600)), (t_card, (1.06, 1060, 600)),
                       (S["dur"], (1.14, 1080, 520))])
    return {"cam": cam}


def sc_song_found(img, d, lt, S):
    """5 PM, her room: her notebook. The song is about a boy in the back row..."""
    twinkle(d, lt)
    nb_in, nb_out = ts(S, 1, -0.45), te(S, 1, 0.25)
    smug = lt >= ts(S, 2)
    hx, hy = body_mia(d, 800, FLOOR, lt, pose="sit", arms=("hold", "hold"), look_y=0 if smug else 1,
                      look=0.2 if smug else 0, expr="smug" if smug else "neutral")
    hp = hand_pos(800, FLOOR, MIA_U, 0, "hold", sit=True)
    d.rectangle((hp[0] - 20, hp[1] - 50, hp[0] + 150, hp[1] + 10), fill=(250, 246, 230), outline=(180, 170, 150),
                width=3)
    soul(img, d, hx, hy, "me", lt, side=-1)
    if nb_in <= lt < nb_out + 0.5:
        k_in = ease_out_cubic(prog(lt, nb_in, nb_in + 0.5))
        k_out = ease_in_out(prog(lt, nb_out, nb_out + 0.45))
        nb = notebook_sprite()
        nx = 1080 - nb.width / 2
        ny = 200 + (1 - k_in) * 1200 + k_out * 1300
        paste(img, nb, nx, ny)
        span = te(S, 1) - ts(S, 1)
        for i, (a, b) in enumerate(((0.0, 0.45), (0.5, 0.95))):
            p = prog(lt, ts(S, 1, span * a), ts(S, 1, span * b))
            if p > 0:
                f = ImageFont.truetype(GARAMOND_IT, 64)
                wl = f.getlength(NB_LINES[i]) * p
                yy = ny + NB_RULE0 + i * NB_STEP
                d.rectangle((nx + 184, yy - 46, nx + 196 + wl, yy - 4), fill=(255, 226, 60, 110))
    th.show_thought(img, "lucky guy...", hx + 70, hy - 110, lt, ts(S, 2, 0.05), 99, side="left", size=54)
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (nb_in, (1.22, 900, 640)), (nb_out, (1.22, 1080, 600)),
                       (ts(S, 2), (1.55, 860, 480)), (S["dur"], (1.62, 860, 470))])
    return {"cam": cam, "tint": (255, 140, 60, 44)}


def sc_backstage(img, d, lt, S):
    """Backstage. Her hands won't stop shaking."""
    beat = (lt % 0.78)
    pulse = math.exp(-beat * 9) + 0.6 * math.exp(-max(0.0, beat - 0.2) * 9) * (beat > 0.2)
    shake = math.sin(lt * 57) * 3.5
    host = lt >= ts(S, 2, -0.1)
    if host:
        gap_k = ease_out_cubic(prog(lt, ts(S, 2, -0.1), ts(S, 2, 0.6)))
        d.polygon([(1460, 0), (1490, 0), (1530, FLOOR - 20), (1100 - 300 * gap_k, FLOOR - 20)],
                  fill=(255, 236, 190, int(60 * gap_k)))
    hx, hy = body_mia(d, 820 + shake, FLOOR, lt, arms=("chest", "chest"), expr="nervous", look=0.6 if host else 0.1,
                      look_y=0 if host else 0.5)
    soul(img, d, hx, hy, "me", lt, side=-1)
    th.say_bubble(img, "Next up... MIA!", 1500, 380, lt, ts(S, 2, -0.05), te(S, 2, 0.6), tail="right", size=60)
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (te(S, 1), (1.42, 860, 520)), (ts(S, 2, 0.1), (1.12, 1080, 600)),
                       (S["dur"], (1.14, 1080, 600))])
    return {"cam": cam, "tint": (200, 20, 40, int(46 * pulse))}


def crowd(d, lt, stand_k, lights_k):
    for row, y0, r, col in ((0, 1150, 64, (32, 26, 46)), (1, 1236, 80, (14, 12, 24))):
        for i, x in enumerate(range(160 + row * 95, 2120, 190)):
            lift = stand_k * (62 + 16 * math.sin(i * 1.3 + row))
            y = y0 - lift
            if stand_k > 0.3:
                a = 0.5 + 0.5 * math.sin(lt * 15 + i * 1.7)
                for s in (-1, 1):
                    hxx = x + s * (r * 0.95 - a * r * 0.55)
                    d.line((x + s * r * 1.1, y + r, hxx, y - r * 1.6), fill=col, width=int(r * 0.42))
                    d.ellipse((hxx - r * 0.3, y - r * 1.95, hxx + r * 0.3, y - r * 1.35), fill=col)
            d.rounded_rectangle((x - r * 1.5, y + r * 0.7, x + r * 1.5, y + r * 3.2), radius=r, fill=col)
            d.ellipse((x - r, y - r, x + r, y + r), fill=col)
            if lights_k > 0 and (i + row) % 3 == 0:
                sx, sy = x + math.sin(lt * 1.6 + i) * 34, y - r - 70
                d.ellipse((sx - 30, sy - 30, sx + 30, sy + 30), fill=(255, 250, 220, int(70 * lights_k)))
                d.ellipse((sx - 9, sy - 9, sx + 9, sy + 9), fill=(255, 255, 240, int(255 * lights_k)))


def sc_stage(img, d, lt, S):
    """Her song, in her voice. Standing ovation."""
    k_walk = ease_in_out(prog(lt, 0.15, 1.9))
    x = lerp(560, 1040, k_walk)
    d.polygon([(x - 70, 0), (x + 70, 0), (x + 310, FLOOR), (x - 310, FLOOR)], fill=(255, 244, 210, 50))
    d.ellipse((x - 330, FLOOR - 64, x + 330, FLOOR + 44), fill=(255, 240, 200, 72))
    song0 = ts(S, 1)
    singing = any(song0 + a <= lt < song0 + b for a, b in SONG_VOCAL)
    in_song = song0 <= lt < song0 + 6.2
    ended = lt >= ts(S, 2, -0.3)
    hx, hy = body_mia(d, x, FLOOR, lt, walk=lt * 9 if k_walk < 1 else None, talk=singing,
                      expr="happy" if (in_song or ended) else "nervous", look=0.3 if in_song else 0)
    soul(img, d, hx, hy, "me", lt, side=-1, ring=not in_song)
    mx = 1124
    d.line((mx, FLOOR - 10, mx, 600), fill=(40, 40, 46), width=10)
    d.ellipse((mx - 60, FLOOR - 26, mx + 60, FLOOR - 2), fill=(40, 40, 46))
    d.line((mx, 600, mx - 46, 566), fill=(40, 40, 46), width=8)
    d.rounded_rectangle((mx - 72, 534, mx - 40, 578), radius=14, fill=(70, 70, 76))
    if in_song:
        for i in range(5):
            ph = ((lt - song0) * 0.55 + i / 5) % 1
            note(d, hx + 90 + math.sin(i * 2 + lt * 2) * 60 + ph * 120, hy - 40 - ph * 360, 1.2,
                 255 * (1 - ph) * prog(lt, song0, song0 + 0.5))
    stand_k = ease_out_cubic(prog(lt, ts(S, 2, 0.9), ts(S, 2, 1.6)))
    crowd(d, lt, stand_k, prog(lt, song0 + 0.8, song0 + 2.0) * (1 - stand_k * 0.6))
    if stand_k > 0.5:
        r = random.Random(int(lt * 6))
        for _ in range(3):
            fx_, fy_ = r.uniform(300, 1900), r.uniform(900, 1150)
            d.ellipse((fx_ - 16, fy_ - 16, fx_ + 16, fy_ + 16), fill=(255, 255, 255, 200))
    t_ok = te(S, 2, 0.2)
    if lt >= t_ok:
        spr = mystery_banner("1 of 2 complete.", width=900, size=64, col=(130, 240, 150), emo="✅")
        sc = 0.5 + 0.5 * ease_out_back(prog(lt, t_ok, t_ok + 0.35))
        place(img, spr, 1080, 262, scale=sc)
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (1.9, (1.18, 1040, 600)), (song0, (1.2, 1040, 600)),
                       (song0 + 5.4, (1.5, 1040, 520)), (ts(S, 2, 0.6), (1.5, 1040, 520)),
                       (ts(S, 2, 1.5), (1.0, 1080, 620)), (S["dur"], (1.02, 1080, 620))])
    return {"cam": cam}


def count_start(S):
    return S["te"][-1] + 0.35


def sc_parking(img, d, lt, S):
    """11:59 PM. My notes app. She says what I never could."""
    lamp = 0.85 + 0.15 * math.sin(lt * 1.3)
    d.polygon([(1046, 300), (1114, 300), (1520, FLOOR + 10), (640, FLOOR + 10)], fill=(255, 220, 150, int(40 * lamp)))
    d.ellipse((600, FLOOR - 70, 1560, FLOOR + 60), fill=(255, 220, 150, int(46 * lamp)))
    d.ellipse((1050, 284, 1110, 318), fill=(255, 236, 190))
    c0 = count_start(S)
    swap = prog(lt, c0 - 0.25, c0 + 2.3)
    showing = ts(S, 1) <= lt < te(S, 2, 0.3)
    confess = ts(S, 5) <= lt
    # Mia's body (me inside)
    me_expr = "neutral"
    if lt >= ts(S, 3):
        me_expr = "sad"
    if lt >= ts(S, 5, 1.0):
        me_expr = "shock"
    if lt >= te(S, 5, -0.4):
        me_expr = "love"
    hx, hy = body_mia(d, 760, FLOOR, lt, expr=me_expr, look=1 if not (ts(S, 3) <= lt < ts(S, 5)) else 0.4,
                      look_y=1 if ts(S, 3) <= lt < ts(S, 5) else 0)
    if lt >= ts(S, 6):
        blush(d, hx, hy, MIA_U, prog(lt, ts(S, 6), ts(S, 6, 0.6)))
    # my body (Mia inside)
    mia_expr = "sad" if lt >= ts(S, 3) else "neutral"
    if lt >= te(S, 5, -0.6):
        mia_expr = "happy"
    talk = any(ts(S, i) < lt < te(S, i) for i in (1, 3, 5))
    hx2, hy2 = body_me(d, 1400, FLOOR, lt, backwards=True, facing=-1, look=-1, expr=mia_expr, talk=talk,
                       arms=("point", "down") if showing else ("down", "down"))
    if showing:
        px, py = hand_pos(1400, FLOOR, 1.0, 0, "point", facing=-1)
        d.rounded_rectangle((px - 30, py - 56, px + 30, py + 44), radius=10, fill=(22, 22, 28))
        d.rounded_rectangle((px - 24, py - 50, px + 24, py + 38), radius=7, fill=(236, 244, 255))
    if confess and lt < c0:
        tears(d, hx2, hy2, lt, 1.0, prog(lt, ts(S, 5, 0.5), ts(S, 5, 1.2)))
    # souls: swapped, until midnight puts them back
    if swap <= 0:
        soul(img, d, hx, hy, "me", lt, side=-1)
        soul(img, d, hx2, hy2, "mia", lt, side=1)
    else:
        p = ease_in_out(swap)
        a1, b1 = badge_xy(hx, hy, -1), badge_xy(hx2, hy2, 1)
        for who, (sx0, sy0), (sx1, sy1), arc in (("me", a1, b1, 130), ("mia", b1, a1, 50)):
            for j in range(6):
                q = max(0.0, p - j * 0.035)
                tx, ty = lerp(sx0, sx1, q), lerp(sy0, sy1, q) - math.sin(math.pi * q) * arc
                star4(d, tx, ty, 26 - j * 3, SOUL[who] + (int(220 - j * 30),))
            bx, by = lerp(sx0, sx1, p), lerp(sy0, sy1, p) - math.sin(math.pi * p) * arc
            place(img, badge_sprite(who), bx, by, scale=1.0 + 0.25 * math.sin(math.pi * p))
        for hhx, hhy, who in ((hx, hy, "mia"), (hx2, hy2, "me")):
            d.ellipse((hhx - 110, hhy - 110, hhx + 110, hhy + 110), outline=SOUL[who] + (int(200 * p),), width=9)
    # bubbles + notes
    th.say_bubble(img, "I read your notes.", hx2 - 40, 330, lt, ts(S, 1, -0.05), te(S, 1, 0.3), tail="right", size=56)
    if ts(S, 2) <= lt < te(S, 2, 0.4):
        span = te(S, 2) - ts(S, 2)
        k = ease_out_back(prog(lt, ts(S, 2), ts(S, 2, 0.35))) * (1 - prog(lt, te(S, 2, 0.15), te(S, 2, 0.4)))
        count = int(214 * ease_out_cubic(prog(lt, ts(S, 2, 0.2), ts(S, 2, span * 0.45))))
        scroll = 520 * ease_in_out(prog(lt, ts(S, 2, 0.4), te(S, 2, -0.2)))
        place(img, notes_view(scroll, max(1, count)), 1080, 540, scale=max(0.01, 1.16 * k))
    th.say_bubble(img, "You were scared to tell me.", hx2 - 40, 330, lt, ts(S, 3, -0.05), te(S, 3, 0.3),
                  tail="right", size=56)
    th.say_bubble(img, "Mia... I've liked you since 9th grade.", hx2 - 40, 330, lt, ts(S, 5, -0.05), te(S, 5, 0.25),
                  tail="right", size=54)
    fx = {}
    if lt >= c0:
        n = 3 - int((lt - c0) / TICK)
        if n >= 1:
            st = (lt - c0) % TICK
            spr = text_sprite(str(n), 330, (255, 70, 80), (255, 70, 80), glow_col=(255, 50, 60))
            place(img, spr, 1080, 330, scale=1 + 0.45 * (1 - ease_out_back(st / 0.25)), alpha=clamp01(st / 0.05))
        fx["shake"] = 0.25 * prog(lt, c0, S["dur"])
    end = S["dur"] - 0.45
    if lt > end:
        fx["flash"] = clamp01((lt - end) / 0.25)
    fx["cam"] = keys_at(lt, [(0.0, (1.0, 1080, 620)), (ts(S, 4), (1.08, 1080, 600)), (te(S, 5), (1.3, 1080, 560)),
                             (c0, (1.24, 1080, 560)), (S["dur"], (1.3, 1080, 560))])
    return fx


def sc_morning(img, d, lt, S):
    """My room. My body."""
    happy = lt > ts(S, 0, 0.9)
    doubt = lt > te(S, 0, -1.4)
    hx, hy = body_me(d, 780, FLOOR, lt, pose="sit", arms=("chest", "chest") if lt < ts(S, 0, 1.6) else ("down", "down"),
                     look_y=1 if lt < ts(S, 0, 1.6) else 0, look=0.3 if doubt else 0,
                     expr="nervous" if doubt else ("happy" if happy else "shock"))
    cam = keys_at(lt, [(0.0, (1.15, 900, 600)), (S["dur"], (1.32, 860, 560))])
    fx = {"cam": cam}
    if lt < 0.7:
        fx["flash"] = 1 - lt / 0.7
    return fx


def sc_locker(img, d, lt, S):
    """She's waiting at my locker."""
    k_in = ease_in_out(prog(lt, 0.1, 1.9))
    x = lerp(-180, 740, k_in)
    me_expr = "neutral" if lt < ts(S, 1) else ("shock" if lt < te(S, 1, -0.6) else "love")
    if lt >= ts(S, 3):
        me_expr = "happy"
    hi = te(S, 3, -0.15)
    hx, hy = body_me(d, x, FLOOR, lt, walk=lt * 9 if k_in < 1 else None, look=1, expr=me_expr,
                     talk=hi <= lt < hi + 0.35)
    mia_expr = "happy" if lt < ts(S, 1) else ("nervous" if lt < te(S, 1, -0.5) else "happy")
    hx2, hy2 = body_mia(d, 1440, FLOOR, lt, facing=-1, look=-1, expr=mia_expr, talk=ts(S, 1) < lt < te(S, 1),
                        arms=("down", "down"))
    if lt >= ts(S, 1):
        b = prog(lt, ts(S, 1), ts(S, 1, 0.8))
        blush(d, hx2, hy2, MIA_U, b)
    if lt >= ts(S, 2):
        blush(d, hx, hy, 1.0, prog(lt, ts(S, 2), ts(S, 2, 0.6)))
        hearts_up(d, 1090, 660, lt, n=7, spread=90, rise=420, k=prog(lt, ts(S, 2), ts(S, 2, 0.6)))
    th.say_bubble(img, "It was always you.", hx2 - 40, 400, lt, ts(S, 1, 1.4), te(S, 1, 0.5), tail="right", size=58)
    th.say_bubble(img, "hi.", hx + 50, 400, lt, hi, 99, size=62)
    th.say_bubble(img, "hi :)", hx2 - 40, 400, lt, hi + 0.8, 99, tail="right", size=62)
    cam = keys_at(lt, [(0.0, (1.0, 1080, 620)), (ts(S, 1), (1.04, 1080, 620)), (te(S, 1), (1.26, 1090, 560)),
                       (S["dur"], (1.36, 1090, 540))])
    return {"cam": cam}


def sc_cta(img, d, lt, S):
    d.rectangle((0, 0, WW // 2, WH), fill=(255, 170, 204))
    d.rectangle((WW // 2, 0, WW, WH), fill=(66, 98, 178))
    d.ellipse((WW * 0.25 - 420, 160, WW * 0.25 + 420, 1000), fill=(255, 200, 222))
    d.line((WW // 2, 0, WW // 2, WH), fill=(255, 255, 255), width=8)
    hx, hy = body_mia(d, 380, FLOOR, lt, expr="love", look=1)
    hx2, hy2 = body_me(d, 760, FLOOR, lt, backwards=True, expr="love", look=-1, facing=-1)
    soul(img, d, hx, hy, "me", lt, side=-1)
    soul(img, d, hx2, hy2, "mia", lt, side=1)
    hearts_up(d, 570, 560, lt, n=6, spread=70, rise=300)
    body_me(d, 1620, FLOOR, lt, expr="nervous", arms=("head", "head"))
    for x, lab in ((540, "YES {💘}"), (1620, "NO WAY {😳}")):
        s = text_sprite(lab, 66, INK, INK, "black", stroke=0, shadow=False)
        d.rounded_rectangle((x - 250, 70, x + 250, 200), radius=28, fill=(255, 255, 252))
        place(img, s, x, 135)
    return {}


# ======================================================================================
# Story
# ======================================================================================
SCENES = [
    dict(fn=sc_wake, bg="her_room", tod="7:00 AM", lines=[
        N("One morning, I woke up... and this wasn't my room."),
        N("I walked to the mirror... and froze."),
        N("It was Mia. My crush. I was in her body.", pre=0.1),
        N("The girl I'd liked for three years... and never had the guts to talk to.")]),
    dict(fn=sc_phone, bg="phone_room", tod="7:01 AM", clock=7 * 3600 + 60, timer_from=4, lines=[
        N("Then her phone buzzed. A text... from my own number."),
        TEXTMSG("Why am I in your body?!"),
        N("Then a notification dropped down. No app. No sender."),
        N("To switch back, you must each do the thing the other person is most afraid of."),
        N("You have until midnight. Or you stay like this... forever.")], extra=0.4),
    dict(fn=sc_meet, bg="school_back", tod="8:00 AM", clock=8 * 3600, lines=[
        N("We met behind the school. Seeing my own body walk up to me was so weird."),
        MIA_IN_ME("Okay. What are you scared of?"),
        ME_IN_MIA("Uh... public speaking."),
        N("Total lie."),
        MIA_IN_ME("Mine's the talent show. Tonight. I'm supposed to sing a song I wrote."),
        N("So to get my body back... I had to sing. As her.")]),
    dict(fn=sc_class, bg="classroom", tod="11:00 AM", clock=11 * 3600, lines=[
        N("She gave a speech in my class, for me. And she nailed it."),
        N("Nothing happened.", pre=0.3),
        N("I didn't reply.", pre=1.9)], extra=0.9),
    dict(fn=sc_song_found, bg="her_room", tod="5:00 PM", clock=17 * 3600, lines=[
        N("In her room, I found her song."),
        N("It was about a boy in the back row... who never says hi."),
        N("Lucky guy.", pre=0.25)], extra=0.6),
    dict(fn=sc_backstage, bg="backstage", tod="9:30 PM", clock=21 * 3600 + 1800, lines=[
        N("Nine thirty. Backstage. Her hands wouldn't stop shaking."),
        N("And I finally got it. This is how she feels... every single day."),
        HOST("Next up... Mia!", pre=0.3)]),
    dict(fn=sc_stage, bg="stage", tod="9:31 PM", clock=21 * 3600 + 1860, lines=[
        N("I stepped into the spotlight, opened my mouth... and her voice came out."),
        SONG(pre=0.2),
        N("When it ended... the whole gym stood up.", pre=0.2)], extra=1.6),
    dict(fn=sc_parking, bg="parking", tod="11:59 PM", clock=23 * 3600 + 59 * 60, final=True, no_fade_out=True, lines=[
        N("Eleven fifty-nine. And she was still in my body."),
        MIA_IN_ME("I read your notes."),
        N("Two hundred and fourteen unsent messages. Every single one started with... Mia."),
        MIA_IN_ME("This whole time... you were scared to tell me."),
        N("So she did the one thing I was too scared to do."),
        MIA_IN_ME("Mia... I've liked you since ninth grade. I never said it... because I was scared you'd laugh."),
        N("She wasn't laughing.", pre=0.5)], extra=0.35 + 3 * TICK + 0.5),
    dict(fn=sc_morning, bg="my_room", tod="NEXT MORNING", no_fade_in=True, lines=[
        N("I woke up in my own body. Was it all a dream?", pre=0.3)]),
    dict(fn=sc_locker, bg="lockers", tod="8:00 AM", lines=[
        N("At school, she was waiting at my locker."),
        MIA("That song? The boy in the back row... it was always you."),
        N("Turns out, we were both scared of the same thing."),
        N("So this time... I said hi.", pre=0.2)], extra=1.9),
    dict(fn=sc_cta, bg=None, tod=None, lines=[
        N("Would you switch bodies with your crush? Tell me in the comments.")], extra=1.2),
]
IDX = {sc["fn"].__name__: i for i, sc in enumerate(SCENES)}


# ======================================================================================
# Engine hooks
# ======================================================================================
def fmt(sec):
    sec = max(0, int(sec))
    return f"{sec // 3600:02d}:{sec % 3600 // 60:02d}:{sec % 60:02d}"


def timer_text(k, lt):
    sc, S = SCENES[k], base.TL[k]
    if "clock" not in sc:
        return None
    if "timer_from" in sc and lt < S["ts"][sc["timer_from"]]:
        return None
    if sc.get("final"):
        c0 = count_start(S)
        if lt < c0:
            return fmt(math.ceil(59 - 56 * lt / c0)), True
        n = 3 - int((lt - c0) / TICK)
        return fmt(0 if lt > S["dur"] - 0.45 else max(0, n)), True
    left = 86400 - sc["clock"] - lt
    return fmt(left), left < 3600


@functools.lru_cache(maxsize=512)
def caption(markup):
    col = (255, 255, 255)
    if markup[:1] in CAP_COL:
        col, markup = CAP_COL[markup[0]], markup[1:]
    return text_sprite(markup, 64, col, col, "bold", stroke=3, shadow=True, maxw=820)


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
        txt, red = tt
        tg = base.tag("{⏳} " + txt, 30, (215, 30, 40) if red else (10, 10, 10))
        paste(pan, tg, PW - tg.width - TAG_INSET, 16)
    for c0, c1, txt in base.CAPS:
        if c0 <= t < c1:
            place(pan, caption(txt), PW / 2, PH * 0.80, scale=0.85 + 0.15 * ease_out_back((t - c0) / 0.12))
            break
    fade = 1.0
    if lt < 0.12 and k > 0 and not sc.get("no_fade_in"):
        fade = lt / 0.12
    if S["dur"] - lt < 0.08 and k < len(base.TL) - 1 and not sc.get("no_fade_out"):
        fade = min(fade, (S["dur"] - lt) / 0.08)
    if fade < 1:
        pan = Image.blend(Image.new("RGB", pan.size, (0, 0, 0)), pan, fade)
    return pan


def install():
    base.TITLE, base.PART, base.SCENES = TITLE, PART, SCENES
    base.ARM_POSES.update({"head": ((110, -30), (34, -124)), "chest": ((40, 110), (-44, 70)),
                           "hold": ((40, 100), (-36, 116))})
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
            if line["kind"] == "song":
                dur = line["dur"]
                caps += [(t + a, t + b, txt) for a, b, txt in SONG_CAPS]
            else:
                v = voices[li] if voices else None
                dur = len(v) / SR if v is not None else max(1.0, len(line["text"].split()) / 2.7)
                chunks = chunk_caption(line["text"])
                wts = [len(c) + 3 for c in chunks]
                ct = t
                for c, wgt in zip(chunks, wts):
                    cd = dur * wgt / sum(wts)
                    caps.append((ct, ct + cd, line["mark"] + c.upper().strip(",.:")))
                    ct += cd
            tsl.append(t - start)
            tel.append(t - start + dur)
            voice_at.append((li, t))
            t += dur + 0.22
            li += 1
        t += sc.get("extra", 0.0) + 0.25
        tl.append(dict(start=start, dur=t - start, ts=tsl, te=tel))
    return tl, caps, voice_at, t


# ======================================================================================
# Audio assets (ElevenLabs Music + sound effects), generated once and kept in audio/crush_swap/
# ======================================================================================
MUSIC_GLOBAL = (["cinematic piano underscore for a heartfelt teen romance story", "soft and intimate", "C major",
                 "76 bpm", "instrumental only"],
                ["vocals", "singing", "humming", "choir", "spoken word", "rap", "heavy drums", "EDM",
                 "distorted guitar"])
SFX = {
    "sfx_applause": ("Excited high school gym audience standing ovation: loud applause, cheering and whistles", 7.0),
    "sfx_crowd": ("Quiet murmur of a school gym audience waiting before a performance, indoors", 6.0),
    "sfx_hallway": ("High school hallway in the morning: lockers closing, footsteps, distant students chatting", 8.0),
    "sfx_magic": ("Magical sparkling whoosh, a shimmering transformation burst with soft chimes", 3.0),
    "sfx_birds": ("Gentle morning birds chirping outside a bedroom window, calm", 5.0),
}


def music_plan(tl, total):
    def T(i, j=0):
        return tl[i]["start"] + tl[i]["ts"][j]
    song_t = T(IDX["sc_stage"], 1)
    H_ = IDX["sc_parking"]
    flash_t = tl[H_]["start"] + tl[H_]["dur"] - 0.45

    def sec(name, styles, a, b):
        return name, styles, max(3.5, b - a)
    return {
        "cue_mystery": [
            sec("Waking up", ["dreamy music box and soft piano", "curious", "gentle morning"], 0, T(0, 2)),
            sec("The mirror", ["sudden suspense", "low piano notes", "sustained strings", "mysterious"], T(0, 2),
                tl[1]["start"]),
            sec("The notification", ["mysterious ticking pulse", "pizzicato", "suspense", "building tension"],
                tl[1]["start"], tl[2]["start"] + 1.0)],
        "cue_day": [
            sec("Meeting", ["light playful pizzicato strings and piano", "quirky", "awkward comedy"], tl[2]["start"],
                tl[3]["start"]),
            sec("The speech", ["playful, then deflated", "light comedic piano"], tl[3]["start"], tl[4]["start"]),
            sec("Her song", ["soft tender piano", "warm sunset", "curious"], tl[4]["start"], tl[5]["start"] + 1.0)],
        "cue_nervous": [
            sec("Backstage", ["anxious low strings", "slow heartbeat pulse", "tense", "quiet"], tl[5]["start"],
                T(IDX["sc_stage"], 0)),
            sec("Spotlight", ["anticipation", "rising strings swell", "hopeful tension"], T(IDX["sc_stage"], 0),
                song_t + 0.8)],
        "cue_confession": [
            sec("Last minute", ["quiet night", "sparse emotional piano notes", "tense", "ticking"], tl[H_]["start"],
                T(H_, 4)),
            sec("Confession", ["tender emotional piano melody", "soft strings enter", "heartfelt"], T(H_, 4),
                T(H_, 6)),
            sec("Midnight", ["emotional swell", "rising strings", "climax", "held chord"], T(H_, 6), flash_t + 0.6)],
        "cue_ending": [
            sec("Morning", ["soft hopeful piano", "morning light", "gentle"], tl[IDX["sc_morning"]]["start"],
                T(IDX["sc_locker"], 1)),
            sec("It was always you", ["warm romantic piano and strings", "heartfelt", "sweet"],
                T(IDX["sc_locker"], 1), T(IDX["sc_locker"], 3)),
            sec("Hi", ["uplifting", "warm resolution", "gentle ending"], T(IDX["sc_locker"], 3), total + 1.0)],
    }


def eleven_post(path, payload, out_path, timeout=300):
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        return False
    req = urllib.request.Request("https://api.elevenlabs.io" + path, data=json.dumps(payload).encode(), method="POST",
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read()
    except (urllib.error.URLError, OSError) as e:
        detail = e.read().decode(errors="replace")[:300] if hasattr(e, "read") else ""
        print(f"  ElevenLabs {path} failed: {e} {detail}")
        return False
    with open(out_path, "wb") as f:
        f.write(data)
    return True


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float32) / 32768.0


def load_assets(tl, total, generate=True):
    os.makedirs(ASSETS, exist_ok=True)
    out = {}
    plan = music_plan(tl, total)
    for name, sections in plan.items():
        p = os.path.join(ASSETS, name + ".mp3")
        if not os.path.exists(p) and generate:
            cp = {"positive_global_styles": MUSIC_GLOBAL[0], "negative_global_styles": MUSIC_GLOBAL[1],
                  "sections": [{"section_name": n, "positive_local_styles": st, "negative_local_styles": [],
                                "duration_ms": int(sec * 1000), "lines": []} for n, st, sec in sections]}
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
    p = os.path.join(ASSETS, "song_back_row.mp3")
    if os.path.exists(p):
        out["song"] = decode(p)
    return out


# ======================================================================================
# Audio mix
# ======================================================================================
def fft_filter(sig, lo=0.0, hi=1e9):
    n = len(sig)
    X = np.fft.rfft(sig)
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, n)


def reverb(sig, wet=0.15, decay=7.0, length=0.5, seed=4):
    rng = np.random.default_rng(seed)
    L = int(length * SR)
    ir = rng.standard_normal(L) * np.exp(-np.arange(L) / SR * decay)
    ir /= np.sqrt(np.sum(ir ** 2))
    out = wet * th.fftconv(sig, ir)
    out[:len(sig)] += sig
    return out * (np.abs(sig).max() / (np.abs(out).max() + 1e-9))


def build_audio(voices, voice_at, total, tl, assets):
    n = int(total * SR) + SR
    rng = np.random.default_rng(7)
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

    def clip(name, t0, t1, a=0.05, r=0.4):
        s = assets.get(name)
        if s is None:
            return None
        return fades(s[:max(1, int((t1 - t0) * SR))], a, r)

    def T(i, j=0, off=0.0, end=False):
        S = tl[i]
        return S["start"] + (S["te"][j] if end else S["ts"][j]) + off

    def thump():
        x = tt(0.22)
        return np.sin(2 * np.pi * np.cumsum(42 + 40 * np.exp(-x * 30)) / SR) * np.exp(-x * 16)

    def tick():
        x = tt(0.03)
        return np.sin(2 * np.pi * 2900 * x) * np.exp(-x * 220)

    def buzz(sec=0.5):
        x = tt(sec)
        return fades(np.sign(np.sin(2 * np.pi * 160 * x)) * 0.4 * (0.6 + 0.4 * np.sin(2 * np.pi * 26 * x)), 0.01, 0.05)

    def ping():
        return tone(1568, 0.35, (1, 0.3), 10) + np.concatenate([np.zeros(int(0.08 * SR)), tone(2093, 0.27, (1, 0.3), 10)])

    def whoosh(sec=0.4):
        return bandnoise(sec, 500, 5000) * np.sin(np.pi * tt(sec) / sec) ** 2

    def boom():
        x = tt(1.8)
        return sweep(80, 28, 1.8) * np.exp(-x * 2.2)

    ST, PK = IDX["sc_stage"], IDX["sc_parking"]
    song_t = T(ST, 1)
    flash_t = tl[PK]["start"] + tl[PK]["dur"] - 0.45

    # --- score
    music = np.zeros(n)
    spans = [("cue_mystery", 0.0, tl[2]["start"] + 0.5, 0.6, 0.9),
             ("cue_day", tl[2]["start"] - 0.3, tl[5]["start"] + 0.5, 0.5, 0.9),
             ("cue_nervous", tl[5]["start"] - 0.2, song_t + 0.25, 0.4, 0.5),
             ("cue_confession", tl[PK]["start"], flash_t + 0.25, 0.8, 0.25),
             ("cue_ending", tl[PK + 1]["start"] + 0.2, total, 1.2, 1.5)]
    have_score = all(s[0] in assets for s in spans)
    if have_score:
        for name, a, b, fi, fo in spans:
            add(music, clip(name, a, b, fi, fo), a, 1.0)
        music *= 0.42 / (np.percentile(np.abs(music[music != 0]), 99.5) + 1e-9) if np.any(music) else 1.0
    else:                                                     # fallback: soft piano bed (no API key)
        chords = [[261.63, 329.63, 392], [196, 246.94, 293.66], [220, 261.63, 329.63], [174.61, 220, 261.63]]
        beat, b, tpos = 60 / 76, 0, 0.0
        while tpos < total:
            ch = chords[(b // 4) % 4]
            for e in range(2):
                add(music, tone(ch[(b * 2 + e) % 3] * (2 if e else 1), 1.4, dec=2.2), tpos + e * beat / 2, 0.12)
            if b % 4 == 0:
                add(music, tone(ch[0] / 2, beat * 4, (1, 0.3), 0.7), tpos, 0.16)
            b += 1
            tpos += beat
        i0, i1 = int((song_t - 0.2) * SR), int((song_t + 7.0) * SR)
        music[i0:i1] = 0

    # keep the score under a ceiling so it never fights the voices
    env = np.sqrt(th.smooth(music ** 2, 0.4) + 1e-12)
    music *= th.smooth(np.minimum(1.0, 0.07 / env), 0.25)

    # --- voices: every clip matched to the same speech level; dialogue gets a little room so it sits in the
    #     scene, the host is on a PA
    def level(sig):
        a = np.abs(sig)
        return np.sqrt(np.mean(sig[a > 0.1 * a.max()] ** 2)) + 1e-9

    out, venv = np.zeros(n), np.zeros(n)
    if voices:
        for li, t0 in voice_at:
            line, sig = lines[li], voices[li]
            if sig is None:
                continue
            proc = sig * (VOICE_LEVEL / level(sig))
            if line["voice"] == "host":
                proc = reverb(fft_filter(proc, 250, 4500), wet=0.45, decay=3.2, length=1.2)
            elif line["kind"] == "say":
                proc = reverb(proc, wet=0.12, decay=9.0, length=0.35)
            proc *= VOICE_LEVEL / level(proc[:len(sig)])
            proc *= min(1.0, 0.98 / (np.abs(proc).max() + 1e-9))
            add(out, proc, t0, 1.0)
            add(venv, np.ones(len(sig)), t0)
    music *= 1 - 0.55 * np.clip(th.smooth(venv, 0.15), 0, 1)

    # --- the song (her voice)
    songbuf = np.zeros(n)
    if "song" in assets:
        s = fades(assets["song"][:int(7.4 * SR)], 0.01, 1.6)
        add(songbuf, reverb(s, wet=0.16, decay=3.0, length=1.0), song_t, 0.95)

    # --- sound effects
    sfx = np.zeros(n)
    for S in tl[1:]:
        add(sfx, whoosh(), S["start"] - 0.15, 0.12)
    # wake: room tone, reveal boom with a reverse swell
    add(sfx, bandnoise(tl[0]["dur"], 60, 400), 0.0, 0.015)
    t_rev = T(0, 2)
    x = tt(0.7)
    add(sfx, bandnoise(0.7, 800, 7000) * (x / 0.7) ** 3, t_rev - 0.7, 0.16)
    add(sfx, boom(), t_rev, 0.75)
    add(sfx, tone(110, 2.5, (1, 0.5, 0.3), 1.3), t_rev, 0.18)
    # phone: buzz, open, notification, ticking clock from the deadline on
    add(sfx, buzz(), T(1, 0), 0.22)
    add(sfx, buzz(), T(1, 0, 0.6), 0.22)
    add(sfx, ping(), T(1, 1, -0.1), 0.18)
    add(sfx, tone(220, 3.0, (1, 0.6, 0.35, 0.2), 1.1) + tone(330, 3.0, (1, 0.4), 1.4), T(1, 2, 0.15), 0.14)
    add(sfx, fades(np.sin(2 * np.pi * 55 * tt(5.0)) + 0.5 * np.sin(2 * np.pi * 82.4 * tt(5.0)), 1.0, 1.0), T(1, 3), 0.05)
    tk = T(1, 4)
    while tk < tl[2]["start"] - 0.1:
        add(sfx, tick(), tk, 0.35)
        tk += 1.0
    # meet: footsteps, a cartoon 'boing' on the lie, a sting on 'I had to sing'
    for j in range(5):
        add(sfx, fades(bandnoise(0.07, 120, 1600), 0.003, 0.05), tl[2]["start"] + 0.4 + j * 0.45, 0.12)
    x = tt(0.45)
    add(sfx, np.sin(2 * np.pi * np.cumsum(300 + 260 * np.sin(2 * np.pi * 9 * x) * np.exp(-x * 4)) / SR) * np.exp(-x * 5),
        T(2, 3), 0.16)
    add(sfx, boom(), T(2, 5, 0.9), 0.4)
    # class: clapping, a deflating 'womp', the text ping, typing
    for j in range(26):
        add(sfx, fades(bandnoise(0.04, 900, 6000), 0.002, 0.03), T(3, 0, 0, True) - 0.8 + j * 0.06 + rng.uniform(0, 0.04),
            0.06)
    add(sfx, fades(sweep(420, 140, 0.9) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt(0.9))), 0.02, 0.3), T(3, 1, 0.1), 0.1)
    add(sfx, ping(), T(3, 1, 0, True) + 0.15, 0.2)
    for j in range(10):
        add(sfx, fades(bandnoise(0.025, 1500, 6000), 0.002, 0.015), T(3, 2, -0.2) + j * 0.1, 0.07)
    # her room: page flip
    add(sfx, fades(bandnoise(0.35, 1200, 8000), 0.02, 0.25), T(4, 1, -0.45), 0.1)
    # backstage: heartbeat + muffled crowd
    S = tl[5]
    tb = S["start"] + 0.1
    while tb < S["start"] + S["dur"]:
        add(sfx, thump(), tb, 0.55)
        add(sfx, thump(), tb + 0.2, 0.36)
        tb += 0.78
    if "sfx_crowd" in assets:
        add(sfx, fades(fft_filter(np.tile(assets["sfx_crowd"], 4)[:int(S["dur"] * SR)], 0, 700), 0.5, 0.5),
            S["start"], 0.5)
    # stage: crowd hush, mic thump, applause
    S = tl[ST]
    if "sfx_crowd" in assets:
        c = assets["sfx_crowd"][:int((song_t - S["start"]) * SR)]
        add(sfx, fades(c, 0.2, 1.0), S["start"], 0.22)
    add(sfx, thump(), song_t - 0.12, 0.3)
    if "sfx_applause" in assets:
        ap = assets["sfx_applause"]
        add(sfx, fades(ap, 0.6, 1.5), song_t + 5.2, 0.35)
        add(sfx, fades(ap, 0.3, 1.8), T(ST, 2, 0.8), 0.55)
    add(sfx, ping(), T(ST, 2, 0.2, True), 0.16)
    # parking lot: crickets, ticking, heartbeat, countdown, the swap back
    S = tl[PK]
    r = random.Random(5)
    tc = S["start"] + 0.2
    while tc < flash_t:
        for c in range(3):
            add(sfx, tone(4600 + r.uniform(-200, 200), 0.03, (1,), 60), tc + c * 0.05, 0.03)
        tc += r.uniform(0.35, 0.8)
    tk = S["start"] + 0.3
    c0 = S["start"] + count_start(S)
    while tk < c0:
        add(sfx, tick(), tk, 0.3)
        tk += 1.0
    tb = T(PK, 5)
    while tb < flash_t:
        add(sfx, thump(), tb, 0.45)
        add(sfx, thump(), tb + 0.2, 0.3)
        tb += 0.72
    for j in range(3):
        add(sfx, tick(), c0 + j * TICK, 0.8)
        add(sfx, tone(440 + j * 110, 0.3, (1, 0.5), 8), c0 + j * TICK, 0.25)
    if "sfx_magic" in assets:
        add(sfx, fades(assets["sfx_magic"], 0.01, 0.6), flash_t - 0.5, 0.6)
    add(sfx, boom(), flash_t, 0.5)
    i0 = int((flash_t + 0.25) * SR)
    music[i0:int((tl[PK + 1]["start"] + 0.2) * SR)] = 0
    # morning: birds
    S = tl[PK + 1]
    if "sfx_birds" in assets:
        add(sfx, fades(assets["sfx_birds"], 0.6, 1.0), S["start"] + 0.1, 0.35)
    # lockers: hallway ambience, a sparkle on the hearts and on 'hi'
    S = tl[IDX["sc_locker"]]
    if "sfx_hallway" in assets:
        add(sfx, fades(np.tile(assets["sfx_hallway"], 3)[:int(S["dur"] * SR)], 0.4, 1.0), S["start"], 0.22)
    for at in (T(IDX["sc_locker"], 2, 0.1), T(IDX["sc_locker"], 3, 0, True) - 0.15):
        for j, f in enumerate((1568, 2093, 2637, 3136)):
            add(sfx, tone(f, 0.6, (1, 0.2), 6), at + j * 0.07, 0.05)
    add(sfx, tone(1200, 0.25, (1, 0.3), 14), tl[-1]["start"] + 0.05, 0.12)

    mix = out + music + songbuf + sfx
    mix = mix[:int(total * SR)]
    mix = np.tanh(mix * 1.05)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.92
    f = int(0.6 * SR)
    mix[-f:] *= np.linspace(1, 0, f)
    return mix


def loudnorm_filter(wav, target=-14.0):
    """Two-pass loudnorm: measure first, then normalise linearly to YouTube's -14 LUFS."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav, "-af",
                        f"loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    try:
        m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
        return (f"loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:"
                "linear=true")
    except (ValueError, KeyError):
        return f"loudnorm=I={target}:TP=-1.5:LRA=11"


# ======================================================================================
def tts_one(text, voice_id, cache):
    r = base.synth_voice_elevenlabs([text], cache, voice_id)
    return r[0] if r else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "crush_swap_story.mp4"))
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
        voices = [None if l["kind"] == "song" else tts_one(l["text"], VOICE[l["voice"]], cache) for l in lines]
        if any(v is None for v, l in zip(voices, lines) if l["kind"] != "song"):
            sys.exit("ElevenLabs narration failed (see message above).")
    tl, caps, voice_at, total = build_timeline(voices)
    base.init_worker(tl, caps, total)
    print(f"Video length: {total:.1f}s")
    for i, s in enumerate(tl):
        print(f"  scene {i:2d}  {s['start']:6.2f}s  ({s['dur']:5.2f}s)  {SCENES[i]['fn'].__name__}")

    if args.preview:
        os.makedirs(os.path.join(HERE, "preview"), exist_ok=True)
        for x in args.preview.split(","):
            p = os.path.join(HERE, "preview", f"crush_{float(x):06.2f}.png")
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
