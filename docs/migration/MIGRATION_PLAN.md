# TibiaSurvivor — Plan de migración

**Producto origen:** PokéSurvivor (motor MIT + contenido Pokémon de terceros)  
**Producto destino:** **TibiaSurvivor** (supervivencia offline en navegador, contenido original)  
**Referencia técnica:** [`docs/CAVERN_ARCHITECTURE_AUDIT.md`](../CAVERN_ARCHITECTURE_AUDIT.md) (auditoría en commit `b297089`; el informe usa el nombre de trabajo histórico “Cavern Survivors”)  
**Reglas de publicación del repo:** [`CLAUDE.md`](../../CLAUDE.md) (`dev.html` → `tools/build.js` → `index.html`)

## Principios

- Una fase por iteración; proyecto ejecutable al cierre de cada fase.
- JavaScript vanilla y carga concatenada (`dev.html`); sin TypeScript/ES modules en la migración inicial.
- Sin borrar assets Pokémon hasta existir reemplazo funcional en runtime.
- Sin adaptadores `G.DEX = G.CREATURES` hasta fases de contenido (documentar y retirar después).
- No mezclar retirada online, cambio de save, contenido neutral y branding en la misma fase.

## Resumen de fases

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Auditoría operativa y línea base | **completed** |
| 1 | Motor offline | **completed** (2026-10-31; smoke manual operador PASS post-corrección) |
| 2 | Namespace y guardado TibiaSurvivor (`ts.*`) | **completed** (2026-10-31) |
| 3 | Capa neutral de contenido | pending |
| 4 | Eliminación de contenido Pokémon | pending |
| 5 | Identidad TibiaSurvivor | pending |
| 6 | Vertical slice MVP | pending |

---

## FASE 0 — Auditoría operativa y línea base

**Estado:** completed (2026-10-30)

### Objetivo

Confirmar el estado real del repositorio sin modificar lógica, assets ni configuración de runtime.

### Acciones realizadas

- Lectura completa de `docs/CAVERN_ARCHITECTURE_AUDIT.md`.
- Inventario de estructura, arranque, `NEED`, `G.Flow.boot()`, acoplamientos online/Pokémon.
- Creación de `docs/migration/*`.
- **Sin cambios** en `js/`, `dev.html`, `tools/build.js`, Firebase, assets.

### Archivos tocados

| Archivo | Acción |
|---------|--------|
| `docs/migration/MIGRATION_PLAN.md` | creado |
| `docs/migration/MIGRATION_LOG.md` | creado |
| `docs/migration/REFERENCE_INVENTORY.md` | creado |
| `docs/migration/TEST_CHECKLIST.md` | creado |
| `docs/migration/DECISIONS.md` | creado |

### Riesgos

Ninguno en runtime (solo documentación).

### Pruebas

- Git: working tree limpio antes de Fase 0.
- No se ejecutó build (evitar regenerar `index.html` / `app.min.js` sin autorización de publicación).

### Criterios de aceptación

- [x] Inventario documentado (`REFERENCE_INVENTORY.md`).
- [x] Flujo de arranque documentado (este plan + inventario).
- [x] Acoplamientos enumerados.
- [x] Pruebas identificadas (`TEST_CHECKLIST.md`).
- [x] Comportamiento del juego sin cambios (cero archivos de runtime modificados).
- [x] Ningún archivo eliminado.

### Rollback

Eliminar `docs/migration/` o revertir el commit de documentación.

---

## FASE 1 — Motor offline

**Estado:** **completed** (2026-10-31)

Validación: prueba manual fallida pre-corrección (Play no arrancaba partida); corrección bloqueante en `events.js` + retiro runtime `G.Coop`; smoke manual completo operador **PASS** (ver `TEST_CHECKLIST.md`).

### Criterios de aceptación (cierre)

