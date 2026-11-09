/* ============ bestiary.js — contrato de datos del Bestiario (BST-1) ============
 * Configuración, umbrales provisionales, charms stub y validación pura.
 * Sin progreso de jugador, DOM ni persistencia (BST-2+).
 */
G.Bestiary = (() => {
  const VERSION = 1;

  /** Alineado con TibiaWiki Bestiary/Difficulties (ordinarias + very rare élite/boss MVP). */
  const DIFFICULTIES = ['harmless', 'trivial', 'easy', 'medium', 'hard', 'challenging', 'elite', 'boss'];

  /** stage1/2/final = primer / segundo / tercer detalle; points = charm points al completar (ordinario). */
  const THRESHOLDS_BY_DIFFICULTY = {
    harmless: { stage1: 5, stage2: 10, final: 25, points: 1 },
    trivial: { stage1: 10, stage2: 100, final: 250, points: 5 },
    easy: { stage1: 25, stage2: 250, final: 500, points: 15 },
    medium: { stage1: 50, stage2: 500, final: 1000, points: 25 },
    hard: { stage1: 100, stage2: 1000, final: 2500, points: 50 },
    challenging: { stage1: 200, stage2: 2000, final: 5000, points: 100 },
    /** Very Rare (dificultad Medium): 2 / 3 / 5 muertes, charm points ×2. */
    elite: { stage1: 2, stage2: 3, final: 5, points: 50 },
    /** Nemesis (Bosstiary): 1 / 3 / 5; recompensa alineada a tier Challenging. */
    boss: { stage1: 1, stage2: 3, final: 5, points: 100 }
  };

  const REVEAL_FIELDS = {
    stage1: new Set(['hp', 'xp', 'behavior', 'description']),
    stage2: new Set(['damage', 'speed', 'abilities', 'resistances']),
    stage3: new Set(['drops', 'tips', 'statistics'])
  };

  const ENTRY_TYPES = new Set(['normal', 'elite', 'boss']);

  const CATEGORY_ORDER = ['normal', 'elite', 'boss'];

  /** Entradas de catálogo sin fila propia en G.CREATURES (spawn usa otra plantilla). */
  const EXTRA_ENTRIES = [
    {
      id: 'minotaur_guard',
      baseCreatureId: 'minotaur',
      name: 'Minotaur Guard',
      description: 'Very Rare del bestiario: escolta blindada del laberinto; una vez por run.',
      nameKey: 'creature.minotaur_guard.name',
      descriptionKey: 'creature.minotaur_guard.description',
      family: 'humanoid',
      difficulty: 'elite', // Very Rare (Tibia)
      tags: ['melee', 'ground'],
      weaknesses: ['ice', 'death'],
      resistances: ['fire', 'holy', 'physical'],
      bestiary: {
        enabled: true,
        entryType: 'elite',
        thresholds: null,
        rewardPoints: null,
        reveal: {
          stage1: ['hp', 'xp', 'behavior', 'description'],
          stage2: ['damage', 'speed', 'abilities', 'resistances'],
          stage3: ['drops', 'tips', 'statistics']
        },
        tipKeys: ['bestiary.minotaur_guard.tip1'],
        /** En runtime, instancias con sentinelElite mapean a este id (BST-3). */
        runtimeFlag: 'sentinelElite'
      }
    }
  ];

  const GLOBAL_UPGRADE_CAPS = {
    maxPickupRadiusPct: 25,
    maxMaxHpPct: 40,
    maxMoveSpeedPct: 20,
    maxRerollBonus: 2
  };

  /** Mejoras globales con puntos del bestiario (BST-7). */
  const GLOBAL_UPGRADES = [
    {
      id: 'pickup_radius',
      name: 'Radio de recogida',
      unit: '+5% orbes por nivel',
      icon: 'lifeorb',
      maxLevel: 5,
      baseCost: 6,
      costGrow: 1.42,
      perLevel: { pickupRadiusPct: 5 }
    },
    {
      id: 'vitality',
      name: 'Vitalidad',
      unit: '+4% vida máx. por nivel',
      icon: 'heart',
      maxLevel: 10,
      baseCost: 10,
      costGrow: 1.48,
      perLevel: { maxHpPct: 4 }
    },
    {
      id: 'haste',
      name: 'Paso ligero',
      unit: '+2% velocidad por nivel',
      icon: 'medal2',
      maxLevel: 10,
      baseCost: 8,
      costGrow: 1.45,
      perLevel: { moveSpeedPct: 2 }
    },
    {
      id: 'scout_reroll',
      name: 'Revisión de cartas',
      unit: '+1 cambio de cartas por run',
      icon: 'up',
      maxLevel: 2,
      baseCost: 22,
      costGrow: 1.75,
      perLevel: { rerollBonus: 1 }
    }
  ];

  /** Desbloqueos de contenido (stub validado; el dueño aplica el efecto). */
  const CONTENT_UNLOCKS = [
    {
      id: 'bestiary_field_notes',
      name: 'Notas de campo',
      description: 'Registra consejos extra en el detalle del bestiario (contenido pendiente).',
      icon: 'book',
      cost: 25,
      stub: true
    }
  ];

  /** Charms MVP: definidos; desbloqueo en BST-8. */
  const CHARMS = [
    {
      id: 'wound',
      name: 'Herida persistente',
      description: 'Probabilidad baja de daño extra según la vida del enemigo.',
      nameKey: 'charm.wound.name',
      descriptionKey: 'charm.wound.description',
      trigger: 'onHit',
      maxLevel: 1,
      cost: 20,
      procChance: 0.03,
      cooldownMs: 1000,
      effect: {
        kind: 'bonusDamage',
        damageType: 'physical',
        scale: 'targetMaxHp',
        value: 0.01,
        bossCap: 0.0025
      },
      enabled: true
    },
    {
      id: 'parry',
      name: 'Parada tenaz',
      description: 'A veces reduce el daño recibido.',
      nameKey: 'charm.parry.name',
      descriptionKey: 'charm.parry.description',
      trigger: 'onHitTaken',
      maxLevel: 1,
      cost: 25,
      procChance: 0.02,
      cooldownMs: 2000,
      effect: { kind: 'mitigateHit', value: 0.35 },
      enabled: true
    },
    {
      id: 'stride',
      name: 'Zancada',
      description: 'Al recoger botín, breve impulso de velocidad.',
      nameKey: 'charm.stride.name',
      descriptionKey: 'charm.stride.description',
      trigger: 'onPickup',
      maxLevel: 1,
      cost: 18,
      procChance: 0.04,
      cooldownMs: 1500,
      effect: { kind: 'moveSpeedBurst', value: 0.15, durationMs: 800 },
      enabled: true
    }
  ];

  function charmById(id) {
    return CHARMS.find(c => c.id === id) || null;
  }

  function charmCatalog() {
    return CHARMS.map(c => Object.assign({}, c));
  }

  const DEBUG = {
    logValidation: typeof location !== 'undefined' && /[?&]dev\b/.test(location.search)
  };

  function isPlainObj(o) {
    return o && typeof o === 'object' && !Array.isArray(o);
  }

  function thresholdsForDifficulty(difficulty) {
    const t = THRESHOLDS_BY_DIFFICULTY[difficulty];
    if (!t) return null;
    return { stage1: t.stage1, stage2: t.stage2, final: t.final };
  }

  function rewardPointsForDifficulty(difficulty) {
    const t = THRESHOLDS_BY_DIFFICULTY[difficulty];
    return t ? t.points : 0;
  }

  /** Umbrales efectivos de una fila de catálogo (criatura o extra). */
  function resolveThresholds(row) {
    const diff = row.difficulty;
    const custom = row.bestiary && row.bestiary.thresholds;
    const base = thresholdsForDifficulty(diff);
    if (!base) return null;
    if (!custom) return base;
    return {
      stage1: custom.stage1 != null ? custom.stage1 : base.stage1,
      stage2: custom.stage2 != null ? custom.stage2 : base.stage2,
      final: custom.final != null ? custom.final : base.final
    };
  }

  function resolveRewardPoints(row) {
    if (row.bestiary && Number.isFinite(row.bestiary.rewardPoints)) return row.bestiary.rewardPoints;
    return rewardPointsForDifficulty(row.difficulty);
  }

  function creatureRow(id) {
    if (G.CREATURE_BY_ID && G.CREATURE_BY_ID[id]) return G.CREATURE_BY_ID[id];
    return EXTRA_ENTRIES.find(e => e.id === id) || null;
  }

  function combatCreature(row) {
    if (!row) return null;
    if (row.baseCreatureId && G.CREATURE_BY_ID) return G.CREATURE_BY_ID[row.baseCreatureId];
    return row.legacyId != null ? row : null;
  }

  /** Filas de catálogo bestiario habilitadas (datos puros). */
  function catalogRows() {
    const out = [];
    if (G.CREATURES) {
      for (const c of G.CREATURES) {
        if (c.bestiary && c.bestiary.enabled) out.push(c);
      }
    }
    for (const e of EXTRA_ENTRIES) {
      if (e.bestiary && e.bestiary.enabled) out.push(e);
    }
    return out;
  }

  function listEntries(filters = {}) {
    let list = catalogRows().map(row => ({
      creatureId: row.id,
      entryType: row.bestiary.entryType || 'normal',
      difficulty: row.difficulty,
      family: row.family || null,
      thresholds: resolveThresholds(row),
      rewardPoints: resolveRewardPoints(row),
      nameKey: row.nameKey || null,
      displayName: row.name || null
    }));
    if (filters.entryType) list = list.filter(e => e.entryType === filters.entryType);
    if (filters.difficulty) list = list.filter(e => e.difficulty === filters.difficulty);
    list.sort((a, b) => {
      const oa = CATEGORY_ORDER.indexOf(a.entryType);
      const ob = CATEGORY_ORDER.indexOf(b.entryType);
      if (oa !== ob) return oa - ob;
      return String(a.creatureId).localeCompare(String(b.creatureId));
    });
    return list;
  }

  function getCatalogEntry(creatureId) {
    const row = creatureRow(creatureId);
    if (!row || !row.bestiary || !row.bestiary.enabled) return null;
    const combat = combatCreature(row);
    return {
      creatureId: row.id,
      entryType: row.bestiary.entryType,
      difficulty: row.difficulty,
      family: row.family || null,
      tags: row.tags || [],
      thresholds: resolveThresholds(row),
      rewardPoints: resolveRewardPoints(row),
      reveal: row.bestiary.reveal,
      tipKeys: row.bestiary.tipKeys || [],
      nameKey: row.nameKey || null,
      descriptionKey: row.descriptionKey || null,
      displayName: row.name || null,
      description: row.description || null,
      combatCreatureId: combat && combat.id ? combat.id : row.baseCreatureId || row.id,
      legacyId: combat && combat.legacyId != null ? combat.legacyId : null
    };
  }

  function validateThresholds(th, ctx, issues) {
    if (!th) { issues.push(`${ctx}: missing thresholds`); return; }
    const s1 = +th.stage1, s2 = +th.stage2, fin = +th.final;
    if (!Number.isFinite(s1) || !Number.isFinite(s2) || !Number.isFinite(fin)) {
      issues.push(`${ctx}: thresholds must be finite numbers`);
      return;
    }
    if (!(s1 < s2 && s2 < fin)) issues.push(`${ctx}: thresholds must satisfy stage1 < stage2 < final`);
  }

  function validateReveal(reveal, ctx, issues) {
    if (!reveal) { issues.push(`${ctx}: missing reveal`); return; }
    for (const stage of ['stage1', 'stage2', 'stage3']) {
      const allowed = REVEAL_FIELDS[stage];
      const list = reveal[stage];
      if (!Array.isArray(list)) { issues.push(`${ctx}: reveal.${stage} must be an array`); continue; }
      for (const f of list) {
        if (!allowed.has(f)) issues.push(`${ctx}: unknown reveal field "${f}" in ${stage}`);
      }
    }
  }

  function validateCatalogRow(row, issues, seenIds) {
    const id = row.id;
    if (!id) { issues.push('catalog row missing id'); return; }
    if (seenIds.has(id)) issues.push(`duplicate bestiary id ${id}`);
    seenIds.add(id);
    const b = row.bestiary;
    if (!b || !b.enabled) return;
    if (!ENTRY_TYPES.has(b.entryType)) issues.push(`${id}: invalid entryType ${b.entryType}`);
    if (!DIFFICULTIES.includes(row.difficulty)) issues.push(`${id}: invalid difficulty ${row.difficulty}`);
    if (row.baseCreatureId && (!G.CREATURE_BY_ID || !G.CREATURE_BY_ID[row.baseCreatureId])) {
      issues.push(`${id}: baseCreatureId ${row.baseCreatureId} not found`);
    }
    validateThresholds(resolveThresholds(row), id, issues);
    const pts = resolveRewardPoints(row);
    if (!Number.isFinite(pts) || pts < 0) issues.push(`${id}: invalid reward points`);
    validateReveal(b.reveal, id, issues);
  const tips = b.tipKeys || [];
  for (const k of tips) {
    if (typeof k !== 'string' || !k) issues.push(`${id}: invalid tipKey`);
    else if (G.BESTIARY_TIPS && !G.BESTIARY_TIPS[k]) issues.push(`${id}: missing tip text for ${k}`);
  }
    if (b.entryType === 'boss' && !row.boss && !row.baseCreatureId) {
      const base = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
      if (!base || !base.boss) issues.push(`${id}: boss entryType without boss flag`);
    }
  }

  function upgradeById(id) {
    return GLOBAL_UPGRADES.find(u => u.id === id) || null;
  }

  function unlockById(id) {
    return CONTENT_UNLOCKS.find(u => u.id === id) || null;
  }

  function upgradeCost(def, level) {
    if (!def) return 0;
    const lv = Math.max(0, Math.floor(level));
    return Math.max(1, Math.round(def.baseCost * Math.pow(def.costGrow, lv)));
  }

  function validateUpgrades(issues) {
    const seen = new Set();
    let pickup = 0;
    let hp = 0;
    let spd = 0;
    let reroll = 0;
    for (const u of GLOBAL_UPGRADES) {
      if (seen.has(u.id)) issues.push(`duplicate upgrade id ${u.id}`);
      seen.add(u.id);
      if (!u.name || !u.icon) issues.push(`upgrade ${u.id}: missing name/icon`);
      if (!Number.isFinite(u.maxLevel) || u.maxLevel < 1) issues.push(`upgrade ${u.id}: invalid maxLevel`);
      if (!Number.isFinite(u.baseCost) || u.baseCost < 0) issues.push(`upgrade ${u.id}: invalid baseCost`);
      const pl = u.perLevel || {};
      if (pl.pickupRadiusPct) pickup += pl.pickupRadiusPct * u.maxLevel;
      if (pl.maxHpPct) hp += pl.maxHpPct * u.maxLevel;
      if (pl.moveSpeedPct) spd += pl.moveSpeedPct * u.maxLevel;
      if (pl.rerollBonus) reroll += pl.rerollBonus * u.maxLevel;
    }
    if (pickup > GLOBAL_UPGRADE_CAPS.maxPickupRadiusPct + 0.001) {
      issues.push(`upgrades exceed pickup cap (${pickup}% > ${GLOBAL_UPGRADE_CAPS.maxPickupRadiusPct}%)`);
    }
    if (hp > GLOBAL_UPGRADE_CAPS.maxMaxHpPct + 0.001) {
      issues.push(`upgrades exceed maxHp cap (${hp}% > ${GLOBAL_UPGRADE_CAPS.maxMaxHpPct}%)`);
    }
    if (spd > GLOBAL_UPGRADE_CAPS.maxMoveSpeedPct + 0.001) {
      issues.push(`upgrades exceed speed cap (${spd}% > ${GLOBAL_UPGRADE_CAPS.maxMoveSpeedPct}%)`);
    }
    if (reroll > GLOBAL_UPGRADE_CAPS.maxRerollBonus) {
      issues.push(`upgrades exceed reroll cap (${reroll} > ${GLOBAL_UPGRADE_CAPS.maxRerollBonus})`);
    }
  }

  function validateUnlocks(issues) {
    const seen = new Set();
    for (const u of CONTENT_UNLOCKS) {
      if (seen.has(u.id)) issues.push(`duplicate unlock id ${u.id}`);
      seen.add(u.id);
      if (!Number.isFinite(u.cost) || u.cost < 0) issues.push(`unlock ${u.id}: invalid cost`);
    }
  }

  function validateCharms(issues) {
    const seen = new Set();
    for (const c of CHARMS) {
      if (seen.has(c.id)) issues.push(`duplicate charm id ${c.id}`);
      seen.add(c.id);
      if (!c.nameKey || !c.descriptionKey) issues.push(`charm ${c.id}: missing nameKey/descriptionKey`);
      if (!Number.isFinite(c.cost) || c.cost < 0) issues.push(`charm ${c.id}: invalid cost`);
    }
  }

  /**
   * @param {boolean} strict  si true, console.error y devuelve false
   * @returns {{ ok: boolean, issues: string[] }}
   */
  function validate(strict = false) {
    const issues = [];
    for (const d of DIFFICULTIES) {
      validateThresholds(thresholdsForDifficulty(d), `difficulty:${d}`, issues);
    }
    validateCharms(issues);
    validateUpgrades(issues);
    validateUnlocks(issues);
    const seenIds = new Set();
    if (G.CREATURES) {
      for (const c of G.CREATURES) {
        if (c.bestiary && c.bestiary.enabled) validateCatalogRow(c, issues, seenIds);
      }
    }
    for (const e of EXTRA_ENTRIES) validateCatalogRow(e, issues, seenIds);
    for (const c of CHARMS) {
      if (c.enabled === false) continue;
    }
    const ok = issues.length === 0;
    if (!ok && (strict || DEBUG.logValidation)) {
      console.error('[G.Bestiary] validation failed:', issues);
    }
    return { ok, issues };
  }

  if (typeof location !== 'undefined' && /[?&]dev\b/.test(location.search)) validate(true);

  return {
    VERSION,
    DIFFICULTIES,
    THRESHOLDS_BY_DIFFICULTY,
    REVEAL_FIELDS,
    EXTRA_ENTRIES,
    GLOBAL_UPGRADE_CAPS,
    GLOBAL_UPGRADES,
    CONTENT_UNLOCKS,
    upgradeById,
    unlockById,
    upgradeCost,
    CHARMS,
    charmById,
    charmCatalog,
    DEBUG,
    thresholdsForDifficulty,
    rewardPointsForDifficulty,
    resolveThresholds,
    resolveRewardPoints,
    catalogRows,
    listEntries,
    getCatalogEntry,
    getEntry: getCatalogEntry,
    getCreatureRow: creatureRow,
    validate
  };
})();
