/* ============ creatures.js — criaturas originales TibiaSurvivor (Fase 3–4) ============
 * legacyId 99001–99099 (DEC-018). Sprites geométricos (geo-sprites.js).
 * 15 plantillas enemigas + 1 jugador para el MVP.
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
    role: 'player',
    startAbility: 'ts-arc-bolt'
  },
  // —— básicos (tier 0) ——
  {
    id: 'cave_filament',
    legacyId: 99002,
    name: 'Filamento de caverna',
    hp: 20,
    speed: 56,
    attack: 1,
    damageTypes: ['physical'],
    behavior: 'chase',
    sprite: 'geo',
    role: 'enemy',
    tier: 0,
    spawnWeight: 1.2
  },
  {
    id: 'ember_wisp',
    legacyId: 99003,
    name: 'Brasa errante',
    hp: 18,
    speed: 52,
    attack: 1.05,
    damageTypes: ['fire'],
    behavior: 'charger',
    sprite: 'geo',
    role: 'enemy',
    tier: 0,
    spawnWeight: 1
  },
  {
    id: 'pit_scuttler',
    legacyId: 99004,
    name: 'Corredor de foso',
    hp: 14,
    speed: 78,
    attack: 0.95,
    damageTypes: ['physical'],
    behavior: 'runner',
    sprite: 'geo',
    role: 'enemy',
    tier: 0,
    spawnWeight: 0.85
  },
  {
    id: 'gravel_mite',
    legacyId: 99005,
    name: 'Ácaro de grava',
    hp: 38,
    speed: 44,
    attack: 0.92,
    damageTypes: ['physical'],
    behavior: 'tank',
    sprite: 'geo',
    role: 'enemy',
    tier: 0,
    spawnWeight: 0.9
  },
  {
    id: 'spore_puff',
    legacyId: 99006,
    name: 'Espora flotante',
    hp: 16,
    speed: 50,
    attack: 1,
    damageTypes: ['physical'],
    behavior: 'ranged',
    sprite: 'geo',
    role: 'enemy',
    tier: 0,
    spawnWeight: 1
  },
  // —— intermedios (tier 1) ——
  {
    id: 'dust_spirit',
    legacyId: 99007,
    name: 'Espíritu de polvo',
    hp: 24,
    speed: 54,
    attack: 1.02,
    damageTypes: ['energy'],
    behavior: 'ranged',
    sprite: 'geo',
    role: 'enemy',
    tier: 1,
    spawnWeight: 1
  },
  {
    id: 'flint_crawler',
    legacyId: 99008,
    name: 'Reptador de sílex',
    hp: 28,
    speed: 68,
    attack: 1.08,
    damageTypes: ['physical'],
    behavior: 'chase',
    sprite: 'geo',
    role: 'enemy',
    tier: 1,
    spawnWeight: 1.1
  },
  {
    id: 'seam_speaker',
    legacyId: 99009,
    name: 'Vocero de veta',
    hp: 22,
    speed: 48,
    attack: 1,
    damageTypes: ['energy'],
    behavior: 'fan',
    sprite: 'geo',
    role: 'enemy',
    tier: 1,
    spawnWeight: 0.95
  },
  {
    id: 'rune_guard',
    legacyId: 99010,
    name: 'Guardián de runas',
    hp: 30,
    speed: 46,
    attack: 1,
    damageTypes: ['energy', 'physical'],
    behavior: 'shielder',
    sprite: 'geo',
    role: 'enemy',
    tier: 1,
    spawnWeight: 0.8
  },
  {
    id: 'brood_hatcher',
    legacyId: 99011,
    name: 'Incubador de linaje',
    hp: 26,
    speed: 50,
    attack: 0.98,
    damageTypes: ['physical'],
    behavior: 'summoner',
    sprite: 'geo',
    role: 'enemy',
    tier: 1,
    spawnWeight: 0.75,
    minionLegacyId: 99002
  },
  // —— avanzados (tier 2) ——
  {
    id: 'cinder_wraith',
    legacyId: 99012,
    name: 'Espectro de ceniza',
    hp: 32,
    speed: 52,
    attack: 1.05,
    damageTypes: ['fire'],
    behavior: 'zoner',
    sprite: 'geo',
    role: 'enemy',
    tier: 2,
    spawnWeight: 0.9
  },
  {
    id: 'crystal_shade',
    legacyId: 99013,
    name: 'Sombra cristalina',
    hp: 28,
    speed: 48,
    attack: 1.1,
    damageTypes: ['energy'],
    behavior: 'beamer',
    sprite: 'geo',
    role: 'enemy',
    tier: 2,
    spawnWeight: 0.85
  },
  {
    id: 'ash_mender',
    legacyId: 99014,
    name: 'Ensalmador de brasa',
    hp: 34,
    speed: 46,
    attack: 0.9,
    damageTypes: ['fire'],
    behavior: 'healer',
    sprite: 'geo',
    role: 'enemy',
    tier: 2,
    spawnWeight: 0.7
  },
  {
    id: 'iron_stalker',
    legacyId: 99015,
    name: 'Acechador de hierro',
    hp: 36,
    speed: 58,
    attack: 1.12,
    damageTypes: ['physical'],
    behavior: 'jumper',
    sprite: 'geo',
    role: 'enemy',
    tier: 2,
    spawnWeight: 0.88
  },
  // —— élite MVP ——
  {
    id: 'vault_warden',
    legacyId: 99016,
    name: 'Custodio del umbral',
    hp: 520,
    speed: 62,
    attack: 1.25,
    damageTypes: ['energy', 'physical'],
    behavior: 'charger',
    sprite: 'geo',
    role: 'enemy',
    tier: 3,
    spawnWeight: 0,
    boss: true
  }
];

G.CREATURE_BY_ID = {};
G.CREATURE_BY_LEGACY = {};
for (const c of G.CREATURES) {
  G.CREATURE_BY_ID[c.id] = c;
  G.CREATURE_BY_LEGACY[c.legacyId] = c;
}
