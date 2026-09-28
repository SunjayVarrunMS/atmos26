"""Chamber 3, 1950s: the circuit board that grew into a skyline.

A soldermasked board lying flat across the shaft with a plated ring at its
centre that every trace runs into. Chip packages stand on it as towers,
tallest near the aperture, down to discrete parts at the edges. Copper traces
leave every package in parallel buses with 45-degree bends, as a router would
lay them. The trace centrelines ride on the root's extras so the site can send
signal pulses along them.

Board lies in the XY plane (Blender Z is up, the web's Y).
"""
import math
import random

import bmesh
from mathutils import Vector

from common import arc, band, circle, empty, flat, lathe, mesh_obj

random.seed(1950)
JOIN_STATIC = True   # hundreds of small parts: ship them as one mesh per material

BOARD_Z = -3.0     # board top surface
T = 0.16           # board thickness
HALF = 9.0         # board half-size
APERTURE = 2.5


def slab(name, outline, z0, h, mat, parent=None, bevel=0.01):
    """Extrude a closed XY outline (plus holes) upward from z0 by h."""
    flipped = [[(x, -y) for (x, y) in o] for o in outline]
    ob = flat(name, flipped, h, mat, parent=parent, bevel=min(bevel, h * 0.45))
    ob.rotation_euler = (math.radians(90), 0, 0)
    ob.location = (0, 0, z0 + h / 2)
    return ob


def rect(cx, cy, w, d, r=0.0, n=4):
    if r <= 0:
        return [(cx - w / 2, cy - d / 2), (cx + w / 2, cy - d / 2), (cx + w / 2, cy + d / 2), (cx - w / 2, cy + d / 2)]
    pts = []
    for (qx, qy, a0) in ((cx + w / 2 - r, cy - d / 2 + r, 270), (cx + w / 2 - r, cy + d / 2 - r, 0),
                         (cx - w / 2 + r, cy + d / 2 - r, 90), (cx - w / 2 + r, cy - d / 2 + r, 180)):
        pts += arc(r, math.radians(a0), math.radians(a0 + 90), n, qx, qy)
    return pts


def boxes(name, specs, mat, parent=None):
    bm = bmesh.new()
    for c, s in specs:
        r = bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector(s), verts=r["verts"])
        bmesh.ops.translate(bm, vec=Vector(c), verts=r["verts"])
    return mesh_obj(name, bm, mat, parent, smooth_angle=30)


