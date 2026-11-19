/* ============ content-api.js — API de contenido TibiaSurvivor (PSR-1 canónico) ============
 * Fuente de verdad: G.CREATURES, G.Abilities, G.DamageTypes, G.Vocations.
 * Modo objetivo: neutral único (DEC-037, fin PSR-2). Legacy solo transición.
 * Glosario: docs/TIBIA_GLOSSARY.md
 */
G.Content = (() => {
  const ID_MIN = 99001;
  const ID_MAX = 99099;

  /** @ts-adapter-f3: 'legacy' | 'neutral' — flip en 3D según save (DEC-019). */
  function isTibiaUi() {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-ui') === 'tibia';
  }
  let mode = isTibiaUi() ? 'neutral' : 'legacy';

  function isNeutralLegacyId(id) {
    const n = +id;
    return Number.isFinite(n) && n >= ID_MIN && n <= ID_MAX;
  }

  function getCreature(key) {
    if (key == null || key === '') return null;
    if (typeof key === 'string' && G.CREATURE_BY_ID[key]) return G.CREATURE_BY_ID[key];
    const n = +key;
    if (Number.isFinite(n) && G.CREATURE_BY_LEGACY[n]) return G.CREATURE_BY_LEGACY[n];
    return null;
  }

  /** Perfil de combate/HUD derivado de G.CREATURES (PSR-2: reemplaza G.DEX_BY). */
  function toRuntimeMon(creature) {
    if (!creature) return null;
    if (typeof creature === 'number' || (typeof creature === 'string' && !G.CREATURE_BY_ID[creature])) {
      creature = getCreature(creature);
      if (!creature) return null;
    }
    return {
      dex: creature.legacyId,
      legacyId: creature.legacyId,
      creatureId: creature.id,
      name: creature.name,
      types: (creature.defenseTypes || creature.damageTypes || ['physical']).slice(),
      atkTypes: (creature.damageTypes || ['physical']).slice(),
      weaknesses: (creature.weaknesses || []).slice(),
      resistances: (creature.resistances || []).slice(),
      immunities: (creature.immunities || []).slice(),
      hp: creature.hp,
      spd: creature.speed,
      atk: creature.attack,
      startAbility: creature.startAbility || null
    };
  }

  function runtimeByLegacyId(legacyId) {
    return toRuntimeMon(getCreature(legacyId));
  }

  function creatureName(legacyIdOrCreatureId) {
    const c = getCreature(legacyIdOrCreatureId);
    return c ? c.name : '';
  }

  function getAbility(id) {
    return G.Abilities && G.Abilities.BY_ID[id] ? G.Abilities.BY_ID[id] : null;
  }

  function getVocation(id) {
    if (!id && G.Vocations) return G.Vocations.defaultVocation();
    return G.Vocations && G.Vocations.BY_ID[id] ? G.Vocations.BY_ID[id] : null;
  }

  /**
   * ¿Esta partida guardada usa el stack neutral? (DEC-019)
   * - partner null → onboarding vocación (neutral).
   * - partner en banda TS → neutral.
   * - partner dex Pokémon → legacy.
   */
  function shouldUseNeutralSave(save) {
    if (!save) return false;
    if (save.partner == null) return true;
    if (isNeutralLegacyId(save.partner)) return true;
    return false;
  }

  /** Resuelve modo efectivo (3A: siempre legacy en runtime salvo ?dev=neutral). */
  function effectiveMode(save) {
    if (typeof location !== 'undefined' && /[?&]content=legacy\b/.test(location.search)) return 'legacy';
    if (typeof location !== 'undefined' && /[?&]content=neutral\b/.test(location.search)) return 'neutral';
    if (mode === 'neutral') return 'neutral';
    if (save && shouldUseNeutralSave(save)) return 'neutral';
    return 'legacy';
  }

  function setMode(next) {
    mode = next === 'neutral' ? 'neutral' : 'legacy';
  }

  /** PSR-2 / DEC-037: runtime solo neutral. (Legacy deliberado: `?content=legacy` en desarrollo.) */
  function syncFromSave(save) {
    if (typeof location !== 'undefined' && /[?&]content=legacy\b/.test(location.search)) setMode('legacy');
    else setMode('neutral');
    return mode;
  }

  function startingMoveIds(mon) {
    if (mode === 'neutral') {
      const c = mon && getCreature((mon && (mon.creatureId || mon.legacyId || mon.dex)) || null);
      if (c && c.startAbilities && c.startAbilities.length) return c.startAbilities.slice();
      const v = getVocation('master_sorcerer');
      if (v && v.startingSpellIds && v.startingSpellIds.length) return v.startingSpellIds.slice();
      if (mon && mon.startAbility) return [mon.startAbility];
      if (c && c.startAbility) return [c.startAbility];
      if (v && v.startingAbility) return [v.startingAbility];
      return [];
    }
    return [];
  }

  function startingMoveId(mon) {
    const ids = startingMoveIds(mon);
    return ids.length ? ids[0] : null;
  }

  function learnPool(mon) {
    if (mode !== 'neutral' && G.Moves && G.Moves.poolFor) return G.Moves.poolFor(mon);
    const c = getCreature((mon && (mon.creatureId || mon.legacyId || mon.dex)) || null);
    return G.Abilities.poolFor(c);
  }

  function playerLegacyIdForVocation(vocationId) {
    const v = getVocation(vocationId) || getVocation('master_sorcerer');
    return v ? v.legacyPartnerId : ID_MIN;
  }

  /** Elenco de la run (PSR-3: G.NeutralRoster; G.Enemies solo ?content=legacy + boot legacy). */
  function roster() {
    if (G.NeutralRoster && (mode === 'neutral' || !G.Enemies)) return G.NeutralRoster;
    return G.Enemies;
  }

  /** Habilidad original o partida en modo neutral: sin tabla Pokémon ni clima. */
  function usesNeutralDamage(sourceId) {
    if (mode === 'neutral') return true;
    return !!(sourceId && G.Abilities && G.Abilities.BY_ID[sourceId]);
  }

  /**
   * Factor de daño de un ataque. Incluye clima solo en el camino Pokémon.
   * @ts-adapter-f3 quitar cuando G.Types deje de usarse (Fase 4).
   */
  function attackFactor(type, defTypes, sourceId) {
    if (usesNeutralDamage(sourceId)) return G.DamageTypes.mult(type, defTypes);
    const chart = G.Types ? G.Types.mult(type, defTypes) : 1;
    const weather = G.Weather ? G.Weather.mult(type) : 1;
    return chart * weather;
  }

  function effectivenessLabel(type, defTypes, sourceId) {
    if (usesNeutralDamage(sourceId)) return G.DamageTypes.label(G.DamageTypes.mult(type, defTypes));
    const chart = G.Types ? G.Types.mult(type, defTypes) : 1;
    return G.Types ? G.Types.label(chart) : null;
  }

  function assertData() {
    const miss = [];
    if (!G.CREATURES || !G.CREATURE_BY_ID) miss.push('CREATURES');
    if (!G.Abilities || !G.Abilities.BY_ID) miss.push('Abilities');
    if (!G.DamageTypes) miss.push('DamageTypes');
    if (!G.Vocations) miss.push('Vocations');
    if (!G.MasterSorcerer || !G.MasterSorcerer.registered) miss.push('MasterSorcerer');
    else if (!G.MasterSorcerer.validate(true)) miss.push('MasterSorcerer.validate');
    if (G.Bestiary && !G.Bestiary.validate(true).ok) miss.push('Bestiary.validate');
    if (miss.length) console.error('[G.Content] faltan módulos:', miss.join(', '));
    return !miss.length;
  }

  assertData();

  return {
    ID_MIN,
    ID_MAX,
    get mode() { return mode; },
    setMode,
    syncFromSave,
    startingMoveId,
    startingMoveIds,
    learnPool,
    isNeutralLegacyId,
    getCreature,
    toRuntimeMon,
    runtimeByLegacyId,
    creatureName,
    getAbility,
    getVocation,
    shouldUseNeutralSave,
    effectiveMode,
    playerLegacyIdForVocation,
    roster,
    usesNeutralDamage,
    attackFactor,
    effectivenessLabel
  };
})();
