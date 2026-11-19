/* ============ run-ui.js — cartas de nivel, pausa y fin de run ============ */
G.RunUI = (() => {
  const $ = G.UI.$;
  let offers = null, offerCb = null, coopMode = false;

  /** @param coop  en grupo: tras elegir, se queda esperando a los demás */
  function showLevelUp(level, list, cb, coop = false) {
    offerCb = cb; coopMode = coop;
    $('lvl-num').textContent = level;
    $('lvl-wait').textContent = '';
    $('lvl-wait').classList.toggle('hidden', !coop);
    $('cards').classList.remove('done');
    renderCards(list);
    $('lvl-reroll').onclick = reroll;
    G.UI.show('scr-levelup');
  }

  /**
   * Cambiar las cartas: 1 vez gratis por partida y 1 más por cada jefe
   * derrotado (en grupo cuentan los jefes del equipo; cada uno tiene los suyos).
   */
  function rerollsLeft() {
    const p = G.Game.player;
    // 1 gratis + los comprados en Mejoras (antes, 1 más por cada jefe).
    return p ? Math.max(0, 1 + (p.rerollBonus || 0) - (p.rerolls || 0)) : 0;
  }

  function reroll() {
    if (!offers || rerollsLeft() <= 0) return;
    const p = G.Game.player;
    p.rerolls = (p.rerolls || 0) + 1;
    G.Audio.sfx('select');
    renderCards(G.LevelUp.offer(p));
  }

  function renderCards(list) {
    offers = list;
    const left = rerollsLeft();
    $('lvl-rr-n').textContent = left;
    $('lvl-reroll').classList.toggle('hidden', left <= 0);
    const box = $('cards');
    box.innerHTML = '';
    list.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'card';
      const tag = c.type === 'new'
        ? `<span class="tag-chip" style="background:${c.color}">New · ${c.tag}</span>`
        : c.type === 'up' || c.type === 'evo'
          ? `<span class="tag-chip" style="background:${c.color}">${c.tag}</span>`
          : `<span class="tag-chip" style="background:${c.color === '#ffd23f' ? '#ffd23f' : '#9fb1c9'}">${c.tag}</span>`;
      if (c.type === 'evo') el.classList.add('evo');
      el.innerHTML =
        `<div class="ico" style="background:${c.color}33">${G.Icons.html(c.icon, 32)}</div>
         <div class="txt"><div class="nm">${c.title} ${tag}</div><div class="ds">${c.desc}</div></div>
         <div class="key">${i + 1}</div>`;
      el.dataset.sfx = 'none';             // el juego pone su propio sonido al elegir
      el.onclick = () => pick(i);
      box.appendChild(el);
    });
  }

  function pick(i) {
    if (!offers || !offers[i]) return;
    const c = offers[i], cb = offerCb;
    offers = null; offerCb = null;
    $('lvl-reroll').classList.add('hidden');
    if (coopMode) {
      // Se queda la carta elegida a la vista mientras eligen los demás.
      $('cards').querySelectorAll('.card').forEach((el, j) => el.classList.toggle('picked', j === i));
      $('cards').classList.add('done');
    } else G.UI.hide('scr-levelup');
    cb(c);
  }

  /** Cooperativo: quién falta por elegir. */
  function setWaiting(names) {
    const me = G.DB.user || '';
    const others = names.filter(n => n !== me);
    const list = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : a[0];
    $('lvl-wait').textContent = !names.length ? ''
      : !others.length ? 'Pick your card'
      : names.includes(me) ? 'Waiting for picks: ' + list([...others, 'you'])
      : 'Waiting for ' + list(others) + '…';
  }

  function closeLevelUp() {
    offers = null; offerCb = null;
    $('cards').classList.remove('done');
    G.UI.hide('scr-levelup');
  }

  /**
   * Mensaje de apoyo (Ko-fi) al acabar: tras un récord o cada 10 partidas,
   * nunca en la primera y como mucho una vez al día. Se cierra con la X.
   */
  function askSupport() {
    return false;
  }

  function showOver(r, actions) {
    const neutral = G.Content.mode === 'neutral';
    $('over-title').textContent = r.victory ? 'Victory!' : (r.dead ? 'Defeat…' : 'Run over');
    $('over-stats').innerHTML = `
      <div><span>Result</span><b class="${r.victory ? 'gold' : ''}">${r.victory ? 'Victory' : r.dead ? 'Defeat' : 'Quit'}</b></div>
      <div><span>Time</span><b>${G.U.mmss(r.time)}</b></div>
      <div><span>Level</span><b>${r.level}</b></div>
      <div><span>Kills</span><b>${r.kills}</b></div>
      <div><span>Bosses</span><b>${r.bosses}</b></div>
      ${r.dmgDealt ? `<div><span>Damage dealt</span><b>${r.dmgDealt.toLocaleString('en-US')}</b></div>` : ''}
      ${r.judge ? `<div style="grid-column:1/-1"><span>Judgment phase</span><b class="gold">${G.U.mmss(r.judge.time)} · ${r.judge.bosses} ${r.judge.bosses === 1 ? 'guardian' : 'guardians'}</b></div>` : ''}
      <div style="grid-column:1/-1"><span>${neutral ? 'Gold coins earned' : 'Coins earned'}</span>
        <b class="gold"><span class="coin"></span> +${r.coins}</b>
        <div style="font-size:14px;color:var(--muted)">${r.breakdown}</div></div>
      ${!neutral && (r.t1 || r.t10) ? `<div style="grid-column:1/-1"><span>Tickets del gacha</span><b>
        ${r.t1 ? G.Icons.html('ticket', 22) + ' +' + r.t1 + ' ' : ''}${r.t10 ? G.Icons.html('ticket10', 22) + ' +' + r.t10 + ' ×10' : ''}</b></div>` : ''}
      <div style="grid-column:1/-1"><span>${neutral ? 'Spells' : 'Moves'}</span><b style="font-size:17px">
        ${r.moves.map(m => `${G.Icons.html('move:' + m.id, 16)} ${m.name} Lv.${m.lvl}`).join(' · ') || '—'}</b></div>
      ${r.msSpells && r.msSpells.length ? `<div style="grid-column:1/-1" class="ms-over-spells"><span>Spells (run)</span>
        <div class="ms-over-table">${r.msSpells.slice(0, 6).map(s =>
          `<div class="ms-over-row"><b>${s.name}</b><span>Lv.${s.finalLevel}</span>
           <span>${s.damage.toLocaleString('en-US')} dmg</span><span>${s.casts} casts</span>
           <span>${s.kills} kills</span>${s.damageBoss ? `<span class="gold">${s.damageBoss} vs boss</span>` : ''}</div>`
        ).join('')}</div></div>` : ''}
      ${r.caught && r.caught.length && !neutral ? `<div style="grid-column:1/-1" class="caught"><span>${G.Icons.html('shiny', 12)} Shinies caught</span>
        <div class="caught-row" id="over-caught"></div></div>` : ''}
      ${G.BestiaryRunUI && r.bestiarySummary ? G.BestiaryRunUI.renderOverSummary(r.bestiarySummary) : ''}
      ${r.record ? '<div style="grid-column:1/-1;text-align:center" class="gold">New record!</div>' : ''}
      ${askSupport(r) ? `<div class="support-ask" id="over-ask" style="grid-column:1/-1">
        <button class="x" type="button" aria-label="Close">×</button>
        <p>Enjoying TibiaSurvivor? If you like the game, you can help keep it online with a voluntary donation.</p>
        <a class="btn small gold" href="${G.Funding.url}" target="_blank" rel="noopener">${G.Icons.html('heart', 14)} Support on Ko-fi</a>
      </div>` : ''}`;
    const ask = $('over-ask');
    if (ask) ask.querySelector('.x').onclick = () => ask.remove();
    const menuFn = actions && actions.onMenu ? actions.onMenu : actions;
    const replayFn = actions && actions.onReplay ? actions.onReplay : null;
    $('btn-again').onclick = () => { G.UI.hide('scr-over'); if (menuFn) menuFn(); };
    $('btn-replay').onclick = () => {
      G.UI.hide('scr-over');
      if (replayFn) replayFn();
      else if (menuFn) menuFn();
    };
    if (r.caught && r.caught.length) {
      const row = $('over-caught');
      for (const c of r.caught) {
        const w = document.createElement('div');
        w.appendChild(G.UI.spriteCanvas(c.dex, 90, 72, { shiny: true, lively: true, scale: 2 }));
        const nm = G.Content.creatureName(c.dex) || 'Creature';
        w.insertAdjacentHTML('beforeend', `<small>${nm}${c.isNew ? ' · new!' : ''}</small>`);
        row.appendChild(w);
      }
    }
    G.UI.show('scr-over');
  }

  /** Has encontrado un objeto llevando ya otro: ¿con cuál te quedas? */
  function showItemChoice(cur, next, cb) {
    if (G.Icons.bust) { G.Icons.bust(cur); G.Icons.bust(next); }
    if (G.TibiaSprites && G.TibiaSprites.preloadItems) G.TibiaSprites.preloadItems([cur, next], 4000);
    const box = $('item-cards');
    box.innerHTML = '';
    [[cur, 'Quedarme con'], [next, 'Cambiar a']].forEach(([id, verb], i) => {
      const it = G.Items.BY[id];
      const el = document.createElement('div');
      el.className = 'card' + (i === 1 ? ' evo' : '');
      el.innerHTML = `<div class="ico">${G.Icons.html(id, 36)}</div>
        <div class="txt"><div class="nm">${verb} ${it.name}</div><div class="ds">${it.desc}</div></div>
        <div class="key">${i + 1}</div>`;
      el.onclick = () => { G.UI.hide('scr-item'); cb(id); };
      box.appendChild(el);
    });
    G.UI.show('scr-item');
  }

  // ---------------- vínculo: qué movimientos se fusionan ----------------

  let bond = null;          // { opt, cb, first, list }

  /**
   * @param opt  pl.bondOptions(): 'add' (uno suelto al grupo) o 'pair' (dos sueltos, en dos pasos)
   * @param cb   recibe la lista de movimientos que se juntan
   */
  function showBond(opt, cb) {
    bond = { opt, cb, first: null, list: [] };
    $('bond-back').onclick = bondBack;
    renderBond();
    G.UI.show('scr-bond');
  }

  function renderBond() {
    const { opt, first } = bond;
    const names = ms => ms.map(m => m.name).join(' + ');
    const step2 = opt.mode === 'pair' && first;
    $('bond-sub').textContent = opt.mode === 'add' ? 'Pick which spell bonds into ' + names(opt.group)
      : step2 ? 'Which spell bonds with ' + first.name + '?' : 'Pick the first spell to bond';
    $('bond-back').classList.toggle('hidden', !step2);
    bond.list = step2 ? opt.loose.filter(m => m !== first) : opt.loose;
    const box = $('bond-cards');
    box.innerHTML = '';
    bond.list.forEach((m, i) => {
      const col = G.U.TYPE_COLOR[m.type];
      const desc = opt.mode === 'add' ? 'Fires together with ' + names(opt.group) + '.'
        : step2 ? 'Fires together with ' + first.name + '. One slot stays free.'
        : m.desc || '';
      const el = document.createElement('div');
      el.className = 'card' + (opt.mode === 'add' || step2 ? ' bond' : '');
      el.innerHTML =
        `<div class="ico" style="background:${col}33">${G.Icons.html('move:' + m.id, 32)}</div>
         <div class="txt"><div class="nm">${m.name} <span class="tag-chip" style="background:${col}">Lv.${m.lvl}</span></div><div class="ds">${desc}</div></div>
         <div class="key">${i + 1}</div>`;
      el.dataset.sfx = 'none';
      el.onclick = () => pickBond(i);
      box.appendChild(el);
    });
  }

  function pickBond(i) {
    if (!bond || !bond.list[i]) return;
    const m = bond.list[i];
    if (bond.opt.mode === 'pair' && !bond.first) {
      bond.first = m;
      G.Audio.sfx('select');
      renderBond();
      return;
    }
    const picked = bond.opt.mode === 'add' ? [m] : [bond.first, m];
    const cb = bond.cb;
    bond = null;
    G.UI.hide('scr-bond');
    cb(picked);
  }

  function bondBack() {
    if (!bond) return;
    bond.first = null;
    renderBond();
  }

  function showPause(coop = false) {
    G.UI.soundControls($('pause-sound'));
    $('pause-coop').classList.toggle('hidden', !coop);
    $('btn-quit').textContent = coop ? 'Leave match' : 'Quit run';
    G.UI.show('scr-pause');
  }

  function wirePause(onResume, onQuit) {
    $('btn-resume').onclick = onResume;
    $('btn-quit').onclick = onQuit;
  }

  return { showLevelUp, reroll, showItemChoice, showBond, pickBond, bondBack, pick, setWaiting, closeLevelUp, showOver, wirePause, showPause };
})();
