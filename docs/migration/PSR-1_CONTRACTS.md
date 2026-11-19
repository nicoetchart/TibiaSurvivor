# PSR-1 — Vocabulario y contratos canónicos

**Estado:** completed (2026-11-18)  
**Precondición:** PSR-0 + DEC-027–038  
**Condición para PSR-2:** consumidores listados aquí; `G.getCreatureByLegacyId` introducido; sin nuevos usos de `G.getPokemon`.

---

## 1. Objetivo

Fijar nombres, IDs y reglas de transición para despokemonización **sin** eliminar todavía datasets legacy del repositorio ni del bundle.

---

## 2. Alcance

| Incluido | Excluido |
|----------|----------|
| `docs/TIBIA_GLOSSARY.md` | Borrar `pokedex.js` / `assets/pokemon` |
| Alias API `getCreatureByLegacyId` | Refactor masivo `.dex` → `legacyId` |
| Cabeceras `@deprecated` en bridge | Eliminar gacha del boot |
| Actualización `SAVE_SCHEMA.md` | Purge `ps.*` (PSR-7) |
| Inventario consumidores | Reescribir `goals-ui.js` (PSR-5) |

---

## 3. Mapa de símbolos legacy → destino

| Legacy | Destino PSR-2+ | Acción |
|--------|----------------|--------|
| `G.DEX` (array) | vacío / eliminado | ELIMINAR tras migrar consumidores |
| `G.DEX_BY[id]` | `G.CREATURE_BY_LEGACY[id]` o `G.Content.getCreature(id)` | REEMPLAZAR |
| `G.getPokemon(dex)` | `G.getCreatureByLegacyId(legacyId)` | RENOMBRAR (PSR-1 alias) |
| `entity.dex` | `entity.legacyId` | RENOMBRAR PSR-2 |
| `G.Moves.BY_ID` (Pokémon) | solo `G.Abilities.BY_ID` en neutral | ELIMINAR del boot PSR-3 |
| `G.Types` | `G.DamageTypes` | ELIMINAR PSR-3 |
| `G.Enemies` | `G.NeutralRoster` | ELIMINAR del boot PSR-3 |
| `G.Gacha`, `G.GachaUI` | — | ELIMINAR PSR-4 |
| `save.owned` / `shiny` | bestiary progress | REESTRUCTURAR PSR-4 |
| `save.coins` | mismo campo; UI «gold coin» | CONSERVAR |
| `G.Content.mode === 'legacy'` | solo `neutral` | ELIMINAR PSR-2 fin |
| `content-bridge.js` | lógica inline en Content API | ELIMINAR PSR-2 |

---

## 4. Inventario de consumidores `G.DEX_BY` / `.dex` (línea base)

Conteo grep 2026-11-18 (`js/`, excl. `app.min.js`):

| Archivo | Aprox. refs | Severidad | Fase retiro |
|---------|-------------|-----------|-------------|
| `js/ui/menu.js` | 13+ | HIGH | PSR-5 |
| `js/ui/goals-ui.js` | 13+ | HIGH | PSR-5 |
| `js/entities/enemy.js` | 16+ | HIGH | PSR-2 |
| `js/data/enemies.js` | 13+ | HIGH | PSR-3 (boot) |
| `js/entities/player.js` | 8+ | HIGH | PSR-2 |
| `js/core/sprites.js` | 13+ | HIGH | PSR-2/6 |
| `js/systems/gacha.js` | 11+ | HIGH | PSR-4 |
| `js/systems/events.js` | 10+ | MEDIUM | PSR-3/4 |
| `js/game.js` | 9+ | HIGH | PSR-2 |
| `js/ui/test.js` | 8+ | LOW | PSR-5 (módulo) |
| `js/systems/rift.js` | 6+ | MEDIUM | PSR-3 (reimagen) |
| `js/systems/spawner.js` | 6+ | HIGH | PSR-2/3 |
| `js/systems/judgment.js` | 2+ | HIGH | PSR-3 (eliminar) |
| `js/ui/gacha-ui.js` | 4+ | HIGH | PSR-4 |
| `js/ui/run-ui.js` | 2+ | MEDIUM | PSR-3 |
| `js/data/content-bridge.js` | — | BLOCKER | PSR-2 |
| `js/data/content-api.js` | 3+ | HIGH | PSR-2 |
| `js/data/neutral-roster.js` | 2+ | OK | Renombrar `dex:` en defs PSR-2 |
| `js/data/starters.js` | — | HIGH | PSR-5 eliminar |
| `js/systems/bestiary.js` | 3+ | CONSERVAR | Alinear nombres |
| `js/systems/combat.js` | 1+ | PSR-3 | |
| `js/systems/progress.js` | 4+ | PSR-4 | |
| `js/systems/levelup.js` | 1+ | PSR-3 | |
| `js/ui/ui.js` | 4+ | PSR-5 | |

**Regla PSR-1:** ningún archivo nuevo debe importar o referenciar `G.DEX`, `G.getPokemon` ni `.dex` en interfaces públicas.

---

## 5. Contrato de entidades (objetivo PSR-2)

```text
Criatura (datos):   { id, legacyId, name, damageTypes, defenseTypes, ... }
Enemigo (runtime): { creatureId, legacyId, name, ... }  // sin .dex
Jugador:            hereda de criatura vocación + legacyId 99001
```

`legacyId` sigue usándose como clave de sprite (`G.TibiaSprites`, `GeoSprites`) hasta unificación con `creatureId` en pipeline de arte.

---

## 6. Contrato economía (DEC-028, DEC-029)

| Clave | Tipo | UI |
|-------|------|-----|
| `save.coins` | number | Gold coin(s) |
| (futuro market) | — | fuera del MVP |

No campos `tickets`, `pity`, ni moneda de gacha en saves nuevos tras PSR-4.

---

## 7. Contrato bestiario / bosstiary (DEC-030, DEC-032)

- **Bestiary:** criaturas `role: 'enemy'` con dificultad Tibia (harmless → …).
- **Bosstiary:** `boss: true`, `role: 'elite'`, entradas especiales (ver `BESTIARY_TECHNICAL_FUNCTIONAL_BASELINE.md`).
- Sin contadores `shiny` ni colección `owned[dex]`.

---

## 8. Orden interno PSR-1 (ejecutado)

1. Publicar glosario y este contrato.
2. Añadir `G.getCreatureByLegacyId` + deprecar `G.getPokemon`.
3. Documentar campos save objetivo.
4. Marcar `content-bridge` / `dex-minimal` como transitorios.
5. Añadir checklist PSR-1 en `TEST_CHECKLIST.md`.

---

## 9. Pruebas de aceptación PSR-1

- [x] `docs/TIBIA_GLOSSARY.md` existe y alinea DEC-027–038
- [x] `G.getCreatureByLegacyId` definido en runtime
- [ ] Smoke `node tools/validate-mvp.js` (operador)
- [ ] Boot `dev.html?dev` sin errores (operador)
- [ ] `rg "G\.getPokemon"` en `js/` — solo definición + deprecación en `dex-minimal.js`

---

## 10. Rollback

Revertir commit PSR-1 (solo docs + `dex-minimal.js` cabecera).

---

## 11. Deuda que queda

Todo el inventario §4; datasets en disco; SEO; bundle.

---

## 12. Autorización PSR-2

PSR-2 puede iniciarse cuando el propietario confirme smoke PSR-1 y acepte el orden: **enemy/player/game/spawner** primero, luego bridge off.