/* ============ bestiary-ui.js — catalog and detail (BST-5) ============ */
G.BestiaryUI = (() => {
  const $ = G.UI.$;
  let selId = null;
  let fState = 'all';
  let fDiff = 'all';
  let fType = 'all';
  let fOcc = 'all';
  let fBossCat = 'all';
  let searchQ = '';
  let tab = 'catalog';

  const DIFF_LABEL = {
    harmless: 'Harmless',
    trivial: 'Trivial',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    challenging: 'Challenging',
    elite: 'Elite',
    boss: 'Boss'
  };

  const SECTION_LABEL = { bestiary: 'Bestiary', bosstiary: 'Bosstiary' };
  const BOSS_CATEGORY_LABEL = { bane: 'Bane', archfoe: 'Archfoe', nemesis: 'Nemesis' };

  function stageName(st, section) {
    return G.Bestiary.stageLabel(st, section);
  }

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
    if (G.Cyclopedia && G.Cyclopedia.getDefinition) {
      const def = G.Cyclopedia.getDefinition(id);
      if (def) return def;
    }
    return G.CREATURE_BY_ID && G.CREATURE_BY_ID[id] ? G.CREATURE_BY_ID[id] : null;
  }

  /** Spawn stats (D7 hp_band) when roster matches creature data. */
  function spawnStats(creatureId) {
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID[creatureId];
    if (G.NeutralRoster && G.NeutralRoster.useHpBand && G.NeutralRoster.useHpBand() && c && G.NeutralRoster.defFor) {
      return G.NeutralRoster.defFor(c);
    }
    return null;
  }

  function catalogList() {
    if (tab === 'bosstiary') return G.Bestiary.listBossEntries();
    return G.Bestiary.listEntries().filter(row => row.section !== 'bosstiary');
  }

  function passesFilters(row) {
    const st = entryState(row.creatureId, row);
    if (fState !== 'all') {
      if (fState === 'progress') {
        if (st !== 'stage_1' && st !== 'stage_2') return false;
      } else if (st !== fState) return false;
    }
    if (tab !== 'bosstiary' && fDiff !== 'all' && row.difficulty !== fDiff) return false;
    if (tab !== 'bosstiary' && fType !== 'all' && row.section !== fType) return false;
    if (tab === 'bosstiary' && row.section !== 'bosstiary') return false;
    if (fBossCat !== 'all' && row.bossCategory !== fBossCat) return false;
    if (fOcc !== 'all' && row.occurrence !== fOcc) return false;
    if (searchQ) {
      const q = searchQ;
      const name = String(row.displayName || row.creatureId || '').toLowerCase();
      const id = String(row.creatureId || '').toLowerCase();
      if (!name.includes(q) && !id.includes(q)) return false;
    }
    return true;
  }

  function isDailyBoostEntry(creatureId, section) {
    if (!G.DailyBoost || !creatureId) return false;
    if (section === 'bosstiary') return G.DailyBoost.isBossBoosted(creatureId);
    return G.DailyBoost.isCreatureBoosted(creatureId);
  }

  function summaryStats() {
    const list = catalogList();
    let discovered = 0;
    let completed = 0;
  let firstVictories = 0;
    for (const row of list) {
      const st = entryState(row.creatureId, row);
      if (st !== 'unknown') discovered++;
      if (st === 'completed') completed++;
      if (tab === 'bosstiary') {
        const prog = progressRow(row.creatureId);
        if (prog.firstVictoryAt) firstVictories++;
      }
    }
    return {
      total: list.length,
      discovered,
      completed,
      firstVictories,
      charmPoints: G.Bestiary.getAvailableCharmPoints(),
      bossPoints: G.Bestiary.getAvailableBossPoints()
    };
  }

  function renderDailyPanel() {
    const box = $('cyclopedia-daily');
    if (!box) return;
    if (!G.DailyBoost) {
      box.innerHTML = '';
      box.classList.add('hidden');
      return;
    }
    const parts = [];
    const cid = G.DailyBoost.getBoostedCreatureId && G.DailyBoost.getBoostedCreatureId();
    const bid = G.DailyBoost.getBoostedBossId && G.DailyBoost.getBoostedBossId();
    if (cid && G.DailyBoost.bannerCreatureText) {
      parts.push(
        `<button type="button" class="daily-card boost" data-daily-creature="${esc(cid)}">` +
        `<b>Creature boost</b>${esc(G.DailyBoost.bannerCreatureText())}</button>`
      );
    }
    if (bid && G.DailyBoost.bannerBossText) {
      parts.push(
        `<button type="button" class="daily-card boost" data-daily-boss="${esc(bid)}">` +
        `<b>Boss boost</b>${esc(G.DailyBoost.bannerBossText())}</button>`
      );
    }
    if (!parts.length) {
      box.innerHTML = '';
      box.classList.add('hidden');
      return;
    }
    box.classList.remove('hidden');
    box.innerHTML = parts.join('');
    box.querySelectorAll('[data-daily-creature]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-daily-creature');
        tab = 'catalog';
        setTab('catalog');
        if (id) select(id);
      };
    });
    box.querySelectorAll('[data-daily-boss]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-daily-boss');
        tab = 'bosstiary';
        setTab('bosstiary');
        if (id) select(id);
      };
    });
  }

  function renderSummary() {
    const s = summaryStats();
    const box = $('bestiary-summary');
    if (tab === 'shop' || tab === 'charms') {
      box.innerHTML = `<span>Charm points <b class="gold">${s.charmPoints.toLocaleString('en-US')}</b></span>`;
      return;
    }
    if (tab === 'bosstiary') {
      box.innerHTML =
        `<span>Sighted <b>${s.discovered}</b> / ${s.total}</span>` +
        `<span>Mastery <b>${s.completed}</b></span>` +
        `<span>First victories <b>${s.firstVictories}</b></span>` +
        `<span>Boss points <b class="gold">${s.bossPoints.toLocaleString('en-US')}</b></span>`;
      return;
    }
    box.innerHTML =
      `<span>Sighted <b>${s.discovered}</b> / ${s.total}</span>` +
      `<span>Mastered <b>${s.completed}</b></span>` +
      `<span>Charm points <b class="gold">${s.charmPoints.toLocaleString('en-US')}</b></span>`;
  }

  function statusFiltersForTab() {
    const section = tab === 'bosstiary' ? 'bosstiary' : 'bestiary';
    return [
      { value: 'all', label: 'Status: All' },
      { value: 'unknown', label: stageName('unknown', section) },
      { value: 'discovered', label: stageName('discovered', section) },
      { value: 'stage_1', label: stageName('stage_1', section) },
      { value: 'stage_2', label: stageName('stage_2', section) },
      { value: 'completed', label: stageName('completed', section) }
    ];
  }

  function renderFilters() {
    const fb = $('bestiary-filters');
    fb.className = 'filters filter-stack';
    fb.innerHTML = '';
    const mkRow = () => {
      const row = document.createElement('div');
      row.className = 'filter-row';
      fb.appendChild(row);
      return row;
    };
    const mk = (parent, label, kind, value) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip' + ((kind === 'state' && fState === value) || (kind === 'diff' && fDiff === value) ||
        (kind === 'type' && fType === value) || (kind === 'occ' && fOcc === value) ||
        (kind === 'bosscat' && fBossCat === value) ? ' on' : '');
      c.textContent = label;
      c.onclick = () => {
        if (kind === 'state') fState = value;
        else if (kind === 'diff') fDiff = value;
        else if (kind === 'type') fType = value;
        else if (kind === 'occ') fOcc = value;
        else if (kind === 'bosscat') fBossCat = value;
        open();
      };
      parent.appendChild(c);
    };

    const rowStatus = mkRow();
    for (const st of statusFiltersForTab()) mk(rowStatus, st.label, 'state', st.value);

    if (tab === 'bosstiary') {
      const rowCat = mkRow();
      mk(rowCat, 'Category: all', 'bosscat', 'all');
      const info = G.Bestiary.BOSS_CATEGORY_INFO || {};
      for (const cat of G.Bestiary.BOSS_CATEGORIES) {
        const lbl = (info[cat] && info[cat].label) || cat;
        mk(rowCat, lbl, 'bosscat', cat);
      }
    } else {
      const rowDiff = mkRow();
      mk(rowDiff, 'Difficulty: all', 'diff', 'all');
      for (const d of G.Bestiary.DIFFICULTIES) {
        if (d === 'elite' || d === 'boss') continue;
        mk(rowDiff, DIFF_LABEL[d] || d, 'diff', d);
      }
      const rowOcc = mkRow();
      mk(rowOcc, 'Occurrence: all', 'occ', 'all');
      for (const occ of G.CyclopediaEnums.OCCURRENCE) {
        mk(rowOcc, G.Bestiary.occurrenceLabel(occ), 'occ', occ);
      }
    }
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
      const boosted = isDailyBoostEntry(row.creatureId, row.section);
      cell.className = 'cell' + (known ? '' : ' locked') + (row.creatureId === selId ? ' on' : '') + (boosted ? ' boosted' : '');
      cell.tabIndex = 0;
      if (boosted) cell.insertAdjacentHTML('beforeend', '<span class="badge-r" title="Daily boost" style="color:var(--gold)">★</span>');
      else if (row.section === 'bosstiary') cell.insertAdjacentHTML('beforeend', `<span class="badge-r" title="Bosstiary">${G.Icons.html('crown', 12)}</span>`);
      if (legacy != null && G.TibiaSprites && G.TibiaSprites.hasCreature(legacy)) {
        cell.appendChild(G.UI.spriteCanvas(legacy, 92, 80, { scale: 2, silhouette: !known, shadow: known }));
      } else {
        cell.insertAdjacentHTML('beforeend', `<div class="ico-placeholder" style="height:80px"></div>`);
      }
      const th = row.thresholds;
      const next = nextThreshold(st, th);
      const progTxt = known && th ? `${prog.kills} / ${st === 'completed' ? th.final : next}` : '???';
      cell.insertAdjacentHTML('beforeend', `<b>${known ? esc(row.displayName || row.creatureId) : '???'}</b>` +
        `<small>${stageName(st, row.section)}${known ? ' · ' + progTxt : ''}</small>`);
      cell.onclick = () => select(row.creatureId);
      cell.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(row.creatureId); } };
      grid.appendChild(cell);
    }
    if (!rows.length) {
      grid.innerHTML = '<p class="sub" style="grid-column:1/-1">' +
        (searchQ ? 'No entries match your search.' : 'No entries match this filter.') + '</p>';
    }
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
      box.innerHTML = '<p class="sub">Select an entry.</p>';
      return;
    }
    const prog = progressRow(creatureId);
    const st = entryState(creatureId, catalog);
    const known = st !== 'unknown';
    const cr = combatCreature(catalog);
    const sec = catalog.section || 'bestiary';

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
      const tier = sec === 'bosstiary'
        ? (BOSS_CATEGORY_LABEL[catalog.bossCategory] || catalog.bossCategory || 'Boss')
        : (DIFF_LABEL[catalog.difficulty] || catalog.difficulty);
      const info = sec === 'bosstiary' && G.Bestiary.BOSS_CATEGORY_INFO
        ? G.Bestiary.BOSS_CATEGORY_INFO[catalog.bossCategory] : null;
      const stLabel = stageName(st, sec);
      const boostLine = isDailyBoostEntry(creatureId, sec) && G.DailyBoost
        ? `<div class="sub gold" style="margin-top:6px">` + esc(sec === 'bosstiary'
          ? (G.DailyBoost.bannerBossText && G.DailyBoost.bannerBossText()) || ''
          : (G.DailyBoost.bannerCreatureText && G.DailyBoost.bannerCreatureText()) || '') + '</div>'
        : '';
      head.innerHTML = `<h3>${esc(catalog.displayName || creatureId)}</h3>` +
        `<div class="sub">${SECTION_LABEL[sec] || sec} · ${tier}</div>` + boostLine +
        (info && info.blurb ? `<div class="sub" style="margin-top:6px;max-width:320px">${esc(info.blurb)}</div>` : '') +
        `<div class="sub">${stLabel} · ${prog.kills} kills` +
        (catalog.thresholds ? ` · goal ${catalog.thresholds.final}` : '') +
        (sec === 'bosstiary' && prog.firstVictoryAt
          ? ` · first win ${new Date(prog.firstVictoryAt).toLocaleDateString('en-US')}` : '') + '</div>';
      box.appendChild(head);
    } else {
      box.innerHTML = '<div class="center"><h3>???</h3><p class="sub">Creature not identified yet.</p></div>';
      return;
    }

    const addSection = (title, rows) => {
      if (!rows.length) return;
      const secEl = document.createElement('div');
      secEl.className = 'bestiary-detail-sec';
      secEl.innerHTML = `<h4>${title}</h4>` + rows.map(([k, v]) =>
        `<div class="stat"><span>${esc(k)}</span><span>${v}</span></div>`).join('');
      box.appendChild(secEl);
    };

    const s1 = [];
    if (stageUnlocked(st, 'stage_1')) {
      if (canReveal('stage1', 'description', catalog) && catalog.description) {
        s1.push(['Description', esc(catalog.description)]);
      }
      if (canReveal('stage1', 'occurrence', catalog) && catalog.occurrence) {
        s1.push(['Occurrence', esc(G.Bestiary.occurrenceLabel(catalog.occurrence))]);
      }
      if (canReveal('stage1', 'hp', catalog) && cr) {
        const sp = spawnStats(creatureId);
        s1.push(['Base HP', sp && sp.hp != null ? sp.hp : cr.hp]);
      }
      if (canReveal('stage1', 'xp', catalog)) s1.push(['Experience', 'Based on tier in run']);
      if (canReveal('stage1', 'behavior', catalog) && cr && (cr.primaryBehavior || cr.behavior)) {
        const pat = cr.behaviors && cr.behaviors.length > 1 ? cr.behaviors.join(' + ') : (cr.primaryBehavior || cr.behavior);
        s1.push(['Behavior', pat]);
      }
    }
    addSection('Identification', s1);

    const s2 = [];
    if (stageUnlocked(st, 'stage_2')) {
      if (canReveal('stage2', 'damage', catalog) && cr) s2.push(['Threat', '×' + (cr.attack || 1).toFixed(2)]);
      if (canReveal('stage2', 'speed', catalog) && cr) {
        const sp = spawnStats(creatureId);
        s2.push(['Speed', sp && sp.spd != null ? sp.spd : (cr.speed != null ? cr.speed : '—')]);
      }
      if (canReveal('stage2', 'abilities', catalog) && cr && (cr.primaryBehavior || cr.behavior)) {
        const pat = cr.behaviors && cr.behaviors.length > 1 ? cr.behaviors.join(' + ') : (cr.primaryBehavior || cr.behavior);
        s2.push(['Pattern', pat]);
      }
      if (canReveal('stage2', 'resistances', catalog)) {
        const DT = G.DamageTypes;
        const dmg = cr && cr.damageTypes && cr.damageTypes.length
          ? (DT && DT.names ? DT.names(cr.damageTypes) : cr.damageTypes.join(', ')) : null;
        if (dmg) s2.push(['Damage used', dmg]);
        const fmt = (label, list) => {
          if (!list || !list.length) return null;
          return [label, DT && DT.names ? DT.names(list) : list.join(', ')];
        };
        const w = fmt('Weaknesses', cr && cr.weaknesses);
        const r = fmt('Resistances', cr && cr.resistances);
        const i = fmt('Immunities', cr && cr.immunities);
        if (w) s2.push(w);
        if (r) s2.push(r);
        if (i) s2.push(i);
      }
    }
    addSection('Analysis', s2);

    const s3 = [];
    if (stageUnlocked(st, 'completed')) {
      if (canReveal('stage3', 'drops', catalog)) s3.push(['Run loot', 'Experience (orb on death)']);
      if (canReveal('stage3', 'tips', catalog) && catalog.tipKeys && catalog.tipKeys.length) {
        const tipLines = catalog.tipKeys.map(k =>
          (G.BestiaryTips && G.BestiaryTips.text(k)) || null).filter(Boolean);
        if (tipLines.length) s3.push(['Tip', tipLines.map(t => esc(t)).join(' ')]);
      }
      if (canReveal('stage3', 'statistics', catalog)) {
        s3.push(['Total kills', prog.kills]);
        if (prog.firstSeenAt) s3.push(['First kill', new Date(prog.firstSeenAt).toLocaleDateString('en-US')]);
      }
      if (prog.rewarded) {
        const ptLabel = sec === 'bosstiary' ? 'Boss points earned' : 'Charm points earned';
        s3.push([ptLabel, catalog.rewardPoints]);
      }
      if (sec === 'bosstiary' && prog.firstVictoryAt) {
        s3.push(['First victory', new Date(prog.firstVictoryAt).toLocaleString('en-US')]);
      }
    }
    addSection('Mastery', s3);
  }

  function setTab(next) {
    const prev = tab;
    tab = next;
    if ((prev === 'catalog' && next === 'bosstiary') || (prev === 'bosstiary' && next === 'catalog')) {
      fState = 'all';
      fDiff = 'all';
      fOcc = 'all';
      fBossCat = 'all';
    }
    if (fState === 'progress') fState = 'all';
    const cat = $('bestiary-tab-catalog');
    const shop = $('bestiary-tab-shop');
    const charms = $('bestiary-tab-charms');
    const showCatalog = tab === 'catalog' || tab === 'bosstiary';
    if (cat) cat.classList.toggle('hidden', !showCatalog);
    if (shop) shop.classList.toggle('hidden', tab !== 'shop');
    if (charms) charms.classList.toggle('hidden', tab !== 'charms');
    const tabs = document.querySelectorAll('[data-bestiary-tab]');
    tabs.forEach(btn => btn.classList.toggle('on', btn.getAttribute('data-bestiary-tab') === tab));
    if (tab === 'shop') renderShop();
    else if (tab === 'charms') renderCharms();
    else if (showCatalog) {
      renderFilters();
      renderGrid();
      if (selId) renderDetail(selId);
    }
    renderDailyPanel();
    renderSummary();
  }

  function purchaseFail(reason) {
    if (reason === 'funds') G.UI.toast('Not enough points');
    else if (reason === 'max' || reason === 'owned') G.UI.toast('Already maxed or unlocked');
    else if (reason === 'persist') G.UI.toast('Could not save purchase');
    else G.UI.toast('Purchase unavailable');
  }

  function renderShop() {
    const box = $('bestiary-shop-list');
    if (!box) return;
    box.innerHTML = '';
    const pts = G.Bestiary.getAvailableCharmPoints();
    const hdr = document.createElement('p');
    hdr.className = 'sub';
    hdr.style.margin = '0 0 12px';
    hdr.innerHTML = 'Balance: <b class="gold">' + pts.toLocaleString('en-US') + '</b> points';
    box.appendChild(hdr);

    const mkRow = (icon, title, sub, cost, maxed, onBuy) => {
      const el = document.createElement('div');
      el.className = 'panel upg-item';
      el.innerHTML =
        `<div class="ic">${G.Icons.html(icon, 32)}</div>` +
        `<div><b>${esc(title)}</b> <span style="color:var(--muted);font-size:15px">${esc(sub)}</span></div>` +
        `<div class="upg-btns"><button type="button" class="btn small ${maxed ? '' : 'gold'}" data-buy ${maxed ? 'disabled' : ''}>` +
        (maxed ? 'Complete' : '<span class="gold">' + cost + ' pts</span>') + '</button></div>';
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
        `<div><b>${esc(u.name)}</b> <span style="color:var(--muted);font-size:15px">${esc(u.unit)}</span>` +
        `<div class="pips">${pips}</div></div>` +
        `<div class="upg-btns"><button type="button" class="btn small ${maxed ? '' : 'gold'}" data-buy ${maxed || pts < cost ? 'disabled' : ''}>` +
        (maxed ? 'Max' : cost + ' pts') + '</button></div>';
      const btn = el.querySelector('[data-buy]');
      if (btn && !maxed) {
        btn.onclick = () => {
          const nowLv = G.Bestiary.getUpgradeLevel(u.id);
          const price = G.Bestiary.upgradeCost(u, nowLv);
          if (!confirm('Spend ' + price + ' points on «' + u.name + '» (level ' + (nowLv + 1) + ')?')) return;
          const res = G.Bestiary.purchaseUpgrade(u.id);
          if (res.ok) {
            G.Audio.sfx('buy');
            G.UI.toast(u.name + ' · level ' + res.level);
            renderSummary();
            renderShop();
          } else purchaseFail(res.reason);
        };
      }
      box.appendChild(el);
    }

    if (G.Bestiary.CONTENT_UNLOCKS && G.Bestiary.CONTENT_UNLOCKS.length) {
      const sep = document.createElement('h4');
      sep.textContent = 'Unlocks';
      sep.style.margin = '16px 0 8px';
      box.appendChild(sep);
    }
    for (const u of G.Bestiary.CONTENT_UNLOCKS || []) {
      const owned = G.Bestiary.hasUnlock(u.id);
      mkRow(u.icon, u.name, u.description, u.cost, owned, () => {
        if (G.Bestiary.hasUnlock(u.id)) return;
        if (!confirm('Spend ' + u.cost + ' points on «' + u.name + '»?')) return;
        const res = G.Bestiary.purchaseUnlock(u.id);
        if (res.ok) {
          G.Audio.sfx('buy');
          G.UI.toast(u.name + ' unlocked');
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
    const pts = G.Bestiary.getAvailableCharmPoints();
    const equipped = new Set(G.Bestiary.listEquippedCharms());
    const hdr = document.createElement('p');
    hdr.className = 'sub';
    hdr.style.margin = '0 0 12px';
    hdr.innerHTML = 'Balance: <b class="gold">' + pts.toLocaleString('en-US') + '</b> points · Equipped: <b>' +
      (equipped.size ? [...equipped].map(id => (G.Bestiary.charmById(id) || {}).name || id).join(', ') : 'none') + '</b>';
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
        `<span style="color:var(--muted);font-size:15px;display:block;margin-top:4px">${esc(c.description || '')}</span>` +
        `<small class="sub">${esc(c.trigger)} · cd ${c.cooldownMs} ms · ${esc(G.Bestiary.charmClassLabel(c))}</small></div>` +
        `<div class="upg-btns"></div>`;
      const btns = el.querySelector('.upg-btns');
      if (!unlocked) {
        const buy = document.createElement('button');
        buy.type = 'button';
        buy.className = 'btn small gold';
        buy.textContent = c.cost + ' pts';
        buy.disabled = pts < c.cost;
        buy.onclick = () => {
          if (!confirm('Unlock «' + (c.name || c.id) + '» for ' + c.cost + ' points?')) return;
          const res = G.Bestiary.unlockCharm(c.id);
          if (res.ok) {
            G.Audio.sfx('buy');
            G.UI.toast((c.name || c.id) + ' unlocked');
            renderSummary();
            renderCharms();
          } else purchaseFail(res.reason === 'owned' ? 'owned' : res.reason);
        };
        btns.appendChild(buy);
      } else if (isOn) {
        const off = document.createElement('button');
        off.type = 'button';
        off.className = 'btn small ghost';
        off.textContent = 'Remove';
        off.onclick = () => {
          G.Bestiary.unequipCharm(c.id);
          G.UI.toast('Charm removed');
          renderCharms();
        };
        btns.appendChild(off);
      } else {
        const eq = document.createElement('button');
        eq.type = 'button';
        eq.className = 'btn small gold';
        eq.textContent = 'Equip';
        eq.onclick = () => {
          const res = G.Bestiary.equipCharm(c.id, 0);
          if (res.ok) {
            G.Audio.sfx('select');
            G.UI.toast((c.name || c.id) + ' equipped');
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
    const searchEl = $('bestiary-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        searchQ = String(searchEl.value || '').trim().toLowerCase();
        if (tab === 'catalog' || tab === 'bosstiary') renderGrid();
      });
    }
  }

  function open() {
    openToCreature(selId);
  }

  function openToCreature(creatureId) {
    if (G.DailyBoost && G.DailyBoost.syncSave && G.DB && G.DB.save) G.DailyBoost.syncSave(G.DB.save);
    if (!G.Bestiary || !G.DB.save) return;
    if (creatureId) {
      const row = G.Bestiary.getCatalogEntry(creatureId);
      tab = row && row.section === 'bosstiary' ? 'bosstiary' : 'catalog';
      selId = creatureId;
    }
    const searchEl = $('bestiary-search');
    if (searchEl && searchQ) searchEl.value = searchQ;
    G.UI.show('scr-bestiary', true);
    renderDailyPanel();
    renderSummary();
    setTab(tab);
    if (tab === 'catalog' || tab === 'bosstiary') {
      if (selId) renderDetail(selId);
      else $('bestiary-detail').innerHTML = '<p class="sub">Select a catalog entry.</p>';
    }
  }

  init();
  return { open, openToCreature, init };
})();