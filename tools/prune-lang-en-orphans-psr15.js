/* PSR-15: quita entradas lang-en cuya clave ES no aparece en el repo (MVP). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const LANG = path.join(ROOT, 'js', 'data', 'lang-en.js');
const DRY = process.argv.includes('--dry-run');

const SKIP_FILES = new Set(['js/data/lang-en.js', 'js/data/changelog.js', 'js/app.min.js']);
const CORPUS_EXTS = new Set(['.js', '.html', '.md', '.json', '.py']);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'cache') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else {
      const ext = path.extname(ent.name).toLowerCase();
      if (!CORPUS_EXTS.has(ext)) continue;
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (SKIP_FILES.has(rel)) continue;
      if (rel.startsWith('tools/cache/')) continue;
      files.push(full);
    }
  }
  return files;
}

function buildCorpus() {
  let corpus = '';
  for (const f of walk(ROOT)) {
    try { corpus += fs.readFileSync(f, 'utf8') + '\n'; } catch (e) { /* skip */ }
  }
  const ch = fs.readFileSync(path.join(ROOT, 'js', 'data', 'changelog.js'), 'utf8');
  for (const m of ch.matchAll(/\[\s*'((?:\\.|[^'\\])*)'/g)) corpus += '\n' + m[1].replace(/\\'/g, "'");
  return corpus;
}

function loadDict() {
  const G = { I18n: { add(d) { Object.assign(this._d, d); }, _d: {} } };
  vm.runInNewContext(fs.readFileSync(LANG, 'utf8'), { G, console }, { filename: 'lang-en.js' });
  return G.I18n._d;
}

function keyUsed(key, corpus) {
  if (corpus.includes(key)) return true;
  if (!key.includes('{x}')) return false;
  const parts = key.split('{x}').filter(p => p.length >= 3);
  if (!parts.length) return false;
  return parts.every(p => corpus.includes(p));
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const DROP_KEY_PREFIXES = [
  'Tu personalidad', 'Pregunta {x}', 'Selecciona un Pokémon', 'Los iniciales de todas',
  '¡Hay una pelea', 'Me meto a ayudar', 'Te encuentras una cartera', 'Mañana tienes un examen',
  'Alguien se burla', '¿Qué es lo más importante', 'El camino se divide', '¿Qué dicen de ti',
  'Tu día libre ideal', 'No te lo piensas', 'Mides cada paso', 'Actúas primero',
  'Derrota a {x} Pokémon', 'Ten 1 Pokémon', 'Profesor Pokémon', 'Haz 100 tiradas',
  'Tickets del gacha', 'Tu colección', '9 regiones ·', 'Tus 3 Pokémon', 'Filtrar por Pokémon',
  'Pokédex: todos', '966 Pokémon', 'Código Cero'
];

function keyDropped(key) {
  return DROP_KEY_PREFIXES.some(p => key.startsWith(p) || key.includes(p));
}

const corpus = buildCorpus();
const dict = loadDict();
const keys = Object.keys(dict);
const keep = {};
let removed = 0;
for (const [es, en] of Object.entries(dict)) {
  if (keyDropped(es)) { removed++; continue; }
  if (!keyUsed(es, corpus)) { removed++; continue; }
  keep[es] = en;
}

console.log(`lang-en keys: ${keys.length}, keeping: ${Object.keys(keep).length}, removing: ${removed}`);

if (DRY) {
  const unused = keys.filter(k => !Object.prototype.hasOwnProperty.call(keep, k));
  unused.slice(0, 30).forEach(k => console.log('  -', k.slice(0, 72)));
  if (unused.length > 30) console.log(`  ... +${unused.length - 30} more`);
  process.exit(unused.length ? 2 : 0);
}

const ordered = Object.keys(keep).sort((a, b) => keys.indexOf(a) - keys.indexOf(b));
const entries = ordered.map(k => `'${esc(k)}': '${esc(keep[k])}'`);

const lines = [
  '/* ============ lang-en.js — traducción al inglés ============',
  ' * Clave: el texto en español tal como sale en pantalla. {x} = hueco (nombre,',
  ' * número...). Ver js/core/i18n.js. Valores EN neutros para el MVP (PSR-15 poda).',
  ' */',
  'G.I18n.add({',
  '  // ---------------- claves referenciadas en runtime / SEO ----------------'
];
for (let i = 0; i < entries.length; i += 3) {
  const chunk = entries.slice(i, i + 3).join(', ');
  lines.push(`  ${chunk},`);
}
lines.push('});');
lines.push('');
const s = lines.join('\n');
vm.runInNewContext(s, { G: { I18n: { add() {} } }, console }, { filename: 'lang-en.js' });
fs.writeFileSync(LANG, s);
console.log('prune-lang-en-orphans OK');