class Board:
    def __init__(self, parent):
        self.parent = parent
        self.traces = []       # centrelines, lists of (x, y)
        self.pads = []         # (x, y, size)
        self.vias = []         # (x, y)
        self.silk = []         # outlines
        self.leads = []        # box specs, solder-coloured steel
        self.keepout = []      # component footprints (x0, y0, x1, y1)
        self.n = 0

    def name(self, kind):
        self.n += 1
        return f"{kind}_{self.n}"

    def free(self, x0, y0, x1, y1, pad=0.25):
        if max(abs(x0), abs(x1), abs(y0), abs(y1)) > HALF - 0.4:
            return False
        # stay clear of the aperture ring
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        corner = min(math.hypot(x, y) for x in (x0, x1, cx) for y in (y0, y1, cy))
        if corner < APERTURE + 0.9:
            return False
        for (a0, b0, a1, b1) in self.keepout:
            if x0 - pad < a1 and x1 + pad > a0 and y0 - pad < b1 and y1 + pad > b0:
                return False
        return True

    def claim(self, x0, y0, x1, y1):
        self.keepout.append((x0, y0, x1, y1))

    # ---------------------------------------------------------------- packages
    def quad(self, cx, cy, w, h, pins, tall=False):
        """A quad flat package; tall ones read as towers in the skyline."""
        body = self.name("chip")
        r = min(w, 1.0) * 0.06
        slab(body, [rect(cx, cy, w, w, r, 3)], BOARD_Z + 0.06, h, "epoxy", self.parent, bevel=0.03)
        # pin-one dimple and a faint lid step on the tall ones
        if tall:
            slab(body + "_lid", [rect(cx, cy, w * 0.82, w * 0.82, r, 3)], BOARD_Z + 0.06 + h, 0.05, "epoxy",
                 self.parent, bevel=0.015)
            # a heat-spreader cap in brass on the tallest
            if h > 3.2:
                slab(body + "_cap", [rect(cx, cy, w * 0.56, w * 0.56, 0.05, 3)], BOARD_Z + 0.11 + h, 0.12, "brass",
                     self.parent, bevel=0.02)
        pitch = w / (pins + 1)
        for side in range(4):
            for k in range(pins):
                o = -w / 2 + pitch * (k + 1)
                if side == 0:
                    px, py, dx, dy = cx + o, cy - w / 2, 0, -1
                elif side == 1:
                    px, py, dx, dy = cx + w / 2, cy + o, 1, 0
                elif side == 2:
                    px, py, dx, dy = cx - o, cy + w / 2, 0, 1
                else:
                    px, py, dx, dy = cx - w / 2, cy - o, -1, 0
                lx, ly = px + dx * 0.12, py + dy * 0.12
                sw = (0.05 if dx == 0 else 0.22, 0.22 if dx == 0 else 0.05, 0.05)
                self.leads.append(((lx, ly, BOARD_Z + 0.04), sw))
                self.pads.append((px + dx * 0.2, py + dy * 0.2, 0.09))
                # route every other pin away from the package
                if k % 2 == 0:
                    self.route(px + dx * 0.24, py + dy * 0.24, dx, dy, k, pins)
        self.silk.append(rect(cx, cy, w + 0.5, w + 0.5))
        self.claim(cx - w / 2 - 0.3, cy - w / 2 - 0.3, cx + w / 2 + 0.3, cy + w / 2 + 0.3)

    def dip(self, cx, cy, length, pins, vertical):
        w = 0.62
        L, W = (w, length) if vertical else (length, w)
        body = self.name("dip")
        slab(body, [rect(cx, cy, L, W, 0.06, 3)], BOARD_Z + 0.12, 0.34, "epoxy", self.parent, bevel=0.03)
        # the notch at pin one
        pitch = length / pins
        for k in range(pins):
            o = -length / 2 + pitch * (k + 0.5)
            for sgn in (-1, 1):
                if vertical:
                    px, py, dx, dy = cx + sgn * (w / 2 + 0.06), cy + o, sgn, 0
                    self.leads.append(((cx + sgn * (w / 2 + 0.05), cy + o, BOARD_Z + 0.2), (0.06, 0.08, 0.2)))
                else:
                    px, py, dx, dy = cx + o, cy + sgn * (w / 2 + 0.06), 0, sgn
                    self.leads.append(((cx + o, cy + sgn * (w / 2 + 0.05), BOARD_Z + 0.2), (0.08, 0.06, 0.2)))
                self.pads.append((px + dx * 0.06, py + dy * 0.06, 0.12))
                if k % 2 == 1:
                    self.route(px + dx * 0.14, py + dy * 0.14, dx, dy, k, pins)
        self.silk.append(rect(cx, cy, L + 0.45, W + 0.45))
        self.claim(cx - L / 2 - 0.35, cy - W / 2 - 0.35, cx + L / 2 + 0.35, cy + W / 2 + 0.35)

    def can(self, cx, cy, r, h):
        """Electrolytic capacitor."""
        nm = self.name("cap")
        lathe(nm, [(0.0, 0.0), (r, 0.0), (r, h - 0.08), (r * 0.94, h - 0.05), (r * 0.94, h - 0.02), (r * 0.98, h),
                   (0.0, h)], "sleeve", self.parent, loc=(cx, cy, BOARD_Z), axis="Z", segs=40)
        lathe(nm + "_top", [(0.0, 0.0), (r * 0.9, 0.0), (r * 0.9, 0.02), (0.0, 0.02)], "steel", self.parent,
              loc=(cx, cy, BOARD_Z + h), axis="Z", segs=40)
        self.silk.append(circle(r + 0.14, 40, cx=cx, cy=cy))
        self.claim(cx - r - 0.2, cy - r - 0.2, cx + r + 0.2, cy + r + 0.2)

    def to3(self, cx, cy):
        """A power transistor: a brass can on a diamond flange."""
        nm = self.name("to3")
        diamond = [(cx - 0.75, cy), (cx - 0.3, cy - 0.34), (cx + 0.3, cy - 0.34), (cx + 0.75, cy), (cx + 0.3, cy + 0.34),
                   (cx - 0.3, cy + 0.34)]
        slab(nm, [diamond, circle(0.07, 12, cx=cx - 0.55, cy=cy), circle(0.07, 12, cx=cx + 0.55, cy=cy)],
             BOARD_Z + 0.02, 0.05, "brass", self.parent, bevel=0.01)
        lathe(nm + "_can", [(0.0, 0.0), (0.34, 0.0), (0.34, 0.3), (0.3, 0.36), (0.0, 0.38)], "brass", self.parent,
              loc=(cx, cy, BOARD_Z + 0.07), axis="Z", segs=40)
        self.claim(cx - 0.85, cy - 0.45, cx + 0.85, cy + 0.45)

    def resistor(self, cx, cy, vertical):
        nm = self.name("res")
        L, W = (0.18, 0.42) if vertical else (0.42, 0.18)
        boxes(nm, [((cx, cy, BOARD_Z + 0.07), (L, W, 0.1))], "epoxy", self.parent)
        e = 0.17
        for s in (-1, 1):
            c = (cx, cy + s * e, BOARD_Z + 0.07) if vertical else (cx + s * e, cy, BOARD_Z + 0.07)
            self.leads.append((c, (0.2 if vertical else 0.08, 0.08 if vertical else 0.2, 0.11)))
        self.claim(cx - 0.3, cy - 0.3, cx + 0.3, cy + 0.3)

    # ---------------------------------------------------------------- routing
    def route(self, x, y, dx, dy, k, pins):
        """Out from the pin, a 45-degree jog, then on to the board edge or the
        aperture ring, so buses stay parallel and never cross."""
        out = 0.5 + (k % 5) * 0.12
        pts = [(x, y), (x + dx * out, y + dy * out)]
        cx, cy = pts[-1]
        # decide: towards the centre ring or out to the edge
        toward_centre = (cx * dx + cy * dy) < 0
        if toward_centre:
            # straight in to the plated ring: every package feeds the core,
            # and the runs fan in like spokes
            dist = math.hypot(cx, cy)
            if dist > APERTURE + 0.5:
                s = (APERTURE + 0.3) / dist
                pts.append((cx * s, cy * s))
        else:
            jog = (k - pins / 2) * 0.06
            pts.append((cx + dx * 0.4 + dy * jog, cy + dy * 0.4 + dx * jog))
            ex, ey = pts[-1]
            run = random.uniform(1.4, 4.2)
            pts.append((ex + dx * run, ey + dy * run))
        # clip to the board
        pts = [(max(-HALF + 0.3, min(HALF - 0.3, px)), max(-HALF + 0.3, min(HALF - 0.3, py))) for px, py in pts]
        self.traces.append(pts)
        ex, ey = pts[-1]
        if math.hypot(ex, ey) > APERTURE + 0.6:
            self.vias.append((ex, ey))

    # ---------------------------------------------------------------- build
    def finish(self):
        p = self.parent
        # copper: traces, pads, vias (one mesh each, the site merges anyway)
        z = BOARD_Z
        for i, tr in enumerate(self.traces):
            w = 0.055
            slab(f"trace_{i}", [band(tr, w, w, caps=4)], z, 0.018, "copper", p, bevel=0.0)
        boxes("pads", [((x, y, z + 0.012), (s, s, 0.024)) for (x, y, s) in self.pads], "solder", p)
        for i, (x, y) in enumerate(self.vias):
            slab(f"via_{i}", [circle(0.11, 16, cx=x, cy=y), circle(0.05, 12, cx=x, cy=y)[::-1]], z, 0.02, "copper", p,
                 bevel=0.004)
        if self.leads:
            boxes("leads", self.leads, "solder", p)
        for i, o in enumerate(self.silk):
            closed = o + [o[0]]
            slab(f"silk_{i}", [band(closed, 0.022, 0.022, caps=2)], z, 0.006, "silk", p, bevel=0.0)


