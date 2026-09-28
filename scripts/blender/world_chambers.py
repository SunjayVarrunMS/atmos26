"""Build the Ascension chambers in Blender and export them for the web.

  blender -b --factory-startup -P scripts/blender/world_chambers.py -- clockwork [--preview] [--no-bake]

Writes public/world/<name>.raw.glb (materials by name, baked AO in COLOR_0,
motion hints in node extras) and, with --preview, a Cycles still in
design/review/world/. `npm run pack:world` then compresses the raw GLBs.
"""
import importlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "world"))
import common  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
names = [a for a in argv if not a.startswith("--")] or ["clockwork"]
flags = {a for a in argv if a.startswith("--")}

for name in names:
    mod = importlib.import_module(name)
    common.reset()
    mod.build()
    if "--no-bake" not in flags:
        common.bake_ao(common.meshes())
    if "--preview" in flags:
        common.preview(name, **mod.PREVIEW)
    if "--no-export" not in flags:
        common.export(name)
