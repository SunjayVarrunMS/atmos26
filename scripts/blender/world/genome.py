"""Chamber 4, 2000s: the genome, as a machinist would build it.

After the 1953 double-helix model: cut metal plates clamped to a lab stand.
Bases are flat rings in the shapes chemists draw them (purines a hexagon
fused to a pentagon, pyrimidines a single hexagon), paired A-T with two
hydrogen-bond rods and G-C with three. The backbone is a steel wire through
tilted sugar plates and brass phosphate balls; the second strand runs 144
degrees round from the first, so the minor and major grooves are right.

The sequence spells ATMOS'26 in two bits per base, bottom to top.

The web turns the whole helix slowly and, now and then, lifts one base pair,
turns it over and sets it back: the code rewritten.
"""
import math

from common import circle, empty, flat, lathe, rod, tube_along

RISE = 0.44        # height per base pair
TWIST = 36.0       # degrees per base pair (ten per turn)
R = 2.35           # backbone radius
GROOVE = 144.0     # second strand's angular offset
SIDE = 0.4         # ring side length


def sequence():
    bits = "".join(f"{b:08b}" for b in "ATMOS'26".encode())
    bases = "ACGT"
    return [bases[int(bits[i:i + 2], 2)] for i in range(0, len(bits), 2)]


def polygon(n, side, rot=0.0):
    r = side / (2 * math.sin(math.pi / n))
    return [(r * math.cos(rot + i * 2 * math.pi / n), r * math.sin(rot + i * 2 * math.pi / n)) for i in range(n)], r


def ring_plate(name, n, centre, angle, z, mat, parent, thick=0.05, width=0.07):
    """A flat polygon ring lying horizontal at height z."""
    outer, r = polygon(n, SIDE, angle)
    inner, _ = polygon(n, SIDE * (1 - 2 * width / (SIDE * 0.9)), angle)
    cx, cy = centre
    o = [(cx + x, -(cy + y)) for x, y in outer]
    i = [(cx + x, -(cy + y)) for x, y in inner][::-1]
    ob = flat(name, [o, i], thick, mat, parent=parent, bevel=0.01)
    ob.rotation_euler = (math.radians(90), 0, 0)
    ob.location = (0, 0, z)
    return r


