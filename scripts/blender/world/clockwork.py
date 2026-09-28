"""Chamber 1, 1700s: a tower-clock movement.

A real going train, sized so the numbers work: the escape wheel (30 teeth)
turns once a minute, the third wheel once every eight, the centre wheel once
an hour, the great wheel once every eight hours. The web drives every arbor
from the escape wheel's angle (`ratio`, `dir`), steps it once a second and
swings the pendulum in time with the site's live countdown.

Layout is drawn in the XZ plane (Z up, camera looking along +Y). Wheels on
neighbouring arbors sit in different depth planes so they overlap cleanly.
The cast-iron frame is a pointed arch whose straps follow the train.
"""
import math

from common import (arc, band, catmull, circle, clock_teeth, crossings, empty, escape_teeth, flat, lathe, rod,
                    stadium, tube_along)

# depth planes (Y): back frame, the wheel planes, front bridges, pendulum
Y_BACK = 0.62
Y_W0 = 0.0      # great wheel, centre pinion
Y_W1 = -0.17    # centre wheel, escape wheel, anchor
Y_W2 = -0.34    # third wheel
Y_FRONT = -0.58
Y_PEND = -0.86

# arbor centres in the XZ plane
G = (0.0, 0.0)
C = (G[0] + 2.43 * math.cos(math.radians(118)), G[1] + 2.43 * math.sin(math.radians(118)))
T = (C[0] + 1.36 * math.cos(math.radians(50)), C[1] + 1.36 * math.sin(math.radians(50)))
E = (T[0] + 1.08 * math.cos(math.radians(20)), T[1] + 1.08 * math.sin(math.radians(20)))
A = (E[0], E[1] + 1.05)
P = (A[0], A[1] + 0.62)          # pendulum suspension
BOB_Z = -3.55

# frame: straight sides, pointed arch on top
X0, X1, Z0, ZS = -3.0, 2.7, -2.8, 4.35
XM = (X0 + X1) / 2


def wheel(name, parent, n, module, y, thick, spokes, spoke_w, curve=0.0, rim=0.13, hub=0.2, mat="brass"):
    r = module * n / 2
    teeth, rf = clock_teeth(n, r)
    r_in = rf - rim
    wins = crossings(r_in, hub + 0.05, spokes, spoke_w, rot=math.radians(90 / spokes), curve=curve, fillet_it=2)
    ob = flat(name, [teeth, *wins, circle(0.045, 24)], thick, mat, parent=parent, loc=(0, y, 0), bevel=0.012)
    # hub collar, turned
    lathe(name + "_collar", [(0.045, -0.07), (hub * 0.62, -0.07), (hub * 0.7, -0.045), (hub * 0.7, 0.0),
                             (hub * 0.52, 0.03), (0.045, 0.03)], "brass", parent=parent, loc=(0, y - thick / 2, 0), segs=40)
    return ob, r


def pinion(name, parent, n, module, y, length):
    r = module * n / 2
    teeth, _ = clock_teeth(n, r, width=0.42, tip=0.9, steps=6)
    return flat(name, [teeth, circle(0.045, 20)], length, "steel", parent=parent, loc=(0, y, 0), bevel=0.008)


def arbor(name, parent, y0, y1, r=0.045):
    # a turned steel rod with pivots at both ends
    prof = [(0.0, y0 - 0.06), (r * 0.5, y0 - 0.06), (r * 0.5, y0), (r, y0 + 0.03), (r, y1 - 0.03), (r * 0.5, y1),
            (r * 0.5, y1 + 0.06), (0.0, y1 + 0.06)]
    return lathe(name, prof, "steel", parent=parent, segs=24)


def ratchet(n, r, depth=0.1):
    pts = []
    for i in range(n):
        a = i / n * 2 * math.pi
        b = (i + 1) / n * 2 * math.pi
        pts.append(((r - depth) * math.cos(a), (r - depth) * math.sin(a)))
        pts.append((r * math.cos(b - 0.02), r * math.sin(b - 0.02)))
    return pts


