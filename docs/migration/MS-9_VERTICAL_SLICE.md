# MS-9 — Validación vertical slice (Master Sorcerer)

Procedimiento manual en **`dev.html?dev`**. Automatizado: `node tools/ms9-smoke.js`.

## Builds mínimas

| Build | Hechizos objetivo | Pasivas objetivo | Notas |
|-------|-------------------|------------------|--------|
| **Fire** | `flame_strike`, `fire_wave`, `great_fire_wave`, `hells_core` | `master_of_flames` | Ultimate fuego tras 2 ofensivos fire |
| **Energy** | `energy_strike`, `energy_wave`, `energy_beam`, `rage_of_the_skies` | `master_of_thunder` | |
| **Death** | `flame_strike` + `death_strike` (+ waves/beams opcionales) | `master_of_decay`, `aura_of_exposed_weakness` | No hay ultimate death |
| **Híbrida** | `flame_strike`, `energy_strike`, `fire_wave`, `energy_beam` | `master_of_flames`, `master_of_thunder` | Dos elementos sin ultimates obligatorios |
| **Defensiva** | 1–2 ofensivos (p. ej. strike + wave) | `ultimate_healing`, `intense_healing`, `magic_shield`, `strong_haste` | Escudo regenera tras ~3,5 s sin daño |

Atajo dev (partida en curso): `G.Game.debugMsBuild('fire'|'energy'|'death'|'hybrid'|'defensive')` — sube hechizos/pasivas de la receta al nv. 5 (marca run como tampered).

## Checklist por build

1. Iniciar run neutral → Master Sorcerer.
2. (Opcional dev) `debugMsBuild(...)` o jugar hasta el loadout.
3. `debugTime(580)` → avanzar cerca del jefe (~10 min).
4. Derrotar jefe o validar derrota por tiempo a los 15 min.
5. Pausa → reanudar: sin tormentas/ecos huérfanos.
6. Morir o terminar → menú → **segunda run** sin errores.
7. Consola: sin `ReferenceError` / `TypeError` / `NaN`.

## Criterios finales (baseline)

| Criterio | Cómo verificar |
|----------|----------------|
| Cada especialización puede completar run | Manual + recetas arriba |
| Ningún hechizo obligatorio en todas las builds | `ms9-smoke` + diseño de pool |
| Frágil rodeado | HP base ~75, sin inmunidad; Magic Shield no es invuln |
| Sin upgrades > nv. 5 | `ms9-smoke` levelUp chain |
| Segunda partida OK | Transversal tras `endRun` |
| Sin proyectiles/VFX huérfanos | `endRun` limpia proyectiles/FX |

## Transversales (§11 baseline)

- Movimiento, spawn, casts, XP, level-up, pausa, muerte, menú, guardado local, consola limpia.
