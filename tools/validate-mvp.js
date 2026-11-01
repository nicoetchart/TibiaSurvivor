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
load('js/data/creatures.js');
load('js/data/abilities.js');
load('js/data/vocations.js');
load('js/data/content-bridge.js');
load('js/data/neutral-roster.js');
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
okNum(cfg.ELITE_AT, 'ELITE_AT');
if (cfg.FINAL_BOSS_AT >= cfg.RUN_DURATION_SEC) err('FINAL_BOSS_AT must be < RUN_DURATION_SEC');
if (cfg.ELITE_AT >= cfg.FINAL_BOSS_AT) err('ELITE_AT must be < FINAL_BOSS_AT');
if (cfg.RUN_DURATION_SEC < 600 || cfg.RUN_DURATION_SEC > 900) err('RUN_DURATION_SEC outside 10–15 min band');

const enemies = G.CREATURES.filter(c => c.role === 'enemy');
const bosses = enemies.filter(c => c.boss);
if (enemies.length < 10 || enemies.length > 16) err(`enemy creature count ${enemies.length} (expect 10–15 types incl. boss)`);
if (bosses.length !== 1) err(`boss count ${bosses.length} (expect 1)`);

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
for (const a of G.Abilities.ALL) {
  if (abIds.has(a.id)) err(`duplicate ability ${a.id}`);
  abIds.add(a.id);
  if (!a.name) err(`ability ${a.id} missing name`);
  okNum(a.cd, `${a.id}.cd`);
  if (a.cd <= 0) err(`${a.id}.cd must be > 0`);
  okNum(a.dmg, `${a.id}.dmg`);
  if (!SLICE_TYPES.includes(a.type)) err(`${a.id} type ${a.type} outside slice set`);
}

const usedTypes = new Set(G.Abilities.ALL.map(a => a.type));
for (const t of SLICE_TYPES) {
  if (!usedTypes.has(t)) err(`slice damage type unused in abilities: ${t}`);
}

const elite = G.NeutralRoster.buildElite();
if (!elite || !elite.elite) err('buildElite failed');
const bossDef = G.NeutralRoster.BOSSES[0];
if (!bossDef) err('no final boss in roster');

if (errors.length) {
  console.error('validate-mvp FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-mvp OK:',
  `${enemies.length} enemy defs, ${G.Abilities.ALL.length} abilities,`,
  `run ${cfg.RUN_DURATION_SEC}s, boss @ ${cfg.FINAL_BOSS_AT}s, elite @ ${cfg.ELITE_AT}s`);
