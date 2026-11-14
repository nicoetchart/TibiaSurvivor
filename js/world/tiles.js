/* ============ tiles.js — pixel art del mundo, pintado en código ============
 * Todo se pinta a resolución de ARTE (16 px por tile) escribiendo en un
 * ImageData, y luego se dibuja escalado ×G.Sprites.PX sin suavizado. Así los
 * tiles comparten tamaño de píxel con los sprites de Mundo Misterioso.
 *
 * Autotiling: cada tile mira a sus 8 vecinos al pintarse (bordes de pared,
 * cara frontal, esquinas redondeadas, espuma de la orilla...).
 */
G.Tiles = (() => {
  const T = 16;                       // píxeles de arte por tile

  const BIOMES = [
    { name: 'Bosque Umbrío', liquid: 'water',
      floor: ['#3e7a39', '#44813d', '#397134'], dirt: ['#7d6742', '#735e3b', '#86704a'],
      speck: '#2f5f2b', light: '#5f9d50', flowers: ['#f4d65c', '#f39ac0', '#eef2ff'],
      wallTop: ['#5d6e49', '#677a50', '#566544'], wallLight: '#88a06e', wallEdge: '#26301f',
      wallFace: ['#3e4934', '#363f2d'], wallFaceDark: '#232a1d',
      liq: '#3b7fc6', liqDeep: '#2c64a6', foam: '#b3defa', shore: '#2b5b2a',
      prop: 'tree', leaf: ['#235a2b', '#2f7535', '#45943f', '#64b252'], trunk: ['#5b3b22', '#7a5130'],
      rock: ['#5e6670', '#7f8893', '#a1aab4'], grass: ['#2f6b2c', '#4c9a3f', '#7cc45a'] },
    { name: 'Cueva Cristal', liquid: 'water',
      floor: ['#4d5778', '#535e81', '#47506f'], dirt: ['#3c4462', '#424a69', '#37405b'],
      speck: '#3b4363', light: '#6a78a4', flowers: ['#8fe3ff', '#c9a6ff', '#7ef0d0'],
      wallTop: ['#5f5089', '#695996', '#56497d'], wallLight: '#a08ddc', wallEdge: '#1f1934',
      wallFace: ['#3f3463', '#382e59'], wallFaceDark: '#221c3a',
      liq: '#2a9cab', liqDeep: '#1d7c8a', foam: '#aaf4f7', shore: '#33405e',
      prop: 'crystal', leaf: ['#5ad1e8', '#8fe7f5', '#c8f7ff', '#ffffff'], trunk: ['#3a4a78', '#4e64a0'],
      rock: ['#555d79', '#737c9c', '#959fc0'], grass: ['#3d5c8a', '#5a86c0', '#8ab8ee'] },
    { name: 'Volcán Ceniza', liquid: 'lava',
      floor: ['#5b4537', '#644c3c', '#533f32'], dirt: ['#403530', '#473b34', '#392f2b'],
      speck: '#47362b', light: '#806452', flowers: ['#ff8d3d', '#ffc45e', '#e06a4a'],
      wallTop: ['#3c3634', '#443d3a', '#35302e'], wallLight: '#625752', wallEdge: '#141110',
      wallFace: ['#2b2624', '#25201f'], wallFaceDark: '#151211',
      liq: '#e45a1f', liqDeep: '#b9401a', foam: '#ffd46a', shore: '#3a2a22',
      prop: 'dead', leaf: ['#4a3a30', '#5e4a3c', '#6f5a49', '#806a58'], trunk: ['#3a2e27', '#52423a'],
      rock: ['#4e4642', '#6a605b', '#877c76'], grass: ['#6b4a2a', '#94693a', '#c4914e'] },
    /* TibiaSurvivor — run neutral (índice 3); superficie, luz natural. PokéSurvivor no lo usa. */
    { name: 'Plains of Havoc', liquid: 'water',
      floor: ['#3a8838', '#40963c', '#348034'], dirt: ['#8a6d4c', '#7f6344', '#735a3c'],
      speck: '#2d6e2a', light: '#5cab50', flowers: ['#e8d070', '#f0ece0', '#c8c060'],
      wallTop: ['#7a8378', '#858e84', '#6f776d'], wallLight: '#9aa894', wallEdge: '#3a4238',
      wallFace: ['#525a50', '#484f46'], wallFaceDark: '#2e3530',
      liq: '#1a5caa', liqDeep: '#0f4580', foam: '#9ec8f0', shore: '#6a5640',
      prop: 'tree', propStyle: 'tibiaSurface',
      leaf: ['#2a6830', '#3a8638', '#52a842', '#78c858'], trunk: ['#5a3e2a', '#7a5638'],
      treeVariants: [
        { leaf: ['#1e5824', '#2a7830', '#3e9038', '#60b050'], trunk: ['#4a3018', '#6a4428'] },
        { leaf: ['#183c1c', '#245024', '#346830', '#487840'], trunk: ['#3e2814', '#5a3820'] },
        { leaf: ['#5a3818', '#7a4c22', '#9a6428', '#b87834'], trunk: ['#4a3018', '#624028'] },
        { leaf: ['#4a2814', '#6a3420', '#8a4428', '#a85432'], trunk: ['#4a3018', '#5c3820'] },
        { leaf: ['#228828', '#308830', '#409838', '#50a848'], trunk: ['#4a3018', '#6a4428'] },
        { leaf: ['#6a3818', '#8a4820', '#a85c28', '#c07034'], trunk: ['#4a2814', '#624028'] }
      ],
      rock: ['#6e7276', '#8a8e92', '#a8acb0'], grass: ['#348830', '#4aa038', '#68b84a'],
      /** PNG cliente Tibia (32×32) → assets/tibia/tiles/{id}.png */
      rockSprites: ['200423', '200428', '200438', '200431'],
      treeSprites: ['202216', '202217', '202219', '202220', '202221', '202222', '202223', '202224', '202225'],
      grassSprites: ['204365', '204366', '204367', '204368', '204371'],
      chestSprites: ['200889', '197986', '197985'],
      bigchestSprite: '200894' },
  ];
  const NORMAL = 3;                   // biomas que se van turnando en una run (0–2)
  const ARENA = 4;                    // a partir de aquí, las arenas de la grieta (índice 3 = Tibia)

  // ---------------- arenas de la grieta ----------------
  /*
   * Cada tipo tiene su arena: paleta, terreno y clima.
   *   liquid   charcos: water (frena) · swamp (frena más) · lava (quema) ·
   *            poison (envenena) · spark (descarga) · ice (resbala)
   *   pools    cuánto terreno es charco (0 = ninguno)
   *   pillars  probabilidad de una columna 2×2 (cobertura) por bloque
   *   props    densidad de árboles / rocas / hierba
   *   weather  clima que trae (ver systems/weather.js) o null
   */
  const ARENA_THEMES = {
    normal:   { name: 'Pradera Eterna', floor: '#6f8a4f', wall: '#8a7f6a', liquid: 'water', liq: '#4f8fd0', prop: 'tree',
                leaf: '#5aa04a', trunk: '#6b4a2a', flowers: ['#f4d65c', '#ffffff', '#f39ac0'], grass: '#5a9a40', rock: '#8a8a8a',
                pools: 0, pillars: 0.035, props: { tree: 0.025, grass: 0.05 }, weather: null },
    fire:     { name: 'Volcán Ígneo', floor: '#5b3a2e', wall: '#3a2826', liquid: 'lava', liq: '#e45a1f', foam: '#ffd46a', prop: 'dead',
                leaf: '#5e4a3c', trunk: '#3a2e27', flowers: ['#ff8d3d', '#ffc45e', '#e06a4a'], grass: '#94693a', rock: '#6a605b',
                pools: 0.31, pillars: 0.03, props: { tree: 0.01 }, weather: 'sun' },
    water:    { name: 'Gruta Marina', floor: '#3c6a80', wall: '#2a4660', liquid: 'water', liq: '#2f86d6', foam: '#bfeaff', prop: 'crystal',
                leaf: '#5fd0e8', trunk: '#2a4a78', flowers: ['#ff9ec4', '#7ef0d0', '#ffffff'], grass: '#3f8a9a', rock: '#5d7a90',
                pools: 0.33, pillars: 0.02, props: { tree: 0.015 }, weather: 'rain' },
    grass:    { name: 'Selva Esmeralda', floor: '#3a7a32', wall: '#4a6a36', liquid: 'swamp', liq: '#4f6b2a', foam: '#9ac25a', prop: 'tree',
                leaf: '#3f9a3a', trunk: '#5b3b22', flowers: ['#f4d65c', '#ff8ad8', '#ffffff'], grass: '#4caa3f', rock: '#6a7a5a',
                pools: 0.22, pillars: 0, props: { tree: 0.05, grass: 0.12 }, weather: null },
    electric: { name: 'Central Voltio', floor: '#4a4840', wall: '#3a3a48', liquid: 'spark', liq: '#e8c020', foam: '#fff6c0', prop: 'crystal',
                leaf: '#ffd23f', trunk: '#5a5030', flowers: ['#ffe14d', '#ffffff', '#7fd0ff'], grass: '#8a8a40', rock: '#70707a',
                pools: 0.28, pillars: 0.04, props: { tree: 0.01 }, weather: 'rain' },
    ice:      { name: 'Glaciar Eterno', floor: '#b8cfe0', wall: '#7f9fc0', liquid: 'ice', liq: '#9fd8f0', foam: '#ffffff', prop: 'crystal',
                leaf: '#bfe8ff', trunk: '#6f8fb0', flowers: ['#ffffff', '#9fe0ff', '#d8f1ff'], grass: '#9fc0d8', rock: '#8fa8c0',
                pools: 0.36, pillars: 0.02, props: { tree: 0.02 }, weather: 'snow' },
    fighting: { name: 'Dojo Ancestral', floor: '#8a6a46', wall: '#5e4232', liquid: 'water', liq: '#4f8fd0', prop: 'tree',
                leaf: '#4f8a3a', trunk: '#5b3b22', flowers: ['#ff5f6d', '#f4d65c', '#ffffff'], grass: '#6a8a40', rock: '#8a7a6a',
                pools: 0, pillars: 0.075, props: { tree: 0.008 }, weather: null },
    poison:   { name: 'Ciénaga Tóxica', floor: '#46384f', wall: '#33263f', liquid: 'poison', liq: '#9a4fc0', foam: '#e0a6ff', prop: 'dead',
                leaf: '#5a4a6a', trunk: '#3a2f45', flowers: ['#c86bdc', '#8bd94a', '#e0a6ff'], grass: '#6a5a8a', rock: '#5a4f6a',
                pools: 0.31, pillars: 0.015, props: { tree: 0.02 }, weather: null },
    ground:   { name: 'Desierto Rojo', floor: '#b08a52', wall: '#8a5e34', liquid: 'swamp', liq: '#9a7a48', foam: '#d6b98a', prop: 'dead',
                leaf: '#8a6a40', trunk: '#6a4a2a', flowers: ['#e06a4a', '#f4d65c', '#ffffff'], grass: '#b0904a', rock: '#9a7a5a',
                pools: 0.25, pillars: 0.04, props: { tree: 0.01, rock: 0.015 }, weather: 'sand' },
    flying:   { name: 'Pico Celeste', floor: '#9fb8d8', wall: '#dfe8f4', liquid: 'water', liq: '#7fb8ff', prop: 'tree',
                leaf: '#e8f2ff', trunk: '#9aa8c0', flowers: ['#ffffff', '#ffe14d', '#bfe0ff'], grass: '#b8d0e8', rock: '#c0ccdc',
                pools: 0, pillars: 0.02, props: { tree: 0.025 }, weather: null },
    psychic:  { name: 'Templo Mental', floor: '#5e4470', wall: '#3e2a55', liquid: 'water', liq: '#8a5ad0', prop: 'crystal',
                leaf: '#ff8ad8', trunk: '#5a3a7a', flowers: ['#ff8ad8', '#c9a6ff', '#ffffff'], grass: '#8a5a9a', rock: '#7a6a8a',
                pools: 0, pillars: 0.045, props: { tree: 0.02 }, weather: null },
    bug:      { name: 'Bosque Colmena', floor: '#5a6a2a', wall: '#5e4a26', liquid: 'swamp', liq: '#6a7a2a', foam: '#c4d65a', prop: 'tree',
                leaf: '#8aaa30', trunk: '#5b3b22', flowers: ['#f4d65c', '#ffffff', '#c4d65a'], grass: '#8aaa30', rock: '#7a7a5a',
                pools: 0.2, pillars: 0, props: { tree: 0.04, grass: 0.12 }, weather: null },
    rock:     { name: 'Cantera Antigua', floor: '#7a6a58', wall: '#55473a', liquid: 'water', liq: '#4f8fd0', prop: 'dead',
                leaf: '#6a5a4a', trunk: '#4a3e32', flowers: ['#c9b28a', '#ffffff', '#a89070'], grass: '#8a7a5a', rock: '#8a7a6a',
                pools: 0, pillars: 0.08, props: { rock: 0.03 }, weather: 'sand' },
    ghost:    { name: 'Cementerio Sombrío', floor: '#383447', wall: '#24202e', liquid: 'water', liq: '#3a3a6a', prop: 'dead',
                leaf: '#4a4060', trunk: '#2e2838', flowers: ['#9a8ad0', '#5fe0c0', '#c9cfdc'], grass: '#4a4a60', rock: '#5a5670',
                pools: 0, pillars: 0.03, props: { tree: 0.03 }, weather: 'fog' },
    dragon:   { name: 'Santuario Dragón', floor: '#363a5e', wall: '#24264a', liquid: 'lava', liq: '#7b5cff', foam: '#c9a6ff', prop: 'crystal',
                leaf: '#7b5cff', trunk: '#2a2a5a', flowers: ['#7b5cff', '#ffd23f', '#ffffff'], grass: '#4a4a8a', rock: '#5a5a8a',
                pools: 0.22, pillars: 0.04, props: { tree: 0.015 }, weather: null },
    dark:     { name: 'Callejón Oscuro', floor: '#2c282e', wall: '#1c181f', liquid: 'water', liq: '#2a2a3a', prop: 'dead',
                leaf: '#3a3040', trunk: '#241e28', flowers: ['#ff5f6d', '#6b5c52', '#9a8a9a'], grass: '#3a343a', rock: '#4a444a',
                pools: 0, pillars: 0.05, props: { tree: 0.02 }, weather: null },
    steel:    { name: 'Fortaleza de Acero', floor: '#6d7888', wall: '#465060', liquid: 'water', liq: '#4f8fd0', prop: 'crystal',
                leaf: '#c9d2de', trunk: '#5d6773', flowers: ['#c9d2de', '#ffd23f', '#ffffff'], grass: '#8a96a6', rock: '#9aa6b5',
                pools: 0, pillars: 0.08, props: { tree: 0.01 }, weather: null },
    fairy:    { name: 'Bosque Encantado', floor: '#4f7f5a', wall: '#7a5a8a', liquid: 'water', liq: '#8fd8ff', foam: '#ffe0f4', prop: 'tree',
                leaf: '#e08ad0', trunk: '#6b4a5a', flowers: ['#ff8ad8', '#ffffff', '#c9a6ff'], grass: '#c48ad8', rock: '#9a8aa8',
                pools: 0.16, pillars: 0, props: { tree: 0.05, grass: 0.1 }, weather: null },
    // La arena de Arceus al minuto 30 (systems/judgment.js): ceniza, ruinas y
    // árboles muertos, con un claro donde aterriza (clear). No es de ninguna grieta.
    judgment: { name: 'Ruinas del Juicio', floor: '#4a4240', wall: '#2e2829', liquid: 'lava', liq: '#e8a82a', foam: '#fff1b8', prop: 'dead',
                leaf: '#3e3633', trunk: '#2a2321', flowers: ['#8a7f76', '#e8a82a', '#5a514c'], grass: '#5e544c', rock: '#6a625c',
                pools: 0, pillars: 0.03, props: { tree: 0.012, rock: 0.02 }, weather: null, clear: 4.5 }
  };
  const ARENA_TYPES = Object.keys(ARENA_THEMES);

  /** Aclara (k>0) u oscurece (k<0) un color. */
  function shade(hex, k) {
    const c = rgb(hex).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /** Paleta completa de bioma a partir de los pocos colores de una arena. */
  function arenaBiome(th) {
    const f = th.floor, w = th.wall, L = th.liq;
    return {
      name: 'Grieta · ' + th.name, liquid: th.liquid,
      floor: [f, shade(f, 0.05), shade(f, -0.06)], dirt: [shade(f, -0.16), shade(f, -0.12), shade(f, -0.2)],
      speck: shade(f, -0.25), light: shade(f, 0.22), flowers: th.flowers,
      wallTop: [w, shade(w, 0.07), shade(w, -0.07)], wallLight: shade(w, 0.32), wallEdge: shade(w, -0.7),
      wallFace: [shade(w, -0.3), shade(w, -0.38)], wallFaceDark: shade(w, -0.55),
      liq: L, liqDeep: shade(L, -0.22), foam: th.foam || shade(L, 0.55), shore: shade(f, -0.32),
      prop: th.prop, leaf: [shade(th.leaf, -0.35), shade(th.leaf, -0.15), th.leaf, shade(th.leaf, 0.3)],
      trunk: [shade(th.trunk, -0.2), th.trunk],
      rock: [shade(th.rock, -0.2), th.rock, shade(th.rock, 0.22)],
      grass: [shade(th.grass, -0.28), th.grass, shade(th.grass, 0.28)]
    };
  }
  for (const t of ARENA_TYPES) BIOMES.push(arenaBiome(ARENA_THEMES[t]));
  BIOMES[ARENA + ARENA_TYPES.indexOf('judgment')].name = ARENA_THEMES.judgment.name;

  // ---------------- utilidades de color / píxel ----------------

  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Empaquetado ABGR (little-endian) para escribir de golpe en un Uint32Array.
  function pack(hex, a = 255) {
    const [r, g, b] = rgb(hex);
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  /** Mezcla dos colores hex y devuelve el empaquetado. */
  function mixPack(h1, h2, t) {
    const a = rgb(h1), b = rgb(h2);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
  }

  /** Lienzo de píxeles: set(x,y,color) y canvas() al final. */
  function Pix(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    const img = c.createImageData(w, h);
    const buf = new Uint32Array(img.data.buffer);
    const overlays = [];
    return {
      w, h,
      set(x, y, col) { if (x >= 0 && y >= 0 && x < w && y < h) buf[y * w + x] = col; },
      get(x, y) { return buf[y * w + x]; },
      blit(image, dx, dy, dw, dh, sw, sh, sx, sy) {
        overlays.push({
          image, dx, dy, dw, dh,
          sw: sw || image.width, sh: sh || image.height,
          sx: sx || 0, sy: sy || 0
        });
      },
      canvas() {
        c.putImageData(img, 0, 0);
        c.imageSmoothingEnabled = false;
        for (const o of overlays) {
          c.drawImage(o.image, o.sx, o.sy, o.sw, o.sh, o.dx, o.dy, o.dw, o.dh);
        }
        return cv;
      }
    };
  }

  const H = (x, y, s) => G.U.hash(x, y, s);

  // ---------------- chunk de suelo ----------------

  /**
   * Pinta un chunk de n×n tiles. `at(tx,ty)` devuelve el tipo de terreno
   * global ('floor' | 'wall' | 'liquid'), así el autotiling ve más allá del
   * borde del chunk.
   */
  /**
   * Máscara de tierra del chunk a resolución de píxel (más una fila por
   * arriba para detectar bordes). El ruido se evalúa cada 4 px y se interpola:
   * ~30 veces menos llamadas que evaluarlo píxel a píxel.
   */
  function dirtMask(gx0, gy0, W, field, seed) {
    const S = 4, gw = W / S + 3;
    const grid = new Float32Array(gw * gw);
    for (let j = 0; j < gw; j++) for (let i = 0; i < gw; i++)
      grid[j * gw + i] = field(gx0 + (i - 1) * S, gy0 + (j - 1) * S);
    const mask = new Uint8Array(W * (W + 1));
    for (let y = -1; y < W; y++) {
      const fy = (y + S) / S, j = Math.floor(fy), v = fy - j;
      for (let x = 0; x < W; x++) {
        const fx = (x + S) / S, i = Math.floor(fx), u = fx - i;
        const a = grid[j * gw + i], b = grid[j * gw + i + 1];
        const c = grid[(j + 1) * gw + i], d = grid[(j + 1) * gw + i + 1];
        let val = (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
        val += (H((gx0 + x) >> 1, (gy0 + y) >> 1, seed + 9) - 0.5) * 0.05;
        mask[(y + 1) * W + x] = val > 0.64 ? 1 : 0;
      }
    }
    // dirtAt(x, y) en coordenadas locales del chunk (y puede ser -1).
    return (x, y) => mask[(y + 1) * W + x] === 1;
  }

  function paintChunk(cx, cy, n, at, dirtField, bi, seed = 0) {
    const B = BIOMES[bi];
    const P = Pix(n * T, n * T);
    const C = {};
    for (const k of ['floor', 'dirt', 'wallTop', 'wallFace', 'flowers', 'grass'])
      C[k] = B[k].map(h => pack(h));
    for (const k of ['speck', 'light', 'wallLight', 'wallEdge', 'wallFaceDark', 'liq', 'liqDeep', 'foam', 'shore'])
      C[k] = pack(B[k]);
    C.liqLight = mixPack(B.liq, B.foam, 0.28);

    const tx0 = cx * n, ty0 = cy * n;
    const dirtAt = dirtMask(tx0 * T, ty0 * T, n * T, dirtField, seed);

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const tx = tx0 + i, ty = ty0 + j;
        const ox = i * T, oy = j * T;
        const kind = at(tx, ty);

        // 1) Suelo bajo todo (las esquinas redondeadas de las paredes lo dejan ver).
        paintFloor(P, C, ox, oy, tx, ty, dirtAt, at, bi);

        if (kind === 'wall') paintWall(P, C, ox, oy, tx, ty, at, bi);
        else if (kind === 'liquid') paintLiquid(P, C, ox, oy, tx, ty, at);
      }
    }
    return P.canvas();
  }

  function paintFloor(P, C, ox, oy, tx, ty, dirtAt, at, bi) {
    const useTibia = G.TibiaTiles && G.TibiaTiles.useForMap();
    if (useTibia) {
      let dirtCount = 0;
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const lx = ox + x, ly = oy + y;
        if (dirtAt(lx, ly)) dirtCount++;
      }
      const dirt = dirtCount > T * T / 2;
      if (G.TibiaTiles.blitFloor(P, bi, ox, oy, T, dirt)) {
        if (at(tx, ty - 1) === 'wall') {
          for (let x = 0; x < T; x++) P.set(ox + x, oy, C.wallFaceDark);
        }
        return;
      }
    }
    let dirtCount = 0;
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        const gx = tx * T + x, gy = ty * T + y;
        const lx = ox + x, ly = oy + y;           // coordenadas locales del chunk
        const dirt = dirtAt(lx, ly);
        if (dirt) dirtCount++;
        const pal = dirt ? C.dirt : C.floor;
        // Tono por ruido suave + tramado por píxel.
        const band = H(gx >> 3, gy >> 3, 11) * 0.7 + H(gx, gy, 12) * 0.5;
        let col = pal[Math.min(pal.length - 1, Math.floor(band * pal.length / 1.2))];
        const r = H(gx, gy, 13);
        if (r < 0.035) col = C.speck;
        else if (r > 0.985) col = C.light;
        // Borde de la tierra: labio oscuro arriba, hierba que la invade abajo.
        if (dirt && !dirtAt(lx, ly - 1)) col = C.speck;
        else if (!dirt && dirtAt(lx, ly - 1) && r < 0.5) col = C.light;
        P.set(ox + x, oy + y, col);
      }
    }
    const dirt = dirtCount > T * T / 2;
    // Sombra de contacto bajo las paredes que hay justo al norte.
    if (at(tx, ty - 1) === 'wall') {
      for (let x = 0; x < T; x++) { P.set(ox + x, oy, C.wallFaceDark); if ((x + ty) % 2) P.set(ox + x, oy + 1, C.speck); }
    }

    // Detalles: matojo, piedrecita o flor.
    const d = H(tx, ty, 14);
    const dx = ox + 3 + Math.floor(H(tx, ty, 15) * 10), dy = oy + 4 + Math.floor(H(tx, ty, 16) * 9);
    if (dirt) {
      if (d < 0.22) { P.set(dx, dy, C.light); P.set(dx + 1, dy, C.light); P.set(dx, dy + 1, C.speck); P.set(dx + 1, dy + 1, C.speck); }
      return;
    }
    if (d < 0.18) {                         // matojo
      P.set(dx, dy, C.light); P.set(dx - 1, dy - 1, C.light); P.set(dx + 1, dy - 1, C.light);
      P.set(dx, dy - 2, C.light); P.set(dx, dy + 1, C.speck);
    } else if (d < 0.26) {                  // flor
      const fc = C.flowers[Math.floor(H(tx, ty, 17) * C.flowers.length)];
      P.set(dx, dy - 1, fc); P.set(dx - 1, dy, fc); P.set(dx + 1, dy, fc); P.set(dx, dy + 1, fc);
      P.set(dx, dy, C.light);
    } else if (d < 0.32) {                  // piedrecita
      P.set(dx, dy, C.light); P.set(dx + 1, dy, C.light); P.set(dx, dy + 1, C.speck); P.set(dx + 1, dy + 1, C.speck);
    }
  }

  function paintWall(P, C, ox, oy, tx, ty, at, bi) {
    if (G.TibiaTiles && G.TibiaTiles.useForMap() && G.TibiaTiles.blitWall(P, ox, oy, T, tx, ty, at)) return;
    const W = (x, y) => at(x, y) === 'wall';
    const n = W(tx, ty - 1), s = W(tx, ty + 1), w = W(tx - 1, ty), e = W(tx + 1, ty);
    const FACE = s ? 0 : 6;                 // filas de cara frontal visibles

    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        // Esquinas redondeadas exteriores: dejan ver el suelo.
        if (!n && !w && x + y < 3) continue;
        if (!n && !e && (T - 1 - x) + y < 3) continue;
        if (!s && !w && x + (T - 1 - y) < 2) continue;
        if (!s && !e && (T - 1 - x) + (T - 1 - y) < 2) continue;

        const gx = tx * T + x, gy = ty * T + y;
        let col;
        if (y >= T - FACE) {
          // Cara frontal: vetas verticales y base oscura.
          const fy = y - (T - FACE);
          col = C.wallFace[(x + (H(gx, 0, 21) < 0.5 ? 0 : 1)) % 3 === 0 ? 1 : 0];
          if (fy === 0) col = C.wallEdge;
          else if (y === T - 1) col = C.wallFaceDark;
          else if (H(gx, gy, 22) < 0.08) col = C.wallFaceDark;
        } else {
          // Cara superior con tramado.
          col = C.wallTop[Math.floor(H(gx >> 1, gy >> 1, 23) * 2.2 + H(gx, gy, 24) * 0.8) % C.wallTop.length];
          if (H(gx, gy, 25) < 0.05) col = C.wallLight;
          // Bordes: luz al norte, contorno oscuro a los lados.
          if (!n && y === 0) col = C.wallEdge;
          else if (!n && y === 1) col = C.wallLight;
          if (!w && x === 0) col = C.wallEdge;
          if (!e && x === T - 1) col = C.wallEdge;
        }
        P.set(ox + x, oy + y, col);
      }
    }
  }

  function paintLiquid(P, C, ox, oy, tx, ty, at) {
    const L = (x, y) => at(x, y) === 'liquid';
    const n = L(tx, ty - 1), s = L(tx, ty + 1), w = L(tx - 1, ty), e = L(tx + 1, ty);
    const nw = L(tx - 1, ty - 1), ne = L(tx + 1, ty - 1), sw = L(tx - 1, ty + 1), se = L(tx + 1, ty + 1);
    const BIG = 99;

    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        // Esquinas exteriores redondeadas: dejan ver el suelo de debajo.
        if (!n && !w && x + y < 3) continue;
        if (!n && !e && (T - 1 - x) + y < 3) continue;
        if (!s && !w && x + (T - 1 - y) < 3) continue;
        if (!s && !e && (T - 1 - x) + (T - 1 - y) < 3) continue;

        // Distancia a la orilla dentro del tile (incluye esquinas interiores).
        let d = Math.min(n ? BIG : y, s ? BIG : T - 1 - y, w ? BIG : x, e ? BIG : T - 1 - x);
        if (n && w && !nw) d = Math.min(d, Math.hypot(x, y) - 0.5);
        if (n && e && !ne) d = Math.min(d, Math.hypot(T - 1 - x, y) - 0.5);
        if (s && w && !sw) d = Math.min(d, Math.hypot(x, T - 1 - y) - 0.5);
        if (s && e && !se) d = Math.min(d, Math.hypot(T - 1 - x, T - 1 - y) - 0.5);

        const gx = tx * T + x, gy = ty * T + y;
        const r = H(gx, gy, 31);
        let col;
        if (d < 1) col = C.shore;                       // labio de tierra
        else if (d < 2) col = C.foam;                   // espuma
        else if (d < 4) col = C.liqLight;               // agua somera
        else if (d < 6) col = r < 0.5 ? C.liq : C.liqLight;
        else col = d < 8 && r < 0.5 ? C.liq : C.liqDeep;
        if (d >= 6 && d < BIG && r < 0.08) col = C.liq;

        // Olas sueltas: rayitas horizontales de 3 px, pocas.
        if (d >= 3 && H(gx >> 2, gy, 33) < 0.045 && (gx & 3) !== 3) col = C.liqLight;
        if (d >= 3 && H(gx, gy, 34) < 0.004) col = C.foam;
        P.set(ox + x, oy + y, col);
      }
    }
  }

  // ---------------- sprites de objetos del escenario ----------------

  const propCache = new Map();          // "bioma/tipo/variante" -> canvas

  function invalidateTibiaPropCache() {
    for (const k of [...propCache.keys()]) {
      if (k.includes('/tree/') || k.includes('/rock/') || k.includes('/grass/')
        || k.includes('/chest/') || k.includes('/bigchest/')) propCache.delete(k);
    }
  }

  function tibiaPropPngReady(B, type, variant) {
    const ids = type === 'tree' ? B.treeSprites : type === 'rock' ? B.rockSprites
      : type === 'grass' ? B.grassSprites : type === 'chest' ? B.chestSprites : null;
    if (type === 'bigchest' && B.bigchestSprite) {
      const s = itemPropSheets.get(String(B.bigchestSprite));
      return !!(s && s.ready);
    }
    if (!ids || !ids.length) return true;
    const shape = type === 'rock' && variant >= 100 ? variant - 100 : variant;
    const id = ids[shape % ids.length];
    const s = type === 'chest'
      ? itemPropSheets.get(String(id))
      : propSheets.get(String(id));
    return !!(s && s.ready);
  }

  function emptyPropCanvas(w = 32, h = 32) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    return cv;
  }

  function propSprite(bi, type, variant = 0) {
    const k = bi + '/' + type + '/' + variant;
    let cv = propCache.get(k);
    if (cv) return cv;
    const B = BIOMES[bi];
    cv = PAINT[type](B, variant);
    if (tibiaPropPngReady(B, type, variant)) propCache.set(k, cv);
    return cv;
  }

  function disc(P, cx, cy, r, colFn) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) { const c = colFn(x, y, d / r); if (c != null) P.set(x, y, c); }
      }
  }

  function outline(P, col) {
    // Contorno de 1 px alrededor de todo lo opaco.
    const marks = [];
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      if (P.get(x, y) >>> 24) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
        const xx = x + a, yy = y + b;
        return xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && (P.get(xx, yy) >>> 24);
      });
      if (near) marks.push([x, y]);
    }
    for (const [x, y] of marks) P.set(x, y, col);
  }

  /** Hierba PNG del cliente (Plains of Havoc). variant = índice en grassSprites. */
  function paintTibiaGrass(B, variant) {
    const ids = B.grassSprites;
    if (!ids || !ids.length) return emptyPropCanvas();
    const sheet = getPropSheet(ids[variant % ids.length]);
    if (!sheet.ready) return emptyPropCanvas();
    const img = sheet.img;
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(img, 0, 0);
    return cv;
  }

  const itemPropSheets = new Map();
  const spellSheets = new Map();

  function getItemPropSheet(id) {
    const key = String(id);
    let s = itemPropSheets.get(key);
    if (s) return s;
    const img = new Image();
    s = { img, ready: false, failed: false, key };
    img.onload = () => {
      s.ready = true;
      invalidateTibiaPropCache();
      if (G.World && G.World.flushChunkImages) G.World.flushChunkImages();
    };
    img.onerror = () => { s.failed = true; };
    img.src = 'assets/tibia/items/' + key + '.png';
    itemPropSheets.set(key, s);
    return s;
  }

  function getSpellSheet(key) {
    const id = String(key);
    let s = spellSheets.get(id);
    if (s) return s;
    const img = new Image();
    s = { img, ready: false, failed: false, key: id, frameW: 32, frameH: 32, stripY: 0, frames: 9 };
    img.onload = () => {
      s.ready = true;
      const w = img.naturalWidth, h = img.naturalHeight;
      if (h >= 48 && w % 64 === 0) {
        s.frameW = 64;
        s.frameH = 64;
        s.stripY = 0;
        s.frames = w / 64;
      } else {
        const tw = FIRE_WAVE_ART_TILE;
        const th = Math.min(tw, h);
        s.frameW = tw;
        s.frameH = th;
        s.stripY = h > th ? h - th : 0;
        s.frames = Math.max(1, Math.floor(w / tw));
      }
    };
    img.onerror = () => { s.failed = true; };
    img.src = 'assets/tibia/spells/' + id + '.png';
    spellSheets.set(id, s);
    return s;
  }

  function paintTibiaItemProp(spriteId) {
    const sheet = getItemPropSheet(spriteId);
    if (!sheet.ready) return emptyPropCanvas();
    const img = sheet.img;
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(img, 0, 0);
    return cv;
  }

  /** Trampas planas Tibia (items strip 32×32): veneno · explosiva. */
  const TRAP_ITEM_TILE = 32;
  const TRAP_ITEM_DRAW_SCALE = 0.75;
  const POISON_TRAP_SHEET = '197955-197960';
  const POISON_TRAP_FRAMES = 6;
  const POISON_TRAP_FPS = 7;
  const EXPLOSIVE_TRAP_SHEET = '200644-200647';
  const EXPLOSIVE_TRAP_FRAMES = 4;
  const EXPLOSIVE_TRAP_FPS = 8;
  const POISON_TRAP_BURST_SHEET = '194164-194175';
  const POISON_TRAP_BURST_FRAMES = 12;
  const POISON_TRAP_BURST_FPS = 14;

  /** Desplaza el dibujo en pantalla (no recorta el PNG); compensa arte Tibia descentrado en la celda. */
  function trapBurstDrawOffX(tileW) {
    const px = G.Sprites && G.Sprites.PX ? G.Sprites.PX : 2;
    const k = px * TRAP_ITEM_DRAW_SCALE;
    const w = tileW * k;
    const frac = tileW >= 48 ? 0.2 : 0.16;
    return -Math.round(w * frac);
  }

  /** Efecto al saltar la trampa de veneno (nube verde 194164–194175). */
  function playPoisonTrapBurst(x, y) {
    if (!G.FX || !G.FX.itemStrip) return;
    const px = G.Sprites && G.Sprites.PX ? G.Sprites.PX : 2;
    const tw = TRAP_ITEM_TILE;
    G.FX.itemStrip(POISON_TRAP_BURST_SHEET, x, y, {
      frames: POISON_TRAP_BURST_FRAMES,
      fps: POISON_TRAP_BURST_FPS,
      tileW: tw,
      tileH: tw,
      stripOffX: trapBurstDrawOffX(tw),
      scale: px * TRAP_ITEM_DRAW_SCALE,
      life: POISON_TRAP_BURST_FRAMES / POISON_TRAP_BURST_FPS,
      fade: false
    });
  }

  const EXPLOSIVE_TRAP_BURST_SHEET = '195409-195410';
  const EXPLOSIVE_TRAP_BURST_FRAMES = 9;
  const EXPLOSIVE_TRAP_BURST_TILE_W = 64;
  const EXPLOSIVE_TRAP_BURST_TILE_H = 64;
  const EXPLOSIVE_TRAP_BURST_FPS = 14;

  /** Efecto al saltar la trampa explosiva (fuego 195409–195410). onFeet: y = pies del personaje. */
  function playExplosiveTrapBurst(x, y, onFeet) {
    if (!G.FX || !G.FX.itemStrip) return;
    const px = G.Sprites && G.Sprites.PX ? G.Sprites.PX : 2;
    const trapH = Math.round(TRAP_ITEM_TILE * px * TRAP_ITEM_DRAW_SCALE);
    const anchorY = onFeet ? y : y + trapH / 2;
    G.FX.itemStrip(EXPLOSIVE_TRAP_BURST_SHEET, x, anchorY, {
      frames: EXPLOSIVE_TRAP_BURST_FRAMES,
      fps: EXPLOSIVE_TRAP_BURST_FPS,
      tileW: EXPLOSIVE_TRAP_BURST_TILE_W,
      tileH: EXPLOSIVE_TRAP_BURST_TILE_H,
      stripY: 0,
      stripAnchor: 'bottom',
      stripOffX: trapBurstDrawOffX(EXPLOSIVE_TRAP_BURST_TILE_W),
      scale: px * TRAP_ITEM_DRAW_SCALE,
      life: EXPLOSIVE_TRAP_BURST_FRAMES / EXPLOSIVE_TRAP_BURST_FPS,
      fade: false
    });
  }

  /** Un fotograma de strip en items/ (FX en mundo). */
  function drawItemStripFrame(ctx, sheetKey, frame, x, y, scale, frames, tileW, tileH, alpha,
      srcY = 0, anchor = 'center', offX = 0, offY = 0) {
    const sheet = getItemPropSheet(sheetKey);
    const img = sheet && sheet.img;
    if (!sheet || !sheet.ready || !img) return false;
    const maxFr = Math.floor(img.naturalWidth / tileW);
    if (maxFr < 1 || img.naturalHeight < srcY + tileH) return false;
    const fr = Math.min(maxFr - 1, Math.max(0, frame | 0));
    const w = Math.round(tileW * scale), h = Math.round(tileH * scale);
    if (!(w > 0) || !(h > 0)) return false;
    const dy = (anchor === 'bottom' ? Math.round(y - h) : Math.round(y - h / 2)) + offY;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (alpha < 1) ctx.globalAlpha = alpha;
    try {
      ctx.drawImage(img, fr * tileW, srcY, tileW, tileH,
        Math.round(x - w / 2 + offX), dy, w, h);
    } catch (e) {
      ctx.restore();
      return false;
    }
    ctx.restore();
    return true;
  }

  /** Fire Wave — strip spells/firewave.png (9×64×64; arte lógico 32×32 al 75 %). */
  const FIRE_WAVE_SHEET = 'firewave';
  const FIRE_WAVE_ART_TILE = 32;
  /** Escala del sprite en pantalla (32 art × PX × DRAW_MUL). */
  const FIRE_WAVE_DRAW_MUL = 1.75;
  /** Paso del cono (32 art × PX × GRID_MUL); independiente de DRAW_MUL. */
  const FIRE_WAVE_GRID_MUL = 0.65;
  const FIRE_WAVE_FPS = 10;

  function fireWavePx() {
    return G.Sprites && G.Sprites.PX ? G.Sprites.PX : 2;
  }

  /** Tamaño dibujado de una llama (32 art × PX × DRAW_MUL). */
  function fireWaveVisualWorld() {
    return FIRE_WAVE_ART_TILE * fireWavePx() * FIRE_WAVE_DRAW_MUL;
  }

  /** Separación entre centros del patrón (cono / hitbox); solo GRID_MUL, no DRAW_MUL. */
  function fireWaveCellWorld() {
    return FIRE_WAVE_ART_TILE * fireWavePx() * FIRE_WAVE_GRID_MUL;
  }

  /** Solo desplazamiento en pantalla (PNG 64×64 completo; arte descentrado en la celda). */
  function fireWaveStripOffX(scale, tileW) {
    const w = Math.round(tileW * scale);
    const frac = tileW >= 48 ? 0.27 : 0.16;
    return -Math.round(w * frac);
  }

  function fireWaveStripMeta(sheet) {
    const tw = (sheet && sheet.frameW) || 64;
    const th = (sheet && sheet.frameH) || 64;
    const frames = (sheet && sheet.frames) || 9;
    const stripY = (sheet && sheet.stripY) || 0;
    const scale = fireWaveVisualWorld() / tw;
    return {
      tileW: tw, tileH: th, stripY, frames, scale, fps: FIRE_WAVE_FPS,
      stripOffX: fireWaveStripOffX(scale, tw)
    };
  }

  /** Un fotograma de strip en spells/ (FX en mundo). */
  function drawSpellStripFrame(ctx, sheetKey, frame, x, y, scale, frames, tileW, tileH, alpha,
      srcY = 0, anchor = 'center', offX = 0, offY = 0) {
    const sheet = getSpellSheet(sheetKey);
    const img = sheet && sheet.img;
    if (!sheet || !sheet.ready || !img) return false;
    const maxFr = Math.floor(img.naturalWidth / tileW);
    if (maxFr < 1 || img.naturalHeight < srcY + tileH) return false;
    const fr = Math.min(maxFr - 1, Math.max(0, frame | 0));
    const w = Math.round(tileW * scale), h = Math.round(tileH * scale);
    if (!(w > 0) || !(h > 0)) return false;
    const dy = (anchor === 'bottom' ? Math.round(y - h) : Math.round(y - h / 2)) + offY;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (alpha < 1) ctx.globalAlpha = alpha;
    try {
      ctx.drawImage(img, fr * tileW, srcY, tileW, tileH,
        Math.round(x - w / 2 + offX), dy, w, h);
    } catch (e) {
      ctx.restore();
      return false;
    }
    ctx.restore();
    return true;
  }

  const HELLS_CORE_SHEET = '195395-195408';
  const HELLS_CORE_TILE = 64;
  const HELLS_CORE_SHEET_FRAMES = 14;
  const HELLS_CORE_ANIM_SKIP = 1;
  const HELLS_CORE_ANIM_FRAMES = HELLS_CORE_SHEET_FRAMES - HELLS_CORE_ANIM_SKIP;
  const HELLS_CORE_FPS = 12;

  /** Mismo paso y escala por sqm que Fire Wave (centra rejilla + sprite en el patrón). */
  function hellsCoreCellWorld() {
    return fireWaveCellWorld();
  }

  function hellsCoreStripMeta(sheet) {
    const tw = (sheet && sheet.frameW) || HELLS_CORE_TILE;
    const th = (sheet && sheet.frameH) || HELLS_CORE_TILE;
    const maxFr = sheet && sheet.ready && sheet.img
      ? Math.floor(sheet.img.naturalWidth / tw) : HELLS_CORE_SHEET_FRAMES;
    const frames = Math.min(HELLS_CORE_ANIM_FRAMES, Math.max(1, maxFr - HELLS_CORE_ANIM_SKIP));
    const stripY = (sheet && sheet.stripY) || 0;
    const scale = fireWaveVisualWorld() / tw;
    const step = hellsCoreCellWorld();
    const drawH = Math.round(th * scale);
    return {
      tileW: tw, tileH: th, stripY, frames, scale, fps: HELLS_CORE_FPS,
      stripFrame0: HELLS_CORE_ANIM_SKIP,
      stripOffX: fireWaveStripOffX(scale, tw),
      stripOffY: Math.round((drawH - step) * 0.48),
      life: frames / HELLS_CORE_FPS
    };
  }

  function playHellsCoreCell(x, y) {
    if (!G.FX || !G.FX.itemStrip) return;
    const sheet = getSpellSheet(HELLS_CORE_SHEET);
    const emit = () => {
      if (sheet.failed) return;
      const m = hellsCoreStripMeta(sheet);
      G.FX.itemStrip(HELLS_CORE_SHEET, x, y, {
        tibiaStripDir: 'spells',
        frames: m.frames,
        fps: m.fps,
        tileW: m.tileW,
        tileH: m.tileH,
        stripY: m.stripY,
        stripAnchor: 'bottom',
        stripOffX: m.stripOffX,
        stripOffY: m.stripOffY,
        stripFrame0: m.stripFrame0,
        scale: m.scale,
        life: m.life,
        fade: false
      });
    };
    if (sheet.ready) emit();
    else if (!sheet.failed) sheet.img.addEventListener('load', emit, { once: true });
  }

  function playFireWaveCell(x, y) {
    if (!G.FX || !G.FX.itemStrip) return;
    const sheet = getSpellSheet(FIRE_WAVE_SHEET);
    const emit = () => {
      if (sheet.failed) return;
      const m = fireWaveStripMeta(sheet);
      G.FX.itemStrip(FIRE_WAVE_SHEET, x, y, {
        tibiaStripDir: 'spells',
        frames: m.frames,
        fps: m.fps,
        tileW: m.tileW,
        tileH: m.tileH,
        stripY: m.stripY,
        stripAnchor: 'bottom',
        stripOffX: m.stripOffX,
        scale: m.scale,
        life: m.frames / m.fps,
        fade: false
      });
    };
    if (sheet.ready) emit();
    else if (!sheet.failed) sheet.img.addEventListener('load', emit, { once: true });
  }

  /** Radio para pisar (mitad del sprite dibujado: 32×PX×0,75). */
  function tibiaFlatTrapStepRadius() {
    const px = G.Sprites && G.Sprites.PX ? G.Sprites.PX : 2;
    return Math.round((TRAP_ITEM_TILE / 2) * px * TRAP_ITEM_DRAW_SCALE);
  }

  function poisonTrapStepRadius() { return tibiaFlatTrapStepRadius(); }

  /** 0 veneno · 2 explosiva usan strip Tibia; 1 pegajosa = procedural 14×14. */
  function trapStepRadius(p) {
    if (!p || p.type !== 'trap') return 9;
    return (p.kind === 0 || p.kind === 2) ? tibiaFlatTrapStepRadius() : 13;
  }

  function drawTrapItemAnim(ctx, p, t, scale, sheetKey, frames, fps) {
    const sheet = getItemPropSheet(sheetKey);
    const img = sheet && sheet.img;
    const tw = TRAP_ITEM_TILE, th = TRAP_ITEM_TILE;
    if (!sheet || !sheet.ready || !img || img.naturalWidth < frames * tw
        || img.naturalHeight < th) return false;
    const fr = Math.floor(t * fps + (p.wiggle || 0)) % frames;
    const k = (scale || 0) * TRAP_ITEM_DRAW_SCALE;
    const w = Math.round(tw * k), h = Math.round(th * k);
    if (!(w > 0) || !(h > 0) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    try {
      ctx.drawImage(img, fr * tw, 0, tw, th,
        Math.round(p.x - w / 2), Math.round(p.y - 8 - h / 2), w, h);
    } catch (e) {
      ctx.restore();
      return false;
    }
    ctx.restore();
    return true;
  }

  function drawTrapPoisonTibia(ctx, p, t, scale) {
    return drawTrapItemAnim(ctx, p, t, scale, POISON_TRAP_SHEET, POISON_TRAP_FRAMES, POISON_TRAP_FPS);
  }

  function drawTrapExplosiveTibia(ctx, p, t, scale) {
    return drawTrapItemAnim(ctx, p, t, scale, EXPLOSIVE_TRAP_SHEET, EXPLOSIVE_TRAP_FRAMES, EXPLOSIVE_TRAP_FPS);
  }

  /** Árbol PNG del cliente (Plains of Havoc). Sin fallback procedural. */
  function paintTibiaTree(B, variant) {
    const ids = B.treeSprites;
    if (!ids || !ids.length) return emptyPropCanvas();
    const sheet = getPropSheet(ids[variant % ids.length], 'tree');
    if (!sheet.ready) return emptyPropCanvas();
    const img = sheet.img;
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(img, 0, 0);
    return cv;
  }

  /** Árbol / arbusto procedural (fallback). variant 4 = arbusto. */
  function paintTibiaTreeProc(B, variant) {
    const v = variant % 6;
    const nVar = B.treeVariants ? B.treeVariants.length : 1;
    const tv = B.treeVariants ? B.treeVariants[v % nVar] : null;
    const L = (tv ? tv.leaf : B.leaf).map(h => pack(h));
    const Tr = (tv && tv.trunk ? tv.trunk : B.trunk).map(h => pack(h));
    const edge = pack('#1a2814');

    function canopyDisc(P, blobs, seedOff) {
      for (const [bx, by, br] of blobs) {
        disc(P, bx, by, br, (x, y, d) => {
          const lit = ((x - bx) * -0.6 + (y - by) * -0.85) / br;
          const idx = lit > 0.42 ? 3 : lit > 0.02 ? 2 : lit > -0.42 ? 1 : 0;
          return (H(x, y, seedOff) < 0.11 && idx > 0) ? L[idx - 1] : L[idx];
        });
      }
    }

    function drawTrunk(P, l, r, top, foot) {
      for (let y = foot - top; y <= foot; y++) {
        for (let x = l; x <= r; x++) P.set(x, y, (x === l || x === r || y === foot) ? Tr[0] : Tr[1]);
      }
      P.set(l - 1, foot, Tr[0]); P.set(r + 1, foot, Tr[0]);
    }

    if (v === 4) {
      const P = Pix(26, 26);
      const foot = P.h - 1;
      drawTrunk(P, 11, 14, 5, foot);
      canopyDisc(P, [[13, 14, 10]], 440);
      outline(P, edge);
      return P.canvas();
    }

    const compact = v === 5;
    const P = Pix(compact ? 28 : 32, compact ? 36 : 42);
    const foot = P.h - 1;
    const shapes = {
      0: { l: 11, r: 19, top: 14, blobs: [[16, 20, 12], [8, 24, 8], [23, 24, 8], [16, 11, 7]] },
      1: { l: 13, r: 17, top: 16, blobs: [[16, 19, 10], [16, 9, 6], [10, 22, 5], [22, 22, 5]] },
      2: { l: 11, r: 19, top: 13, blobs: [[16, 21, 11], [7, 25, 7], [24, 25, 7], [15, 12, 6]] },
      3: { l: 12, r: 18, top: 13, blobs: [[16, 20, 11], [9, 24, 8], [23, 24, 8]] },
      5: { l: 13, r: 17, top: 11, blobs: [[16, 22, 9], [11, 25, 6], [21, 25, 6]] }
    };
    const sh = shapes[v] || shapes[0];
    drawTrunk(P, sh.l, sh.r, sh.top, foot);
    canopyDisc(P, sh.blobs, 400 + v);
    outline(P, edge);
    return P.canvas();
  }

  const propSheets = new Map();

  function propSheetSrc(id) { return `assets/tibia/tiles/${id}.png`; }

  function getPropSheet(id) {
    const key = String(id);
    let s = propSheets.get(key);
    if (s) return s;
    const img = new Image();
    s = { img, ready: false, failed: false, key };
    img.onload = () => {
      s.ready = true;
      invalidateTibiaPropCache();
      if (G.World && G.World.flushChunkImages) G.World.flushChunkImages();
    };
    img.onerror = () => { s.failed = true; };
    img.src = propSheetSrc(key);
    propSheets.set(key, s);
    return s;
  }

  function biomePropSpriteIds(B) {
    if (!B) return [];
    const items = [...(B.chestSprites || [])];
    if (B.bigchestSprite) items.push(B.bigchestSprite);
    return [...(B.rockSprites || []), ...(B.treeSprites || []), ...(B.grassSprites || []), ...items];
  }

  function preloadRockSprites(biomeIndex, timeout = 12000) {
    const B = BIOMES[biomeIndex];
    const tileIds = [...(B.rockSprites || []), ...(B.treeSprites || []), ...(B.grassSprites || [])];
    const itemIds = [...(B.chestSprites || [])];
    if (B.bigchestSprite) itemIds.push(B.bigchestSprite);
  const ids = [...tileIds, ...itemIds];
    if (!ids.length) return Promise.resolve(true);
    for (const id of tileIds) getPropSheet(id);
    for (const id of itemIds) getItemPropSheet(id);
    getItemPropSheet(POISON_TRAP_SHEET);
    getItemPropSheet(EXPLOSIVE_TRAP_SHEET);
    getItemPropSheet(POISON_TRAP_BURST_SHEET);
    getItemPropSheet(EXPLOSIVE_TRAP_BURST_SHEET);
    return new Promise(resolve => {
      const t0 = performance.now();
      (function tick() {
        const sheetReady = id => {
          const s = propSheets.get(String(id)) || itemPropSheets.get(String(id));
          return !s || s.ready || s.failed;
        };
        const done = ids.every(sheetReady);
        if (done || performance.now() - t0 > timeout) {
          if (done) invalidateTibiaPropCache();
          resolve(done);
        } else setTimeout(tick, 40);
      })();
    });
  }

  /** Fallback procedural si el PNG aún no cargó. +100 = dañado. */
  function paintTibiaRockProc(B, variant) {
    const damaged = variant >= 100;
    const shape = damaged ? variant - 100 : variant;
    const R = B.rock.map(h => pack(h));
    const hi = pack('#c4c8cc');
    const edge = pack('#282a2e');
    const dark = pack('#3a3c40');
    const specs = [
      { w: 28, h: 21, cx: 13.5, cy: 10.5, rx: 11, ry: 8.5, hi: [[4, 3], [5, 3], [6, 3], [4, 4], [5, 4], [6, 4], [7, 4], [5, 5], [6, 5]] },
      { w: 32, h: 18, cx: 16, cy: 10, rx: 14, ry: 7, hi: [[5, 3], [6, 3], [7, 3], [5, 4], [6, 4], [8, 4]] },
      { w: 22, h: 26, cx: 11, cy: 13, rx: 8, ry: 11.5, hi: [[3, 4], [4, 4], [5, 4], [3, 5], [4, 5]] },
      { w: 20, h: 15, cx: 10, cy: 9, rx: 8, ry: 6.5, hi: [[3, 2], [4, 2], [5, 2], [4, 3]] }
    ];
    const sp = specs[shape % specs.length];
    const P = Pix(sp.w, sp.h);
    for (let y = 0; y < sp.h; y++) {
      for (let x = 0; x < sp.w; x++) {
        const nx = (x - sp.cx) / sp.rx, ny = (y - sp.cy) / sp.ry;
        const d = nx * nx + ny * ny + (H(x, y, 61 + shape) - 0.5) * 0.07;
        if (d > 1) continue;
        const lit = -nx * 0.68 - ny * 0.78 + (H(x, y, 62 + shape) - 0.5) * 0.2;
        let c = R[lit > 0.38 ? 2 : lit > -0.18 ? 1 : 0];
        if (y >= sp.h - 2) c = R[0];
        P.set(x, y, c);
      }
    }
    for (const [x, y] of sp.hi) { if (P.get(x, y) >>> 24) P.set(x, y, hi); }
    if (damaged) {
      const crack = [[sp.cx | 0, 3], [sp.cx | 0, 4], [(sp.cx + 1) | 0, 5], [sp.cx | 0, 6], [(sp.cx - 1) | 0, 7],
        [sp.cx | 0, 8], [(sp.cx + 1) | 0, 9], [sp.cx | 0, 10]];
      crack.forEach(([x, y]) => { if (x >= 0 && y >= 0 && x < sp.w && y < sp.h) P.set(x, y, dark); });
    } else {
      [[sp.cx + 2, sp.cy + 2], [sp.cx + 3, sp.cy + 3]].forEach(([x, y]) => {
        if (x >= 0 && y >= 0 && x < sp.w && y < sp.h && (P.get(x, y) >>> 24)) P.set(x, y, R[0]);
      });
    }
    outline(P, edge);
    return P.canvas();
  }

  /** Rocas Tibia reales (PNG); misma colocación procedural que antes. +100 = dañado. */
  function paintTibiaRock(B, variant) {
    const damaged = variant >= 100;
    const shape = damaged ? variant - 100 : variant;
    const ids = B.rockSprites;
    if (ids && ids.length) {
      const sheet = getPropSheet(ids[shape % ids.length]);
      if (sheet.ready) {
        const img = sheet.img;
        const w = img.width, h = img.height;
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const c = cv.getContext('2d');
        c.imageSmoothingEnabled = false;
        c.drawImage(img, 0, 0);
        if (damaged) {
          c.strokeStyle = '#1a1c20';
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(w * 0.48, 3);
          c.lineTo(w * 0.52, h * 0.12);
          c.lineTo(w * 0.46, h * 0.28);
          c.lineTo(w * 0.54, h * 0.45);
          c.stroke();
        }
        return cv;
      }
    }
    if (ids && ids.length) return emptyPropCanvas();
    return paintTibiaRockProc(B, variant);
  }

  const PAINT = {
    tree(B, variant = 0) {
      if (B.treeSprites && B.treeSprites.length) return paintTibiaTree(B, variant);
      const P = Pix(30, 40);
      const nVar = B.treeVariants ? B.treeVariants.length : 1;
      const tv = B.treeVariants ? B.treeVariants[variant % nVar] : null;
      const L = (tv ? tv.leaf : B.leaf).map(h => pack(h));
      const Tr = (tv && tv.trunk ? tv.trunk : B.trunk).map(h => pack(h));
      const edge = pack('#14200f');
      if (B.prop === 'crystal') return PAINT.crystal(B);
      if (B.prop === 'dead') return PAINT.deadtree(B);
      for (let y = 26; y < 38; y++) for (let x = 13; x < 18; x++) P.set(x, y, Tr[x === 13 || x === 17 ? 0 : 1]);
      P.set(12, 37, Tr[0]); P.set(18, 37, Tr[0]); P.set(11, 38, Tr[0]); P.set(19, 38, Tr[0]);
      const blobs = [[15, 20, 10], [9, 16, 7], [21, 16, 7], [15, 10, 8], [10, 23, 6], [20, 23, 6]];
      for (const [bx, by, br] of blobs) {
        disc(P, bx, by, br, (x, y, d) => {
          // Luz desde arriba a la izquierda.
          const lit = ((x - bx) * -0.6 + (y - by) * -0.8) / br;
          const idx = lit > 0.45 ? 3 : lit > 0.05 ? 2 : lit > -0.45 ? 1 : 0;
          return (H(x, y, 41) < 0.12 && idx > 0) ? L[idx - 1] : L[idx];
        });
      }
      outline(P, edge);
      return P.canvas();
    },

    crystal(B) {
      const P = Pix(26, 40);
      const L = B.leaf.map(h => pack(h)), D = B.trunk.map(h => pack(h));
      const spires = [[13, 2, 5, 38], [7, 14, 4, 38], [19, 12, 4, 38]];
      for (const [cx, top, half, bot] of spires) {
        for (let y = top; y <= bot; y++) {
          const t = Math.min(1, (y - top) / 8);
          const hw = Math.round(half * t);
          for (let x = cx - hw; x <= cx + hw; x++) {
            const side = x < cx ? (x === cx - hw ? 3 : 2) : x === cx ? 1 : 0;
            P.set(x, y, side >= 2 ? L[side] : y > bot - 4 ? D[1] : L[side]);
          }
        }
      }
      outline(P, D[0]);
      return P.canvas();
    },

    deadtree(B) {
      const P = Pix(28, 40);
      const Tr = B.trunk.map(h => pack(h)), L = B.leaf.map(h => pack(h));
      for (let y = 12; y < 38; y++) for (let x = 12; x < 16; x++) P.set(x, y, Tr[x < 14 ? 0 : 1]);
      const branch = (x0, y0, dx, len) => {
        for (let i = 0; i < len; i++) { P.set(x0 + dx * i, y0 - i, L[1]); P.set(x0 + dx * i, y0 - i + 1, L[0]); }
      };
      branch(12, 20, -1, 9); branch(15, 17, 1, 10); branch(13, 13, -1, 7); branch(14, 12, 1, 6);
      outline(P, pack('#0f0b09'));
      return P.canvas();
    },

    rock(B, variant) {
      if (B.propStyle === 'tibiaSurface') return paintTibiaRock(B, variant);
      const P = Pix(22, 17);
      const R = B.rock.map(h => pack(h));
      const shine = pack('#ffffff');
      // Peñasco achatado: elipse más ancha que alta, base plana.
      for (let y = 2; y <= 15; y++) for (let x = 1; x <= 20; x++) {
        const nx = (x - 10.5) / 9.5, ny = (y - 9.5) / 7;
        const d = nx * nx + ny * ny + (H(x, y, 61) - 0.5) * 0.08;
        if (d > 1) continue;
        const lit = -nx * 0.55 - ny * 0.85 + (H(x, y, 62) - 0.5) * 0.25;
        let c = R[lit > 0.4 ? 2 : lit > -0.15 ? 1 : 0];
        if (y >= 14) c = R[0];
        P.set(x, y, c);
      }
      // Brillo y textura.
      [[6, 5], [7, 5], [6, 6], [8, 4]].forEach(([x, y]) => P.set(x, y, shine));
      [[13, 8], [14, 9], [9, 11], [16, 11], [11, 7]].forEach(([x, y]) => P.set(x, y, R[0]));
      // Grietas en la variante dañada.
      if (variant === 1) {
        const dark = pack('#1b1d22');
        [[9, 4], [10, 5], [10, 6], [11, 7], [10, 8], [12, 8], [13, 9], [8, 9], [7, 10]].forEach(([x, y]) => P.set(x, y, dark));
      }
      outline(P, pack('#17191d'));
      return P.canvas();
    },

    grass(B, variant) {
      if (B.grassSprites && B.grassSprites.length) return paintTibiaGrass(B, variant);
      // Matojo de hojas en abanico: cada hoja es una curva que se inclina
      // hacia fuera, con la base oscura y la punta clara. La variante 1 es el
      // fotograma "mecido por el viento".
      const P = Pix(20, 17);
      const Gc = B.grass.map(h => pack(h));
      const dark = pack(B.speck);
      const sway = variant === 1 ? 1.2 : 0;
      const blades = 11;
      // Primero las de atrás (más oscuras), luego las de delante.
      for (let pass = 0; pass < 2; pass++) {
        for (let b = pass; b < blades; b += 2) {
          const t = b / (blades - 1);                     // 0 izquierda .. 1 derecha
          const x0 = 3 + t * 13 + (H(b, 7, 52) - 0.5) * 2;
          const hgt = 8 + Math.floor(H(b, 3, 51) * 6) + (Math.abs(t - 0.5) < 0.25 ? 3 : 0);
          const lean = (t - 0.5) * 7 + sway * (0.6 + H(b, 1, 53));
          for (let i = 0; i <= hgt; i++) {
            const k = i / hgt;
            const x = Math.round(x0 + lean * k * k);
            const y = 16 - i;
            let c = k > 0.78 ? Gc[2] : k > 0.25 ? Gc[1] : Gc[0];
            if (pass === 0 && k <= 0.78) c = Gc[0];
            P.set(x, y, c);
            if (i < hgt * 0.45) P.set(x + 1, y, k < 0.15 ? dark : Gc[0]);
          }
        }
      }
      outline(P, pack('#0e1d0c'));
      return P.canvas();
    },

    // ---------- objetos interactivos ----------

    /** Altar de poder. variante = efecto*2 + (usado ? 1 : 0). */
    altar(B, variant) {
      const P = Pix(18, 27);
      const R = B.rock.map(h => pack(h));
      const eff = variant >> 1, used = variant & 1;
      const ORB = [['#ff5f6d', '#c23a4b', '#ffd3d8'], ['#5fd4ff', '#2a8fd0', '#d8f6ff'],
                   ['#ff8ad8', '#b03d84', '#ffe0f4'], ['#ffd23f', '#c08a10', '#fff3b0']][eff];
      const O = (used ? ['#6b7380', '#4a505c', '#9aa2ae'] : ORB).map(h => pack(h));
      // Escalones, columna y losa.
      for (let y = 21; y <= 25; y++) for (let x = 1; x <= 16; x++) P.set(x, y, R[y === 21 ? 2 : y >= 24 ? 0 : 1]);
      for (let y = 12; y <= 20; y++) for (let x = 5; x <= 12; x++) P.set(x, y, R[x === 5 ? 2 : x >= 11 ? 0 : 1]);
      for (let y = 10; y <= 11; y++) for (let x = 3; x <= 14; x++) P.set(x, y, R[y === 10 ? 2 : 1]);
      // Runas de su color en la columna.
      [[7, 14], [8, 15], [10, 14], [9, 17], [7, 18], [10, 18]].forEach(([x, y]) => P.set(x, y, O[1]));
      // Orbe.
      disc(P, 8.5, 5.5, 4.2, (x, y, d) => {
        const lit = (8.5 - x) * 0.5 + (5.5 - y) * 0.7;
        return lit > 1.6 ? O[2] : d > 0.75 ? O[1] : O[0];
      });
      outline(P, pack('#120e1a'));
      return P.canvas();
    },

    /** Manantial curativo. variante 1 = agotado. */
    spring(B, variant) {
      const P = Pix(34, 16);
      const R = B.rock.map(h => pack(h));
      const W = (variant ? ['#2f5f68', '#3a6f7a', '#4f8a92'] : ['#2ba8b8', '#5fe8d8', '#b8fff4']).map(h => pack(h));
      for (let y = 0; y < 16; y++) for (let x = 0; x < 34; x++) {
        const nx = (x - 16.5) / 16.5, ny = (y - 8) / 7.5;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        if (d > 0.62) { P.set(x, y, R[(H(x, y, 71) < 0.5 ? 1 : 0) + (ny < -0.2 ? 1 : 0)]); continue; }
        const wave = Math.sin(x * 0.7 + y * 1.3) > 0.6;
        P.set(x, y, d < 0.18 ? W[2] : wave ? W[2] : d < 0.4 ? W[1] : W[0]);
      }
      if (!variant) [[10, 6], [11, 5], [22, 9], [23, 8], [16, 11]].forEach(([x, y]) => P.set(x, y, pack('#ffffff')));
      outline(P, pack('#14161c'));
      return P.canvas();
    },

    bigchest(B, variant) {
      if (B && B.bigchestSprite) return paintTibiaItemProp(B.bigchestSprite);
      return PAINT._bigchestProc();
    },
    /** Cofre grande con candado (procedural). */
    _bigchestProc() {
      const P = Pix(24, 20);
      const wood = pack('#6b3a1e'), woodL = pack('#8e5329'), woodD = pack('#432210');
      const iron = pack('#9aa6b5'), ironD = pack('#5d6773'), gold = pack('#f2c443'), goldD = pack('#b5832a');
      for (let y = 2; y < 19; y++) for (let x = 1; x < 23; x++) {
        let c = y < 8 ? woodL : wood;
        if (y === 8 || y === 9) c = ironD;
        if (x === 1 || x === 22 || y === 18) c = woodD;
        if (x === 5 || x === 6 || x === 17 || x === 18) c = (x === 5 || x === 17) ? iron : ironD;
        if (y === 2 && x > 1 && x < 22) c = iron;
        P.set(x, y, c);
      }
      // Candado.
      for (let x = 10; x <= 13; x++) { P.set(x, 5, iron); }
      P.set(9, 6, iron); P.set(14, 6, iron); P.set(9, 7, iron); P.set(14, 7, iron);
      for (let y = 8; y <= 13; y++) for (let x = 8; x <= 15; x++) P.set(x, y, (x + y) % 4 ? gold : goldD);
      P.set(11, 10, woodD); P.set(12, 10, woodD); P.set(11, 11, woodD); P.set(11, 12, woodD);
      outline(P, pack('#1e0f06'));
      return P.canvas();
    },

    /** Trampa de Mundo Misterioso. variante: 0 veneno · 1 pegajosa · 2 explosiva. */
    trap(B, variant) {
      const P = Pix(14, 14);
      const COL = [['#b45ec4', '#e6a3f0'], ['#8bd94a', '#d2ff9a'], ['#ff7b3d', '#ffd08a']][variant];
      const c = pack(COL[0]), l = pack(COL[1]);
      const base = pack('#2a2238'), baseL = pack('#3b3150');
      for (let y = 1; y < 13; y++) for (let x = 1; x < 13; x++) {
        const edge = x === 1 || y === 1 || x === 12 || y === 12;
        P.set(x, y, edge ? c : (x + y) % 2 ? base : baseL);
      }
      const sym = [
        // veneno: calavera de puntos
        [[5, 4], [6, 4], [7, 4], [8, 4], [4, 5], [9, 5], [4, 6], [6, 6], [7, 6], [9, 6], [5, 7], [8, 7], [5, 8], [6, 8], [7, 8], [8, 8], [5, 9], [8, 9]],
        // pegajosa: gotas
        [[4, 4], [4, 5], [3, 6], [5, 6], [4, 7], [8, 5], [8, 6], [7, 7], [9, 7], [8, 8], [6, 9], [5, 10], [7, 10], [6, 11]],
        // explosiva: mina
        [[6, 3], [7, 3], [5, 4], [8, 4], [4, 5], [9, 5], [4, 6], [6, 6], [7, 6], [9, 6], [4, 7], [6, 7], [7, 7], [9, 7], [4, 8], [9, 8], [5, 9], [8, 9], [6, 10], [7, 10]]
      ][variant];
      for (const [x, y] of sym) P.set(x, y, l);
      outline(P, pack('#0c0812'));
      return P.canvas();
    },

    /** Grieta hacia la arena del legendario. variante = fotograma 0..3. */
    rift(B, variant) {
      const P = Pix(30, 46);
      const glow = pack('#7b3cff'), mid = pack('#b48aff'), core = pack('#140a26'), white = pack('#f2e6ff');
      for (let y = 2; y < 44; y++) {
        const t = (y - 2) / 42;
        const w = Math.sin(t * Math.PI) * 9 + 1;
        const off = Math.round(Math.sin(t * 9 + variant * 1.6) * 2.2 + (H(y, variant, 91) - 0.5) * 2);
        for (let x = -Math.ceil(w) - 2; x <= Math.ceil(w) + 2; x++) {
          const ax = Math.abs(x) / w;
          const px = 15 + x + off;
          if (ax <= 0.45) P.set(px, y, core);
          else if (ax <= 0.75) P.set(px, y, H(px, y, 92 + variant) < 0.15 ? white : mid);
          else if (ax <= 1.15 || H(px, y, 93 + variant) < 0.3) P.set(px, y, glow);
        }
      }
      // Chispas en el centro.
      for (let i = 0; i < 6; i++) P.set(13 + Math.floor(H(i, variant, 94) * 5), 8 + Math.floor(H(i, variant, 95) * 30), white);
      return P.canvas();
    },

    chest(B, variant) {
      const ids = B && B.chestSprites;
      if (ids && ids.length) return paintTibiaItemProp(ids[variant % ids.length]);
      return PAINT._chestProc();
    },
  /** Cofre destructible (procedural). */
    _chestProc() {
      const P = Pix(16, 14);
      const gold = pack('#f2c443'), goldD = pack('#b5832a'), wood = pack('#8a4f2a'), woodD = pack('#5e3418');
      const lid = pack('#c4662e');
      for (let y = 2; y < 13; y++) for (let x = 1; x < 15; x++) {
        let c = y < 6 ? lid : wood;
        if (y === 6) c = goldD;
        if (x === 1 || x === 14) c = woodD;
        if ((x === 4 || x === 11) && y > 1) c = y < 6 ? gold : goldD;
        if (y === 12) c = woodD;
        P.set(x, y, c);
      }
      for (let x = 6; x < 10; x++) for (let y = 5; y < 9; y++) P.set(x, y, (x + y) % 3 ? gold : goldD);
      outline(P, pack('#2a160a'));
      return P.canvas();
    }
  };

  function clearProps() { propCache.clear(); }

  getItemPropSheet(POISON_TRAP_SHEET);
  getItemPropSheet(EXPLOSIVE_TRAP_SHEET);
  getItemPropSheet(POISON_TRAP_BURST_SHEET);
  getItemPropSheet(EXPLOSIVE_TRAP_BURST_SHEET);
  getSpellSheet(FIRE_WAVE_SHEET);
  getSpellSheet(HELLS_CORE_SHEET);

  return { T, BIOMES, NORMAL, ARENA, ARENA_THEMES, ARENA_TYPES, paintChunk, propSprite, clearProps,
           drawTrapPoisonTibia, drawTrapExplosiveTibia, drawItemStripFrame, drawSpellStripFrame,
           playPoisonTrapBurst, playExplosiveTrapBurst, playFireWaveCell, playHellsCoreCell,
           fireWaveCellWorld, hellsCoreCellWorld, trapBurstDrawOffX,
           poisonTrapStepRadius, tibiaFlatTrapStepRadius, trapStepRadius, preloadRockSprites,
           /** Índice de bioma de la arena de un tipo. */
           arenaBiome: type => ARENA + Math.max(0, ARENA_TYPES.indexOf(type)) };
})();
