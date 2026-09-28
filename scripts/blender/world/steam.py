"""Chamber 2, 1800s: a steam locomotive's running gear.

Three coupled drivers, their coupling rods, the main rod, crosshead, slide bars
and cylinder on both sides (the far side a quarter turn behind, as on a real
engine), the leading bogie, a boiler with its dome and chimney, the cab and a
length of track. The web turns the wheels (faster when you scroll faster) and
solves the rods from the crank angle; the numbers it needs ride on the root
node's extras.

Drawn in the XZ plane: X runs along the engine (front is +X), Z is up, the
near side faces -Y (the camera).
"""
import math

import bmesh
import bpy
from mathutils import Vector

from common import (arc, band, catmull, circle, crossings, empty, finish, flat, lathe, mesh_obj, rod, stadium,
                    tube_along)

R = 1.3            # driver radius at the tread
A = R              # axle height above the rail
DRIVERS = [-2.9, 0.0, 2.9]
CRANK = 0.52
ROD = 3.3          # main rod, crankpin to crosshead pin
Y_WHEEL = 0.78     # wheel planes at ±Y_WHEEL (track gauge 1.56)
Y_COUPLE = 1.02
Y_MAIN = 1.2
Y_CYL = 1.22
DROP = -3.1        # the whole engine sits low in the chamber
# Walschaerts valve gear (side view, relative to the middle axle)
RET = 0.34         # return crank radius, a quarter turn ahead of the main crank
LINK = (1.9, A + 0.78)   # expansion link pivot
LINK_TAIL = 0.34   # link pivot to the eccentric rod's pin
LINK_DIE = 0.14    # link pivot to the radius rod's die block
ECC = math.hypot(LINK[0] - 0.0, (LINK[1] - LINK_TAIL) - (A + RET))
CL_X = 0.35        # combination lever, ahead of the crosshead pin
CL_TOP = A + 0.86
RADIUS_ROD = (CRANK + ROD + CL_X) - LINK[0]


def boxes(name, specs, mat, parent=None):
    """Many boxes in one mesh: specs are (centre, size)."""
    bm = bmesh.new()
    for c, s in specs:
        r = bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector(s), verts=r["verts"])
        bmesh.ops.translate(bm, vec=Vector(c), verts=r["verts"])
    return mesh_obj(name, bm, mat, parent, smooth_angle=30)


def wheel(name, parent, x, side, radius, spokes, crank=None, counter=True):
    """A spoked driving wheel. `side` is -1 (near) or +1 (far)."""
    y = side * Y_WHEEL
    node = empty(name, (x, y, radius), parent, role="wheel", radius=radius, side=side)
    s = -side  # outward
    # tyre with its flange on the inside
    t = 0.1
    prof = [(radius - 0.11, s * t), (radius, s * t), (radius, -s * 0.05), (radius + 0.1, -s * 0.07),
            (radius + 0.1, -s * 0.12), (radius - 0.11, -s * 0.12)]
    if s < 0:
        prof = prof[::-1]
    lathe(name + "_tyre", prof, "steel", parent=node, segs=96, smooth_angle=35, closed=True)
    # spoked centre, cast in one piece
    r_in = radius - 0.25
    wins = crossings(r_in, radius * 0.27, spokes, radius * 0.068, rot=math.radians(90 / spokes), fillet_it=1)
    flat(name + "_centre", [circle(radius - 0.15, 96), *wins], 0.14, "iron", parent=node, bevel=0.018)
    lathe(name + "_hub", [(0.0, -0.13), (radius * 0.27, -0.13), (radius * 0.3, -0.09), (radius * 0.3, 0.09),
                          (radius * 0.27, 0.13), (0.0, 0.13)], "iron", parent=node, segs=40)
    if counter:
        # counterweight: a crescent opposite the crank
        a0, a1 = math.radians(180 - 52), math.radians(180 + 52)
        cw = arc(r_in + 0.02, a0, a1, 32) + arc(radius * 0.36, a1, a0, 20)
        flat(name + "_counter", [cw], 0.2, "iron", parent=node, bevel=0.02)
    if crank is not None and crank > 0.5:
        # return crank: from the crankpin to a point a quarter turn ahead
        flat(name + "_return", [stadium(CRANK, 0.0, 0.0, RET, 0.13, 10)], 0.05, "steel", parent=node,
             loc=(0, s * (Y_MAIN - Y_WHEEL + 0.13), 0), bevel=0.008)
        lathe(name + "_returnpin", [(0.0, 0.0), (0.05, 0.0), (0.05, s * 0.14), (0.0, s * 0.14)], "steel", parent=node,
              loc=(0, s * (Y_MAIN - Y_WHEEL + 0.1), RET), segs=12)
    if crank is not None:
        # crank boss and pin, standing out to the rods
        lathe(name + "_boss", [(0.0, 0.0), (0.2, 0.0), (0.2, s * 0.16), (0.14, s * 0.2), (0.0, s * 0.2)], "steel",
              parent=node, loc=(CRANK, s * 0.12, 0), segs=28)
        lathe(name + "_pin", [(0.0, 0.0), (0.085, 0.0), (0.085, s * crank), (0.11, s * (crank + 0.02)),
                              (0.11, s * (crank + 0.07)), (0.0, s * (crank + 0.07))], "steel", parent=node,
              loc=(CRANK, s * 0.3, 0), segs=20)
    return node


