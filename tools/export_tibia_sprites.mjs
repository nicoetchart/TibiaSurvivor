#!/usr/bin/env node
/**
 * Exporta PNG + meta JS desde el cliente Tibia local (NO versionar assets del cliente).
 *
 * Cliente moderno (12+): packages/Tibia/assets/{catalog-content.json, appearances-*.dat, sprites-*.bmp.lzma}
 * Cliente legacy: Tibia.dat + Tibia.spr en la misma carpeta.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'tibia');
const MAP = path.join(ROOT, 'js', 'data', 'tibia-sprite-map.js');
const LOCAL_CFG = path.join(ROOT, 'tools', 'tibia-client.local.json');

const DEFAULT_LAUNCHER = process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA || '', 'Tibia')
  : '';

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

function readLocalClient() {
  try {
    const j = JSON.parse(fs.readFileSync(LOCAL_CFG, 'utf8'));
    return j.clientRoot || j.launcher || null;
  } catch {
    return null;
  }
}

/** Launcher → packages/Tibia; si ya es package, devolver tal cual. */
function resolveClientRoot(input) {
  if (!input) input = readLocalClient() || DEFAULT_LAUNCHER;
  if (!input) return null;
  const norm = path.resolve(input);
  const pkg = path.join(norm, 'packages', 'Tibia');
  if (fs.existsSync(path.join(pkg, 'assets', 'catalog-content.json'))) return pkg;
  if (fs.existsSync(path.join(norm, 'assets', 'catalog-content.json'))) return norm;
  const dat = path.join(norm, 'Tibia.dat');
  if (fs.existsSync(dat)) return norm;
  return norm;
}

function clientVersion(pkgRoot) {
  const vf = path.join(pkgRoot, 'package.json.version');
  if (fs.existsSync(vf)) return fs.readFileSync(vf, 'utf8').trim();
  return null;
}

