/* ============ goals-ui.js — misiones, logros y perfil ============
 * Una pantalla con tres pestañas:
 *   Misiones  3 diarias + 2 semanales, con barra, premio y botón de recoger
 *   Logros    medallas por categoría; los legendarios, uno a uno con su sprite
 *   Perfil    tus 3 favoritos y tu título; vista previa del perfil público
 * y la ventana del perfil público de cualquier jugador (G.ProfileUI.show).
 */
(() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = t => (t >= 3600 ? Math.floor(t / 3600) + ':' + G.U.mmss(t % 3600).padStart(5, '0') : G.U.mmss(t));

  function favSpriteId(f) {
    if (!f) return null;
    if (f.legacyId != null) return f.legacyId;
    if (f.dex != null) return f.dex;
    if (f.creatureId && G.CREATURE_BY_ID && G.CREATURE_BY_ID[f.creatureId]) return G.CREATURE_BY_ID[f.creatureId].legacyId;
    return null;
  }

  function favName(f) {
    if (!f) return '';
    if (f.creatureId && G.Bestiary) {
      const row = G.Bestiary.getCatalogEntry(f.creatureId);
      if (row && row.name) return row.name;
    }
    const legacy = favSpriteId(f);
    if (legacy != null && G.Content) return G.Content.creatureName(legacy) || '';
    return '';
  }

  function discoveredCreatures() {
    if (!G.Bestiary) return [];
    const out = [];
    for (const row of G.Bestiary.listEntries()) {
      const p = G.Bestiary.getProgressEntry(row.creatureId);
      const seen = p && (p.kills > 0 || p.firstSeenAt);
      if (!seen) continue;
      const cr = G.CREATURE_BY_ID[row.creatureId];
      out.push({
        creatureId: row.creatureId,
        legacyId: cr && cr.legacyId,
        name: row.name
      });
    }
    return out;
  }

  function cyclopediaStats() {
    const list = G.Bestiary ? G.Bestiary.listEntries() : [];
    let disc = 0;
    let complete = 0;
    for (const row of list) {
      const p = G.Bestiary.getProgressEntry(row.creatureId);
      const seen = p && (p.kills > 0 || p.firstSeenAt);
      if (seen) disc++;
      const st = G.Bestiary.deriveStage(p ? p.kills : 0, row.thresholds, seen);
      if (st === 'completed') complete++;
    }
    return { discovered: disc, total: list.length, complete };
  }

  function localProfileData() {
    const s = G.DB.save;
    if (!s) return null;
    const neutral = G.Content && G.Content.mode === 'neutral';
    const achIds = Object.keys(s.ach || {});
    const d = {
      name: s.name || G.DB.user || 'Player',
      title: (s.profile && s.profile.title) || '',
      favs: (s.profile && s.profile.favs) || [],
      best: {
        solo: s.stats.bestTime,
        group: s.stats.bestGroupTime || 0,
        level: s.stats.bestLevel,
        bosses: s.stats.bossesTotal || 0,
        kills: s.stats.totalKills || 0,
        legends: neutral ? 0 : Object.keys(s.legends || {}).length
      },
      medals: achIds.length,
      medalIds: achIds
    };
    if (neutral) d.cyclopedia = cyclopediaStats();
    return d;
  }

  // ======================= PANTALLA =======================

  G.GoalsUI = (() => {
    let tab = 'missions', cat = 'coleccion';

    function init() {
      document.querySelectorAll('#goals-tabs .tab').forEach(t => {
        t.onclick = () => { tab = t.dataset.tab; render(); };
      });
    }

    function open(t) {
      if (t) tab = t;
      G.UI.show('scr-goals', true);
      G.Progress.ensure(G.DB.save);
      G.Progress.checkAch();
      render();
    }

    function render() {
      document.querySelectorAll('#goals-tabs .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
      const box = $('goals-body');
      box.innerHTML = '';
      if (tab === 'missions') missions(box);
      else if (tab === 'ach') achievements(box);
      else profile(box);
    }

    // ---------------- misiones ----------------

    function untilText(kind) {
      const now = new Date();
      // Medianoche (diarias) o lunes (semanales), hora de España aproximada por la del navegador.
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      if (kind === 'w') { const add = (8 - (now.getDay() || 7)) % 7; end.setDate(end.getDate() + add); }
      const mins = Math.max(1, Math.round((end - now) / 60000));
      return mins >= 1440 ? Math.floor(mins / 1440) + 'd ' + Math.floor(mins % 1440 / 60) + 'h'
                          : Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
    }

    function missions(box) {
      const M = G.DB.save.missions;
      const section = (title, list, weekly) => {
        box.insertAdjacentHTML('beforeend', `<div class="row between goals-h"><h3>${title}</h3>
          <span class="sub">Refresh in ${untilText(weekly ? 'w' : 'd')}</span></div>`);
        list.forEach((m, i) => {
          const d = G.MissionDefs.BY[m.id];
          const done = G.Progress.done(m);
          const el = document.createElement('div');
          el.className = 'mission' + (m.claimed ? ' claimed' : done ? ' ready' : '');
          const pct = Math.min(100, m.prog / m.goal * 100);
          el.innerHTML = `
            <div class="m-txt"><b>${esc(G.Progress.text(m))}</b>
              <div class="bar"><i style="width:${pct}%"></i></div>
              <small>${Math.min(m.prog, m.goal).toLocaleString('en-US')} / ${m.goal.toLocaleString('en-US')}</small></div>
            <div class="m-rw">${G.Progress.rewardText(d.reward)}</div>`;
          const btn = document.createElement('button');
          if (m.claimed) { btn.className = 'btn small'; btn.disabled = true; btn.textContent = 'Claimed'; }
          else if (done) {
            btn.className = 'btn small gold'; btn.textContent = 'Claim'; btn.dataset.sfx = 'none';
            btn.onclick = () => { if (G.Progress.claim(m, weekly)) { G.Audio.sfx('buy'); G.UI.toast('Reward claimed!'); render(); } };
          } else if (!weekly && !M.rerolled) {
            btn.className = 'btn small ghost'; btn.textContent = 'Reroll';
            btn.title = 'Replace this mission with another (once per day)';
            btn.onclick = () => { if (G.Progress.reroll(i)) render(); };
          } else { btn.className = 'btn small ghost'; btn.disabled = true; btn.textContent = 'In progress'; }
          el.appendChild(btn);
          box.appendChild(el);
        });
      };
      section('Daily', M.daily, false);
      section('Weekly', M.weekly, true);
    }

    // ---------------- logros ----------------

    function achievements(box) {
      const s = G.DB.save;
      const neutral = G.Content && G.Content.mode === 'neutral';
      const all = G.AchDefs.LIST;
      const got = all.filter(a => s.ach && s.ach[a.id]).length;
      const chips = document.createElement('div');
      chips.className = 'filters';
      for (const [k, label] of G.AchDefs.CATS) {
        const list = all.filter(a => a.cat === k);
        const n = list.filter(a => s.ach && s.ach[a.id]).length;
        const b = document.createElement('button');
        b.className = 'chip' + (k === cat ? ' on' : '');
        b.textContent = `${label} ${n}/${list.length}`;
        b.onclick = () => { cat = k; render(); };
        chips.appendChild(b);
      }
      box.insertAdjacentHTML('beforeend', `<p class="sub">${got} of ${all.length} achievements · titles: ${G.Progress.titles().length}</p>`);
      box.appendChild(chips);

      const list = all.filter(a => a.cat === cat && !a.dex);
      const grid = document.createElement('div');
      grid.className = 'ach-grid';
      for (const a of list) grid.appendChild(achCard(a, s));
      box.appendChild(grid);

    }

    function achCard(a, s) {
      const ok = !!(s.ach && s.ach[a.id]);
      const v = Math.min(a.goal, a.value(s));
      const el = document.createElement('div');
      el.className = 'ach' + (ok ? ' ok' : '');
      el.innerHTML = `${G.Icons.html(ok ? 'medal' + a.tier : 'medalOff', 36)}
        <div class="a-txt"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>
          ${ok ? '' : `<div class="bar"><i style="width:${v / a.goal * 100}%"></i></div>`}
          <div class="a-rw">${ok ? 'Unlocked!' : v.toLocaleString('en-US') + ' / ' + a.goal.toLocaleString('en-US')} · ${G.Progress.rewardText(a.reward)}
          ${a.title ? ` · <span class="gold">Title: ${esc(a.title)}</span>` : ''}</div></div>`;
      return el;
    }

    // ---------------- perfil (editar) ----------------

    function profile(box) {
      const s = G.DB.save;
      const neutral = G.Content && G.Content.mode === 'neutral';
      s.profile = s.profile || { favs: [], title: '' };
      const P = s.profile;
      box.insertAdjacentHTML('beforeend', `<p class="sub">Preview of your local profile (this browser only).</p>`);
      if (neutral) {
        const st = s.stats || {};
        const cy = cyclopediaStats();
        box.insertAdjacentHTML('beforeend', `<div class="stats" style="margin:10px 0">
          <div><span>Runs</span><b>${st.runs || 0}</b></div>
          <div><span>Wins</span><b>${st.wins || 0}</b></div>
          <div><span>Best time</span><b>${G.U.mmss(st.bestTime || 0)}</b></div>
          <div><span>Best level</span><b>${st.bestLevel || 0}</b></div>
          <div><span>Kills</span><b>${(st.totalKills || 0).toLocaleString('en-US')}</b></div>
          <div><span>Coins earned</span><b>${(st.coinsEarned || 0).toLocaleString('en-US')}</b></div>
          <div><span>Cyclopedia</span><b>${cy.discovered} / ${cy.total} · ${cy.complete} complete</b></div>
        </div>`);
        box.insertAdjacentHTML('beforeend', `<h3>Three favorite creatures</h3>
          <p class="note">Pick from creatures you have discovered in the Bestiary.</p>`);
        const favs = document.createElement('div');
        favs.className = 'fav-slots';
        for (let i = 0; i < 3; i++) {
          const f = P.favs[i];
          const slot = document.createElement('div');
          slot.className = 'fav-slot';
          const sid = favSpriteId(f);
          const nm = favName(f);
          if (sid != null && nm) {
            slot.appendChild(G.UI.spriteCanvas(sid, 120, 100, { scale: 2, lively: true }));
            slot.insertAdjacentHTML('beforeend', `<b>${esc(nm)}</b>`);
          } else slot.innerHTML = '<span>Choose</span>';
          slot.onclick = () => pickFav(i);
          favs.appendChild(slot);
        }
        box.appendChild(favs);
      } else {
        box.insertAdjacentHTML('beforeend', '<p class="note">Profile favorites require neutral Tibia mode.</p>');
      }

      const titles = G.Progress.titles();
      box.insertAdjacentHTML('beforeend', `<h3 style="margin-top:14px">Title</h3>`);
      const sel = document.createElement('select');
      sel.className = 'field';
      sel.style.maxWidth = '320px';
      sel.innerHTML = `<option value="">(no title)</option>` + titles.map(t => `<option ${t === P.title ? 'selected' : ''}>${esc(t)}</option>`).join('');
      sel.onchange = () => { P.title = sel.value; save(); };
      box.appendChild(sel);
      if (!titles.length) box.insertAdjacentHTML('beforeend', '<p class="note">Unlock achievements to earn titles.</p>');
    }

    function pickFav(i) {
      const s = G.DB.save;
      const neutral = G.Content && G.Content.mode === 'neutral';
      const box = $('goals-body');
      if (neutral) {
        box.innerHTML = `<div class="row between"><h3>Pick favorite ${i + 1}</h3>
          <button class="btn small ghost" id="fav-back">Back</button></div>
          <input class="field" id="fav-q" placeholder="Search by name" style="max-width:320px;margin:6px 0 10px">
          <div class="grid" id="fav-grid"></div>`;
        $('fav-back').onclick = () => { tab = 'profile'; render(); };
        const fill = q => {
          const g = $('fav-grid');
          g.innerHTML = '';
          let pool = discoveredCreatures();
          if (q) pool = pool.filter(c => c.name.toLowerCase().includes(q));
          for (const c of pool.slice(0, 96)) {
            if (c.legacyId == null) continue;
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.appendChild(G.UI.spriteCanvas(c.legacyId, 92, 80, { scale: 2 }));
            cell.insertAdjacentHTML('beforeend', `<b>${esc(c.name)}</b>`);
            cell.onclick = () => {
              s.profile.favs = (s.profile.favs || []).slice();
              s.profile.favs[i] = { creatureId: c.creatureId, legacyId: c.legacyId };
              s.profile.favs = s.profile.favs.filter(Boolean).slice(0, 3);
              save(); tab = 'profile'; render();
            };
            g.appendChild(cell);
          }
          if (!g.children.length) g.innerHTML = '<p class="note">Discover creatures in the Bestiary first.</p>';
        };
        $('fav-q').oninput = () => fill($('fav-q').value.trim().toLowerCase());
        fill('');
        return;
      }
      tab = 'profile';
      render();
    }

    function save() {
      G.DB.commit();
      G.Audio.sfx('confirm');
    }

    return { init, open, render };
  })();

  // ======================= PERFIL PÚBLICO =======================

  G.ProfileUI = (() => {
    function init() {
      $('prof-close').onclick = close;
      $('scr-profile').onclick = e => { if (e.target.id === 'scr-profile') close(); };
    }
    function close() { $('scr-profile').classList.add('hidden'); }

    async function show(uid) {
      if (uid) { G.UI.toast('Other players\' profiles are not available offline.'); return; }
      const d = localProfileData();
      if (!d) return;
      showData(d);
      $('scr-profile').classList.remove('hidden');
    }

    function showData(d) {
      const b = d.best || {};
      const neutral = G.Content && G.Content.mode === 'neutral';
      const body = $('prof-body');
      const cycLine = d.cyclopedia
        ? `<div><span>Cyclopedia</span><b>${d.cyclopedia.discovered} / ${d.cyclopedia.total}</b></div>`
        : (neutral ? '' : `<div><span>Legendaries</span><b>${b.legends || 0}</b></div>`);
      body.innerHTML = `
        <div class="prof-head"><h2 translate="no">${esc(d.name || '???')}</h2>${d.title ? `<span class="prof-title">${esc(d.title)}</span>` : ''}</div>
        <div class="fav-slots view" id="prof-favs"></div>
        <div class="prof-marks">
          <div><span>Best time</span><b>${fmt(b.solo || 0)}</b></div>
          <div><span>In group</span><b>${fmt(b.group || 0)}</b></div>
          <div><span>Best level</span><b>${b.level || 0}</b></div>
          <div><span>Bosses</span><b>${(b.bosses || 0).toLocaleString('en-US')}</b></div>
          ${cycLine}
          <div><span>Kills</span><b>${(b.kills || 0).toLocaleString('en-US')}</b></div>
        </div>
        <h3>Medals <span class="sub">${d.medals || 0}</span></h3>
        <div class="prof-medals" id="prof-medals"></div>`;
      const favs = $('prof-favs');
      for (const f of (d.favs || []).slice(0, 3)) {
        const sid = favSpriteId(f);
        const nm = favName(f);
        if (sid == null || !nm) continue;
        const slot = document.createElement('div');
        slot.className = 'fav-slot';
        slot.appendChild(G.UI.spriteCanvas(sid, 120, 100, { scale: 2, lively: true, shiny: !!f.shiny }));
        slot.insertAdjacentHTML('beforeend', `<b>${f.shiny ? G.Icons.html('shiny', 12) + ' ' : ''}${esc(nm)}</b>`);
        favs.appendChild(slot);
      }
      if (!favs.children.length) favs.innerHTML = '<p class="sub">No favorites yet.</p>';
      const med = $('prof-medals');
      const medalIds = d.medalIds || d.medals || [];
      for (const id of medalIds) {
        const a = G.AchDefs.BY[id];
        if (!a) continue;
        const m = document.createElement('div');
        m.className = 'pm';
        m.title = a.name;
        if (a.dex) m.appendChild(G.UI.spriteCanvas(a.dex, 48, 40, { scale: 1 }));
        else m.innerHTML = G.Icons.html('medal' + a.tier, 36);
        m.insertAdjacentHTML('beforeend', `<small>${esc(a.name)}</small>`);
        med.appendChild(m);
      }
      if (!med.children.length) med.innerHTML = '<p class="sub">No medals yet.</p>';
      $('scr-profile').classList.remove('hidden');
    }

    return { init, show, showData };
  })();
})();
