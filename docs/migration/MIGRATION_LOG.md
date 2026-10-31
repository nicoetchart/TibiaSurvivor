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

## 2026-10-31 — FASE 3 (Planificación y decisiones DEC-018–026)

### Fase

3 — **pending** (plan detallado acordado; implementación no iniciada)

### Archivos modificados

- `docs/migration/DECISIONS.md` — DEC-018 a DEC-026 (**accepted**)
- `docs/migration/MIGRATION_LOG.md` — esta entrada

### Decisiones tomadas

DEC-018 (banda 99001–99099), DEC-019 (solo cuentas nuevas → flujo neutral), DEC-020 (vocación **Master Sorcerer**, nombre UI original), DEC-021 (eliminar test personalidad), DEC-022 (Rift + Judgment accesibles; Gacha eliminado), DEC-023 (ocultar Pokédex/Mejoras/Gacha en menú F3), DEC-024 (sanitize ids TS sin subir schemaVersion), DEC-025 (solo dev.html en F3), DEC-026 (clima cosmético, mult daño = 1).

### Implicaciones para subfases

| Subfase | Ajuste por decisiones |
|---------|------------------------|
| 3A | Documentar banda ids; `G.Vocations` con `master_sorcerer` |
| 3B | Abilities acorde hechicero; `G.DamageTypes.mult` = 1; weather sin buff elemental |
| 3C | Criaturas neutrales + roster; no mezclar con cuentas legacy con partner dex |
| 3D | `Flow.afterLogin`: vocación si cuenta nueva o `partner` null; legacy si partner dex Pokémon; retirar TestUI |
| 3E | Ocultar entradas menú; quitar gacha de NEED/dev.html cuando corresponda; rift/judgment sin retirar |

### Deuda explícita

- Rift/Judgment accesibles pueden mostrar nombres Pokémon hasta sustitución de contenido (F4 o parche F3E documentado).
- Cuentas TS ya creadas con partner Pokémon no migran solas al neutral (DEC-019).

### Próximo paso recomendado

Autorización explícita de **Subfase 3A — Inventario e interfaces neutrales** (código + `dev.html` scripts, sin build producción).

---

## 2026-10-31 — FASE 3A (Inventario e interfaces neutrales)

### Fase

3A — **completed**

### Archivos creados

- `js/data/damage-types.js` — `G.DamageTypes` (mult ×1)
- `js/data/creatures.js` — `G.CREATURES`, `G.CREATURE_BY_ID`, `G.CREATURE_BY_LEGACY` (99001–99007)
- `js/data/abilities.js` — `G.Abilities` (4 habilidades `ts-*`)
- `js/data/vocations.js` — `G.Vocations` (`master_sorcerer`)
- `js/data/content-api.js` — `G.Content`
- `js/data/content-bridge.js` — `G.ContentBridge` (stub; sin `installLegacyAliases` en boot)

### Archivos modificados

- `dev.html` — orden de scripts (neutral data tras `types.js`)
- `js/main.js` — `NEED`: `DamageTypes`, `Content`, `ContentBridge`, `Abilities`, `Vocations`
- `js/data/changelog.js` — entrada 3A
- `docs/migration/MIGRATION_LOG.md`

### Símbolos nuevos

`G.DamageTypes`, `G.CREATURES`, `G.CREATURE_BY_ID`, `G.CREATURE_BY_LEGACY`, `G.Abilities`, `G.Vocations`, `G.Content`, `G.ContentBridge`.

### Compatibilidad temporal

- `G.Content.mode` = `'legacy'`; `startRun` sin cambios.
- Pokémon (`G.DEX`, `moves`, test personalidad) intactos.
- `@ts-adapter-f3` en `content-bridge.js`.

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `node --check` en archivos 3A + `main.js` | OK |

### Próximo paso recomendado

**Subfase 3B** — `G.DamageTypes` en combate/jugador; puente abilities → combat.

---

## 2026-10-31 — FASE 3B (DamageTypes y Abilities)

### Fase

3B — **completed**

### Archivos modificados

- `js/data/abilities.js` — buff usa `stat: 'atk'` (contrato de `Player.addBuff`)
- `js/data/damage-types.js` — colores/nombres en `G.U` solo si la clave no existía
- `js/data/content-api.js` — `usesNeutralDamage`, `attackFactor`, `effectivenessLabel`
- `js/data/content-bridge.js` — `@ts-adapter-f3` `installAbilityAliases()` al cargar
- `js/systems/combat.js` — `typeK` / etiquetas vía `G.Content`; proyectiles llevan `aid`
- `js/entities/player.js` — `hurt` usa `attackFactor` (clima incluido solo en camino Pokémon)
- `js/systems/weather.js` — si `G.Content.mode === 'neutral'`, daño, chip y ralentización = neutros (DEC-026)
- `js/data/changelog.js`

### Qué no cambió

