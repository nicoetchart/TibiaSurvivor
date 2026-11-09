/* ============ tibia-sprite-tuning.js — AJUSTA TÚ (no se sobrescribe al importar) ============
 *
 * Modo Pokémon (por defecto): naturalSize: true
 *   · Tamaño en pantalla = w×h del meta × G.Sprites.PX (2) × scale de la entidad (como un dex).
 *   · Minotaur 32px se ve más chico que troll 64px — igual que en el cliente Tibia.
 *   · ax/ay y s (sombra) vienen del import (`tibia-creatures-meta.js`), medidos del PNG.
 *   · Solo correcciones finas aquí: scaleMul global, footDx/footDy, byLookType.
 *
 * Modo uniforme (opcional): naturalSize: false + visualTiers + lookTypeTier
 *   · Iguala alturas “de juego” aunque el tile del cliente sea 32 o 64.
 *
 * Reimport: node tools/import_tibia_grouped.mjs --grouped <carpeta grouped>
 *
 * Atajos ?dev (sprites Tibia ya van por defecto): Ctrl+[ ] scaleMul · Ctrl+; ' footDy · Ctrl+\\
 */
G.TIBIA_SPRITE_TUNING = {
  naturalSize: true,

  scaleMul: 0.8,
  footDx: 0,
  footDy: 0,
  shadowRxMul: 1,

  /* Solo si naturalSize: false */
  scaleMul32: 0.8,
  scaleMul64: 0.75,
  footDx32: 0,
  footDy32: 0,
  footDx64: 0,
  footDy64: 0,
  visualTiers: {
    pet: { targetTileH: 32 },
    medium: { targetTileH: 48 },
    big: { targetTileH: 64 }
  },
  lookTypeTier: {},

  byLookType: {}
};
