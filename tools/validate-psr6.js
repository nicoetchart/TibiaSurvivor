/* PSR-6: export/SEO Tibia sin pokédex; boot neutral sin rutas assets/pokemon en runtime. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const exportSrc = fs.readFileSync(path.join(__dirname, 'export_data.js'), 'utf8');
for (const ban of ['pokedex.js', 'sprites-meta.js', 'moves.js', 'js/data/types.js']) {
  if (exportSrc.includes(ban)) err(`export_data.js must not load ${ban} (PSR-6)`);
}

const seoSrc = fs.readFileSync(path.join(__dirname, 'make_seo_pages.py'), 'utf8');
if (seoSrc.includes('sprites-meta.js')) err('make_seo_pages.py must not read sprites-meta.js (PSR-6)');
if (!seoSrc.includes('site-config.json')) err('make_seo_pages.py must read tools/site-config.json');

const dev = fs.readFileSync(path.join(ROOT, 'dev.html'), 'utf8');
for (const ban of ['pokedex.js', 'sprites-meta.js', 'moves.js', 'types.js', 'enemies.js']) {
  if (dev.includes(`src="js/data/${ban}"`)) err(`dev.html must not load js/data/${ban}`);
}

const sprites = fs.readFileSync(path.join(ROOT, 'js/core/sprites.js'), 'utf8');
if (!sprites.includes("G.Content.mode === 'neutral'")) err('sprites.js should gate legacy PNG/shiny in neutral mode');

const cfgPath = path.join(__dirname, 'site-config.json');
if (!fs.existsSync(cfgPath)) err('missing tools/site-config.json');
else {
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (!/^https:\/\/.+\/$/.test(cfg.siteUrl || '')) err('site-config.json siteUrl must be https://…/ with trailing slash');
}

const r = spawnSync(process.execPath, [path.join(__dirname, 'export_data.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('export_data.js failed: ' + (r.stderr || r.stdout));
else {
  const gd = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache', 'gamedata.json'), 'utf8'));
  if ((gd.dex || []).length > 0) err(`gamedata.dex should be empty, got ${gd.dex.length}`);
  if ((gd.creatures || []).length < 10) err('gamedata.creatures too small');
  if ((gd.spells || []).length < 5) err('gamedata.spells too small');
  if (gd.matrix && Object.keys(gd.matrix).length > 0) err('gamedata.matrix (legacy Pokémon chart) should be omitted');
}

if (errors.length) {
  console.error('validate-psr6 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr6 OK');