- `G.Types.mult` sigue siendo la tabla de 18 tipos. No se reasignó a `G.DamageTypes`.
- `G.Content.mode` sigue en `'legacy'`. Partidas con compañero Pokémon conservan ventajas elementales y clima.
- `installLegacyAliases()` no se llama (criaturas aún no entran en `G.DEX_BY`).

### Regla de daño

| Origen | Multiplicador |
|--------|----------------|
| Id en `G.Abilities` (`ts-*`) | `G.DamageTypes.mult` = 1, sin clima |
| `G.Content.mode === 'neutral'` | igual, también golpes sin id de habilidad |
| Movimiento Pokémon | `G.Types.mult` × `G.Weather.mult` |

### Pruebas

`node --check` y script de factores (habilidad `ts-arc-bolt` instancia; fuego vs planta = 1 con id `ts-*` y 1.6 con id Pokémon).

### Próximo paso recomendado

**Subfase 3C** — roster de criaturas y vocación conectados al spawner, sin sustituir todavía el arranque de partida.

---

## 2026-10-31 — FASE 3C (Creatures, vocación y roster)

### Fase

3C — **completed**

### Archivos

- `js/data/neutral-roster.js` — `G.NeutralRoster` (6 enemigos, sin jefe)
- `js/data/content-api.js` — `G.Content.roster()`
- `js/data/content-bridge.js` — `@ts-adapter-f3` copia en `G.DEX_BY` ids 99001–99007; habilidad inicial en el archimago
- `js/systems/spawner.js`, `js/systems/events.js` — leen `G.Content.roster()`
- `dev.html`, `js/main.js` — script y `NEED`
- `js/data/changelog.js`

### Comportamiento

- `G.Content.mode` sigue en `'legacy'`: el spawner sigue llamando a `G.Enemies`.
- Con modo `neutral`, `bagAt` solo devuelve `legacyId` 99002–99007. `99001` es el jugador.
- `G.DEX` (el array) no recibe criaturas nuevas. `G.DEX_BY[9900x]` es una copia de forma, no un segundo diseño.
- Vocación `master_sorcerer` → habilidad `ts-arc-bolt` en la criatura `wander_archmage`.
- `startRun` y el test de personalidad no se han tocado.

### Próximo paso recomendado

**Subfase 3D** — selección de vocación, jugador y spawner en modo neutral para cuentas nuevas.

---

## 2026-10-31 — FASE 3D (Player, vocación y spawner)

### Fase

3D — **completed**

### Archivos

- `js/ui/vocation-ui.js` y `dev.html` — pantalla de vocación; el test de personalidad ya no se abre
- `js/game.js` — `syncFromSave` antes de crear al jugador; habilidad `ts-arc-bolt` en modo neutral
- `js/core/db.js` — `sanitize` acepta ids de `G.Content.getCreature` sin subir `schemaVersion`
- `js/data/content-api.js` — `syncFromSave`, `startingMoveId`, `learnPool`; `getCreature` acepta `"99001"`
- `js/systems/levelup.js` — el pool neutral sale de `G.Abilities`
- `js/systems/events.js` — en neutral no hay criatura perdida ni ladrón de dex Pokémon
- `js/ui/menu.js` — oculta Pokédex, Mejoras y Gacha si el modo es neutral
- `js/main.js` — `NEED` incluye `VocationUI`

### Regla de cuenta (DEC-019)

| `save.partner` | Modo | Arranque |
|----------------|------|----------|
| `null` | neutral | pantalla de vocación |
| 99001–99099 | neutral | menú y roster `G.NeutralRoster` |
| dex Pokémon | legacy | menú y `G.Enemies` |

### Próximo paso recomendado

**Subfase 3E** — sprites geométricos y revisión del HUD en `dev.html`.

---

## 2026-10-31 — FASE 3E (Sprites geométricos y HUD)

### Fase

3E — **completed**. Con esto cierra la Fase 3 en el camino de cuentas nuevas. Los scripts de gacha siguen cargados porque el menú legacy (DEC-019) aún los consulta. Las grietas y el juicio siguen pudiendo mostrar arte Pokémon; los avisos y la barra de vida en modo neutral dicen «guardián».

### Archivos

- `js/core/geo-sprites.js` — `G.GeoSprites` (triángulo, orbe, cuña, bloque, diamante)
- `js/core/sprites.js` — ids 99001–99099 no piden `assets/pokemon/`
- `js/entities/enemy.js` — en modo neutral, un dex ajeno se llama Guardián
- `js/ui/hud.js`, `js/ui/run-ui.js`, `js/systems/rift.js`, `js/systems/judgment.js` — textos del camino neutral
- `dev.html`, `js/main.js` — script y `NEED`

### Próximo paso recomendado

**Fase 4** no iniciar sin autorización. Antes, prueba manual del checklist de Fase 3 en `dev.html`.

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
