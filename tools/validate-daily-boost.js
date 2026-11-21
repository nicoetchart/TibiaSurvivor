/* CYC-8 — daily boosted creature rotation (UTC, history, clock back). */
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
load('js/data/creatures.js');
load('js/data/cyclopedia-registry.js');
load('js/data/bestiary.js');
load('js/systems/daily-boost.js');
load('js/systems/bestiary.js');

const G = sandbox.G;
const D = G.DailyBoost;
const errors = [];
function err(m) { errors.push(m); }
function ok(cond, m) { if (!cond) err(m); }

ok(D, 'G.DailyBoost exists');
const pool = D.eligiblePool();
ok(pool.length >= 1, 'eligible pool non-empty');

const saveA = { name: 'acct-a', created: 111 };
const saveB = { name: 'acct-b', created: 222 };
const day = '20261121';

const bossPool = D.eligibleBossPool();
ok(bossPool.length >= 1, 'boss pool non-empty');
ok(!D.isBossEligible('orshabaal'), 'DB09 nemesis excluded');

const pickA1 = D.pickCreature(day, D.accountSeed(saveA), pool, []);
const pickA2 = D.pickCreature(day, D.accountSeed(saveA), pool, []);
ok(pickA1 === pickA2, 'DB01 deterministic same day/seed');
const pickB = D.pickCreature(day, D.accountSeed(saveB), pool, []);
ok(pool.includes(pickA1), 'DB01 pick in pool');

const bossA = D.pickBoss(day, D.accountSeed(saveA), bossPool, []);
const bossA2 = D.pickBoss(day, D.accountSeed(saveA), bossPool, []);
ok(bossA === bossA2, 'boss pick deterministic');
ok(bossPool.includes(bossA), 'boss in pool');
if (pool.includes(bossA)) ok(bossA !== pickA1 || pool.length === 1, 'boss rotation independent when possible');

const day2 = '20261122';
const hist = [pickA1];
const pickNext = D.pickCreature(day2, D.accountSeed(saveA), pool, hist);
ok(pickNext !== pickA1 || pool.length === 1, 'DB03 history avoids repeat when possible');

const corrupt = D.sanitizeDailyBlock({ dayUtc: 'bad', creatureId: 'nope', historyCreatures: [1, 'rat', 'rat', null] }, new Set(pool));
ok(corrupt.dayUtc === null, 'DB08 corrupt dayUtc');
ok(!corrupt.creatureId || pool.includes(corrupt.creatureId), 'DB08 creature clamped');

const badBoss = pool.find(id => {
  const c = G.CREATURE_BY_ID[id];
  return c && c.boss;
});
if (badBoss) ok(!D.isCreatureEligible(badBoss), 'DB06 boss excluded');
for (const id of pool) ok(D.isCreatureEligible(id), 'DB05 pool entries eligible');

const cyclo = G.Bestiary.createDefaultCyclopedia();
ok(cyclo.daily && cyclo.daily.historyCreatures, 'cyclopedia daily block');

const save = { name: 'z', bestiary: G.Bestiary.createDefaultSave(), cyclopedia: cyclo };
const now = new Date(Date.UTC(2026, 10, 21, 12, 0, 0));
G.Bestiary.sanitizeSave(save);
ok(save.cyclopedia.daily.dayUtc === D.utcDayString(now), 'sync sets utc day');
ok(save.cyclopedia.daily.creatureId, 'creature id set');
ok(save.cyclopedia.daily.bossId && D.isBossEligible(save.cyclopedia.daily.bossId), 'boss id set and eligible');
ok(save.cyclopedia.daily.bossId !== 'orshabaal', 'DB09 never nemesis boss');

save.cyclopedia.daily.dayUtc = '20261125';
save.cyclopedia.daily.creatureId = pickA1;
const back = new Date(Date.UTC(2026, 10, 20, 12, 0, 0));
D.syncSave(save, back);
ok(save.cyclopedia.daily.dayUtc === '20261125', 'DB04 clock back keeps stored day');

const forward = new Date(Date.UTC(2026, 10, 26, 12, 0, 0));
D.syncSave(save, forward);
ok(save.cyclopedia.daily.dayUtc === D.utcDayString(forward), 'DB02 day change rolls');

const mulXp = D.scaleXp(save.cyclopedia.daily.creatureId, 10);
ok(mulXp >= 11, 'DB07 xp mul visible');

if (errors.length) {
  console.error('validate-daily-boost FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-daily-boost OK:', pool.length, 'creatures,', bossPool.length, 'bosses');