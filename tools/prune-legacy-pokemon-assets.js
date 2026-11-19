/* Quita assets/pokemon del índice git (DEC-030, PSR-7). Los PNG legacy no usa el MVP.
 *   node tools/prune-legacy-pokemon-assets.js
 * Requiere git. Tras ejecutar: commit el borrado masivo por separado si lo deseas. */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dir = path.join(ROOT, 'assets', 'pokemon');
const fs = require('fs');
if (!fs.existsSync(dir)) {
  console.log('assets/pokemon ya no existe en disco.');
  process.exit(0);
}
const r = spawnSync('git', ['rm', '-r', '--force', '--', 'assets/pokemon'], { cwd: ROOT, stdio: 'inherit', shell: true });
process.exit(r.status == null ? 1 : r.status);