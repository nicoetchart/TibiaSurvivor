/* ============ neutral-roster.js — elenco MVP (Fase 4) ============
 * 15 plantillas + jefe élite. Curva centralizada vía G.MvpConfig.
 */
G.NeutralRoster = (() => {
  const TIER_STATS = [
    { hp: 20, spd: 56, dmg: 6, xp: 4 },
    { hp: 34, spd: 58, dmg: 9, xp: 7 },
    { hp: 48, spd: 54, dmg: 12, xp: 11 },
    { hp: 72, spd: 60, dmg: 16, xp: 18 }
  ];

  function cfg() { return G.MvpConfig || {}; }

  function enemies() {
    return (G.CREATURES || []).filter(c => c && c.role === 'enemy' && !c.boss);
  }

  function maxTierAt(t) {
    const unlock = cfg().ENEMY_UNLOCK || [{ from: 0, maxTier: 0 }];
    let maxTier = 0;
    for (const u of unlock) if (t >= u.from) maxTier = u.maxTier;
    return maxTier;
  }

  function defFor(c) {
    const behavior = c.behavior || 'chase';
    const tier = Math.min(c.tier || 0, TIER_STATS.length - 1);
    const base = TIER_STATS[tier];
    const atkK = c.attack || 1;
    const d = {
      dex: c.legacyId,
      creatureId: c.id,
      name: c.name,
      behavior,
      hp: Math.round(base.hp * (behavior === 'tank' ? 1.45 : behavior === 'runner' ? 0.72 : 1) * atkK),
      spd: Math.round(base.spd * (behavior === 'tank' ? 0.82 : behavior === 'runner' ? 1.55 : 1)),
      dmg: Math.max(4, Math.round(base.dmg * (behavior === 'tank' ? 1.15 : 1) * atkK)),
      xp: Math.max(3, Math.round(base.xp * (behavior === 'tank' ? 1.2 : 1))),
      weight: c.spawnWeight == null ? 1 : c.spawnWeight
    };
    const ti = tier;
    const CD = {
      ranged: 2.1 - ti * 0.12,
      fan: 3.0 - ti * 0.12,
      beamer: 4.0 - ti * 0.15,
      zoner: 4.2 - ti * 0.15,
      healer: 3.2,
      summoner: 6.5,
      jumper: 3.8 - ti * 0.1
    };
    if (CD[behavior]) {
      d.shotDmg = Math.round(d.dmg * (behavior === 'fan' ? 0.72 : 0.78));
      d.shotCd = +CD[behavior].toFixed(2);
      d.range = (behavior === 'beamer' ? 250 : behavior === 'healer' || behavior === 'summoner' ? 220 : 185) + ti * 8;
    }
    if (behavior === 'summoner') {
      const min = c.minionLegacyId || 99002;
      d.minion = min;
    }
    if (behavior === 'fan') d.fanN = ti < 1 ? 3 : 5;
    if (behavior === 'zoner') d.zones = ti < 1 ? 1 : ti < 2 ? 2 : 3;
    if (behavior === 'bomber') { d.spd = Math.round(d.spd * 1.2); d.hp = Math.round(d.hp * 0.85); }
    if (behavior === 'runner') { d.hp = Math.round(d.hp * 0.75); d.dmg = Math.round(d.dmg * 0.9); }
    return d;
  }

  function available(t) {
    const maxTier = maxTierAt(t);
    return enemies().filter(c => (c.tier || 0) <= maxTier).map(defFor);
  }

  function weightedPick(list) {
    if (!list.length) return null;
    const total = list.reduce((a, d) => a + (d.weight || 1), 0);
    let r = Math.random() * total;
    for (const d of list) {
      r -= d.weight || 1;
      if (r <= 0) return d;
    }
    return list[list.length - 1];
  }

  function rollRun() {
    bossCache = null;
    eliteCache = null;
    return { cast: (cfg().ENEMY_UNLOCK || []).map(u => ({ from: u.from, list: available(u.from) })) };
  }

  function scale(t) {
    const D = cfg().DIFFICULTY || { hpScale: 88, dmgScale: 390, spdScale: 1250, spdCap: 0.34 };
    return {
      hp: 1 + t / D.hpScale,
      dmg: 1 + t / D.dmgScale,
      spd: 1 + Math.min(D.spdCap, t / D.spdScale)
    };
  }

  function bossScale(t) {
    const D = cfg().DIFFICULTY || { bossHpScale: 580, bossDmgScale: 580 };
    return { hp: 1 + t / D.bossHpScale, dmg: 1 + t / D.bossDmgScale, spd: 1 + Math.min(0.2, t / 2000) };
  }

  let eliteCache = null;
  function buildElite() {
    if (eliteCache) return eliteCache;
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID.rune_guard;
    if (!c) return null;
    const d = defFor(c);
    d.name = 'Centinela de élite';
    d.behavior = 'jumper';
    d.hp = Math.round(d.hp * 2.4);
    d.dmg = Math.round(d.dmg * 1.45);
    d.xp = 85;
    d.shotDmg = Math.round(d.dmg * 0.7);
    d.shotCd = 2.4;
    d.range = 200;
    d.elite = true;
    eliteCache = d;
    return d;
  }

  let bossCache = null;
  function buildBoss() {
    if (bossCache) return bossCache;
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID.vault_warden;
    if (!c) return null;
    const d = defFor(c);
    d.hp = Math.round(c.hp * 1.35);
    d.dmg = Math.round(d.dmg * 1.35);
    d.xp = 220;
    d.shotDmg = Math.round(d.dmg * 0.65);
    d.shotCd = 1.4;
    d.range = 240;
    d.fanN = 5;
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
    const list = available(t);
    return list.length ? list : available(0);
  }

  function pickAt(t) {
    const list = bagAt(t);
    return weightedPick(list) || list[0];
  }

  function upcomingDex(t, ahead = 60) {
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
    return (base + t * perSec + Math.pow(t / 60, curvePow) * curveMul) * density;
  }

  return {
    rollRun,
    scale,
    bossScale,
    buildElite,
    bagAt,
    pickAt,
    upcomingDex,
    hordeTypes,
    hordeDefs,
    spawnRate,
    get BOSSES() { return bosses(); },
    get cast() { return rollRun().cast; }
  };
})();
