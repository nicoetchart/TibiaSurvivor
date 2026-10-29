# Cavern Survivors — architecture audit of PokéSurvivor at `b297089`

**Audit commit:** `b29708900da26b34e70d2dc07ad1659a719f4a78`  
**Date of audit:** 2026-10-29  
**Source product:** PokéSurvivor (MIT-licensed engine + third-party Pokémon content)  
**Target product:** **Cavern Survivors** — original, offline, single-player browser game  

This document is a read-only survey. Runtime code was not modified.

## Scope and constraints

- Preserve the MIT license and the original copyright notice (`Copyright (c) 2026 JPTER78` in `LICENSE`).
- Do not reuse Pokémon names, trademarks, datasets, sprites, logos or lore.
- Do not add Tibia assets, names, maps or proprietary content. This commit contains **no Tibia material**.
- MVP must drop Firebase, authentication, cloud saves, rankings, multiplayer, WebRTC, social systems and TURN.
- Keep generic systems: game loop, camera, input, world chunks, spatial grid, combat, spawning, projectiles, pickups, level-up, local saves.
- Initial target: offline browser game (`file://` or static hosting, no account server).

**License split (do not mix):**

| Layer | Location | License | Cavern Survivors |
|---|---|---|---|
| Engine / UI / music scores | `js/`, `css/`, `dev.html`, `tools/` (except fetch scripts), `js/data/music.js` | MIT, © 2026 JPTER78 | **Keep** with notice |
| Pixelify Sans | `assets/fonts/` | SIL OFL 1.1 | Keep (not Pokémon) |
| SpriteCollab PMD sheets | `assets/pokemon/` (~13 468 files) | CC BY-NC 4.0 | **Remove** |
| Pokédex rows | `js/data/pokedex.js` | PokeAPI-derived | **Remove** |
| Pokémon marks / names | copy, SEO pages, GDD, README | trademarks | **Remove / rewrite** |

---

## 1. Repository tree (KEEP / ADAPT / REMOVE / REVIEW)

**KEEP** = generic engine, usable with little or no content rewrite.  
**ADAPT** = keep the *system*, strip Pokémon/online coupling and re-skin.  
**REMOVE** = Pokémon IP, online infra, or SEO/marketing for PokéSurvivor.  
**REVIEW** = optional for MVP; keep only if the new design wants it.

### Root and legal

| Path | Class | Notes |
|---|---|---|
| `LICENSE` | **KEEP** | MIT text + third-party Pokémon clauses. After asset removal, drop clause 2 (SpriteCollab/PokeAPI) and clause 3 (Pokémon marks); keep MIT header and copyright. |
| `.gitignore` | **KEEP** | |
| `.nojekyll` | **KEEP** | GitHub Pages |
| `favicon.ico` | **ADAPT** | Current mark is PokéSurvivor |
| `CNAME` | **REMOVE** | `pokesurvivor.com` |
| `robots.txt` | **ADAPT** | Generated for Pokémon SEO |
| `sitemap.xml` | **REMOVE** | Pokémon site map |
| `version.json` | **KEEP** | Written by `tools/build.js`; `js/core/updater.js` |
| `manifest.webmanifest` | **ADAPT** | Name, description, Pokémon copy |
| `sw.js` | **ADAPT** | Caches `assets/pokemon/`; drop that path |
| `404.html` | **ADAPT** | Generated SEO stub |
| `index.html` | **ADAPT** | Generated from `dev.html`; do not hand-edit |
| `dev.html` | **ADAPT** | Source HTML: login, friends, ranking, Pokédex UI, legal |
| `README.md` | **ADAPT** | Full Pokémon GDD-in-README |
| `GDD.md` | **ADAPT** | Rewrite for Cavern Survivors |
| `CREDITS.md` | **REMOVE** | SpriteCollab artist table |
| `CLAUDE.md` | **ADAPT** | PokéSurvivor publish/Firebase rules |
| `.github/FUNDING.yml` | **REVIEW** | Ko-fi/GitHub Sponsors; servers go away in offline MVP |

### HTML shell and CSS

| Path | Class | Notes |
|---|---|---|
| `css/style.css` | **ADAPT** | Generic layout; Pokémon copy lives mostly in HTML |
| `css/pages.css` | **REVIEW** | SEO article pages |
| `en/index.html` | **REMOVE** | Generated English game shell + Pokémon SEO |

### `js/core/`

| Path | Class | Notes |
|---|---|---|
| `js/core/util.js` | **ADAPT** | Creates `window.G`. `G.U.TYPE_COLOR` / `TYPE_NAME` are the 18 Pokémon types. Hash, lerp, damp, mmss: keep. |
| `js/core/i18n.js` | **KEEP** | ES/EN overlay; dictionary keys will change with copy |
| `js/core/settings.js` | **KEEP** | `ps.settings` local device prefs |
| `js/core/audio.js` | **KEEP** | Web Audio synth; no Nintendo samples |
| `js/core/input.js` | **KEEP** | WASD / arrows |
| `js/core/touch.js` | **KEEP** | Virtual stick |
| `js/core/camera.js` | **KEEP** | World↔screen, shake, `VIEW_W` |
| `js/core/sprites.js` | **ADAPT** | Generic sheet player, but paths `assets/pokemon/{dex}/…` and PMD 8-dir layout |
| `js/core/updater.js` | **KEEP** | Polls `version.json`; useful for static hosting |
| `js/core/db.js` | **ADAPT** | Local `localStorage` is the keep; Firebase Auth/Firestore/RTDB, Google link, merge-to-cloud: cut |
| `js/core/firebase-config.js` | **REMOVE** | Live `pokesurvivor-free` config |

