/* ============ creatures.js — criaturas originales TibiaSurvivor (Fase 3) ============
 * legacyId 99001–99099 (DEC-018) convive con save.partner numérico Fase 2.
 * Sprites: placeholder geométrico (Fase 3E); sin assets Pokémon.
 */
G.CREATURES = [
  {
    id: 'wander_archmage',
    legacyId: 99001,
    name: 'Archimago errante',
    hp: 100,
    speed: 102,
    attack: 1.08,
    damageTypes: ['energy', 'physical'],
    behavior: null,
    sprite: 'geo',
    role: 'player'
  },
  {
    id: 'cave_filament',
    legacyId: 99002,
    name: 'Filamento de caverna',
    hp: 18,
    speed: 58,
    attack: 1,
    damageTypes: ['physical'],
    behavior: 'chase',
    sprite: 'geo',
    role: 'enemy',
    tier: 0
  },
  {
    id: 'ember_wisp',
    legacyId: 99003,
    name: 'Brasa errante',
    hp: 16,
    speed: 64,
    attack: 1.05,
    damageTypes: ['fire'],
    behavior: 'charger',
    sprite: 'geo',
    role: 'enemy',
    tier: 0
  },
  {
    id: 'living_geode',
    legacyId: 99004,
    name: 'Geodo viviente',
    hp: 42,
    speed: 48,
    attack: 0.95,
    damageTypes: ['earth', 'physical'],
    behavior: 'tank',
    sprite: 'geo',
    role: 'enemy',
    tier: 1
  },
  {
    id: 'dust_spirit',
    legacyId: 99005,
    name: 'Espíritu de polvo',
    hp: 22,
    speed: 52,
    attack: 1,
    damageTypes: ['energy'],
    behavior: 'ranged',
    sprite: 'geo',
    role: 'enemy',
    tier: 1
  },
  {
    id: 'flint_crawler',
    legacyId: 99006,
    name: 'Reptador de sílex',
    hp: 28,
    speed: 70,
    attack: 1.1,
    damageTypes: ['physical'],
    behavior: 'chase',
    sprite: 'geo',
    role: 'enemy',
    tier: 1
  },
  {
    id: 'rune_guard',
    legacyId: 99007,
    name: 'Guardián de runas',
    hp: 36,
    speed: 50,
    attack: 1.02,
    damageTypes: ['energy', 'physical'],
    behavior: 'ranged',
    sprite: 'geo',
    role: 'enemy',
    tier: 2
  }
];

G.CREATURE_BY_ID = {};
G.CREATURE_BY_LEGACY = {};
for (const c of G.CREATURES) {
  G.CREATURE_BY_ID[c.id] = c;
  G.CREATURE_BY_LEGACY[c.legacyId] = c;
}
