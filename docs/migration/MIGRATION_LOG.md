# TibiaSurvivor — Registro de migración

Formato por iteración: fecha, fase, archivos, símbolos, decisiones, pruebas, errores, compatibilidad temporal, siguiente paso.

---

## 2026-10-30 — FASE 0 (Auditoría operativa y línea base)

### Fase

0 — completed

### Archivos modificados

Ninguno de runtime. Solo documentación:

- `docs/migration/MIGRATION_PLAN.md` (creado)
- `docs/migration/MIGRATION_LOG.md` (creado)
- `docs/migration/REFERENCE_INVENTORY.md` (creado)
- `docs/migration/TEST_CHECKLIST.md` (creado)
- `docs/migration/DECISIONS.md` (creado)

### Archivos eliminados

Ninguno.

### Símbolos modificados

Ninguno (auditoría únicamente).

### Decisiones tomadas

- Usar **TibiaSurvivor** como nombre de producto en documentación de migración (instrucción del propietario); el informe `CAVERN_ARCHITECTURE_AUDIT.md` conserva el nombre “Cavern Survivors” del audit previo.
- Fase 1 acotada a **motor offline** sin retirar `G.DEX` ni `assets/pokemon/` (alineado con protocolo del propietario).
- Prefijo de save objetivo **`ts.*`** reservado para Fase 2 (audit sugería `cs.*`; ver `DECISIONS.md` DEC-001).
- No ejecutar `node tools/build.js` en Fase 0 para no alterar artefactos generados (`index.html`, `app.min.js`, `version.json`).

### Inspección Git (sin modificar)

- Rama: `main`
- HEAD: `b1837953` — `docs: add Cavern Survivors architecture audit`
- Base funcional auditada en informe: `b2970890`
- Working tree: **limpio** (`nothing to commit, working tree clean`)
- Sincronizado con `origin/main`

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| Lectura completa `docs/CAVERN_ARCHITECTURE_AUDIT.md` | OK |
| Inventario estructura / grep de símbolos | OK |
| Conteo `assets/pokemon/` | 13 468 archivos |
| Arranque en navegador | **No ejecutado** (Fase 0 no altera código; línea base = estado git limpio + audit) |
| `node tools/build.js` | **No ejecutado** (evita diff en generados) |

### Resultados

- Documentación de migración creada.
- Acoplamientos online y Pokémon catalogados en `REFERENCE_INVENTORY.md`.
- Plan detallado Fase 1 en `MIGRATION_PLAN.md`.

### Errores pendientes

Ninguno en Fase 0.

### Compatibilidad temporal agregada

Ninguna (sin cambios de código).

### Próximo paso recomendado

**Fase 1 — Motor offline:** retirar Firebase/WebRTC/TURN/social/ranking/coop con partida local Pokémon intacta; actualizar `dev.html`, `main.js`, `game.js`, `db.js` y ramas `G.Coop` en simulación.

### Referencias residuales (esperadas pre-F1)

Ver `REFERENCE_INVENTORY.md` — categorías ONLINE, POKEMON_*, BRANDING.

---

## 2026-10-31 — FASE 1 (Motor offline)

### Fase

1 — **completed** (2026-10-31; ver entrada «Cierre documental»)

### Archivos modificados (runtime)

- `dev.html` — scripts online, preconnect gstatic, pantallas social/ranking/support/recover, menú Amigos/Ranking, privacidad local
- `js/main.js` — `NEED` sin Social/Net/Coop/Ranking/Funding/SupportUI
- `js/core/db.js` — reescrito: solo `localStorage` / `ps.*`
- `js/game.js` — Flow, run solo-local, sin ranking/coop
- `js/ui/login.js`, `menu.js`, `goals-ui.js`, `settings-ui.js`, `run-ui.js`, `ui.js`, `hud.js`
- `js/systems/progress.js` — `periodIds()` local
- `js/systems/combat.js`, `spawner.js`, `rift.js`, `judgment.js`, `events.js`, `weather.js`, `hazards.js`, `interact.js`
- `js/entities/enemy.js`, `pickup.js`
- `js/world/world.js`
- `docs/migration/MIGRATION_PLAN.md`, `DECISIONS.md`, `MIGRATION_LOG.md`, `TEST_CHECKLIST.md`

### Archivos eliminados

- `js/net/*` (5)
- `js/ui/social-ui.js`, `ranking-ui.js`, `mod-ui.js`, `support-ui.js`
- `js/core/firebase-config.js`
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `database.rules.json`
- `functions/` (árbol), `cloudflare/` (árbol)
- `docs/FIREBASE.md`, `docs/TURN.md`

### Símbolos / módulos retirados

`G.Social`, `G.Net`, `G.Coop`, `G.Ranking`, `G.Signups`, `SocialUI`, `RankingUI`, `ModUI`, `SupportUI`, `G.Funding` (runtime), Firebase SDK, WebRTC/TURN.

### Decisiones

DEC-010, DEC-011, DEC-012, DEC-013 aplicadas.

