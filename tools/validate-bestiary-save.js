/* Pruebas de saneamiento save.bestiary (BST-2). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { console, window: {} };
sandbox.window.G = sandbox.G = {};

function load(name) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), sandbox, { filename: name });
}

load('js/core/util.js');
load('js/data/damage-types.js');
load('js/data/mvp-config.js');
load('js/data/creatures.js');
load('js/data/bestiary.js');
load('js/systems/bestiary.js');

const G = sandbox.G;
let commitFail = false;
G.DB = {
  guest: false,
  commit: () => !commitFail
};
const errors = [];
function err(m) { errors.push(m); }
function ok(cond, m) { if (!cond) err(m); }

const def = G.Bestiary.createDefaultSave();
ok(def.version === 1, 'default version');
ok(def.currency.earned === 0, 'default earned');

let save = { name: 'test', bestiary: null };
G.Bestiary.init(save);
ok(save.bestiary && save.bestiary.version === 1, 'init creates block');
ok(G.Bestiary.getAvailablePoints() === 0, 'points zero');

save.bestiary.entries.foo = { kills: -3, rewarded: true, firstSeenAt: 'x', lastKilledAt: NaN, runsEncountered: 2.9 };
save.bestiary.currency = { earned: 5, spent: 99 };
save.bestiary.charms = { unlocked: ['wound', 'wound', 'nope'], equipped: ['wound', 'wound'] };
save.bestiary.upgrades = { pickup: -1, bad: 'x' };
save.bestiary.unlocks = ['a', 'a', 3];
G.Bestiary.sanitizeSave(save);
const foo = save.bestiary.entries.foo;
ok(foo.kills === 0 && foo.rewarded === false, 'negative kills reset');
ok(foo.runsEncountered === 2, 'runsEncountered floored');
ok(foo.firstSeenAt === null, 'invalid firstSeenAt');
ok(save.bestiary.currency.spent === 5, 'spent clamped to earned');
ok(save.bestiary.charms.unlocked.length === 1 && save.bestiary.charms.unlocked[0] === 'wound', 'charms unlocked');
ok(save.bestiary.charms.equipped.length === 1, 'equipped deduped');

save.bestiary.entries.unknown_keep = { kills: 1, rewarded: false, firstSeenAt: null, lastKilledAt: null, runsEncountered: 0 };
G.Bestiary.sanitizeSave(save);
ok(save.bestiary.entries.unknown_keep && save.bestiary.entries.unknown_keep.kills === 1, 'unknown id preserved');

const migrated = { product: 'tibiasurvivor', schemaVersion: 1, name: 'old', coins: 1, stats: {} };
G.Bestiary.sanitizeSave(migrated);
G.Bestiary.init(migrated);
ok(migrated.bestiary && migrated.bestiary.entries, 'migrate-like empty bestiary');

const merged = G.Bestiary.getEntry('cat');
ok(merged && merged.creatureId === 'cat' && merged.progress.kills === 0, 'getEntry merge');

const th = G.Bestiary.thresholdsForDifficulty('easy');
ok(G.Bestiary.deriveStage(0, th, false) === 'unknown', 'stage unknown');
ok(G.Bestiary.deriveStage(1, th, true) === 'discovered', 'stage discovered');
ok(G.Bestiary.deriveStage(25, th, true) === 'stage_1', 'stage 1 at threshold (Tibia easy)');
ok(G.Bestiary.deriveStage(500, th, true) === 'completed', 'stage completed (Tibia easy)');

G.Bestiary.init(save);
G.Bestiary.beginRun('test-run');
const fake = {
  id: 9001,
  dex: 99002,
  def: { creatureId: 'cat', dex: 99002 },
  boss: false,
  dead: true
};
ok(G.Bestiary.tryCreditDefeat(fake), 'credit once');
ok(fake._bestiaryCredited, 'bestiary credited flag');
ok(save.bestiary.entries.cat && save.bestiary.entries.cat.kills === 1, 'kill persisted');
ok(!G.Bestiary.tryCreditDefeat(fake), 'no double credit');
ok(G.Bestiary.getRunAdvances().length >= 1, 'run advance recorded');
G.Bestiary.endRun();

const bossPts = G.Bestiary.getCatalogEntry('demon').rewardPoints;
const saveRecon = { name: 'recon', bestiary: G.Bestiary.createDefaultSave() };
saveRecon.bestiary.entries.demon = {
  kills: 5,
  rewarded: false,
  firstSeenAt: 1,
  lastKilledAt: 1,
  runsEncountered: 0
};
G.Bestiary.init(saveRecon);
ok(saveRecon.bestiary.entries.demon.rewarded, 'reconcile grants completion');
ok(saveRecon.bestiary.currency.earned === bossPts, 'reconcile adds earned once');
G.Bestiary.init(saveRecon);
ok(saveRecon.bestiary.currency.earned === bossPts, 'no double grant on re-init');

const savePts = { name: 'pts', bestiary: null };
G.Bestiary.init(savePts);
G.Bestiary.beginRun('pts-run');
for (let i = 0; i < 5; i++) {
  G.Bestiary.tryCreditDefeat({
    id: 9100 + i,
    dex: 99016,
    def: { creatureId: 'demon', dex: 99016 },
    boss: true,
    dead: true
  });
}
ok(savePts.bestiary.entries.demon.kills === 5, 'boss kills to completion');
ok(savePts.bestiary.entries.demon.rewarded, 'boss entry rewarded');
ok(G.Bestiary.getRunPointsEarned() === bossPts, 'run points tracked');
ok(G.Bestiary.getAvailablePoints() === bossPts, 'available balance');

const saveBuy = { name: 'buy', bestiary: G.Bestiary.createDefaultSave() };
saveBuy.bestiary.currency.earned = 50;
saveBuy.bestiary.currency.spent = 0;
G.Bestiary.init(saveBuy);
const upg = G.Bestiary.GLOBAL_UPGRADES[0];
const c0 = G.Bestiary.upgradeCost(upg, 0);
ok(G.Bestiary.purchaseUpgrade(upg.id).ok, 'purchase upgrade ok');
ok(saveBuy.bestiary.upgrades[upg.id] === 1, 'upgrade level saved');
ok(G.Bestiary.getAvailablePoints() === 50 - c0, 'balance after purchase');
ok(!G.Bestiary.purchaseUpgrade(upg.id).ok || G.Bestiary.getAvailablePoints() >= 0, 'repeat purchase or funds');
commitFail = true;
const beforeSpent = saveBuy.bestiary.currency.spent;
const beforeLv = saveBuy.bestiary.upgrades[upg.id];
const fail = G.Bestiary.purchaseUpgrade(upg.id);
ok(!fail.ok && fail.reason === 'persist', 'rollback on persist fail');
ok(saveBuy.bestiary.currency.spent === beforeSpent && saveBuy.bestiary.upgrades[upg.id] === beforeLv, 'no partial purchase');
commitFail = false;
saveBuy.bestiary.currency.earned = 1000;
saveBuy.bestiary.currency.spent = 0;
saveBuy.bestiary.upgrades = {};
G.Bestiary.init(saveBuy);
const un = G.Bestiary.CONTENT_UNLOCKS[0];
ok(G.Bestiary.purchaseUnlock(un.id).ok, 'purchase unlock');
ok(G.Bestiary.hasUnlock(un.id), 'unlock stored');
ok(!G.Bestiary.purchaseUnlock(un.id).ok, 'no double unlock');
const bon = G.Bestiary.computeRunBonuses();
ok(bon.magnetMul >= 1 && bon.hpMul >= 1, 'compute bonuses defaults');
saveBuy.bestiary.upgrades.pickup_radius = 5;
G.Bestiary.sanitizeSave(saveBuy);
const bon2 = G.Bestiary.computeRunBonuses();
ok(bon2.magnetMul <= 1 + G.Bestiary.GLOBAL_UPGRADE_CAPS.maxPickupRadiusPct / 100 + 0.001, 'pickup cap respected');

const saveCharm = { name: 'charm', bestiary: G.Bestiary.createDefaultSave() };
saveCharm.bestiary.currency.earned = 100;
G.Bestiary.init(saveCharm);
const ch = G.Bestiary.CHARMS[0];
ok(G.Bestiary.unlockCharm(ch.id).ok, 'unlock charm');
ok(G.Bestiary.isCharmUnlocked(ch.id), 'charm unlocked');
ok(!G.Bestiary.unlockCharm(ch.id).ok, 'no double unlock');
ok(G.Bestiary.equipCharm(ch.id).ok, 'equip charm');
ok(G.Bestiary.isCharmEquipped(ch.id), 'charm equipped');
ok(!G.Bestiary.equipCharm('nope').ok, 'equip invalid');
ok(G.Bestiary.unequipCharm(ch.id).ok, 'unequip');
load('js/systems/bestiary-charms.js');
G.BestiaryCharms.beginRun();
ok(G.BestiaryCharms.getRunStats, 'charms runtime');

if (errors.length) {
  console.error('validate-bestiary-save FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-bestiary-save OK:', errors.length === 0 ? 'all checks passed' : errors.length);
