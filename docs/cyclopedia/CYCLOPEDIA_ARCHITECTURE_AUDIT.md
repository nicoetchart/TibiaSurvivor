# CYC-0 — Cyclopedia Architecture Audit (TibiaSurvivor)

**Fecha:** 2026-11-21  
**Alcance:** Solo lectura. Sin cambios de runtime, build ni commits.  
**Descripción central del producto:** *Un survivor de fantasía pixel art donde cada partida reproduce la tensión y progresión de una hunting session de un MMORPG clásico.*

---

## Resumen ejecutivo

| Veredicto arquitectónico | **READY WITH ADAPTATIONS** |
|--------------------------|-----------------------------|
| Bestiary actual | **Conclusión C — Migración parcial** (ver §5) |
| Bosstiary | Parcial: catálogo y umbrales; sin contrato de boss ni persistencia separada |
| Charms | MVP global (1 slot) implementado; sin Catálogo Cyclopedia ni asignación por criatura |
| Daily boosts | No implementados |
| Save Cyclopedia | Un solo bloque `save.bestiary`; objetivo en `SAVE_SCHEMA.md` no aplicado |

El repositorio **ya ejecutó** gran parte del plan histórico BST-1…BST-10 (`js/data/bestiary.js`, `js/systems/bestiary.js`, UI Cyclopedia en menú). La brecha principal hacia la Cyclopedia pedida no es “crear from scratch”, sino **normalizar contratos data-driven**, **separar boss de criatura normal en runtime**, **unificar persistencia versionada**, **etapas con nombres originales**, **ocurrencia/dificultad calculada**, **Daily Boost** y **herramientas de autoría**.

**Diferencia documentación vs código:** `CLAUDE.md` sigue titulado “PokéSurvivor” y referencia Firebase `pokesurvivor-free`; el producto en disco es **TibiaSurvivor** (`product: 'tibiasurvivor'`, prefijo `ts.*`). `docs/BESTIARY_TECHNICAL_FUNCTIONAL_BASELINE.md` declara Bosstiary independiente “fuera de alcance inicial”, pero desde 2026-11-18 hay `section: 'bosstiary'` en datos y filtros UI (`docs/CYCLOPEDIA_REFERENCE.md`).

---

## 1. Arranque y orden de scripts (fuente: `dev.html`)

`NEED` en `js/main.js` → `G.Flow.boot()` tras fuentes.

Orden relevante Cyclopedia:

| Orden | Archivo | Símbolo |
|------|---------|---------|
| datos | `js/data/creatures.js` | `G.CREATURES`, `G.CREATURE_BY_ID` |
| datos | `js/data/bestiary.js` | `G.Bestiary` (catálogo) |
| datos | `js/data/neutral-roster.js` | `G.NeutralRoster` |
| datos | `js/data/content-api.js` | `G.Content` |
| entidad | `js/entities/enemy.js` | `Enemy`, `G.EnemyMgr` |
| sistema | `js/systems/spawner.js` | `G.Spawner` |
| sistema | `js/systems/combat.js` | `G.Combat` |
| sistema | `js/systems/bestiary.js` | extiende `G.Bestiary` (persistencia) |
| sistema | `js/systems/bestiary-charms.js` | `G.BestiaryCharms` |
| UI | `js/ui/bestiary-ui.js` | `G.BestiaryUI` |
| juego | `js/game.js` | loop, `beginRun` / `endRun` bestiary |

No hay `G.DEX` / `G.DEX_BY` en boot (PSR-10).

---

## 2. Mapa de componentes (KEEP / ADAPT / REPLACE / REVIEW)