### Compatibilidad temporal

- `G.DEX`, `pokedex.js`, `assets/pokemon/` **intactos**
- Prefijo **`ps.*`** sin cambios
- `js/data/funding.js` permanece en disco pero **no** se carga en `dev.html`
- `index.html` / `js/app.min.js` **no regenerados** (bundle producción desactualizado hasta build)

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| Grep runtime cargado (`dev.html` scripts): sin `G.Social`/`G.Ranking`/… | OK |
| `js/net/` vacío en disco | OK |
| Servidor HTTP local + boot navegador | **No ejecutado** (sin `node`/`py` en PATH) |
| Partida manual completa | **Pendiente** en esta fecha → cerrada en «Cierre documental» |
| `node tools/build.js` | **No ejecutado** |

### Errores pendientes (al cierre de implementación inicial)

- Regresión Play → partida (corregida; ver entrada siguiente).
- `js/systems/hazards.js` tras edición automática (corregido en la misma sesión F1).

### Próximo paso recomendado (histórico)

Validación manual → **hecha** (2026-10-31 operador).

---

## 2026-10-31 — Corrección bloqueante de Fase 1

### Fase

1 — motor offline (regresión Play → partida)

### Síntoma reproducido

Tras login/invitado, test de personalidad o menú con compañero elegido, pulsar **Jugar** ocultaba el menú pero la partida no arrancaba (`G.Game.state` no pasaba a `playing` / pantalla sin gameplay).

### Causa raíz

Edición incompleta de referencias `G.Coop` en `js/systems/events.js`: al retirar la sincronización cooperativa en `lostTick()` quedaron tokens huérfanos (`Math.round(...)]);`) que provocan **SyntaxError** al parsear el script. `G.Events` no se define; `G.Game.startRun()` lanza en `G.Events.reset()` **después** de `G.UI.hideAll()`, con el menú ya oculto.

Complemento en el commit `32d57e90` (aún presente si no se aplican los retiros locales): referencias runtime a `G.Coop` en `spawner.js`, `pickup.js`, `combat.js`, `interact.js`, `world.js` → `ReferenceError` en el primer fotograma con `state === 'playing'`.

### Archivos modificados

- `js/systems/events.js` — reparación de sintaxis en `lostTick()` (eliminación del resto del `broadcast` coop)
- (Retiros coop ya en working tree, alineados con F1) `js/systems/spawner.js`, `js/entities/pickup.js`, `js/systems/combat.js`, `js/systems/interact.js`, `js/world/world.js`
- `docs/migration/MIGRATION_LOG.md`, `docs/migration/TEST_CHECKLIST.md`

### Símbolos modificados

- `G.Events.lostTick` — sin bloque de red coop
- `G.Spawner.update` / `spawnOne` / `spawnBoss` / `say` — escalado local sin `G.Coop.*`
- `G.Pickups.push` — sin bifurcación host/cliente
- `G.Combat` (cast) — sin `G.Coop.cast`
- `G.Interact.authority` — siempre local
- `G.World.destroyProp` — sin `G.Coop.propBroken`

### Corrección aplicada

Restaurar `events.js` como módulo válido; completar retirada de llamadas runtime a `G.Coop` en el camino partida (spawn, pickups, combate, interact, props). Sin stubs de `G.Coop` / `G.Ranking`.

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `node --check` en todos los scripts de `dev.html` | OK (solo fallaba `events.js` antes del fix) |
| Grep runtime `G.Coop` / `G.Ranking` en JS cargados por `dev.html` | OK (solo comentarios) |
| Boot `dev.html` en `http://127.0.0.1:8765/dev.html?dev` | OK |
| Invitado → menú → **Jugar** (CDP + clic) | OK — `state: playing`, `G.Player` creado |
| 2 s de simulación: tiempo avanza, enemigos spawn | OK (`enemies: 2`, `time ~ 6.7 s`) |
| Movimiento / combate / muerte / segunda partida (manual) | **OK** (operador, 2026-10-31) |
| Network tab sin Firebase/TURN | **No auditado** explícitamente |
| `node tools/build.js` / `index.html` | **No ejecutado** |

### Referencias residuales

- Comentarios históricos coop en `game.js`, `spawner.js`, etc.
- Archivos `js/net/*.js`, `js/ui/social-ui.js`, etc. **en disco** pero **no** cargados por `dev.html`
- `index.html` / `app.min.js` desactualizados respecto a `dev.html`

### Riesgos pendientes (post-corrección)

- Producción (`index.html`) sigue con bundle pre-F1 hasta build autorizado.
- Service worker puede cachear JS antiguo en despliegues previos.

### Estrategia de rollback

- Revertir el diff de esta corrección en `events.js` y archivos coop retirados (git restore).
- Si hace falta volver al online completo: `git revert` del commit Fase 1 (`32d57e90`) según `MIGRATION_PLAN.md`.

---

## 2026-10-31 — Cierre documental FASE 1

### Fase

1 — **completed**

### Resumen

