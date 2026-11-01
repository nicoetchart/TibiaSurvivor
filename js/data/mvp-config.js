/* ============ mvp-config.js — parámetros del vertical slice MVP (Fase 6) ============
 * Un solo lugar para duración de run, bioma, curva de spawn y escalado.
 */
G.MvpConfig = {
  /** Tope de tiempo: si el jefe sigue vivo, derrota por tiempo agotado. */
  RUN_DURATION_SEC: 720,
  /** Índice en G.Tiles.BIOMES — 1 = Cueva Cristal. */
  RUN_BIOME: 1,
  BIOME_ROTATION: false,
  USE_JUDGMENT: false,
  DISABLE_RIFTS: true,
  /** Victoria al derrotar al jefe final (no al agotar el reloj). */
  VICTORY_ON_BOSS: true,

  /** Tramos de desbloqueo de tier de enemigo (tier 0 = básicos … 2 = avanzados). */
  ENEMY_UNLOCK: [
    { from: 0, maxTier: 0 },
    { from: 90, maxTier: 1 },
    { from: 280, maxTier: 2 }
  ],

  /** Élite de mitad de run (segundos). */
  ELITE_AT: 300,

  /** Jefe final del bioma (segundos de run). */
  FINAL_BOSS_AT: 540,

  SPAWN: {
    base: 1.45,
    perSec: 0.027,
    curvePow: 1.55,
    curveMul: 0.48,
    density: 0.26,
    dmgK: 2.25,
    xpK: 5.4,
    cap: 64,
    eliteFrom: 0.85
  },

  DIFFICULTY: {
    hpScale: 88,
    dmgScale: 390,
    spdScale: 1250,
    spdCap: 0.34,
    bossHpScale: 580,
    bossDmgScale: 580
  }
};
