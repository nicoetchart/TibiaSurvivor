/* CYC-11 — Cyclopedia authoring: CreatureDefinition, catalog cross-checks, fixture gate. */
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
load('js/data/damage-types.js');
load('js/data/mvp-config.js');
load('js/data/creatures.js');
load('js/data/bosses.js');
load('js/data/bestiary.js');
load('js/data/cyclopedia-enums.js');
load('js/data/cyclopedia-registry.js');
load('js/data/bestiary-tips.js');
load('js/data/neutral-roster.js');
load('js/systems/daily-boost.js');
load('js/data/content-api.js');
load('js/data/runtime-stubs.js');

const G = sandbox.G;
const errors = [];
const warnings = [];
function err(m) { errors.push(m); }
function warn(m) { warnings.push(m); }
function ok(cond, m) { if (!cond) err(m); }

const cycloVal = G.Cyclopedia.validate();
if (!cycloVal.ok) cycloVal.issues.forEach(i => err(`Cyclopedia: ${i}`));

const bestiaryVal = G.Bestiary.validate();
if (!bestiaryVal.ok) bestiaryVal.issues.forEach(i => err(`Bestiary: ${i}`));

const bossVal = G.BossRegistry.validate();
if (!bossVal.ok) bossVal.issues.forEach(i => err(`BossRegistry: ${i}`));

for (const row of G.Bestiary.listEntries()) {
  const def = G.Cyclopedia.getDefinition(row.creatureId);
  if (!def) err(`getDefinition missing for catalog ${row.creatureId}`);
  else if (def.bestiary && def.bestiary.section !== row.section) {
    err(`${row.creatureId}: catalog section ${row.section} vs cyclopedia ${def.bestiary.section}`);
  }
}
for (const row of G.Bestiary.listBossEntries()) {
  const def = G.Cyclopedia.getDefinition(row.creatureId);
  if (!def || !def.bestiary || def.bestiary.section !== 'bosstiary') {
    err(`boss catalog ${row.creatureId}: cyclopedia bosstiary mismatch`);
  }
}

const legacyBand = { min: 99001, max: 99099 };
for (const c of G.CREATURES) {
  if (!c || !c.id) continue;
  const def = G.Cyclopedia.getDefinition(c.id);
  if (!def) { err(`${c.id}: no cyclopedia definition`); continue; }
  if (c.legacyId != null && (c.legacyId < legacyBand.min || c.legacyId > legacyBand.max)) {
    warn(`${c.id}: legacyId ${c.legacyId} outside MVP band ${legacyBand.min}–${legacyBand.max}`);
  }
  if (def.spawn.weight === 0 && def.flags.boostEligible) {
    err(`${c.id}: spawn weight 0 with boostEligible (CREATURE_AND_BOSS_DATA_STANDARD)`);
  }
  if (c.role === 'enemy' && c.bestiary && c.bestiary.enabled) {
    if (!def.bestiary || !def.bestiary.enabled) err(`${c.id}: bestiary enabled in data but not in cyclopedia facade`);
  }
}

if (G.DailyBoost) {
  const cp = G.DailyBoost.eligiblePool();
  const bp = G.DailyBoost.eligibleBossPool();
  ok(cp.length >= 1, 'daily boost creature pool empty');
  ok(bp.length >= 1, 'daily boost boss pool empty');
  for (const id of cp) ok(G.DailyBoost.isCreatureEligible(id), `daily pool invalid creature ${id}`);
  for (const id of bp) ok(G.DailyBoost.isBossEligible(id), `daily pool invalid boss ${id}`);
  ok(!G.DailyBoost.isBossEligible('orshabaal'), 'nemesis must not be boss-boost eligible');
}

/** Fixture: invalid authoring row must surface in G.Bestiary.validate(). */
function fixtureIssuesDelta() {
  const before = new Set(G.Bestiary.validate().issues);
  G.CREATURES.push({
    id: '__cyclopedia_fixture_invalid__',
    legacyId: 99098,
    name: 'Fixture Invalid',
    role: 'enemy',
    hp: 0,
    speed: -3,
    attack: 1,
    spawnWeight: 2,
    difficulty: 'not_a_difficulty',
    damageTypes: ['physical'],
    behavior: 'chase',
    bestiary: {
      enabled: true,
      section: 'bestiary',
      bossCategory: 'nemesis',
      reveal: { stage1: [], stage2: [], stage3: [] }
    }
  });
  const after = G.Bestiary.validate();
  G.CREATURES.pop();
  return after.issues.filter(i => !before.has(i));
}

const fixtureDelta = fixtureIssuesDelta();
ok(fixtureDelta.length >= 2, 'fixture creature must trigger validation (got ' + fixtureDelta.length + ')');
ok(fixtureDelta.some(i => i.includes('__cyclopedia_fixture_invalid__')), 'fixture issues name the test id');
ok(fixtureDelta.some(i => /difficulty|hp|section|bossCategory/i.test(i)), 'fixture hits authoring rules');

if (warnings.length) {
  console.warn('validate-cyclopedia warnings:\n' + warnings.map(w => '  - ' + w).join('\n'));
}

if (errors.length) {
  console.error('validate-cyclopedia FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}

const nBest = G.Bestiary.listEntries().filter(e => e.section !== 'bosstiary').length;
const nBoss = G.Bestiary.listBossEntries().length;
console.log('validate-cyclopedia OK:',
  G.CREATURES.length, 'creatures,', nBest, 'bestiary +', nBoss, 'bosstiary catalog rows,',
  'fixture +' + fixtureDelta.length, 'issues');