/* PSR-8: sin datasets/módulos Pokémon en el árbol (runtime ya neutral). */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const gone = [
  'js/data/pokedex.js',
  'js/data/moves.js',
  'js/data/types.js',
  'js/data/enemies.js',
  'js/data/starters.js',
  'js/data/sprites-meta.js',
  'js/data/content-bridge.js',
  'js/systems/gacha.js',
  'js/systems/judgment.js',
  'js/ui/gacha-ui.js',
  'js/ui/test.js',
  'js/ui/slots.js',
  'tools/fetch_pokedex.py',
  'tools/fetch_sprites.py'
];
for (const rel of gone) {
  if (fs.existsSync(path.join(ROOT, rel))) err(`legacy file still present: ${rel}`);
}

const api = fs.readFileSync(path.join(ROOT, 'js/data/content-api.js'), 'utf8');
if (api.includes('content=legacy') || api.includes('G.Enemies') || api.includes('G.Types')) {
  err('content-api.js must not reference legacy content=legacy, G.Enemies or G.Types');
}

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr7.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr7 failed:\n' + (r.stdout || '') + (r.stderr || ''));

if (errors.length) {
  console.error('validate-psr8 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr8 OK');