/** Recorta 64-idle/walk.png → 128×32 y 1024×32 (arte en mitad inferior del export grouped). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREATURES = path.join(__dirname, '..', 'assets', 'tibia', 'creatures');

const CROPS = {
  '64-idle.png': { outW: 128, outH: 32 },
  '64-walk.png': { outW: 1024, outH: 32 }
};

function cropLowerLeft(srcPath, destPath, outW, outH) {
  const src = PNG.sync.read(fs.readFileSync(srcPath));
  if (src.width < outW || src.height < outH) {
    throw new Error(`${srcPath}: ${src.width}×${src.height} menor que ${outW}×${outH}`);
  }
  const sy = src.height - outH;
  const out = new PNG({ width: outW, height: outH });
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const si = ((sy + y) * src.width + x) << 2;
      const oi = (y * outW + x) << 2;
      out.data[oi] = src.data[si];
      out.data[oi + 1] = src.data[si + 1];
      out.data[oi + 2] = src.data[si + 2];
      out.data[oi + 3] = src.data[si + 3];
    }
  }
  fs.writeFileSync(destPath, PNG.sync.write(out));
  return { from: `${src.width}×${src.height}`, sy };
}

function groundAnchor(pngPath, tileW, tileH, dirIndex = 2) {
  const data = PNG.sync.read(fs.readFileSync(pngPath));
  const x0 = dirIndex * tileW;
  let maxY = -1;
  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const px = x0 + x;
      const i = (y * data.width + px) << 2;
      if (data.data[i + 3] > 40) maxY = Math.max(maxY, y);
    }
  }
  const footXs = [];
  for (let x = 0; x < tileW; x++) {
    const px = x0 + x;
    const i = (maxY * data.width + px) << 2;
    if (data.data[i + 3] > 40) footXs.push(x);
  }
  const ax = footXs.length
    ? Math.round(footXs.reduce((a, b) => a + b, 0) / footXs.length)
    : Math.round(tileW / 2);
  return { ax, ay: Math.min(tileH, maxY + 1) };
}

function walkFrames(pngPath, tileW = 32, pw = 4) {
  const data = PNG.sync.read(fs.readFileSync(pngPath));
  const maxF = Math.floor(data.width / (tileW * pw));
  let n = 0;
  for (let f = 0; f < maxF; f++) {
    let ok = true;
    for (let d = 0; d < pw; d++) {
      let alpha = 0;
      const x0 = (f * pw + d) * tileW;
      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < tileW; x++) {
          const i = (y * data.width + x0 + x) << 2;
          if (data.data[i + 3] > 40) alpha++;
        }
      }
      if (alpha < 40) { ok = false; break; }
    }
    if (ok) n = f + 1;
    else break;
  }
  return Math.max(1, n);
}

for (const [file, { outW, outH }] of Object.entries(CROPS)) {
  const src = path.join(CREATURES, file);
  const info = cropLowerLeft(src, src, outW, outH);
  console.log(file, '→', `${outW}×${outH}`, '(from', info.from, `y=${info.sy})`);
}

const idleP = path.join(CREATURES, '64-idle.png');
const walkP = path.join(CREATURES, '64-walk.png');
const anchorIdle = groundAnchor(idleP, 32, 32, 2);
const anchorWalk = groundAnchor(walkP, 32, 32, 2);
const walkN = walkFrames(walkP);
console.log('anchorIdle', anchorIdle, 'anchorWalk', anchorWalk, 'walkN', walkN);