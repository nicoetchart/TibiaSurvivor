/* ============ ms-telemetry.js — métricas por hechizo MS (Fase MS-8) ============
 * Por run: daño, casts, hits, kills, daño a elites/jefes, nivel de adquisición y final.
 */
G.MsTelemetry = (() => {
  function active(pl) {
    return !!(pl && pl.vocationId === 'master_sorcerer');
  }

  function ensure(pl) {
    if (!pl.msSpellStats) pl.msSpellStats = Object.create(null);
  }

  function row(pl, spellId) {
    ensure(pl);
    if (!pl.msSpellStats[spellId]) {
      pl.msSpellStats[spellId] = {
        id: spellId,
        damage: 0,
        casts: 0,
        hits: 0,
        kills: 0,
        damageElite: 0,
        damageBoss: 0,
        acquireLevel: null,
        finalLevel: 1
      };
    }
    return pl.msSpellStats[spellId];
  }

  function reset(pl) {
    if (!pl) return;
    pl.msSpellStats = Object.create(null);
  }

  function onAcquire(pl, spellId, playerLevel) {
    if (!active(pl) || !spellId) return;
    const r = row(pl, spellId);
    if (r.acquireLevel == null) r.acquireLevel = playerLevel != null ? playerLevel : pl.level;
  }

  function syncFinalLevel(pl, spellId, lvl) {
    if (!active(pl) || !spellId) return;
    row(pl, spellId).finalLevel = lvl | 0;
  }

  function onCast(pl, spellId, lvl) {
    if (!active(pl) || !spellId || pl.remote) return;
    const r = row(pl, spellId);
    r.casts++;
    r.finalLevel = lvl != null ? (lvl | 0) : r.finalLevel;
  }

  function onHit(pl, spellId, dmg, enemy, lvl) {
    if (!active(pl) || !spellId || pl.remote) return;
    const d = Math.max(0, dmg);
    if (d <= 0) return;
    const r = row(pl, spellId);
    r.hits++;
    r.damage += d;
    if (enemy && enemy.elite) r.damageElite += d;
    if (enemy && enemy.boss) r.damageBoss += d;
    if (lvl != null) r.finalLevel = lvl | 0;
  }

  function onKill(pl, spellId, enemy) {
    if (!active(pl) || !spellId || pl.remote) return;
    row(pl, spellId).kills++;
    if (enemy && enemy.boss) row(pl, spellId).killsBoss = (row(pl, spellId).killsBoss || 0) + 1;
  }

  /** Sincroniza niveles finales de todos los hechizos equipados. */
  function finalize(pl) {
    if (!active(pl)) return [];
    for (const m of pl.moves) syncFinalLevel(pl, m.id, m.lvl);
    const out = [];
    for (const id in pl.msSpellStats) {
      const r = pl.msSpellStats[id];
      out.push({
        id: r.id,
        name: (G.Abilities.BY_ID[r.id] && G.Abilities.BY_ID[r.id].name) || r.id,
        damage: Math.round(r.damage),
        casts: r.casts,
        hits: r.hits,
        kills: r.kills,
        damageElite: Math.round(r.damageElite),
        damageBoss: Math.round(r.damageBoss),
        acquireLevel: r.acquireLevel,
        finalLevel: r.finalLevel
      });
    }
    out.sort((a, b) => b.damage - a.damage);
    return out;
  }

  function logDev(summary) {
    if (!summary || !summary.length) return;
    if (!/[?&]dev\b/.test(location.search)) return;
    console.table(summary.map(s => ({
      spell: s.name,
      dmg: s.damage,
      casts: s.casts,
      hits: s.hits,
      kills: s.kills,
      elite: s.damageElite,
      boss: s.damageBoss,
      got: s.acquireLevel,
      fin: s.finalLevel
    })));
  }

  return { reset, onAcquire, onCast, onHit, onKill, finalize, logDev };
})();