| Archivo | Símbolo | Responsabilidad | Consumidores | Cyclopedia | Estado | Riesgo |
|---------|---------|-----------------|--------------|------------|--------|--------|
| `js/data/creatures.js` | `G.CREATURES` | Definición monolítica criatura + `bestiary` embebido | Roster, Content, UI | Fuente catálogo | **ADAPT** | Mezcla combate + cyclopedia |
| `js/data/bestiary.js` | `G.Bestiary.*` | Umbrales, charms catálogo, validación | systems/bestiary, UI, tools | Núcleo datos | **KEEP** | Umbrales aún alineados wiki Tibia |
| `js/data/neutral-roster.js` | `NeutralRoster` | Plantillas spawn desde `CREATURES` | Spawner | spawnWeight → ocurrencia futura | **ADAPT** | Stats derivados, no contrato ataque |
| `js/data/content-api.js` | `G.Content` | Resolución criatura, modo neutral | enemy, player, game | Puente legacyId | **KEEP** | |
| `js/data/tibia-creatures-meta.js` | sprites meta | lookType, assets | TibiaSprites | presentación | **KEEP** | |
| `js/data/mvp-config.js` | `G.MvpConfig` | Duración run, elite, boss timing | Spawner, Roster | encounter design | **KEEP** | |
| `js/entities/enemy.js` | `Enemy` | Runtime: stats, behaviors, boss AI embebida | Combat, Spawner | Boss phases en código (`isOrshabaal`) | **ADAPT** | IDs hardcoded |
| `js/systems/spawner.js` | `G.Spawner` | Oleadas, elite sentinel, boss final | game | spawn types | **ADAPT** | Boss vía timeline, no BossSpawnProfile |
| `js/systems/combat.js` | `G.Combat` | Daño, tipos, `lastHitOwner` | Charms, telemetry | atribución muerte | **KEEP** | |
| `js/systems/bestiary.js` | persistencia | `save.bestiary`, kills, puntos, charms | DB, UI, EnemyMgr | Progreso | **ADAPT** | Mezcla bestiary+bosstiary+shop |
| `js/systems/bestiary-charms.js` | charms runtime | Procs globales | combat, game | Charms | **KEEP** | 1 slot |
| `js/systems/bestiary-telemetry.js` | dev telemetry | Sesión export | game ?dev | tooling | **KEEP** | |
| `js/systems/rift.js` | `G.Rift` | Arena Archfoe (legacy); **OFF** en neutral MVP | hud | Bosstiary futuro | **REVIEW** | Judgment coupling |
| `js/systems/hazards.js` | hazards | Zonas telegraph | enemy boss | BossAttack hazard | **KEEP** | |
| `js/systems/progress.js` | misiones/logros | `Progress.kill` | EnemyMgr | paralelo a bestiary | **REVIEW** | Doble conteo conceptual |
| `js/core/db.js` | `G.DB` | `ts.save.*`, `bestiary` block | Bestiary.init | Save | **ADAPT** | schemaVersion 1, sin `cyclopedia` |
| `js/ui/bestiary-ui.js` | Cyclopedia UI | Tabs catalog/shop/charms | menú | UI | **ADAPT** | Falta tab Bosstiary dedicada, boosts |
| `js/ui/bestiary-run-ui.js` | toasts run | Avances en partida | game | UX | **KEEP** | |
| `js/game.js` | run lifecycle | begin/end bestiary + charms | todo | integración | **KEEP** | |
| `tools/validate-bestiary-*.js` | validators | balance/save | CI local | tooling | **ADAPT** | |
| `docs/CYCLOPEDIA_REFERENCE.md` | referencia | Diseño parcial | autores | doc | **ADAPT** | Supersedido por este paquete |

---

## 3. Flujos actuales (evidencia)

### 3.1 Creación de criatura (datos → runtime)

1. Autor edita fila en `G.CREATURES` (`id`, `legacyId`, stats, `behavior`, `bestiary`).
2. `G.NeutralRoster.defFor(c)` proyecta plantilla spawn: `dex`, `creatureId`, hp/spd/dmg/xp escalados por `TIER_STATS` y behavior (shot cds, minions).
3. `G.Spawner.spawnOne` → `new G.Enemy(def, x, y, scale)`.
4. `Enemy` constructor lee `G.Content.toRuntimeMon` para tipos elementales y sprites (`def.dex` = legacyId).

**Gap:** no existe `CreatureDefinition` separado de `CreatureCombatProfile`; el roster **recomputa** HP/dmg distintos de `creatures.js` para la misma criatura.

### 3.2 Spawn

