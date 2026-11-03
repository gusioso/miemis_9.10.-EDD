#!/usr/bin/env python3
"""
Blender (bpy 5.2, EEVEE) scenes for "What if every atom disappeared for five seconds?".

  python3 tools/render.py SHOT [SHOT ...]          # render those shots' frames -> public/frames/f_00000.jpg
  python3 tools/render.py --still SHOT t1 t2 ...   # test stills (seconds, global time) -> out/still_SHOT_t.jpg

Look: blocky low-poly people and buildings, soft sun + sky light, gentle shadows, a calm slow camera.
Every shot is a function of global time t (seconds), read from src/timeline.json, so the pictures line up with the
narration exactly. Frames are rendered at 720x1280 and scaled to 1080x1920 when the video is put together.
"""
import json
import math
import os
import random
import sys

import bpy
from mathutils import Euler, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
EV = TL["ev"]
FPS = TL["fps"]
SHOTS = {s["id"]: s for s in TL["shots"]}
RES = (int(os.environ.get("RES_X", "720")), int(os.environ.get("RES_Y", "1280")))
FRAMES = os.path.join(ROOT, "public", "frames")


# ============================================================ small helpers
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ramp(t, a, b):
    return smooth((t - a) / (b - a)) if b != a else float(t >= a)


def lerp(a, b, k):
    return a + (b - a) * k


def lerpv(a, b, k):
    return Vector(a).lerp(Vector(b), k)


def keys(t, ks):
    """ks = [(t, value), ...]; value = number or tuple. Smooth between keys."""
    if t <= ks[0][0]:
        return ks[0][1]
    for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
        if t < t1:
            k = smooth((t - t0) / (t1 - t0))
            if isinstance(v0, (tuple, list)):
                return tuple(lerp(a, b, k) for a, b in zip(v0, v1))
            return lerp(v0, v1, k)
    return ks[-1][1]


