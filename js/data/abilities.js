/* ============ abilities.js — habilidades originales (Fase 3–4, MVP ×10) ============
 * Misma forma que movimientos (`kind`, `type` = damageType) para combat.js.
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
    melee: [
      { t: '+40% daño', m: { dmg: 1.4 } },
      { t: '+25% alcance', m: { radius: 1.25 } },
      { t: '-20% recarga', m: { cd: 0.8 } },
      { t: 'Golpea en 360°', m: { arc: 9, dmg: 1.45 } }
    ],
    orbit: [
      { t: '+1 orbe', m: { count: 1 } },
      { t: '+45% daño', m: { dmg: 1.45 } },
      { t: '+20% radio', m: { radius: 1.2, speed: 1.2 } },
      { t: '+1 orbe y +40% daño', m: { count: 1, dmg: 1.4 } }
    ],
    chain: [
      { t: '+2 saltos', m: { count: 2 } },
      { t: '+40% daño', m: { dmg: 1.4 } },
      { t: '-20% recarga', m: { cd: 0.8 } },
      { t: '+2 saltos y +35% daño', m: { count: 2, dmg: 1.35 } }
    ],
    cone: [
      { t: '+3 disparos', m: { count: 3 } },
      { t: '+35% daño', m: { dmg: 1.35 } },
      { t: '+25% alcance', m: { life: 1.25 } },
      { t: '+3 disparos y +1 perforación', m: { count: 3, pierce: 1 } }
    ],
    dash: [
      { t: '+40% daño', m: { dmg: 1.4 } },
      { t: '+25% distancia', m: { radius: 1.25 } },
      { t: '-20% recarga', m: { cd: 0.8 } },
      { t: '+55% daño', m: { dmg: 1.55 } }
    ],
    aura: [
      { t: '+30% radio', m: { radius: 1.3 } },
      { t: '+40% daño', m: { dmg: 1.4 } },
      { t: 'Golpea más a menudo', m: { cd: 0.75 } },
      { t: '+30% radio y +45% daño', m: { radius: 1.3, dmg: 1.45 } }
    ],
    mine: [
      { t: '+1 mina', m: { count: 1 } },
      { t: '+45% daño', m: { dmg: 1.45 } },
      { t: '+25% radio', m: { radius: 1.25 } },
      { t: '+1 mina y -20% recarga', m: { count: 1, cd: 0.8 } }
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
      desc: 'Disparo de energía hacia el enemigo más cercano.',
      cd: 0.82,
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
      cd: 1.12,
      dmg: 22,
      radius: 360,
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
      speed: 300,
      size: 6,
      life: 0.55,
      pierce: 0
    },
    {
      id: 'ts-stone-sweep',
      name: 'Barrido pétreo',
      kind: 'melee',
      type: 'physical',
      desc: 'Golpe en arco a todo lo que tienes delante.',
      cd: 0.58,
      dmg: 15,
      radius: 50,
      arc: 1.6,
      knock: 70
    },
    {
      id: 'ts-shard-orbit',
      name: 'Orbita de fragmentos',
      kind: 'orbit',
      type: 'energy',
      desc: 'Fragmentos que giran a tu alrededor.',
      cd: 0.32,
      dmg: 12,
      count: 3,
      radius: 58,
      speed: 2.3,
      size: 8
    },
    {
      id: 'ts-spark-chain',
      name: 'Cadena de chispas',
      kind: 'chain',
      type: 'energy',
      desc: 'Salta de un enemigo a los siguientes más cercanos.',
      cd: 0.95,
      dmg: 16,
      count: 3,
      radius: 220,
      speed: 520
    },
    {
      id: 'ts-gust-cone',
      name: 'Ráfaga cortante',
      kind: 'cone',
      type: 'physical',
      desc: 'Disparos en abanico de corto alcance.',
      cd: 0.72,
      dmg: 8,
      count: 6,
      arc: 0.85,
      speed: 360,
      life: 0.4,
      size: 5,
      pierce: 1
    },
    {
      id: 'ts-lunge-strike',
      name: 'Embestida veloz',
      kind: 'dash',
      type: 'physical',
      desc: 'Cruzas hacia el objetivo golpeando en el camino.',
      cd: 0.88,
      dmg: 19,
      radius: 100,
      width: 32,
      knock: 50
    },
    {
      id: 'ts-ember-mine',
      name: 'Mina incandescente',
      kind: 'mine',
      type: 'fire',
      desc: 'Deja minas que estallan al pisarlas.',
      cd: 1.1,
      dmg: 22,
      count: 2,
      radius: 38,
      life: 8
    },
    {
      id: 'ts-ward-pulse',
      name: 'Pulso de tutela',
      kind: 'buff',
      type: 'energy',
      desc: 'Refuerza tu daño durante unos segundos.',
      cd: 5.5,
      dmg: 0,
      stat: 'atk',
      amount: 0.12,
      dur: 4.5,
      stacks: 3
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

  function poolFor(creature) {
    if (!creature) return [];
    if (creature.role === 'player' || creature.id === 'wander_archmage') return POOL.all.slice();
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
