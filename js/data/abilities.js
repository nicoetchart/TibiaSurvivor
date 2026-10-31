/* ============ abilities.js — habilidades originales (Fase 3) ============
 * Misma forma que movimientos (`kind`, `type` = damageType) para combat.js en 3B.
 */
(() => {
  const LADDERS = {
    projectile: [
      { t: '+1 proyectil', m: { count: 1, spread: 1.3 } },
      { t: '+40% daño', m: { dmg: 1.4 } },
      { t: '-20% recarga', m: { cd: 0.8 } },
      { t: '+1 perforación', m: { pierce: 1 } }
    ],
    beam: [
      { t: '+35% daño', m: { dmg: 1.35 } },
      { t: '+25% alcance', m: { radius: 1.25, width: 1.2 } },
      { t: '-20% recarga', m: { cd: 0.8 } },
      { t: '+45% daño', m: { dmg: 1.45 } }
    ],
    nova: [
      { t: '+3 proyectiles', m: { count: 3 } },
      { t: '+35% daño', m: { dmg: 1.35 } },
      { t: '-20% recarga', m: { cd: 0.8 } },
      { t: '+3 proyectiles', m: { count: 3 } }
    ],
    buff: [
      { t: '+10% daño', m: { amount: 0.1 } },
      { t: '+10% daño', m: { amount: 0.1 } },
      { t: '-15% recarga', m: { cd: 0.85 } },
      { t: '+15% daño', m: { amount: 0.15 } }
    ]
  };

  const RAW = [
    {
      id: 'ts-arc-bolt',
      name: 'Dardo arcano',
      kind: 'projectile',
      type: 'energy',
      desc: 'Disparo de energía concentrada hacia el objetivo más cercano.',
      cd: 0.85,
      dmg: 14,
      count: 1,
      speed: 420,
      size: 7,
      life: 1.4,
      pierce: 0
    },
    {
      id: 'ts-focus-beam',
      name: 'Haz focal',
      kind: 'beam',
      type: 'energy',
      desc: 'Rayo recto que atraviesa enemigos alineados.',
      cd: 1.15,
      dmg: 22,
      radius: 380,
      width: 14
    },
    {
      id: 'ts-flare-ring',
      name: 'Anillo ígneo',
      kind: 'nova',
      type: 'fire',
      desc: 'Explosión radial de chispas en todas las direcciones.',
      cd: 1.05,
      dmg: 11,
      count: 8,
      speed: 320,
      size: 6,
      life: 0.55,
      pierce: 0
    },
    {
      id: 'ts-ward-pulse',
      name: 'Pulso de tutela',
      kind: 'buff',
      type: 'energy',
      desc: 'Refuerza tu daño durante unos segundos.',
      cd: 6,
      dmg: 0,
      stat: 'atk',
      amount: 0.12,
      dur: 4,
      stacks: 2
    }
  ];

  const BY_ID = {};
  const POOL = { all: [] };
  for (const m of RAW) {
    m.ups = LADDERS[m.kind] || [];
    m.maxLvl = m.ups.length + 1;
    BY_ID[m.id] = m;
    POOL.all.push(m.id);
  }

  /** Habilidades que puede aprender una criatura (pool cerrado F3). */
  function poolFor(creature) {
    if (!creature) return [];
    if (creature.role === 'player' || creature.id === 'wander_archmage') {
      return POOL.all.filter(id => id !== 'ts-ward-pulse').concat(['ts-ward-pulse']);
    }
    return [];
  }

  const MULT = ['dmg', 'cd', 'speed', 'radius', 'dur', 'amount', 'arc', 'width', 'spread', 'life', 'size', 'rate'];
  const ADD = ['count', 'pierce', 'stacks'];

  function applyMods(s, m) {
    for (const k in m) {
      if (MULT.includes(k) && s[k] != null) s[k] *= m[k];
      else if (ADD.includes(k)) s[k] = (s[k] || 0) + m[k];
      else s[k] = m[k];
    }
  }

  function instance(id, lvl = 1) {
    const def = BY_ID[id];
    if (!def) return null;
    const s = Object.assign({}, def, { id, def, lvl, t: 0, baseName: def.name, name: def.name });
    delete s.ups;
    for (let i = 0; i < lvl - 1; i++) applyMods(s, def.ups[i].m);
    return s;
  }

  function levelUp(s) {
    if (!s || s.lvl >= s.def.maxLvl) return false;
    applyMods(s, s.def.ups[s.lvl - 1].m);
    s.lvl++;
    return true;
  }

  function nextUpText(s) {
    return s.lvl >= s.def.maxLvl ? null : s.def.ups[s.lvl - 1].t;
  }

  function startFor(creature) {
    if (creature && creature.startAbility && BY_ID[creature.startAbility]) return creature.startAbility;
    return 'ts-arc-bolt';
  }

  G.Abilities = {
    ALL: RAW,
    BY_ID,
    poolFor,
    instance,
    levelUp,
    nextUpText,
    startFor
  };
})();
