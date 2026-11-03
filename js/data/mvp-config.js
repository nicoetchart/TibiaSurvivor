/* ============ mvp-config.js — parámetros del vertical slice MVP (Fase 6) ============
 * Un solo lugar para duración de run, bioma, curva de spawn y escalado.
 */
G.MvpConfig = {
  /** Tope de tiempo: si el jefe sigue vivo, derrota por tiempo agotado (MS-8: ventana 10–15 min). */
  RUN_DURATION_SEC: 900,
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
    { from: 100, maxTier: 1 },
    { from: 320, maxTier: 2 }
  ],

  /** Centinela de élite (segundos): 1:45 de run. */
  ELITE_AT: 105,

  /** Jefe final del bioma (segundos de run). */
  FINAL_BOSS_AT: 600,

  SPAWN: {
    base: 1.18,
    perSec: 0.018,
    curvePow: 1.4,
    curveMul: 0.3,
    density: 0.24,
    /** Primeros ~3,5 min: subida gradual (menos castigo al arrancar). */
    earlyGraceSec: 210,
    earlyRateMul: 0.78,
    /** Valle alrededor del min 3 (menos horda que un pico brusco). */
    midDipAt: 180,
    midDipWidth: 95,
    midDipMul: 0.72,
    /** Primer minuto: más criaturas; el bonus decae hacia el minuto 1. */
    earlyWarmupSec: 60,
    earlyWarmupMul: 1.72,
    openingAcc: 2.4,
    dmgK: 1.72,
    xpK: 5.4,
    cap: 64,
    eliteFrom: 0.85
  },

  DIFFICULTY: {
    hpScale: 102,
    dmgScale: 460,
    spdScale: 1250,
    spdCap: 0.34,
    bossHpScale: 580,
    bossDmgScale: 580
  }
};
