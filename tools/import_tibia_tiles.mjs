#!/usr/bin/env node
/**
 * Copia tiles de suelo/pared desde la carpeta grouped del exporter → assets/tibia/tiles/{clientId}.png
 * Actualiza js/data/tibia-tiles-meta.js y añade entradas en manifest.json.
 *
 *   node tools/import_tibia_tiles.mjs --grouped C:/Proyectos/TSEXP/output/grouped
 *
 * Los clientId por defecto salen de js/data/tibia-sprite-map.js (tiles.*).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'assets', 'tibia', 'tiles');
const META_OUT = path.join(ROOT, 'js', 'data', 'tibia-tiles-meta.js');
const MAP_PATH = path.join(ROOT, 'js', 'data', 'tibia-sprite-map.js');
const MANIFEST = path.join(ROOT, 'assets', 'tibia', 'manifest.json');

const args = process.argv.slice(2);
function opt(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b[0] !== 0x89) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function clientIdsFromMap() {
  const src = fs.readFileSync(MAP_PATH, 'utf8');
  const ids = new Set();
  for (const m of src.matchAll(/clientId:\s*(\d+)/g)) {
    const block = src.slice(Math.max(0, m.index - 80), m.index);
    if (/tiles\s*:/.test(src.slice(0, m.index).split('tiles:').pop()?.slice(0, 500) || block)) {
      ids.add(+m[1]);
    }
  }
  const tilesBlock = src.match(/tiles:\s*\{([\s\S]*?)\n\s*\}/);
  if (tilesBlock) {
    for (const m of tilesBlock[1].matchAll(/clientId:\s*(\d+)/g)) ids.add(+m[1]);
  }
  return [...ids].sort((a, b) => a - b);
}

function findGroupedPng(groupedDir, id) {
  const direct = path.join(groupedDir, `${id}.png`);
  if (fs.existsSync(direct)) return direct;
  const files = fs.readdirSync(groupedDir).filter(f => f.endsWith('.png'));
  for (const f of files) {
    if (f === `${id}.png`) return path.join(groupedDir, f);
    if (f.startsWith(`${id}-`) || f.startsWith(`${id}.`)) return path.join(groupedDir, f);
    const base = f.replace(/\.png$/i, '');
    if (base.includes(String(id))) {
      const first = parseInt(base.split('-')[0], 10);
      if (first === id) return path.join(groupedDir, f);
    }
  }
  return null;
}

function main() {
  const groupedDir = opt('--grouped') || 'C:/Proyectos/TSEXP/output/grouped';
  const extra = (opt('--ids') || '').split(',').map(s => +s.trim()).filter(n => n > 0);
  const ids = [...new Set(clientIdsFromMap().concat(extra))];
  if (!ids.length) {
    console.error('Sin clientId en tibia-sprite-map tiles o --ids');
    process.exit(1);
  }
  if (!fs.existsSync(groupedDir)) {
    console.error('No existe --grouped:', groupedDir);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const meta = {};
  const report = [];
  for (const id of ids) {
    const src = findGroupedPng(groupedDir, id);
    if (!src) {
      report.push({ id, ok: false, reason: 'PNG no encontrado en grouped' });
      continue;
    }
    const dest = path.join(OUT_DIR, `${id}.png`);
    fs.copyFileSync(src, dest);
    const sz = pngSize(dest);
    meta[String(id)] = { w: sz ? sz.w : 32, h: sz ? sz.h : 32 };
    report.push({ id, ok: true, from: path.basename(src), w: meta[String(id)].w, h: meta[String(id)].h });
  }
  fs.writeFileSync(
    META_OUT,
    `/* GENERADO por tools/import_tibia_tiles.mjs — no editar */\nG.TIBIA_TILES_META = ${JSON.stringify(meta, null, 2)};\n`
  );
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch { /* */ }
  manifest.tiles = { at: new Date().toISOString(), groupedDir, ids: Object.keys(meta).map(Number) };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  const ok = report.filter(r => r.ok).length;
  console.log(`\n${ok}/${ids.length} tiles → ${OUT_DIR}`);
  process.exit(ok ? 0 : 1);
}

main();