### `js/data/`

| Path | Class | Notes |
|---|---|---|
| `js/data/music.js` | **KEEP** | Original scores (`village`, biomes) |
| `js/data/pokedex.js` | **REMOVE** | 966 PokeAPI species; replace with an original roster file |
| `js/data/sprites-meta.js` | **REMOVE** | Generated from SpriteCollab `AnimData.xml` |
| `js/data/moves.js` | **ADAPT** | Combat *kinds* (projectile, melee, beam…) are generic; ids/names (`ember`, `vine-whip`, Lanzallamas…) are Pokémon |
| `js/data/types.js` | **ADAPT** | Softened official type chart; replace with original affinities or drop |
| `js/data/starters.js` | **ADAPT** | Personality quiz is reusable; dex numbers and move ids are Pokémon |
| `js/data/enemies.js` | **ADAPT** | Tier/BST casting is generic; hard-coded dex sets (Chansey healers, Arceus-adjacent bosses) are Pokémon |
| `js/data/upgrades.js` | **ADAPT** | Stat shop is generic; “Pokémonedas”, per-dex `pupg` |
| `js/data/items.js` | **ADAPT** | Equip-one-item pattern is generic; Leftovers, Choice Band, etc. are Pokémon |
| `js/data/missions.js` | **REVIEW** | Offline-capable; text is Pokémon |
| `js/data/achievements.js` | **REVIEW** | “Maestro Pokémon”, one achievement per legendary |
| `js/data/funding.js` | **REMOVE** | Domain/servers Ko-fi |
| `js/data/changelog.js` | **ADAPT** | Keep the *format*; wipe Pokémon/online entries |
| `js/data/lang-en.js` | **ADAPT** | Official English move/item/type names |

### `js/world/` and `js/entities/`

| Path | Class | Notes |
|---|---|---|
| `js/world/tiles.js` | **KEEP** | Procedural 16px tiles, biomes (forest / crystal cave / volcano) painted in code — no Pokémon art |
| `js/world/world.js` | **ADAPT** | Chunks, props, liquids; flying/ghost ignore terrain; Arceus arena `clear` |
| `js/entities/vfx.js` | **ADAPT** | Procedural attack sprites keyed by Pokémon type palettes |
| `js/entities/fx.js` | **KEEP** | Particles, damage numbers |
| `js/entities/projectile.js` | **KEEP** | One list for shots/orbs; `G.Coop` not central |
| `js/entities/pickup.js` | **ADAPT** | XP/heal/magnet/bomb/coin keep; tickets/shinies/gacha drop |
| `js/entities/enemy.js` | **ADAPT** | Spatial grid (`CELL = 52`) keep; `G.Coop` remote copies, shiny, dex sprites, flying/ghost |
| `js/entities/player.js` | **ADAPT** | Movement, slots, fuse/bond; constructed from `G.DEX` |

### `js/systems/`

| Path | Class | Notes |
|---|---|---|
| `js/systems/combat.js` | **ADAPT** | Kind implementations keep; `G.Types.mult`, `G.Coop.cast` / ghost casts |
| `js/systems/spawner.js` | **ADAPT** | Ring spawn, cap, elites keep; 1/4096 shiny, `G.Enemies` dex roster, coop scaling |
| `js/systems/levelup.js` | **ADAPT** | Three cards keep; move pool from `G.Moves.poolFor(pl.mon)`; “Baya Zidra” |
| `js/systems/interact.js` | **KEEP** | Altars, springs, locked chests, traps |
| `js/systems/pathing.js` | **KEEP** | BFS distance field around the player |
| `js/systems/hazards.js` | **ADAPT** | Telegraphs keep; Arceus `%hp` / `pure` flags |
| `js/systems/weather.js` | **ADAPT** | Tint/particles keep; multipliers are Pokémon types |
| `js/systems/events.js` | **ADAPT** | Horde / gold hour keep; “lost Pokémon”, Meowth/Gholdengo thieves |
| `js/systems/progress.js` | **ADAPT** | Event bus keep; Arceus/rift/legendary/social stats |
| `js/systems/gacha.js` | **REVIEW** | Region banners, Kanto–Paldea, shiny 1/100. Cut for lean MVP or rewrite as original unlocks |
| `js/systems/rift.js` | **ADAPT** | Portal + arena pattern keep; legendary dex, Distortion World, bonds |
| `js/systems/judgment.js` | **REMOVE** | Minute-30 “Sentencia de Arceus” (dex 493). Optional later as an *original* endgame, not this file as-is |

### `js/net/` (all online)

| Path | Class | Notes |
|---|---|---|
| `js/net/social.js` | **REMOVE** | Friends, nicknames, rooms, presence |
| `js/net/signups.js` | **REMOVE** | MAU gate via TURN worker |
| `js/net/net.js` | **REMOVE** | WebRTC + STUN + Cloudflare TURN + RTDB signalling |
| `js/net/coop.js` | **REMOVE** | Host-authoritative coop simulation |
| `js/net/ranking.js` | **REMOVE** | Firestore leaderboards, anti-cheat timestamps |

