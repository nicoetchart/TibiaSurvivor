# Cyclopedia — Matriz de pruebas

Ejecutar incrementalmente por fase. Marcar: PASS | FAIL | NOT TESTED | BLOCKED.

---

## BASE (regresión motor)

| ID | Caso | Pasos | Esperado |
|----|------|-------|----------|
| B01 | Arranque | `dev.html?dev` | NEED completo, menú |
| B02 | Cuenta local | login → save | `ts.save.*` product tibiasurvivor |
| B03 | Comenzar run | Play | spawn, HUD |
| B04 | Movimiento + combate | 60s | sin NaN |
| B05 | XP / level-up | kills | sube nivel |
| B06 | Pausa | pause/resume | estado ok |
| B07 | Muerte | morir | pantalla over |
| B08 | Menú | back | Cyclopedia accesible |
| B09 | Segunda run | play again | sin doble listeners |
| B10 | Save reload | F5 menú | bestiary kills persisten |

---

## CRIATURAS

| ID | Caso | Esperado |
|----|------|----------|
| C01 | Spawn por tier unlock | solo criaturas tier permitido |
| C02 | Behaviour chase/ranged | movimiento coherente |
| C03 | Muerte → XP drop | pickup |
| C04 | tryCreditDefeat | kills++ una vez |
| C05 | Summon demon Orshabaal | no bestiary credit |
| C06 | Remote/co-op off MVP | N/A neutral local |
| C07 | Dificultad en UI | match datos |
| C08 | Revelación etapas | campos ocultos/visibles |
| C09 | Elite sentinel credit | `black_knight` |

---

## BOSSES

| ID | Caso | Esperado |
|----|------|----------|
| BO01 | Spawn Orshabaal timer | ~FINAL_BOSS_AT |
| BO02 | Black Knight elite | sentinelElite, bosstiary bane |
| BO03 | Boss AI phases | fury <50% hp |
| BO04 | Summons cap | max 4 |
| BO05 | Muerte boss | victory path |
| BO06 | Muerte jugador en boss | defeat |
| BO07 | Cleanup hazards | sin zonas tras muerte |
| BO08 | Bosstiary kills | persistencia |
| BO09 | Segunda run boss | no duplicar boss vivo |

---

## CHARMS

| ID | Caso | Esperado |
|----|------|----------|
| CH01 | Desbloquear charm | spent points |
| CH02 | Equipar 1 slot | lista equipped |
| CH03 | Proc onHit wound | procLock, no recursion |
| CH04 | Boss cap damage | bossCap aplicado |
| CH05 | Elite tier | escala intermedia |
| CH06 | Parry mitigate | menos daño entrante |
| CH07 | Stride on pickup | speed burst |
| CH08 | Persistencia | reload mantiene |

---

## DAILY BOOSTS (post CYC-8/9)

| ID | Caso | Esperado |
|----|------|----------|
| DB01 | Selección día UTC | determinista |
| DB02 | Cambio día | nueva criatura |
| DB03 | No repetición | history 3 días |
| DB04 | Reloj atrás | no re-roll abusivo |
| DB05 | Una elegible | fallback |
| DB06 | no elegible | excluida |
| DB07 | Modificadores | XP / bestiary mul visible |
| DB08 | Save corrupto | sanitize defaults |
| DB09 | Boss boost solo bane/archfoe | nemesis rules |

---

## ROBUSTEZ

| ID | Caso | Esperado |
|----|------|----------|
| R01 | ReferenceError boot | ninguno |
| R02 | IDs duplicados | validator falla dev |
| R03 | Timers huérfanos | post 2 runs 0 extra |
| R04 | Proyectiles post run | limpiados |
| R05 | Doble muerte credit | `_bestiaryCredited` |
| R06 | Doble reward completed | `rewarded` flag |
| R07 | Save corrupt bestiary | sanitize + bak |
| R08 | Guest mode | no persist, no crash |

---

## HERRAMIENTAS

| ID | Comando | Esperado |
|----|---------|----------|
| T01 | `node tools/validate-mvp.js` | exit 0 |
| T02 | `node tools/validate-bestiary-balance.js` | warnings aceptables |
| T03 | `node tools/validate-bestiary-save.js` | sanitize tests |
| T04 | `G.Bestiary.validate(true)` ?dev | ok |
| T05 | `node tools/validate-cyclopedia-migration.js` | schema 2 + migrate + R05 |
| T06 | `node tools/validate-cyclopedia.js` | authoring gate |

---

## Criterios de salida CYC-12

- 100% BASE PASS
- 100% CRIATURAS + BOSSES MVP PASS
- CHARMS según alcance fase
- DAILY según alcance
- ROBUSTEZ sin FAIL críticos