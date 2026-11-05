/* ============ changelog.js — novedades TibiaSurvivor ============
 *   new  · chg  · fix  — cada línea [es, en]
 */
G.CHANGELOG = [
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
