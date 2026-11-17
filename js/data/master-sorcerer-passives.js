/* ============ master-sorcerer-passives.js — pasivas MS (datos; efectos en MS-7) ============
 * kind: 'passive' — no entran en G.Moves; bonos vía G.MasterSorcerer.refreshPassives.
 */
G.MasterSorcererPassives = [
  {
    id: 'master_of_elements',
    name: 'Master of Elements',
    incantation: 'uteta vis',
    vocationId: 'master_sorcerer',
    element: 'energy',
    kind: 'passive',
    type: 'energy',
    desc: '+8% daño fire, energy y death por nivel (máx. +40% cada uno).',
    tags: ['passive', 'offensive'],
    weight: 8,
    passiveKey: 'master_of_elements',
    effectPerLevel: { fireDamageMul: 0.08, energyDamageMul: 0.08, deathDamageMul: 0.08 },
    levels: [
      { level: 1, summary: '+8% daño en los tres elementos.' },
      { level: 2, summary: '+8% por elemento (total +16%).' },
      { level: 3, summary: '+8% por elemento (total +24%).' },
      { level: 4, summary: '+8% por elemento (total +32%).' },
      { level: 5, summary: '+8% por elemento (total +40%).' }
    ]
  },
  {
    id: 'strong_haste',
    name: 'Strong Haste',
    incantation: 'utani gran hur',
    vocationId: 'master_sorcerer',
    element: 'energy',
    kind: 'passive',
    type: 'energy',
    desc: '+4% velocidad de movimiento por nivel (máx. +20%).',
    tags: ['passive', 'utility'],
    weight: 6,
    passiveKey: 'strong_haste',
    effectPerLevel: { moveSpeedMul: 0.04 },
    levels: [
      { level: 1, summary: '+4% movement speed.' },
      { level: 2, summary: '+4% movement speed (total +8%).' },
      { level: 3, summary: '+4% movement speed (total +12%).' },
      { level: 4, summary: '+4% movement speed (total +16%).' },
      { level: 5, summary: '+4% movement speed (total +20%).' }
    ]
  },
  {
    id: 'avatar_of_storm',
    name: 'Avatar of Storm',
    incantation: 'uteta res ven',
    vocationId: 'master_sorcerer',
    element: 'energy',
    kind: 'passive',
    type: 'energy',
    desc: '+5% attack speed por nivel (máx. +25%).',
    tags: ['passive', 'utility'],
    weight: 6,
    passiveKey: 'avatar_of_storm',
    effectPerLevel: { attackSpeedMul: 0.05 },
    levels: [
      { level: 1, summary: '+5% attack speed.' },
      { level: 2, summary: '+5% attack speed (total +10%).' },
      { level: 3, summary: '+5% attack speed (total +15%).' },
      { level: 4, summary: '+5% attack speed (total +20%).' },
      { level: 5, summary: '+5% attack speed (total +25%).' }
    ]
  },
  {
    id: 'ultimate_healing',
    name: 'Ultimate Healing',
    incantation: 'exura vita',
    vocationId: 'master_sorcerer',
    element: 'holy',
    kind: 'passive',
    type: 'holy',
    desc: '+8% vida máx. y +0,2 HP/s por nivel; al subir, cura al máximo.',
    tags: ['passive', 'defensive'],
    weight: 6,
    passiveKey: 'ultimate_healing',
    effectPerLevel: { maxHealthMul: 0.08, regenFlat: 0.2 },
    levels: [
      { level: 1, summary: '+8% vida máx.; +0,2 HP/s; curación completa.' },
      { level: 2, summary: '+8% HP y +0,2 HP/s por nivel; curación completa al subir.' },
      { level: 3, summary: 'Total +24% vida y +0,6 HP/s; curación completa al subir.' },
      { level: 4, summary: 'Total +32% vida y +0,8 HP/s; curación completa al subir.' },
      { level: 5, summary: 'Total +40% vida y +1 HP/s; curación completa al subir.' }
    ]
  },
  {
    id: 'aura_of_exposed_weakness',
    name: 'Aura of Exposed Weakness',
    incantation: 'exori moe tempo',
    vocationId: 'master_sorcerer',
    element: 'death',
    kind: 'passive',
    type: 'death',
    desc: '+3% penetración elemental por nivel (máx. +15%).',
    tags: ['passive', 'offensive'],
    weight: 6,
    passiveKey: 'aura_of_exposed_weakness',
    effectPerLevel: { elementalPenetration: 0.03 },
    levels: [
      { level: 1, summary: '+3% elemental penetration.' },
      { level: 2, summary: '+3% penetration (total +6%).' },
      { level: 3, summary: '+3% penetration (total +9%).' },
      { level: 4, summary: '+3% penetration (total +12%).' },
      { level: 5, summary: '+3% penetration (total +15%).' }
    ]
  }
];