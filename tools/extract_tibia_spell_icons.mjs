#!/usr/bin/env node
/**
 * Recorta iconos 32×32 de hechizos y pasivas MS.
 * - defaultspells.png: clientIconId 1-based, rejilla 12×32.
 * - spell-icons-32x32.png: clientId × 32 px (mehah/OTClient).
 * - media.tibia.gg/.../spell-icons-32x32/N.png: iconos nuevos fuera del atlas de GitHub.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'assets', 'tibia', 'spell-icons');
const DEFAULT_SPELLS_URL =
  'https://raw.githubusercontent.com/edubart/otclient/master/data/images/game/spells/defaultspells.png';
const STRIP_URL =
  'https://raw.githubusercontent.com/mehah/otclient/main/data/images/game/spells/spell-icons-32x32.png';
const TIBIA_GG_BASE = 'https://media.tibia.gg/client/images/ui/images/spells/spell-icons-32x32';

const COLS = 12;
const TW = 32;

/** id interno → clientIconId en defaultspells (1-based). */
const DEFAULT_SPELL_ICONS = {
  flame_strike: 26,
  energy_strike: 29,
  death_strike: 38,
  fire_wave: 44,
  energy_beam: 41,
  hells_core: 49,
  rage_of_the_skies: 52,
  ultimate_healing: 1
};

/** id interno → clientId en spell-icons-32x32 (getImageClip × ancho). */
const STRIP_ICON = {
  great_death_beam: 157,
  strong_haste: 101,
  avatar_of_storm: 151
};

/** id interno → índice de archivo en media.tibia.gg (cliente 15.x). */
const TIBIA_GG_ICON = {
  death_echo: 192,
  aura_of_exposed_weakness: 200,
  /** Master of Thunder (uteta vis): icono para la pasiva «Master of Elements». */
  master_of_elements: 188
};

function cropGrid(sheet, clientIconId) {
  const col = (clientIconId - 1) % COLS;
  const row = Math.ceil(clientIconId / COLS) - 1;
  const out = new PNG({ width: TW, height: TW });
  for (let y = 0; y < TW; y++) {
    for (let x = 0; x < TW; x++) {
      const si = ((row * TW + y) * sheet.width + (col * TW + x)) * 4;
      const di = (y * TW + x) * 4;
      out.data.set(sheet.data.subarray(si, si + 4), di);
    }
  }
  return { tile: out, col, row };
}

function cropStrip(sheet, clientId) {
  const x0 = clientId * TW;
  if (x0 + TW > sheet.width) throw new Error(`clientId ${clientId} fuera del atlas (${sheet.width}px)`);
  const out = new PNG({ width: TW, height: TW });
  for (let y = 0; y < TW; y++) {
    for (let x = 0; x < TW; x++) {
      const si = (y * sheet.width + x0 + x) * 4;
      const di = (y * TW + x) * 4;
      out.data.set(sheet.data.subarray(si, si + 4), di);
    }
  }
  return out;
}

function maxRgb(tile) {
  let m = 0;
  for (let i = 0; i < tile.data.length; i += 4) {
    m = Math.max(m, tile.data[i], tile.data[i + 1], tile.data[i + 2]);
  }
  return m;
}

async function loadUrl(url, cachePath) {
  if (fs.existsSync(cachePath)) return fs.readFileSync(cachePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cachePath, buf);
  return buf;
}

async function writeTibiaGgIcon(id, index) {
  const url = `${TIBIA_GG_BASE}/${index}.png`;
  const buf = await loadUrl(url, path.join(OUT_DIR, `_gg_${id}.png`));
  const tile = PNG.sync.read(buf);
  if (tile.width !== TW || tile.height !== TW) {
    throw new Error(`${id}: se esperaba ${TW}×${TW}, llegó ${tile.width}×${tile.height}`);
  }
  const mx = maxRgb(tile);
  fs.writeFileSync(path.join(OUT_DIR, id + '.png'), PNG.sync.write(tile));
  fs.unlinkSync(path.join(OUT_DIR, `_gg_${id}.png`));
  console.log(id, `tibia.gg icon ${index}`, 'max', mx);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const defaultBuf = await loadUrl(DEFAULT_SPELLS_URL, path.join(OUT_DIR, '_defaultspells.png'));
  const defaultSheet = PNG.sync.read(defaultBuf);
  for (const [id, clientIconId] of Object.entries(DEFAULT_SPELL_ICONS)) {
    const { tile, col, row } = cropGrid(defaultSheet, clientIconId);
    const mx = maxRgb(tile);
    if (mx < 20) console.warn('WARN', id, 'clientIconId', clientIconId, 'vacío (max', mx + ')');
    fs.writeFileSync(path.join(OUT_DIR, id + '.png'), PNG.sync.write(tile));
    console.log(id, 'grid clientIcon', clientIconId, 'col', col, 'row', row, 'max', mx);
  }
  fs.unlinkSync(path.join(OUT_DIR, '_defaultspells.png'));

  const stripBuf = await loadUrl(STRIP_URL, path.join(OUT_DIR, '_icons32.png'));
  const stripSheet = PNG.sync.read(stripBuf);
  for (const [id, clientId] of Object.entries(STRIP_ICON)) {
    const tile = cropStrip(stripSheet, clientId);
    const mx = maxRgb(tile);
    fs.writeFileSync(path.join(OUT_DIR, id + '.png'), PNG.sync.write(tile));
    console.log(id, 'strip clientId', clientId, 'max', mx);
  }

  for (const [id, index] of Object.entries(TIBIA_GG_ICON)) {
    await writeTibiaGgIcon(id, index);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});