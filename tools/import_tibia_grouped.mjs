#!/usr/bin/env node
/**
 * Copia PNG idle + walk → assets/tibia/creatures|outfits/{id}-idle|walk.png
 * y genera js/data/tibia-creatures-meta.js (lt_* criaturas, out_* outfits jugador)
 *
 *   --merge              Conserva entradas lt_/out_ ya presentes en meta (p. ej. ardilla afinada).
 *   --only <json|lista>  Solo esos lookTypes (json con "added", o "530,24,…").
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

const MVP_LOOKTYPES = [
  276, 32, 31, 74, 45, 15, 27, 6, 25, 29, 44, 40, 18, 17, 73, 35, 131, 201,
  111, 21, 14, 106, 30, 274, 1029, 105, 212, 217, 60, 223, 36, 122, 56, 531, 350, 52, 250, 404, 43, 61, 349, 282, 33, 112,
  76, 1927, 297, 94, 1928, 81, 26, 298, 249, 1929, 97, 124, 82, 5, 529, 296, 125, 281, 1649, 393, 16, 259, 216, 214, 41,
  123, 535, 260, 215, 414, 528, 69, 567, 129, 242, 253, 153, 62,
  // batch3
  530, 24, 243, 119, 50, 137, 294, 109, 128, 425, 7, 134, 254, 71, 222, 258, 3, 264, 192, 48,
  316, 19, 566, 23, 64, 1930, 146, 152, 159, 4, 197, 225, 470, 195, 139, 400, 380, 341, 716, 1048,
  8, 93, 63, 72, 133, 118, 219, 403, 117, 342, 413, 313, 57, 65, 323, 70, 314, 532, 95, 712, 120
];
/** Plantilla de outfit en appearances (138 = cuerpo MS; colores vía export agrupado). */
const MVP_OUTFIT_TYPES = [128, 132, 138];

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

function loadExistingMeta() {
  if (!fs.existsSync(META_OUT)) return {};
  const src = fs.readFileSync(META_OUT, 'utf8');
  const m = src.match(/G\.TIBIA_CREATURES_META\s*=\s*(\{[\s\S]*\});\s*$/);
  if (!m) return {};
  try {
    return JSON.parse(m[1]);
  } catch {
    return {};
  }
}

