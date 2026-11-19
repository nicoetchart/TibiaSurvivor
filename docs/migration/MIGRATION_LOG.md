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
- `js/data/content-bridge.js` — `@ts-adapter-f3` copia en `G.DEX_BY` ids 99001–99007; habilidad inicial en Master Sorcerer (99001)
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

## 2026-11-01 — FASE 6 (Vertical slice MVP)

### Fase

6 — **completed**

### Resumen

Cierre del ciclo jugable neutral: bioma Cueva Cristal fijo, 14 enemigos + jefe, 10 habilidades, tipos physical/fire/energy, élite programado (Centinela de élite @ 300 s), jefe Custodio del umbral @ 540 s, tope 720 s. **Victoria al derrotar al jefe**; agotar tiempo sin vencerlo = derrota.

### Archivos modificados

- `js/data/mvp-config.js` — duración 12 min, `ELITE_AT`, `VICTORY_ON_BOSS`
- `js/data/neutral-roster.js` — `buildElite()`
- `js/systems/spawner.js` — spawn élite + intro jefe neutral
- `js/game.js` — `scheduleVictory`, timeout derrota, `runFrozen`
- `js/systems/progress.js` — dispara victoria MVP al jefe final
- `js/entities/enemy.js` — visual élite, tipos `physical` fallback
- `js/systems/levelup.js` — Frasco vital
- `js/data/abilities.js`, `js/data/creatures.js` — tipos slice (3)
- `js/data/changelog.js`, `dev.html`
- `tools/validate-mvp.js` (nuevo)
- `docs/migration/MIGRATION_PLAN.md`, `TEST_CHECKLIST.md`, `MIGRATION_LOG.md`
- Generados: `index.html`, `js/app.min.js`, `version.json` (build)

### Contenido

| Categoría | Detalle |
|-----------|---------|
| Vocación | Master Sorcerer |
| Habilidades | 10 (`ts-arc-bolt` … `ts-ward-pulse`) |
| Enemigos | 99002–99015 + jefe 99016 |
| Élite | Centinela de élite (jumper, recompensa XP 85) |

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `node tools/validate-mvp.js` | OK |
| `node tools/build.js --sin-seo` | OK |
| `node tools/smoke-phase6.mjs` | **17/17 PASS** (2026-11-01) |
| `node tools/validate-mvp.js` | OK |

### Riesgos

- Validación manual de timing (9 min jefe en sesión real) no ejecutada por agente.
- Cuentas legacy con partner Pokémon siguen camino Pokémon (DEC-019).

### Rollback

Revertir commit lógico F6; conservar motor offline y `ts.*`. Quitar `validate-mvp.js` opcional.

### 2026-11-01 — Validación smoke Fase 6

- `tools/smoke-phase6.mjs` — 17/17 PASS (Playwright + `http://127.0.0.1:8765/dev.html?dev`)
- `js/game.js` — `debugResume()` para cierre de pantallas en smoke (solo dev/smoke)

### Próximo paso

Commit autorizado cuando el dueño lo pida: `feat(mvp): complete first playable vertical slice`.

---

## 2026-11-18 — PSR-0 — Cierre decisiones pendientes (D-01–D-12)

### Fase

PSR-0 — **completed** (auditoría + decisiones de producto para PSR-1+)

### Decisiones tomadas

**DEC-027** a **DEC-038** en `docs/migration/DECISIONS.md` (resolución auditoría PSR-0 §H).

Resumen propietario:

| ID | Resolución |
|----|------------|
| D-01 / DEC-027 | Gacha eliminado por completo |
| D-02 / DEC-028 | `coins` + copy **gold coin** (tienda/mejoras futuras) |
| D-03 / DEC-029 | Sin tienda MVP; market futuro (ítems coleccionables) |
| D-04 / DEC-030 | Sin shiny; rareza bestiary/bosstiary |
| D-05 / DEC-031 | Sin companions MVP |
| D-06 / DEC-032 | Solo bestiary + bosstiary |
| D-07 / DEC-033 | Reescribir goals/misiones/logros |
| D-08 / DEC-034 | Rift Tibia (bosses); sin Arceus/Judgment Pokémon |
| D-09 / DEC-035 | Dominio nuevo (URL TBD) |
| D-10 / DEC-036 | Borrar `ps.*` local |
| D-11 / DEC-037 | Solo neutral tras PSR-2 |
| D-12 / DEC-038 | Vocación única; meta = bestiario/charms/upgrades/logros/misiones |

### Archivos modificados (esta entrada)

- `docs/migration/DECISIONS.md` — nuevas filas DEC-027–038
- `docs/migration/MIGRATION_LOG.md` — esta entrada

### Próximo paso recomendado

**Autorizar PSR-1** (glosario + contratos: `creatureId`, gold coin, fin de `G.getPokemon`; sin cambios de runtime masivos hasta acordar alcance PSR-1).

---

## 2026-11-18 — PSR-1 — Vocabulario y contratos canónicos

### Fase

PSR-1 — **completed** (documentación + alias API; smoke operador pendiente)

### Archivos creados / modificados

