/* ============ creature-dev-editor.js — editor visual de criaturas (?dev) ============ */
G.CreatureDevEditor = (() => {
  const $ = G.UI.$;
  const PREVIEW_SCALE = 2;
  const PREVIEW_W = 256;
  const PREVIEW_H = 232;
  /** Columna strip Tibia 0–3 (pares 8-dir comparten arte). */
  const DIR4_COLS = [
    { col: 0, label: 'N', pair: 'NE' },
    { col: 1, label: 'W', pair: 'NW' },
    { col: 2, label: 'S', pair: 'SW' },
    { col: 3, label: 'E', pair: 'SE' }
  ];
  const GAME_BEHAVIORS = [
    'chase', 'runner', 'jumper', 'ranged', 'fan', 'beamer', 'zoner',
    'healer', 'summoner', 'bomber', 'tank', 'thief', 'charger', 'shielder'
  ];

  let creatureId = null;
  let animBucket = 'Idle';
  let syncAnimBuckets = false;
  let previewCol4 = 2;
  let previewFrame = 0;
  let previewRaf = 0;
  let previewLast = 0;
  let walkPhase = false;
  let pickFootOnCanvas = false;
  /** @type {{ cv: HTMLCanvasElement, anim: string, startCx: number, startCy: number, baseFootDx: number, baseFootDy: number, k: number, pointerId: number } | null} */
  let spriteDrag = null;
  let root = null;

  function dir8ForPreview() {
    return [4, 2, 0, 6][previewCol4];
  }

  function previewFootXY(cv) {
    return { x: cv.width / 2, y: cv.height * 0.62 };
  }

  const LEGACY_DIR_TO_COL = { '4': 0, '5': 0, '2': 1, '3': 1, '0': 2, '1': 2, '6': 3, '7': 3 };

  function devOn() {
    return G.CreatureDevOverrides && G.CreatureDevOverrides.devOn();
  }

  function creatures() {
    return (G.CREATURES || []).filter(c => c && c.role === 'enemy' && c.legacyId != null)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  function lookTypeForCreature(c) {
    if (!c || !G.TibiaSprites) return null;
    return G.TibiaSprites.lookTypeFromDex(c.legacyId);
  }

  function currentCreature() {
    return creatureId && G.CREATURE_BY_ID ? G.CREATURE_BY_ID[creatureId] : null;
  }

  function emptyBucket() {
    return { scaleMul: 1, footDx: 0, footDy: 0, dir: Object.create(null) };
  }

  function defaultSpritePatch() {
    return { scaleMul: 1, footDx: 0, footDy: 0, shadowRxMul: 1, shadowS: null, Idle: emptyBucket(), Walk: emptyBucket() };
  }

  function bucketUsesPerDirFoot(b) {
    return !!(b && b.dir && Object.keys(b.dir).length);
  }

  function footForDirInBucket(b, col4) {
    if (!b) return { footDx: 0, footDy: 0 };
    const key = String(col4);
    let d = b.dir && b.dir[key];
    if (!d && b.dir) {
      for (const lk of Object.keys(b.dir)) {
        if (LEGACY_DIR_TO_COL[lk] === col4) { d = b.dir[lk]; break; }
      }
    }
    if (d && (d.footDx != null || d.footDy != null)) {
      return { footDx: d.footDx != null ? d.footDx : 0, footDy: d.footDy != null ? d.footDy : 0 };
    }
    if (bucketUsesPerDirFoot(b)) return { footDx: 0, footDy: 0 };
    return { footDx: b.footDx != null ? b.footDx : 0, footDy: b.footDy != null ? b.footDy : 0 };
  }

  function activeAnimBuckets() {
    return syncAnimBuckets ? ['Idle', 'Walk'] : [animBucket];
  }

  function readSpriteUi() {
    const lt = lookTypeForCreature(currentCreature());
    if (lt == null || !G.TibiaSprites) return defaultSpritePatch();
    const by = G.TibiaSprites.getByLookType(lt);
    const out = defaultSpritePatch();
    if (by.scaleMul != null) out.scaleMul = by.scaleMul;
    if (by.footDx != null) out.footDx = by.footDx;
    if (by.footDy != null) out.footDy = by.footDy;
    if (by.shadowRxMul != null) out.shadowRxMul = by.shadowRxMul;
    if (by.shadowS != null) out.shadowS = by.shadowS;
    for (const bucket of ['Idle', 'Walk']) {
      if (by[bucket]) {
        out[bucket] = Object.assign({}, out[bucket], by[bucket]);
        if (by[bucket].dir) {
          out[bucket].dir = Object.create(null);
          for (const k of Object.keys(by[bucket].dir)) {
            out[bucket].dir[k] = Object.assign({}, by[bucket].dir[k]);
          }
        }
      }
    }
    if (out.shadowS == null) {
      const c = currentCreature();
      out.shadowS = c ? G.TibiaSprites.defaultShadowS(c.legacyId) : 1;
    }
    return out;
  }

  function cleanBucket(b) {
    if (!b) return null;
    const out = {};
    if (b.scaleMul != null && b.scaleMul !== 1) out.scaleMul = b.scaleMul;
    const perDir = bucketUsesPerDirFoot(b);
    if (!perDir) {
      if (b.footDx) out.footDx = b.footDx;
      if (b.footDy) out.footDy = b.footDy;
    }
    if (b.dir) {
      const dir = Object.create(null);
      for (const k of Object.keys(b.dir)) {
        const d = b.dir[k];
        if (!d) continue;
        const part = {};
        if (d.footDx) part.footDx = d.footDx;
        if (d.footDy) part.footDy = d.footDy;
        if (d.scaleMul != null && d.scaleMul !== 1) part.scaleMul = d.scaleMul;
        if (Object.keys(part).length) dir[k] = part;
      }
      if (Object.keys(dir).length) out.dir = dir;
    }
    return Object.keys(out).length ? out : null;
  }

  function cleanSpritePatch(ui, legacyId) {
    const patch = {};
    if (ui.scaleMul !== 1) patch.scaleMul = ui.scaleMul;
    if (ui.footDx) patch.footDx = ui.footDx;
    if (ui.footDy) patch.footDy = ui.footDy;
    if (ui.shadowRxMul !== 1) patch.shadowRxMul = ui.shadowRxMul;
    const ext = G.TibiaSprites.defaultShadowS(legacyId);
    if (ui.shadowS != null && Math.round(ui.shadowS) !== ext) patch.shadowS = Math.round(ui.shadowS);
    for (const bucket of ['Idle', 'Walk']) {
      const cleaned = cleanBucket(ui[bucket]);
      if (cleaned) patch[bucket] = cleaned;
    }
    return patch;
  }

  function writeSpriteFromUi(ui) {
    const c = currentCreature();
    const lt = lookTypeForCreature(c);
    if (lt == null || !G.TibiaSprites) return;
    const patch = cleanSpritePatch(ui, c.legacyId);
    if (!Object.keys(patch).length) G.TibiaSprites.clearByLookType(lt);
    else G.TibiaSprites.setByLookType(lt, patch);
    paintPreviews();
  }

  function stopPreviewLoop() {
    if (previewRaf) cancelAnimationFrame(previewRaf);
    previewRaf = 0;
    previewLast = 0;
  }

  function drawAxisGuides(ctx, ox, oy, w, h) {
    const px = G.Sprites ? G.Sprites.PX : 2;
    const unit = px * PREVIEW_SCALE;
    ctx.strokeStyle = 'rgba(255,95,95,.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(oy) + 0.5);
    ctx.lineTo(w, Math.round(oy) + 0.5);
    ctx.moveTo(Math.round(ox) + 0.5, 0);
    ctx.lineTo(Math.round(ox) + 0.5, h);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,190,120,.85)';
    ctx.font = '10px monospace';
    ctx.fillText('Y↓', ox + 5, 11);
    ctx.fillText('X→', w - 22, oy - 5);
    const maxT = Math.ceil(Math.max(ox, w - ox, oy, h - oy) / unit);
    for (let t = -maxT; t <= maxT; t++) {
      if (t === 0) continue;
      const x = ox + t * unit;
      if (x > 6 && x < w - 6) {
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath();
        ctx.moveTo(x, oy - 4);
        ctx.lineTo(x, oy + 4);
        ctx.stroke();
        ctx.fillStyle = 'rgba(170,195,255,.8)';
        ctx.fillText(String(t), x + (t > 0 ? -4 : -10), oy + 13);
      }
      const y = oy + t * unit;
      if (y > 12 && y < h - 3) {
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath();
        ctx.moveTo(ox - 4, y);
        ctx.lineTo(ox + 4, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(170,195,255,.8)';
        ctx.fillText(String(t), ox + 6, y + 3);
      }
    }
    ctx.fillStyle = 'rgba(100,255,150,.9)';
    ctx.fillText('0', ox + 5, oy + 13);
  }

  function paintCanvas(cv, anim) {
    if (!cv || !G.TibiaSprites || !G.Sprites) return;
    const c = currentCreature();
    if (!c) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1d26';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const footX = w / 2;
    const footY = h * 0.62;
    if (pickFootOnCanvas) {
      ctx.fillStyle = 'rgba(255,210,80,.12)';
      ctx.fillRect(0, 0, w, h);
    }
    drawAxisGuides(ctx, footX, footY, w, h);
    ctx.strokeStyle = 'rgba(120,200,255,.55)';
    ctx.beginPath();
    ctx.moveTo(footX - 14, footY); ctx.lineTo(footX + 14, footY);
    ctx.moveTo(footX, footY - 10); ctx.lineTo(footX, footY + 4);
    ctx.stroke();
    G.Sprites.drawShadow(ctx, c.legacyId, footX, footY, PREVIEW_SCALE);
    const meta = G.TibiaSprites.frameMetaForDex(c.legacyId, anim);
    const frMax = meta && meta.n ? meta.n : 1;
    const fr = Math.min(previewFrame, frMax - 1);
    G.TibiaSprites.drawCreatureFrame(ctx, c.legacyId, footX, footY, PREVIEW_SCALE, anim, fr, dir8ForPreview());
    const d4 = DIR4_COLS[previewCol4];
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '11px monospace';
    ctx.fillText(`${anim} · f${fr} · ${d4.label}/${d4.pair} col${previewCol4}`, 6, 14);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.ellipse(footX, footY, 10, 4, 0, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,230,255,.7)';
    ctx.stroke();
  }

  function canvasPointerPos(cv, e) {
    const rect = cv.getBoundingClientRect();
    const scaleX = cv.width / rect.width;
    const scaleY = cv.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY, scaleX };
  }

  function previewPlacement(cv, anim) {
    const c = currentCreature();
    if (!c || !G.TibiaSprites.creatureDrawPlacement) return null;
    const foot = previewFootXY(cv);
    const meta = G.TibiaSprites.frameMetaForDex(c.legacyId, anim);
    const frMax = meta && meta.n ? meta.n : 1;
    const fr = Math.min(previewFrame, frMax - 1);
    const pl = G.TibiaSprites.creatureDrawPlacement(
      c.legacyId, foot.x, foot.y, PREVIEW_SCALE, anim, fr, dir8ForPreview());
    if (!pl || pl.k < 1e-6) return null;
    return { pl, meta, fr };
  }

  function hitTestSprite(cv, anim, cx, cy) {
    const pack = previewPlacement(cv, anim);
    if (!pack) return false;
    const { pl, meta } = pack;
    const dw = meta.w * pl.k;
    const dh = meta.h * pl.k;
    return cx >= pl.dx && cx <= pl.dx + dw && cy >= pl.dy && cy <= pl.dy + dh;
  }

  function commitFootForAnim(anim, footDx, footDy) {
    const ui = readSpriteUi();
    const colKey = String(previewCol4);
    const entry = (Math.abs(footDx) > 1e-4 || Math.abs(footDy) > 1e-4)
      ? { footDx, footDy } : null;
    const buckets = syncAnimBuckets ? ['Idle', 'Walk'] : [anim];
    for (const name of buckets) {
      const prev = ui[name] || emptyBucket();
      const b = Object.assign({}, prev);
      if (!b.dir) b.dir = Object.create(null);
      b.dir = Object.assign({}, b.dir);
      if (entry) b.dir[colKey] = entry;
      else delete b.dir[colKey];
      for (const lk of Object.keys(b.dir)) {
        if (LEGACY_DIR_TO_COL[lk] === previewCol4 && lk !== colKey) delete b.dir[lk];
      }
      if (bucketUsesPerDirFoot(b)) {
        delete b.footDx;
        delete b.footDy;
      }
      ui[name] = b;
    }
    writeSpriteFromUi(ui);
  }

  function updateFootSlidersFromDrag(footDx, footDy) {
    setSlider('cdev-foot-dx', footDx, v => v.toFixed(1));
    setSlider('cdev-foot-dy', footDy, v => v.toFixed(1));
  }

  function onSpriteDragStart(cv, anim, e) {
    if (!pickFootOnCanvas || spriteDrag) return;
    const pos = canvasPointerPos(cv, e);
    if (!hitTestSprite(cv, anim, pos.x, pos.y)) return;
    const pack = previewPlacement(cv, anim);
    if (!pack) return;
    const bucket = syncAnimBuckets
      ? (readSpriteUi().Idle || emptyBucket())
      : (readSpriteUi()[anim] || emptyBucket());
    const foot = footForDirInBucket(bucket, previewCol4);
    spriteDrag = {
      cv, anim,
      startCx: pos.x, startCy: pos.y,
      baseFootDx: foot.footDx,
      baseFootDy: foot.footDy,
      k: pack.pl.k,
      pointerId: e.pointerId
    };
    try { cv.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    cv.classList.add('cdev-dragging');
    e.preventDefault();
  }

  function onSpriteDragMove(e) {
    if (!spriteDrag || e.pointerId !== spriteDrag.pointerId) return;
    const pos = canvasPointerPos(spriteDrag.cv, e);
    const dCx = pos.x - spriteDrag.startCx;
    const dCy = pos.y - spriteDrag.startCy;
    const footDx = Math.round((spriteDrag.baseFootDx - dCx / spriteDrag.k) * 2) / 2;
    const footDy = Math.round((spriteDrag.baseFootDy - dCy / spriteDrag.k) * 2) / 2;
    updateFootSlidersFromDrag(footDx, footDy);
    commitFootForAnim(spriteDrag.anim, footDx, footDy);
    e.preventDefault();
  }

  function onSpriteDragEnd(e) {
    if (!spriteDrag || e.pointerId !== spriteDrag.pointerId) return;
    const pos = canvasPointerPos(spriteDrag.cv, e);
    const dCx = pos.x - spriteDrag.startCx;
    const dCy = pos.y - spriteDrag.startCy;
    const footDx = Math.round((spriteDrag.baseFootDx - dCx / spriteDrag.k) * 2) / 2;
    const footDy = Math.round((spriteDrag.baseFootDy - dCy / spriteDrag.k) * 2) / 2;
    commitFootForAnim(spriteDrag.anim, footDx, footDy);
    updateFootSlidersFromDrag(footDx, footDy);
    spriteDrag.cv.classList.remove('cdev-dragging');
    try { spriteDrag.cv.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    G.UI.toast(`Col${previewCol4}: footDx=${footDx} footDy=${footDy}`, 1.6);
    spriteDrag = null;
    e.preventDefault();
  }

  function wireCanvasDrag(cv, anim) {
    cv.addEventListener('pointerdown', e => onSpriteDragStart(cv, anim, e));
    cv.addEventListener('pointermove', e => onSpriteDragMove(e));
    cv.addEventListener('pointerup', e => onSpriteDragEnd(e));
    cv.addEventListener('pointercancel', e => onSpriteDragEnd(e));
  }

  function syncPickFootUi() {
    const btn = $('cdev-pick-foot');
    if (btn) btn.classList.toggle('on', pickFootOnCanvas);
    for (const id of ['cdev-cv-idle', 'cdev-cv-walk']) {
      const cv = $(id);
      if (cv) {
        cv.classList.toggle('cdev-pick', pickFootOnCanvas);
        cv.style.cursor = pickFootOnCanvas ? (spriteDrag ? 'grabbing' : 'grab') : 'default';
      }
    }
    paintPreviews();
  }

  function paintPreviews() {
    paintCanvas($('cdev-cv-idle'), 'Idle');
    paintCanvas($('cdev-cv-walk'), 'Walk');
  }

  function previewTick(ts) {
    if (!previewRaf) return;
    const c = currentCreature();
    if (!c) { stopPreviewLoop(); return; }
    if (!previewLast) previewLast = ts;
    const dt = ts - previewLast;
    if (dt > 90) {
      previewLast = ts;
      if (walkPhase) {
        const wMeta = G.TibiaSprites.frameMetaForDex(c.legacyId, 'Walk');
        const n = wMeta && wMeta.n ? wMeta.n : 3;
        previewFrame = (previewFrame + 1) % n;
      }
      paintPreviews();
    }
    previewRaf = requestAnimationFrame(previewTick);
  }

  function startPreviewLoop() {
    stopPreviewLoop();
    previewRaf = requestAnimationFrame(previewTick);
  }

  function bindSlider(id, fmt, onApply) {
    const el = $(id);
    if (!el) return;
    const paintVal = () => {
      const val = parseFloat(el.value);
      const lab = $(id + '-val');
      if (lab) lab.textContent = fmt ? fmt(val) : String(val);
    };
    el.oninput = () => {
      paintVal();
      onApply();
    };
  }

  function setAnimMode(mode) {
    const wasSync = syncAnimBuckets;
    if (mode === 'both' && !wasSync) {
      const ui = collectSpriteUi();
      const src = ui[animBucket] || ui.Idle;
      const copy = JSON.parse(JSON.stringify(src));
      ui.Idle = copy;
      ui.Walk = JSON.parse(JSON.stringify(copy));
      writeSpriteFromUi(ui);
    }
    syncAnimBuckets = mode === 'both';
    const idleBtn = $('cdev-anim-idle');
    const walkBtn = $('cdev-anim-walk');
    const bothBtn = $('cdev-anim-both');
    if (idleBtn) idleBtn.classList.toggle('on', mode === 'Idle');
    if (walkBtn) walkBtn.classList.toggle('on', mode === 'Walk');
    if (bothBtn) bothBtn.classList.toggle('on', mode === 'both');
    if (mode === 'Idle') animBucket = 'Idle';
    else if (mode === 'Walk') animBucket = 'Walk';
    const lab = $('cdev-bucket-label');
    if (lab) lab.textContent = syncAnimBuckets ? 'Idle + Walk' : animBucket;
    refreshSpritePanel();
  }

  function setSlider(id, val, fmt) {
    const el = $(id);
    if (!el) return;
    el.value = String(val);
    const lab = $(id + '-val');
    if (lab) lab.textContent = fmt ? fmt(val) : String(val);
  }

  function updateDirChipState() {
    const row = $('cdev-dir-row');
    if (!row) return;
    row.querySelectorAll('[data-cdev-col]').forEach(btn => {
      btn.classList.toggle('on', +btn.dataset.cdevCol === previewCol4);
    });
    const d4 = DIR4_COLS[previewCol4];
    const lab = $('cdev-dir-foot-label');
    if (lab) {
      lab.textContent = `Pies · columna ${d4.label}+${d4.pair} (strip ${previewCol4}) · px sprite`;
    }
  }

  function renderDirChips() {
    const row = $('cdev-dir-row');
    if (!row) return;
    row.innerHTML = DIR4_COLS.map(d =>
      `<button type="button" class="chip${d.col === previewCol4 ? ' on' : ''}" data-cdev-col="${d.col}" title="${d.label} y ${d.pair} comparten sprite">${d.label}<small style="opacity:.55">+${d.pair}</small></button>`).join('');
    row.querySelectorAll('[data-cdev-col]').forEach(btn => {
      btn.onclick = () => {
        previewCol4 = +btn.dataset.cdevCol;
        updateDirChipState();
        refreshSpritePanel(false);
        paintPreviews();
      };
    });
  }

  function refreshSpritePanel(repaint = true) {
    const ui = readSpriteUi();
    let bucket;
    if (syncAnimBuckets) {
      const i = ui.Idle || emptyBucket();
      const w = ui.Walk || emptyBucket();
      const same = i.scaleMul === w.scaleMul;
      bucket = i;
      const hint = $('cdev-bucket-hint');
      if (hint) hint.textContent = same ? '' : '(Idle y Walk difieren en escala; Idle + Walk unifica al mover)';
    } else bucket = ui[animBucket] || emptyBucket();
    const foot = footForDirInBucket(bucket, previewCol4);
    setSlider('cdev-scale', bucket.scaleMul, v => v.toFixed(2));
    setSlider('cdev-foot-dx', foot.footDx, v => v.toFixed(1));
    setSlider('cdev-foot-dy', foot.footDy, v => v.toFixed(1));
    setSlider('cdev-shadow-mul', ui.shadowRxMul, v => v.toFixed(2));
    setSlider('cdev-shadow-s', ui.shadowS != null ? ui.shadowS : 1, v => String(Math.round(v)));
    updateDirChipState();
    if (repaint) paintPreviews();
  }

  function refreshGameplayPanel() {
    const c = currentCreature();
    if (!c) return;
    $('cdev-hp').value = c.hp != null ? c.hp : '';
    $('cdev-speed').value = c.speed != null ? c.speed : '';
    $('cdev-attack').value = c.attack != null ? c.attack : '';
    $('cdev-tier').value = c.tier != null ? c.tier : 0;
    $('cdev-weight').value = c.spawnWeight != null ? c.spawnWeight : 1;
    const behSel = $('cdev-behavior');
    if (behSel) {
      behSel.innerHTML = GAME_BEHAVIORS.map(b =>
        `<option value="${b}"${c.behavior === b ? ' selected' : ''}>${b}</option>`).join('');
    }
    const diffSel = $('cdev-difficulty');
    const E = G.CyclopediaEnums;
    if (diffSel && E) {
      diffSel.innerHTML = E.DIFFICULTY.filter(d => d !== 'elite' && d !== 'boss')
        .map(d => `<option value="${d}"${c.difficulty === d ? ' selected' : ''}>${d}</option>`).join('');
    }
    const occSel = $('cdev-occurrence');
    if (occSel && E) {
      const occ = c.occurrence || (G.Bestiary && G.Bestiary.occurrenceForCreature
        ? G.Bestiary.occurrenceForCreature(c) : 'common');
      occSel.innerHTML = E.OCCURRENCE.map(o =>
        `<option value="${o}"${occ === o ? ' selected' : ''}>${o}</option>`).join('');
    }
    const box = $('cdev-behaviors');
    if (box) {
      const set = new Set((c.behaviors && c.behaviors.length) ? c.behaviors : [c.behavior || 'chase']);
      box.innerHTML = GAME_BEHAVIORS.map(b => {
        const on = set.has(b);
        return `<label class="chip cdev-pick-chip${on ? ' sel' : ''}" style="cursor:pointer;margin:2px"><input type="checkbox" data-beh="${b}"${on ? ' checked' : ''} hidden><span class="${on ? 'on' : ''}">${b}</span></label>`;
      }).join('');
      box.querySelectorAll('[data-beh]').forEach(inp => {
        inp.onchange = () => {
          const on = inp.checked;
          inp.parentElement.classList.toggle('sel', on);
          inp.parentElement.querySelector('span').classList.toggle('on', on);
          saveGameplayFromUi();
        };
      });
    }
    const dmg = $('cdev-dmg-types');
    if (dmg && G.DamageTypes) {
      const set = new Set(c.damageTypes || ['physical']);
      dmg.innerHTML = G.DamageTypes.ALL.map(t => {
        const on = set.has(t);
        return `<label class="chip" style="cursor:pointer;margin:2px"><input type="checkbox" data-dmg="${t}"${on ? ' checked' : ''} hidden><span class="${on ? 'on' : ''}" style="border-color:${G.DamageTypes.COLOR[t]}">${t}</span></label>`;
      }).join('');
      dmg.querySelectorAll('[data-dmg]').forEach(inp => {
        inp.onchange = () => {
          inp.parentElement.querySelector('span').classList.toggle('on', inp.checked);
          saveGameplayFromUi();
        };
      });
    }
  }

  function collectSpriteUi() {
    const ui = readSpriteUi();
    const scaleMul = parseFloat($('cdev-scale').value);
    const fdx = parseFloat($('cdev-foot-dx').value);
    const fdy = parseFloat($('cdev-foot-dy').value);
    const dirKey = String(previewCol4);
    const dirEntry = (Math.abs(fdx) > 1e-4 || Math.abs(fdy) > 1e-4)
      ? { footDx: fdx, footDy: fdy } : null;
    for (const name of activeAnimBuckets()) {
      const prev = ui[name] || emptyBucket();
      const b = Object.assign({}, prev, { scaleMul });
      if (!b.dir) b.dir = Object.create(null);
      b.dir = Object.assign({}, b.dir);
      if (dirEntry) b.dir[dirKey] = dirEntry;
      else delete b.dir[dirKey];
      for (const lk of Object.keys(b.dir)) {
        if (LEGACY_DIR_TO_COL[lk] === previewCol4 && lk !== dirKey) delete b.dir[lk];
      }
      if (bucketUsesPerDirFoot(b)) {
        delete b.footDx;
        delete b.footDy;
      }
      ui[name] = b;
    }
    ui.shadowRxMul = parseFloat($('cdev-shadow-mul').value);
    ui.shadowS = Math.round(parseFloat($('cdev-shadow-s').value));
    const hint = $('cdev-bucket-hint');
    if (hint && syncAnimBuckets) hint.textContent = '';
    return ui;
  }

  function saveGameplayFromUi() {
    if (!creatureId || !G.CreatureDevOverrides) return;
    const beh = [];
    $('cdev-behaviors').querySelectorAll('[data-beh]:checked').forEach(inp => beh.push(inp.dataset.beh));
    const dmg = [];
    $('cdev-dmg-types').querySelectorAll('[data-dmg]:checked').forEach(inp => dmg.push(inp.dataset.dmg));
    const patch = {
      hp: Math.max(1, Math.round(parseFloat($('cdev-hp').value) || 1)),
      speed: Math.max(1, Math.round(parseFloat($('cdev-speed').value) || 1)),
      attack: Math.max(0.1, parseFloat($('cdev-attack').value) || 1),
      tier: Math.max(0, Math.round(parseFloat($('cdev-tier').value) || 0)),
      spawnWeight: parseFloat($('cdev-weight').value) || 0,
      behavior: $('cdev-behavior').value,
      behaviors: beh.length ? beh : [$('cdev-behavior').value],
      difficulty: $('cdev-difficulty').value,
      occurrence: $('cdev-occurrence').value,
      damageTypes: dmg.length ? dmg : ['physical']
    };
    G.CreatureDevOverrides.setOverride(creatureId, patch);
    G.UI.toast('Datos de criatura guardados (local)', 1.8);
  }

  function selectCreature(id) {
    creatureId = id;
    const c = currentCreature();
    $('cdev-title').textContent = c ? `${c.name} (${c.id})` : '—';
    $('cdev-legacy').textContent = c ? `legacyId ${c.legacyId} · lookType ${lookTypeForCreature(c) || '—'}` : '';
    refreshSpritePanel();
    refreshGameplayPanel();
    startPreviewLoop();
    root.querySelectorAll('[data-cdev-pick]').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.cdevPick === id);
    });
  }

  function renderList(filter) {
    const list = $('cdev-list');
    if (!list) return;
    const q = (filter || '').trim().toLowerCase();
    list.innerHTML = creatures().filter(c => !q || c.id.includes(q) || String(c.name).toLowerCase().includes(q))
      .map(c => `<button type="button" class="chip" data-cdev-pick="${c.id}" style="width:100%;text-align:left;margin:2px 0">${c.name}<small style="opacity:.6;display:block">${c.id}</small></button>`).join('');
    list.querySelectorAll('[data-cdev-pick]').forEach(btn => {
      btn.onclick = () => selectCreature(btn.dataset.cdevPick);
    });
  }

  function exportAll() {
    const tuning = G.TibiaSprites && G.TibiaSprites.tuningStoreFromRoot();
    const creaturesOut = G.CreatureDevOverrides ? G.CreatureDevOverrides.exportOverrides() : '{}';
    const msg = [
      '--- Copia byLookType a js/data/tibia-sprite-tuning.js ---',
      JSON.stringify(tuning && tuning.byLookType ? tuning.byLookType : {}, null, 2),
      '--- Overrides criatura (ts.creatureDevOverrides / pegar en datos) ---',
      creaturesOut
    ].join('\n');
    console.log(msg);
    const ta = $('cdev-export');
    if (ta) ta.value = msg;
    G.UI.toast('Export en consola y cuadro de abajo', 2.5);
  }

  function resetSprite() {
    const c = currentCreature();
    const lt = lookTypeForCreature(c);
    if (lt != null && G.TibiaSprites) G.TibiaSprites.clearByLookType(lt);
    refreshSpritePanel();
    G.UI.toast('Sprite restaurado (meta + tuning global)', 2);
  }

  function resetGameplay() {
    if (creatureId && G.CreatureDevOverrides) {
      G.CreatureDevOverrides.resetCreature(creatureId);
      refreshGameplayPanel();
      G.UI.toast('Stats restaurados', 2);
    }
  }

  function buildDom() {
    root = $('cdev-root');
    if (!root) return;
    root.innerHTML = `
<style>
.cdev-grid{display:grid;grid-template-columns:minmax(140px,1fr) minmax(280px,1.4fr) minmax(260px,1fr);gap:12px;align-items:start}
@media(max-width:900px){.cdev-grid{grid-template-columns:1fr}}
.cdev-prev{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.cdev-prev canvas{background:#12151c;border:1px solid rgba(255,255,255,.12);border-radius:6px;image-rendering:pixelated}
.cdev-field{margin:6px 0;font-size:13px}
.cdev-field label{display:flex;justify-content:space-between;gap:8px;color:var(--muted)}
.cdev-field input[type=range]{width:100%}
.cdev-tabs{display:flex;gap:6px;margin-bottom:8px}
.cdev-pick-chip{border:2px solid rgba(255,255,255,.12);border-radius:8px;padding:4px 8px;box-sizing:border-box}
.cdev-pick-chip.sel{border-color:var(--gold);box-shadow:0 0 0 1px rgba(212,175,55,.4)}
.cdev-pick-chip.sel span{color:var(--gold)}
.cdev-prev canvas.cdev-pick{outline:2px dashed rgba(255,210,80,.65);outline-offset:2px}
.cdev-prev canvas.cdev-dragging{outline-color:rgba(120,220,255,.9)}
</style>
<div class="cdev-grid">
  <div>
    <input id="cdev-filter" class="input" placeholder="Buscar criatura…" style="width:100%;margin-bottom:6px">
    <div id="cdev-list" style="max-height:62vh;overflow:auto"></div>
  </div>
  <div>
    <h3 id="cdev-title" style="margin:0 0 4px">—</h3>
    <p id="cdev-legacy" style="margin:0 0 8px;font-size:12px;color:var(--muted)"></p>
    <div class="cdev-prev">
      <canvas id="cdev-cv-idle" width="256" height="232"></canvas>
      <canvas id="cdev-cv-walk" width="256" height="232"></canvas>
    </div>
    <div class="row wrap" style="gap:6px;margin:8px 0">
      <button type="button" class="chip on" id="cdev-anim-idle">Idle</button>
      <button type="button" class="chip" id="cdev-anim-walk">Walk</button>
      <button type="button" class="chip" id="cdev-anim-both" title="Mismo ajuste en Idle y Walk">Idle + Walk</button>
      <button type="button" class="btn small ghost" id="cdev-dir-l">↺</button>
      <button type="button" class="btn small ghost" id="cdev-dir-r">↻</button>
      <button type="button" class="chip" id="cdev-pick-foot" title="Arrastra el sprite; la sombra (centro) queda fija">Arrastrar sprite</button>
      <label class="chip" style="cursor:pointer"><input type="checkbox" id="cdev-animate-walk" hidden><span>Animar walk</span></label>
    </div>
    <div class="cdev-tabs">
      <button type="button" class="chip on" data-cdev-tab="sprite">Sprite</button>
      <button type="button" class="chip" data-cdev-tab="game">Combate / bestiario</button>
    </div>
    <div id="cdev-panel-sprite">
      <p style="font-size:12px;color:var(--muted);margin:0 0 6px">Bucket <b id="cdev-bucket-label">Idle</b>: escala común; <b>footDx/Dy por dirección</b>. Sombra compartida. <span id="cdev-bucket-hint" style="opacity:.85"></span></p>
      <div id="cdev-dir-row" class="row wrap" style="gap:4px;margin-bottom:4px"></div>
      <p id="cdev-dir-foot-label" style="font-size:11px;color:var(--muted);margin:0 0 6px"></p>
      <div class="cdev-field"><label>scaleMul <span id="cdev-scale-val">1</span></label><input type="range" id="cdev-scale" min="0.4" max="1.8" step="0.01" value="1"></div>
      <div class="cdev-field"><label>footDx <span id="cdev-foot-dx-val">0</span></label><input type="range" id="cdev-foot-dx" min="-24" max="24" step="0.5" value="0"></div>
      <div class="cdev-field"><label>footDy <span id="cdev-foot-dy-val">0</span></label><input type="range" id="cdev-foot-dy" min="-24" max="24" step="0.5" value="0"></div>
      <div class="cdev-field"><label>shadowRxMul <span id="cdev-shadow-mul-val">1</span></label><input type="range" id="cdev-shadow-mul" min="0.3" max="2.5" step="0.02" value="1"></div>
      <div class="cdev-field"><label>shadowS (0–2) <span id="cdev-shadow-s-val">1</span></label><input type="range" id="cdev-shadow-s" min="0" max="2" step="1" value="1"></div>
      <div class="row wrap" style="gap:6px;margin-top:8px">
        <button type="button" class="btn small" id="cdev-save-sprite">Guardar sprite</button>
        <button type="button" class="btn small ghost" id="cdev-reset-sprite">Restaurar sprite</button>
      </div>
    </div>
    <div id="cdev-panel-game" class="hidden">
      <div class="row wrap" style="gap:8px">
        <label>HP <input id="cdev-hp" type="number" class="input" style="width:72px"></label>
        <label>Speed <input id="cdev-speed" type="number" class="input" style="width:72px"></label>
        <label>Attack <input id="cdev-attack" type="number" step="0.05" class="input" style="width:72px"></label>
        <label>Tier <input id="cdev-tier" type="number" class="input" style="width:56px"></label>
        <label>Weight <input id="cdev-weight" type="number" step="0.05" class="input" style="width:72px"></label>
      </div>
      <div class="cdev-field"><label>behavior principal</label><select id="cdev-behavior" class="input" style="width:100%"></select></div>
      <div class="cdev-field"><label>behaviors (ataques / IA)</label><div id="cdev-behaviors" class="row wrap"></div></div>
      <div class="cdev-field"><label>damageTypes</label><div id="cdev-dmg-types" class="row wrap"></div></div>
      <div class="row wrap" style="gap:8px">
        <label>difficulty <select id="cdev-difficulty" class="input"></select></label>
        <label>occurrence <select id="cdev-occurrence" class="input"></select></label>
      </div>
      <div class="row wrap" style="gap:6px;margin-top:8px">
        <button type="button" class="btn small" id="cdev-save-game">Guardar datos</button>
        <button type="button" class="btn small ghost" id="cdev-reset-game">Restaurar datos</button>
      </div>
    </div>
  </div>
  <div>
    <p style="font-size:12px;color:var(--muted)">Persistencia local (?dev). Usa export para copiar a los archivos fuente.</p>
    <div class="row wrap" style="gap:6px;margin-bottom:8px">
      <button type="button" class="btn small gold" id="cdev-export-btn">Exportar todo</button>
      <button type="button" class="btn small ghost" id="cdev-reset-all">Reset overrides</button>
    </div>
    <textarea id="cdev-export" class="input" rows="14" style="width:100%;font-family:monospace;font-size:11px" readonly placeholder="Pulsa Exportar…"></textarea>
  </div>
</div>`;

    $('cdev-filter').oninput = e => renderList(e.target.value);
    $('cdev-anim-idle').onclick = () => setAnimMode('Idle');
    $('cdev-anim-walk').onclick = () => setAnimMode('Walk');
    $('cdev-anim-both').onclick = () => setAnimMode('both');
    renderDirChips();
    const cvIdle = $('cdev-cv-idle');
    const cvWalk = $('cdev-cv-walk');
    if (cvIdle) wireCanvasDrag(cvIdle, 'Idle');
    if (cvWalk) wireCanvasDrag(cvWalk, 'Walk');
    $('cdev-pick-foot').onclick = () => {
      pickFootOnCanvas = !pickFootOnCanvas;
      spriteDrag = null;
      syncPickFootUi();
      G.UI.toast(pickFootOnCanvas ? 'Arrastra el sprite en Idle/Walk (sombra fija)' : 'Modo arrastre desactivado', 2);
    };
    $('cdev-dir-l').onclick = () => {
      previewCol4 = (previewCol4 + 3) % 4;
      updateDirChipState();
      refreshSpritePanel(false);
      paintPreviews();
    };
    $('cdev-dir-r').onclick = () => {
      previewCol4 = (previewCol4 + 1) % 4;
      updateDirChipState();
      refreshSpritePanel(false);
      paintPreviews();
    };
    $('cdev-animate-walk').onchange = e => {
      walkPhase = !!e.target.checked;
      e.target.parentElement.querySelector('span').classList.toggle('on', walkPhase);
      previewFrame = 0;
      if (walkPhase) startPreviewLoop();
    };
    root.querySelectorAll('[data-cdev-tab]').forEach(btn => {
      btn.onclick = () => {
        root.querySelectorAll('[data-cdev-tab]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        const tab = btn.dataset.cdevTab;
        $('cdev-panel-sprite').classList.toggle('hidden', tab !== 'sprite');
        $('cdev-panel-game').classList.toggle('hidden', tab !== 'game');
      };
    });
    const sliderFmt = {
      'cdev-scale': v => v.toFixed(2),
      'cdev-foot-dx': v => v.toFixed(1),
      'cdev-foot-dy': v => v.toFixed(1),
      'cdev-shadow-mul': v => v.toFixed(2),
      'cdev-shadow-s': v => String(Math.round(v))
    };
    for (const id of Object.keys(sliderFmt)) {
      bindSlider(id, sliderFmt[id], () => writeSpriteFromUi(collectSpriteUi()));
    }
    $('cdev-save-sprite').onclick = () => {
      writeSpriteFromUi(collectSpriteUi());
      G.UI.toast('Sprite guardado (localStorage)', 2);
    };
    $('cdev-reset-sprite').onclick = resetSprite;
    $('cdev-save-game').onclick = saveGameplayFromUi;
    $('cdev-reset-game').onclick = resetGameplay;
    $('cdev-export-btn').onclick = exportAll;
    $('cdev-reset-all').onclick = () => {
      if (!confirm('¿Borrar todos los overrides locales de criaturas y sprites?')) return;
      if (G.CreatureDevOverrides) G.CreatureDevOverrides.resetAll();
      const store = G.TibiaSprites && G.TibiaSprites.tuningStoreFromRoot();
      if (store) {
        delete store.byLookType;
        G.TibiaSprites.persistTuningStore(store);
      }
      refreshSpritePanel();
      refreshGameplayPanel();
      G.UI.toast('Overrides borrados', 2);
    };
    renderList('');
    const first = creatures()[0];
    if (first) selectCreature(first.id);
  }

  function open() {
    if (!devOn()) return;
    G.UI.show('scr-creature-dev', true);
    G.UI.chrome(true);
    if (!root) buildDom();
    else {
      renderList($('cdev-filter') && $('cdev-filter').value);
      if ($('cdev-dir-row') && !$('cdev-dir-row').children.length) renderDirChips();
      refreshSpritePanel();
      refreshGameplayPanel();
      startPreviewLoop();
    }
  }

  function close() {
    stopPreviewLoop();
    spriteDrag = null;
    pickFootOnCanvas = false;
    G.UI.hide('scr-creature-dev');
    G.MenuUI.open();
  }

  function init() {
    if (!devOn()) return;
    G.CreatureDevOverrides.init();
    const back = $('cdev-back');
    if (back) back.onclick = close;
    const menuBtn = $('menu-creature-dev');
    if (menuBtn) menuBtn.classList.remove('hidden');
  }

  return { init, open, close, devOn };
})();