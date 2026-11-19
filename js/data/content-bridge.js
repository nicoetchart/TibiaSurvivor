/* ============ content-bridge.js — adaptador TEMPORAL habilidades (PSR-3) ============
 * PSR-2: criaturas vía G.Content.toRuntimeMon (sin rellenar G.DEX_BY).
 * Queda alias G.Moves ← G.Abilities hasta PSR-3.
 */
G.ContentBridge = (() => {
  /** La vocación activa deja su habilidad inicial en la criatura del jugador. */
  function stampPlayerAbility() {
    const v = G.Vocations && G.Vocations.defaultVocation && G.Vocations.defaultVocation();
    const c = v && G.CREATURE_BY_ID && G.CREATURE_BY_ID[v.playerCreatureId];
    if (c && v.startingSpellIds && v.startingSpellIds.length) c.startAbilities = v.startingSpellIds.slice();
    if (c && v.startingAbility) c.startAbility = v.startingAbility;
  }

  /** @ts-adapter-f3 — G.Moves.instance lee el mismo objeto BY_ID. Retirar en PSR-3. */
  function installAbilityAliases() {
    if (!G.Moves || !G.Abilities) return;
    for (const a of G.Abilities.ALL) {
      if (a.kind === 'passive') continue;
      if (!G.Moves.BY_ID[a.id]) G.Moves.BY_ID[a.id] = a;
    }
  }

  installAbilityAliases();
  stampPlayerAbility();

  return { installAbilityAliases, stampPlayerAbility };
})();
