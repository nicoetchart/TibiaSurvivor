# GDD — TibiaSurvivor

Documento de diseño alineado con el **repositorio actual** (MVP Fase 4 + pulido Fase 5).

## 1. Visión

- **Fantasía:** una expedición corta bajo tierra — preparación, tensión creciente, botín y supervivencia.
- **Referencia de sensación:** hunting session de MMORPG clásico (sin usar marcas, mapas ni criaturas ajenas).
- **Plataforma:** navegador, Canvas 2D, JavaScript ES2020, sin bundler en desarrollo.
- **Estética:** fantasía oscura, pixel art legible, UI tipo RPG (cajas, chips, fuente Pixelify).

## 2. Bucle principal

```
Login / invitado → Vocación (cuenta nueva) → Menú → Expedición (15 min)
  → combate automático + elección de mejoras → victoria o muerte → resumen → menú
```

Persistencia: monedas, estadísticas, misiones, logros (`localStorage`, prefijo `ts.*`).

## 3. Partida (run)

| Parámetro | Valor (MVP) |
|-----------|-------------|
| Duración | 900 s (`G.MvpConfig.RUN_DURATION_SEC`) |
| Bioma | Cueva Cristal (`RUN_BIOME: 1`) |
| Victoria | Sobrevivir hasta el límite con vida |
| Jefe élite | ~780 s, Custodio del umbral |
| Desactivado | Grietas, juicio final, rotación de biomas |

Progresión **in-run:** experiencia → nivel → cartas de habilidad/mejoras pasivas (pool en `abilities.js` / `levelup.js`).

## 4. Combate

- Movimiento WASD; **una habilidad activa** (ataque automático).
- Proyectiles, zonas, embestidas según habilidad (`js/systems/combat.js`).
- Enemigos con behaviors (tank, ranged, healer, etc.) en `neutral-roster.js`.
- Tipos de daño propios (`G.DamageTypes`); multiplicadores ×1 en MVP.

## 5. Personaje

- **Vocación:** Hechicero supremo (`vocations.js`), criatura jugador id legacy **99001**.
- Cuentas nuevas: pantalla `scr-vocation` (no test de personalidad Pokémon).

## 6. Enemigos

15 plantillas + jefe, ids **99002–99099**, stats vía `G.NeutralRoster` y curva `MvpConfig.SPAWN`.

## 7. Economía

- **Monedas:** recompensa de run y misiones/logros.
- Tickets gacha: estructura en save legacy; **no usados** en menú neutral.

## 8. Misiones

- 3 diarias + 2 semanales, semilla por fecha y cuenta (`progress.js`).
- Plantillas en `missions.js` (ids `ts_*`): kills, supervivencia, nivel, jefes, cofres, monedas, victoria.
- Premio manual en UI; progreso vía `G.Progress.event`.

## 9. Logros

- Permanentes, ids `ts_*` en `achievements.js`.
- Categorías: expedición, supervivencia, combate, cacería, metas.
- Toast al desbloquear (`ach-pop`).

## 10. Arte y audio

- **Sprites:** placeholders geométricos (`geo-sprites.js`). Ver `docs/ART_PIPELINE.md`.
- **Audio:** `js/core/audio.js`, datos en `music.js` (originales del proyecto).

## 11. Controles

Teclado + táctil (`touch.js`). Pausa no detiene simulación en MVP salvo pantallas de elección (level-up).

## 12. Alcance NO implementado (propuestas futuras)

- Cooperativo online, ranking global, Firebase.
- Grietas y arenas por tipo (código parcial desactivado en MVP).
- Pixel art PNG por criatura (pipeline preparado, no obligatorio).
- Más vocaciones y biomas rotativos.

## 13. Persistencia

- `product: tibiasurvivor`, `schemaVersion: 1`.
- Saves `ps.*` no se importan.
- Migración suave: campos faltantes rellenados en `db.js` `migrate()`.