def build():
    root = empty("genome", chamber="genome")
    seq = sequence()
    n = len(seq)
    z0 = -RISE * (n - 1) / 2

    # ---------------------------------------------------------------- the stand
    stand = empty("stand", (0, 0, 0), root, role="static")
    base_z = z0 - 1.25
    lathe("stand_base", [(0.0, 0.0), (1.35, 0.0), (1.4, 0.05), (1.38, 0.14), (1.0, 0.22), (0.3, 0.3), (0.2, 0.42),
                         (0.0, 0.42)], "iron", parent=stand, loc=(0, 0, base_z), axis="Z", segs=64)
    top_z = z0 + RISE * (n - 1) + 1.1
    rod("stand_rod", (0, 0, base_z + 0.3), (0, 0, top_z), 0.085, "steel", parent=stand, segs=24)
    lathe("stand_knob", [(0.0, 0.0), (0.14, 0.0), (0.16, 0.06), (0.12, 0.16), (0.0, 0.2)], "brass", parent=stand,
          loc=(0, 0, top_z), axis="Z", segs=24)

    # ---------------------------------------------------------------- the helix
    helix = empty("helix", (0, 0, 0), root, role="spin")
    strand = {1: [], 2: []}
    for i, b in enumerate(seq):
        z = z0 + i * RISE
        a1 = math.radians(i * TWIST)
        a2 = a1 + math.radians(GROOVE)
        p1 = (R * math.cos(a1), R * math.sin(a1))
        p2 = (R * math.cos(a2), R * math.sin(a2))
        mid = ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)
        chord = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
        L = math.hypot(p2[0] - p1[0], p2[1] - p1[1])

        # each pair turns on its own axis when it is rewritten
        # one pair in five can be rewritten; the rest ride with the helix
        pair = empty(f"pair_{i}", (mid[0], mid[1], z), helix, role="pair" if i % 5 == 2 else "static", index=i, base=b)
        ux, uy = math.cos(chord), math.sin(chord)
        purine_first = b in "AG"
        partner = {"A": "T", "T": "A", "G": "C", "C": "G"}[b]
        # local chord coordinates: -L/2 at strand 1, +L/2 at strand 2
        def at(s):
            return (ux * s, uy * s)

        _, r6 = polygon(6, SIDE)
        gap = 0.2
        if purine_first:
            # purine from strand 1: hexagon fused to a pentagon on its outer side
            c6 = at(-gap / 2 - r6)
            ring_plate(f"pair_{i}_hex_a", 6, c6, chord, 0, "brass", pair)
            c5 = at(-gap / 2 - 2 * r6 - 0.28)
            ring_plate(f"pair_{i}_pent_a", 5, c5, chord + math.pi, 0, "brass", pair)
            c6b = at(gap / 2 + r6)
            ring_plate(f"pair_{i}_hex_b", 6, c6b, chord, 0, "brass_dark", pair)
        else:
            c6 = at(-gap / 2 - r6)
            ring_plate(f"pair_{i}_hex_a", 6, c6, chord, 0, "brass_dark", pair)
            c6b = at(gap / 2 + r6)
            ring_plate(f"pair_{i}_hex_b", 6, c6b, chord, 0, "brass", pair)
            c5 = at(gap / 2 + 2 * r6 + 0.28)
            ring_plate(f"pair_{i}_pent_b", 5, c5, chord, 0, "brass", pair)
        # hydrogen bonds across the gap: two for A-T, three for G-C
        bonds = 3 if b in "GC" else 2
        for k in range(bonds):
            off = (k - (bonds - 1) / 2) * 0.17
            nx, ny = -uy * off, ux * off
            rod(f"pair_{i}_bond_{k}", (nx - ux * gap * 0.55, ny - uy * gap * 0.55, 0),
                (nx + ux * gap * 0.55, ny + uy * gap * 0.55, 0), 0.016, "steel", parent=pair, segs=8)
        # arms from each base out to its sugar
        for sgn, p in ((-1, p1), (1, p2)):
            inner = at(sgn * 0.85)
            outer = at(sgn * (L / 2 - 0.16))
            rod(f"pair_{i}_arm_{sgn}", (inner[0], inner[1], 0), (outer[0], outer[1], 0), 0.02, "steel", parent=pair,
                segs=8)

        # sugars: pentagon plates standing tangent to the helix
        for s_id, a in ((1, a1), (2, a2)):
            sx, sy = R * math.cos(a), R * math.sin(a)
            outer, _ = polygon(5, 0.32, math.pi / 2)
            inner, _ = polygon(5, 0.17, math.pi / 2)
            sug = flat(f"sugar_{s_id}_{i}", [outer, inner[::-1]], 0.045, "steel", parent=helix, bevel=0.008)
            sug.location = (sx, sy, z)
            sug.rotation_euler = (0, 0, a + math.pi / 2)
            strand[s_id].append((sx, sy, z))
            # the phosphate between this sugar and the next, a brass ball
            ap = a + math.radians(TWIST / 2)
            phx, phy, phz = (R + 0.16) * math.cos(ap), (R + 0.16) * math.sin(ap), z + RISE / 2
            if i < n - 1:
                lathe(f"phosphate_{s_id}_{i}", [(0.0, -0.14), (0.1, -0.12), (0.14, -0.07), (0.15, 0.0), (0.14, 0.07),
                                                (0.1, 0.12), (0.0, 0.14)], "brass", parent=helix,
                      loc=(phx, phy, phz), axis="Z", segs=16)
                strand[s_id].append((phx, phy, phz))

        # the clamp holding the pair to the stand rod
        cl = empty(f"clamp_{i}", (0, 0, z), helix, role="static")
        lathe(f"clamp_{i}_collar", [(0.09, -0.06), (0.15, -0.06), (0.16, -0.04), (0.16, 0.04), (0.15, 0.06),
                                    (0.09, 0.06)], "iron", parent=cl, axis="Z", segs=20)
        rod(f"clamp_{i}_arm", (0.0, 0.0, 0.0), (mid[0], mid[1], 0.0), 0.022, "iron", parent=cl, segs=8)

    # the backbone wires, smoothed along each strand
    for s_id, pts in strand.items():
        smooth = []
        for k in range(len(pts) - 1):
            a, b = pts[k], pts[k + 1]
            for t in range(6):
                f = t / 6
                ang_a, ang_b = math.atan2(a[1], a[0]), math.atan2(b[1], b[0])
                d = (ang_b - ang_a + math.pi) % (2 * math.pi) - math.pi
                ang = ang_a + d * f
                rr = math.hypot(a[0], a[1]) * (1 - f) + math.hypot(b[0], b[1]) * f
                smooth.append((rr * math.cos(ang), rr * math.sin(ang), a[2] + (b[2] - a[2]) * f))
        smooth.append(pts[-1])
        tube_along(f"backbone_{s_id}", smooth, 0.05, "steel", parent=helix, segs=10)
    return root


PREVIEW = dict(cam_loc=(10.0, -14.5, 2.0), target=(0.0, 0.0, 0.0), lens=34)