- Continuo por `spawnRate(t)` + bolsa `available(t)` filtrada por `tier` y `ENEMY_UNLOCK`.
- Elite sentinel: `buildElite()` → `black_knight`, flags `sentinelElite`, timer en `MvpConfig.ELITE`.
- Boss final: `NeutralRoster.BOSSES` → `orshabaal` en `FINAL_BOSS_AT` (~780 s).
- Summons Orshabaal: `noBestiaryCredit: true` en def inline (`enemy.js`).

### 3.3 Combate y muerte

- Daño: `G.Combat` aplica tipos, debilidades desde runtime mon; `lastHitOwner`, `lastHitAid`.
- Muerte: `Enemy.die()` → drops/XP; **no** credita bestiary.
- Crédito: `G.EnemyMgr.update` al detectar `e.dead` llama `G.Bestiary.tryCreditDefeat(e)` **antes** de sacar de lista.
- Atribución: `creatureIdForEnemy` usa `def.bestiaryCreatureId`, `def.creatureId`, o legacy map.
- Progreso: evento `enemy:defeated` → `onEnemyDefeat` incrementa `save.bestiary.entries[id].kills`, emite stages, `grantEntryReward` una vez.

### 3.4 Persistencia

```text
save.bestiary = {
  version: 1,
  entries: { [creatureId]: { kills, rewarded, firstSeenAt, lastKilledAt, runsEncountered } },
  currency: { earned, spent },
  charms: { unlocked, equipped },
  upgrades: {},
  unlocks: []
}
```

- `runsEncountered` **nunca se incrementa** en runtime (solo schema + tests).
- Sin contador “kills en run actual” persistido (solo buffer `runAdvances` en memoria).
- Bosstiary y bestiary comparten `entries` (clave `creatureId`).
- Migración ID: `demon`→`orshabaal`, `minotaur_guard`→`black_knight` en `sanitizeSave`.

### 3.5 Limpieza segunda run

`game.js` `endRun`: `Bestiary.endRun`, `BestiaryCharms.endRun`, `BestiaryRunUI.clear`; spawner/world reset en nuevo run. **PASS** pattern para charms/listeners.

### 3.6 Legado Pokémon

Restos: `entity.dex`, shiny/golden en enemy, `Progress` misiones por `dtype`, campos save `owned`, `partner`, `tickets` en `db.newSave`. Neutral mode ignora gacha/shiny spawn.

### 3.7 Boss identification

| Mecanismo | Uso |
|-----------|-----|
| `c.boss: true` en `CREATURES` | Escala, flying, AI jefe, drops |
| `e.boss` runtime | Charms caps, telemetry |
| `e.sentinelElite` | Centinela Black Knight |
| `bestiary.section: 'bosstiary'` | Catálogo / umbrales |
| `isOrshabaal()` hardcoded | Kit exclusivo |

**Incompatibilidad con requisito:** “No tratar boss como criatura con `isBoss`”; hoy **`boss: true` es el eje runtime**.

---

## 4. Estado Bestiary — Conclusión **C (Migración parcial)**

**Evidencia a favor de conservar núcleo:**

- IDs estables `creatureId` en catálogo.
- Separación datos (`bestiary.js`) vs estado (`systems/bestiary.js`).
- `deriveStage` desde kills (no estado duplicado).
- `validate()` en dev.
- UI con revelación por `reveal` stages.
- Eventos dominio `G.Bestiary.on/emit`.

**Evidencia que exige migración/adaptación:**

| Requisito Cyclopedia | Estado |
|----------------------|--------|
| Etapas 0–3 nombres originales | `unknown/discovered/stage_1/2/completed`; Bosstiary usa Prowess/Expertise/Mastery (Tibia) |
| Ocurrencia, bioma, behaviour en ficha | Parcial en `creatures.js`; UI no uniforme |
| Loot por etapa + very rare reveal | `reveal` lists; drops no modelados en datos |
| Bosstiary separado | Solo `section`; mismo save y mismas filas `CREATURES` con `boss: true` |
| Boss contrato fases/ataques data-driven | Fases en `enemy.js` |
| Charm points vs shop points | Un solo `currency` (puntos bestiario) |
| Daily boosted | Ausente |
| `runsEncountered` / kills run actual | Campo muerto / solo memoria |
| `SAVE_SCHEMA` objetivo `bestiary/bosstiary/charms` top-level | No implementado |

