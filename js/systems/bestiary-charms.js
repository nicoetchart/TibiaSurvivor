/* ============ bestiary-charms.js — runtime de charms (BST-8) ============ */
G.BestiaryCharms = (() => {
  let active = [];
  const cdUntil = new Map();
  let procLock = false;
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
        bonusDamageBoss: 0,
        mitigated: 0,
        pickups: 0
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

  function bonusFromScale(e, effect) {
    if (!e || !effect) return 0;
    const base = effect.value;
    const bossCap = effect.bossCap != null ? effect.bossCap : base;
    let frac = base;
    if (e.boss) frac = bossCap;
    else if (e.elite || e.sentinelElite) frac = Math.min(base, (base + bossCap) * 0.5);
    return Math.max(1, Math.round(e.maxHp * frac));
  }

  function onHit(pl, e) {
    if (procLock || !pl || !e || e.dead) return;
    for (const charm of charmsForTrigger('onHit')) {
      if (!canProc(charm) || !roll(charm)) continue;
      const ef = charm.effect;
      if (!ef || ef.kind !== 'bonusDamage') continue;
      const bonus = bonusFromScale(e, ef);
      if (bonus <= 0) continue;
      markProc(charm);
      procLock = true;
      try {
        e.hurt(bonus, '#c9a0ff', 0, 0, 0, 'charm');
        G.FX.dmgText(e.x, e.y - e.bodyH - 10, '+' + bonus, '#c9a0ff', false);
        const st = stat(charm.id);
        st.bonusDamage += bonus;
        if (e.boss) st.bonusDamageBoss += bonus;
        else if (e.elite || e.sentinelElite) st.bonusDamageElite += bonus;
        else st.bonusDamageNormal += bonus;
      } finally {
        procLock = false;
      }
    }
  }

  function filterIncoming(pl, amount) {
    if (procLock || !pl || amount <= 0) return amount;
    let d = amount;
    for (const charm of charmsForTrigger('onHitTaken')) {
      if (d <= 0) break;
      if (!canProc(charm) || !roll(charm)) continue;
      const ef = charm.effect;
      if (!ef || ef.kind !== 'mitigateHit') continue;
      const mit = Math.min(d, d * Math.min(0.9, Math.max(0, ef.value)));
      if (mit <= 0) continue;
      markProc(charm);
      d -= mit;
      stat(charm.id).mitigated += mit;
      G.FX.dmgText(pl.x, pl.y - pl.bodyH - 14, '−' + Math.round(mit), '#7eb8ff', true);
    }
    return Math.max(0, d);
  }

  function onPickup(pl, pickup) {
    if (!pl || procLock) return;
    const kinds = new Set(['xp', 'xpBig', 'coin', 'heal', 'magnet']);
    if (!pickup || !kinds.has(pickup.kind)) return;
    for (const charm of charmsForTrigger('onPickup')) {
      if (!canProc(charm) || !roll(charm)) continue;
      const ef = charm.effect;
      if (!ef || ef.kind !== 'moveSpeedBurst') continue;
      markProc(charm);
      const dur = Math.max(0.1, (ef.durationMs || 800) / 1000);
      pl.addBuff('spd', ef.value || 0.1, dur, 1);
      stat(charm.id).pickups++;
      G.FX.ring(pl.x, pl.y, 8, 55, '#9ae6ff', 0.35, 2);
    }
  }

  function getRunStats() {
    const out = {};
    for (const k of Object.keys(runStats)) out[k] = Object.assign({}, runStats[k]);
    return out;
  }

  return { beginRun, endRun, clear, onHit, filterIncoming, onPickup, getRunStats };
})();