### `js/ui/`

| Path | Class | Notes |
|---|---|---|
| `js/ui/ui.js` | **ADAPT** | Screen show/hide, toast, DOM sprite canvases |
| `js/ui/icons.js` | **ADAPT** | Pixel icons keep; Poké Ball rarity, type emblems |
| `js/ui/hud.js` | **ADAPT** | In-run canvas HUD; shiny arrows, Arceus, tickets |
| `js/ui/menu.js` | **ADAPT** | Menu + dex + upgrades; friends/rank/gacha entries |
| `js/ui/run-ui.js` | **ADAPT** | Pause, game over, level cards, item cards, bonds |
| `js/ui/settings-ui.js` | **ADAPT** | Sound/gfx/controls keep; account + Pokémon legal “about” |
| `js/ui/news-ui.js` | **KEEP** | Changelog panel |
| `js/ui/login.js` | **ADAPT** | Local name/password can stay *or* skip to a profile; Google/Firebase out |
| `js/ui/test.js` | **ADAPT** | Personality quiz |
| `js/ui/gacha-ui.js` | **REVIEW** | With `gacha.js` / `slots.js` |
| `js/ui/slots.js` | **REVIEW** | Poké Ball reels |
| `js/ui/goals-ui.js` | **REVIEW** | Missions/achievements/public profile |
| `js/ui/social-ui.js` | **REMOVE** | Also defines `G.NickUI`, `G.FriendsUI`, `G.LobbyUI`, `G.InvitePop`, `G.SocialUI` |
| `js/ui/ranking-ui.js` | **REMOVE** | |
| `js/ui/mod-ui.js` | **REMOVE** | Ranking moderation |
| `js/ui/support-ui.js` | **REMOVE** | Donation screen tied to servers |

### `js/game.js` / `js/main.js`

| Path | Class | Notes |
|---|---|---|
| `js/game.js` | **ADAPT** | Loop, run lifecycle, `G.Flow`; `G.Coop`, `G.Ranking.runStarted`, dex partner, shiny catch |
| `js/main.js` | **ADAPT** | Boot `NEED` list includes Social/Net/Coop/Ranking/Gacha; `MAINTENANCE`; SW register |

### Backend / Firebase / TURN

| Path | Class | Notes |
|---|---|---|
| `firebase.json` | **REMOVE** | |
| `.firebaserc` | **REMOVE** | |
| `firestore.rules` | **REMOVE** | |
| `firestore.indexes.json` | **REMOVE** | |
| `database.rules.json` | **REMOVE** | RTDB rooms |
| `functions/index.js` | **REMOVE** | Auth `beforeCreate` porter |
| `functions/package.json` | **REMOVE** | |
| `functions/package-lock.json` | **REMOVE** | |
| `cloudflare/turn-worker.js` | **REMOVE** | TURN credentials + MAU |
| `cloudflare/wrangler.toml` | **REMOVE** | `turn.pokesurvivor.com` |
| `docs/FIREBASE.md` | **REMOVE** | |
| `docs/TURN.md` | **REMOVE** | |
| `docs/PUBLICAR.md` | **ADAPT** | GitHub Pages + domain |
| `docs/SEO.md` | **REVIEW** | Pokémon SEO pipeline |
| `docs/DOMINIO.md` | **REMOVE** | pokesurvivor.com |

### Tools

| Path | Class | Notes |
|---|---|---|
| `tools/build.js` | **KEEP** | Concat + optional Terser/obfuscator; writes `index.html` + `version.json` |
| `tools/export_data.js` | **ADAPT** | Feeds SEO JSON from `G.DEX` |
| `tools/make_seo_pages.py` | **REVIEW** | Pokémon encyclopedia pages |
| `tools/make_font.py` | **KEEP** | Subset Pixelify |
| `tools/make_icons.py` | **ADAPT** | PWA icons from current mark |
| `tools/fetch_pokedex.py` | **REMOVE** | PokeAPI |
| `tools/fetch_sprites.py` | **REMOVE** | SpriteCollab |
| `tools/fetch_credits.py` | **REMOVE** | |
| `tools/hover_flags.py` | **REMOVE** | PMD hover flags |
| `tools/activar_dominio.sh` | **REMOVE** | |

### Generated SEO / marketing pages (Pokémon)

**REMOVE:** `guia/`, `pokedex/`, `legendarios/`, `shinies/`, `tipos/`, `movimientos/`, `objetos/`, `logros/`, `novedades/`, `apoyar/`, `contacto/`, and `en/guide/`, `en/pokedex/`, `en/legendaries/`, `en/shinies/`, `en/types/`, `en/moves/`, `en/items/`, `en/achievements/`, `en/news/`, `en/support/`.

### Assets

| Path | Class | Notes |
|---|---|---|
| `assets/fonts/` | **KEEP** | OFL |
| `assets/icons/` | **ADAPT** | 8 PNGs; current branding |
| `assets/og-image.jpg` | **ADAPT** | Pokémon marketing still |
| `assets/pokemon/` | **REMOVE** | Entire SpriteCollab dump (~13 468 tracked files) |

### Other

| Path | Class | Notes |
|---|---|---|
| `js/app.min.js` | **ADAPT** | Build output (not in the script list of `dev.html`; produced by `build.js`) |

