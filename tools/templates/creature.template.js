/**
 * CYC-11 — Plantilla de criatura (copiar bloque a js/data/creatures.js).
 * Completar intake: docs/cyclopedia/NEW_CREATURE_INTAKE.md
 * Validar: node tools/validate-cyclopedia.js
 *
 * Eliminar comentarios de guía antes de merge si prefieres datos limpios.
 */
/*
  {
    id: 'your_creature_id',              // requerido, snake_case, único
    legacyId: 99050,                       // 99001–99099 MVP; sprite Tibia
    name: 'Display Name',
    description: 'One or two sentences for cyclopedia.',
    nameKey: 'creature.your_creature_id.name',
    descriptionKey: 'creature.your_creature_id.description',
    family: 'beast',                       // CyclopediaEnums.FAMILY
    bestiaryClass: 'mammal',               // charms / filters (D3)
    difficulty: 'easy',                    // harmless…elite (bestiary section)
    occurrence: 'common',                  // optional; validator may compare to spawnWeight
    tags: ['melee', 'ground'],
    hp: 32,                                // D7: HP literal en combate (hp_band)
    speed: 58,
    attack: 1.0,
    damageTypes: ['physical'],
    defenseTypes: ['physical'],
    weaknesses: [],
    resistances: [],
    immunities: [],
    behavior: 'chase',
    behaviors: ['chase'],                  // opcional multi-pattern
    sprite: 'tibia',
    role: 'enemy',
    tier: 1,
    spawnWeight: 1.0,                      // 0 = solo manual / boss rules
    // boostExcluded: true,                // opt-out daily creature boost
    bestiary: {
      enabled: true,
      section: 'bestiary',                 // 'bosstiary' → usar NEW_BOSS_INTAKE.md
      thresholds: null,                  // null = defaults por difficulty
      rewardPoints: null,                  // null = tabla por difficulty
      reveal: {
        stage1: ['hp', 'xp', 'behavior', 'description', 'occurrence'],
        stage2: ['damage', 'speed', 'abilities', 'resistances'],
        stage3: ['drops', 'tips', 'statistics']
      },
      tipKeys: ['bestiary.your_creature_id.tip1']  // añadir en js/data/bestiary-tips.js
    }
  },
*/