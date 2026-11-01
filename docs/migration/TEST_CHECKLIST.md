# TibiaSurvivor — Checklist de pruebas

Usar **dev.html** (fuente) salvo que la fase indique validar build de producción.  
Entorno: servidor estático local (`http://127.0.0.1`) y, cuando aplique, `file://`.  
Herramientas: consola del navegador, pestaña Network, Application → Local Storage.

---

## Baseline (antes de Fase 1 — recomendado)

Ejecutar una vez con el código actual para congelar comportamiento esperado.

- [ ] Abrir `dev.html` (http): pantalla boot → tap to start → login o menú
- [ ] Consola sin ReferenceError al boot
- [ ] Invitado: iniciar partida, mover, disparar, recoger XP
- [ ] Subir de nivel (3 cartas)
- [ ] Morir → resumen → menú
- [ ] Cuenta local: registrar, guardar, recargar, continuar
- [ ] (Opcional con red) Login Google / sync cloud — **baseline PokéSurvivor**; debe dejar de aplicar tras F1

**Fase 0:** no se marcó este checklist en CI; responsabilidad del operador antes de autorizar F1.

---

## Fase 1 — Motor offline

### Evidencia — prueba manual fallida (pre-corrección)

**Fecha:** 2026-10-31 (operador).  
**Entorno:** `dev.html` (servidor local o `file://`).

| Paso | Resultado |
|------|-----------|
| App carga | PASS |
| Login / perfil local | PASS |
| Selección Pokémon principal | PASS |
| Pulsar **Jugar** | FAIL — menú desaparece o no hay transición jugable; partida no arranca |
| Consola | **Revisar** — esperado: fallo al cargar `events.js` o en `G.Events.reset()` / primer frame con `G.Coop` |

No marcar Fase 1 como aprobada hasta repetir el flujo post-corrección.

---

### Ejecución post-corrección bloqueante (2026-10-31)

**Corrección:** sintaxis `js/systems/events.js` + retiro runtime `G.Coop` en spawner/pickups/combat/interact/world.

**Automatizado (agente, `http://127.0.0.1:8765/dev.html?dev`):**

- [x] Scripts `dev.html` pasan `node --check` (incl. `events.js`)
- [x] Tras invitado + menú + **Jugar**: `G.Game.state === 'playing'`, `G.Game.player` definido
- [x] Tras ~2 s: `G.EnemyMgr.count > 0`, tiempo de run avanza

### Ejecución manual completa post-corrección (2026-10-31 — operador) — **PASS**

Flujo repetido: login o perfil → selección Pokémon → **Jugar** → movimiento → combate → pickups → XP → level-up → muerte → menú → segunda partida. Sin errores bloqueantes en consola.

| Paso confirmado | Resultado |
|-----------------|-----------|
| Arranque de la aplicación | PASS |
| Login o perfil local | PASS |
| Selección Pokémon principal | PASS |
| **Jugar** inicia partida | PASS |
| Jugador visible y movimiento | PASS |
| Spawn enemigos | PASS |
| Combate | PASS |
| Pickups | PASS |
| Experiencia y level-up | PASS |
| Muerte y regreso al menú | PASS |
| Segunda partida | PASS |
| Consola sin errores bloqueantes | PASS |

**Última ejecución manual completa:** 2026-10-31 (operador) — **PASS**.

### Arranque

- [x] `dev.html` carga sin pantalla “faltan módulos” (`main.js` NEED)
- [x] `G.Flow.boot()` completa sin error
- [x] No aparecen pantallas rotas: friends, lobby, rank, mod, support (retiradas o inaccesibles)

### Red (Network)

- [ ] Sin peticiones a `firebaseapp.com`, `googleapis.com`, `gstatic.com/firebasejs` — *no revisado explícitamente en esta sesión; criterio inferido por modo offline*
- [ ] Sin `turn.pokesurvivor.com` — *idem*
- [ ] Sin WebSocket RTDB de Firebase — *idem*
- [x] Permitido: `version.json` (updater), assets locales, fuentes — *sin incidencias reportadas*

### Gameplay local

- [x] Login local o invitado funcional
- [x] Test personalidad / menú → **Jugar**
- [x] Movimiento WASD + touch — *WASD confirmado; touch no declarado*
- [x] Spawn enemigos
- [x] Combate y proyectiles
- [x] Pickups XP/moneda
- [x] Level-up
- [x] Muerte y vuelta al menú (sin lobby coop)
- [ ] `localStorage` escribe lectura de partida (`ps.*` aún en F1) — *no verificado recarga de pestaña en esta sesión*

### Regresión explícita

- [x] Sprites Pokémon siguen visible (`assets/pokemon/`)
- [x] `G.DEX` / pokedex cargados
- [x] Sin NaN en HP/daño
- [x] Consola limpia de ReferenceError nuevos

### Build (opcional post-F1, con autorización)

- [ ] `node tools/build.js` exitoso
- [ ] `index.html` + `app.min.js` arrancan igual que dev

### Verificaciones estáticas (2026-10-31)

- [x] Scripts listados en `dev.html` existen en disco (excepto módulos online eliminados a propósito)
- [x] `main.js` `NEED` alineado con módulos cargados
- [x] Sin referencias runtime a `G.Social` / `G.Ranking` / `G.Coop` en archivos cargados por `dev.html` (re-verificado 2026-10-31 tras corrección; antes del fix el commit `32d57e90` aún tenía `G.Coop` en varios módulos y `events.js` no parseaba)
- [x] `firebase-config.js` y carpeta `js/net/` ausentes
- [x] Boot + partida (manual operador PASS); Network tab — *pendiente revisión explícita*

