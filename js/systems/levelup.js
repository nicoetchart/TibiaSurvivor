/* ============ levelup.js — las tres cartas de subida de nivel ============
 * Tipos de carta:
 *   new   aprender un movimiento nuevo (sólo si quedan huecos de los 4; un vínculo libera huecos)
 *   up    mejorar un movimiento que ya tienes
 *   stat  mejora permanente de la run
 */
G.LevelUp = (() => {

  function typeColor(type) {
    if (G.Content && G.Content.mode === 'neutral' && G.DamageTypes && G.DamageTypes.COLOR[type]) {
      return G.DamageTypes.COLOR[type];
    }
    return G.U.TYPE_COLOR[type] || '#8fa3c4';
  }

  function isMsRun(pl) {
    return !!(G.Content && G.Content.mode === 'neutral' && pl &&
      (pl.vocationId === 'master_sorcerer' || pl.mon.creatureId === 'wander_archmage' || pl.dex === 99001));
  }

  function msElementName(def) {
    const el = def.element || def.type;
    return (G.DamageTypes && G.DamageTypes.NAME[el]) || G.U.TYPE_NAME[el] || el;
  }

  /** Línea numérica actual → siguiente (hechizos MS). */
  function msSpellStatLine(id, fromLvl, toLvl) {
    if (!G.Abilities || toLvl > 5 || fromLvl >= toLvl) return '';
    const a = G.Abilities.instance(id, fromLvl);
    const b = G.Abilities.instance(id, toLvl);
    if (!a || !b) return '';
    const parts = [];
    if (a.dmg != null && b.dmg != null && Math.abs(a.dmg - b.dmg) > 0.01) {
      parts.push('Daño ' + Math.round(a.dmg * 10) / 10 + ' → ' + Math.round(b.dmg * 10) / 10);
    }
    if (a.cd != null && b.cd != null && Math.abs(a.cd - b.cd) > 0.005) {
      parts.push('CD ' + a.cd.toFixed(2) + 's → ' + b.cd.toFixed(2) + 's');
    }
    if ((a.count | 0) !== (b.count | 0)) parts.push('Impactos ' + (a.count | 0) + ' → ' + (b.count | 0));
    if (a.radius != null && b.radius != null && Math.abs(a.radius - b.radius) > 0.5) {
      parts.push('Radio ' + Math.round(a.radius) + ' → ' + Math.round(b.radius));
    }
    return parts.join(' · ');
  }

  function attachMsCardMeta(c, def, pl, mode) {
    if (!def) return;
    const el = msElementName(def);
    const inc = def.incantation ? '«' + def.incantation + '»' : '';
    c.msSub = inc ? el + ' · ' + inc : el;
    if (mode === 'newpass') {
      c.msCompare = 'Pasiva · Nv. 1 (nuevo)';
      c.msDetail = def.desc;
      return;
    }
    if (mode === 'uppass') {
      const p = pl.passiveInst[def.id];
      if (!p) return;
      c.msCompare = 'Pasiva · Nv. ' + p.lvl + ' → ' + (p.lvl + 1);
      c.msDetail = G.Abilities.nextUpText(p) || def.desc;
      return;
    }
    if (mode === 'new') {
      c.msCompare = 'Hechizo · Nv. 1 → 2';
      c.msDetail = msSpellStatLine(def.id, 1, 2) || def.desc;
      return;
    }
    if (mode === 'up') {
      const m = pl.moves.find(x => x.id === def.id);
      if (!m) return;
      c.msCompare = 'Hechizo · Nv. ' + m.lvl + ' → ' + (m.lvl + 1);
      c.msDetail = msSpellStatLine(def.id, m.lvl, m.lvl + 1) || c.desc;
    }
  }

  const STATS = [
    { id: 'hp',   icon: 'heart', title: 'Vigor',        desc: '+20 de vida máxima (y la recupera).',
      apply: pl => pl.addMaxHp(20) },
    { id: 'atk',  icon: 'fist', title: 'Potencia',     desc: '+10% de daño con todos los movimientos.',
      apply: pl => pl.atkMul *= 1.10, max: 40 },
    { id: 'spd',  icon: 'boot', title: 'Carrera',      desc: '+7% de velocidad de movimiento.',
      apply: pl => pl.spdMul *= 1.07, max: 8 },
    { id: 'cd',   icon: 'clock', title: 'Reflejos',     desc: '-8% de recarga en todos los movimientos.',
      apply: pl => pl.cdMul *= 0.92, max: 10 },
    { id: 'def',  icon: 'shield', title: 'Coraza',       desc: '+6% de reducción de daño recibido.',
      apply: pl => pl.dmgReduce = Math.min(0.7, pl.dmgReduce + 0.06), max: 12 },
    { id: 'rgn',  icon: 'sprout', title: 'Síntesis',     desc: '+0.9 de vida regenerada por segundo.',
      apply: pl => pl.regenFlat += 0.9 },
    { id: 'mag',  icon: 'magnet', title: 'Imán',         desc: '+30% de radio de recogida de experiencia.',
      apply: pl => pl.magnet *= 1.30, max: 6 },
    { id: 'xp',   icon: 'book', title: 'Aprendizaje',  desc: '+12% de experiencia ganada.',
      apply: pl => pl.xpMul *= 1.12, max: 8 },
    { id: 'heal', icon: 'berry', title: 'Frasco vital', desc: 'Recupera el 45% de tu vida ahora mismo.',
      apply: pl => pl.heal(pl.maxHp * 0.45) }
  ];

  function msCardWeight(def, pl, kind) {
    let w = def.weight != null ? def.weight : 8;
    if (kind === 'up' && pl.moves.some(m => m.id === def.id)) w = Math.max(w, 12);
    return w;
  }

  /** Construye el conjunto de cartas candidatas, con pesos. */
  function candidates(pl) {
    const out = [];
    const ms = isMsRun(pl);

    // --- movimientos nuevos ---
    if (pl.slots.length < pl.maxMoves) {
      const buffs = pl.moves.filter(m => m.kind === 'buff').length;
      const pool = G.Content.learnPool(pl.mon).filter(id => {
        const ab = G.Abilities && G.Abilities.BY_ID[id];
        if (!ab || ab.kind === 'passive') return false;
        if (pl.hasMove(id) || (pl.banned && pl.banned.has(id))) return false;
        if (!G.Moves.BY_ID[id]) return false;
        if (buffs >= 2 && G.Moves.BY_ID[id].kind === 'buff') return false;
        if (ms && G.MasterSorcerer && !G.MasterSorcerer.meetsLearnRequirements(pl, ab)) return false;
        return true;
      });
      for (const id of G.U.pickN(pool, 6)) {
        const d = G.Moves.BY_ID[id];
        const ab = G.Abilities.BY_ID[id];
        const card = {
          w: ms ? msCardWeight(ab || d, pl, 'new') : 10, type: 'new', key: 'new:' + id,
          icon: 'move:' + id, color: typeColor(d.type),
          tag: (G.DamageTypes && G.DamageTypes.NAME[d.type]) || G.U.TYPE_NAME[d.type] || d.type,
          title: d.name, desc: d.desc,
          apply: p => p.addMove(id)
        };
        if (ms && ab) attachMsCardMeta(card, ab, pl, 'new');
        out.push(card);
      }
    }

    // --- pasivas MS (no ocupan huecos de movimiento) ---
    if (ms && G.MasterSorcerer) {
      const ppool = G.MasterSorcerer.passivePoolIds().filter(id => {
        if (pl.hasPassive(id)) return false;
        const def = G.Abilities.BY_ID[id];
        return def && def.kind === 'passive' && def.maxLvl === 5;
      });
      for (const id of G.U.pickN(ppool, 4)) {
        const d = G.Abilities.BY_ID[id];
        const pcard = {
          w: d.weight || 6, type: 'new', key: 'newpass:' + id,
          icon: 'type:' + (d.element || d.type), color: typeColor(d.type),
          tag: 'Pasiva',
          title: d.name, desc: d.desc,
          apply: p => p.addPassive(id)
        };
        attachMsCardMeta(pcard, d, pl, 'newpass');
        out.push(pcard);
      }
    }

    // --- evoluciones Pokémon (legacy) ---
    const waiting = {};
    if (!ms) {
      for (const m of pl.moves) {
        const ev = G.Moves.evoInfo(m, pl.statsTaken);
        if (!ev) continue;
        if (!ev.ready) { waiting[ev.needs] = m; continue; }
        out.push({
          w: 40, type: 'evo', key: 'evo:' + m.id,
          icon: 'move:' + m.id, color: '#ffd23f', tag: 'EVOLUCIÓN',
          title: m.name + ' → ' + ev.name, desc: ev.text,
          apply: p => {
            G.Moves.evolve(m);
            G.FX.ring(p.x, p.y, 8, 120, '#ffd23f', 0.8, 6);
            G.FX.burst(p.x, p.y - p.bodyH * 0.5, '#ffe14d', 40, 240);
            G.Audio.sfx('legend');
            G.Progress.event('evolve', { move: m.id });
          }
        });
      }
    }

    // --- mejoras de movimientos que ya tienes ---
    for (const m of pl.moves) {
      const txt = G.Moves.nextUpText(m);
      if (!txt) continue;
      const ab = G.Abilities.BY_ID[m.id];
      const ucard = {
        w: ms && ab ? msCardWeight(ab, pl, 'up') : 8, type: 'up', key: 'up:' + m.id,
        icon: 'move:' + m.id, color: typeColor(m.type),
        tag: 'Nv.' + m.lvl + ' > ' + (m.lvl + 1),
        title: m.name, desc: txt,
        apply: () => G.Moves.levelUp(m)
      };
      if (ms && ab) attachMsCardMeta(ucard, ab, pl, 'up');
      out.push(ucard);
    }

    // --- subida de pasivas MS ---
    if (ms) {
      for (const id in pl.passiveInst) {
        const p = pl.passiveInst[id];
        if (p.lvl >= p.def.maxLvl) continue;
        const txt = G.Abilities.nextUpText(p);
        if (!txt) continue;
        const upp = {
          w: msCardWeight(p.def, pl, 'up'), type: 'up', key: 'uppass:' + id,
          icon: 'type:' + (p.def.element || p.type), color: typeColor(p.type),
          tag: 'Pasiva Nv.' + p.lvl + ' > ' + (p.lvl + 1),
          title: p.name, desc: txt,
          apply: () => pl.levelPassive(id)
        };
        attachMsCardMeta(upp, p.def, pl, 'uppass');
        out.push(upp);
      }
    }

    // --- stats genéricos (legacy / no MS) ---
    if (!ms) {
      const room = s => !s.max || (pl.statsTaken[s.id] || 0) < s.max;
      const pickStats = G.U.pickN(STATS.filter(s => !waiting[s.id] && room(s)), 5).concat(STATS.filter(s => waiting[s.id]));
      for (const s of pickStats) {
        const evoFor = waiting[s.id];
        out.push({
          w: evoFor ? 14 : pl.slots.length < pl.maxMoves ? 4 : 7,
          type: 'stat', key: 'stat:' + s.id,
          icon: s.icon, color: evoFor ? '#ffd23f' : '#8fa3c4', tag: evoFor ? 'Evoluciona ' + evoFor.name : 'Mejora',
          title: G.Content.mode === 'neutral' && s.id === 'heal' ? 'Alivio' : s.title,
          desc: G.Content.mode === 'neutral' && s.id === 'heal' ? 'Recupera el 45% de tu vida ahora mismo.' : s.desc,
          apply: p => { s.apply(p); p.statsTaken[s.id] = (p.statsTaken[s.id] || 0) + 1; }
        });
      }
    }

    return out;
  }

  function isDefensiveCard(c) {
    if (!c || !c.key) return false;
    if (c.key.startsWith('newpass:')) {
      const def = G.Abilities.BY_ID[c.key.slice(8)];
      return G.MasterSorcerer && G.MasterSorcerer.isPassiveDefensive(def);
    }
    if (c.key.startsWith('uppass:')) {
      const def = G.Abilities.BY_ID[c.key.slice(7)];
      return G.MasterSorcerer && G.MasterSorcerer.isPassiveDefensive(def);
    }
    return false;
  }

  function msOffensiveSpellCount(pl) {
    return pl.moves.filter(m => {
      const t = m.def && m.def.tags;
      return t && t.indexOf('offensive') >= 0;
    }).length;
  }

  /** Devuelve 3 cartas distintas, elegidas por peso. */
  function offer(pl, n = 3) {
    const pool = candidates(pl);
    const picked = [];
    const used = new Set();
    const evo = pool.findIndex(c => c.type === 'evo');
    if (evo >= 0) { const c = pool.splice(evo, 1)[0]; used.add(c.key); picked.push(c); }

    while (picked.length < n && pool.length) {
      const total = pool.reduce((a, c) => a + c.w, 0);
      let r = Math.random() * total, idx = 0;
      for (let i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { idx = i; break; } }
      const c = pool.splice(idx, 1)[0];
      if (used.has(c.key)) continue;
      used.add(c.key);
      picked.push(c);
    }

    if (isMsRun(pl) && G.MasterSorcerer && picked.length >= n &&
        msOffensiveSpellCount(pl) <= 1 && picked.every(isDefensiveCard)) {
      const alt = candidates(pl).filter(c => !isDefensiveCard(c) && !used.has(c.key));
      if (alt.length) {
        used.delete(picked[picked.length - 1].key);
        picked[picked.length - 1] = alt[Math.floor(Math.random() * alt.length)];
        used.add(picked[picked.length - 1].key);
      }
    }
    return picked;
  }

  return { offer, STATS, isMsRun };
})();
