"""Shared modelling helpers for the Ascension chambers (Blender 5.x, headless).

Units are metres-ish world units. Blender is Z-up; the glTF exporter turns it
Y-up, so a wheel that turns about Blender's Y axis turns about the web's Z.
Flat parts are drawn as 2D curves in the XZ plane (their face points at -Y,
towards the camera) and extruded along Y.
"""
import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT_GLB = os.path.join(ROOT, "public", "world")
REVIEW = os.path.join(ROOT, "design", "review", "world")


# ---------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def link(ob, parent=None):
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def empty(name, loc=(0, 0, 0), parent=None, **extras):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.2
    ob.location = loc
    for k, v in extras.items():
        ob[k] = v
    return link(ob, parent)


def mesh_obj(name, bm, mat=None, parent=None, loc=(0, 0, 0), smooth_angle=32):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    link(ob, parent)
    finish(ob, mat, smooth_angle)
    return ob


def finish(ob, mat=None, smooth_angle=32):
    me = ob.data
    if smooth_angle is not None:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(smooth_angle))
    if mat is not None:
        me.materials.clear()
        me.materials.append(material(mat))


# ---------------------------------------------------------------- materials
# Names matter: the web replaces each by its own material with the same name.
MATS = {
    "brass": dict(color=(0.80, 0.56, 0.24), metal=1.0, rough=0.27),
    "brass_dark": dict(color=(0.45, 0.30, 0.12), metal=1.0, rough=0.42),
    "iron": dict(color=(0.035, 0.034, 0.032), metal=0.55, rough=0.58),
    "steel": dict(color=(0.62, 0.62, 0.64), metal=1.0, rough=0.2),
    "rope": dict(color=(0.30, 0.22, 0.14), metal=0.0, rough=0.9),
    "enamel": dict(color=(0.012, 0.018, 0.015), metal=0.0, rough=0.22),
    "copper": dict(color=(0.75, 0.38, 0.22), metal=1.0, rough=0.3),
    "wood": dict(color=(0.16, 0.1, 0.06), metal=0.0, rough=0.8),
}


def material(name):
    m = bpy.data.materials.get(name)
    if m:
        return m
    spec = MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*spec["color"], 1)
    bsdf.inputs["Metallic"].default_value = spec["metal"]
    bsdf.inputs["Roughness"].default_value = spec["rough"]
    return m


# ---------------------------------------------------------------- 2D outlines
def circle(r, n=64, a0=0.0, cx=0.0, cy=0.0, ccw=True):
    s = 1 if ccw else -1
    return [(cx + r * math.cos(a0 + s * i / n * 2 * math.pi), cy + r * math.sin(a0 + s * i / n * 2 * math.pi)) for i in range(n)]


def arc(r, a1, a2, n, cx=0.0, cy=0.0):
    return [(cx + r * math.cos(a1 + (a2 - a1) * i / (n - 1)), cy + r * math.sin(a1 + (a2 - a1) * i / (n - 1))) for i in range(n)]


def chaikin(pts, it=2, closed=True):
    """Corner-cutting: rounds polygon corners without moving long arcs much."""
    for _ in range(it):
        out = []
        n = len(pts)
        for i in range(n if closed else n - 1):
            p, q = pts[i], pts[(i + 1) % n]
            out.append((0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]))
            out.append((0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]))
        pts = out
    return pts


