/* MS-9 — smoke de datos MS, niveles 1–5 y builds vertical slice (sin navegador). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { console, window: {} };
sandbox.window.G = sandbox.G = {};
const G = sandbox.G;

function load(rel) {
  const p = path.join(ROOT, rel);
  vm.runInNewContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: p });
}

load('js/core/util.js');
load('js/data/damage-types.js');
load('js/data/mvp-config.js');
load('js/data/moves.js');
load('js/data/abilities.js');
load('js/data/master-sorcerer-spells.js');
load('js/data/master-sorcerer-passives.js');
load('js/data/master-sorcerer-register.js');
load('js/data/vocations.js');
load('js/data/content-bridge.js');

const errors = [];
function fail(msg) { errors.push(msg); }

function okNum(n, label) {
  if (!Number.isFinite(n)) fail(`${label}: not finite (${n})`);
}

if (!G.MasterSorcerer.validate(true)) fail('MasterSorcerer.validate()');

const cfg = G.MvpConfig;
if (cfg.RUN_DURATION_SEC < 600 || cfg.RUN_DURATION_SEC > 960) {
  fail(`RUN_DURATION_SEC ${cfg.RUN_DURATION_SEC} outside ~10–15 min band`);
}
if (cfg.FINAL_BOSS_AT < 540 || cfg.FINAL_BOSS_AT > 660) {
  fail(`FINAL_BOSS_AT ${cfg.FINAL_BOSS_AT} expected ~600s (10 min)`);
}

const spellIds = G.MasterSorcerer.spellPoolIds();
const passiveIds = G.MasterSorcerer.passivePoolIds();

for (const id of spellIds) {
  if (!G.Moves.BY_ID[id]) fail(`spell ${id} missing from G.Moves.BY_ID after bridge`);
  let inst = G.Abilities.instance(id, 1);
  if (!inst) { fail(`instance failed ${id}`); continue; }
  okNum(inst.dmg, `${id}.dmg@1`);
  okNum(inst.cd, `${id}.cd@1`);
  for (let step = 0; step < 5; step++) {
    if (inst.lvl >= 5) break;
    if (!G.Abilities.levelUp(inst)) fail(`${id}: levelUp stopped early at ${inst.lvl}`);
  }
  if (inst.lvl !== 5) fail(`${id}: expected lvl 5, got ${inst.lvl}`);
  if (G.Abilities.levelUp(inst)) fail(`${id}: levelUp allowed beyond max`);
  okNum(inst.dmg, `${id}.dmg@5`);
  okNum(inst.cd, `${id}.cd@5`);
  if (G.MasterSorcerer.minCooldownFor({ cdMul: 1, msPassive: { attackSpeedMul: 0.25 }, vocationId: 'master_sorcerer' }, inst.cd) < G.MasterSorcerer.MIN_SPELL_COOLDOWN - 0.001) {
    fail(`${id}: cooldown below MIN_SPELL_COOLDOWN with max attack speed`);
  }
}

for (const id of passiveIds) {
  const pl = {
    vocationId: 'master_sorcerer',
    level: 12,
    passiveInst: {},
    msBaseMaxHp: 75,
    maxHp: 75,
    hp: 60,
    magicShield: 0,
    magicShieldMax: 0,
    cdMul: 1,
    moves: []
  };
  pl.passiveInst[id] = G.Abilities.instance(id, 1);
  G.MasterSorcerer.refreshPassives(pl);
  okNum(pl.maxHp, `${id} refresh maxHp`);
  okNum(pl.magicShieldMax, `${id} refresh shieldMax`);
  let p = pl.passiveInst[id];
  for (let step = 0; step < 5; step++) {
    if (p.lvl >= 5) break;
    G.Abilities.levelUp(p);
    G.MasterSorcerer.refreshPassives(pl);
  }
  if (p.lvl !== 5) fail(`passive ${id}: lvl ${p.lvl}`);
  if (G.Abilities.levelUp(p)) fail(`passive ${id}: levelUp beyond max`);
  okNum(pl.maxHp, `${id} maxHp@5`);
}

/** Recetas MS-9 (ids deben existir; no imponen hechizo único obligatorio en todas). */
const BUILDS = {
  fire: {
    spells: ['flame_strike', 'fire_wave', 'great_fire_wave', 'hells_core'],
    passives: ['master_of_flames']
  },
  energy: {
    spells: ['energy_strike', 'energy_wave', 'energy_beam', 'rage_of_the_skies'],
    passives: ['master_of_thunder']
  },
  death: {
    spells: ['flame_strike', 'death_strike'],
    passives: ['master_of_decay', 'aura_of_exposed_weakness']
  },
  hybrid: {
    spells: ['flame_strike', 'energy_strike', 'fire_wave', 'energy_beam'],
    passives: ['master_of_flames', 'master_of_thunder']
  },
  defensive: {
    spells: ['flame_strike', 'fire_wave'],
    passives: ['ultimate_healing', 'intense_healing', 'magic_shield', 'strong_haste']
  }
};

for (const [name, b] of Object.entries(BUILDS)) {
  for (const id of b.spells) {
    if (!G.Moves.BY_ID[id]) fail(`build ${name}: missing spell ${id}`);
  }
  for (const id of b.passives) {
    if (!G.Abilities.BY_ID[id]) fail(`build ${name}: missing passive ${id}`);
  }
  const pl = {
    vocationId: 'master_sorcerer',
    level: 14,
    passiveInst: {},
    msBaseMaxHp: 75,
    maxHp: 75,
    hp: 75,
    magicShield: 0,
    magicShieldMax: 0,
    cdMul: 1,
    moves: b.spells.map(sid => G.Moves.instance(sid, 3))
  };
  for (const id of b.passives) {
    pl.passiveInst[id] = G.Abilities.instance(id, 3);
  }
  G.MasterSorcerer.refreshPassives(pl);
  okNum(pl.maxHp, `build ${name} maxHp`);
  for (const m of pl.moves) {
    okNum(m.dmg * G.MasterSorcerer.damageMulForType(pl, m.type), `build ${name} ${m.id} dmg`);
  }
}

const coveredSpells = new Set();
for (const b of Object.values(BUILDS)) for (const id of b.spells) coveredSpells.add(id);
const neverMandatory = spellIds.filter(id => {
  const inAll = Object.values(BUILDS).every(b => b.spells.includes(id));
  return inAll;
});
if (neverMandatory.length) {
  fail(`spells in ALL builds (too mandatory): ${neverMandatory.join(', ')}`);
}
const uncovered = spellIds.filter(id => !coveredSpells.has(id));
if (uncovered.length) {
  console.log('ms9 note: spells valid via pool but not in preset builds:', uncovered.join(', '));
}

if (errors.length) {
  console.error('ms9-smoke FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('ms9-smoke OK:',
  `${spellIds.length} spells, ${passiveIds.length} passives,`,
  `${Object.keys(BUILDS).length} build recipes,`,
  `run ${cfg.RUN_DURATION_SEC}s / boss ${cfg.FINAL_BOSS_AT}s`);
