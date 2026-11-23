/* Valida definiciones numéricas del vertical slice MVP (Fase 6). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

const sandbox = { console, window: {} };
sandbox.window.G = sandbox.G = {};
sandbox.G = sandbox.window.G;

function load(name) {
  const p = path.join(ROOT, name);
  vm.runInNewContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: p });
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
load('js/data/abilities.js');
load('js/data/master-sorcerer-spells.js');
load('js/data/master-sorcerer-passives.js');
load('js/data/master-sorcerer-register.js');
load('js/data/vocations.js');
load('js/data/neutral-roster.js');
load('js/data/spell-runtime.js');
load('js/data/content-api.js');
load('js/data/runtime-stubs.js');
const G = sandbox.G;

const SLICE_TYPES = ['physical', 'fire', 'energy'];
const errors = [];

function err(msg) { errors.push(msg); }

function okNum(n, label) {
  if (!Number.isFinite(n)) err(`${label}: not finite (${n})`);
}

const cfg = G.MvpConfig;
okNum(cfg.RUN_DURATION_SEC, 'RUN_DURATION_SEC');
okNum(cfg.FINAL_BOSS_AT, 'FINAL_BOSS_AT');
const E = cfg.BANE_BOSS || cfg.ELITE;
if (!E || E.firstMinSec == null) err('BANE_BOSS.firstMinSec missing');
else {
  okNum(E.firstMinSec, 'BANE_BOSS.firstMinSec');
  okNum(E.firstMaxSec, 'BANE_BOSS.firstMaxSec');
  okNum(E.intervalSec, 'BANE_BOSS.intervalSec');
  if (E.firstMaxSec < E.firstMinSec) err('BANE_BOSS.firstMaxSec < firstMinSec');
  if (E.firstMinSec >= cfg.FINAL_BOSS_AT) err('BANE_BOSS.firstMinSec must be < FINAL_BOSS_AT');
}
if (cfg.FINAL_BOSS_AT >= cfg.RUN_DURATION_SEC) err('FINAL_BOSS_AT must be < RUN_DURATION_SEC');
if (cfg.RUN_DURATION_SEC < 600 || cfg.RUN_DURATION_SEC > 900) err('RUN_DURATION_SEC outside 10–15 min band');

const enemies = G.CREATURES.filter(c => c.role === 'enemy');
const bosses = enemies.filter(c => c.boss);
if (enemies.length < 10 || enemies.length > 160) err(`enemy creature count ${enemies.length} (expect 10–160 incl. boss/minion)`);
if (bosses.length !== 1) err(`boss count ${bosses.length} (expect 1)`);

if (G.Cyclopedia) {
  const catDef = G.Cyclopedia.getDefinition('cat');
  if (!catDef || catDef.id !== 'cat' || !Number.isFinite(catDef.hp)) err('Cyclopedia.getDefinition(cat) failed');
  const listed = G.Cyclopedia.listCreatures({ bestiaryOnly: true });
  if (listed.length < 140) err(`Cyclopedia listCreatures bestiary ${listed.length}`);
}
if (G.Bestiary) {
  const v = G.Bestiary.validate(false);
  if (!v.ok) v.issues.forEach(msg => err(`Bestiary: ${msg}`));
  const catalog = G.Bestiary.listEntries();
  if (catalog.length < 143) err(`Bestiary catalog ${catalog.length} (expect >= 143 incl. elite extra)`);
  const sections = new Set(catalog.map(e => e.section));
  if (!sections.has('bestiary') || !sections.has('bosstiary')) {
    err('Cyclopedia catalog missing bestiary or bosstiary section');
  }
  const bossCats = catalog.filter(e => e.section === 'bosstiary').map(e => e.bossCategory);
  if (bossCats.includes('bane') && bossCats.includes('nemesis')) { /* MVP: black_knight + orshabaal */ }
  else if (bossCats.length < 2) err('Expected two bosstiary bosses in MVP catalog');
  const playable = new Set(
    G.CREATURES.filter(c => c.role === 'enemy' && c.bestiary && c.bestiary.enabled).map(c => c.id)
  );
  playable.add('black_knight');
  const catalogIds = new Set(catalog.map(e => e.creatureId));
  for (const id of playable) {
    if (!catalogIds.has(id)) err(`Bestiary missing catalog entry for playable ${id}`);
  }
  for (const e of catalog) {
    if (!playable.has(e.creatureId)) err(`Bestiary orphan catalog entry ${e.creatureId}`);
    const full = G.Bestiary.getCatalogEntry(e.creatureId);
    for (const k of full.tipKeys || []) {
      if (!G.BESTIARY_TIPS || !G.BESTIARY_TIPS[k]) err(`missing BESTIARY_TIPS[${k}]`);
    }
    if (!full.description) err(`${e.creatureId} missing description`);
  }
}

const ids = new Set();
for (const c of G.CREATURES) {
  if (!c.id) err('creature missing id');
  if (ids.has(c.id)) err(`duplicate creature id ${c.id}`);
  ids.add(c.id);
  okNum(c.hp, `${c.id}.hp`);
  okNum(c.speed, `${c.id}.speed`);
  okNum(c.attack, `${c.id}.attack`);
  if (!c.name) err(`${c.id} missing name`);
  for (const t of c.damageTypes || []) {
    if (!G.DamageTypes.ALL.includes(t)) err(`${c.id} unknown damage type ${t}`);
  }
}