function resolveLookTypeList() {
  const only = opt('--only');
  if (!only) return MVP_LOOKTYPES;
  const p = path.isAbsolute(only) ? only : path.join(ROOT, only);
  if (fs.existsSync(p)) {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (Array.isArray(j)) return j.map(Number);
    if (Array.isArray(j.added)) return j.added.map(Number);
    if (Array.isArray(j.lookTypes)) return j.lookTypes.map(Number);
  }
  return only.split(/[,\s]+/).filter(Boolean).map(Number);
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

function countAlphaStrip(data, sx, sy, w, h) {
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

/** Idle 32 + walk 2048×64: 64×64 completo si el sur encaja; 32×32+stripSy solo si NO hay arte 64×64 (evita recortar). */
function hybridWalkTile(idleCopy, walkCopy) {
  if (idleCopy.tileW !== 32 || idleCopy.tileH !== 32 || walkCopy.tileH !== 64) {
    return { w: walkCopy.tileW, h: walkCopy.tileH, stripSy: 0 };
  }
  const data = PNG.sync.read(fs.readFileSync(walkCopy.dest));
  const south64 = countAlphaStrip(data, 2 * 64, 0, 64, 64);
  if (south64 > 40) return { w: 64, h: 64, stripSy: 0 };
  const southLower = countAlphaStrip(data, 2 * 32, 32, 32, 32);
  if (southLower > 40) return { w: 32, h: 32, stripSy: 32 };
  return { w: 64, h: 64, stripSy: 0 };
}

/** Ancla al suelo: centro de la fila inferior opaca (frame sur), pies en el punto del mundo. */
function groundAnchorFromStrip(pngPath, tileW, tileH, dirIndex = 2, stripSy = 0) {
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
  if (maxY < 0) {
    const large = tileH >= 48;
    return { ax: Math.round(tileW / 2), ay: large ? tileH - 3 : tileH - 1 };
  }
  const footXs = [];
  for (let x = 0; x < tileW; x++) {
    const px = x0 + x;
    if (px >= data.width) continue;
    const row = stripSy + maxY;
    const i = (row * data.width + px) << 2;
    if (data.data[i + 3] > 40) footXs.push(x);
  }
  const ax = footXs.length
    ? Math.round(footXs.reduce((a, b) => a + b, 0) / footXs.length)
    : Math.round(tileW / 2);
  const ay = Math.min(tileH, maxY + 1);
  return { ax, ay };
}

function shadowSizeFromTile(tileH) {
  if (tileH >= 56) return 2;
  if (tileH >= 40) return 1;
  return 0;
}

function buildAnimMeta(si, tileW, tileH, nOverride, stripKind, anchor, stripSy = 0) {
  const pw = si.pw || 4;
  const n = nOverride ?? Math.max(1, phaseCount(si));
  const d = Array.from({ length: n }, () => (n > 1 ? 5 : 10));
  const ax = anchor ? anchor.ax : Math.round(tileW / 2);
  const ay = anchor ? anchor.ay : (tileH >= 48 ? tileH - 3 : tileH - 1);
  const m = {
    w: tileW, h: tileH, n, d, ax, ay, r: 4, pw, ph: phaseCount(si), strip: true, stripKind
  };
  if (stripSy) m.stripSy = stripSy;
  return m;
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
  const meta = flag('--merge') ? loadExistingMeta() : {};
  const lookTypes = resolveLookTypeList();
  const outfitTypes = opt('--only') ? [] : MVP_OUTFIT_TYPES;
  const report = [];

  function importStripAppearance(appearance, { fileId, metaKey, outDir, walkCap }) {
    const { idle, move } = pickFrameGroups(appearance);
    const idleCopy = copyStrip(groupedDir, fileId, '-idle', idle, outDir);
    const walkCopy = copyStrip(groupedDir, fileId, '-walk', move, outDir);
    if (idleCopy?.err || walkCopy?.err) {
      return { ok: false, reason: idleCopy?.err || walkCopy?.err };
    }
    const walkN = Math.min(walkCap ?? 8, phaseCount(move));
    const walkTile = hybridWalkTile(idleCopy, walkCopy);
    const refH = Math.max(idleCopy.tileH, walkTile.h);
    const anchorIdle = groundAnchorFromStrip(idleCopy.dest, idleCopy.tileW, idleCopy.tileH, 2);
    const sameTile = idleCopy.tileW === walkTile.w && idleCopy.tileH === walkTile.h;
    const anchorWalk = sameTile
      ? anchorIdle
      : groundAnchorFromStrip(walkCopy.dest, walkTile.w, walkTile.h, 2, walkTile.stripSy);
    const layout = {
      pw: idle.pw || 4,
      ph: idle.ph || 1,
      pd: idle.pd || 1,
      layers: idle.layers || 1
    };
    /** Plantilla + máscara (outfits ph≥2 o monstruos con 2 capas en el cliente). */
    const composite = layout.layers >= 2;
    meta[metaKey] = {
      kind: metaKey.startsWith('out_') ? 'outfit' : 'lookType',
      tileW: walkCopy.tileW,
      tileH: walkCopy.tileH,
      pw: move.pw,
      drawMul: drawMul(refH),
      s: shadowSizeFromTile(refH),
      layout,
      composite,
      anchor: anchorWalk,
      a: {
        Idle: buildAnimMeta(idle, idleCopy.tileW, idleCopy.tileH, 1, 'idle', anchorIdle),
        Walk: buildAnimMeta(move, walkTile.w, walkTile.h, walkN, 'walk', anchorWalk, walkTile.stripSy),
        Attack: buildAnimMeta(move, walkTile.w, walkTile.h, Math.min(3, walkN), 'walk', anchorWalk, walkTile.stripSy),
        Shoot: buildAnimMeta(move, walkTile.w, walkTile.h, Math.min(3, walkN), 'walk', anchorWalk, walkTile.stripSy),
        Charge: buildAnimMeta(move, walkTile.w, walkTile.h, Math.min(2, walkN), 'walk', anchorWalk, walkTile.stripSy),
        Hurt: buildAnimMeta(idle, idleCopy.tileW, idleCopy.tileH, 1, 'idle', anchorIdle),
        Faint: buildAnimMeta(idle, idleCopy.tileW, idleCopy.tileH, 1, 'idle', anchorIdle)
      },
      idleStrip: idleCopy.fname,
      walkStrip: walkCopy.fname
    };
    return { ok: true, idle: idleCopy.fname, walk: walkCopy.fname, walkN, drawMul: meta[metaKey].drawMul };
  }

  for (const lookType of lookTypes) {
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

  for (const outfitType of outfitTypes) {
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
  console.log(`\n${okCreatures}/${lookTypes.length} criaturas · ${okOutfits}/${outfitTypes.length} outfits`);
  const ok = okCreatures === lookTypes.length && okOutfits === outfitTypes.length;
  process.exit(ok ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
