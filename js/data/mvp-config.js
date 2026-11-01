/* ============ mvp-config.js — parámetros del MVP jugable (Fase 4) ============
 * Un solo lugar para duración de run, bioma, curva de spawn y escalado.
 */
G.MvpConfig = {
  /** Duración objetivo de la partida (victoria al llegar). */
  RUN_DURATION_SEC: 900,
  /** Índice en G.Tiles.BIOMES — 1 = Cueva Cristal. */
  RUN_BIOME: 1,
  BIOME_ROTATION: false,
  USE_JUDGMENT: false,
  DISABLE_RIFTS: true,

  /** Tramos de desbloqueo de tier de enemigo (tier 0 = básicos … 2 = avanzados). */
  ENEMY_UNLOCK: [
    { from: 0, maxTier: 0 },
    { from: 100, maxTier: 1 },
    { from: 320, maxTier: 2 }
  ],

  /** Jefe élite final del MVP (segundos de run). */
  FINAL_BOSS_AT: 780,

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
