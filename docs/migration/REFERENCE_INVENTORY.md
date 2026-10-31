# TibiaSurvivor — Inventario de referencias (línea base Fase 0)

**Fecha:** 2026-10-30  
**Commit HEAD:** `b1837953`  
**Clasificación:** cada ítem usa una o más etiquetas:

| Etiqueta | Significado |
|----------|-------------|
| **ONLINE** | Firebase, RTDB, Firestore, WebRTC, TURN/STUN, workers, social, ranking, coop |
| **POKEMON_DATA** | Datasets PokeAPI / dex / moves / types / starters / enemies keyed by dex |
| **POKEMON_ASSET** | Sprites SpriteCollab, rutas `assets/pokemon/` |
| **POKEMON_COPY** | Textos legales, SEO, README, nombres de marca Pokémon |
| **POKEMON_SCHEMA** | Campos `.dex`, `owned`, `shiny`, `pupg`, gacha por región |
| **POKEMON_UI** | Pokédex, balls, gacha regional, test de personalidad oficial |
| **BRANDING** | PokéSurvivor, dominio, CNAME, manifest |
| **SAVE_SCHEMA** | `ps.*` localStorage, merge cloud, `G.DB.save` |
| **BUILD** | `tools/build.js`, concat, obfuscator, `version.json` |
| **CACHE** | `sw.js`, cachés PWA |
| **LICENSE** | MIT, OFL, CC BY-NC SpriteCollab, cláusulas Pokémon en LICENSE |
| **ORIGINAL_SAFE** | Motor genérico, música MIT, tiles procedurales, Pixelify |
| **REVIEW_REQUIRED** | Gacha, misiones, logros, SEO tools, funding, updater |

---

## 1. Estructura relevante del repositorio

### Raíz

| Path | Etiquetas | Notas |
|------|-----------|-------|
| `dev.html` | BUILD, ONLINE, BRANDING, POKEMON_UI | Fuente HTML; ~67 scripts; preconnect gstatic |
| `index.html` | BUILD, BRANDING | Generado; no editar a mano |
| `js/app.min.js` | BUILD | Bundle producción |
| `version.json` | BUILD | Huella build; `G.Updater` |
| `sw.js` | CACHE, POKEMON_ASSET | Precache incluye Pokémon |
| `manifest.webmanifest` | BRANDING, POKEMON_COPY | |
| `CLAUDE.md` | BRANDING, ONLINE | Reglas Firebase/publish PokéSurvivor |
| `LICENSE` | LICENSE, POKEMON_COPY | MIT + cláusulas terceros |
| `CREDITS.md` | POKEMON_ASSET, LICENSE | SpriteCollab |
| `CNAME` | BRANDING, ONLINE | `pokesurvivor.com` |
| `firebase.json`, `.firebaserc` | ONLINE | |
| `firestore.rules`, `firestore.indexes.json` | ONLINE | |
| `database.rules.json` | ONLINE | RTDB salas |
| `cloudflare/` | ONLINE | TURN worker |
| `functions/` | ONLINE | Firebase functions (MAU/TURN hook) |
| `assets/pokemon/` | POKEMON_ASSET | **13 468** archivos |
| `assets/fonts/` | ORIGINAL_SAFE, LICENSE | Pixelify OFL |
| `assets/icons/` | BRANDING | |
| `tools/build.js` | BUILD, ORIGINAL_SAFE | |
| `tools/export_data.js` | BUILD, POKEMON_DATA | SEO desde `G.DEX` |
| `tools/make_seo_pages.py` | BUILD, POKEMON_COPY | |
| `tools/fetch_pokedex.py` | POKEMON_DATA | PokeAPI |
| `tools/fetch_sprites.py` | POKEMON_ASSET | SpriteCollab |
| `tools/fetch_credits.py`, `hover_flags.py` | POKEMON_ASSET | |
| `pokedex/`, `legendarios/`, `shinies/`, `tipos/`, `movimientos/`, `objetos/`, `logros/`, `guia/`, `en/*` | POKEMON_COPY, BUILD | SEO estático |
| `docs/CAVERN_ARCHITECTURE_AUDIT.md` | REVIEW_REQUIRED | Auditoría read-only |
| `docs/FIREBASE.md`, `docs/TURN.md`, `docs/DOMINIO.md` | ONLINE | |
| `docs/PUBLICAR.md`, `docs/SEO.md` | BUILD, REVIEW_REQUIRED | |

