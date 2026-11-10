/* ============ tibia-outfit-draw.js — plantilla + máscara Tibia ============
 * Cliente: capa 0 (sombreada), capa 1 (máscara amarilla/roja/verde/azul).
 * Blend: MULTIPLY dest × color de outfit solo donde la máscara marca la zona
 * (ver creature.cpp / CompositionMode_Multiply + SpriteMask*).
 */
G.TibiaOutfitDraw = (() => {
  const PAL = () => G.TibiaOutfitColors;

  function spriteSlot(layout, animFrame, dir, addonRow, layer) {
    const pw = layout.pw || 4;
    const ph = layout.ph || 3;
    const pd = layout.pd || 2;
    const layers = layout.layers || 2;
    const z = 0;
    return (((animFrame * pd + z) * ph + addonRow) * pw + dir) * layers + layer;
  }

  /** Canales del cliente: amarillo=cabeza, rojo=cuerpo, verde=piernas, azul=pies. */
  function maskChannel(r, g, b) {
    if (r > 180 && g > 180 && b < 100) return 'head';
    if (r > 180 && g < 100 && b < 100) return 'body';
    if (g > 180 && r < 100 && b < 100) return 'legs';
    if (b > 180 && r < 100 && g < 100) return 'feet';
    return null;
  }

  function multiplyComponent(base, tint) {
    return (base * tint / 255) | 0;
  }

  /**
   * Un pase: plantilla con sombras; donde la máscara marca zona, dst *= color outfit.
   */
  function compositePixels(tData, mData, w, h, colors) {
    const pal = PAL();
    const tints = {
      head: pal.rgb(colors.head),
      body: pal.rgb(colors.body),
      legs: pal.rgb(colors.legs),
      feet: pal.rgb(colors.feet)
    };
    const out = new Uint8ClampedArray(w * h * 4);
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      const tr = tData[i];
      const tg = tData[i + 1];
      const tb = tData[i + 2];
      const ta = tData[i + 3];
      if (ta < 8) {
        out[i + 3] = 0;
        continue;
      }
      const mr = mData[i];
      const mg = mData[i + 1];
      const mb = mData[i + 2];
      const ma = mData[i + 3];
      const ch = ma >= 24 ? maskChannel(mr, mg, mb) : null;
      if (ch) {
        const c = tints[ch];
        out[i] = multiplyComponent(tr, c[0]);
        out[i + 1] = multiplyComponent(tg, c[1]);
        out[i + 2] = multiplyComponent(tb, c[2]);
        out[i + 3] = ta;
      } else {
        out[i] = tr;
        out[i + 1] = tg;
        out[i + 2] = tb;
        out[i + 3] = ta;
      }
    }
    return out;
  }

  const frameCache = new Map();
  const CACHE_MAX = 96;

  function frameCanvasFor(sheetImg, layout, tileW, tileH, animFrame, dir4, addonRow, colors) {
    const key = `${sheetImg.src}|${animFrame}|${dir4}|${addonRow}|${colors.head}|${colors.body}|${colors.legs}|${colors.feet}`;
    let hit = frameCache.get(key);
    if (hit) return hit;

    const canvas = document.createElement('canvas');
    canvas.width = tileW;
    canvas.height = tileH;
    const cx = canvas.getContext('2d');

    const idxT = spriteSlot(layout, animFrame, dir4, addonRow, 0);
    const idxM = spriteSlot(layout, animFrame, dir4, addonRow, 1);

    const tmpT = document.createElement('canvas');
    const tmpM = document.createElement('canvas');
    tmpT.width = tmpM.width = tileW;
    tmpT.height = tmpM.height = tileH;
    tmpT.getContext('2d').drawImage(sheetImg, idxT * tileW, 0, tileW, tileH, 0, 0, tileW, tileH);
    tmpM.getContext('2d').drawImage(sheetImg, idxM * tileW, 0, tileW, tileH, 0, 0, tileW, tileH);

    const tData = tmpT.getContext('2d').getImageData(0, 0, tileW, tileH).data;
    const mData = tmpM.getContext('2d').getImageData(0, 0, tileW, tileH).data;
    const pixels = compositePixels(tData, mData, tileW, tileH, colors);
    cx.putImageData(new ImageData(pixels, tileW, tileH), 0, 0);

    if (frameCache.size >= CACHE_MAX) {
      const first = frameCache.keys().next().value;
      frameCache.delete(first);
    }
    frameCache.set(key, canvas);
    return canvas;
  }

  function stackedFrame(sheetImg, layout, tileW, tileH, animFrame, dir4, colors) {
    const addons = colors.addons | 0;
    const rows = G.TibiaOutfits ? G.TibiaOutfits.patternRows(addons, colors.type) : [0];
    const key = `${sheetImg.src}|stk|${animFrame}|${dir4}|${addons}|${colors.head}|${colors.body}|${colors.legs}|${colors.feet}`;
    let hit = frameCache.get(key);
    if (hit) return hit;

    const canvas = document.createElement('canvas');
    canvas.width = tileW;
    canvas.height = tileH;
    const cx = canvas.getContext('2d');
    for (const row of rows) {
      cx.drawImage(frameCanvasFor(sheetImg, layout, tileW, tileH, animFrame, dir4, row, colors), 0, 0);
    }

    if (frameCache.size >= CACHE_MAX) {
      const first = frameCache.keys().next().value;
      frameCache.delete(first);
    }
    frameCache.set(key, canvas);
    return canvas;
  }

  /**
   * @param colors {{ head, body, legs, feet, addons }}
   */
  function drawFrame(ctx, sheetImg, layout, tileW, tileH, animFrame, dir4, colors, dx, dy, dw, dh, alpha) {
    const frame = stackedFrame(sheetImg, layout, tileW, tileH, animFrame, dir4, colors);
    const prev = ctx.globalAlpha;
    if (alpha < 1) ctx.globalAlpha = prev * alpha;
    ctx.drawImage(frame, dx, dy, dw, dh);
    ctx.globalAlpha = prev;
    return true;
  }

  const boundsCache = new Map();
  const BOUNDS_CACHE_MAX = 128;

  /** Centro del contenido opaco (silueta), en coordenadas del tile. */
  function opaqueBoundsFromRgba(rgba, tileW, tileH) {
    let x0 = tileW;
    let y0 = tileH;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < tileH; y++) {
      for (let x = 0; x < tileW; x++) {
        const a = rgba[(y * tileW + x) * 4 + 3];
        if (a < 8) continue;
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
    if (x1 < 0) return { x0: 0, y0: 0, w: tileW, h: tileH, cx: tileW * 0.5, cy: tileH * 0.5 };
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    return { x0, y0, w, h, cx: x0 + w * 0.5, cy: y0 + h * 0.5 };
  }

  function measureFrame(sheetImg, layout, tileW, tileH, animFrame, dir4, colors) {
    const key = `${sheetImg.src}|bnd|${animFrame}|${dir4}|${colors.addons | 0}|${colors.type}`;
    const stacked = stackedFrame(sheetImg, layout, tileW, tileH, animFrame, dir4, colors);
    let hit = boundsCache.get(key);
    if (hit) return hit;
    const data = stacked.getContext('2d').getImageData(0, 0, tileW, tileH).data;
    hit = opaqueBoundsFromRgba(data, tileW, tileH);
    if (boundsCache.size >= BOUNDS_CACHE_MAX) {
      const first = boundsCache.keys().next().value;
      boundsCache.delete(first);
    }
    boundsCache.set(key, hit);
    return hit;
  }

  return { spriteSlot, drawFrame, maskChannel, compositePixels, measureFrame };
})();
