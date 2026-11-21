/* ============ cyclopedia-enums.js — taxonomía Cyclopedia (CYC-1) ============
 * Contratos cerrados para validación y autoría. Ver docs/cyclopedia/CREATURE_AND_BOSS_DATA_STANDARD.md
 */
G.CyclopediaEnums = (() => {
  const SCHEMA_VERSION = 1;

  const ROLE = [
    'fodder', 'swarm', 'bruiser', 'tank', 'ranged', 'artillery', 'assassin', 'controller',
    'support', 'summoner', 'elite', 'miniboss', 'boss', 'player', 'enemy'
  ];

  const BEHAVIOUR = [
    'chase', 'keep_distance', 'orbit', 'strafe', 'charge', 'flee', 'stationary', 'patrol',
    'teleport', 'ambush', 'summon', 'phase_driven',
    'runner', 'jumper', 'ranged', 'fan', 'beamer', 'zoner', 'healer', 'summoner', 'bomber', 'tank', 'thief', 'charger'
  ];

  const TARGETING = [
    'nearest', 'lowest_health', 'highest_health', 'player_position', 'predicted_position',
    'random_valid', 'fixed_direction', 'area_denial'
  ];

  const ATTACK_KIND = [
    'contact', 'projectile', 'burst', 'cone', 'wave', 'beam', 'nova', 'ground_zone', 'charge',
    'dash', 'summon', 'aura', 'delayed_strike', 'rotating_pattern'
  ];

  const SPAWN_TYPE = [
    'regular', 'timed', 'wave', 'event', 'ambush', 'conditional', 'elite_conversion',
    'boss_encounter', 'summoned'
  ];

  /** D7: selección principal de presión de run. */
  const SPAWN_MODE = ['hp_band', 'fixed_timer', 'rift', 'final_nemesis', 'manual'];

  const DIFFICULTY = [
    'harmless', 'trivial', 'easy', 'medium', 'hard', 'challenging', 'elite', 'boss'
  ];

  const OCCURRENCE = ['common', 'uncommon', 'rare', 'very_rare'];

  /** D3 charms: clases de bestiario (nombres genéricos, no marca). */
  const BESTIARY_CLASS = [
    'amphibic', 'aquatic', 'bird', 'construct', 'demon', 'dragon', 'elemental', 'extra_dimensional',
    'fey', 'giant', 'human', 'humanoid', 'lycanthrope', 'magical', 'mammal', 'plant', 'reptile',
    'slime', 'undead', 'vermin', 'unknown', 'wilderness'
  ];

  const BOSS_CATEGORY = ['bane', 'archfoe', 'nemesis'];

  const SECTION = ['bestiary', 'bosstiary'];

  function asSet(arr) {
    return new Set(arr);
  }

  const SETS = {
    ROLE: asSet(ROLE),
    BEHAVIOUR: asSet(BEHAVIOUR),
    TARGETING: asSet(TARGETING),
    ATTACK_KIND: asSet(ATTACK_KIND),
    SPAWN_TYPE: asSet(SPAWN_TYPE),
    SPAWN_MODE: asSet(SPAWN_MODE),
    DIFFICULTY: asSet(DIFFICULTY),
    OCCURRENCE: asSet(OCCURRENCE),
    BESTIARY_CLASS: asSet(BESTIARY_CLASS),
    BOSS_CATEGORY: asSet(BOSS_CATEGORY),
    SECTION: asSet(SECTION)
  };

  function isValid(kind, value) {
    if (value == null || value === '') return false;
    const set = SETS[kind];
    return set ? set.has(value) : false;
  }

  /** family → bestiaryClass por defecto hasta CYC-2. */
  const FAMILY_DEFAULT_CLASS = {
    beast: 'mammal',
    humanoid: 'humanoid',
    demon: 'demon',
    undead: 'undead',
    dragon: 'dragon',
    vermin: 'vermin',
    plant: 'plant',
    magical: 'magical',
    construct: 'construct',
    reptile: 'reptile',
    bird: 'bird',
    amphibic: 'amphibic'
  };

  return {
    SCHEMA_VERSION,
    ROLE,
    BEHAVIOUR,
    TARGETING,
    ATTACK_KIND,
    SPAWN_TYPE,
    SPAWN_MODE,
    DIFFICULTY,
    OCCURRENCE,
    BESTIARY_CLASS,
    BOSS_CATEGORY,
    SECTION,
    FAMILY_DEFAULT_CLASS,
    isValid,
    sets: SETS
  };
})();

G.CYCLOPEDIA_SCHEMA = G.CyclopediaEnums.SCHEMA_VERSION;