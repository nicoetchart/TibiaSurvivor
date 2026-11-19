/* ============ spell-runtime.js — PSR-3: G.Moves = G.Abilities (+ MS) ============
 * Sustituye moves.js y content-bridge en el boot neutral.
 */
(() => {
  function stampPlayerAbility() {
    const v = G.Vocations && G.Vocations.defaultVocation && G.Vocations.defaultVocation();
    const c = v && G.CREATURE_BY_ID && G.CREATURE_BY_ID[v.playerCreatureId];
    if (c && v.startingSpellIds && v.startingSpellIds.length) c.startAbilities = v.startingSpellIds.slice();
    if (c && v.startingAbility) c.startAbility = v.startingAbility;
  }

  if (!G.Abilities) {
    console.error('[spell-runtime] G.Abilities missing');
    return;
  }

  stampPlayerAbility();

  function poolFor(mon) {
    if (!mon) return [];
    if (G.Content && G.Content.getCreature) {
      const c = G.Content.getCreature(mon.creatureId || mon.legacyId || mon.dex);
      if (c) return G.Abilities.poolFor(c);
    }
    return G.Abilities.poolFor(mon);
  }

  G.Moves = {
    ALL: G.Abilities.ALL,
    get BY_ID() { return G.Abilities.BY_ID; },
    poolFor,
    instance: G.Abilities.instance,
    levelUp: G.Abilities.levelUp,
    nextUpText: G.Abilities.nextUpText,
    startFor: G.Abilities.startFor,
    evoInfo: () => null,
    evolve: () => false,
    EVO: {},
    NEED_NAME: {}
  };
})();