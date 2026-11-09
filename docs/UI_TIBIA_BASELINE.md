# UI Tibia — línea base

## Objetivo

Interfaz DOM inspirada en **cliente RPG ~10+** (paneles sobrios, bisel, paleta piedra/cueva), sin copiar assets de Tibia oficial.

## Decisiones (2026-11-09)

| Tema | Elección |
|------|----------|
| Referencia visual | Cliente moderno (~10+), no literal 7.x |
| Implementación | Solo CSS (sin nine-slice por ahora) |
| Tipografía | **Crimson Pro** OFL (`css/fonts.css`, `--ts-font-family`) en DOM y canvas |
| Legacy Pokémon/PMD | Oculto en modo neutral (menú: sin gacha/colección/mejoras; onboarding = vocación) |
| Fase 1 | Tokens + piloto en `#scr-login` |
| Fase 2 | Skin global DOM + menú/bestiario/vocación + HUD canvas |
| Fase 3 | Tokens HUD ↔ CSS, icono `goldcoin`, títulos serif |
| Fase 4 (actual) | Serif global, `G.TibiaTheme.font()`, pickups moneda, `pages.css` |

## Activación

En `dev.html`:

```html
<html lang="es" data-ui="tibia">
```

Hoja: `css/tibia-ui.css` (después de `css/style.css`).

`css/tibia-ui.css` define `--ts-*` (incl. `--ts-xp0`, `--ts-hud-slot`, …). `js/ui/tibia-theme.js` lee esas variables para el HUD; `js/ui/icons.js` usa `goldcoin` cuando `data-ui="tibia"`.

## Tokens (`html[data-ui="tibia"]`)

| Variable | Uso |
|----------|-----|
| `--ts-panel-top` / `--ts-panel-bot` | Fondo de panel |
| `--ts-panel-inset` | Campos, tabs inactivas |
| `--ts-border`, `--ts-border-light`, `--ts-border-outer` | Marco biselado |
| `--ts-text`, `--ts-muted` | Texto |
| `--ts-accent`, `--ts-btn-gold-*` | CTA / oro hunt |
| `--ts-btn-top` / `--ts-btn-bot` | Botones secundarios |

Paleta: **cueva fría** (grises cálidos, acento oro).

## Componentes piloto (login)

`.box`, `.btn`, `.btn.gold`, `.btn.ghost`, `.field`, `.tabs`/`.tab`, `.logo`, enlaces y `.err`.

## Fuera de alcance (por ahora)

- `css/pages.css` (SEO estático)
- Nine-slice PNG
- Pantallas legacy Pokémon (gacha, dex) si se reactivan en modo legacy
- Avisos de grieta/juicio con paleta morada (contenido desactivado en MVP neutral)

## Fase 5 (propuesta)

1. ~~Fuente OFL~~ Crimson Pro variable empaquetada (`assets/fonts/CrimsonPro-Variable.ttf`).
2. Nine-slice / texturas de panel.
3. Regenerar landings SEO (`make_seo_pages.py`) con marca TibiaSurvivor.
4. ~~`@font-face` Pixelify en `style.css`~~ (eliminado; reserva OFL en `assets/fonts/`).

## Legacy

- `G.Content.mode === 'neutral'`: entradas gacha/colección/mejoras ocultas (`menu.js`); tickets ocultos (`ui.js`).
- Onboarding: `VocationUI`, no test de personalidad (salvo saves Pokémon antiguos).