---

## 2. Dependency map (HTML → scripts → `game.js`)

There are two load paths.

### 2.1 Development (`dev.html`)

`defer` scripts, in this exact order (this *is* the module graph; there are no ES imports):

```
dev.html
  css/style.css
  inline: window.PS_PAGES, boot language, JSON-LD
  canvas#game + ~25 <section> screens
  scripts:
    core/util.js          → window.G, G.U, G.LIFT
    core/i18n.js          → G.I18n, G.T
    data/lang-en.js       → G.I18n.add(…)
    core/settings.js      → G.Settings
    data/music.js         → G.MUSIC, G.BIOME_MUSIC
    data/pokedex.js       → G.DEX, G.DEX_BY, G.getPokemon
    data/sprites-meta.js  → G.SPRITE_META
    core/firebase-config.js → G.FIREBASE_CONFIG
    core/db.js            → G.DB  (lazy-loads Firebase SDK from gstatic)
    core/audio.js         → G.Audio
    core/input.js         → G.Input
    core/touch.js         → G.Touch
    core/sprites.js       → G.Sprites  (reads G.SPRITE_META, assets/pokemon)
    core/camera.js        → G.Camera
    data/moves.js         → G.Moves
    data/types.js         → G.Types
    data/starters.js      → G.STARTERS, G.startMoveOf, G.PERSONALITY_TEST
    data/enemies.js       → G.Enemies
    data/upgrades.js      → G.Upgrades
    data/items.js         → G.Items
    data/missions.js      → G.MissionDefs
    data/achievements.js  → G.AchDefs
    data/funding.js       → G.Funding
    data/changelog.js     → G.CHANGELOG
    world/tiles.js        → G.Tiles
    world/world.js        → G.World
    entities/vfx.js       → G.VFX
    entities/fx.js        → G.FX
    entities/projectile.js→ G.Projectiles
    entities/enemy.js     → G.Enemy, G.EnemyMgr
    entities/pickup.js    → G.Pickups
    entities/player.js    → G.Player
    systems/combat.js     → G.Combat
    systems/spawner.js    → G.Spawner
    systems/levelup.js    → G.LevelUp
    systems/gacha.js      → G.Gacha
    systems/interact.js   → G.Interact
    systems/rift.js       → G.Rift
    systems/judgment.js   → G.Judgment
    systems/events.js     → G.Events
    systems/weather.js    → G.Weather
    systems/pathing.js    → G.Path
    systems/progress.js   → G.Progress
    systems/hazards.js    → G.Hazards
    net/social.js         → G.Social
    net/signups.js        → G.Signups
    net/net.js            → G.Net
    net/coop.js           → G.Coop
    net/ranking.js        → G.Ranking
    ui/icons.js           → G.Icons
    ui/ui.js              → G.UI
    ui/hud.js             → G.HUD
    ui/login.js           → G.LoginUI
    ui/test.js            → G.TestUI
    ui/menu.js            → G.MenuUI
    ui/slots.js           → G.Slots
    ui/gacha-ui.js        → G.GachaUI
    ui/run-ui.js          → G.RunUI
    ui/social-ui.js       → G.SocialUI, LobbyUI, FriendsUI, NickUI, InvitePop
    ui/ranking-ui.js      → G.RankingUI
    ui/mod-ui.js          → G.ModUI
    ui/goals-ui.js        → G.GoalsUI, G.ProfileUI
    ui/settings-ui.js     → G.SettingsUI
    ui/support-ui.js      → G.SupportUI
    ui/news-ui.js         → G.NewsUI
    core/updater.js       → G.Updater
    game.js               → G.Game, G.Flow
    main.js               → boot, PWA
```

Runtime extras (not in the script list):

- `js/core/db.js` injects `https://www.gstatic.com/firebasejs/13.0.0/firebase-*-compat.js`.
- `js/net/net.js` fetches TURN from `https://turn.pokesurvivor.com/` with a Firebase ID token.
- `js/core/updater.js` fetches `version.json`.
- `js/main.js` registers `sw.js` on `http(s)`.
- `core/sprites.js` loads PNGs from `assets/pokemon/{dex}/[s/]{Anim}.png`.

### 2.2 Production (`index.html`)

`tools/build.js` concatenates the `dev.html` script block into `js/app.min.js`, wraps it in an IIFE (`var G = {}` instead of `window.G`), optionally obfuscates, and replaces the block with:

```html
<script defer src="js/app.min.js?v={sha1}"></script>
```

`en/index.html` is the same bundle plus translated SEO chrome (`tools/make_seo_pages.py`).

### 2.3 Runtime call graph (one run)

```
main.js boot
  → G.Flow.boot
       G.UI / LoginUI / TestUI / MenuUI / GachaUI / SocialUI / RankingUI / …
       G.Updater.init
       G.Game.init  → canvas, Touch, rAF loop, Backdrop
       G.DB.ready() → session restore (cloud or local)
  → G.Flow.afterLogin
       if !save.partner → TestUI
       else MenuUI
  → G.Flow.play → G.Game.startRun
       G.DB.save.partner → G.DEX_BY
       G.World.reset(seed), biome 0
       new G.Player(mon, perks, shiny)
       G.Spawner.reset → G.Enemies.rollRun
       G.Ranking.runStarted   ← online
       optional G.Coop.begin  ← online
  loop (state playing):
       Input/Touch → Player.move
       G.World / Path / Interact / Weather / Events / Rift / Judgment
       G.Spawner → EnemyMgr.add
       G.Combat.tick → Projectiles / Types / VFX
       EnemyMgr.update (spatial grid, AI)
       Pickups
       Camera.follow
       draw World, entities, HUD
  death → G.DB.commit + G.Progress.runEnd + Ranking submit
  → G.Flow.goMenu
```

