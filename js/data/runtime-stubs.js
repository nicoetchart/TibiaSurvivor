/* runtime-stubs.js — contratos mínimos post-PSR-10 (sin G.DEX / bestiary legacy). */
G.SPRITE_META = {};
G.getCreatureByLegacyId = legacyId => (G.Content && G.Content.runtimeByLegacyId(legacyId)) || null;