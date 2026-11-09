/* Heurísticas de ritmo bestiario (BST-10): sin simular partidas completas. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { console, window: {} };
sandbox.G = sandbox.window.G = {};

function load(name) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), sandbox, { filename: name });
}

load('js/core/util.js');
load('js/data/damage-types.js');
load('js/data/mvp-config.js');
load('js/data/creatures.js');
load('js/data/bestiary.js');
load('js/data/bestiary-tips.js');
load('js/data/neutral-roster.js');

const G = sandbox.G;
const errors = [];
const warn = [];
function err(m) { errors.push(m); }
function note(m) { warn.push(m); }

const cfg = G.MvpConfig;
const runSec = cfg.RUN_DURATION_SEC || 900;
/** Cota inferior de bajas totales del jugador en una run ~llena (heurística). */
const KILLS_PER_RUN = 220;
const catalog = G.Bestiary.listEntries();

const normalWeights = G.CREATURES
  .filter(c => c.role === 'enemy' && !c.boss && c.bestiary && c.bestiary.enabled);
const weightSum = normalWeights.reduce((a, c) => a + (c.spawnWeight || 1), 0);

const elite = G.Bestiary.getCatalogEntry('sentinel_elite');
const boss = G.Bestiary.getCatalogEntry('vault_warden');

for (const row of catalog) {
  const entry = G.Bestiary.getCatalogEntry(row.creatureId);
  const th = entry.thresholds;
  if (!th) { err(`${row.creatureId}: no thresholds`); continue; }

  let estKillsPerRun = 0;
  if (row.entryType === 'boss') {
    estKillsPerRun = 1;
  } else if (row.entryType === 'elite') {
    estKillsPerRun = Math.max(0.6, runSec / ((cfg.ELITE && cfg.ELITE.intervalSec) || 150));
  } else {
    const cr = G.CREATURE_BY_ID[row.creatureId];
    const w = cr ? (cr.spawnWeight || 1) : 0.5;
    estKillsPerRun = (w / Math.max(1, weightSum)) * KILLS_PER_RUN;
  }

  const runsToFinal = estKillsPerRun > 0 ? th.final / estKillsPerRun : Infinity;

  if (row.entryType === 'normal' && runsToFinal < 2.5) {
    note(`${row.creatureId}: ~${runsToFinal.toFixed(1)} runs to final (may be fast)`);
  }
  if (row.entryType === 'boss' && th.final > 8) {
    err(`boss ${row.creatureId}: final ${th.final} > 8 (at most ~1 kill/run)`);
  }
  if (row.entryType === 'elite' && th.final > 35) {
    note(`elite ${row.creatureId}: final ${th.final} may need many runs (~${runsToFinal.toFixed(0)})`);
  }
  if (runsToFinal > 90) {
    note(`${row.creatureId}: ~${runsToFinal.toFixed(0)} runs to final (heavy grind risk)`);
  }
  if (th.stage1 < 1 || th.stage2 <= th.stage1 || th.final <= th.stage2) {
    err(`${row.creatureId}: invalid threshold ordering`);
  }
}

if (!elite || !boss) err('missing elite or boss catalog entry');

const ptsPerHourAtBoss = boss.rewardPoints * (3600 / runSec);
if (ptsPerHourAtBoss > 120) note(`boss points/hour heuristic ${ptsPerHourAtBoss.toFixed(1)} (watch economy)`);

if (errors.length) {
  console.error('validate-bestiary-balance FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  if (warn.length) console.warn('notes:\n' + warn.map(w => '  - ' + w).join('\n'));
  process.exit(1);
}
console.log('validate-bestiary-balance OK:', catalog.length, 'entries,', warn.length, 'notes');
if (warn.length) warn.forEach(w => console.log('  note:', w));