---

## 3. Globals and cross-file coupling

The entire game is one global namespace.

### Window / DOM globals

| Symbol | Defined | Used by |
|---|---|---|
| `window.G` | `js/core/util.js` | Every script. Production build privatizes it. |
| `window.PS_PAGES` | `dev.html` / `index.html` | SEO-aware UI (links to `/guia`, `/pokedex`) |
| `window.confirm` / `alert` | wrapped in `i18n.js` | Settings, login, legal |
| `firebase` | loaded by `db.js` | `db.js`, `ranking.js`, `social.js`, `net.js` |
| `G.T` | alias of `G.I18n.t` | Many UI files |
| `canvas#game` | HTML | `G.Game` |
| Dozens of `#scr-*` ids | HTML | `G.UI.SCREENS` must match |

### `G.*` surface (every module hangs off this)

**Engine:** `U`, `LIFT`, `I18n`, `T`, `Settings`, `Audio`, `Input`, `Touch`, `Sprites`, `Camera`, `DB`, `Updater`  
**Content:** `DEX`, `DEX_BY`, `getPokemon`, `SPRITE_META`, `MUSIC`, `BIOME_MUSIC`, `Moves`, `Types`, `STARTERS`, `STARTER_BY`, `startMoveOf`, `TRAIT_TEXT`, `PERSONALITY_TEST`, `personalityResult`, `Enemies`, `Upgrades`, `Items`, `MissionDefs`, `AchDefs`, `Funding`, `CHANGELOG`, `FIREBASE_CONFIG`  
**World/entities:** `Tiles`, `World`, `VFX`, `FX`, `Projectiles`, `Enemy`, `EnemyMgr`, `Pickups`, `Player`  
**Systems:** `Combat`, `Spawner`, `LevelUp`, `Gacha`, `Interact`, `Rift`, `Judgment`, `Events`, `Weather`, `Path`, `Progress`, `Hazards`  
**Net:** `Social`, `Signups`, `Net`, `Coop`, `Ranking`  
**UI:** `Icons`, `UI`, `HUD`, `LoginUI`, `TestUI`, `MenuUI`, `Slots`, `GachaUI`, `RunUI`, `SocialUI`, `NickUI`, `FriendsUI`, `LobbyUI`, `InvitePop`, `RankingUI`, `ModUI`, `GoalsUI`, `ProfileUI`, `SettingsUI`, `SupportUI`, `NewsUI`  
**App:** `Game`, `Flow`

### Coupling patterns (why a “small cut” is not a small cut)

1. **No imports.** Load order in `dev.html` *is* the dependency graph. Removing a file without removing it from HTML and from `main.js` `NEED` black-screens boot.
2. **`G.Coop.active` / `G.Coop.isHost`** is sprinkled through the simulation: `game.js`, `enemy.js`, `pickup.js`, `combat.js`, `spawner.js`, `rift.js`, `judgment.js`, `events.js`, `weather.js`, `hazards.js`, `interact.js`, `hud.js`, `run-ui.js`, `progress.js`. Safe removal is: delete `js/net/` **and** replace every `G.Coop.*` with `false` / no-ops, then compile-check.
3. **`G.DEX` / `G.DEX_BY` / `.dex`** is the identity of every creature. Player, enemy, gacha, ranking, social lobby, sprites, save (`owned`, `shiny`, `partner`, `pupg`, `pbind`, `pban`), HUD names — all keyed by National Dex number.
4. **`G.Types` + `G.U.TYPE_*` + `G.VFX` palettes + weather** form one 18-type economy.
5. **`G.DB.save` shape** is shared by menu, gacha, upgrades, progress, ranking, coop start. Cloud merge (`db.js` `merge()`) assumes that shape.
6. **`G.Flow`** (`game.js` bottom) is the only screen router. It always inits Social/Ranking/Mod/Support.
7. **localStorage prefix `ps.*`:** `ps.lang`, `ps.settings`, `ps.audio`, `ps.accounts`, `ps.save.*`, `ps.session`, `ps.cloud.*`, `ps.migrated.*`, `ps.rk.c.*`, `ps.recover.no.*`, `ps.cloudok.*`. New product should use a new prefix (`cs.*`) so old Pokémon saves are not loaded.
8. **`tools/build.js`** assumes `window.G = window.G || {};` exists as a unique string in `util.js`. Changing how `G` is created breaks the IIFE wrap.

---

## 4. Direct Pokémon-specific data and assets

### Datasets