def clock_teeth(n, r, h_add=None, h_ded=None, width=0.46, tip=0.8, steps=7):
    """Wheel/pinion outline with horological teeth: radial flanks below the
    pitch circle and a rounded ogive addendum above it."""
    p = 2 * math.pi / n
    m = 2 * r / n
    h_add = h_add if h_add is not None else 1.35 * m
    h_ded = h_ded if h_ded is not None else 1.6 * m
    rf = r - h_ded
    w = width * p  # tooth angular width at the pitch circle
    pts = []
    for i in range(n):
        c = i * p
        # root arc from the previous tooth
        for k in range(3):
            a = c - p / 2 + (p - w) / 2 * (k / 3)
            pts.append((rf * math.cos(a), rf * math.sin(a)))
        # leading flank up to pitch
        a = c - w / 2
        pts.append((rf * math.cos(a), rf * math.sin(a)))
        pts.append((r * math.cos(a), r * math.sin(a)))
        # ogive tip
        for k in range(1, steps):
            phi = -math.pi / 2 + math.pi * k / steps
            rr = r + h_add * (math.cos(phi) ** tip)
            aa = c + (w / 2) * math.sin(phi)
            pts.append((rr * math.cos(aa), rr * math.sin(aa)))
        a = c + w / 2
        pts.append((r * math.cos(a), r * math.sin(a)))
        pts.append((rf * math.cos(a), rf * math.sin(a)))
    return pts, rf


def escape_teeth(n, r, depth=0.16, lean=0.35):
    """Graham escape wheel: long pointed teeth leaning forward, with a small
    flat impulse face at the tip."""
    p = 2 * math.pi / n
    rf = r * (1 - depth)
    pts = []
    for i in range(n):
        c = i * p
        pts.append((rf * math.cos(c), rf * math.sin(c)))
        pts.append((rf * math.cos(c + p * 0.12), rf * math.sin(c + p * 0.12)))
        tip = c + p * (0.12 + lean)
        pts.append((r * 0.985 * math.cos(tip), r * 0.985 * math.sin(tip)))
        pts.append((r * math.cos(tip + p * 0.08), r * math.sin(tip + p * 0.08)))
        # undercut locking face back down to the root
        pts.append((rf * 1.02 * math.cos(c + p * 0.62), rf * 1.02 * math.sin(c + p * 0.62)))
    return pts, rf


