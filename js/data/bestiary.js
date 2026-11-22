/* ============ bestiary.js — Cyclopedia: Bestiary + Bosstiary (BST-1) ============
 * Contrato de datos alineado a la estructura Cyclopedia (wiki Tibia).
 * Ver docs/CYCLOPEDIA_REFERENCE.md
 */
G.Bestiary = (() => {
  const VERSION = 1;

  const SECTIONS = ['bestiary', 'bosstiary'];
  const BOSS_CATEGORIES = ['bane', 'archfoe', 'nemesis'];

  /** Bosstiary category copy (English). */
  const BOSS_CATEGORY_INFO = {
    bane: {
      label: 'Bane',
      blurb: 'Repeatable Bosstiary bosses (e.g. Black Knight) that appear mid-run.'
    },
    archfoe: {
      label: 'Archfoe',
      blurb: 'Rare victories; special encounters (Rift when enabled).'
    },
    nemesis: {
      label: 'Nemesis',
      blurb: 'Run-closing bosses; highest danger and mastery thresholds.'
    }
  };

  /** Alineado con TibiaWiki Bestiary/Difficulties (criaturas ordinarias + very rare elite). */
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
    /** Reservado: dificultad legacy en filas; bosstiary usa BOSSTIARY_THRESHOLDS. */
    boss: { stage1: 1, stage2: 3, final: 5, points: 100 }
  };

  /** Bosstiary — categorías Bane / Archfoe / Nemesis (wiki Cyclopedia). */
  const BOSSTIARY_THRESHOLDS = {
    bane: { stage1: 25, stage2: 100, final: 300, points: 30 },
    archfoe: { stage1: 5, stage2: 20, final: 60, points: 60 },
    nemesis: { stage1: 1, stage2: 3, final: 5, points: 60 }
  };

  const REVEAL_FIELDS = {
    stage1: new Set(['hp', 'xp', 'behavior', 'description', 'occurrence']),
    stage2: new Set(['damage', 'speed', 'abilities', 'resistances']),
    stage3: new Set(['drops', 'tips', 'statistics'])
  };

  /** CYC-4: ocurrencia por dificultad (fallback) + bandas de spawnWeight. */
  const OCCURRENCE_BY_DIFFICULTY = {
    harmless: 'common',
    trivial: 'common',
    easy: 'common',
    medium: 'uncommon',
    hard: 'uncommon',
    challenging: 'rare',
    elite: 'very_rare',
    boss: 'very_rare'
  };

  const OCCURRENCE_WEIGHT_BANDS = [
    { min: 1, occurrence: 'common' },
    { min: 0.7, occurrence: 'uncommon' },
    { min: 0.4, occurrence: 'rare' },
    { min: 0.001, occurrence: 'very_rare' }
  ];

  const OCCURRENCE_SCALE = {
    byDifficulty: OCCURRENCE_BY_DIFFICULTY,
    weightBands: OCCURRENCE_WEIGHT_BANDS
  };

  const OCCURRENCE_LABEL = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    very_rare: 'Very rare'
  };

  /** D1 — internal stage keys → UI label (English). */
  const STAGE_LABELS = {
    bestiary: {
      unknown: 'Unknown',
      discovered: 'Sighted',
      stage_1: 'Tracked',
      stage_2: 'Studied',
      completed: 'Mastered'
    },
    bosstiary: {
      unknown: 'Unknown',
      discovered: 'Sighted',
      stage_1: 'Prowess',
      stage_2: 'Expertise',
      completed: 'Mastery'
    }
  };

  const CATEGORY_ORDER = ['bestiary', 'bosstiary'];

  /** Bestiary creature difficulties (excl. keys solo legacy en filas). */
  const BESTIARY_CREATURE_DIFFICULTIES = DIFFICULTIES.filter(d => d !== 'boss');

  /**
   * Boss con catálogo separado de la criatura base (variante de run).
   * Datos de combate auxiliares en G.CREATURES (bestiary deshabilitado allí).
   */
  const EXTRA_ENTRIES = [];

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
      name: 'Pickup radius',
      unit: '+5% orbs per level',
      icon: 'frozenStarlight',
      maxLevel: 5,
      baseCost: 6,
      costGrow: 1.42,
      perLevel: { pickupRadiusPct: 5 }
    },
    {
      id: 'vitality',
      name: 'Vitality',
      unit: '+4% max HP per level',
      icon: 'heart',
      maxLevel: 10,
      baseCost: 10,
      costGrow: 1.48,
      perLevel: { maxHpPct: 4 }
    },
    {
      id: 'haste',
      name: 'Light step',
      unit: '+2% move speed per level',
      icon: 'medal2',
      maxLevel: 10,
      baseCost: 8,
      costGrow: 1.45,
      perLevel: { moveSpeedPct: 2 }
    },
    {
      id: 'scout_reroll',
      name: 'Card review',
      unit: '+1 level-up reroll per run',
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
      name: 'Field notes',
      description: 'Unlock extra tips in bestiary detail (content pending).',
      icon: 'book',
      cost: 25,
      stub: true
    }
  ];

  const CHARM_TRIGGERS = ['onHit', 'onHitTaken', 'onPickup'];
  const CHARM_EFFECT_KINDS = new Set([
    'bonusDamage', 'mitigateHit', 'moveSpeedBurst', 'vampiricHeal', 'crippleSlow',
    'pickupXpBonus', 'magnetRadiusBurst', 'magicShieldBump'
  ]);

  /** Global charms use wilderness until per-class loadouts (D3) in a later phase. */
  const CHARM_DEFAULT_CLASS = 'wilderness';

  const CHARM_CLASS_LABEL = {
    wilderness: 'Wilderness',
    unknown: 'Unknown'
  };

  /** Charms — unlock with charm points; one equipped slot (CYC-7). */
  const CHARMS = [
    {
      id: 'wound',
      name: 'Persistent wound',
      description: 'Low chance of bonus damage based on the enemy\'s max HP (capped on bosses).',
      nameKey: 'charm.wound.name',
      descriptionKey: 'charm.wound.description',
      bestiaryClass: 'wilderness',
      trigger: 'onHit',
      maxLevel: 1,
      cost: 20,
      procChance: 0.03,
      cooldownMs: 1000,
      noRecursion: true,
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
      name: 'Steadfast parry',
      description: 'Sometimes reduces incoming hit damage.',
      nameKey: 'charm.parry.name',
      descriptionKey: 'charm.parry.description',
      bestiaryClass: 'wilderness',
      trigger: 'onHitTaken',
      maxLevel: 1,
      cost: 25,
      procChance: 0.02,
      cooldownMs: 2000,
      noRecursion: true,
      effect: { kind: 'mitigateHit', value: 0.35 },
      enabled: true
    },
    {
      id: 'stride',
      name: 'Stride',
      description: 'Brief speed boost when you pick up loot.',
      nameKey: 'charm.stride.name',
      descriptionKey: 'charm.stride.description',
      bestiaryClass: 'wilderness',
      trigger: 'onPickup',
      maxLevel: 1,
      cost: 18,
      procChance: 0.04,
      cooldownMs: 1500,
      noRecursion: true,
      effect: { kind: 'moveSpeedBurst', value: 0.15, durationMs: 800 },
      enabled: true
    },
    {
      id: 'vampiric',
      name: 'Vampiric touch',
      description: 'Rarely heals you for a slice of your max HP on hit.',
      nameKey: 'charm.vampiric.name',
      descriptionKey: 'charm.vampiric.description',
      bestiaryClass: 'wilderness',
      trigger: 'onHit',
      maxLevel: 1,
      cost: 28,
      procChance: 0.025,
      cooldownMs: 1400,
      noRecursion: true,
      effect: { kind: 'vampiricHeal', scale: 'ownerMaxHp', value: 0.022 },
      enabled: true
    },
    {
      id: 'cripple',
      name: 'Cripple',
      description: 'Chance to slow the target after you strike.',
      nameKey: 'charm.cripple.name',
      descriptionKey: 'charm.cripple.description',
      bestiaryClass: 'wilderness',
      trigger: 'onHit',
      maxLevel: 1,
      cost: 24,
      procChance: 0.035,
      cooldownMs: 1100,
      noRecursion: true,
      effect: { kind: 'crippleSlow', value: 0.24, durationMs: 2000 },
      enabled: true
    },
    {
      id: 'scavenger',
      name: 'Scavenger',
      description: 'Bonus experience when you collect an XP orb.',
      nameKey: 'charm.scavenger.name',
      descriptionKey: 'charm.scavenger.description',
      bestiaryClass: 'wilderness',
      trigger: 'onPickup',
      maxLevel: 1,
      cost: 22,
      procChance: 0.06,
      cooldownMs: 400,
      noRecursion: true,
      effect: { kind: 'pickupXpBonus', value: 0.18 },
      enabled: true
    },
    {
      id: 'pulse',
      name: 'Loot pulse',
      description: 'Widens pickup radius briefly after collecting loot.',
      nameKey: 'charm.pulse.name',
      descriptionKey: 'charm.pulse.description',
      bestiaryClass: 'wilderness',
      trigger: 'onPickup',
      maxLevel: 1,
      cost: 20,
      procChance: 0.05,
      cooldownMs: 2000,
      noRecursion: true,
      effect: { kind: 'magnetRadiusBurst', value: 0.32, durationMs: 1400 },
      enabled: true
    },
    {
      id: 'bulwark',
      name: 'Bulwark',
      description: 'When struck, may add a small magic shield buffer (needs an active shield).',
      nameKey: 'charm.bulwark.name',
      descriptionKey: 'charm.bulwark.description',
      bestiaryClass: 'wilderness',
      trigger: 'onHitTaken',
      maxLevel: 1,
      cost: 30,
      procChance: 0.018,
      cooldownMs: 3200,
      noRecursion: true,
      effect: { kind: 'magicShieldBump', value: 0.09 },
      enabled: true
    }
  ];

  function charmClassLabel(charm) {
    if (!charm) return '—';
    const c = charm.bestiaryClass || CHARM_DEFAULT_CLASS;
    return CHARM_CLASS_LABEL[c] || c;
  }

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

  function occurrenceFromWeight(weight) {
    if (weight == null || !Number.isFinite(weight) || weight <= 0) return null;
    for (const band of OCCURRENCE_WEIGHT_BANDS) {
      if (weight >= band.min) return band.occurrence;
    }
    return 'very_rare';
  }

  function occurrenceScore(row) {
    if (!row || row.role !== 'enemy') return null;
    const w = row.spawnWeight == null ? 0 : Math.max(0, row.spawnWeight);
    const tier = row.tier == null ? 0 : Math.max(0, Math.min(3, row.tier));
    const unlockEarly = row.tierUnlockAt == null || row.tierUnlockAt <= 0 ? 0.15 : 0;
    const eventGuaranteed = row.spawnWeight === 0 && row.boss ? 0.15 : 0;
    const spawnPart = Math.min(1, w / 1.2) * 0.45;
    const tierPart = (1 - tier / 3) * 0.25;
    return spawnPart + tierPart + unlockEarly + eventGuaranteed;
  }

  /** Ocurrencia efectiva de una fila de criatura (declarada o derivada). */
  function occurrenceForCreature(row) {
    if (!row) return null;
    const E = G.CyclopediaEnums;
    if (row.occurrence && E && E.isValid('OCCURRENCE', row.occurrence)) return row.occurrence;
    const fromWeight = occurrenceFromWeight(row.spawnWeight);
    if (fromWeight) return fromWeight;
    if (row.difficulty && OCCURRENCE_BY_DIFFICULTY[row.difficulty]) return OCCURRENCE_BY_DIFFICULTY[row.difficulty];
    return null;
  }

  function occurrenceLabel(occurrence) {
    return occurrence && OCCURRENCE_LABEL[occurrence] ? OCCURRENCE_LABEL[occurrence] : occurrence || '—';
  }

  function stageLabel(internalStage, section = 'bestiary') {
    const sec = section === 'bosstiary' ? 'bosstiary' : 'bestiary';
    const map = STAGE_LABELS[sec] || STAGE_LABELS.bestiary;
    return map[internalStage] || internalStage;
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

  function thresholdsForBossCategory(category) {
    const t = BOSSTIARY_THRESHOLDS[category];
    if (!t) return null;
    return { stage1: t.stage1, stage2: t.stage2, final: t.final };
  }

  function rewardPointsForBossCategory(category) {
    const t = BOSSTIARY_THRESHOLDS[category];
    return t ? t.points : 0;
  }

  /** Cyclopedia section desde datos (alias legacy entryType boss → bosstiary). */
  function resolveSection(meta) {
    if (!meta) return 'bestiary';
    if (meta.section === 'bestiary' || meta.section === 'bosstiary') return meta.section;
    if (meta.entryType === 'boss') return 'bosstiary';
    return 'bestiary';
  }

  /** Umbrales efectivos de una fila de catálogo (criatura o extra). */
  function resolveThresholds(row) {
    const b = row.bestiary;
    const custom = b && b.thresholds;
  const section = resolveSection(b);
    let base = null;
    if (section === 'bosstiary') {
      const cat = (b && b.bossCategory) || 'nemesis';
      base = thresholdsForBossCategory(cat);
    } else {
      base = thresholdsForDifficulty(row.difficulty);
    }
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
    if (resolveSection(row.bestiary) === 'bosstiary') {
      const cat = (row.bestiary && row.bestiary.bossCategory) || 'nemesis';
      return rewardPointsForBossCategory(cat);
    }
    return rewardPointsForDifficulty(row.difficulty);
  }

  function creatureRow(id) {
    const extra = EXTRA_ENTRIES.find(e => e.id === id);
    if (extra && extra.bestiary && extra.bestiary.enabled) return extra;
    const base = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
    if (base) return base;
    return extra || null;
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

  function listBossEntries(filters = {}) {
    return listEntries(Object.assign({}, filters, { section: 'bosstiary' }));
  }

  function listEntries(filters = {}) {
    let list = catalogRows().map(row => {
      const section = resolveSection(row.bestiary);
      return {
        creatureId: row.id,
        section,
        /** @deprecated use section */
        entryType: section === 'bosstiary' ? 'boss' : 'normal',
        bossCategory: section === 'bosstiary' ? (row.bestiary.bossCategory || 'nemesis') : null,
        difficulty: row.difficulty,
        family: row.family || null,
        thresholds: resolveThresholds(row),
        rewardPoints: resolveRewardPoints(row),
        occurrence: occurrenceForCreature(row),
        nameKey: row.nameKey || null,
        displayName: row.name || null
      };
    });
    if (filters.section) list = list.filter(e => e.section === filters.section);
    if (filters.entryType) {
      const wantBoss = filters.entryType === 'boss';
      list = list.filter(e => (e.section === 'bosstiary') === wantBoss);
    }
    if (filters.difficulty) list = list.filter(e => e.difficulty === filters.difficulty);
    list.sort((a, b) => {
      const oa = CATEGORY_ORDER.indexOf(a.section);
      const ob = CATEGORY_ORDER.indexOf(b.section);
      if (oa !== ob) return oa - ob;
      return String(a.creatureId).localeCompare(String(b.creatureId));
    });
    return list;
  }

  function getCatalogEntry(creatureId) {
    const row = creatureRow(creatureId);
    if (!row || !row.bestiary || !row.bestiary.enabled) return null;
    const combat = combatCreature(row);
    const section = resolveSection(row.bestiary);
    return {
      creatureId: row.id,
      section,
      entryType: section === 'bosstiary' ? 'boss' : 'normal',
      bossCategory: section === 'bosstiary' ? (row.bestiary.bossCategory || 'nemesis') : null,
      difficulty: row.difficulty,
      family: row.family || null,
      tags: row.tags || [],
      thresholds: resolveThresholds(row),
      rewardPoints: resolveRewardPoints(row),
      tipKeys: row.bestiary.tipKeys || [],
      nameKey: row.nameKey || null,
      descriptionKey: row.descriptionKey || null,
      displayName: row.name || null,
      description: row.description || null,
      combatCreatureId: combat && combat.id ? combat.id : row.baseCreatureId || row.id,
      legacyId: combat && combat.legacyId != null ? combat.legacyId : null,
      occurrence: occurrenceForCreature(row),
      reveal: row.bestiary.reveal || {
        stage1: ['hp', 'xp', 'behavior', 'description', 'occurrence'],
        stage2: ['damage', 'speed', 'abilities', 'resistances'],
        stage3: ['drops', 'tips', 'statistics']
      }
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
    const section = resolveSection(b);
    if (!SECTIONS.includes(section)) issues.push(`${id}: invalid section ${b.section}`);
    if (section === 'bosstiary') {
      if (!BOSS_CATEGORIES.includes(b.bossCategory)) issues.push(`${id}: bosstiary requires bossCategory bane|archfoe|nemesis`);
    } else if (!BESTIARY_CREATURE_DIFFICULTIES.includes(row.difficulty)) {
      issues.push(`${id}: invalid bestiary creature difficulty ${row.difficulty}`);
    }
    if (row.baseCreatureId && (!G.CREATURE_BY_ID || !G.CREATURE_BY_ID[row.baseCreatureId])) {
      issues.push(`${id}: baseCreatureId ${row.baseCreatureId} not found`);
    }
    validateThresholds(resolveThresholds(row), id, issues);
    const pts = resolveRewardPoints(row);
    if (!Number.isFinite(pts) || pts < 0) issues.push(`${id}: invalid reward points`);
    if (!b.reveal) {
      issues.push(`${id}: missing reveal`);
    } else {
      validateReveal(b.reveal, id, issues);
    }
    const occDeclared = row.occurrence;
    const occDerived = occurrenceForCreature(row);
    if (occDeclared && G.CyclopediaEnums && !G.CyclopediaEnums.isValid('OCCURRENCE', occDeclared)) {
      issues.push(`${id}: invalid occurrence ${occDeclared}`);
    }
    if (occDeclared && occDerived && occDeclared !== occDerived && row.spawnWeight != null && row.spawnWeight > 0) {
      issues.push(`${id}: occurrence ${occDeclared} differs from spawn-derived ${occDerived}`);
    }
  const tips = b.tipKeys || [];
  for (const k of tips) {
    if (typeof k !== 'string' || !k) issues.push(`${id}: invalid tipKey`);
    else if (G.BESTIARY_TIPS && !G.BESTIARY_TIPS[k]) issues.push(`${id}: missing tip text for ${k}`);
  }
    if (section === 'bosstiary' && !row.boss && !row.baseCreatureId) {
      const base = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
      if (!base || !base.boss) {
        if (!row.baseCreatureId) issues.push(`${id}: bosstiary entry should set baseCreatureId or boss creature row`);
      }
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
    const E = G.CyclopediaEnums;
    for (const c of CHARMS) {
      if (seen.has(c.id)) issues.push(`duplicate charm id ${c.id}`);
      seen.add(c.id);
      if (!c.nameKey || !c.descriptionKey) issues.push(`charm ${c.id}: missing nameKey/descriptionKey`);
      if (!Number.isFinite(c.cost) || c.cost < 0) issues.push(`charm ${c.id}: invalid cost`);
      if (!CHARM_TRIGGERS.includes(c.trigger)) issues.push(`charm ${c.id}: invalid trigger`);
      const cls = c.bestiaryClass || CHARM_DEFAULT_CLASS;
      if (E && !E.isValid('BESTIARY_CLASS', cls)) issues.push(`charm ${c.id}: invalid bestiaryClass ${cls}`);
      const ef = c.effect;
      if (!ef || !CHARM_EFFECT_KINDS.has(ef.kind)) issues.push(`charm ${c.id}: invalid effect.kind`);
      if (ef && ef.kind === 'bonusDamage' && (!Number.isFinite(ef.bossCap) || ef.bossCap > ef.value)) {
        issues.push(`charm ${c.id}: bossCap must be <= value for bonusDamage`);
      }
      if (c.enabled !== false && c.noRecursion !== true) issues.push(`charm ${c.id}: noRecursion must be true`);
    }
    if (CHARMS.filter(c => c.enabled !== false).length < 6) {
      issues.push('charm catalog: expected at least 6 enabled charms (CYC-7)');
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
    if (G.Cyclopedia && G.Cyclopedia.appendValidationIssues) {
      G.Cyclopedia.appendValidationIssues(issues);
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
    SECTIONS,
    BOSS_CATEGORIES,
    BOSS_CATEGORY_INFO,
    listBossEntries,
    BOSSTIARY_THRESHOLDS,
    DIFFICULTIES,
    THRESHOLDS_BY_DIFFICULTY,
    REVEAL_FIELDS,
    OCCURRENCE_SCALE,
    OCCURRENCE_BY_DIFFICULTY,
    OCCURRENCE_LABEL,
    STAGE_LABELS,
    occurrenceForCreature,
    occurrenceFromWeight,
    occurrenceScore,
    occurrenceLabel,
    stageLabel,
    EXTRA_ENTRIES,
    resolveSection,
    GLOBAL_UPGRADE_CAPS,
    GLOBAL_UPGRADES,
    CONTENT_UNLOCKS,
    upgradeById,
    unlockById,
    upgradeCost,
    CHARMS,
    CHARM_TRIGGERS,
    CHARM_EFFECT_KINDS,
    CHARM_DEFAULT_CLASS,
    CHARM_CLASS_LABEL,
    charmClassLabel,
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
