/* CYC-12 — Save schema v2, cyclopedia migrate, no double kill credit on re-init. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { console, Math, Date, performance: { now: () => 1000 } };
sandbox.window = sandbox;
sandbox.G = sandbox.window.G = {};

function load(name) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), sandbox, { filename: name });
}

load('js/core/util.js');
load('js/data/cyclopedia-enums.js');
require('./load-creatures').registerCreatures(load);
load('js/data/bestiary.js');
load('js/data/cyclopedia-registry.js');
load('js/systems/daily-boost.js');
load('js/systems/bestiary.js');

const G = sandbox.G;
const errors = [];
function ok(cond, m) { if (!cond) errors.push(m); }

const MAX_SCHEMA = 2;
function acceptSave(s) {
  if (!s || typeof s !== 'object') return false;
  if (s.product != null && s.product !== 'tibiasurvivor') return false;
  if (typeof s.schemaVersion === 'number' && s.schemaVersion > MAX_SCHEMA) return false;
  return true;
}

ok(acceptSave({ product: 'tibiasurvivor', schemaVersion: 2 }), 'schema 2 accepted');
ok(acceptSave({ product: 'tibiasurvivor', schemaVersion: 1 }), 'schema 1 accepted (migrate on load)');
ok(!acceptSave({ product: 'tibiasurvivor', schemaVersion: 99 }), 'future schema rejected');

function migrateLikeDb(s) {
  if (s.bestiary == null) s.bestiary = G.Bestiary.createDefaultSave();
  G.Bestiary.migrateCyclopediaSave(s);
  G.Bestiary.sanitizeSave(s);
  s.schemaVersion = 2;
  s.product = 'tibiasurvivor';
  return s;
}

const legacy = {
  product: 'tibiasurvivor',
  schemaVersion: 1,
  name: 'legacy_player',
  coins: 10,
  stats: {},
  bestiary: G.Bestiary.createDefaultSave()
};
legacy.bestiary.currency = { earned: 33, spent: 7 };
legacy.bestiary.entries.cat = {
  kills: 12,
  rewarded: false,
  firstSeenAt: 1000,
  lastKilledAt: 2000,
  runsEncountered: 3
};
ok(!legacy.cyclopedia, 'legacy has no cyclopedia');
migrateLikeDb(legacy);
ok(legacy.schemaVersion === 2, 'save schema bumped to 2');
ok(legacy.cyclopedia && legacy.cyclopedia.version === 2, 'cyclopedia version 2');
ok(legacy.cyclopedia.charmPoints.earned === 33, 'currency migrated to charmPoints');
ok(legacy.cyclopedia.charmPoints.spent === 7, 'spent migrated');
ok(legacy.bestiary.entries.cat.kills === 12, 'bestiary entries preserved');
ok(legacy.cyclopedia.daily && legacy.cyclopedia.daily.dayUtc, 'daily block after migrate');
ok(legacy.cyclopedia._migratedAt, 'migration marker set');

const corrupt = {
  product: 'tibiasurvivor',
  schemaVersion: 1,
  name: 'bad',
  bestiary: G.Bestiary.createDefaultSave(),
  cyclopedia: 'corrupt-string'
};
migrateLikeDb(corrupt);
ok(typeof corrupt.cyclopedia === 'object' && corrupt.cyclopedia.version === 2, 'corrupt cyclopedia repaired');

const twice = { name: 'twice', bestiary: G.Bestiary.createDefaultSave() };
G.Bestiary.init(twice);
G.Bestiary.init(twice);
G.Bestiary.beginRun('run-a');
G.Bestiary.emit('enemy:defeated', {
  creatureId: 'cat',
  timestamp: Date.now(),
  runId: 'run-a'
});
ok(twice.bestiary.entries.cat && twice.bestiary.entries.cat.kills === 1,
  'double init: single kill credit (no duplicate listeners)');

migrateLikeDb(twice);
G.Bestiary.init(twice);
ok(twice.bestiary.entries.cat.kills === 1, 're-init after migrate keeps kills');

if (errors.length) {
  console.error('validate-cyclopedia-migration FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-cyclopedia-migration OK');