def side(parent, s):
    """Rods, crosshead and cylinder on one side (s = -1 near, +1 far)."""
    tag = "L" if s < 0 else "R"
    # coupling rod: from the rear to the front crankpin, bosses at every pin
    cr = empty(f"coupling_{tag}", (CRANK, s * Y_COUPLE, A), parent, role="coupling", side=s)
    x0, x2 = DRIVERS[0], DRIVERS[2]
    outline = stadium(x0, 0, x2, 0, 0.2, 14)
    flat(f"coupling_{tag}_bar", [outline], 0.07, "steel", parent=cr, bevel=0.012)
    flat(f"coupling_{tag}_flute", [stadium(x0 + 0.3, 0, x2 - 0.3, 0, 0.07, 8)], 0.075, "iron", parent=cr,
         loc=(0, s * 0.004, 0), bevel=0.004)
    for dx in DRIVERS:
        flat(f"coupling_{tag}_eye{int(dx * 10)}", [circle(0.2, 32), circle(0.09, 20)], 0.1, "steel", parent=cr,
             loc=(dx, 0, 0), bevel=0.012)

    # main rod: big end on the middle crankpin, small end at the crosshead
    mr = empty(f"mainrod_{tag}", (CRANK, s * Y_MAIN, A), parent, role="mainrod", side=s, length=ROD)
    body = band([(0.0, 0.0), (ROD, 0.0)], 0.26, 0.17, caps=12)
    flat(f"mainrod_{tag}_bar", [body], 0.08, "steel", parent=mr, bevel=0.014)
    flat(f"mainrod_{tag}_flute", [band([(0.36, 0.0), (ROD - 0.26, 0.0)], 0.1, 0.06, caps=6)], 0.085, "iron", parent=mr,
         loc=(0, s * 0.004, 0), bevel=0.004)
    flat(f"mainrod_{tag}_big", [circle(0.25, 36), circle(0.1, 20)], 0.12, "steel", parent=mr, bevel=0.014)
    flat(f"mainrod_{tag}_small", [circle(0.15, 28), circle(0.06, 16)], 0.11, "steel", parent=mr, loc=(ROD, 0, 0),
         bevel=0.01)

    # crosshead and piston rod slide together
    xc = CRANK + ROD
    ch = empty(f"crosshead_{tag}", (xc, s * Y_MAIN, A), parent, role="crosshead", side=s)
    boxes(f"crosshead_{tag}_block", [((0.05, 0, 0), (0.46, 0.2, 0.34)), ((0.05, 0, 0.2), (0.56, 0.24, 0.06)),
                                    ((0.05, 0, -0.2), (0.56, 0.24, 0.06))], "steel", parent=ch)
    rod(f"crosshead_{tag}_pistonrod", (0.25, 0, 0), (2.1, 0, 0), 0.055, "steel", parent=ch, segs=16)

    # static: slide bars and the cylinder
    for dz in (0.26, -0.26):
        boxes(f"slidebar_{tag}{'u' if dz > 0 else 'd'}", [(((xc - CRANK + xc + CRANK) / 2 + 0.15, s * Y_MAIN, A + dz),
                                                          (2.1, 0.12, 0.07))], "steel", parent=parent)
    cx0, cx1 = xc + CRANK + 0.55, xc + CRANK + 2.25
    prof = [(0.0, cx0), (0.3, cx0), (0.52, cx0 + 0.04), (0.56, cx0 + 0.1), (0.5, cx0 + 0.14), (0.5, cx1 - 0.14),
            (0.56, cx1 - 0.1), (0.52, cx1 - 0.04), (0.3, cx1), (0.0, cx1)]
    lathe(f"cylinder_{tag}", prof, "iron", parent=parent, loc=(0, s * Y_CYL, A), axis="X", segs=48)
    lathe(f"cylinder_{tag}_gland", [(0.0, cx0 - 0.22), (0.14, cx0 - 0.22), (0.16, cx0 - 0.15), (0.16, cx0),
                                     (0.0, cx0)], "brass", parent=parent, loc=(0, s * Y_CYL, A), axis="X", segs=24)
    boxes(f"steamchest_{tag}", [(((cx0 + cx1) / 2, s * Y_CYL, A + 0.78), (1.5, 0.62, 0.55))], "iron", parent=parent)
    # a bracket tying the slide bars to the cylinder cover
    boxes(f"motionbracket_{tag}", [((xc - CRANK - 0.45, s * (Y_MAIN - 0.12), A), (0.12, 0.42, 0.95))], "iron",
          parent=parent)

    # ---- valve gear
    yv = s * (Y_MAIN + 0.2)
    # eccentric rod: return crank pin to the tail of the expansion link
    er = empty(f"eccrod_{tag}", (0.0, yv, A + RET), parent, role="eccrod", side=s, length=ECC)
    flat(f"eccrod_{tag}_bar", [band([(0.0, 0.0), (ECC, 0.0)], 0.11, 0.08, caps=8)], 0.05, "steel", parent=er,
         bevel=0.008)
    flat(f"eccrod_{tag}_eye", [circle(0.1, 20), circle(0.045, 12)], 0.07, "steel", parent=er, bevel=0.008)
    # expansion link: a curved slotted link rocking on its pivot, tail below
    lk = empty(f"link_{tag}", (LINK[0], yv, LINK[1]), parent, role="link", side=s, tail=LINK_TAIL, die=LINK_DIE)
    rr = 1.6
    outer = arc(rr + 0.075, math.radians(180 - 16), math.radians(180 + 16), 24, rr, 0.0)
    inner = arc(rr - 0.075, math.radians(180 + 16), math.radians(180 - 16), 24, rr, 0.0)
    slot_o = arc(rr + 0.028, math.radians(180 - 12), math.radians(180 + 12), 18, rr, 0.0)
    slot_i = arc(rr - 0.028, math.radians(180 + 12), math.radians(180 - 12), 18, rr, 0.0)
    flat(f"link_{tag}_body", [outer + inner, (slot_o + slot_i)[::-1]], 0.07, "steel", parent=lk, bevel=0.008)
    flat(f"link_{tag}_tail", [stadium(0.0, 0.0, 0.0, -LINK_TAIL, 0.12, 8)], 0.06, "steel", parent=lk, bevel=0.008)
    lathe(f"link_{tag}_trunnion", [(0.0, -0.08), (0.08, -0.08), (0.08, 0.08), (0.0, 0.08)], "brass", parent=lk,
          segs=16)
    # radius rod: from the die block in the link forward to the combination lever
    rd = empty(f"radiusrod_{tag}", (LINK[0], yv, LINK[1] + LINK_DIE), parent, role="radiusrod", side=s,
               length=RADIUS_ROD)
    flat(f"radiusrod_{tag}_bar", [band([(0.0, 0.0), (RADIUS_ROD, 0.0)], 0.1, 0.08, caps=8)], 0.05, "steel",
         parent=rd, bevel=0.008)
    boxes(f"radiusrod_{tag}_die", [((0, 0, 0), (0.1, 0.09, 0.07))], "brass", parent=rd)
    # combination lever: hangs from the valve spindle, its foot tied to the crosshead
    cl = empty(f"comblever_{tag}", (CRANK + ROD + CL_X, s * (Y_MAIN + 0.13), CL_TOP), parent, role="comblever", side=s)
    flat(f"comblever_{tag}_bar", [stadium(0.0, 0.0, 0.0, -(CL_TOP - A + 0.34), 0.1, 8)], 0.05, "steel", parent=cl,
         bevel=0.008)
    # valve spindle into the steam chest
    vs = empty(f"valvespindle_{tag}", (CRANK + ROD + CL_X, s * Y_CYL, CL_TOP), parent, role="valvespindle", side=s)
    rod(f"valvespindle_{tag}_rod", (0.0, 0, 0), (1.25, 0, 0), 0.035, "steel", parent=vs, segs=12)
    # link bracket hanging from the footplate
    boxes(f"linkbracket_{tag}", [((LINK[0], s * (Y_MAIN + 0.07), LINK[1] + 0.55), (0.3, 0.12, 1.0))], "iron",
          parent=parent)