### `js/core/`

| Path | Etiquetas |
|------|-----------|
| `util.js` | ORIGINAL_SAFE, POKEMON_SCHEMA (`TYPE_COLOR`, `TYPE_NAME` — 18 tipos) |
| `i18n.js` | ORIGINAL_SAFE, SAVE_SCHEMA (`ps.lang`) |
| `settings.js` | ORIGINAL_SAFE, SAVE_SCHEMA (`ps.settings`) |
| `audio.js` | ORIGINAL_SAFE, SAVE_SCHEMA (`ps.audio`) |
| `db.js` | ONLINE, SAVE_SCHEMA, POKEMON_SCHEMA |
| `firebase-config.js` | ONLINE |
| `sprites.js` | POKEMON_ASSET, POKEMON_SCHEMA |
| `updater.js` | BUILD, ORIGINAL_SAFE |
| `input.js`, `touch.js`, `camera.js` | ORIGINAL_SAFE |

### `js/data/`

| Path | Etiquetas |
|------|-----------|
| `pokedex.js` | POKEMON_DATA — `G.DEX`, `G.DEX_BY`, `G.getPokemon` |
| `sprites-meta.js` | POKEMON_DATA, POKEMON_ASSET |
| `moves.js` | POKEMON_DATA — `G.Moves` |
| `types.js` | POKEMON_DATA — `G.Types` |
| `starters.js` | POKEMON_DATA, POKEMON_UI |
| `enemies.js` | POKEMON_DATA, POKEMON_SCHEMA |
| `upgrades.js` | POKEMON_COPY (Pokémonedas), ORIGINAL_SAFE (sistema) |
| `items.js` | POKEMON_DATA |
| `missions.js`, `achievements.js` | POKEMON_COPY, REVIEW_REQUIRED |
| `gacha.js` (systems) | POKEMON_UI, POKEMON_COPY (regiones) |
| `funding.js` | ONLINE, REVIEW_REQUIRED |
| `changelog.js` | BRANDING, POKEMON_COPY |
| `lang-en.js` | POKEMON_COPY |
| `music.js` | ORIGINAL_SAFE |

### `js/net/` (todos **ONLINE**)

| Path | Símbolos |
|------|----------|
| `social.js` | `G.Social` — Firestore + RTDB |
| `signups.js` | `G.Signups` — `turn.pokesurvivor.com/mau` |
| `net.js` | `G.Net` — WebRTC, STUN, TURN |
| `coop.js` | `G.Coop` |
| `ranking.js` | `G.Ranking` — Firestore |

### `js/ui/` (online)

| Path | Etiquetas |
|------|-----------|
| `social-ui.js` | ONLINE — `G.SocialUI`, `G.LobbyUI`, `G.FriendsUI`, `G.NickUI`, `G.InvitePop` |
| `ranking-ui.js` | ONLINE — `G.RankingUI` |
| `mod-ui.js` | ONLINE — `G.ModUI` |
| `support-ui.js` | ONLINE, BRANDING — `G.SupportUI` |

### Motor de juego (**ORIGINAL_SAFE** + acoplamiento Pokémon/online)

| Path | Acoplamiento extra |
|------|-------------------|
| `game.js` | ONLINE (`G.Ranking`, `G.Coop`, `G.Social`), POKEMON_SCHEMA |
| `entities/player.js`, `enemy.js` | POKEMON_DATA, POKEMON_ASSET, ONLINE (`G.Coop`) |
| `entities/pickup.js` | ONLINE, POKEMON_UI (shinies/tickets) |
| `systems/combat.js`, `spawner.js`, `levelup.js` | POKEMON_DATA, ONLINE |
| `systems/judgment.js` | POKEMON_DATA (Arceus 493) |
| `systems/rift.js`, `events.js`, `gacha.js` | POKEMON_DATA, ONLINE parcial |
| `systems/weather.js`, `hazards.js`, `vfx.js` | POKEMON_SCHEMA (tipos) |
| `ui/menu.js`, `hud.js`, `run-ui.js`, `goals-ui.js`, `gacha-ui.js`, `slots.js`, `test.js` | POKEMON_UI / ONLINE según pantalla |

