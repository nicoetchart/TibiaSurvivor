/* ============ dex-minimal.js — índice legacy transiente (PSR-1 → retirar PSR-2) ============
 * Sin datos de franquicias ajenas. Criaturas vía G.CREATURES / G.Content (PSR-2).
 * Contrato canónico: docs/TIBIA_GLOSSARY.md · docs/migration/PSR-1_CONTRACTS.md
 *
 * @deprecated G.DEX / G.DEX_BY — sustituir por G.CREATURE_BY_LEGACY y G.Content.getCreature (PSR-2).
 */
G.DEX = [];
G.DEX_BY = {};
/** @deprecated PSR-2 — usar G.getCreatureByLegacyId */
G.getCreatureByLegacyId = legacyId => (G.Content && G.Content.runtimeByLegacyId(legacyId)) || null;
/** @deprecated PSR-2 — alias temporal */
G.getPokemon = G.getCreatureByLegacyId;
G.SPRITE_META = {};
