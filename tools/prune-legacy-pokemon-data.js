/* Elimina del repo datasets y módulos Pokémon fuera del boot (PSR-8).
 *   node tools/prune-legacy-pokemon-data.js
 */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const paths = [
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
const r = spawnSync('git', ['rm', '-f', '--', ...paths], { cwd: ROOT, stdio: 'inherit', shell: true });
process.exit(r.status == null ? 1 : r.status);