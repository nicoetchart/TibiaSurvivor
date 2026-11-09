/* ============ bestiary-ui.js — catálogo y detalle (BST-5) ============ */
G.BestiaryUI = (() => {
  const $ = G.UI.$;
  let selId = null;
  let fState = 'all';
  let fDiff = 'all';
  let fType = 'all';
  let tab = 'catalog';

  const STATE_LABEL = {
    unknown: 'Desconocida',
    discovered: 'Descubierta',
    stage_1: 'Etapa I',
    stage_2: 'Etapa II',
    completed: 'Dominio'
  };

  const DIFF_LABEL = {
    trivial: 'Trivial',
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
    elite: 'Élite',
    boss: 'Jefe'
  };

  const TYPE_LABEL = { normal: 'Normal', elite: 'Élite', boss: 'Jefe' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function progressRow(creatureId) {
    return G.Bestiary.getProgressEntry(creatureId) || G.Bestiary.defaultProgressEntry();
  }

  function entryState(creatureId, catalog) {
    const prog = progressRow(creatureId);
    const kills = prog.kills || 0;
    const had = kills > 0 || prog.firstSeenAt != null;
    return G.Bestiary.deriveStage(kills, catalog.thresholds, had);
  }

  function nextThreshold(state, th) {
    if (!th) return null;
    if (state === 'unknown' || state === 'discovered') return th.stage1;
    if (state === 'stage_1') return th.stage2;
    if (state === 'stage_2') return th.final;
    return null;
  }

  function combatCreature(catalog) {
    const id = catalog.combatCreatureId || catalog.creatureId;
    return G.CREATURE_BY_ID && G.CREATURE_BY_ID[id] ? G.CREATURE_BY_ID[id] : null;
  }

  function catalogList() {
    return G.Bestiary.listEntries();
  }

  function passesFilters(row) {
    const st = entryState(row.creatureId, row);
    if (fState === 'unknown' && st !== 'unknown') return false;
    if (fState === 'discovered' && st !== 'discovered') return false;
    if (fState === 'progress' && st !== 'stage_1' && st !== 'stage_2') return false;
    if (fState === 'completed' && st !== 'completed') return false;
    if (fDiff !== 'all' && row.difficulty !== fDiff) return false;
    if (fType !== 'all' && row.entryType !== fType) return false;
    return true;
  }

  function summaryStats() {
    const list = catalogList();
    let discovered = 0;
    let completed = 0;
    for (const row of list) {
      const st = entryState(row.creatureId, row);
      if (st !== 'unknown') discovered++;
      if (st === 'completed') completed++;
    }
    return {
      total: list.length,
      discovered,
      completed,
      points: G.Bestiary.getAvailablePoints()
    };
  }

  function renderSummary() {
    const s = summaryStats();
    $('bestiary-summary').innerHTML =
      `<span>Descubiertas <b>${s.discovered}</b> / ${s.total}</span>` +
      `<span>Completadas <b>${s.completed}</b></span>` +
      `<span>Puntos <b class="gold">${s.points.toLocaleString('es')}</b></span>`;
  }

  function renderFilters() {
    const fb = $('bestiary-filters');
    fb.innerHTML = '';
    const mk = (label, kind, value) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip' + ((kind === 'state' && fState === value) || (kind === 'diff' && fDiff === value) || (kind === 'type' && fType === value) ? ' on' : '');
      c.textContent = label;
      c.onclick = () => {
        if (kind === 'state') fState = value;
        else if (kind === 'diff') fDiff = value;
        else fType = value;
        open();
      };
      fb.appendChild(c);
    };
    mk('Estado: todos', 'state', 'all');
    mk('Desconocidas', 'state', 'unknown');
    mk('Descubiertas', 'state', 'discovered');
    mk('En progreso', 'state', 'progress');
    mk('Completas', 'state', 'completed');
    mk('Dificultad: todas', 'diff', 'all');
    for (const d of G.Bestiary.DIFFICULTIES) mk(DIFF_LABEL[d] || d, 'diff', d);
    mk('Tipo: todos', 'type', 'all');
    mk('Normal', 'type', 'normal');
    mk('Élite', 'type', 'elite');
    mk('Jefe', 'type', 'boss');
  }

  function renderGrid() {
    const grid = $('bestiary-grid');
    grid.innerHTML = '';
    const rows = catalogList().filter(passesFilters);
    if (!selId || !rows.some(r => r.creatureId === selId)) selId = rows.length ? rows[0].creatureId : null;

    for (const row of rows) {
      const st = entryState(row.creatureId, row);
      const prog = progressRow(row.creatureId);
      const known = st !== 'unknown';
      const catFull = G.Bestiary.getCatalogEntry(row.creatureId);
      const legacy = catFull && catFull.legacyId;
      const cell = document.createElement('div');
      cell.className = 'cell' + (known ? '' : ' locked') + (row.creatureId === selId ? ' on' : '');
      cell.tabIndex = 0;
      if (row.entryType === 'boss') cell.insertAdjacentHTML('beforeend', `<span class="badge-r" title="Jefe">${G.Icons.html('crown', 12)}</span>`);
      else if (row.entryType === 'elite') cell.insertAdjacentHTML('beforeend', `<span class="badge-r" title="Élite">★</span>`);
      if (legacy != null && G.GeoSprites) {
        cell.appendChild(G.UI.spriteCanvas(legacy, 92, 80, { scale: 2, silhouette: !known, shadow: known }));
      } else {
        cell.insertAdjacentHTML('beforeend', `<div class="ico-placeholder" style="height:80px"></div>`);
      }
      const th = row.thresholds;
      const next = nextThreshold(st, th);
      const progTxt = known && th ? `${prog.kills} / ${st === 'completed' ? th.final : next}` : '???';
      cell.insertAdjacentHTML('beforeend', `<b>${known ? esc(row.displayName || row.creatureId) : '???'}</b>` +
        `<small>${STATE_LABEL[st] || st}${known ? ' · ' + progTxt : ''}</small>`);
      cell.onclick = () => select(row.creatureId);
      cell.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(row.creatureId); } };
      grid.appendChild(cell);
    }
    if (!rows.length) grid.innerHTML = '<p class="sub" style="grid-column:1/-1">Ninguna entrada con este filtro.</p>';
  }

  function select(creatureId) {
    selId = creatureId;
    renderGrid();
    renderDetail(creatureId);
  }

  function canReveal(stageKey, field, catalog) {
    const rev = catalog.reveal;
    if (!rev || !rev[stageKey]) return false;
    return rev[stageKey].includes(field);
  }

  function stageUnlocked(st, need) {
    const order = ['unknown', 'discovered', 'stage_1', 'stage_2', 'completed'];
    return order.indexOf(st) >= order.indexOf(need);
  }

  function renderDetail(creatureId) {
    const box = $('bestiary-detail');
    const catalog = G.Bestiary.getCatalogEntry(creatureId);
    if (!catalog) {
      box.innerHTML = '<p class="sub">Selecciona una entrada.</p>';
      return;
    }
    const prog = progressRow(creatureId);
    const st = entryState(creatureId, catalog);
    const known = st !== 'unknown';
    const cr = combatCreature(catalog);

    if (known) {
      box.innerHTML = '';
      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'center';
      if (catalog.legacyId != null) {
        canvasWrap.appendChild(G.UI.spriteCanvas(catalog.legacyId, 120, 100, { scale: 2.2, shadow: true }));
      }
      box.appendChild(canvasWrap);
      const head = document.createElement('div');
      head.className = 'center';
      head.innerHTML = `<h3>${esc(catalog.displayName || creatureId)}</h3>` +
        `<div class="sub">${TYPE_LABEL[catalog.entryType] || catalog.entryType} · ${DIFF_LABEL[catalog.difficulty] || catalog.difficulty}</div>` +
        `<div class="sub">${STATE_LABEL[st]} · ${prog.kills} muertes` +
        (catalog.thresholds ? ` · objetivo ${catalog.thresholds.final}` : '') + '</div>';
      box.appendChild(head);
    } else {
      box.innerHTML = '<div class="center"><h3>???</h3><p class="sub">Criatura aún no identificada.</p></div>';
      return;
    }

    const addSection = (title, rows) => {
      if (!rows.length) return;
      const sec = document.createElement('div');
      sec.className = 'bestiary-detail-sec';
      sec.innerHTML = `<h4>${title}</h4>` + rows.map(([k, v]) =>
        `<div class="stat"><span>${esc(k)}</span><span>${v}</span></div>`).join('');
      box.appendChild(sec);
    };

    const s1 = [];
    if (stageUnlocked(st, 'stage_1')) {
      if (canReveal('stage1', 'description', catalog) && catalog.description) {
        s1.push(['Descripción', esc(catalog.description)]);
      }
      if (canReveal('stage1', 'hp', catalog) && cr) s1.push(['Vida base', cr.hp]);
      if (canReveal('stage1', 'xp', catalog)) s1.push(['Experiencia', 'Según tier en run']);
      if (canReveal('stage1', 'behavior', catalog) && cr && cr.behavior) s1.push(['Comportamiento', cr.behavior]);
    }
    addSection('Identificación', s1);

    const s2 = [];
    if (stageUnlocked(st, 'stage_2')) {
      if (canReveal('stage2', 'damage', catalog) && cr) s2.push(['Amenaza', '×' + (cr.attack || 1).toFixed(2)]);
      if (canReveal('stage2', 'speed', catalog) && cr) s2.push(['Velocidad', cr.speed]);
      if (canReveal('stage2', 'abilities', catalog) && cr && cr.behavior) s2.push(['Patrón', cr.behavior]);
      if (canReveal('stage2', 'resistances', catalog)) {
        const types = cr && cr.damageTypes && cr.damageTypes.length ? cr.damageTypes.join(', ') : null;
        if (types) s2.push(['Daño usado', types]);
      }
    }
    addSection('Análisis', s2);

    const s3 = [];
    if (stageUnlocked(st, 'completed')) {
      if (canReveal('stage3', 'drops', catalog)) s3.push(['Botín en run', 'Experiencia (orbe al morir)']);
      if (canReveal('stage3', 'tips', catalog) && catalog.tipKeys && catalog.tipKeys.length) {
        const tipLines = catalog.tipKeys.map(k =>
          (G.BestiaryTips && G.BestiaryTips.text(k)) || null).filter(Boolean);
        if (tipLines.length) s3.push(['Consejo', tipLines.map(t => esc(t)).join(' ')]);
      }
      if (canReveal('stage3', 'statistics', catalog)) {
        s3.push(['Muertes totales', prog.kills]);
        if (prog.firstSeenAt) s3.push(['Primera baja', new Date(prog.firstSeenAt).toLocaleDateString('es')]);
      }
      if (prog.rewarded) s3.push(['Puntos obtenidos', catalog.rewardPoints]);
    }
    addSection('Dominio', s3);
  }

  function setTab(next) {
    tab = next;
    const cat = $('bestiary-tab-catalog');
    const shop = $('bestiary-tab-shop');
    const charms = $('bestiary-tab-charms');
    if (cat) cat.classList.toggle('hidden', tab !== 'catalog');
    if (shop) shop.classList.toggle('hidden', tab !== 'shop');
    if (charms) charms.classList.toggle('hidden', tab !== 'charms');
    const tabs = document.querySelectorAll('[data-bestiary-tab]');
    tabs.forEach(btn => btn.classList.toggle('on', btn.getAttribute('data-bestiary-tab') === tab));
    if (tab === 'shop') renderShop();
    else if (tab === 'charms') renderCharms();
    else {
      renderFilters();
      renderGrid();
      if (selId) renderDetail(selId);
    }
  }

  function purchaseFail(reason) {
    if (reason === 'funds') G.UI.toast('No tienes puntos suficientes');
    else if (reason === 'max' || reason === 'owned') G.UI.toast('Ya está al máximo o desbloqueado');
    else if (reason === 'persist') G.UI.toast('No se pudo guardar la compra');
    else G.UI.toast('Compra no disponible');
  }

  function renderShop() {
    const box = $('bestiary-shop-list');
    if (!box) return;
    box.innerHTML = '';
    const pts = G.Bestiary.getAvailablePoints();
    const hdr = document.createElement('p');
    hdr.className = 'sub';
    hdr.style.margin = '0 0 12px';
    hdr.innerHTML = 'Saldo: <b class="gold">' + pts.toLocaleString('es') + '</b> puntos';
    box.appendChild(hdr);

    const mkRow = (icon, title, sub, cost, maxed, onBuy) => {
      const el = document.createElement('div');
      el.className = 'panel upg-item';
      el.innerHTML =
        `<div class="ic">${G.Icons.html(icon, 32)}</div>` +
        `<div><b>${esc(title)}</b> <span style="color:var(--muted);font-size:13px">${esc(sub)}</span></div>` +
        `<div class="upg-btns"><button type="button" class="btn small ${maxed ? '' : 'gold'}" data-buy ${maxed ? 'disabled' : ''}>` +
        (maxed ? 'Completado' : '<span class="gold">' + cost + ' pts</span>') + '</button></div>';
      const btn = el.querySelector('[data-buy]');
      if (!maxed && btn) btn.onclick = onBuy;
      box.appendChild(el);
    };

    for (const u of G.Bestiary.GLOBAL_UPGRADES) {
      const lv = G.Bestiary.getUpgradeLevel(u.id);
      const maxed = lv >= u.maxLevel;
      const cost = maxed ? 0 : G.Bestiary.upgradeCost(u, lv);
      const pips = Array.from({ length: u.maxLevel }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
      const el = document.createElement('div');
      el.className = 'panel upg-item';
      el.innerHTML =
        `<div class="ic">${G.Icons.html(u.icon, 32)}</div>` +
        `<div><b>${esc(u.name)}</b> <span style="color:var(--muted);font-size:13px">${esc(u.unit)}</span>` +
        `<div class="pips">${pips}</div></div>` +
        `<div class="upg-btns"><button type="button" class="btn small ${maxed ? '' : 'gold'}" data-buy ${maxed || pts < cost ? 'disabled' : ''}>` +
        (maxed ? 'Máx.' : cost + ' pts') + '</button></div>';
      const btn = el.querySelector('[data-buy]');
      if (btn && !maxed) {
        btn.onclick = () => {
          const nowLv = G.Bestiary.getUpgradeLevel(u.id);
          const price = G.Bestiary.upgradeCost(u, nowLv);
          if (!confirm('¿Gastar ' + price + ' puntos en «' + u.name + '» (nivel ' + (nowLv + 1) + ')?')) return;
          const res = G.Bestiary.purchaseUpgrade(u.id);
          if (res.ok) {
            G.Audio.sfx('buy');
            G.UI.toast(u.name + ' · nivel ' + res.level);
            renderSummary();
            renderShop();
          } else purchaseFail(res.reason);
        };
      }
      box.appendChild(el);
    }

    if (G.Bestiary.CONTENT_UNLOCKS && G.Bestiary.CONTENT_UNLOCKS.length) {
      const sep = document.createElement('h4');
      sep.textContent = 'Desbloqueos';
      sep.style.margin = '16px 0 8px';
      box.appendChild(sep);
    }
    for (const u of G.Bestiary.CONTENT_UNLOCKS || []) {
      const owned = G.Bestiary.hasUnlock(u.id);
      mkRow(u.icon, u.name, u.description, u.cost, owned, () => {
        if (G.Bestiary.hasUnlock(u.id)) return;
        if (!confirm('¿Gastar ' + u.cost + ' puntos en «' + u.name + '»?')) return;
        const res = G.Bestiary.purchaseUnlock(u.id);
        if (res.ok) {
          G.Audio.sfx('buy');
          G.UI.toast(u.name + ' desbloqueado');
          renderSummary();
          renderShop();
        } else purchaseFail(res.reason);
      });
    }
  }

  function renderCharms() {
    const box = $('bestiary-charms-list');
    if (!box || !G.Bestiary.charmCatalog) return;
    box.innerHTML = '';
    const pts = G.Bestiary.getAvailablePoints();
    const equipped = new Set(G.Bestiary.listEquippedCharms());
    const hdr = document.createElement('p');
    hdr.className = 'sub';
    hdr.style.margin = '0 0 12px';
    hdr.innerHTML = 'Saldo: <b class="gold">' + pts.toLocaleString('es') + '</b> puntos · Equipado: <b>' +
      (equipped.size ? [...equipped].map(id => (G.Bestiary.charmById(id) || {}).name || id).join(', ') : 'ninguno') + '</b>';
    box.appendChild(hdr);

    for (const c of G.Bestiary.charmCatalog()) {
      if (c.enabled === false) continue;
      const unlocked = G.Bestiary.isCharmUnlocked(c.id);
      const isOn = equipped.has(c.id);
      const el = document.createElement('div');
      el.className = 'panel upg-item';
      el.innerHTML =
        `<div class="ic">${G.Icons.html('medal3', 32)}</div>` +
        `<div><b>${esc(c.name || c.id)}</b>` +
        `<span style="color:var(--muted);font-size:13px;display:block;margin-top:4px">${esc(c.description || '')}</span>` +
        `<small class="sub">${esc(c.trigger)} · cd ${c.cooldownMs} ms</small></div>` +
        `<div class="upg-btns"></div>`;
      const btns = el.querySelector('.upg-btns');
      if (!unlocked) {
        const buy = document.createElement('button');
        buy.type = 'button';
        buy.className = 'btn small gold';
        buy.textContent = c.cost + ' pts';
        buy.disabled = pts < c.cost;
        buy.onclick = () => {
          if (!confirm('¿Desbloquear «' + (c.name || c.id) + '» por ' + c.cost + ' puntos?')) return;
          const res = G.Bestiary.unlockCharm(c.id);
          if (res.ok) {
            G.Audio.sfx('buy');
            G.UI.toast((c.name || c.id) + ' desbloqueado');
            renderSummary();
            renderCharms();
          } else purchaseFail(res.reason === 'owned' ? 'owned' : res.reason);
        };
        btns.appendChild(buy);
      } else if (isOn) {
        const off = document.createElement('button');
        off.type = 'button';
        off.className = 'btn small ghost';
        off.textContent = 'Quitar';
        off.onclick = () => {
          G.Bestiary.unequipCharm(c.id);
          G.UI.toast('Amuleto retirado');
          renderCharms();
        };
        btns.appendChild(off);
      } else {
        const eq = document.createElement('button');
        eq.type = 'button';
        eq.className = 'btn small gold';
        eq.textContent = 'Equipar';
        eq.onclick = () => {
          const res = G.Bestiary.equipCharm(c.id, 0);
          if (res.ok) {
            G.Audio.sfx('select');
            G.UI.toast((c.name || c.id) + ' equipado');
            renderCharms();
          }
        };
        btns.appendChild(eq);
      }
      box.appendChild(el);
    }
  }

  function init() {
    const back = $('bestiary-back');
    if (back) back.onclick = () => G.MenuUI.open();
    document.querySelectorAll('[data-bestiary-tab]').forEach(btn => {
      btn.onclick = () => setTab(btn.getAttribute('data-bestiary-tab') || 'catalog');
    });
  }

  function open() {
    if (!G.Bestiary || !G.DB.save) return;
    G.UI.show('scr-bestiary', true);
    renderSummary();
    setTab(tab);
    if (tab === 'catalog') {
      if (selId) renderDetail(selId);
      else $('bestiary-detail').innerHTML = '<p class="sub">Selecciona una entrada del catálogo.</p>';
    }
  }

  init();
  return { open, init };
})();
