/* ============ dex-minimal.js — índice de criaturas TibiaSurvivor (Fase 5) ============
 * Sin datos de franquicias ajenas. G.ContentBridge rellena G.DEX_BY con ids 99001–99099.
 */
G.DEX = [];
G.DEX_BY = {};
G.getPokemon = dex => G.DEX_BY[dex] || null;
G.SPRITE_META = {};
