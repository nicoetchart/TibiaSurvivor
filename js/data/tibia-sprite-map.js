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
    /** plantilla+máscara (colores cliente — caballero negro) */
    99017: { kind: 'lookType', lookType: 131, outfit: { type: 131, head: 95, body: 95, legs: 95, feet: 95, addons: 3 } },
    99011: { kind: 'lookType', lookType: 44 },    // Wasp
    99012: { kind: 'lookType', lookType: 40 },    // Fire Devil
    99013: { kind: 'lookType', lookType: 18 },    // Ghoul
    99014: { kind: 'lookType', lookType: 17 },    // Bonelord
    99015: { kind: 'lookType', lookType: 73 },    // Hero
    99016: { kind: 'lookType', lookType: 201 },    // Orshabaal
    99018: { kind: 'lookType', lookType: 35 }     // Demon (minion)
  },

  /** Claves usadas en juego → PNG en assets/tibia/items/ o clientId en items-32.png. */
  items: {
    gold_coin: { clientId: 3031 },
    platinum_coin: { clientId: 3035 },
    crystal_coin: { clientId: 3043 },
    /** Topbar (monedas de cuenta). */
    crystal_coin_menu: { spriteId: '201280' },
  /** Iconos del menú principal (clientId Tibia → PNG en items/). */
    menu_play: { spriteId: 201033, clientId: 2854 },
    menu_bestiary: { spriteId: 198121, clientId: 2835 },
    menu_outfit: { spriteId: 201879, clientId: 3463 },
    menu_goals: { spriteId: 204175, clientId: 5805 },
    menu_settings: { spriteId: 206970, clientId: 8775 },
    /** Pilas de oro en el suelo (pickup.value 1–5, 8). */
    coin_1: { spriteId: 201280 },
    coin_2: { spriteId: 201281 },
    coin_3: { spriteId: 201282 },
    coin_4: { spriteId: 201283 },
    coin_5: { spriteId: 201284 },
    coin_8: { spriteId: 201285 },
    /** Carta de nivel / UI. */
    health_potion: { spriteId: 198233 },
    /** Loot de curación en el suelo (antes baya/manzana). */
    heal_pickup: { spriteId: 198250 },
    /** Orbes de experiencia en el suelo. */
    xp_pickup: { spriteId: 207453 },
    xp_big_pickup: { spriteId: 210950 },
    /** Objeto equipable Starlight Vial (clientId 25976). */
    starlightVial: { spriteId: 218726 },
    /** Objeto equipable Cursed Coin (clientId 53423). */
    cursedCoin: { spriteId: 241367 },
    /** Objeto equipable Bone Fiddle (clientId 28493). */
    boneFiddle: { spriteId: 219552 },
    /** Objeto equipable Moon Mirror (clientId 25730). */
    moonMirror: { spriteId: 218724 },
    /** Objeto equipable Sun Catcher (clientId 25977). */
    sunCatcher: { spriteId: 218728 },
    /** Objeto equipable Frozen Starlight (clientId 3249). */
    frozenStarlight: { spriteId: 201619 },
    /** Objeto equipable Glowing Mushroom (clientId 16097). */
    glowingMush: { spriteId: 212064 },
    /** Objeto equipable Skull (clientId 3114, frame 0). */
    skull: { spriteId: 201478 },
    /** Objeto equipable Blue Sphere (clientId 23541). */
    blueSphere: { spriteId: 217640 },
    /** Objeto equipable Magical Torch (clientId 9042, frame 0 de 207124–207126). */
    magicalTorch: { spriteId: 207124 },
    /** Bomba en suelo: animación 3 fotogramas (pickup.js). */
    bomb_pickup: { spriteId: '203847-203849' },
    /** Manantial en mapa (3 fotogramas; vacío en escala de grises). */
    spring: { spriteId: '215435-215437' },
    magnet_pickup: { spriteId: '209160-209162' },
    mana_potion: { clientId: 7620 }
  },

  /** Iconos de hechizo (UI 32×32; ver tools/extract_tibia_spell_icons.mjs). */
  spell_icons: {
    flame_strike: { file: 'flame_strike.png', clientSpellId: 89, otIconIndex: 26 },
    energy_strike: { file: 'energy_strike.png', clientSpellId: 88, otIconIndex: 29 },
    death_strike: { file: 'death_strike.png', clientSpellId: 87, otIconIndex: 38 },
    fire_wave: { file: 'fire_wave.png', clientSpellId: 19, otIconIndex: 44 },
    energy_beam: { file: 'energy_beam.png', clientSpellId: 22, otIconIndex: 41 },
    great_death_beam: { file: 'great_death_beam.png', clientSpellId: 260, otIconIndex: 157 },
    hells_core: { file: 'hells_core.png', clientSpellId: 24, otIconIndex: 49 },
    rage_of_the_skies: { file: 'rage_of_the_skies.png', clientSpellId: 119, otIconIndex: 52 },
    death_echo: { file: 'death_echo.png', clientSpellId: 310, otIconIndex: 192 },
    strong_haste: { file: 'strong_haste.png', clientSpellId: 39, otIconIndex: 101 },
    ultimate_healing: { file: 'ultimate_healing.png', clientSpellId: 3, otIconIndex: 1 },
    avatar_of_storm: { file: 'avatar_of_storm.png', clientSpellId: 266, otIconIndex: 151 },
    aura_of_exposed_weakness: { file: 'aura_of_exposed_weakness.png', clientSpellId: 312, otIconIndex: 200 },
    master_of_elements: { file: 'master_of_elements.png', clientSpellId: 305, otIconIndex: 188 }
  },

  /** ability.id → clave en effects-meta (fase 3). */
  effects: {
    flame_strike: { sheet: '197242-197249', impact: '195450-195457' },
    energy_strike: { sheet: '197250-197257' },
    death_strike: { sheet: '197384-197391' },
    death_echo: { sheet: '195010-195017' },
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
