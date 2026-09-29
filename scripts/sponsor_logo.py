"""Reverse a sponsor's logo for the site's black ground.

Takes the logo as the sponsor supplied it (dark wordmark and yellow bars on
white, design/source/synchrony.jpg), keys out the white, turns the grey
wordmark white and keeps the bars' own yellow, the way Synchrony's reversed
logo reads. Writes a lossless WebP with alpha to public/sponsors/.

    python scripts/sponsor_logo.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "design/source/synchrony.jpg"
OUT = ROOT / "public/sponsors/synchrony.webp"
MARGIN = 8

XMP = """<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:source>Synchrony logo as supplied by the ATMOS team (design/source/synchrony.jpg); reversed for dark backgrounds by scripts/sponsor_logo.py</dc:source>
<dc:rights>The Synchrony logo is a trademark of its owner</dc:rights>
</rdf:Description></rdf:RDF></x:xmpmeta>"""


def main() -> None:
    rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    # yellow reads as a blue deficit against red; grey has none
    yellow = (r - b) > 60
    bar = np.median(rgb[yellow & ((r - b) > 200)], axis=0)
    grey = np.median(rgb[~yellow & (r < 90)], axis=0)

    # ink amount: how far each pixel has moved from white towards its ink
    bar_ink = np.clip((255 - b) / (255 - bar[2]), 0, 1)
    grey_ink = np.clip((255 - rgb.mean(-1)) / (255 - grey.mean()), 0, 1)
    alpha = np.where(yellow, bar_ink, grey_ink)
    colour = np.where(yellow[..., None], bar, 255.0)

    out = np.dstack([colour, alpha * 255]).round().clip(0, 255).astype(np.uint8)
    ys, xs = np.nonzero(alpha > 0.04)
    out = out[
        max(ys.min() - MARGIN, 0) : ys.max() + MARGIN + 1,
        max(xs.min() - MARGIN, 0) : xs.max() + MARGIN + 1,
    ]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out, "RGBA").save(OUT, lossless=True, quality=100, method=6, xmp=XMP.encode())
    print(f"{OUT.relative_to(ROOT)}: {out.shape[1]}x{out.shape[0]}, {OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
