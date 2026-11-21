/* ============ cyclopedia-registry.js — facade Cyclopedia (CYC-1) ============
 * Solo lectura / validación. No persiste ni altera combate (CYC-2+).
 */
G.Cyclopedia = (() => {
  const E = () => G.CyclopediaEnums;
  const SCHEMA_VERSION = G.CYCLOPEDIA_SCHEMA || 1;

  function creatureRow(id) {
    if (!id || !G.CREATURE_BY_ID) return null;
    return G.CREATURE_BY_ID[id] || null;
  }

  function resolveBestiaryClass(c) {
    if (!c) return 'unknown';
    if (c.bestiaryClass && E().isValid('BESTIARY_CLASS', c.bestiaryClass)) return c.bestiaryClass;
    const map = E().FAMILY_DEFAULT_CLASS || {};
    if (c.family && map[c.family]) return map[c.family];
    return 'unknown';
  }

  function resolveRole(c) {
    if (!c) return null;
    if (c.role && E().isValid('ROLE', c.role)) return c.role;
    if (c.boss && c.finalBoss) return 'boss';
    if (c.boss) return 'miniboss';
    return 'fodder';
  }

  function resolveSpawnModes(c) {
    const modes = [];
    if (!c || c.role === 'player') return modes;
    if (c.finalBoss) modes.push('final_nemesis');
    if (c.boss && !c.finalBoss && c.spawnWeight === 0) modes.push('fixed_timer');
    if (c.spawnWeight != null && c.spawnWeight > 0) modes.push('hp_band');
    if (c.boss && c.bestiary && c.bestiary.section === 'bosstiary' && c.bestiary.bossCategory === 'bane') {
      modes.push('fixed_timer');
    }
    if (!modes.length && c.role === 'enemy') modes.push('hp_band');
    return modes.filter((m, i, a) => a.indexOf(m) === i);
  }

  function resolveOccurrence(c) {
    if (G.Bestiary && G.Bestiary.occurrenceForCreature) return G.Bestiary.occurrenceForCreature(c);
    if (c && c.occurrence && E().isValid('OCCURRENCE', c.occurrence)) return c.occurrence;
    return null;
  }

  function behaviorsOf(c) {
    if (!c) return [];
    const list = (c.behaviors && c.behaviors.length) ? c.behaviors.slice() : [];
    const primary = c.behavior || list[0];
    if (primary && !list.includes(primary)) list.unshift(primary);
    return list.filter(Boolean);
  }

  /**
   * Vista estable para UI, validadores y futuro save (sin funciones ni copia profunda de combate).
   * @param {string} creatureId
   * @returns {object|null}
   */
  function getDefinition(creatureId) {
    const c = creatureRow(creatureId);
    if (!c) return null;
    const catalog = G.Bestiary && G.Bestiary.getCatalogEntry
      ? G.Bestiary.getCatalogEntry(creatureId)
      : null;
    const beh = behaviorsOf(c);
    return {
      schemaVersion: SCHEMA_VERSION,
      id: c.id,
      legacyId: c.legacyId,
      nameKey: c.nameKey || null,
      displayName: c.name || null,
      descriptionKey: c.descriptionKey || null,
      family: c.family || null,
      bestiaryClass: resolveBestiaryClass(c),
      role: resolveRole(c),
      biome: Array.isArray(c.biome) ? c.biome.slice() : (c.biome ? [c.biome] : []),
      difficulty: c.difficulty || null,
      occurrence: resolveOccurrence(c),
      tags: Array.isArray(c.tags) ? c.tags.slice() : [],
      hp: c.hp,
      speed: c.speed,
      attack: c.attack,
      damageTypes: (c.damageTypes || []).slice(),
      weaknesses: (c.weaknesses || []).slice(),
      resistances: (c.resistances || []).slice(),
      immunities: (c.immunities || []).slice(),
      behaviors: beh,
      primaryBehavior: beh[0] || null,
      spawn: {
        weight: c.spawnWeight == null ? 0 : c.spawnWeight,
        tier: c.tier == null ? 0 : c.tier
      },
      spawnModes: resolveSpawnModes(c),
      flags: {
        boss: !!c.boss,
        finalBoss: !!c.finalBoss,
        boostEligible: !(c.boss || c.spawnWeight === 0 || (c.bestiary && c.bestiary.enabled === false))
      },
      bestiary: catalog ? {
        enabled: true,
        section: catalog.section,
        bossCategory: catalog.bossCategory,
        rewardPoints: catalog.rewardPoints
      } : (c.bestiary && c.bestiary.enabled ? { enabled: true, section: 'bestiary', bossCategory: null, rewardPoints: null } : null)
    };
  }

  /**
   * @param {{ role?: string, bestiaryOnly?: boolean, section?: string }} [filters]
   */
  function listCreatures(filters = {}) {
    const out = [];
    if (!G.CREATURES) return out;
    for (const c of G.CREATURES) {
      if (!c || !c.id) continue;
      if (filters.role && c.role !== filters.role) continue;
      const def = getDefinition(c.id);
      if (filters.bestiaryOnly && (!def.bestiary || !def.bestiary.enabled)) continue;
      if (filters.section && (!def.bestiary || def.bestiary.section !== filters.section)) continue;
      out.push(def);
    }
    out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return out;
  }

  function appendValidationIssues(issues) {
    if (!issues || !G.CREATURES) return;
    const ids = new Set();
    const legacies = new Set();
    const Ee = E();

    for (const c of G.CREATURES) {
      if (!c.id) {
        issues.push('cyclopedia: creature row missing id');
        continue;
      }
      if (ids.has(c.id)) issues.push(`cyclopedia: duplicate creature id ${c.id}`);
      ids.add(c.id);

      if (c.legacyId != null) {
        if (legacies.has(c.legacyId)) issues.push(`cyclopedia: duplicate legacyId ${c.legacyId}`);
        legacies.add(c.legacyId);
      }

      if (c.role === 'enemy' || c.role === 'elite') {
        if (!Number.isFinite(c.hp) || c.hp < 1) issues.push(`${c.id}: cyclopedia hp must be >= 1`);
      }

      if (c.bestiaryClass && !Ee.isValid('BESTIARY_CLASS', c.bestiaryClass)) {
        issues.push(`${c.id}: invalid bestiaryClass ${c.bestiaryClass}`);
      }

      if (c.occurrence && !Ee.isValid('OCCURRENCE', c.occurrence)) {
        issues.push(`${c.id}: invalid occurrence ${c.occurrence}`);
      }

      if (c.difficulty && !Ee.isValid('DIFFICULTY', c.difficulty)) {
        issues.push(`${c.id}: invalid difficulty ${c.difficulty}`);
      }

      for (const b of behaviorsOf(c)) {
        if (!Ee.isValid('BEHAVIOUR', b)) issues.push(`${c.id}: unknown behaviour ${b}`);
      }

      if (c.bestiary && c.bestiary.enabled && c.role === 'enemy' && !c.bestiaryClass && resolveBestiaryClass(c) === 'unknown') {
        issues.push(`${c.id}: bestiary enabled but bestiaryClass unknown (set bestiaryClass or family)`);
      }

      if (c.boss && c.bestiary && c.bestiary.bossCategory && !Ee.isValid('BOSS_CATEGORY', c.bestiary.bossCategory)) {
        issues.push(`${c.id}: invalid bossCategory`);
      }
    }
  }

  /**
   * @param {boolean} [strict]
   * @returns {{ ok: boolean, issues: string[] }}
   */
  /** Solo reglas Cyclopedia; para validación completa usar G.Bestiary.validate (incluye append). */
  function validate(strict = false) {
    const issues = [];
    appendValidationIssues(issues);
    const ok = issues.length === 0;
    const dev = typeof location !== 'undefined' && /[?&]dev\b/.test(location.search);
    if (!ok && (strict || dev)) console.error('[G.Cyclopedia] validation failed:', issues);
    return { ok, issues };
  }

  if (typeof location !== 'undefined' && /[?&]dev\b/.test(location.search)) validate(true);

  return {
    SCHEMA_VERSION,
    getDefinition,
    listCreatures,
    resolveBestiaryClass,
    resolveSpawnModes,
    appendValidationIssues,
    validate
  };
})();