#!/usr/bin/env python3
"""
pov3d: a tiny box-based 3D renderer for cinematic "POV" story Shorts (blocky low-poly look).

  * scenes are made of boxes (rooms, furniture, blocky people, POV hands) and flat quads
    (screens, posters) that can carry a PIL image as texture
  * flat shading: hemispheric ambient + one directional light + point lights, depth fog
  * painter's algorithm per face, sorted inside layers:
        0 = room shell / far scenery, 1 = decals, 2 = objects, 3 = things held by the camera
  * near-plane clipping, perspective-correct textured quads (PIL PERSPECTIVE transform)
  * post: 1.5x supersampling, bloom, vignette, additive glow sprites
  * text overlays in the style of minimal serif POV videos: a small letter-spaced kicker,
    a big serif chapter label and an italic caption line
"""
import functools
import math
import os

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
SS = 1.5
RW, RH = int(W * SS), int(H * SS)
HERE = os.path.dirname(os.path.abspath(__file__))

CORNERS = np.array([(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
                    (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)], float)
FACE_IDX = [(1, 2, 6, 5), (0, 4, 7, 3), (3, 7, 6, 2), (0, 1, 5, 4), (4, 5, 6, 7), (0, 3, 2, 1)]
FACE_N = np.array([(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)], float)
NEAR = 0.02


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


class Camera:
    """yaw: + turns right, pitch: + looks up. fov is vertical, in degrees."""

    def __init__(self, pos, yaw=0.0, pitch=0.0, roll=0.0, fov=60.0):
        self.pos = np.asarray(pos, float)
        cy, sy, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pitch), math.sin(pitch)
        f = np.array([sy * cp, sp, cy * cp])
        r = np.array([cy, 0.0, -sy])
        u = np.cross(f, r)
        if roll:
            cr, sr = math.cos(roll), math.sin(roll)
            r, u = r * cr + u * sr, u * cr - r * sr
        self.f, self.r, self.u = f, r, u
        self.M = np.stack([r, u, f])
        self.F = (RH / 2) / math.tan(math.radians(fov) / 2)

    def to_cam(self, P):
        return (np.asarray(P, float) - self.pos) @ self.M.T

    def proj(self, C):
        return np.stack([RW / 2 + C[:, 0] / C[:, 2] * self.F, RH / 2 - C[:, 1] / C[:, 2] * self.F], 1)

    def attach(self, off):
        """Camera-space offset (right, up, forward) -> world point."""
        return self.pos + off[0] * self.r + off[1] * self.u + off[2] * self.f

    def basis(self):
        return np.stack([self.r, self.u, self.f], 1)


class Scene:
    def __init__(self, sky=(8, 10, 20), sky2=None, fog=None, fog_k=0.0, sun=(-0.35, -1.0, 0.45), amb=0.55,
                 dif=0.45, sun_col=(1.0, 1.0, 1.0), amb_col=(1.0, 1.0, 1.0)):
        self.sky, self.sky2 = tuple(sky), tuple(sky2 or sky)
        self.fog = np.array(fog if fog is not None else sky, float)
        self.fog_k = fog_k
        L = -np.asarray(sun, float)
        self.L = L / np.linalg.norm(L)
        self.amb, self.dif = amb, dif
        self.sun_col, self.amb_col = np.array(sun_col, float), np.array(amb_col, float)
        self.boxes, self.quads, self.lights, self.glows = [], [], [], []

    def box(self, c, size, col, R=None, layer=2, emissive=False):
        self.boxes.append((layer, np.asarray(c, float), np.asarray(size, float) / 2, np.asarray(col, float),
                           np.eye(3) if R is None else R, emissive))

    def quad(self, corners, tex=None, col=(255, 255, 255), layer=2, emissive=True, double=True, bright=1.0):
        """corners: top-left, top-right, bottom-right, bottom-left (world)."""
        self.quads.append((layer, np.asarray(corners, float), tex, np.asarray(col, float), emissive, double, bright))

    def light(self, pos, col, intensity=1.0, radius=1.5):
        self.lights.append((np.asarray(pos, float), np.asarray(col, float), intensity, radius))

    def glow(self, pos, radius, col, alpha=0.8):
        self.glows.append((np.asarray(pos, float), radius, col, alpha))