| Asset | File | What it is |
|---|---|---|
| 966 species | `js/data/pokedex.js` | Names (Bulbasaur…), types, BST-derived hp/spd/atk, gen, rarity, `leg`, `starter` |
| Sprite geometry | `js/data/sprites-meta.js` | Per-dex PMD animation frames, shiny flags, hover flags |
| PNG sheets | `assets/pokemon/{dex}/{Idle,Walk,Attack,Shoot,Charge,Hurt,Faint}.png` and `s/` | SpriteCollab PMD |
| Starters | `js/data/starters.js` | Regional starters + Psyduck/Slowpoke; official move ids |
| Wild AI tables | `js/data/enemies.js` | Dex sets for healer/shielder/bomber/summoner; BST bands |
| Moves | `js/data/moves.js` | Official ids (`flamethrower`, `hydro-pump`…), Spanish names, evolutions into other official names |
| Type chart | `js/data/types.js` | Gen 6+ chart, softened |
| Items | `js/data/items.js` | Leftovers, Choice Band, Focus Sash, Lucky Egg, Life Orb… |
| Gacha banners | `js/systems/gacha.js` | Kanto…Paldea |
| Judgment | `js/systems/judgment.js` | Arceus dex **493**, “Ruinas del Juicio” |
| Rifts | `js/systems/rift.js` | Legendaries only |
| Events | `js/systems/events.js` | Lost Pokémon; Meowth/Gholdengo thieves |
| Achievements / missions | `js/data/achievements.js`, `missions.js` | “Profesor Pokémon”, 966 owned, legendary list |
| i18n | `js/data/lang-en.js` | Official English move/item/type names |
| Icons | `js/ui/icons.js` | Poké / Super / Ultra / Luxury / Master Ball |
| Slots | `js/ui/slots.js` | Those balls on reels |
| Fetch pipeline | `tools/fetch_pokedex.py`, `fetch_sprites.py`, `fetch_credits.py`, `hover_flags.py` | Regenerates the above from PokeAPI + SpriteCollab |
| Credits | `CREDITS.md` | Artist ↔ dex mapping |
| SEO encyclopedia | `pokedex/`, `legendarios/`, `movimientos/`, `tipos/`, `shinies/`, `en/*` | Names and tables |
| Branding | `dev.html`, `README.md`, `GDD.md`, `manifest.webmanifest`, `og-image.jpg`, `CNAME` | “PokéSurvivor · Mundo Misterioso” |

### Systems that are *mechanically* generic but *currently* Pokémon-flavoured

Keep the mechanic, replace the skin: type chart, shiny 1/4096, gacha, personality quiz, rift arena, bond/fuse, weather, biomes named Bosque Umbrío / Cueva Cristal / Volcán Ceniza (those three names are original enough to keep or rename).

### Must not appear in Cavern Survivors

Pokémon, Pikachu, Arceus, regional names (Kanto…), Pokédex, Poké Ball, Pokémonedas as a *mark*, SpriteCollab sheets, PokeAPI rows, Nintendo/Creatures/GAME FREAK legal text (except a one-time deletion note in git history). Also no Tibia/CipSoft content.

### Original pieces already in the MIT tree (safe to keep)

- Web Audio scores in `js/data/music.js` (comments state they are not Nintendo themes).
- Procedural tiles (`js/world/tiles.js`) and VFX shapes (`js/entities/vfx.js`) — *after* type names are renamed.
- Pixelify font, MIT engine code, procedural world, combat kinds.

---

## 5. Minimum files for a playable offline run

A “playable run” here means: open a local HTML file, pick (or auto-assign) one original character, survive hordes on the chunked map, shoot, collect XP, level up, die, persist coins/stats in `localStorage`. No gacha, no net, no Pokémon art.

### Required (after adaptation)

**Shell**

- `dev.html` (stripped screens) or generated `index.html`
- `css/style.css`
- `LICENSE`

**Core**

- `js/core/util.js`
- `js/core/i18n.js` (optional for ES-only MVP)
- `js/core/settings.js`
- `js/core/audio.js`
- `js/data/music.js`
- `js/core/input.js`
- `js/core/touch.js`
- `js/core/sprites.js` (pointed at **new** art)
- `js/core/camera.js`
- `js/core/db.js` (**local-only** subset)

**New content (replace deleted Pokémon files)**

- Original roster (same *shape* as today’s `G.DEX`: `id`, `name`, `types`, `hp`, `spd`, `atk`)
- Original sprite meta (or a single placeholder sheet)
- Original moves (keep `kind` fields)
- Original type table *or* a trivial identity multiplier
- A tiny starter list
- Enemy tiers that index the new roster
- `js/data/upgrades.js` (rename currency)
- `js/data/items.js` (original names) — can be empty array for ultra-MVP
- Placeholder sprites under e.g. `assets/creatures/` (not `assets/pokemon/`)

**World / entities / systems**

- `js/world/tiles.js`, `js/world/world.js`
- `js/entities/vfx.js`, `fx.js`, `projectile.js`, `enemy.js`, `pickup.js`, `player.js`
- `js/systems/combat.js`, `spawner.js`, `levelup.js`, `interact.js`, `pathing.js`, `hazards.js`
- Optional but already wired in `game.js` `startRun`: `rift.js`, `events.js`, `weather.js`, `progress.js` — stub `reset()` if dropped

**UI + loop**

- `js/ui/icons.js`, `ui.js`, `hud.js`, `menu.js`, `run-ui.js`
- `js/game.js`, `js/main.js` (trimmed `NEED` and `Flow`)

**Not required for first playable**

Gacha, slots, missions, achievements, personality test (hardcode one starter), news, updater, PWA, SEO pages, Firebase, entire `js/net/`, judgment, funding, support, login (use a silent local profile).