def gothic(x0, x1, z0, zs, rr=0.62, corner=0.3, n=36):
    """Pointed-arch outline: rounded bottom corners, straight sides, two arcs
    meeting at the apex."""
    w = x1 - x0
    r = rr * w
    th = math.acos((w / 2 - r) / r)
    pts = arc(corner, math.radians(180), math.radians(270), 8, x0 + corner, z0 + corner)
    pts += arc(corner, math.radians(270), math.radians(360), 8, x1 - corner, z0 + corner)
    # right side up, then the right-hand arc (centred left of the midline)
    pts += arc(r, 0, math.pi - th, n, x1 - r, zs)
    # left-hand arc from the apex down to the left spring point
    pts += arc(r, th, math.pi, n, x0 + r, zs)[1:]
    return pts


def build():
    root = empty("clockwork", chamber="clockwork")

    # ---------------------------------------------------------------- escape arbor (the clock's heartbeat)
    esc = empty("arbor_escape", (E[0], 0, E[1]), root, role="arbor", ratio=1.0, dir=1, teeth=30)
    teeth, _ = escape_teeth(30, 0.72)
    wins = crossings(0.5, 0.14, 4, 0.07, curve=0.0, fillet_it=2)
    flat("escape_wheel", [teeth, *wins, circle(0.04, 20)], 0.05, "brass", parent=esc, loc=(0, Y_W1, 0), bevel=0.008)
    pinion("escape_pinion", esc, 8, 0.03, Y_W2, 0.14)
    arbor("escape_arbor", esc, Y_FRONT, Y_BACK)

    # ---------------------------------------------------------------- third arbor
    third = empty("arbor_third", (T[0], 0, T[1]), root, role="arbor", ratio=8 / 64, dir=-1, teeth=64)
    wheel("third_wheel", third, 64, 0.03, Y_W2, 0.06, 4, 0.08, curve=0.05, rim=0.1, hub=0.16)
    pinion("third_pinion", third, 8, 0.04, Y_W1, 0.16)
    arbor("third_arbor", third, Y_FRONT, Y_BACK)

    # ---------------------------------------------------------------- centre arbor (turns once an hour)
    centre = empty("arbor_centre", (C[0], 0, C[1]), root, role="arbor", ratio=8 / 64 * 8 / 60, dir=1, teeth=60)
    wheel("centre_wheel", centre, 60, 0.04, Y_W1, 0.07, 5, 0.1, curve=0.06, rim=0.12, hub=0.2)
    pinion("centre_pinion", centre, 12, 0.045, Y_W0, 0.2)
    arbor("centre_arbor", centre, Y_FRONT, Y_BACK, r=0.055)

    # ---------------------------------------------------------------- great wheel + winding barrel
    great = empty("arbor_great", (G[0], 0, G[1]), root, role="arbor", ratio=8 / 64 * 8 / 60 * 12 / 96, dir=-1, teeth=96)
    wheel("great_wheel", great, 96, 0.045, Y_W0, 0.09, 6, 0.14, curve=0.08, rim=0.17, hub=0.3)
    # the barrel sits in front of the wheel so its rope reads
    by0, by1 = -0.1, -0.5
    lathe("barrel", [(0.07, by0), (1.02, by0), (1.02, by0 - 0.035), (0.88, by0 - 0.055), (0.88, by1 + 0.055),
                     (1.02, by1 + 0.035), (1.02, by1), (0.07, by1)], "brass_dark", parent=great, segs=72)
    flat("ratchet", [ratchet(28, 0.78), circle(0.08, 24)], 0.05, "steel", parent=great, loc=(0, by1 - 0.03, 0),
         bevel=0.006)
    # rope wound on the barrel (a helix), then falling to the weight
    turns, rr = 5.0, 0.915
    helix = []
    steps = int(turns * 48)
    for i in range(steps + 1):
        a = -math.pi / 2 + i / 48 * 2 * math.pi
        y = by0 - 0.08 - (by0 - by1 - 0.16) * i / steps
        helix.append((rr * math.cos(a), y, rr * math.sin(a)))
    tube_along("rope_wound", helix, 0.03, "rope", parent=great, segs=8)
    arbor("great_arbor", great, Y_FRONT - 0.12, Y_BACK, r=0.07)

    # the falling rope and its weight belong to the frame (they do not turn)
    last = helix[-1]
    drop_x = G[0] + rr
    tube_along("rope_drop", [(drop_x, last[1], G[1]), (drop_x, last[1], -6.6)], 0.03, "rope", parent=root)
    lathe("weight", [(0.0, -0.05), (0.06, -0.05), (0.06, 0.0), (0.34, 0.08), (0.36, 0.2), (0.36, 1.35), (0.34, 1.45),
                     (0.08, 1.52), (0.0, 1.52)], "iron", parent=root, loc=(drop_x, last[1], -8.12), axis="Z", segs=48)

    # ---------------------------------------------------------------- anchor and pendulum
    anchor = empty("anchor", (A[0], 0, A[1]), root, role="anchor", amp=0.075)
    r_band = 0.64
    a1, a2 = math.radians(-138), math.radians(-42)
    band_pts = arc(r_band + 0.06, a1, a2, 40) + arc(r_band - 0.06, a2, a1, 40)
    flat("anchor_band", [band_pts], 0.05, "steel", parent=anchor, loc=(0, Y_W1, 0), bevel=0.008)
    for side, a in (("L", a1), ("R", a2)):
        px, pz = (r_band - 0.02) * math.cos(a), (r_band - 0.02) * math.sin(a)
        k = 0.35 if side == "L" else -0.35
        ex, ez = px + 0.16 * math.cos(a + k), pz + 0.16 * math.sin(a + k)
        flat(f"anchor_pallet_{side}", [stadium(px, pz, ex, ez, 0.075, 10)], 0.055, "steel", parent=anchor,
             loc=(0, Y_W1, 0), bevel=0.008)
    flat("anchor_hub", [circle(0.13, 32), circle(0.045, 20)], 0.07, "steel", parent=anchor, loc=(0, Y_W1, 0))
    arbor("anchor_arbor", anchor, Y_PEND + 0.02, Y_BACK)
    # crutch: from the anchor arbor down to the pendulum rod, with a fork
    rod("crutch", (0, Y_PEND + 0.06, 0), (0, Y_PEND + 0.06, -1.25), 0.022, "steel", parent=anchor)
    flat("crutch_fork", [stadium(-0.09, -1.25, 0.09, -1.25, 0.07, 8)], 0.05, "steel", parent=anchor,
         loc=(0, Y_PEND + 0.06, 0))

    L = P[1] - BOB_Z
    pend = empty("pendulum", (P[0], 0, P[1]), root, role="pendulum", amp=0.055, length=L)
    rod("pendulum_rod", (0, Y_PEND, -0.1), (0, Y_PEND, -L + 0.3), 0.026, "steel", parent=pend)
    flat("suspension_spring", [stadium(0, 0.02, 0, -0.16, 0.08, 8)], 0.012, "steel", parent=pend, loc=(0, Y_PEND, 0),
         bevel=0.003)
    lathe("bob", [(0.0, -0.13), (0.22, -0.118), (0.42, -0.085), (0.56, -0.035), (0.6, 0.0), (0.56, 0.035),
                  (0.42, 0.085), (0.22, 0.118), (0.0, 0.13)], "brass", parent=pend, loc=(0, Y_PEND, -L), segs=64)
    lathe("rating_nut", [(0.0, -0.06), (0.06, -0.06), (0.07, -0.04), (0.07, 0.04), (0.06, 0.06), (0.0, 0.06)], "brass",
          parent=pend, loc=(0, Y_PEND, -L - 0.72), axis="Z", segs=24)
    rod("pendulum_tail", (0, Y_PEND, -L - 0.13), (0, Y_PEND, -L - 0.66), 0.016, "steel", parent=pend)

    # ---------------------------------------------------------------- frame (cast iron)
    frame = empty("frame", (0, 0, 0), root, role="static")
    t = 0.26
    outer = gothic(X0, X1, Z0, ZS)
    inner = gothic(X0 + t, X1 - t, Z0 + t, ZS, corner=0.12)
    flat("frame_back", [outer, inner[::-1]], 0.16, "iron", parent=frame, loc=(0, Y_BACK + 0.06, 0), bevel=0.025)
    apex_z = max(p[1] for p in inner)
    # straps follow the train: two legs from the feet to the great arbor, then
    # up through every arbor to the apex
    straps = [
        [(X0 + 0.25, Z0 + 0.25), (-1.3, -1.6), G],
        [(X1 - 0.25, Z0 + 0.25), (1.3, -1.6), G],
        [G, (-0.8, 1.2), C],
        [C, (-0.8, 2.8), T],
        [T, (0.25, 3.5), E],
        [E, A],
        [A, (XM + 0.4, apex_z - 0.8), (XM, apex_z)],
        [C, (X0 + 0.9, 2.2), (X0 + 0.15, 2.0)],
        [E, (X1 - 0.8, 3.4), (X1 - 0.15, 3.3)],
    ]
    for i, s in enumerate(straps):
        path = catmull(s, 14)
        flat(f"frame_strap_{i}", [band(path, 0.24, 0.17)], 0.1, "iron", parent=frame, loc=(0, Y_BACK, 0),
             bevel=0.018)
    for nm, p, r in (("g", G, 0.3), ("c", C, 0.22), ("t", T, 0.2), ("e", E, 0.18), ("a", A, 0.17)):
        lathe(f"boss_{nm}", [(0.06, 0.09), (r, 0.09), (r + 0.03, 0.06), (r + 0.03, -0.06), (r * 0.8, -0.1), (0.06, -0.1)],
              "iron", parent=frame, loc=(p[0], Y_BACK - 0.02, p[1]), segs=40)

    # one curved front bridge through the front pivots of the centre, third and
    # escape arbors, and a separate cock for the great arbor
    bridge_path = catmull([(X0 + 0.2, 1.25), C, T, E, (X1 - 0.2, 4.05)], 16)
    flat("bridge_front", [band(bridge_path, 0.17, 0.12)], 0.08, "iron", parent=frame, loc=(0, Y_FRONT - 0.02, 0),
         bevel=0.016)
    cock_path = catmull([G, (1.2, -1.2), (X1 - 0.2, -1.9)], 12)
    flat("cock_great", [band(cock_path, 0.2, 0.14)], 0.09, "iron", parent=frame, loc=(0, Y_FRONT - 0.14, 0),
         bevel=0.016)
    for nm, p, y in (("g", G, Y_FRONT - 0.14), ("c", C, Y_FRONT - 0.02), ("t", T, Y_FRONT - 0.02),
                     ("e", E, Y_FRONT - 0.02)):
        lathe(f"bushing_{nm}", [(0.05, -0.08), (0.13, -0.08), (0.15, -0.055), (0.15, 0.05), (0.05, 0.05)], "brass",
              parent=frame, loc=(p[0], y, p[1]), segs=32)
    # turned pillars carry the bridges back to the frame
    for k, (px, pz, yf) in enumerate(((X0 + 0.2, 1.25, Y_FRONT), (X1 - 0.2, 4.05, Y_FRONT),
                                      (X1 - 0.2, -1.9, Y_FRONT - 0.12))):
        mid = (yf + Y_BACK) / 2
        prof = [(0.0, yf), (0.13, yf), (0.13, yf + 0.06), (0.08, yf + 0.12), (0.07, mid - 0.2), (0.1, mid),
                (0.07, mid + 0.2), (0.08, Y_BACK - 0.12), (0.13, Y_BACK - 0.06), (0.13, Y_BACK), (0.0, Y_BACK)]
        lathe(f"pillar_{k}", prof, "brass_dark", parent=frame, loc=(px, 0, pz), segs=32)
    # pendulum suspension bracket, standing off the back frame at the top
    flat("suspension_bracket", [stadium(P[0] - 0.45, P[1] + 0.12, P[0] + 0.45, P[1] + 0.12, 0.2, 10)], 0.12, "iron",
         parent=frame, loc=(0, Y_PEND, 0), bevel=0.015)
    rod("suspension_post", (P[0] - 0.45, Y_PEND, P[1] + 0.12), (P[0] - 0.45, Y_BACK, P[1] + 0.12), 0.06, "iron",
        parent=frame)
    return root


PREVIEW = dict(cam_loc=(-4.5, -7.5, 4.6), target=(0.0, 0, 2.6), lens=45)
