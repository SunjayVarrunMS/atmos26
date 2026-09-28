"""Chamber 5, 2026: intelligence, as a string-art sculpture.

A network built the way you would build one by hand: brass hoops stacked as
layers, each carrying a row of beads (the units), narrowing upward to a single
bead at the top. Four slanted rods hold the hoops. The thousands of taut wires
between the layers are drawn by the site from the bead positions exported on
the root's extras, so signals can travel along them.
"""
import math

from common import circle, empty, flat, lathe, rod

JOIN_STATIC = True

# (height, radius, units) bottom to top
LAYERS = [(-6.2, 5.4, 48), (-3.6, 4.4, 36), (-1.0, 3.4, 26), (1.6, 2.5, 18), (4.1, 1.6, 10)]
APEX = 6.4


def build():
    root = empty("intelligence", chamber="intelligence")
    nodes = []  # x, y, z, layer

    for li, (z, r, n) in enumerate(LAYERS):
        # the hoop: a turned ring section
        lathe(f"hoop_{li}", [(r - 0.07, 0.0), (r, -0.05), (r + 0.07, 0.0), (r, 0.05)], "brass_dark", parent=root,
              loc=(0, 0, z), axis="Z", segs=160, closed=True)
        for k in range(n):
            a = k / n * 2 * math.pi + li * 0.17
            x, y = r * math.cos(a), r * math.sin(a)
            size = 0.13 - li * 0.008
            lathe(f"unit_{li}_{k}", [(0.0, -size), (size * 0.7, -size * 0.85), (size, -size * 0.3), (size, size * 0.3),
                                     (size * 0.7, size * 0.85), (0.0, size)], "brass", parent=root, loc=(x, y, z),
                  axis="Z", segs=16)
            nodes += [x, y, z, li]
    # the apex unit, larger, in a collar
    lathe("apex", [(0.0, -0.32), (0.22, -0.26), (0.32, -0.1), (0.32, 0.1), (0.22, 0.26), (0.0, 0.32)], "brass",
          parent=root, loc=(0, 0, APEX), axis="Z", segs=40)
    lathe("apex_collar", [(0.36, -0.05), (0.46, -0.05), (0.46, 0.05), (0.36, 0.05)], "brass_dark", parent=root,
          loc=(0, 0, APEX), axis="Z", segs=48, closed=True)
    nodes += [0.0, 0.0, APEX, len(LAYERS)]

    # four slanted rods carry the hoops, meeting above the apex
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        z0, r0, _ = LAYERS[0]
        rb = r0 + 0.12
        rod(f"frame_{k}", (rb * math.cos(a), rb * math.sin(a), z0 - 0.9), (0.18 * math.cos(a), 0.18 * math.sin(a),
                                                                          APEX + 1.3), 0.035, "steel", parent=root,
            segs=10)
    lathe("frame_crown", [(0.0, 0.0), (0.26, 0.0), (0.3, 0.08), (0.2, 0.22), (0.0, 0.26)], "brass_dark", parent=root,
          loc=(0, 0, APEX + 1.3), axis="Z", segs=32)
    # foot ring the rods stand in
    z0, r0, _ = LAYERS[0]
    lathe("foot", [(r0 - 0.1, 0.0), (r0 + 0.35, 0.0), (r0 + 0.38, 0.06), (r0 + 0.3, 0.16), (r0 - 0.1, 0.16)], "iron",
          parent=root, loc=(0, 0, z0 - 1.05), axis="Z", segs=160, closed=True)

    root["nodes"] = nodes
    root["layers"] = [n for (_, _, n) in LAYERS] + [1]
    return root


PREVIEW = dict(cam_loc=(10.0, -15.0, 2.0), target=(0.0, 0.0, 0.0), lens=34)
