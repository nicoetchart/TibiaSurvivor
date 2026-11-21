/* ============ interact.js — altares, manantiales, cofres con candado y trampas ============
 * Los objetos los coloca world.js (raros, en el suelo libre); aquí está lo que
 * pasa al tocarlos. Todo se mira alrededor del jugador:
 *
 *   altar     da un poder de 25 s (Furia, Rayo, Imán o Prisa) y se apaga
 *   spring    cura mientras estás encima; se agota y se recarga sola
 *   bigchest  quédate a su lado CHEST_TIME segundos (mientras te atacan) y se
 *             abre: monedas y experiencia para subir un nivel
 *   trap      salta al pisarla (tú o un enemigo) y afecta a todo lo cercano:
 *             veneno, pegajosa (ralentiza) o explosiva
 *
 * Cooperativo: altares y manantiales son de cada uno (en cada ordenador); el
 * cofre y las trampas se rompen como cualquier objeto y el anfitrión reparte
 * el botín y el daño a los enemigos (ver world.destroyProp y coop.propBroken).
 */
G.Interact = (() => {
  const CHEST_TIME = 3.5;
  const POWER_TIME = 25;
  const POWERS = [
    { id: 'dmg', name: 'Fury', desc: 'damage ×2', color: '#ff5f6d', on: p => { p.atkMul *= 2; }, off: p => { p.atkMul /= 2; } },
    { id: 'spd', name: 'Bolt', desc: '+45% speed', color: '#5fd4ff', on: p => { p.spdMul *= 1.45; }, off: p => { p.spdMul /= 1.45; } },
    { id: 'mag', name: 'Magnet', desc: 'pull everything from afar', color: '#ff8ad8', on: p => { p.magnet *= 4; }, off: p => { p.magnet /= 4; } },
    { id: 'cd', name: 'Haste', desc: '-40% cooldown', color: '#ffd23f', on: p => { p.cdMul *= 0.6; }, off: p => { p.cdMul /= 0.6; } }
  ];
  const TRAP_R = 74;
  const POISON_TRAP_PLAYER_FRAC = 0.35;
  const POISON_TRAP_PLAYER_SEC = 10;
  const STICKY_TRAP_PLAYER_SEC = 5;
  const STICKY_TRAP_PLAYER_SPD_MUL = 0.25;
  const STICKY_TRAP_ENEMY_ELECTRIFIED_SEC = 5;
  const STICKY_TRAP_PLAYER_MSG = 'Paralyzed!';
  const STICKY_TRAP_PLAYER_MSG_COLOR = '#b48aff';
  const authority = () => true;
  let healShown = 0, healAcc = 0;

  function update(dt, pl) {
    if (!pl) return;
    for (const p of G.World.specialsNear(pl.x, pl.y, 720)) {
      const d2 = G.U.dist2(pl.x, pl.y, p.x, p.type === 'spring' || p.type === 'trap' ? p.y - 8 : p.y);
      switch (p.type) {
        case 'spring': spring(dt, pl, p, d2); break;
        case 'altar':
          // Contando el tamaño del sprite: criaturas grandes chocan
          // con el altar antes de llegar a 30 y no lo podía activar.
          if (!p.used && !pl.dead && d2 < Math.max(30, p.r + pl.r + 14) ** 2) usePower(pl, p);
          break;
        case 'bigchest':
          if (!pl.dead && d2 < Math.max(46, p.r + pl.r + 24) ** 2) {
            if (p.open === 0) G.Audio.sfx('select');
            p.open += dt;
            if (p.open >= CHEST_TIME) { p.open = 0; G.World.breakProp(p); }
          } else if (p.open > 0) p.open = Math.max(0, p.open - dt * 1.5);
          break;
        case 'trap': {
          const stepR = (G.Tiles && G.Tiles.trapStepRadius)
            ? G.Tiles.trapStepRadius(p) : (p.r || 13);
          const markVfxOn = ent => {
            p.trapVfxActor = { x: ent.x, y: ent.y, bodyH: ent.bodyH || 0 };
          };
          if (!pl.dead && d2 < stepR * stepR) {
            markVfxOn(pl);
            G.World.breakProp(p);
          } else if (authority()) {
            const tcx = p.x, tcy = p.y - 8;
            const onTrap = G.EnemyMgr.queryCircle(tcx, tcy, stepR)
              .filter(e => !e.flying && !e.remote);
            if (onTrap.length) {
              let tr = onTrap[0];
              let best = G.U.dist2(tcx, tcy, tr.x, tr.y);
              for (let i = 1; i < onTrap.length; i++) {
                const d = G.U.dist2(tcx, tcy, onTrap[i].x, onTrap[i].y);
                if (d < best) { best = d; tr = onTrap[i]; }
              }
              markVfxOn(tr);
              G.World.breakProp(p);
            }
          }
          break;
        }
      }
    }
  }

  function spring(dt, pl, p, d2) {
    if (p.charge < 1) p.charge = Math.min(1, p.charge + dt / 45);
    if (pl.dead || d2 > 26 * 26 || p.charge <= 0.02 || pl.hp >= pl.maxHp) return;
    const before = pl.hp;
    pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.14 * dt);
    healAcc += pl.hp - before;
    p.charge = Math.max(0, p.charge - dt * 0.09);
    if (Math.random() < dt * 14) G.FX.px(pl.x + G.U.rand(-pl.r, pl.r), pl.y - G.U.rand(0, pl.bodyH), '#7dffb0', { vy: -50, life: 0.5 });
    healShown -= dt;
    if (healShown <= 0 && healAcc >= 1) {
      healShown = 0.6;
      G.FX.dmgText(pl.x, pl.y - pl.bodyH - 6, '+' + Math.round(healAcc), '#5fe08a');
      healAcc = 0;
      G.Audio.sfx('xp');
    }
    if (p.charge <= 0.02) G.Spawner.say('The spring ran dry (it refills on its own)', 2.2, true);
  }

  function usePower(pl, p) {
    p.used = true;
    const pw = POWERS[p.kind];
    pl.addPower(pw, POWER_TIME);
    G.FX.ring(p.x, p.y - 20, 8, 90, pw.color, 0.6, 5);
    G.FX.burst(pl.x, pl.y - pl.bodyH * 0.5, pw.color, 24, 200);
    G.Audio.sfx('legend');
    G.Spawner.say(pw.name + ' power! ' + pw.desc + ' for ' + POWER_TIME + ' s', 3, true);
  }

  /**
   * Una trampa salta (en cada ordenador; ver la cabecera). El daño a enemigos
   * sólo lo hace quien manda; a ti te afecta si estás dentro.
   */
  function trapEffect(p) {
    const x = p.x, y = p.y - 8, k = p.kind;
    const act = p.trapVfxActor;
    const vfxOffX = G.Tiles && G.Tiles.trapBurstDrawOffX ? G.Tiles.trapBurstDrawOffX(32) : 0;
    const vfxX = (act ? act.x : x) + vfxOffX;
    const vfxY = act ? act.y - (act.bodyH || 0) * 0.42 : y;
    const col = ['#c86bdc', '#8bd94a', '#ff7b3d'][k];
    const pal = ['poison', 'grass', 'fire'][k];
    if (k === 0 && G.Tiles && G.Tiles.playPoisonTrapBurst) {
      G.Tiles.playPoisonTrapBurst(vfxX, vfxY);
    } else if (k === 1 && G.Tiles && G.Tiles.playStickyTrapBurst) {
      G.Tiles.playStickyTrapBurst(vfxX, act ? act.y : y, !!act);
    } else if (k === 2 && G.Tiles && G.Tiles.playExplosiveTrapBurst) {
      G.Tiles.playExplosiveTrapBurst(vfxX, act ? act.y : y, !!act);
    }
    G.Audio.sfx(k === 2 ? 'boss' : 'surge');
    const camX = act ? act.x : x;
    const camY = act ? act.y - (act.bodyH || 0) * 0.3 : y;
    if (k === 2 && G.U.dist2(camX, camY, G.Camera.x, G.Camera.y) < 500 * 500) G.Camera.kick(0.7);

    const pl = G.Game.player;
    const lvl = pl ? pl.level : 1;
    if (authority()) {
      for (const e of G.EnemyMgr.queryCircle(x, y, TRAP_R)) {
        if (e.remote) continue;
        if (k === 0) {
          const venomCol = G.Player.VENOM_TRAP_DMG_COLOR;
          e.applyPoison(5, venomCol);
          e.hurt(14 + lvl * 3, venomCol);
        }
        else if (k === 1) e.applyElectrified(STICKY_TRAP_ENEMY_ELECTRIFIED_SEC);
        else e.hurt(90 + lvl * 18, '#ff7b3d', e.x - x, e.y - y, 220);
      }
    }
    if (pl && !pl.dead && G.U.dist2(x, y, pl.x, pl.y) < (TRAP_R * 0.7) ** 2) {
      pl.invuln = 0;
      if (k === 0) pl.applyVenomTrap(POISON_TRAP_PLAYER_FRAC, POISON_TRAP_PLAYER_SEC);
      else if (k === 1) {
        pl.slowT = STICKY_TRAP_PLAYER_SEC;
        pl.slowMul = STICKY_TRAP_PLAYER_SPD_MUL;
        G.FX.dmgText(pl.x, pl.y - pl.bodyH - 6, STICKY_TRAP_PLAYER_MSG, STICKY_TRAP_PLAYER_MSG_COLOR);
      }
      else pl.hurt(pl.maxHp * 0.2);
    }
  }

  return { update, trapEffect, POWERS, CHEST_TIME };
})();
