"""Stand-in event images with Z-Image-Turbo, until each club sends its poster.

  python scripts/events/generate.py                      # every event, every seed in prompts.json
  python scripts/events/generate.py --only robowars,arg  # re-roll a few
  python scripts/events/generate.py --seeds 44,55        # other seeds

Candidates land in design/review/events/<id>_<seed>.png (gitignored); export.py
turns the picked ones into public/events/<id>.webp. Needs diffusers >= 0.36 and
fits 8 GB of VRAM: prompts are encoded first (text encoder streamed from RAM),
then the transformer runs on the GPU in fp8. See design/ASSETS.md.
"""

import argparse
import gc
import json
import time
from pathlib import Path

import torch
from accelerate import cpu_offload
from diffusers import AutoencoderKL, ZImagePipeline, ZImageTransformer2DModel
from huggingface_hub import snapshot_download

ROOT = Path(__file__).resolve().parents[2]
PROMPTS = json.loads((ROOT / 'scripts/events/prompts.json').read_text(encoding='utf-8'))
OUT = ROOT / 'design/review/events'

W, H = 1024, 768  # 4:3, both multiples of 16; export is 960x720
STEPS = 9  # 8 denoising steps for the Turbo model


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='comma-separated event ids')
    ap.add_argument('--seeds', help='comma-separated seeds (default: prompts.json)')
    ap.add_argument('--force', action='store_true', help='overwrite existing candidates')
    args = ap.parse_args()

    events = PROMPTS['events']
    ids = args.only.split(',') if args.only else list(events)
    seeds = [int(s) for s in args.seeds.split(',')] if args.seeds else PROMPTS['seeds']
    OUT.mkdir(parents=True, exist_ok=True)

    model = snapshot_download(PROMPTS['model'])  # a local path; sharded loads by repo id fail offline
    todo = [(id, seed) for id in ids for seed in seeds if args.force or not (OUT / f'{id}_{seed}.png').exists()]
    if not todo:
        return

    # 1. every prompt through the text encoder (4B, streamed layer by layer), then free it
    text = ZImagePipeline.from_pretrained(model, transformer=None, vae=None, torch_dtype=torch.bfloat16)
    cpu_offload(text.text_encoder, execution_device='cuda')
    embeds = {}
    with torch.no_grad():
        for id in dict.fromkeys(id for id, _ in todo):
            embeds[id] = text.encode_prompt(f"{events[id]} {PROMPTS['style']}", device='cuda', do_classifier_free_guidance=False)[0][0].cpu()
    del text
    gc.collect()
    torch.cuda.empty_cache()

    # 2. the 6B transformer kept in fp8 so it and the VAE fit on an 8 GB card
    transformer = ZImageTransformer2DModel.from_pretrained(model, subfolder='transformer', torch_dtype=torch.bfloat16)
    transformer.enable_layerwise_casting(storage_dtype=torch.float8_e4m3fn, compute_dtype=torch.bfloat16)
    vae = AutoencoderKL.from_pretrained(model, subfolder='vae', torch_dtype=torch.bfloat16)
    pipe = ZImagePipeline.from_pretrained(
        model, transformer=transformer, vae=vae, text_encoder=None, tokenizer=None, torch_dtype=torch.bfloat16
    ).to('cuda')
    pipe.vae.enable_tiling()

    for id, seed in todo:
        t = time.time()
        image = pipe(
            prompt_embeds=[embeds[id].to('cuda')],
            width=W,
            height=H,
            num_inference_steps=STEPS,
            guidance_scale=0.0,
            generator=torch.Generator('cuda').manual_seed(seed),
        ).images[0]
        image.save(OUT / f'{id}_{seed}.png')
        print(f'{id}_{seed}.png  {time.time() - t:.1f}s', flush=True)


if __name__ == '__main__':
    main()
