/* ============ systems/bestiary.js — Bestiario: persistencia y conteo (BST-2/3) ============
 * Eventos de dominio vía G.Bestiary.on/emit (no confundir con G.Events = hordas).
 */
(() => {
  if (!G.Bestiary) return;

  const SAVE_VERSION = 1;
  const CHARM_EQUIP_SLOTS = 1;

  let profile = null;
  let runId = null;
  let runAdvances = [];
  let runPointsEarned = 0;
  const listeners = new Map();

  function on(type, fn) {
    if (typeof fn !== 'function') return;
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
  }

  function off(type, fn) {
    const set = listeners.get(type);
    if (set) set.delete(fn);
  }

  function emit(type, payload) {
    const set = listeners.get(type);
    if (set) for (const fn of set) { try { fn(payload); } catch (e) { console.warn('[Bestiary]', type, e); } }
  }

  function defaultEntry() {
    return {
      kills: 0,
      rewarded: false,
      firstSeenAt: null,
      lastKilledAt: null,
      runsEncountered: 0
    };
  }

  function createDefaultSave() {
    return {
      version: SAVE_VERSION,
      entries: {},
      currency: { earned: 0, spent: 0 },
      charms: { unlocked: [], equipped: [] },
      upgrades: {},
      unlocks: []
    };
  }

  function intNonNeg(v) {
    if (!Number.isFinite(+v) || +v < 0) return 0;
    return Math.floor(+v);
  }

  function tsOrNull(v) {
    if (v == null) return null;
    const n = +v;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  function charmIds() {
    const set = new Set();
    for (const c of G.Bestiary.CHARMS || []) set.add(c.id);
    return set;
  }

  function ensureBlock(save) {
    if (!save || typeof save !== 'object') return null;
    if (!save.bestiary || typeof save.bestiary !== 'object') save.bestiary = createDefaultSave();
    const b = save.bestiary;
    if (b.version == null) b.version = SAVE_VERSION;
    if (!b.entries || typeof b.entries !== 'object') b.entries = {};
    if (!b.currency || typeof b.currency !== 'object') b.currency = { earned: 0, spent: 0 };
    if (!b.charms || typeof b.charms !== 'object') b.charms = { unlocked: [], equipped: [] };
    if (!Array.isArray(b.charms.unlocked)) b.charms.unlocked = [];
    if (!Array.isArray(b.charms.equipped)) b.charms.equipped = [];
    if (!b.upgrades || typeof b.upgrades !== 'object') b.upgrades = {};
    if (!Array.isArray(b.unlocks)) b.unlocks = [];
    return b;
  }

  function sanitizeEntry(raw) {
    const e = raw && typeof raw === 'object' ? raw : {};
    const kills = intNonNeg(e.kills);
    let rewarded = !!e.rewarded;
    if (kills <= 0) rewarded = false;
    return {
      kills,
      rewarded,
      firstSeenAt: tsOrNull(e.firstSeenAt),
      lastKilledAt: tsOrNull(e.lastKilledAt),
      runsEncountered: intNonNeg(e.runsEncountered)
    };
  }

  /** Sanea save.bestiary; conserva IDs desconocidos en entries. */
  function sanitizeSave(save) {
    const b = ensureBlock(save);
    if (!b) return;
    b.version = SAVE_VERSION;
    const entries = {};
    for (const id of Object.keys(b.entries || {})) {
      if (typeof id !== 'string' || !id) continue;
      entries[id] = sanitizeEntry(b.entries[id]);
    }
    b.entries = entries;

    let earned = intNonNeg(b.currency.earned);
    let spent = intNonNeg(b.currency.spent);
    if (spent > earned) spent = earned;
    b.currency = { earned, spent };

    const validCharms = charmIds();
    const unlocked = [];
    const seenU = new Set();
    for (const id of b.charms.unlocked) {
      if (typeof id !== 'string' || !validCharms.has(id) || seenU.has(id)) continue;
      const cdef = G.Bestiary.charmById(id);
      if (!cdef || cdef.enabled === false) continue;
      seenU.add(id);
      unlocked.push(id);
    }
    const equipped = [];
    const seenE = new Set();
    for (const id of b.charms.equipped) {
      if (typeof id !== 'string' || !seenU.has(id) || seenE.has(id)) continue;
      if (equipped.length >= CHARM_EQUIP_SLOTS) break;
      seenE.add(id);
      equipped.push(id);
    }
    b.charms = { unlocked, equipped };

    const upgradeDefs = new Map((G.Bestiary.GLOBAL_UPGRADES || []).map(u => [u.id, u]));
    const unlockDefs = new Set((G.Bestiary.CONTENT_UNLOCKS || []).map(u => u.id));
    const upgrades = {};
    for (const uid of Object.keys(b.upgrades || {})) {
      if (typeof uid !== 'string') continue;
      const def = upgradeDefs.get(uid);
      if (!def) continue;
      upgrades[uid] = Math.min(intNonNeg(b.upgrades[uid]), def.maxLevel);
    }
    b.upgrades = upgrades;

    const unlocks = [];
    const seenL = new Set();
    for (const id of b.unlocks) {
      if (typeof id !== 'string' || !id || seenL.has(id) || !unlockDefs.has(id)) continue;
      seenL.add(id);
      unlocks.push(id);
    }
    b.unlocks = unlocks;
  }

  function init(save) {
    if (!save) {
      profile = null;
      return;
    }
    ensureBlock(save);
    sanitizeSave(save);
    profile = save;
    reconcilePendingRewards(true);
  }

  function flush(urgent = false) {
    if (!profile || !G.DB || G.DB.guest) return false;
    sanitizeSave(profile);
    return G.DB.commit(urgent);
  }

  function progressBlock() {
    if (!profile) return null;
    return ensureBlock(profile);
  }

  function ensureProgressEntry(creatureId) {
    const b = progressBlock();
    if (!b || !creatureId) return null;
    if (!b.entries[creatureId]) b.entries[creatureId] = defaultEntry();
    return b.entries[creatureId];
  }

  /** Progreso persistido de una criatura (null si id vacío). */
  function getProgressEntry(creatureId) {
    const b = progressBlock();
    if (!b || !creatureId) return null;
    const e = b.entries[creatureId];
    if (!e) return null;
    return Object.assign({}, e);
  }

  /** Catálogo + progreso (solo lectura). */
  const getCatalogEntry = G.Bestiary.getCatalogEntry;

  function getEntry(creatureId) {
    const catalog = getCatalogEntry(creatureId);
    if (!catalog) return null;
    const prog = getProgressEntry(creatureId) || defaultEntry();
    return Object.assign({}, catalog, { progress: prog });
  }

  function listProgressEntries() {
    const b = progressBlock();
    if (!b) return [];
    return Object.keys(b.entries).map(creatureId => ({
      creatureId,
      progress: Object.assign({}, b.entries[creatureId])
    }));
  }

  function getAvailablePoints() {
    const b = progressBlock();
    if (!b) return 0;
    return Math.max(0, intNonNeg(b.currency.earned) - intNonNeg(b.currency.spent));
  }

  function getUpgradeLevel(upgradeId) {
    const b = progressBlock();
    if (!b || !upgradeId) return 0;
    return intNonNeg(b.upgrades[upgradeId]);
  }

  function hasUnlock(unlockId) {
    const b = progressBlock();
    if (!b || !unlockId) return false;
    return b.unlocks.includes(unlockId);
  }

  /** Totales efectivos de mejoras (con topes globales). */
  function computeRunBonuses() {
    const b = progressBlock();
    const caps = G.Bestiary.GLOBAL_UPGRADE_CAPS || {};
    if (!b) {
      return { magnetMul: 1, hpMul: 1, spdMul: 1, rerollBonus: 0 };
    }
    let pickupPct = 0;
    let hpPct = 0;
    let spdPct = 0;
    let reroll = 0;
    for (const def of G.Bestiary.GLOBAL_UPGRADES || []) {
      const lv = Math.min(intNonNeg(b.upgrades[def.id]), def.maxLevel);
      const pl = def.perLevel || {};
      if (pl.pickupRadiusPct) pickupPct += lv * pl.pickupRadiusPct;
      if (pl.maxHpPct) hpPct += lv * pl.maxHpPct;
      if (pl.moveSpeedPct) spdPct += lv * pl.moveSpeedPct;
      if (pl.rerollBonus) reroll += lv * pl.rerollBonus;
    }
    pickupPct = Math.min(pickupPct, intNonNeg(caps.maxPickupRadiusPct) || pickupPct);
    hpPct = Math.min(hpPct, intNonNeg(caps.maxMaxHpPct) || hpPct);
    spdPct = Math.min(spdPct, intNonNeg(caps.maxMoveSpeedPct) || spdPct);
    reroll = Math.min(reroll, intNonNeg(caps.maxRerollBonus) ?? reroll);
    return {
      magnetMul: 1 + pickupPct / 100,
      hpMul: 1 + hpPct / 100,
      spdMul: 1 + spdPct / 100,
      rerollBonus: reroll
    };
  }

  /** Aplica mejoras del bestiario una vez al crear el jugador (idempotente por run). */
  function applyRunBonuses(pl) {
    if (!pl || pl._bestiaryRunBonuses) return;
    const bon = computeRunBonuses();
    if (bon.magnetMul > 1) pl.magnet *= bon.magnetMul;
    if (bon.hpMul > 1) {
      const ratio = pl.maxHp > 0 ? pl.hp / pl.maxHp : 1;
      pl.maxHp = Math.max(1, Math.round(pl.maxHp * bon.hpMul));
      pl.hp = Math.max(1, Math.min(pl.maxHp, Math.round(pl.maxHp * ratio)));
      if (pl.msBaseMaxHp != null) pl.msBaseMaxHp = pl.maxHp;
    }
    if (bon.spdMul > 1) pl.spdMul *= bon.spdMul;
    if (bon.rerollBonus > 0) pl.rerollBonus = (pl.rerollBonus || 0) + bon.rerollBonus;
    pl._bestiaryRunBonuses = true;
  }

  function emitPointsChanged(reason, extra = {}) {
    const b = progressBlock();
    if (!b) return;
    emit('bestiary:points-changed', Object.assign({
      delta: 0,
      earned: intNonNeg(b.currency.earned),
      spent: intNonNeg(b.currency.spent),
      available: getAvailablePoints(),
      reason
    }, extra));
  }

  function purchaseUpgrade(upgradeId) {
    const def = G.Bestiary.upgradeById(upgradeId);
    if (!def) return { ok: false, reason: 'unknown' };
    const b = progressBlock();
    if (!b) return { ok: false, reason: 'no_profile' };
    const cur = intNonNeg(b.upgrades[upgradeId]);
    if (cur >= def.maxLevel) return { ok: false, reason: 'max', level: cur };
    const cost = G.Bestiary.upgradeCost(def, cur);
    const avail = getAvailablePoints();
    if (cost > avail) return { ok: false, reason: 'funds', cost, available: avail };
    const spentBefore = intNonNeg(b.currency.spent);
    b.currency.spent = spentBefore + cost;
    if (b.currency.spent > b.currency.earned) {
      b.currency.spent = spentBefore;
      return { ok: false, reason: 'funds', cost, available: avail };
    }
    b.upgrades[upgradeId] = cur + 1;
    sanitizeSave(profile);
    if (!flush(true)) {
      b.currency.spent = spentBefore;
      b.upgrades[upgradeId] = cur;
      sanitizeSave(profile);
      return { ok: false, reason: 'persist' };
    }
    emit('bestiary:purchase-completed', {
      kind: 'upgrade',
      upgradeId,
      level: cur + 1,
      cost,
      available: getAvailablePoints()
    });
    emitPointsChanged('upgrade_purchase', { upgradeId, cost: -cost });
    return { ok: true, level: cur + 1, cost };
  }

  function purchaseUnlock(unlockId) {
    const def = G.Bestiary.unlockById(unlockId);
    if (!def) return { ok: false, reason: 'unknown' };
    const b = progressBlock();
    if (!b) return { ok: false, reason: 'no_profile' };
    if (b.unlocks.includes(unlockId)) return { ok: false, reason: 'owned' };
    const cost = intNonNeg(def.cost);
    const avail = getAvailablePoints();
    if (cost > avail) return { ok: false, reason: 'funds', cost, available: avail };
    const spentBefore = intNonNeg(b.currency.spent);
    b.currency.spent = spentBefore + cost;
    if (b.currency.spent > b.currency.earned) {
      b.currency.spent = spentBefore;
      return { ok: false, reason: 'funds', cost, available: avail };
    }
    b.unlocks.push(unlockId);
    sanitizeSave(profile);
    if (!flush(true)) {
      b.currency.spent = spentBefore;
      b.unlocks = b.unlocks.filter(id => id !== unlockId);
      sanitizeSave(profile);
      return { ok: false, reason: 'persist' };
    }
    const payload = { unlockId, cost, available: getAvailablePoints(), stub: !!def.stub };
    emit('bestiary:unlock-purchased', payload);
    emit('bestiary:purchase-completed', Object.assign({ kind: 'unlock' }, payload));
    emitPointsChanged('unlock_purchase', { unlockId, cost: -cost });
    if (G.Events && typeof G.Events.onBestiaryUnlock === 'function') {
      try { G.Events.onBestiaryUnlock(payload); } catch (e) { console.warn('[Bestiary] onBestiaryUnlock', e); }
    }
    return { ok: true, cost };
  }

  function isCharmUnlocked(charmId) {
    const b = progressBlock();
    return !!(b && charmId && b.charms.unlocked.includes(charmId));
  }

  function listEquippedCharms() {
    const b = progressBlock();
    if (!b) return [];
    return b.charms.equipped.slice();
  }

  function isCharmEquipped(charmId) {
    return listEquippedCharms().includes(charmId);
  }

  function unlockCharm(charmId) {
    const def = G.Bestiary.charmById(charmId);
    if (!def || def.enabled === false) return { ok: false, reason: 'disabled' };
    const b = progressBlock();
    if (!b) return { ok: false, reason: 'no_profile' };
    if (b.charms.unlocked.includes(charmId)) return { ok: false, reason: 'owned' };
    const cost = intNonNeg(def.cost);
    const avail = getAvailablePoints();
    if (cost > avail) return { ok: false, reason: 'funds', cost, available: avail };
    const spentBefore = intNonNeg(b.currency.spent);
    b.currency.spent = spentBefore + cost;
    if (b.currency.spent > b.currency.earned) {
      b.currency.spent = spentBefore;
      return { ok: false, reason: 'funds', cost, available: avail };
    }
    b.charms.unlocked.push(charmId);
    sanitizeSave(profile);
    if (!flush(true)) {
      b.currency.spent = spentBefore;
      b.charms.unlocked = b.charms.unlocked.filter(id => id !== charmId);
      sanitizeSave(profile);
      return { ok: false, reason: 'persist' };
    }
    emit('bestiary:purchase-completed', {
      kind: 'charm',
      charmId,
      cost,
      available: getAvailablePoints()
    });
    emitPointsChanged('charm_unlock', { charmId, cost: -cost });
    return { ok: true, cost };
  }

  function equipCharm(charmId, slot = 0) {
    const def = G.Bestiary.charmById(charmId);
    if (!def || def.enabled === false) return { ok: false, reason: 'disabled' };
    const b = progressBlock();
    if (!b) return { ok: false, reason: 'no_profile' };
    if (!b.charms.unlocked.includes(charmId)) return { ok: false, reason: 'locked' };
    const s = Math.max(0, Math.min(CHARM_EQUIP_SLOTS - 1, intNonNeg(slot)));
    const eq = b.charms.equipped.filter(id => id !== charmId);
    eq[s] = charmId;
    const seen = new Set();
    b.charms.equipped = [];
    for (let i = 0; i < eq.length && b.charms.equipped.length < CHARM_EQUIP_SLOTS; i++) {
      const id = eq[i];
      if (!id || seen.has(id) || !b.charms.unlocked.includes(id)) continue;
      seen.add(id);
      b.charms.equipped.push(id);
    }
    sanitizeSave(profile);
    flush(false);
    emit('bestiary:charm-equipped', { charmId, slot: s, equipped: b.charms.equipped.slice() });
    return { ok: true, equipped: b.charms.equipped.slice() };
  }

  function unequipCharm(charmId) {
    const b = progressBlock();
    if (!b || !charmId) return { ok: false, reason: 'no_profile' };
    if (!b.charms.equipped.includes(charmId)) return { ok: false, reason: 'not_equipped' };
    b.charms.equipped = b.charms.equipped.filter(id => id !== charmId);
    sanitizeSave(profile);
    flush(false);
    emit('bestiary:charm-equipped', { charmId: null, unequipped: charmId, equipped: b.charms.equipped.slice() });
    return { ok: true, equipped: b.charms.equipped.slice() };
  }

  /** Estado derivado; kills=0 → unknown si nunca visto en save. */
  function deriveStage(kills, thresholds, hadProgress) {
    const k = intNonNeg(kills);
    if (!thresholds) return k > 0 || hadProgress ? 'discovered' : 'unknown';
    if (k <= 0) return hadProgress ? 'discovered' : 'unknown';
    if (k < thresholds.stage1) return 'discovered';
    if (k < thresholds.stage2) return 'stage_1';
    if (k < thresholds.final) return 'stage_2';
    return 'completed';
  }

  function creatureIdForEnemy(e) {
    if (!e) return null;
    if (e.sentinelElite) return (e.def && e.def.bestiaryCreatureId) || 'minotaur_guard';
    if (e.def && e.def.bestiaryCreatureId) return e.def.bestiaryCreatureId;
    if (e.def && e.def.creatureId) return e.def.creatureId;
    if (G.CREATURE_BY_LEGACY && e.dex != null) {
      const c = G.CREATURE_BY_LEGACY[e.dex];
      if (c && c.id) return c.id;
    }
    if (G.Content && G.Content.getCreature) {
      const c = G.Content.getCreature(e.dex);
      if (c && c.id) return c.id;
    }
    return null;
  }

  function canCreditDefeat(e) {
    if (!e || e._bestiaryCredited) return false;
    if (e.remote) return false;
    if (e.def && e.def.noBestiaryCredit) return false;
    if (G.Game && G.Game.state === 'ui') return false;
    const creatureId = creatureIdForEnemy(e);
    if (!creatureId || !getCatalogEntry(creatureId)) return false;
    return true;
  }

  function pushRunAdvance(kind, creatureId, kills, stage, points = 0) {
    const row = { kind, creatureId, kills, stage, at: Date.now() };
    if (points > 0) row.points = points;
    runAdvances.push(row);
  }

  /**
   * Concede puntos de finalización una sola vez (kills >= umbral final).
   * @param {{ silent?: boolean, runId?: string|null }} opts silent=true omite eventos (reconciliación al cargar).
   */
  function grantEntryReward(creatureId, entry, catalog, opts = {}) {
    const silent = !!opts.silent;
    if (!entry || entry.rewarded || !catalog || !catalog.thresholds) return 0;
    if (entry.kills < catalog.thresholds.final) return 0;
    const points = intNonNeg(catalog.rewardPoints);
    entry.rewarded = true;
    const b = progressBlock();
    if (!b) return 0;
    if (points > 0) b.currency.earned = intNonNeg(b.currency.earned) + points;
    if (!silent) {
      if (points > 0) runPointsEarned += points;
      emit('bestiary:entry-completed', {
        creatureId,
        kills: entry.kills,
        points,
        runId: opts.runId || runId || null
      });
      emit('bestiary:points-changed', {
        creatureId,
        delta: points,
        earned: b.currency.earned,
        spent: intNonNeg(b.currency.spent),
        available: getAvailablePoints(),
        reason: 'entry_completed'
      });
      pushRunAdvance('points', creatureId, entry.kills, 'completed', points);
    }
    return points;
  }

  /** Saves con kills >= final y rewarded=false (p. ej. tras BST-3). */
  function reconcilePendingRewards(silent = true) {
    const b = progressBlock();
    if (!b) return 0;
    let granted = 0;
    for (const creatureId of Object.keys(b.entries)) {
      const catalog = getCatalogEntry(creatureId);
      if (!catalog) continue;
      granted += grantEntryReward(creatureId, b.entries[creatureId], catalog, { silent });
    }
    if (granted > 0) flush(false);
    return granted;
  }

  function onEnemyDefeated(payload) {
    if (!payload || !payload.creatureId) return;
    const catalog = getCatalogEntry(payload.creatureId);
    if (!catalog) return;
    const inst = payload._instance;
    const now = payload.timestamp || Date.now();
    const entry = ensureProgressEntry(payload.creatureId);
    if (!entry) return;

    const prevKills = entry.kills;
    const prevStage = deriveStage(prevKills, catalog.thresholds, prevKills > 0 || entry.firstSeenAt != null);

    entry.kills = prevKills + 1;
    if (entry.firstSeenAt == null) entry.firstSeenAt = now;
    entry.lastKilledAt = now;

    const nextStage = deriveStage(entry.kills, catalog.thresholds, true);

    emit('bestiary:kill-recorded', {
      creatureId: payload.creatureId,
      kills: entry.kills,
      instanceId: payload.instanceId,
      runId: payload.runId
    });

    if (prevKills === 0) {
      emit('bestiary:creature-discovered', { creatureId: payload.creatureId, runId: payload.runId });
      pushRunAdvance('discovered', payload.creatureId, entry.kills, nextStage);
    }

    if (prevStage !== nextStage && nextStage !== 'discovered' && nextStage !== 'unknown') {
      emit('bestiary:stage-completed', {
        creatureId: payload.creatureId,
        stage: nextStage,
        kills: entry.kills,
        runId: payload.runId
      });
      pushRunAdvance(nextStage, payload.creatureId, entry.kills, nextStage);
    }

    grantEntryReward(payload.creatureId, entry, catalog, { runId: payload.runId });

    flush(false);
    if (inst) inst._bestiaryCredited = true;
  }

  /** Punto único de crédito: emite enemy:defeated y actualiza progreso. */
  function tryCreditDefeat(e) {
    if (!canCreditDefeat(e)) return false;
    const creatureId = creatureIdForEnemy(e);
    const payload = {
      creatureId,
      instanceId: e.id,
      isElite: !!(e.sentinelElite || e.def && e.def.bestiaryCreatureId === 'minotaur_guard'),
      isBoss: !!e.boss,
      sourceKind: e.lastHitAid || 'unknown',
      runId: runId || null,
      timestamp: Date.now(),
      _instance: e
    };
    emit('enemy:defeated', payload);
    return !!e._bestiaryCredited;
  }

  function beginRun(id) {
    runId = id || ('run-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6));
    runAdvances = [];
    runPointsEarned = 0;
  }

  function endRun() {
    runAdvances = [];
    runPointsEarned = 0;
    runId = null;
  }

  function getRunAdvances() {
    return runAdvances.map(a => Object.assign({}, a));
  }

  function getRunPointsEarned() {
    return runPointsEarned;
  }

  /** Solo con ?dev en la URL: fija kills y aplica recompensa si corresponde. */
  function devSetKills(creatureId, kills) {
    if (typeof location === 'undefined' || !/[?&]dev\b/.test(location.search)) return false;
    const catalog = getCatalogEntry(creatureId);
    if (!catalog) return false;
    const entry = ensureProgressEntry(creatureId);
    entry.kills = intNonNeg(kills);
    if (entry.kills > 0 && entry.firstSeenAt == null) entry.firstSeenAt = Date.now();
    grantEntryReward(creatureId, entry, catalog, { runId: runId || 'dev' });
    flush(false);
    return true;
  }

  on('enemy:defeated', onEnemyDefeated);

  Object.assign(G.Bestiary, {
    SAVE_VERSION,
    CHARM_EQUIP_SLOTS,
    createDefaultSave,
    defaultProgressEntry: defaultEntry,
    sanitizeSave,
    init,
    flush,
    getProgressEntry,
    listProgressEntries,
    getAvailablePoints,
    ensureProgressEntry,
    getCatalogEntry,
    getEntry,
    on,
    off,
    emit,
    deriveStage,
    creatureIdForEnemy,
    tryCreditDefeat,
    onEnemyDefeated,
    beginRun,
    endRun,
    getRunAdvances,
    getRunPointsEarned,
    grantEntryReward,
    reconcilePendingRewards,
    devSetKills,
    getUpgradeLevel,
    hasUnlock,
    computeRunBonuses,
    applyRunBonuses,
    purchaseUpgrade,
    purchaseUnlock,
    isCharmUnlocked,
    isCharmEquipped,
    listEquippedCharms,
    unlockCharm,
    equipCharm,
    unequipCharm
  });
})();
