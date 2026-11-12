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

  /** Query o G.TIBIA_SPRITE_TUNING.useTibiaSprites; si no, data-ui=tibia. */
  function resolveEnabled() {
    if (typeof location !== 'undefined') {
      if (/[?&]sprites=geo\b/.test(location.search)) return false;
      if (/[?&]sprites=(off|pokemon)\b/.test(location.search)) return false;
      if (/[?&]sprites=tibia\b/.test(location.search)) return true;
    }
    const tun = G.TIBIA_SPRITE_TUNING;
    if (tun && tun.useTibiaSprites === false) return false;
    if (tun && tun.useTibiaSprites === true) return true;
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
    const base = m && m[dex] ? Object.assign({}, m[dex]) : null;
    if (!base) return null;
    if (dex === 99001 && base.kind === 'outfit' && G.TibiaOutfits) {
      const live = G.TibiaOutfits.fromSave();
      base.outfit = Object.assign({}, base.outfit, live);
    }
    return base;
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

  function assetIdFromEntry(entry) {
    if (!entry) return null;
    if (entry.kind === 'lookType') return String(entry.lookType);
    if (entry.kind === 'outfit') return String(entry.outfit.type);
    return null;
  }

  function assetSubdir(entry) {
    return entry && entry.kind === 'outfit' ? 'outfits' : 'creatures';
  }

  /** lookType u outfit.type (tuning byLookType). */
  function lookTypeFromDex(dex) {
    const e = entryForDex(dex);
    if (!e) return null;
    if (e.kind === 'lookType') return e.lookType;
    if (e.kind === 'outfit') return e.outfit.type;
    return null;
  }

  function assetIdFromKey(key) {
    if (!key) return null;
    if (key.startsWith('lt_')) return key.slice(3);
    if (key.startsWith('out_')) return key.slice(4);
    return null;
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

  function sheetSrc(assetId, stripKind, subdir) {
    const k = stripKind === 'idle' ? '-idle' : '-walk';
    return `assets/tibia/${subdir}/${assetId}${k}.png`;
  }

  function kindSuffix(stripKind) {
    return stripKind === 'idle' ? ':idle' : ':walk';
  }

  function getSheet(assetId, stripKind, subdir = 'creatures') {
    const cacheKey = subdir + ':' + assetId + kindSuffix(stripKind);
    let s = sheets.get(cacheKey);
    if (s) { s.at = Date.now(); return s; }
    if (sheets.size >= MAX_SHEETS) {
      const old = [...sheets].sort((a, b) => a[1].at - b[1].at)[0];
      if (old) sheets.delete(old[0]);
    }
    const src = sheetSrc(assetId, stripKind, subdir);
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

  function frameMetaForEntry(entry, anim) {
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
    const aid = assetIdFromKey(key);
    const sub = ext && ext.kind === 'outfit' ? 'outfits' : 'creatures';
    const s = aid ? getSheet(aid, 'walk', sub) : null;
    if (s && (s.ready || !s.failed)) return DEFAULT_ANIM[anim] || DEFAULT_ANIM.Idle;
    return null;
  }

  function frameMetaForDex(dex, anim) {
    const entry = entryForDex(dex);
    if (!entry) return null;
    return frameMetaForEntry(entry, anim);
  }

  function metaForEntry(entry) {
    const key = creatureKey(entry);
    return key && G.TIBIA_CREATURES_META ? G.TIBIA_CREATURES_META[key] : null;
  }

  function hasOutfitAssets(type) {
    const m = metaForEntry({ kind: 'outfit', outfit: { type: type | 0 } });
    return !!(m && m.composite);
  }

  function preloadOutfitTypes(types) {
    if (!enabled) return Promise.resolve();
    const ids = (types || []).map(t => String(t | 0));
    const jobs = [];
    for (const id of ids) {
      if (!hasOutfitAssets(id)) continue;
      for (const kind of ['idle', 'walk']) {
        jobs.push(new Promise(resolve => {
          const s = getSheet(id, kind, 'outfits');
          if (!s) return resolve();
          if (s.ready) return resolve();
          if (s.failed) return resolve();
          const done = () => resolve();
          s.img.addEventListener('load', done, { once: true });
          s.img.addEventListener('error', done, { once: true });
        }));
      }
    }
    return Promise.all(jobs);
  }

  /**
   * Escala del Animator / drawOutfitLook para que el sprite llene el canvas.
   * Incluye drawMul y resolveTuning (p. ej. scaleMul 0.8) como drawCreatureFrame.
   */
  function outfitUiConfig() {
    const T = tuningRoot();
    const u = T.outfitUi && typeof T.outfitUi === 'object' ? T.outfitUi : {};
    return {
      scaleMul: u.scaleMul != null ? u.scaleMul : 1,
      pivotTx: u.pivotTx != null ? u.pivotTx : 35,
      pivotTy: u.pivotTy != null ? u.pivotTy : 40,
      heightFill: u.heightFill != null ? u.heightFill : 0.9
    };
  }

  function outfitTuningForDraw(animM, forUi) {
    const tun = resolveTuning(99001, animM);
    if (!forUi) return tun;
    const ui = outfitUiConfig();
    return Object.assign({}, tun, { scaleMul: ui.scaleMul });
  }

  function outfitPixelScale(scale, animM, forUi) {
    const tun = outfitTuningForDraw(animM, forUi);
    return PX() * (scale || 1) * baseDrawMul(99001, animM) * tun.scaleMul;
  }

  function outfitVisualBounds(look, anim, frame, dir8) {
    const entry = { kind: 'outfit', outfit: Object.assign({}, look) };
    const animM = frameMetaForEntry(entry, anim || 'Idle');
    const assetId = assetIdFromEntry(entry);
    if (!animM || !assetId || !G.TibiaOutfitDraw || !G.TibiaOutfitDraw.measureFrame) return null;
    const stripKind = animM.stripKind || (anim === 'Idle' ? 'idle' : 'walk');
    const s = getSheet(assetId, stripKind, 'outfits');
    if (!s || !s.ready) return null;
    const ext = metaForEntry(entry);
    if (!ext || !ext.layout) return null;
    const colDir = tibiaDir(dir8 != null ? dir8 : 0);
    const fr = Math.min(frame != null ? frame : 0, (animM.n || 1) - 1);
    const colors = Object.assign({}, look, { type: look.type | 0 });
    return G.TibiaOutfitDraw.measureFrame(s.img, ext.layout, animM.w, animM.h, fr, colDir, colors);
  }

  function outfitFitScale(canvasW, canvasH, look, anim, margin, heightFill, forUi, visW, visH) {
    const entry = { kind: 'outfit', outfit: Object.assign({}, look) };
    const animM = frameMetaForEntry(entry, anim || 'Idle');
    if (!animM) return 1;
    const ui = forUi ? outfitUiConfig() : null;
    const tun = outfitTuningForDraw(animM, forUi);
    const drawMul = baseDrawMul(99001, animM);
    const fill = heightFill != null ? heightFill : (ui ? ui.heightFill : 0.82);
    const targetH = canvasH * fill;
    const targetW = canvasW * fill;
    const tileW = forUi && visW ? visW : animM.w;
    const tileH = forUi && visH ? visH : animM.h;
    const denom = Math.max(1, tileH) * PX() * drawMul * tun.scaleMul;
    const denomW = Math.max(1, tileW) * PX() * drawMul * tun.scaleMul;
    const scale = Math.min(targetH / denom, targetW / denomW);
    return Math.max(0.35, scale);
  }

  /**
   * Punto ancla: vista juego = pies en (x,y). UI = centro de silueta opaca en el canvas.
   */
  function outfitBoxPlacement(canvasW, canvasH, look, anim, heightFill, centerYRatio, forUi, dir8, frame) {
    const entry = { kind: 'outfit', outfit: Object.assign({}, look) };
    const animM = frameMetaForEntry(entry, anim || 'Idle');
    if (!animM) return { scale: 1, x: canvasW / 2, y: canvasH / 2 };
    const ui = forUi ? outfitUiConfig() : null;
    const tun = outfitTuningForDraw(animM, forUi);
    let vis = forUi ? outfitVisualBounds(look, anim, frame, dir8) : null;
    const scale = outfitFitScale(
      canvasW, canvasH, look, anim, 0, heightFill, forUi,
      vis && vis.w, vis && vis.h);
    const k = outfitPixelScale(scale, animM, forUi);
    const ax = animM.ax + tun.footDx;
    const ay = animM.ay + tun.footDy;
    const cx = canvasW / 2;
    const cy = canvasH * (centerYRatio != null ? centerYRatio : 0.52);
    if (forUi) {
      const vcx = vis ? vis.cx : ui.pivotTx;
      const vcy = vis ? vis.cy : ui.pivotTy;
      const x = cx + (ax - vcx) * k;
      const y = cy + (ay - vcy) * k;
      return { scale, x, y };
    }
    const drawW = animM.w * k;
    const drawH = animM.h * k;
    const x = cx - drawW / 2 + ax * k;
    const y = cy - drawH / 2 + ay * k;
    return { scale, x, y };
  }

  /** @deprecated UI usa outfitBoxPlacement */
  function outfitFootPoint(canvasW, canvasH, margin) {
    return { x: canvasW / 2, y: canvasH * (1 - (margin != null ? margin : 0.04)) };
  }

  function drawOutfitFitted(ctx, canvasW, canvasH, look, anim, frame, dir8, margin, heightFill, opts) {
    const pl = outfitBoxPlacement(canvasW, canvasH, look, anim, heightFill, 0.52);
    return drawOutfitLook(ctx, look, pl.x, pl.y, pl.scale, anim, frame, dir8, opts);
  }

  function drawOutfitLook(ctx, look, x, y, scale, anim, frame, dir8, opts = {}) {
    const entry = { kind: 'outfit', outfit: Object.assign({}, look) };
    const animM = frameMetaForEntry(entry, anim);
    const assetId = assetIdFromEntry(entry);
    if (!animM || !assetId) return false;
    const stripKind = animM.stripKind || (anim === 'Idle' ? 'idle' : 'walk');
    const s = getSheet(assetId, stripKind, 'outfits');
    if (!s || !s.ready) return false;
    const extFull = metaForEntry(entry);
    const colDir = tibiaDir(dir8);
    const fr = Math.min(frame, animM.n - 1);
    const tun = outfitTuningForDraw(animM, !!opts.outfitUi);
    const drawMul = (extFull && extFull.drawMul != null) ? extFull.drawMul : baseDrawMul(99001, animM);
    const k = PX() * (scale || 1) * drawMul * tun.scaleMul;
    const ax = animM.ax + tun.footDx;
    const ay = animM.ay + tun.footDy;
    const dx = Math.round(x - ax * k);
    const dy = Math.round(y - ay * k);
    const alpha = opts.alpha == null ? 1 : opts.alpha;
    if (alpha <= 0) return true;
    if (extFull && extFull.composite && extFull.layout && entry.outfit && G.TibiaOutfitDraw) {
      return G.TibiaOutfitDraw.drawFrame(
        ctx, s.img, extFull.layout, animM.w, animM.h, fr, colDir, entry.outfit,
        dx, dy, animM.w * k, animM.h * k, alpha
      );
    }
    let idx = stripIndex(animM, colDir, fr);
    const slots = Math.max(1, Math.floor(s.img.width / animM.w));
    idx = Math.min(idx, slots - 1);
    const prev = ctx.globalAlpha;
    if (alpha < 1) ctx.globalAlpha = prev * alpha;
    ctx.drawImage(s.img, idx * animM.w, 0, animM.w, animM.h, dx, dy, animM.w * k, animM.h * k);
    ctx.globalAlpha = prev;
    return true;
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
    const assetId = assetIdFromEntry(entry);
    if (!animM || !assetId) return false;
    const stripKind = animM.stripKind || (anim === 'Idle' || anim === 'Hurt' || anim === 'Faint' ? 'idle' : 'walk');
    const s = getSheet(assetId, stripKind, assetSubdir(entry));
    if (!s || !s.ready) return false;

    const extFull = creatureMeta(dex);
    const colDir = tibiaDir(dir8);
    const fr = Math.min(frame, animM.n - 1);
    const tun = dex === 99001 && opts.outfitUi
      ? outfitTuningForDraw(animM, true)
      : resolveTuning(dex, animM);
    const k = PX() * (scale || 1) * baseDrawMul(dex, animM) * tun.scaleMul;
    const ax = animM.ax + tun.footDx;
    const ay = animM.ay + tun.footDy;
    const dx = Math.round(x - ax * k);
    const dy = Math.round(y - ay * k);
    const alpha = opts.alpha == null ? 1 : opts.alpha;
    if (alpha <= 0) return true;

    if (extFull && extFull.composite && extFull.layout && entry.outfit && G.TibiaOutfitDraw) {
      return G.TibiaOutfitDraw.drawFrame(
        ctx, s.img, extFull.layout, animM.w, animM.h, fr, colDir, entry.outfit,
        dx, dy, animM.w * k, animM.h * k, alpha
      );
    }

    let idx = stripIndex(animM, colDir, fr);
    const slots = Math.max(1, Math.floor(s.img.width / animM.w));
    idx = Math.min(idx, slots - 1);
    const sx = idx * animM.w;
    const sy = 0;
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
  const itemPngs = new Map();

  function getItemPng(spriteId) {
    const id = String(spriteId);
    let s = itemPngs.get(id);
    if (!s) {
      const img = new Image();
      s = { img, ready: false, failed: false };
      itemPngs.set(id, s);
      img.onload = () => { s.ready = true; };
      img.onerror = () => { s.failed = true; };
      img.src = 'assets/tibia/items/' + id + '.png';
    }
    return s;
  }

  function itemPngReady(spriteId) {
    const s = itemPngs.get(String(spriteId));
    return !!(s && s.ready);
  }

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
    const ref = typeof key === 'number'
      ? (map[key] || { spriteId: key })
      : map[key];
    if (!ref) return false;

    if (ref.spriteId != null) {
      const sheet = getItemPng(ref.spriteId);
      if (!sheet.ready) return false;
      const img = sheet.img;
      let w, h;
      if (opts.native) {
        const px = PX();
        w = img.width * px;
        h = img.height * px;
      } else {
        const base = Math.max(img.width, img.height) || 32;
        const k = size / base;
        w = img.width * k;
        h = img.height * k;
      }
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, img.width, img.height, x - w / 2, y - h / 2, w, h);
      ctx.imageSmoothingEnabled = prev;
      return true;
    }

    const rect = (G.TIBIA_ITEMS_META && G.TIBIA_ITEMS_META[ref.clientId]) || null;
    const atlas = itemAtlas();
    if (!rect || !atlas.ready) return false;
    const k = size / 32;
    ctx.drawImage(atlas.img, rect.x, rect.y, 32, 32, x - size / 2, y - size / 2, 32 * k, 32 * k);
    return true;
  }

  function preloadItems(keys, timeout = 6000) {
    const map = MAP().items || {};
    const loads = [];
    for (const key of keys) {
      const ref = map[key];
      if (ref && ref.spriteId != null) loads.push(getItemPng(ref.spriteId));
      else if (ref && ref.clientId != null) itemAtlas();
    }
    return new Promise(res => {
      const t0 = performance.now();
      (function tick() {
        const ready = loads.every(s => !s || s.ready || s.failed);
        if (ready || performance.now() - t0 > timeout) res();
        else setTimeout(tick, 40);
      })();
    });
  }

  function preloadDexes(dexes, timeout = 6000) {
    const loads = [];
    for (const d of dexes) {
      const entry = entryForDex(d);
      const aid = assetIdFromEntry(entry);
      if (!aid) continue;
      const sub = assetSubdir(entry);
      loads.push(getSheet(aid, 'idle', sub), getSheet(aid, 'walk', sub));
    }
    const itemLoads = preloadItems(['health_potion', 'heal_pickup', 'gold_coin'], timeout);
    return Promise.all([itemLoads, new Promise(res => {
      const t0 = performance.now();
      (function tick() {
        const ready = loads.every(s => !s || s.ready || s.failed);
        if (ready || performance.now() - t0 > timeout) res();
        else setTimeout(tick, 40);
      })();
    })]);
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
    hasOutfitAssets,
    preloadOutfitTypes,
    outfitFitScale,
    outfitBoxPlacement,
    outfitFootPoint,
    drawOutfitFitted,
    drawOutfitLook,
    drawCreatureFrame,
    drawItem,
    preloadItems,
    preloadDexes,
    exportTuning,
    tibiaDir,
    /** Compat: misma firma que antes. */
    drawMul(tileH, dex) { return effectiveDrawMul(dex, { h: tileH }); }
  };
})();
