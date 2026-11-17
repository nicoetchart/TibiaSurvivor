/* ============ pickup.js — orbes de experiencia y objetos ============
 * Los orbes se quedan quietos hasta que entras en el radio del imán; entonces
 * aceleran hacia ti. Para que no se acumulen miles, al pasar de MAX se fusionan
 * los más antiguos.
 *
 * Cooperativo: los objetos los crea el anfitrión (cada uno con su id) y los
 * demás reciben una copia. Todos vuelan hacia el jugador más cercano; quien
 * decide quién lo ha cogido es el anfitrión.
 */
G.Pickups = (() => {
  let list = [];
  const MAX = 420;
  let nextId = 1;

  const KIND = {
    xp:    { color: '#7fe0ff', glow: '#2a8fd0', r: 4.5 },
    xpBig: { color: '#ffd95e', glow: '#c08a10', r: 7 },
    heal:  { color: '#5fe08a', glow: '#1f8f4d', r: 6.5 },
    magnet:{ color: '#ff9ed8', glow: '#b03d84', r: 6.5 },
    bomb:  { color: '#ff7b3d', glow: '#b03d10', r: 6.5 },
    coin:  { color: '#e8c65a', glow: '#b8861a', r: 6 },
    ticket:   { color: '#ffd23f', glow: '#c08a10', r: 7 },
    ticket10: { color: '#c47bff', glow: '#8a3fd0', r: 8 },
    item:     { color: '#ffd23f', glow: '#c08a10', r: 9 }       // value = id del objeto
  };
  /** Valor del pickup → clave en TIBIA_SPRITE_MAP.items (pilas de oro Tibia). */
  const COIN_ITEM_BY_VALUE = { 1: 'coin_1', 2: 'coin_2', 3: 'coin_3', 4: 'coin_4', 5: 'coin_5', 8: 'coin_8' };
  /** Bomba en suelo: strip 3×32 en assets/tibia/items/203847-203849.png */
  const BOMB_PICKUP_SHEET = '203847-203849';
  const BOMB_PICKUP_FRAMES = 3;
  /** Segundos por fotograma (p.t avanza ×4 en update). */
  const BOMB_PICKUP_SEC_PER_FRAME = 0.28;
  const MAGNET_PICKUP_SHEET = '209160-209162';
  const MAGNET_PICKUP_FRAMES = 3;
  const MAGNET_PICKUP_SEC_PER_FRAME = 0.28;

  function clear() { list = []; }
  function all() { return list; }

  function push(o) {
    // En cooperativo sólo el anfitrión crea objetos (las copias llegan por la red).
    o.id = nextId++;
    list.push(o);
    if (list.length > MAX) {
      // Fusiona los dos más antiguos de XP para no crecer sin límite.
      const i = list.findIndex(p => p.kind === 'xp' || p.kind === 'xpBig');
      if (i >= 0) {
        const a = list.splice(i, 1)[0];
        const j = list.findIndex(p => p.kind === 'xp' || p.kind === 'xpBig');
        if (j >= 0) { list[j].value += a.value; list[j].kind = 'xpBig'; }
      } else {
        const a = list.shift();
      }
    }
  }

  /** Copia de un objeto del anfitrión. */
  function addRemote(id, kind, x, y, value) {
    if (list.some(p => p.id === id)) return;
    const o = orb(kind, x, y, value);
    o.id = id;
    list.push(o);
  }

  function removeId(id) {
    const i = list.findIndex(p => p.id === id);
    if (i < 0) return null;
    return list.splice(i, 1)[0];
  }

  /** Imán: todo vuela hacia el jugador más cercano. */
  function pullAll() { for (const o of list) o.pulled = true; }

  /** @param plain  sólo la experiencia (los legendarios de la Sentencia de Arceus) */
  function dropXp(x, y, value, boss = false, legend = false, plain = false) {
    if (boss) {
      // Los jefes revientan en un montón de orbes grandes + recompensas.
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * 6.2832, d = G.U.rand(10, 70);
        push(orb('xpBig', x + Math.cos(a) * d, y + Math.sin(a) * d, Math.ceil(value / 14)));
      }
      if (plain) return;
      push(orb('heal', x + 24, y, 0));
      push(orb('magnet', x - 24, y, 0));
      return;
    }
    push(orb(value >= 20 ? 'xpBig' : 'xp', x, y, value));

    // Drops ocasionales.
    const r = Math.random();
    if (r < 0.012) push(orb('heal', x + G.U.rand(-8, 8), y, 0));
    else if (r < 0.020) push(orb('magnet', x, y, 0));
    else if (r < 0.026) push(orb('bomb', x, y, 0));
  }

  /** Suelta un objeto suelto: 'heal' | 'magnet' | 'bomb' | 'coin'. */
  function drop(kind, x, y, value = 0) {
    push(orb(kind, x, y, value));
  }

  function orb(kind, x, y, value) {
    const a = Math.random() * 6.2832;
    return {
      kind, x, y, value,
      vx: Math.cos(a) * G.U.rand(10, 46), vy: Math.sin(a) * G.U.rand(10, 46),
      t: Math.random() * 6.28, pulled: false
    };
  }

  /**
   * @param players  un jugador o la lista de jugadores (los caídos no recogen)
   * @param onCollect(pickup, jugador)
   */
  function update(dt, players, onCollect) {
    if (!Array.isArray(players)) players = [players];
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += dt * 4;

      // El jugador vivo más cercano (en solitario, siempre tú).
      let pl = null, d2 = Infinity;
      for (const o of players) {
        if (o.dead && players.length > 1) continue;
        const dd = G.U.dist2(o.x, o.y, p.x, p.y);
        if (dd < d2) { d2 = dd; pl = o; }
      }
      if (!pl) continue;
      const dx = pl.x - p.x, dy = pl.y - p.y;
      const mag2 = pl.magnet * pl.magnet;

      if (p.pulled || d2 < mag2) {
        p.pulled = true;
        const d = Math.sqrt(d2) || 1;
        const pull = 240 + 1400 / d;
        p.vx = G.U.damp(p.vx, (dx / d) * pull, 7, dt);
        p.vy = G.U.damp(p.vy, (dy / d) * pull, 7, dt);
      } else {
        p.vx *= Math.pow(0.02, dt);
        p.vy *= Math.pow(0.02, dt);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (d2 < 15 * 15) {
        list.splice(i, 1);
        onCollect(p, pl);
      }
    }
  }

  function draw(ctx) {
    for (const p of list) {
      if (!G.Camera.sees(p.x, p.y, 30)) continue;
      const k = KIND[p.kind];
      const bounce = Math.abs(Math.sin(p.t * 0.8)) * 3;
      const r = k.r;
      const y = p.y - 6 - bounce;

      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 0.9, r * 0.35, 0, 0, 6.2832); ctx.fill();

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = k.glow;
      ctx.beginPath(); ctx.arc(p.x, y, r * 2, 0, 6.2832); ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = k.color;
      if (p.kind === 'xp' || p.kind === 'xpBig') {
        const PX = G.Sprites.PX;
        const mul = (p.kind === 'xpBig' ? 0.92 : 0.72) * 0.5;
        const sz = 32 * PX * mul;
        const key = p.kind === 'xpBig' ? 'xp_big_pickup' : 'xp_pickup';
        const tibia = G.TibiaSprites && G.TibiaSprites.enabled
          && G.TibiaSprites.drawItem(ctx, key, p.x, y, sz);
        if (tibia) continue;
        ctx.beginPath();
        ctx.moveTo(p.x, y - r); ctx.lineTo(p.x + r * 0.78, y);
        ctx.lineTo(p.x, y + r); ctx.lineTo(p.x - r * 0.78, y);
        ctx.closePath(); ctx.fill();
      } else if (p.kind === 'coin') {
        const PX = G.Sprites.PX;
        const sz = 32 * PX * 0.8;
        const coinKey = COIN_ITEM_BY_VALUE[p.value] || 'coin_1';
        if (G.TibiaSprites && G.TibiaSprites.enabled
            && G.TibiaSprites.drawItem(ctx, coinKey, p.x, y, sz)) continue;
        G.Icons.draw(ctx, 'coin', p.x - sz / 2, y - sz / 2, sz);
        continue;
      } else if (p.kind === 'heal') {
        const PX = G.Sprites.PX;
        const sz = 32 * PX * 0.8;
        const tibia = G.TibiaSprites && G.TibiaSprites.enabled
          && G.TibiaSprites.drawItem(ctx, 'heal_pickup', p.x, y, sz);
        if (!tibia) {
          const ico = G.TibiaTheme && G.TibiaTheme.enabled() ? 'item:heal_pickup' : 'berry';
          G.Icons.draw(ctx, ico, p.x - sz / 2, y - sz / 2 - 1, sz);
        }
        continue;
      } else if (p.kind === 'bomb') {
        const PX = G.Sprites.PX;
        const sz = 32 * PX * 0.8;
        const scale = sz / 32;
        const fr = Math.floor((p.t / 4) / BOMB_PICKUP_SEC_PER_FRAME) % BOMB_PICKUP_FRAMES;
        const tibia = G.TibiaSprites && G.TibiaSprites.enabled && G.Tiles
          && G.Tiles.drawItemStripFrame(ctx, BOMB_PICKUP_SHEET, fr, p.x, y, scale,
            BOMB_PICKUP_FRAMES, 32, 32, 1);
        if (!tibia) G.Icons.draw(ctx, 'bomb', p.x - sz / 2, y - sz / 2 - 1, 18);
        continue;
      } else if (p.kind === 'magnet') {
        const PX = G.Sprites.PX;
        const sz = 32 * PX * 0.8;
        const scale = sz / 32;
        const fr = Math.floor((p.t / 4) / MAGNET_PICKUP_SEC_PER_FRAME) % MAGNET_PICKUP_FRAMES;
        const tibia = G.TibiaSprites && G.TibiaSprites.enabled && G.Tiles
          && G.Tiles.drawItemStripFrame(ctx, MAGNET_PICKUP_SHEET, fr, p.x, y, scale,
            MAGNET_PICKUP_FRAMES, 32, 32, 1);
        if (!tibia) G.Icons.draw(ctx, 'magnet', p.x - sz / 2, y - sz / 2 - 1, 18);
        continue;
      } else {
        // Tickets: icono pixel art.
        const ICON = { ticket: 'ticket', ticket10: 'ticket10' };
        const sz = p.kind === 'ticket10' || p.kind === 'item' ? 24 : 18;
        if (p.kind === 'item') {
          // Objeto: brillo dorado latiendo, para que se vea desde lejos.
          ctx.globalAlpha = 0.35 + Math.sin(p.t * 1.5) * 0.15;
          ctx.fillStyle = '#ffe14d';
          ctx.beginPath(); ctx.arc(p.x, y, 18, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = 1;
          const PX = G.Sprites.PX;
          const itemSz = 32 * PX * 0.8;
          const tibiaItem = G.TibiaSprites && G.TibiaSprites.enabled
            && G.TibiaSprites.drawItem(ctx, p.value, p.x, y, itemSz);
          if (tibiaItem) continue;
        }
        G.Icons.draw(ctx, p.kind === 'item' ? p.value : ICON[p.kind], p.x - sz / 2, y - sz / 2 - 1, sz);
        continue;
      }
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.arc(p.x - r * 0.25, y - r * 0.3, r * 0.28, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return { clear, all, dropXp, drop, update, draw, addRemote, removeId, pullAll, KIND, get count() { return list.length; } };
})();
