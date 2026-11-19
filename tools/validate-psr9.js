/* PSR-9: runtime/SEO sin rutas Pokémon; bestiario canónico. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr8.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr8 failed');

const dev = fs.readFileSync(path.join(ROOT, 'dev.html'), 'utf8');
if (!dev.includes('runtime-stubs.js')) err('dev.html must load runtime-stubs.js');
if (dev.includes('gacha-stub') || dev.includes('dex-minimal')) err('dev.html must not load gacha-stub or dex-minimal');

for (const ban of ['js/data/gacha-stub.js', 'js/data/dex-minimal.js']) {
  if (fs.existsSync(path.join(ROOT, ban))) err(`remove ${ban} (PSR-9)`);
}

const sprites = fs.readFileSync(path.join(ROOT, 'js/core/sprites.js'), 'utf8');
if (sprites.includes('assets/pokemon/')) err('sprites.js must not reference assets/pokemon/');

const seo = fs.readFileSync(path.join(ROOT, 'tools/make_seo_pages.py'), 'utf8');
if (!seo.includes("'bestiary': 'bestiario/'") || !seo.includes("bestiary_page")) {
  err('make_seo_pages.py must use bestiary/bestiario paths');
}

if (errors.length) {
  console.error('validate-psr9 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr9 OK');