def crossings(r_in, r_hub, count, spoke_w, rot=0.0, curve=0.0, fillet_it=3):
    """Windows between the spokes ("crossings") of a clock wheel. `curve`
    bends the spokes into an S like a Victorian tower-clock wheel."""
    wins = []
    for k in range(count):
        a0 = rot + k * 2 * math.pi / count
        a1 = rot + (k + 1) * 2 * math.pi / count
        so = math.asin(min(0.99, spoke_w / 2 / r_in))
        si = math.asin(min(0.99, spoke_w / 2 / r_hub))
        n = 28
        outer = arc(r_in, a0 + so, a1 - so, n)
        inner = arc(r_hub, a1 - si, a0 + si, max(6, n // 3))
        # spoke sides, optionally curved
        side1, side2 = [], []
        for j in range(1, 8):
            t = j / 8
            rr = r_in + (r_hub - r_in) * t
            bend = curve * math.sin(math.pi * t)
            side1.append((rr * math.cos(a1 - so + (so - si) * t + bend), rr * math.sin(a1 - so + (so - si) * t + bend)))
        for j in range(1, 8):
            t = j / 8
            rr = r_hub + (r_in - r_hub) * t
            bend = curve * math.sin(math.pi * (1 - t))
            side2.append((rr * math.cos(a0 + si + (so - si) * t + bend), rr * math.sin(a0 + si + (so - si) * t + bend)))
        poly = outer + side1 + inner + side2
        wins.append(chaikin(poly, fillet_it))
    return wins


def catmull(points, per=16):
    """Centripetal-ish Catmull-Rom through 2D points (ends clamped)."""
    pts = [points[0], *points, points[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(per):
            t = k / per
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in range(2)))
    out.append(points[-1])
    return out


def band(path, w0, w1=None, caps=10):
    """Closed outline of a strip of width w0→w1 along a 2D path, with round ends."""
    w1 = w0 if w1 is None else w1
    n = len(path)
    left, right = [], []
    for i, p in enumerate(path):
        a = path[max(0, i - 1)]
        b = path[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        w = (w0 + (w1 - w0) * i / (n - 1)) / 2
        left.append((p[0] + nx * w, p[1] + ny * w))
        right.append((p[0] - nx * w, p[1] - ny * w))
    def cap(c, a_dir, w):
        return arc(w, a_dir + math.pi / 2, a_dir - math.pi / 2, caps, c[0], c[1])[1:-1]
    e = path[-1]
    d_end = math.atan2(path[-1][1] - path[-2][1], path[-1][0] - path[-2][0])
    s = path[0]
    d_start = math.atan2(path[0][1] - path[1][1], path[0][0] - path[1][0])
    return left + cap(e, d_end, w1 / 2) + right[::-1] + cap(s, d_start, w0 / 2)


def stadium(x1, y1, x2, y2, w, n=16):
    """Bar with round ends between two points (a clock "cock" or bridge)."""
    a = math.atan2(y2 - y1, x2 - x1)
    pts = arc(w / 2, a + math.pi / 2, a + 3 * math.pi / 2, n, x1, y1)
    pts += arc(w / 2, a - math.pi / 2, a + math.pi / 2, n, x2, y2)
    return pts


# ---------------------------------------------------------------- extrusion
def flat(name, outlines, thick, mat, parent=None, loc=(0, 0, 0), bevel=0.012, bevel_res=2, smooth_angle=35):
    """Extrude closed 2D outlines (first is the outer, the rest are holes, fill
    is even-odd) into a solid with rounded edges. The face sits in the XZ plane,
    centred on y=0."""
    cu = bpy.data.curves.new(name + "_cu", "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = max(0.0, thick / 2 - bevel)
    cu.bevel_depth = bevel
    cu.bevel_resolution = bevel_res
    cu.offset = 0.0
    for pts in outlines:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for i, (x, y) in enumerate(pts):
            sp.points[i].co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    tmp = bpy.data.objects.new(name + "_tmp", cu)
    bpy.context.scene.collection.objects.link(tmp)
    deps = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(deps))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    # curve XY plane -> object XZ plane, face towards -Y
    me.transform(Matrix.Rotation(math.radians(90), 4, "X"))
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    link(ob, parent)
    weld(ob)
    finish(ob, mat, smooth_angle)
    return ob


def weld(ob, dist=1e-5):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=dist)
    bm.to_mesh(ob.data)
    bm.free()


def lathe(name, profile, mat, parent=None, loc=(0, 0, 0), segs=48, axis="Y", smooth_angle=40, closed=False):
    """Revolve a (radius, height) profile around an axis: arbors, collars,
    pillars, the pendulum bob. `closed` joins the last point back to the first
    (a ring section, e.g. a tyre) instead of capping the ends."""
    bm = bmesh.new()
    rings = []
    for (r, h) in profile:
        ring = []
        for i in range(segs):
            a = i / segs * 2 * math.pi
            if axis == "Y":
                co = (r * math.cos(a), h, r * math.sin(a))
            elif axis == "Z":
                co = (r * math.cos(a), r * math.sin(a), h)
            else:
                co = (h, r * math.cos(a), r * math.sin(a))
            ring.append(bm.verts.new(co))
        rings.append(ring)
    spans = len(rings) if closed else len(rings) - 1
    for j in range(spans):
        nxt = rings[(j + 1) % len(rings)]
        for i in range(segs):
            a, b = rings[j][i], rings[j][(i + 1) % segs]
            c, d = nxt[(i + 1) % segs], nxt[i]
            try:
                bm.faces.new((a, b, c, d))
            except ValueError:
                pass
    # caps where the profile starts/ends off-axis
    if not closed:
        for ring in (rings[0], rings[-1]):
            if len(ring) > 2:
                try:
                    bm.faces.new(ring)
                except ValueError:
                    pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, mat, parent, loc, smooth_angle)


def rod(name, a, b, r, mat, parent=None, segs=16):
    """Cylinder between two points."""
    a, b = Vector(a), Vector(b)
    d = b - a
    L = d.length
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r, depth=L)
    ob = mesh_obj(name, bm, mat, parent, smooth_angle=40)
    ob.location = (a + b) / 2
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return ob