const abIds = new Set();
const isMvpAbility = a => !a.vocationId && a.kind !== 'passive' && String(a.id).startsWith('ts-');
for (const a of G.Abilities.ALL) {
  if (abIds.has(a.id)) err(`duplicate ability ${a.id}`);
  abIds.add(a.id);
  if (!a.name) err(`ability ${a.id} missing name`);
  if (!isMvpAbility(a)) continue;
  okNum(a.cd, `${a.id}.cd`);
  if (a.cd <= 0) err(`${a.id}.cd must be > 0`);
  okNum(a.dmg, `${a.id}.dmg`);
  if (!SLICE_TYPES.includes(a.type)) err(`${a.id} type ${a.type} outside slice set`);
}

const usedTypes = new Set(G.Abilities.ALL.filter(isMvpAbility).map(a => a.type));
for (const t of SLICE_TYPES) {
  if (!usedTypes.has(t)) err(`slice damage type unused in abilities: ${t}`);
}

const baneBoss = G.NeutralRoster.buildBaneBoss();
if (!baneBoss || !baneBoss.baneBoss || !baneBoss.boss) err('buildBaneBoss failed');
const bossDef = G.NeutralRoster.BOSSES[0];
if (!bossDef) err('no final boss in roster');

if (G.MvpConfig.SPAWN_MODE === 'hp_band') {
  const catC = G.CREATURE_BY_ID.cat;
  const spawned = G.NeutralRoster.defFor(catC);
  if (!spawned || spawned.hp !== 20) err(`hp_band: cat spawn hp ${spawned && spawned.hp} (expect 20 from data)`);
  for (const sec of [0, 120, 450, 780]) {
    const pick = G.NeutralRoster.pickAt(sec);
    if (!pick) err(`hp_band: pickAt(${sec}) returned null`);
    else {
      const h = G.NeutralRoster.hTarget(sec);
      const delta = G.NeutralRoster.bandDelta(sec) * 2.4;
      if (Math.abs(pick.hp - h) > delta + 2) {
        err(`hp_band: pickAt(${sec}) hp ${pick.hp} far from H_target ${h.toFixed(1)} (delta ${delta})`);
      }
    }
  }
  if (baneBoss.hp !== 1800) err(`hp_band: black knight bane boss hp ${baneBoss.hp} (expect 1800, Tibia Wiki)`);
  if (bossDef.hp !== 22500) err(`hp_band: orshabaal hp ${bossDef.hp} (expect 22500, Tibia Wiki)`);
}

if (G.DEX_BY && Object.keys(G.DEX_BY).length) err('PSR-3: G.DEX_BY must stay empty (no pokedex boot)');
if (!G.Moves || G.Moves.BY_ID !== G.Abilities.BY_ID) err('PSR-3: G.Moves must alias G.Abilities.BY_ID');
if (G.Content.roster() !== G.NeutralRoster) err('PSR-3: Content.roster must be NeutralRoster');

const bossVal = G.BossRegistry.validate();
if (!bossVal.ok) err('CYC-5: boss registry: ' + bossVal.issues.join('; '));
const orshKit = G.BossRegistry.getKit('orshabaal');
if (!orshKit || !orshKit.melee || !orshKit.melee.includes('slam')) err('CYC-5: orshabaal kit melee');
if (!orshKit.ranged || !orshKit.ranged.includes('beam')) err('CYC-5: orshabaal missing beam');
const bkKit = G.BossRegistry.getKit('black_knight');
if (!bkKit || bkKit.kit !== 'procedural') err('CYC-5: black_knight kit');
if (G.BossRegistry.resolveBossId({ creatureId: 'orshabaal' }, 99016) !== 'orshabaal') err('CYC-5: resolve orshabaal');

const bossEntries = G.Bestiary.listBossEntries();
if (!bossEntries || bossEntries.length < 2) err('CYC-6: expected 2 bosstiary entries');
const charmN = G.Bestiary.charmCatalog().filter(c => c.enabled !== false).length;
if (charmN < 6) err(`CYC-7: expected >= 6 charms, got ${charmN}`);
if (!G.Bestiary.BOSS_CATEGORY_INFO || !G.Bestiary.BOSS_CATEGORY_INFO.nemesis) err('CYC-6: boss category copy');

const catEntry = G.Bestiary.getCatalogEntry('cat');
if (!catEntry || catEntry.occurrence !== 'common') err(`CYC-4: cat occurrence ${catEntry && catEntry.occurrence}`);
if (G.Bestiary.stageLabel('stage_1', 'bestiary') !== 'Tracked') err('CYC-4: bestiary stage_1 label');
if (G.Bestiary.stageLabel('stage_1', 'bosstiary') !== 'Prowess') err('CYC-4: bosstiary stage_1 label');
const rev = catEntry && catEntry.reveal && catEntry.reveal.stage1;
if (!rev || !rev.includes('occurrence')) err('CYC-4: stage1 reveal missing occurrence');
const v = G.Bestiary.validate();
if (!v.ok) err('CYC-4: bestiary catalog validate failed: ' + v.issues.slice(0, 3).join('; '));
const msId = G.MasterSorcerer && G.MasterSorcerer.spellPoolIds && G.MasterSorcerer.spellPoolIds()[0];
if (!msId || !G.Moves.BY_ID[msId]) err('PSR-3: MS spells missing from G.Moves.BY_ID');

if (errors.length) {
  console.error('validate-mvp FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-mvp OK:',
  `${enemies.length} enemy defs, ${G.Abilities.ALL.length} abilities,`,
  `run ${cfg.RUN_DURATION_SEC}s, boss @ ${cfg.FINAL_BOSS_AT}s, elite ${E.firstMinSec}-${E.firstMaxSec}s then ~${E.intervalSec}s`);
