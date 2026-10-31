/* ============ neutral-roster.js — elenco de una partida neutral (Fase 3C) ============
 * Misma forma que G.Enemies (bagAt, scale, BOSSES…) para el spawner.
 * Fuente: G.CREATURES con role enemy. No lee G.DEX.
 * Sin jefe final: BOSSES queda vacío hasta una fase posterior.
 */
G.NeutralRoster = (() => {
  const TIERS = [
    { from: 0, maxTier: 0 },
    { from: 70, maxTier: 1 },
    { from: 160, maxTier: 2 }
  ];

  function enemies() {
    return (G.CREATURES || []).filter(c => c && c.role === 'enemy');
  }

  function defFor(c) {
    const behavior = c.behavior || 'chase';
    const d = {
      dex: c.legacyId,
      creatureId: c.id,
      name: c.name,
      behavior,
      hp: c.hp,
      spd: c.speed,
      dmg: Math.max(4, Math.round(6 * (c.attack || 1))),
      xp: 4 + (c.tier || 0) * 2
    };
    if (behavior === 'tank') {
      d.hp = Math.round(d.hp * 1.5);
      d.spd = Math.round(d.spd * 0.85);
    }
    if (behavior === 'ranged') {
      d.shotDmg = Math.round(d.dmg * 0.8);
      d.shotCd = 2.2;
      d.range = 190;
    }
    return d;
  }

  function available(t) {
    let maxTier = 0;
    for (const tier of TIERS) if (t >= tier.from) maxTier = tier.maxTier;
    return enemies().filter(c => (c.tier || 0) <= maxTier).map(defFor);
  }

  function rollRun() {
    return { cast: TIERS.map(tier => ({ from: tier.from, list: available(tier.from) })) };
  }

  function scale(t) {
    return { hp: 1 + t / 95, dmg: 1 + t / 420, spd: 1 + Math.min(0.35, t / 1400) };
  }

  function bossScale(t) {
    return { hp: 1 + t / 600, dmg: 1 + t / 600, spd: 1 };
  }

  function hordeTypes(t) {
    const counts = {};
    for (const d of available(t)) {
      const c = G.CREATURE_BY_LEGACY[d.dex];
      for (const ty of (c && c.damageTypes) || []) counts[ty] = (counts[ty] || 0) + 1;
    }
    return Object.keys(counts).filter(ty => counts[ty] >= 2);
  }

  function hordeDefs(type, t) {
    return available(t).filter(d => {
      const c = G.CREATURE_BY_LEGACY[d.dex];
      return c && c.damageTypes && c.damageTypes.includes(type);
    }).slice(0, 4);
  }

  function bagAt(t) {
    const horde = G.Events && G.Events.bag && G.Events.bag();
    if (horde) return horde;
    const list = available(t);
    return list.length ? list : available(0);
  }

  function upcomingDex(t, ahead = 60) {
    return available(t + ahead).map(d => d.dex);
  }

  return {
    TIERS,
    rollRun,
    scale,
    bossScale,
    bagAt,
    upcomingDex,
    hordeTypes,
    hordeDefs,
    get BOSSES() { return []; },
    get cast() { return rollRun().cast; }
  };
})();
