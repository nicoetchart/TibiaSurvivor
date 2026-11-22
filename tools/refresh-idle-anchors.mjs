/**
 * Recalcula anclas Idle (frame sur) desde PNG y alinea walk híbrido (stripSy) con Idle.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const META = path.join(__dirname, '../js/data/tibia-creatures-meta.js');
const CREATURES = path.join(__dirname, '../assets/tibia/creatures');

function groundAnchor(pngPath, tileW, tileH, dirIndex = 2, stripSy = 0) {
  if (!fs.existsSync(pngPath)) return null;
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
  if (maxY < 0) return null;
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
const IDLE_KEYS = ['Idle', 'Hurt', 'Faint'];
let n = 0;

for (const [key, entry] of Object.entries(meta)) {
  if (!key.startsWith('lt_')) continue;
  const ltId = key.slice(3);
  const idlePng = path.join(CREATURES, `${ltId}-idle.png`);
  const idle = entry.a?.Idle;
  if (!idle || !fs.existsSync(idlePng)) continue;
  const a = groundAnchor(idlePng, idle.w, idle.h, 2, 0);
  if (!a) continue;
  let changed = idle.ax !== a.ax || idle.ay !== a.ay;
  for (const ak of IDLE_KEYS) {
    const slot = entry.a[ak];
    if (!slot) continue;
    slot.ax = a.ax;
    slot.ay = a.ay;
  }
  if (entry.a.Walk && entry.a.Walk.stripSy) {
    for (const ak of WALK_KEYS) {
      const slot = entry.a[ak];
      if (!slot) continue;
      slot.ax = a.ax;
      slot.ay = a.ay;
    }
    changed = true;
  }
  if (entry.anchor) {
    entry.anchor.ax = a.ax;
    entry.anchor.ay = a.ay;
  }
  if (changed) {
    n++;
    console.log(key, a);
  }
}

const out =
  '/* GENERADO por tools/import_tibia_grouped.mjs — no editar (refresh idle anchors) */\nG.TIBIA_CREATURES_META = ' +
  JSON.stringify(meta, null, 2) + ';\n';
fs.writeFileSync(META, out);
console.log('updated', n, 'lookTypes');