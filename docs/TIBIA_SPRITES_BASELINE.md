# TibiaSurvivor — integración de sprites Tibia (línea base)

**Fecha:** 2026-11-09  
**Estado:** infraestructura + fallback geo (sin `.spr`/`.dat` en el repo).

## Contexto

| Capa | Hoy | Objetivo |
|------|-----|----------|
| Criaturas / jugador | `G.GeoSprites` (99001–99099) | PNG desde atlas Tibia vía `G.TibiaSprites` |
| Mapa | `G.Tiles` procedural (16×16 arte × `PX`) | Tiles Tibia 32×32 en atlas, autotile gradual |
| UI / loot | `G.Icons` (char maps) | Items 32×32 del atlas (`goldcoin`, pociones, …) |
| Proyectiles / VFX | Código en `fx.js` / `vfx.js` | Misiles y efectos del cliente (fase 3) |

El motor de animación sigue siendo `G.Sprites.Animator` (Idle, Walk, Attack, …). Tibia aporta **4 direcciones** y fotogramas distintos; el adaptador convierte filas 0–7 → 0–3 y empaqueta metadatos compatibles con `animMeta`.

**DEC-008** (no assets CipSoft en repo sin licencia clara): los ficheros del cliente **no se versionan**. El pipeline exporta PNG propios o con permiso documentado en `assets/tibia/LICENSE.md`.

## Activación (dev)

```
?dev   (sprites Tibia ya activos por defecto en `data-ui=tibia`; atajos Ctrl para tuning)
```

- `G.TibiaSprites.enabled` → true  
- Si falta atlas: **geo** como hoy (nunca entidad invisible).

## Layout de assets (generado, no editar metas a mano salvo mapa)

```
assets/tibia/
  LICENSE.md              # origen del cliente / versión / permiso
  manifest.json           # versión del export, hash, clientVersion
  items-32.png            # atlas items (32×32 celdas)
  items-meta.js           # G.TIBIA_ITEMS_META — rect por clientId
  effects-32.png          # misiles, impactos, áreas (fase 3)
  effects-meta.js
  tiles-32.png            # suelo, paredes, decoración (fase 2)
  tiles-meta.js
  creatures/
    {lookType}.png        # hoja: columnas = dirs 0–3, filas = grupo de anim
  creatures-meta.js       # G.TIBIA_CREATURES_META — frames por lookType
```

Convención de animaciones exportadas (alineadas al motor):

| Motor | Tibia (típico) | Notas |
|-------|----------------|-------|
| Idle | standing / idle | 1+ frames |
| Walk | walking | 2–3 frames × 4 dirs |
| Attack | attacking | opcional fase 1 |
| Shoot | (hechizo / distance) | misiles aparte en effects |
| Hurt | — | reutilizar Walk o 1 frame |
| Faint | corpse / dead | o alpha out |
| Charge | — | opcional |

Ancla al suelo: **`ax`, `ay`** en meta (pies alineados con `G.Sprites.PX`).

## Mapa lógico → cliente

`js/data/tibia-sprite-map.js` une **legacyId** / **creature.id** / **items** con:

- `lookType` (monstruos)
- `outfit` (jugador: type, head, body, legs, feet, addons)
- `clientId` (items, tiles)

Los `lookType` del MVP deben **validarse** contra tu versión de cliente al exportar (`tools/export_tibia_sprites.mjs --verify`).

## Pipeline de export (local)

