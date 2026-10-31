/* ============ content-bridge.js — adaptadores legacy (@ts-adapter-f3) ============
 * Dirección: criatura/habilidad neutral → forma que espera el motor Pokémon.
 * Subfase 3B: las habilidades ts-* entran en G.Moves.BY_ID para que combat las resuelva.
 * Subfase 3C: copia de criaturas en G.DEX_BY (solo ids 99001–99099, no se añaden a G.DEX).
 * La fuente de verdad sigue siendo G.CREATURES. Eliminar en Fase 4.
 */
G.ContentBridge = (() => {
  /**
   * Entrada compatible con G.Player / G.DEX_BY (campos usados hoy).
   * @param {object} creature fila G.CREATURES
   */
  function toLegacyMon(creature) {
    if (!creature) return null;
    return {
      dex: creature.legacyId,
      creatureId: creature.id,
      name: creature.name,
      types: (creature.damageTypes || ['physical']).slice(),
      hp: creature.hp,
      spd: creature.speed,
      atk: creature.attack,
      rarity: 1,
      bst: 300,
      starter: creature.role === 'player',
      gen: 0,
      leg: false,
      startAbility: creature.startAbility || null
    };
  }

  /** La vocación activa deja su habilidad inicial en la criatura del jugador. */
  function stampPlayerAbility() {
    const v = G.Vocations && G.Vocations.defaultVocation && G.Vocations.defaultVocation();
    const c = v && G.CREATURE_BY_ID && G.CREATURE_BY_ID[v.playerCreatureId];
    if (c && v.startingAbility) c.startAbility = v.startingAbility;
  }

  /** @ts-adapter-f3 — criaturas en G.DEX_BY. No modifica el array G.DEX. */
  function installLegacyAliases() {
    if (!G.CREATURES || !G.DEX_BY) return;
    for (const c of G.CREATURES) {
      const leg = toLegacyMon(c);
      if (leg && !G.DEX_BY[c.legacyId]) G.DEX_BY[c.legacyId] = leg;
    }
  }

  /** @ts-adapter-f3 — G.Moves.instance lee el mismo objeto BY_ID. Retirar en Fase 4. */
  function installAbilityAliases() {
    if (!G.Moves || !G.Abilities) return;
    for (const a of G.Abilities.ALL) {
      if (!G.Moves.BY_ID[a.id]) G.Moves.BY_ID[a.id] = a;
    }
  }

  installAbilityAliases();
  stampPlayerAbility();
  installLegacyAliases();

  return { toLegacyMon, installLegacyAliases, installAbilityAliases, stampPlayerAbility };
})();
