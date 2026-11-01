# TibiaSurvivor — pipeline de arte

## Estado actual (Fase 5)

El juego usa **placeholders geométricos dibujados en canvas** (`js/core/geo-sprites.js`) para
todas las criaturas con id legacy **99001–99099**. No se cargan PNG de terceros en el modo
neutral del MVP.

## Convención de ids

| Rango | Uso |
|-------|-----|
| 99001–99099 | Criaturas y vocaciones (`js/data/creatures.js`, `G.ContentBridge`) |

Cada criatura tiene `legacyId` numérico y `id` estable (`cave_rat`, `vault_warden`, …).

## Animaciones

Nombres alineados con el motor (`G.Sprites.Animator`):

`Idle`, `Walk`, `Attack`, `Shoot`, `Charge`, `Hurt`, `Faint`

Metadatos de fotogramas para geo (`G.GeoSprites.frameMeta`):

- Tamaño lógico: **28×32** px de arte, ancla **(14, 30)** (pies).
- `PX = 2` en mundo (escala compartida con tiles).

## Direcciones

El motor legacy soporta **8 direcciones** en hojas PNG. Los placeholders geo **no usan filas
de dirección**; la silueta rota según el ángulo de movimiento cuando se sustituya por pixel art.

## Siluetas (fallback)

| Forma | Rol / behavior |
|-------|----------------|
| caster | jugador |
| block | tank |
| diamond | ranged |
| wedge | charger |
| needle | runner |
| cross | healer |
| hex | shielder / jefe |
| ring | summoner |
| star | fan / beamer |
| tri | zoner / jumper |
| orb | resto |

Color: primer tipo de daño (`G.DamageTypes.COLOR`).

## Añadir una criatura nueva

1. Entrada en `js/data/creatures.js` con `legacyId` libre en 99001–99099.
2. Si es enemigo de run, añadir plantilla en `js/data/neutral-roster.js`.
3. `G.ContentBridge` expone la criatura en `G.DEX_BY` al cargar.
4. Opcional: sustituir geo por PNG propio (ver abajo).

## Sustituir geo por pixel art original

1. Colocar hojas en `assets/creatures/{legacyId}/{Anim}.png` (convención futura; hoy no se usan).
2. Registrar geometría en un metadato tipo `G.SPRITE_META[dex]` (columnas = frames, filas = 8 dirs).
3. En `js/core/sprites.js`, permitir carga solo si existe meta y licencia documentada.
4. Mantener `G.GeoSprites.isGeo(dex)` como fallback si falta imagen o falla la carga.

## Comportamiento ante errores

- Sin meta / PNG: `Animator.draw` usa geo o círculo gris (`#6b7a94`), nunca entidad invisible.
- `bodyRadius` / `bodyHeight` derivan de meta o defaults seguros (sin NaN).

## Licencias

Solo MIT (código), OFL (Pixelify Sans) u obra propia con licencia explícita en el repo.
