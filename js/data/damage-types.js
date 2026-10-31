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

  /** Multiplicador atacante → defensor(es). F3: siempre 1. */
  function mult(atk, def) {
    if (!atk || !def) return 1;
    return 1;
  }

  function label(m) {
    return m > 1.05 ? 'super' : m < 0.95 ? 'weak' : null;
  }

  return { ALL, COLOR, NAME, mult, label };
})();

/* Colores y nombres que el HUD ya lee en G.U (sin pisar fuego/hielo Pokémon). */
(() => {
  if (!G.U) return;
  for (const id of G.DamageTypes.ALL) {
    if (!G.U.TYPE_COLOR[id]) G.U.TYPE_COLOR[id] = G.DamageTypes.COLOR[id];
    if (!G.U.TYPE_NAME[id]) G.U.TYPE_NAME[id] = G.DamageTypes.NAME[id];
  }
})();
