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

- [ ] Grep de control: sin rutas `assets/pokemon/` en JS/SW/HTML distribuido
- [ ] Sin `pokedex.js` en script list
- [ ] Build + SW regenerados
- [ ] Partida jugable post-limpieza

---

## Fase 5 — Identidad

- [ ] Título visible TibiaSurvivor
- [ ] Sin “PokéSurvivor” / “Cavern Survivors” en UI principal
- [ ] Manifest e iconos coherentes
- [ ] Menú MVP (Jugar, Vocación, Mejoras, Bestiario, Opciones) sin entradas online

---

## Fase 6 — Vertical slice

- [ ] Run 10–15 min completable
- [ ] 1 bioma, 1 vocación, jefe + élite
- [ ] Oro + XP + mejoras in-run
- [ ] Resumen de partida
- [ ] Cero llamadas de red

---

## Comandos útiles (no destructivos)

```text
node tools/build.js
node tools/build.js --sin-seo
node tools/build.js --expose
```

No hay suite `npm test` en la raíz del juego.
