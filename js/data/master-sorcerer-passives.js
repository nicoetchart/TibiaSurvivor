/* ============ master-sorcerer-passives.js — pasivas MS (datos; efectos en MS-7) ============
 * kind: 'passive' — no entran en G.Moves; bonos vía G.MasterSorcerer.refreshPassives.
 */
G.MasterSorcererPassives = [
  {
    id: 'master_of_flames',
    name: 'Master of Flames',
    incantation: '',
    vocationId: 'master_sorcerer',
    element: 'fire',
    kind: 'passive',
    type: 'fire',
    desc: '+8% daño de fuego por nivel (máx. +40%).',
    tags: ['passive', 'fire'],
    weight: 7,
    passiveKey: 'master_of_flames',
    effectPerLevel: { fireDamageMul: 0.08 },
    levels: [
      { level: 1, summary: '+8% fire damage.' },
      { level: 2, summary: '+8% fire damage (total +16%).' },
      { level: 3, summary: '+8% fire damage (total +24%).' },
      { level: 4, summary: '+8% fire damage (total +32%).' },
      { level: 5, summary: '+8% fire damage (total +40%).' }
    ]
  },
  {
    id: 'master_of_thunder',
    name: 'Master of Thunder',
    incantation: '',
    vocationId: 'master_sorcerer',
    element: 'energy',
    kind: 'passive',
    type: 'energy',
    desc: '+8% daño de energía por nivel (máx. +40%).',
    tags: ['passive', 'energy'],
    weight: 7,
    passiveKey: 'master_of_thunder',
    effectPerLevel: { energyDamageMul: 0.08 },
    levels: [
      { level: 1, summary: '+8% energy damage.' },
      { level: 2, summary: '+8% energy damage (total +16%).' },
      { level: 3, summary: '+8% energy damage (total +24%).' },
      { level: 4, summary: '+8% energy damage (total +32%).' },
      { level: 5, summary: '+8% energy damage (total +40%).' }
    ]
  },
  {
    id: 'master_of_decay',
    name: 'Master of Decay',
    incantation: '',
    vocationId: 'master_sorcerer',
    element: 'death',
    kind: 'passive',
    type: 'death',
    desc: '+8% daño de muerte por nivel (máx. +40%).',
    tags: ['passive', 'death'],
    weight: 7,
    passiveKey: 'master_of_decay',
    effectPerLevel: { deathDamageMul: 0.08 },
    levels: [
      { level: 1, summary: '+8% death damage.' },
      { level: 2, summary: '+8% death damage (total +16%).' },
      { level: 3, summary: '+8% death damage (total +24%).' },
      { level: 4, summary: '+8% death damage (total +32%).' },
      { level: 5, summary: '+8% death damage (total +40%).' }
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
    incantation: '',
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
    desc: '+8% Maximum Health por nivel (máx. +40%).',
    tags: ['passive', 'defensive'],
    weight: 5,
    passiveKey: 'ultimate_healing',
    effectPerLevel: { maxHealthMul: 0.08 },
    levels: [
      { level: 1, summary: '+8% Maximum Health.' },
      { level: 2, summary: '+8% Maximum Health (total +16%).' },
      { level: 3, summary: '+8% Maximum Health (total +24%).' },
      { level: 4, summary: '+8% Maximum Health (total +32%).' },
      { level: 5, summary: '+8% Maximum Health (total +40%).' }
    ]
  },
  {
    id: 'intense_healing',
    name: 'Intense Healing',
    incantation: 'exura gran',
    vocationId: 'master_sorcerer',
    element: 'holy',
    kind: 'passive',
    type: 'holy',
    desc: '+0.2 HP/s por nivel (máx. +1 HP/s).',
    tags: ['passive', 'defensive'],
    weight: 5,
    passiveKey: 'intense_healing',
    effectPerLevel: { regenFlat: 0.2 },
    levels: [
      { level: 1, summary: '+0.2 HP per second.' },
      { level: 2, summary: '+0.2 HP/s (total +0.4 HP/s).' },
      { level: 3, summary: '+0.2 HP/s (total +0.6 HP/s).' },
      { level: 4, summary: '+0.2 HP/s (total +0.8 HP/s).' },
      { level: 5, summary: '+0.2 HP/s (total +1 HP/s).' }
    ]
  },
  {
    id: 'magic_shield',
    name: 'Magic Shield',
    incantation: 'utamo vita',
    vocationId: 'master_sorcerer',
    element: 'energy',
    kind: 'passive',
    type: 'energy',
    desc: 'Escudo = 5% de Maximum Health por nivel (máx. 25%).',
    tags: ['passive', 'defensive'],
    weight: 5,
    passiveKey: 'magic_shield',
    effectPerLevel: { magicShieldMaxHpFrac: 0.05 },
    levels: [
      { level: 1, summary: 'Shield 5% of Maximum Health.' },
      { level: 2, summary: 'Shield 10% of Maximum Health.' },
      { level: 3, summary: 'Shield 15% of Maximum Health.' },
      { level: 4, summary: 'Shield 20% of Maximum Health.' },
      { level: 5, summary: 'Shield 25% of Maximum Health.' }
    ]
  },
  {
    id: 'aura_of_exposed_weakness',
    name: 'Aura of Exposed Weakness',
    incantation: '',
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
