/* ============ changelog.js — novedades TibiaSurvivor ============
 *   new  · chg  · fix  — cada línea [es, en]
 */
G.CHANGELOG = [
  { d: '2026-11-10', title: ['Plains of Havoc', 'Plains of Havoc'], new: [
    ['Bioma procedural Plains of Havoc (superficie Tibia): hierba, tierra, piedra, agua azul y props árbol/roca sin cristales.',
     'Procedural Plains of Havoc biome (Tibia surface): grass, dirt, stone, classic blue water, tree/rock props; no crystals.'],
    ['Props Tibia en Plains of Havoc: árboles verdes/otoño y arbustos; peñascos grises con brillo (variantes por casilla).',
     'Tibia props on Plains of Havoc: green/autumn trees and bushes; gray boulders with highlights (per-tile variants).'],
  ], fix: [
    ['Plains of Havoc: 6 siluetas de árbol y 4 de roca (variante fija al generar; antes el hash en [0,1) dejaba casi todo igual).',
     'Plains of Havoc: 6 tree silhouettes and 4 rock shapes (variant set at spawn; hash in [0,1) used to look like one type).'],
    ['Rocas Plains of Havoc: sprites reales del cliente (200423, 200428, 200438, 200431) en lugar del dibujo procedural.',
     'Plains of Havoc rocks: real client sprites (200423, 200428, 200438, 200431) instead of procedural drawing.'],
    ['Rocas Tibia en mapa: 75 % del tamaño clásico, colisión acorde (r≈9) y anclaje al suelo.',
     'Tibia map rocks: 75% of classic size, matching collision (r≈9), grounded foot anchor.'],
    ['Árboles Plains of Havoc: sprites del cliente (202216–202225), 75 % y foot 14 como las rocas.',
     'Plains of Havoc trees: client sprites (202216–202225), 75% scale and foot 14 like rocks.'],
    ['Árboles Tibia: solo PNG (sin procedural); caché de props se invalida al cargar sprites.',
     'Tibia trees: PNG only (no procedural fallback); prop cache clears when sprites load.'],
    ['Hierba Plains of Havoc: sprites 204365–204368 y 204371, 75 %, foot 14; cortable con mismos drops.',
     'Plains of Havoc grass: sprites 204365–204368 and 204371, 75% scale, foot 14; cuttable with same drops.'],
    ['Hierba: sin animación de mecido; cinco siluetas retiradas del conjunto.',
     'Grass: no wind sway animation; five silhouettes removed from the set.'],
  ] },
  { d: '2026-11-09', title: ['Criaturas oficiales de Tibia', 'Official Tibia creatures'], chg: [
    ['Mapa procedural por defecto (`mapTiles.floors/walls` en tuning); criaturas y personajes siguen con PNG Tibia. `?tiles=tibia` prueba suelo.',
     'Procedural map by default (mapTiles.floors/walls in tuning); creatures and player keep Tibia PNGs. ?tiles=tibia tests floors.'],
  ], fix: [
    ['Vista de aspecto: sprite más grande y centrado en la silueta (pivote UI, sin scaleMul de juego).',
     'Outfit preview: larger sprite centered on silhouette (UI pivot, without in-game scaleMul).'],
    ['Vista de aspecto: centrado midiendo la silueta opaca y la dirección de giro.',
     'Outfit preview: centering uses opaque silhouette bounds and facing direction.'],
    ['Vista de aspecto y miniaturas abren mirando al sur (dir 0 del motor).',
     'Outfit preview and thumbnails open facing south (engine dir 0).'],
    ['Miniaturas de la galería usan los colores y addons que llevas seleccionados.',
     'Gallery thumbnails use your current colour and addon choices.'],
    ['Al cambiar de outfit se conservan los addons activos (antes se reiniciaban a 0).',
     'Switching outfit keeps active addons (they used to reset to 0).'],
    ['Menú principal: el outfit Tibia rellena el escenario (misma escala/centro que en Aspecto).',
     'Main menu: Tibia outfit fills the stage (same scale/center as Outfit screen).'],
    ['Sprites Tibia: ancla al centro del tile (no de la tira) y direcciones N/S alineadas con el cliente.',
     'Tibia sprites: anchor at tile center (not full strip) and N/S directions match the client.'],
    ['Walk en criaturas Tibia: el Animator ya no fuerza Idle sin SPRITE_META; pies afinados en tiles 64px.',
     'Tibia creature Walk: Animator no longer forces Idle without SPRITE_META; 64px foot anchor tuned.'],
    ['Sprites Tibia: tiras idle/walk separadas, escala drawMul, anclas y recorte seguro (sin huecos al parar/atacar).',
     'Tibia sprites: separate idle/walk strips, drawMul scale, anchors and safe clip (no gaps on stop/attack).'],
    ['Ajuste global de sprites Tibia (`tibia-sprite-tuning.js`): escala 32/64, offset pies/sombra y atajos Ctrl en ?dev.',
     'Global Tibia sprite tuning (tibia-sprite-tuning.js): 32/64 scale, foot/shadow offset and Ctrl shortcuts in ?dev.'],
    ['Atajos ?dev: Ctrl+Shift/Alt con [ ] y ; \' afinan escala y footDy por tile 32 o 64 sin tocar cada lookType.',
     'Dev shortcuts: Ctrl+Shift/Alt with [ ] and ; \' tune scale and footDy per 32 or 64 tile without per lookType edits.'],
    ['Sprites Tibia: anclas desde bbox del PNG al importar; tiers visualTiers/big igualan criaturas 32px y 64px (minotaur vs troll).',
     'Tibia sprites: bbox PNG anchors on import; visualTiers/big normalizes 32px and 64px creatures (minotaur vs troll).'],
    ['Sprites Tibia modo natural (como Pokémon): `naturalSize` por defecto, meta w/h/ax/ay/s por criatura; tiers opcionales si `naturalSize: false`.',
     'Tibia natural sprite mode (Pokémon-like): naturalSize default, per-creature w/h/ax/ay/s meta; optional tiers when naturalSize: false.']
  ], new: [
    ['Mapa Tibia (fase 2): G.TibiaTiles pinta suelo/pared con PNG del cliente si existen; si no, terreno procedural.',
     'Tibia map (phase 2): G.TibiaTiles draws floor/wall from client PNGs when present; else procedural terrain.'],
    ['Importador `tools/import_tibia_tiles.mjs` para copiar clientIds del mapa desde grouped.',
     'Importer tools/import_tibia_tiles.mjs copies map clientIds from grouped export.'],
    ['Tiles de mapa: PNG por nombre grouped (198xxx) + tiras; `refresh_tibia_tiles_meta.mjs`.',
     'Map tiles: PNGs by grouped name (198xxx) and strips; refresh_tibia_tiles_meta.mjs.'],
    ['Paredes del mapa: autotile con sprites 198412–198448 según vecinos N/E/S/O.',
     'Map walls: autotile from sprites 198412–198448 by N/E/S/W neighbours.'],
    ['Aspecto Mage (lookType 132): menú principal · Outfit con paleta 7×19, zonas Head/Primary/Secondary/Detail y addons como el cliente Tibia.',
     'Mage look (132): main menu Outfit screen with 7×19 palette, body zones and addons like the Tibia client.'],
    ['Paleta de outfit: fórmula HSI del cliente (pastel, saturados y grises); tinte multiply plantilla×color con sombras.',
     'Outfit palette: client HSI formula (pastels, saturated, grays); multiply template×color tint preserving shading.'],
    ['Addons de outfit: base + capas addon 1/2 apiladas (pattern_y del cliente), no un sprite alternativo.',
     'Outfit addons: base plus stacked addon layers (client pattern_y), not a swapped sprite.'],
    ['Segundo aspecto: Citizen (128) importado; selector ◀ ▶ entre Citizen y Mage en menú Aspecto.',
     'Second outfit: Citizen (128) import; ◀ ▶ selector between Citizen and Mage in Outfit screen.'],
    ['Pantalla Personalizar personaje: rejilla de outfits a la derecha, bloqueados visibles (misión/tienda), filtro y paleta abajo.',
     'Customise character screen: outfit grid on the right, locked outfits visible (mission/shop), filter and palette below.'],
    ['Outfit Master Sorcerer (138): import a `assets/tibia/outfits/`, meta `out_138` y jugador 99001 con G.TibiaSprites.',
     'Master Sorcerer outfit (138): import to assets/tibia/outfits/, meta out_138, player 99001 via G.TibiaSprites.'],
    ['Sprites Tibia activos por defecto en TibiaSurvivor (`data-ui=tibia`); modo neutral por defecto. `?sprites=geo` vuelve a formas geométricas.',
     'Tibia sprites on by default in TibiaSurvivor (data-ui=tibia); neutral mode default. ?sprites=geo restores geo shapes.'],
    ['Línea base de sprites Tibia: mapa lookType/outfit, `G.TibiaSprites` y export offline; geo como fallback si falta PNG.',
     'Tibia sprite baseline: lookType/outfit map, G.TibiaSprites and offline export; geo fallback when PNG missing.'],
    ['Importador `tools/import_tibia_grouped.mjs`: copia strips agrupados a `assets/tibia/creatures/` y metadatos de animación.',
     'Importer tools/import_tibia_grouped.mjs: copies grouped strips to assets/tibia/creatures/ with animation meta.'],
    ['Las 15 plantillas enemigas del MVP son criaturas de Tibia (Cat, Demon, etc.; nombres siempre en inglés) con dificultad de bestiario, descripciones y consejos alineados a TibiaWiki.',
     'MVP’s 15 enemy templates are Tibia creatures (Cat, Demon, etc.) with bestiary difficulty, descriptions and tips aligned to TibiaWiki.'],
    ['Debilidades, fortalezas e inmunidades elementales por criatura; el daño en combate y el detalle del bestiario las muestran.',
     'Per-creature elemental weaknesses, resistances and immunities; combat damage and bestiary detail reflect them.'],
    ['Élite Very Rare: Minotaur Guard. Jefe Nemesis: Demon.',
     'Very Rare elite: Minotaur Guard. Nemesis boss: Demon.']
  ], chg: [
    ['Pantalla de aspecto más compacta: preview ~192px, miniaturas 64px y galería más estrecha.',
     'Outfit screen more compact: ~192px preview, 64px thumbs and narrower gallery.'],
    ['Comportamientos del roster Tibia revisados (p. ej. Orc Shaman curador, Minotaur Guard escudero, Ghoul tanque).',
     'Tibia roster behaviors revised (e.g. Orc Shaman healer, Minotaur Guard shielder, Ghoul tank).'],
    ['Umbrales de muertes y charm points por dificultad alineados con TibiaWiki (Harmless → Challenging; élite Very Rare; jefe Nemesis).',
     'Kill thresholds and charm points per difficulty aligned with TibiaWiki (Harmless → Challenging; elite Very Rare; boss Nemesis).'],
    ['Interfaz estilo cliente RPG (piedra/cueva): menú, bestiario, vocación, ajustes y HUD en partida; tema azul PMD sustituido en modo TibiaSurvivor.',
     'RPG-client UI (stone/cave): menu, bestiary, vocation, settings and in-run HUD; blue PMD theme replaced in TibiaSurvivor mode.'],
    ['HUD y DOM comparten tokens CSS; moneda de la barra superior en oro apilado; títulos en serif; pantallas de nivel, pausa y fin de run alineadas al tema.',
     'HUD and DOM share CSS tokens; top bar gold-stack coin icon; serif panel titles; level-up, pause and run-end screens match the theme.'],
    ['Toda la interfaz usa la misma serif (Georgia); texto en canvas vía tibia-theme; monedas en suelo con icono goldcoin; landings SEO con pages.css alineado.',
     'Full UI uses the same serif (Georgia); canvas text via tibia-theme; floor coins use goldcoin icon; SEO landings use aligned pages.css.'],
    ['Interfaz con Crimson Pro (OFL) empaquetada en lugar de Georgia; precarga y canvas alineados.',
     'UI uses bundled Crimson Pro (OFL) instead of Georgia; preload and canvas text aligned.']
  ], fix: [] },
  { d: '2026-11-05', title: ['Bestiario en menú', 'Bestiary screen'], new: [
    ['Nueva pantalla Bestiario en el menú (MVP neutral): catálogo, filtros, detalle por etapas y saldo de puntos.',
     'New Bestiary screen in the menu (neutral MVP): catalog, filters, stage-based detail and point balance.'],
    ['Durante la run, avisos breves al descubrir criaturas o subir etapas; al terminar, resumen de avances del bestiario.',
     'During a run, short toasts when you discover creatures or reach stages; end-of-run summary of bestiary progress.'],
    ['Pestaña «Mejoras y desbloqueos» en el Bestiario: compra con puntos, topes de balance y efectos al empezar cada run.',
     'Bestiary tab «Upgrades and unlocks»: spend points, balance caps and perks applied at each run start.'],
    ['Amuletos del bestiario: desbloqueo, equipamiento (1 ranura) y efectos en combate (Herida, Parada, Zancada).',
     'Bestiary charms: unlock, equip (1 slot) and combat procs (Wound, Parry, Stride).'],
    ['Catálogo del bioma MVP completo en el bestiario: descripciones, consejos tácticos y validación del roster.',
     'Full MVP biome bestiary catalog: descriptions, tactical tips and roster validation.'],
    ['Telemetría local del bestiario (solo ?dev): resumen por run, sesión exportable y validador de balance.',
     'Local bestiary telemetry (?dev only): per-run summary, session export and balance validator.']
  ], chg: [
    ['Los amuletos registran daño extra por tipo (normal / élite / jefe) en la telemetría de run.',
     'Charms track bonus damage by enemy tier (normal / elite / boss) in run telemetry.']
  ], fix: [] },
  { d: '2026-11-05', title: ['Bestiario (backend)', 'Bestiary (backend)'], chg: [
    ['Completar una entrada del bestiario otorga puntos una sola vez y actualiza el saldo persistente (sin tienda ni pantalla todavía).',
     'Completing a bestiary entry awards points once and updates your persistent balance (no shop or screen yet).'],
    ['Las muertes válidas en run registran progreso del bestiario en el guardado local.',
     'Valid run kills update bestiary progress in the local save.']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Rage of the Skies', 'Rage of the Skies'], chg: [
    ['Rage of the Skies: radio de impacto 50 px.', 'Rage of the Skies: strike radius 50 px.']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Ultimates MS', 'MS ultimates'], chg: [
    ["Hell's Core y Rage of the Skies: daño base a la mitad (140 / 110).",
     "Hell's Core and Rage of the Skies: half base damage (140 / 110)."]
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Inicio MS', 'MS start'], chg: [
    ['Vuelve Flame Strike (exori flam) al inicio; Hell\'s Core y Rage of the Skies solo en cartas (nv. run 10).',
     'Flame Strike (exori flam) is the starter again; ultimates only from level-up cards (run level 10).']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Ultimates MS — radio', 'MS ultimates — radius'], chg: [
    ["Hell's Core: radio 200 px; Rage of the Skies: 80 px por rayo.",
     "Hell's Core: 200 px radius; Rage of the Skies: 80 px per strike."]
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Ultimates MS', 'MS ultimates'], chg: [
    ["Hell's Core y Rage of the Skies: radio 500 px, cooldown a la mitad y daño ×10 (base).",
     "Hell's Core and Rage of the Skies: 500 px radius, half cooldown and ×10 base damage."]
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Centinelas de élite', 'Elite sentinels'], chg: [
    ['Centinelas: primer spawn aleatorio entre 1:45 y 2:15; luego uno cada ~2:30 (con variación). No se apilan si sigue vivo el anterior.',
     'Elite sentinels: first spawn random between 1:45–2:15; then about every 2:30 (with jitter). Skips spawn while one is still alive.']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Vínculo del centinela', 'Elite sentinel bond'], fix: [
    ['Al matar al centinela de élite se otorgaba mal el vínculo (G.Game.player); ahora abre la elección al instante si puedes unir dos hechizos.',
     'Elite sentinel bond grant was broken (G.Game.player); bond picker opens right away when two spells can be fused.']
  ], new: [], chg: [] },
  { d: '2026-11-03', title: ['Vocero de veta (abanico)', 'Seam Speaker (fan attack)'], fix: [
    ['Vocero de veta: cono más estrecho, proyectiles más lentos, menos daño y más tiempo entre disparos.',
     'Seam Speaker: narrower cone, slower shots, less damage and longer cooldown.']
  ], new: [], chg: [] },
  { d: '2026-11-03', title: ['Centinela de élite', 'Elite sentinel'], chg: [
    ['El centinela de élite aparece a 1:45; al derrotarlo ganas un vínculo para unir dos hechizos.',
     'Elite sentinel spawns at 1:45; defeating it grants a bond to fuse two spells.']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Nivel de run', 'Run level'], chg: [
    ['Cada nivel de XP: +5 de vida máxima (curada) y más velocidad de movimiento (crece en log, fuerte al principio).',
     'Each XP level: +5 max HP (healed) and more move speed (log growth, strong early, softer late).']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Energy Strike', 'Energy Strike'], chg: [
    ['Energy Strike (exori vis): cadena desde nv. 1 (2 saltos); nv. 3 +1 salto (3); nv. 5 +2 saltos (5) y Electrified; sin perforación.',
     'Energy Strike (exori vis): chain from Lv.1 (2 hops); Lv.3 +1 hop (3); Lv.5 +2 hops (5) and Electrified; pierce removed.']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Flame / Death Strike', 'Flame / Death Strike'], chg: [
    ['Flame Strike (exori flam): Burning y onda de fuego desde nv. 1; el radio crece al subir nivel.',
     'Flame Strike (exori flam): Burning and fire splash from level 1; radius grows on upgrades.'],
    ['Death Strike (exori mort): solo daño al blanco (sin área).',
     'Death Strike (exori mort): single-target only (no splash).']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Death Strike y oleadas', 'Death Strike and spawns'], chg: [
    ['Death Strike (exori mort): apunta al más cercano y más daño.',
     'Death Strike (exori mort): targets nearest with higher damage.'],
    ['Spawn neutral: curva más suave hacia el minuto 3 (menos pico de criaturas).',
     'Neutral spawn: smoother curve around minute 3 (fewer creature spike).']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Primer minuto', 'First minute'], chg: [
    ['Más apariciones en el primer minuto (warmup 60 s, spawn inicial acumulado).',
     'More spawns in the first minute (60s warmup, opening spawn accumulator).']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Inicio más accesible', 'Easier early game'], chg: [
    ['Run neutral: menos horda al principio, enemigos más blandos y sin el multiplicador de vida legacy (×3,3).',
     'Neutral run: fewer early spawns, softer enemies, no legacy ×3.3 HP multiplier.'],
    ['Master Sorcerer: un poco más de vida, velocidad y daño base.',
     'Master Sorcerer: slightly more HP, speed and base damage.'],
    ['Los primeros 30 s tienen algo más de apariciones (luego sigue la curva suave).',
     'First 30 seconds spawn slightly more enemies, then the softer curve continues.']
  ], new: [], fix: [] },
  { d: '2026-11-03', title: ['Master Sorcerer — Vertical slice (MS-9)', 'Master Sorcerer — Vertical slice (MS-9)'], new: [
    ['Validación MS-9: smoke `tools/ms9-smoke.js`, guía de builds y `G.Game.debugMsBuild` en ?dev.',
     'MS-9 validation: ms9-smoke script, build guide and G.Game.debugMsBuild on ?dev.']
  ], chg: [
    ['Al terminar la run se limpian proyectiles y VFX (segunda partida sin restos).',
     'Run end clears projectiles and VFX (clean second run).']
  ], fix: [] },
  { d: '2026-11-02', title: ['Master Sorcerer — UI y balance (MS-8)', 'Master Sorcerer — UI and balance (MS-8)'], new: [
    ['Cartas de nivel MS: elemento, incantation y comparativa numérica actual → siguiente.',
     'MS level-up cards: element, incantation and numeric current → next comparison.'],
    ['Telemetría por hechizo al acabar la run (daño, lanzamientos, bajas, jefe/élite).',
     'Per-spell telemetry at run end (damage, casts, kills, boss/elite).']
  ], chg: [
    ['Run neutral: tope 15 min, jefe ~10 min, élite ~6 min; curva de XP ligeramente ajustada.',
     'Neutral run: 15 min cap, boss ~10 min, elite ~6 min; slightly tuned XP curve.']
  ], fix: [] },
  { d: '2026-11-02', title: ['Master Sorcerer — Pasivas (MS-7)', 'Master Sorcerer — Passives (MS-7)'], new: [
    ['Nueve pasivas MS con efecto real: daño elemental, velocidad, curación, escudo mágico y penetración.',
     'Nine MS passives with real effects: elemental damage, speed, healing, magic shield and penetration.']
  ], chg: [
    ['Level-up: pasivas al máximo fuera del pool; evita tres cartas defensivas con un solo hechizo ofensivo.',
     'Level-up: max passives leave the pool; avoids three defensive cards with only one offensive spell.']
  ], fix: [] },
  { d: '2026-11-02', title: ['Master Sorcerer — Ultimates (MS-6)', 'Master Sorcerer — Ultimates (MS-6)'], new: [
    ["Hell's Core y Rage of the Skies (5 niveles): explosión radial, tormenta eléctrica y requisitos de carta.",
     "Hell's Core and Rage of the Skies (5 levels): radial blast, lightning storm and card requirements."]
  ], chg: [
    ['Campos de combate (tormenta, eco de fuego) se limpian al pausar, morir o terminar la partida.',
     'Combat fields (storm, fire echo) clear on pause, death or run end.']
  ], fix: [] },
  { d: '2026-11-02', title: ['Master Sorcerer — Beams (MS-5)', 'Master Sorcerer — Beams (MS-5)'], new: [
    ['Great Fire Wave, Energy Beam y Great Energy Beam (5 niveles): reverse wave, pulso doble y cuatro cardinales.',
     'Great Fire Wave, Energy Beam and Great Energy Beam (5 levels): reverse wave, double pulse and four cardinals.']
  ], chg: [], fix: [] },
  { d: '2026-11-02', title: ['Master Sorcerer — Waves (MS-4)', 'Master Sorcerer — Waves (MS-4)'], new: [
    ['Fire Wave y Energy Wave jugables (5 niveles): cono alineado, zona de fuego y triple onda de energía.',
     'Fire Wave and Energy Wave playable (5 levels): aligned cone, fire ground and triple energy wave.']
  ], chg: [], fix: [] },
  { d: '2026-11-02', title: ['Master Sorcerer — Strikes (MS-3)', 'Master Sorcerer — Strikes (MS-3)'], new: [
    ['Energy Strike y Death Strike completos (5 niveles): cadena, Curse, Electrified y ejecución acotada.',
     'Energy Strike and Death Strike complete (5 levels): chain, Curse, Electrified and capped execute.']
  ], chg: [
    ['Death Strike apunta al enemigo con más vida en rango; Flame/Energy al más cercano.',
     'Death Strike targets highest HP in range; Flame/Energy use nearest.']
  ], fix: [] },
  { d: '2026-11-02', title: ['Master Sorcerer — Flame Strike (MS-2)', 'Master Sorcerer — Flame Strike (MS-2)'], new: [
    ['Partida neutral: stats de vocación, Flame Strike inicial y pool de hechizos/pasivas MS.',
     'Neutral runs: vocation base stats, Flame Strike starter and MS spell/passive card pool.'],
    ['Flame Strike niveles 1–5: multiobjetivo, Burning y explosión al matar enemigos ardiendo.',
     'Flame Strike levels 1–5: multi-target, Burning and burn-kill explosion.']
  ], chg: [
    ['HUD muestra vocación, elemento e incantation del hechizo activo.',
     'HUD shows vocation, element and active spell incantation.']
  ], fix: [] },
  { d: '2026-11-02', title: ['Nombre del avatar', 'Avatar name'], chg: [
    ['La criatura del jugador (99001) se muestra como Master Sorcerer, igual que la vocación.',
     'The player creature (99001) is shown as Master Sorcerer, matching the vocation name.']
  ], new: [], fix: [] },
  { d: '2026-11-01', title: ['Fase 6 — vertical slice MVP', 'Phase 6 — MVP vertical slice'], new: [
    ['Victoria al derrotar al Custodio del umbral; el reloj de 12 min es límite, no premio por supervivencia.',
     'Win by defeating the Vault Warden; the 12-minute clock is a limit, not a survival win.'],
    ['Centinela de élite telegrafado a mitad de run, con brillo y etiqueta visible.',
     'Mid-run elite sentinel with visible glow and ÉLITE tag.'],
    ['Curva temporal ajustada: jefe a los 9 min, tiers desbloqueados por tramos.',
     'Tuned timeline: boss at 9 min, enemy tiers unlock in stages.']
  ], chg: [
    ['Agotar el tiempo sin vencer al jefe cuenta como derrota.',
     'Running out of time without beating the boss counts as defeat.'],
    ['Carta de curación renombrada a Frasco vital (sin referencias legacy en level-up).',
     'Heal level-up card renamed to Vital Flask (no legacy berry name).']
  ], fix: [] },
  { d: '2026-11-01', title: ['Fase 5 — pulido post-MVP', 'Phase 5 — post-MVP polish'], new: [
    ['Identidad TibiaSurvivor: textos, legal, PWA y documentación alineados con contenido original.',
     'TibiaSurvivor identity: UI copy, legal notice, PWA and docs aligned with original content.'],
    ['Misiones y logros reescritos con objetivos medibles del MVP (expediciones, criaturas, jefes, monedas).',
     'Missions and achievements rewritten around measurable MVP goals (runs, creatures, bosses, coins).'],
    ['Pipeline de arte documentado: placeholders geométricos con fallback seguro (docs/ART_PIPELINE.md).',
     'Documented art pipeline: geometric placeholders with safe fallback (docs/ART_PIPELINE.md).']
  ], chg: [
    ['El menú neutral muestra Misiones y Logros; gacha y colección legacy quedan ocultos.',
     'Neutral menu shows Missions and Achievements; legacy gacha and collection stay hidden.'],
    ['Service worker actualizado (ts-code-v2): ya no cachea rutas de sprites de terceros.',
     'Updated service worker (ts-code-v2): no longer caches third-party sprite paths.']
  ], fix: [
    ['Misiones antiguas con ids heredados se renuevan solas si ya no existen en las plantillas.',
     'Old mission ids from previous saves refresh automatically when templates no longer define them.']
  ] },
  { d: '2026-10-31', title: ['Vertical slice MVP jugable', 'Playable MVP vertical slice'], new: [
    ['Partida completa en la Cueva Cristal: menú → cacería de 15 min → victoria o derrota → resumen → guardado local (ts.*).',
     'Full run in Crystal Cave: menu → 15-minute hunt → win or loss → summary → local save (ts.*).'],
    ['15 enemigos originales, 10 habilidades mejorables y jefe élite Custodio del umbral.',
     '15 original enemies, 10 upgradeable abilities and elite boss Vault Warden.'],
    ['Perfil local sin login obligatorio: Jugar, Ajustes y estadísticas persistentes.',
     'Local profile without mandatory login: Play, Settings and persistent stats.']
  ], chg: [
    ['HUD con tiempo restante de cacería y bioma fijo Cueva Cristal en el camino neutral.',
     'HUD shows remaining hunt time and fixed Crystal Cave biome on the neutral path.'],
    ['Juicio final, grietas y rotación de biomas desactivados en el MVP neutral.',
     'Final judgment, rifts and biome rotation disabled in the neutral MVP.']
  ], fix: [
    ['Cartas de nivel usan el pool de habilidades originales; la simulación se pausa al elegir.',
     'Level-up cards use the original ability pool; simulation pauses while you choose.']
  ] },
  { d: '2026-10-31', title: ['Guardado TibiaSurvivor', 'TibiaSurvivor save data'], chg: [
    ['Partidas nuevas bajo el prefijo ts.*. Saves ps.* no se importan; ajustes locales pueden copiarse una vez.',
     'New progress under ts.* prefix. ps.* saves are not imported; local settings may copy once.']
  ], fix: [
    ['Save corrupto o incompatible: partida nueva y copia de respaldo en localStorage.',
     'Corrupt or incompatible save: fresh profile and backup copy in localStorage.']
  ] }
];
