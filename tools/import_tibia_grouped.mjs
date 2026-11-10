#!/usr/bin/env node
/**
 * Copia PNG idle + walk → assets/tibia/creatures|outfits/{id}-idle|walk.png
 * y genera js/data/tibia-creatures-meta.js (lt_* criaturas, out_* outfits jugador)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import protobuf from 'protobufjs';
import { PNG } from 'pngjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_CREATURES = path.join(ROOT, 'assets', 'tibia', 'creatures');
const OUT_OUTFITS = path.join(ROOT, 'assets', 'tibia', 'outfits');
const META_OUT = path.join(ROOT, 'js', 'data', 'tibia-creatures-meta.js');
const MANIFEST_OUT = path.join(ROOT, 'assets', 'tibia', 'manifest.json');
const LOCAL_CFG = path.join(ROOT, 'tools', 'tibia-client.local.json');

const MVP_LOOKTYPES = [276, 32, 31, 74, 45, 15, 27, 6, 25, 44, 40, 18, 17, 73, 35];
/** Plantilla de outfit en appearances (138 = cuerpo MS; colores vía export agrupado). */
const MVP_OUTFIT_TYPES = [128, 132, 138];

const args = process.argv.slice(2);
function opt(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

function readClientAssets() {
  try {
    const j = JSON.parse(fs.readFileSync(LOCAL_CFG, 'utf8'));
    return path.join(j.clientRoot, 'assets');
  } catch { return null; }
}

function appearancesPath(explicit) {
  if (explicit) return explicit;
  const assets = readClientAssets();
  if (!assets) return null;
  const catalog = JSON.parse(fs.readFileSync(path.join(assets, 'catalog-content.json'), 'utf8'));
  const ap = catalog.find(e => e.type === 'appearances');
  return ap ? path.join(assets, ap.file) : null;
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4e || b[3] !== 0x47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function groupedFileName(ids) {
  if (!ids.length) return null;
  const first = ids[0], last = ids[ids.length - 1];
  return first === last ? `${first}.png` : `${first}-${last}.png`;
}

async function loadAppearances() {
  const root = await protobuf.load(path.join(ROOT, 'tools', 'vendor', 'appearances.proto'));
  return root.lookupType('Canary.protobuf.appearances.Appearances');
}

function spriteInfoFromGroup(fg) {
  const si = fg.spriteInfo || fg.sprite_info;
  const rawIds = si && (si.spriteId || si.sprite_id);
  if (!si || !rawIds || !rawIds.length) return null;
  return {
    fixed: fg.fixedFrameGroup ?? fg.fixed_frame_group ?? -1,
    pw: si.patternWidth ?? si.pattern_width ?? 4,
    ph: si.patternHeight ?? si.pattern_height ?? 1,
    pd: si.patternDepth ?? si.pattern_depth ?? 1,
    layers: si.layers ?? 1,
    ids: rawIds.map(Number)
  };
}

function pickFrameGroups(outfit) {
  const groups = (outfit.frameGroup || outfit.frame_group || [])
    .map(spriteInfoFromGroup)
    .filter(Boolean);
  const idle = groups.find(g => g.fixed === 0) || groups[0];
  const move = groups.find(g => g.fixed === 1) || idle;
  return { idle, move };
}

function phaseCount(si) {
  const pw = Math.max(1, si.pw || 4);
  const layers = Math.max(1, si.layers || 1);
  const fromStrip = Math.max(1, Math.floor(si.ids.length / (pw * layers)));
  return Math.max(si.ph || 1, fromStrip);
}

/** Escala visual: ajustar en js/data/tibia-sprite-tuning.js (no aquí). */
function drawMul() { return 1; }

/** Ancla al suelo (estilo PMD: centro de masa en la franja baja del arte, frame sur). */
function groundAnchorFromStrip(pngPath, tileW, tileH, dirIndex = 2) {
  const data = PNG.sync.read(fs.readFileSync(pngPath));
  const x0 = dirIndex * tileW;
  let maxY = -1;
  for (let y = 0; y < tileH; y++) {
    for (let x = 0; x < tileW; x++) {
      const px = x0 + x;
      if (px >= data.width) continue;
      const i = (y * data.width + px) << 2;
      if (data.data[i + 3] > 40 && y > maxY) maxY = y;
    }
  }
  if (maxY < 0) {
    const large = tileH >= 48;
    return { ax: Math.round(tileW / 2), ay: large ? tileH - 3 : tileH - 1 };
  }
  const band = Math.max(2, Math.ceil(tileH * 0.14));
  const yMin = Math.max(0, maxY - band + 1);
  let xs = 0;
  let ys = 0;
  let n = 0;
  for (let y = yMin; y <= maxY; y++) {
    for (let x = 0; x < tileW; x++) {
      const px = x0 + x;
      if (px >= data.width) continue;
      const i = (y * data.width + px) << 2;
      if (data.data[i + 3] > 40) {
        xs += x;
        ys += y;
        n++;
      }
    }
  }
  if (!n) {
    return { ax: Math.round(tileW / 2), ay: Math.min(tileH, maxY + 1) };
  }
  return { ax: Math.round(xs / n), ay: Math.round(ys / n) };
}

function shadowSizeFromTile(tileH) {
  if (tileH >= 56) return 2;
  if (tileH >= 40) return 1;
  return 0;
}

function buildAnimMeta(si, tileW, tileH, nOverride, stripKind, anchor) {
  const pw = si.pw || 4;
  const n = nOverride ?? Math.max(1, phaseCount(si));
  const d = Array.from({ length: n }, () => (n > 1 ? 5 : 10));
  const ax = anchor ? anchor.ax : Math.round(tileW / 2);
  const ay = anchor ? anchor.ay : (tileH >= 48 ? tileH - 3 : tileH - 1);
  return { w: tileW, h: tileH, n, d, ax, ay, r: 4, pw, ph: phaseCount(si), strip: true, stripKind };
}

function copyStrip(groupedDir, fileId, suffix, si, outDir) {
  const fname = groupedFileName(si.ids);
  if (!fname) return null;
  const src = path.join(groupedDir, fname);
  if (!fs.existsSync(src)) return { err: 'falta ' + fname };
  const dest = path.join(outDir, `${fileId}${suffix}.png`);
  fs.copyFileSync(src, dest);
  const sz = pngSize(dest);
  if (!sz) return { err: 'PNG inválido ' + fname };
  const tileW = Math.max(1, Math.round(sz.w / si.ids.length));
  const tileH = sz.h;
  return { fname, dest, tileW, tileH, count: si.ids.length };
}

async function main() {
  const groupedDir = opt('--grouped') || 'C:/Proyectos/TSEXP/output/grouped';
  const apPath = appearancesPath(opt('--appearances'));
  if (!fs.existsSync(groupedDir)) {
    console.error('No existe --grouped:', groupedDir);
    process.exit(1);
  }
  if (!apPath || !fs.existsSync(apPath)) {
    console.error('Indica --appearances o tools/tibia-client.local.json válido');
    process.exit(1);
  }

  const Appearances = await loadAppearances();
  const msg = Appearances.decode(fs.readFileSync(apPath));
  const byId = new Map(msg.outfit.map(o => [o.id, o]));

  fs.mkdirSync(OUT_CREATURES, { recursive: true });
  fs.mkdirSync(OUT_OUTFITS, { recursive: true });
  const meta = {};
  const report = [];

  function importStripAppearance(appearance, { fileId, metaKey, outDir, walkCap }) {
    const { idle, move } = pickFrameGroups(appearance);
    const idleCopy = copyStrip(groupedDir, fileId, '-idle', idle, outDir);
    const walkCopy = copyStrip(groupedDir, fileId, '-walk', move, outDir);
    if (idleCopy?.err || walkCopy?.err) {
      return { ok: false, reason: idleCopy?.err || walkCopy?.err };
    }
    const walkN = Math.min(walkCap ?? 8, phaseCount(move));
    const refH = Math.max(idleCopy.tileH, walkCopy.tileH);
    const anchor = groundAnchorFromStrip(idleCopy.dest, idleCopy.tileW, idleCopy.tileH, 2);
    const layout = {
      pw: idle.pw || 4,
      ph: idle.ph || 1,
      pd: idle.pd || 1,
      layers: idle.layers || 1
    };
    const composite = metaKey.startsWith('out_') && layout.layers >= 2 && layout.ph >= 2;
    meta[metaKey] = {
      kind: metaKey.startsWith('out_') ? 'outfit' : 'lookType',
      tileW: walkCopy.tileW,
      tileH: walkCopy.tileH,
      pw: move.pw,
      drawMul: drawMul(refH),
      s: shadowSizeFromTile(refH),
      layout,
      composite,
      anchor,
      a: {
        Idle: buildAnimMeta(idle, idleCopy.tileW, idleCopy.tileH, 1, 'idle', anchor),
        Walk: buildAnimMeta(move, walkCopy.tileW, walkCopy.tileH, walkN, 'walk', anchor),
        Attack: buildAnimMeta(move, walkCopy.tileW, walkCopy.tileH, Math.min(3, walkN), 'walk', anchor),
        Shoot: buildAnimMeta(move, walkCopy.tileW, walkCopy.tileH, Math.min(3, walkN), 'walk', anchor),
        Charge: buildAnimMeta(move, walkCopy.tileW, walkCopy.tileH, Math.min(2, walkN), 'walk', anchor),
        Hurt: buildAnimMeta(idle, idleCopy.tileW, idleCopy.tileH, 1, 'idle', anchor),
        Faint: buildAnimMeta(idle, idleCopy.tileW, idleCopy.tileH, 1, 'idle', anchor)
      },
      idleStrip: idleCopy.fname,
      walkStrip: walkCopy.fname
    };
    return { ok: true, idle: idleCopy.fname, walk: walkCopy.fname, walkN, drawMul: meta[metaKey].drawMul };
  }

  for (const lookType of MVP_LOOKTYPES) {
    const appearance = byId.get(lookType);
    if (!appearance) {
      report.push({ kind: 'creature', lookType, ok: false, reason: 'sin outfit' });
      continue;
    }
    const r = importStripAppearance(appearance, {
      fileId: lookType,
      metaKey: `lt_${lookType}`,
      outDir: OUT_CREATURES,
      walkCap: 8
    });
    report.push({ kind: 'creature', lookType, ...r });
  }

  for (const outfitType of MVP_OUTFIT_TYPES) {
    const appearance = byId.get(outfitType);
    if (!appearance) {
      report.push({ kind: 'outfit', outfitType, ok: false, reason: 'sin appearance' });
      continue;
    }
    const r = importStripAppearance(appearance, {
      fileId: outfitType,
      metaKey: `out_${outfitType}`,
      outDir: OUT_OUTFITS,
      walkCap: 8
    });
    report.push({ kind: 'outfit', outfitType, ...r });
  }

  fs.writeFileSync(META_OUT, `/* GENERADO por tools/import_tibia_grouped.mjs — no editar */\nG.TIBIA_CREATURES_META = ${JSON.stringify(meta, null, 2)};\n`);
  const okCreatures = report.filter(r => r.kind === 'creature' && r.ok).length;
  const okOutfits = report.filter(r => r.kind === 'outfit' && r.ok).length;
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify({
    at: new Date().toISOString(),
    groupedDir,
    creatures: okCreatures,
    outfits: okOutfits
  }, null, 2) + '\n');

  console.log(JSON.stringify(report, null, 2));
  console.log(`\n${okCreatures}/${MVP_LOOKTYPES.length} criaturas · ${okOutfits}/${MVP_OUTFIT_TYPES.length} outfits`);
  const ok = okCreatures === MVP_LOOKTYPES.length && okOutfits === MVP_OUTFIT_TYPES.length;
  process.exit(ok ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
