/* ============ vocations.js — vocaciones TibiaSurvivor (Fase 3) ============
 * F3: una vocación activa — Master Sorcerer (nombre UI original, DEC-020).
 * MS-1: baseStats y startingSpellId (baseline); startingAbility sigue MVP hasta MS-2.
 */
G.Vocations = (() => {
  const LIST = [
    {
      id: 'master_sorcerer',
      name: 'Master Sorcerer',
      nameEn: 'Master Sorcerer',
      maxHp: 0,
      maxMana: 0,
      speed: 0,
      armor: 0,
      playerCreatureId: 'wander_archmage',
      legacyPartnerId: 99001,
      startingAbility: 'hells_core',
      startingSpellId: 'hells_core',
      /** Dev / pruebas: Hell's Core desde el arranque. */
      startingSpellIds: ['hells_core'],
      baseStats: {
        maxHp: 82,
        movementSpeedMul: 1.04,
        baseDamageMul: 1.12,
        attackSpeedMul: 1,
        cooldownReduction: 0,
        criticalChance: 0.05,
        pickupRadiusMul: 1,
        armor: 0
      },
      description: 'Cazador arcano: alto daño elemental, poca armadura, control del campo desde lejos.'
    }
  ];

  const BY_ID = {};
  for (const v of LIST) BY_ID[v.id] = v;

  function defaultVocation() {
    return BY_ID.master_sorcerer;
  }

  return { LIST, BY_ID, default: defaultVocation, defaultVocation };
})();
