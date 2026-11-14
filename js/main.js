/* ============ main.js — arranque ============ */
(() => {
  // Si un archivo no llega a cargarse (conexión móvil que se corta), mejor
  // avisar que arrancar a medias.
  const NEED = ['U', 'I18n', 'Settings', 'DB', 'Audio', 'Input', 'Touch', 'Sprites', 'GeoSprites', 'Camera', 'DamageTypes', 'MvpConfig', 'Bestiary', 'Content', 'ContentBridge',
                'Moves', 'Abilities', 'Vocations', 'Enemies', 'NeutralRoster', 'Upgrades', 'Items',
                'World', 'FX', 'Projectiles', 'EnemyMgr', 'Pickups', 'Player', 'Combat', 'Spawner', 'LevelUp', 'Gacha',
                'Rift', 'Weather', 'Progress', 'Hazards', 'Icons', 'UI', 'HUD',
                'MenuUI', 'BestiaryUI', 'BestiaryRunUI', 'BestiaryCharms', 'BestiaryTelemetry', 'VocationUI', 'RunUI', 'SettingsUI', 'Game', 'Flow'];
  function broken() {
    // (En la versión publicada G no está en window: va encerrado, ver tools/build.js.)
    const miss = NEED.filter(k => typeof G !== 'object' || !G[k]);
    if (!miss.length) return false;
    const el = document.getElementById('boot');
    el.innerHTML = 'No se pudo cargar todo el juego (¿se cortó la conexión?).<br><button class="btn gold" style="margin-top:12px" onclick="location.reload()">Recargar</button>';
    console.warn('[Arranque] faltan:', miss.join(', '));
    return true;
  }

  // Mantenimiento (mudanza a servidores nuevos): no se entra ni se inicia
  // sesión, así no se escribe nada mientras se copian las cuentas y partidas.
  // Para probar en local: añade ?dev a la dirección.
  const MAINTENANCE = false;
  /** file:// bloquea fuentes, localStorage y CORS; el MVP Tibia necesita http(s) local. */
  function needsHttpServer() {
    if (location.protocol !== 'file:') return false;
    const en = !/^es/i.test(navigator.language || '');
    const el = document.getElementById('boot');
    if (!el) return true;
    el.setAttribute('translate', 'no');
    el.classList.remove('hidden');
    el.innerHTML = '<div class="boot-in"><h1>TibiaSurvivor</h1>' + (en
      ? '<p><b>Open the game through a local web server.</b></p><p>With <code>file://</code> the browser blocks fonts, saves, and Tibia PNG assets.</p><p style="font-family:monospace;font-size:13px;text-align:left;max-width:26rem;margin:12px auto">npx.cmd --yes http-server -p 8080 -c-1</p><p>Then open <b>http://127.0.0.1:8080/dev.html?dev</b></p>'
      : '<p><b>Abre el juego con un servidor local.</b></p><p>Con <code>file://</code> el navegador bloquea fuentes, el guardado y los PNG Tibia.</p><p style="font-family:monospace;font-size:13px;text-align:left;max-width:26rem;margin:12px auto">npx.cmd --yes http-server -p 8080 -c-1</p><p>Luego abre <b>http://127.0.0.1:8080/dev.html?dev</b></p>') + '</div>';
    console.warn('[Arranque] Usa http://127.0.0.1 — file:// no sirve para desarrollo TibiaSurvivor.');
    return true;
  }

  function maintenance() {
    if (!MAINTENANCE || /[?&]dev\b/.test(location.search)) return false;
    const en = typeof G === 'object' && G.I18n ? G.I18n.lang === 'en' : !/^es/i.test(navigator.language || '');
    const el = document.getElementById('boot');
    el.setAttribute('translate', 'no');
    el.innerHTML = '<div class="boot-in"><h1>TibiaSurvivor</h1>' + (en
      ? '<p><b>We are under maintenance.</b></p><p>Please come back in a few hours.</p>'
      : '<p><b>Estamos en mantenimiento.</b></p><p>Vuelve en unas horas.</p>') +
      '<button class="btn gold" style="margin-top:12px" onclick="location.reload()">' + (en ? 'Try again' : 'Volver a intentarlo') + '</button></div>';
    return true;
  }

  function boot() {
    if (needsHttpServer()) return;
    if (maintenance()) return;
    if (broken()) return;
    G.I18n.startDom();
    // Espera a la fuente pixel para que la UI no salte al cargarla.
    const tibiaUi = document.documentElement.getAttribute('data-ui') === 'tibia';
    const fontProbe = '18px "Crimson Pro"';
    const ready = document.fonts && document.fonts.load ? document.fonts.load(fontProbe) : Promise.resolve();
    ready.catch(() => {}).then(() => G.Flow.boot());
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  // Instalable como app (PWA). Sólo con http(s): abierto con doble clic (file://) no hace falta.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('[PWA]', e.message)));
  }
})();
