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
    99018: { kind: 'lookType', lookType: 35 },     // Demon (minion)
    99019: { kind: 'lookType', lookType: 111 },    // Chicken
    99020: { kind: 'lookType', lookType: 21 },     // Rat
    99021: { kind: 'lookType', lookType: 14 },     // Sheep
    99022: { kind: 'lookType', lookType: 106 },    // Skunk
    99023: { kind: 'lookType', lookType: 30 },     // Spider
    99024: { kind: 'lookType', lookType: 274 },    // Squirrel
    99025: { kind: 'lookType', lookType: 1029 },   // Fox (client 15.33+)
    99026: { kind: 'lookType', lookType: 105 },    // Badger
    99027: { kind: 'lookType', lookType: 212 },    // Flamingo
    99028: { kind: 'lookType', lookType: 217 },    // Parrot
    99029: { kind: 'lookType', lookType: 60 },     // Pig
    99030: { kind: 'lookType', lookType: 223 },    // Seagull
    99031: { kind: 'lookType', lookType: 36 },     // Poison Spider
    99032: { kind: 'lookType', lookType: 122 },    // Bat
    99033: { kind: 'lookType', lookType: 56 },     // Cave Rat
    99034: { kind: 'lookType', lookType: 531 },    // Pigeon
    99035: { kind: 'lookType', lookType: 350 },    // Sandcrawler
    99036: { kind: 'lookType', lookType: 52 },     // Winter Wolf
    99037: { kind: 'lookType', lookType: 250 },    // Penguin
    99038: { kind: 'lookType', lookType: 404 },    // Dromedary
    99039: { kind: 'lookType', lookType: 43 },     // Scorpion
    99040: { kind: 'lookType', lookType: 61 },     // Goblin
    99041: { kind: 'lookType', lookType: 349 },    // Insect Swarm
    99042: { kind: 'lookType', lookType: 282 },    // Island Troll
    99043: { kind: 'lookType', lookType: 33 },     // Skeleton
    99044: { kind: 'lookType', lookType: 112 },    // Crab
    99045: { kind: 'lookType', lookType: 76 },     // Swamp Troll
    99046: { kind: 'lookType', lookType: 1927, outfit: { type: 1927, head: 117, body: 4, legs: 56, feet: 11, addons: 0 } },   // Lizard Henchman
    99047: { kind: 'lookType', lookType: 297 },    // Goblin Scavenger
    99048: { kind: 'lookType', lookType: 94 },     // Hyaena
    99049: { kind: 'lookType', lookType: 1928, outfit: { type: 1928, head: 117, body: 4, legs: 20, feet: 57, addons: 0 } },   // Lizard Magician
    99050: { kind: 'lookType', lookType: 81 },     // Cobra
    99051: { kind: 'lookType', lookType: 26 },     // Rotworm
    99052: { kind: 'lookType', lookType: 298 },    // Skeleton Warrior
    99053: { kind: 'lookType', lookType: 249 },    // Chakoya Tribewarden
    99054: { kind: 'lookType', lookType: 1929, outfit: { type: 1929, head: 117, body: 4, legs: 11, feet: 6, addons: 0 } },   // Lizard Swordmaster
    99055: { kind: 'lookType', lookType: 97 },     // Pirate Gunner
    99056: { kind: 'lookType', lookType: 124 },    // Centipede
    99057: { kind: 'lookType', lookType: 82 },     // Larva
    99058: { kind: 'lookType', lookType: 5 },      // Orc
    99059: { kind: 'lookType', lookType: 529 },    // Salamander
    99060: { kind: 'lookType', lookType: 1929, outfit: { type: 1929, head: 117, body: 4, legs: 11, feet: 6, addons: 0 } },   // Lizard Executioner
    99061: { kind: 'lookType', lookType: 296 },    // Goblin Assassin
    99062: { kind: 'lookType', lookType: 125 },    // Tiger
    99063: { kind: 'lookType', lookType: 281 },    // Troll Champion
    99064: { kind: 'lookType', lookType: 1649 },   // White Tiger
    99065: { kind: 'lookType', lookType: 393 },    // Wild Horse
    99066: { kind: 'lookType', lookType: 16 },     // Bear
    99067: { kind: 'lookType', lookType: 259 },    // Chakoya Toolshaper
    99068: { kind: 'lookType', lookType: 216 },    // Dworc Venomsniper
    99069: { kind: 'lookType', lookType: 214 },    // Dworc Voodomaster
    99070: { kind: 'lookType', lookType: 41 },     // Lion
    99071: { kind: 'lookType', lookType: 123 },    // Panda
    99072: { kind: 'lookType', lookType: 535 },    // Swampling
    99073: { kind: 'lookType', lookType: 260 },    // Chakoya Windcaller
    99074: { kind: 'lookType', lookType: 215 },    // Dworc Fleshhunter
    99075: { kind: 'lookType', lookType: 298 },    // Honor Guard
    99076: { kind: 'lookType', lookType: 414 },    // Infernoid Hound
    99077: { kind: 'lookType', lookType: 528 },    // Emerald Damselfly
    99078: { kind: 'lookType', lookType: 69 },     // Dwarf
    99079: { kind: 'lookType', lookType: 567 },    // Leaf Golem
    99080: { kind: 'lookType', lookType: 129 },    // Poacher
    99081: { kind: 'lookType', lookType: 242 },    // Infernoid Soul
    99082: { kind: 'lookType', lookType: 253 },    // Barbarian Headsplitter
    99083: { kind: 'lookType', lookType: 153 },    // Crazed Beggar
    99084: { kind: 'lookType', lookType: 62 },     // Elf