| Archivo | Cambio |
|---------|--------|
| `docs/TIBIA_GLOSSARY.md` | Glosario canónico DEC-027–038 |
| `docs/migration/PSR-1_CONTRACTS.md` | Mapa símbolos, consumidores, aceptación |
| `docs/migration/SAVE_SCHEMA.md` | Sección PSR-1 moneda/meta |
| `docs/migration/TEST_CHECKLIST.md` | Bloque pruebas PSR-1 |
| `js/data/dex-minimal.js` | `G.getCreatureByLegacyId`; deprecación `G.DEX` / `getPokemon` |
| `js/data/content-bridge.js` | Cabecera PSR-1 (no ampliar adaptador) |
| `js/data/content-api.js` | Cabecera API canónica |
| `js/core/db.js` | Comentario `coins` = gold coin |
| `js/data/lang-en.js` | Claves i18n PSR-1 moneda |

### Decisiones aplicadas

DEC-028 (gold coin), DEC-037 (objetivo neutral), contratos bestiario/bosstiary referenciados en glosario.

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `node --check` archivos JS tocados | **OK** |
| `node tools/validate-mvp.js` | **FAIL** — duplicado `bestiary id minotaur_guard` (pre-existente; no causado por PSR-1) |
| Boot manual `dev.html?dev` | Pendiente operador |
| `rg G.getPokemon` en `js/*.js` | **OK** — solo `dex-minimal.js` + `pokedex.js` (no cargado en dev) |

### Deuda

Inventario consumidores `G.DEX_BY` en `PSR-1_CONTRACTS.md` §4.

### Condición para PSR-2

Smoke PSR-1 OK + autorización propietario para refactor enemy/player/game (sin ampliar legacy).

### Próximo paso recomendado

**PSR-2** — sustituir lecturas `G.DEX_BY` por `G.Content.getCreature` / `CREATURE_BY_LEGACY`; retirar `content-bridge`.

---

## 2026-11-18 — PSR-2

### Fase
PSR-2 — in_progress (núcleo runtime; gacha/goals/menu-dex legacy pendiente PSR-4/5)

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `js/data/content-api.js` | `toRuntimeMon`, `runtimeByLegacyId`, `creatureName`; `syncFromSave` → neutral |
| `js/data/content-bridge.js` | Sin `installLegacyAliases` / `toLegacyMon` |
| `js/data/dex-minimal.js` | `getCreatureByLegacyId` → Content |
| `js/game.js` | Partner vía `runtimeByLegacyId` |
| `js/entities/enemy.js` | Nombre/tipos vía Content |
| `js/core/db.js` | `sanitize` solo `Content.getCreature` |
| `js/ui/menu.js` | Menú principal partner vía Content |
| `js/ui/vocation-ui.js` | Confirm sin `G.DEX_BY` |
| `js/ui/run-ui.js` | Nombres capturas vía `creatureName` |
| `js/data/changelog.js` | Entrada PSR-2 |

### Símbolos

- **Añadidos:** `G.Content.toRuntimeMon`, `runtimeByLegacyId`, `creatureName`
- **Retirados del boot:** población `G.DEX_BY` desde bridge
- **Deprecados:** consumo directo de `G.DEX_BY` en camino MVP (quedan gacha/goals/menu-dex legacy)

### Decisiones aplicadas

DEC-037 (runtime neutral por defecto).

### Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `node tools/validate-mvp.js` | **OK** |
| `node tools/validate-bestiary-balance.js` | **OK** |
| Boot `dev.html?dev` | Pendiente operador |

### Deuda PSR-2 restante

`goals-ui.js`, `menu.js` (dex/upgrades), `events/rift/judgment` (legacy), `gacha*`, `starters.js`, `enemies.js` (no boot neutral), renombrar `.dex` en entidades (PSR-3).

### Próximo paso recomendado

**PSR-3** — roster/spawner sin `G.Enemies`; eliminar `G.Moves` Pokémon del boot; endurecer validación anti-`DEX_BY` en `validate-mvp.js`.

---

## 2026-11-18 — PSR-3

### Fase
PSR-3 — completed (boot neutral; legacy datos en repo sin cargar en `dev.html`)

### Archivos nuevos / modificados

| Archivo | Cambio |
|---------|--------|
| `js/data/spell-runtime.js` | `G.Moves` = fachada de `G.Abilities` (+ stamp vocación) |
| `js/systems/judgment-stub.js` | Sustituye `judgment.js` en boot (DEC-034) |
| `dev.html` | Quita `moves`, `types`, `enemies`, `starters`, `content-bridge`, `judgment.js` |
| `js/main.js` | NEED sin `ContentBridge` ni `Enemies` |
| `js/data/content-api.js` | `roster()` → `NeutralRoster` si no hay `G.Enemies` |
| `js/systems/rift.js` | Pool bosstiary desde `G.CREATURES` en neutral |
| `tools/validate-mvp.js` | Checks PSR-3 (`DEX_BY` vacío, `Moves` alias, roster) |
| `tools/ms9-smoke.js` | Boot MS con `spell-runtime` |

### Decisiones

