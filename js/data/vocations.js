/* ============ vocations.js — vocaciones TibiaSurvivor (Fase 3) ============
 * F3: una vocación activa — Master Sorcerer (nombre UI original, DEC-020).
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
      startingAbility: 'ts-arc-bolt',
      description: 'Cazador arcano: proyectiles de energía y control del campo desde lejos.'
    }
  ];

  const BY_ID = {};
  for (const v of LIST) BY_ID[v.id] = v;

  function defaultVocation() {
    return BY_ID.master_sorcerer;
  }

  return { LIST, BY_ID, default: defaultVocation, defaultVocation };
})();
