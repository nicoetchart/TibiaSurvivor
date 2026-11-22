/* Exporta los datos del juego a JSON para generar las páginas web (make_seo_pages.py).
 *   node tools/export_data.js  ->  tools/cache/gamedata.json
 * PSR-6: misma superficie que el boot Tibia (sin pokedex, moves, types ni sprites-meta). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const noop = () => {};
const fakeCtx = new Proxy({}, { get: () => noop });
const G = {};
const sandbox = {
  G, window: {}, console, Math, JSON, Date, Map, Set, Object, Array, Number, String, RegExp, Promise, Symbol, Infinity, NaN, isFinite, parseInt, parseFloat,
  location: { pathname: '/', protocol: 'file:' }, navigator: { language: 'es', languages: ['es'] }, localStorage: { getItem: () => 'es', setItem: noop },
  document: { documentElement: {}, createElement: () => ({ getContext: () => fakeCtx, width: 0, height: 0 }), addEventListener: noop, querySelector: () => null, body: {} },
  addEventListener: noop, matchMedia: () => ({ matches: false }), CanvasRenderingContext2D: function () {}, Image: function () {}, performance: { now: () => 0 },
  setTimeout: noop, setInterval: noop, requestAnimationFrame: noop
};
sandbox.window = sandbox;
vm.createContext(sandbox);
const load = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
const EN = {};
for (const f of ['js/core/util.js', 'js/core/i18n.js']) load(f);
const add = G.I18n.add;
G.I18n.add = d => { Object.assign(EN, d); add(d); };
const DATA = [
  'js/data/lang-en.js', 'js/core/settings.js', 'js/data/runtime-stubs.js',
  'js/data/damage-types.js', 'js/data/mvp-config.js', 'js/data/creatures-roster-ext.js', 'js/data/creatures.js',
  'js/data/vocations.js', 'js/data/abilities.js', 'js/data/master-sorcerer-spells.js',
  'js/data/master-sorcerer-passives.js', 'js/data/master-sorcerer-register.js', 'js/data/spell-runtime.js',
  'js/data/content-api.js', 'js/data/neutral-roster.js',
  'js/data/items.js', 'js/data/achievements.js', 'js/world/tiles.js', 'js/data/funding.js',
  'js/data/changelog.js'
];
for (const f of DATA) {
  try { load(f); } catch (e) { console.warn('aviso', f, e.message); }
}
const creatures = (G.CREATURES || []).filter(c => c && c.id !== 'wander_archmage' && (c.spawnWeight > 0 || c.role === 'elite' || c.boss))
  .map(c => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    family: c.family || '',
    difficulty: c.difficulty || '',
    role: c.role === 'elite' ? 'elite' : (c.boss ? 'boss' : (c.role || 'enemy')),
    weaknesses: c.weaknesses || [],
    resistances: c.resistances || [],
    immunities: c.immunities || []
  }));
const spells = (G.Abilities && G.Abilities.ALL)
  ? G.Abilities.ALL.map(a => ({
      id: a.id,
      name: a.name,
      type: a.element || a.type || 'energy',
      kind: a.kind || 'projectile',
      desc: a.desc || '',
      incantation: a.incantation || ''
    }))
  : [];
const runSec = (G.MvpConfig && G.MvpConfig.RUN_DURATION_SEC) || 900;
const changelog = (G.CHANGELOG || []).slice(0, 10).flatMap(e => {
  const title = e.title || ['', ''];
  const pool = [...(e.new || []), ...(e.chg || []), ...(e.fix || [])];
  return pool.slice(0, 2).map(([es, en]) => ({ d: e.d, topic: title, es, en }));
}).slice(0, 14);
const dt = G.DamageTypes;
const typeOrder = dt ? [...dt.ALL] : [];
const typeName = dt ? { ...dt.NAME } : {};
const typeColor = dt ? { ...dt.COLOR } : {};
const out = {
  brand: 'TibiaSurvivor',
  dex: [],
  creatures,
  spells,
  runDurationMin: Math.round(runSec / 60),
  runDurationSec: runSec,
  damageTypes: dt ? { all: dt.ALL, name: dt.NAME, color: dt.COLOR } : null,
  changelog,
  items: (G.Items.LIST || []).map(i => ({ id: i.id, name: i.name, desc: i.desc })),
  achievements: (G.AchDefs.LIST || []).map(a => ({ id: a.id, cat: a.cat, name: a.name, desc: a.desc, tier: a.tier, title: a.title || '', reward: a.reward || {} })),
  achCats: G.AchDefs.CATS || null,
  typeColor,
  typeName,
  typeOrder,
  arenas: Object.fromEntries(Object.entries(G.ARENA_THEMES || (G.Tiles && G.Tiles.ARENA_THEMES) || {}).filter(([k]) => k !== 'judgment').map(([k, v]) => [k, v.name])),
  funding: { kofi: G.Funding.kofi, sponsors: G.Funding.sponsors, costs: G.Funding.costs },
  en: EN
};
fs.mkdirSync(path.join(__dirname, 'cache'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'cache', 'gamedata.json'), JSON.stringify(out));
console.log('ok:', out.creatures.length, 'criaturas Tibia,', out.spells.length, 'hechizos,', out.items.length, 'objetos,',
  out.achievements.length, 'logros,', out.runDurationMin, 'min/run,', Object.keys(out.en).length, 'traducciones');