99085: { kind: 'lookType', lookType: 530 },    // Marsh Stalker
    99086: { kind: 'lookType', lookType: 24 },    // Minotaur Archer
    99087: { kind: 'lookType', lookType: 243 },    // Infernoid Spiritual
    99088: { kind: 'lookType', lookType: 119 },    // Crocodile
    99089: { kind: 'lookType', lookType: 50 },    // Orc Spearman
    99090: { kind: 'lookType', lookType: 137 },    // Amazon
    99091: { kind: 'lookType', lookType: 294 },    // Wisp
    99092: { kind: 'lookType', lookType: 109 },    // Gazer
    99093: { kind: 'lookType', lookType: 128 },    // Stalker
    99094: { kind: 'lookType', lookType: 425 },    // Feverish Citizen
    99095: { kind: 'lookType', lookType: 7 },    // Orc Warrior
    99096: { kind: 'lookType', lookType: 134 },    // Smuggler
    99097: { kind: 'lookType', lookType: 254 },    // Barbarian Skullhunter
    99098: { kind: 'lookType', lookType: 71 },    // Dwarf Soldier
    99099: { kind: 'lookType', lookType: 222 },    // Toad
    99100: { kind: 'lookType', lookType: 131 },    // Wild Warrior
    99101: { kind: 'lookType', lookType: 258 },    // Husky
    99102: { kind: 'lookType', lookType: 3 },    // War Wolf
    99103: { kind: 'lookType', lookType: 264 },    // Barbarian Brutetamer
    99104: { kind: 'lookType', lookType: 192 },    // Carrion Worm
    99105: { kind: 'lookType', lookType: 48 },    // Ghost
    99106: { kind: 'lookType', lookType: 129 },    // Hunter
    99107: { kind: 'lookType', lookType: 316 },    // Mercury Blob
    99108: { kind: 'lookType', lookType: 19 },    // Slime
    99109: { kind: 'lookType', lookType: 566 },    // Tarnished Spirit
    99110: { kind: 'lookType', lookType: 23 },    // Minotaur Mage
    99111: { kind: 'lookType', lookType: 64 },    // Elf Scout
    99112: { kind: 'lookType', lookType: 1930 },    // Lizard Commander
    99113: { kind: 'lookType', lookType: 146 },    // Nomad (Basic)
    99114: { kind: 'lookType', lookType: 146 },    // Nomad (Blue)
    99115: { kind: 'lookType', lookType: 146 },    // Nomad (Female)
    99116: { kind: 'lookType', lookType: 152 },    // Assassin
    99117: { kind: 'lookType', lookType: 159 },    // Firestarter
    99118: { kind: 'lookType', lookType: 4 },    // Orc Rider
    99119: { kind: 'lookType', lookType: 131 },    // Gladiator
    99120: { kind: 'lookType', lookType: 29 },    // Minotaur Guard
    99121: { kind: 'lookType', lookType: 197 },    // Tortoise
    99122: { kind: 'lookType', lookType: 225 },    // Dark Monk
    99123: { kind: 'lookType', lookType: 470 },    // Deepling Worker
    99124: { kind: 'lookType', lookType: 195 },    // Pirate Skeleton
    99125: { kind: 'lookType', lookType: 139 },    // Valkyrie
    99126: { kind: 'lookType', lookType: 400 },    // White Deer
    99127: { kind: 'lookType', lookType: 380 },    // Boar
    99128: { kind: 'lookType', lookType: 341 },    // Gnarlhound
    99129: { kind: 'lookType', lookType: 716 },    // Gloom Wolf
    99130: { kind: 'lookType', lookType: 1048 },    // Mole
    99131: { kind: 'lookType', lookType: 8 },    // Orc Berserker
    99132: { kind: 'lookType', lookType: 93 },    // Pirate Marauder
    99133: { kind: 'lookType', lookType: 63 },    // Elf Arcanist
    99134: { kind: 'lookType', lookType: 72 },    // Quara Mantassin Scout
    99135: { kind: 'lookType', lookType: 133 },    // Dark Apprentice
    99136: { kind: 'lookType', lookType: 118 },    // Sibang
    99137: { kind: 'lookType', lookType: 219 },    // Tarantula
    99138: { kind: 'lookType', lookType: 403 },    // Insectoid Scout
    99139: { kind: 'lookType', lookType: 117 },    // Merlkin
    99140: { kind: 'lookType', lookType: 342 },    // Orc Marauder
    99141: { kind: 'lookType', lookType: 413 },    // Deepling Scout
    99142: { kind: 'lookType', lookType: 313 },    // Gozzler
    99143: { kind: 'lookType', lookType: 57 },    // Monk
    99144: { kind: 'lookType', lookType: 65 },    // Mummy
    99145: { kind: 'lookType', lookType: 323 },    // Mutated Human
    99146: { kind: 'lookType', lookType: 129 },    // Bandit
    99147: { kind: 'lookType', lookType: 70 },    // Dwarf Guard
    99148: { kind: 'lookType', lookType: 314 },    // Acid Blob
    99149: { kind: 'lookType', lookType: 532 },    // Corym Charlatan
    99150: { kind: 'lookType', lookType: 95 },    // Gargoyle
    99151: { kind: 'lookType', lookType: 712 },    // Tainted Soul
    99152: { kind: 'lookType', lookType: 120 },    // Carniphila
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
