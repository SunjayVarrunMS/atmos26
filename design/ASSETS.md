# Asset log

How every shipped asset was made, so it can be regenerated.

## Hero logo layers — `public/logo/*.webp`, `src/data/logoLayers.json`
- Source: `atmos-website.jpg` (official artwork, fest design team) plus the team's own layer exports in `design/source/` (`letters.png`, `machine_hand.png`, 3000 px, same framing as the logo).
- `scripts/logo_segment.py` — SAM 2.1 (hiera-large, via transformers) cuts object masks from hand-placed prompts into `design/logo/masks/`.
- `scripts/logo_layers.py` — refines masks against a clean plate (drop shadows, wires), fills hidden pixels (vortex/ring by polar interpolation, black outside the ring, letters and machine-hand fingertips from `design/source`, the human fingers behind the M by LaMa), writes lossless WebP layers.
- `scripts/verify_logo.py` — re-stacks the layers and fails unless they match the JPEG exactly (currently mean and max difference 0).
- Needs: Python 3.12 with torch, transformers, opencv, pillow; LaMa weights at `D:/atmos-ai/models/lama/big-lama.pt`.

## Particle shapes — `public/shapes/*.bin`
- `scripts/blender/era_shapes.py` (Blender 5.2, headless: `blender -b --factory-startup -P scripts/blender/era_shapes.py`) models hands (from `design/source/rigged_lowpoly_hand.glb`), pocket watch, locomotive, circuit-board city, DNA, brain and concentric rings procedurally, samples 12,000 surface points each (int16 xyz). Reference GLBs land in `design/3d/`.

## Other rasters
- `public/og.jpg`, `public/favicon.png`, `public/apple-touch-icon.png`: made in PIL from the official artwork (+ Stardos Stencil / Archivo for the share card).
- `public/gallery/*`: past-edition photos supplied by the team.
- `public/clubs/*.webp`: organising-club logos from SU Connect's public `club-logos` bucket (as shown on su-connect-bphc.vercel.app/clubs), centre-cropped to 96 px squares on black in PIL. Alchemy is left out because SU Connect shows E-Cell's logo in its place.
- Every file in `public/` carries its origin in embedded metadata (`impeccable embed-prompt --scan public`).

## Local toolkit
- `scripts/ai-setup.ps1` sets up ComfyUI + FLUX Kontext + Wan 2.2 on `D:\atmos-ai` (paused: the drive reported a CRC error).