---

## 2. Flujo de arranque (línea base)

```
DOMContentLoaded / immediate
  → main.js boot()
       maintenance()?  (MAINTENANCE=false; ?dev bypass)
       broken()?       NEED[] vs G.*
       G.I18n.startDom()
       fonts.load('Pixelify') → G.Flow.boot()

G.Flow.boot()  [js/game.js]
  → init UI: LoginUI, TestUI, MenuUI, GachaUI, SocialUI, RankingUI, ModUI,
             GoalsUI, ProfileUI, SettingsUI, SupportUI, NewsUI, Updater
  → G.Game.init()
  → G.DB.ready() → tapToStart → afterLogin | toLogin

G.Flow.afterLogin
  → sin save.partner → TestUI (personalidad)
  → else MenuUI

G.Flow.play → G.Game.startRun
  → G.Ranking.runStarted (online)
  → optional G.Coop.begin (online)
```

**Carga dev:** 67 scripts listados en `dev.html` (`<!-- scripts:begin -->` … `<!-- scripts:end -->`), orden = grafo de dependencias (sin ES modules).

**Producción:** `tools/build.js` concatena el mismo bloque → `js/app.min.js` (IIFE, `var G = {}`).

---

## 3. `main.js` — lista NEED (actual)

```text
U, I18n, Settings, DB, Audio, Input, Touch, Sprites, Camera, Moves, Enemies,
Upgrades, Items, World, FX, Projectiles, EnemyMgr, Pickups, Player, Combat,
Spawner, LevelUp, Gacha, Rift, Weather, Progress, Hazards,
Social, Net, Coop, Ranking,
Icons, UI, HUD, MenuUI, RunUI, SettingsUI, Funding, SupportUI, Game, Flow
```

Cualquier módulo retirado del disco debe salir de `NEED` y de `G.Flow.boot()` el mismo paso.

---

## 4. Búsqueda de símbolos (conteo archivos `.js`, Fase 0)