Motor offline operativo en **`dev.html`**. Infraestructura online retirada del runtime cargado. Contenido Pokémon (`G.DEX`, `assets/pokemon/`) intacto. Prefijo save **`ps.*`** sin cambio (Fase 2).

### Causa raíz regresión bloqueante (corregida)

`js/systems/events.js`: eliminación incompleta de sync coop → **SyntaxError** → `G.Events` ausente → `G.Game.startRun()` falla en `G.Events.reset()` tras ocultar menú. Complemento: referencias runtime `G.Coop` en spawner, pickups, combat, interact, world.

### Corrección bloqueante

Reparar `lostTick()` en `events.js`; retirar llamadas runtime `G.Coop` en el camino de partida (sin stubs online).

### Prueba manual operador (post-corrección) — PASS

Arranque, login/perfil, selección compañero, Play, movimiento, enemigos, combate, pickups, XP, level-up, muerte, menú, segunda partida; consola sin errores bloqueantes. Evidencia fallo previo conservada en `TEST_CHECKLIST.md`.

### Archivos de código tocados en Fase 1 (total)

Ver diff `b1837953..HEAD` + working tree: `dev.html`, `js/main.js`, `js/core/db.js`, `js/game.js`, entidades/sistemas/world/ui listados en entrada FASE 1; eliminados `js/net/*`, UI online, Firebase config e infra repo.

### Referencias online residuales

- Comentarios coop/ranking en varios `.js`.
- `js/data/funding.js` en disco, no cargado en `dev.html`.
- `index.html`, `js/app.min.js`, `sw.js` pueden reflejar build **pre-F1** hasta `node tools/build.js` autorizado.

### Riesgos diferidos

| Riesgo | Fase / acción |
|--------|----------------|
| Bundle producción desactualizado | Build + deploy cuando autorice el dueño |
| SW cachea JS antiguo | Regenerar build/SW al publicar |
| Namespace save `ts.*` | Fase 2 |
| Contenido Pokémon | Fases 3–4 |
| Revisión explícita Network / recarga `localStorage` | Opcional pre-publicación |

### Deuda / adaptadores temporales

- Save y branding siguen en esquema PokéSurvivor (`ps.*`, UI Pokémon).
- Sin adaptadores `G.DEX = G.CREATURES` (reservado F3).

### Errores pendientes

Ninguno bloqueante para Fase 1 en `dev.html`.

### Estrategia de rollback

`git revert` del commit lógico Fase 1 (+ corrección coop/events); restaurar `dev.html`, `db.js` y módulos online desde `b1837953` si se requiere PokéSurvivor online completo.

### Próximo paso recomendado

**No iniciar Fase 2** sin autorización explícita. Opcional: `node tools/build.js` y validar `index.html` antes de publicar.

---

## 2026-10-31 — FASE 2 (Namespace y guardado TibiaSurvivor)

### Fase

2 — **completed** (implementación; smoke manual operador pendiente)

### Archivos modificados

- `js/core/db.js` — prefijo `ts.*`, `product` / `schemaVersion`, validación, cuarentena `.bak.<ts>`, `sanitize(partner)`, sin lectura `ps.save.*`
- `js/core/settings.js`, `js/core/audio.js`, `js/core/i18n.js` — claves `ts.*` + migración one-shot desde `ps.*`
- `js/ui/news-ui.js` — `ts.news.seen`
- `js/ui/run-ui.js` — retirada `ps.ask` (Ko-fi muerto)
- `js/ui/settings-ui.js` — copy cuenta solo local
- `js/game.js` — toast partida recuperada
- `dev.html` — boot idioma `ts.lang` (fallback lectura `ps.lang` solo splash)
- `js/data/changelog.js` — entrada 2026-10-31
- `docs/migration/SAVE_SCHEMA.md` (nuevo), `MIGRATION_PLAN.md`, `MIGRATION_LOG.md`, `TEST_CHECKLIST.md`, `DECISIONS.md`

### Decisiones

DEC-014, DEC-015, DEC-016, DEC-017.

### Compatibilidad temporal

- Campos save Pokémon (`owned`, `partner`, `pupg`, …) **sin cambio** en forma; solo namespace y validación TS.
- `ps.*` en disco del jugador **intacto** (no importado como progreso TS).

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `node --check` en archivos tocados | OK |
| Smoke manual checklist F2 | **Pendiente** operador |

### Próximo paso recomendado

Validación manual F2 (`TEST_CHECKLIST.md`); opcional `node tools/build.js` antes de publicar. **Fase 3** no iniciar sin autorización.

---

<!-- Plantilla para entradas futuras

## YYYY-MM-DD — FASE N

### Fase
N — in_progress | completed | blocked

### Archivos modificados
-

### Archivos eliminados
-

### Símbolos modificados
-

### Decisiones tomadas
-

### Pruebas ejecutadas
|

### Resultados
-

### Errores pendientes
-

### Compatibilidad temporal agregada
-

### Próximo paso recomendado
-

-->
