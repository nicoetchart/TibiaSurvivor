/* ============ content-api.js — API neutral TibiaSurvivor (Fase 3A) ============
 * Fuente de verdad de contenido jugable neutral. Modo legacy hasta Subfase 3D.
 */
G.Content = (() => {
  const ID_MIN = 99001;
  const ID_MAX = 99099;

  /** @ts-adapter-f3: 'legacy' | 'neutral' — flip en 3D según save (DEC-019). */
  let mode = 'legacy';

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
    if (typeof location !== 'undefined' && /[?&]content=neutral\b/.test(location.search)) return 'neutral';
    if (mode === 'neutral') return 'neutral';
    if (save && shouldUseNeutralSave(save)) return 'neutral';
    return 'legacy';
  }

  function setMode(next) {
    mode = next === 'neutral' ? 'neutral' : 'legacy';
  }

  /** DEC-019: compañero Pokémon → legacy. Sin compañero o id 99001–99099 → neutral. */
  function syncFromSave(save) {
    if (save && save.partner != null && !isNeutralLegacyId(save.partner)) setMode('legacy');
    else setMode('neutral');
    return mode;
  }

  function startingMoveId(mon) {
    if (mode === 'neutral') {
      const v = getVocation('master_sorcerer');
      return v && v.startingAbility;
    }
    if (!mon) return null;
    return G.startMoveOf(mon.dex);
  }

  function learnPool(mon) {
    if (mode !== 'neutral') return G.Moves.poolFor(mon);
    const c = getCreature((mon && (mon.creatureId || mon.dex)) || null);
    return G.Abilities.poolFor(c);
  }

  function playerLegacyIdForVocation(vocationId) {
    const v = getVocation(vocationId) || getVocation('master_sorcerer');
    return v ? v.legacyPartnerId : ID_MIN;
  }

  /** Elenco de la run. Legacy conserva G.Enemies; neutral no lee el dex. */
  function roster() {
    if (mode === 'neutral' && G.NeutralRoster) return G.NeutralRoster;
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
    learnPool,
    isNeutralLegacyId,
    getCreature,
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