### Boot shortcut for MVP

`G.Flow.boot` → skip login → ensure `save.partner` is a valid original id → `MenuUI` → `Game.startRun()`. Guest-in-memory is already implemented in `db.js` (`playAsGuest`).

---

## 6. Safest removal order

Do **not** delete Pokémon sprites first while the game still boots: missing sheets only fail draws; missing `G.Coop` / `G.DEX` crash the loop. Order below keeps `dev.html` bootable after each step.

### Phase A — online, no content change (can still play as guest locally today)

1. Stop deploying; leave Firebase/TURN running until clients are gone (ops, not git).
2. Delete `functions/`, `cloudflare/`, Firebase rule files, `docs/FIREBASE.md`, `docs/TURN.md`.
3. Delete `js/net/*.js` and their `<script>` tags.
4. Delete `js/ui/social-ui.js`, `ranking-ui.js`, `mod-ui.js`, `support-ui.js` and matching HTML sections (`scr-friends`, `scr-lobby`, `scr-rank`, `scr-mod`, `scr-nick`, `invite-pop`, `scr-support`).
5. In remaining JS, replace `G.Coop.active` with `false`, `G.Coop.isHost` with `true` (or delete branches), remove `G.Ranking.*`, `G.Social.*`, `G.Net.*`, `G.Signups.*`, `G.LobbyUI.*`, `G.Funding`, `G.SupportUI`.
6. Strip `js/core/db.js` cloud path: no SDK load, no `FIREBASE_CONFIG`, keep `localStorage` accounts **or** a single anonymous save.
7. Delete `js/core/firebase-config.js`, Google buttons, `scr-recover`, legal privacy paragraphs about Firestore/WebRTC.
8. Trim `G.Flow.boot` / `main.js` `NEED`.
9. Remove `preconnect` to `gstatic.com`.
10. Change `localStorage` keys from `ps.*` to `cs.*` so Pokémon cloud leftovers cannot merge in.

After A the game is still PokéSurvivor, but offline.

### Phase B — Pokémon IP (content swap, engine stays)

11. Delete SEO trees and `CNAME` / Pokémon README/GDD copy.
12. Replace `pokedex.js` / `sprites-meta.js` / `starters.js` / `enemies.js` hard-coded dex sets with original data **before** deleting `assets/pokemon/` (otherwise every entity is invisible/NaN).
13. Rename moves, items, types, weather keys, icons (balls), slots, missions, achievements, lang-en.
14. Delete or rewrite `judgment.js` (Arceus).
15. Delete `tools/fetch_*.py`, `CREDITS.md` SpriteCollab table, `assets/pokemon/`.
16. Point `sprites.js` + `sw.js` at the new art directory.
17. Retheme `dev.html` (title, logo, legal) to **Cavern Survivors**.
18. `LICENSE`: keep MIT + JPTER78; remove Pokémon third-party clauses that no longer apply; keep OFL note for the font.

Never add Tibia (or any other third-party game) assets as a “temporary placeholder”.

---

## 7. Five-phase migration plan

### Phase 0 — Freeze and fork (this audit)

- Treat `b297089` as the MIT engine snapshot.
- Do not publish Pokémon builds from the Cavern Survivors tree.
- Keep git history (license provenance). Do not rewrite history to hide Pokémon files; just stop shipping them.

### Phase 1 — Offline engine (code only)

- Execute §6 Phase A.
- Goal: `dev.html` guest run, local save, no network calls except optional `version.json`.
- Verify: DevTools Network = no Firebase, no TURN, no gstatic.

### Phase 2 — Content decoupling (interfaces stay)

- Introduce a roster module with the **same fields** the engine already reads (`id` instead of `dex` can wait until Phase 3).
- Stub `G.Coop` already gone; stub `G.Judgment` / gacha if still referenced.
- Add 3–8 **placeholder** original creatures (geometric sprites drawn like `tiles.js`, not Pokémon).
- Goal: a run that never prints a Pokémon name.

### Phase 3 — Cavern Survivors identity

- New name in HTML, manifest, PWA icons, music still MIT.
- Original type/element set (or none).
- Original move names and item names.
- Menu: Play / Upgrades / Settings only.
- Optional: keep gacha as “expedition unlocks” with original creatures.
- World: keep cave biome as the signature (`tiles.js` “Cueva Cristal”).
- Local profile: one save slot, no passwords required.

### Phase 4 — Playable MVP slice

- One biome, one starter, ~15 enemy templates, 8–12 moves, level-up cards, death summary, local persistence.
- End run at a time gate **without** Arceus.
- Build with `tools/build.js` if you still want a single file; otherwise ship `dev.html`.
- Manual test: `file://` and a local static server.

### Phase 5 — Polish (post-MVP)

- Original art pipeline replacing PMD 8-direction sheets (or keep code-drawn placeholders).
- Missions/achievements rewritten.
- Changelog in `js/data/changelog.js`.
- Docs: new GDD, short README, MIT + OFL only.
- Decide hosting (GitHub Pages is enough; no Firebase).

---

## 8. Technical risks (with filenames)

