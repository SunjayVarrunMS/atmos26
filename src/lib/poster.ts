/** resizes a picked image to at most 1200 px wide and encodes it as WebP, aiming for ≤ 300 KB */
export async function toWebp(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('That file isn’t an image this browser can read.');
  }
  try {
    const scale = Math.min(1, 1200 / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('That file isn’t an image this browser can read.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let last: Blob | null = null;
    for (const q of [0.82, 0.7, 0.6]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', q));
      if (!blob) throw new Error('This browser can’t save WebP images.');
      last = blob;
      if (blob.size <= 300 * 1024) break;
    }
    if (!last) throw new Error('This browser can’t save WebP images.');
    return last;
  } finally {
    bitmap.close();
  }
}
