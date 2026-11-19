# TibiaSurvivor — Glosario canónico (PSR-1)

**Estado:** vigente desde PSR-1 (2026-11-18)  
**Autoridad:** este documento + `docs/migration/DECISIONS.md` (DEC-027–038)  
**Alcance:** nomenclatura de producto, datos, código y UI. No sustituye fichas de diseño de biomas.

---

## 1. Reglas de nomenclatura

1. **Prohibido** en código nuevo, datos, UI y SEO: Pokémon, Pokédex, Poké Ball, gacha, pull, pity, shiny, generación/región Pokémon, números de dex 1–966, `G.getPokemon`, rutas `assets/pokemon/`.
2. **Campo de guardado** de moneda: siempre `coins` (JSON). **Copy jugador:** «gold coin» / «moneda de oro» (DEC-028).
3. **Identidad de criatura:** `creatureId` (string estable, p. ej. `rotworm`). **Clave numérica legacy:** `legacyId` en banda **99001–99099** (DEC-018). La propiedad `.dex` en entidades está **deprecada** (retirar PSR-2).
4. **Habilidades de combate:** `abilityId` / `spellId` (p. ej. `flame_strike`). Implementación en `G.Abilities`; no añadir movimientos con ids del catálogo Pokémon.
5. **Tipos de daño:** solo ids en `G.DamageTypes.ALL`: `physical`, `fire`, `ice`, `energy`, `earth`, `death`, `holy` (DEC-004). No usar `G.Types` en código nuevo.
6. **Metaprogresión MVP:** bestiario + bosstiary + charms + upgrades de vocación + misiones + logros (DEC-038). Sin colección por especie, sin `pupg` por dex.
7. **Modo runtime objetivo:** neutral único tras PSR-2 (DEC-037). Hasta entonces: no ampliar el camino `legacy`.
8. **Adaptadores:** `content-bridge.js` y `G.DEX_BY` son **temporales**; no crear adaptadores nuevos.

---

## 2. Términos de producto

| Término canónico | Uso | No usar |
|------------------|-----|---------|
| **TibiaSurvivor** | Marca, título, PWA | PokéSurvivor |
| **Hunt / hunting session** | Una run (~15 min) | «Partida Pokémon» |
| **Master Sorcerer** | Vocación MVP (`master_sorcerer`) | Partner / starter Pokémon |
| **Bestiary** | Cyclopedia: criaturas ordinarias (`bestiary.section: 'bestiary'`) | Pokédex, Collection, dex |
| **Bosstiary** | Cyclopedia: jefes (`section: 'bosstiary'`, `bossCategory`) | Legendarios Pokémon, dex leg |
| **Gold coin** | Moneda meta (`save.coins`) | Pokémonedas, PokéCoins |
| **Spell / ability** | Ataque o pasiva en run | Move (salvo comentarios históricos) |
| **Rift** (futuro PSR-3) | Encuentro opcional para **bosses** propios | Grieta con legendarios dex, Arceus |
| **Market** (post-MVP) | Compra/venta de ítems coleccionables | Gacha, lootbox, pulls |

---

## 3. Identificadores estables

| Concepto | Contrato | Ejemplo |
|----------|----------|---------|
| Producto save | `product: "tibiasurvivor"` | — |
| Schema | `schemaVersion` (ver `SAVE_SCHEMA.md`) | `1` hoy |
| Criatura | `creatureId` | `cat`, `rotworm` |
| Legacy numérico (bridge) | `99001 ≤ legacyId ≤ 99099` | `99001` = jugador MS |
| Vocación | `vocationId` | `master_sorcerer` |
| Habilidad | id en `G.Abilities.BY_ID` | `energy_strike` |
| Bioma run MVP | `G.MvpConfig.RUN_BIOME` | índice tiles |
| Prefijo storage | `ts.*` | `ts.save.<account>` |

---

## 4. Pantallas y flujos (objetivo)

| Flujo | Pantalla | Estado PSR-1 |
|-------|----------|----------------|
| Onboarding | `scr-vocation` | Canónico |
| Menú | `scr-menu` | Bestiary + Outfit; sin dex/gacha |
| Run | canvas + HUD | Canónico |
| Meta | `scr-bestiary` (vía BestiaryUI) | Canónico |
| Obsoleto | `scr-test`, `scr-starters`, `scr-dex`, `scr-gacha` | Eliminar PSR-4/5 |

---

## 5. Persistencia (resumen)

Ver `docs/migration/SAVE_SCHEMA.md` y `docs/migration/PSR-1_CONTRACTS.md`.

- **Conservar (MVP+):** `coins`, `ach`, `missions`, datos bestiario/bosstiary (según `systems/bestiary*.js`), upgrades ligados a vocación.
- **Retirar (plan):** `owned`, `shiny`, `partnerShiny`, `tickets`, `pity`, `pupg`, `pbind`, `pban`, `legends`, stats de gacha/judgment/shiny.
- **Purge:** claves `ps.*` en localStorage (DEC-036, PSR-7).

---

## 6. Archivos fuente de verdad

| Dominio | Archivo |
|---------|---------|
| Criaturas | `js/data/creatures.js` |
| Bestiario datos | `js/data/bestiary.js` |
| Vocaciones | `js/data/vocations.js` |
| Habilidades | `js/data/abilities.js`, `master-sorcerer-*.js` |
| Daño elemental | `js/data/damage-types.js` |
| Run MVP | `js/data/mvp-config.js`, `neutral-roster.js` |
| API contenido | `js/data/content-api.js` |
| Guardado | `js/core/db.js` |

---

## 7. Cyclopedia (Bestiary / Bosstiary)

Contrato completo: **`docs/CYCLOPEDIA_REFERENCE.md`** (alineado a [Cyclopedia wiki](https://tibia.fandom.com/wiki/Cyclopedia)).

## 8. Referencia cruzada PSR

| Fase | Enfoque |
|------|---------|
| PSR-1 | Glosario + contratos (este doc) |
| PSR-2 | Criaturas; eliminar `G.DEX_BY` |
| PSR-3 | Combate, rift bosses, sin shiny |
| PSR-4 | Gacha fuera, goals, gold coin UI |
| PSR-5 | UI e i18n |
| PSR-6+ | Assets, dominio, certificación |