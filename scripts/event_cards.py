"""Cut the events grid's card pictures from the posters.

A card shows its poster as a 4:3 crop anchored at the top (object-cover
object-top), so the grid only needs that part. For every public/events/*.webp
this writes public/events/card/<name>.webp (900 x 675) and <name>-600.webp
(600 x 450), then lists the posters that have cards in src/data/eventCards.json.
A poster without cards still shows, at full size. Run it after adding a poster.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/events"
OUT = SRC / "card"
SIZES = [(900, 675, ""), (600, 450, "-600")]


def crop(im: Image.Image, w: int, h: int) -> Image.Image:
    # cover w x h, keep the top edge, centre sideways: the same crop the card's CSS makes
    scale = max(w / im.width, h / im.height)
    sw, sh = round(im.width * scale), round(im.height * scale)
    if (sw, sh) != im.size:
        im = im.resize((sw, sh), Image.LANCZOS)
    x = (sw - w) // 2
    return im.crop((x, 0, x + w, h))


def main() -> None:
    OUT.mkdir(exist_ok=True)
    names = []
    for poster in sorted(SRC.glob("*.webp")):
        im = Image.open(poster).convert("RGB")
        for w, h, suffix in SIZES:
            target = OUT / f"{poster.stem}{suffix}.webp"
            if target.exists() and target.stat().st_mtime >= poster.stat().st_mtime:
                continue
            crop(im, w, h).save(target, "WEBP", quality=80, method=6)
        names.append(poster.stem)
    (ROOT / "src/data/eventCards.json").write_text(json.dumps(names, indent=2) + "\n")
    size = sum(f.stat().st_size for f in OUT.glob("*.webp"))
    print(f"{len(names)} posters, cards {size // 1024} KB")


if __name__ == "__main__":
    main()