def build():
    root = empty("steam", (0, 0, DROP), chamber="steam", crank=CRANK, rod=ROD, axle=A, driverRadius=R, ret=RET,
                 linkX=LINK[0], linkY=LINK[1], linkTail=LINK_TAIL, linkDie=LINK_DIE, ecc=ECC, clX=CL_X,
                 clTop=CL_TOP, radiusRod=RADIUS_ROD)

    # ---------------------------------------------------------------- wheels
    for sd in (-1, 1):
        tag = "L" if sd < 0 else "R"
        for i, x in enumerate(DRIVERS):
            wheel(f"driver_{tag}{i}", root, x, sd, R, 18, crank=0.66 if i == 1 else 0.4)
        for i, x in enumerate((6.95, 8.3)):
            wheel(f"bogie_{tag}{i}", root, x, sd, 0.55, 10, counter=False)
        wheel(f"trailer_{tag}", root, -5.7, sd, 0.7, 12, counter=False)
        side(root, sd)

    # ---------------------------------------------------------------- axles
    static = empty("body", (0, 0, 0), root, role="static")
    for x, r in [(x, R) for x in DRIVERS] + [(6.95, 0.55), (8.3, 0.55), (-5.7, 0.7)]:
        rod(f"axle_{int(x * 10)}", (x, -Y_WHEEL, r), (x, Y_WHEEL, r), 0.1, "steel", parent=static, segs=20)

    # ---------------------------------------------------------------- frames, footplate, splashers
    for sd in (-1, 1):
        tag = "L" if sd < 0 else "R"
        fr = [(-6.9, 0.95), (9.0, 0.95), (9.0, 2.35), (-6.9, 2.35)]
        holes = [circle(0.2, 20, cx=x, cy=r) for x, r in [(x, R) for x in DRIVERS] + [(-5.7, 0.7)]]
        flat(f"frame_{tag}", [fr, *holes], 0.08, "enamel", parent=static, loc=(0, sd * 0.55, 0), bevel=0.01)
        # valance along the footplate edge
        flat(f"valance_{tag}", [[(-4.4, 2.3), (9.1, 2.3), (9.1, 2.52), (-4.4, 2.52)]], 0.05, "enamel", parent=static,
             loc=(0, sd * 1.48, 0), bevel=0.01)
        # splashers over the drivers: arcs standing on the footplate
        for x in DRIVERS:
            sp = arc(R + 0.24, math.radians(28), math.radians(152), 40, x, A) + \
                arc(R + 0.14, math.radians(152), math.radians(28), 40, x, A)
            flat(f"splasher_{tag}{int(x * 10)}", [sp], 0.07, "enamel", parent=static, loc=(0, sd * 1.0, 0),
                 bevel=0.012)
            bandpts = arc(R + 0.26, math.radians(26), math.radians(154), 40, x, A) + \
                arc(R + 0.235, math.radians(154), math.radians(26), 40, x, A)
            flat(f"splasherbead_{tag}{int(x * 10)}", [bandpts], 0.075, "brass", parent=static,
                 loc=(0, sd * 1.0, 0), bevel=0.006)
    boxes("footplate", [((2.35, 0, 2.47), (13.5, 2.96, 0.06)), ((8.7, 0, 1.7), (0.35, 2.7, 1.1))], "enamel",
          parent=static)

    # ---------------------------------------------------------------- boiler
    zb = 3.78
    lathe("boiler", [(0.0, -3.3), (1.22, -3.3), (1.25, -3.25), (1.25, 6.15), (1.22, 6.2), (0.0, 6.2)], "enamel",
          parent=static, loc=(0, 0, zb), axis="X", segs=64)
    for k, x in enumerate((-2.6, 0.3, 3.1, 5.6)):
        lathe(f"boilerband_{k}", [(1.24, x - 0.05), (1.275, x - 0.04), (1.275, x + 0.04), (1.24, x + 0.05)], "brass",
              parent=static, loc=(0, 0, zb), axis="X", segs=64)
    # smokebox, its door, and the chimney
    lathe("smokebox", [(0.0, 6.15), (1.36, 6.15), (1.38, 6.2), (1.38, 8.05), (1.4, 8.1), (1.4, 8.2), (0.0, 8.2)],
          "iron", parent=static, loc=(0, 0, zb - 0.02), axis="X", segs=64)
    lathe("smokebox_door", [(0.0, 8.42), (0.5, 8.4), (0.95, 8.33), (1.22, 8.24), (1.26, 8.2), (0.0, 8.2)], "iron",
          parent=static, loc=(0, 0, zb - 0.02), axis="X", segs=64)
    lathe("door_handle", [(0.0, 8.42), (0.08, 8.42), (0.08, 8.6), (0.13, 8.64), (0.0, 8.66)], "brass", parent=static,
          loc=(0, 0, zb - 0.02), axis="X", segs=20)
    lathe("chimney", [(0.0, 0.0), (0.46, 0.0), (0.4, 0.3), (0.36, 0.9), (0.38, 1.25), (0.5, 1.4), (0.5, 1.48),
                      (0.3, 1.48), (0.3, 0.2), (0.0, 0.2)], "iron", parent=static, loc=(7.35, 0, zb + 1.1), axis="Z",
          segs=48)
    lathe("chimney_cap", [(0.36, 1.2), (0.52, 1.36), (0.54, 1.5), (0.44, 1.52), (0.38, 1.4)], "copper", parent=static,
          loc=(7.35, 0, zb + 1.1), axis="Z", segs=48)
    # dome and safety valve in polished brass
    lathe("dome", [(0.0, 0.0), (0.62, 0.0), (0.56, 0.18), (0.5, 0.45), (0.42, 0.62), (0.26, 0.74), (0.0, 0.78)],
          "brass", parent=static, loc=(2.3, 0, zb + 1.08), axis="Z", segs=56)
    lathe("safety_valve", [(0.0, 0.0), (0.34, 0.0), (0.3, 0.2), (0.22, 0.36), (0.26, 0.5), (0.18, 0.62), (0.0, 0.64)],
          "brass", parent=static, loc=(-1.9, 0, zb + 1.12), axis="Z", segs=40)
    lathe("whistle", [(0.0, 0.0), (0.06, 0.0), (0.06, 0.25), (0.12, 0.3), (0.12, 0.62), (0.07, 0.66), (0.0, 0.7)],
          "brass", parent=static, loc=(-2.8, 0, zb + 1.12), axis="Z", segs=24)
    # handrail along the boiler, on stanchions
    for sd in (-1, 1):
        rail_pts = [(x, sd * 1.42, zb + 0.35) for x in (-3.1, 8.0)]
        tube_along(f"handrail_{'L' if sd < 0 else 'R'}", rail_pts, 0.028, "steel", parent=static)
        for x in (-2.4, 0.4, 3.4, 6.6):
            rod(f"stanchion_{int(x * 10)}_{sd}", (x, sd * 1.24, zb + 0.3), (x, sd * 1.42, zb + 0.35), 0.022, "steel",
                parent=static, segs=10)

    # ---------------------------------------------------------------- firebox and cab
    boxes("firebox", [((-4.25, 0, 3.55), (1.9, 2.3, 2.2))], "enamel", parent=static)
    for sd in (-1, 1):
        tag = "L" if sd < 0 else "R"
        cab = [(-7.0, 2.45), (-4.3, 2.45), (-4.3, 5.35), (-4.6, 5.7), (-7.0, 5.7)]
        window = [(-6.55, 4.05), (-4.8, 4.05), (-4.8, 5.1), (-6.55, 5.1)]
        opening = [(-6.9, 2.7), (-6.35, 2.7), (-6.35, 4.6), (-6.9, 4.6)]
        flat(f"cab_{tag}", [cab, window[::-1], opening[::-1]], 0.07, "enamel", parent=static,
             loc=(0, sd * 1.42, 0), bevel=0.012)
        flat(f"cabbead_{tag}", [band([(-6.5, 4.0), (-4.75, 4.0)], 0.05)], 0.08, "brass", parent=static,
             loc=(0, sd * 1.43, 0), bevel=0.005)
    boxes("cab_front", [((-4.32, 0, 4.9), (0.08, 2.9, 1.6))], "enamel", parent=static)
    lathe("cab_roof", [(1.62, -7.25), (1.66, -7.25), (1.66, -4.2), (1.62, -4.2)], "enamel", parent=static,
          loc=(0, 0, 4.1), axis="X", segs=64)
    # the roof lathe is a full tube; keep only its crown with a boolean-free trick:
    # squash it into a shallow arch
    roof = bpy.data.objects["cab_roof"]
    roof.scale = (1.0, 1.0, 0.22)
    roof.location.z = 5.35

    # ---------------------------------------------------------------- track
    rail = [(-0.075, 0.0), (0.075, 0.0), (0.075, 0.018), (0.018, 0.04), (0.018, 0.13), (0.04, 0.15), (0.04, 0.2),
            (-0.04, 0.2), (-0.04, 0.15), (-0.018, 0.13), (-0.018, 0.04), (-0.075, 0.018)]
    for sd in (-1, 1):
        r_ob = flat(f"rail_{'L' if sd < 0 else 'R'}", [rail], 30.0, "steel", parent=static, bevel=0.004,
                    smooth_angle=30)
        r_ob.rotation_euler = (0, 0, math.radians(90))
        r_ob.location = (0, sd * Y_WHEEL, -0.2)
    # the sleepers slide past under the engine as its wheels turn
    track = empty("track", (0, 0, 0), root, role="track", spacing=0.72)
    sleepers = [((x, 0, -0.29), (0.34, 2.7, 0.18)) for x in [-14.4 + k * 0.72 for k in range(41)]]
    boxes("sleepers", sleepers, "wood", parent=track)
    return root


PREVIEW = dict(cam_loc=(12, -13, 0.5), target=(1.5, 0, -1.0), lens=34)
