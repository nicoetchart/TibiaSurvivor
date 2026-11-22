/**
 * @deprecated Usa fix-walk-layout-meta.mjs (detección por frame sur en mitad inferior).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const META = path.join(__dirname, '../js/data/tibia-creatures-meta.js');
const CREATURES = path.join(__dirname, '../assets/tibia/creatures');

function groundAnchor(pngPath, tileW, tileH, dirIndex, sy = 0) {
  const data = PNG.sync.read(fs.readFileSync(pngPath));
  const x0 = dirIndex * tileW;
  let maxY = -1;
  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const px = x0 + x;
      if (px >= data.width) continue;
      const yy = sy + y;
      const i = (yy * data.width + px) << 2;
      if (data.data[i + 3] > 40) maxY = Math.max(maxY, y);
    }
  }
  if (maxY < 0) return null;
  const footXs = [];
  for (let x = 0; x < tileW; x++) {
    const px = x0 + x;
    const yy = sy + maxY;
    const i = (yy * data.width + px) << 2;
    if (data.data[i + 3] > 40) footXs.push(x);
  }
  const ax = footXs.length
    ? Math.round(footXs.reduce((a, b) => a + b, 0) / footXs.length)
    : Math.round(tileW / 2);
  return { ax, ay: maxY + 1 };
}

function walkAnchorForSouth(ltId) {
  const walk = path.join(CREATURES, `${ltId}-walk.png`);
  if (!fs.existsSync(walk)) return null;
  const sy = 32;
  let a = groundAnchor(walk, 32, 32, 2, sy);
  if (a) return a;
  for (const di of [1, 3, 0]) {
    a = groundAnchor(walk, 32, 32, di, sy);
    if (a) return a;
  }
  a = groundAnchor(walk, 32, 32, 2, 0);
  if (a) return a;
  return { ax: 16, ay: 31 };
}

const src = fs.readFileSync(META, 'utf8');
const m = src.match(/=\s*(\{[\s\S]*\});?\s*$/);
if (!m) throw new Error('No se pudo parsear meta');
const meta = JSON.parse(m[1]);

const WALK_KEYS = ['Walk', 'Attack', 'Shoot', 'Charge'];
let n = 0;

for (const [key, entry] of Object.entries(meta)) {
  if (!key.startsWith('lt_')) continue;
  const idle = entry.a?.Idle;
  const walk = entry.a?.Walk;
  if (!idle || !walk || idle.w !== 32 || walk.w !== 64) continue;
  const ltId = key.slice(3);
  const walkPng = path.join(CREATURES, `${ltId}-walk.png`);
  if (!fs.existsSync(walkPng)) continue;
  const sz = PNG.sync.read(fs.readFileSync(walkPng));
  if (sz.height !== 64) continue;
  const anchor = walkAnchorForSouth(ltId);
  for (const ak of WALK_KEYS) {
    const a = entry.a[ak];
    if (!a || a.w !== 64) continue;
    a.w = 32;
    a.h = 32;
    a.stripSy = 32;
    a.ax = anchor.ax;
    a.ay = anchor.ay;
  }
  entry.anchor = { ax: anchor.ax, ay: anchor.ay };
  n++;
  console.log(key, anchor);
}

const out =
  '/* GENERADO por tools/import_tibia_grouped.mjs — no editar (patch hybrid walk) */\nG.TIBIA_CREATURES_META = ' +
  JSON.stringify(meta, null, 2) + ';\n';
fs.writeFileSync(META, out);
console.log('patched', n, 'lookTypes');