function probeModern(pkgRoot) {
  const catalogPath = path.join(pkgRoot, 'assets', 'catalog-content.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const appearances = catalog.find(e => e.type === 'appearances');
  const sprites = catalog.filter(e => e.type === 'sprite');
  const appsFile = appearances && path.join(pkgRoot, 'assets', appearances.file);
  const appsOk = appsFile && fs.existsSync(appsFile);
  const lzmaSheets = sprites.filter(s => /\.lzma$/i.test(s.file)).length;
  const bmpSheets = sprites.filter(s => !/\.lzma$/i.test(s.file)).length;
  return {
    kind: 'modern',
    pkgRoot,
    version: clientVersion(pkgRoot),
    catalogPath,
    appearances: appearances ? appearances.file : null,
    appearancesBytes: appsOk ? fs.statSync(appsFile).size : 0,
    spriteSheets: sprites.length,
    lzmaSheets,
    bmpSheets
  };
}

function probeLegacy(root) {
  const dat = path.join(root, 'Tibia.dat');
  const spr = path.join(root, 'Tibia.spr');
  if (!fs.existsSync(dat) || !fs.existsSync(spr)) return null;
  return {
    kind: 'legacy',
    pkgRoot: root,
    version: opt('--version') || 'legacy',
    dat,
    spr,
    datBytes: fs.statSync(dat).size,
    sprBytes: fs.statSync(spr).size
  };
}

function probe(input) {
  const root = resolveClientRoot(input);
  if (!root) return { error: 'Sin ruta de cliente' };
  const modern = probeModern(root);
  if (modern.appearances) return modern;
  const legacy = probeLegacy(root);
  if (legacy) return legacy;
  const catalogTry = path.join(root, 'assets', 'catalog-content.json');
  return {
    error: 'Cliente no reconocido',
    pkgRoot: root,
    hint: fs.existsSync(catalogTry)
      ? 'catalog-content.json existe pero falta appearances en el JSON'
      : 'Usa la carpeta del launcher (%LocalAppData%\\Tibia) o packages\\Tibia'
  };
}

if (flag('--help') || flag('-h')) {
  console.log(`
export_tibia_sprites.mjs — Tibia → assets/tibia/

  --client <dir>   Launcher (%LocalAppData%\\Tibia) o packages/Tibia
  --probe          Detecta tipo de cliente y versión (sin exportar)
  --verify         lookTypes del mapa + manifest del repo
  --dry-run        Rutas de salida
  --save-local     Guarda --client en tools/tibia-client.local.json (gitignored)

Decoder de criaturas (recomendado, cliente 15.x):
  https://github.com/tilaven/tibia-sprites-exporter
  extract + group sobre: <cliente>/assets/

Ver docs/TIBIA_SPRITES_BASELINE.md
`);
  process.exit(0);
}

if (flag('--save-local')) {
  const client = opt('--client') || DEFAULT_LAUNCHER;
  if (!client) {
    console.error('Indica --client');
    process.exit(1);
  }
  fs.writeFileSync(LOCAL_CFG, JSON.stringify({
    launcher: client,
    clientRoot: resolveClientRoot(client),
    savedAt: new Date().toISOString()
  }, null, 2) + '\n');
  console.log('Guardado:', LOCAL_CFG);
  process.exit(0);
}

if (flag('--probe')) {
  const info = probe(opt('--client'));
  console.log(JSON.stringify(info, null, 2));
  process.exit(info.error ? 1 : 0);
}

if (flag('--verify')) {
  const mapSrc = fs.readFileSync(MAP, 'utf8');
  const looks = [...mapSrc.matchAll(/lookType:\s*(\d+)/g)].map(m => +m[1]);
  console.log('lookTypes en mapa:', looks.length, looks.join(', '));
  const manifest = path.join(OUT, 'manifest.json');
  if (!fs.existsSync(manifest)) {
    console.warn('Sin manifest.json en assets/tibia — aún no hay export.');
    process.exit(1);
  }
  console.log('manifest:', fs.readFileSync(manifest, 'utf8'));
  process.exit(0);
}

if (flag('--dry-run')) {
  const client = resolveClientRoot(opt('--client'));
  const info = client ? probe(client) : null;
  console.log('Salida repo:', OUT);
  console.log('Cliente resuelto:', client || '(no)');
  if (info && !info.error) console.log('Tipo:', info.kind, 'versión:', info.version || '?');
  process.exit(0);
}

const client = resolveClientRoot(opt('--client'));
if (!client) {
  console.error('Indica --client o crea tools/tibia-client.local.json');
  process.exit(1);
}

const info = probe(client);
if (info.error) {
  console.error(info.error);
  if (info.hint) console.error(info.hint);
  console.error('Ruta probada:', info.pkgRoot);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'creatures'), { recursive: true });

if (info.kind === 'modern') {
  console.log(`
Cliente moderno CipSoft detectado
  Ruta:     ${info.pkgRoot}
  Versión:  ${info.version || 'desconocida'}
  Sprites:  ${info.spriteSheets} hojas (${info.lzmaSheets} .lzma)
  Appearance: ${info.appearances} (${info.appearancesBytes} bytes)

El export nativo en Node aún no decodifica appearances protobuf.
Opción A (recomendada): tibia-sprites-exporter → copiar PNG agrupados a assets/tibia/creatures/
Opción B: Object Builder con assets ya extraídos

Ejecuta:
  node tools/export_tibia_sprites.mjs --probe --client "${opt('--client') || client}"
  node tools/export_tibia_sprites.mjs --save-local --client "${opt('--client') || DEFAULT_LAUNCHER}"
`);
  process.exit(2);
}

console.log(`
Cliente legacy .dat/.spr
  ${info.dat}
  ${info.spr}

Usa Object Builder o opentibiaunity-datspr-converter hacia catalog moderno,
o implementa lectura spr aquí.
`);
process.exit(2);
