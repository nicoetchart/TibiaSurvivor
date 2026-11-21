/* ============ events.js — eventos a mitad de partida (PSR-10) ============
 *
 * Cada 4-5 minutos (nunca con un jefe vivo ni en grieta):
 *   horde   Horda de un tipo elemental (~30 s)
 *   gold    Hora dorada: doble EXP y monedas ocasionales (~30 s)
 */
G.Events = (() => {
  const EVERY = [240, 300], DUR = 30;
  const authority = () => true;

  let nextT = 0, cur = null, last = null;

  function reset() {
    nextT = G.U.rand(EVERY[0], EVERY[1]);
    cur = null; last = null;
  }

  function update(dt, players, time) {
    if (cur) {
      cur.t += dt;
      if (cur.t >= cur.dur && authority()) end();
    }
    if (!authority() || G.Rift.inArena || (G.Judgment && G.Judgment.active)) return;

    if (cur) return;
    nextT -= dt;
    if (nextT > 0) return;
    if (G.EnemyMgr.bossAlive()) { nextT = 10; return; }
    nextT = G.U.rand(EVERY[0], EVERY[1]);
    const ids = ['horde', 'gold'].filter(id => id !== last);
    start(G.U.pick(ids), time, players);
  }

  function start(id, time, players) {
    last = id;
    if (id === 'horde') {
      const types = G.Content.roster().hordeTypes(time);
      if (!types.length) return start('gold', time, players);
      const type = G.U.pick(types);
      const defs = G.Content.roster().hordeDefs(type, time);
      G.Sprites.preload(defs.map(d => d.dex));
      cur = { id, t: 0, dur: DUR, type, defs };
      G.Spawner.burst(Math.round(6 * 1));
    } else if (id === 'gold') {
      cur = { id, t: 0, dur: DUR };
      for (const e of G.EnemyMgr.all()) if (!e.remote) e.makeGolden();
    }
    announce();
  }

  function announce() {
    if (!cur) return;
    if (cur.id === 'horde') say(G.U.TYPE_NAME[cur.type] + '-type horde!', 3);
    else if (cur.id === 'gold') say('Golden hour! Double experience', 3);
    G.Audio.sfx(cur.id === 'gold' ? 'shiny' : 'surge');
  }

  function say(text, secs) { G.Spawner.say(text, secs, true); }

  function end() {
    if (!cur) return;
    cur = null;
  }

  /** Lo que sale durante una horda (lo usa el roster neutral). */
  function bag() { return cur && cur.id === 'horde' && cur.defs.length ? cur.defs : null; }

  function onNet(ev) {
    switch (ev[1]) {
      case 's': cur = { id: ev[2], t: 0, dur: DUR, type: ev[3] || null }; break;
      case 'e': cur = null; break;
    }
  }

  function drawables() { return []; }

  function drawHud(ctx, w, h, pl, F) {
    if (!cur) return;
    const left = Math.max(0, Math.ceil(cur.dur - cur.t));
    const txt = (cur.id === 'gold' ? 'GOLDEN HOUR' : G.U.TYPE_NAME[cur.type].toUpperCase() + ' HORDE') + ' · ' + left + ' s';
    ctx.save();
    ctx.font = F(800, 12); ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)';
    ctx.strokeText(txt, w / 2, 112);
    ctx.fillStyle = cur.id === 'gold' ? '#ffd23f' : G.U.TYPE_COLOR[cur.type] || '#fff';
    ctx.fillText(txt, w / 2, 112);
    ctx.restore();
  }

  return {
    reset, update, bag, onNet, drawables, drawHud,
    get golden() { return !!cur && cur.id === 'gold'; },
    get current() { return cur ? cur.id : null; },
    debugStart(id) { start(id, G.Game.st.time, G.Game.everyone()); }
  };
})();