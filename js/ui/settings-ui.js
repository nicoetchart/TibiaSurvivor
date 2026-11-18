/* ============ settings-ui.js — pantalla de Ajustes (PC y móvil) ============
 * Se abre por encima de lo que haya (menú o pausa) y al cerrar vuelve ahí.
 * Pestañas: Sonido · Gráficos · Controles · Cuenta · Acerca de.
 * Los ajustes son de este dispositivo (G.Settings / G.Audio en el navegador).
 */
G.SettingsUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VERSION = 'MVP · Phase 5 · 2026-11-17';
  const REPO = 'https://github.com/nicoetchart/TibiaSurvivor';
  let tab = 'sound';

  function init() {
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => { b.onclick = () => { tab = b.dataset.t; render(); }; });
    $('set-close').onclick = close;
    $('btn-settings').innerHTML = G.Icons.html(G.Icons.menuIcon('settings'), 20);
    $('btn-settings').onclick = () => open();
    $('btn-pause-settings').onclick = () => open('sound');
    // Pantalla completa (si el navegador la permite; en iPhone, cómo conseguirla).
    if (canFull() || iosTip()) {
      $('btn-full').classList.remove('hidden');
      $('btn-full').innerHTML = G.Icons.html('full', 20);
      $('btn-full').onclick = toggleFull;
    }
  }

  function open(t) {
    if (t) tab = t;
    $('scr-settings').classList.remove('hidden');
    render();
  }
  function close() { $('scr-settings').classList.add('hidden'); }
  const isOpen = () => !$('scr-settings').classList.contains('hidden');

  // ---------------- pantalla completa ----------------
  function canFull() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  // iPhone: Safari no deja poner una web a pantalla completa (por eso a veces
  // no salía la opción). Sí se puede abriéndola desde la pantalla de inicio.
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => !!navigator.standalone || (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches);
  function iosTip() { return IOS && !canFull() && !standalone(); }
  const IOS_TIP = 'On iPhone, Safari cannot fullscreen websites. Tap Share, then "Add to Home Screen": launch from that icon to play fullscreen.';
  function toggleFull() {
    if (!canFull()) { if (iosTip()) G.UI.toast(IOS_TIP, 9000); return; }
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const el = document.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      // En móvil, además se intenta fijar la pantalla en horizontal.
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* nada */ } }).catch(() => {});
    }
    setTimeout(() => { if (isOpen()) render(); }, 300);
  }

  // ---------------- piezas ----------------
  function section(title, sub) { return `<h3 class="set-h">${esc(title)}</h3>${sub ? `<p class="sub">${sub}</p>` : ''}`; }
  function toggle(key, label, desc) {
    const on = !!G.Settings.get(key);
    return `<div class="set-row"><div class="grow"><b>${esc(label)}</b><small>${esc(desc)}</small></div>
      <button class="btn small switch ${on ? 'gold' : ''}" data-k="${key}">${on ? 'Yes' : 'No'}</button></div>`;
  }
  function choice(key, opts) {
    const cur = G.Settings.get(key);
    return `<div class="chips set-chips">${opts.map(([v, l]) => `<button class="chip ${v === cur ? 'on' : ''}" data-k="${key}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
  }

  function render() {
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const box = $('set-body');
    box.scrollTop = 0;
    if (tab === 'sound') {
      box.innerHTML = section('Sound') + '<div id="set-sound" class="sound-inline"></div>';
      G.UI.soundControls($('set-sound'));
    } else if (tab === 'gfx') {
      const auto = ['low', 'medium', 'high'][G.Settings.autoLevel];
      box.innerHTML = section('Quality', 'How many effects and particles are drawn. <b>Auto</b> lowers quality if the game stutters (now: ' + auto + ').')
        + choice('quality', [['auto', 'Auto'], ['high', 'High'], ['mid', 'Medium'], ['low', 'Low']])
        + section('Display')
        + toggle('dmgNumbers', 'Damage numbers', 'Numbers when you deal or take damage.')
        + toggle('calm', 'Less shake and flashes', 'Camera shakes less and flashes are softer.')
        + toggle('fps', 'Show FPS', 'Frames per second in the bottom corner.')
        + (canFull() ? `<div class="set-row"><div class="grow"><b>Fullscreen</b><small>No browser bars.</small></div>
             <button class="btn small" id="set-full">${isFull() ? 'Exit' : 'Enter'}</button></div>`
           : iosTip() ? `<div class="set-row"><div class="grow"><b>Fullscreen</b><small>${esc(IOS_TIP)}</small></div></div>` : '');
    } else if (tab === 'ctl') {
      box.innerHTML = section('On mobile or tablet')
        + `<p class="sub">Touch anywhere and drag to move: the joystick appears where you touch. Tap a spell below to switch and the top-right button to pause. Play in landscape.</p>`
        + `<div class="set-row"><div class="grow"><b>Joystick size</b><small>How far you drag your finger.</small></div></div>`
        + choice('stick', [[0.8, 'Small'], [1, 'Normal'], [1.25, 'Large']])
        + section('On PC')
        + `<div class="keys">
             <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows</div><span>move</span>
             <div><kbd>1</kbd>–<kbd>4</kbd> or click icon</div><span>pick spell</span>
             <div><kbd>Q</kbd> / <kbd>E</kbd></div><span>previous / next spell</span>
             <div><kbd>Esc</kbd> or <kbd>P</kbd></div><span>pause</span>
             <div><kbd>1</kbd>–<kbd>3</kbd></div><span>pick level-up card</span>
           </div>`;
    } else if (tab === 'acc') {
      renderAccount(box);
    } else {
      box.innerHTML = `<div class="about-logo">TibiaSurvivor</div><p class="sub center">Version ${esc(VERSION)}</p>`
        + `<p class="sub">Pixel-art fantasy survivor · <b>free</b> · saved in this browser · fan project, not affiliated with Tibia or CipSoft.</p>`
        + section('Credits')
        + `<ul class="credits">
             <li><b>Game code:</b> MIT license.</li>
             <li><b>Creatures (fallback):</b> procedural geometric sprites (original code).</li>
             <li><b>Client-style graphics:</b> exported PNG atlases (outfits, creatures, tiles, items, spells, VFX) for fan use; raw client archives are not shipped.</li>
             <li><b>Music and SFX:</b> original audio made for this project.</li>
             <li><b>UI font:</b> Crimson Pro (SIL Open Font License 1.1).</li>
             <li><b>HUD and menu icons:</b> Tibia item/spell sprites where mapped; otherwise procedural pixel icons.</li>
           </ul>`
        + `<div class="row wrap" style="justify-content:center;gap:8px">
             <button class="btn small" data-legal>Legal notice and privacy</button>
             <a class="btn small" href="${REPO}" target="_blank" rel="noopener">Code (GitHub)</a>
           </div>`;
    }
    wire(box);
  }

  function renderAccount(box) {
    const st = G.DB.guest ? 'guest' : G.DB.syncState;
    const SYNC = { local: 'Saved only in this browser', guest: 'Guest: not saved' };
    if (G.DB.guest) {
      box.innerHTML = section('Account', 'You are playing as a <b>guest</b>: your progress is not saved when you leave.')
        + `<button class="btn gold" id="set-login">Create account or sign in</button>`;
      return;
    }
    const nick = G.DB.user || '';
    const kind = G.DB.mode === 'local' ? 'This browser account' : G.DB.nameAccount ? 'Username and password' : 'Google';
    box.innerHTML = section('Account')
      + `<div class="set-row"><div class="grow"><b>Nickname</b><small>Unique and cannot be changed.</small></div><span class="gold" translate="no">${esc(nick)}</span></div>`
      + `<div class="set-row"><div class="grow"><b>Account type</b></div><span>${esc(kind)}</span></div>`
      + `<div class="set-row"><div class="grow"><b>Save data</b></div><span>${esc(SYNC[st] || st)}</span></div>`
      + `<div class="row wrap" style="gap:8px;margin-top:12px">
           <button class="btn" id="set-logout">Sign out</button>
           <button class="btn danger" id="set-delete">Delete account</button>
         </div><p class="note" id="set-msg"></p>`;
  }

  function wire(box) {
    box.querySelectorAll('.switch[data-k]').forEach(b => { b.onclick = () => { G.Settings.set(b.dataset.k, !G.Settings.get(b.dataset.k)); render(); }; });
    box.querySelectorAll('.chip[data-k]').forEach(b => {
      b.onclick = () => { const v = b.dataset.v; G.Settings.set(b.dataset.k, isNaN(+v) ? v : +v); render(); };
    });
    const full = $('set-full'); if (full) full.onclick = toggleFull;
    box.querySelectorAll('[data-lang]').forEach(b => { b.onclick = () => { if (b.dataset.lang !== G.I18n.lang) G.I18n.set(b.dataset.lang); }; });
    const lo = $('set-login'); if (lo) lo.onclick = () => { close(); leave(); };
    const out = $('set-logout'); if (out) out.onclick = () => { close(); leave(); };
    const del = $('set-delete');
    if (del) del.onclick = async () => {
      const ok = await G.UI.confirmDelete();
      if (!ok) return;
      del.disabled = true;
      const r = await G.DB.deleteAccount(ok.pass);
      if (!r.ok) { $('set-msg').textContent = r.error; del.disabled = false; return; }
      close();
      G.UI.toast('Account deleted');
      G.Audio.music(null);
      G.Flow.toLogin();
    };
  }

  /** Cerrar sesión (si estás en una partida, se abandona). */
  function leave() {
    if (G.DB.guest && !confirm('You are a guest: all progress will be lost. Sign out?')) return;
    if (G.Game.state !== 'ui') G.Game.quit && G.Game.quit();
    G.Audio.music(null);
    G.DB.logout().then(() => G.Flow.toLogin());
  }

  return { init, open, close, get isOpen() { return isOpen(); } };
})();
