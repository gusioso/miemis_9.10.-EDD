#!/usr/bin/env python3
"""Background for the Offline Short (replaces the plaid): navy blueprint grid with faint glowing circuit traces."""
import os
import random

from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rnd = random.Random(7)
img = Image.new("RGB", (W, H))
px = img.load()
top, bot = (14, 24, 52), (24, 38, 78)
for y in range(H):
    k = y / H
    c = tuple(int(a + (b - a) * k) for a, b in zip(top, bot))
    for x in range(W):
        px[x, y] = c
d = ImageDraw.Draw(img, "RGBA")
for x in range(0, W, 54):
    d.line([(x, 0), (x, H)], fill=(120, 170, 255, 22), width=1)
for y in range(0, H, 54):
    d.line([(0, y), (W, y)], fill=(120, 170, 255, 22), width=1)
for x in range(0, W, 270):
    d.line([(x, 0), (x, H)], fill=(120, 170, 255, 40), width=2)
for y in range(0, H, 270):
    d.line([(0, y), (W, y)], fill=(120, 170, 255, 40), width=2)
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
g = ImageDraw.Draw(glow)
traces = Image.new("RGBA", (W, H), (0, 0, 0, 0))
tdraw = ImageDraw.Draw(traces)
for i in range(46):
    x, y = rnd.randrange(0, W, 54), rnd.randrange(0, H, 54)
    pts = [(x, y)]
    for _ in range(rnd.randint(3, 7)):
        if rnd.random() < 0.5:
            x += rnd.choice([-1, 1]) * rnd.randint(2, 6) * 54
        else:
            y += rnd.choice([-1, 1]) * rnd.randint(2, 6) * 54
        pts.append((x, y))
    col = (80, 210, 255, 70) if i % 3 else (255, 120, 170, 60)
    tdraw.line(pts, fill=col, width=3, joint="curve")
    g.line(pts, fill=col[:3] + (90,), width=9)
    for (a, b) in (pts[0], pts[-1]):
        tdraw.ellipse([a - 7, b - 7, a + 7, b + 7], outline=col[:3] + (150,), width=3)
        g.ellipse([a - 14, b - 14, a + 14, b + 14], fill=col[:3] + (60,))
glow = glow.filter(ImageFilter.GaussianBlur(8))
img = Image.alpha_composite(img.convert("RGBA"), glow)
img = Image.alpha_composite(img, traces)
# soft vignette
v = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(v)
vd.ellipse([-300, -200, W + 300, H + 200], fill=255)
v = v.filter(ImageFilter.GaussianBlur(220))
dark = Image.new("RGBA", (W, H), (4, 8, 20, 255))
img = Image.composite(img, dark, v).convert("RGB")
img.save(os.path.join(ROOT, "public", "bg_circuit.png"))
print("ok")