**No es E** (sí hay implementación real). **No es A** (hay acoplamientos estructurales). **D** sería destruir valor BST; recomendado **evolucionar** con facade `G.Cyclopedia` y migración save v2.

---

## 5. Estado criaturas vs bosses

### Criaturas (bestiary)

- ~15 enemigos `role: 'enemy'`, `bestiary.enabled` (ver `tools/validate-bestiary-balance.js`).
- Dificultades TibiaWiki: harmless → challenging + `elite` para very rare.
- Familia `family`, tags, descriptions, tipKeys.

### Bosses (bosstiary)

| id | section | bossCategory | Spawn | Notas |
|----|---------|--------------|-------|-------|
| `black_knight` | bosstiary | bane | Elite sentinel ~1:45–2:15, luego intervalo | `boss: true`, Bosstiary Bane |
| `orshabaal` | bosstiary | nemesis | Final run `FINAL_BOSS_AT` | `finalBoss: true`, AI custom |
| *(archfoe)* | — | — | — | **Sin entrada ni spawn MVP**; Rift desactivado |

Summons (`demon` lesser): bestiary off / `noBestiaryCredit`.

---

## 6. Gaps Cyclopedia

| Dominio | Gap |
|---------|-----|
| Bestiary | Ocurrencia; biomas; ataques tabulados; kills/run UI; nombres etapa; loot tiers |
| Bosstiary | Registro `G.BossRegistry`; categorías sin Archfoe; stats victoria; sin fases data-driven |
| Charms | Solo 3 globales; sin puntos charm separados de shop; sin major/minor futuro |
| Daily creature/boss | Cero código |
| UI | Un panel “Cyclopedia”; mezcla shop; sin paneles boost; Bosstiary no es tab propia |
| Save | `cyclopedia.schemaVersion`; split opcional bosstiary; rotación boost |
| Tooling | Validadores parciales; sin intake workflows en repo |

---

## 7. Arquitectura objetivo (resumen)

Ver contratos detallados en `CREATURE_AND_BOSS_DATA_STANDARD.md`.

Principios:

1. **Registro central** `G.CreatureRegistry` + `G.BossRegistry` (pueden inicializarse desde `creatures.js` en CYC-2).
2. **Composición:** `CreatureDefinition` + `CreatureCombatProfile` (roster) + `CreatureBestiaryProfile`.
3. **Boss:** `BossDefinition` referencia `combatCreatureId` pero añade `BossPhaseDefinition[]`, `BossSpawnProfile`.
4. **Progreso:** `CyclopediaSaveSection` versionado; entradas por `creatureId` / `bossId` (misma clave posible, distinto namespace).
5. **Eventos:** mantener `enemy:defeated`; añadir `boss:defeated` cuando el contrato boss esté aislado.
6. **Facade:** `G.Cyclopedia` lee definiciones + progreso + política de revelación (UI no lee `CREATURES` crudo).

### Etapas de conocimiento (nombres originales propuestos)

**Bestiary**

| Interno | Nombre ES | Nombre EN UI | Revelación (mínimo) |
|---------|-----------|--------------|---------------------|
| `unknown` | Desconocida | Unknown | Silueta |
| `discovered` | Avistada | Sighted | HP, speed, armor proxy, loot común |
| `stage_1` | Estudiada I | Tracked | XP, comportamiento, loot uncommon |
| `stage_2` | Estudiada II | Studied | Resistencias, ubicación/bioma |
| `completed` | Dominada | Mastered | Ataques, loot rare+, charm points |

*Nota:* Hoy hay 4 estados visibles post-primera kill; alinear umbrales con 3 thresholds + discovered = mapeo en CYC-4.

**Bosstiary**

| Interno | Nombre propuesto |
|---------|------------------|
| `stage_1` | **Sigil** (primeras victorias) |
| `stage_2` | **Contender** |
| `completed` | **Overlord** |

Categorías encuentro (mantener IDs `bane|archfoe|nemesis` como **frecuencia de run**, no dificultad).

---

## 8. Charms — Recomendación de modelo