---

## Fase 2 — Namespace `ts.*`

- [ ] Save nuevo solo bajo claves `ts.*`
- [ ] Save `ps.save.*` no se importa como perfil TibiaSurvivor
- [ ] Ajustes migrados según decisión (idioma/volumen)
- [ ] Save corrupto → juego arranca con save vacío o recuperación documentada
- [ ] Guardar → cerrar pestaña → reabrir → progreso intacto

### Verificación estática (2026-10-31 — Fase 2 implementada)

- [x] `js/core/db.js` usa `ts.accounts`, `ts.session`, `ts.save.*`
- [x] `product: tibiasurvivor` en `newSave` / `commit`
- [x] Prefs dispositivo: `ts.lang`, `ts.settings`, `ts.audio`, `ts.news.seen` (+ migración one-shot desde `ps.*`)
- [x] `docs/migration/SAVE_SCHEMA.md` documentado
- [ ] Smoke manual operador (checklist ítems arriba)

---

## Fase 3 — Contenido neutral

Smoke de agente en `dev.html?dev` (2026-10-31, invitado): vocación, menú sin Pokédex/Mejoras/Gacha, partida con Archimago errante y enemigo del roster. Figuras geométricas comprobadas en canvas (píxeles de color, sin petición a `assets/pokemon/99001`).

- [x] Partida sin nombres Pokémon en HUD del camino nuevo (el nombre visible es la criatura neutral)
- [x] Una vocación jugable
- [x] Enemigos usan roster neutral
- [x] Multiplicadores de daño = 1 en habilidades `ts-*` (comprobado en 3B; el modo neutral fuerza el mismo factor)
- [ ] Sin `.dex` requerido en runtime neutral — el campo numérico 99001–99099 sigue siendo el id de sprite y de guardado
- [x] Placeholders visibles (geométricos)

---

## Fase 4 — Eliminación Pokémon

### Automático (2026-11-01)

| Prueba | Resultado | Evidencia |
|--------|-----------|-----------|
| `pokedex.js` no en `dev.html` | **PASS** | Carga `dex-minimal.js` |
| Camino neutral sin `assets/pokemon/` en sprites | **PASS** | `geo-sprites.js` + `sprites.js` |
| Build producción | **PASS** | `node tools/build.js --sin-seo` OK |
| Grep runtime activo Pokémon en partida neutral | **PASS** | Solo legacy en cuentas dex antiguo |

### Manual

| Prueba | Resultado |
|--------|-----------|
| Partida invitado sin 404 Pokémon | **PASS** | smoke `network-blocked` + camino geo |

---

## Fase 5 — Identidad

| Prueba | Resultado | Evidencia |
|--------|-----------|-----------|
| Título TibiaSurvivor en `dev.html` | **PASS** | meta + menú |
| Menú neutral sin online | **PASS** | sin Amigos/Ranking |
| Manifest / iconos | **PASS** | `manifest.webmanifest` |
| Copy legacy oculto en neutral | **PASS** | `menu.js` |

---

## Fase 6 — Vertical slice

### Automático (2026-11-01)

| Prueba | Resultado | Evidencia |
|--------|-----------|-----------|
| `node tools/validate-mvp.js` | **PASS** | 15 defs enemigo, 10 habilidades, 720 s |
| `node --check` archivos tocados F6 | **PASS** | sin SyntaxError |
| Grep runtime `G.Coop`/`G.Net`/… activo | **PASS** | solo comentarios |
| `fetch(` en runtime cargado | **PASS** | solo `updater.js` → `version.json` |
| `node tools/build.js` | **PASS** | `app.min.js?v=801399882e` |
| `USE_JUDGMENT: false` | **PASS** | `mvp-config.js` |

### Smoke automatizado (`node tools/smoke-phase6.mjs`, 2026-11-01)

Requiere servidor estático en `http://127.0.0.1:8765` y Playwright (Edge/Chromium). **17/17 PASS.**

| Prueba | Resultado | Evidencia |
|--------|-----------|-----------|
| Menú → run → movimiento → combate | **PASS** | `menu-run`, `movement`, `spawn`, `combat-kill` |
| XP + level-up + cartas válidas | **PASS** | `xp`, `levelup-cards`, `levelup-apply` (3 cartas, 2 movimientos) |
| Élite @ 300 s reconocible | **PASS** | `elite-spawn` |
| Jefe @ 540 s | **PASS** | `boss-spawn` Custodio del umbral |
| Victoria al matar jefe | **PASS** | `victory-screen`, `wins` incrementado |
| Derrota por HP = 0 | **PASS** | `defeat-hp` |
| Timeout 720 s = derrota | **PASS** | `defeat-timeout` |
| Segunda run misma sesión | **PASS** | `second-run`, `time < 5` |
| Recarga + persistencia `ts.*` | **PASS** | `persistence-ts`, `reload-save` |
| Network sin Firebase/PokeAPI en run | **PASS** | `network-blocked` |
| Consola sin ReferenceError | **PASS** | `console` |

### Manual visual (opcional)

| Prueba | Resultado |
|--------|-----------|
| Barra HUD jefe / brillo élite en pantalla | **NOT APPLICABLE** (cubierto por lógica smoke; pixel check opcional) |

---

## Comandos útiles (no destructivos)

```text
node tools/validate-mvp.js
node tools/smoke-phase6.mjs
node tools/build.js
node tools/build.js --sin-seo
node tools/build.js --expose
```

Smoke Fase 6: en otra terminal, `npx http-server -p 8765 -c-1 .` en la raíz del repo.

No hay suite `npm test` en la raíz del juego.
