/* CYC-7 — charm catalog + runtime smoke (boss cap, triggers). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { console, window: {}, performance: { now: () => 1000 } };
sandbox.window.G = sandbox.G = {};

function load(name) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), sandbox, { filename: name });
}

load('js/core/util.js');
load('js/data/cyclopedia-enums.js');
require('./load-creatures').registerCreatures(load);
load('js/data/cyclopedia-registry.js');
load('js/data/bestiary.js');
load('js/systems/bestiary-charms.js');

const G = sandbox.G;
const errors = [];
function err(m) { errors.push(m); }
function ok(cond, m) { if (!cond) err(m); }

const enabled = G.Bestiary.charmCatalog().filter(c => c.enabled !== false);
ok(enabled.length >= 6 && enabled.length <= 12, 'enabled charm count 6–12');
const ids = new Set();
for (const c of enabled) {
  if (ids.has(c.id)) err('duplicate charm id ' + c.id);
  ids.add(c.id);
  if (!G.Bestiary.CHARM_EFFECT_KINDS.has(c.effect.kind)) err(c.id + ': bad effect');
  ok(c.noRecursion === true, c.id + ': noRecursion');
  ok(c.bestiaryClass === 'wilderness' || G.CyclopediaEnums.isValid('BESTIARY_CLASS', c.bestiaryClass), c.id + ': class');
}

const v = G.Bestiary.validate();
ok(v.ok, 'bestiary validate: ' + (v.issues[0] || ''));

const normBonus = G.BestiaryCharms.simulateBossWoundBonus(200, false, false);
const bossBonus = G.BestiaryCharms.simulateBossWoundBonus(200, false, true);
ok(bossBonus < normBonus, 'wound boss cap lowers bonus vs normal');
ok(bossBonus === Math.max(1, Math.round(200 * 0.0025)), 'wound boss cap value');

const catClass = G.BestiaryCharms.targetBestiaryClass({ def: { creatureId: 'cat' } });
ok(catClass === 'mammal' || catClass === 'unknown', 'target class resolves');

if (errors.length) {
  console.error('validate-charms FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-charms OK:', enabled.length, 'charms');