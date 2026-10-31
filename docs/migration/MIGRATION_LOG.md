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

1 — completed (smoke test manual en navegador **pendiente**: no hay Node/Python en PATH del agente para servidor local)

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
| Partida manual completa | **Pendiente** (operador) |
| `node tools/build.js` | **No ejecutado** |

### Errores pendientes

- Corregir `js/systems/hazards.js` tras edición automática (hecho en la misma sesión).
- Validación jugable manual recomendada antes de Fase 2.

### Próximo paso recomendado

**Fase 2 — Namespace y guardado `ts.*`** (solo con autorización explícita).

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
