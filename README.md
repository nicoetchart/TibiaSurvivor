# TibiaSurvivor

Un survivor de fantasía pixel art donde cada partida reproduce la tensión y progresión de una hunting session de un MMORPG clásico.

## Estado actual

**MVP jugable (Fase 4)** con **pulido post-MVP (Fase 5)**:

- Expedición de **15 minutos** en la Cueva Cristal.
- **15 criaturas** originales + jefe élite Custodio del umbral.
- **10 habilidades** mejorables al subir de nivel.
- Vocación **Hechicero supremo** (cuentas nuevas).
- Guardado local `ts.*` (sin Firebase ni backend).
- Misiones diarias/semanales y logros originales.
- Placeholders geométricos (`js/core/geo-sprites.js`); ver [docs/ART_PIPELINE.md](docs/ART_PIPELINE.md).

Funciones **legacy** (gacha, colección Pokémon, cooperativo online, ranking) permanecen en el código pero **no se cargan datos ni assets de terceros** en el flujo neutral del MVP.

## Cómo jugar

### file://

Abre `dev.html` (desarrollo) o `index.html` (build) con doble clic. Funciona sin servidor.

### Servidor estático local

```bash
npx --yes serve .
# o: python -m http.server 8080
```

Abre `http://localhost:8080/dev.html` (o `index.html`).

### Controles

| Entrada | Acción |
|--------|--------|
| WASD / flechas | Moverse |
| 1–4 | Habilidad activa |
| Q / E | Cambiar habilidad |
| Esc / P | Pausa |

En móvil (horizontal): arrastra para moverte; toca un ataque para cambiarlo.

## Build de distribución

Edita **`dev.html`**, no `index.html`. Luego:

```bash
node tools/build.js
node tools/export_data.js
python tools/make_seo_pages.py
```

`build.js` genera `index.html`, `js/app.min.js` y `version.json`.

Para un build sin bloques SEO heredados: `node tools/build.js --sin-seo`

## Estructura básica

| Ruta | Rol |
|------|-----|
| `dev.html` | Entrada de desarrollo y fuente del HTML |
| `js/main.js` | Arranque y lista de módulos |
| `js/game.js` | Bucle de partida y `G.Flow` |
| `js/data/creatures.js` | Criaturas originales |
| `js/data/mvp-config.js` | Duración, spawn, bioma MVP |
| `js/core/db.js` | localStorage `ts.*` |
| `js/systems/progress.js` | Misiones y logros |
| `sw.js` | PWA (solo en http/https) |

## Añadir contenido

- **Criatura:** `creatures.js` + `neutral-roster.js` + id 99001–99099. Ver ART_PIPELINE.md.
- **Habilidad:** `abilities.js` (alias en `content-bridge.js`).
- **Misió / logro:** `missions.js` / `achievements.js` y eventos en `progress.js`.

## Publicar en GitHub Pages (manual)

1. Genera build: `node tools/build.js --sin-seo`
2. Sube el repo a GitHub.
3. Settings → Pages → Source: rama `main`, carpeta `/ (root)` o `/docs` si mueves el build allí.
4. Usa rutas relativas (ya configuradas). Para subcarpeta `https://user.github.io/TibiaSurvivor/`, `start_url` en `manifest.webmanifest` sigue siendo `./`.

No se requieren secretos ni APIs externas para jugar.

## Limitaciones

- Sin multijugador online en el MVP neutral.
- Sin grietas ni “juicio final” en MVP (`mvp-config.js`).
- Carpeta `assets/pokemon/` puede existir en el repo pero **no se usa** en partidas neutral.
- Páginas SEO legacy (`pokedex/`, etc.) no forman parte del producto TibiaSurvivor.

## Licencia

Código MIT — ver [LICENSE](LICENSE). Assets visibles del MVP: placeholders propios + Pixelify Sans (OFL). **No incluyas sprites o datos de otras franquicias** sin licencia clara.

## GDD

Diseño detallado del alcance actual: [GDD.md](GDD.md).
