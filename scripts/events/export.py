"""Writes the picked candidates to public/events/<id>.webp.

  python scripts/events/export.py

picks.json maps each event id to the seed that was chosen from
design/review/events/. An event whose club sent a real poster is left out of
picks.json and its webp is replaced by hand (see design/ASSETS.md).
"""

import json
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PROMPTS = json.loads((ROOT / 'scripts/events/prompts.json').read_text(encoding='utf-8'))
PICKS = json.loads((ROOT / 'scripts/events/picks.json').read_text(encoding='utf-8'))
SRC = ROOT / 'design/review/events'
OUT = ROOT / 'public/events'

SIZE = (960, 720)  # the hover photo is at most 320 css px wide


def xmp(text):
    return (
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
        '<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description><rdf:Alt>'
        f'<rdf:li xml:lang="x-default">{escape(text)}</rdf:li>'
        '</rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta>'
    ).encode()


OUT.mkdir(parents=True, exist_ok=True)
for id, seed in PICKS.items():
    img = Image.open(SRC / f'{id}_{seed}.png').convert('RGB').resize(SIZE, Image.LANCZOS)
    origin = (
        f"impeccable:prompt Origin: generated stand-in for the ATMOS '26 event '{id}' until the club's poster arrives. "
        f"{PROMPTS['model']}, 9 steps, seed {seed}. Prompt: {PROMPTS['events'][id]} {PROMPTS['style']}"
    )
    path = OUT / f'{id}.webp'
    img.save(path, 'WEBP', quality=80, method=6, xmp=xmp(origin))
    kb = path.stat().st_size / 1024
    print(f'{path.name:32} {kb:6.0f} KB{"  (over 300 KB)" if kb > 300 else ""}')