| Criterio | Estado | Notas |
|----------|--------|-------|
| Juego inicia (`dev.html`) | **OK** | Operador |
| Partida local (movimiento, spawn, combate, XP, level-up, muerte, menú) | **OK** | Operador; 2ª partida OK |
| Guardado local operativo (sin sync cloud) | **Parcial** | Login/perfil OK; recarga pestaña `ps.*` no declarada en smoke |
| DevTools Network sin Firebase/gstatic SDK/TURN/RTDB | **Parcial** | Modo offline + consola limpia; pestaña Network no auditada explícitamente |
| Sin `G.Social` / `G.Net` / `G.Coop` / `G.Ranking` inicializados | **OK** | Estático + runtime sin ReferenceError |
| Sin ReferenceError nuevos en consola | **OK** | Operador |
| Build producción (`index.html` / `app.min.js`) | **Diferido** | No ejecutado; fuera de alcance obligatorio F1 |

### Objetivo

Retirar infraestructura online manteniendo **temporalmente** datasets y assets Pokémon para no mezclar riesgos.

### Archivos esperados (modificar / retirar / stub)

| Área | Archivos |
|------|----------|
| Red | `js/net/social.js`, `signups.js`, `net.js`, `coop.js`, `ranking.js` |
| UI online | `js/ui/social-ui.js`, `ranking-ui.js`, `mod-ui.js`, `support-ui.js` |
| Firebase | `js/core/firebase-config.js`, ramas cloud en `js/core/db.js` |
| Shell | `dev.html` (scripts, secciones `#scr-*`, preconnect gstatic) |
| Boot | `js/main.js` (`NEED`), `js/game.js` (`G.Flow`, `startRun`, fin de run) |
| Datos online | `js/data/funding.js` (si sigue en NEED) |
| Infra repo | `firebase.json`, `.firebaserc`, `firestore.*`, `database.rules.json`, `functions/`, `cloudflare/`, `docs/FIREBASE.md`, `docs/TURN.md` (retirada física opcional en F1 o sub-paso documentado) |
| Consumidores Coop | `js/game.js`, `enemy.js`, `pickup.js`, `combat.js`, `spawner.js`, `rift.js`, `judgment.js`, `events.js`, `weather.js`, `hazards.js`, `interact.js`, `hud.js`, `run-ui.js`, `progress.js`, `world.js` |

**No tocar en Fase 1:** `js/data/pokedex.js`, `sprites-meta.js`, `assets/pokemon/`, gacha/slots (salvo llamadas online).

### Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Boot falla por `NEED` / `Flow.boot` | Quitar módulos de HTML, `NEED` e `init()` en el mismo commit lógico |
| `G.Coop.*` huérfano | Buscar todas las referencias (~15 archivos fuera de `js/net/`) |
| `G.Ranking.*` en `game.js` / `progress.js` | Eliminar o no-op documentado |
| `G.Flow.afterRun` → lobby | Ramificar a `goMenu()` solo |
| `db.js` aún carga SDK | Una sola ruta local; sin `loadScript` Firebase |
| Invitado / login rotos | Probar cuenta local + invitado tras recorte |

### Pruebas

Ver `TEST_CHECKLIST.md` → sección **Fase 1**.

### Criterios de aceptación

- Juego inicia (`dev.html` vía servidor estático o `file://` local).
- Partida local: movimiento, spawn, combate, XP, level-up, muerte, menú.
- Guardado local operativo (sin sync cloud).
- DevTools Network: sin Firebase, gstatic SDK, TURN, RTDB/Firestore.
- Sin `G.Social` / `G.Net` / `G.Coop` / `G.Ranking` inicializados.
- Sin ReferenceError nuevos en consola.

### Rollback

`git revert` del commit de Fase 1; restaurar entradas en `dev.html` y `db.js` desde `main` pre-migración.

---

## FASE 2 — Namespace y guardado TibiaSurvivor

**Estado:** **completed** (2026-10-31)

### Objetivo

Prefijo `ts.*`, esquema de save explícito, sin cargar saves `ps.*` como TibiaSurvivor.

### Archivos esperados