DEC-034 (sin Judgment/Arceus), DEC-037 (neutral), grietas desactivadas MVP (`DISABLE_RIFTS`).

### Pruebas

| Prueba | Resultado |
|--------|-----------|
| `validate-mvp.js` | **OK** |
| `validate-bestiary-balance.js` | **OK** |
| `ms9-smoke.js` | **OK** |
| Boot `dev.html?dev` | Pendiente operador |

### Deuda

`moves.js` / `enemies.js` / `pokedex.js` siguen en repo para export legacy o `?content=legacy` manual; gacha/goals/menu-dex aún referencian `G.DEX` si se cargan.

### Próximo paso

**PSR-4** — quitar gacha del menú y save; metaprogresión bestiario/charms sin `owned` dex.

---

## 2026-11-18 — PSR-4

### Fase
PSR-4 — completed (gacha/shiny/tickets; vocación + `upgrades`)

### Cambios

| Archivo | Cambio |
|---------|--------|
| `dev.html` | Sin pantalla/botón gacha; `gacha-stub.js` |
| `js/data/gacha-stub.js` | Constantes rarity (iconos) |
| `js/core/db.js` | `selectedVocation`, `upgrades` vocación, strip tickets/pity |
| `js/ui/vocation-ui.js` | Guarda `selectedVocation` |
| `js/systems/spawner.js` | Sin shiny wild neutral |
| `js/game.js` | Sin tickets/shiny/rescue; sin `GachaUI` |
| `js/systems/progress.js` | Recompensas sin tickets en save neutral |

### Decisiones

DEC-027, DEC-028, DEC-030, DEC-038.

### Pruebas

| Prueba | Resultado |
|--------|-----------|
| `validate-mvp.js` | **OK** |
| `ms9-smoke.js` | **OK** |
| Boot menú sin Gacha | Operador |

### Deuda

`goals-ui` / misiones con copy legacy; pantallas `scr-dex`/`scr-upgrades` en HTML; `gacha.js` en repo.

### Próximo paso

**PSR-5** — goals/profile sin `G.DEX_BY`; limpiar HTML legacy.

---

## 2026-11-18 — PSR-5

### Fase
PSR-5 — completed (UI neutral; legacy HTML/boot retirado)

### Cambios

| Archivo | Cambio |
|---------|--------|
| `dev.html` | Sin scr-test/dex/upgrades; sin test.js/slots.js |
| `js/ui/goals-ui.js` | Perfil neutral: Cyclopedia, favoritos Bestiary, sin `G.DEX_BY` |
| `js/ui/menu.js` | Sin Collection/Upgrades |
| `js/ui/ui.js` | Lista `SCREENS` alineada |
| `js/game.js` | Sin TestUI; `ProfileUI.init` |
| `js/core/db.js` | Sanitize `profile.favs` neutral |

### Próximo paso

**PSR-6** — assets/sprites Pokémon; SEO/dominio.

---

## 2026-11-18 — PSR-6

### Fase
PSR-6 — completed (export/SEO Tibia; sprites legacy gated; dominio centralizado)

### Cambios

| Archivo | Cambio |
|---------|--------|
| `tools/site-config.json` | URL canónica (`siteUrl`); override `TIBIASURVIVOR_SITE_URL` |
| `tools/export_data.js` | Boot Tibia: sin `pokedex`, `moves`, `types`, `sprites-meta`; hechizos y `damageTypes` |
| `tools/make_seo_pages.py` | Lee `site-config`; sin `sprites-meta` ni sprites Pokémon en HTML |
| `tools/validate-psr6.js` | Comprueba export, dev.html y gating neutral |
| `js/core/sprites.js` | `hasShiny` false en modo neutral |

### Dominio (DEC-035)
- Canónico: `https://www.tibiasurvivor.com/` · `CNAME` → `www.tibiasurvivor.com`

### Próximo paso

**PSR-7** — purge `ps.*`, dominio y certificación final.

---

## 2026-11-18 — PSR-7

### Fase
PSR-7 — completed (purge `ps.*`; certificación; código legacy recortado)

### Cambios

| Archivo | Cambio |
|---------|--------|
| `js/core/db.js` | `purgeLegacyPs()` (DEC-036) |
| `js/game.js` | Purge en `Flow.boot` |
| `js/ui/menu.js` | Sin colección/mejoras Pokémon |
| `js/ui/goals-ui.js` | Perfil solo Bestiary / neutral |
| `js/data/dex-minimal.js` | Sin alias `getPokemon` |
| `tools/validate-psr7.js` | Certificación MVP + dominio + purge |
| `tools/prune-legacy-pokemon-assets.js` | Opcional: `git rm` de `assets/pokemon/` |
| `dev.html` | Sin `window.PS_PAGES` |
| `SAVE_SCHEMA.md` | Documenta purge `ps.*` |

### Assets Pokémon (DEC-030)
- Ejecutar `node tools/prune-legacy-pokemon-assets.js` para sacar `assets/pokemon/` del repo (~13k PNG).

### Próximo paso

Mantenimiento MVP; Fase siguiente según roadmap del propietario.

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
