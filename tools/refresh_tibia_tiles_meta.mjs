#!/usr/bin/env node
/**
 * Regenera tibia-tiles-meta.js desde assets/tibia/tiles/*.png (ya copiados a mano o por import).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TILE_DIR = path.join(ROOT, 'assets', 'tibia', 'tiles');
const META_OUT = path.join(ROOT, 'js', 'data', 'tibia-tiles-meta.js');

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b[0] !== 0x89) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function parseStripBase(name) {
  const base = name.replace(/\.png$/i, '');
  const m = base.match(/^(\d+)(?:-(\d+))?$/);
  if (!m) return { key: base, frames: 1 };
  const a = +m[1];
  const b = m[2] != null ? +m[2] : a;
  const frames = Math.max(1, b - a + 1);
  return { key: base, frames, firstId: a, lastId: b };
}

function main() {
  if (!fs.existsSync(TILE_DIR)) {
    console.error('No existe', TILE_DIR);
    process.exit(1);
  }
  const files = fs.readdirSync(TILE_DIR).filter(f => f.endsWith('.png')).sort();
  const meta = {};
  for (const f of files) {
    const sz = pngSize(path.join(TILE_DIR, f));
    if (!sz) continue;
    const strip = parseStripBase(f);
    const key = strip.key;
    const tileW = strip.frames > 1 ? Math.max(1, Math.round(sz.w / strip.frames)) : sz.w;
    const tileH = sz.h;
    meta[key] = {
      sheetW: sz.w,
      sheetH: sz.h,
      tileW,
      tileH,
      frames: strip.frames,
      firstId: strip.firstId,
      lastId: strip.lastId
    };
  }
  fs.writeFileSync(
    META_OUT,
    `/* GENERADO por tools/refresh_tibia_tiles_meta.mjs — no editar */\nG.TIBIA_TILES_META = ${JSON.stringify(meta, null, 2)};\n`
  );
  console.log(`${files.length} PNG → meta (${Object.keys(meta).length} entradas)`);
}

main();
