# TibiaSurvivor — Decisiones de arquitectura

| ID | Fecha | Decisión | Motivo | Alternativas | Consecuencias | Estado |
|----|-------|----------|--------|--------------|---------------|--------|
| DEC-001 | 2026-10-30 | Prefijo de persistencia **`ts.*`** para TibiaSurvivor (Fase 2) | Instrucción del propietario; separa saves de PokéSurvivor | `cs.*` sugerido en `CAVERN_ARCHITECTURE_AUDIT.md` | Saves `ps.*` no se mezclan; migración selectiva de prefs si se define | **accepted** (implementación pending F2) |
| DEC-002 | 2026-10-30 | Mantener JS vanilla + orden `dev.html` durante toda la migración | Motor ya concat-friendly; riesgo IP > tipos | TypeScript, ES modules, bundler nuevo | Adaptadores temporales en global `G.*` | **accepted** |
| DEC-003 | 2026-10-30 | Fase 1 solo retira **online**; **no** tocar `G.DEX` ni `assets/pokemon/` | Desacoplar riesgo infra vs contenido | Big-bang offline + content swap | Juego sigue siendo Pokémon-themed hasta F3–F4 | **accepted** |
| DEC-004 | 2026-10-30 | Identificadores de daño objetivo: physical, fire, ice, energy, earth, death, holy | Alineación diseño fantasía sin copiar Tibia | Mantener 18 tipos Pokémon más tiempo | Fase 3+: tabla neutra mult=1 primero | **accepted** (implementación pending F3) |
| DEC-005 | 2026-10-30 | Vocaciones diseño: knight, paladin, sorcerer, druid; **una** en primer slice | MVP acotado | Cuatro vocaciones en F3 | `vocations.js` con una entrada activa inicial | **accepted** (implementación pending F3/F6) |
| DEC-006 | 2026-10-30 | Adaptadores temporales `G.DEX = G.CREATURES` permitidos en F3+ | Compatibilidad incremental | Rewrite total referencias `.dex` | Deben listarse en MIGRATION_LOG y eliminarse en fase posterior | **accepted** |
| DEC-007 | 2026-10-30 | Conservar `tools/build.js` y `version.json` / `updater.js` mientras funcionen | Reglas CLAUDE.md / hosting estático | Solo dev.html sin build | Fase 5 regenera `index.html` vía build oficial | **accepted** |
| DEC-008 | 2026-10-30 | No introducir assets/nombres Tibia/CipSoft | Requisito legal del propietario | Placeholders de terceros | Solo placeholders originales o geométricos | **accepted** |
| DEC-009 | 2026-10-30 | Nombre producto documentación: **TibiaSurvivor** | Nombre de trabajo del propietario | Solo “Cavern Survivors” del audit | Docs de migración usan TibiaSurvivor; audit histórico sin renombrar en F0 | **accepted** |
| DEC-010 | 2026-10-31 | Retirada física de `functions/`, `cloudflare/`, reglas Firebase en F1 | Limpieza repo offline | Dejar infra inerte en disco | Menos confusión deploy; reversible por git | **accepted** |
| DEC-011 | 2026-10-31 | Tras F1: `G.Flow.afterRun` siempre `goMenu()` (sin lobby) | Coop eliminado | Mantener UI lobby vacía | Menos código muerto | **accepted** |
| DEC-012 | 2026-10-31 | `db.js` F1: modo único local; invitado opcional | Offline MVP | Login Google sin cloud | Simplifica NEED; login UI local-only | **accepted** |
| DEC-013 | 2026-10-31 | `progress.js`: `periodIds()` local sustituye `G.Ranking.periodIds()` | Ranking eliminado | Reutilizar ranking.js stub | Misiones diarias/semanales siguen rotando | **accepted** |
| DEC-014 | 2026-10-31 | Saves TS solo `ts.save.*`; **no** importar `ps.save.*` | Separar productos | Auto-migrar partida PS | Progreso TS empieza en cuenta nueva | **accepted** |
| DEC-015 | 2026-10-31 | Migración one-shot prefs `ps.lang/settings/audio/news.seen` → `ts.*` si TS ausente | UX dispositivo | No migrar prefs | Ajustes conservados sin mezclar partidas | **accepted** |
| DEC-016 | 2026-10-31 | Save TS: `product` + `schemaVersion: 1`; corrupto → `.bak.<ts>` + fresh | Recuperación boot | Silencioso / borrar | Aviso toast al login | **accepted** |
| DEC-017 | 2026-10-31 | Mantener cuentas locales `ts.accounts` (mismo modelo que PS offline F1) | Menor diff F2 | Perfil único | Login/registro igual | **accepted** |
| DEC-018 | 2026-10-31 | Banda numérica **`99001–99099`** para ids en `partner` / `owned` (contenido neutral F3) | Compatibilidad save F2 sin `schemaVersion` 2 | Strings en save; reutilizar dex 1–966 | `sanitize` valida contra `G.CREATURE_BY_ID` además de `G.DEX_BY`; sin colisión con Pokédex | **accepted** |
| DEC-019 | 2026-10-31 | Cuentas TS con `partner` Pokémon existente: **solo cuentas nuevas** entran al flujo neutral | Evitar reset involuntario de progreso dex | Re-vocación forzada; dual runtime | Perfiles con partner dex legacy siguen camino Pokémon hasta F4; `newSave` / primera elección vocación → banda TS | **accepted** |
| DEC-020 | 2026-10-31 | Vocación única F3: arquetipo **Master Sorcerer** (nombre **original** en UI; id estable p. ej. `master_sorcerer`) | Elección del propietario; alinea DEC-005 | Knight / Paladin / Druid en F3 | `vocations.js` una entrada; habilidades a distancia / energy-typed VFX sin mult ≠ 1 en F3 | **accepted** |
| DEC-021 | 2026-10-31 | **Eliminar** test de personalidad (`G.TestUI` / `PERSONALITY_TEST`) en F3 | Sustituido por selección de vocación | Mantener desactivado | Retirar pantallas `scr-test` / flujo `Flow.afterLogin` hacia vocación; sin copy Pokémon en onboarding | **accepted** |
| DEC-022 | 2026-10-31 | F3: **Rift + Judgment accesibles**; **Gacha eliminado** del producto (UI + carga si aplica) | Propietario quiere grietas/endgame; gacha fuera de alcance | Desactivar rift/judgment en neutral | Rift/Judgment pueden seguir usando dex legendarios **hasta** contenido neutral propio (deuda F3E/F4); gacha no en menú ni boot | **accepted** |
| DEC-023 | 2026-10-31 | F3: **ocultar** entradas menú Pokédex, Mejoras y Gacha | Camino Play sin UI Pokémon | Solo ocultar copy | `menu.js` / `dev.html`; lógica puede quedar en disco | **accepted** |
| DEC-024 | 2026-10-31 | Ampliar `sanitize` en `db.js` para ids banda TS **sin** subir `schemaVersion` | DEC-018 + save F2 | schemaVersion 2 con `selectedVocation` | Validación `owned`/`partner`/`pbind`/`pban` contra criaturas y abilities neutrales | **accepted** |
| DEC-025 | 2026-10-31 | F3: validación **solo `dev.html`**; **no** build `index.html` / `app.min.js` en cierre F3 | Alcance acotado; bundle sigue pre-F3 | Build obligatorio en F3 | Producción desactualizada hasta fase posterior con build autorizado | **accepted** |
| DEC-026 | 2026-10-31 | Clima F3: **cosmético**; multiplicadores de daño **= 1** (sin ventaja elemental) | DEC-004; evitar tabla Pokémon en weather | Desactivar weather | `weather.js` mantiene tinte/partículas; `mult()` efectivo 1 en modo neutral o global F3 | **accepted** |

---

## Plantilla nueva decisión

```markdown
| DEC-XXX | YYYY-MM-DD | … | … | … | … | proposed | accepted | superseded |
```
