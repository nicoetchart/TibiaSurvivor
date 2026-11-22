/* CYC-11 — Inventory of cyclopedia-ready creatures (stdout). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { console, Math, Date };
sandbox.window = sandbox;
sandbox.G = sandbox.window.G = {};

function load(name) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), sandbox, { filename: name });
}

load('js/core/util.js');
load('js/data/damage-types.js');
load('js/data/mvp-config.js');
require('./load-creatures').registerCreatures(load);
load('js/data/bosses.js');
load('js/data/bestiary.js');
load('js/data/cyclopedia-enums.js');
load('js/data/cyclopedia-registry.js');
load('js/data/bestiary-tips.js');
load('js/systems/daily-boost.js');

const G = sandbox.G;
const rows = [];

function pad(s, n) {
  s = String(s == null ? '' : s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

for (const c of G.CREATURES) {
  if (!c || !c.id) continue;
  const def = G.Cyclopedia.getDefinition(c.id);
  const cat = G.Bestiary.getCatalogEntry(c.id);
  const section = cat ? cat.section : (c.bestiary && c.bestiary.enabled ? '—' : '');
  const bestiaryOn = !!(c.bestiary && c.bestiary.enabled);
  const weight = c.spawnWeight == null ? '—' : c.spawnWeight;
  const occ = c.occurrence || (cat && cat.occurrence) || (def && def.occurrence) || '—';
  const boost = def && def.flags ? (def.flags.boostEligible ? 'yes' : 'no') : '—';
  const bossCat = cat && cat.bossCategory ? cat.bossCategory : '—';
  rows.push({
    id: c.id,
    name: c.name || '',
    role: c.role || '—',
    section: section || (bestiaryOn ? '?' : 'off'),
    hp: c.hp,
    weight,
    occurrence: occ,
    boost,
    bossCat,
    legacy: c.legacyId
  });
}

rows.sort((a, b) => a.id.localeCompare(b.id));

const header = [
  pad('id', 20),
  pad('name', 18),
  pad('role', 8),
  pad('section', 11),
  pad('hp', 5),
  pad('weight', 7),
  pad('occurrence', 12),
  pad('boost', 6),
  pad('bossCat', 9),
  'legacy'
].join(' ');

console.log('# Cyclopedia content report\n');
console.log(header);
console.log('-'.repeat(header.length));
for (const r of rows) {
  console.log([
    pad(r.id, 20),
    pad(r.name.slice(0, 18), 18),
    pad(r.role, 8),
    pad(r.section, 11),
    pad(r.hp, 5),
    pad(String(r.weight), 7),
    pad(r.occurrence, 12),
    pad(r.boost, 6),
    pad(r.bossCat, 9),
    r.legacy
  ].join(' '));
}

const tallies = { bestiary: 0, bosstiary: 0, off: 0, other: 0 };
for (const r of rows) {
  if (r.section === 'bestiary') tallies.bestiary++;
  else if (r.section === 'bosstiary') tallies.bosstiary++;
  else if (r.section === 'off') tallies.off++;
  else tallies.other++;
}
console.log('\nTotals:', tallies.bestiary, 'bestiary,', tallies.bosstiary, 'bosstiary,',
  tallies.off, 'bestiary off,', tallies.other, 'other');
if (G.DailyBoost) {
  console.log('Daily boost pools:', G.DailyBoost.eligiblePool().length, 'creatures,',
    G.DailyBoost.eligibleBossPool().length, 'bosses');
}