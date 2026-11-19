/* runtime-stubs.js — contratos vacíos (PSR-9; sin Pokédex ni SPRITE_META legacy). */
G.SPRITE_META = {};
G.DEX = [];
G.DEX_BY = {};
G.getCreatureByLegacyId = legacyId => (G.Content && G.Content.runtimeByLegacyId(legacyId)) || null;