/* ============ combat.js — ejecución de movimientos y colisiones ============
 * Sólo se ejecuta el movimiento ACTIVO del jugador. Cada `kind` tiene aquí su
 * implementación. Todos los ataques dañan también los objetos destructibles
 * del escenario (rocas, cofres, hierba alta).
 *
 * Todo ocurre en el plano del suelo: (x, y) son pies / sombra.
 *
 * Cooperativo: cada ordenador ejecuta los ataques de SU jugador. Los de los
 * compañeros llegan por la red y se repiten como "fantasma" (ghostCast): se
 * ven igual, pero no hacen daño aquí (ya lo hizo su dueño).
 *
 * Lo que se queda en el mapa un rato (minas, meteoros que caen, torretas,
 * charcos del rastro) vive en `fields` y se actualiza/dibuja aquí.
 */
G.Combat = (() => {
  let ghost = false;
  let fields = [];

  // ---------------- ejecutar el movimiento activo ----------------

  function tick(dt, pl, now) {
    if (pl.dead) return;
    // Vínculos: todos los movimientos del hueco activo, cada uno con su recarga.
    for (const m of pl.activeGroup()) tickMove(dt, pl, m, now);
  }

  function tickMove(dt, pl, m, now) {
    if (m.kind === 'orbit') { orbit(pl, m, dt, now); return; }

    m.t -= dt;
    if (m.t > 0) return;
    // Los ataques que necesitan blanco esperan a tenerlo (no gastes animación al aire).
    if (needsTarget(m)) {
      let ok = false;
      if (m.id === 'fire_wave') ok = anyEnemyInFireWaveCone(pl, m);
      else if (pl.target && G.U.dist(pl.x, pl.y, pl.target.x, pl.target.y) <= reach(m)) ok = true;
      if (!ok) { m.t = 0.05; return; }
    }
    m.t = (pl.vocationId && G.MasterSorcerer)
      ? G.MasterSorcerer.minCooldownFor(pl, m.cd)
      : Math.max(0.05, m.cd * pl.cdMul);
    pl.cast(m);
    // Vínculo: su icono destella en el HUD al lanzarse (uno que explota pegado al
    // enemigo, como Ascuas tras Ataque Rápido, casi no se ve).
    m.castAt = performance.now();

    run(pl, m);
    if (!ghost && G.MsTelemetry) G.MsTelemetry.onCast(pl, m.id, m.lvl);
  }

  function run(pl, m) {
    switch (m.kind) {
      case 'projectile': fireProjectiles(pl, m); break;
      case 'melee':
        if (m.id === 'fire_wave') fireWave(pl, m);
        else if (m.id === 'great_fire_wave') greatFireWave(pl, m);
        else melee(pl, m);
        break;
      case 'beam':
        if (m.id === 'energy_wave') energyWave(pl, m);
        else if (m.id === 'energy_beam') energyBeam(pl, m);
        else if (m.id === 'great_energy_beam') greatEnergyBeam(pl, m);
        else beam(pl, m);
        break;
      case 'nova':
        if (m.id === 'hells_core') hellsCore(pl, m);
        else nova(pl, m);
        break;
      case 'aura':       aura(pl, m); break;
      case 'buff':       buff(pl, m); break;
      case 'boomerang':  boomerang(pl, m); break;
      case 'chain':      chain(pl, m); break;
      case 'mine':       mines(pl, m); break;
      case 'meteor':
        if (m.id === 'rage_of_the_skies') rageOfTheSkies(pl, m);
        else meteors(pl, m);
        break;
      case 'turret':     turret(pl, m); break;
      case 'dash':       dash(pl, m); break;
      case 'trail':      trailPatch(pl, m); break;
      case 'cone':       cone(pl, m); break;
    }
  }

  const TARGETED = ['melee', 'beam', 'projectile', 'boomerang', 'chain', 'meteor', 'dash', 'cone'];
  function needsTarget(m) { return TARGETED.includes(m.kind); }
  function reach(m, pl) {
    if (m.id === 'fire_wave') return fireWaveSearchRadius(m, 1, pl);
    if (m.kind === 'melee') return m.radius + 30;
    if (m.kind === 'beam') return m.radius + 20;
    if (m.kind === 'boomerang') return m.radius + 40;
    if (m.kind === 'chain') return 280;
    if (m.kind === 'meteor') return 340;
    if (m.kind === 'dash') return m.radius + 60;
    if (m.kind === 'cone') return m.speed * m.life + 30;
    return 520;
  }

  function payload(m) {
    let burn = m.burn || 0;
    if (G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'burn_on_hit')) burn = Math.max(burn, 1);
    return { burn, poison: m.poison || 0, slow: m.slow || 0, knock: m.knock || 0, mtype: m.type, aid: m.id };
  }

  function moveDef(m) {
    return (m && m.def) || (m && G.Abilities && G.Abilities.BY_ID[m.id]) || null;
  }

  /** Objetivo MS: mayor vida en rango o más cercano. */
  function pickStrikeTarget(pl, m) {
    const def = moveDef(m);
    if (!def || !def.msTarget) return null;
    const maxDist = reach(m);
    const all = G.EnemyMgr.all();
    if (def.msTarget === 'max_hp') {
      let best = null, bestHp = -1;
      for (const e of all) {
        if (e.dead || e.remote) continue;
        if (G.U.dist(pl.x, pl.y, e.x, e.y) > maxDist) continue;
        if (e.hp > bestHp) { bestHp = e.hp; best = e; }
      }
      return best;
    }
    if (def.msTarget === 'nearest') {
      return G.Projectiles.nearest(all, pl.x, pl.y, maxDist);
    }
    return null;
  }

  function applySpellEffects(pl, e, m) {
    if (!m || ghost) return;
    if (m.id === 'death_strike' && G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'curse')) {
      e.applyCurse(G.MasterSorcerer.unlockValue(m, 'curse') || 3);
    }
    if (m.id === 'energy_strike' && G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'electrified')) {
      e.applyElectrified(G.MasterSorcerer.unlockValue(m, 'electrified') || 2);
    }
  }

  function computeStrikeDamage(pl, e, m, dmg) {
    if (m.type === 'death' && e.curse > 0) dmg *= 1.22;
    if (m.id === 'death_strike' && G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'execute')) {
      const frac = G.MasterSorcerer.unlockValue(m, 'execute') || 0.15;
      const hpF = e.hp / Math.max(1, e.maxHp);
      if (hpF <= frac) {
        if (e.boss || e.elite) dmg = Math.min(Math.max(dmg, 1) * 1.35, e.maxHp * 0.06);
        else dmg = Math.max(dmg, e.hp + 1);
      }
    }
    return dmg;
  }

  /** Flame Strike: onda de fuego en el impacto (desde nv. 1; radio crece con mejoras). */
  function flameStrikeSplash(owner, strike, primary, col) {
    if (ghost || !strike || strike.id !== 'flame_strike' || !primary) return;
    const r = strike.radius || 38;
    const splashMul = 0.52;
    G.FX.ring(primary.x, primary.y, 8, r, col, 0.3, 3);
    for (const e of G.EnemyMgr.queryCircle(primary.x, primary.y, r)) {
      if (e.dead || e.id === primary.id) continue;
      let dmg = strike.dmg * owner.atk * splashMul;
      if (G.MasterSorcerer) dmg *= G.MasterSorcerer.damageMulForType(owner, strike.type);
      dmg *= typeK(strike.type, e, strike.id, owner);
      hit(owner, e, dmg, col, e.x - primary.x, e.y - primary.y, 0, strike);
    }
  }

  /** Energy Strike: cadena limitada desde el impacto del proyectil. */
  function msEnergyChainFrom(pl, origin, m, hops) {
    if (ghost || hops <= 0 || !origin) return;
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    const radius = 220;
    const done = new Set([origin.id]);
    let cur = origin;
    let fx = origin.x, fy = origin.y - origin.bodyH * 0.5;
    let k = 0.88;
    for (let i = 0; i < hops; i++) {
      let best = null, bd = radius * radius;
      for (const e of G.EnemyMgr.queryCircle(cur.x, cur.y, radius)) {
        if (done.has(e.id) || e.dead) continue;
        const d = G.U.dist2(cur.x, cur.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) break;
      done.add(best.id);
      const tx = best.x, ty = best.y - best.bodyH * 0.5;
      G.FX.beam(fx, fy, Math.atan2(ty - fy, tx - fx), Math.hypot(tx - fx, ty - fy), 8, col, vis);
      applySpellEffects(pl, best, m);
      let dmg = computeStrikeDamage(pl, best, m, m.dmg * pl.atk * k);
      hit(pl, best, dmg, col, tx - fx, ty - fy, 0, m);
      k *= 0.85;
      fx = tx; fy = ty;
      cur = best;
    }
    if (!ghost) G.Camera.kick(0.04);
  }

  /** Enemigos válidos más cercanos al jugador (sin repetir). */
  function pickNearestEnemies(pl, maxDist, count, skip) {
    const all = G.EnemyMgr.all().filter(e => !e.dead && !e.remote);
    const picked = [];
    const used = skip || new Set();
    for (let n = 0; n < count; n++) {
      let best = null, bd = maxDist * maxDist;
      for (const e of all) {
        if (used.has(e.id)) continue;
        const d = G.U.dist2(pl.x, pl.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) break;
      used.add(best.id);
      picked.push(best);
    }
    return picked;
  }

  function defenseProfile(e) {
    if (!e) return null;
    return {
      types: e.types || ['physical'],
      weaknesses: e.weaknesses || [],
      resistances: e.resistances || [],
      immunities: e.immunities || []
    };
  }

  /** Tabla de tipos × clima, o ×1 si el ataque es una habilidad TibiaSurvivor. */
  function typeK(type, e, sourceId, pl) {
    let k = G.Content.attackFactor(type, defenseProfile(e), sourceId);
    if (pl && G.MasterSorcerer) k = G.MasterSorcerer.applyElementalPen(k, pl);
    return k;
  }

  function typeLabel(type, e, sourceId) {
    return G.Content.effectivenessLabel(type, defenseProfile(e), sourceId);
  }

  function fireProjectiles(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0);
    const spread = m.spread || 0;
    const multiTarget = n > 1 && (m.id === 'flame_strike' || m.msMultiTarget);
    const targets = multiTarget ? pickNearestEnemies(pl, reach(m), n, new Set()) : null;
    for (let i = 0; i < n; i++) {
      let a = pl.aim + G.U.rand(-0.03, 0.03);
      if (multiTarget && targets[i]) {
        const tg = targets[i];
        a = Math.atan2(tg.y - pl.y, tg.x - pl.x) + G.U.rand(-0.03, 0.03);
      } else if (!multiTarget) {
        const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * n;
        a = pl.aim + off + G.U.rand(-0.03, 0.03);
      } else {
        const off = (i / Math.max(1, n - 1) - 0.5) * spread * n;
        a = pl.aim + off + G.U.rand(-0.03, 0.03);
      }
      G.Projectiles.spawn(Object.assign({
        x: pl.x + Math.cos(a) * 3, y: pl.y + Math.sin(a) * 3,
        vx: Math.cos(a) * m.speed, vy: Math.sin(a) * m.speed,
        dmg: m.dmg * pl.atk, r: m.size, life: m.life,
        pierce: m.pierce | 0, color: col, homing: m.homing || 0,
        hits: new Set(), vis, ghost, owner: pl
      }, payload(m)));
    }
    G.FX.spark(pl.x + Math.cos(pl.aim) * pl.r, pl.y - G.LIFT + Math.sin(pl.aim) * pl.r,
               col, Math.cos(pl.aim), Math.sin(pl.aim), 3);
  }

  function nova(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    const n = Math.max(3, m.count | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + G.U.rand(-0.06, 0.06);
      G.Projectiles.spawn(Object.assign({
        x: pl.x + Math.cos(a) * 3, y: pl.y + Math.sin(a) * 3,
        vx: Math.cos(a) * m.speed, vy: Math.sin(a) * m.speed,
        dmg: m.dmg * pl.atk, r: m.size, life: m.life,
        pierce: m.pierce | 0, color: col, homing: m.homing || 0,
        hits: new Set(), vis, ghost, owner: pl
      }, payload(m)));
    }
    G.FX.ring(pl.x, pl.y, pl.r, pl.r * 4, col, 0.3, 3);
  }

  function inArc(px, py, x, y, aim, half) {
    const a = Math.atan2(y - py, x - px);
    return Math.abs(((a - aim + Math.PI * 3) % 6.2832) - Math.PI) <= half;
  }

  function melee(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const half = Math.min(m.arc, 6.2832) / 2;
    G.FX.slash(pl.x, pl.y - G.LIFT * 0.5, pl.aim, m.radius, m.arc, col, G.VFX.forMove(m));
    if (ghost) return;

    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) {
      if (!inArc(pl.x, pl.y, e.x, e.y, pl.aim, half)) continue;
      hit(pl, e, m.dmg * pl.atk, col, e.x - pl.x, e.y - pl.y, m.knock || 0, m);
    }
    for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) {
      if (inArc(pl.x, pl.y, p.x, p.y, pl.aim, half)) G.World.damageProp(p, m.dmg * pl.atk, col);
    }
  }

  function spawnFireGround(pl, m, x, y, dur) {
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    const r = Math.max(20, m.radius * 0.4);
    fields.push({
      kind: 'patch', owner: pl, ghost, m, col, vis,
      x, y, t: 0, life: dur, r, tick: 0.45,
      dmg: m.dmg * pl.atk * 0.25,
      msFireGround: true
    });
    const mine = fields.filter(o => o.kind === 'patch' && o.owner === pl && o.msFireGround && !o.gone);
    for (const o of mine.slice(0, Math.max(0, mine.length - 5))) o.gone = true;
    G.FX.ring(x, y, 4, r, col, 0.28, 2);
  }

  /** Patrón Fire Wave Tibia (filas 1–4; nv.5 añade fila 5). */
  const FIRE_WAVE_PATTERN_ROW5 = [
    [-2, 5], [-1, 5], [0, 5], [1, 5], [2, 5]
  ];
  const FIRE_WAVE_PATTERN = [
    [0, 1],
    [-1, 2], [0, 2], [1, 2],
    [-1, 3], [0, 3], [1, 3],
    [-2, 4], [-1, 4], [0, 4], [1, 4], [2, 4]
  ];

  function fireWavePattern(m) {
    if (m && m.lvl >= 5) return FIRE_WAVE_PATTERN.concat(FIRE_WAVE_PATTERN_ROW5);
    if (m && G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'fire_wave_row5')) {
      return FIRE_WAVE_PATTERN.concat(FIRE_WAVE_PATTERN_ROW5);
    }
    return FIRE_WAVE_PATTERN;
  }

  function fireWaveMaxRow(m) {
    return fireWavePattern(m).reduce((n, c) => Math.max(n, c[1]), 4);
  }

  /** Radio horizontal de la sombra del jugador (origen del cono = centro de la sombra). */
  function fireWaveShadowRx(pl) {
    const scale = pl.anim && pl.anim.scale != null ? pl.anim.scale : 1;
    if (G.Sprites && G.Sprites.shadowRadiusAt) return G.Sprites.shadowRadiusAt(pl.dex, scale);
    return (pl.r || 12) * 1.35;
  }

  /** Aim continuo → una de las 8 diagonales/cardinales (como el cono en Tibia). */
  function fireWaveAim8(aim) {
    if (G.Sprites && G.Sprites.dirFromAngle) {
      const d = G.Sprites.dirFromAngle(aim);
      return Math.PI / 2 - d * (Math.PI / 4);
    }
    return aim;
  }

  /** Distancia mínima delante de los pies para no solapar cuerpo / sombra en esa dirección. */
  function fireWaveClearFwd(pl, aim) {
    const body = pl.r || 12;
    const rx = fireWaveShadowRx(pl);
    const ry = rx * 0.42;
    const ca = Math.cos(aim), sa = Math.sin(aim);
    const denom = (ca * ca) / (rx * rx) + (sa * sa) / (ry * ry);
    const shadowEdge = denom > 1e-6 ? 1 / Math.sqrt(denom) : rx;
    return Math.max(body, shadowEdge);
  }

  /** Centros del patrón 1·3·3·5: fila 1 justo fuera del radio del personaje. */
  function fireWaveCellPos(pl, aim, fx, fy, step) {
    const a = fireWaveAim8(aim);
    const ca = Math.cos(a), sa = Math.sin(a);
    const base = fireWaveClearFwd(pl, a);
    const fwd = base + (fy - 1) * step + step * 0.5;
    const lat = fx * step;
    return { x: pl.x + ca * fwd - sa * lat, y: pl.y + sa * fwd + ca * lat };
  }

  /** Hit alineado al aim: cuadrado step×step por celda del cono (unión = forma del patrón). */
  function inFireWaveCellHit(cx, cy, aim, x, y, r, step) {
    const ca = Math.cos(aim), sa = Math.sin(aim);
    const px = x - cx, py = y - cy;
    const along = px * ca + py * sa;
    const lat = -px * sa + py * ca;
    const half = step * 0.5;
    const pad = r * 0.35;
    return Math.abs(along) <= half + pad && Math.abs(lat) <= half + pad;
  }

  /** Separación entre llamas = tamaño de una llama (32 art × PX); escala con `radius` del hechizo. */
  function fireWaveGridStep(m, scale) {
    const cell = (G.Tiles && G.Tiles.fireWaveCellWorld)
      ? G.Tiles.fireWaveCellWorld()
      : 32 * (G.Sprites && G.Sprites.PX ? G.Sprites.PX : 2);
    return cell * ((m.radius || 50) / 50) * scale;
  }

  function fireWaveSearchRadius(m, scale = 1, pl) {
    const step = fireWaveGridStep(m, scale);
    const rx = pl && fireWaveShadowRx(pl);
    const rows = fireWaveMaxRow(m);
    return (rx || 28) + step * rows + step * 2 + 24;
  }

  function enemyInFireWaveCone(pl, m, e, aim, step, patternScale = 1) {
    if (!e || e.dead) return false;
    const a8 = fireWaveAim8(aim);
    for (const [fx, fy] of fireWavePattern(m)) {
      const pos = fireWaveCellPos(pl, aim, fx * patternScale, fy * patternScale, step);
      if (inFireWaveCellHit(pos.x, pos.y, a8, e.x, e.y, e.r, step)) return true;
    }
    return false;
  }

  /** ¿Hay algún enemigo dentro del patrón con el aim actual? */
  function anyEnemyInFireWaveCone(pl, m) {
    const step = fireWaveGridStep(m, 1);
    const r = fireWaveSearchRadius(m, 1, pl);
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, r)) {
      if (enemyInFireWaveCone(pl, m, e, pl.aim, step)) return true;
    }
    return false;
  }

  /** Blanco: enemigo más cercano que cabría en el cono si apuntas a él. */
  function pickFireWaveTarget(pl, m) {
    const step = fireWaveGridStep(m, 1);
    const r = fireWaveSearchRadius(m, 1, pl);
    let best = null, bestD = 1e9;
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, r)) {
      if (e.dead || e.remote) continue;
      const aim = Math.atan2(e.y - pl.y, e.x - pl.x);
      if (!enemyInFireWaveCone(pl, m, e, aim, step)) continue;
      const d = G.U.dist2(pl.x, pl.y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  /** Fire Wave clásica: rejilla + sprite firewave.png; `scale` escala celdas (niveles / Great). */
  function fireWaveGrid(pl, m, aim, scale, hitOnce, allowGround) {
    const col = G.U.TYPE_COLOR[m.type];
    const step = fireWaveGridStep(m, scale);
    const queryR = step * 0.75 + 12;
    const dmgMul = scale >= 0.95 ? 1 : 0.88 * scale;
    const knock = (m.knock || 0) * Math.min(1, scale + 0.2);

    const pattern = fireWavePattern(m);
    const a8 = fireWaveAim8(aim);
    for (const [fx, fy] of pattern) {
      const pos = fireWaveCellPos(pl, aim, fx * scale, fy * scale, step);
      if (G.Tiles && G.Tiles.playFireWaveCell) G.Tiles.playFireWaveCell(pos.x, pos.y);
    }
    if (ghost) return;

    const hitSet = new Set();
    for (const [fx, fy] of pattern) {
      const pos = fireWaveCellPos(pl, aim, fx * scale, fy * scale, step);
      for (const e of G.EnemyMgr.queryCircle(pos.x, pos.y, queryR)) {
        if (hitOnce && hitOnce.has(e.id)) continue;
        if (hitSet.has(e.id)) continue;
        if (!inFireWaveCellHit(pos.x, pos.y, a8, e.x, e.y, e.r, step)) continue;
        const kx = e.x - pl.x, ky = e.y - pl.y;
        hit(pl, e, m.dmg * pl.atk * dmgMul, col, kx, ky, knock, m);
        hitSet.add(e.id);
        if (hitOnce) hitOnce.add(e.id);
      }
      for (const p of G.World.propsInCircle(pos.x, pos.y, queryR)) {
        if (inFireWaveCellHit(pos.x, pos.y, a8, p.x, p.y, p.r, step)) {
          G.World.damageProp(p, m.dmg * pl.atk * dmgMul, col);
        }
      }
    }
  }

  /** Cono de fuego alineado a `aim`; `scale` < 1 = wave secundaria (Great Fire Wave). */
  function fireWaveAt(pl, m, aim, scale, hitOnce, allowGround) {
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    const arc = Math.min(m.arc * scale, 6.2832);
    const half = arc / 2;
    const len = m.radius * scale;
    const ca = Math.cos(aim), sa = Math.sin(aim);
    const dmgMul = scale >= 0.95 ? 1 : 0.88 * scale;
    const knock = (m.knock || 0) * Math.min(1, scale + 0.2);
    G.FX.slash(pl.x, pl.y - G.LIFT * 0.5, aim, len, arc, col, vis);
    if (ghost) return;

    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, len + 12)) {
      if (hitOnce && hitOnce.has(e.id)) continue;
      const px = e.x - pl.x, py = e.y - pl.y;
      const along = px * ca + py * sa;
      if (along < -e.r * 0.3 || along > len + e.r) continue;
      if (!inArc(pl.x, pl.y, e.x, e.y, aim, half)) continue;
      hit(pl, e, m.dmg * pl.atk * dmgMul, col, px, py, knock, m);
      if (hitOnce) hitOnce.add(e.id);
    }
    for (const p of G.World.propsInCircle(pl.x, pl.y, len + 12)) {
      const px = p.x - pl.x, py = p.y - pl.y;
      const along = px * ca + py * sa;
      if (along < 0 || along > len + p.r) continue;
      if (inArc(pl.x, pl.y, p.x, p.y, aim, half)) G.World.damageProp(p, m.dmg * pl.atk * dmgMul, col);
    }

    if (allowGround && scale >= 0.95 && G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'fire_ground')) {
      const dur = G.MasterSorcerer.unlockValue(m, 'fire_ground') || 3;
      const dist = len * 0.55;
      spawnFireGround(pl, m, pl.x + ca * dist, pl.y + sa * dist * 0.85, dur);
    }
  }

  function fireWave(pl, m) {
    fireWaveGrid(pl, m, pl.aim, 1, null, true);
    if (!ghost) G.Camera.kick(0.06);
  }

  /** Great Fire Wave (MS): gran cono; nv.5 wave opuesta más pequeña. */
  function greatFireWave(pl, m) {
    const rev = G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'reverse_wave');
    const hitOnce = rev ? new Set() : null;
    fireWaveAt(pl, m, pl.aim, 1, hitOnce, false);
    if (rev) fireWaveAt(pl, m, pl.aim + Math.PI, 0.58, hitOnce, false);
    if (!ghost) G.Camera.kick(0.08);
  }

  function beamAt(pl, m, aim, hitOnce, dmgMul = 1) {
    const col = G.U.TYPE_COLOR[m.type];
    const w = m.width;
    const ca = Math.cos(aim), sa = Math.sin(aim);

    let len = m.radius;
    for (let d = 8; d < m.radius; d += 8) {
      if (G.World.isWall(pl.x + ca * d, pl.y + sa * d)) { len = d; break; }
    }
    G.FX.beam(pl.x, pl.y - G.LIFT, aim, len, w, col, G.VFX.forMove(m));
    if (ghost) return;

    const mx = pl.x + ca * len / 2, my = pl.y + sa * len / 2;
    const onBeam = (x, y, r) => {
      const px = x - pl.x, py = y - pl.y;
      const along = px * ca + py * sa;
      if (along < -r || along > len + r) return false;
      return Math.abs(-px * sa + py * ca) <= w / 2 + r;
    };
    for (const e of G.EnemyMgr.queryCircle(mx, my, len / 2 + w)) {
      if (hitOnce && hitOnce.has(e.id)) continue;
      if (onBeam(e.x, e.y, e.r)) {
        hit(pl, e, m.dmg * pl.atk * dmgMul, col, ca, sa, 0, m);
        if (hitOnce) hitOnce.add(e.id);
      }
    }
    for (const p of G.World.propsInCircle(mx, my, len / 2 + w)) {
      if (onBeam(p.x, p.y, p.r)) G.World.damageProp(p, m.dmg * pl.atk * dmgMul, col);
    }
  }

  function beam(pl, m) {
    beamAt(pl, m, pl.aim);
    if (!ghost) G.Camera.kick(0.08);
  }

  /** Energy Wave (MS): onda penetrante; nv.5 tres direcciones. */
  function energyWave(pl, m) {
    const split = G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'wave_split');
    const hitOnce = split ? new Set() : null;
    if (split) {
      const spread = 0.36;
      beamAt(pl, m, pl.aim - spread, hitOnce);
      beamAt(pl, m, pl.aim, hitOnce);
      beamAt(pl, m, pl.aim + spread, hitOnce);
      if (!ghost) G.Camera.kick(0.1);
      return;
    }
    beam(pl, m);
  }

  /** Energy Beam (MS): rayo penetrante; nv.5 segundo pulso breve. */
  function energyBeam(pl, m) {
    beamAt(pl, m, pl.aim);
    if (!ghost && G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'beam_persist_double')) {
      const echoes = fields.filter(o => o.kind === 'beam_echo' && o.owner === pl && !o.gone);
      for (const o of echoes.slice(0, Math.max(0, echoes.length - 2))) o.gone = true;
      fields.push({
        kind: 'beam_echo', owner: pl, ghost, m, aim: pl.aim,
        t: 0, delay: 0.22, dmgMul: 0.72, done: false, life: 0.55
      });
    }
    if (!ghost) G.Camera.kick(0.08);
  }

  /** Great Energy Beam (MS): rayo ancho; nv.5 cuatro direcciones cardinales. */
  function greatEnergyBeam(pl, m) {
    if (G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'beam_cardinal')) {
      const hitOnce = new Set();
      const base = pl.aim;
      for (let i = 0; i < 4; i++) beamAt(pl, m, base + i * (Math.PI / 2), hitOnce);
      if (!ghost) G.Camera.kick(0.14);
      return;
    }
    beam(pl, m);
  }

  /** Tope de daño en jefes/elites para ultimates (no one-shot). */
  function capUltimateHit(e, dmg) {
    if (!e) return dmg;
    if (e.boss) return Math.min(dmg, Math.max(8, e.maxHp * 0.12));
    if (e.elite) return Math.min(dmg, Math.max(6, e.maxHp * 0.22));
    return dmg;
  }

  function hellsCoreRadius(m) {
    if (m.radius != null && m.radius > 0) return m.radius;
    const n = Math.max(8, m.count | 0);
    return 48 + n * 2.6;
  }

  /** Explosión radial instantánea (Hell's Core). */
  function radialBlast(pl, m, x, y, r, dmgMul) {
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    G.FX.ring(x, y, 10, r, col, 0.38, 4.2);
    G.FX.burst(x, y - G.LIFT * 0.35, col, 18, 200);
    if (ghost) return;
    for (const e of G.EnemyMgr.queryCircle(x, y, r)) {
      let dmg = capUltimateHit(e, m.dmg * pl.atk * dmgMul);
      hit(pl, e, dmg, col, e.x - x, e.y - y, m.knock || 0, m);
      if (e.burn === 0) e.applyBurn(1);
    }
    for (const p of G.World.propsInCircle(x, y, r)) G.World.damageProp(p, m.dmg * pl.atk * dmgMul, col);
    if (G.Camera.sees(x, y, r + 40)) G.Audio.sfx('break');
  }

  /** Hell's Core (MS): radial + segunda detonación nv.5. */
  function hellsCore(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const r = hellsCoreRadius(m);
    G.FX.ring(pl.x, pl.y, pl.r * 0.6, r * 0.45, col, 0.18, 1.4);
    if (ghost) return;
    radialBlast(pl, m, pl.x, pl.y, r, 1);
    G.Camera.kick(0.22);
    if (G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'delayed_detonation')) {
      const delay = G.MasterSorcerer.unlockValue(m, 'delayed_detonation') || 1;
      const echoes = fields.filter(o => o.kind === 'hell_core_echo' && o.owner === pl && !o.gone);
      for (const o of echoes.slice(0, Math.max(0, echoes.length - 1))) o.gone = true;
      fields.push({
        kind: 'hell_core_echo', owner: pl, ghost, m, col,
        x: pl.x, y: pl.y, t: 0, delay, r: r * 0.92, dmgMul: 0.88, done: false, life: delay + 0.55
      });
    }
  }

  function lightningPriority(e) {
    if (e.boss) return 100;
    if (e.elite) return 42;
    return 8;
  }

  /** Objetivos repartidos para Rage of the Skies (prioriza elites/jefes). */
  function pickLightningTargets(pl, n, maxDist) {
    const all = G.EnemyMgr.all().filter(e => !e.dead && !e.remote && G.U.dist(pl.x, pl.y, e.x, e.y) <= maxDist);
    all.sort((a, b) => lightningPriority(b) - lightningPriority(a));
    const picked = [];
    const used = new Set();
    for (const e of all) {
      if (picked.length >= n) break;
      let ok = true;
      for (const p of picked) {
        if (G.U.dist2(p.x, p.y, e.x, e.y) < 52 * 52) { ok = false; break; }
      }
      if (!ok) continue;
      picked.push(e);
      used.add(e.id);
    }
    for (const e of all) {
      if (picked.length >= n) break;
      if (used.has(e.id)) continue;
      picked.push(e);
      used.add(e.id);
    }
    while (picked.length < n) {
      picked.push(null);
    }
    return picked;
  }

  function pickStormTarget(pl, m) {
    const maxD = reach(m) + 90;
    const all = G.EnemyMgr.all().filter(e => !e.dead && !e.remote && G.U.dist(pl.x, pl.y, e.x, e.y) <= maxD);
    if (!all.length) return null;
    const pri = all.filter(e => e.boss || e.elite);
    const pool = pri.length && Math.random() < 0.65 ? pri : all;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function strikeLightningAt(pl, m, x, y, dmgMul, col, vis) {
    const top = y - 190;
    G.FX.beam(x, top, Math.PI / 2, 190, 12, col, vis);
    G.FX.ring(x, y, 4, m.radius, col, 0.38, 3.2);
    if (ghost) return;
    for (const e of G.EnemyMgr.queryCircle(x, y, m.radius)) {
      let dmg = capUltimateHit(e, m.dmg * pl.atk * dmgMul);
      hit(pl, e, dmg, col, e.x - x, e.y - y, 0, m);
      e.applyElectrified(0.85);
    }
    if (G.Camera.sees(x, y, m.radius + 30)) G.Camera.kick(0.06);
  }

  /** Rage of the Skies (MS): rayos repartidos + tormenta nv.5. */
  function rageOfTheSkies(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0);
    const maxDist = reach(m);
    const targets = pickLightningTargets(pl, n, maxDist);
    for (let i = 0; i < n; i++) {
      const e = targets[i];
      const x = e ? e.x + G.U.rand(-10, 10) : pl.x + G.U.rand(-160, 160);
      const y = e ? e.y + G.U.rand(-8, 8) : pl.y + G.U.rand(-130, 130);
      fields.push({
        kind: 'meteor', owner: pl, ghost, m, col, vis, x, y,
        t: -i * 0.08, fall: 0.52, r: m.radius, dmg: m.dmg * pl.atk, msUltimate: true
      });
    }
    if (!ghost && G.MasterSorcerer && G.MasterSorcerer.hasUnlock(m, 'lightning_storm')) {
      const dur = G.MasterSorcerer.unlockValue(m, 'lightning_storm') || 3;
      const storms = fields.filter(o => o.kind === 'lightning_storm' && o.owner === pl && !o.gone);
      for (const o of storms) o.gone = true;
      fields.push({
        kind: 'lightning_storm', owner: pl, ghost, m, col, vis,
        t: 0, life: dur, tick: 0.12, interval: 0.36, r: m.radius, dmgMul: 0.58
      });
    }
    if (!ghost) G.Audio.sfx('zap');
  }

  function aura(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    G.FX.ring(pl.x, pl.y, m.radius * 0.5, m.radius, col, 0.28, 2);
    const vis = G.VFX.forMove(m);
    if (vis.aura) {
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * 6.2832, r = m.radius * G.U.rand(0.45, 1);
        const x = pl.x + Math.cos(a) * r, y = pl.y + Math.sin(a) * r * 0.8 - G.LIFT * 0.5;
        // Hierba Lazo tira hacia ti; veneno y sombras suben; el resto gira.
        const v = vis.inward ? [-Math.cos(a) * r * 2.2, -Math.sin(a) * r * 1.8]
                : vis.rise ? [G.U.rand(-10, 10), -55]
                : [-Math.sin(a) * 70, Math.cos(a) * 55];
        G.FX.sp(vis.aura, vis.pal, x, y, { vx: v[0], vy: v[1], life: 0.42,
          spin: G.VFX.spins(vis.aura) ? G.U.rand(-6, 6) : 0 });
      }
    }
    if (ghost) return;
    let healed = 0;
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) {
      hit(pl, e, m.dmg * pl.atk, col, e.x - pl.x, e.y - pl.y, 0, m);
      if (m.drain) healed += m.drain;
    }
    for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) G.World.damageProp(p, m.dmg * pl.atk, col);
    if (healed > 0) pl.heal(Math.min(healed, 6));
  }

  function buff(pl, m) {
    pl.addBuff(m.stat, m.amount, m.dur, m.stacks | 0);
    const col = G.U.TYPE_COLOR[m.type];
    G.FX.ring(pl.x, pl.y, pl.r * 2.4, pl.r * 1.1, col, 0.35, 2.5);
    const vis = G.VFX.forMove(m);
    for (let i = 0; i < 3; i++) {
      G.FX.sp(vis.buff || 'arrow', vis.pal, pl.x + G.U.rand(-pl.r * 1.4, pl.r * 1.4),
              pl.y - G.U.rand(0, pl.bodyH * 0.8), { vy: -70, life: 0.6 });
    }
  }

  // ---------------- familias nuevas (2026-10-10) ----------------

  /** Bumerán: sale hacia el enemigo, se para y vuelve a ti golpeando a la ida y a la vuelta. */
  function boomerang(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0), spread = m.spread || 0.5;
    const out = m.radius / m.speed;                       // segundos de ida
    for (let i = 0; i < n; i++) {
      const a = pl.aim + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * Math.min(n, 3));
      G.Projectiles.spawn(Object.assign({
        x: pl.x, y: pl.y, vx: Math.cos(a) * m.speed, vy: Math.sin(a) * m.speed,
        dmg: m.dmg * pl.atk, r: m.size, life: out * 4 + 1.5, pierce: 999, color: col,
        hits: new Set(), vis, ghost, owner: pl, boom: out, bsp: m.speed * 1.1
      }, payload(m)));
    }
  }

  /** Cadena: golpea a un enemigo y salta a los siguientes más cercanos (cada salto, algo menos). */
  function chain(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    let cur = pl.target && !pl.target.dead && pl.target.hurt ? pl.target : G.Projectiles.nearest(G.EnemyMgr.all(), pl.x, pl.y, reach(m));
    if (!cur) return;
    let fx = pl.x, fy = pl.y - G.LIFT, k = 1;
    const done = new Set();
    const n = Math.max(1, m.count | 0);
    for (let i = 0; i < n && cur; i++) {
      done.add(cur.id);
      const tx = cur.x, ty = cur.y - cur.bodyH * 0.5;
      G.FX.beam(fx, fy, Math.atan2(ty - fy, tx - fx), Math.hypot(tx - fx, ty - fy), 10, col, vis);
      if (!ghost) {
        // Infortunio: más daño a quien ya sufre un estado.
        const hex = m.hex && (cur.burn > 0 || cur.poison > 0 || cur.slow > 0) ? m.hex : 1;
        hit(pl, cur, m.dmg * pl.atk * k * hex, col, tx - fx, ty - fy, 0, m);
      }
      k *= 0.85;
      fx = tx; fy = ty;
      let best = null, bd = m.radius * m.radius;
      for (const e of G.EnemyMgr.queryCircle(cur.x, cur.y, m.radius)) {
        if (done.has(e.id)) continue;
        const d = G.U.dist2(cur.x, cur.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      cur = best;
    }
    if (!ghost) G.Camera.kick(0.05);
  }

  /** Minas: se quedan en el suelo y estallan cuando un enemigo las pisa. */
  function mines(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832, d = n === 1 ? 0 : G.U.rand(18, 46);
      fields.push({ kind: 'mine', owner: pl, ghost, m, col, vis, x: pl.x + Math.cos(a) * d, y: pl.y + Math.sin(a) * d * 0.8,
                    t: 0, arm: 0.35, life: m.dur || 7, r: m.radius, dmg: m.dmg * pl.atk });
    }
    // Como mucho unas pocas por jugador: las más viejas se van.
    const mine = fields.filter(f => f.kind === 'mine' && f.owner === pl);
    for (const f of mine.slice(0, Math.max(0, mine.length - (4 + n * 2)))) f.gone = true;
  }

  /** Meteoros: caen del cielo sobre enemigos cercanos (la sombra avisa dónde). */
  function meteors(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0);
    const near = G.EnemyMgr.queryCircle(pl.x, pl.y, reach(m)).filter(e => !e.dead);
    G.U.shuffle ? G.U.shuffle(near) : near.sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      const e = near[i];
      const x = e ? e.x + G.U.rand(-8, 8) : pl.x + G.U.rand(-140, 140);
      const y = e ? e.y + G.U.rand(-6, 6) : pl.y + G.U.rand(-110, 110);
      fields.push({ kind: 'meteor', owner: pl, ghost, m, col, vis, x, y, t: -i * 0.09, fall: 0.5, r: m.radius, dmg: m.dmg * pl.atk });
    }
  }

  /** Torreta: deja algo en el suelo que dispara solo un rato. */
  function turret(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const a = pl.aim + Math.PI + G.U.rand(-0.6, 0.6);
    fields.push({ kind: 'turret', owner: pl, ghost, m, col, vis, x: pl.x + Math.cos(a) * 26, y: pl.y + Math.sin(a) * 20,
                  t: 0, life: m.dur || 6, shotT: 0.3, dmg: m.dmg * pl.atk });
    const mine = fields.filter(f => f.kind === 'turret' && f.owner === pl && !f.gone);
    for (const f of mine.slice(0, Math.max(0, mine.length - Math.max(1, m.count | 0)))) f.gone = true;
    G.FX.ring(pl.x, pl.y, 4, 30, col, 0.3, 2);
  }

  /** Embestida: cruzas como un rayo hacia el enemigo y golpeas a todo lo del camino. */
  function dash(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const ca = Math.cos(pl.aim), sa = Math.sin(pl.aim);
    const sx = pl.x, sy = pl.y;
    let len = 0;
    for (let d = 8; d <= m.radius; d += 8) {
      if (!G.World.isFree(sx + ca * d, sy + sa * d, pl.r * 0.8, true)) break;
      len = d;
    }
    // Estela: varias copias del golpe a lo largo del recorrido.
    for (let d = 0; d <= len; d += 22) G.FX.sp(vis.proj || 'streak', vis.pal, sx + ca * d, sy + sa * d - G.LIFT * 0.6, { life: 0.22, angle: pl.aim });
    G.FX.slash(sx + ca * len, sy + sa * len - G.LIFT * 0.5, pl.aim, 34, 2.2, col, vis);
    if (ghost) return;
    pl.x = sx + ca * len; pl.y = sy + sa * len;
    G.World.collide(pl);
    pl.invuln = Math.max(pl.invuln || 0, 0.3);
    const w = m.width || 34;
    const mx = sx + ca * len / 2, my = sy + sa * len / 2;
    for (const e of G.EnemyMgr.queryCircle(mx, my, len / 2 + w)) {
      if (segDist2(sx, sy, pl.x, pl.y, e.x, e.y) <= (w / 2 + e.r) ** 2) hit(pl, e, m.dmg * pl.atk, col, ca, sa, m.knock || 0, m);
    }
    for (const p of G.World.propsInCircle(mx, my, len / 2 + w)) {
      if (segDist2(sx, sy, pl.x, pl.y, p.x, p.y) <= (w / 2 + p.r) ** 2) G.World.damageProp(p, m.dmg * pl.atk, col);
    }
    G.Camera.kick(0.12);
  }

  /** Rastro: vas dejando charcos que dañan a lo que pasa por encima. */
  function trailPatch(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    // Parado no deja uno nuevo encima del anterior (sólo de vez en cuando).
    const last = pl.lastPatch;
    if (last && G.U.dist2(last.x, last.y, pl.x, pl.y) < (m.radius * 0.9) ** 2 && last.t < 1) return;
    const f = { kind: 'patch', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, life: m.dur || 3, r: m.radius,
                tick: 0, dmg: m.dmg * pl.atk };
    fields.push(f);
    pl.lastPatch = f;
    const mine = fields.filter(o => o.kind === 'patch' && o.owner === pl && !o.gone);
    for (const o of mine.slice(0, Math.max(0, mine.length - 18))) o.gone = true;
  }

  /** Abanico corto: muchos disparos rápidos que no llegan lejos (aliento, chorro...). */
  function cone(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(2, m.count | 0), arc = m.arc || 0.9;
    for (let i = 0; i < n; i++) {
      const a = pl.aim + (i / (n - 1) - 0.5) * arc + G.U.rand(-0.05, 0.05);
      const sp = m.speed * G.U.rand(0.85, 1.1);
      G.Projectiles.spawn(Object.assign({
        x: pl.x + Math.cos(a) * 4, y: pl.y + Math.sin(a) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        dmg: m.dmg * pl.atk, r: m.size, life: m.life * G.U.rand(0.85, 1.05), pierce: m.pierce | 0, color: col,
        hits: new Set(), vis, ghost, owner: pl
      }, payload(m)));
    }
    G.FX.spark(pl.x + Math.cos(pl.aim) * pl.r, pl.y - G.LIFT + Math.sin(pl.aim) * pl.r, col, Math.cos(pl.aim), Math.sin(pl.aim), 5);
  }

  /** Daño de un campo (mina, meteoro, charco) a todo lo que hay en su círculo. */
  function blast(f, r, k = 1) {
    if (f.ghost) return;
    const pl = f.owner, m = f.m;
    const base = f.dmg != null ? f.dmg : m.dmg * pl.atk;
    for (const e of G.EnemyMgr.queryCircle(f.x, f.y, r)) {
      let dmg = base * k;
      if (f.msUltimate) dmg = capUltimateHit(e, dmg);
      hit(pl, e, dmg, f.col, e.x - f.x, e.y - f.y, m.knock || 0, m);
      if (f.msFireGround && e.burn === 0) e.applyBurn(1);
      if (f.msUltimate && m.type === 'energy') e.applyElectrified(0.75);
    }
    for (const p of G.World.propsInCircle(f.x, f.y, r)) G.World.damageProp(p, base * k, f.col);
  }

  function updateFields(dt) {
    for (let i = fields.length - 1; i >= 0; i--) {
      const f = fields[i];
      f.t += dt;
      if (f.gone || !f.owner || (f.life && f.t >= f.life && f.kind !== 'mine' && f.kind !== 'hell_core_echo' && f.kind !== 'lightning_storm')) {
        fields.splice(i, 1); continue;
      }
      if (f.kind === 'mine') {
        const armed = f.t >= f.arm;
        const trig = armed && G.EnemyMgr.queryCircle(f.x, f.y, 14).length > 0;
        if (trig || f.t >= f.life) {
          G.FX.ring(f.x, f.y, 4, f.r, f.col, 0.3, 4);
          G.FX.burst(f.x, f.y - 6, f.col, 10, 150);
          if (G.Camera.sees(f.x, f.y, 40)) G.Audio.sfx('break');
          blast(f, f.r, trig ? 1 : 0.5);
          fields.splice(i, 1);
        }
      } else if (f.kind === 'meteor') {
        if (f.t >= f.fall) {
          G.FX.ring(f.x, f.y, 4, f.r, f.col, 0.35, 4);
          G.FX.burst(f.x, f.y - 6, f.col, 12, 170);
          if (G.Camera.sees(f.x, f.y, 40)) { G.Audio.sfx('break'); G.Camera.kick(0.12); }
          blast(f, f.r);
          fields.splice(i, 1);
        }
      } else if (f.kind === 'turret') {
        f.shotT -= dt;
        if (f.shotT <= 0) {
          const m = f.m;
          const tg = G.Projectiles.nearest(G.EnemyMgr.all(), f.x, f.y, m.range || 300);
          f.shotT = tg ? m.rate || 0.6 : 0.15;
          if (tg) {
            const a = Math.atan2(tg.y - f.y, tg.x - f.x);
            G.Projectiles.spawn(Object.assign({
              x: f.x, y: f.y, vx: Math.cos(a) * (m.speed || 300), vy: Math.sin(a) * (m.speed || 300),
              dmg: f.dmg, r: m.size || 6, life: 1.4, pierce: m.pierce | 0, color: f.col,
              hits: new Set(), vis: f.vis, ghost: f.ghost, owner: f.owner
            }, payload(m)));
            f.kick = 0.12;
          }
        }
        if (f.kick > 0) f.kick -= dt;
      } else if (f.kind === 'beam_echo') {
        if (!f.done && f.t >= f.delay) {
          f.done = true;
          beamAt(f.owner, f.m, f.aim, null, f.dmgMul || 0.72);
        }
      } else if (f.kind === 'hell_core_echo') {
        if (!f.done && f.t >= f.delay) {
          f.done = true;
          radialBlast(f.owner, f.m, f.x, f.y, f.r, f.dmgMul || 0.88);
          if (!f.ghost) G.Camera.kick(0.18);
        }
        if (f.done && f.t >= f.delay + 0.35) { fields.splice(i, 1); continue; }
      } else if (f.kind === 'lightning_storm') {
        if (f.t >= f.life) { fields.splice(i, 1); continue; }
        f.tick -= dt;
        if (f.tick <= 0) {
          f.tick = f.interval || 0.36;
          const pl = f.owner;
          if (!pl || pl.dead) { fields.splice(i, 1); continue; }
          const tg = pickStormTarget(pl, f.m);
          const x = tg ? tg.x : pl.x + G.U.rand(-120, 120);
          const y = tg ? tg.y : pl.y + G.U.rand(-90, 90);
          strikeLightningAt(pl, f.m, x, y, f.dmgMul || 0.58, f.col, f.vis);
        }
      } else if (f.kind === 'patch') {
        f.tick -= dt;
        if (f.tick <= 0) { f.tick = 0.5; blast(f, f.r); }
        if (f.vis.aura && Math.random() < dt * 3 && G.Camera.sees(f.x, f.y, 20)) {
          G.FX.sp(f.vis.aura, f.vis.pal, f.x + G.U.rand(-f.r, f.r) * 0.6, f.y - 4, { vy: -40, life: 0.4 });
        }
      }
    }
  }

  /** Lo de los campos que va en el suelo (debajo de los Pokémon). */
  function drawGroundFields(ctx) {
    const now = performance.now() / 1000;
    for (const f of fields) {
      if (!G.Camera.sees(f.x, f.y, 60)) continue;
      ctx.save();
      if (f.kind === 'patch') {
        const a = Math.min(1, (f.life - f.t) * 2, f.t * 6);
        ctx.globalAlpha = 0.32 * a;
        ctx.fillStyle = f.col;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.62, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.5 * a;
        ctx.strokeStyle = f.col; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.8, f.r * 0.5, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'mine') {
        const armed = f.t >= f.arm, blink = armed && Math.sin(now * 8 + f.x) > 0.3;
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = f.col;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.45, f.r * 0.28, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
        G.VFX.draw(ctx, f.vis.proj, f.vis.pal, f.x, f.y - 4, { scale: 1, alpha: blink ? 1 : 0.75, frame: 0 });
      } else if (f.kind === 'meteor') {
        const k = G.U.clamp(f.t / f.fall, 0, 1);
        ctx.globalAlpha = 0.2 + k * 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (0.3 + k * 0.7), f.r * 0.6 * (0.3 + k * 0.7), 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = f.col; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.6, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'turret') {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(f.x, f.y, 11, 4.5, 0, 0, 6.2832); ctx.fill();
      } else if (f.kind === 'hell_core_echo' && !f.done) {
        const k = Math.min(1, f.t / Math.max(0.05, f.delay));
        ctx.globalAlpha = 0.12 + k * 0.28;
        ctx.strokeStyle = f.col;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, f.r * (0.45 + k * 0.55), f.r * 0.38 * (0.45 + k * 0.55), 0, 0, 6.2832);
        ctx.stroke();
      } else if (f.kind === 'lightning_storm') {
        const a = Math.min(1, (f.life - f.t) * 1.2, f.t * 2);
        ctx.globalAlpha = 0.08 * a;
        ctx.fillStyle = f.col;
        ctx.beginPath();
        ctx.ellipse(f.owner.x, f.owner.y, reach(f.m) * 0.55, reach(f.m) * 0.35, 0, 0, 6.2832);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /** Lo de los campos que va por encima (meteoros cayendo, torretas). */
  function drawAirFields(ctx) {
    const now = performance.now() / 1000;
    for (const f of fields) {
      if (!G.Camera.sees(f.x, f.y, 200)) continue;
      if (f.kind === 'meteor' && f.t > 0) {
        const k = G.U.clamp(f.t / f.fall, 0, 1);
        G.VFX.draw(ctx, f.vis.proj, f.vis.pal, f.x + (1 - k) * 40, f.y - (1 - k) * 170 - 6,
                   { scale: 1.5, angle: Math.atan2(170, -40), frame: Math.floor(now * 12) });
      } else if (f.kind === 'turret') {
        const fade = Math.min(1, (f.life - f.t) * 2, f.t * 5);
        const bob = Math.sin(now * 4 + f.x) * 2 - (f.kick > 0 ? 2 : 0);
        G.VFX.draw(ctx, f.vis.proj, f.vis.pal, f.x, f.y - 16 + bob, { scale: 1.5, alpha: fade, frame: Math.floor(now * 8) });
      }
    }
  }

  function clearFields(owner) { fields = owner ? fields.filter(f => f.owner !== owner) : []; }

  function orbit(pl, m, dt, now, isGhost = false) {
    const col = G.U.TYPE_COLOR[m.type];
    const want = Math.max(1, m.count | 0);
    // Cada movimiento de órbita tiene sus orbes (puede haber dos en un vínculo).
    const mine = p => p.orb && p.owner === pl && p.mid === m.id;
    const orbs = G.Projectiles.all().filter(mine);
    // Si cambia el número de orbes (al mejorar el movimiento), se reparten
    // todos por igual a partir de donde va el primero, sin saltos.
    const relayout = orbs.length !== want;
    const base = orbs.length ? orbs[0].oa : now * m.speed;
    if (orbs.length > want) for (const p of orbs.slice(want)) G.Projectiles.remove(p);

    for (let i = orbs.length; i < want; i++) {
      G.Projectiles.spawnOrb({
        owner: pl, ghost: isGhost, mid: m.id,
        x: pl.x, y: pl.y, r: m.size, color: col, vis: G.VFX.forMove(m),
        dmg: m.dmg * pl.atk,
        oa: (i / want) * 6.2832, orad: m.radius, ospeed: m.speed,
        rehit: Math.max(0.12, m.cd),
        knock: m.knock || 0, burn: m.burn || 0, poison: m.poison || 0, slow: m.slow || 0, mtype: m.type
      });
    }
    const live = G.Projectiles.all().filter(mine);
    live.forEach((p, i) => {
      p.dmg = m.dmg * pl.atk;
      p.orad = m.radius;
      p.ospeed = m.speed;
      p.r = m.size;
      if (relayout) p.oa = base + (i / live.length) * 6.2832;
    });

    // Animación de concentración de vez en cuando, para que se note vivo.
    pl.orbCastT = (pl.orbCastT || 0) - dt;
    if (pl.orbCastT <= 0) { pl.orbCastT = 1.6; pl.cast({ kind: 'orbit', cd: 1.6 }); }
  }

  /** Repite el ataque de un compañero sólo para verlo (sin daño). */
  function ghostCast(pl, id, lvl, aim, evolved) {
    const def = G.Moves.BY_ID[id];
    if (!def || def.kind === 'orbit') return;
    const m = G.Moves.instance(id, lvl);
    if (evolved) G.Moves.evolve(m);
    pl.aim = aim;
    ghost = true;
    try {
      pl.cast(m);
      run(pl, m);
    } finally { ghost = false; }
  }

  /** Orbes de un compañero que tiene activo un movimiento de órbita (sólo visual). */
  function ghostOrbit(pl, dt, now) {
    const m = pl.activeMove();
    if (m && m.kind === 'orbit' && !pl.dead) orbit(pl, m, dt, now, true);
    else if (G.Projectiles.all().some(p => p.orb && p.owner === pl)) G.Projectiles.clearOrbs(pl);
  }

  // Golpe crítico (Mejoras → Golpe Crítico): x1,5 de daño, número naranja y grande.
  const CRIT_MUL = 1.5;
  const isCrit = pl => !ghost && pl.critChance > 0 && Math.random() < pl.critChance;

  function hit(pl, e, dmg, col, dx, dy, knock, m) {
    applySpellEffects(pl, e, m);
    dmg = computeStrikeDamage(pl, e, m, dmg);
    if (G.MasterSorcerer) dmg *= G.MasterSorcerer.damageMulForType(pl, m.type);
    const k = typeK(m.type, e, m.id, pl);
    const crit = isCrit(pl);
    dmg *= k * (crit ? CRIT_MUL : 1);
    if (!ghost) {
      e.lastHitAid = m.id;
      e.lastHitOwner = pl;
      if (G.MsTelemetry) G.MsTelemetry.onHit(pl, m.id, dmg, e, m.lvl);
    }
    e.hurt(dmg, col, dx, dy, knock, crit ? 'crit' : typeLabel(m.type, e, m.id));
    if (!ghost && G.BestiaryCharms) G.BestiaryCharms.onHit(pl, e);
    if (!ghost) pl.onDealt(dmg);
    pl.dmgDealt += dmg;
    const pay = payload(m);
    if (pay.burn) e.applyBurn(pay.burn);
    if (m.poison) e.applyPoison(m.poison);
    if (m.slow) e.applySlow(m.slow);
  }

  /** Flame Strike nv.5: explosión pequeña si el enemigo muere ardiendo. */
  function onEnemyDeath(e) {
    if (ghost || !e || e.burn <= 0 || !e.lastHitOwner) return;
    const pl = e.lastHitOwner;
    const m = pl.moves.find(x => x.id === 'flame_strike');
    if (!m || !G.MasterSorcerer || !G.MasterSorcerer.hasUnlock(m, 'burn_kill_explosion')) return;
    const col = G.U.TYPE_COLOR[m.type] || '#ff7b3d';
    const r = 38;
    const dmg = m.dmg * pl.atk * 0.5;
    G.FX.ring(e.x, e.y, 6, r, col, 0.32, 3);
    G.FX.burst(e.x, e.y - G.LIFT * 0.4, col, 10, 130);
    if (G.Camera.sees(e.x, e.y, r)) G.Audio.sfx('break');
    for (const o of G.EnemyMgr.queryCircle(e.x, e.y, r)) {
      if (o.dead || o.id === e.id) continue;
      hit(pl, o, dmg, col, o.x - e.x, o.y - e.y, 0, m);
    }
    for (const p of G.World.propsInCircle(e.x, e.y, r)) G.World.damageProp(p, dmg, col);
  }

  // ---------------- colisiones ----------------

  /** Distancia² del punto (cx, cy) al segmento (ax, ay)-(bx, by). */
  function segDist2(ax, ay, bx, by, cx, cy) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? ((cx - ax) * dx + (cy - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t - cx, qy = ay + dy * t - cy;
    return qx * qx + qy * qy;
  }

  function resolve(dt, pl, now) {
    const projectiles = G.Projectiles.all();

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];

      // --- disparos enemigos: paredes y objetos sólidos dan cobertura ---
      if (!p.friendly) {
        if (G.World.projectileBlock(p.x, p.y, p.r)) {
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 70);
          projectiles.splice(i, 1);
          continue;
        }
        if (G.U.dist2(p.x, p.y, pl.x, pl.y) < (p.r + pl.r) * (p.r + pl.r)) {
          pl.hurt(p.dmg, p.mtype);
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 7, 110);
          projectiles.splice(i, 1);
        }
        continue;
      }

      // --- disparos de jugadores ---
      // Orbes de un compañero: sólo se ven.
      if (p.orb && p.ghost) continue;
      if (!p.orb) {
        const block = G.World.projectileBlock(p.x, p.y, p.r);
        if (block === 'wall' || (block && !block.destructible)) {
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
          projectiles.splice(i, 1);
          continue;
        }
      }

      // Objetos del escenario (rocas, cofres, hierba).
      let consumed = false;
      for (const prop of G.World.propsInCircle(p.x, p.y, p.r)) {
        if (p.orb) {
          const k = 'p' + prop.id, last = p.hitLog.get(k) || -99;
          if (now - last < p.rehit) continue;
          p.hitLog.set(k, now);
          G.World.damageProp(prop, p.dmg, p.color);
          continue;
        }
        if (p.phits.has(prop.id)) continue;
        p.phits.add(prop.id);
        if (!p.ghost) G.World.damageProp(prop, p.dmg, p.color);
        // La hierba no frena; lo sólido sí gasta perforación.
        if (prop.solid) {
          if (p.pierce > 0) p.pierce--;
          else { consumed = true; break; }
        }
      }
      if (consumed) {
        G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
        projectiles.splice(i, 1);
        continue;
      }

      // Enemigos. Colisión BARRIDA: se comprueba todo el tramo recorrido en este
      // fotograma, no sólo el punto final. Un Impactrueno avanza 8 unidades por
      // fotograma: sin esto atravesaba a los enemigos pegados al jugador, que
      // eran inmunes a todos los movimientos de proyectil.
      const sx = p.orb || p.px == null ? p.x : p.px, sy = p.orb || p.py == null ? p.y : p.py;
      const half = Math.hypot(p.x - sx, p.y - sy) / 2;
      for (const e of G.EnemyMgr.queryCircle((sx + p.x) / 2, (sy + p.y) / 2, half + p.r)) {
        if (segDist2(sx, sy, p.x, p.y, e.x, e.y) > (p.r + e.r) * (p.r + e.r)) continue;
        if (p.orb) {
          const last = p.hitLog.get(e.id) || -99;
          if (now - last < p.rehit) continue;
          p.hitLog.set(e.id, now);
          // Las órbitas duran toda la partida: se olvidan los golpes viejos.
          if (p.hitLog.size > 300) for (const [k, t] of p.hitLog) if (now - t > p.rehit) p.hitLog.delete(k);
        } else {
          if (p.hits.has(e.id)) continue;
          p.hits.add(e.id);
        }

        // Disparo fantasma de un compañero: choca y se ve, pero no daña.
        if (p.ghost) {
          G.FX.sp('impact', p.vis ? p.vis.pal : 'normal', e.x, e.y - e.bodyH * 0.5, { life: 0.12, scale: 1 });
          if (p.pierce > 0) { p.pierce--; continue; }
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
          projectiles.splice(i, 1);
          break;
        }

        const owner = p.owner || pl;
        const strike = p.aid && owner ? owner.moves.find(x => x.id === p.aid) : null;
        if (p.aid && owner) {
          e.lastHitAid = p.aid;
          e.lastHitOwner = owner;
        }
        if (strike) applySpellEffects(owner, e, strike);
        const crit = isCrit(owner);
        let raw = p.dmg;
        if (strike) raw = computeStrikeDamage(owner, e, strike, raw);
        if (G.MasterSorcerer && p.mtype) raw *= G.MasterSorcerer.damageMulForType(owner, p.mtype);
        const k = (p.mtype ? typeK(p.mtype, e, p.aid, owner) : 1) * (crit ? CRIT_MUL : 1);
        const dealt = raw * k;
        if (!ghost && G.MsTelemetry && p.aid) G.MsTelemetry.onHit(owner, p.aid, dealt, e, strike && strike.lvl);
        e.hurt(dealt, p.color, p.vx || (e.x - pl.x), p.vy || (e.y - pl.y), p.knock,
               crit ? 'crit' : p.mtype ? typeLabel(p.mtype, e, p.aid) : null);
        if (!ghost && G.BestiaryCharms) G.BestiaryCharms.onHit(owner, e);
        if (Math.random() < 0.5) G.FX.sp('impact', p.vis ? p.vis.pal : 'normal', e.x, e.y - e.bodyH * 0.5, { life: 0.12, scale: 1 });
        owner.dmgDealt += dealt;
        owner.onDealt(dealt);
        if (p.burn) e.applyBurn(p.burn);
        if (p.poison) e.applyPoison(p.poison);
        if (p.slow) e.applySlow(p.slow);
        if (strike && p.aid === 'flame_strike' && !p._msSplashed) {
          p._msSplashed = true;
          flameStrikeSplash(owner, strike, e, p.color);
        }
        if (strike && p.aid === 'energy_strike' && !p._msChained &&
            G.MasterSorcerer && G.MasterSorcerer.hasUnlock(strike, 'chain_on_hit')) {
          p._msChained = true;
          const hops = G.MasterSorcerer.unlockValue(strike, 'chain_on_hit') || 2;
          msEnergyChainFrom(owner, e, strike, hops);
        }

        if (!p.orb) {
          if (p.pierce > 0) { p.pierce--; }
          else {
            G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
            projectiles.splice(i, 1);
            break;
          }
        }
      }
    }

    // --- contacto enemigo <-> jugador ---
    if (pl.dead) return;
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, pl.r + 40)) {
      if (G.U.dist2(e.x, e.y, pl.x, pl.y) > (e.r + pl.r) * (e.r + pl.r)) continue;
      if (e.touchCd > 0 || e.behavior === 'thief') continue;
      e.touchCd = 0.55;
      e.strike(pl);
      pl.hurt(e.dmg, e.atkType);
      if (pl.hasItem('rockyhelmet')) e.hurt(15 + pl.level * 4, '#9aa6b5', e.x - pl.x, e.y - pl.y, 80);
      const [nx, ny] = G.U.norm(e.x - pl.x, e.y - pl.y);
      e.kx += nx * 150; e.ky += ny * 150;
    }
  }

  return { tick, resolve, ghostCast, ghostOrbit, updateFields, drawGroundFields, drawAirFields, clearFields, onEnemyDeath, pickStrikeTarget,
           pickFireWaveTarget, fireWaveReach: fireWaveSearchRadius,
           get fieldCount() { return fields.length; } };
})();