| Risk | Why | Files |
|---|---|---|
| Boot fail if a `G.*` is missing | `main.js` `NEED` list; `Flow.boot` inits every UI | `js/main.js`, `js/game.js` |
| Hidden `G.Coop` calls | Host-only spawn/loot; guests skip `Pickups.push` | `js/entities/pickup.js`, `enemy.js`, `js/systems/combat.js`, `spawner.js`, `game.js` |
| `DEX_BY` undefined | `startRun` does `G.DEX_BY[save.partner]` | `js/game.js`, `js/core/db.js`, `js/entities/player.js` |
| Sprite path 404 | Sheets assumed on disk | `js/core/sprites.js`, `assets/pokemon/`, `sw.js` |
| Animator layout lock-in | 8 rows = PMD directions; new art must match or `sprites.js` must change | `js/core/sprites.js`, `js/data/sprites-meta.js` |
| Type chart baked into VFX/weather/missions | Renaming keys without a sweep leaves `undefined` multipliers | `js/core/util.js`, `js/data/types.js`, `js/entities/vfx.js`, `js/systems/weather.js`, `js/data/missions.js` |
| Save schema | `owned`/`shiny`/`pupg` keyed by dex string | `js/core/db.js` |
| Cloud merge of old saves | If Firebase config is left in, players could sync Pokémon collections | `js/core/firebase-config.js`, `js/core/db.js` |
| Ranking anti-cheat still called | `G.Ranking.runStarted` at run start | `js/game.js`, `js/net/ranking.js` |
| Judgment hard-coded | Dex 493, 30:00 | `js/systems/judgment.js`, `js/systems/rift.js`, `js/ui/run-ui.js` |
| i18n dictionary of official names | English overlay re-injects Pokémon terms | `js/data/lang-en.js` |
| Production IIFE | `window.G` string must stay if `build.js` wrap remains | `tools/build.js`, `js/core/util.js` |
| SEO generator | Regenerating pages would republish Pokémon names | `tools/export_data.js`, `tools/make_seo_pages.py` |
| PWA cache of old art | `ps-art-v1` keeps Pokémon PNGs | `sw.js` |
| Trademark in comments | Not shipped to players but easy to copy-paste | almost every `js/**/*.js` header |
| Personality quiz / starters | 29 official starters | `js/data/starters.js`, `js/ui/test.js` |
| Gacha region names | Kanto–Paldea | `js/systems/gacha.js` |
| `PS_PAGES` links | Pokédex/guide URLs | `dev.html`, `js/ui/settings-ui.js` |
| File size | ~13k PNGs dominate the repo; clones stay huge until `git rm` | `assets/pokemon/` |
| Placeholder temptation | Using Tibia sprites would create a new IP problem | (none present; do not add) |

---

## 9. Vanilla JavaScript vs ES modules vs TypeScript

**Recommendation: keep vanilla concatenated JavaScript for the Cavern Survivors MVP. Do not migrate to TypeScript or ES modules until the Pokémon/online cut is done and a run is playable.**

Reasons:

1. The engine is already a **load-order IIFE** designed for `file://` (no `fetch` of JSON; `sprites-meta.js` exists for that reason). ES modules on `file://` are painful; TypeScript always needs a build.
2. `tools/build.js` already produces one `app.min.js`. A bundler+tsc stack would duplicate that for little gain during a content rewrite.
3. The real risk is **data and trademarks**, not types. A TS port would freeze Pokémon-shaped interfaces (`dex: number`) and slow the cut.
4. Cross-file coupling is `G.*`. The low-cost improvement, later, is:
   - **Step A:** keep globals, add JSDoc `@typedef` for `Save`, `MoveDef`, `Creature`.
   - **Step B:** convert to ES modules (`import { Combat } from './systems/combat.js'`) **and** a tiny static server; drop `file://` as a requirement or keep a concatenated fallback.
   - **Step C:** TypeScript only if the roster/combat API has settled.

Stay on ES2020 syntax the obfuscator already targets (`tools/build.js`).

---

## 10. What this audit does not decide

- Exact fantasy (cave fauna, elements, tone) beyond the name **Cavern Survivors**.
- Whether gacha/collection survive as original systems (marked REVIEW).
- Art pipeline (code-drawn vs new pixel sheets).
- Whether local accounts (name+password in `localStorage`) stay or become a single silent save.

Those are design choices for Phase 3. The engine can host any of them once §6 Phase A and the roster swap are done.

---

## Appendix A — `main.js` boot requirements (current)

```
U, I18n, Settings, DB, Audio, Input, Touch, Sprites, Camera, Moves, Enemies,
Upgrades, Items, World, FX, Projectiles, EnemyMgr, Pickups, Player, Combat,
Spawner, LevelUp, Gacha, Rift, Weather, Progress, Hazards, Social, Net, Coop,
Ranking, Icons, UI, HUD, MenuUI, RunUI, SettingsUI, Funding, SupportUI, Game, Flow
```

Anything removed from disk must be removed here and from `G.Flow.boot()`.

## Appendix B — localStorage keys to retire

`ps.lang`, `ps.settings`, `ps.audio`, `ps.accounts`, `ps.save.*`, `ps.session`, `ps.cloud.*`, `ps.migrated.*`, `ps.cloudok.*`, `ps.rk.c.*`, `ps.recover.no.*`.

## Appendix C — confirmation: Tibia

Repository-wide search at `b297089` found **no** `Tibia` / `tibia` / `cipsoft` references. Do not introduce any.
