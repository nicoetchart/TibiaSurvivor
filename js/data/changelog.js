/* ============ changelog.js — novedades TibiaSurvivor ============
 *   new  · chg  · fix  — cada línea [es, en]
 */
G.CHANGELOG = [
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
