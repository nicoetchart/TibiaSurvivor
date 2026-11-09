/* ============ bestiary-telemetry.js — telemetría local de balance (BST-10) ============
 * No se persiste en el guardado; sesión en memoria. Export / consola con ?dev.
 */
G.BestiaryTelemetry = (() => {
  const MAX_SESSION = 40;
  let runStartMs = 0;
  let runKills = Object.create(null);
  let equipped = [];
  let upgradeSnap = Object.create(null);
  let session = [];
  let wired = false;

  function devOn() {
    return typeof location !== 'undefined' && /[?&]dev\b/.test(location.search);
  }

  function wire() {
    if (wired || !G.Bestiary || !G.Bestiary.on) return;
    wired = true;
    G.Bestiary.on('bestiary:kill-recorded', payload => {
      if (!payload || !payload.creatureId) return;
      const id = payload.creatureId;
      runKills[id] = (runKills[id] || 0) + 1;
    });
  }

  function catalogCompletionPct() {
    if (!G.Bestiary || !G.Bestiary.listEntries) return 0;
    const list = G.Bestiary.listEntries();
    if (!list.length) return 0;
    let done = 0;
    for (const row of list) {
      const prog = G.Bestiary.getProgressEntry(row.creatureId);
      if (prog && prog.rewarded) done++;
    }
    return done / list.length;
  }

  function beginRun() {
    wire();
    runStartMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    runKills = Object.create(null);
    equipped = [];
    upgradeSnap = Object.create(null);
    if (!G.Bestiary) return;
    equipped = G.Bestiary.listEquippedCharms ? G.Bestiary.listEquippedCharms() : [];
    for (const u of G.Bestiary.GLOBAL_UPGRADES || []) {
      upgradeSnap[u.id] = G.Bestiary.getUpgradeLevel(u.id);
    }
  }

  /**
   * @param {object} meta time, victory, dead, pointsEarned, advances, playerKills, bosses
   */
  function endRun(meta) {
    meta = meta || {};
    const runSec = Number.isFinite(meta.time) ? meta.time : 0;
    const points = Math.max(0, Math.floor(meta.pointsEarned || 0));
    const charmStats = G.BestiaryCharms && G.BestiaryCharms.getRunStats
      ? G.BestiaryCharms.getRunStats() : {};
    const advances = Array.isArray(meta.advances) ? meta.advances : [];
    const summary = {
      at: Date.now(),
      runSec,
      victory: !!meta.victory,
      dead: !!meta.dead,
      playerKills: Math.max(0, Math.floor(meta.playerKills || 0)),
      bosses: Math.max(0, Math.floor(meta.bosses || 0)),
      pointsEarned: points,
      pointsPerHour: runSec > 0 ? Math.round((points / runSec) * 3600) : 0,
      killsByCreature: Object.assign({}, runKills),
      advances: advances.map(a => Object.assign({}, a)),
      charms: charmStats,
      upgrades: Object.assign({}, upgradeSnap),
      equipped: equipped.slice(),
      catalogCompletedPct: Math.round(catalogCompletionPct() * 1000) / 10
    };
    session.push(summary);
    if (session.length > MAX_SESSION) session.shift();
    logDevRun(summary);
    return summary;
  }

  function logDevRun(summary) {
    if (!devOn() || !summary) return;
    console.groupCollapsed('[BestiaryTelemetry] run ' + summary.runSec.toFixed(0) + 's · pts ' + summary.pointsEarned);
    const rows = Object.keys(summary.killsByCreature).sort().map(id => ({
      creature: id,
      kills: summary.killsByCreature[id]
    }));
    if (rows.length) console.table(rows);
    else console.log('(sin bajas registradas en bestiario)');
    if (summary.advances && summary.advances.length) {
      console.log('hitos', summary.advances.length, '· catálogo completado', summary.catalogCompletedPct + '%');
    }
    const charms = summary.charms || {};
    if (Object.keys(charms).length) console.table(charms);
    console.groupEnd();
  }

  function getSession() {
    return session.map(s => Object.assign({}, s, {
      killsByCreature: Object.assign({}, s.killsByCreature),
      advances: (s.advances || []).map(a => Object.assign({}, a)),
      charms: Object.assign({}, s.charms),
      upgrades: Object.assign({}, s.upgrades),
      equipped: (s.equipped || []).slice()
    }));
  }

  function exportSession(pretty = true) {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      runs: getSession()
    }, null, pretty ? 2 : 0);
  }

  function logSession() {
    if (!devOn()) return;
    console.log('[BestiaryTelemetry] session', getSession().length, 'runs');
    console.table(getSession().map(s => ({
      sec: Math.round(s.runSec),
      pts: s.pointsEarned,
      pts_h: s.pointsPerHour,
      kills: s.playerKills,
      cat_pct: s.catalogCompletedPct
    })));
  }

  wire();
  return { beginRun, endRun, getSession, exportSession, logSession };
})();
