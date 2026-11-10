/* ============ tibia-tiles.js — suelo/paredes Tibia en el mapa (fase 2) ============
 * PNG: assets/tibia/tiles/{file}.png (nombre del export grouped, p. ej. 198319 o 198305-198306)
 * Mapa: G.TIBIA_SPRITE_MAP.tiles · meta: G.TIBIA_TILES_META (refresh_tibia_tiles_meta.mjs)
 */
G.TibiaTiles = (() => {
  const MAP = () => (G.TIBIA_SPRITE_MAP && G.TIBIA_SPRITE_MAP.tiles) || {};
  const META = () => G.TIBIA_TILES_META || {};

  const FLOOR_BY_BIOME = ['grass', 'cave_floor', 'cave_floor'];
  const WALL_KEY = 'stone_wall';

  function mapFlags() {
    const mt = G.TIBIA_SPRITE_TUNING && G.TIBIA_SPRITE_TUNING.mapTiles;
    return {
      floors: !mt || mt.floors !== false,
      walls: !!(mt && mt.walls)
    };
  }

  /** Máscara N=1 E=2 S=4 W=8 → índice dentro del set de pared (0..span-1). */
  const WALL_OFFSET_DEFAULT = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17
  ];

  function isTibiaUi() {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-ui') === 'tibia';
  }

  function resolveEnabled() {
    if (typeof location !== 'undefined') {
      if (/[?&]tiles=proc\b/.test(location.search)) return false;
      if (/[?&]tiles=tibia\b/.test(location.search)) return true;
    }
    const f = mapFlags();
    if (!f.floors && !f.walls) return false;
    if (!isTibiaUi()) return false;
    return !!(G.TibiaSprites && G.TibiaSprites.enabled);
  }

  let enabled = resolveEnabled();

  const sheets = new Map();
  const MAX = 200;

  function tileRef(logicalKey) {
    const ref = MAP()[logicalKey];
    if (!ref) return null;
    if (ref.file) return { file: String(ref.file), frame: ref.frame != null ? (ref.frame | 0) : 0 };
    if (ref.clientId != null) return { file: String(ref.clientId | 0), frame: 0 };
    return null;
  }

  function wallSet() {
    const sw = MAP()[WALL_KEY];
    return sw && sw.set ? sw.set : null;
  }

  function srcFor(fileKey) {
    return `assets/tibia/tiles/${fileKey}.png`;
  }

  function getSheet(fileKey) {
    const key = String(fileKey);
    let s = sheets.get(key);
    if (s) return s;
    if (sheets.size >= MAX) {
      const old = sheets.keys().next().value;
      if (old != null) sheets.delete(old);
    }
    const img = new Image();
    s = { img, ready: false, failed: false, key };
    img.onload = () => {
      s.ready = true;
      if (G.World && G.World.flushChunkImages) G.World.flushChunkImages();
    };
    img.onerror = () => { s.failed = true; };
    img.src = srcFor(key);
    sheets.set(key, s);
    return s;
  }

  function metaFor(fileKey) {
    const m = META()[String(fileKey)];
    if (m) return m;
    return { tileW: 32, tileH: 32, frames: 1, sheetW: 32, sheetH: 32 };
  }

  /** Sprite id del export → { file, frame }. */
  function fileRefForSpriteId(spriteId) {
    const id = spriteId | 0;
    const key = String(id);
    if (META()[key]) return { file: key, frame: 0 };
    for (const [fname, m] of Object.entries(META())) {
      if (m.firstId != null && id >= m.firstId && id <= m.lastId) {
        return { file: fname, frame: id - m.firstId };
      }
    }
    return null;
  }

  function isReady(fileKey) {
    const s = sheets.get(String(fileKey));
    return !!(s && s.ready);
  }

  function hasTile(logicalKey) {
    if (logicalKey === WALL_KEY) {
      if (!mapFlags().walls) return false;
      if (wallSet()) return hasWallSet();
    }
    const ref = tileRef(logicalKey);
    if (!ref) return false;
    const s = getSheet(ref.file);
    return !!(s && s.ready);
  }

  function hasWallSet() {
    const set = wallSet();
    if (!set) return false;
    const ref = fileRefForSpriteId(set.first);
    if (!ref) return false;
    const s = getSheet(ref.file);
    return !!(s && s.ready);
  }

  function useForMap() {
    if (!enabled) return false;
    const f = mapFlags();
    const floors = f.floors && (FLOOR_BY_BIOME.some(k => hasTile(k)) || hasTile('dirt'));
    const walls = f.walls && (hasWallSet() || hasTile(WALL_KEY));
    return floors || walls;
  }

  function floorKeyForBiome(bi) {
    const i = bi | 0;
    if (i >= 0 && i < FLOOR_BY_BIOME.length) return FLOOR_BY_BIOME[i];
    return 'cave_floor';
  }

  function floorBlitRef(bi, dirt) {
    if (dirt && tileRef('dirt')) return tileRef('dirt');
    return tileRef(floorKeyForBiome(bi));
  }

  function wallMask(tx, ty, at) {
    const W = (x, y) => at(x, y) === 'wall';
    const n = W(tx, ty - 1);
    const s = W(tx, ty + 1);
    const w = W(tx - 1, ty);
    const e = W(tx + 1, ty);
    return (n ? 1 : 0) | (e ? 2 : 0) | (s ? 4 : 0) | (w ? 8 : 0);
  }

  function wallOffset(mask) {
    const sw = MAP()[WALL_KEY];
    const table = sw && sw.autoMap ? sw.autoMap : WALL_OFFSET_DEFAULT;
    const row = table[mask & 15];
    return row != null ? row : (mask & 15);
  }

  function wallBlitRef(tx, ty, at) {
    const set = wallSet();
    if (set && at) {
      const span = set.last - set.first + 1;
      const off = wallOffset(wallMask(tx, ty, at));
      const spriteId = set.first + Math.min(off, span - 1);
      return fileRefForSpriteId(spriteId);
    }
    return tileRef(WALL_KEY);
  }

  function blitRef(P, ref, ox, oy, destSize) {
    if (!ref) return false;
    const s = getSheet(ref.file);
    if (!s || !s.ready) return false;
    const m = metaFor(ref.file);
    const tileW = m.tileW || 32;
    const tileH = m.tileH || 32;
    const fr = Math.min(ref.frame | 0, (m.frames || 1) - 1);
    const sx = fr * tileW;
    P.blit(s.img, ox, oy, destSize, destSize, tileW, tileH, sx, 0);
    return true;
  }

  function blitFloor(P, bi, ox, oy, destSize, dirt) {
    return blitRef(P, floorBlitRef(bi, dirt), ox, oy, destSize);
  }

  function blitWall(P, ox, oy, destSize, tx, ty, at) {
    if (!mapFlags().walls) return false;
    return blitRef(P, wallBlitRef(tx, ty, at), ox, oy, destSize);
  }

  function preloadRefs(timeout = 12000) {
    const keys = new Set();
    for (const k of [...FLOOR_BY_BIOME, 'dirt']) {
      const ref = tileRef(k);
      if (ref) keys.add(ref.file);
    }
    if (mapFlags().walls) {
      const set = wallSet();
      if (set) {
        for (let id = set.first; id <= set.last; id++) {
          const ref = fileRefForSpriteId(id);
          if (ref) keys.add(ref.file);
        }
      } else {
        const ref = tileRef(WALL_KEY);
        if (ref) keys.add(ref.file);
      }
    }
    for (const file of keys) getSheet(file);
    const list = [...keys];
    return new Promise(resolve => {
      const t0 = performance.now();
      (function tick() {
        const done = list.every(f => {
          const s = sheets.get(f);
          return !s || s.ready || s.failed;
        });
        if (done || performance.now() - t0 > timeout) resolve(done);
        else setTimeout(tick, 40);
      })();
    });
  }

  function enable(on = true) { enabled = !!on; }

  return {
    get enabled() { return enabled; },
    enable,
    useForMap,
    hasTile,
    isReady,
    floorKeyForBiome,
    tileRef,
    fileRefForSpriteId,
    wallMask,
    wallOffset,
    blitFloor,
    blitWall,
    preload: preloadRefs,
    srcFor,
    getSheet
  };
})();
