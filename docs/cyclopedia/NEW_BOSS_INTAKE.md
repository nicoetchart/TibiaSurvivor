# NEW BOSS INTAKE — Workflow obligatorio (Cursor)

Para **añadir o redefinir un boss**. Incluye **todo** `NEW_CREATURE_INTAKE.md` más el bloque boss. No implementar sin aprobación.

---

## Reglas especiales

- Cada boss con **más de una fase** debe usar **máquina de estados / tabla de fases** centralizada (`BossDefinition.phases`), no booleanos dispersos en `enemy.js`.
- Categoría bosstiary **obligatoria**: `bane` | `archfoe` | `nemesis` según **frecuencia en TibiaSurvivor**, no solo dificultad.
- Boss **no** es entrada normal del bestiary (`section: 'bosstiary'`).

### Guía categorías (TibiaSurvivor)

| Categoría | Significado en run offline |
|-----------|----------------------------|
| **bane** | Repetible varias veces por periodo de juego; aviso en mapa; p. ej. centinela elite |
| **archfoe** | Cooldown largo entre victorias; entrada a sala especial (futuro Rift renombrado) |
| **nemesis** | Jefe de cierre de run; sala/teleport; mecánicas máximas |

---

## Bloque K — IDENTIDAD NARRATIVA Y ROL

| # | Pregunta |
|---|----------|
| K1 | Función en bioma / fantasía hunting |
| K2 | Nombre y lore breve (texto original) |
| K3 | Relación con criatura normal (variante?) |
| K4 | `combatCreatureId` vs id bosstiary |

---

## Bloque L — ENCUENTRO

| # | Pregunta |
|---|----------|
| L1 | Condición de aparición | timer / hp threshold global / event |
| L2 | Momento run (sec) | |
| L3 | Arena | open world / instanced |
| L4 | Límites arena | radio, muros |
| L5 | Introducción | banner, camera kick |
| L6 | Cooldown / frecuencia | horas reales offline simuladas o solo per-run |
| L7 | Señalización UI | minimapa / texto |

---

## Bloque M — FASES

| # | Pregunta |
|---|----------|
| M1 | Número de fases | |
| M2 | Transición fase 1→2 | HP%, time, cast count |
| M3 | Ataques exclusivos por fase | lista IDs |
| M4 | Ataques compartidos | |
| M5 | Enrage | reglas |
| M6 | Ventanas vulnerabilidad | sí/no |
| M7 | Invulnerabilidad / interrupt | |
| M8 | Cleanup al cambiar fase | hazards, summons |

---

## Bloque N — PATRÓN DE COMBATE

| # | Pregunta |
|---|----------|
| N1 | Secuencias / rotación | opcional data-driven |
| N2 | Adds / summons | creatureId, max, interval |
| N3 | Hazards persistentes | ground_zone |
| N4 | Telegraph obligatorio | sí por ataque |
| N5 | Música / SFX | track id |

---

## Bloque O — DERROTA Y RECOMPENSAS

| # | Pregunta |
|---|----------|
| O1 | Ejecución / muerte jugador | wipe / continue |
| O2 | Recompensa primera victoria | |
| O3 | Recompensa repetible | |
| O4 | Impacto victoria run | win flag / solo loot |
| O5 | Bosstiary thresholds | override o categoría default |
| O6 | Boss points | cantidad |
| O7 | Daily boost boss | elegibilidad |

---

## Bloque P — CLEANUP Y PRUEBAS

| Check | |
|-------|---|
| P1 | Muerte boss: hazards off, minions policy |
| P2 | Abandonar run mid-boss |
| P3 | Pausa durante cast |
| P4 | Segunda run sin boss residual |
| P5 | Progreso bosstiary persistido |
| P6 | Prueba por fase (?dev spawn) |
| P7 | Derrota jugador ante boss |

---

## Resumen pre-aprobación

```text
BOSS INTAKE SUMMARY
Boss ID: ...
Category: bane|archfoe|nemesis
Encounter: ...
Phases: n + transitions
Shared attacks: [...]
Adds: ...
Bosstiary rewards: ...
Archfoe/Rift: requires arena system? ...
```

---

## Herramientas (CYC-11)

Tras implementar: `node tools/validate-cyclopedia.js` (incluye `BossRegistry` + bosstiary rows). Bosses: fila en `creatures.js` + kit en `js/data/bosses.js` según `CREATURE_AND_BOSS_DATA_STANDARD.md` §3.

---

## Relación con criaturas

Si el boss comparte sprite con criatura normal:

- Criatura normal: `bestiary` enabled, `boss: false`
- Boss catalog: `EXTRA_ENTRIES` o fila dedicada con `baseCreatureId`
- Evitar doble crédito en summons (`noBestiaryCredit`)