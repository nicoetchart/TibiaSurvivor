/* ============ systems/daily-boost.js — Daily boosts creature + boss (CYC-8/9) ============ */
(() => {
  const NO_REPEAT_DAYS = 3;
  const BOSS_SEED_XOR = 0x9e3779b9;

  const DEFAULTS = {
    creature: {
      xpMul: 1.1,
      bestiaryKillMul: 1.25,
      spawnWeightMul: 1.35,
      lootChanceMul: 1.15
    },
    boss: {
      bosstiaryKillMul: 1.5,
      extraBossPointOnKill: 5,
      damageTakenMul: 1.05,
      eliteIntervalMul: 0.82,
      spawnWeightMul: 1.35
    },
    rotation: { utc: true, noRepeatDays: NO_REPEAT_DAYS }
  };

  let activeSave = null;
  let boostedCreatureId = null;
  let boostedBossId = null;
  let boostedDayUtc = null;

  function defaultDailyBlock() {
    return {
      dayUtc: null,
      creatureId: null,
      bossId: null,
      historyCreatures: [],
      historyBosses: []
    };
  }

  function utcDayString(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return '' + y + m + d;
  }

  function parseDayUtc(s) {
    if (typeof s !== 'string' || !/^\d{8}$/.test(s)) return 0;
    return parseInt(s, 10) || 0;
  }

  function accountSeed(save) {
    const key = (save && (save.uid || save.name || save.created)) || 'guest';
    const str = String(key);
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h;
  }

  function creatureRow(id) {
    return (G.CREATURE_BY_ID && id) ? G.CREATURE_BY_ID[id] : null;
  }

  function catalogRow(id) {
    return G.Bestiary && G.Bestiary.getCatalogEntry ? G.Bestiary.getCatalogEntry(id) : null;
  }

  function isCreatureEligible(id) {
    if (!id || !G.Cyclopedia || !G.Cyclopedia.getDefinition) return false;
    const def = G.Cyclopedia.getDefinition(id);
    if (!def || !def.flags || !def.flags.boostEligible) return false;
    if (!def.bestiary || !def.bestiary.enabled || def.bestiary.section !== 'bestiary') return false;
    const c = creatureRow(id);
    if (!c || c.role === 'player') return false;
    if (c.boostExcluded || c.tutorial) return false;
    if (c.boss || c.finalBoss) return false;
    if ((c.spawnWeight || 0) <= 0) return false;
    return true;
  }

  /** DB09: sólo Bane y Archfoe; nunca Nemesis ni final boss. */
  function isBossEligible(id) {
    if (!id || !G.Cyclopedia || !G.Cyclopedia.getDefinition) return false;
    const def = G.Cyclopedia.getDefinition(id);
    if (!def || !def.bestiary || !def.bestiary.enabled || def.bestiary.section !== 'bosstiary') return false;
    const cat = def.bestiary.bossCategory;
    if (cat !== 'bane' && cat !== 'archfoe') return false;
    const c = creatureRow(id);
    if (!c || c.role === 'player') return false;
    if (c.boostExcluded || c.finalBoss) return false;
    if (c.bestiary && c.bestiary.bossCategory === 'nemesis') return false;
    const catalog = catalogRow(id);
    if (catalog && catalog.bossCategory === 'nemesis') return false;
    return true;
  }

  function eligiblePool() {
    const out = [];
    if (!G.Cyclopedia || !G.Cyclopedia.listCreatures) return out;
    for (const def of G.Cyclopedia.listCreatures({ role: 'enemy', bestiaryOnly: true, section: 'bestiary' })) {
      if (def && def.id && isCreatureEligible(def.id)) out.push(def.id);
    }
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }

  function eligibleBossPool() {
    const out = [];
    if (!G.Cyclopedia || !G.Cyclopedia.listCreatures) return out;
    for (const def of G.Cyclopedia.listCreatures({ bestiaryOnly: true, section: 'bosstiary' })) {
      if (def && def.id && isBossEligible(def.id)) out.push(def.id);
    }
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }

  function pickIndex(dayUtc, seed, len) {
    if (!len) return 0;
    const dayNum = parseDayUtc(dayUtc);
    return Math.abs((dayNum ^ seed) % len);
  }

  function pickFromPool(dayUtc, seed, pool, history = []) {
    if (!pool.length) return null;
    const hist = new Set((history || []).filter(Boolean));
    let list = pool.filter(id => !hist.has(id));
    if (!list.length) list = pool.slice();
    const idx = pickIndex(dayUtc, seed, list.length);
    return list[idx] || list[0];
  }

  function pickCreature(dayUtc, seed, pool, history = []) {
    return pickFromPool(dayUtc, seed, pool, history);
  }

  function pickBoss(dayUtc, seed, pool, history = []) {
    return pickFromPool(dayUtc, seed ^ BOSS_SEED_XOR, pool, history);
  }

  function sanitizeHistory(arr, poolSet) {
    const out = [];
    const seen = new Set();
    for (const id of Array.isArray(arr) ? arr : []) {
      if (typeof id !== 'string' || !id || seen.has(id)) continue;
      if (poolSet && poolSet.size && !poolSet.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= NO_REPEAT_DAYS) break;
    }
    return out;
  }

  function sanitizeDailyBlock(raw, creaturePool, bossPool) {
    const poolC = new Set(creaturePool);
    const poolB = new Set(bossPool);
    const d = raw && typeof raw === 'object' ? raw : {};
    let dayUtc = typeof d.dayUtc === 'string' && /^\d{8}$/.test(d.dayUtc) ? d.dayUtc : null;
    let creatureId = typeof d.creatureId === 'string' && d.creatureId ? d.creatureId : null;
    let bossId = typeof d.bossId === 'string' && d.bossId ? d.bossId : null;
    const historyCreatures = sanitizeHistory(d.historyCreatures, poolC);
    const historyBosses = sanitizeHistory(d.historyBosses || d.history, poolB);
    if (creatureId && poolC.size && !poolC.has(creatureId)) creatureId = null;
    if (bossId && poolB.size && !poolB.has(bossId)) bossId = null;
  if (bossId && !isBossEligible(bossId)) bossId = null;
    return { dayUtc, creatureId, bossId, historyCreatures, historyBosses };
  }

  function rollForward(daily, save, creaturePool, bossPool, nowDay) {
    const seed = accountSeed(save);
    const cur = parseDayUtc(nowDay);
    let dayUtc = daily.dayUtc;
    let creatureId = daily.creatureId;
    let bossId = daily.bossId;
    let histC = daily.historyCreatures.slice();
    let histB = daily.historyBosses.slice();

    const stored = parseDayUtc(dayUtc);
    if (stored && cur < stored) {
      return { dayUtc, creatureId, bossId, historyCreatures: histC, historyBosses: histB };
    }

    const dayAdvanced = !dayUtc || cur > stored;
    const needCreature = creaturePool.length && (dayAdvanced || !creatureId || !isCreatureEligible(creatureId));
    const needBoss = bossPool.length && (dayAdvanced || !bossId || !isBossEligible(bossId));

    if (needCreature) {
      if (creatureId && dayAdvanced) {
        histC = [creatureId].concat(histC.filter(id => id !== creatureId)).slice(0, NO_REPEAT_DAYS);
      }
      creatureId = pickCreature(nowDay, seed, creaturePool, histC);
      dayUtc = nowDay;
    }

    if (needBoss) {
      if (bossId && dayAdvanced) {
        histB = [bossId].concat(histB.filter(id => id !== bossId)).slice(0, NO_REPEAT_DAYS);
      }
      bossId = pickBoss(nowDay, seed, bossPool, histB);
      dayUtc = nowDay;
    }

    if (!creaturePool.length) creatureId = null;
    if (!bossPool.length) bossId = null;
    if (creatureId && !isCreatureEligible(creatureId)) creatureId = creaturePool[0] || null;
    if (bossId && !isBossEligible(bossId)) bossId = bossPool[0] || null;

    if (!dayUtc) dayUtc = nowDay;

    return {
      dayUtc,
      creatureId,
      bossId,
      historyCreatures: sanitizeHistory(histC, new Set(creaturePool)),
      historyBosses: sanitizeHistory(histB, new Set(bossPool))
    };
  }

  function syncSave(save, now = new Date()) {
    if (!save || typeof save !== 'object') {
      boostedCreatureId = null;
      boostedBossId = null;
      boostedDayUtc = null;
      activeSave = null;
      return null;
    }
    activeSave = save;
    const cyclo = save.cyclopedia;
    if (!cyclo || typeof cyclo !== 'object') {
      boostedCreatureId = null;
      boostedBossId = null;
      boostedDayUtc = null;
      return null;
    }
    const creaturePool = eligiblePool();
    const bossPool = eligibleBossPool();
    if (!cyclo.daily || typeof cyclo.daily !== 'object') cyclo.daily = defaultDailyBlock();
    const base = sanitizeDailyBlock(cyclo.daily, creaturePool, bossPool);
    const nowDay = utcDayString(now);
    cyclo.daily = rollForward(base, save, creaturePool, bossPool, nowDay);
    boostedCreatureId = cyclo.daily.creatureId;
    boostedBossId = cyclo.daily.bossId;
    boostedDayUtc = cyclo.daily.dayUtc;
    return cyclo.daily;
  }

  function getBoostedCreatureId() {
    return boostedCreatureId || null;
  }

  function getBoostedBossId() {
    return boostedBossId || null;
  }

  function isCreatureBoosted(creatureId) {
    if (!creatureId || !boostedCreatureId) return false;
    return creatureId === boostedCreatureId;
  }

  function isBossBoosted(creatureId) {
    if (!creatureId || !boostedBossId) return false;
    return creatureId === boostedBossId;
  }

  function mulFor(kind, section = 'creature') {
    const block = section === 'boss' ? DEFAULTS.boss : DEFAULTS.creature;
    const v = block && block[kind];
    return Number.isFinite(v) && v > 0 ? v : 1;
  }

  function bossMulFor(kind) {
    return mulFor(kind, 'boss');
  }

  function fractionalExtra(mul, rng = Math.random) {
    let extra = Math.floor(mul);
    const frac = mul - extra;
    extra -= 1;
    if (frac > 0 && typeof rng === 'function' && rng() < frac) extra += 1;
    return Math.max(0, extra);
  }

  function extraKillCredits(creatureId, rng = Math.random) {
    if (!isCreatureBoosted(creatureId)) return 0;
    return fractionalExtra(mulFor('bestiaryKillMul', 'creature'), rng);
  }

  function extraBossKillCredits(creatureId, rng = Math.random) {
    if (!isBossBoosted(creatureId)) return 0;
    return fractionalExtra(mulFor('bosstiaryKillMul', 'boss'), rng);
  }

  function bonusBossPointsOnKill(creatureId) {
    if (!isBossBoosted(creatureId)) return 0;
    const n = DEFAULTS.boss.extraBossPointOnKill;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  function scaleXp(creatureId, baseXp) {
    const base = Number.isFinite(baseXp) ? baseXp : 0;
    if (!base || !isCreatureBoosted(creatureId)) return base;
    return Math.max(1, Math.round(base * mulFor('xpMul', 'creature')));
  }

  function applySpawnDef(def) {
    if (!def || !def.creatureId) return def;
    let mul = 1;
    if (isCreatureBoosted(def.creatureId)) mul = mulFor('spawnWeightMul', 'creature');
    else if (isBossBoosted(def.creatureId)) mul = mulFor('spawnWeightMul', 'boss');
    else return def;
    const w = def.weight == null ? 1 : def.weight;
    const nw = w * mul;
    if (nw === w) return def;
    const out = Object.assign({}, def);
    out.weight = nw;
    return out;
  }

  /** Centinela élite: aparece un poco antes si hoy toca ese bane/archfoe. */
  function eliteIntervalMul() {
    const id = getBoostedBossId();
    if (!id) return 1;
    if (G.NeutralRoster && G.NeutralRoster.eliteCreatureId) {
      const eliteId = G.NeutralRoster.eliteCreatureId();
      if (eliteId && eliteId !== id) return 1;
    }
    return mulFor('eliteIntervalMul', 'boss');
  }

  function playerDamageMulForEnemy(e) {
    if (!e || !G.Bestiary || !G.Bestiary.creatureIdForEnemy) return 1;
    const cid = G.Bestiary.creatureIdForEnemy(e);
    if (!cid || !isBossBoosted(cid)) return 1;
    return bossMulFor('damageTakenMul');
  }

  function displayName(creatureId) {
    const c = creatureRow(creatureId);
    if (c && c.name) return c.name;
    const def = G.Cyclopedia && G.Cyclopedia.getDefinition && G.Cyclopedia.getDefinition(creatureId);
    if (def && def.displayName) return def.displayName;
    return creatureId || '—';
  }

  function bannerCreatureText() {
    const id = getBoostedCreatureId();
    if (!id) return '';
    const xp = Math.round((mulFor('xpMul', 'creature') - 1) * 100);
    const kb = Math.round((mulFor('bestiaryKillMul', 'creature') - 1) * 100);
    const sw = Math.round((mulFor('spawnWeightMul', 'creature') - 1) * 100);
    return `Today’s boost: ${displayName(id)} · +${xp}% XP · +${kb}% bestiary · +${sw}% spawns`;
  }

  function bannerBossText() {
    const id = getBoostedBossId();
    if (!id) return '';
    const bk = Math.round((mulFor('bosstiaryKillMul', 'boss') - 1) * 100);
    const pts = bonusBossPointsOnKill(id);
    const risk = Math.round((bossMulFor('damageTakenMul') - 1) * 100);
    const ptsLine = pts > 0 ? ` · +${pts} boss points/kill` : '';
    return `Today’s boss: ${displayName(id)} · +${bk}% bosstiary${ptsLine} · +${risk}% damage taken`;
  }

  function bannerText() {
    const parts = [];
    const c = bannerCreatureText();
    const b = bannerBossText();
    if (c) parts.push(c);
    if (b) parts.push(b);
    return parts.join(' | ');
  }

  function runStartBossHint() {
    const id = getBoostedBossId();
    if (!id) return '';
    return `Daily boss: ${displayName(id)} — hunt harder, earn more bosstiary progress.`;
  }

  G.DailyBoost = {
    DEFAULTS,
    NO_REPEAT_DAYS,
    defaultDailyBlock,
    utcDayString,
    accountSeed,
    eligiblePool,
    eligibleBossPool,
    isCreatureEligible,
    isBossEligible,
    pickCreature,
    pickBoss,
    sanitizeDailyBlock,
    syncSave,
    getBoostedCreatureId,
    getBoostedBossId,
    isCreatureBoosted,
    isBossBoosted,
    extraKillCredits,
    extraBossKillCredits,
    bonusBossPointsOnKill,
    scaleXp,
    applySpawnDef,
    eliteIntervalMul,
    playerDamageMulForEnemy,
    displayName,
    bannerCreatureText,
    bannerBossText,
    bannerText,
    runStartBossHint,
    mulFor,
    bossMulFor
  };
})();