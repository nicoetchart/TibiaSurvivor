/**
 * Walk 2048×64 + idle 32: híbrido (32×32 stripSy 32) solo si el frame sur está en la mitad inferior.
 * Si no (fox, cobra…): fotogramas 64×64 desde y=0.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const META = path.join(__dirname, '../js/data/tibia-creatures-meta.js');
const CREATURES = path.join(__dirname, '../assets/tibia/creatures');

function countAlpha(data, sx, sy, w, h) {
  let n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = sx + x;
      const row = sy + y;
      if (px >= data.width || row >= data.height) continue;
      const i = (row * data.width + px) << 2;
      if (data.data[i + 3] > 40) n++;
    }
  }
  return n;
}

export function resolveWalkTile(pngPath, idleW, idleH) {
  if (idleW !== 32 || idleH !== 32) return { w: 64, h: 64, stripSy: 0 };
  const data = PNG.sync.read(fs.readFileSync(pngPath));
  if (data.height !== 64) return { w: 32, h: data.height, stripSy: 0 };
  const south64 = countAlpha(data, 2 * 64, 0, 64, 64);
  if (south64 > 40) return { w: 64, h: 64, stripSy: 0 };
  const southLower = countAlpha(data, 2 * 32, 32, 32, 32);
  if (southLower > 40) return { w: 32, h: 32, stripSy: 32 };
  return { w: 64, h: 64, stripSy: 0 };
}

function groundAnchor(pngPath, tileW, tileH, dirIndex, stripSy = 0) {
  const data = PNG.sync.read(fs.readFileSync(pngPath));
  const x0 = dirIndex * tileW;
  let maxY = -1;
  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const px = x0 + x;
      if (px >= data.width) continue;
      const row = stripSy + y;
      const i = (row * data.width + px) << 2;
      if (data.data[i + 3] > 40) maxY = Math.max(maxY, y);
    }
  }
  if (maxY < 0) return { ax: Math.round(tileW / 2), ay: tileH >= 48 ? tileH - 3 : tileH - 1 };
  const footXs = [];
  for (let x = 0; x < tileW; x++) {
    const px = x0 + x;
    const row = stripSy + maxY;
    const i = (row * data.width + px) << 2;
    if (data.data[i + 3] > 40) footXs.push(x);
  }
  const ax = footXs.length
    ? Math.round(footXs.reduce((a, b) => a + b, 0) / footXs.length)
    : Math.round(tileW / 2);
  return { ax, ay: Math.min(tileH, maxY + 1) };
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
  if (!idle || !walk) continue;
  const ltId = key.slice(3);
  const walkPng = path.join(CREATURES, `${ltId}-walk.png`);
  if (!fs.existsSync(walkPng)) continue;
  const tile = resolveWalkTile(walkPng, idle.w, idle.h);
  const anchor = groundAnchor(walkPng, tile.w, tile.h, 2, tile.stripSy);
  let changed = false;
  for (const ak of WALK_KEYS) {
    const a = entry.a[ak];
    if (!a || !a.strip) continue;
    if (a.w !== tile.w || a.h !== tile.h || (a.stripSy || 0) !== tile.stripSy) changed = true;
    a.w = tile.w;
    a.h = tile.h;
    if (tile.stripSy) a.stripSy = tile.stripSy;
    else delete a.stripSy;
    a.ax = anchor.ax;
    a.ay = anchor.ay;
  }
  if (changed) {
    entry.anchor = { ax: anchor.ax, ay: anchor.ay };
    n++;
    console.log(key, tile, anchor);
  }
}

const out =
  '/* GENERADO por tools/import_tibia_grouped.mjs — no editar */\nG.TIBIA_CREATURES_META = ' +
  JSON.stringify(meta, null, 2) + ';\n';
fs.writeFileSync(META, out);
console.log('updated', n, 'lookTypes');