def rect_quad(center, right, up, w, h):
    """Quad corners from a centre, unit right/up vectors and a size."""
    c, r, u = np.asarray(center, float), np.asarray(right, float), np.asarray(up, float)
    return [c - r * w / 2 + u * h / 2, c + r * w / 2 + u * h / 2, c + r * w / 2 - u * h / 2, c - r * w / 2 - u * h / 2]


def clip_near(P):
    out = []
    n = len(P)
    for i in range(n):
        a, b = P[i], P[(i + 1) % n]
        ina, inb = a[2] >= NEAR, b[2] >= NEAR
        if ina:
            out.append(a)
        if ina != inb:
            t = (NEAR - a[2]) / (b[2] - a[2])
            out.append(a + (b - a) * t)
    return np.array(out)


def find_coeffs(out_pts, in_pts):
    A, B = [], []
    for (x, y), (u, v) in zip(out_pts, in_pts):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float))


@functools.lru_cache(maxsize=16)
def _sky(top, bot):
    yy = np.linspace(0, 1, RH)[:, None, None]
    arr = np.array(top, float) * (1 - yy) + np.array(bot, float) * yy
    return Image.fromarray(np.repeat(arr, RW, axis=1).astype(np.uint8))


@functools.lru_cache(maxsize=256)
def _glow_sprite(r, col):
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1].astype(np.float32)
    a = np.clip(1 - np.sqrt(xx ** 2 + yy ** 2) / r, 0, 1) ** 2.2
    return Image.fromarray((a[..., None] * np.array(col, np.float32)).clip(0, 255).astype(np.uint8))


def _shade(sc, n, cen, base):
    hemi = 0.78 + 0.22 * (0.5 + 0.5 * n[1])
    col = base * (sc.amb * hemi * sc.amb_col + sc.dif * max(0.0, float(n @ sc.L)) * sc.sun_col)
    for lp, lc, li, lr in sc.lights:
        d = lp - cen
        dist = math.sqrt(float(d @ d)) + 1e-6
        ndl = max(0.0, float(n @ d) / dist)
        if ndl > 0:
            col = col + base / 255.0 * lc * (li * ndl / (1 + (dist / lr) ** 2))
    return col


def _fogged(sc, col, depth):
    if sc.fog_k <= 0:
        return col
    f = 1 - math.exp(-sc.fog_k * depth)
    return col * (1 - f) + sc.fog * f


