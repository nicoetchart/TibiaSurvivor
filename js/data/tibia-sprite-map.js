/* ============ tibia-sprite-map.js — legacyId / item → cliente Tibia ============
 * lookType: monstruos (validar con tu versión de cliente al exportar).
 * outfit: personaje (type + colores + addons).
 * clientId: ítem en Tibia.dat (no confundir con sprite id interno; el export resuelve).
 *
 * Generado/verificado por: tools/export_tibia_sprites.mjs
 */
G.TIBIA_SPRITE_MAP = {
  /** Versión de referencia del export (manifest.json debe coincidir). */
  clientVersionHint: '15.33',

  creatures: {
    /* jugador — Mage outfit (132); colores/addons en save.playerOutfit */
    99001: { kind: 'outfit', outfit: { type: 132, head: 0, body: 94, legs: 94, feet: 94, addons: 0 } },
    99002: { kind: 'lookType', lookType: 276 },   // Cat
    99003: { kind: 'lookType', lookType: 32 },    // Dog
    99004: { kind: 'lookType', lookType: 31 },    // Deer
    99005: { kind: 'lookType', lookType: 74 },    // Rabbit
    99006: { kind: 'lookType', lookType: 45 },    // Bug
    99007: { kind: 'lookType', lookType: 15 },    // Troll
    99008: { kind: 'lookType', lookType: 27 },    // Wolf
    99009: { kind: 'lookType', lookType: 6 },     // Orc Shaman
    99010: { kind: 'lookType', lookType: 25 },    // Minotaur
    99011: { kind: 'lookType', lookType: 44 },    // Wasp
    99012: { kind: 'lookType', lookType: 40 },    // Fire Devil
    99013: { kind: 'lookType', lookType: 18 },    // Ghoul
    99014: { kind: 'lookType', lookType: 17 },    // Bonelord
    99015: { kind: 'lookType', lookType: 73 },    // Hero
    99016: { kind: 'lookType', lookType: 35 }     // Demon
  },

  /** Claves usadas en juego → PNG en assets/tibia/items/ o clientId en items-32.png. */
  items: {
    gold_coin: { clientId: 3031 },
    platinum_coin: { clientId: 3035 },
    crystal_coin: { clientId: 3043 },
    /** Carta de nivel / UI. */
    health_potion: { spriteId: 198233 },
    /** Loot de curación en el suelo (antes baya/manzana). */
    heal_pickup: { spriteId: 198250 },
    mana_potion: { clientId: 7620 }
  },

  /** ability.id → clave en effects-meta (fase 3). */
  effects: {
    flame_strike: { key: 'explosion_fire' },
    energy_strike: { key: 'energy_damage' },
    default_missile: { key: 'energy_missile' }
  },

  /** tile lógico → archivo en assets/tibia/tiles/ (nombre sin .png). */
  /*
   * Suelo Tibia (solo estos 3; ver G.Tiles.BIOMES y TibiaTiles.FLOOR_BY_BIOME):
   *   grass      — bioma 0 Bosque Umbrío
   *   cave_floor — biomas 1–2 (Cueva, Volcán) y todas las arenas (índice ≥ 3)
   *   dirt       — parches donde la máscara de tierra gana (>50 % del tile 16×16)
   * PNG: assets/tibia/tiles/{file}.png · strips: frame 0,1,…
   * Tras cambiar PNG: node tools/refresh_tibia_tiles_meta.mjs
   */
  tiles: {
    grass: { file: '198319' },
    cave_floor: { file: '198305-198306', frame: 0 },
    dirt: { file: '198321-198322', frame: 0 },
    /** Paredes desactivadas (mapTiles.walls) hasta autotile fiable. */
    stone_wall: { set: { first: 198412, last: 198448 } }
  }
};

/** Por creature.id estable (bestiario, datos). */
G.TIBIA_SPRITE_BY_CREATURE_ID = (() => {
  const m = {};
  if (!G.CREATURES) return m;
  const map = G.TIBIA_SPRITE_MAP.creatures;
  for (const c of G.CREATURES) {
    if (c.legacyId != null && map[c.legacyId]) m[c.id] = map[c.legacyId];
  }
  return m;
})();
