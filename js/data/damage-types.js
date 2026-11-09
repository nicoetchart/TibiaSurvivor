/* ============ damage-types.js — tipos de daño TibiaSurvivor (Fase 3) ============
 * Tabla objetivo: physical, fire, ice, energy, earth, death, holy.
 * Fase 3A: multiplicadores neutros (×1); sin chart Pokémon.
 */
G.DamageTypes = (() => {
  const ALL = ['physical', 'fire', 'ice', 'energy', 'earth', 'death', 'holy'];

  const COLOR = {
    physical: '#c8cdd8',
    fire: '#ff7b3d',
    ice: '#7fe0e0',
    energy: '#b48aff',
    earth: '#a8845a',
    death: '#6a5a7a',
    holy: '#ffe08a'
  };

  const NAME = {
    physical: 'Físico',
    fire: 'Fuego',
    ice: 'Hielo',
    energy: 'Energía',
    earth: 'Tierra',
    death: 'Muerte',
    holy: 'Sagrado'
  };

  const WEAK_MULT = 1.25;
  const RESIST_MULT = 0.7;
  const IMMUNE_MULT = 0;

  /** Multiplicador atacante → defensor (tipos Tibia o perfil { weaknesses, resistances, immunities }). */
  function mult(atk, def) {
    if (!atk) return 1;
    if (!def) return 1;
    let weak = [];
    let resist = [];
    let immune = [];
    if (Array.isArray(def)) {
      // legacy: sin tabla por tipo
    } else if (def && typeof def === 'object') {
      weak = def.weaknesses || [];
      resist = def.resistances || [];
      immune = def.immunities || [];
    } else return 1;
    if (immune.includes(atk)) return IMMUNE_MULT;
    if (weak.includes(atk)) return WEAK_MULT;
    if (resist.includes(atk)) return RESIST_MULT;
    return 1;
  }

  function label(m) {
    if (m <= IMMUNE_MULT + 0.01) return 'immune';
    if (m >= WEAK_MULT - 0.02) return 'weak';
    if (m <= RESIST_MULT + 0.02) return 'resist';
    return null;
  }

  function names(types) {
    if (!types || !types.length) return '—';
    return types.map(t => NAME[t] || t).join(', ');
  }

  return { ALL, COLOR, NAME, mult, label, names, WEAK_MULT, RESIST_MULT, IMMUNE_MULT };
})();

/* Colores y nombres que el HUD ya lee en G.U (sin pisar fuego/hielo Pokémon). */
(() => {
  if (!G.U) return;
  for (const id of G.DamageTypes.ALL) {
    if (!G.U.TYPE_COLOR[id]) G.U.TYPE_COLOR[id] = G.DamageTypes.COLOR[id];
    if (!G.U.TYPE_NAME[id]) G.U.TYPE_NAME[id] = G.DamageTypes.NAME[id];
  }
})();
