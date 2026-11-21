/* ============ neutral-roster.js — elenco MVP (Fase 4) ============
 * CYC-2: modo hp_band (D7) usa HP declarado en G.CREATURES + pick por banda.
 * Modo legacy_tier_scale conserva TIER_STATS anterior.
 */
G.NeutralRoster = (() => {
  const TIER_STATS = [
    { hp: 18, spd: 54, dmg: 5, xp: 4 },
    { hp: 34, spd: 58, dmg: 9, xp: 7 },
    { hp: 48, spd: 54, dmg: 12, xp: 11 },
    { hp: 72, spd: 60, dmg: 16, xp: 18 }
  ];

  function cfg() { return G.MvpConfig || {}; }

  function useHpBand() {
    return cfg().SPAWN_MODE === 'hp_band';
  }

  function enemies() {
    return (G.CREATURES || []).filter(c => c && c.role === 'enemy' && !c.boss);
  }

  function maxTierAt(t) {
    const unlock = cfg().ENEMY_UNLOCK || [{ from: 0, maxTier: 0 }];
    let maxTier = 0;
    for (const u of unlock) if (t >= u.from) maxTier = u.maxTier;
    return maxTier;
  }

  function attackExtras(c, behaviors, behavior, tier, dmg) {
    const d = { dmg };
    const ti = tier;
    const CD = {
      ranged: 2.1 - ti * 0.12,
      fan: 3.35 - ti * 0.1,
      beamer: 4.0 - ti * 0.15,
      zoner: 4.2 - ti * 0.15,
      healer: 3.2,
      summoner: 6.5,
      jumper: 3.8 - ti * 0.1
    };
    const SHOT_ATK = ['ranged', 'fan', 'beamer', 'zoner'];
    const shotBeh = behaviors.find(b => SHOT_ATK.includes(b)) || behaviors.find(b => CD[b]);
    if (shotBeh && CD[shotBeh]) {
      d.shotDmg = Math.round(d.dmg * (shotBeh === 'fan' ? 0.62 : 0.78));
      d.shotCd = +CD[shotBeh].toFixed(2);
      d.range = (shotBeh === 'beamer' ? 250 : shotBeh === 'healer' || shotBeh === 'summoner' ? 220
        : shotBeh === 'fan' ? 168 : 185) + ti * 8;
    }
    if (behaviors.includes('summoner')) {
      d.minion = c.minionLegacyId || 99002;
    }
    if (behaviors.includes('fan')) d.fanN = ti < 1 ? 3 : 4;
    if (behaviors.includes('zoner')) d.zones = ti < 1 ? 1 : ti < 2 ? 2 : 3;
    return d;
  }

  function defForLegacyTier(c) {
    const behaviors = (c.behaviors && c.behaviors.length) ? c.behaviors.slice() : [c.behavior || 'chase'];
    const behavior = c.behavior || behaviors[0];
    const tier = Math.min(c.tier || 0, TIER_STATS.length - 1);
    const base = TIER_STATS[tier];
    const atkK = c.attack || 1;
    const d = {
      dex: c.legacyId,
      creatureId: c.id,
      name: c.name,
      behavior,
      behaviors,
      hp: Math.round(base.hp * (behavior === 'tank' ? 1.45 : behavior === 'runner' ? 0.72 : 1) * atkK),
      spd: Math.round(base.spd * (behavior === 'tank' ? 0.82 : behavior === 'runner' ? 1.55 : 1)),
      dmg: Math.max(4, Math.round(base.dmg * (behavior === 'tank' ? 1.15 : 1) * atkK)),
      xp: Math.max(3, Math.round(base.xp * (behavior === 'tank' ? 1.2 : 1))),
      weight: c.spawnWeight == null ? 1 : c.spawnWeight
    };
    if (behaviors.includes('bomber')) { d.spd = Math.round(d.spd * 1.2); d.hp = Math.round(d.hp * 0.85); }
    if (behaviors.includes('runner')) { d.hp = Math.round(d.hp * 0.75); d.dmg = Math.round(d.dmg * 0.9); }
    return Object.assign(d, attackExtras(c, behaviors, behavior, tier, d.dmg));
  }

  /** HP/speed/dmg desde datos de criatura (D7). */
  function defForFromCreature(c) {
    const behaviors = (c.behaviors && c.behaviors.length) ? c.behaviors.slice() : [c.behavior || 'chase'];
    const behavior = c.behavior || behaviors[0];
    const tier = Math.min(c.tier || 0, 3);
    const atkK = c.attack || 1;
    let hp = Math.max(1, Math.round(c.hp || 1));
    let spd = Math.max(20, Math.round(c.speed || 54));
    if (behavior === 'tank') { hp = Math.round(hp * 1.12); spd = Math.round(spd * 0.88); }
    if (behavior === 'runner') { hp = Math.round(hp * 0.78); spd = Math.round(spd * 1.22); }
    if (behaviors.includes('bomber')) { spd = Math.round(spd * 1.12); hp = Math.round(hp * 0.9); }
    if (behaviors.includes('runner') && behavior !== 'runner') hp = Math.round(hp * 0.82);
    let dmg = Math.max(4, Math.round(hp * 0.21 * atkK * (behavior === 'tank' ? 1.1 : 1)));
    if (behavior === 'runner') dmg = Math.round(dmg * 0.92);
    const xp = Number.isFinite(c.xp) ? c.xp : Math.max(3, Math.round(hp * 0.32 + tier * 2));
    const d = {
      dex: c.legacyId,
      creatureId: c.id,
      name: c.name,
      behavior,
      behaviors,
      hp,
      spd,
      dmg,
      xp,
      weight: c.spawnWeight == null ? 1 : c.spawnWeight
    };
    return Object.assign(d, attackExtras(c, behaviors, behavior, tier, dmg));
  }

  function defFor(c) {
    if (!c) return null;
    return useHpBand() ? defForFromCreature(c) : defForLegacyTier(c);
  }

  function hpBandCfg() {
    return cfg().HP_BAND || {};
  }

  function hTarget(t) {
    const HB = hpBandCfg();
    const run = cfg().RUN_DURATION_SEC || 900;
    const u = Math.min(1, Math.max(0, t / run));
    const start = HB.start != null ? HB.start : 16;
    const end = HB.end != null ? HB.end : 40;
    const pow = HB.curvePow != null ? HB.curvePow : 1.55;
    return start + (end - start) * Math.pow(u, pow);
  }

  function bandDelta(t) {
    const HB = hpBandCfg();
    const h = hTarget(t);
    const ratio = HB.deltaRatio != null ? HB.deltaRatio : 0.38;
    const minD = HB.deltaMin != null ? HB.deltaMin : 7;
    return Math.max(minD, Math.round(h * ratio));
  }

  function spawnPoolRaw(t) {
    const maxTier = maxTierAt(t);
    return enemies().filter(c => (c.spawnWeight || 0) > 0 && (c.tier || 0) <= maxTier);
  }

  function defsInBand(t, deltaMul = 1) {
    const h = hTarget(t);
    const delta = Math.round(bandDelta(t) * deltaMul);
    const lo = h - delta;
    const hi = h + delta;
    const out = [];
    for (const c of spawnPoolRaw(t)) {
      const d = defFor(c);
      if (d && d.hp >= lo && d.hp <= hi) out.push(d);
    }
    return out;
  }

  function weightedPick(list) {
    if (!list.length) return null;
    if (G.DailyBoost && G.DailyBoost.applySpawnDef) {
      list = list.map(d => G.DailyBoost.applySpawnDef(d));
    }
    const total = list.reduce((a, d) => a + (d.weight || 1), 0);
    let r = Math.random() * total;
    for (const d of list) {
      r -= d.weight || 1;
      if (r <= 0) return d;
    }
    return list[list.length - 1];
  }

  function pickNearestToTarget(t) {
    const h = hTarget(t);
    const pool = spawnPoolRaw(t).map(defFor).filter(Boolean);
    if (!pool.length) return null;
    let best = pool[0];
    let bd = Math.abs(best.hp - h);
    for (let i = 1; i < pool.length; i++) {
      const dist = Math.abs(pool[i].hp - h);
      if (dist < bd) { bd = dist; best = pool[i]; }
    }
    return best;
  }

  function pickInHpBand(t) {
    const HB = hpBandCfg();
    const widens = Array.isArray(HB.widenFactors) ? HB.widenFactors : [1, 1.6, 2.4];
    for (const mul of widens) {
      const band = defsInBand(t, mul);
      if (band.length) return weightedPick(band) || band[0];
    }
    return pickNearestToTarget(t);
  }

  function available(t) {
    const maxTier = maxTierAt(t);
    return enemies().filter(c => (c.tier || 0) <= maxTier).map(defFor);
  }

  function rollRun() {
    bossCache = null;
    eliteCache = null;
    eliteCacheId = null;
    return { cast: (cfg().ENEMY_UNLOCK || []).map(u => ({ from: u.from, list: available(u.from) })) };
  }

  function scale(t) {
    const D = cfg().DIFFICULTY || { hpScale: 88, dmgScale: 390, spdScale: 1250, spdCap: 0.34 };
    if (useHpBand()) {
      return {
        hp: 1,
        dmg: 1 + t / (D.dmgScale || 460),
        spd: 1 + Math.min(D.spdCap || 0.34, t / (D.spdScale || 1250))
      };
    }
    return {
      hp: 1 + t / D.hpScale,
      dmg: 1 + t / D.dmgScale,
      spd: 1 + Math.min(D.spdCap, t / D.spdScale)
    };
  }

  function bossScale(t) {
    const D = cfg().DIFFICULTY || { bossHpScale: 580, bossDmgScale: 580 };
    if (useHpBand()) {
      return {
        hp: 1,
        dmg: 1 + t / (D.bossDmgScale || 580),
        spd: 1 + Math.min(0.2, t / 2000)
      };
    }
    return { hp: 1 + t / D.bossHpScale, dmg: 1 + t / D.bossDmgScale, spd: 1 + Math.min(0.2, t / 2000) };
  }

  let eliteCache = null;
  let eliteCacheId = null;

  function eliteCreatureId() {
    const boosted = G.DailyBoost && G.DailyBoost.getBoostedBossId && G.DailyBoost.getBoostedBossId();
    if (boosted && G.CREATURE_BY_ID && G.CREATURE_BY_ID[boosted] &&
        G.DailyBoost.isBossEligible && G.DailyBoost.isBossEligible(boosted)) {
      return boosted;
    }
    return 'black_knight';
  }

  function buildEliteDef(id) {
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
    if (!c) return null;
    const d = defFor(c);
    if (!useHpBand()) {
      d.hp = Math.round(c.hp * 1.35);
      d.dmg = Math.round(d.dmg * 1.25);
    }
    d.xp = 85;
    d.elite = true;
    d.boss = true;
    d.bestiaryCreatureId = id;
    d.creatureId = id;
    return d;
  }

  function buildElite() {
    let id = eliteCreatureId();
    if (eliteCache && eliteCacheId === id) return eliteCache;
    let d = buildEliteDef(id);
    if (!d && id !== 'black_knight') {
      id = 'black_knight';
      d = buildEliteDef(id);
    }
    if (!d) return null;
    eliteCache = d;
    eliteCacheId = id;
    return d;
  }

  let bossCache = null;
  function buildBoss() {
    if (bossCache) return bossCache;
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID.orshabaal;
    if (!c) return null;
    const d = defFor(c);
    if (!useHpBand()) {
      d.hp = Math.round(c.hp * 1.35);
      d.dmg = Math.round(d.dmg * 1.35);
    }
    d.xp = 220;
    d.minion = c.minionLegacyId || 99018;
    bossCache = d;
    return d;
  }

  function bosses() {
    const at = cfg().FINAL_BOSS_AT != null ? cfg().FINAL_BOSS_AT : 780;
    const b = buildBoss();
    return b ? [{ at, ...b }] : [];
  }

  function bagAt(t) {
    const horde = G.Events && G.Events.bag && G.Events.bag();
    if (horde) return horde;
    if (useHpBand()) {
      const band = defsInBand(t, 1);
      if (band.length) return band;
      const pool = spawnPoolRaw(t).map(defFor).filter(Boolean);
      return pool.length ? pool : available(0);
    }
    const list = available(t);
    return list.length ? list : available(0);
  }

  function pickAt(t) {
    if (useHpBand()) return pickInHpBand(t);
    const list = bagAt(t);
    return weightedPick(list) || list[0];
  }

  function upcomingDex(t, ahead = 60) {
    if (useHpBand()) {
      const band = defsInBand(t + ahead, 1.6);
      const src = band.length ? band : spawnPoolRaw(t + ahead).map(defFor);
      return src.map(d => d.dex);
    }
    return available(t + ahead).map(d => d.dex);
  }

  function hordeTypes() { return []; }
  function hordeDefs() { return []; }

  function spawnRate(t) {
    const S = cfg().SPAWN || {};
    const base = S.base != null ? S.base : 1.45;
    const perSec = S.perSec != null ? S.perSec : 0.027;
    const curvePow = S.curvePow != null ? S.curvePow : 1.55;
    const curveMul = S.curveMul != null ? S.curveMul : 0.48;
    const density = S.density != null ? S.density : 0.26;
    let r = (base + t * perSec + Math.pow(t / 60, curvePow) * curveMul) * density;
    const grace = S.earlyGraceSec != null ? S.earlyGraceSec : 0;
    const earlyMul = S.earlyRateMul != null ? S.earlyRateMul : 1;
    if (grace > 0 && t < grace) r *= earlyMul + (1 - earlyMul) * (t / grace);
    const warmSec = S.earlyWarmupSec != null ? S.earlyWarmupSec : 0;
    const warmMul = S.earlyWarmupMul != null ? S.earlyWarmupMul : 1;
    if (warmSec > 0 && t < warmSec) {
      r *= 1 + (warmMul - 1) * (1 - t / warmSec);
    }
    const midAt = S.midDipAt;
    if (midAt != null) {
      const w = S.midDipWidth != null ? S.midDipWidth : 90;
      const midMul = S.midDipMul != null ? S.midDipMul : 0.75;
      const d = Math.abs(t - midAt) / w;
      if (d < 1) r *= midMul + (1 - midMul) * d;
    }
    return r;
  }

  return {
    rollRun,
    scale,
    bossScale,
    buildElite,
    defFor,
    bagAt,
    pickAt,
    pickInHpBand,
    eliteCreatureId,
    hTarget,
    bandDelta,
    upcomingDex,
    hordeTypes,
    hordeDefs,
    spawnRate,
    useHpBand,
    get BOSSES() { return bosses(); },
    get cast() { return rollRun().cast; }
  };
})();