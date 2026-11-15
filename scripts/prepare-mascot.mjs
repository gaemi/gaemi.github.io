import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src/assets/mascot');
const OUT_DIR = path.join(ROOT, 'public/mascot');
const PUBLIC_DIR = path.join(ROOT, 'public');

/**
 * Corner-seeded flood-fill matte extraction with pastel-mint ground-shadow
 * conversion and edge color-spill decontamination.
 * Preserves interior light colors (cream vest, eye catchlights) and dark teal trim
 * because flood-fill cannot cross the dark pixel-art outline.
 */
async function extractCutout(inputPath, { lowDist = 30, highDist = 66, targetWidth = 560 } = {}) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;
  const patch = 8;
  const corners = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ];
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x++) {
        const idx = (y * width + x) * channels;
        rSum += pixels[idx];
        gSum += pixels[idx + 1];
        bSum += pixels[idx + 2];
        count++;
      }
    }
  }
  const bgR = rSum / count;
  const bgG = gSum / count;
  const bgB = bSum / count;

  const colorDist = (idx) => {
    const dr = pixels[idx] - bgR;
    const dg = pixels[idx + 1] - bgG;
    const db = pixels[idx + 2] - bgB;
    return Math.hypot(dr, dg, db);
  };

  // Detect exterior pastel-mint cast shadow under paws (high green vs red/blue, mid-high luminance)
  const isMintShadow = (idx) => {
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    return g > 135 && r > 95 && g - r >= 22 && g - b >= 12 && colorDist(idx) <= 125;
  };

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const tryEnqueue = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const idx = p * channels;
    if (colorDist(idx) <= highDist || isMintShadow(idx)) {
      visited[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    tryEnqueue(x + 1, y);
    tryEnqueue(x - 1, y);
    tryEnqueue(x, y + 1);
    tryEnqueue(x, y - 1);
  }

  for (let p = 0; p < width * height; p++) {
    if (!visited[p]) continue;
    const idx = p * channels;
    const dist = colorDist(idx);

    if (dist <= lowDist) {
      pixels[idx + 3] = 0;
    } else if (isMintShadow(idx)) {
      // Convert mint ground shadow into a subtle, neutral warm-espresso contact shadow
      const darkness = Math.max(0, Math.min(1, (bgG - pixels[idx + 1]) / Math.max(1, bgG)));
      const shadowAlpha = Math.round(Math.min(0.28, darkness * 0.9) * 255);
      pixels[idx] = 36;
      pixels[idx + 1] = 30;
      pixels[idx + 2] = 26;
      pixels[idx + 3] = shadowAlpha < 10 ? 0 : shadowAlpha;
    } else {
      const alpha = Math.min(1, Math.max(0, (dist - lowDist) / (highDist - lowDist)));
      pixels[idx + 3] = Math.round(alpha * 255);
      if (alpha > 0.05 && alpha < 0.98) {
        const unmix = (c, bg) =>
          Math.round(Math.min(255, Math.max(0, (c - (1 - alpha) * bg) / alpha)));
        pixels[idx] = unmix(pixels[idx], bgR);
        pixels[idx + 1] = unmix(pixels[idx + 1], bgG);
        pixels[idx + 2] = unmix(pixels[idx + 2], bgB);
      }
    }
  }

  const trimmed = await sharp(pixels, { raw: { width, height, channels } })
    .trim({ threshold: 6 })
    .png()
    .toBuffer();

  return sharp(trimmed).resize({
    width: targetWidth,
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const portraitSrc = path.join(SRC_DIR, 'source-portrait.png');
  const notebookSrc = path.join(SRC_DIR, 'source-notebook.jpg');

  const portrait = await extractCutout(portraitSrc, {
    lowDist: 30,
    highDist: 64,
    targetWidth: 560,
  });
  await portrait
    .clone()
    .webp({ quality: 90, alphaQuality: 95 })
    .toFile(path.join(OUT_DIR, 'companion.webp'));
  await portrait
    .clone()
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'companion.png'));

  const notebook = await extractCutout(notebookSrc, {
    lowDist: 32,
    highDist: 68,
    targetWidth: 560,
  });
  await notebook
    .clone()
    .webp({ quality: 90, alphaQuality: 95 })
    .toFile(path.join(OUT_DIR, 'companion-notebook.webp'));
  await notebook
    .clone()
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, 'companion-notebook.png'));

  const meta = await sharp(path.join(OUT_DIR, 'companion.png')).metadata();
  const cropSize = Math.min(meta.width, Math.round(meta.height * 0.56));
  const left = Math.max(0, Math.round((meta.width - cropSize) / 2));
  const faceBuffer = await sharp(path.join(OUT_DIR, 'companion.png'))
    .extract({ left, top: 0, width: cropSize, height: cropSize })
    .png()
    .toBuffer();

  const warmBg = { r: 247, g: 243, b: 235, alpha: 1 };

  await sharp(faceBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));

  await sharp(faceBuffer)
    .resize(156, 156, { fit: 'contain', background: warmBg })
    .extend({ top: 12, bottom: 12, left: 12, right: 12, background: warmBg })
    .flatten({ background: warmBg })
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

  console.log('✓ Mascot cutouts and icons generated cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
