# PSR-6 — Assets y SEO

## Runtime (jugador)
- `dev.html` / `app.min.js` **no cargan** `pokedex.js`, `sprites-meta.js`, `moves.js` ni `types.js`.
- Criaturas MVP: geo + Tibia sprites; `G.Sprites.sheet()` no pide PNG legacy en `G.Content.mode === 'neutral'`.
- `hasShiny()` devuelve `false` en neutral (sin rutas `assets/pokemon/.../s/`).

## Repo (legacy)
- **PSR-7:** `assets/pokemon/` eliminado del repo.
- **PSR-8:** datasets/módulos Pokémon (`pokedex.js`, `moves.js`, …) eliminados; sin `?content=legacy`.

## SEO / dominio
- Canonical, sitemap y Open Graph: `tools/site-config.json` → `siteUrl`.
- Override en CI/local: `TIBIASURVIVOR_SITE_URL=https://…/`.
- `CNAME` → `www.tibiasurvivor.com`; debe coincidir con `siteUrl` (DEC-035).

## Validación
```bash
node tools/validate-psr6.js
node tools/export_data.js && node tools/run_make_seo.js
```