def hexrgb(h, a=1.0):
    h = h.lstrip("#")
    return (*(((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)), a)


_MATS = {}
GROUP = [None]   # static objects created while GROUP[0] is set get merged into one mesh per group (much faster renders)


def tag(ob):
    if GROUP[0] is not None:
        ob["grp"] = GROUP[0]
    return ob


def bake_static():
    """Merge every tagged, unparented mesh of a group into a single object (modifiers applied)."""
    groups = {}
    for o in list(bpy.context.scene.objects):
        if o.type == "MESH" and o.get("grp") is not None and o.parent is None:
            groups.setdefault(o["grp"], []).append(o)
    for g, obs in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for o in obs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = obs[0]
        bpy.ops.object.convert(target="MESH")
        if len(obs) > 1:
            bpy.ops.object.join()
        bpy.context.view_layer.objects.active.name = f"G_{g}"
    print("baked", len(groups), "groups; objects now", len(bpy.context.scene.objects), flush=True)


def mat(col, rough=0.75, emit=None, strength=0.0, metal=0.0):
    key = (col, rough, emit, strength, metal)
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new(f"m{len(_MATS)}")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexrgb(col)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = hexrgb(emit)
        b.inputs["Emission Strength"].default_value = strength
    _MATS[key] = m
    return m


def emis_mat(name, col, strength, base=None):
    """A material whose emission strength can be animated (returns the material and its strength socket)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexrgb(base or col)
    b.inputs["Emission Color"].default_value = hexrgb(col)
    b.inputs["Emission Strength"].default_value = strength
    b.inputs["Roughness"].default_value = 0.6
    return m, b.inputs["Emission Strength"]


def mesh_box(name, mn, mx, material):
    """Box mesh with its origin at (0,0,0) and corners mn..mx (so the origin can be a joint)."""
    (x0, y0, z0), (x1, y1, z1) = mn, mx
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    tag(ob)
    bev = ob.modifiers.new("bev", "BEVEL")
    bev.width = min(0.02, 0.2 * min(x1 - x0, y1 - y0, z1 - z0))
    bev.segments = 2
    return ob


def box(name, loc, size, material, rot=(0, 0, 0), parent=None):
    sx, sy, sz = size
    ob = mesh_box(name, (-sx / 2, -sy / 2, -sz / 2), (sx / 2, sy / 2, sz / 2), material)
    ob.location = loc
    ob.rotation_euler = rot
    if parent:
        ob.parent = parent
    return ob


def empty(name, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    if parent:
        e.parent = parent
    return e


def ico(name, loc, r, material, sub=1, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    ob.data.materials.append(material)
    return tag(ob)


def uvs(name, loc, r, material, seg=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return tag(ob)


def cyl(name, loc, r, depth, material, verts=16, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(material)
    return tag(ob)


def text_obj(name, body, loc, size, material, rot=(math.pi / 2, 0, 0), align="CENTER"):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    ob.data.materials.append(material)
    return ob


# ============================================================ scene / world / camera
def new_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _MATS.clear()
    s = bpy.context.scene
    s.render.engine = "BLENDER_EEVEE"
    s.eevee.taa_render_samples = int(os.environ.get("SAMPLES", "2"))   # ~3.3 s/frame on this CPU-only machine
    s.eevee.shadow_resolution_scale = 0.5
    s.render.filter_size = 1.8
    s.render.resolution_x, s.render.resolution_y = RES
    s.render.image_settings.file_format = "JPEG"
    s.render.image_settings.quality = 92
    s.view_settings.view_transform = "AgX"
    s.view_settings.look = "AgX - Medium High Contrast"
    w = bpy.data.worlds.new("world")
    s.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    s.collection.objects.link(cam)
    s.camera = cam
    cam_data.lens = 30
    cam_data.clip_end = 5000
    return s, bg, cam


def look(cam, pos, target, lens=None, roll=0.0):
    cam.location = pos
    d = Vector(target) - Vector(pos)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    if roll:
        cam.rotation_euler.rotate_axis("Z", roll)
    if lens:
        cam.data.lens = lens


def sun(energy=3.2, rot=(0.85, 0.15, 0.55), col="#fff3e0", angle=0.06):
    d = bpy.data.lights.new("sun", "SUN")
    d.energy = energy
    d.color = hexrgb(col)[:3]
    d.angle = angle
    ob = bpy.data.objects.new("sun", d)
    bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = rot
    return ob


def point(loc, energy, col="#ffd8a0", radius=0.2, shadow=True):
    d = bpy.data.lights.new("pt", "POINT")
    d.energy = energy
    d.use_shadow = shadow
    d.color = hexrgb(col)[:3]
    d.shadow_soft_size = radius
    ob = bpy.data.objects.new("pt", d)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    return ob


# ============================================================ blocky people (in the spirit of the reference: boxes)
class Person:
    def __init__(self, name, loc, rot_z=0.0, shirt="#e8b84a", pants="#3f5f9e", skin="#e3b18e", hair="#4a3426", style="short", s=1.0,
                 coat=False, cup=False, phone=False, shoes="#2a2a2e"):
        self.root = empty(name, loc)
        self.root.rotation_euler = (0, 0, rot_z)
        self.root.scale = (s, s, s)
        R = self.root
        M_sh, M_pa, M_sk, M_ha = mat(shirt, 0.85), mat(pants, 0.85), mat(skin, 0.6), mat(hair, 0.9)
        self.hip = {}
        self.legs = {}
        for side, x in (("L", 0.1), ("R", -0.1)):
            hp = empty(f"{name}_hip{side}", (x, 0, 0.9), R)
            mesh_box(f"{name}_leg{side}", (-0.075, -0.085, -0.86), (0.075, 0.085, 0), M_pa).parent = hp
            mesh_box(f"{name}_shoe{side}", (-0.08, -0.15, -0.9), (0.08, 0.09, -0.84), mat(shoes, 0.6)).parent = hp
            self.hip[side] = hp
        self.torso = empty(f"{name}_torso", (0, 0, 0.9), R)
        mesh_box(f"{name}_body", (-0.21, -0.12, 0), (0.21, 0.12, 0.62), M_sh).parent = self.torso
        if coat:
            mesh_box(f"{name}_coat", (-0.22, -0.13, -0.28), (0.22, 0.13, 0.63), M_sh).parent = self.torso
            mesh_box(f"{name}_scarf", (-0.13, -0.14, 0.5), (0.13, 0.1, 0.62), mat("#f2e2c4", 0.9)).parent = self.torso
        mesh_box(f"{name}_neck", (-0.06, -0.06, 0.6), (0.06, 0.06, 0.66), M_sk).parent = self.torso
        self.sh = {}
        for side, x in (("L", 0.28), ("R", -0.28)):
            sp = empty(f"{name}_sh{side}", (x, 0, 0.58), self.torso)
            mesh_box(f"{name}_arm{side}", (-0.065, -0.065, -0.58), (0.065, 0.065, 0.03), M_sh).parent = sp
            mesh_box(f"{name}_hand{side}", (-0.05, -0.055, -0.68), (0.05, 0.055, -0.58), M_sk).parent = sp
            self.sh[side] = sp
        if cup:
            c = cyl(f"{name}_cup", (0, -0.04, -0.66), 0.045, 0.14, mat("#fbfbf6", 0.5), 16)
            c.parent = self.sh["R"]
            sl = cyl(f"{name}_sleeve", (0, -0.04, -0.66), 0.048, 0.06, mat("#9a6a42", 0.8), 16)
            sl.parent = self.sh["R"]
            self.cup = c
        if phone:
            p = box(f"{name}_phone", (0, -0.07, -0.66), (0.08, 0.012, 0.15), mat("#1a1a22", 0.3), parent=self.sh["R"])
            em, self.phone_glow = emis_mat(f"{name}_screen", "#cfe8ff", 0.0)
            box(f"{name}_screen", (0, -0.078, -0.66), (0.068, 0.004, 0.13), em, parent=self.sh["R"])
        self.head = empty(f"{name}_head", (0, 0, 0.66), self.torso)
        H = self.head
        mesh_box(f"{name}_face", (-0.125, -0.135, 0), (0.125, 0.125, 0.29), M_sk).parent = H
        mesh_box(f"{name}_hairTop", (-0.135, -0.145, 0.22), (0.135, 0.135, 0.33), M_ha).parent = H
        mesh_box(f"{name}_hairBack", (-0.135, 0.03, 0.05), (0.135, 0.14, 0.3), M_ha).parent = H
        for x in (-0.135, 0.105):
            mesh_box(f"{name}_side{x}", (x, -0.1, 0.12), (x + 0.03, 0.14, 0.3), M_ha).parent = H
        if style == "long":
            mesh_box(f"{name}_hairLong", (-0.14, 0.0, -0.18), (0.14, 0.15, 0.3), M_ha).parent = H
        if style == "pony":
            mesh_box(f"{name}_pony", (-0.05, 0.13, -0.1), (0.05, 0.22, 0.24), M_ha).parent = H
        if style == "bald":
            pass
        eye = mat("#1d1612", 0.5)
        for x in (-0.05, 0.05):
            mesh_box(f"{name}_eye{x}", (x - 0.016, -0.139, 0.14), (x + 0.016, -0.13, 0.17), eye).parent = H
        mesh_box(f"{name}_mouth", (-0.03, -0.139, 0.075), (0.03, -0.13, 0.083), mat("#a5645a", 0.6)).parent = H

    def pose(self, walk=None, armL=None, armR=None, head=(0.0, 0.0), lean=0.0, sit=False, bob=0.0):
        a = math.sin(walk) * 0.45 if walk is not None else 0.0
        self.hip["L"].rotation_euler = (a if not sit else -1.5, 0, 0)
        self.hip["R"].rotation_euler = (-a if not sit else -1.5, 0, 0)
        self.sh["L"].rotation_euler = armL if armL is not None else (-a * 0.8, 0, 0.06)
        self.sh["R"].rotation_euler = armR if armR is not None else (a * 0.8, 0, -0.06)
        self.head.rotation_euler = (head[0], 0, head[1])
        self.torso.rotation_euler = (lean, 0, 0)
        self.torso.location.z = 0.9 + (abs(math.cos(walk)) * 0.03 if walk is not None else 0.0) + bob


# ============================================================ the street set
BLD_COLS = ["#e9d9bf", "#d9a588", "#c9d4dc", "#e7c79a", "#b9c7b0", "#e0b7a8", "#d7d0c4", "#a9bfd3"]
AWN = ["#3fa7b5", "#e0566c", "#f2b23a", "#3f8f6a", "#e07a4a"]


def building(x0, y0, w, d, h, col, facade_x, seed, lit_mat=None):
    """Box building; facade on the street side (facade_x = +1 or -1 for which x face is the front)."""
    rnd = random.Random(seed)
    cx = x0 + w / 2 * (-facade_x)
    box(f"b{seed}", (cx, y0, h / 2), (w, d, h), mat(col, 0.9))
    box(f"b{seed}top", (cx, y0, h + 0.1), (w + 0.2, d + 0.2, 0.2), mat("#8c8a86", 0.9))
    glass = mat("#5d7a96", 0.15, metal=0.1)
    frame = mat("#f4f1ea", 0.7)
    fx = x0 + 0.03 * facade_x
    # upper windows via array modifiers on one window object
    nx = max(1, int(d / 1.6))
    rows = max(1, int((h - 4.2) / 2.4))
    win = box(f"w{seed}", (fx, y0 - d / 2 + d / nx / 2, 4.6), (0.08, 0.9, 1.35), lit_mat if (lit_mat and rnd.random() < 0.7) else glass)
    a1 = win.modifiers.new("a", "ARRAY")
    a1.count = nx
    a1.relative_offset_displace = (0, d / nx / 0.9, 0)
    a2 = win.modifiers.new("b", "ARRAY")
    a2.count = rows
    a2.relative_offset_displace = (0, 0, 2.4 / 1.35)
    sill = box(f"s{seed}", (fx + 0.05 * facade_x, y0 - d / 2 + d / nx / 2, 3.88), (0.14, 1.05, 0.1), frame)
    for m_ in (a1, a2):
        mm = sill.modifiers.new(m_.name, "ARRAY")
        mm.count = m_.count
    sill.modifiers[1].relative_offset_displace = (0, d / nx / 1.05, 0)
    sill.modifiers[2].relative_offset_displace = (0, 0, 2.4 / 0.1)
    # shop front + awning at street level
    shop = lit_mat or mat("#9ec3d8", 0.1)
    box(f"shop{seed}", (fx, y0, 1.45), (0.06, d * 0.72, 2.0), shop)
    box(f"door{seed}", (fx, y0 + d * 0.39, 1.15), (0.07, 0.95, 2.1), mat("#5a3f30", 0.7))
    ac = AWN[seed % len(AWN)]
    for i in range(int(d * 0.8 / 0.5)):
        box(f"aw{seed}_{i}", (fx + 0.55 * facade_x, y0 - d * 0.4 + 0.25 + i * 0.5, 2.85), (1.1, 0.5, 0.08), mat(ac if i % 2 else "#f7f4ee", 0.8),
            rot=(0, -0.28 * facade_x, 0))


def tree(loc, s=1.0, seed=0):
    rnd = random.Random(seed)
    cyl("trunk", (loc[0], loc[1], 0.9 * s), 0.09 * s, 1.8 * s, mat("#6b4a33", 0.9), 8)
    for i in range(3):
        o = ico("leaf", (loc[0] + rnd.uniform(-0.3, 0.3) * s, loc[1] + rnd.uniform(-0.3, 0.3) * s, (2.3 + i * 0.35) * s), (0.75 - i * 0.12) * s,
                mat(rnd.choice(["#3f8f4a", "#4c9a52", "#367f42"]), 0.85), 1)
        o.rotation_euler = (rnd.random(), rnd.random(), rnd.random())


def car(loc, col, rot_z=0.0):
    root = empty("car", loc)
    root.rotation_euler = (0, 0, rot_z)
    box("cb", (0, 0, 0.45), (1.8, 4.1, 0.6), mat(col, 0.35, metal=0.2)).parent = root
    box("ct", (0, 0.2, 0.95), (1.6, 2.1, 0.5), mat(col, 0.35, metal=0.2)).parent = root
    box("cw", (0, 0.2, 0.96), (1.62, 2.0, 0.42), mat("#2f3d4f", 0.1)).parent = root
    for x in (-0.85, 0.85):
        for y in (-1.3, 1.3):
            cyl("wh", (x, y, 0.33), 0.33, 0.25, mat("#1c1c20", 0.8), 14, (0, math.pi / 2, 0)).parent = root
    return root


class Street:
    """A shopping street running along Y. Sidewalks at |x| 4..7, buildings beyond. Day/night switch."""

    def __init__(self, night=False):
        self.lit_mat, self.lit = emis_mat("lit", "#ffd59a", 0.0, base="#5d7a96")
        GROUP[0] = "ground"
        box("road", (0, 20, -0.05), (8, 140, 0.1), mat("#5c5f66", 0.95))
        for side in (-1, 1):
            box(f"walk{side}", (side * 5.5, 20, 0.07), (3.0, 140, 0.14), mat("#d9d6cf", 0.9))
            box(f"curb{side}", (side * 4.05, 20, 0.07), (0.12, 140, 0.16), mat("#b8b5ae", 0.9))
            tl = box(f"tile{side}", (side * 5.5, -40, 0.142), (2.9, 0.03, 0.005), mat("#c4c1ba", 0.9))
            am = tl.modifiers.new("arr", "ARRAY")
            am.count = 60
            am.use_relative_offset = False
            am.use_constant_offset = True
            am.constant_offset_displace = (0, 2.2, 0)
        for i in range(30):
            box(f"lane{i}", (0, -30 + i * 4.5, 0.005), (0.15, 2.2, 0.01), mat("#efe7c9", 0.8))
        for i in range(7):
            box(f"zebra{i}", (-3 + i, 6, 0.006), (0.55, 3.0, 0.01), mat("#f2f2ee", 0.8))
        y = -30
        k = 0
        while y < 110:
            dpt = random.Random(k).uniform(7, 11)
            for side in (-1, 1):
                h = random.Random(k * 7 + side).uniform(12, 24)
                GROUP[0] = f"bld{k}_{side}"
                building(side * 7.0, y + dpt / 2, 9, dpt, h, BLD_COLS[(k * 3 + (side > 0)) % len(BLD_COLS)], -side, k * 2 + (side > 0), self.lit_mat)
            y += dpt + 0.2
            k += 1
        self.lamps = []
        GROUP[0] = "lamps"
        lamp_m, self.lamp_glow = emis_mat("lamp", "#ffe2a8", 0.0)
        for i in range(10):
            for side in (-1, 1):
                ly = -20 + i * 11 + (5 if side > 0 else 0)
                cyl("pole", (side * 4.4, ly, 2.2), 0.06, 4.4, mat("#30343c", 0.5), 10)
                box("arm", (side * 4.0, ly, 4.35), (0.8, 0.08, 0.08), mat("#30343c", 0.5))
                box("head", (side * 3.6, ly, 4.25), (0.4, 0.3, 0.14), lamp_m)
                self.lamps.append(point((side * 3.6, ly, 4.0), 0.0, "#ffd49a", 0.3, shadow=False))
        for i in range(9):
            GROUP[0] = f"tree{i}"
            tree((4.65 if i % 2 else -4.65, -14 + i * 9, 0.14), 1.0, i)
        GROUP[0] = None
        bake_static()
        car((-2.0, 18, 0), "#c0392b")
        car((2.1, 34, 0), "#2f6fd0", math.pi)
        car((-2.0, 50, 0), "#f2f2ee")
        self.moving = car((2.0, 70, 0), "#f2b23a", math.pi)
        # sky: a visible sun disc far away + sunlight
        sm, self.sun_disc = emis_mat("sundisc", "#fff4d6", 40.0)
        self.disc = uvs("sun_disc", (-40, 300, 170), 9, sm, 24)
        self.sun = sun(4.5, (0.85, 0.0, 2.4), "#fff1dc")

    def daylight(self, bg, k):
        """k = 1 full day, 0 = the five seconds of darkness."""
        bg.inputs["Color"].default_value = tuple(lerp(a, b, k) for a, b in zip(hexrgb("#0d1430"), hexrgb("#a9d2f0")))
        bg.inputs["Strength"].default_value = lerp(0.12, 0.75, k)
        self.sun.data.energy = 4.5 * k
        self.sun_disc.default_value = 40.0 * k
        self.disc.hide_render = k < 0.02
        self.lit.default_value = lerp(5.0, 0.0, k)
        self.lamp_glow.default_value = lerp(12.0, 0.0, k)
        for p in self.lamps:
            p.data.energy = lerp(600.0, 0.0, k)


PEOPLE_SPEC = [  # x, y, facing, shirt, pants, hair, style, speed (m/s)
    (4.5, 16, math.pi, "#3f7fd6", "#2a2f3a", "#2b1d16", "short", 1.2),
    (4.6, 24, 0.0, "#e8b84a", "#3f5f9e", "#4a3426", "short", 1.1),
    (-5.4, 12, math.pi, "#7a5bb6", "#3b3e46", "#1e1a18", "long", 1.0),
    (-6.1, 30, 0.0, "#3fae6a", "#2e3a5c", "#6a4a2a", "short", 1.25),
    (4.5, 36, math.pi, "#e07a4a", "#3b3e46", "#d9c39a", "long", 0.9),
    (-4.9, 42, math.pi, "#f2f2ee", "#2a3350", "#2b1d16", "bald", 1.1),
    (4.6, 48, 0.0, "#9e1b2d", "#2a2f3a", "#4a3426", "short", 1.0),
    (-6.0, 6, 0.0, "#2fa3a0", "#3f5f9e", "#2b1d16", "pony", 1.15),
]


def make_people(phone=False):
    ps = []
    for i, (x, y, f, sh, pa, ha, st, sp) in enumerate(PEOPLE_SPEC):
        p = Person(f"p{i}", (x, y, 0.14), f, shirt=sh, pants=pa, hair=ha, style=st, s=random.Random(i).uniform(0.94, 1.05), phone=phone)
        p.spec = (x, y, f, sp)
        ps.append(p)
    return ps


def move_people(ps, wt, stop=0.0, lookup=0.0, phones=0.0):
    """wt = world time (freezes while atoms are gone); stop 0..1 = people halt; lookup 0..1 = heads tilt up."""
    for i, p in enumerate(ps):
        x, y, f, sp = p.spec
        dirn = 1 if f > 1 else -1          # rot pi faces +Y
        yy = ((y + dirn * sp * wt + 12) % 72) - 12
        p.root.location = (x, yy, 0.14)
        ph = None if stop > 0.5 else wt * sp * 5.2 + i
        armR = (-2.6 * phones, 0, -0.06) if phones > 0 else None
        p.pose(walk=ph, head=(lookup * -0.55, 0), armR=armR)
        if phones > 0 and hasattr(p, "phone_glow"):
            p.phone_glow.default_value = 3.0 * phones


def scatter_scale(obs, k):
    for o in obs:
        o.scale = (k, k, k) if o.get("base") is None else tuple(c * k for c in o["base"])


# ============================================================ dissolve particles (atoms leaving / coming back)
class Dust:
    def __init__(self, n, center, spread, seed=1):
        rnd = random.Random(seed)
        m, self.glow = emis_mat("dust", "#cfe7ff", 6.0)
        self.items = []
        for i in range(n):
            p0 = Vector(center) + Vector((rnd.uniform(-1, 1) * spread[0], rnd.uniform(-1, 1) * spread[1], rnd.uniform(0, 1) * spread[2]))
            vel = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(0.3, 1.5))) * rnd.uniform(0.3, 1.4)
            o = box("dust", p0, (0.05, 0.05, 0.05), m)
            o.rotation_euler = (rnd.random() * 3, rnd.random() * 3, 0)
            self.items.append((o, p0, vel, rnd.uniform(0, 0.35)))

    def update(self, k, t):
        """k: 0 = not visible, 0..1 = particles drifting away (life), sizes shrink at the end."""
        for o, p0, vel, delay in self.items:
            kk = clamp((k - delay) / (1 - delay)) if k > 0 else 0
            vis = 0 < kk < 1
            o.hide_render = not vis
            if vis:
                o.location = p0 + vel * kk * 2.2
                s = math.sin(math.pi * kk) * 1.4
                o.scale = (s, s, s)


# ============================================================ shots
def shot_street(s, bg, cam, which):
    st = Street()
    nora = Person("nora", (5.6, 22, 0.14), 0.0, shirt="#c8423a", pants="#2a3350", hair="#2b1a14", style="pony", coat=True, cup=True)
    ps = make_people(phone=(which == "phones"))
    vanish_obs = [o for o in s.objects if o.type == "MESH" and o.name not in ("sun_disc",)]
    for o in vanish_obs:
        o["base"] = tuple(o.scale)
    dust = Dust(700, (2, 26, 0), (9, 14, 9), 3) if which in ("vanish", "back") else None
    E = EV
    nora_y0 = 26.0

    def update(t):
        # world time stops while the atoms are gone
        wt = t if t < E["gone"] else (E["gone"] if t < E["back"] else t - (E["back"] - E["gone"]))
        day = 1.0
        if which == "dark":
            day = 1 - ramp(t, E["dark"] - 0.15, E["dark"] + 0.25) + ramp(t, E["darkEnd"] - 0.1, E["darkEnd"] + 0.3)
        st.daylight(bg, clamp(day))
        stop = ramp(t, E["dark"] + 0.4, E["dark"] + 1.0) * (1 - ramp(t, E["darkEnd"] + 1.5, E["darkEnd"] + 2.5)) if which == "dark" else 0.0
        move_people(ps, wt if which != "phones" else 0.0, stop=stop if which != "phones" else 1.0, lookup=stop if which != "phones" else 0.6,
                    phones=1.0 if which == "phones" else 0.0)
        st.moving.location.y = 70 - wt * 6.0
        # Nora walks toward the camera, coffee in hand; sips after the atoms come back
        ny = nora_y0 - min(wt, E["normal"] + 2) * 0.95
        if which in ("dark", "phones"):
            ny = 9.0
        nora.root.location = (5.6, ny, 0.14)
        walking = which in ("street", "vanish", "back") and not (which == "back" and E["sip"] - 0.3 < t < E["sip"] + 2.2)
        sip = ramp(t, E["sip"] - 0.3, E["sip"] + 0.3) * (1 - ramp(t, E["sip"] + 1.6, E["sip"] + 2.2)) if which == "back" else 0.0
        if which == "dark":
            nora.pose(walk=None, armR=(-0.3, 0, -0.06), head=(-0.55 * stop, 0))
        elif which == "phones":
            nora.pose(walk=None, armR=(-0.3, 0, -0.06), head=(-0.2, 0.3))
        else:
            nora.pose(walk=wt * 4.9 if walking else None, armR=(-1.0 - 1.4 * sip, 0, -0.25 * sip) if sip > 0 else (-0.35, 0, -0.06),
                      head=(0.15 * sip, 0))
        # dissolve: everything shrinks into drifting light-dust, then back
        if which in ("vanish", "back"):
            if which == "vanish":
                k = ramp(t, E["instant"], E["gone"] + 0.1)
                dk = clamp((t - E["instant"]) / (E["gone"] + 0.9 - E["instant"]))
            else:
                k = 1 - ramp(t, E["back"] - 0.7, E["back"] + 0.1)
                dk = clamp((E["back"] + 0.2 - t) / 1.1) if t < E["back"] + 0.2 else 0.0
            sc = 1 - k
            for o in vanish_obs:
                b = o["base"]
                o.scale = tuple(c * max(0.001, sc) for c in b)
                o.hide_render = sc < 0.02
            dust.update(dk if 0 < dk < 1 else 0.0, t)
            gk = ramp(t, E["gone"] - 0.3, E["gone"] + 0.2) if which == "vanish" else 1 - ramp(t, E["back"] - 0.4, E["back"] + 0.2)
            bg.inputs["Color"].default_value = tuple(lerp(a, 0.0, gk) for a in hexrgb("#a9d2f0")[:3]) + (1,)
            bg.inputs["Strength"].default_value = 0.75 * (1 - gk)
            st.sun.data.energy = 4.5 * (1 - gk)
            st.disc.hide_render = gk > 0.9
        # cameras
        if which == "street":
            look(cam, keys(t, [(0, (1.5, -6, 15)), (3.5, (2.6, 2, 6)), (E["nora"], (6.0, ny - 6.0, 1.9)), (10.7, (6.1, ny - 5.0, 1.7))]),
                 keys(t, [(0, (0, 40, 6)), (3.5, (3, 30, 3)), (E["nora"], (5.6, ny, 1.5)), (10.7, (5.6, ny, 1.55))]), 30)
        elif which == "vanish":
            look(cam, keys(t, [(SHOTS["vanish"]["start"], (6.1, ny - 4.6, 1.65)), (E["gone"] + 1, (5.4, ny - 6.5, 2.6))]),
                 (5.6, ny, 1.5), 32)
        elif which == "back":
            look(cam, keys(t, [(SHOTS["back"]["start"], (6.1, ny - 5.0, 1.75)), (E["sip"], (6.2, ny - 3.2, 1.62)), (E["normal"], (5.0, ny - 6.0, 2.8)),
                               (SHOTS["back"]["end"], (1.5, ny - 16.0, 9))]),
                 keys(t, [(SHOTS["back"]["start"], (5.6, ny, 1.5)), (E["sip"], (5.6, ny, 1.58)), (E["normal"], (5.0, ny + 2, 1.8)), (SHOTS["back"]["end"], (0, ny + 30, 5))]), 30)
        elif which == "dark":
            look(cam, keys(t, [(SHOTS["dark"]["start"], (1.0, -6, 1.4)), (E["dark"], (0.6, -4, 1.2)), (SHOTS["dark"]["end"], (0.2, -2, 1.1))]),
                 keys(t, [(SHOTS["dark"]["start"], (-1, 30, 9)), (E["dark"], (-2, 30, 12.5)), (SHOTS["dark"]["end"], (-2.5, 30, 13.5))]), 22)
        elif which == "phones":
            look(cam, keys(t, [(SHOTS["phones"]["start"], (2.5, 4, 1.6)), (SHOTS["phones"]["end"], (3.2, 8, 1.7))]),
                 keys(t, [(SHOTS["phones"]["start"], (5, 16, 1.8)), (SHOTS["phones"]["end"], (5.5, 22, 2.0))]), 28)
    return update


def shot_void(s, bg, cam):
    """Black. Glowing outlines of what's gone fade out one by one: street, air, Nora, Earth, Sun, stars."""
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0
    E = EV
    items = []

    def wire(ob, strength=3.0):
        m, g = emis_mat(f"wm{len(items)}", "#bfe3ff", strength)
        w = ob.modifiers.new("w", "WIREFRAME")
        w.thickness = 0.03
        ob.data.materials.clear()
        ob.data.materials.append(m)
        return g

    grp = []
    for i in range(6):  # street: building outlines
        b = box(f"vb{i}", ((-1) ** i * 7, 14 + (i // 2) * 9, 7), (6, 8, 14 + i), mat("#000000"))
        for mname in ("bev",):
            b.modifiers.remove(b.modifiers[mname])
        grp.append(b)
    g_street = [wire(b, 2.0) for b in grp]
    air = []
    for i in range(120):  # air: tiny molecules
        r = random.Random(i)
        o = ico("air", (r.uniform(-6, 6), r.uniform(4, 24), r.uniform(0.2, 8)), 0.05, mat("#000000"), 1)
        air.append(o)
    m_air, g_air = emis_mat("air", "#9fd8ff", 4.0)
    for o in air:
        o.data.materials.clear()
        o.data.materials.append(m_air)
    nora = Person("vn", (2.5, 9.0, 0), math.pi, style="pony", coat=True)
    m_n, g_n = emis_mat("nora", "#ffb3a8", 4.0)
    nora.pose()
    for o in s.objects:
        if o.name.startswith("vn_") and o.type == "MESH":
            o.data.materials.clear()
            o.data.materials.append(m_n)
            w = o.modifiers.new("w", "WIREFRAME")
            w.thickness = 0.012
    earth = uvs("earth", (-3, 30, 6), 4, mat("#000000"), 24)
    g_e = wire(earth, 3.0)
    sunb = uvs("vsun", (6, 60, 14), 9, mat("#000000"), 24)
    m_s, g_s = emis_mat("vsun", "#ffd27a", 3.0)
    sunb.data.materials.clear()
    sunb.data.materials.append(m_s)
    ws = sunb.modifiers.new("w", "WIREFRAME")
    ws.thickness = 0.06
    stars = []
    m_st, g_st = emis_mat("vstars", "#ffffff", 8.0)
    for i in range(260):
        r = random.Random(i + 99)
        th, ph = r.uniform(0, math.tau), r.uniform(0.1, 1.4)
        o = ico("st", (math.cos(th) * math.cos(ph) * 120, 60 + math.sin(th) * math.cos(ph) * 120, math.sin(ph) * 90), r.uniform(0.15, 0.4), m_st, 1)
        stars.append(o)

    def update(t):
        fade = lambda a: 1 - ramp(t, a + 0.25, a + 0.9)
        for g in g_street:
            g.default_value = 2.0 * fade(E["v_street"])
        g_air.default_value = 4.0 * fade(E["v_air"])
        g_n.default_value = 4.0 * fade(E["v_nora"])
        g_e.default_value = 3.0 * fade(E["v_earth"])
        g_s.default_value = 3.0 * fade(E["v_sun"])
        g_st.default_value = 8.0 * fade(E["v_star"] + 0.6)
        look(cam, keys(t, [(SHOTS["void"]["start"], (0.5, -2, 2.5)), (E["v_nora"], (0.8, 2, 2.2)), (E["v_earth"], (0, -6, 6)),
                           (SHOTS["void"]["end"], (0, -18, 10))]),
             keys(t, [(SHOTS["void"]["start"], (1, 14, 3)), (E["v_nora"], (2.5, 9, 1.4)), (E["v_earth"], (-1, 30, 7)), (SHOTS["void"]["end"], (0, 60, 14))]), 28)
    return update


def shot_light(s, bg, cam):
    """Only light is left: golden streaks keep flying through the empty space where Earth was."""
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0
    m, g = emis_mat("photon", "#ffb347", 6.0)
    rays = []
    for i in range(160):
        r = random.Random(i)
        o = cyl("ray", (0, 0, 0), 0.012, r.uniform(1.5, 4.0), m, 6, (0, math.pi / 2, 0))
        rays.append((o, r.uniform(-14, 14), r.uniform(-8, 8), r.uniform(0, 60), r.uniform(18, 26)))
    ring_m, ring_g = emis_mat("ghost", "#7fb8ff", 0.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=3.0, minor_radius=0.025, location=(0, 0, 0), rotation=(0, math.pi / 2, 0))
    ring = bpy.context.active_object
    ring.data.materials.append(ring_m)
    E = EV

    def update(t):
        for o, y, z, ph, sp in rays:
            x = ((t * sp + ph) % 60) - 30
            o.location = (x, y, z)
        ring_g.default_value = 2.0 * (0.6 + 0.4 * math.sin(t * 3)) * ramp(t, E["keeps"] - 1.5, E["keeps"] - 0.5)
        look(cam, keys(t, [(SHOTS["light"]["start"], (-6, -14, 2)), (E["keeps"], (2, -10, 1.5)), (SHOTS["light"]["end"], (6, -7, 0.5))]),
             keys(t, [(SHOTS["light"]["start"], (0, 0, 0)), (SHOTS["light"]["end"], (0, 0, 0))]), 30)
    return update


def shot_space(s, bg, cam):
    """Vertical diagram for a vertical video: the Sun at the top, Earth at the bottom, a stream of light falling from
    one to the other - with a five-second hole in it, racing down toward Earth."""
    bg.inputs["Color"].default_value = hexrgb("#02030a")
    bg.inputs["Strength"].default_value = 1
    s.view_settings.view_transform = "Standard"   # keep the Sun's orange saturated
    s.view_settings.look = "None"
    SUNZ, EARTHZ = 42.0, -34.0
    sm, _ = emis_mat("sun", "#ff9a20", 3.0)
    uvs("sun", (0, 0, SUNZ + 10), 14, sm, 48)
    cm, _ = emis_mat("cor", "#ff9a3a", 2.5)
    uvs("corona", (0, 0, SUNZ + 10), 15.5, cm, 32)
    uvs("earth", (0, 0, EARTHZ), 4.2, mat("#2f6fd0", 0.55), 48)
    for i in range(10):
        r = random.Random(i)
        d = Vector((r.uniform(-1, 1), r.uniform(-1, 0.2), r.uniform(-1, 1))).normalized() * 3.6
        ico("cont", Vector((0, 0, EARTHZ)) + d, 1.2, mat("#4c9a52", 0.8), 2, (1, 1, 0.6))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=4.35, location=(0, 0, EARTHZ))
    atm = bpy.context.active_object
    am, _ = emis_mat("atm", "#7fc4ff", 0.6)
    atm.data.materials.append(am)
    bpy.ops.object.shade_smooth()
    uvs("moon", (9, 3, EARTHZ + 4), 1.1, mat("#bdbdbd", 0.9), 24)
    point((0, -12, SUNZ - 6), 60000, "#fff0d0", 4)
    m, g = emis_mat("ph", "#ffb44a", 7.0)
    phot = []
    for i in range(420):
        r = random.Random(i)
        o = cyl("p", (0, 0, 0), 0.05, 1.1, m, 6)
        phot.append((o, r.uniform(0, 1), r.uniform(-3.2, 3.2), r.uniform(-3.2, 3.2)))
    st_m, _ = emis_mat("bgst", "#ffffff", 4.0)
    for i in range(320):
        r = random.Random(i + 7)
        ico("s", (r.uniform(-90, 90), r.uniform(60, 120), r.uniform(-110, 110)), r.uniform(0.1, 0.3), st_m, 1)
    E = EV
    L = SUNZ - EARTHZ

    def update(t):
        k = clamp((t - E["hole"] + 0.3) / (SHOTS["space"]["end"] - E["hole"] + 0.3))
        hole = lerp(SUNZ - 2, EARTHZ + 8, k)
        for o, ph, x, y in phot:
            z = SUNZ - ((ph * L + t * 7.0) % L)
            o.location = (x, y, z)
            o.hide_render = (hole - 7 < z < hole + 7) and t > E["hole"] - 0.4
        look(cam, keys(t, [(SHOTS["space"]["start"], (6, -82, 14)), (E["hole"], (0, -86, 6)), (SHOTS["space"]["end"], (-4, -70, -6))]),
             keys(t, [(SHOTS["space"]["start"], (0, 0, 12)), (E["hole"], (0, 0, 4)), (SHOTS["space"]["end"], (0, 0, -8))]), 30)
    return update


def shot_lab(s, bg, cam):
    """Observatory control room. A monitor shows the atomic clocks 5 s behind the pulsar time."""
    bg.inputs["Color"].default_value = hexrgb("#cfe3f2")
    bg.inputs["Strength"].default_value = 0.6
    box("floor", (0, 0, -0.05), (12, 12, 0.1), mat("#8f8a84", 0.8))
    box("wallB", (0, 4, 2), (12, 0.2, 4), mat("#e6e1d8", 0.9))
    box("wallL", (-5, 0, 2), (0.2, 12, 4), mat("#dcd6cc", 0.9))
    box("win", (-4.88, 0.5, 2.2), (0.05, 3.2, 1.6), mat("#ffffff", 0.2, "#e9f4ff", 3.0))
    sun(2.2, (1.0, 0.0, -1.3), "#fff3e0")
    box("desk", (0, 2.6, 0.75), (4.4, 1.2, 0.08), mat("#c9b49a", 0.6))
    for x in (-2.0, 2.0):
        box("leg", (x, 2.6, 0.37), (0.08, 1.0, 0.74), mat("#6b6f78", 0.5))
    screens = []
    for i, x in enumerate((-1.4, 0.0, 1.4)):
        box("mon", (x, 3.0, 1.35), (1.25, 0.06, 0.78), mat("#1b1d24", 0.4))
        box("stand", (x, 3.05, 0.95), (0.08, 0.08, 0.35), mat("#1b1d24", 0.4))
        sm, sg = emis_mat(f"scr{i}", ["#0d2238", "#0d2238", "#0d2238"][i], 1.0)
        screens.append(box(f"scr{i}", (x, 2.965, 1.35), (1.15, 0.01, 0.68), sm))
    # screen content
    txt_w, _ = emis_mat("txtw", "#bfe3ff", 4.0)
    txt_r, txt_rg = emis_mat("txtr", "#ff5a5a", 6.0)
    txt_g, _ = emis_mat("txtg", "#7dff9a", 4.0)
    text_obj("t0", "SOLAR FLUX", (-1.4, 2.955, 1.6), 0.08, txt_w)
    for j in range(16):
        h = 0.32 if j != 9 else 0.02
        box(f"bar{j}", (-1.92 + j * 0.07, 2.955, 1.2 + h / 2), (0.045, 0.005, h), txt_g)
    text_obj("t1", "CLOCK OFFSET", (0.0, 2.955, 1.6), 0.08, txt_w)
    clock_txt = text_obj("t2", "-5.000 s", (0.0, 2.955, 1.33), 0.2, txt_r)
    text_obj("t3", "SKY SURVEY", (1.4, 2.955, 1.6), 0.08, txt_w)
    for j in range(40):
        r = random.Random(j)
        box(f"dot{j}", (1.4 + r.uniform(-0.5, 0.5), 2.955, 1.32 + r.uniform(-0.25, 0.2)), (0.012, 0.005, 0.012), txt_w)
    box("chair", (0.2, 1.7, 0.5), (0.6, 0.6, 0.1), mat("#2f3a4a", 0.6))
    box("chairB", (0.2, 1.45, 0.85), (0.6, 0.08, 0.7), mat("#2f3a4a", 0.6))
    nora = Person("nora", (0.2, 1.75, 0.0), math.pi, shirt="#c8423a", pants="#2a3350", hair="#2b1a14", style="pony", coat=True)
    nora.root.rotation_euler = (0, 0, math.pi)  # facing the screens (+y)
    for i in range(3):
        box("shelf", (-4.8, 2.6, 0.6 + i * 0.7), (0.3, 2.5, 0.05), mat("#8a6446", 0.7))
    E = EV

    def update(t):
        nora.pose(sit=True, armL=(-1.2, 0, 0.1), armR=(-1.2 - 0.25 * ramp(t, E["clock"] - 0.5, E["clock"]), 0, -0.1), head=(0.1, 0.25 * math.sin(t * 0.6)))
        nora.torso.location.z = 0.6
        for side in "LR":
            nora.hip[side].location.z = 0.6
        txt_rg.default_value = 6.0 * (0.75 + 0.25 * math.sin(t * 8)) if t > E["behind"] - 0.4 else 0.0
        look(cam, keys(t, [(SHOTS["lab"]["start"], (2.6, -2.2, 2.0)), (E["clock"] - 0.6, (1.2, 0.4, 1.7)), (E["behind"], (0.05, 2.12, 1.42)),
                           (SHOTS["lab"]["end"], (0.0, 2.2, 1.4))]),
             keys(t, [(SHOTS["lab"]["start"], (0, 2.6, 1.2)), (E["clock"] - 0.6, (0, 2.9, 1.3)), (E["behind"], (0, 3.0, 1.33)), (SHOTS["lab"]["end"], (0, 3.0, 1.33))]), keys(t, [(SHOTS["lab"]["start"], 30), (E["clock"] - 0.6, 26), (E["behind"], 19)]))
    return update


def starfield(n, R, seed, strength=6.0, zmin=0.05):
    m, g = emis_mat(f"stars{seed}", "#fff8ea", strength)
    out = []
    for i in range(n):
        r = random.Random(i * 13 + seed)
        th, ph = r.uniform(0, math.tau), math.asin(r.uniform(zmin, 1.0))
        size = R * r.choice([0.0012, 0.0016, 0.0022, 0.003])
        o = ico("star", (math.cos(th) * math.cos(ph) * R, math.sin(th) * math.cos(ph) * R, math.sin(ph) * R), size, m, 1)
        out.append(o)
    return out, g


def night_world(bg):
    bg.inputs["Color"].default_value = hexrgb("#1b2652")
    bg.inputs["Strength"].default_value = 0.9
    sun(1.1, (0.9, 0.0, 2.6), "#b9ccff", 0.1)   # moonlight


def bright_star(name, loc, r=1.6, strength=30.0):
    m, g = emis_mat(name, "#fff2cf", strength)
    core = ico(name, loc, r, m, 2)
    hm, hg = emis_mat(name + "halo", "#ffe7b0", 0.7)
    halo = uvs(name + "halo", loc, r * 2.4, hm, 24)
    return core, halo


def shot_dome(s, bg, cam):
    """Observatory on a hill at night; the camera tilts from the dome up into the stars; the closest star is marked."""
    night_world(bg)
    box("hill", (0, 0, -0.5), (80, 80, 1), mat("#2b3a2e", 0.95))
    cyl("base", (0, 6, 2), 3.2, 4, mat("#d9d6cf", 0.8), 32)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=3.3, location=(0, 6, 4))
    dome = bpy.context.active_object
    dome.data.materials.append(mat("#e9e6df", 0.4, metal=0.3))
    bpy.ops.object.shade_smooth()
    cyl("tube", (0, 4.4, 7.0), 0.32, 2.4, mat("#f2f0ea", 0.4), 20, (0.7, 0, 0))
    box("band", (0, 6, 4.0), (6.7, 6.7, 0.12), mat("#9a9da5", 0.5))
    lm, _ = emis_mat("dlight", "#ffcf8a", 6.0)
    box("door", (0, 2.8, 1.0), (0.9, 0.05, 1.9), lm)
    point((0, 2.0, 1.2), 300, "#ffcf8a", 0.5)
    stars, g = starfield(900, 400, 5)
    alpha, alpha_halo = bright_star("alpha", (-60, 330, 210), 1.8)
    ring_m, ring_g = emis_mat("ring", "#ffe36b", 0.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=16, minor_radius=0.6, location=(-60, 330, 210))
    ring = bpy.context.active_object
    ring.data.materials.append(ring_m)
    ring.rotation_euler = (Vector((0, 0, 0)) - Vector((-60, 330, 210))).to_track_quat("Z", "Y").to_euler()
    E = EV

    def update(t):
        for i, o in enumerate(stars[:300]):
            o.hide_render = t > E["each"] and random.Random(i * 7 + int(t * 2)).random() < 0.04
        ring_g.default_value = 8.0 * ramp(t, E["closest"], E["closest"] + 0.6) * (0.7 + 0.3 * math.sin(t * 5))
        look(cam, keys(t, [(SHOTS["dome"]["start"], (6, -10, 1.6)), (E["realize"] + 3, (4, -8, 2.0)), (E["closest"], (2, -6, 2.4)),
                           (SHOTS["dome"]["end"], (1.5, -5, 2.5))]),
             keys(t, [(SHOTS["dome"]["start"], (0, 6, 4)), (E["realize"] + 3, (-10, 60, 40)), (E["closest"], (-55, 320, 205)), (SHOTS["dome"]["end"], (-60, 330, 210))]),
             keys(t, [(SHOTS["dome"]["start"], 26), (E["closest"], 30), (SHOTS["dome"]["end"], 70)]))
    return update


def shot_roof(s, bg, cam):
    """Year 4: a rooftop crowd looks up; right on time, the marked star blinks out for five seconds."""
    night_world(bg)
    box("roof", (0, 0, -0.1), (30, 30, 0.2), mat("#4a4d55", 0.9))
    box("rail", (0, 9, 0.5), (30, 0.1, 0.08), mat("#9a9da5", 0.5))
    lit, _ = emis_mat("winlit", "#ffd59a", 4.0)
    for i in range(30):
        r = random.Random(i)
        x = -60 + i * 4.2
        h = r.uniform(8, 30) * (0.55 if abs(x) < 10 else 1.0)
        box("sky", (x, r.uniform(30, 60), h / 2 - 20), (3.6, 3.6, h), mat("#1b2033", 0.9))
        for j in range(int(h / 3)):
            if r.random() < 0.5:
                box("lw", (x + r.uniform(-1.2, 1.2), r.uniform(30, 60) - 1.85, j * 3 - 18), (0.6, 0.05, 0.8), lit)
    crowd = []
    for i in range(18):
        r = random.Random(i)
        p = Person(f"c{i}", (r.uniform(-7, 7), r.uniform(-1, 6), 0), r.uniform(-0.3, 0.3),
                   shirt=r.choice(["#3f7fd6", "#e8b84a", "#7a5bb6", "#3fae6a", "#e07a4a", "#f2f2ee", "#9e1b2d"]), pants=r.choice(["#2a2f3a", "#3f5f9e", "#3b3e46"]),
                   hair=r.choice(["#2b1d16", "#4a3426", "#d9c39a", "#1e1a18"]), style=r.choice(["short", "long", "pony", "bald"]), s=r.uniform(0.92, 1.05))
        p.root.rotation_euler = (0, 0, math.pi + r.uniform(-0.3, 0.3))
        crowd.append(p)
    nora = Person("nora", (1.5, -2.5, 0), math.pi, shirt="#c8423a", pants="#2a3350", hair="#3a2a22", style="pony", coat=True)
    tele = cyl("tele", (1.5, -1.6, 1.55), 0.1, 1.2, mat("#e9e6df", 0.4), 16, (1.1, 0, 0))
    cyl("tripod", (1.5, -1.9, 0.6), 0.03, 1.2, mat("#30343c", 0.5), 8)
    point((0, -4, 3), 150, "#9fb5ff", 3)
    stars, g = starfield(700, 400, 9)
    alpha, alpha_halo = bright_star("alpha", (-40, 300, 160), 1.7)
    E = EV

    def update(t):
        for i, p in enumerate(crowd):
            p.pose(head=(-0.5 - 0.1 * math.sin(i), 0.1 * math.sin(i * 2)), armR=(-0.3, 0, -0.06) if i % 3 else (-2.7, 0, -0.1))
        nora.pose(head=(-0.35, 0), armL=(-1.6, 0, 0.2), armR=(-1.5, 0, -0.2))
        nora.root.rotation_euler = (0, 0, math.pi + 0.05)
        blink = E["blink"] <= t < E["blink"] + 5.0
        alpha.hide_render = blink
        alpha_halo.hide_render = blink
        look(cam, keys(t, [(SHOTS["roof"]["start"], (0.5, -9, 1.4)), (E["blink"] - 1.0, (0.2, -7.5, 1.2)), (SHOTS["roof"]["end"], (0.0, -7.0, 1.1))]),
             keys(t, [(SHOTS["roof"]["start"], (0, 8, 3)), (E["blink"] - 1.0, (-6, 60, 22)), (SHOTS["roof"]["end"], (-8, 70, 26))]), 24)
    return update


def shot_sky(s, bg, cam):
    """The next million years: the sky keeps blinking. Then far away, someone watches our Sun blink."""
    night_world(bg)
    box("ground", (0, 0, -0.5), (300, 300, 1), mat("#141824", 0.95))
    for i in range(40):
        r = random.Random(i + 3)
        h = r.uniform(4, 30)
        box("sil", (-80 + i * 4.2, 60 + r.uniform(0, 20), h / 2), (3.8, 3.8, h), mat("#0d1020", 0.9))
    stars, g = starfield(1100, 450, 21)
    alpha, alpha_halo = bright_star("alpha", (-40, 300, 160), 1.7)
    # distant world (last beat): a dusty plain, a little tower, one yellow star = our Sun
    far = empty("far", (0, 0, -500))
    box("plain", (0, 0, -500.5), (400, 400, 1), mat("#5a3f4f", 0.95)).parent = None
    for i in range(12):
        r = random.Random(i + 40)
        ico("rock", (r.uniform(-20, 20), r.uniform(5, 40), -500 + 0.2), r.uniform(0.5, 1.6), mat("#3f2c38", 0.9), 1)
    box("tower", (3, 18, -500 + 3), (0.6, 0.6, 6), mat("#9aa0b0", 0.4))
    tl, _ = emis_mat("tl", "#ff5a5a", 8.0)
    ico("towerlight", (3, 18, -500 + 6.2), 0.18, tl, 2)
    our, our_halo = bright_star("oursun", (-30, 300, -500 + 120), 2.2, 40.0)
    point((0, 10, -500 + 8), 3000, "#c9a0ff", 6)
    E = EV

    def update(t):
        # random stars blink for five seconds each (seeded per star)
        for i, o in enumerate(stars):
            r = random.Random(i * 31)
            t0 = SHOTS["sky"]["start"] + r.uniform(-4, 14)
            o.hide_render = (t0 <= t < t0 + 5.0) and r.random() < 0.35
        alpha.hide_render = alpha_halo.hide_render = E["blink"] <= t < E["blink"] + 5.0
        if t < E["somewhere"]:
            look(cam, keys(t, [(SHOTS["sky"]["start"], (0, -10, 2)), (E["somewhere"], (0, -12, 8))]),
                 keys(t, [(SHOTS["sky"]["start"], (0, 100, 40)), (E["somewhere"], (0, 100, 120))]), 20)
            bg.inputs["Color"].default_value = hexrgb("#1b2652")
        else:
            bg.inputs["Color"].default_value = hexrgb("#3a2350")
            look(cam, keys(t, [(E["somewhere"], (0, -6, -500 + 1.7)), (SHOTS["sky"]["end"], (0, -3, -500 + 1.6))]),
                 keys(t, [(E["somewhere"], (-10, 120, -500 + 40)), (SHOTS["sky"]["end"], (-25, 280, -500 + 110))]), 26)
            our.hide_render = our_halo.hide_render = E["end"] + 0.4 < t < E["end"] + 5.4
    return update


BUILD = {
    "street": lambda s, bg, cam: shot_street(s, bg, cam, "street"),
    "vanish": lambda s, bg, cam: shot_street(s, bg, cam, "vanish"),
    "back": lambda s, bg, cam: shot_street(s, bg, cam, "back"),
    "dark": lambda s, bg, cam: shot_street(s, bg, cam, "dark"),
    "phones": lambda s, bg, cam: shot_street(s, bg, cam, "phones"),
    "void": shot_void, "light": shot_light, "space": shot_space, "lab": shot_lab, "dome": shot_dome, "roof": shot_roof, "sky": shot_sky,
}


def run(shot, times=None):
    random.seed(1)
    s, bg, cam = new_scene()
    update = BUILD[shot](s, bg, cam)
    os.makedirs(FRAMES, exist_ok=True)
    if times is not None:
        for t in times:
            update(t)
            s.render.filepath = os.path.join(ROOT, "out", f"still_{shot}_{t:06.2f}.jpg")
            bpy.ops.render.render(write_still=True)
        return
    sh = SHOTS[shot]
    f0, f1 = int(round(sh["start"] * FPS)), int(round(sh["end"] * FPS))
    step = int(os.environ.get("STEP", "1"))
    for f in range(f0, f1, step):
        out = os.path.join(FRAMES, f"f_{f:05d}.jpg")
        if os.path.exists(out) and not os.environ.get("FORCE"):
            continue
        update(f / FPS)
        s.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print(f"[{shot}] frame {f} / {f1}", flush=True)


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--still":
        run(args[1], [float(x) for x in args[2:]])
    else:
        for a in args:
            run(a)
