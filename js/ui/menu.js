/* ============ menu.js — menú principal (MVP Tibia) ============ */
G.MenuUI = (() => {
  const $ = G.UI.$;

  function init() {
    document.querySelectorAll('#scr-menu [data-go]').forEach(b => {
      const go = b.dataset.go;
      b.insertAdjacentHTML('afterbegin', `<span class="mi-ico">${G.Icons.html(G.Icons.menuIcon(go), 26)}</span>`);
      b.dataset.sfx = b.dataset.go === 'play' ? 'confirm' : 'click';
      b.onclick = () => {
        const go = b.dataset.go;
        if (go === 'play') G.Flow.play();
        else if (go === 'bestiary') G.BestiaryUI.open();
        else if (go === 'outfit') G.OutfitUI && G.OutfitUI.open();
        else if (go === 'goals') G.GoalsUI.open();
        else if (go === 'settings') G.SettingsUI.open();
      };
    });
    document.querySelectorAll('[data-back]').forEach(b => { b.onclick = open; });
    $('btn-logout').onclick = () => {
      if (G.DB.guest && !confirm('You are a guest: all progress will be lost. Sign out?')) return;
      G.Audio.music(null);
      G.DB.logout().then(() => G.Flow.toLogin());
    };
  }

  // ---------------- menú principal ----------------

  function open() {
    const s = G.DB.save;
    const neutral = G.Content.mode === 'neutral';
    document.querySelectorAll('#scr-menu [data-go="bestiary"], #scr-menu [data-go="outfit"]').forEach(b => {
      b.classList.toggle('hidden', !neutral);
    });
    let mon = s.partner != null ? G.Content.runtimeByLegacyId(s.partner) : null;
    if (!mon && s.partner != null && G.Content.getCreature) {
      const cr = G.Content.getCreature(s.partner);
      if (cr) mon = G.Content.toRuntimeMon(cr);
    }
    if (!mon) {
      if (neutral) {
        const voc = s.selectedVocation || 'master_sorcerer';
        const id = G.Content.playerLegacyIdForVocation(voc);
        s.partner = id;
        s.selectedVocation = voc;
        s.partnerShiny = false;
        G.DB.grant(id, 'repair');
        G.DB.commit();
        mon = G.Content.runtimeByLegacyId(id);
      }
      if (!mon) {
        G.VocationUI.start();
        return;
      }
    }
    G.UI.chrome(true);
    G.UI.show('scr-menu');
    G.UI.sprite($('menu-partner'), mon.dex, { lively: true, scale: 4, hero: true, shiny: false });
    const chip = (mon.types && mon.types[0]) ? G.U.TYPE_COLOR[mon.types[0]] : '#b48aff';
    $('menu-partner').style.setProperty('--stage-c', chip);
    $('menu-partner').classList.remove('shiny');
    $('menu-partner-name').textContent = mon.name;
    $('menu-partner-info').innerHTML = neutral
      ? (() => {
          const v = G.Content.getVocation('master_sorcerer');
          const bi = G.MvpConfig && G.MvpConfig.RUN_BIOME != null ? G.MvpConfig.RUN_BIOME : 3;
          const zone = (G.Tiles && G.Tiles.BIOMES[bi]) ? G.Tiles.BIOMES[bi].name : 'Plains of Havoc';
          return (v ? v.name : 'Vocation') + ' · ' + zone;
        })()
      : G.UI.typeChips(mon.types) + ' ' + G.UI.stars(mon.rarity);
    const st = s.stats;
    $('menu-stats').innerHTML = neutral
      ? `Runs <b style="color:#fff">${st.runs}</b> · Wins <b style="color:#fff">${st.wins || 0}</b><br>` +
        `Best time <b style="color:#fff">${G.U.mmss(st.bestTime)}</b> · Best level <b style="color:#fff">${st.bestLevel}</b><br>` +
        `Total kills <b style="color:#fff">${st.totalKills.toLocaleString('en-US')}</b>`
      : `Runs <b style="color:#fff">${st.runs}</b> · Best time <b style="color:#fff">${G.U.mmss(st.bestTime)}</b><br>` +
        `Best level <b style="color:#fff">${st.bestLevel}</b> · Kills <b style="color:#fff">${st.totalKills.toLocaleString('en-US')}</b>` +
        (G.DB.guest ? '<br><span style="color:#ffb0b8">Guest mode: not saved</span>' : '');

    // Premios de misiones por recoger.
    G.Progress.checkAch();
    const pend = G.Progress.pending();
    $('menu-goals-sub').textContent = pend ? pend + (pend === 1 ? ' reward to claim' : ' rewards to claim') : 'Missions, achievements and profile';
    $('menu-goals-sub').classList.toggle('gold', pend > 0);

    const bSub = $('menu-bestiary-sub');
    if (bSub && G.Bestiary && neutral) {
      const list = G.Bestiary.listEntries();
      let disc = 0;
      let done = 0;
      for (const row of list) {
        const prog = G.Bestiary.getProgressEntry(row.creatureId);
        const kills = prog ? prog.kills : 0;
        const had = kills > 0 || (prog && prog.firstSeenAt);
        const st = G.Bestiary.deriveStage(kills, row.thresholds, had);
        if (st !== 'unknown') disc++;
        if (st === 'completed') done++;
      }
      bSub.textContent = `${disc}/${list.length} discovered · ${done} complete`;
    }
  }

  return { init, open };
})();