def render(sc, cam):
    """Render the scene at supersampled resolution, returns an RGB image (RW x RH)."""
    img = _sky(sc.sky, sc.sky2).copy()
    d = ImageDraw.Draw(img)
    items = []
    for layer, c, h, col, R, emis in sc.boxes:
        Wc = c + (CORNERS * h) @ R.T
        Cc = cam.to_cam(Wc)
        if (Cc[:, 2] < NEAR).all():
            continue
        z = np.maximum(Cc[:, 2], NEAR)
        sx, sy = Cc[:, 0] / z * cam.F, Cc[:, 1] / z * cam.F
        if (Cc[:, 2] > NEAR).all() and ((sx < -RW / 2).all() or (sx > RW / 2).all() or (sy < -RH / 2).all()
                                        or (sy > RH / 2).all()):
            continue
        N = FACE_N @ R.T
        for fi in range(6):
            idx = FACE_IDX[fi]
            cen = Wc[list(idx)].mean(0)
            if N[fi] @ (cen - cam.pos) >= 0:
                continue
            poly = Cc[list(idx)]
            if (poly[:, 2] < NEAR).any():
                poly = clip_near(poly)
                if len(poly) < 3:
                    continue
            colr = col if emis else _shade(sc, N[fi], cen, col)
            dep = float(np.linalg.norm(cen - cam.pos))
            items.append((layer, dep, 0, (poly, colr)))
    for layer, corners, tex, col, emis, double, bright in sc.quads:
        Cc = cam.to_cam(corners)
        if (Cc[:, 2] < NEAR).any():
            continue
        n = np.cross(corners[1] - corners[0], corners[3] - corners[0])
        n = n / (np.linalg.norm(n) + 1e-9)
        cen = corners.mean(0)
        facing = n @ (cen - cam.pos)
        if not double and facing >= 0:
            continue
        if facing > 0:
            n = -n
        dep = float(np.linalg.norm(cen - cam.pos))
        items.append((layer, dep, 1, (Cc, tex, col, emis, n, cen, bright)))
    items.sort(key=lambda it: (it[0], -it[1]))
    for layer, dep, kind, p in items:
        if kind == 0:
            poly, colr = p
            colr = np.clip(_fogged(sc, colr, dep), 0, 255)
            pts = cam.proj(poly)
            d.polygon([(float(x), float(y)) for x, y in pts], fill=(int(colr[0]), int(colr[1]), int(colr[2])))
        else:
            Cc, tex, col, emis, n, cen, bright = p
            pts = cam.proj(Cc)
            if tex is None:
                colr = col * bright if emis else _shade(sc, n, cen, col)
                colr = np.clip(_fogged(sc, colr, dep), 0, 255)
                d.polygon([(float(x), float(y)) for x, y in pts], fill=(int(colr[0]), int(colr[1]), int(colr[2])))
            else:
                k = bright
                if not emis:
                    k *= float(np.clip(_shade(sc, n, cen, np.array([255.0, 255.0, 255.0])).mean() / 255.0, 0, 1.4))
                _draw_tex(img, pts, tex, k)
    for pos, radius, col, alpha in sc.glows:
        C = cam.to_cam(pos[None])[0]
        if C[2] < 0.05:
            continue
        px, py = RW / 2 + C[0] / C[2] * cam.F, RH / 2 - C[1] / C[2] * cam.F
        r = int(min(900, max(3, radius * cam.F / C[2])))
        r = int(round(r / 3.0) * 3) or 3
        q = tuple(int(min(255, v * alpha) // 8 * 8) for v in col)
        spr = _glow_sprite(r, q)
        x0, y0 = int(px) - r, int(py) - r
        box = (max(0, x0), max(0, y0), min(RW, x0 + 2 * r + 1), min(RH, y0 + 2 * r + 1))
        if box[2] <= box[0] or box[3] <= box[1]:
            continue
        reg = img.crop(box)
        sp = spr.crop((box[0] - x0, box[1] - y0, box[2] - x0, box[3] - y0))
        img.paste(ImageChops.add(reg, sp), box[:2])
    return img


def _draw_tex(img, pts, tex, bright):
    x0, y0 = int(math.floor(pts[:, 0].min())), int(math.floor(pts[:, 1].min()))
    x1, y1 = int(math.ceil(pts[:, 0].max())), int(math.ceil(pts[:, 1].max()))
    x0c, y0c, x1c, y1c = max(0, x0), max(0, y0), min(RW, x1), min(RH, y1)
    if x1c - x0c < 2 or y1c - y0c < 2:
        return
    tw, th = tex.size
    try:
        co = find_coeffs([(x - x0c, y - y0c) for x, y in pts], [(0, 0), (tw, 0), (tw, th), (0, th)])
    except np.linalg.LinAlgError:
        return
    src = tex if tex.mode == "RGBA" else tex.convert("RGBA")
    out = src.transform((x1c - x0c, y1c - y0c), Image.PERSPECTIVE, tuple(co), Image.BILINEAR)
    if abs(bright - 1) > 0.02:
        rgb = out.convert("RGB").point(lambda v, k=bright: min(255, int(v * k)))
        rgb.putalpha(out.getchannel("A"))
        out = rgb
    img.paste(out, (x0c, y0c), out)


@functools.lru_cache(maxsize=4)
def _vignette(strength):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 1.42
    m = np.clip(1 - strength * np.clip(r - 0.25, 0, None) ** 1.6 * 1.9, 0, 1)
    return Image.fromarray((m * 255).astype(np.uint8)).convert("RGB")


def post(img, bloom=0.55, vignette=0.45, thresh=150, tint=None):
    img = img.resize((W, H), Image.BOX)
    if bloom > 0:
        small = img.resize((W // 6, H // 6), Image.BILINEAR)
        br = small.point(lambda v: max(0, v - thresh) * 2)
        br = br.filter(ImageFilter.GaussianBlur(7)).resize((W, H), Image.BILINEAR)
        img = ImageChops.add(img, br.point(lambda v, k=bloom: int(v * k)))
    if tint:
        img = Image.blend(img, Image.new("RGB", img.size, tint[:3]), tint[3] / 255.0)
    if vignette > 0:
        img = ImageChops.multiply(img, _vignette(vignette))
    return img


# ======================================================================================
# Blocky characters
# ======================================================================================
SKIN = (226, 178, 140)


def person(sc, pos, yaw=0.0, shirt=(70, 110, 200), pants=(44, 46, 62), skin=SKIN, hair=(60, 42, 32), sit=False,
           seat=0.47, arm_l=0.0, arm_r=0.0, head_yaw=0.0, head_pitch=0.0, hood=False, scale=1.0, shoes=(34, 34, 40),
           hat=None, layer=2):
    """Blocky person standing on pos (x, y, z), facing +z rotated by yaw. arm_*: raise forward (radians)."""
    R = rot_y(yaw)
    o = np.asarray(pos, float)
    s = scale

    def P(x, y, z):
        return o + R @ (np.array([x, y, z]) * s)

    if sit:
        for side in (-1, 1):
            sc.box(P(side * 0.11, seat, 0.22), np.array((0.2, 0.18, 0.5)) * s, pants, R, layer)
            sc.box(P(side * 0.11, seat / 2, 0.44), np.array((0.18, seat, 0.18)) * s, pants, R, layer)
            sc.box(P(side * 0.11, 0.04, 0.5), np.array((0.2, 0.08, 0.3)) * s, shoes, R, layer)
        ty = seat + 0.38
    else:
        for side in (-1, 1):
            sc.box(P(side * 0.11, 0.45, 0), np.array((0.2, 0.86, 0.22)) * s, pants, R, layer)
            sc.box(P(side * 0.11, 0.04, 0.04), np.array((0.21, 0.08, 0.3)) * s, shoes, R, layer)
        ty = 0.88 + 0.31
    sc.box(P(0, ty, 0), np.array((0.46, 0.62, 0.26)) * s, shirt, R, layer)
    for side, ang in ((-1, arm_l), (1, arm_r)):
        Ra = R @ rot_x(-ang)
        piv = P(side * 0.31, ty + 0.27, 0)
        sc.box(piv + Ra @ np.array([0, -0.29 * s, 0]), np.array((0.16, 0.58, 0.16)) * s, shirt, Ra, layer)
        sc.box(piv + Ra @ np.array([0, -0.64 * s, 0]), np.array((0.15, 0.13, 0.15)) * s, skin, Ra, layer)
    Rh = R @ rot_y(head_yaw) @ rot_x(-head_pitch)
    hc = P(0, ty + 0.31 + 0.17, 0)
    sc.box(hc, np.array((0.3, 0.3, 0.3)) * s, skin, Rh, layer)
    if hood:
        sc.box(hc + Rh @ np.array([0, 0.01, -0.03]) * s, np.array((0.36, 0.36, 0.33)) * s, shirt, Rh, layer)
    else:
        sc.box(hc + Rh @ np.array([0, 0.13, -0.02]) * s, np.array((0.32, 0.08, 0.32)) * s, hair, Rh, layer)
        sc.box(hc + Rh @ np.array([0, 0.04, -0.13]) * s, np.array((0.32, 0.2, 0.08)) * s, hair, Rh, layer)
        for side in (-1, 1):
            sc.box(hc + Rh @ np.array([side * 0.07, 0.02, 0.151]) * s, np.array((0.05, 0.05, 0.01)) * s,
                   (24, 24, 28), Rh, layer)
    if hat is not None:
        for i in range(4):
            w = 0.24 - i * 0.055
            sc.box(hc + Rh @ np.array([0, 0.2 + i * 0.06, 0]) * s, np.array((w, 0.06, w)) * s, hat, Rh, layer)
    return hc


def pov_hands(sc, cam, left=(-0.2, -0.3, 0.42), right=(0.2, -0.3, 0.42), sleeve=(40, 46, 70), skin=SKIN,
              pitch=0.5, layer=3):
    """The viewer's own blocky forearms + hands, attached to the camera."""
    B = cam.basis()
    for off, side in ((left, -1), (right, 1)):
        Rl = B @ rot_x(pitch) @ rot_y(-side * 0.18)
        hand = cam.attach(off)
        sc.box(hand, (0.09, 0.05, 0.11), skin, Rl, layer)
        sc.box(hand + Rl @ np.array([0, -0.005, -0.2]), (0.1, 0.07, 0.3), sleeve, Rl, layer)


# ======================================================================================
# Text overlays (reference style: letter-spaced kicker, big serif label, italic caption)
# ======================================================================================
FONT_DIR = os.path.join(HERE, "fonts")
SERIF = os.path.join(FONT_DIR, "EBGaramond.ttf")
SERIF_I = os.path.join(FONT_DIR, "EBGaramond-Italic.ttf")
SANS = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"


@functools.lru_cache(maxsize=32)
def _font(path, size, wght=None):
    for p in (path, "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"):
        try:
            f = ImageFont.truetype(p, size)
            if wght:
                try:
                    f.set_variation_by_axes([wght])
                except Exception:
                    pass
            return f
        except OSError:
            continue
    return ImageFont.load_default(size)


def _wrap(text, f, maxw):
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


def _shadowed(layer, radius=7, alpha=170):
    sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    a = layer.getchannel("A").filter(ImageFilter.GaussianBlur(radius)).point(lambda v: int(v * alpha / 255))
    sh.putalpha(a)
    out = Image.alpha_composite(sh, layer)
    return out


@functools.lru_cache(maxsize=256)
def caption_sprite(text, size=50, maxw=760):
    f = _font(SERIF_I, size, 450)
    lines = _wrap(text, f, maxw)
    lh = int(size * 1.22)
    w = int(max(f.getlength(l) for l in lines)) + 40
    h = lh * len(lines) + 40
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for i, l in enumerate(lines):
        d.text((w / 2, 20 + i * lh + lh / 2), l, font=f, fill=(255, 255, 255, 255), anchor="mm")
    return _shadowed(lay, 6, 190)


@functools.lru_cache(maxsize=64)
def label_sprite(kicker, label, ksize=25, lsize=78):
    fk = _font(SANS, ksize)
    fl = _font(SERIF, lsize, 500)
    track = ksize * 0.22
    kw = sum(fk.getlength(ch) + track for ch in kicker) if kicker else 0
    lw = fl.getlength(label) if label else 0
    w = int(max(kw, lw)) + 40
    h = int(ksize * 1.6 + lsize * 1.25) + 40
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x = 20
    for ch in kicker:
        d.text((x, 20), ch, font=fk, fill=(255, 255, 255, 235))
        x += fk.getlength(ch) + track
    if label:
        d.text((18, 20 + ksize * 1.45), label, font=fl, fill=(255, 255, 255, 255))
    return _shadowed(lay, 6, 160)


@functools.lru_cache(maxsize=16)
def title_sprite(text, highlight="", size=74, maxw=820, hl_col=(110, 222, 208)):
    f = _font(SERIF, size, 450)
    lines = _wrap(text, f, maxw)
    lh = int(size * 1.18)
    w = int(max(f.getlength(l) for l in lines)) + 40
    h = lh * len(lines) + 40
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for i, l in enumerate(lines):
        x = (w - f.getlength(l)) / 2
        y = 20 + i * lh + lh / 2
        for j, word in enumerate(l.split(" ")):
            piece = word + (" " if j < len(l.split(" ")) - 1 else "")
            col = hl_col if highlight and word.strip("?.,!").lower() == highlight.lower() else (255, 255, 255)
            d.text((x, y), piece, font=f, fill=col + (255,), anchor="lm")
            x += f.getlength(piece)
    return _shadowed(lay, 8, 170)


def paste_alpha(dst, spr, x, y, alpha=1.0):
    if alpha <= 0.01:
        return
    if alpha < 0.999:
        spr = spr.copy()
        spr.putalpha(spr.getchannel("A").point(lambda v, k=alpha: int(v * k)))
    dst.paste(spr, (int(x), int(y)), spr)
