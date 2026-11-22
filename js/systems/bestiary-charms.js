/* ============ bestiary-charms.js — runtime de charms (CYC-7) ============ */
G.BestiaryCharms = (() => {
  let active = [];
  const cdUntil = new Map();
  let procLock = false;
  let procDepth = 0;
  const MAX_PROC_DEPTH = 2;
  let runStats = {};

  function now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  function charmDef(id) {
    return G.Bestiary && G.Bestiary.charmById ? G.Bestiary.charmById(id) : null;
  }

  function stat(id) {
    if (!runStats[id]) {
      runStats[id] = {
        procs: 0,
        bonusDamage: 0,
        bonusDamageNormal: 0,
        bonusDamageElite: 0,
        bonusDamageBaneBoss: 0,
        bonusDamageBoss: 0,
        mitigated: 0,
        heals: 0,
        slows: 0,
        bonusXp: 0,
        pickups: 0,
        shieldAdded: 0,
        skippedClass: 0
      };
    }
    return runStats[id];
  }

  function beginRun() {
    clear();
    if (!G.Bestiary || !G.Bestiary.listEquippedCharms) return;
    active = G.Bestiary.listEquippedCharms().map(id => charmDef(id)).filter(Boolean);
  }

  function clear() {
    active = [];
    cdUntil.clear();
    procLock = false;
    procDepth = 0;
    runStats = {};
  }

  function endRun() {
    clear();
  }

  function charmsForTrigger(trigger) {
    return active.filter(c => c.trigger === trigger);
  }

  function canProc(charm) {
    const t = cdUntil.get(charm.id) || 0;
    return now() >= t;
  }

  function markProc(charm) {
    cdUntil.set(charm.id, now() + Math.max(0, charm.cooldownMs || 0));
    stat(charm.id).procs++;
  }

  function roll(charm) {
    const p = charm.procChance;
    return Number.isFinite(p) && p > 0 && Math.random() < p;
  }

  function targetBestiaryClass(e) {
    if (!e || !e.def) return 'unknown';
    const id = e.def.creatureId || e.def.bestiaryCreatureId;
    if (G.Cyclopedia && id && G.Cyclopedia.getDefinition) {
      const def = G.Cyclopedia.getDefinition(id);
      if (def && def.bestiaryClass) return def.bestiaryClass;
    }
    if (id && G.CREATURE_BY_ID && G.CREATURE_BY_ID[id] && G.CREATURE_BY_ID[id].bestiaryClass) {
      return G.CREATURE_BY_ID[id].bestiaryClass;
    }
    return 'unknown';
  }

  function charmAppliesToTarget(charm, e) {
    const want = charm.bestiaryClass || (G.Bestiary && G.Bestiary.CHARM_DEFAULT_CLASS) || 'wilderness';
    if (want === 'wilderness' || want === 'unknown') return true;
    return targetBestiaryClass(e) === want;
  }

  function withProcGuard(fn) {
    if (procLock || procDepth >= MAX_PROC_DEPTH) return;
    procLock = true;
    procDepth++;
    try { fn(); } finally {
      procDepth--;
      procLock = false;
    }
  }

  function bonusFromScale(e, effect) {
    if (!e || !effect) return 0;
    const base = effect.value;
    const bossCap = effect.bossCap != null ? effect.bossCap : base;
    let frac = base;
    if (e.boss) frac = bossCap;
    else if (e.baneBoss || e.elite) frac = Math.min(base, (base + bossCap) * 0.5);
    return Math.max(1, Math.round(e.maxHp * frac));
  }

  function applyBonusDamage(pl, e, charm, bonus) {
    e.hurt(bonus, '#c9a0ff', 0, 0, 0, 'charm');
    G.FX.dmgText(e.x, e.y - e.bodyH - 10, '+' + bonus, '#c9a0ff', false);
    const st = stat(charm.id);
    st.bonusDamage += bonus;
    if (e.boss) st.bonusDamageBoss += bonus;
    else if (e.baneBoss) st.bonusDamageBaneBoss = (st.bonusDamageBaneBoss || 0) + bonus;
    else if (e.elite) st.bonusDamageElite += bonus;
    else st.bonusDamageNormal += bonus;
  }

  function handleOnHit(pl, e, charm) {
    const ef = charm.effect;
    if (!ef) return;
    if (ef.kind === 'bonusDamage') {
      const bonus = bonusFromScale(e, ef);
      if (bonus <= 0) return;
      applyBonusDamage(pl, e, charm, bonus);
      return;
    }
    if (ef.kind === 'vampiricHeal' && pl.heal) {
      const frac = ef.value || 0.02;
      const heal = Math.max(1, Math.round(pl.maxHp * frac));
      pl.heal(heal);
      stat(charm.id).heals += heal;
      return;
    }
    if (ef.kind === 'crippleSlow' && e.applySlow) {
      const dur = Math.max(0.2, (ef.durationMs || 2000) / 1000);
      e.applySlow(Math.min(0.7, ef.value || 0.2), dur);
      stat(charm.id).slows++;
      G.FX.ring(e.x, e.y, e.r, e.r * 2.2, '#9fd8ff', 0.25, 2);
    }
  }

  function handleOnHitTaken(pl, charm, mitigated) {
    stat(charm.id).mitigated += mitigated;
    G.FX.dmgText(pl.x, pl.y - pl.bodyH - 14, '−' + Math.round(mitigated), '#7eb8ff', true);
  }

  function handleMagicShieldBump(pl, charm) {
    const ef = charm.effect;
    if (!pl || pl.magicShieldMax <= 0) return;
    const add = Math.round(pl.maxHp * (ef.value || 0.08));
    if (add <= 0) return;
    const cap = pl.magicShieldMax;
    pl.magicShield = Math.min(cap, pl.magicShield + add);
    stat(charm.id).shieldAdded += add;
    G.FX.ring(pl.x, pl.y, 8, 48, '#7eb8ff', 0.4, 3);
  }

  function handlePickup(pl, pickup, charm) {
    const ef = charm.effect;
    if (!ef) return;
    if (ef.kind === 'moveSpeedBurst') {
      const dur = Math.max(0.1, (ef.durationMs || 800) / 1000);
      pl.addBuff('spd', ef.value || 0.1, dur, 1);
      stat(charm.id).pickups++;
      G.FX.ring(pl.x, pl.y, 8, 55, '#9ae6ff', 0.35, 2);
      return;
    }
    if (ef.kind === 'pickupXpBonus' && (pickup.kind === 'xp' || pickup.kind === 'xpBig') && pl.gainXp) {
      const bonus = Math.max(1, Math.round(pickup.value * (ef.value || 0.15)));
      pl.gainXp(bonus);
      stat(charm.id).bonusXp += bonus;
      stat(charm.id).pickups++;
      G.FX.dmgText(pl.x, pl.y - pl.bodyH - 8, '+' + bonus + ' XP', '#b8ff9a', false);
      return;
    }
    if (ef.kind === 'magnetRadiusBurst') {
      const dur = Math.max(0.1, (ef.durationMs || 1200) / 1000);
      const mul = 1 + (ef.value || 0.3);
      pl._charmMagnetRestore = pl._charmMagnetRestore || pl.magnet;
      pl.magnet = pl._charmMagnetRestore * mul;
      pl._charmMagnetUntil = now() + dur * 1000;
      stat(charm.id).pickups++;
      G.FX.ring(pl.x, pl.y, 8, pl.magnet * 0.45, '#ffe566', 0.3, 2);
    }
  }

  function tickMagnetRestore(pl) {
    if (!pl || !pl._charmMagnetUntil) return;
    if (now() >= pl._charmMagnetUntil) {
      if (pl._charmMagnetRestore != null) pl.magnet = pl._charmMagnetRestore;
      pl._charmMagnetUntil = 0;
      pl._charmMagnetRestore = null;
    }
  }

  function onHit(pl, e) {
    if (!pl || !e || e.dead) return;
    tickMagnetRestore(pl);
    for (const charm of charmsForTrigger('onHit')) {
      if (!canProc(charm) || !roll(charm)) continue;
      if (!charmAppliesToTarget(charm, e)) {
        stat(charm.id).skippedClass++;
        continue;
      }
      withProcGuard(() => {
        markProc(charm);
        handleOnHit(pl, e, charm);
      });
    }
  }

  function filterIncoming(pl, amount) {
    if (procLock || !pl || amount <= 0) return amount;
    tickMagnetRestore(pl);
    let d = amount;
    for (const charm of charmsForTrigger('onHitTaken')) {
      if (d <= 0) break;
      if (!canProc(charm) || !roll(charm)) continue;
      const ef = charm.effect;
      if (ef && ef.kind === 'mitigateHit') {
        const mit = Math.min(d, d * Math.min(0.9, Math.max(0, ef.value)));
        if (mit <= 0) continue;
        markProc(charm);
        d -= mit;
        handleOnHitTaken(pl, charm, mit);
        continue;
      }
      if (ef && ef.kind === 'magicShieldBump') {
        markProc(charm);
        handleMagicShieldBump(pl, charm);
      }
    }
    return Math.max(0, d);
  }

  function onPickup(pl, pickup) {
    if (!pl || procLock) return;
    tickMagnetRestore(pl);
    const kinds = new Set(['xp', 'xpBig', 'coin', 'heal', 'magnet']);
    if (!pickup || !kinds.has(pickup.kind)) return;
    for (const charm of charmsForTrigger('onPickup')) {
      if (!canProc(charm) || !roll(charm)) continue;
      withProcGuard(() => {
        markProc(charm);
        handlePickup(pl, pickup, charm);
      });
    }
  }

  function getRunStats() {
    const out = {};
    for (const k of Object.keys(runStats)) out[k] = Object.assign({}, runStats[k]);
    return out;
  }

  /** For validators: wound boss cap ratio. */
  function simulateBossWoundBonus(maxHp, elite = false, boss = true) {
    const wound = charmDef('wound');
    if (!wound || !wound.effect) return 0;
    const fake = { maxHp, boss, elite, baneBoss: elite && !boss };
    return bonusFromScale(fake, wound.effect);
  }

  return {
    beginRun,
    endRun,
    clear,
    onHit,
    filterIncoming,
    onPickup,
    getRunStats,
    simulateBossWoundBonus,
    targetBestiaryClass,
    charmAppliesToTarget
  };
})();