| Opción | Valor en survivor 10–15 min |
|--------|-----------------------------|
| A por criatura | Alto mantenimiento, bajo valor con 15+ criaturas |
| B por familia | Mejor flavor, aún complejo para MVP |
| **C global limitado** | **Ya implementado (1 slot)**; legible en combate |
| D híbrido | Objetivo post-MVP: 2–3 globales + 1 “hunt charm” asignable |

**Recomendación:** **C ahora**, plan **D** en CYC-7+: slots globales + opcional asignación a familia (`family`) no a criatura individual.

Catálogo MVP ampliado documentado en `CREATURE_AND_BOSS_DATA_STANDARD.md` § Charms.

---

## 9. Daily Boost (diseño offline)

- Semilla: `UTC` date `YYYYMMDD` XOR hash cuenta (`save.created` o clave cuenta) → índice determinista en pool elegible.
- Persistir en `cyclopedia.daily`: `{ day, creatureId, bossId, history[] }` para no repetir consecutivos.
- Reloj atrás: si `day < lastDay` ignorar cambio hasta nuevo día natural UTC (no exploitable).
- Modificadores configurables iniciales: `bestiaryProgressMul: 1.25`, `xpMul: 1.1`, `spawnWeightMul: 1.35` (justificación: run corta → boost moderado, visible en 1–2 partidas).
- Elegibilidad: excluir `boss`, `spawnWeight===0`, summons, tutorial, `bestiary.boostExcluded`.

---

## 10. Dificultad y ocurrencia (estrategia híbrida)

Ver pseudocódigo en `CREATURE_AND_BOSS_DATA_STANDARD.md`.

Factores runtime hoy disponibles: `hp`, `dmg`, `spd`, `shotCd`, `behaviors`, resistencias, `spawnWeight`, `tier`, unlock time.

Validador futuro compara `declaredDifficulty` vs `computedScore` ± tolerancia.

---

## 11. Migración save

| Desde | Hacia |
|-------|-------|
| `save.bestiary` v1 | `save.cyclopedia` v1 con `bestiaryProgress`, `bosstiaryProgress` (o mismas entries con `section` en catálogo) |
| IDs renombrados | ya en `sanitizeSave` |
| Puntos currency | mantener; opcional renombrar a `charmPoints` + `huntMarks` (boss) en v2 |

Rollback: conservar copia `bestiary` en migración one-shot si `cyclopedia.schemaVersion` falla.

---

## 12. Impacto contenido existente

| Conservar | Migrar | Reemplazar |
|-----------|--------|------------|
| Kills jugador en entries | UI etapa nombres | Boss AI inline → data phases (gradual) |
| Charms wound/parry/stride | Split metadata bestiary de `creatures.js` | — |
| NeutralRoster pipeline | `runsEncountered` wiring | — |
| Validadores tools | Save schema v2 | — |

---

## 13. Riesgos (por severidad)

1. **Alta:** Refactor boss sin romper Orshabaal (`isOrshabaal` disperso).
2. **Alta:** Doble fuente stats (`creatures.js` vs `defFor`) desincroniza bestiary UI y combate.
3. **Media:** Expandir save sin romper `MAX_SCHEMA_VERSION` en `db.js`.
4. **Media:** Daily boost explotable con cambio de reloj (mitigar con UTC + persistencia).
5. **Baja:** Nombres etapa EN/ES en `lang-en.js`.

---

## 14. Criterios aceptación CYC-0

| Criterio | Estado |
|----------|--------|
| Auditoría criaturas/spawn/combate/muerte | PASS |
| Evaluación Bestiary A–E | PASS |
| Arquitectura objetivo documentada | PASS |
| Plan CYC-1…12 | PASS (ver `CYCLOPEDIA_IMPLEMENTATION_PLAN.md`) |
| Estándar criatura/boss | PASS |
| Intake workflows | PASS |
| Matriz pruebas | PASS |
| Sin cambios runtime | PASS |
| Sin build | PASS |

---

## 15. Recomendación siguiente fase

**CYC-1 — Contratos y registros:** publicar enums/taxonomía en `js/data/cyclopedia-enums.js` (nuevo), facade `G.Cyclopedia` stub, ampliar validadores sin tocar combate. Sin normalizar aún todas las criaturas.

Ver decisiones bloqueantes en `CYCLOPEDIA_DECISIONS_REQUIRED.md`.