`js/core/db.js`, `js/core/settings.js`, `js/core/i18n.js`, `js/core/audio.js`, claves en UI que lean `ps.*`, documentación de esquema.

### Riesgos

Pérdida de ajustes de usuario; saves corruptos; ranking cache `ps.rk.c.*` (ya prescindible tras F1).

### Pruebas

`TEST_CHECKLIST.md` → **Fase 2**.

### Criterios de aceptación

- Save nuevo solo `ts.*`; `ps.save.*` ignorado para perfil TibiaSurvivor.
- Save inválido no bloquea arranque.
- Persistencia configuración migrada deliberadamente (idioma/volumen si se decide).

### Rollback

Revertir Fase 2; datos `ts.*` quedan en localStorage del navegador de prueba (documentar).

---

## FASE 3 — Capa neutral de contenido

**Estado:** pending

### Objetivo

Introducir `creatures`, `abilities`, `damage-types`, `vocations`, `enemies` originales; adaptadores temporales hacia `G.DEX` si hace falta.

### Archivos esperados

Nuevos: `js/data/creatures.js`, `abilities.js`, `damage-types.js`, `vocations.js`; cambios en `player.js`, `enemy.js`, `spawner.js`, `sprites.js`, `dev.html`.

### Riesgos

NaN en stats; rutas sprite; type keys rotos en VFX/weather.

### Pruebas

`TEST_CHECKLIST.md` → **Fase 3**.

### Criterios de aceptación

- Run completa sin nombres Pokémon en pantalla.
- Una vocación jugable; 3–8 criaturas; multiplicadores de daño neutros (1).
- Adaptadores documentados en `DECISIONS.md`.

### Rollback

Revertir Fase 3; Pokémon data sigue en disco pero puede reactivarse en HTML.

---

## FASE 4 — Eliminación contenido Pokémon

**Estado:** pending

### Objetivo

Quitar datasets, assets, SEO, herramientas fetch, créditos obsoletos, cuando no haya referencias runtime.

### Riesgos

Repo size; SW cache; build/SEO generators republish IP.

### Pruebas

`TEST_CHECKLIST.md` → **Fase 4** + búsqueda global acordada.

### Criterios de aceptación

- Sin `assets/pokemon/` en rutas runtime.
- Sin PokeAPI/SpriteCollab en juego distribuido.
- Build OK.

### Rollback

No restaurar 13k PNGs sin git; revert commit lógico y re-añadir scripts desde historial.

---

## FASE 5 — Identidad TibiaSurvivor

**Estado:** pending

### Objetivo

Branding, manifest, menú MVP, bestiario, sin opciones online.

### Archivos esperados

`dev.html`, `manifest.webmanifest`, iconos, README/GDD, `js/data/changelog.js` (entrada de migración).

### Rollback

Revert branding; regenerar build.

---

## FASE 6 — Vertical slice

**Estado:** pending

### Objetivo

1 bioma, 1 vocación, 10–15 enemigos, 8–12 habilidades, 3 tipos de daño, élite + jefe, 10–15 min, sin red.

### Rollback

Revert contenido slice; motor offline intacto.

---

## Control de cambios (plantilla por fase)

Antes de cada fase completar:

| Archivo | Acción | Símbolos afectados | Riesgo | Validación |
|---------|--------|--------------------|--------|------------|

Después de cada fase: ver protocolo en solicitud de migración (resumen, pruebas, rollback, recomendación).

## Commits sugeridos (solo con autorización)

- Fase 0: `chore(migration): document baseline architecture`
- Fase 1: `refactor(offline): remove online infrastructure`
- Fase 2: `refactor(save): isolate TibiaSurvivor local storage`
- Fase 3: `refactor(content): introduce neutral creature model`
- Fase 4: `chore(ip): remove pokemon content and assets`
- Fase 5: `feat(branding): apply TibiaSurvivor identity`
- Fase 6: `feat(mvp): complete first playable vertical slice`
