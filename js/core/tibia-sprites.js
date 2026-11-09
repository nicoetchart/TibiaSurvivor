/* ============ tibia-sprites.js — dibujo desde atlas Tibia (PNG exportados) ============
 * Ajuste global: js/data/tibia-sprite-tuning.js (?dev: Ctrl+[ ] , . ; ')
 */
G.TibiaSprites = (() => {
  const PX = () => (G.Sprites ? G.Sprites.PX : 2);
  const MAP = () => G.TIBIA_SPRITE_MAP || { creatures: {}, items: {} };
  const LS_TUNING = 'ts.tibiaSpriteTuning';

  function isTibiaUi() {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-ui') === 'tibia';
  }

  /** Por defecto ON en TibiaSurvivor (data-ui=tibia). ?sprites=geo desactiva; ?sprites=tibia fuerza ON. */
  function resolveEnabled() {
    if (typeof location !== 'undefined') {
      if (/[?&]sprites=geo\b/.test(location.search)) return false;
      if (/[?&]sprites=(off|pokemon)\b/.test(location.search)) return false;
      if (/[?&]sprites=tibia\b/.test(location.search)) return true;
    }
    return isTibiaUi();
  }

  function queryDev() {
    return typeof location !== 'undefined' && /[?&]dev\b/.test(location.search);
  }

  let enabled = resolveEnabled();
  let livePatch = null;

  function enable(on = true) { enabled = !!on; }

  function entryForDex(dex) {
    const m = MAP().creatures;
    return m && m[dex] ? m[dex] : null;
  }

  function creatureKey(entry) {
    if (!entry) return null;
    if (entry.kind === 'lookType') return 'lt_' + entry.lookType;
    if (entry.kind === 'outfit') return 'out_' + entry.outfit.type;
    return null;
  }

  function hasCreature(dex) {
    if (!enabled) return false;
    return !!entryForDex(dex);
  }

  function lookTypeFromDex(dex) {
    const e = entryForDex(dex);
    return e && e.kind === 'lookType' ? e.lookType : null;
  }

  function lookTypeFromKey(key) {
    return key && key.startsWith('lt_') ? key.slice(3) : null;
  }

  /** Base del tuning file + parche dev (localStorage) + override en memoria. */
  function tuningRoot() {
    const base = Object.assign({}, G.TIBIA_SPRITE_TUNING || {});
    if (livePatch) Object.assign(base, livePatch);
    if (queryDev() && typeof localStorage !== 'undefined') {
      try {
        const j = JSON.parse(localStorage.getItem(LS_TUNING) || 'null');
        if (j && typeof j === 'object') Object.assign(base, j);
      } catch { /* ignore */ }
    }
    return base;
  }

  function persistLive(T) {
    if (!queryDev() || typeof localStorage === 'undefined') return;
    localStorage.setItem(LS_TUNING, JSON.stringify(T));
  }

  /**
   * @returns {{ scaleMul, footDx, footDy, shadowRxMul }}
   */
  function naturalSize(T) {
    return !T || T.naturalSize !== false;
  }

  function resolveTuning(dex, animM) {
    const T = tuningRoot();
    const large = animM && animM.h >= 48;
    const lt = lookTypeFromDex(dex);
    let scaleMul = T.scaleMul != null ? T.scaleMul : 1;

    if (!naturalSize(T)) {
      const tierName = lt != null && T.lookTypeTier ? T.lookTypeTier[lt] : null;
      const tier = tierName && T.visualTiers ? T.visualTiers[tierName] : null;
      if (tier && animM && animM.h) {
        if (tier.targetTileH != null) scaleMul *= tier.targetTileH / animM.h;
        if (tier.scaleMul != null) scaleMul *= tier.scaleMul;
      }
      if (large && T.scaleMul64 != null) scaleMul *= T.scaleMul64;
      else if (!large && T.scaleMul32 != null) scaleMul *= T.scaleMul32;
    }

    let footDx = T.footDx != null ? T.footDx : 0;
    let footDy = T.footDy != null ? T.footDy : 0;
    if (!naturalSize(T)) {
      if (large) {
        if (T.footDx64 != null) footDx += T.footDx64;
        if (T.footDy64 != null) footDy += T.footDy64;
      } else {
        if (T.footDx32 != null) footDx += T.footDx32;
        if (T.footDy32 != null) footDy += T.footDy32;
      }
    }
  const by = lt != null && T.byLookType ? T.byLookType[lt] : null;
    if (by) {
      if (by.scaleMul != null) scaleMul *= by.scaleMul;
      if (by.footDx != null) footDx += by.footDx;
      if (by.footDy != null) footDy += by.footDy;
    }
    return {
      scaleMul,
      footDx,
      footDy,
      shadowRxMul: T.shadowRxMul != null ? T.shadowRxMul : 1
    };
  }

  function baseDrawMul(dex, animM) {
    if (animM && animM.drawMul != null) return animM.drawMul;
    const key = creatureKey(entryForDex(dex));
    const ext = key && G.TIBIA_CREATURES_META && G.TIBIA_CREATURES_META[key];
    if (ext && ext.drawMul != null) return ext.drawMul;
    return 1;
  }

  function effectiveDrawMul(dex, animM) {
    const tun = resolveTuning(dex, animM);
    return baseDrawMul(dex, animM) * tun.scaleMul;
  }

  const sheets = new Map();
  const MAX_SHEETS = 200;

  function sheetSrc(lookType, stripKind) {
    const k = stripKind === 'idle' ? '-idle' : '-walk';
    return `assets/tibia/creatures/${lookType}${k}.png`;
  }

  function kindSuffix(stripKind) {
    return stripKind === 'idle' ? ':idle' : ':walk';
  }

  function getSheet(lookType, stripKind) {
    const cacheKey = lookType + kindSuffix(stripKind);
    let s = sheets.get(cacheKey);
    if (s) { s.at = Date.now(); return s; }
    if (sheets.size >= MAX_SHEETS) {
      const old = [...sheets].sort((a, b) => a[1].at - b[1].at)[0];
      if (old) sheets.delete(old[0]);
    }
    const src = sheetSrc(lookType, stripKind);
    s = { ready: false, failed: false, img: new Image(), at: Date.now(), src };
    s.img.onload = () => { s.ready = true; };
    s.img.onerror = () => { s.failed = true; };
    s.img.src = src;
    sheets.set(cacheKey, s);
    return s;
  }

  const DEFAULT_ANIM = {
    Idle:  { n: 1, d: [40], w: 32, h: 32, ax: 16, ay: 31, r: 4, stripKind: 'idle' },
    Walk:  { n: 3, d: [6, 6, 6], w: 32, h: 32, ax: 16, ay: 31, r: 4, stripKind: 'walk' }
  };

  function frameMetaForDex(dex, anim) {
    const entry = entryForDex(dex);
    if (!entry) return null;
    const key = creatureKey(entry);
    const ext = G.TIBIA_CREATURES_META && key && G.TIBIA_CREATURES_META[key];
    let animM = null;
    if (ext && ext.a && ext.a[anim]) {
      animM = Object.assign({ strip: true, pw: ext.pw, drawMul: ext.drawMul }, ext.a[anim]);
    } else if (ext && ext.a && ext.a.Walk && (anim === 'Attack' || anim === 'Shoot' || anim === 'Charge')) {
      animM = Object.assign({ strip: true, pw: ext.pw, drawMul: ext.drawMul }, ext.a.Walk, { n: ext.a[anim]?.n || 2 });
    }
    if (animM) return animM;
    const lt = lookTypeFromKey(key);
    const s = lt ? getSheet(lt, 'walk') : null;
    if (s && (s.ready || !s.failed)) return DEFAULT_ANIM[anim] || DEFAULT_ANIM.Idle;
    return null;
  }

  function tibiaDir(dir8) {
    const q = Math.floor((((dir8 % 8) + 8) % 8) / 2);
    return [2, 1, 0, 3][q];
  }

  function stripIndex(animM, dir4, frame) {
    const pw = animM.pw || 4;
    const fr = Math.min(frame, (animM.n || 1) - 1);
    return dir4 + pw * fr;
  }

  function drawCreatureFrame(ctx, dex, x, y, scale, anim, frame, dir8, opts = {}) {
    const entry = entryForDex(dex);
    const key = creatureKey(entry);
    const animM = frameMetaForDex(dex, anim);
    const lookType = lookTypeFromKey(key);
    if (!animM || !lookType) return false;
    const stripKind = animM.stripKind || (anim === 'Idle' || anim === 'Hurt' || anim === 'Faint' ? 'idle' : 'walk');
    const s = getSheet(lookType, stripKind);
    if (!s || !s.ready) return false;

    const tun = resolveTuning(dex, animM);
    const k = PX() * (scale || 1) * baseDrawMul(dex, animM) * tun.scaleMul;
    const ax = animM.ax + tun.footDx;
    const ay = animM.ay + tun.footDy;

    const colDir = tibiaDir(dir8);
    const fr = Math.min(frame, animM.n - 1);
    let idx = stripIndex(animM, colDir, fr);
    const slots = Math.max(1, Math.floor(s.img.width / animM.w));
    idx = Math.min(idx, slots - 1);
    const sx = idx * animM.w;
    const sy = 0;
    const dx = Math.round(x - ax * k);
    const dy = Math.round(y - ay * k);

    const alpha = opts.alpha == null ? 1 : opts.alpha;
    if (alpha <= 0) return true;
    const prev = ctx.globalAlpha;
    if (alpha < 1) ctx.globalAlpha = prev * alpha;
    ctx.drawImage(s.img, sx, sy, animM.w, animM.h, dx, dy, animM.w * k, animM.h * k);
    ctx.globalAlpha = prev;
    return true;
  }

  function creatureMeta(dex) {
    const key = creatureKey(entryForDex(dex));
    return key && G.TIBIA_CREATURES_META ? G.TIBIA_CREATURES_META[key] : null;
  }

  function shadowRadius(dex, scale = 1) {
    const m = frameMetaForDex(dex, 'Idle');
    if (!m) return 12 * PX() * scale;
    const tun = resolveTuning(dex, m);
    const ext = creatureMeta(dex);
  if (naturalSize(tuningRoot()) && ext && ext.s != null) {
      return [5, 8, 12][G.U.clamp(ext.s, 0, 2)] * PX() * scale * tun.shadowRxMul;
    }
    const k = PX() * scale * effectiveDrawMul(dex, m);
    return G.U.clamp(m.w * 0.36, 5, 28) * k * tun.shadowRxMul;
  }

  let itemsAtlas = null;

  function itemAtlas() {
    if (itemsAtlas) return itemsAtlas;
    const img = new Image();
    itemsAtlas = { img, ready: false, failed: false };
    img.onload = () => { itemsAtlas.ready = true; };
    img.onerror = () => { itemsAtlas.failed = true; };
    img.src = 'assets/tibia/items-32.png';
    return itemsAtlas;
  }

  function drawItem(ctx, key, x, y, size, opts = {}) {
    if (!enabled) return false;
    const map = MAP().items || {};
    const ref = typeof key === 'number' ? { clientId: key } : map[key];
    if (!ref) return false;
    const rect = (G.TIBIA_ITEMS_META && G.TIBIA_ITEMS_META[ref.clientId]) || null;
    const atlas = itemAtlas();
    if (!rect || !atlas.ready) return false;
    const k = size / 32;
    ctx.drawImage(atlas.img, rect.x, rect.y, 32, 32, x - size / 2, y - size / 2, 32 * k, 32 * k);
    return true;
  }

  function preloadDexes(dexes, timeout = 6000) {
    const loads = [];
    for (const d of dexes) {
      const entry = entryForDex(d);
      const lt = lookTypeFromKey(creatureKey(entry));
      if (!lt) continue;
      loads.push(getSheet(lt, 'idle'), getSheet(lt, 'walk'));
    }
    itemAtlas();
    return new Promise(res => {
      const t0 = performance.now();
      (function tick() {
        const ready = loads.every(s => !s || s.ready || s.failed);
        if (ready || performance.now() - t0 > timeout) res();
        else setTimeout(tick, 40);
      })();
    });
  }

  function bump(field, delta) {
    const T = tuningRoot();
    T[field] = (T[field] != null ? T[field] : (field === 'scaleMul' ? 1 : 0)) + delta;
    const store = Object.assign({}, G.TIBIA_SPRITE_TUNING || {}, T);
    delete store.byLookType;
    persistLive(store);
    const msg = `Tibia tuning: ${field}=${typeof T[field] === 'number' ? T[field].toFixed(3) : T[field]}`;
    if (G.UI && G.UI.toast) G.UI.toast(msg, 2.5);
    else console.log(msg);
  }

  function exportTuning() {
    const T = tuningRoot();
    console.log('Copia a js/data/tibia-sprite-tuning.js:\n', JSON.stringify(T, null, 2));
    return T;
  }

  function tuningField(kind, e) {
    const tier = e.shiftKey ? '32' : (e.altKey ? '64' : '');
    if (kind === 'scale') return tier ? `scaleMul${tier}` : 'scaleMul';
    if (kind === 'footDy') return tier ? `footDy${tier}` : 'footDy';
    if (kind === 'footDx') return tier ? `footDx${tier}` : 'footDx';
    return kind;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', e => {
      if (!enabled || !queryDev() || !e.ctrlKey) return;
      if (e.key === '[') { e.preventDefault(); bump(tuningField('scale', e), -0.03); }
      else if (e.key === ']') { e.preventDefault(); bump(tuningField('scale', e), 0.03); }
      else if (e.key === ',') { e.preventDefault(); bump(tuningField('footDx', e), -0.5); }
      else if (e.key === '.') { e.preventDefault(); bump(tuningField('footDx', e), 0.5); }
      else if (e.key === ';') { e.preventDefault(); bump(tuningField('footDy', e), -0.5); }
      else if (e.key === '\'') { e.preventDefault(); bump(tuningField('footDy', e), 0.5); }
      else if (e.key === '\\') { e.preventDefault(); exportTuning(); }
    });
  }

  return {
    get enabled() { return enabled; },
    enable,
    PX,
    tuningRoot,
    resolveTuning,
    baseDrawMul,
    effectiveDrawMul,
    shadowRadius,
    entryForDex,
    hasCreature,
    frameMetaForDex,
    drawCreatureFrame,
    drawItem,
    preloadDexes,
    exportTuning,
    tibiaDir,
    /** Compat: misma firma que antes. */
    drawMul(tileH, dex) { return effectiveDrawMul(dex, { h: tileH }); }
  };
})();