1. Cliente oficial en Windows: `%LocalAppData%\Tibia` (launcher) → datos en **`packages\Tibia\assets\`**.
   - No hay `Tibia.dat`/`Tibia.spr` sueltos: `catalog-content.json`, `appearances-*.dat`, `sprites-*.bmp.lzma`.
   - Versión legible en `packages\Tibia\package.json.version` (p. ej. `15.33.d96497`).
2. `node tools/export_tibia_sprites.mjs --probe` (usa `tools/tibia-client.local.json` si existe).
3. Export con [tibia-sprites-exporter](https://github.com/tilaven/tibia-sprites-exporter): `extract` → `split` → `group`.
4. **Ajuste visual:** `js/data/tibia-sprite-tuning.js` (no tocar el meta generado).
   - **Modo Pokémon (`naturalSize: true`, default):** cada lookType escala con su `w×h` en meta + `PX=2`, como `G.SPRITE_META[dex]`; el import mide **`ax/ay`** y **`s`** (sombra 0/1/2) del PNG.
   - **Modo uniforme (`naturalSize: false`):** `visualTiers` + `lookTypeTier` fuerzan alturas de juego iguales entre tiles 32 y 64.
   - `?dev`: Ctrl+[ ] escala, Ctrl+; ' pies, Ctrl+\\ exporta JSON (`?sprites=geo` = formas geométricas).
5. Import al juego:
   ```bash
   npm install --prefix tools
   node tools/import_tibia_grouped.mjs --grouped C:/Proyectos/TSEXP/output/grouped
   ```
   (usa `appearances.dat` vía `tools/tibia-client.local.json`.)  
   - Lee `Tibia.dat` + `Tibia.spr` (o PNG sueltos si ya los tienes).
   - Genera atlas + `*-meta.js` + entradas faltantes en el mapa.
3. Revisa diff, rellena `assets/tibia/LICENSE.md`.
4. Probar en juego (sin query extra); opcional `?sprites=geo` para comparar con el fallback.

Herramientas alternativas: [Object Builder](https://github.com/ottools/ObjectBuilder), parsers OT community — el script del repo es un **contenedor**; implementa el backend que elijas.

## Fases de integración

### Fase 1 — Criaturas MVP (esta línea base)

- [x] `G.TibiaSprites`, mapa, hook en `G.Sprites.Animator`
- [x] Export 15 enemigos + outfit jugador (138 → `out_138`, assets/tibia/outfits/)
- [ ] Colores/addons del export = los de `tibia-sprite-map` (99001); re-exportar grouped si cambian
- [ ] Ajustar `ax/ay` y `hv` (vuelo) por lookType

### Fase 2 — Mapa (en curso)

- [x] `G.TibiaTiles` + hook en `tiles.js` (`paintFloor` / `paintWall`) con fallback procedural.
- [x] `assets/tibia/tiles/{clientId}.png` + `tibia-tiles-meta.js` vía `tools/import_tibia_tiles.mjs`.
- [x] Escala: PNG 32×32 → tile de arte 16×16 (`G.Tiles.T`) en el chunk.
- [ ] Autotile Tibia real (esquinas/bordes) en vez de un solo sprite por celda.
- [ ] Atlas `tiles-32.png` opcional (hoy: un PNG por clientId).
- Query: `?tiles=proc` fuerza procedural · `?tiles=tibia` fuerza modo Tibia.

### Fase 3 — Items, monedas, efectos

- Pickups: `pickup.js` → `G.TibiaSprites.drawItem('gold_coin', …)` con fallback `G.Icons`.
- Proyectiles: mapear `ability.id` → sprite en `effects-meta.js`.
- UI: iconos de inventario / bestiario desde items atlas.

### Fase 4 — Build / PWA

- `sw.js`: cachear `assets/tibia/*` con presupuesto de MB.
- `build.js`: no incluir megabytes en `app.min.js`; assets estáticos aparte.
- Modo neutral sin Pokémon: no precachear `assets/pokemon/`.

## Rendimiento

- Atlas por categoría (items, tiles, effects), no un `.spr` entero en RAM.
- Misma política que `sprites.js`: LRU ~200 hojas, retry on error.
- Precarga en run: `G.TibiaSprites.preload([lookTypes…])` desde spawner / menú.

## Archivos de código

| Archivo | Rol |
|---------|-----|
| `js/core/tibia-sprites.js` | Carga, dibujo, `hasCreature`, `frameMeta` |
| `js/core/tibia-tiles.js` | Suelo/pared del mapa desde PNG Tibia |
| `js/data/tibia-tiles-meta.js` | Tamaños por clientId (generado) |
| `js/data/tibia-outfits.js` | Catálogo aspecto (MVP Mage 132), `save.playerOutfit` |
| `js/core/tibia-outfit-draw.js` | Composición plantilla + máscara de color |
| `js/ui/outfit-ui.js` | Pantalla **Aspecto** en el menú (UI estilo cliente Tibia) |

### Ventana de outfit (paridad con el cliente)

- **Partes**: cabeza, cuerpo principal, piernas secundarias, pies (detalle) — cada una con color 0–132.
- **Paleta**: rejilla 7×19 (`j*19+i`); RGB con `Outfit::getColor` (HSI) como en otclient.
- **Tinte**: `plantilla × color` (multiply) en píxeles de máscara, no sustituir por color plano.
- **Addons**: bitmask 1 + 2 (+ 4): se apilan filas `pattern_height` 0 (base), 1, 2… encima, no se sustituye el cuerpo.
- **Render**: strips con `layers=2` (plantilla + máscara amarilla/roja/verde/azul) compuestos en `TibiaOutfitDraw`.
- **Aspecto**: rejilla estilo cliente; `save.unlockedOutfits` (por defecto 128+132); catálogo con `unlock: mission | shop | free`. API `G.TibiaOutfits.grant(type)` para misiones.
| `js/data/tibia-sprite-map.js` | legacyId ↔ lookType / outfit / items |
| `js/data/tibia-items-meta.js` | Rects atlas items (generado) |
| `tools/export_tibia_sprites.mjs` | Export offline |
| `js/core/sprites.js` | Delega a Tibia si `enabled` + meta listo |

## Checklist legal / publicación

- [ ] Origen del cliente documentado
- [ ] Sin redistribuir `.spr`/`.dat` de CipSoft en GitHub
- [ ] Textos de marca: nombres de criaturas ya en inglés (contenido); arte según política del dueño
- [ ] Actualizar DEC-008 si se aprueba arte derivado del cliente en producción
