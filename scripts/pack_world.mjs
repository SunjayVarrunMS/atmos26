// Compress the raw chamber exports from Blender (public/world/*.raw.glb) into
// the files the site loads: welded, lightly simplified, quantised and
// meshopt-compressed. Run after scripts/blender/world_chambers.py.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'public', 'world');
const raws = readdirSync(dir).filter((f) => f.endsWith('.raw.glb'));
if (!raws.length) {
  console.error('no public/world/*.raw.glb; run the Blender script first');
  process.exit(1);
}

for (const raw of raws) {
  const out = raw.replace('.raw.glb', '.glb');
  execFileSync(
    'npx',
    [
      'gltf-transform', 'optimize', join(dir, raw), join(dir, out),
      '--compress', 'meshopt',
      '--simplify', 'true', '--simplify-error', '0.0004',
      '--texture-compress', 'false',
      // materials are swapped by name on the site, so keep them separate
      '--palette', 'false',
      // keep the node tree: the site animates arbors by name
      '--instance', 'false', '--join', 'false', '--flatten', 'false',
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  );
  console.log(`${out}: ${(statSync(join(dir, out)).size / 1024).toFixed(0)} KB`);
}
