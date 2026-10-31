# TibiaSurvivor — esquema de guardado (`ts.*`)

**Fase:** 2 (2026-10-31)  
**Producto:** `tibiasurvivor`  
**Prefijo localStorage:** `ts.*` (los saves `ps.*` históricos no se cargan ni se borren)

## Claves localStorage

| Clave | Ámbito | Contenido |
|-------|--------|-----------|
| `ts.accounts` | cuenta | Mapa de cuentas locales `{ key: { name, salt, hash, created } }` |
| `ts.session` | cuenta | Última clave de cuenta activa |
| `ts.save.<key>` | cuenta | Partida JSON (ver abajo) |
| `ts.save.<key>.bak.<ts>` | recuperación | Copia cruda de un save inválido/corrupto |
| `ts.lang` | dispositivo | `es` \| `en` |
| `ts.settings` | dispositivo | Calidad, FPS, joystick, etc. |
| `ts.audio` | dispositivo | Volúmenes y mute |
| `ts.news.seen` | dispositivo | Fecha del último changelog visto |

Migración one-shot desde `ps.lang`, `ps.settings`, `ps.audio`, `ps.news.seen` solo si la clave `ts.*` correspondiente no existe.

## Partida (`ts.save.*`)

### Identidad del producto

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `product` | string | sí | Siempre `'tibiasurvivor'` |
| `schemaVersion` | number | sí | `1` en Fase 2 |
| `v` | number | sí | Versión interna del motor de migrate (`3`) |

### Campos genéricos (objetivo futuro)

| Campo | Tratamiento futuro |
|-------|-------------------|
| `name`, `profile`, `coins`, `stats` | Perfil, oro, estadísticas |
| `created`, `updated` | Metadatos |

### Campos temporales (Pokémon — Fase 2–4)

| Campo | Propietario | Eliminar en |
|-------|-------------|-------------|
| `owned`, `shiny`, `partner`, `partnerShiny`, `starter`, `personality` | UI + `game.js` | Fase 4 |
| `pupg`, `pbind`, `pban`, `upgrades`, `pupgDone` | Mejoras por dex | Fase 3–4 |
| `tickets`, `pity` | Gacha | Fase 4–5 |
| `legends`, `arenas`, `itemsFound`, `evoMoves` | Progreso PS | Fase 4+ |
| `ach`, `missions` | Logros/misiones PS | Fase 5 |
| `stats.pulls`, `stats.shinies`, `stats.groupRuns`, `stats.bestGroupTime`, `stats.judged`, `stats.judgeTime`, `stats.judgeBosses` | Legacy/coop/Arceus | Fase 4–5 |

## Validación y recuperación

1. JSON inválido → cuarentena `*.bak.<timestamp>` + partida nueva en memoria + aviso al entrar.
2. `product` distinto de `tibiasurvivor` → cuarentena + partida nueva.
3. `schemaVersion` > soportado → cuarentena + partida nueva.
4. `partner` con id inexistente o no en `owned` → `partner = null` → pantalla de vocación (F3; ver DEC-021).
5. **Fase 3 (DEC-018, DEC-024):** ids **99001–99099** = criaturas neutrales TibiaSurvivor; válidos en `owned`/`partner` si existen en `G.CREATURE_BY_ID` (aunque no estén en `G.DEX_BY` Pokémon). Id **99001** reservado para el avatar por defecto de vocación **Master Sorcerer** (`master_sorcerer`, DEC-020).
6. **DEC-019:** cuentas con `partner` dex Pokémon (1–966…) conservan ese id; el flujo neutral aplica a cuentas nuevas o `partner == null` tras sanitize.

## Forma mínima futura (referencia, no implementada en F2)

```json
{
  "schemaVersion": 2,
  "product": "tibiasurvivor",
  "profile": {},
  "selectedVocation": null,
  "gold": 0,
  "upgrades": {},
  "statistics": {},
  "settings": {}
}
```