def build():
    root = empty("silicon", chamber="silicon")
    b = Board(root)

    # ---------------------------------------------------------------- the board and its aperture
    outline = rect(0, 0, HALF * 2, HALF * 2, 0.4, 5)
    slab("board", [outline, circle(APERTURE, 96)[::-1]], BOARD_Z - T, T - 0.002, "mask", root, bevel=0.02)
    # a fine grid over the top face so the baked occlusion can draw the soft
    # contact shadows under every package (vertex AO needs vertices)
    bm = bmesh.new()
    step = 0.14
    n = int(2 * (HALF - 0.05) / step)
    verts = {}

    def vert(i, j):
        key = (i, j)
        if key not in verts:
            verts[key] = bm.verts.new((-HALF + 0.05 + i * step, -HALF + 0.05 + j * step, BOARD_Z + 0.0005))
        return verts[key]

    for i in range(n):
        for j in range(n):
            cs = [(-HALF + 0.05 + (i + di) * step, -HALF + 0.05 + (j + dj) * step) for di, dj in ((0, 0), (1, 0), (1, 1), (0, 1))]
            if min(math.hypot(x, y) for x, y in cs) < APERTURE + 0.05:
                continue
            bm.faces.new((vert(i, j), vert(i + 1, j), vert(i + 1, j + 1), vert(i, j + 1)))
    mesh_obj("board_top", bm, "mask", root, smooth_angle=None)
    slab("aperture_ring", [circle(APERTURE + 0.34, 96), circle(APERTURE - 0.02, 96)[::-1]], BOARD_Z - T - 0.01,
         T + 0.035, "copper", root, bevel=0.01)
    # mounting holes, plated, in the corners
    for sx in (-1, 1):
        for sy in (-1, 1):
            slab(f"mount_{sx}{sy}", [circle(0.42, 32, cx=sx * (HALF - 0.8), cy=sy * (HALF - 0.8)),
                                     circle(0.22, 24, cx=sx * (HALF - 0.8), cy=sy * (HALF - 0.8))[::-1]],
                 BOARD_Z - 0.005, 0.025, "copper", root, bevel=0.004)

    # ---------------------------------------------------------------- the skyline: tall packages ringing the aperture
    ring = [
        (0.0, 4.2, 2.2, 5.6), (3.9, 2.6, 1.7, 3.8), (4.3, -1.6, 1.9, 4.4), (1.6, -4.4, 1.5, 2.9),
        (-2.4, -3.9, 1.8, 3.4), (-4.5, -0.4, 2.0, 4.9), (-3.4, 3.2, 1.4, 2.6),
    ]
    for (x, y, w, h) in ring:
        b.quad(x, y, w, h, pins=max(6, int(w * 6)), tall=True)
    # a second, lower ring
    placed = 0
    tries = 0
    while placed < 16 and tries < 900:
        tries += 1
        a = random.uniform(0, math.tau)
        rr = random.uniform(5.6, 7.9)
        x, y = math.cos(a) * rr, math.sin(a) * rr
        w = random.uniform(0.8, 1.4)
        if b.free(x - w / 2 - 0.3, y - w / 2 - 0.3, x + w / 2 + 0.3, y + w / 2 + 0.3):
            b.quad(x, y, w, random.uniform(0.3, 1.4), pins=int(w * 5))
            placed += 1
    # DIP packages, the era's own, in the gaps
    placed = 0
    tries = 0
    while placed < 10 and tries < 900:
        tries += 1
        x, y = random.uniform(-7.8, 7.8), random.uniform(-7.8, 7.8)
        n = random.choice((7, 8, 10, 12))
        L = n * 0.2
        vertical = random.random() < 0.5
        Lx, Ly = (0.62, L) if vertical else (L, 0.62)
        if b.free(x - Lx / 2 - 0.4, y - Ly / 2 - 0.4, x + Lx / 2 + 0.4, y + Ly / 2 + 0.4):
            b.dip(x, y, L, n, vertical)
            placed += 1
    # capacitor cans and power transistors
    for (kind, count) in (("can", 9), ("to3", 4)):
        placed = 0
        tries = 0
        while placed < count and tries < 800:
            tries += 1
            x, y = random.uniform(-8.2, 8.2), random.uniform(-8.2, 8.2)
            if kind == "can":
                r = random.uniform(0.28, 0.5)
                if b.free(x - r - 0.2, y - r - 0.2, x + r + 0.2, y + r + 0.2):
                    b.can(x, y, r, random.uniform(0.8, 1.9))
                    placed += 1
            else:
                if b.free(x - 0.9, y - 0.5, x + 0.9, y + 0.5):
                    b.to3(x, y)
                    placed += 1
    # small passives scattered along the buses
    placed = 0
    tries = 0
    while placed < 60 and tries < 3000:
        tries += 1
        x, y = random.uniform(-8.4, 8.4), random.uniform(-8.4, 8.4)
        if b.free(x - 0.3, y - 0.3, x + 0.3, y + 0.3, pad=0.12):
            b.resistor(x, y, random.random() < 0.5)
            placed += 1

    b.finish()

    # traces for the site's signal pulses: flat xyz list + per-trace counts
    flat_pts, counts = [], []
    for tr in b.traces:
        counts.append(len(tr))
        for (x, y) in tr:
            flat_pts += [x, y, BOARD_Z + 0.03]
    root["tracePts"] = flat_pts
    root["traceCounts"] = counts
    return root


PREVIEW = dict(cam_loc=(0.3, -0.4, 14.0), target=(0.0, 0.0, -3.0), lens=26)
