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
    /* jugador — Master Sorcerer (outfit; ajustar al export) */
    99001: { kind: 'outfit', outfit: { type: 138, head: 0, body: 94, legs: 94, feet: 94, addons: 3 } },
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

  /** Claves usadas en juego → clientId Tibia (gold coin clásico 3031). */
  items: {
    gold_coin: { clientId: 3031 },
    platinum_coin: { clientId: 3035 },
    crystal_coin: { clientId: 3043 },
    health_potion: { clientId: 7618 },
    mana_potion: { clientId: 7620 }
  },

  /** ability.id → clave en effects-meta (fase 3). */
  effects: {
    flame_strike: { key: 'explosion_fire' },
    energy_strike: { key: 'energy_damage' },
    default_missile: { key: 'energy_missile' }
  },

  /** tile lógico interno → clientId ground (fase 2). */
  tiles: {
    grass: { clientId: 100 },
    cave_floor: { clientId: 351 },
    stone_wall: { clientId: 1025 }
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