def tube_along(name, pts, r, mat, parent=None, segs=10):
    """Rope or cable following a 3D polyline."""
    cu = bpy.data.curves.new(name + "_cu", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = max(1, segs // 4)
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
    tmp = bpy.data.objects.new(name + "_tmp", cu)
    bpy.context.scene.collection.objects.link(tmp)
    deps = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(deps))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    ob = bpy.data.objects.new(name, me)
    link(ob, parent)
    finish(ob, mat, 50)
    return ob


# ---------------------------------------------------------------- bake + export
def use_gpu():
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if devs:
                for d in prefs.devices:
                    d.use = d.type == kind
                bpy.context.scene.cycles.device = "GPU"
                print("CYCLES DEVICE", kind, [d.name for d in devs])
                return
        except TypeError:
            continue
    print("CYCLES DEVICE CPU")


def bake_ao(objs, samples=96, distance=0.6):
    """Ambient occlusion into a colour attribute called AO (exported as
    COLOR_0). Baked with every part in place so wheels darken where they sit
    close to the plate and each other."""
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    use_gpu()
    sc.cycles.samples = samples
    sc.world = sc.world or bpy.data.worlds.new("w")
    sc.world.light_settings.distance = distance
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs:
        me = ob.data
        for a in list(me.color_attributes):
            me.color_attributes.remove(a)
        attr = me.color_attributes.new("AO", "BYTE_COLOR", "POINT")
        me.color_attributes.active_color = attr
        me.color_attributes.render_color_index = me.color_attributes.active_color_index
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.bake(type="AO", target="VERTEX_COLORS", use_clear=True)
    print(f"BAKED AO on {len(objs)} meshes")


def meshes():
    return [o for o in bpy.context.scene.objects if o.type == "MESH"]


def export(name):
    os.makedirs(OUT_GLB, exist_ok=True)
    path = os.path.join(OUT_GLB, f"{name}.raw.glb")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
        export_vertex_color="ACTIVE",
        export_all_vertex_colors=False,
        export_materials="EXPORT",
        export_image_format="NONE",
        export_yup=True,
        export_texcoords=False,
    )
    tris = sum(len(o.data.loop_triangles) for o in meshes() if (o.data.calc_loop_triangles() or True))
    print(f"EXPORTED {path} ({tris} tris)")
    return path


# ---------------------------------------------------------------- preview
def preview(name, cam_loc, target, lens=50, res=(1280, 800), samples=96):
    """Cycles render for judging the model (not shipped)."""
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    use_gpu()
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.view_settings.view_transform = "AgX"
    w = sc.world or bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.004, 0.004, 0.005, 1)
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = lens
    cam = bpy.data.objects.new("cam", cam_data)
    link(cam)
    cam.location = cam_loc
    d = Vector(target) - Vector(cam_loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam

    def area(nm, loc, rot_target, energy, size, color):
        ld = bpy.data.lights.new(nm, "AREA")
        ld.energy = energy
        ld.size = size
        ld.color = color
        lo = bpy.data.objects.new(nm, ld)
        link(lo)
        lo.location = loc
        lo.rotation_euler = (Vector(rot_target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return lo

    t = Vector(target)
    k = area("key", t + Vector((1.5, -3, 9)), t, 2600, 3.0, (1.0, 0.82, 0.62))
    r = area("rim", t + Vector((-6, 6, 3)), t, 900, 4.0, (0.75, 0.9, 1.0))
    f = area("fill", t + Vector((0, -9, -1)), t, 120, 6.0, (1.0, 0.9, 0.8))
    os.makedirs(REVIEW, exist_ok=True)
    sc.render.filepath = os.path.join(REVIEW, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    for o in (cam, k, r, f):
        bpy.data.objects.remove(o)
    print("PREVIEW", sc.render.filepath)
