/* ============ outfit-ui.js — personalizar personaje (estilo cliente Tibia) ============ */
G.OutfitUI = (() => {
  const $ = G.UI.$;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const PARTS = [
    { id: 'head', label: 'Head', tab: 'Cabeza' },
    { id: 'body', label: 'Primary', tab: 'Principal' },
    { id: 'legs', label: 'Secondary', tab: 'Secundario' },
    { id: 'feet', label: 'Detail', tab: 'Detalle' }
  ];

  const ADDONS = [
    { bit: 1, label: 'Addon 1' },
    { bit: 2, label: 'Addon 2' }
  ];

  let previewAnim = null;
  /** 8-dir del motor: 0 = sur (↓ pantalla), como `sprites.js`. */
  const PREVIEW_DIR_SOUTH = 0;
  let previewDir = PREVIEW_DIR_SOUTH;
  let previewWalk = false;
  let previewRaf = null;
  let previewLast = 0;
  let activePart = 'head';
  let showFloor = true;
  let onlyMine = false;
  let filterQ = '';
  let root = null;
  let previewAssetsType = null;
  const PREVIEW_W = 192;
  const PREVIEW_H = 172;
  const THUMB_SIZE = 64;
  const PREVIEW_MARGIN = 0.03;
  const THUMB_MARGIN = 0.035;
  const PREVIEW_FILL = 0.9;
  const THUMB_FILL = 0.88;
  const PREVIEW_CENTER_Y = 0.5;
  const THUMB_CENTER_Y = 0.52;

  function stopPreviewLoop() {
    if (previewRaf != null) cancelAnimationFrame(previewRaf);
    previewRaf = null;
    previewLast = 0;
  }

  function syncPreviewAnimMode(force) {
    if (!previewAnim) return;
    if (previewWalk) {
      if (force || previewAnim._walkUi !== true) {
        previewAnim.loop('Walk', 1);
        previewAnim.speed = 1;
        previewAnim._walkUi = true;
      }
    } else if (force || previewAnim._walkUi !== false) {
      previewAnim.loop('Idle', 1);
      previewAnim.cur = 'Idle';
      previewAnim.frame = 0;
      previewAnim.t = 0;
      previewAnim._walkUi = false;
    }
    previewAnim.dir = previewDir;
  }

  function turnPreview(delta) {
    previewDir = (previewDir + delta + 8) % 8;
    if (previewAnim) previewAnim.dir = previewDir;
    renderPreviewFrame($('outfit-preview'));
    G.Audio.sfx('click');
  }

  function ensurePreviewAnim(o, canvas) {
    const look = Object.assign({}, o);
    const animName = previewWalk ? 'Walk' : 'Idle';
    const frame = previewAnim ? previewAnim.frame : 0;
    const pl = G.TibiaSprites.outfitBoxPlacement(
      canvas.width, canvas.height, look, animName, PREVIEW_FILL, PREVIEW_CENTER_Y, true, previewDir, frame);
    if (!previewAnim || previewAnim._outfitType !== o.type) {
      previewAnim = new G.Sprites.Animator(99001, pl.scale);
      previewAnim._outfitType = o.type;
      syncPreviewAnimMode(true);
    }
    previewAnim.scale = pl.scale;
    previewAnim.dir = previewDir;
    previewAnim._placeX = pl.x;
    previewAnim._placeY = pl.y;
  }

  function renderPreviewFrame(canvas) {
    if (!canvas || !G.TibiaSprites || !G.TibiaSprites.enabled) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFloor(ctx, canvas.width, canvas.height);
    const o = outfit();
    if (!G.TibiaSprites.hasOutfitAssets(o.type)) return;
    ensurePreviewAnim(o, canvas);
    previewAnim.dir = previewDir;
    const px = previewAnim._placeX != null ? previewAnim._placeX : canvas.width / 2;
    const py = previewAnim._placeY != null ? previewAnim._placeY : canvas.height / 2;
    previewAnim.draw(ctx, px, py, { outfitUi: true });
  }

  function startPreviewLoop() {
    stopPreviewLoop();
    previewLast = performance.now();
    const step = now => {
      if (!$('outfit-preview')) { stopPreviewLoop(); return; }
      const dt = Math.min(0.05, (now - previewLast) / 1000);
      previewLast = now;
      if (previewWalk && previewAnim) previewAnim.update(dt);
      renderPreviewFrame($('outfit-preview'));
      previewRaf = requestAnimationFrame(step);
    };
    previewRaf = requestAnimationFrame(step);
  }

  function outfit() {
    return G.TibiaOutfits.fromSave();
  }

  function refreshPlayerSprite() {
    if (G.Game && G.Game.player && G.Game.player.anim) {
      G.Game.player.anim = new G.Sprites.Animator(99001, G.Game.player.anim.scale);
    }
  }

  function drawFloor(ctx, w, h) {
    if (!showFloor) return;
    const ts = 16;
    for (let y = 0; y < h; y += ts) {
      for (let x = 0; x < w; x += ts) {
        const c = ((x / ts) + (y / ts)) % 2 ? '#5c5348' : '#4a433b';
        ctx.fillStyle = c;
        ctx.fillRect(x, y, ts, ts);
      }
    }
  }

  function drawPreview(canvas) {
    if (!canvas) return;
    const o = outfit();
    if (!G.TibiaSprites || !G.TibiaSprites.enabled) return;
    const after = () => {
      previewAssetsType = o.type;
      renderPreviewFrame(canvas);
    };
    if (previewAssetsType === o.type && G.TibiaSprites.hasOutfitAssets(o.type)) {
      after();
      return;
    }
    G.TibiaSprites.preloadOutfitTypes([o.type]).then(after);
  }

  function drawThumb(canvas, type, dimmed) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFloor(ctx, canvas.width, canvas.height);
    if (!G.TibiaSprites.enabled || !G.TibiaOutfits.hasAssets(type)) return;
    const look = G.TibiaOutfits.showcaseLook(type);
    const pl = G.TibiaSprites.outfitBoxPlacement(
      canvas.width, canvas.height, look, 'Idle', THUMB_FILL, THUMB_CENTER_Y, true, PREVIEW_DIR_SOUTH, 0);
    G.TibiaSprites.drawOutfitLook(
      ctx, look, pl.x, pl.y, pl.scale, 'Idle', 0, PREVIEW_DIR_SOUTH, { alpha: dimmed ? 0.5 : 1, outfitUi: true });
  }

  function paintGallery() {
    const grid = root && root.querySelector('#outfit-gallery');
    if (!grid) return;
    const o = outfit();
    const rows = G.TibiaOutfits.rosterFiltered({ onlyMine, q: filterQ });
    grid.innerHTML = rows.map(row => {
      const on = row.type === o.type;
      const lock = !row.unlocked;
      const noAsset = !row.assets;
      return `<button type="button" class="outfit-pick ${on ? 'on' : ''} ${lock ? 'locked' : ''}" data-type="${row.type}" title="${esc(row.name)}">
        <canvas class="outfit-pick-canvas" width="${THUMB_SIZE}" height="${THUMB_SIZE}" data-thumb="${row.type}"></canvas>
        <span class="outfit-pick-name">${esc(row.name)}</span>
        ${lock ? `<span class="outfit-pick-badge">${row.unlock === 'shop' ? '€' : '🔒'}</span>` : ''}
        ${noAsset ? '<span class="outfit-pick-badge dim">…</span>' : ''}
      </button>`;
    }).join('');

    const types = rows.filter(r => r.assets).map(r => r.type);
    G.TibiaSprites.preloadOutfitTypes(types).then(() => {
      grid.querySelectorAll('[data-thumb]').forEach(c => {
        const type = +c.dataset.thumb;
        const row = rows.find(r => r.type === type);
        drawThumb(c, type, row && !row.unlocked);
      });
    });

    grid.querySelectorAll('.outfit-pick').forEach(btn => {
      btn.onclick = () => selectOutfit(+btn.dataset.type);
    });
  }

  function selectOutfit(type) {
    if (!G.TibiaOutfits.isUnlocked(type)) {
      G.UI.toast(G.TibiaOutfits.unlockHint(type), 5000);
      G.Audio.sfx('click');
      return;
    }
    const cur = outfit();
    if (cur.type === type) return;
    G.TibiaOutfits.applyToSave({ type });
    G.DB.commit();
    previewAnim = null;
    previewAssetsType = null;
    refreshPlayerSprite();
    paintGallery();
    drawPreview($('outfit-preview'));
    updateHeader();
    G.Audio.sfx('select');
  }

  function updateHeader() {
    const o = outfit();
    const cat = G.TibiaOutfits.meta(o.type);
    const el = $('outfit-type-name');
    if (el && cat) el.textContent = cat.nameEs || cat.name;
  }

  function syncPaletteSelection() {
    if (!root) return;
    const o = outfit();
    const cid = o[activePart];
    root.querySelectorAll('.outfit-color').forEach(btn => {
      btn.classList.toggle('on', +btn.dataset.colorId === cid);
    });
    root.querySelectorAll('.outfit-part-tab').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.part === activePart);
    });
  }

  function paintPalette() {
    const grid = root && root.querySelector('#outfit-palette');
    if (!grid) return;
    grid.innerHTML = '';
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 19; col++) {
        const colorId = row * 19 + col;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'outfit-color';
        btn.dataset.colorId = colorId;
        btn.style.background = G.TibiaOutfitColors.css(colorId);
        btn.onclick = () => {
          const patch = {};
          patch[activePart] = colorId;
          G.TibiaOutfits.applyToSave(patch);
          G.DB.commit();
          refreshPlayerSprite();
          syncPaletteSelection();
          drawPreview($('outfit-preview'));
          paintGallery();
          G.Audio.sfx('select');
        };
        grid.appendChild(btn);
      }
    }
    syncPaletteSelection();
  }

  function renderAddons() {
    const box = root && root.querySelector('#outfit-addons');
    if (!box) return;
    const o = outfit();
    const a = o.addons | 0;
    const canEdit = G.TibiaOutfits.isUnlocked(o.type);
    box.innerHTML = ADDONS.map(ad =>
      `<label class="chip-like outfit-addon"><input type="checkbox" data-addon-bit="${ad.bit}" ${!canEdit ? 'disabled' : ''} ${a & ad.bit ? 'checked' : ''}>
       ${esc(ad.label)}</label>`).join('');
    box.querySelectorAll('[data-addon-bit]').forEach(inp => {
      inp.onchange = () => {
        let bits = 0;
        box.querySelectorAll('[data-addon-bit]').forEach(c => {
          if (c.checked) bits |= +c.dataset.addonBit;
        });
        G.TibiaOutfits.applyToSave({ addons: bits });
        G.DB.commit();
        refreshPlayerSprite();
        drawPreview($('outfit-preview'));
        paintGallery();
        G.Audio.sfx('select');
      };
    });
  }

  function renderShell() {
    const o = outfit();
    const cat = G.TibiaOutfits.meta(o.type) || { name: 'Outfit' };
    root = $('outfit-root');
    if (!root) return;

    root.innerHTML =
      `<div class="outfit-tibia">
         <div class="outfit-tibia-top">
           <div class="outfit-tibia-left panel">
             <div class="outfit-preview-wrap">
               <div class="outfit-stage">
                 <canvas id="outfit-preview" width="${PREVIEW_W}" height="${PREVIEW_H}" class="outfit-preview outfit-preview-lg"></canvas>
                 <button type="button" class="outfit-stage-turn prev" id="outfit-dir-prev" title="Girar">◀</button>
                 <button type="button" class="outfit-stage-turn next" id="outfit-dir-next" title="Girar">▶</button>
               </div>
               <div class="outfit-preview-opts row wrap center">
                 <label class="chip-like"><input type="checkbox" id="outfit-show-floor" ${showFloor ? 'checked' : ''}> Mostrar suelo</label>
                 <label class="chip-like"><input type="checkbox" id="outfit-preview-walk" ${previewWalk ? 'checked' : ''}> Ver al caminar</label>
               </div>
             </div>
             <div class="outfit-config-block">
               <b class="outfit-side-title">Cambiar apariencia</b>
               <div class="outfit-kv"><span>Outfit</span><b id="outfit-type-name">${esc(cat.nameEs || cat.name)}</b></div>
               <div id="outfit-addons" class="outfit-addons row wrap"></div>
             </div>
           </div>
           <div class="outfit-tibia-right panel">
             <b class="outfit-side-title">Filtrar outfits</b>
             <input type="search" class="field outfit-search" id="outfit-search" placeholder="Buscar…" value="${esc(filterQ)}">
             <label class="chip-like" style="margin:4px 0 6px;font-size:12px"><input type="checkbox" id="outfit-only-mine" ${onlyMine ? 'checked' : ''}> Solo los míos</label>
             <div id="outfit-gallery" class="outfit-gallery"></div>
           </div>
         </div>
         <div class="outfit-tibia-bottom panel">
           <div class="outfit-color-head row wrap">
             ${PARTS.map(p =>
               `<button type="button" class="chip outfit-part-tab ${p.id === activePart ? 'on' : ''}" data-part="${p.id}">${esc(p.tab)}</button>`).join('')}
           </div>
           <div class="outfit-palette-wrap"><div id="outfit-palette" class="outfit-palette" aria-label="Colores 0–132"></div></div>
         </div>
       </div>`;

    $('outfit-show-floor').onchange = e => {
      showFloor = e.target.checked;
      drawPreview($('outfit-preview'));
      paintGallery();
    };
    $('outfit-preview-walk').onchange = e => {
      previewWalk = e.target.checked;
      syncPreviewAnimMode(true);
      drawPreview($('outfit-preview'));
    };
    $('outfit-search').oninput = e => {
      filterQ = e.target.value;
      paintGallery();
    };
    $('outfit-only-mine').onchange = e => {
      onlyMine = e.target.checked;
      paintGallery();
    };

    root.querySelectorAll('.outfit-part-tab').forEach(btn => {
      btn.onclick = () => {
        activePart = btn.dataset.part;
        syncPaletteSelection();
        root.querySelectorAll('.outfit-part-tab').forEach(b => b.classList.toggle('on', b.dataset.part === activePart));
        G.Audio.sfx('click');
      };
    });

    $('outfit-dir-prev').onclick = () => turnPreview(-1);
    $('outfit-dir-next').onclick = () => turnPreview(1);

    paintPalette();
    renderAddons();
    paintGallery();
    drawPreview($('outfit-preview'));
    startPreviewLoop();
  }

  function init() {
    const back = $('outfit-back');
    if (back) back.onclick = () => { stopPreviewLoop(); G.MenuUI.open(); };
  }

  function open() {
    if (!G.TibiaOutfits || !G.DB.save) return;
    if (G.Content && G.Content.mode !== 'neutral') {
      G.UI.toast('Aspecto Tibia solo en TibiaSurvivor');
      return;
    }
    G.TibiaOutfits.initSave(G.DB.save);
    activePart = 'head';
    previewDir = PREVIEW_DIR_SOUTH;
    G.UI.show('scr-outfit', true);
    renderShell();
  }

  return { init, open, render: renderShell, drawPreview };
})();