| Patrón | Archivos `.js` afectados (aprox.) | Notas |
|--------|-----------------------------------|-------|
| `G.Coop` | 14 fuera de net + net | Ver audit §3 |
| `G.Social` / `G.Net` / `G.Signups` / `G.Ranking` / `G.Funding` / `G.SupportUI` | 31 archivos listados en grep | Incluye UI + game + db |
| `G.DEX` / `G.DEX_BY` | 27+ | Identidad criatura |
| `.dex` (propiedad) | 25+ | Save, sprites, ranking |
| `G.Types` | types.js + combat, weather, vfx, etc. | |
| `TYPE_COLOR` / `TYPE_NAME` | util.js + ~15 consumidores | 18 tipos Pokémon |
| `firebase` / gstatic SDK | db.js, net/*, ranking.js, social.js | Lazy load en `db.js` |
| `turn.pokesurvivor.com` | net.js, signups.js, functions | |
| `WebRTC` / `RTCPeerConnection` | net.js | |
| `assets/pokemon` | sprites.js (+ SEO/LICENSE/docs) | 13k PNG en disco |
| `ps.` | db.js, settings, i18n, audio, ranking cache, etc. | Ver §5 |
| Texto Pokémon / regiones / PokéSurvivor | 80+ paths (HTML+JS+md) | SEO masivo |

**Tibia / CipSoft:** 0 referencias en repo (confirmado en audit); no introducir.

---

## 5. Esquema de guardado (`G.DB`, `ps.*`)

**localStorage (documentado en `db.js`):**

| Clave | Etiqueta | Uso |
|-------|----------|-----|
| `ps.accounts` | SAVE_SCHEMA | Cuentas locales |
| `ps.save.<key>` | SAVE_SCHEMA, POKEMON_SCHEMA | Partida v3 |
| `ps.session` | SAVE_SCHEMA | Última sesión |
| `ps.cloud.*` | ONLINE, SAVE_SCHEMA | Copia cloud local |
| `ps.migrated.*` | ONLINE | |
| `ps.cloudok.*` | ONLINE | Throttle sync |
| `ps.rk.c.*` | ONLINE | Cache ranking (prescindible) |
| `ps.lang`, `ps.settings`, `ps.audio` | SAVE_SCHEMA | Prefs |

**Campos save relevantes (Pokémon):** `owned`, `shiny`, `partner`, `partnerShiny`, `starter`, `pupg`, `tickets`, `pity`, `legends`, `profile.favs` (dex), stats de grupo, etc.

**Modo cloud:** Firebase Auth + Firestore `saves/{uid}` + RTDB señales; merge preserva colecciones dex.

---

## 6. Dependencias online (inventario)

| Componente | Ubicación | Red |
|------------|-----------|-----|
| Firebase SDK 13 compat | `db.js` → gstatic | app, auth, firestore, database |
| Config proyecto | `firebase-config.js` | `pokesurvivor-free` |
| Ranking | `ranking.js` | Firestore |
| Social / salas | `social.js` | Firestore + RTDB |
| Señalización coop | `net.js` | RTDB + WebRTC |
| TURN credentials | `net.js` | HTTPS `turn.pokesurvivor.com/` + token Firebase |
| MAU signup gate | `signups.js` | Worker TURN |
| Cloud Functions | `functions/index.js` | Hook MAU |
| Updater | `updater.js` | `version.json` (estático, **mantener**) |
| Preconnect | `dev.html`, `index.html` | `www.gstatic.com` |

---

## 7. Dependencias Pokémon (inventario)

| Tipo | Ubicación |
|------|-----------|
| 966 especies | `js/data/pokedex.js` |
| Meta animación PMD | `js/data/sprites-meta.js` |
| Sprites | `assets/pokemon/{dex}/…` |
| Movimientos / tipos / items | `moves.js`, `types.js`, `items.js` |
| Starters + test | `starters.js`, `ui/test.js` |
| Enemigos por dex | `enemies.js`, `spawner.js` |
| Gacha Kanto–Paldea | `systems/gacha.js`, `ui/gacha-ui.js`, `ui/slots.js` |
| Arceus / Judgment | `systems/judgment.js` |
| Legendarios rift | `systems/rift.js` |
| Iconos balls | `ui/icons.js` |
| i18n EN oficial | `lang-en.js` |
| Pipeline regen | `tools/fetch_*.py` |
| SEO | carpetas `pokedex/`, `en/pokedex/`, etc. |

---

## 8. Build y pruebas disponibles

| Herramienta | Comando | Etiqueta |
|-------------|---------|----------|
| Build producción | `node tools/build.js` | BUILD |
| Build sin SEO | `node tools/build.js --sin-seo` | BUILD |
| Build expuesto (tests) | `node tools/build.js --expose` | BUILD, REVIEW_REQUIRED |
| Export SEO data | `node tools/export_data.js` | POKEMON_DATA |
| SEO pages | `python tools/make_seo_pages.py` | POKEMON_COPY |
| Unit tests automatizados | **No hay** `package.json` en raíz | — |
| Functions npm | `functions/package.json` | ONLINE |

**Validación manual recomendada:** `dev.html` con servidor estático local; DevTools Network + consola; partida invitado y cuenta local.

---

## 9. Línea base de funcionamiento (Fase 0)

- **Código runtime:** sin cambios respecto a `origin/main` @ `b1837953`.
- **Comportamiento esperado:** idéntico a PokéSurvivor pre-migración (online + contenido Pokémon operativos si hay red y Firebase configurado).
- **Verificación en esta iteración:** inspección estática únicamente; smoke test manual pendiente antes de Fase 1 (ver `TEST_CHECKLIST.md`).

---

## 10. Archivos con `G.Coop` (referencia Fase 1)

`js/game.js`, `js/entities/enemy.js`, `js/entities/pickup.js`, `js/systems/combat.js`, `js/systems/spawner.js`, `js/systems/rift.js`, `js/systems/judgment.js`, `js/systems/events.js`, `js/systems/weather.js`, `js/systems/hazards.js`, `js/systems/interact.js`, `js/ui/hud.js`, `js/world/world.js`, `js/ui/social-ui.js`, `js/net/coop.js`
