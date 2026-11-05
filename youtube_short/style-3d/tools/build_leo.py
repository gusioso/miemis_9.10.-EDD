#!/usr/bin/env python3
"""
Build Leo (the tall, handsome lead) in Blender (bpy 5.2 module) and export him as a rigged GLB for the three.js scene.

  python3 tools/build_leo.py            # -> public/leo.glb and out/leo_blender.png (Cycles preview)

Body: a Skin-modifier skeleton (one connected organic mesh) + Subdivision, with an auto-generated armature, so the
video can pose him bone by bone. Head and hair: metaballs (skull, square jaw, jaw angles, chin, cheekbones, brow
ridge, nose) converted to meshes, parented to the head bone. Clothes are face materials: white tee, open olive
bomber, dark jeans; sneakers are separate meshes on the foot bones. Blender axes: Z up, Leo faces -Y.
"""
import math
import os

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_GLB = os.path.join(ROOT, "public", "leo.glb")
OUT_PNG = os.path.join(ROOT, "out", "leo_blender.png")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(name, rgb, rough=0.55, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*[c ** 2.2 for c in rgb], 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    return m


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


M = {k: mat(k, hexrgb(v), r) for k, v, r in [
    ("skin", "#d9a07a", 0.5), ("stubble", "#b9886a", 0.6), ("lip", "#b8735a", 0.45), ("jacket", "#4f5a3a", 0.7),
    ("tee", "#f4f2ec", 0.85), ("jeans", "#2a3350", 0.8), ("hair", "#2b1c15", 0.6), ("shoe", "#f6f6f2", 0.45),
    ("sole", "#d6d6d0", 0.6), ("brow", "#24170f", 0.8), ("iris", "#4a6b3a", 0.2), ("pupil", "#0d0907", 0.2),
]}
M["eye"] = mat("eye", (1, 1, 1), 0.1, coat=1.0)

# ------------------------------------------------------------------ body skeleton for the Skin modifier
J = {  # name: (position, (radius x, radius y))
    "pelvis": ((0, 0, 0.95), (0.165, 0.11)),
    "spine": ((0, 0.005, 1.12), (0.16, 0.105)),
    "chest": ((0, 0, 1.31), (0.205, 0.125)),
    "neck": ((0, 0.005, 1.5), (0.07, 0.066)),
    "headbase": ((0, 0, 1.585), (0.064, 0.062)),
    "headtop": ((0, 0, 1.78), (0.02, 0.02)),
}
for s, side in ((1, "L"), (-1, "R")):
    J |= {
        f"shoulder.{side}": ((s * 0.235, 0, 1.43), (0.085, 0.075)),
        f"elbow.{side}": ((s * 0.3, 0.01, 1.16), (0.056, 0.056)),
        f"wrist.{side}": ((s * 0.33, -0.005, 0.92), (0.042, 0.036)),
        f"hand.{side}": ((s * 0.34, -0.01, 0.82), (0.045, 0.024)),
        f"hip.{side}": ((s * 0.1, 0, 0.92), (0.088, 0.088)),
        f"knee.{side}": ((s * 0.105, -0.01, 0.52), (0.066, 0.066)),
        f"ankle.{side}": ((s * 0.11, 0.01, 0.1), (0.045, 0.045)),
        f"toe.{side}": ((s * 0.115, -0.12, 0.05), (0.04, 0.03)),
    }
EDGES = [("pelvis", "spine"), ("spine", "chest"), ("chest", "neck"), ("neck", "headbase"), ("headbase", "headtop")]
for side in "LR":
    EDGES += [("chest", f"shoulder.{side}"), (f"shoulder.{side}", f"elbow.{side}"), (f"elbow.{side}", f"wrist.{side}"),
              (f"wrist.{side}", f"hand.{side}"), ("pelvis", f"hip.{side}"), (f"hip.{side}", f"knee.{side}"),
              (f"knee.{side}", f"ankle.{side}"), (f"ankle.{side}", f"toe.{side}")]
names = list(J)
me = bpy.data.meshes.new("LeoBody")
me.from_pydata([J[n][0] for n in names], [(names.index(a), names.index(b)) for a, b in EDGES], [])
body = bpy.data.objects.new("LeoBody", me)
scene.collection.objects.link(body)
bpy.context.view_layer.objects.active = body
body.select_set(True)
sk = body.modifiers.new("Skin", "SKIN")
sk.branch_smoothing = 0.6
for i, n in enumerate(names):
    body.data.skin_vertices[0].data[i].radius = J[n][1]
body.data.skin_vertices[0].data[names.index("pelvis")].use_root = True
bpy.ops.object.skin_armature_create(modifier="Skin")
arm = next(o for o in scene.objects if o.type == "ARMATURE")
arm.name = "LeoRig"
# name bones after the joint at their tail
pos = {n: Vector(J[n][0]) for n in names}
BONE_NAME = {"spine": "spine", "chest": "chest", "neck": "neck", "headbase": "neckTop", "headtop": "head"}
for side in "LR":
    BONE_NAME |= {f"shoulder.{side}": f"clavicle.{side}", f"elbow.{side}": f"upperarm.{side}", f"wrist.{side}": f"forearm.{side}",
                  f"hand.{side}": f"hand.{side}", f"hip.{side}": f"pelvisSide.{side}", f"knee.{side}": f"thigh.{side}",
                  f"ankle.{side}": f"shin.{side}", f"toe.{side}": f"foot.{side}"}
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
rename = {}
for b in arm.data.edit_bones:
    tail = b.tail.copy()
    near = min(names, key=lambda n: (pos[n] - tail).length)
    if (pos[near] - tail).length < 0.02 and near in BONE_NAME:
        rename[b.name] = BONE_NAME[near]
bpy.ops.object.mode_set(mode="OBJECT")
for old, new in rename.items():
    vg = body.vertex_groups.get(old)
    arm.data.bones[old].name = new
    if vg:
        vg.name = new
print("bones:", sorted(b.name for b in arm.data.bones))

# apply skin + subsurf (the armature modifier stays)
bpy.context.view_layer.objects.active = body
sub = body.modifiers.new("Sub", "SUBSURF")
sub.levels = 2
sub.render_levels = 2
order = ["Skin", "Sub"]
for nm in order:
    bpy.ops.object.modifier_move_to_index(modifier=nm, index=0 if nm == "Skin" else 1)
for nm in order:
    bpy.ops.object.modifier_apply(modifier=nm)
bpy.ops.object.shade_smooth()

# clothes as face materials
for k in ("skin", "jacket", "tee", "jeans"):
    body.data.materials.append(M[k])
for p in body.data.polygons:
    c = body.matrix_world @ p.center
    x, y, z = c
    if z < 0.965:
        idx = 0 if (abs(x) > 0.22 and z > 0.6) else 3  # hands are skin, the rest jeans
    elif z > 1.49:
        idx = 0  # neck
    elif abs(x) < 0.075 and y < -0.04 and 1.0 < z < 1.47:
        idx = 2  # tee showing through the open jacket
    else:
        idx = 1
    p.material_index = idx

# ------------------------------------------------------------------ head + hair (metaballs -> mesh)
HEAD_C = Vector((0, 0, 1.69))


def meta(name, elems, res=0.004, thr=0.6):
    mb = bpy.data.metaballs.new(name)
    mb.resolution = res
    mb.render_resolution = res
    mb.threshold = thr
    for kind, co, r, size, rot, neg in elems:
        e = mb.elements.new()
        e.type = kind
        e.co = co
        e.radius = r / 0.575  # a metaball's surface sits at ~57% of its radius (threshold 0.6, stiffness 2)
        e.use_negative = neg
        if kind == "ELLIPSOID":
            e.size_x, e.size_y, e.size_z = size
        if rot:
            e.rotation = rot
    ob = bpy.data.objects.new(name, mb)
    ob.location = HEAD_C
    scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in scene.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.convert(target="MESH")
    m_ob = bpy.context.view_layer.objects.active
    m_ob.name = name
    bpy.ops.object.shade_smooth()
    return m_ob


def E(co, size, r=0.1, rot=None, neg=False):
    return ("ELLIPSOID", co, r, size, rot, neg)


def B(co, r, neg=False):
    return ("BALL", co, r, None, None, neg)


tilt = lambda ax, a: __import__("mathutils").Quaternion(ax, a)
head = meta("LeoHead", [
    E((0, 0.008, 0.02), (0.92, 1.0, 1.05), 0.112),            # skull
    E((0, -0.006, -0.05), (0.88, 0.9, 0.62), 0.104),          # broad lower face / square jaw
    B((0.072, 0.0, -0.075), 0.05), B((-0.072, 0.0, -0.075), 0.05),   # jaw angles
    E((0, -0.07, -0.1), (1.25, 0.8, 0.8), 0.04),              # strong chin
    B((0.064, -0.07, -0.008), 0.032), B((-0.064, -0.07, -0.008), 0.032),  # cheekbones
    E((0, -0.083, 0.038), (2.4, 0.7, 0.6), 0.034),            # brow ridge (hooded eyes)
    E((0, -0.103, -0.012), (0.42, 0.65, 1.1), 0.036, tilt((1, 0, 0), -0.25)),  # nose bridge
    B((0, -0.118, -0.04), 0.018),                              # nose tip
    B((0.096, 0.012, -0.005), 0.026), B((-0.096, 0.012, -0.005), 0.026),  # ears
    B((0.04, -0.104, 0.012), 0.019, True), B((-0.04, -0.104, 0.012), 0.019, True),  # eye sockets
], res=0.0035)
head.data.materials.append(M["skin"])
head.data.materials.append(M["stubble"])
for p in head.data.polygons:
    x, y, z = p.center
    if (z < -0.058 and y < 0.03) or (z < -0.03 and abs(x) > 0.055 and y < 0.0 and z > -0.1 and abs(x) < 0.09):
        p.material_index = 1

hair = meta("LeoHair", [
    E((0, 0.016, 0.05), (0.97, 1.03, 0.95), 0.12),          # cap over the top and back
    E((0, 0.03, 0.0), (1.02, 0.98, 0.7), 0.11),             # short back/sides
    E((0, -0.07, 0.115), (0.9, 0.55, 0.45), 0.075, tilt((1, 0, 0), 0.5)),  # quiff, swept up
    E((0.025, -0.045, 0.135), (0.8, 0.5, 0.45), 0.07, tilt((0, 1, 0), 0.3)),
    E((-0.03, -0.035, 0.13), (0.7, 0.5, 0.45), 0.065, tilt((0, 1, 0), -0.3)),
    E((0, -0.006, 0.02), (0.9, 1.02, 1.05), 0.112, None, True),  # carve out the face
    E((0, -0.08, -0.02), (1.3, 0.8, 1.6), 0.09, None, True),
], res=0.004)
hair.data.materials.append(M["hair"])


def prim_sphere(name, loc, scale, material, rot=(0, 0, 0), seg=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(M[material])
    bpy.ops.object.shade_smooth()
    return o


def prim_capsule(name, loc, length, radius, material, rot):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radius, depth=length, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(M[material])
    mod = o.modifiers.new("b", "BEVEL")
    mod.width = radius * 0.9
    mod.segments = 4
    bpy.ops.object.modifier_apply(modifier="b")
    bpy.ops.object.shade_smooth()
    return o


face_parts = []
for s, side in ((1, "L"), (-1, "R")):
    ex, ey, ez = HEAD_C.x + s * 0.04, HEAD_C.y - 0.092, HEAD_C.z + 0.013
    face_parts += [
        prim_sphere(f"Eye.{side}", (ex, ey, ez), (0.021, 0.014, 0.0145), "eye", (0, 0, s * 0.12)),
        prim_sphere(f"Iris.{side}", (ex, ey - 0.0105, ez - 0.0005), (0.0095, 0.004, 0.0095), "iris"),
        prim_sphere(f"Pupil.{side}", (ex, ey - 0.0135, ez - 0.0005), (0.0048, 0.0018, 0.0048), "pupil"),
        prim_sphere(f"Lid.{side}", (ex, ey - 0.002, ez + 0.0085), (0.023, 0.016, 0.009), "skin", (0, 0, s * 0.12)),
        prim_capsule(f"Brow.{side}", (HEAD_C.x + s * 0.045, HEAD_C.y - 0.104, HEAD_C.z + 0.04), 0.05, 0.0075, "brow", (0, math.pi / 2, s * 0.1)),
    ]
face_parts += [
    prim_capsule("LipTop", (HEAD_C.x, HEAD_C.y - 0.104, HEAD_C.z - 0.066), 0.038, 0.0055, "lip", (0, math.pi / 2, 0)),
    prim_capsule("LipBottom", (HEAD_C.x, HEAD_C.y - 0.101, HEAD_C.z - 0.075), 0.032, 0.0068, "lip", (0, math.pi / 2, 0)),
    prim_sphere("MouthOpen", (HEAD_C.x, HEAD_C.y - 0.1, HEAD_C.z - 0.072), (0.016, 0.006, 0.013), "pupil"),
]
# sneakers on the foot bones, jacket collar on the chest
shoes = []
for s, side in ((1, "L"), (-1, "R")):
    shoes.append(prim_sphere(f"Shoe.{side}", (s * 0.113, -0.06, 0.045), (0.06, 0.13, 0.05), "shoe"))
    shoes.append(prim_sphere(f"Sole.{side}", (s * 0.113, -0.06, 0.012), (0.064, 0.135, 0.016), "sole"))
bpy.ops.mesh.primitive_torus_add(major_radius=0.085, minor_radius=0.026, location=(0, 0.005, 1.49), rotation=(0.15, 0, 0))
collar = bpy.context.active_object
collar.name = "Collar"
collar.data.materials.append(M["jacket"])
bpy.ops.object.shade_smooth()


def bone_parent(obj, bone):
    mw = obj.matrix_world.copy()
    obj.parent = arm
    obj.parent_type = "BONE"
    obj.parent_bone = bone
    obj.matrix_world = mw


for o in [head, hair, *face_parts]:
    bone_parent(o, "head")
for o in shoes:
    bone_parent(o, f"foot.{o.name[-1]}")
bone_parent(collar, "chest")

# ------------------------------------------------------------------ export
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
for o in scene.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_apply=True, export_skins=True, export_animations=False,
                          export_yup=True, export_materials="EXPORT")
print("exported", OUT_GLB, os.path.getsize(OUT_GLB) // 1024, "KB")

# ------------------------------------------------------------------ Cycles preview render (proof it's built in Blender)
if not os.environ.get("NO_PREVIEW"):
    world = bpy.data.worlds.new("w")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.95, 0.82, 0.68, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.7
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(mat("floor", hexrgb("#c98f5e"), 0.7))
    for loc, energy, size in (((2.2, -3, 3.5), 900, 2.5), ((-2.5, -1.5, 2.2), 300, 3), ((0.5, 2.5, 2.8), 500, 1.5)):
        bpy.ops.object.light_add(type="AREA", location=loc)
        L = bpy.context.active_object
        L.data.energy = energy
        L.data.size = size
        L.rotation_euler = (Vector((0, 0, 1.2)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=(0.9, -3.6, 1.45))
    cam = bpy.context.active_object
    cam.rotation_euler = (Vector((0, 0, 1.12)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 50
    scene.camera = cam
    scene.render.engine = "CYCLES"
    scene.cycles.samples = int(os.environ.get("SAMPLES", "48"))
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1000
    scene.render.filepath = OUT_PNG
    bpy.ops.render.render(write_still=True)
    print("rendered", OUT_PNG)
    # face close-up
    cam.location = (0.18, -0.6, 1.72)
    cam.rotation_euler = (HEAD_C - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.resolution_x = 720
    scene.render.resolution_y = 720
    scene.render.filepath = OUT_PNG.replace(".png", "_face.png")
    bpy.ops.render.render(write_still=True)
    print("rendered face")
